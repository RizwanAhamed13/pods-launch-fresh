// Run on aswin with a GitHub token on stdin. The token is never written to evidence.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { command, sleep } from '../src/util.mjs';

const origin = 'http://127.0.0.1:8787';
const url = process.argv[2] || 'https://github.com/mdn/beginner-html-site-scripted';
const token = readFileSync(0, 'utf8').trim();
if (!token) throw new Error('Provide the developer GitHub token on stdin.');
const initial = await fetch(origin + '/api/me');
const cookie = initial.headers.get('set-cookie').split(';')[0];
const me = await initial.json();
assert.equal(me.buildsEnabled, true);
async function api(path, method = 'GET', input) {
  const response = await fetch(origin + path, { method, headers: {
    Cookie: cookie, 'X-Pods-CSRF': me.csrf, 'Content-Type': 'application/json',
  }, body: input === undefined ? undefined : JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${result.error}`);
  return result;
}
let connected = false;
try {
  await api('/api/connections/github', 'POST', { token });
  connected = true;
  const submitted = await api('/api/builds', 'POST', { url, provider: 'github' });
  const states = [];
  let current;
  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    current = await api('/api/builds/' + submitted.id);
    if (states.at(-1)?.status !== current.status) {
      const event = { status: current.status, elapsedMs: Date.now() - submitted.createdAt };
      states.push(event); console.log(JSON.stringify(event));
    }
    if (['ready', 'failed'].includes(current.status)) break;
    await sleep(1000);
  }
  assert.equal(current?.status, 'ready', current?.error || 'Preparation timed out');
  assert.equal((await fetch(origin + '/api/builds/' + current.id)).status, 404);
  const consumer = await (await fetch(origin + '/api/me')).json();
  assert.ok(consumer.apps.some(app => app.id === current.app.id));
  const launch = await fetch(current.launchUrl);
  assert.equal(launch.status, 200);
  const instances = JSON.parse(await command('/snap/lxd/current/bin/lxc', ['list', 'pods-fresh-job-', '--format=json']));
  assert.deepEqual(instances, [], 'A disposable build container remained after publication');
  const report = {
    checkedAt: new Date().toISOString(), submittedRepository: url,
    accountConnection: 'Real GitHub token validated by the control plane; removed after this check',
    transport: 'HTTP submission and polling against the deployed server on aswin; public HTTPS launch page checked',
    states, preparationMs: current.finishedAt - current.createdAt,
    app: current.app, launchUrl: current.launchUrl,
    separateSessionCanReadApp: true, separateSessionCannotReadBuild: true, disposableContainersRemaining: 0,
    limits: 'Developer API and isolated preparation only. No browser form, compute provisioning or final product navigation is exercised here.',
  };
  await writeFile('evidence/build-api-live.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'verified', launchUrl: current.launchUrl, preparationMs: report.preparationMs }));
} finally { if (connected) await api('/api/connections/github', 'DELETE'); }
