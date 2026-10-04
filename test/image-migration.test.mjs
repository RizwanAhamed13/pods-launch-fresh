import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { digest } from '../src/util.mjs';
import { GitHubImageDelivery } from '../src/image-delivery.mjs';
import { migratePreparedImages } from '../src/image-migration.mjs';

const run = promisify(execFile), appId = 'prepared-example';
async function fixture(t, count = 2, bundle = false) {
  const data = await mkdtemp(join(tmpdir(), 'pods-image-migration-'));
  t.after(() => rm(data, {recursive:true, force:true}));
  await mkdir(join(data,'artifacts')); await mkdir(join(data,'images'));
  const images = [];
  for (let i=0; i<count; i++) {
    const bytes=Buffer.from('prepared image '+i), image={id:'sha256:'+String(i+1).repeat(64),sha256:digest(bytes),bytes:bytes.length};
    images.push(image); await writeFile(join(data,'images',image.sha256+'.gz'),bytes);
  }
  const artifact = bundle ? {format:1,entry:'app.cjs',healthPath:'/',files:[{path:'app.cjs',data:Buffer.from('app').toString('base64')}]}
    : {format:2,runtime:'docker',healthPath:'/',containers:{web:'web',port:8080,images,services:{web:{image:images[0].id},worker:{image:images[0].id}}}};
  const archive=gzipSync(JSON.stringify(artifact)), manifest={id:appId,sha256:digest(archive),bytes:archive.length,...(!bundle?{images}:{})};
  const metadata=join(data,'artifacts',appId+'.json'), archivePath=join(data,'artifacts',manifest.sha256+'.gz');
  await writeFile(metadata,JSON.stringify(manifest)); await writeFile(archivePath,archive);
  const records=new Map(), assets=new Map(), uploads=new Map(); let failOnce=false, privateRepo=true, calls=0;
  const store={get:(_,key)=>records.get(key),put:(_,key,value)=>records.set(key,value)};
  const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
  const delivery=new GitHubImageDelivery({repository:'owner/private-images',releaseId:7,token:'server-only-secret',data,store,fetcher:async(url,options)=>{
    calls++; assert.equal(options.headers.Authorization,'Bearer server-only-secret');
    if (url==='https://api.github.com/repos/owner/private-images') return json({private:privateRepo});
    if (url.startsWith('https://uploads.github.com/')) {
      const name=new URL(url).searchParams.get('name'), parts=[];
      for await(const part of options.body)parts.push(part);
      const bytes=Buffer.concat(parts); assert.equal(name,digest(bytes)+'.gz');
      uploads.set(name,(uploads.get(name)||0)+1);
      const asset={id:100+assets.size,name,state:'uploaded',size:bytes.length,digest:'sha256:'+digest(bytes)};
      assets.set(name,asset);
      if(failOnce && assets.size===2){failOnce=false;throw new Error('provider-response-lost');}
      return json(asset);
    }
    if(url.includes('/releases/assets/'))return new Response(null,{status:302,headers:{Location:'https://release-assets.githubusercontent.com/verified.gz?temporary=true'}});
    return json([...assets.values()]);
  }});
  return {data,images,metadata,archivePath,manifest,delivery,records,assets,uploads,calls:()=>calls,
    loseSecondResponse:()=>{failOnce=true;},makePublic:()=>{privateRepo=false;}};
}
async function snapshot(data) {
  const result={};for(const folder of ['artifacts','images'])for(const file of await readdir(join(data,folder)))result[folder+'/'+file]=digest(await readFile(join(data,folder,file)));
  return result;
}

test('migration dry-run verifies prepared bytes without contacting delivery or changing files',async t=>{
  const f=await fixture(t), before=await snapshot(f.data);
  const result=await migratePreparedImages({data:f.data,appId,delivery:f.delivery});
  assert.equal(result.mode,'dry-run');assert.equal(result.imageCount,2);assert.equal(result.verifiedMappings,0);
  assert.equal(f.calls(),0);assert.equal(f.records.size,0);assert.deepEqual(await snapshot(f.data),before);
});

test('migration publishes shared service images once, preserves links, and resolves through existing delivery',async t=>{
  const f=await fixture(t), before=await snapshot(f.data), progress=[];
  const result=await migratePreparedImages({data:f.data,appId,delivery:f.delivery,publish:true,onProgress:p=>progress.push(p)});
  assert.equal(result.verifiedMappings,2);assert.deepEqual(progress.map(p=>p.verifiedMappings),[1,2]);
  assert.equal(f.uploads.size,2);assert.ok([...f.uploads.values()].every(n=>n===1));
  assert.equal(await f.delivery.resolve(f.images[0]),'https://release-assets.githubusercontent.com/verified.gz?temporary=true');
  assert.deepEqual(await snapshot(f.data),before);assert.doesNotMatch(JSON.stringify([...f.records]),/server-only-secret|temporary=true/);
});

