import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import { prepare } from '../scripts/prepare.mjs';
import { decodeArtifact, run } from '../src/runner.mjs';
import { digest, sleep } from '../src/util.mjs';
import { Store } from '../src/store.mjs';
import { createApp } from '../src/server.mjs';
const temp=()=>mkdtemp(join(tmpdir(),'pods-test-'));
async function listen(server) { await new Promise(r=>server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${server.address().port}`; }
const close=server=>new Promise(r=>server.close(r));
test('server build is reusable, deterministic and bundles TypeScript',async()=>{
 const root=await temp();try{const a=await prepare('examples/notes',root),b=await prepare('examples/notes',root);assert.equal(a.sha256,b.sha256);const bytes=await readFile(join(root,'artifacts',a.sha256+'.gz'));const p=decodeArtifact(bytes,a.sha256);assert.equal(p.entry,'app.cjs');assert.equal(p.files.length,2);assert.ok(a.bytes<20000);}finally{await rm(root,{recursive:true,force:true});}
});
test('artifact corruption, path escapes, collisions and wrong formats fail closed',()=>{
 const base={format:1,entry:'app.cjs',healthPath:'/health',files:[{path:'app.cjs',data:'eA=='}]};
 for(const path of ['../outside','/etc/passwd','x/../../outside','x\\..\\a','a//b','a/./b']){const b=gzipSync(JSON.stringify({...base,files:[...base.files,{path,data:''}]}));assert.throws(()=>decodeArtifact(b,digest(b)),/Unsafe/);}
 for(const mod of [{files:[...base.files,...base.files]},{format:2},{healthPath:'//evil.com'},{files:[]}]){const b=gzipSync(JSON.stringify({...base,...mod}));assert.throws(()=>decodeArtifact(b,digest(b)));}
 const b=gzipSync(JSON.stringify(base));assert.throws(()=>decodeArtifact(b,'0'.repeat(64)),/integrity/);
});
test('stored provider credentials are authenticated ciphertext',async()=>{
 const root=await temp(),s=new Store(root,'ab'.repeat(32));try{const encrypted=s.seal('private-provider-token');assert.equal(s.open(encrypted),'private-provider-token');assert.ok(!encrypted.includes('private'));const b=Buffer.from(encrypted,'base64');b[15]^=1;assert.throws(()=>s.open(b.toString('base64')));}finally{s.close();await rm(root,{recursive:true,force:true});}
});
test('real prepared app starts, saves data on compute, stops, and reuses artifact cache',async()=>{
 const root=await temp(),manifest=await prepare('examples/notes',root),bytes=await readFile(join(root,'artifacts',manifest.sha256+'.gz'));
 const events=[];let stop=false;
 const server=createServer(async(req,res)=>{if(req.url==='/artifact'){res.end(bytes);return;}let b='';for await(const p of req)b+=p;events.push(JSON.parse(b));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({action:stop?'stop':'continue'}));});
 const origin=await listen(server),config={id:randomBytes(24).toString('base64url'),appId:manifest.id,sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'secret',port:18081,expiresAt:Date.now()+60000};
 let running;
 try{
 running=await run(config,{root:join(root,'compute')});assert.ok(running.timings.runtimeReadyMs<20000);assert.equal(running.timings.cacheHit,false);assert.deepEqual(events.map(e=>e.status),['downloading','starting','ready']);
 const note=await fetch('http://127.0.0.1:18081/api/notes',{method:'POST',body:JSON.stringify({title:'Lives on compute',body:'No server-side app execution'})});assert.equal(note.status,200);assert.match(await readFile(join(running.dataDir,'notes.json'),'utf8'),/Lives on compute/);
 await running.stop();await sleep(200);
 running=await run({...config,id:randomBytes(24).toString('base64url')},{root:join(root,'compute')});assert.equal(running.timings.cacheHit,true);const saved=await(await fetch('http://127.0.0.1:18081/api/notes')).json();assert.equal(saved.notes.length,1);
 }finally{await running?.stop();await close(server);await sleep(100);await rm(root,{recursive:true,force:true});}
});
test('unhealthy app never reports ready; inherited provider tokens do not reach app',async()=>{
 const root=await temp();let code='require("node:fs").writeFileSync(process.env.PODS_APP_DATA+"/env.json",JSON.stringify(process.env));process.exit(1)';
 const bytes=gzipSync(JSON.stringify({format:1,entry:'app.cjs',healthPath:'/health',files:[{path:'app.cjs',data:Buffer.from(code).toString('base64')}]}));const events=[];
 const s=createServer(async(req,res)=>{if(req.url==='/a'){res.end(bytes);return;}let b='';for await(const p of req)b+=p;events.push(JSON.parse(b));res.end('{}');});const origin=await listen(s);process.env.GH_TOKEN='must-not-reach-child';
 try{await assert.rejects(run({id:randomBytes(24).toString('base64url'),appId:'env-test',sha256:digest(bytes),artifactUrl:origin+'/a',callbackUrl:origin+'/c',token:'secret',port:18082,expiresAt:Date.now()+60000},{root}),/exited/);assert.ok(!events.some(x=>x.status==='ready'));const env=JSON.parse(await readFile(join(root,'data/env-test/env.json'),'utf8'));assert.equal(env.GH_TOKEN,undefined);}finally{delete process.env.GH_TOKEN;await close(s);await rm(root,{recursive:true,force:true});}
});
test('API enforces browser ownership, CSRF, capability auth and idempotent launches',async()=>{
 const root=await temp();await prepare('examples/notes',root);let config,launchCount=0,release;const pending=new Promise(r=>release=r);
 const provider={validate:async()=>({name:'test-user'}),launch:async(token,c,update)=>{launchCount++;config=c;await update({status:'delivering',providerReadyAt:Date.now(),previewUrl:'https://test-8080.app.github.dev'});await pending;return{};}};
 const {server,store}=await createApp({data:root,secret:'ac'.repeat(32),providers:{github:provider,google:provider}});const origin=await listen(server);
 const r=await fetch(origin+'/api/me'),cookie=r.headers.get('set-cookie').split(';')[0],me=await r.json();
 const request=(path,body,extra={})=>fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body)});
 try{
 let r=await request('/api/connections/github',{token:'a'.repeat(30)},{'X-Pods-CSRF':'bad'});assert.equal(r.status,403);assert.equal((await r.json()).code,'SESSION_CHANGED');assert.equal(store.list('connection').length,0);
 r=await request('/api/connections/github',{token:'a'.repeat(30)},{Origin:'https://evil.example'});assert.equal(r.status,403);assert.equal((await r.json()).code,undefined);assert.equal(store.list('connection').length,0);
 r=await request('/api/connections/github',{token:'a'.repeat(30)});assert.equal(r.status,200);
 r=await request('/api/launches',{provider:'github',appId:'field-notes'});assert.equal(r.status,202);const launch=await r.json();assert.equal(launch.tokenHash,undefined);assert.equal(launch.owner,undefined);
 r=await request('/api/launches',{provider:'github',appId:'field-notes'});assert.equal((await r.json()).id,launch.id);assert.equal(launchCount,1);
 assert.equal((await fetch(origin+'/api/launches/'+launch.id)).status,404);
 assert.equal((await fetch(origin+'/api/agent/'+launch.id+'/artifact')).status,401);
 r=await fetch(origin+'/api/agent/'+launch.id+'/artifact',{headers:{Authorization:'Bearer '+config.token}});assert.equal(r.status,200);
 const imageBytes=Buffer.from('prepared image bytes'),imageHash=digest(imageBytes);
 await mkdir(join(root,'images'));await writeFile(join(root,'images',imageHash+'.gz'),imageBytes);
 store.put('launch',launch.id,{...store.get('launch',launch.id),images:[{sha256:imageHash,bytes:imageBytes.length}]});
 const imageUrl=origin+'/api/agent/'+launch.id+'/artifact/images/'+imageHash;
 assert.equal((await fetch(imageUrl)).status,401);
 r=await fetch(imageUrl,{headers:{Authorization:'Bearer '+config.token}});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),imageBytes);
 assert.equal((await fetch(imageUrl.replace(imageHash,'f'.repeat(64)),{headers:{Authorization:'Bearer '+config.token}})).status,404);
 r=await fetch(origin+'/api/agent/'+launch.id,{method:'POST',headers:{Authorization:'Bearer '+config.token},body:JSON.stringify({status:'ready',previewUrl:'https://evil.example',timings:{imageDownloadMs:123,imageLoadMs:45,imageCacheCheckMs:6,imageArchiveCacheHits:1,imagesMs:174,imageCacheHits:-1,runtimeRetries:600000,unknown:'secret'}})});assert.equal(r.status,200);
 const current=await(await request('/api/launches/'+launch.id)).json();assert.equal(current.previewUrl,'https://test-8080.app.github.dev');assert.ok(current.totalMs>=0);assert.deepEqual(current.timings,{imageDownloadMs:123,imageLoadMs:45,imageCacheCheckMs:6,imageArchiveCacheHits:1,imagesMs:174,cacheHit:false});
 const persisted=await readFile(join(root,'pods.sqlite'));assert.ok(!persisted.includes(Buffer.from('a'.repeat(30))));
 }finally{release();await pending;await sleep(10);await close(server);await rm(root,{recursive:true,force:true});}
});
test('unwritable home falls back to session storage and reports its durability',async()=>{
 const root=await temp(),manifest=await prepare('examples/notes',root),bytes=await readFile(join(root,'artifacts',manifest.sha256+'.gz'));const {chmod}=await import('node:fs/promises');
 const locked=join(root,'locked');await mkdir(locked);await chmod(locked,0o500);let running;const events=[];
 const s=createServer(async(req,res)=>{if(req.url==='/a')return res.end(bytes);let b='';for await(const p of req)b+=p;events.push(JSON.parse(b));res.end('{}');});const origin=await listen(s);
 try{
 running=await run({id:randomBytes(24).toString('base64url'),appId:manifest.id,sha256:manifest.sha256,artifactUrl:origin+'/a',callbackUrl:origin+'/c',token:'secret',port:18084,expiresAt:Date.now()+60000},{root:join(locked,'runtime'),fallbackRoot:join(root,'temporary')});
 assert.equal(running.storageMode,'ephemeral');assert.ok(running.dataDir.startsWith(join(root,'temporary')));assert.equal(events.at(-1).storageMode,'ephemeral');const reply=await(await fetch('http://127.0.0.1:18084/api/notes')).json();assert.equal(reply.storageMode,'ephemeral');
 }finally{await running?.stop();await close(s);await chmod(locked,0o700);await sleep(100);await rm(root,{recursive:true,force:true});}
});
test('one compute account cannot be launched concurrently from separate browser sessions',async()=>{
 const root=await temp();await prepare('examples/notes',root);const configs=[];
 const provider={validate:async token=>({id:token[0],name:'same-display-name'}),launch:async(token,config,update)=>{configs.push(config);await update({status:'delivering',providerReadyAt:Date.now()});return{};}};
 const {server,store}=await createApp({data:root,secret:'ad'.repeat(32),providers:{github:provider,google:provider}}),origin=await listen(server);
 async function browser(token,providerName='google'){
  const response=await fetch(origin+'/api/me'),cookie=response.headers.get('set-cookie').split(';')[0],me=await response.json();
  const request=(path,value)=>fetch(origin+path,{method:value===undefined?'GET':'POST',headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:value===undefined?undefined:JSON.stringify(value)});
  assert.equal((await request('/api/connections/'+providerName,{token:token.repeat(30)})).status,200);return request;
 }
 const launch=(request,provider='google')=>request('/api/launches',{provider,appId:'field-notes'});
 try{
  const first=await browser('a'),second=await browser('a'),otherAccount=await browser('b'),otherProvider=await browser('a','github');
  let response=await launch(first);assert.equal(response.status,202);const active=await response.json();
  assert.equal((await(await launch(first)).json()).id,active.id);
  response=await launch(second);assert.equal(response.status,409);assert.match((await response.json()).error,/another session/);assert.equal(configs.length,1);
  assert.equal((await second('/api/launches/'+active.id)).status,404);
  assert.equal((await second('/api/launches/'+active.id+'/stop',{})).status,404);
  assert.deepEqual(await(await second('/api/launches')).json(),[]);
  assert.equal(active.computeKey,undefined);assert.ok(store.get('launch',active.id).computeKey);
  assert.equal((await launch(otherAccount)).status,202);assert.equal((await launch(otherProvider,'github')).status,202);
  // Disconnect/credential expiry does not free a still-running application's account lock.
  const stored=store.get('launch',active.id);store.delete('connection',stored.owner+':google');
  await first('/api/launches/'+active.id+'/stop',{});assert.equal((await launch(second)).status,409);
  const config=configs.find(c=>c.id===active.id);
  assert.equal((await fetch(origin+'/api/agent/'+active.id,{method:'POST',headers:{Authorization:'Bearer '+config.token},body:JSON.stringify({status:'stopped'})})).status,200);
  response=await launch(second);assert.equal(response.status,202);assert.notEqual((await response.json()).id,active.id);
 }finally{await close(server);await rm(root,{recursive:true,force:true});}
});
test('existing ready previews gain durable private account locks when the server upgrades',async()=>{
 const root=await temp(),secret='ae'.repeat(32);await prepare('examples/notes',root);
 const seed=new Store(root,secret),id=randomBytes(24).toString('base64url');
 seed.put('connection','old-browser:google',{provider:'google',identityId:'same-compute',token:seed.seal('existing-token'),expiresAt:Date.now()+60000});
 seed.put('launch',id,{id,owner:'old-browser',provider:'google',appId:'field-notes',status:'ready',lastSeenAt:Date.now(),expiresAt:Date.now()+60000});seed.close();
 let instance;
 try{
  for(const restart of [false,true]){
   instance=await createApp({data:root,secret,providers:{google:{validate:async()=>({id:'same-compute',name:'renamed-account'}),launch:async()=>assert.fail('Conflicting launch must not reach the provider')}}});
   const origin=await listen(instance.server),initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
   const request=(path,value)=>fetch(origin+path,{method:'POST',headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:JSON.stringify(value)});
   assert.equal((await request('/api/connections/google',{token:'a'.repeat(30)})).status,200);
   assert.equal((await request('/api/launches',{provider:'google',appId:'field-notes'})).status,409);
   assert.equal(instance.store.get('launch',id).status,'ready');assert.ok(instance.store.get('launch',id).computeKey);
   if(!restart)instance.store.delete('connection','old-browser:google');
   await close(instance.server);await instance.closeResources();instance=null;
  }
 }finally{if(instance){await close(instance.server);await instance.closeResources();}await rm(root,{recursive:true,force:true});}
});
