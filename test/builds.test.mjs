import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { once } from 'node:events';
import { BuildManager, validateBuildOutput } from '../src/builds.mjs';
import { LxdBuilder, lxdRead } from '../src/lxd-builder.mjs';
import { parseRepository } from '../src/repository.mjs';
import { Store } from '../src/store.mjs';
import { createApp } from '../src/server.mjs';
import { digest, sleep } from '../src/util.mjs';

const temp = () => mkdtemp(join(tmpdir(), 'pods-build-'));
const repository = parseRepository('https://github.com/example/product');
function output(repo = repository) {
  const bytes = gzipSync(JSON.stringify({ format: 1, entry: 'app.cjs', healthPath: '/', files: [{ path: 'app.cjs', data: Buffer.from('console.log("prepared")').toString('base64') }] }));
  return { bytes, manifest: {
    id: `repo-${repo.key}`, name: 'Product', description: 'Prepared product', sha256: digest(bytes), bytes: bytes.length,
    applicationType: 'node', source: { url: repo.url, folder: repo.folder, revision: 'a'.repeat(40) },
    verification: { documentPath: '/', status: 200, contentType: 'text/html; charset=utf-8', title: 'Product' },
  } };
}
async function waitFor(predicate) {
  for (let i = 0; i < 200; i++) { if (predicate()) return; await sleep(10); }
  throw new Error('Test timed out waiting for the build state.');
}
const idleAdapter = { initialize: async () => {}, close: async () => {} };

test('container output must match repository, integrity and HTML verification; published metadata is reconstructed', () => {
  const result = output();
  const manifest = validateBuildOutput(repository, { ...result.manifest, previewUrl: 'https://evil.example', owner: 'other', secret: 'x' }, result.bytes);
  assert.equal(manifest.previewUrl, undefined);
  assert.equal(manifest.owner, undefined);
  assert.equal(manifest.secret, undefined);
  assert.equal(manifest.source.url, repository.url);
  assert.match(manifest.id, /^repo-[a-f0-9]{24}-a{12}-[a-f0-9]{12}$/);
  for (const mod of [
    { sha256: '0'.repeat(64) }, { id: '../another' }, { bytes: 1 },
    { source: { ...result.manifest.source, url: 'https://evil.example' } },
    { source: { ...result.manifest.source, revision: 'main' } },
    { verification: { ...result.manifest.verification, contentType: 'application/json' } },
    { verification: { ...result.manifest.verification, status: 500 } },
  ]) assert.throws(() => validateBuildOutput(repository, { ...result.manifest, ...mod }, result.bytes));
});

test('build queue serializes work, deduplicates retries, hides ownership and publishes immutable launch versions', async () => {
  const root = await temp(), store = new Store(root, 'ab'.repeat(32));
  let release, count = 0, concurrent = 0, maximum = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const manager = new BuildManager({ store, data: root, origin: 'https://pods.example', adapter: {
    ...idleAdapter, build: async (repo, update) => {
      count++; concurrent++; maximum = Math.max(maximum, concurrent); update('compiling');
      if (count === 1) await gate;
      concurrent--; return output(repo);
    },
  } });
  try {
    await manager.initialize();
    const first = manager.submit('browser-a', 'github:one', { url: repository.url });
    assert.equal(first.owner, undefined); assert.equal(first.account, undefined);
    assert.equal(manager.submit('browser-a', 'github:one', { url: repository.url }).id, first.id);
    assert.throws(() => manager.own('browser-b', first.id), e => e.status === 404);
    assert.throws(() => manager.submit('new-browser', 'github:one', { url: repository.url }), e => e.status === 409);
    const second = manager.submit('browser-b', 'github:two', { url: 'https://github.com/example/second' });
    await waitFor(() => count === 1);
    assert.equal(manager.own('browser-b', second.id).status, 'queued');
    release(); await waitFor(() => !manager.running && !manager.pending.length);
    assert.equal(maximum, 1);
    const published = manager.own('browser-a', first.id);
    assert.equal(published.status, 'ready');
    assert.equal(published.launchUrl, 'https://pods.example/launch/' + published.app.id);
    assert.deepEqual(JSON.parse(await readFile(join(root, 'artifacts', published.app.id + '.json'))), published.app);
    assert.equal(digest(await readFile(join(root, 'artifacts', published.app.sha256 + '.gz'))), published.app.sha256);
    assert.equal((await readdir(join(root, 'artifacts'))).filter(n => n.endsWith('.gz')).length, 1);
    const repeat = manager.submit('browser-a', 'github:one', { url: repository.url });
    await waitFor(() => manager.own('browser-a', repeat.id).status === 'ready');
    assert.deepEqual(manager.own('browser-a', repeat.id).app, published.app);
  } finally { release(); await manager.close(); store.close(); await rm(root, { recursive: true, force: true }); }
});

test('account limits survive new browser sessions; queue limits reject overload and restart marks unfinished jobs failed', async () => {
  const root = await temp(), store = new Store(root, 'ab'.repeat(32));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const manager = new BuildManager({ store, data: root, origin: 'https://pods.example', maxPending: 2, accountLimit: 1,
    adapter: { ...idleAdapter, build: async repo => { await pending; return output(repo); } } });
  try {
    store.put('build', 'interrupted', { id: 'interrupted', owner: 'old', status: 'installing', createdAt: 1 });
    await manager.initialize();
    assert.equal(store.get('build', 'interrupted').status, 'failed');
    manager.submit('a', 'github:one', { url: repository.url });
    manager.submit('b', 'github:two', { url: repository.url });
    assert.throws(() => manager.submit('c', 'github:three', { url: repository.url }), e => e.status === 429);
    release(); await waitFor(() => !manager.running && !manager.pending.length);
    assert.throws(() => manager.submit('new', 'github:one', { url: repository.url }), e => e.status === 429);
  } finally { release(); await manager.close(); store.close(); await rm(root, { recursive: true, force: true }); }
});

