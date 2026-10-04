import test from 'node:test';
import assert from 'node:assert/strict';
import { providers as realProviders, bootstrap, codespaceRuntimeProbe } from '../src/providers.mjs';
import { createApp } from '../src/server.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
// Provider orchestration tests isolate the separately tested tunnel registration.
const providers=options=>realProviders({preparePreview:async()=>{},...options});
for(const saved of [false,true])test(`a ${saved?'saved':'discovered'} Codespace shutting down is reused and resumed once after shutdown`,async()=>{
 const env={name:'retained-data',display_name:'PODS launch',repository:{full_name:'owner/runtime'}},calls=[];let reads=0,started=false,delivered=0;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,provisionMs:1000,
  api:async(path,token,options)=>{const method=options?.method||'GET';calls.push([method,path]);
   if(method==='POST'){assert.equal(path,'/user/codespaces/retained-data/start');assert.equal(started,false);started=true;return {...env,state:'Starting'};}
   if(path.startsWith('/repos/'))return {codespaces:[{...env,state:'ShuttingDown'}]};
   assert.equal(path,'/user/codespaces/retained-data');reads++;return {...env,state:started?'Available':reads<=2?'ShuttingDown':'Shutdown'};
  },exec:async(file,args)=>{assert.equal(args[3],'retained-data');delivered++;}});
 const result=await adapter.github.launch('token',saved?{preferredEnvironment:'retained-data'}:{},()=>{});
 assert.equal(result.environment,'retained-data');assert.equal(delivered,1);
 assert.deepEqual(calls.filter(([method])=>method==='POST'),[['POST','/user/codespaces/retained-data/start']]);
});
test('a Codespace stuck shutting down reaches the deadline without mutation or runner dispatch',async()=>{
 const env={name:'retained-data',display_name:'PODS launch',state:'ShuttingDown'};let mutations=0;
 const adapter=providers({repo:'owner/runtime',pollMs:1,provisionMs:8,
  api:async(path,token,options)=>{if(options?.method==='POST'){mutations++;throw new Error('Unexpected mutation');}return path.startsWith('/repos/')?{codespaces:[env]}:env;},exec:async()=>assert.fail('Compute is not available')});
 await assert.rejects(adapter.github.launch('token',{},()=>{}),/provisioning.*deadline/);assert.equal(mutations,0);
});
test('transient Codespaces discovery and polling errors recover within one launch without duplicate mutations',async()=>{
 const calls=[],saved={name:'saved-data',display_name:'PODS launch containers',repository:{full_name:'owner/runtime'}},reads=new Map();let delivered=0;
 const adapter=providers({repo:'owner/runtime',pollMs:1,origin:'https://pods.example',runnerSha:'a'.repeat(64),
  api:async(path,token,options)=>{const method=options?.method||'GET';calls.push([method,path]);if(method==='POST')return {...saved,state:'Starting'};const n=(reads.get(path)||0)+1;reads.set(path,n);if(n===1||n===3)throw Object.assign(new Error('Temporary gateway failure'),{status:503});return {...saved,state:n===2?'Shutdown':'Available'};},
  exec:async()=>{delivered++;}});
 const result=await adapter.github.launch('token',{containerRuntime:true,preferredEnvironment:'saved-data'},()=>{});
 assert.equal(result.environment,'saved-data');assert.equal(delivered,1);
 assert.deepEqual(calls.filter(([method])=>method==='POST'),[['POST','/user/codespaces/saved-data/start']]);
 assert.equal(calls.filter(([method])=>method==='GET').length,4);
});
test('uncertain resume is reconciled against the same Codespace without repeating start or creating another',async()=>{
 for(const failure of [Object.assign(new Error('Gateway timeout'),{status:504}),Object.assign(new Error('Network timeout'),{name:'TimeoutError'})]){
  let reads=0,starts=0,delivered=0;const seen=[];
  const saved={name:'saved-data',display_name:'PODS launch',repository:{full_name:'owner/runtime'}};
  const adapter=providers({repo:'owner/runtime',pollMs:1,origin:'https://pods.example',runnerSha:'a'.repeat(64),api:async(path,token,options)=>{seen.push(path);if(options?.method==='POST'){starts++;throw failure;}reads++;return {...saved,state:reads<=2?'Shutdown':reads===3?'Starting':'Available'};},exec:async()=>{delivered++;}});
  const result=await adapter.github.launch('token',{preferredEnvironment:'saved-data'},()=>{});
  assert.equal(result.environment,'saved-data');assert.equal(starts,1);assert.equal(delivered,1);assert.equal(reads,4);assert.ok(seen.every(path=>path.startsWith('/user/codespaces/saved-data')));
 }
});
test('persistent reads and terminal provider errors are bounded; uncertain creation is never repeated',async()=>{
 for(const status of [401,403,404,422,429,500,502,503,504]){
  let calls=0,delivered=0;const adapter=providers({repo:'owner/runtime',pollMs:1,api:async()=>{calls++;throw Object.assign(new Error('Provider error'),{status});},exec:async()=>{delivered++;}});
  await assert.rejects(adapter.github.launch('token',{},()=>{}),/Provider error/);
  assert.equal(calls,status>=500?3:1);assert.equal(delivered,0);
 }
 let creates=0;const adapter=providers({repo:'owner/runtime',pollMs:1,api:async(path,token,options)=>{if(options?.method==='POST'){creates++;throw Object.assign(new Error('Uncertain create'),{status:504});}return {codespaces:[]};},exec:async()=>assert.fail('No confirmed environment')});
 await assert.rejects(adapter.github.launch('token',{},()=>{}),/Uncertain create/);assert.equal(creates,1);
});
test('an unacknowledged resume reaches its deadline without repeating the mutation or dispatching an app',async()=>{
 let starts=0;const adapter=providers({repo:'owner/runtime',pollMs:1,provisionMs:8,api:async(path,token,options)=>{if(options?.method==='POST'){starts++;throw Object.assign(new Error('Temporary failure'),{status:503});}return {name:'saved-data',display_name:'PODS launch',repository:{full_name:'owner/runtime'},state:'Shutdown'};},exec:async()=>assert.fail('Unavailable compute must not receive a runner')});
 await assert.rejects(adapter.github.launch('token',{preferredEnvironment:'saved-data'},()=>{}),/provisioning.*deadline/);assert.equal(starts,1);
});
test('resume authorization and quota failures are surfaced immediately without reconciliation or duplicate requests',async()=>{
 for(const status of [401,403,429]){
  const methods=[];const adapter=providers({repo:'owner/runtime',pollMs:1,api:async(path,token,options)=>{methods.push(options?.method||'GET');if(options?.method==='POST')throw Object.assign(new Error('Resume refused'),{status});return {name:'saved-data',display_name:'PODS launch',repository:{full_name:'owner/runtime'},state:'Shutdown'};},exec:async()=>assert.fail('Refused compute must not receive an app')});
  await assert.rejects(adapter.github.launch('token',{preferredEnvironment:'saved-data'},()=>{}),/Resume refused/);assert.deepEqual(methods,['GET','POST']);
 }
});
test('providers use the assigned port in both the private preview and delivered runner config',async()=>{
 const order=[],updates=[];let input;
 const github=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),api:async()=>({codespaces:[{name:'my-pods',display_name:'PODS launch',state:'Available'}]}),preparePreview:async options=>{order.push('private');assert.equal(options.port,23456);},exec:async(file,args,options)=>{order.push('runner');input=options.input;}}).github;
 const gh=await github.launch('secret',{port:23456},p=>updates.push(p));
 assert.deepEqual(order,['private','runner']);assert.equal(gh.previewUrl,'https://my-pods-23456.app.github.dev');assert.match(input,/"port":23456/);assert.ok(input.includes(gh.previewUrl));
 const calls=[];
 const google=providers({origin:'https://pods.example',runnerSha:'a'.repeat(64),cloudRequest:async url=>{calls.push(url);return url.endsWith(':addPublicKey')?{done:true}:{state:'RUNNING',publicKeys:['ssh-rsa test-key'],sshHost:'127.0.0.1',sshPort:22,sshUsername:'test',webHost:'test.cloudshell.dev'};},exec:async(file,args,options)=>{if(file==='ssh-keygen')await writeFile(args.at(-1)+'.pub','ssh-rsa test-key');else input=options.input;}}).google;
 const g=await google.launch('secret',{port:24567},p=>updates.push(p));
 assert.equal(g.previewUrl,'https://24567-test.cloudshell.dev');assert.match(input,/"port":24567/);assert.ok(input.includes(g.previewUrl));assert.ok(calls.at(-1).endsWith(':removePublicKey'));
});
test('private preview registration failure prevents starting the Codespaces runner',async()=>{
 let executed=false;const adapter=providers({repo:'owner/runtime',api:async()=>({codespaces:[{name:'my-pods',display_name:'PODS launch',state:'Available'}]}),preparePreview:async()=>{throw new Error('Preview unavailable');},exec:async()=>{executed=true;}});
 await assert.rejects(adapter.github.launch('secret',{port:23456},()=>{}),/Preview unavailable/);assert.equal(executed,false);
});
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
test('saved Codespaces accept either runtime only after capabilities pass, without replacing their environment',async()=>{
 for(const containerRuntime of [false,true]){
  const order=[],saved={name:'saved-data',display_name:containerRuntime?'PODS launch':'PODS launch containers',state:'Available',repository:{full_name:'owner/runtime'}};
  const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),
   api:async(path,token,options)=>{assert.equal(path,'/user/codespaces/saved-data');assert.equal(options,undefined);order.push('saved');return saved;},
   preparePreview:async({name})=>{assert.equal(name,saved.name);order.push('private');},
   exec:async(file,args,options)=>{assert.equal(args[3],saved.name);assert.equal(file,'gh');if(options.input===codespaceRuntimeProbe()){order.push('capabilities');return 'PODS_RUNTIME_COMPATIBLE\n';}assert.ok(options.input.includes('launch-secret'));order.push('runner');return 'PODS_DELIVERED\n';}});
  const result=await adapter.github.launch('provider-token',{preferredEnvironment:saved.name,containerRuntime,token:'launch-secret'},()=>{});
  assert.equal(result.environment,saved.name);assert.deepEqual(order,['saved','capabilities','private','runner']);
 }
});
test('missing or unverified Codespaces capabilities preserve the saved environment without runner or preview mutation',async()=>{
 for(const outcome of ['unrecognized output','',new Error('Docker unavailable')]){
  let probes=0;const calls=[];
  const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),
   api:async(path,token,options)=>{calls.push([path,options?.method||'GET']);return {name:'saved-data',display_name:'PODS launch',state:'Available',repository:{full_name:'owner/runtime'}};},
   preparePreview:async()=>assert.fail('No preview mutation before compatibility'),
   exec:async(file,args,options)=>{assert.equal(options.input,codespaceRuntimeProbe());assert.ok(!options.input.includes('launch-secret'));probes++;if(outcome instanceof Error)throw outcome;return outcome;}});
  await assert.rejects(adapter.github.launch('provider-token',{preferredEnvironment:'saved-data',containerRuntime:true,token:'launch-secret'},()=>{}),/Existing application data was preserved/);
  assert.equal(probes,1);assert.deepEqual(calls,[['/user/codespaces/saved-data','GET']]);
 }
});
test('a runtime change resumes the exact saved Codespace once before checking capabilities',async()=>{
 const order=[],saved={name:'saved-data',display_name:'PODS launch',repository:{full_name:'owner/runtime'}};
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async(path,token,options)=>{if(options?.method==='POST'){assert.equal(path,'/user/codespaces/saved-data/start');order.push('resume');return {...saved,state:'Available'};}assert.equal(path,'/user/codespaces/saved-data');order.push('read');return {...saved,state:'Shutdown'};},
  preparePreview:async()=>order.push('private'),
  exec:async(file,args,options)=>{assert.equal(args[3],saved.name);if(options.input===codespaceRuntimeProbe()){order.push('capabilities');return 'PODS_RUNTIME_COMPATIBLE\n';}order.push('runner');return 'PODS_DELIVERED\n';}});
 const result=await adapter.github.launch('provider-token',{preferredEnvironment:saved.name,containerRuntime:true},()=>{});
 assert.equal(result.environment,saved.name);assert.deepEqual(order,['read','resume','capabilities','private','runner']);
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
