import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { providers } from './provider-harness.mjs';

for (const initialState of ['Available','Shutdown','ShuttingDown','Provisioning',null]) {
  test(`Codespaces preserves initial ${initialState ?? 'absent'} compute state through delivery`,async()=>{
    const updates=[],calls=[],env={name:'observed-compute',display_name:'PODS launch'};
    let state=initialState;
    const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,preparePreview:async()=>{},exec:async()=>{},
      api:async(path,token,options)=>{
        const method=options?.method??'GET';calls.push([method,path]);
        if(method==='POST') {
          const observation=updates.at(-1).compute;
          assert.equal(observation.initialState,initialState);
          assert.ok(Number.isFinite(path.endsWith('/start')?observation.resumeRequestedAt:observation.creationRequestedAt));
          state='Available';return {...env,state};
        }
        if(path.startsWith('/repos/'))return {codespaces:initialState===null?[]:[{...env,state:initialState}]};
        state=state==='ShuttingDown'?'Shutdown':'Available';return {...env,state};
      }});
    const before=Date.now();
    await adapter.github.launch('test-token',{},patch=>updates.push(structuredClone(patch)));
    const observations=updates.filter(p=>p.compute).map(p=>p.compute);
    assert.ok(observations.length>0);
    assert.ok(observations.every(c=>c.initialState===initialState&&c.observedAt>=before&&c.observedAt<=Date.now()));
    const compute=observations.at(-1);
    const expectedMutation=initialState===null?'/repos/owner/runtime/codespaces':['Shutdown','ShuttingDown'].includes(initialState)?'/user/codespaces/observed-compute/start':null;
    assert.deepEqual(calls.filter(([method])=>method==='POST'),expectedMutation?[['POST',expectedMutation]]:[]);
    assert.equal('creationRequestedAt' in compute,initialState===null);
    assert.equal('resumeRequestedAt' in compute,['Shutdown','ShuttingDown'].includes(initialState));
    assert.ok(!JSON.stringify(updates).includes('test-token'));
  });
}

for(const initialState of ['RUNNING','SUSPENDED','PENDING',undefined]) {
  test(`Cloud Shell records ${initialState??'unknown'} before key registration or its start operation`,async()=>{
    const updates=[],calls=[];let reads=0;
    const adapter=providers({origin:'https://pods.example',runnerSha:'a'.repeat(64),
      cloudRequest:async(url,token,options)=>{
        calls.push([options?.method??'GET',url]);
        if(url.endsWith(initialState==='RUNNING'?':addPublicKey':':start')){
          assert.equal(updates.at(-1).compute.initialState,initialState??null);
          assert.ok(Number.isFinite(updates.at(-1).compute[initialState==='RUNNING'?'keyRegistrationRequestedAt':'startRequestedAt']));
          assert.deepEqual(options.body,initialState==='RUNNING'?{key:'ssh-rsa test-key'}:{publicKeys:['ssh-rsa test-key']});
          return {done:true};
        }
        if(url.endsWith(':removePublicKey'))return {};
        reads++;
        return {publicKeys:['ssh-rsa test-key'],state:reads===1?initialState:'RUNNING',sshHost:'127.0.0.1',sshPort:22,sshUsername:'test',webHost:'test.cloudshell.dev'};
      },exec:async(file,args)=>{if(file==='ssh-keygen')await writeFile(args.at(-1)+'.pub','ssh-rsa test-key');}});
    const before=Date.now();
    await adapter.google.launch('test-token',{},patch=>updates.push(structuredClone(patch)));
    const compute=updates.find(p=>p.compute)?.compute;
    assert.equal(compute.initialState,initialState??null);
    assert.ok(compute.observedAt>=before&&compute.observedAt<=compute[initialState==='RUNNING'?'keyRegistrationRequestedAt':'startRequestedAt']);
    assert.equal(calls[0][0],'GET');assert.ok(calls[0][1].endsWith('/default'));
    assert.equal(reads,2);
    assert.ok(!JSON.stringify(updates).includes('test-token'));
  });
}
