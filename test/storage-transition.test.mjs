import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,cp,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {transitionApplicationData} from '../src/storage-transition.mjs';
import {copyApplicationData} from '../src/storage.mjs';
const key='migration-counter';
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const plan={services:{web:{image:'sha256:'+'a'.repeat(64),volumes:[{name:'app-data',target:'/data'}]}}};
const execute=async args=>{if(args[0]==='ps'||args[0]==='volume'&&args[1]==='ls')return '';throw Error('Unexpected Docker operation');};
const copy=async(source,target)=>cp(source,target,{recursive:true,dereference:false});
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'pods-transition-'));t.after(()=>rm(root,{recursive:true,force:true}));const node=join(root,'data',key),container=join(root,'volumes',project,'app-data','data');await mkdir(node,{recursive:true});await mkdir(container,{recursive:true});await writeFile(join(container,'..','ready'),'1');return{root,node,container};}
const read=path=>readFile(join(path,'counter.db'),'utf8');
const write=(path,value)=>writeFile(join(path,'counter.db'),value);

test('legacy container records move to a bundle and return without resetting either latest value',async t=>{
 const {root,node,container}=await fixture(t);await write(container,'record 1');
 await transitionApplicationData(root,key,'bundle',{execute,copy});assert.equal(await read(node),'record 1');
 await write(node,'record 2');await transitionApplicationData(root,key,'container',{plan,execute,copy});assert.equal(await read(container),'record 2');
 await write(container,'record 3');await transitionApplicationData(root,key,'bundle',{execute,copy});assert.equal(await read(node),'record 3');
 const backups=(await readdir(join(root,'storage-state',key))).filter(x=>x.startsWith('backup-'));assert.equal(backups.length,3);
 assert.equal(await read(container),'record 3');
});

test('conflicting legacy databases are preserved and require an explicit choice',async t=>{
 const {root,node,container}=await fixture(t);await write(node,'node record');await write(container,'container record');
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy}),/Both runtime formats contain saved data/);
 assert.equal(await read(node),'node record');assert.equal(await read(container),'container record');
});

for(const point of ['before-copy','after-copy','after-backup','after-install'])test('migration resumes after interruption at '+point,async t=>{
 const {root,node,container}=await fixture(t);await write(container,'saved record');
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy,checkpoint:async phase=>{if(phase===point)throw Error('Injected interruption');}}),/Injected interruption/);
 assert.equal(await read(container),'saved record');
 await transitionApplicationData(root,key,'bundle',{execute,copy});assert.equal(await read(node),'saved record');
 await write(node,'new record');await transitionApplicationData(root,key,'bundle',{execute,copy});assert.equal(await read(node),'new record');
});

test('a partial copy never replaces data and is safely retried',async t=>{
 const {root,node,container}=await fixture(t);await write(container,'saved record');
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy:async(source,target)=>{await writeFile(join(target,'partial'),'unfinished');throw Error('Disk full');}}),/Disk full/);
 assert.equal(await read(container),'saved record');assert.deepEqual(await readdir(node),[]);
 await transitionApplicationData(root,key,'bundle',{execute,copy});assert.equal(await read(node),'saved record');assert.deepEqual(await readdir(node),['counter.db']);
});

test('active containers, unexpected volume bindings and symlink destinations block migration',async t=>{
 const {root,node,container}=await fixture(t);await write(container,'saved');
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute:async()=> 'running',copy}),/Stop the application/);
 const wrong=async args=>args[0]==='ps'?'':args[1]==='ls'?project+'_app-data-disk-v1':JSON.stringify([{Driver:'local',Options:{device:'/unrelated',o:'bind',type:'none'}}]);
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute:wrong,copy}),/unexpected storage/);
 await rm(node,{recursive:true});await symlink(container,node);
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy}),/Unsafe/);assert.equal(await read(container),'saved');
});

test('an opaque database topology cannot silently become an empty bundle',async t=>{
 const {root,node,container}=await fixture(t);const complex={services:{web:{},database:{}}};
 await transitionApplicationData(root,key,'container',{plan:complex,execute,copy});await write(container,'database record');
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy}),/explicit database migration/);
 assert.equal(await read(container),'database record');assert.deepEqual(await readdir(node),[]);
});

test('journal path injection cannot reach unrelated data',async t=>{
 const {root,node,container}=await fixture(t);await write(container,'saved');await transitionApplicationData(root,key,'container',{plan,execute,copy});
 const state=join(root,'storage-state',key,'state.json');await writeFile(state,JSON.stringify({version:1,kind:'container',transferable:true,transaction:{id:'../../outside',to:'bundle',transferable:true,phase:'copying'}}));
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy}),/Invalid application migration journal/);
 assert.equal(await read(container),'saved');assert.deepEqual(await readdir(node),[]);
});

test('protected-file copy never starts a helper and cleans resources on failure',async t=>{
 const {root,container}=await fixture(t),target=join(root,'staging');await mkdir(target);await write(container,'original');
 const calls=[],image='sha256:'+'b'.repeat(64),helper='c'.repeat(64);
 await assert.rejects(()=>copyApplicationData(container,target,{execute:async(args,options)=>{calls.push(args);if(args[0]==='import'){assert.equal(options.input.length,1024);return image;}if(args[0]==='create')return helper;if(args[0]==='cp')throw Error('Copy interrupted');return '';}}),/Copy interrupted/);
 assert.ok(!calls.some(args=>['start','run','exec'].includes(args[0])));assert.deepEqual(calls.slice(-2),[['rm',helper],['image','rm',image]]);assert.equal(await read(container),'original');
 await writeFile(join(target,'keep'),'do not replace');await assert.rejects(()=>copyApplicationData(container,target,{execute}),/empty staging/);assert.equal(await readFile(join(target,'keep'),'utf8'),'do not replace');
});

for(const point of ['before-copy','after-copy','after-backup','after-install'])test('container destination recovers before volume initialization at '+point,async t=>{
 const {root,node,container}=await fixture(t);await write(node,'bundle record');
 await assert.rejects(()=>transitionApplicationData(root,key,'container',{plan,execute,copy,checkpoint:async phase=>{if(phase===point)throw Error('Injected interruption');}}),/Injected interruption/);
 await transitionApplicationData(root,key,'container',{plan,execute,copy,recoverOnly:true});
 assert.equal(await read(container),'bundle record');
 await transitionApplicationData(root,key,'container',{plan,execute,copy});assert.equal(await read(container),'bundle record');
});

test('a stateless container may change runtime without manufacturing a database',async t=>{
 const {root,node,container}=await fixture(t);await rm(join(container,'..'),{recursive:true});
 await transitionApplicationData(root,key,'container',{plan:{services:{web:{}}},execute,copy});
 await transitionApplicationData(root,key,'bundle',{execute,copy});assert.deepEqual(await readdir(node),[]);
});

test('a known bundle database directory is never silently recreated after deletion',async t=>{
 const {root,node}=await fixture(t);await write(node,'saved');await transitionApplicationData(root,key,'bundle',{execute,copy});await rm(node,{recursive:true});
 await assert.rejects(()=>transitionApplicationData(root,key,'bundle',{execute,copy}),/Saved application storage is missing/);
});
