import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRepository } from '../src/repository.mjs';
import { buildSource, waitForRepositoryNetwork } from '../scripts/build-worker.mjs';

test('repository identity is stable and accepts an optional application folder', () => {
  const a = parseRepository('https://github.com/Example/Product.git');
  const b = parseRepository('https://github.com/example/product/');
  assert.equal(a.key, b.key);
  assert.equal(a.url, 'https://github.com/example/product');
  const folder = parseRepository(a.url, 'apps/web');
  assert.equal(folder.folder, 'apps/web');
  assert.notEqual(folder.key, a.key);
});

test('repository input rejects local addresses, credentials, URL tricks and escaping folders', () => {
  for (const url of [
    'file:///etc/passwd', 'http://github.com/a/b', 'https://127.0.0.1/repo',
    'https://github.com.evil.example/a/b', 'https://token@github.com/a/b',
    'https://github.com:8443/a/b', 'https://github.com/a/b?token=secret',
    'https://github.com/a/b#fragment', 'https://github.com/a/b/tree/main',
    'https://github.com/a/%2e%2e', 'git@github.com:a/b.git',
  ]) assert.throws(() => parseRepository(url), undefined, url);
  for (const folder of ['../private', '/root', 'a/../../root', 'a\\b', 'a//b', 'a/./b']) {
    assert.throws(() => parseRepository('https://github.com/a/b', folder), /folder/);
  }
});

test('repository build worker refuses execution outside its isolated environment', async () => {
  await assert.rejects(buildSource('/does-not-exist', '/does-not-exist'), /isolated build container/);
});

test('fresh containers wait for DNS and report a bounded failure if networking never starts', async () => {
  let attempts = 0;
  await waitForRepositoryNetwork({ resolveName: async () => { if (++attempts < 3) throw new Error('EAI_AGAIN'); }, pause: async () => {} });
  assert.equal(attempts, 3);
  attempts = 0;
  await assert.rejects(waitForRepositoryNetwork({ resolveName: async () => { attempts++; throw new Error('EAI_AGAIN'); }, pause: async () => {} }), /networking did not become ready/);
  assert.equal(attempts, 15);
});
