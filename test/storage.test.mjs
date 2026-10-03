import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { storageRoot, privateDirectory, applicationData, persistentVolumes } from '../src/storage.mjs';

const project = 'pods-'+'a'.repeat(24), image = 'sha256:'+'b'.repeat(64);
const plan = {services:{web:{image,volumes:[{name:'records',target:'/data'}]}}};
async function fixture(t) { const root=await mkdtemp(join(tmpdir(),'pods-storage-'));t.after(()=>rm(root,{recursive:true,force:true}));return root; }
function engine(initial={}) {
  const volumes={...initial}, calls=[];
  return {volumes,calls,execute:async args=>{calls.push(args);
    if(args[0]==='volume'&&args[1]==='ls')return Object.keys(volumes).join('\n');
    if(args[0]==='volume'&&args[1]==='inspect')return JSON.stringify([volumes[args[2]]]);
    if(args[0]==='ps')return '';
    if(args[0]==='create')return 'helper';
    if(args[0]==='rm')return '';
    throw new Error('Unexpected Docker call');
  }};
}

test('provider storage uses persistent workspaces and migrates only the selected application once',async t=>{
  assert.equal(storageRoot('github','/home/user'),'/workspaces/.pods-launch');
  assert.equal(storageRoot('google','/home/user'),'/home/user/.local/share/pods-launch');
  const root=await fixture(t),old=join(root,'old'),next=join(root,'next');
  await mkdir(join(old,'data','counter'),{recursive:true});await mkdir(next);
  await writeFile(join(old,'data','counter','records.json'),'[42]');
  const dir=await applicationData(next,'counter',old);assert.equal(await readFile(join(dir,'records.json'),'utf8'),'[42]');
  await writeFile(join(dir,'records.json'),'[43]');await applicationData(next,'counter',old);
  assert.equal(await readFile(join(dir,'records.json'),'utf8'),'[43]');
  assert.equal(await readFile(join(old,'data','counter','records.json'),'utf8'),'[42]');
});

test('managed storage rejects traversal and symlink destinations',async t=>{
  const root=await fixture(t);await mkdir(join(root,'outside'));await symlink(join(root,'outside'),join(root,'volumes'));
  await assert.rejects(()=>privateDirectory(root,'..'),/Invalid/);
  await assert.rejects(()=>persistentVolumes(plan,project,root,{execute:engine().execute}),/Unsafe/);
});

test('database files survive loss of Docker volume metadata and legacy data is retained',async t=>{
  const root=await fixture(t),oldName=project+'_records';
  const mock=engine({[oldName]:{Labels:{'com.docker.compose.project':project,'com.docker.compose.volume':'records'}}});
  let copies=0;
  const transfer=async()=>{copies++;const mounts=mock.calls.find(a=>a.some(x=>x.startsWith('type=bind,')));const mount=mounts.find(a=>a.startsWith('type=bind,'));const path=/src=([^,]+),/.exec(mount)[1];await writeFile(join(path,'db'),'record 42');};
  const first=await persistentVolumes(plan,project,root,{execute:mock.execute,transfer});
  const path=first.records.driver_opts.device;assert.equal(await readFile(join(path,'db'),'utf8'),'record 42');
  assert.equal(copies,1);assert.ok(mock.volumes[oldName]);assert.ok(!mock.calls.some(a=>a[0]==='start'||a[0]==='run'||a[1]==='rm'));
  const next=await persistentVolumes(plan,project,root,{execute:mock.execute,transfer});assert.deepEqual(next,first);assert.equal(copies,1);
  assert.equal(next.records.driver_opts.o,'bind');
});

test('wrong volume identity and interrupted migration fail without creating an empty replacement',async t=>{
  const root=await fixture(t),oldName=project+'_records';
  const wrong=engine({[project+'_records-disk-v1']:{Driver:'local',Options:{device:'/outside',o:'bind',type:'none'}}});
  await assert.rejects(()=>persistentVolumes(plan,project,root,{execute:wrong.execute}),/unexpected storage/);
  const mock=engine({[oldName]:{Labels:{'com.docker.compose.project':project,'com.docker.compose.volume':'records'}}});
  await assert.rejects(()=>persistentVolumes(plan,project,root,{execute:mock.execute,transfer:async()=>{throw new Error('Disk full');}}),/Disk full/);
  assert.ok(mock.volumes[oldName]);assert.equal(mock.calls.at(-1)[0],'rm');
  const inUse=async args=>args[0]==='ps'?'running-container':mock.execute(args);
  await assert.rejects(()=>persistentVolumes(plan,project,root,{execute:inUse}),/Stop the existing/);
});
