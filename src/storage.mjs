import { mkdir, lstat, mkdtemp, rename, writeFile, readFile, cp, rmdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { docker } from './containers.mjs';
import { randomBytes } from 'node:crypto';

export function storageRoot(provider, home = homedir()) {
  return provider === 'github' ? '/workspaces/.pods-launch' : join(home, '.local/share/pods-launch');
}

export async function privateDirectory(root, ...segments) {
  let path = root;
  for (const segment of [null, ...segments]) {
    if (segment !== null) {
      if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid storage directory');
      path = join(path, segment);
      await mkdir(path, {mode:0o700}).catch(e => { if (e.code !== 'EEXIST') throw e; });
    }
    const s = await lstat(path);
    if (!s.isDirectory() || s.isSymbolicLink() || (process.getuid && s.uid !== process.getuid())) throw new Error('Unsafe application storage directory');
  }
  return path;
}

// A Codespace rebuild keeps /workspaces, but replaces its home directory.
// Copy only this application's older data, never the user's other home files.
export async function applicationData(root, key, legacyRoot) {
  const parent = await privateDirectory(root, 'data');
  const target = join(parent, key);
  try { await lstat(target); return await privateDirectory(parent, key); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (legacyRoot && legacyRoot !== root) {
    const source = join(legacyRoot, 'data', key);
    const old = await lstat(source).catch(e => { if (e.code !== 'ENOENT') throw e; });
    if (old) {
      if (!old.isDirectory() || old.isSymbolicLink() || (process.getuid && old.uid !== process.getuid())) throw new Error('Unsafe previous application storage');
      const stage = await mkdtemp(join(parent, '.migrate-'));
      await cp(source, join(stage, 'data'), {recursive:true, dereference:false, verbatimSymlinks:true, errorOnExist:true, force:false});
      await rename(join(stage, 'data'), target);
      await rmdir(stage);
      return target;
    }
  }
  return privateDirectory(parent, key);
}

async function inspectVolume(name, execute) {
  const names = (await execute(['volume','ls','--format','{{.Name}}'])).split('\n');
  return names.includes(name) ? JSON.parse(await execute(['volume','inspect',name]))[0] : null;
}

// Both containers are stopped: Docker streams the archive between mounts while
// retaining database uid/gid. No application or helper executable is run.
export async function copyVolume(sourceContainer, targetContainer) {
  const options = {env:{PATH:process.env.PATH,HOME:process.env.HOME},stdio:['pipe','pipe','pipe']};
  const source = spawn('docker',['--host','unix:///var/run/docker.sock','cp',`${sourceContainer}:/pods-source/.`,'-'],options);
  const target = spawn('docker',['--host','unix:///var/run/docker.sock','cp','--archive','-',`${targetContainer}:/pods-target`],options);
  source.stdin.end(); target.stdout.resume(); let error = '';
  for (const child of [source,target]) child.stderr.on('data', b => { error = (error + b).slice(-1000); });
  const finished = child => new Promise((ok, fail) => { child.once('error',fail); child.once('close',code => code === 0 ? ok() : fail(new Error(`Database migration failed: ${error || code}`))); });
  const timer = setTimeout(() => { source.kill('SIGKILL'); target.kill('SIGKILL'); },180000);
  try { await Promise.all([finished(source),finished(target),pipeline(source.stdout,target.stdin)]); }
  finally { clearTimeout(timer); source.kill(); target.kill(); }
}

export async function persistentVolumes(plan, project, root, {execute = docker, transfer = copyVolume} = {}) {
  if (!/^pods-[a-f0-9]{24}$/.test(project)) throw new Error('Invalid storage project');
  const parent = await privateDirectory(root, 'volumes', project);
  const volumes = {};
  for (const service of Object.values(plan.services)) for (const v of service.volumes || []) {
    if (volumes[v.name]) continue;
    if (!/^[a-z][a-z0-9_-]{0,62}$/.test(v.name)) throw new Error('Invalid storage volume');
    const directory = join(parent,v.name), device = join(directory,'data');
    const name = `${project}_${v.name}-disk-v1`;
    const existing = await inspectVolume(name,execute);
    if (existing && (existing.Driver !== 'local' || existing.Options?.device !== device || existing.Options?.o !== 'bind' || existing.Options?.type !== 'none')) throw new Error('Application volume points to unexpected storage');
    let ready = false;
    try {
      await privateDirectory(parent,v.name);
      ready = await readFile(join(directory,'ready'),'utf8') === '1';
      const s = await lstat(device); if (!s.isDirectory() || s.isSymbolicLink()) throw new Error('Unsafe database storage');
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!ready) {
      if (existing) throw new Error('Database storage is missing; refusing to replace it with an empty database');
      const oldName = `${project}_${v.name}`, old = await inspectVolume(oldName,execute);
      const stage = await mkdtemp(join(parent,'.migrate-'));
      await mkdir(join(stage,'data'),{mode:0o755});
      if (old) {
        if (old.Labels?.['com.docker.compose.project'] !== project || old.Labels?.['com.docker.compose.volume'] !== v.name) throw new Error('Previous database volume has an unexpected owner');
        if (await execute(['ps','--quiet','--filter',`volume=${oldName}`])) throw new Error('Stop the existing application before migrating its database');
        let sourceHelper, targetHelper;
        try {
          const base=['create','--network','none','--read-only','--entrypoint','/__pods_not_executed__'];
          sourceHelper = await execute([...base,'--mount',`type=volume,src=${oldName},dst=/pods-source,readonly,volume-nocopy`,service.image]);
          targetHelper = await execute([...base,'--mount',`type=bind,src=${join(stage,'data')},dst=/pods-target`,service.image]);
          await transfer(sourceHelper,targetHelper);
        } finally { for(const helper of [sourceHelper,targetHelper])if(helper)await execute(['rm',helper]).catch(()=>{}); }
      }
      await writeFile(join(stage,'ready'),'1',{mode:0o600});
      // An empty directory may have been created by the safety check above.
      await rename(stage,directory);
    }
    volumes[v.name] = {name,driver:'local',driver_opts:{type:'none',o:'bind',device}};
  }
  return volumes;
}

// Copy protected application files as the runner's uid without executing any
// image code. The imported image contains only an empty tar archive.
export async function copyApplicationData(source, target, {execute = docker} = {}) {
  if ([source,target].some(path => !path.startsWith('/') || /[,\r\n]/.test(path))) throw new Error('Unsafe storage copy path');
  const stat = await lstat(source);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe source application data');
  await privateDirectory(target);
  if ((await readdir(target)).length) throw new Error('Storage copy requires an empty staging directory');
  let image, helper;
  try {
    image = await execute(['import','--change',`LABEL org.pods.storage-copy=${randomBytes(16).toString('hex')}`,'-'], {input:Buffer.alloc(1024)});
    if (!/^sha256:[a-f0-9]{64}$/.test(image)) throw new Error('Invalid storage helper image');
    helper = await execute(['create','--network','none','--read-only','--entrypoint','/__pods_never_executed__','--mount',`type=bind,src=${source},dst=/pods-source,readonly`,image]);
    if (!/^[a-f0-9]{64}$/.test(helper)) throw new Error('Invalid storage helper container');
    await execute(['cp',`${helper}:/pods-source/.`,target]);
    await privateDirectory(target);
  } finally {
    if (/^[a-f0-9]{64}$/.test(helper || '')) await execute(['rm',helper]).catch(() => {});
    if (/^sha256:[a-f0-9]{64}$/.test(image || '')) await execute(['image','rm',image]).catch(() => {});
  }
}
