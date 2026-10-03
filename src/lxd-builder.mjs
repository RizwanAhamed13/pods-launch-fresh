import { request } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { command } from './util.mjs';
import { decodeArtifact } from './runner.mjs';
import { IMAGE_LIMIT } from './containers.mjs';

const prefix = 'pods-fresh-job-';
const jobName = name => /^pods-fresh-job-[a-f0-9]{24}$/.test(name);
const base = process.env.PODS_BUILDER_BASE || 'pods-fresh-builder-base';
const toolsRoot = fileURLToPath(new URL('../', import.meta.url));

// This local authenticated LXD API keeps binary transfers bounded in memory and
// rejects symlinks/directories. The container must be stopped before importing.
export function lxdRead(socketPath, path, maxBytes, file = false) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    const req = request({ socketPath, path, method: 'GET', timeout: 30000 }, res => {
      if (res.statusCode !== 200 || (file && res.headers['x-lxd-type'] !== 'file') || Number(res.headers['content-length']) > maxBytes) {
        res.destroy();
        return reject(new Error('Builder output is missing, oversized, or not a regular file.'));
      }
      res.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) { res.destroy(); reject(new Error('Builder output exceeded its size limit.')); }
        else chunks.push(chunk);
      });
      res.on('error', reject);
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy(new Error('Builder output transfer timed out.')));
    req.on('error', reject);
    req.end();
  });
}

async function acquireLock(path) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  return new Promise((resolve, reject) => {
    // The kernel releases this lock if the server dies and closes the stdin pipe.
    const child = spawn('flock', ['--nonblock', path, 'sh', '-c', 'printf "ready\\n"; cat >/dev/null'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let ready = false;
    const timer = setTimeout(() => { child.kill(); reject(new Error('Builder lock timed out.')); }, 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); if (!ready) reject(new Error('Another PODS preparation service holds the builder lock.')); });
    child.stdout.once('data', () => {
      ready = true;
      clearTimeout(timer);
      resolve(() => new Promise(done => { if(child.exitCode!==null||child.signalCode!==null)return done();child.once('exit', done); child.stdin.end(); }));
    });
    child.stdin.on('error', () => {});
  });
}

export class LxdBuilder {
  constructor({ lxc = process.env.PODS_LXC || '/snap/lxd/current/bin/lxc', socket = '/var/snap/lxd/common/lxd/unix.socket', lock = join(homedir(), '.local/state/pods-launch/builder.lock'), timeout = 600000 } = {}) {
    Object.assign(this, { lxc, socket, lock, timeout });
    this.env = { HOME: homedir(), PATH: process.env.PATH || '/usr/bin:/bin' };
    this.busy = false;
  }

  cli(args, options = {}) { return command(this.lxc, args, { env: this.env, timeout: 60000, ...options }); }
  async metadata(name) {
    return JSON.parse(await lxdRead(this.socket, '/1.0/instances/' + name, 128 * 1024)).metadata;
  }

  async initialize() {
    this.release = await acquireLock(this.lock);
    try {
      const all = JSON.parse(await this.cli(['list', prefix, '--format=json']));
      for (const instance of all) if (jobName(instance.name)) await this.remove(instance.name);
      const info = await this.metadata(base), c = info.expanded_config, d = info.expanded_devices;
      const containers = base === 'pods-fresh-builder-v2';
      if (info.status !== 'Stopped' || c['security.privileged'] !== 'false' || c['security.idmap.isolated'] !== 'true' ||
          c['limits.cpu'] !== '2' || c['limits.memory'] !== (containers?'4GiB':'2GiB') || c['limits.processes'] !== (containers?'512':'256') ||
          d.root?.pool !== (containers?'pods-fresh-build-v2':'pods-fresh-build-quota') || d.root?.size !== (containers?'12GiB':'4GiB') || d.eth0?.network !== 'podsbuildfresh' ||
          (containers && c['security.nesting']!=='true') ||
          Object.keys(d).sort().join(',') !== 'eth0,root' || info.profiles.length) {
        throw new Error('The builder base does not match the required isolation configuration. Run setup-builder.sh.');
      }
    } catch (error) { await this.close(); throw error; }
  }

  async remove(name) {
    if (!jobName(name)) throw new Error('Refusing to remove an unrelated container.');
    // --force stops an instance before deletion, including after a worker timeout.
    await this.cli(['delete', name, '--force']);
  }

  async build(repository, onStage) {
    if (this.busy) throw new Error('Only one isolated build can run at a time.');
    this.busy = true;
    const name = prefix + randomBytes(12).toString('hex');
    let created = false;
    try {
      // Mark before copy: interrupted clone operations also require cleanup.
      created = true;
      await this.cli(['copy', base, name, '--instance-only']);
      // The base supplies compilers and dependencies; each stopped clone receives
      // the deployed worker so fixes cannot silently use an older runner.
      for (const folder of ['src','scripts']) {
        await this.cli(['file','push','--recursive',join(toolsRoot,folder),`${name}/opt/pods/`]);
      }
      await this.cli(['start', name]);
      if(base==='pods-fresh-builder-v2')await this.cli(['exec',name,'--','sh','-c','n=0; until docker info >/dev/null 2>&1; do n=$((n+1)); [ "$n" -le 30 ] || exit 1; sleep 1; done; chgrp 1000 /var/run/docker.sock']);
      let partial = '';
      await this.cli(['exec', name, '--user', '1000', '--group', '1000', '--cwd', '/work',
        '--env', 'HOME=/home/pods', '--env', 'PATH=/opt/node/bin:/usr/bin:/bin', '--env', 'PODS_ISOLATED_BUILD=1',
        '--', '/opt/node/bin/node', '/opt/pods/scripts/build-worker.mjs', repository.url, repository.folder], {
        timeout: this.timeout,
        onStdout: chunk => {
          partial = (partial + chunk).slice(-8192);
          const lines = partial.split('\n');
          partial = lines.pop();
          for (const line of lines) { try { onStage(JSON.parse(line).status); } catch { /* Build logs are not a control channel. */ } }
        },
      });
      await this.cli(['stop', name, '--force']);
      const info = await this.metadata(name);
      if (info.status !== 'Stopped') throw new Error('Build container did not stop before output import.');
      const path = '/1.0/instances/' + name + '/files?path=';
      const metadata = await lxdRead(this.socket, path + '/output/result.json', 65536, true);
      const bytes = await lxdRead(this.socket, path + '/output/artifact.gz', 20 * 1024 * 1024, true);
      const manifest=JSON.parse(metadata), artifact=decodeArtifact(bytes,manifest.sha256),blobs=[];
      for(const image of artifact.containers?.images || [])blobs.push({sha256:image.sha256,bytes:await lxdRead(this.socket,path+'/output/images/'+image.sha256+'.gz',Math.min(image.bytes,IMAGE_LIMIT),true)});
      return { manifest, bytes, blobs };
    } finally {
      try {
        if (created) {
          const all = JSON.parse(await this.cli(['list', prefix, '--format=json']));
          if (all.some(c => c.name === name)) await this.remove(name);
        }
      } catch (error) {
        throw Object.assign(new Error('Build cleanup failed; further preparations are disabled until isolation is restored.'), { cleanupFailed: true, cause: error });
      } finally { this.busy = false; }
    }
  }

  async close() { if (this.release) { const release = this.release; this.release = null; await release(); } }
}
