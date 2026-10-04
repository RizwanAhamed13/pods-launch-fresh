import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {prepareRuntimeImages} from '../src/container-runtime.mjs';
import {downloadImageRanges} from '../src/image-ranges.mjs';
import {digest} from '../src/util.mjs';

const config={id:'pipeline-test',artifactUrl:'https://pods.example/artifact',token:'test-only'};
const signed='https://release-assets.githubusercontent.com/image.gz?sig=test-only';
const blobs=Array.from({length:4},(_,i)=>Buffer.alloc(4096+i,i+1));
const images=blobs.map((blob,i)=>({id:'sha256:'+String(i+1).repeat(64),sha256:digest(blob),bytes:blob.length}));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
async function temporary(t){const root=await mkdtemp(join(tmpdir(),'pods-image-pipeline-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
async function until(check){const deadline=Date.now()+2000;while(!await check()){assert.ok(Date.now()<deadline,'Expected concurrent stage did not occur');await delay(5);}}

// Gates test actual overlap and resource ownership without asserting machine speed.
test('two image slots overlap transfer with load, bound prefetch, and serialize verified Docker loads',async t=>{
  const root=await temporary(t),loadGate=deferred(),bodies=[deferred(),deferred()],loaded=new Set(),requested=[];
  let activeLoads=0,peakLoads=0,loadCalls=0;
  const execute=async args=>{
    if(args[0]!=='load'){if(!loaded.has(args[2]))throw Error('absent');return args[2];}
    const content=await readFile(args[2]),index=blobs.findIndex(b=>b.equals(content));assert.notEqual(index,-1,'Only complete verified images reach Docker');
    peakLoads=Math.max(peakLoads,++activeLoads);loadCalls++;
    if(index===0)await loadGate.promise;
    loaded.add(images[index].id);activeLoads--;return '';
  };
  const timings={};
  const run=prepareRuntimeImages(images,config,root,timings,execute,async url=>{
    const index=images.findIndex(i=>String(url).endsWith(i.sha256));assert.notEqual(index,-1);requested.push(index);
    if(index<2)await bodies[index].promise;return new Response(blobs[index]);
  });
  try {
    await until(()=>requested.length===2);assert.deepEqual([...requested].sort(),[0,1]);
    bodies[0].resolve();await until(()=>activeLoads===1);
    assert.equal(requested.length,2,'Second download remains pending while first image loads');
    bodies[1].resolve();await until(async()=> (await readdir(join(root,'images'))).filter(n=>n.endsWith('.gz')).length===2);
    assert.equal(loadCalls,1,'Verified second image must wait for the current Docker load');
    assert.equal(requested.length,2,'No unbounded queue of complete archives behind a slow load');
    loadGate.resolve();await run;
    assert.equal(loaded.size,4);assert.equal(peakLoads,1);assert.equal(timings.imageOriginDownloads,4);
    assert.deepEqual(await readdir(join(root,'images')),[]);
  } finally {bodies.forEach(g=>g.resolve());loadGate.resolve();await run.catch(()=>{});}
});

test('a corrupt peer cancels a pending body, preserves the first error and cleans partial files before return',async t=>{
  const root=await temporary(t);let requests=0,cancelled=0,loads=0;const firstRead=deferred();
  const timings={};
  await assert.rejects(prepareRuntimeImages(images.slice(0,3),config,root,timings,async args=>{if(args[0]==='load')loads++;throw Error('absent');},async url=>{
    requests++;
    if(String(url).endsWith(images[0].sha256))return new Response(new ReadableStream({start(c){c.enqueue(blobs[0].subarray(0,1));firstRead.resolve();},cancel(){cancelled++;}}));
    await firstRead.promise;return new Response(Buffer.alloc(blobs[1].length));
  }),/integrity check failed/);
  assert.equal(requests,2);assert.equal(cancelled,1);assert.equal(loads,0);assert.equal(timings.imageCdnFallbacks,0);
  assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('a failed Docker load cancels the peer range group without origin fallback and retains the verified retry archive',async t=>{
  const root=await temporary(t),allRanges=deferred(),large={...images[1],bytes:32*1024**2};
  let rangeCalls=0,aborted=0,loads=0,originCalls=0;const timings={};
  await mkdir(join(root,'images'));await writeFile(join(root,'images','unrelated'),'keep');
  await assert.rejects(prepareRuntimeImages([images[0],large,images[2]],config,root,timings,async args=>{
    if(args[0]!=='load')throw Error('absent');loads++;assert.deepEqual(await readFile(args[2]),blobs[0]);await allRanges.promise;throw Error('Docker load rejected');
  },async(url,options)=>{
    if(String(url).startsWith('https://pods.example/')){
      originCalls++;return String(url).endsWith(images[0].sha256)?new Response(blobs[0]):new Response(null,{status:307,headers:{Location:signed}});
    }
    rangeCalls++;if(rangeCalls===4)allRanges.resolve();
    return new Promise((resolve,reject)=>{const abort=()=>{aborted++;reject(new DOMException('Peer cancelled','AbortError'));};if(options.signal.aborted)abort();else options.signal.addEventListener('abort',abort,{once:true});});
  }),/Docker load rejected/);
  assert.equal(loads,1);assert.equal(originCalls,2);assert.equal(rangeCalls,4);assert.equal(aborted,4);
  assert.equal(timings.imageCdnFallbacks,0);assert.equal(timings.imageCdnLastFailure,undefined);
  assert.deepEqual((await readdir(join(root,'images'))).sort(),[images[0].sha256+'.gz','unrelated'].sort());
  assert.deepEqual(await readFile(join(root,'images',images[0].sha256+'.gz')),blobs[0]);
  assert.equal(await readFile(join(root,'images','unrelated'),'utf8'),'keep');
});

test('a pre-aborted image group never opens a range file or starts requests',async t=>{
  const root=await temporary(t),controller=new AbortController();controller.abort(new Error('group failed'));
  await assert.rejects(downloadImageRanges(signed,images[0],join(root,'image.gz'),()=>assert.fail('No request expected'),controller.signal),/group failed/);
  assert.deepEqual(await readdir(root),[]);
});

test('conflicting image archive identities fail before any inspect, network request or staging file',async t=>{
  const root=await temporary(t);const forbidden=()=>assert.fail('Must reject before external work');
  await assert.rejects(prepareRuntimeImages([images[0],{...images[0],id:images[1].id}],config,root,{},forbidden,forbidden),/Conflicting prepared image archives/);
  assert.deepEqual(await readdir(root),[]);
});

test('an existing temporary archive is never overwritten or deleted when exclusive creation fails',async t=>{
  const root=await temporary(t);await mkdir(join(root,'images'));
  const path=join(root,'images',images[0].sha256+'.gz.'+config.id);await writeFile(path,'unrelated prior bytes');
  await assert.rejects(prepareRuntimeImages([images[0]],config,root,{},async args=>{assert.notEqual(args[0],'load');throw Error('absent');},async()=>new Response(blobs[0])),{code:'EEXIST'});
  assert.equal(await readFile(path,'utf8'),'unrelated prior bytes');
});

test('an empty successful response fails before creating a temporary archive',async t=>{
  const root=await temporary(t);
  await assert.rejects(prepareRuntimeImages([images[0]],config,root,{},async args=>{assert.notEqual(args[0],'load');throw Error('absent');},async()=>new Response(null)),/integrity check failed/);
  await delay(20);
  assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('parent cancellation stops stalled range bodies and removes their partial archive',async t=>{
  const root=await temporary(t),controller=new AbortController();let requests=0,cancelled=0;
  const run=downloadImageRanges(signed,images[0],join(root,'image.gz'),async(_,options)=>{
    const [,a,b]=/^bytes=(\d+)-(\d+)$/.exec(options.headers.Range);requests++;
    return new Response(new ReadableStream({start(c){c.enqueue(blobs[0].subarray(Number(a),Number(a)+1));},cancel(){cancelled++;}}),{status:206,headers:{'Content-Range':`bytes ${a}-${b}/${images[0].bytes}`,'Content-Length':String(Number(b)-Number(a)+1)}});
  },controller.signal);
  try {await until(()=>requests===4);controller.abort(new Error('image group failed'));await assert.rejects(run,/range transfer failed/);assert.equal(cancelled,4);assert.deepEqual(await readdir(root),[]);}
  finally {controller.abort();await run.catch(()=>{});}
});
