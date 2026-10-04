import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { downloadImageRanges } from '../src/image-ranges.mjs';
import { prepareRuntimeImages } from '../src/container-runtime.mjs';
import { digest } from '../src/util.mjs';

const signed='https://release-assets.githubusercontent.com/image.gz?sig=short-lived-test';
const bytes=Buffer.from(Array.from({length:1027},(_,i)=>i%251));
const image={id:'sha256:'+'a'.repeat(64),sha256:digest(bytes),bytes:bytes.length};
async function temporary(t) {
  const root=await mkdtemp(join(tmpdir(),'pods-range-test-'));
  t.after(()=>rm(root,{recursive:true,force:true}));return root;
}
function range(options,source=bytes) {
  assert.deepEqual(Object.keys(options.headers),['Range']);assert.equal(options.redirect,'error');
  const match=/^bytes=(\d+)-(\d+)$/.exec(options.headers.Range);assert.ok(match);
  const start=Number(match[1]),end=Number(match[2]);
  return {start,end,body:source.subarray(start,end+1),headers:{'Content-Range':`bytes ${start}-${end}/${source.length}`,'Content-Length':String(end-start+1)}};
}

test('four concurrent ranges reassemble out of order into an exact private verified archive',async t=>{
  const root=await temporary(t),path=join(root,'image.gz'),waiting=[],observed=[];
  await downloadImageRanges(signed,image,path,async(url,options)=>{
    assert.equal(url,signed);const part=range(options);observed.push(part);
    await new Promise(resolve=>{waiting.push(resolve);if(waiting.length===4)for(const done of [...waiting].reverse())done();});
    return new Response(part.body,{status:206,headers:part.headers});
  });
  assert.equal(observed.length,4);assert.equal(observed[0].start,0);assert.equal(observed.at(-1).end,bytes.length-1);
  assert.deepEqual(await readFile(path),bytes);assert.equal((await stat(path)).mode&0o777,0o600);
});

test('large images use eight bounded ranges and verify the exact uneven archive before publication',async t=>{
  const root=await temporary(t),path=join(root,'large.gz');
  const source=Buffer.alloc(64*1024**2+3,47);source[0]=1;source[Math.floor(source.length/2)]=2;source[source.length-1]=3;
  const large={...image,sha256:digest(source),bytes:source.length},observed=[];
  let inFlight=0,peak=0;
  await downloadImageRanges(signed,large,path,async(_,options)=>{
    const part=range(options,source);observed.push(part);peak=Math.max(peak,++inFlight);
    await new Promise(resolve=>setImmediate(resolve));inFlight--;
    return new Response(part.body,{status:206,headers:part.headers});
  });
  assert.equal(observed.length,8);assert.equal(peak,8);
  assert.equal(observed[0].start,0);assert.equal(observed.at(-1).end,source.length-1);
  for(let i=1;i<observed.length;i++)assert.equal(observed[i].start,observed[i-1].end+1);
  assert.deepEqual(await readFile(path),source);assert.equal((await stat(path)).mode&0o777,0o600);
});

test('a failed large-image range cancels all seven peers and removes unverified bytes',async t=>{
  const root=await temporary(t),large={...image,bytes:64*1024**2};let requests=0,aborted=0;
  await assert.rejects(downloadImageRanges(signed,large,join(root,'large.gz'),async(_,options)=>{
    requests++;
    if(requests===1)return new Response(null,{status:403});
    return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted++;reject(new Error('Canceled'));},{once:true}));
  }),/range transfer failed/);
  assert.equal(requests,8);assert.equal(aborted,7);assert.deepEqual(await readdir(root),[]);
});

