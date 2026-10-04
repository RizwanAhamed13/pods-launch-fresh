import {cp, lstat, mkdir, readFile, readdir, rename, rm, open} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash, randomBytes} from 'node:crypto';
import {privateDirectory, copyApplicationData, applicationData} from './storage.mjs';
import {docker} from './containers.mjs';

const kinds = new Set(['bundle','container']);
const exists = path => lstat(path).catch(error => { if(error.code !== 'ENOENT') throw error; });
async function managedPath(root, segments, data = false) {
  let path = root;
  for(let i = 0; i < segments.length; i++) {
    path = join(path, segments[i]); const stat = await exists(path);
    if(!stat) return undefined;
    if(!stat.isDirectory() || stat.isSymbolicLink() || (!(data && i === segments.length - 1) && process.getuid && stat.uid !== process.getuid())) throw new Error('Unsafe application migration storage');
  }
  return path;
}
async function populated(path) {
  if(!path) return false;
  try { return (await readdir(path)).length > 0; }
  catch(error) { if(error.code === 'EACCES') return true; throw error; }
}
async function save(path, value) {
  const temporary = path + '-' + randomBytes(16).toString('hex');
  const file = await open(temporary,'wx',0o600);
  try { await file.writeFile(JSON.stringify(value)); await file.sync(); } finally { await file.close(); }
  await rename(temporary,path);
}
function transferable(plan) {
  const services = Object.values(plan?.services || {}), service = services[0];
  return services.length === 1 && service.volumes?.length === 1 && service.volumes[0].name === 'app-data' && service.volumes[0].target === '/data' && !service.volumes[0].readOnly && (!service.environment?.PODS_APP_DATA || service.environment.PODS_APP_DATA === '/data');
}
function validate(state) {
  if(state?.version !== 1 || !kinds.has(state.kind) || typeof state.transferable !== 'boolean') throw new Error('Invalid application migration journal');
  const tx = state.transaction;
  if(tx && (!/^[a-f0-9]{32}$/.test(tx.id) || !kinds.has(tx.to) || tx.to === state.kind || !['copying','ready'].includes(tx.phase) || typeof tx.transferable !== 'boolean' || (tx.phase === 'ready' && (!Number.isSafeInteger(tx.ino) || !Number.isSafeInteger(tx.dev))))) throw new Error('Invalid application migration journal');
}

