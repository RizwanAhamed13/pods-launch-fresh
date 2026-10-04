import test from 'node:test';
import assert from 'node:assert/strict';
import { access, writeFile } from 'node:fs/promises';
import { providers } from '../src/providers.mjs';

const base='https://cloudshell.googleapis.com/v1/users/me/environments/default';
const key='ssh-rsa unique-ready-key';
const ready={state:'RUNNING',publicKeys:[key],sshHost:'127.0.0.1',sshPort:22,sshUsername:'test',webHost:'test.cloudshell.dev'};
const timeout=()=>Object.assign(new Error('Lost provider response'),{name:'TimeoutError'});
function harness(request,{provisionMs=1000,ssh=async()=>{}}={}){
 const calls=[],updates=[];let keyPath,deliveries=0,reads=0;
 const adapter=providers({origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,provisionMs,
  cloudRequest:async(url,token,options)=>{
   calls.push({url,body:options?.body});
   if(url.endsWith(':removePublicKey')){assert.deepEqual(options.body,{key});return {};}
   if(url===base&&!options&&reads++===0)return {...ready,publicKeys:[]};
   return request(url,options);
  },exec:async(file,args,options)=>{
   if(file==='ssh-keygen'){keyPath=args.at(-1);await writeFile(keyPath+'.pub',key);}
   else{assert.equal(file,'ssh');deliveries++;await ssh(options);}
  }});
 return {calls,updates,get deliveries(){return deliveries;},
  launch:()=>adapter.google.launch('provider-secret',{port:24567,token:'launch-secret'},p=>updates.push(structuredClone(p))),
  async cleaned(){assert.equal(calls.at(-1).url,base+':removePublicKey');await assert.rejects(access(keyPath+'.pub'),{code:'ENOENT'});assert.ok(!JSON.stringify(updates).includes(key));assert.ok(!JSON.stringify(updates).includes('secret'));}
 };
}
test('running Cloud Shell registers its unique key without an unnecessary start and delivers the assigned preview',async()=>{
 const h=harness(async(url,options)=>{
  if(options){assert.equal(url,base+':addPublicKey');assert.deepEqual(options.body,{key});return {done:true};}
  return ready;
 });
 const result=await h.launch();assert.equal(result.previewUrl,'https://24567-test.cloudshell.dev');assert.equal(h.deliveries,1);
 assert.equal(h.calls.filter(c=>c.body&& !c.url.endsWith(':removePublicKey')).length,1);
 const compute=h.updates.filter(p=>p.compute).at(-1).compute;
 assert.equal(compute.initialState,'RUNNING');assert.ok(compute.keyRegistrationAcceptedAt>=compute.keyRegistrationRequestedAt);
 assert.equal(compute.startRequestedAt,undefined);await h.cleaned();
});
test('lost key registration and a later lost resume are reconciled without repeating either mutation',async()=>{
 let registrations=0,starts=0,reads=0;
 const h=harness(async(url,options)=>{
  if(options){if(url.endsWith(':addPublicKey')){registrations++;assert.deepEqual(options.body,{key});}else{assert.equal(url,base+':start');starts++;assert.deepEqual(options.body,{});}throw timeout();}
  reads++;if(reads===1)return {...ready,publicKeys:['ssh-rsa unrelated']};
  return {...ready,state:starts?'RUNNING':'PENDING'};
 });
 await h.launch();assert.equal(registrations,1);assert.equal(starts,1);assert.equal(h.deliveries,1);
 const c=h.updates.filter(p=>p.compute).at(-1).compute;
 assert.ok(c.keyRegistrationReconciledAt>=c.keyRegistrationUncertainAt);assert.ok(c.startReconciledAt>=c.startUncertainAt);await h.cleaned();
});
test('suspension after acknowledged registration resumes the same environment without registering the key twice',async()=>{
 let started=false;
 const h=harness(async(url,options)=>{
  if(options){if(url.endsWith(':addPublicKey'))assert.deepEqual(options.body,{key});else{assert.equal(url,base+':start');assert.deepEqual(options.body,{});started=true;}return {done:true};}
  return {...ready,state:started?'RUNNING':'SUSPENDED'};
 });
 await h.launch();assert.equal(h.deliveries,1);
 assert.deepEqual(h.calls.filter(c=>c.body).map(c=>c.url),[base+':addPublicKey',base+':start',base+':removePublicKey']);await h.cleaned();
});
test('ready key authorization, quota and explicit operation failures never fall back to starting compute',async()=>{
 for(const failure of [401,403,429,{done:true,error:{message:'Key rejected'}},{}]){
  const h=harness(async(url,options)=>{assert.equal(url,base+':addPublicKey');if(typeof failure==='number')throw Object.assign(new Error('Key refused'),{status:failure});return failure;});
  await assert.rejects(h.launch(),/Key refused|Key rejected|valid.*operation/);assert.equal(h.deliveries,0);
  assert.deepEqual(h.calls.filter(c=>c.body).map(c=>c.url),[base+':addPublicKey',base+':removePublicKey']);await h.cleaned();
 }
});
test('acknowledged registration still requires the exact key before delivery or a resume',async()=>{
 const h=harness(async(url,options)=>options?{done:true}:{...ready,state:'SUSPENDED',publicKeys:['ssh-rsa unrelated']},{provisionMs:25});
 await assert.rejects(h.launch(),/provisioning deadline/);assert.equal(h.deliveries,0);
 assert.deepEqual(h.calls.filter(c=>c.body).map(c=>c.url),[base+':addPublicKey',base+':removePublicKey']);await h.cleaned();
});
test('registration and suspension recovery share one deadline, including slow completed responses',async t=>{
 t.mock.timers.enable({apis:['Date'],now:1000});
 const h=harness(async(url,options)=>{
  if(options){assert.equal(url,base+':addPublicKey');t.mock.timers.tick(7);return {done:true};}
  t.mock.timers.tick(3);return {...ready,state:'SUSPENDED'};
 },{provisionMs:10});
 await assert.rejects(h.launch(),/provisioning deadline/);assert.equal(h.deliveries,0);
 assert.deepEqual(h.calls.filter(c=>c.body).map(c=>c.url),[base+':addPublicKey',base+':removePublicKey']);await h.cleaned();
});
test('an acknowledged key operation polls the same operation and SSH failures still remove both keys',async()=>{
 let polls=0;
 const h=harness(async(url,options)=>{
  if(options){assert.equal(url,base+':addPublicKey');return {name:'operations/existing-key'};}
  if(url.includes('/operations/')){assert.equal(url,'https://cloudshell.googleapis.com/v1/operations/existing-key');if(++polls===1)throw timeout();return {done:true};}
  return ready;
 },{ssh:async()=>{throw new Error('SSH unavailable');}});
 await assert.rejects(h.launch(),/SSH unavailable/);assert.equal(polls,2);assert.equal(h.deliveries,1);
 assert.equal(h.calls.filter(c=>c.url.endsWith(':addPublicKey')).length,1);await h.cleaned();
});
