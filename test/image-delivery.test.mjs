import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { GitHubImageDelivery } from '../src/image-delivery.mjs';
import { trustedImageUrl } from '../src/artifact-url.mjs';
import { prepareRuntimeImages } from '../src/container-runtime.mjs';
import { createApp } from '../src/server.mjs';
import { digest } from '../src/util.mjs';

const blob = Buffer.from('an immutable prepared application image');
const image = {id:'sha256:'+'a'.repeat(64), sha256:digest(blob), bytes:blob.length};
const signed = 'https://release-assets.githubusercontent.com/image.gz?sig=short-lived-test';
const asset = {id:42, name:image.sha256+'.gz', state:'uploaded', size:image.bytes, digest:'sha256:'+image.sha256};
const json = value => new Response(JSON.stringify(value), {headers:{'Content-Type':'application/json'}});
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(),'pods-image-delivery-'));
  t.after(() => rm(root,{recursive:true,force:true}));
  await mkdir(join(root,'images')); await writeFile(join(root,'images',image.sha256+'.gz'),blob);
  const records = new Map(), store = {get:(_, key)=>records.get(key), put:(_, key, value)=>records.set(key,value)};
  return {root, records, store};
}

test('private publisher verifies upload bytes and GitHub digest, then reuses the existing asset', async t => {
  const {root,records,store} = await fixture(t); let uploads=0, saved=null;
  const fetcher = async (url, options) => {
    assert.equal(options.headers.Authorization,'Bearer server-only-token'); assert.equal(options.redirect,'manual');
    if (url === 'https://api.github.com/repos/owner/artifacts') return json({private:true});
    if (url.startsWith('https://uploads.github.com/')) {
      uploads++; const chunks=[]; for await (const chunk of options.body) chunks.push(chunk);
      assert.deepEqual(Buffer.concat(chunks),blob); assert.equal(options.headers['Content-Length'],String(blob.length));
      saved=asset; return json(saved);
    }
    assert.match(url,/releases\/7\/assets\?per_page=100&page=1$/); return json(saved?[saved]:[]);
  };
  const delivery = new GitHubImageDelivery({repository:'owner/artifacts',releaseId:7,token:'server-only-token',data:root,store,fetcher});
  await delivery.publish([image]); await delivery.publish([image]); assert.equal(uploads,1);
  assert.deepEqual(records.get(image.sha256),{repository:'owner/artifacts',releaseId:7,assetId:42,sha256:image.sha256,bytes:image.bytes});
  assert.doesNotMatch(JSON.stringify([...records]),/server-only-token|sig=/);
});

test('publication refuses public repositories, conflicting assets and changed local image bytes', async t => {
  const {root,store,records} = await fixture(t); let privateRepo=true, existing=null, writes=0;
  const delivery = new GitHubImageDelivery({repository:'owner/artifacts',releaseId:7,token:'secret',data:root,store,fetcher:async(url,options)=>{
    if (options.method==='POST') {writes++; throw new Error('Upload should not occur');}
    return url.endsWith('/owner/artifacts')?json({private:privateRepo}):json(existing?[existing]:[]);
  }});
  privateRepo=false; await assert.rejects(delivery.publish([image]),/private repository/);
  privateRepo=true;
  for (const change of [{digest:'sha256:'+'b'.repeat(64)},{size:1},{id:-1},{state:'new'}]) {
    existing={...asset,...change}; await assert.rejects(delivery.publish([image]),/identity mismatch/);
  }
  existing=null; await writeFile(join(root,'images',image.sha256+'.gz'),Buffer.alloc(blob.length));
  await assert.rejects(delivery.publish([image]),/integrity check failed/);
  assert.equal(writes,0); assert.equal(records.size,0);
});

