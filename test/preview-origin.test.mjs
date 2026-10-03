import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepare } from '../scripts/prepare.mjs';
import { createApp } from '../src/server.mjs';
import { Store } from '../src/store.mjs';

test('different products get distinct preview origins; versions and new sessions retain the same origin and data',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pods-origins-')),secret='ab'.repeat(32),configs=[];
 const manifest=await prepare('examples/notes',root);
 for(const [id,dataKey] of [['notes-v2',manifest.id],['second-app','second-app']])await writeFile(join(root,'artifacts',id+'.json'),JSON.stringify({...manifest,id,dataKey}));
 const provider={validate:async()=>({id:'same-compute',name:'test'}),launch:async(token,config)=>{configs.push(config);return {environment:'same-environment',previewUrl:`https://same-environment-${config.port}.app.github.dev`};}};
 let instance,original;
 try{
  for(const restart of [false,true]){
   instance=await createApp({data:root,secret,providers:{github:provider}});
   await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${instance.server.address().port}`;
   const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
   const request=(path,value)=>fetch(origin+path,{method:value===undefined?'GET':'POST',headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:value===undefined?undefined:JSON.stringify(value)});
   assert.equal((await request('/api/connections/github',{token:'t'.repeat(30)})).status,200);
   const addresses=[];
   for(const appId of [manifest.id,'second-app','notes-v2']){
    const response=await request('/api/launches',{provider:'github',appId});assert.equal(response.status,202);const launch=await response.json();
    await Promise.all(instance.jobs.values());const config=configs.at(-1),current=await(await request('/api/launches/'+launch.id)).json();
    addresses.push(new URL(current.previewUrl).origin);
    assert.equal(launch.port,config.port);assert.ok(config.port>=20000&&config.port<=29999);
    assert.equal(launch.computeKey,undefined);
    assert.equal(config.dataKey,appId==='second-app'?'second-app':manifest.id);
    assert.equal((await fetch(origin+'/api/agent/'+launch.id,{method:'POST',headers:{Authorization:'Bearer '+config.token},body:JSON.stringify({status:'stopped'})})).status,200);
   }
   assert.notEqual(addresses[0],addresses[1],'unrelated applications must not share browser storage');
   assert.equal(addresses[0],addresses[2],'a new artifact must retain its product origin');
   if(restart)assert.deepEqual(addresses,original);else original=addresses;
   for(const entry of instance.store.list('launch'))instance.store.delete('launch',entry.id);
   for(const entry of instance.store.list('connection'))instance.store.delete('connection',entry.id);
   await new Promise(resolve=>instance.server.close(resolve));await instance.closeResources();instance=null;
  }
 }finally{if(instance){await new Promise(resolve=>instance.server.close(resolve));await instance.closeResources();}await rm(root,{recursive:true,force:true});}
});

test('port reservations resolve collisions, stay scoped to compute accounts and fail closed when exhausted',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pods-port-collisions-'));let store=new Store(root,'ab'.repeat(32));
 try{
  const first=store.previewPort('account-a','first');
  // Force the next application's natural starting slot to be occupied.
  const natural=store.previewPort('account-b','second');
  if(natural!==first)store.db.prepare('INSERT INTO preview_ports VALUES (?,?,?)').run('account-a','occupied',natural);
  const collision=store.previewPort('account-a','second');assert.notEqual(collision,natural);assert.notEqual(collision,first);
  store.close();store=new Store(root,'ab'.repeat(32));
  assert.equal(store.previewPort('account-a','second'),collision);assert.equal(store.previewPort('account-b','second'),natural);
  store.db.exec('BEGIN');const insert=store.db.prepare('INSERT INTO preview_ports VALUES (?,?,?)');
  for(let port=20000;port<30000;port++)insert.run('full','app-'+port,port);
  store.db.exec('COMMIT');
  assert.throws(()=>store.previewPort('full','another'),error=>error.status===409);
  assert.equal(store.previewPort('full','app-20000'),20000);
  assert.equal(store.previewPort('account-a','first'),first,'failed allocation must leave the store usable');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
