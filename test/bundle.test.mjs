import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { prepare } from '../scripts/prepare.mjs';
import { decodeArtifact } from '../src/runner.mjs';

const execute = promisify(execFile);
async function fixture(t, source, detected = false) {
  const root = await mkdtemp(join(tmpdir(), 'pods-optional-bundle-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'server.cjs'), source);
  await writeFile(join(root, detected ? 'package.json' : 'pods.json'), JSON.stringify(detected
    ? { name: 'optional-fallback', scripts: { start: 'node server.cjs' } }
    : { id: 'optional-fallback', name: 'Optional fallback', entry: 'server.cjs', healthPath: '/' }));
  return root;
}

test('detected Node app preserves its own missing optional dependency fallback in a runnable bundle', async t => {
  const root = await fixture(t, 'try { require("pods-test-missing-optional"); } catch(error) { console.log("fallback:" + error.code); }', true);
  const output = join(root, '.output'), manifest = await prepare(root, output);
  assert.equal(manifest.applicationType, 'node');
  const bytes = await readFile(join(output, 'artifacts', manifest.sha256 + '.gz'));
  const artifact = decodeArtifact(bytes, manifest.sha256);
  const bundle = join(output, 'app.cjs');
  await writeFile(bundle, Buffer.from(artifact.files.find(file => file.path === 'app.cjs').data, 'base64'));
  assert.match((await execute(process.execPath, [bundle], { cwd: output })).stdout, /^fallback:MODULE_NOT_FOUND\s*$/);
});

test('an optional occurrence never excuses a required occurrence of the same missing module', async t => {
  const root = await fixture(t, 'try { require("pods-test-missing-required"); } catch(error) {} require("pods-test-missing-required");');
  await assert.rejects(prepare(root, join(root, '.output')), /Could not resolve/);
});

test('require.resolve and dynamic import stay outside the optional literal-require optimization', async t => {
  for (const source of [
    'try { console.log(require.resolve("pods-test-missing-resolve")); } catch(error) { console.log(error.code); }',
    'import("pods-test-missing-dynamic").catch(error => console.log(error.code));',
  ]) {
    const root = await fixture(t, source);
    await assert.rejects(prepare(root, join(root, '.output')), /Unbundled runtime dependency/);
  }
});

test('a required native module still fails bundle compilation', async t => {
  const root = await fixture(t, 'require("./binding.node");');
  await writeFile(join(root, 'binding.node'), 'native binary fixture');
  await assert.rejects(prepare(root, join(root, '.output')), /No loader is configured/);
});
