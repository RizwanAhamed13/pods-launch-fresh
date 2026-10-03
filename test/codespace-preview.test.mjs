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
