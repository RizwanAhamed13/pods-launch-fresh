import test from 'node:test';
import assert from 'node:assert/strict';
import { providers, bootstrap } from '../src/providers.mjs';
import { createApp } from '../src/server.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
test('Codespaces reuses only the configured PODS runtime and delivers over SSH stdin',async()=>{
 const calls=[],updates=[];const token='provider-secret';let execution;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,api:async(path,t,opts)=>{calls.push([path,t,opts]);return {codespaces:[{name:'my-unrelated-work',display_name:'Other',state:'Available'},{name:'my-pods',display_name:'PODS launch',state:'Available'}]};},exec:async(file,args,opts)=>{execution={file,args,opts};}});
 const result=await adapter.github.launch(token,{id:'x',token:'launch-secret'},p=>updates.push(p));
 assert.equal(result.environment,'my-pods');assert.equal(calls.length,1);assert.equal(calls[0][0],'/repos/owner/runtime/codespaces?per_page=100');assert.equal(execution.file,'gh');assert.ok(!execution.args.join(' ').includes(token));assert.ok(!execution.args.join(' ').includes('launch-secret'));assert.match(execution.opts.input,/launch-secret/);assert.equal(execution.opts.env.GH_TOKEN,token);assert.equal(result.previewUrl,'https://my-pods-8080.app.github.dev');assert.equal(updates[1].status,'delivering');
});
test('a running PODS Codespace is preferred over an older provisioning or stopped environment',async()=>{
 let executions=0;const updates=[];
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async(path,token,options)=>{assert.equal(options,undefined);assert.equal(path,'/repos/owner/runtime/codespaces?per_page=100');return {codespaces:[{name:'pending',display_name:'PODS launch',state:'Provisioning'},{name:'stopped',display_name:'PODS launch',state:'Shutdown'},{name:'warm',display_name:'PODS launch',state:'Available'}]};},
  exec:async(file,args)=>{executions++;assert.equal(args[3],'warm');}});
 const result=await adapter.github.launch('token',{},patch=>updates.push(patch));
 assert.equal(result.environment,'warm');assert.equal(executions,1);assert.ok(!updates.some(x=>x.status==='provisioning'));
});
test('an app returns to its saved Codespace even when a different environment is warm',async()=>{
 const calls=[],updates=[];
 const saved={name:'saved-data',display_name:'PODS launch containers',state:'Shutdown',repository:{full_name:'owner/runtime'}};
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async(path,token,options)=>{calls.push([path,options?.method||'GET']);if(path.startsWith('/repos/'))return {codespaces:[{...saved,name:'warm-empty',state:'Available'},saved]};return {...saved,state:options?.method==='POST'?'Available':'Shutdown'};},
  exec:async(file,args)=>assert.equal(args[3],'saved-data')});
 const result=await adapter.github.launch('token',{containerRuntime:true,preferredEnvironment:'saved-data'},p=>updates.push(p));
 assert.equal(result.environment,'saved-data');
 assert.deepEqual(calls,[['/user/codespaces/saved-data','GET'],['/user/codespaces/saved-data/start','POST']]);
 assert.equal(updates.find(p=>p.environment)?.environment,'saved-data');
});
test('a missing, failed or unrelated saved Codespace never silently replaces application data',async()=>{
 for(const kind of ['missing','Failed','Unavailable','wrong-repository','wrong-runtime']){
  let executions=0;const calls=[];
  const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
   api:async(path,token,options)=>{calls.push([path,options?.method||'GET']);if(path.startsWith('/repos/'))return {codespaces:[{name:'warm-empty',display_name:'PODS launch',state:'Available'}]};if(kind==='missing')throw Object.assign(new Error('Not found'),{status:404});return {name:'saved-data',display_name:kind==='wrong-runtime'?'Other':'PODS launch',state:['Failed','Unavailable'].includes(kind)?kind:'Available',repository:{full_name:kind==='wrong-repository'?'other/repo':'owner/runtime'}};},
   exec:async()=>{executions++;}});
  await assert.rejects(adapter.github.launch('token',{preferredEnvironment:'saved-data'},()=>{}),/saved Codespace/i);
  assert.equal(executions,0);assert.deepEqual(calls,[['/user/codespaces/saved-data','GET']]);
 }
});
test('retrying a pending PODS Codespace waits for it instead of creating another environment',async()=>{
 for(const state of ['Starting','Provisioning','Created','Queued','Awaiting','Updating','Rebuilding']){
 const calls=[];let executed=false;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async(path,token,options)=>{calls.push({path,method:options?.method||'GET'});return path.startsWith('/repos/')?{codespaces:[{name:'pending-pods',display_name:'PODS launch',state}]}:{name:'pending-pods',state:'Available'};},
  exec:async()=>{executed=true;}});
 const result=await adapter.github.launch('token',{},()=>{});
 assert.equal(result.environment,'pending-pods');assert.equal(executed,true);
 assert.deepEqual(calls,[{path:'/repos/owner/runtime/codespaces?per_page=100',method:'GET'},{path:'/user/codespaces/pending-pods',method:'GET'}]);
 }
});
test('Codespaces provisioning failure propagates without trying to execute a runner',async()=>{
 let executed=false;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,api:async(path,t,opts)=>{if(opts?.method==='POST')throw new Error('Quota exceeded');return {codespaces:[]};},exec:async()=>{executed=true;}});
 await assert.rejects(adapter.github.launch('token',{},()=>{}),/Quota exceeded/);assert.equal(executed,false);
});
test('a missing server GitHub CLI is diagnosed without retrying user compute',async()=>{
 let executions=0;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async()=>({codespaces:[{name:'my-pods',display_name:'PODS launch',state:'Available'}]}),
  exec:async()=>{executions++;throw Object.assign(new Error('spawn gh ENOENT'),{code:'ENOENT'});}});
 await assert.rejects(adapter.github.launch('token',{},()=>{}),/GitHub CLI is unavailable on the PODS server/);
 assert.equal(executions,1);
});
test('bootstrap quotes shell values and pins the runner before execution',()=>{
 const b=bootstrap({token:'abc'},"https://pods.example/'quoted",'b'.repeat(64));
 assert.match(b,/sha256sum -c -/);assert.match(b,/umask 077/);assert.match(b,/PODS_CONFIG/);assert.ok(b.indexOf('sha256sum')<b.indexOf('nohup'));assert.match(b,/'\\''quoted/);
});
test('OAuth uses PKCE and session-bound single-use state; callback never exposes token',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pods-oauth-'));let exchanged;
 const o={id:'test-client',secret:'test-secret',authorize:'https://provider.example/authorize',exchange:'https://provider.example/token',scope:'codespace'};
 const {server}=await createApp({data:root,secret:'da'.repeat(32),oauth:{github:o,google:o},providers:{github:{validate:async()=>({name:'oauth-user'})},google:{}},oauthFetch:async(url,options)=>{exchanged=options.body;return new Response(JSON.stringify({access_token:'never-exposed-token-value'}),{headers:{'Content-Type':'application/json'}});}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try{
 const initial=await fetch(origin+'/api/me');const cookie=initial.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(origin+'/auth/github?returnTo=https://evil.example',{headers:{Cookie:cookie},redirect:'manual'})).status,400);
 const start=await fetch(origin+'/auth/github?returnTo=/launch/prepared-version',{headers:{Cookie:cookie},redirect:'manual'});assert.equal(start.status,302);const auth=new URL(start.headers.get('location')),state=auth.searchParams.get('state');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');
 const path='/auth/github/callback?state='+state+'&code=one-use-code';
 const wrong=await fetch(origin+path,{redirect:'manual'});assert.equal(wrong.status,302);assert.equal(new URL(wrong.headers.get('location'),origin).pathname,'/');assert.equal(exchanged,undefined);
 const finish=await fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(finish.status,302);assert.equal(finish.headers.get('location'),'/launch/prepared-version?connected=github');
 assert.equal(createHash('sha256').update(exchanged.get('code_verifier')).digest('base64url'),auth.searchParams.get('code_challenge'));
 const replay=await fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(replay.status,302);assert.match(replay.headers.get('location'),/^\/launch\/prepared-version\?error=/);
 const me=await(await fetch(origin+'/api/me',{headers:{Cookie:cookie}})).text();assert.match(me,/oauth-user/);assert.ok(!me.includes('never-exposed'));
 }finally{await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
});

test('expired or swept OAuth state returns to the original product and provider without exchanging the code',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pods-expired-oauth-'));let exchanges=0;
 const o={id:'client',secret:'secret',authorize:'https://provider.example/authorize',exchange:'https://provider.example/token',scope:'cloud-platform'};
 const {server,store}=await createApp({data:root,secret:'dc'.repeat(32),oauth:{github:o,google:o},providers:{},oauthFetch:async()=>{exchanges++;throw new Error('Expired code must not be exchanged');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try{
 const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0];
 const request=path=>fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});
 for(const target of ['/launch/original-product','/develop']){
  const start=await request('/auth/google?returnTo='+encodeURIComponent(target));
  const key=new URL(start.headers.get('location')).searchParams.get('state'), state=store.get('oauth',key);
  assert.ok(state.expiresAt<=Date.now()+600000);assert.ok(state.expiresAt>Date.now()+590000);
  store.put('oauth',key,{...state,expiresAt:Date.now()-1});
  for(const swept of [false,true]){
   if(swept)store.delete('oauth',key);
   const response=await request('/auth/google/callback?state='+key+'&code=expired-sensitive-code');
   assert.equal(response.status,302);
   const location=new URL(response.headers.get('location'),origin);
   assert.equal(location.origin,origin);assert.equal(location.pathname,target);
   assert.equal(location.searchParams.get('provider'),'google');assert.match(location.searchParams.get('error'),/expired/);
   assert.ok(!location.href.includes('expired-sensitive-code'));assert.equal(exchanges,0);
   assert.equal((await fetch(location,{headers:{Cookie:cookie}})).headers.get('content-type'),'text/html; charset=utf-8');
  }
 }
 // Another browser must never inherit this browser's product or authorization state.
 const start=await request('/auth/google?returnTo=/launch/private-context');
 const key=new URL(start.headers.get('location')).searchParams.get('state');
 const stranger=await fetch(origin+'/auth/google/callback?state='+key+'&code=stolen-code',{redirect:'manual'});
 assert.equal(new URL(stranger.headers.get('location'),origin).pathname,'/');assert.ok(store.get('oauth',key));
 const wrongProvider=await request('/auth/github/callback?state='+key+'&code=wrong-provider-code');
 assert.equal(new URL(wrongProvider.headers.get('location'),origin).pathname,'/');assert.ok(store.get('oauth',key));assert.equal(exchanges,0);
 }finally{await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
});