test('invalid artifacts do not publish; cleanup failure disables further jobs', async () => {
  const root = await temp(), store = new Store(root, 'ab'.repeat(32));
  let count = 0;
  const manager = new BuildManager({ store, data: root, origin: 'https://pods.example', adapter: {
    ...idleAdapter, build: async () => { if (++count === 1) return { ...output(), bytes: Buffer.from('bad') }; throw Object.assign(new Error('Cleanup failed'), { cleanupFailed: true }); },
  } });
  try {
    await manager.initialize();
    const first = manager.submit('a', 'github:one', { url: repository.url });
    await waitFor(() => !manager.running);
    assert.equal(manager.own('a', first.id).status, 'failed');
    assert.deepEqual(await readdir(join(root, 'artifacts')), []);
    const second = manager.submit('b', 'github:two', { url: repository.url });
    await waitFor(() => !manager.running);
    assert.equal(manager.own('b', second.id).status, 'failed');
    assert.throws(() => manager.submit('c', 'github:three', { url: repository.url }), e => e.status === 503);
  } finally { await manager.close(); store.close(); await rm(root, { recursive: true, force: true }); }
});

test('LXD file import rejects symlinks, declared oversized files and streaming overflow', async () => {
  const root = await temp(), socket = join(root, 'api.sock');
  const server = createServer((req, res) => {
    res.setHeader('X-LXD-type', req.url === '/symlink' ? 'symlink' : 'file');
    if (req.url === '/oversized') res.setHeader('Content-Length', '99999');
    if (req.url === '/stream') { res.write('12345'); res.end('67890'); } else res.end('test');
  });
  server.listen(socket); await once(server, 'listening');
  try {
    assert.equal((await lxdRead(socket, '/regular', 8, true)).toString(), 'test');
    for (const path of ['/symlink', '/oversized', '/stream']) await assert.rejects(lxdRead(socket, path, 8, true));
  } finally { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); }
});

test('worker failure always deletes its own container; cleanup errors fail closed', async () => {
  for (const cleanupFails of [false, true]) {
    const builder = new LxdBuilder();
    let instance, deleted = false;
    builder.cli = async args => {
      if (args[0] === 'copy') instance = args[2];
      if (args[0] === 'exec') throw new Error('Build timed out');
      if (args[0] === 'list') return JSON.stringify([{ name: instance }]);
      if (args[0] === 'delete') { assert.equal(args[1], instance); deleted = true; if (cleanupFails) throw new Error('LXD unavailable'); }
      return '';
    };
    await assert.rejects(builder.build(repository, () => {}), error => cleanupFails ? error.cleanupFailed : /timed out/.test(error.message));
    assert.equal(deleted, true);
    await assert.rejects(builder.remove('unrelated'), /unrelated/);
  }
});

test('submission API requires account authorization and CSRF, protects jobs, and launches the selected immutable version', async () => {
  const root = await temp();
  let delivered;
  const provider = { validate: async () => ({ name: 'developer' }), launch: async (token, config) => { delivered = config; return {}; } };
  const { server, closeResources } = await createApp({ data: root, secret: 'ab'.repeat(32),
    providers: { github: provider, google: provider },
    buildAdapter: { ...idleAdapter, build: async repo => output(repo) } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const initial = await fetch(origin + '/api/me'), me = await initial.json(), cookie = initial.headers.get('set-cookie').split(';')[0];
  const req = (path, value, headers = {}) => fetch(origin + path, { method: value === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'X-Pods-CSRF': me.csrf, 'Content-Type': 'application/json', ...headers }, body: value === undefined ? undefined : JSON.stringify(value) });
  try {
    assert.equal(me.buildsEnabled, true);
    assert.equal((await req('/api/builds', { url: repository.url })).status, 401);
    await req('/api/connections/github', { token: 'x'.repeat(30) });
    assert.equal((await req('/api/builds', { url: repository.url }, { 'X-Pods-CSRF': 'bad' })).status, 403);
    assert.equal((await req('/api/builds', { url: 'http://localhost/' })).status, 400);
    const submitted = await req('/api/builds', { url: repository.url });
    assert.equal(submitted.status, 202);
    const job = await submitted.json();
    assert.equal((await fetch(origin + '/api/builds/' + job.id)).status, 404);
    let ready;
    for (let i = 0; i < 100; i++) { ready = await (await req('/api/builds/' + job.id)).json(); if (ready.status === 'ready') break; await sleep(10); }
    assert.equal(ready.status, 'ready');
    assert.equal((await fetch(origin + '/launch/' + ready.app.id)).status, 200);
    const launched = await req('/api/launches', { appId: ready.app.id, provider: 'github' });
    assert.equal(launched.status, 202);
    assert.equal(delivered.sha256, ready.app.sha256);
    assert.equal(delivered.appId, ready.app.id);
    const publicMe = await (await fetch(origin + '/api/me')).json();
    assert.equal(publicMe.apps[0].id, ready.app.id); // A different user can consume the launch link.
  } finally { await new Promise(resolve => server.close(resolve)); await closeResources(); await rm(root, { recursive: true, force: true }); }
});
