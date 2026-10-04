import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { deferredCommand } from '../src/deferred-command.mjs';

function fixture(t,program,options={}) {
  let child;
  const delivery=deferredCommand(process.execPath,['--input-type=module','-e',program],{
    holdTimeout:5000,timeout:5000,...options,spawnProcess:(...args)=>child=spawn(...args)});
  t.after(()=>delivery.cancel());
  return {delivery,child,ready:once(child.stdout,'data')};
}
const receiver=`process.stdout.write('READY\\n');let input='';for await(const b of process.stdin)input+=b;process.stdout.write(input);`;
const running=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};

test('SSH stdin stays open and empty until explicitly released; completion reaps the child',async t=>{
  const {delivery,child,ready}=fixture(t,receiver);
  assert.equal(String((await ready)[0]),'READY\n');assert.equal(child.stdin.writableEnded,false);
  let settled=false;delivery.result.finally(()=>settled=true);await new Promise(r=>setImmediate(r));
  assert.equal(settled,false);
  assert.equal(await delivery.send('launch-secret'),'READY\nlaunch-secret');
  assert.equal(running(child.pid),false);
});
test('privacy cancellation reaps SSH and refuses subsequent payload release',async t=>{
  const {delivery,child,ready}=fixture(t,receiver);await ready;
  await delivery.cancel();assert.equal(running(child.pid),false);
  await assert.rejects(delivery.send('must-not-send'),/cancelled/);
  assert.equal(child.stdin.writableEnded,false);
});
test('pre-release wait has a deadline and cancellation waits for process close',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {delivery,child,ready}=fixture(t,receiver,{holdTimeout:65000});await ready;
  t.mock.timers.tick(65000);
  await assert.rejects(delivery.result,/private-preview wait timed out/);
  assert.equal(running(child.pid),false);assert.equal(child.stdin.writableEnded,false);
});
test('slow privacy confirmation leaves a full separate delivery budget',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {delivery,child,ready}=fixture(t,`process.stdout.write('READY');process.stdin.resume();setInterval(()=>{},1000);`,{holdTimeout:65000,timeout:60000});await ready;
  t.mock.timers.tick(62000);const result=delivery.send('script');
  t.mock.timers.tick(59999);await new Promise(r=>setImmediate(r));assert.equal(running(child.pid),true);
  t.mock.timers.tick(1);await assert.rejects(result,/SSH delivery timed out/);assert.equal(running(child.pid),false);
});
test('early success, failed SSH and a missing executable cannot be mistaken for delivery',async t=>{
  for(const code of [0,7]){
    const {delivery}=fixture(t,`process.stdout.write('READY');process.exit(${code});`);
    await assert.rejects(delivery.result,/before private preview/);
    await assert.rejects(delivery.send('must-not-send'),/before private preview/);
  }
  const missing=deferredCommand('/no-such-pods-ssh',[]);
  await assert.rejects(missing.result,{code:'ENOENT'});await missing.cancel();
});
test('failed delivery is bounded, omits remote output and never sends twice',async t=>{
  const {delivery,child,ready}=fixture(t,`process.stdout.write('READY');for await(const b of process.stdin){};process.stderr.write('remote-secret');process.exit(4);`);await ready;
  const result=delivery.send('once');await assert.rejects(delivery.send('twice'),/already sent/);
  await assert.rejects(result,error=>/ended \(4\)/.test(error.message)&&!error.message.includes('secret'));
  assert.equal(running(child.pid),false);
});
test('cancellation kills an SSH descendant in the same process group',async t=>{
  const {delivery,ready}=fixture(t,`import {spawn} from 'node:child_process';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});process.stdout.write(String(child.pid));process.stdin.resume();setInterval(()=>{},1000);`);
  const pid=Number(String((await ready)[0]));assert.equal(running(pid),true);await delivery.cancel();
  // Linux may briefly retain an adopted, already dead zombie until init reaps it.
  let alive=true;
  for(let n=0;n<50&&alive;n++){
    if(process.platform==='linux'){
      const {readFile}=await import('node:fs/promises');
      const state=await readFile(`/proc/${pid}/stat`,'utf8').catch(()=>null);
      alive=state!==null&&!/\) Z /.test(state);
    }else alive=running(pid);
    if(alive)await new Promise(r=>setTimeout(r,10));
  }
  assert.equal(alive,false);
});
