import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareRuntimeImages} from '../src/container-runtime.mjs';
import {registryTarget} from '../src/image-pull.mjs';
import {docker} from '../src/containers.mjs';
import {command, digest} from '../src/util.mjs';

const bytes=Buffer.from('verified full image archive');
const image={id:'sha256:'+'a'.repeat(64),sha256:digest(bytes),bytes:bytes.length};
const config={id:'A'.repeat(32),token:'T'.repeat(32),artifactUrl:'https://pods.example/api/agent/launch/artifact',registryImages:[image.sha256]};
async function temporary(t){const root=await mkdtemp(join(tmpdir(),'pods-pull-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const noFetch=()=>assert.fail('No full-image download expected');

test('registry target is launch-scoped, digest-pinned and cannot redirect the launch capability',()=>{
  assert.equal(registryTarget(image,config).reference,`pods.example/pods/${Buffer.from(config.id).toString('hex')}/${image.sha256}@${image.id}`);
  assert.equal(registryTarget(image,{...config,registryImages:[]}),null);
  for(const patch of [{registryImages:['bad']},{registryImages:'all'},{artifactUrl:'http://elsewhere.invalid/path'},{artifactUrl:'https://user:pass@pods.example/a'},{id:'bad'},{token:'bad'}])assert.throws(()=>registryTarget(image,{...config,...patch}),/Invalid registry/);
});

test('pull uses only ephemeral private launch credentials and still pulls when an incomplete image ID could be cached',async t=>{
  const root=await temporary(t),timings={},calls=[];
  await mkdir(join(root,'.docker'));await writeFile(join(root,'.docker/config.json'),'preserve user login');
  await prepareRuntimeImages([image],config,root,timings,async(args,options)=>{
    calls.push(args);
    if(args[0]==='--config'){
      assert.deepEqual(args.slice(2,5),['pull','--platform','linux/amd64']);assert.equal(options.timeout,45000);assert.ok(options.signal);
      const file=join(args[1],'config.json');assert.equal((await stat(args[1])).mode&0o777,0o700);assert.equal((await stat(file)).mode&0o777,0o600);
      const credentials=JSON.parse(await readFile(file,'utf8'));assert.deepEqual(credentials,{auths:{'pods.example':{auth:Buffer.from(config.id+':'+config.token).toString('base64')}}});return '';
    }
    assert.deepEqual(args,['image','inspect',image.id,'--format','{{.Id}}']);return image.id;
  },noFetch);
  assert.equal(calls[0][0],'--config');assert.equal(timings.imageRegistryPulls,1);assert.equal(timings.imageCacheHits,0);
  assert.deepEqual((await readdir(root)).sort(),['.docker','images']);assert.equal(await readFile(join(root,'.docker/config.json'),'utf8'),'preserve user login');
});

test('failed or identity-mismatched pull forces a verified full load despite a visible cached image ID',async t=>{
  for(const mismatch of [false,true])await t.test(String(mismatch),async t=>{
    const root=await temporary(t),timings={};let pulled=false,loaded=false,downloads=0;
    await prepareRuntimeImages([image],config,root,timings,async args=>{
      if(args[0]==='--config'){pulled=true;if(!mismatch)throw Error('partial pull secret-signed-url');return '';}
      if(args[0]==='load'){assert.ok(pulled);assert.deepEqual(await readFile(args[2]),bytes);loaded=true;return '';}
      return mismatch&&!loaded?'sha256:'+'b'.repeat(64):image.id;
    },async()=>{downloads++;return new Response(bytes);});
    assert.equal(loaded,true);assert.equal(downloads,1);assert.equal(timings.imageRegistryFallbacks,1);assert.equal(timings.imageRegistryPulls,0);
    assert.doesNotMatch(JSON.stringify(timings),/secret/);assert.deepEqual(await readdir(root),['images']);assert.deepEqual(await readdir(join(root,'images')),[]);
  });
});

test('fallback reuses a verified archive but never loads corrupt bytes or reports a registry error',async t=>{
  const root=await temporary(t),timings={};await mkdir(join(root,'images'));await writeFile(join(root,'images',image.sha256+'.gz'),bytes);
  let loads=0;
  await prepareRuntimeImages([image],config,root,timings,async args=>{if(args[0]==='--config')throw Error('secret');if(args[0]==='load'){loads++;return '';}return image.id;},noFetch);
  assert.equal(loads,1);assert.equal(timings.imageArchiveCacheHits,1);
  await assert.rejects(prepareRuntimeImages([image],config,root,{},async args=>{assert.notEqual(args[0],'load');throw Error('registry-secret');},async()=>new Response(Buffer.alloc(bytes.length))),/integrity check failed/);
  assert.deepEqual(await readdir(root),['images']);assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('parent cancellation waits for pull shutdown, removes credentials, and never starts archive fallback',async t=>{
  const root=await temporary(t),controller=new AbortController(),entered=deferred(),closed=deferred();let authPath,settled=false;
  const result=prepareRuntimeImages([image],config,root,{},async(args,{signal})=>{
    assert.equal(args[0],'--config');authPath=join(args[1],'config.json');entered.resolve();
    await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));await closed.promise;throw signal.reason;
  },noFetch,controller.signal);
  result.then(()=>{settled=true;},()=>{settled=true;});await entered.promise;controller.abort(Error('Launch stopped'));
  await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);assert.ok(await stat(authPath));closed.resolve();
  await assert.rejects(result,/Launch stopped/);assert.deepEqual(await readdir(root),['images']);
});

test('a failed archive peer cancels an in-flight registry pull and stops the bounded worker group',async t=>{
  const root=await temporary(t),entered=deferred();let aborted=false;
  const other={...image,id:'sha256:'+'b'.repeat(64),sha256:digest('another archive')};
  await assert.rejects(prepareRuntimeImages([image,other,{...other,sha256:digest('never start')}],config,root,{},async(args,{signal})=>{
    if(args[0]!=='--config')throw Error('absent');entered.resolve();
    await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));aborted=true;throw signal.reason;
  },async()=>{await entered.promise;return new Response(Buffer.alloc(image.bytes));}),/integrity check failed/);
  assert.equal(aborted,true);assert.deepEqual(await readdir(root),['images']);assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('Docker cancellation and deadline reap the actual CLI child before returning',async t=>{
  const root=await temporary(t),pidFile=join(root,'pid');
  await writeFile(join(root,'docker'),`#!${process.execPath}\nimport fs from 'node:fs';fs.writeFileSync(process.env.TEST_PID,String(process.pid));console.log('ready');setInterval(()=>{},1000);\n`,{mode:0o700});
  const env={PATH:root,HOME:root,TEST_PID:pidFile};
  for(const mode of ['cancel','timeout']){
    const controller=new AbortController(),ready=deferred();t.mock.timers.enable({apis:['setTimeout']});
    try{
      const result=docker(['pull','test'],{env,signal:controller.signal,timeout:10000,output:()=>ready.resolve()});await ready.promise;
      const pid=Number(await readFile(pidFile,'utf8'));
      if(mode==='cancel')controller.abort(Error('stopped'));else t.mock.timers.tick(10000);
      await assert.rejects(result,mode==='cancel'?/stopped/:/timed out/);assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
    }finally{t.mock.timers.reset();}
  }
});

test('generic command timeout retains the caller lock until the child is reaped',async t=>{
  const ready=deferred();let pid;t.mock.timers.enable({apis:['setTimeout']});
  const result=command(process.execPath,['-e','console.log(process.pid);setInterval(()=>{},1000)'],{timeout:10000,onStdout:value=>{pid=Number(value);ready.resolve();}});
  await ready.promise;t.mock.timers.tick(10000);await assert.rejects(result,/timed out/);assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
});
