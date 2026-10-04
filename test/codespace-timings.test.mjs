import test from 'node:test';
import assert from 'node:assert/strict';
import { providers } from './provider-harness.mjs';

function harness(t,{previewError=false,retry=false,runtimeChanged=false}={}){
 t.mock.timers.enable({apis:['Date'],now:1000});
 const updates=[],events=[];let attempts=0;
 const env={name:'saved-compute',state:'Available',display_name:'PODS launch',repository:{full_name:'owner/runtime'}};
 const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
  api:async()=>runtimeChanged?env:{codespaces:[env]},
  preparePreview:async()=>{events.push('private-preview');t.mock.timers.tick(4000);if(previewError)throw new Error('Private preview failed');},
  exec:async(file,args,options)=>{
   assert.equal(file,'gh');assert.equal(options.env.GH_TOKEN,'provider-secret');
   if(runtimeChanged&&events.length===0){events.push('compatibility');t.mock.timers.tick(800);return 'PODS_RUNTIME_COMPATIBLE';}
   events.push('bootstrap');attempts++;t.mock.timers.tick(2500);
   if(retry&&attempts===1)throw new Error('Temporary SSH failure');return '';
  }});
 return {updates,events,launch:()=>adapter.github.launch('provider-secret',{token:'launch-secret',...(runtimeChanged?{preferredEnvironment:'saved-compute',containerRuntime:true}:{})},p=>updates.push(structuredClone(p))),compute:()=>updates.filter(p=>p.compute).at(-1).compute};
}
test('Codespaces records private-preview and bootstrap stages independently of provider readiness',async t=>{
 const h=harness(t);await h.launch();const c=h.compute();
 assert.deepEqual(h.events,['private-preview','bootstrap']);
 assert.equal(h.updates.find(p=>p.providerReadyAt).providerReadyAt,1000);
 assert.equal(c.previewRequestedAt,1000);assert.equal(c.previewReadyAt,5000);
 assert.equal(c.bootstrapRequestedAt,5000);assert.equal(c.bootstrapDeliveredAt,7500);assert.equal(c.bootstrapAttempts,1);
 assert.equal(c.initialState,'Available');assert.equal(c.observedAt,1000);
 assert.ok(!JSON.stringify(c).includes('secret'));assert.ok(!JSON.stringify(c).includes('https://'));
});
test('failed private-preview setup records its start and never claims a bootstrap or dispatches it',async t=>{
 const h=harness(t,{previewError:true});await assert.rejects(h.launch(),/Private preview failed/);const c=h.compute();
 assert.deepEqual(h.events,['private-preview']);assert.equal(c.previewRequestedAt,1000);
 for(const field of ['previewReadyAt','bootstrapRequestedAt','bootstrapDeliveredAt','bootstrapAttempts'])assert.equal(c[field],undefined);
});
test('bootstrap retry timing spans all attempts without repeating preview registration',async t=>{
 const h=harness(t,{retry:true});await h.launch();const c=h.compute();
 assert.deepEqual(h.events,['private-preview','bootstrap','bootstrap']);assert.equal(c.bootstrapAttempts,2);
 assert.equal(c.bootstrapRequestedAt,5000);assert.equal(c.bootstrapDeliveredAt,10000);
 assert.deepEqual(h.updates.filter(p=>p.compute?.bootstrapAttempts).map(p=>p.compute.bootstrapAttempts),[1,2,2]);
});
test('saved-runtime compatibility checking has its own timing before preview and bootstrap',async t=>{
 const h=harness(t,{runtimeChanged:true});await h.launch();const c=h.compute();
 assert.deepEqual(h.events,['compatibility','private-preview','bootstrap']);
 assert.equal(c.compatibilityRequestedAt,1000);assert.equal(c.compatibilityConfirmedAt,1800);
 assert.equal(c.previewRequestedAt,1800);assert.equal(c.previewReadyAt,5800);assert.equal(c.bootstrapDeliveredAt,8300);
});
