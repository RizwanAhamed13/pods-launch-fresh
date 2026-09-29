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
 let r=await request('/api/connections/github',{token:'a'.repeat(30)},{'X-Pods-CSRF':'bad'});assert.equal(r.status,403);
 r=await request('/api/connections/github',{token:'a'.repeat(30)},{Origin:'https://evil.example'});assert.equal(r.status,403);
 r=await request('/api/connections/github',{token:'a'.repeat(30)});assert.equal(r.status,200);
 r=await request('/api/launches',{provider:'github',appId:'field-notes'});assert.equal(r.status,202);const launch=await r.json();assert.equal(launch.tokenHash,undefined);assert.equal(launch.owner,undefined);
 r=await request('/api/launches',{provider:'github',appId:'field-notes'});assert.equal((await r.json()).id,launch.id);assert.equal(launchCount,1);
 assert.equal((await fetch(origin+'/api/launches/'+launch.id)).status,404);
 assert.equal((await fetch(origin+'/api/agent/'+launch.id+'/artifact')).status,401);
 r=await fetch(origin+'/api/agent/'+launch.id+'/artifact',{headers:{Authorization:'Bearer '+config.token}});assert.equal(r.status,200);
 r=await fetch(origin+'/api/agent/'+launch.id,{method:'POST',headers:{Authorization:'Bearer '+config.token},body:JSON.stringify({status:'ready',previewUrl:'https://evil.example'})});assert.equal(r.status,200);
 const current=await(await request('/api/launches/'+launch.id)).json();assert.equal(current.previewUrl,'https://test-8080.app.github.dev');assert.ok(current.totalMs>=0);
 const persisted=await readFile(join(root,'pods.sqlite'));assert.ok(!persisted.includes(Buffer.from('a'.repeat(30))));
 }finally{release();await pending;await sleep(10);await close(server);await rm(root,{recursive:true,force:true});}
});
