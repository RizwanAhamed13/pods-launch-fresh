import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { docker, runtimeCompose } from './containers.mjs';
import { persistentVolumes } from './storage.mjs';

async function fileHash(path) {
  const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex');
}

export async function launchCompose(args, stop, timings, execute = docker) {
  const start = () => execute([...args,'up','--detach','--no-build','--pull','never','--wait','--wait-timeout','90'], {timeout:120000});
  try { await start(); }
  catch (e) {
    // A resumed Docker-in-Docker daemon can retain a stale runc task. Recreate
    // this application's containers once, preserving all database volumes.
    if (!/OCI runtime create failed:.*container with given ID already exists/s.test(e.message)) throw e;
    timings.runtimeRetries = 1;
    await stop(); await start();
  }
}

export async function startContainers(plan, config, root, runDir, timings) {
  await docker(['info','--format','{{.OSType}}/{{.Architecture}}']).then(platform => {
    if (!/^linux\/(?:x86_64|amd64)$/.test(platform)) throw new Error('This artifact requires a Linux amd64 Docker engine.');
  });
  await docker(['compose','version']);
  const cache = join(root, 'images'); await mkdir(cache, {recursive:true,mode:0o700});
  const started = performance.now(); let hits = 0;
  for (const image of plan.images) {
    const present = await docker(['image','inspect',image.id,'--format','{{.Id}}']).catch(() => '');
    if (present === image.id) { hits++; continue; }
    const path = join(cache, image.sha256 + '.gz');
    const valid = await stat(path).then(async s => s.size === image.bytes && await fileHash(path) === image.sha256).catch(() => false);
    if (!valid) {
      const url = new URL(config.artifactUrl); url.pathname += '/images/' + image.sha256;
      const response = await fetch(url, {headers:{Authorization:`Bearer ${config.token}`},signal:AbortSignal.timeout(180000),redirect:'error'});
      if (!response.ok) throw new Error(`Prepared image download returned ${response.status}`);
      const temp = path + '.' + config.id; let size = 0; const hash = createHash('sha256');
      try {
        await pipeline(response.body, new Transform({transform(chunk, _, done) { size += chunk.length; if (size > image.bytes) return done(new Error('Prepared image exceeds declared size')); hash.update(chunk); done(null, chunk); }}), createWriteStream(temp,{flags:'wx',mode:0o600}));
        if (size !== image.bytes || hash.digest('hex') !== image.sha256) throw new Error('Prepared image integrity check failed');
        await rename(temp, path);
      } finally { await rm(temp,{force:true}); }
    }
    await docker(['load','--input',path], {timeout:180000});
    if (await docker(['image','inspect',image.id,'--format','{{.Id}}']) !== image.id) throw new Error('Loaded image identity mismatch');
    // Docker's content store is the runtime cache; avoid retaining a second large copy.
    await rm(path, {force:true});
  }
  timings.imageCacheHits = hits; timings.imagesMs = Math.round(performance.now() - started);
  // Stable application identity preserves named volumes between artifact versions.
  const dataKey = config.dataKey || config.appId;
  const project = 'pods-' + createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  const file = join(runDir, 'compose.json');
  const compose = runtimeCompose(plan, project, config.port || 8080, config.previewUrl);
  compose.volumes = await persistentVolumes(plan,project,root);
  await writeFile(file, JSON.stringify(compose), {mode:0o600});
  const args = ['compose','--project-name',project,'--file',file];
  const stop = () => docker([...args,'down','--timeout','10','--remove-orphans'], {timeout:60000});
  try {
    await launchCompose(args,stop,timings);
    return { stop, async alive() {
      const ids = await docker([...args,'ps','--quiet',plan.web]);
      if (!ids) return false;
      return (await docker(['inspect','--format','{{.State.Running}}',...ids.split('\n')])).split('\n').every(x => x === 'true');
    }};
  } catch (e) { await stop().catch(() => {}); throw e; }
}
