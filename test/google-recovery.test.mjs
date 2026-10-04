import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { providers } from '../src/providers.mjs';
import { request } from '../src/util.mjs';

const base='https://cloudshell.googleapis.com/v1/users/me/environments/default';
const key='ssh-rsa attempt-specific-key';
const environment={state:'RUNNING',sshHost:'127.0.0.1',sshPort:22,sshUsername:'test',webHost:'test.cloudshell.dev'};
const timeout=()=>Object.assign(new Error('The operation was aborted due to timeout'),{name:'TimeoutError'});
function harness(request,provisionMs=1000){
  const calls=[],updates=[],deliveries=[];
  const adapter=providers({origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,provisionMs,
    cloudRequest:async(url,token,options)=>{
      calls.push({url,method:options?.method??'GET'});
      if(url.endsWith(':removePublicKey')){assert.deepEqual(options.body,{key});return {};}
      return request(url,options);
    },exec:async(file,args,options)=>{
      if(file==='ssh-keygen')await writeFile(args.at(-1)+'.pub',key);
      else {assert.equal(file,'ssh');deliveries.push(options.input);}
    }});
  return {calls,updates,deliveries,launch:()=>adapter.google.launch('provider-secret',{port:24567,token:'launch-secret'},p=>updates.push(structuredClone(p)))};
}
test('an uncertain start is reconciled only after the same environment exposes this attempt’s key and is running',async()=>{
  for(const error of [timeout(),Object.assign(new Error('Gateway unavailable'),{status:503})]){
    let reads=0;
    const h=harness(async(url,options)=>{
      if(options){assert.equal(url,base+':start');assert.deepEqual(options.body,{publicKeys:[key]});throw error;}
      assert.equal(url,base);reads++;
      if(reads<=2)return {...environment,publicKeys:['ssh-rsa another-attempt']};
      if(reads===3)return {...environment,state:'PENDING',publicKeys:[key]};
      return {...environment,publicKeys:[key]};
    });
    const result=await h.launch();
    assert.equal(result.previewUrl,'https://24567-test.cloudshell.dev');
    assert.equal(reads,4);assert.equal(h.deliveries.length,1);
    assert.equal(h.calls.filter(c=>c.url.endsWith(':start')).length,1);
    const compute=h.updates.filter(p=>p.compute).at(-1).compute;
    assert.equal(compute.initialState,'RUNNING');
    assert.ok(compute.startReconciledAt>=compute.startUncertainAt);
    assert.equal(compute.startAcceptedAt,undefined);
    assert.ok(!JSON.stringify(h.updates).includes(key));assert.ok(!JSON.stringify(h.updates).includes('secret'));
    assert.equal(h.calls.at(-1).url,base+':removePublicKey');
  }
});
test('RUNNING without the attempt key never permits delivery or a repeated start',async()=>{
  const h=harness(async(url,options)=>{if(options)throw timeout();return {...environment,publicKeys:['ssh-rsa someone-else']};},20);
  await assert.rejects(h.launch(),/provisioning deadline/);
  assert.equal(h.deliveries.length,0);assert.equal(h.calls.filter(c=>c.url.endsWith(':start')).length,1);
  assert.equal(h.calls.at(-1).url,base+':removePublicKey');
});
test('transient operation polling resumes the same acknowledged operation without a second mutation',async()=>{
  let polls=0;
  const h=harness(async(url,options)=>{
    if(options)return {name:'operations/existing-start'};
    if(url.includes('/operations/')){
      assert.equal(url,'https://cloudshell.googleapis.com/v1/operations/existing-start');polls++;
      if(polls===1)throw timeout();if(polls===2)throw Object.assign(new Error('Temporary'),{status:502});
      return {done:true};
    }
    return environment;
  });
  await h.launch();assert.equal(polls,3);assert.equal(h.deliveries.length,1);
  assert.equal(h.calls.filter(c=>c.url.endsWith(':start')).length,1);
  assert.ok(h.updates.some(p=>p.compute?.startAcceptedAt));
  assert.ok(!h.updates.some(p=>p.compute?.startUncertainAt));
});
test('authorization and quota start failures stop immediately and still clean the ephemeral key',async()=>{
  for(const status of [401,403,429]){
    const h=harness(async(url,options)=>{if(options)throw Object.assign(new Error('Start refused'),{status});return environment;});
    await assert.rejects(h.launch(),/Start refused/);
    assert.equal(h.deliveries.length,0);
    assert.deepEqual(h.calls.map(c=>c.url),[base,base+':start',base+':removePublicKey']);
  }
});
test('persistent transient reads stop after three attempts without delivering an application',async()=>{
  let polls=0;
  const h=harness(async(url,options)=>{if(options)return {name:'operations/existing-start'};if(url.includes('/operations/')){polls++;throw timeout();}return environment;});
  await assert.rejects(h.launch(),/aborted due to timeout/);
  assert.equal(polls,3);assert.equal(h.deliveries.length,0);
  assert.equal(h.calls.filter(c=>c.url.endsWith(':start')).length,1);
});
test('explicit failed or malformed operations cannot trigger reconciliation or runner delivery',async()=>{
  for(const operation of [{done:true,error:{message:'Provider rejected startup'}},{}]){
    const h=harness(async(url,options)=>options?operation:environment);
    await assert.rejects(h.launch(),/Provider rejected startup|valid startup operation/);
    assert.equal(h.deliveries.length,0);
    assert.deepEqual(h.calls.map(c=>c.url),[base,base+':start',base+':removePublicKey']);
  }
});
test('an uncompleted operation reaches the configured deadline without another start',async()=>{
  const h=harness(async(url,options)=>options||url.includes('/operations/')?{name:'operations/pending'}:environment,20);
  await assert.rejects(h.launch(),/provisioning deadline/);
  assert.equal(h.deliveries.length,0);assert.equal(h.calls.filter(c=>c.url.endsWith(':start')).length,1);
});
test('response-body transport failures remain visible for provider recovery, while empty responses remain valid',async t=>{
  const error=timeout();
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>{throw error;}}));
  await assert.rejects(request('https://provider.example','secret'),e=>e===error);
  globalThis.fetch=async()=>new Response(null,{status:204});
  assert.deepEqual(await request('https://provider.example','secret'),{});
});
