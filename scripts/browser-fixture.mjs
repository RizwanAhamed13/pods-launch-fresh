// Deterministic browser QA only. Provider authorization and compute are simulated.
// No real account tokens, provider calls or billing are used by this loopback server.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../src/server.mjs';
import { run } from '../src/runner.mjs';
import { sleep } from '../src/util.mjs';

const port = Number(process.env.PODS_FIXTURE_PORT || 19888);
const origin = `http://127.0.0.1:${port}`;
const root = await mkdtemp(join(tmpdir(), 'pods-browser-'));
const artifact = await readFile('.data/preparation-evidence/vite-artifact.gz');
const sourceManifest = JSON.parse(await readFile('evidence/isolated-vite.json'));
const runners = [];
const processes = new Map();
let productPort = 19900;
const adapter = {
  initialize: async () => {}, close: async () => {},
  build: async (repository, update) => {
    for (const stage of ['fetching', 'compiling', 'verifying']) { update(stage); await sleep(600); }
    if (repository.name === 'unsupported') throw new Error('This application needs an unsupported runtime. Choose a Node, Vite or static web application.');
    return { bytes: artifact, manifest: { ...sourceManifest, id: `repo-${repository.key}`, name: 'Prepared counter', source: { url: repository.url, folder: repository.folder, revision: 'a'.repeat(40) } } };
  },
};
function compute(provider) {
  return {
    validate: async () => ({ id: 'fixture-' + provider, name: 'Browser fixture account' }),
    launch: async (token, config, update) => {
      await update({ status: 'provisioning' }); await sleep(500);
      const appPort = ++productPort;
      const previewUrl = origin + `/fixture/product/${config.id}/`;
      await update({ status: 'delivering', providerReadyAt: Date.now(), previewUrl });
      const running = await run({ ...config, port: appPort }, { root: join(root, 'compute-' + provider) });
      runners.push(running); processes.set(config.id, appPort);
      return { previewUrl, environment: 'simulated-' + provider };
    },
  };
}
const oauth = Object.fromEntries(['github', 'google'].map(provider => [provider, {
  id: 'browser-fixture', secret: 'not-a-real-secret', authorize: origin + '/fixture/authorize/' + provider,
  exchange: origin + '/fixture/token', scope: 'fixture',
}]));
const { server, closeResources } = await createApp({ data: root, origin, secret: randomBytes(32).toString('hex'), buildAdapter: adapter,
  providers: { github: compute('github'), google: compute('google') }, oauth,
  oauthFetch: async () => new Response(JSON.stringify({ access_token: 'simulated-browser-token', expires_in: 3600 })),
});
const handler = server.listeners('request')[0];
server.removeAllListeners('request');
server.on('request', async (req, res) => {
  const url = new URL(req.url, origin);
  const authorization = /^\/fixture\/authorize\/(github|google)$/.exec(url.pathname);
  if (authorization) {
    const callback = `/auth/${authorization[1]}/callback?state=${encodeURIComponent(url.searchParams.get('state'))}`;
    res.setHeader('Content-Type', 'text/html');
    return res.end(`<!doctype html><html><head><title>Simulated provider authorization</title></head><body><h1>Simulated ${authorization[1]} authorization</h1><p>Browser QA only. No real provider account or compute is used.</p><a href="${callback}&code=fixture-code">Authorize test account</a><p><a href="${callback}&error=access_denied">Cancel authorization</a></p></body></html>`);
  }
  const product = /^\/fixture\/product\/([A-Za-z0-9_-]{32})\//.exec(url.pathname);
  if (product || url.pathname.startsWith('/assets/')) {
    const requestedPort = product ? processes.get(product[1]) : productPort;
    if (!requestedPort) { res.writeHead(404); return res.end('Test product unavailable'); }
    try {
      const response = await fetch(`http://127.0.0.1:${requestedPort}${product ? '/' : url.pathname}`);
      res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'text/plain' });
      return res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.writeHead(502); return res.end('Test product stopped'); }
  }
  return handler(req, res);
});
server.listen(port, '127.0.0.1', () => console.log('Browser fixture (simulated providers): ' + origin));
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  for (const runner of runners) await runner.stop();
  await new Promise(resolve => server.close(resolve)); await closeResources();
  await rm(root, { recursive: true, force: true }); process.exit(0);
}
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, stop);
setTimeout(stop, 30 * 60 * 1000).unref();
