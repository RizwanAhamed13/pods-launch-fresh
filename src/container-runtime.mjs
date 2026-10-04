import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { docker, runtimeCompose } from './containers.mjs';
import { persistentVolumes, storageRoot } from './storage.mjs';
import { transitionApplicationData } from './storage-transition.mjs';
import { trustedImageUrl } from './artifact-url.mjs';
import { downloadImageRanges } from './image-ranges.mjs';

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

export async function containersAlive(plan, args, execute = docker) {
  const ids = await execute([...args,'ps','--all','--quiet']);
  if (!ids.trim()) return false;
  // Read bounded state only: full inspect output can include secrets and large health logs.
  const format = '{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"status":{{json .State.Status}},"running":{{json .State.Running}},"paused":{{json .State.Paused}},"restarting":{{json .State.Restarting}},"exitCode":{{json .State.ExitCode}},"oomKilled":{{json .State.OOMKilled}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}null{{end}}}';
  const containers = (await execute(['inspect','--format',format,...ids.trim().split(/\s+/)])).trim().split('\n').map(line => JSON.parse(line));
  const completed = new Set(Object.values(plan.services).flatMap(service =>
    Object.entries(service.depends_on || {}).filter(([,condition]) => condition === 'service_completed_successfully').map(([name]) => name)));
  return Object.entries(plan.services).every(([name,service]) => {
    const instances = containers.filter(container => container.service === name);
    return instances.length > 0 && instances.every(state => {
      if (state.paused || state.restarting) return false;
      if (state.status === 'exited') return name !== plan.web && completed.has(name) && state.exitCode === 0 && !state.oomKilled;
      if (state.status !== 'running' || !state.running) return false;
      return state.health ? state.health === 'healthy' : !service.healthcheck;
    });
  });
}

export async function prepareRuntimeImages(images, config, root, timings, execute = docker, fetcher = fetch) {
  const cache = join(root, 'images'); await mkdir(cache, {recursive:true,mode:0o700});
  const started = performance.now();
  Object.assign(timings, {imageCacheHits:0,imageArchiveCacheHits:0,imageCacheCheckMs:0,imageDownloadMs:0,imageLoadMs:0,imageCdnDownloads:0,imageCdnFallbacks:0,imageCdnMs:0,imageOriginDownloads:0,imageCdnRangeAttempts:0,imageCdnRangeDownloads:0});
  const measure = async (key, action) => {
    const at = performance.now();
    try { return await action(); } finally { timings[key] += performance.now() - at; }
  };
  try {
    for (const image of images) {
      const present = await measure('imageCacheCheckMs', () => execute(['image','inspect',image.id,'--format','{{.Id}}']).catch(() => ''));
      if (present === image.id) { timings.imageCacheHits++; continue; }
      const path = join(cache, image.sha256 + '.gz');
      const valid = await measure('imageCacheCheckMs', () => stat(path).then(async s => s.size === image.bytes && await fileHash(path) === image.sha256).catch(() => false));
      if (valid) timings.imageArchiveCacheHits++;
      else await measure('imageDownloadMs', async () => {
        const url = new URL(config.artifactUrl); url.pathname += '/images/' + image.sha256;
        const origin = direct => fetcher(url, {headers:{Authorization:`Bearer ${config.token}`,...(direct?{'X-PODS-Image-Delivery':'direct'}:{})},signal:AbortSignal.timeout(180000),redirect:'manual'});
        const save = async response => {
          if (response.status !== 200) { await response.body?.cancel().catch(() => {}); throw new Error(`Prepared image download returned ${response.status}`); }
          const temp = path + '.' + config.id; let size = 0; const hash = createHash('sha256');
          try {
            await pipeline(response.body, new Transform({transform(chunk, _, done) { size += chunk.length; if (size > image.bytes) return done(new Error('Prepared image exceeds declared size')); hash.update(chunk); done(null, chunk); }}), createWriteStream(temp,{flags:'wx',mode:0o600}));
            if (size !== image.bytes || hash.digest('hex') !== image.sha256) throw new Error('Prepared image integrity check failed');
            await rename(temp, path);
          } finally { await rm(temp,{force:true}); }
        };
        let response = await origin(true);
        if (response.status === 307) {
          const location = trustedImageUrl(response.headers.get('location'));
          await response.body?.cancel().catch(() => {});
          if (!location) throw new Error('Prepared image redirect rejected');
          try {
            await measure('imageCdnMs', async () => {
              if (image.bytes < 32 * 1024 ** 2) return save(await fetcher(location, {signal:AbortSignal.timeout(30000),redirect:'error'}));
              timings.imageCdnRangeAttempts++;
              const temp = path + '.' + config.id;
              await downloadImageRanges(location, image, temp, fetcher);
              try { await rename(temp, path); } finally { await rm(temp, {force:true}); }
              timings.imageCdnRangeDownloads++;
            });
            timings.imageCdnDownloads++; return;
          } catch { timings.imageCdnFallbacks++; response = await origin(false); }
        }
        await save(response); timings.imageOriginDownloads++;
      });
      await measure('imageLoadMs', async () => {
        await execute(['load','--input',path], {timeout:180000});
        if (await execute(['image','inspect',image.id,'--format','{{.Id}}']) !== image.id) throw new Error('Loaded image identity mismatch');
      });
      // Docker's content store is the runtime cache; avoid retaining a second large copy.
      await rm(path, {force:true});
    }
  } finally {
    for (const key of ['imageCacheCheckMs','imageDownloadMs','imageLoadMs','imageCdnMs']) timings[key] = Math.round(timings[key]);
    timings.imagesMs = Math.round(performance.now() - started);
  }
}

export async function startContainers(plan, config, root, runDir, timings) {
  await docker(['info','--format','{{.OSType}}/{{.Architecture}}']).then(platform => {
    if (!/^linux\/(?:x86_64|amd64)$/.test(platform)) throw new Error('This artifact requires a Linux amd64 Docker engine.');
  });
  await docker(['compose','version']);
  await prepareRuntimeImages(plan.images, config, root, timings);
  // Stable application identity preserves named volumes between artifact versions.
  const dataKey = config.dataKey || config.appId;
  const project = 'pods-' + createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  const file = join(runDir, 'compose.json');
  const compose = runtimeCompose(plan, project, config.port || 8080, config.previewUrl);
  const storageOptions = {plan,legacyRoot:config.provider === 'github' && root === storageRoot('github') ? storageRoot('google') : undefined};
  await transitionApplicationData(root,dataKey,'container',{...storageOptions,recoverOnly:true});
  compose.volumes = await persistentVolumes(plan,project,root);
  await transitionApplicationData(root,dataKey,'container',storageOptions);
  await writeFile(file, JSON.stringify(compose), {mode:0o600});
  const args = ['compose','--project-name',project,'--file',file];
  const stop = () => docker([...args,'down','--timeout','10','--remove-orphans'], {timeout:60000});
  try {
    await launchCompose(args,stop,timings);
    return { stop, alive: () => containersAlive(plan,args), dataDir:join(root,'data',dataKey) };
  } catch (e) { await stop().catch(() => {}); throw e; }
}