test('private asset discovery follows bounded pagination without duplicating an existing image', async t => {
  const {root,store} = await fixture(t); const pages=[];
  const delivery = new GitHubImageDelivery({repository:'owner/artifacts',releaseId:7,token:'secret',data:root,store,fetcher:async url=>{
    if (url.endsWith('/owner/artifacts')) return json({private:true});
    const page=Number(new URL(url).searchParams.get('page')); pages.push(page);
    return json(page===1?Array.from({length:100},(_,i)=>({name:'other-'+i})):[asset]);
  }});
  await delivery.publish([image]); assert.deepEqual(pages,[1,2]); assert.equal(store.get('',image.sha256).assetId,42);
});

test('resolution uses only verified private asset mappings and never persists a signed URL', async t => {
  const {root,store,records} = await fixture(t); let mode='redirect', calls=0, privateRepo=true;
  const delivery = new GitHubImageDelivery({repository:'owner/artifacts',releaseId:7,token:'server-only-token',data:root,store,fetcher:async(url,options)=>{
    calls++; assert.equal(options.redirect,'manual'); assert.equal(options.headers.Authorization,'Bearer server-only-token');
    if (url.endsWith('/owner/artifacts')) return json({private:privateRepo});
    assert.match(url,/releases\/assets\/42$/);
    if (mode==='error') throw new Error('provider unavailable');
    if (mode==='stream') return new Response(blob);
    if (mode==='missing') return new Response(null,{status:404});
    return new Response(null,{status:302,headers:{Location:mode==='unsafe'?'https://evil.example/secret':signed}});
  }});
  assert.equal(await delivery.resolve(image),null); assert.equal(calls,0);
  const record={repository:'owner/artifacts',releaseId:7,assetId:42,sha256:image.sha256,bytes:image.bytes};
  for (const change of [{repository:'other/repository'},{releaseId:8},{bytes:1},{assetId:-1},{sha256:'b'.repeat(64)}]) {
    records.set(image.sha256,{...record,...change}); assert.equal(await delivery.resolve(image),null); assert.equal(calls,0);
  }
  records.set(image.sha256,record); assert.equal(await delivery.resolve(image),signed);
  for (mode of ['unsafe','stream','missing','error']) assert.equal(await delivery.resolve(image),null);
  privateRepo=false; mode='redirect'; assert.equal(await delivery.resolve(image),null);
  assert.deepEqual(records.get(image.sha256),record);
});

test('configuration and destination validation reject partial credentials and untrusted download URLs', () => {
  assert.equal(GitHubImageDelivery.fromEnv({env:{}}),null);
  for (const env of [{PODS_IMAGE_RELEASE_TOKEN:'secret'},{PODS_IMAGE_RELEASE_REPOSITORY:'owner/repo',PODS_IMAGE_RELEASE_ID:'0',PODS_IMAGE_RELEASE_TOKEN:'secret'}]) assert.throws(()=>GitHubImageDelivery.fromEnv({env}),/configuration/);
  assert.equal(trustedImageUrl(signed),signed);
  for (const url of ['http://release-assets.githubusercontent.com/a?sig=x','https://release-assets.githubusercontent.com.evil.example/a?sig=x','https://release-assets.githubusercontent.com:8443/a?sig=x','https://user:secret@release-assets.githubusercontent.com/a?sig=x',signed+'#fragment','https://release-assets.githubusercontent.com/a','https://127.0.0.1/a?sig=x','/relative',null]) assert.equal(trustedImageUrl(url),null);
});

async function runtime(t, fetcher) {
  const root=await mkdtemp(join(tmpdir(),'pods-cdn-runtime-'));t.after(()=>rm(root,{recursive:true,force:true}));
  let loaded=false,loads=0;
  const execute=async args=>{
    if(args[0]==='load'){assert.deepEqual(await readFile(args[2]),blob);loaded=true;loads++;return '';}
    if(!loaded)throw new Error('Image absent');return image.id;
  };
  const timings={}, config={id:'test-launch',artifactUrl:'https://pods.example/artifact',token:'launch-only-token'};
  await prepareRuntimeImages([image],config,root,timings,execute,fetcher);
  assert.equal(loads,1);assert.deepEqual(await readdir(join(root,'images')),[]);return timings;
}