test('range status, offsets, totals, length and full-file digest are enforced with partial files removed',async t=>{
  const root=await temporary(t),path=join(root,'image.gz');
  for(const failure of ['ignored-range','expired','redirect','offset','total','length','truncated','oversized','corrupt','network']) {
    await assert.rejects(downloadImageRanges(signed,image,path,async(_,options)=>{
      const part=range(options);
      if(part.start!==0)return new Response(part.body,{status:206,headers:part.headers});
      if(failure==='network')throw new Error('Network unavailable');
      if(failure==='ignored-range')return new Response(bytes);
      if(failure==='expired')return new Response(null,{status:403});
      if(failure==='redirect')return new Response(null,{status:302,headers:{Location:'https://evil.example/image'}});
      if(failure==='offset')part.headers['Content-Range']=`bytes 1-${part.end}/${bytes.length}`;
      if(failure==='total')part.headers['Content-Range']=`bytes 0-${part.end}/${bytes.length+1}`;
      if(failure==='length')part.headers['Content-Length']='0';
      if(failure==='truncated')part.body=part.body.subarray(1);
      if(failure==='oversized')part.body=Buffer.concat([part.body,Buffer.from([0])]);
      if(failure==='corrupt')part.body=Buffer.alloc(part.body.length);
      return new Response(part.body,{status:206,headers:part.headers});
    }),/range transfer failed|integrity check failed/,failure);
    assert.deepEqual(await readdir(root),[],failure);
  }
});

test('one rejected range aborts pending peers before closing and removing the output',async t=>{
  const root=await temporary(t);let requests=0,aborted=0;
  await assert.rejects(downloadImageRanges(signed,image,join(root,'image.gz'),async(_,options)=>{
    requests++;
    if(requests===1)return new Response(null,{status:403});
    return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted++;reject(new Error('Canceled'));},{once:true}));
  }),/range transfer failed/);
  assert.equal(requests,4);assert.equal(aborted,3);assert.deepEqual(await readdir(root),[]);
});

test('invalid range inputs and existing destinations never fetch, overwrite or delete unrelated bytes',async t=>{
  const root=await temporary(t),path=join(root,'existing.gz');await writeFile(path,'keep');
  const fetcher=()=>assert.fail('No request should be made');
  await assert.rejects(downloadImageRanges(signed,image,path,fetcher),{code:'EEXIST'});
  for(const bad of [{...image,bytes:0},{...image,bytes:513*1024**2},{...image,bytes:1.5},{...image,sha256:'bad'}])await assert.rejects(downloadImageRanges(signed,bad,path,fetcher),/Invalid image/);
  await assert.rejects(downloadImageRanges('https://evil.example/image',image,path,fetcher),/Invalid image/);
  assert.equal(await readFile(path,'utf8'),'keep');
});

for(const mode of ['ranges','origin-fallback','corrupt-both'])test(`large runtime image ${mode} verifies the entire archive before Docker load`,async t=>{
  const root=await temporary(t),source=Buffer.alloc(32*1024**2,47),large={...image,sha256:digest(source),bytes:source.length};
  let loaded=false,loads=0,originCalls=0,rangeCalls=0;const timings={};
  const execute=async args=>{
    if(args[0]==='load'){assert.equal(digest(await readFile(args[2])),large.sha256);loads++;loaded=true;return '';}
    if(!loaded)throw new Error('Image absent');return large.id;
  };
  const fetcher=async(url,options)=>{
    if(String(url).startsWith('https://pods.example/')){
      originCalls++;assert.equal(options.headers.Authorization,'Bearer launch-only');
      if(originCalls===1){assert.equal(options.headers['X-PODS-Image-Delivery'],'direct');return new Response(null,{status:307,headers:{Location:signed}});}
      assert.equal(options.headers['X-PODS-Image-Delivery'],undefined);return new Response(mode==='corrupt-both'?Buffer.alloc(source.length):source);
    }
    assert.equal(url,signed);const part=range(options,source);rangeCalls++;
    if(mode!=='ranges'&&part.start===0)return new Response(null,{status:403});
    return new Response(part.body,{status:206,headers:part.headers});
  };
  const run=prepareRuntimeImages([large],{id:'range-launch',artifactUrl:'https://pods.example/artifact',token:'launch-only'},root,timings,execute,fetcher);
  if(mode==='corrupt-both')await assert.rejects(run,/integrity check failed/);else await run;
  assert.equal(rangeCalls,4);assert.equal(originCalls,mode==='ranges'?1:2);assert.equal(loads,mode==='corrupt-both'?0:1);
  assert.equal(timings.imageCdnRangeAttempts,1);assert.equal(timings.imageCdnRangeDownloads,mode==='ranges'?1:0);
  assert.equal(timings.imageCdnFallbacks,mode==='ranges'?0:1);assert.equal(timings.imageOriginDownloads,mode==='origin-fallback'?1:0);
  assert.deepEqual(await readdir(join(root,'images')),[]);
});