// Called only after the control plane excludes another live launch and the
// runner checks its stable product port. Originals remain in private backups.
export async function transitionApplicationData(root, key, kind, {plan, legacyRoot, recoverOnly = false, execute = docker, copy = copyApplicationData, checkpoint = async() => {}} = {}) {
  if(!/^[a-z0-9-]{2,64}$/.test(key) || !kinds.has(kind)) throw new Error('Invalid application storage transition');
  await privateDirectory(root);
  const project = 'pods-' + createHash('sha256').update(key).digest('hex').slice(0,24);
  const stateDirectory = await privateDirectory(root,'storage-state',key);
  const statePath = join(stateDirectory,'state.json');
  let state;
  const stored = await exists(statePath);
  if(stored) {
    if(!stored.isFile() || stored.isSymbolicLink() || (process.getuid && stored.uid !== process.getuid())) throw new Error('Unsafe application migration journal');
    state = JSON.parse(await readFile(statePath,'utf8')); validate(state);
  }
  if(recoverOnly && !state?.transaction) return;
  // Do not recreate a destination that was renamed before an interruption.
  if(state?.kind === 'bundle' && !state.transaction && !await exists(join(root,'data',key))) throw new Error('Saved application storage is missing; refusing an empty replacement');
  if(!state?.transaction) await applicationData(root,key,legacyRoot);
  const nodeDirectory = await managedPath(root,['data',key]);
  const containerProject = await managedPath(root,['volumes',project]);
  const containerDirectory = await managedPath(root,['volumes',project,'app-data','data'],true);
  const paths = {bundle:join(root,'data',key),container:join(root,'volumes',project,'app-data','data')};
  const otherVolumes = containerProject ? (await readdir(containerProject)).filter(name => name !== 'app-data' && !name.startsWith('.')) : [];
  if(containerDirectory && await readFile(join(root,'volumes',project,'app-data','ready'),'utf8') !== '1') throw new Error('Container storage is not ready for migration');
  if(!state) {
    const nodeRecords = await populated(nodeDirectory), containerRecords = await populated(containerDirectory) || otherVolumes.length > 0;
    if(nodeRecords && containerRecords) throw new Error('Both runtime formats contain saved data; refusing to choose or overwrite a database');
    const previous = nodeRecords ? 'bundle' : containerRecords ? 'container' : kind;
    state = {version:1,kind:previous,transferable:previous === 'bundle' || (previous === kind ? transferable(plan) : otherVolumes.length === 0 && Boolean(containerDirectory))};
    await save(statePath,state);
  }
  if(state.transaction || state.kind !== kind) {
    if(containerProject) {
      if(await execute(['ps','--quiet','--filter',`label=com.docker.compose.project=${project}`])) throw new Error('Stop the application before migrating its data');
      const name = `${project}_app-data-disk-v1`;
      const volumes = (await execute(['volume','ls','--format','{{.Name}}'])).split('\n');
      if(volumes.includes(name)) {
        const volume = JSON.parse(await execute(['volume','inspect',name]))[0];
        if(volume?.Driver !== 'local' || volume.Options?.device !== paths.container || volume.Options?.o !== 'bind' || volume.Options?.type !== 'none') throw new Error('Application volume points to unexpected storage');
      }
    }
  }
  async function recover() {
    const tx = state.transaction; if(!tx) return;
    const source = paths[state.kind], destination = paths[tx.to];
    if(!await exists(source)) throw new Error('Saved application storage is missing; refusing an empty replacement');
    const stage = join(stateDirectory,'copy-'+tx.id), stagedData = join(stage,'data'), backup = join(stateDirectory,'backup-'+tx.id);
    if(tx.phase === 'copying') {
      await rm(stage,{recursive:true,force:true}); await mkdir(stage,{mode:0o700});
      if(state.kind === 'container') { await mkdir(stagedData,{mode:0o700}); await copy(source,stagedData,{execute}); }
      else await cp(source,stagedData,{recursive:true,dereference:false,verbatimSymlinks:true,errorOnExist:true,force:false});
      await privateDirectory(stagedData);
      const stat = await lstat(stagedData); tx.phase = 'ready'; tx.ino = stat.ino; tx.dev = stat.dev;
      await save(statePath,state); await checkpoint('after-copy');
    }
    const staged = await exists(stagedData), current = await exists(destination), previous = await exists(backup);
    if(staged) {
      if(staged.ino !== tx.ino || staged.dev !== tx.dev || !staged.isDirectory() || staged.isSymbolicLink()) throw new Error('Migration staging directory changed');
      if(previous && current) throw new Error('Ambiguous interrupted application migration');
      if(current) { await rename(destination,backup); await checkpoint('after-backup'); }
      await rename(stagedData,destination); await checkpoint('after-install');
    } else if(!current || current.ino !== tx.ino || current.dev !== tx.dev || !current.isDirectory() || current.isSymbolicLink()) throw new Error('Installed migration data is missing or changed');
    state = {version:1,kind:tx.to,transferable:tx.transferable};
    await save(statePath,state); await rm(stage,{recursive:true,force:true});
  }
  await recover();
  if(recoverOnly) return;
  if(state.kind !== kind) {
    if(!state.transferable || (kind === 'container' && !transferable(plan))) {
      if(otherVolumes.length || await populated(paths.bundle) || (containerDirectory && await populated(paths.container))) throw new Error('This runtime change needs an explicit database migration; existing data was preserved');
      state = {version:1,kind,transferable:kind === 'bundle' || transferable(plan)};
      await save(statePath,state); return {kind,dataDirectory:paths[kind]};
    }
    state.transaction = {id:randomBytes(16).toString('hex'),to:kind,transferable:kind === 'bundle' || transferable(plan),phase:'copying'};
    await save(statePath,state); await checkpoint('before-copy'); await recover();
  } else if(kind === 'container' && state.transferable !== transferable(plan)) {
    state.transferable = transferable(plan); await save(statePath,state);
  }
  return {kind:state.kind, dataDirectory:paths[kind]};
}