test('retry resumes partial publication and recovers an uploaded asset whose response was lost',async t=>{
  const f=await fixture(t), before=await snapshot(f.data);f.loseSecondResponse();
  await assert.rejects(migratePreparedImages({data:f.data,appId,delivery:f.delivery,publish:true}),/provider-response-lost/);
  assert.equal(f.records.size,1);assert.equal(f.assets.size,2);
  for(let i=0;i<2;i++)assert.equal((await migratePreparedImages({data:f.data,appId,delivery:f.delivery,publish:true})).verifiedMappings,2);
  assert.equal(f.records.size,2);assert.ok([...f.uploads.values()].every(n=>n===1));assert.deepEqual(await snapshot(f.data),before);
});

test('migration rejects changed metadata, archive, or any image before a remote write',async t=>{
  for(const mode of ['id','metadata-images','archive','image','conflicting-image-hash'])await t.test(mode,async t=>{
    const f=await fixture(t);
    if(mode==='id')await writeFile(f.metadata,JSON.stringify({...f.manifest,id:'another-app'}));
    if(mode==='metadata-images')await writeFile(f.metadata,JSON.stringify({...f.manifest,images:[f.images[0],f.images[0]]}));
    if(mode==='archive')await writeFile(f.archivePath,Buffer.alloc(f.manifest.bytes));
    if(mode==='image')await writeFile(join(f.data,'images',f.images[1].sha256+'.gz'),Buffer.alloc(f.images[1].bytes));
    if(mode==='conflicting-image-hash') {
      const artifact=JSON.parse(gunzipSync(await readFile(f.archivePath)));
      artifact.containers.images[1]={...f.images[1],sha256:f.images[0].sha256,bytes:f.images[0].bytes};
      const bytes=gzipSync(JSON.stringify(artifact)), sha256=digest(bytes);
      await writeFile(join(f.data,'artifacts',sha256+'.gz'),bytes);
      await writeFile(f.metadata,JSON.stringify({...f.manifest,sha256,bytes:bytes.length,images:artifact.containers.images}));
    }
    await assert.rejects(migratePreparedImages({data:f.data,appId,delivery:f.delivery,publish:true}));
    assert.equal(f.calls(),0);assert.equal(f.records.size,0);
  });
});

test('migration rejects symlink inputs and untrusted application paths',async t=>{
  const f=await fixture(t,1), imagePath=join(f.data,'images',f.images[0].sha256+'.gz');
  const original=await readFile(imagePath), alternate=join(f.data,'alternate');await writeFile(alternate,original);
  await rm(imagePath);await symlink(alternate,imagePath);
  await assert.rejects(migratePreparedImages({data:f.data,appId,delivery:f.delivery,publish:true}),/regular file/);
  for(const invalid of ['../prepared-example','/tmp/app','A'.repeat(70)])await assert.rejects(migratePreparedImages({data:f.data,appId:invalid,publish:true}),/application id/);
  assert.equal(f.calls(),0);
});

test('bundle migration is a no-op while container publication requires private delivery',async t=>{
  const bundle=await fixture(t,0,true), container=await fixture(t,1);
  assert.equal((await migratePreparedImages({data:bundle.data,appId,publish:true})).imageCount,0);
  await assert.rejects(migratePreparedImages({data:container.data,appId,publish:true}),/not configured/);
  container.makePublic();await assert.rejects(migratePreparedImages({data:container.data,appId,delivery:container.delivery,publish:true}),/private repository/);
  assert.equal(container.uploads.size,0);assert.equal(container.records.size,0);
});

test('operator CLI defaults to offline dry-run and returns a bounded error without leaking secrets',async t=>{
  const f=await fixture(t,1), script=resolve('scripts/migrate-image-delivery.mjs');
  const env={...process.env,PODS_DATA:f.data,PODS_SECRET:'',PODS_IMAGE_RELEASE_TOKEN:'do-not-print-this-secret'};
  const output=await run(process.execPath,[script,'--app',appId],{env});const result=JSON.parse(output.stdout);
  assert.equal(result.event,'complete');assert.equal(result.mode,'dry-run');assert.equal(result.verifiedMappings,0);
  assert.ok(!(await readdir(f.data)).includes('pods.sqlite'));
  for(const args of [['--app',appId,'--publish'],['--app','../do-not-print-this-secret'],['--all']]){
    await assert.rejects(run(process.execPath,[script,...args],{env}),error=>{
      assert.equal(error.code,1);assert.match(error.stderr,/Prepared image migration failed/);assert.doesNotMatch(error.stdout+error.stderr,/do-not-print-this-secret/);return true;
    });
  }
});