test('runner downloads signed assets without forwarding either authorization header and checks identity before Docker load', async t => {
  const calls=[];
  const timings=await runtime(t,async(url,options)=>{
    calls.push(String(url));
    if(String(url).startsWith('https://pods.example/')){
      assert.equal(options.headers.Authorization,'Bearer launch-only-token');assert.equal(options.headers['X-PODS-Image-Delivery'],'direct');
      return new Response(null,{status:307,headers:{Location:signed}});
    }
    assert.equal(url,signed);assert.equal(options.headers,undefined);assert.equal(options.redirect,'error');return new Response(blob);
  });
  assert.equal(calls.length,2);assert.equal(timings.imageCdnDownloads,1);assert.equal(timings.imageOriginDownloads,0);assert.equal(timings.imageCdnFallbacks,0);
});

test('failed, expired, truncated, oversized or corrupt CDN downloads fall back once to authorized local bytes', async t => {
  for (const failure of ['network','expired','truncated','oversized','corrupt','timeout','storage']) {
    let originCalls=0,cdnCalls=0;
    const timings=await runtime(t,async(url,options)=>{
      if(String(url).startsWith('https://pods.example/')){
        originCalls++;assert.equal(options.headers.Authorization,'Bearer launch-only-token');
        if(originCalls===1)return new Response(null,{status:307,headers:{Location:signed}});
        assert.equal(options.headers['X-PODS-Image-Delivery'],undefined);return new Response(blob);
      }
      cdnCalls++;assert.equal(options.headers,undefined);
      if(failure==='network')throw new Error('SECRET network unavailable '+signed);
      if(failure==='timeout')throw new DOMException('SECRET '+signed,'TimeoutError');
      if(failure==='storage')throw Object.assign(new Error('SECRET private path'),{code:'ENOSPC'});
      if(failure==='expired')return new Response(null,{status:403});
      return new Response(failure==='truncated'?blob.subarray(1):failure==='oversized'?Buffer.concat([blob,blob]):Buffer.alloc(blob.length));
    });
    assert.equal(originCalls,2);assert.equal(cdnCalls,1);assert.equal(timings.imageCdnDownloads,0);assert.equal(timings.imageCdnFallbacks,1);assert.equal(timings.imageOriginDownloads,1);
    const reason={network:'transfer',expired:'http',truncated:'size',oversized:'size',corrupt:'integrity',timeout:'timeout',storage:'storage'}[failure];
    assert.deepEqual(timings.imageCdnLastFailure,{reason,...(failure==='expired'?{httpStatus:403}:{})});
    assert.doesNotMatch(JSON.stringify(timings),/SECRET|sig=|server-only-token|launch-only-token/);
  }
});

