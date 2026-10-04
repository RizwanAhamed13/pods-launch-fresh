import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const secret = 'DO-NOT-RECORD-RESPONSE-BODY';
async function runHarness(t, { failure, attempt = 1, stopFailure = false, ambiguousStop = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'pods-live-harness-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const evidencePath = join(dir, 'receipt.json'), requests = [], checkpoints = [];
  let launches = 0;
  const stopped = new Set();
  const server = createServer(async (request, response) => {
    const route = request.method + ' ' + request.url; requests.push(route);
    const json = data => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(data)); };
    const bad = (status, contentType, body) => { response.writeHead(status, { 'Content-Type': contentType }); response.end(body); };
    if (route === 'GET /api/me') {
      response.setHeader('Set-Cookie', 'pods=test-session; HttpOnly');
      return json({ csrf: 'test-csrf', apps: [{ id: 'fixture' }] });
    }
    if (request.url === '/api/connections/github') return json({ connected: request.method === 'POST' });
    if (route === 'POST /api/launches') {
      launches++;
      if (failure === 'create' && launches === attempt) return bad(502, 'text/html', secret);
      return json({ id: 'launch-' + launches, status: failure && failure !== 'create' && launches === attempt ? 'connecting' : 'ready', port: 8080 });
    }
    const match = request.url.match(/^\/api\/launches\/(launch-\d+)(\/stop)?$/);
    if (match) {
      const [, id, stop] = match;
      if (stop && request.method === 'POST') {
        if (stopFailure) return bad(503, 'text/html', secret);
        stopped.add(id);
        if (ambiguousStop) return bad(502, 'text/html', secret);
        return json({ id, status: 'stopping' });
      }
      if (stopped.has(id)) return json({ id, status: 'stopped' });
      checkpoints.push(await readFile(evidencePath, 'utf8').then(JSON.parse).catch(() => null));
      if (failure === 'json') return bad(200, 'application/json; charset=utf-8', '{"truncated":"' + secret);
      if (failure === 'html200') return bad(200, 'text/html; charset=utf-8', secret);
      return bad(503, 'text/html; charset=utf-8', secret);
    }
    response.writeHead(404); response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PODS_')));
  env.PODS_EVIDENCE_FILE = evidencePath;
  if (attempt === 1) env.PODS_SINGLE_LAUNCH = '1';
  const child = spawn(process.execPath, ['scripts/live-codespaces.mjs', 'http://127.0.0.1:' + server.address().port, 'github', 'fixture'], {
    cwd: new URL('..', import.meta.url), env, stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  let output = '';
  child.stdout.on('data', value => { output += value; });
  child.stderr.on('data', value => { output += value; });
  const closed = once(child, 'close');
  child.stdin.end('test-provider-token');
  const [code] = await closed;
  const receipt = await readFile(evidencePath, 'utf8').then(JSON.parse).catch(() => null);
  return { code, receipt, requests, checkpoints, output };
}

for (const [failure, status, contentType, reason] of [
  ['html', 503, 'text/html', 'Expected JSON'],
  ['html200', 200, 'text/html', 'Expected JSON'],
  ['json', 200, 'application/json', 'Invalid JSON'],
]) test('live harness retains launch and safe diagnostics after ' + failure + ' polling response', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { failure });
  assert.equal(run.code, 1);
  assert.equal(run.checkpoints[0]?.results[0]?.id, 'launch-1', 'launch identity must be on disk before status polling');
  const [result] = run.receipt.results;
  assert.equal(result.id, 'launch-1');
  assert.equal(result.status, 'connecting');
  assert.match(result.testError, new RegExp(reason));
  assert.deepEqual(result.testErrorDetails, { method: 'GET', path: '/api/launches/launch-1', status, contentType });
  assert.equal(result.statusAfterStop, 'stopped');
  assert.equal(run.requests.filter(route => route === 'POST /api/launches').length, 1);
  assert.equal(run.requests.filter(route => route === 'POST /api/launches/launch-1/stop').length, 1);
  assert.equal(run.requests.at(-1), 'DELETE /api/connections/github');
  assert.ok(!JSON.stringify(run.receipt).includes(secret));
  assert.ok(!run.output.includes(secret));
});

test('live harness retains both launch failure and unsuccessful cleanup without claiming stopped', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { failure: 'html', stopFailure: true });
  assert.equal(run.code, 1);
  const result = run.receipt.results[0];
  assert.equal(result?.id, 'launch-1');
  assert.equal(result.testErrorDetails.status, 503);
  assert.deepEqual(result.cleanupErrorDetails, { method: 'POST', path: '/api/launches/launch-1/stop', status: 503, contentType: 'text/html' });
  assert.equal(result.statusAfterStop, undefined);
  assert.match(result.cleanupError, /Expected JSON/);
  assert.equal(run.requests.filter(route => route.endsWith('/stop')).length, 1);
});

test('live harness assigns an interrupted repeat launch to its own result', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { failure: 'html', attempt: 2 });
  assert.equal(run.code, 1);
  const [first, second] = run.receipt.results;
  assert.equal(first.id, 'launch-1');
  assert.equal(first.statusAfterStop, 'stopped');
  assert.equal(first.testError, undefined);
  assert.equal(second?.id, 'launch-2');
  assert.equal(second.scenario, 'repeat-launch');
  assert.equal(second.statusAfterStop, 'stopped');
  assert.equal(second.testErrorDetails.path, '/api/launches/launch-2');
  assert.equal(run.checkpoints[0].results[1].id, 'launch-2');
});

test('live harness records an ambiguous launch request separately and never retries it', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { failure: 'create', attempt: 2 });
  assert.equal(run.code, 1);
  const [first, second] = run.receipt.results;
  assert.equal(first.testError, undefined);
  assert.equal(first.statusAfterStop, 'stopped');
  assert.equal(second?.scenario, 'repeat-launch');
  assert.equal(second.id, undefined);
  assert.equal(second.testErrorDetails.status, 502);
  assert.equal(second.testErrorDetails.path, '/api/launches');
  assert.equal(run.requests.filter(route => route === 'POST /api/launches').length, 2);
  assert.deepEqual(run.requests.filter(route => route.endsWith('/stop')), ['POST /api/launches/launch-1/stop']);
});

test('live harness reconciles an ambiguous stop response without repeating the mutation', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { ambiguousStop: true });
  assert.equal(run.code, 1);
  const [result] = run.receipt.results;
  assert.equal(result.testErrorDetails?.status, 502);
  assert.equal(result.statusAfterStop, 'stopped');
  assert.equal(result.cleanupError, undefined);
  assert.equal(run.requests.filter(route => route.endsWith('/stop')).length, 1);
});

test('live harness preserves the two-launch success receipt', { timeout: 15000 }, async t => {
  const run = await runHarness(t, { attempt: 2 });
  assert.equal(run.code, 0, run.output);
  assert.deepEqual(run.receipt.results.map(r => [r.id, r.status, r.statusAfterStop]), [
    ['launch-1', 'ready', 'stopped'], ['launch-2', 'ready', 'stopped'],
  ]);
  assert.ok(run.receipt.results.every(r => !r.testError && !r.cleanupError));
});
