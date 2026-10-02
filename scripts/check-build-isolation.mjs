import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { command } from '../src/util.mjs';

const instance = process.argv[2];
if (!/^pods-fresh-verify-[a-z0-9-]+$/.test(instance || '')) throw new Error('Pass a fresh verification container name.');
const lxc = process.env.PODS_LXC || '/snap/lxd/current/bin/lxc';
const reply = JSON.parse(await command(lxc, ['query', `/1.0/instances/${instance}`]));
const state = reply.metadata || reply;
const config = state.expanded_config, devices = state.expanded_devices;
assert.equal(config['security.privileged'], 'false');
assert.equal(config['security.idmap.isolated'], 'true');
assert.equal(config['limits.cpu'], '2');
assert.equal(config['limits.memory'], '2GiB');
assert.equal(config['limits.processes'], '256');
assert.equal(devices.root.pool, 'pods-fresh-build-quota');
assert.equal(devices.root.size, '4GiB');
assert.deepEqual(Object.keys(devices).sort(), ['eth0', 'root']);
await command(lxc, ['exec', instance, '--user', '1000', '--group', '1000', '--', 'sh', '-c', 'test ! -e /home/aswin/pods-launch-fresh/.env && test ! -e /var/run/docker.sock']);

const server = createServer((req, res) => res.end('pods-isolation-probe'));
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(18999, '10.238.91.1', resolve); });
try {
  assert.equal(await (await fetch('http://10.238.91.1:18999')).text(), 'pods-isolation-probe');
  let blocked = false;
  try {
    await command(lxc, ['exec', instance, '--user', '1000', '--group', '1000', '--', 'curl', '--fail', '--silent', '--show-error', '--connect-timeout', '2', '--max-time', '3', 'http://10.238.91.1:18999'], { timeout: 10000 });
  } catch (error) {
    if (!/curl: \((7|28)\)/.test(error.message)) throw error;
    blocked = true;
  }
  assert.equal(blocked, true, 'Build container could reach the private host service.');
  const evidence = {
    checkedAt: new Date().toISOString(), unprivileged: true, isolatedUserMapping: true,
    memory: '2GiB', cpu: 2, processes: 256, rootDisk: '4GiB', storagePool: devices.root.pool,
    controlPlaneSecretsAbsent: true, dockerSocketAbsent: true, hostFilesystemMounts: false,
    listeningPrivateHostServiceBlocked: true,
    limits: 'Configuration plus one live network probe; not a full hostile-container escape or resource-exhaustion audit. Builds must remain serialized because bridge ACLs do not isolate peers.',
  };
  await writeFile('evidence/build-isolation.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally { await new Promise(resolve => server.close(resolve)); }
