import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { ensureCodespacePreview } from '../src/codespace-preview.mjs';

function child(){const p=new EventEmitter();p.signals=[];p.kill=signal=>{p.signals.push(signal);queueMicrotask(()=>p.emit('exit',null,signal));};return p;}
const base={name:'my-codespace',port:21345,env:{GH_TOKEN:'test-secret'},pollMs:1,timeoutMs:1000};
test('existing private preview needs no forwarding process; other visibility is made private',async()=>{
 for(const visibility of ['private','public','org',undefined]){
  const calls=[];await ensureCodespacePreview({...base,spawnProcess:()=>assert.fail('existing mapping should be reused'),exec:async(file,args,options)=>{calls.push(args);assert.equal(options.env.GH_TOKEN,'test-secret');assert.ok(!args.includes('test-secret'));return JSON.stringify([{sourcePort:21345,visibility}]);}});
  assert.equal(calls.length,visibility==='private'?1:2);
  if(visibility!=='private')assert.deepEqual(calls[1],['codespace','ports','visibility','21345:private','-c','my-codespace']);
 }
});
test('absent preview is registered privately before the temporary loopback forwarder is closed',async()=>{
 const p=child();let calls=0;
 await ensureCodespacePreview({...base,spawnProcess:(file,args,options)=>{assert.equal(file,'gh');assert.deepEqual(args,['codespace','ports','forward','21345:0','-c','my-codespace']);assert.equal(options.stdio,'ignore');return p;},exec:async()=>JSON.stringify(++calls<3?[]:[{sourcePort:21345,visibility:'private'}])});
 assert.equal(calls,3);assert.deepEqual(p.signals,['SIGTERM']);
});
test('registration errors, malformed responses and timeouts never report a ready preview or leak a child',async()=>{
 for(const kind of ['lookup-error','malformed','forward-error','timeout','privacy-error']){
  const p=child();let calls=0,spawned=false;
  const operation=ensureCodespacePreview({...base,timeoutMs:15,spawnProcess:()=>{spawned=true;if(kind==='forward-error')queueMicrotask(()=>p.emit('error',new Error('failed forwarding')));return p;},exec:async()=>{
   calls++;if(kind==='lookup-error')throw new Error('lookup failed');if(kind==='malformed')return '{}';
   if(kind==='privacy-error'){if(calls>1)throw new Error('privacy change failed');return JSON.stringify([{sourcePort:21345,visibility:'public'}]);}
   return '[]';
  }});
  await assert.rejects(operation,/failed|timed out|preview ports/);
  assert.equal(p.signals.length,spawned?1:0);
 }
});

function delayedReply(ms,value,{timeout}){
 return new Promise((resolve,reject)=>{
  const deadline=setTimeout(()=>{clearTimeout(response);reject(new Error('gh timed out'));},timeout);
  const response=setTimeout(()=>{clearTimeout(deadline);resolve(JSON.stringify(value));},ms);
 });
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('a slow initial port lookup can complete and register a private preview within the stage deadline',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:1000});
 const p=child();let calls=0,spawned=false;
 const result=ensureCodespacePreview({...base,timeoutMs:60000,pollMs:1000,spawnProcess:()=>{spawned=true;return p;},exec:(file,args,options)=>{
  calls++;return delayedReply(calls===1?24147:2000,calls===1?[]:[{sourcePort:21345,visibility:'private'}],options);
 }}).then(()=>({ready:true}),error=>({ready:false,error:error.message}));
 t.mock.timers.tick(24147);await flush();
 t.mock.timers.tick(1000);await flush();
 t.mock.timers.tick(2000);await flush();
 assert.deepEqual(await result,{ready:true});
 assert.equal(spawned,true);assert.equal(calls,2);assert.deepEqual(p.signals,['SIGTERM']);
});
test('a slow lookup and privacy change share one deadline rather than receiving new budgets',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:1000});
 const calls=[];let outcome;
 const result=ensureCodespacePreview({...base,timeoutMs:60000,spawnProcess:()=>assert.fail('mapping exists'),exec:(file,args,options)=>{
  calls.push(args);return delayedReply(calls.length===1?24147:40000,[{sourcePort:21345,visibility:'public'}],options);
 }}).then(()=>{outcome='ready';},error=>{outcome=error.message;});
 t.mock.timers.tick(24147);await flush();
 assert.equal(calls.length,2);assert.equal(calls[1][2],'visibility');
 t.mock.timers.tick(35852);await flush();assert.equal(outcome,undefined);
 t.mock.timers.tick(1);await result;assert.equal(outcome,'gh timed out');
});
test('preview registration stops at its deadline without another lookup and closes the forwarder',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:1000});
 const p=child();let calls=0,outcome;
 const result=ensureCodespacePreview({...base,timeoutMs:500,pollMs:1000,spawnProcess:()=>p,exec:async()=>{calls++;return '[]';}})
  .then(()=>{outcome={ready:true};},error=>{outcome={error:error.message};});
 await flush();t.mock.timers.tick(500);await flush();
 const atDeadline=outcome;
 t.mock.timers.tick(500);await result;
 assert.deepEqual(atDeadline,{error:'Codespaces preview registration timed out.'});
 assert.equal(calls,1);assert.deepEqual(p.signals,['SIGTERM']);
});