test('runner rejects an untrusted redirect before making any external request or loading an image', async t => {
  const root=await mkdtemp(join(tmpdir(),'pods-cdn-reject-'));t.after(()=>rm(root,{recursive:true,force:true}));let requests=0,loads=0;
  await assert.rejects(prepareRuntimeImages([image],{id:'launch',artifactUrl:'https://pods.example/artifact',token:'secret'},root,{},async args=>{if(args[0]==='load')loads++;throw new Error('absent');},async()=>{requests++;return new Response(null,{status:307,headers:{Location:'http://127.0.0.1/private'}});}),/redirect rejected/);
  assert.equal(requests,1);assert.equal(loads,0);assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('corrupt CDN bytes followed by corrupt origin bytes never reach Docker and leave no partial archive', async t => {
  const root=await mkdtemp(join(tmpdir(),'pods-cdn-corrupt-'));t.after(()=>rm(root,{recursive:true,force:true}));let requests=0,loads=0;const timings={};
  await assert.rejects(prepareRuntimeImages([image],{id:'launch',artifactUrl:'https://pods.example/artifact',token:'secret'},root,timings,async args=>{if(args[0]==='load')loads++;throw new Error('absent');},async()=>{
    requests++;return requests===1?new Response(null,{status:307,headers:{Location:signed}}):new Response(Buffer.alloc(blob.length));
  }),/integrity check failed/);
  assert.equal(requests,3);assert.equal(loads,0);assert.equal(timings.imageCdnFallbacks,1);assert.equal(timings.imageOriginDownloads,0);assert.deepEqual(await readdir(join(root,'images')),[]);
});

test('server authorizes image membership before resolution, preserves legacy downloads and checks revocation after resolution', async t => {
  const {root}=await fixture(t);let resolutions=0,mode='direct',app;
  const id='a'.repeat(32), token='launch-capability';
  app=await createApp({data:root,secret:'ac'.repeat(32),providers:{},imageDelivery:{resolve:async()=>{
    resolutions++;
    if(mode==='revoke')app.store.put('launch',id,{...app.store.get('launch',id),status:'stopped'});
    if(mode==='failure')throw new Error('upstream failed');
    return mode==='unsafe'?'https://evil.example/image':mode==='missing'?null:signed;
  }}});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));await app.closeResources();});
  const launch={id,status:'starting',expiresAt:Date.now()+60000,tokenHash:digest(token),images:[image]};app.store.put('launch',id,launch);
  const url=`http://127.0.0.1:${app.server.address().port}/api/agent/${id}/artifact/images/${image.sha256}`;
  const options={headers:{Authorization:'Bearer '+token,'X-PODS-Image-Delivery':'direct'},redirect:'manual'};
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(url.replace(image.sha256,'f'.repeat(64)),options)).status,404);assert.equal(resolutions,0);
  let response=await fetch(url,{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),blob);assert.equal(resolutions,0);
  response=await fetch(url,options);assert.equal(response.status,307);assert.equal(response.headers.get('location'),signed);assert.equal(response.headers.get('cache-control'),'no-store');
  for(mode of ['failure','missing','unsafe']){response=await fetch(url,options);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),blob);}
  response=await fetch(url.replace(/\/artifact\/images\/.*$/,''),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:'starting',timings:{imageCdnRangeAttempts:1,imageCdnRangeDownloads:1,unknownSignedUrl:signed,imageCdnMs:-1}})});
  assert.equal(response.status,200);assert.deepEqual(app.store.get('launch',id).timings,{imageCdnRangeAttempts:1,imageCdnRangeDownloads:1,cacheHit:false});
  for(const [failure,expected] of [
    [{reason:'http',httpStatus:503,url:signed,message:'SECRET body'},{reason:'http',httpStatus:503}],
    [{reason:'range-metadata',httpStatus:206},{reason:'range-metadata'}],
    [{reason:'timeout',httpStatus:403},{reason:'timeout'}],
    [{reason:'http',httpStatus:600},{reason:'http'}],
    [{reason:'http',httpStatus:'403'},{reason:'http'}],
    [{reason:'http',httpStatus:403.5},{reason:'http'}],
    [{reason:signed,httpStatus:403},undefined],
    ['SECRET '+signed,undefined],
  ]) {
    response=await fetch(url.replace(/\/artifact\/images\/.*$/,''),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:'starting',timings:{imageCdnLastFailure:failure}})});
    assert.equal(response.status,200);assert.deepEqual(app.store.get('launch',id).timings,{cacheHit:false,...(expected?{imageCdnLastFailure:expected}:{})});
    assert.doesNotMatch(JSON.stringify(app.store.get('launch',id).timings),/SECRET|sig=/);
  }
  mode='revoke';assert.equal((await fetch(url,options)).status,410);
  const resolved=resolutions;assert.equal((await fetch(url,options)).status,404);assert.equal(resolutions,resolved);
  app.store.put('launch',id,{...launch,stopRequested:true});assert.equal((await fetch(url,options)).status,404);assert.equal(resolutions,resolved);
  app.store.put('launch',id,{...launch,expiresAt:Date.now()-1});assert.equal((await fetch(url,options)).status,401);assert.equal(resolutions,resolved);
});
