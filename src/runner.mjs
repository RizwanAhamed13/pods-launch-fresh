// Runs on the user's compute. Standard library only; never installs packages or compiles.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink, mkdtemp, rm, lstat } from 'node:fs/promises';
import { join, resolve, sep, isAbsolute } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { gunzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { validateContainers } from './containers.mjs';
import { startContainers } from './container-runtime.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = b => createHash('sha256').update(b).digest('hex');
export function decodeArtifact(bytes, expected) {
  if (bytes.length > 20 * 1024 * 1024 || sha(bytes) !== expected) throw new Error('Artifact integrity check failed');
  const artifact = JSON.parse(gunzipSync(bytes, { maxOutputLength: 50 * 1024 * 1024 }));
  if (artifact.format === 2) {
    if (artifact.runtime !== 'docker' || !/^\/[a-zA-Z0-9/_-]*$/.test(artifact.healthPath) || artifact.healthPath.includes('//')) throw new Error('Invalid container artifact');
    validateContainers(artifact.containers);
    return artifact;
  }
  if (artifact.format !== 1 || artifact.entry !== 'app.cjs' || !Array.isArray(artifact.files) || artifact.files.length > 5000) throw new Error('Unsupported artifact');
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(artifact.healthPath) || artifact.healthPath.includes('//')) throw new Error('Invalid health path');
  const seen = new Set();
  for (const f of artifact.files) {
    if (typeof f.path !== 'string' || !f.path || isAbsolute(f.path) || f.path.split('/').some(x => !x || x === '.' || x === '..') || f.path.includes('\\') || f.path.includes('\0') || seen.has(f.path)) throw new Error('Unsafe artifact path');
    if (typeof f.data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(f.data)) throw new Error('Invalid file encoding');
    seen.add(f.path);
  }
  if (!seen.has('app.cjs')) throw new Error('Missing application entrypoint');
  return artifact;
}
export async function run(config, { root = join(homedir(), '.local/share/pods-launch'), fallbackRoot = join(tmpdir(), `pods-launch-${process.getuid?.() || 'user'}`) } = {}) {
  if (!/^[a-z0-9-]{2,64}$/.test(config.appId) || !/^[A-Za-z0-9_-]{20,64}$/.test(config.id) || !/^[a-f0-9]{64}$/.test(config.sha256)) throw new Error('Invalid launch identity');
  if (config.dataKey !== undefined && !/^[a-z0-9-]{2,64}$/.test(config.dataKey)) throw new Error('Invalid application data identity');
  for (const value of [config.artifactUrl, config.callbackUrl]) { const u = new URL(value); if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['127.0.0.1','localhost'].includes(u.hostname))) throw new Error('HTTPS required'); }
  const port = Number(config.port || 8080);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
  const start = performance.now();
  let child, containers, timer, stopped = false, runDir;
  const timings = {};
  let storageMode = 'persistent';
  async function report(status, extra = {}) {
    const res = await fetch(config.callbackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` }, body: JSON.stringify({ status, timings, storageMode, ...extra }), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Launch callback returned ${res.status}`);
    return res.json();
  }
  const kill = () => { if (child && child.exitCode === null) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} setTimeout(() => { if (child.exitCode === null && !child.signalCode) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} } }, 2000).unref(); } };
  async function stop() {
    if (stopped) return; stopped = true; clearInterval(timer); process.off('SIGTERM',stop); process.off('SIGINT',stop); kill();
    if(child && child.exitCode===null && !child.signalCode)await new Promise(done=>{const timeout=setTimeout(done,2500);child.once('exit',()=>{clearTimeout(timeout);done();});});
    await containers?.stop(); await report('stopped').catch(() => {});
    if (runDir) await rm(runDir, {recursive:true,force:true}).catch(()=>{});
  }
  try {
    if (!Number.isFinite(config.expiresAt) || config.expiresAt <= Date.now()) throw new Error('Launch authorization expired');
    async function writable(directory) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const stat = await lstat(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink() || (process.getuid && stat.uid !== process.getuid())) throw new Error('Runtime storage is not owned by this user');
      await mkdir(join(directory, 'cache'), { recursive: true, mode: 0o700 });
      const probe = join(directory, '.probe-' + config.id); await writeFile(probe, '', {mode:0o600}); await unlink(probe);
    }
    try { await writable(root); }
    catch (e) {
      if (!['ENOSPC','EDQUOT','EROFS','EACCES'].includes(e.code)) throw e;
      root = fallbackRoot; await writable(root); storageMode = 'ephemeral';
    }
    await report('downloading');
    const cache = join(root, 'cache', `${config.sha256}.gz`);
    let bytes;
    try { bytes = await readFile(cache); if (sha(bytes) !== config.sha256) bytes = null; } catch {}
    timings.cacheHit = Boolean(bytes);
    if (!bytes) {
      const res = await fetch(config.artifactUrl, { headers: { Authorization: `Bearer ${config.token}` }, signal: AbortSignal.timeout(20000), redirect: 'error' });
      if (!res.ok) throw new Error(`Artifact download returned ${res.status}`);
      const parts = []; let size = 0;
      for await (const b of res.body) { size += b.length; if (size > 20 * 1024 * 1024) throw new Error('Artifact download too large'); parts.push(b); }
      bytes = Buffer.concat(parts);
    }
    const artifact = decodeArtifact(bytes, config.sha256);
    if (!timings.cacheHit) { const tmp = cache + '.' + config.id; await writeFile(tmp, bytes, {mode:0o600}); await rename(tmp, cache); }
    timings.downloadMs = Math.round(performance.now() - start);
    runDir = await mkdtemp(join(root, 'run-'));
    for (const file of artifact.files || []) {
      const target = resolve(runDir, file.path);
      if (!target.startsWith(runDir + sep)) throw new Error('Unsafe artifact path');
      await mkdir(resolve(target, '..'), { recursive: true });
      await writeFile(target, Buffer.from(file.data, 'base64'), { mode: 0o600 });
    }
    const dataDir = join(root, 'data', config.dataKey || config.appId); await mkdir(dataDir, { recursive: true, mode: 0o700 });
    await new Promise((ok, fail) => { const s = createServer(); s.once('error', () => fail(new Error(`Port ${port} is already in use; stop the existing application first`))); s.listen(port, '0.0.0.0', () => s.close(ok)); });
    await report('starting');
    if (artifact.format === 2) {
      containers = await startContainers(artifact.containers, config, root, runDir, timings);
    } else {
    child = spawn(process.execPath, [join(runDir, artifact.entry)], { cwd: runDir, detached: true, env: { PATH: process.env.PATH, HOME: dataDir, NODE_ENV: 'production', HOST: '0.0.0.0', PORT: String(port), PODS_APP_DATA: dataDir, PODS_SESSION: config.id, PODS_STORAGE_MODE: storageMode }, stdio: ['ignore', 'pipe', 'pipe'] });
    let appError = ''; child.stdout.on('data', () => {}); child.stderr.on('data', b => { appError = (appError + b).slice(-1000); });
    child.on('error', e => { appError = e.message; });
    }
    let healthy = false;
    for (let n = 0; n < 100; n++) {
      await sleep(100);
      if (child && (child.exitCode !== null || child.signalCode || !child.pid)) throw new Error('Application exited before becoming healthy');
      try { const res = await fetch(`http://127.0.0.1:${port}${artifact.healthPath}`, {signal:AbortSignal.timeout(1000)}); await res.body?.cancel(); if (res.ok) { healthy = true; break; } } catch {}
    }
    if (!healthy) throw new Error('Application health check timed out');
    timings.runtimeReadyMs = Math.round(performance.now() - start);
    await report('ready', { previewUrl: config.previewUrl });
    await writeFile(join(root, `${config.id}.json`), JSON.stringify({id:config.id,pid:child?.pid,runnerPid:process.pid,timings,readyAt:Date.now()}), {mode:0o600});
    let checking = false;
    timer = setInterval(async () => {
      if (checking || stopped) return; checking = true;
      try {
        if (Date.now() >= config.expiresAt) return await stop();
        if ((child && (child.exitCode !== null || child.signalCode)) || (containers && !await containers.alive())) { clearInterval(timer); process.off('SIGTERM',stop); process.off('SIGINT',stop); await containers?.stop(); stopped = true; await report('failed', {error:'The application stopped. Launch it again.'}); return; }
        const reply = await report('heartbeat'); if (reply.action === 'stop') await stop();
      } catch {} finally { checking = false; }
    }, 3000);
    process.once('SIGTERM', stop); process.once('SIGINT', stop);
    return { timings, pid: child?.pid, stop, dataDir, storageMode };
  } catch (e) { kill(); await containers?.stop().catch(()=>{}); await report('failed', {error:e.message}).catch(()=>{}); throw e; }
}
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  const path = process.argv[2];
  const config = JSON.parse(await readFile(path, 'utf8')); await unlink(path);
  run(config).catch(e => { console.error(e.message); process.exitCode = 1; });
}
