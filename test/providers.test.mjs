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
test('Codespaces provisioning failure propagates without trying to execute a runner',async()=>{
 let executed=false;
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,api:async(path,t,opts)=>{if(opts?.method==='POST')throw new Error('Quota exceeded');return {codespaces:[]};},exec:async()=>{executed=true;}});
 await assert.rejects(adapter.github.launch('token',{},()=>{}),/Quota exceeded/);assert.equal(executed,false);
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
 const wrong=await fetch(origin+path,{redirect:'manual'});assert.equal(wrong.status,400);
 const finish=await fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(finish.status,302);assert.equal(finish.headers.get('location'),'/launch/prepared-version?connected=github');
 assert.equal(createHash('sha256').update(exchanged.get('code_verifier')).digest('base64url'),auth.searchParams.get('code_challenge'));
 const replay=await fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(replay.status,400);
 const me=await(await fetch(origin+'/api/me',{headers:{Cookie:cookie}})).text();assert.match(me,/oauth-user/);assert.ok(!me.includes('never-exposed'));
 }finally{await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
});
