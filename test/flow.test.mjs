import test from 'node:test';
import assert from 'node:assert/strict';
import { route, appForRoute, pendingForPage, previewAddress } from '../public/flow.js';
import { providers } from '../src/providers.mjs';

test('launch links select their exact version and unavailable versions never select another product', () => {
  const apps = [{ id: 'first' }, { id: 'second-version' }];
  assert.equal(appForRoute(apps, route('/launch/second-version')), apps[1]);
  assert.equal(appForRoute(apps, route('/launch/missing')), null);
  assert.equal(appForRoute(apps, route('/')), null);
  assert.equal(route('/develop').view, 'develop');
});
test('OAuth continuation is time-bounded and bound to the original action, product and provider', () => {
  const page = route('/launch/second'), now = 1000000;
  const pending = { action: 'launch', appId: 'second', provider: 'google', createdAt: now - 1000 };
  assert.deepEqual(pendingForPage(JSON.stringify(pending), page, now), pending);
  for (const changes of [{ appId: 'first' }, { provider: 'evil' }, { createdAt: now - 600001 }, { createdAt: now + 10000 }, { action: 'build' }]) {
    assert.equal(pendingForPage(JSON.stringify({ ...pending, ...changes }), page, now), null);
  }
  assert.equal(pendingForPage('not json', page, now), null);
  const build = { action: 'build', provider: 'github', url: 'https://github.com/owner/repo', folder: 'apps/web', createdAt: now };
  assert.deepEqual(pendingForPage(JSON.stringify(build), route('/develop'), now), build);
  assert.equal(pendingForPage(JSON.stringify(build), page, now), null);
});
test('automatic navigation accepts provider previews and rejects arbitrary or credential-bearing destinations', () => {
  const origin = 'https://pods.example';
  for (const target of ['https://name-8080.app.github.dev/', 'https://8080-example.cloudshell.dev/']) assert.equal(previewAddress(target, origin), target);
  for (const target of ['javascript:alert(1)', 'https://evil.example/', 'https://foo.app.github.dev.evil.example/', 'https://user:secret@foo.cloudshell.dev/', 'http://foo.app.github.dev/', '/relative', undefined]) assert.equal(previewAddress(target, origin), null);
  assert.equal(previewAddress('http://127.0.0.1:9999/product', 'http://127.0.0.1:9999'), 'http://127.0.0.1:9999/product');
  assert.equal(previewAddress('http://127.0.0.1:9999/product', origin), null);
});
test('provider identities use stable account IDs rather than a shared Cloud Shell label or mutable display name', async () => {
  const adapter = providers({ repo: 'owner/runtime', origin: 'https://pods.example', runnerSha: 'a'.repeat(64),
    api: async () => ({ id: 42, login: 'developer' }),
    cloudRequest: async (url, token) => url.includes('/userinfo') ? { sub: token === 'one' ? 'account-one' : 'account-two', email: 'developer@example.com' } : {},
  });
  assert.equal((await adapter.github.validate('token')).id, '42');
  const first = await adapter.google.validate('one'), second = await adapter.google.validate('two');
  assert.notEqual(first.id, second.id); assert.equal(first.name, 'developer@example.com');
  const bad = providers({ cloudRequest: async () => ({}) });
  await assert.rejects(bad.google.validate('token'), /identity/);
});
