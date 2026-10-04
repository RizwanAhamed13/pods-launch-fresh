import test from 'node:test';
import assert from 'node:assert/strict';
import { providers } from '../src/providers.mjs';
import { createApp } from '../src/server.mjs';
import { mkdtemp,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const deferred=()=>Promise.withResolvers();
function harness({failures=0,enoent=false,sendFailures=0,update=()=>{}}={}) {
  const preview=deferred(),opened=deferred(),events=[],transports=[];let checks=0;
  const adapter=providers({repo:'owner/runtime',origin:'https://pods.example',runnerSha:'a'.repeat(64),pollMs:1,
    api:async()=>({codespaces:[{name:'same-compute',display_name:'PODS launch',state:'Available'}]}),
    exec:()=>assert.fail('bootstrap must use the gated transport'),
    preparePreview:async()=>{events.push('preview');checks++;await preview.promise;events.push('private');},
    openSsh:(file,args,options)=>{
      assert.equal(file,'gh');assert.equal(args[3],'same-compute');assert.equal(options.env.GH_TOKEN,'provider-secret');
      assert.equal(options.input,undefined);assert.equal(options.timeout,60000);assert.equal(options.holdTimeout,65000);
      assert.ok(!args.join(' ').includes('secret'));
      const d=deferred(),number=transports.length+1;let ended=false;
      d.promise.catch(()=>{});events.push('open');
      const transport={result:d.promise,sends:0,cancelled:false,
        send(input){events.push('send');this.sends++;assert.ok(events.includes('private'));assert.match(input,/launch-secret/);
          if(!ended){ended=true;number<=sendFailures?d.reject(new Error('Delivery failed')):d.resolve('PODS_DELIVERED');}return d.promise;},
        async cancel(){this.cancelled=true;if(!ended){ended=true;d.reject(new Error('Cancelled'));}await d.promise.catch(()=>{});}};
      transports.push(transport);opened.resolve();
      if(number<=failures){ended=true;d.reject(Object.assign(new Error('Early SSH failure'),enoent?{code:'ENOENT'}:{}));}
      return transport;
    }});
  return {adapter,events,transports,preview,opened,checks:()=>checks,launch:()=>adapter.github.launch('provider-secret',{token:'launch-secret'},update)};
}
test('SSH opens during pending preview but releases no application bytes until privacy succeeds',async()=>{
  const h=harness(),result=h.launch();await h.opened.promise;
  assert.deepEqual(h.events,['open','preview']);assert.equal(h.transports[0].sends,0);
  h.preview.resolve();await result;
  assert.deepEqual(h.events,['open','preview','private','send']);assert.equal(h.transports[0].cancelled,true);
});
test('preview failure cancels the waiting transport without sending or retrying',async()=>{
  const h=harness(),result=h.launch();await h.opened.promise;h.preview.reject(new Error('Private port rejected'));
  await assert.rejects(result,/Private port rejected/);
  assert.equal(h.transports.length,1);assert.equal(h.transports[0].sends,0);assert.equal(h.transports[0].cancelled,true);
});
test('an early SSH failure consumes one attempt; retry follows privacy confirmation on the same compute',async()=>{
  const h=harness({failures:1}),result=h.launch();await h.opened.promise;await new Promise(r=>setImmediate(r));
  assert.equal(h.transports.length,1);assert.equal(h.transports[0].sends,0);
  h.preview.resolve();await result;
  assert.equal(h.transports.length,2);assert.equal(h.checks(),1);assert.ok(h.transports.every(t=>t.cancelled));
});
test('SSH early failures and delivery failures keep the three-attempt limit; missing gh is immediate',async()=>{
  for(const options of [{failures:3},{sendFailures:3},{failures:1,enoent:true}]){
    const h=harness(options),result=h.launch();await h.opened.promise;h.preview.resolve();
    await assert.rejects(result,options.enoent?/CLI is unavailable/:/Could not reach/);
    assert.equal(h.transports.length,options.enoent?1:3);assert.equal(h.checks(),1);assert.ok(h.transports.every(t=>t.cancelled));
  }
});
test('shutdown cancels pending transport and prevents a late preview result from dispatching',async()=>{
  const h=harness(),result=h.launch();await h.opened.promise;await h.adapter.close();
  assert.equal(h.transports[0].cancelled,true);h.preview.resolve();
  await assert.rejects(result,/shutting down/);assert.equal(h.transports[0].sends,0);assert.equal(h.transports.length,1);
});
test('failed observation updates close a waiting SSH process and never retry a delivered bootstrap',async()=>{
  for(const afterDelivery of [false,true]){
    const h=harness({update:p=>{if(afterDelivery?p.compute?.bootstrapDeliveredAt:p.compute?.bootstrapAttempts)throw new Error('Observation failed');}});
    const result=h.launch();await h.opened.promise;h.preview.resolve();await assert.rejects(result,/Observation failed/);
    assert.equal(h.transports.length,1);assert.equal(h.transports[0].sends,afterDelivery?1:0);assert.equal(h.transports[0].cancelled,true);
  }
});
test('server shutdown awaits provider cleanup before closing its store and runs cleanup once',async t=>{
  const data=await mkdtemp(join(tmpdir(),'pods-shutdown-'));t.after(()=>rm(data,{recursive:true,force:true}));
  const cleanup=deferred();let calls=0;
  const app=await createApp({data,secret:'a'.repeat(64),providers:{async close(){calls++;await cleanup.promise;}}});
  const closing=app.closeResources();assert.equal(app.closeResources(),closing);assert.equal(calls,1);
  assert.deepEqual(app.store.list('launch'),[]);cleanup.resolve();await closing;
  assert.throws(()=>app.store.list('launch'),/closed|not open/i);
});
