import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import * as flow from '../public/flow.js';

// Execute the actual client with a minimal DOM and deterministic network/clock.
const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replace(/^import .*?;\n/, '');
const app = { id: 'fixture', name: 'Counter', bytes: 1 };
const pending = { id: 'launch-one', appId: app.id, appName: app.name, provider: 'github', status: 'connecting', createdAt: 1000 };
const ready = { ...pending, status: 'ready', readyAt: 2000, previewUrl: 'https://fixture-8080.app.github.dev/' };
const build = { id: 'build-one', status: 'compiling', createdAt: 1000, repository: { url: 'https://github.com/example/app', name: 'app', folder: '' } };
const built = { ...build, status: 'ready', finishedAt: 2000, app, launchUrl: 'https://pods.example/launch/fixture' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const html = (status = 503) => new Response('<h1>PRIVATE-RESPONSE-BODY</h1>', { status, headers: { 'Content-Type': 'text/html' } });
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }

async function client({ view = 'launch', statuses = [], historyRows = [], creation, historyFailure = false } = {}) {
  const nodes = new Map(), tasks = new Map(), storage = new Map(), events = new Map(), calls = [], destinations = [];
  let now = 10000, taskId = 0, historyReads = 0;
  class Element {
    constructor() { this.hidden = true; this.value = ''; this.children = []; this.listeners = {}; this.checked = false; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute() {} removeAttribute() {} focus() {} reportValidity() { return true; }
  }
  const node = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  const choices = [node('github-radio'), node('google-radio')];
  choices[0].value = 'github'; choices[1].value = 'google'; choices[0].checked = true;
  const setTimer = (fn, delay) => { tasks.set(++taskId, { at: now + delay, fn }); return taskId; };
  const request = async (path, options = {}) => {
    calls.push({ path, method: options.method || 'GET' });
    if (path === '/api/me') return json({ csrf: 'test', apps: [app], buildsEnabled: true, connections: [{ provider: 'github', connected: true, name: 'Test' }, { provider: 'google', connected: false }] });
    if (path === '/api/launches' || path === '/api/builds') {
      if (options.method === 'POST') return creation ? creation() : json(view === 'launch' ? pending : build);
      if (++historyReads > 1 && historyFailure) return html();
      return json(historyRows);
    }
    if (path.endsWith('/stop')) return json({ stopping: true });
    const next = statuses.shift();
    if (typeof next === 'function') return next(options);
    if (next instanceof Response) return next;
    if (next) return json(next);
    throw new Error('Unexpected progress request: ' + path);
  };
  const context = { ...flow, URL, URLSearchParams, AbortController, Response,
    Date: class extends Date { static now() { return now; } },
    fetch: request, setTimeout: setTimer, clearTimeout: id => tasks.delete(id),
    sessionStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    location: { origin: 'https://pods.example', pathname: view === 'launch' ? '/launch/fixture' : '/develop', search: '', assign: value => destinations.push(value) },
    window: { history: { replaceState() {} }, addEventListener: (name, fn) => events.set(name, fn) },
    document: { getElementById: node, createElement: () => new Element(), querySelectorAll: () => choices,
      querySelector: selector => selector === '.folder-options' ? node('folder-options') : choices.find(c => selector.includes('value="' + c.value + '"')) || choices.find(c => c.checked) },
  };
  await runInNewContext('(async () => {\n' + source + '\n})()', context);
  await flush();
  const fire = async (id, name = 'click') => { const result = node(id).listeners[name]({ preventDefault() {} }); await flush(); await result; await flush(); };
  const advance = async ms => {
    const target = now + ms;
    for (let i = 0; i < 100; i++) {
      const next = [...tasks].filter(([, v]) => v.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) { now = target; await flush(); return; }
      const [id, job] = next; tasks.delete(id); now = job.at; job.fn(); await flush();
    }
    assert.fail('Client scheduled an unbounded polling loop');
  };
  return { node, calls, destinations, fire, advance, events, statuses, storage };
}

for (const [name, failure] of [
  ['HTML response', () => html()],
  ['malformed JSON', () => new Response('{broken PRIVATE-RESPONSE-BODY', { headers: { 'Content-Type': 'application/json' } })],
  ['network failure', () => { throw new TypeError('Failed to fetch'); }],
]) test('browser automatically opens the same launch after a temporary ' + name, async () => {
  const c = await client({ statuses: [failure, ready] });
  await c.fire('launch');
  assert.equal(c.node('retry-status').hidden, true);
  assert.ok(!c.node('notice').textContent.includes('PRIVATE-RESPONSE-BODY'));
  await c.advance(1000);
  assert.deepEqual(c.destinations, [ready.previewUrl]);
  assert.equal(c.calls.filter(r => r.method === 'POST').length, 1);
  assert.deepEqual(c.calls.filter(r => /launches\//.test(r.path)).map(r => r.path), ['/api/launches/launch-one', '/api/launches/launch-one']);
});

test('browser preparation recovers automatically and shares the same completed build', async () => {
  const c = await client({ view: 'develop', statuses: [html(), built] });
  c.node('repository').value = build.repository.url;
  await c.fire('build-form', 'submit'); await c.advance(1000);
  assert.equal(c.node('build-result').hidden, false);
  assert.equal(c.node('launch-link').value, built.launchUrl);
  assert.equal(c.node('notice').hidden, true);
  assert.deepEqual(c.destinations, []);
  assert.equal(c.calls.filter(r => r.method === 'POST').length, 1);
});

test('browser bounds consecutive failures and manual progress check keeps the same launch', async () => {
  const c = await client({ statuses: [html(), html(), html(), html(), ready] });
  await c.fire('launch'); await c.advance(60000);
  assert.equal(c.calls.filter(r => r.path === '/api/launches/launch-one').length, 4);
  assert.equal(c.node('retry-status').hidden, false);
  assert.match(c.node('notice').textContent, /Check progress/);
  await c.fire('retry-status');
  assert.deepEqual(c.destinations, [ready.previewUrl]);
  assert.equal(c.calls.filter(r => r.method === 'POST').length, 1);
});

for (const status of [401, 403, 404, 429]) test('browser does not automatically retry denied progress status ' + status, async () => {
  const c = await client({ statuses: [html(status)] });
  await c.fire('launch'); await c.advance(60000);
  assert.equal(c.calls.filter(r => r.path === '/api/launches/launch-one').length, 1);
  assert.equal(c.node('retry-status').hidden, false);
  assert.ok(!c.node('notice').textContent.includes('PRIVATE-RESPONSE-BODY'));
  assert.deepEqual(c.destinations, []);
});

test('browser retries a timed-out status read and resets the failure count after success', async () => {
  const hung = ({ signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  const c = await client({ statuses: [hung, pending, html(), html(), html(), ready] });
  await c.fire('launch'); await c.advance(10000); await c.advance(1000);
  await c.advance(8000);
  assert.deepEqual(c.destinations, [ready.previewUrl]);
  assert.equal(c.calls.filter(r => r.path === '/api/launches/launch-one').length, 6);
});

test('browser ignores an obsolete ready response after stopping the same launch', async () => {
  const late = deferred();
  const c = await client({ statuses: [() => late.promise, { ...pending, status: 'stopped' }] });
  await c.fire('launch'); await c.fire('stop');
  late.resolve(json(ready)); await flush(); await c.advance(60000);
  assert.deepEqual(c.destinations, []);
  assert.equal(c.node('stop').hidden, true);
  assert.equal(c.node('open-app').hidden, true);
  assert.equal(c.calls.filter(r => r.path === '/api/launches/launch-one').length, 2);
});

test('browser ignores a stale build response after selecting a different history item', async () => {
  const late = deferred(), failed = { ...build, id: 'older-build', status: 'failed' };
  const c = await client({ view: 'develop', historyRows: [build, failed], statuses: [() => late.promise] });
  c.node('history').children[1].children[1].listeners.click();
  late.resolve(json(built)); await flush(); await c.advance(60000);
  assert.equal(c.node('build-result').hidden, true);
  assert.equal(c.node('stage-title').textContent, 'Preparation needs attention');
});

test('browser cancels progress recovery when the page is left', async () => {
  const late = deferred(), c = await client({ statuses: [() => late.promise, ready] });
  await c.fire('launch'); c.events.get('pagehide')?.();
  late.resolve(html()); await flush(); await c.advance(60000);
  assert.deepEqual(c.destinations, []);
  assert.equal(c.calls.filter(r => r.path === '/api/launches/launch-one').length, 1);
  assert.equal(c.node('retry-status').hidden, true);
});

test('browser does not retry launch creation or allow a history error to undo readiness', async () => {
  const failed = await client({ creation: () => html() });
  await failed.fire('launch'); await failed.advance(60000);
  assert.equal(failed.calls.filter(r => r.method === 'POST').length, 1);
  assert.deepEqual(failed.destinations, []);
  const c = await client({ statuses: [ready], historyFailure: true });
  await c.fire('launch'); await c.advance(60000);
  assert.deepEqual(c.destinations, [ready.previewUrl]);
  assert.equal(c.node('retry-status').hidden, true);
});
