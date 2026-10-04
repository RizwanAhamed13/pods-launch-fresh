import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {gzipSync} from 'node:zlib';
import {digest} from '../src/util.mjs';
import {prepareRegistryForApp,registryIndex,imageStoreBytes,withImageStoreWrite} from '../src/image-registry.mjs';
import {createApp} from '../src/server.mjs';

const media='application/vnd.oci.image.manifest.v1+json',appId='registry-example',budget=16*1024**2;
const layer=gzipSync(Buffer.from('fixture layer content')),config=Buffer.from(JSON.stringify({architecture:'amd64',os:'linux',rootfs:{type:'layers',diff_ids:['sha256:'+digest('fixture layer content')]}}));
const descriptor=(bytes,mediaType)=>({digest:'sha256:'+digest(bytes),size:bytes.length,mediaType});
const baseManifest={schemaVersion:2,mediaType:media,config:descriptor(config,'application/vnd.oci.image.config.v1+json'),layers:[descriptor(layer,'application/vnd.oci.image.layer.v1.tar+gzip')]};

function archive(entries) {
  const parts=[];
  for(const {name,bytes=Buffer.alloc(0),type='0',link='',declaredSize=bytes.length} of entries) {
    const header=Buffer.alloc(512);header.write(name);header.write('0000600\0',100);header.write('0000000\0',108);header.write('0000000\0',116);
    header.write(declaredSize.toString(8).padStart(11,'0')+'\0',124);header.write('00000000000\0',136);header.fill(32,148,156);
    header.write(type,156);header.write(link,157);header.write('ustar\0',257);header.write('00',263);
    header.write([...header].reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);
    parts.push(header,bytes,Buffer.alloc((512-bytes.length%512)%512));
  }
  return gzipSync(Buffer.concat([...parts,Buffer.alloc(1024)]));
}

async function fixture(t,{manifest=baseManifest,extra=[],omitLayer=false,index=false}={}) {
  const data=await mkdtemp(join(tmpdir(),'pods-registry-'));t.after(()=>rm(data,{recursive:true,force:true}));
  await mkdir(join(data,'images'));await mkdir(join(data,'artifacts'));
  const manifestBytes=Buffer.from(JSON.stringify(manifest));
  const child={...descriptor(manifestBytes,media),platform:{os:'linux',architecture:'amd64'}};
  const top=index?Buffer.from(JSON.stringify({schemaVersion:2,mediaType:'application/vnd.oci.image.index.v1+json',manifests:typeof index==='function'?index(child):[child]})):manifestBytes;
  const entries=[{name:'blobs/sha256/'+digest(config),bytes:config},...(!omitLayer?[{name:'blobs/sha256/'+digest(layer),bytes:layer}]:[]),{name:'blobs/sha256/'+digest(manifestBytes),bytes:manifestBytes},...(index?[{name:'blobs/sha256/'+digest(top),bytes:top}]:[]),...extra];
  const bytes=archive(entries),image={id:'sha256:'+digest(top),sha256:digest(bytes),bytes:bytes.length};
  const artifact=gzipSync(JSON.stringify({format:2,runtime:'docker',healthPath:'/',containers:{web:'web',port:8080,images:[image],services:{web:{image:image.id}}}}));
  await writeFile(join(data,'images',image.sha256+'.gz'),bytes);
  await writeFile(join(data,'artifacts',digest(artifact)+'.gz'),artifact);
  await writeFile(join(data,'artifacts',appId+'.json'),JSON.stringify({id:appId,sha256:digest(artifact),bytes:artifact.length,images:[image]}));
  return {data,image,bytes,top,blobPath:join(data,'registry','blobs',digest(layer)+'.gz')};
}
const prepare=f=>prepareRegistryForApp({data:f.data,appId,budget});

function attestedFixture({artifact=false,omit='',change=()=>{}}={}) {
  const runtime=descriptor(Buffer.from(JSON.stringify(baseManifest)),media);
  const attConfig=Buffer.from(JSON.stringify(artifact?{}:{architecture:'unknown',os:'unknown'}));
  const statement=Buffer.from(JSON.stringify({_type:'https://in-toto.io/Statement/v1',subject:[{digest:{sha256:runtime.digest.slice(7)}}],predicateType:'https://spdx.dev/Document',predicate:{}}));
  const manifest={schemaVersion:2,mediaType:media,config:descriptor(attConfig,artifact?'application/vnd.oci.empty.v1+json':'application/vnd.oci.image.config.v1+json'),layers:[descriptor(statement,'application/vnd.in-toto+json')],...(artifact?{artifactType:'application/vnd.docker.attestation.manifest.v1+json',subject:{...runtime}}:{})};
  change(manifest);const bytes=Buffer.from(JSON.stringify(manifest));
  const attestation={...descriptor(bytes,media),platform:{os:'unknown',architecture:'unknown'},annotations:{'vnd.docker.reference.type':'attestation-manifest','vnd.docker.reference.digest':runtime.digest}};
  const excluded={...attestation,digest:'sha256:'+'e'.repeat(64),annotations:{...attestation.annotations,'vnd.docker.reference.digest':'sha256:'+'f'.repeat(64)}};
  const extra=[['manifest',bytes],['config',attConfig],['layer',statement]].filter(([name])=>name!==omit).map(([,bytes])=>({name:'blobs/sha256/'+digest(bytes),bytes}));
  return {index:child=>[child,attestation,excluded],extra,attestation,excluded,statement};
}

test('selected platform attestations remain available to Docker with their exact verified content',async t=>{
  for(const artifact of [false,true])await t.test(artifact?'OCI artifact':'legacy image manifest',async t=>{
    const options=attestedFixture({artifact}),f=await server(t,null,true,options);
    const index=await registryIndex(f.data,f.image),again=await prepare(f);
    assert.equal(Object.keys(index.members).length,7);assert.equal(Object.keys(index.manifests).length,3);
    assert.equal(again.images[0].addedBlobBytes,0);assert.equal(index.members[options.excluded.digest],undefined);
    assert.deepEqual(await readFile(join(f.data,'registry/blobs',f.image.id.slice(7)+'.gz')),f.top);
    const response=await f.get('/manifests/'+options.attestation.digest);assert.equal(response.status,200);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())),options.attestation.digest.slice(7));
    const layer=await f.get('/blobs/sha256:'+digest(options.statement));assert.equal(layer.status,200);
    assert.deepEqual(Buffer.from(await layer.arrayBuffer()),options.statement);
    assert.equal((await f.get('/manifests/'+options.excluded.digest)).status,404);
  });
});

test('selected attestations cannot omit bytes, change subjects, or become runnable targets',async t=>{
  for(const [name,options,edit] of [
    ['missing manifest',{omit:'manifest'}],['missing config',{omit:'config'}],['missing statement',{omit:'layer'}],
    ['wrong layer size',{change:m=>m.layers[0].size++}],
    ['external statement',{change:m=>m.layers[0].urls=['https://example.invalid/attestation']}],
    ['wrong artifact subject',{artifact:true,change:m=>m.subject.digest='sha256:'+'f'.repeat(64)}],
    ['runnable attestation platform',{},o=>o.attestation.platform={os:'linux',architecture:'amd64'}],
    ['invalid attestation reference',{},o=>o.attestation.annotations['vnd.docker.reference.digest']='invalid'],
  ])await t.test(name,async t=>{
    const optionsWithAttestation=attestedFixture(options);edit?.(optionsWithAttestation);
    const f=await fixture(t,optionsWithAttestation);await assert.rejects(prepare(f),/indexing failed/);
    assert.equal(await registryIndex(f.data,f.image),null);assert.deepEqual(await readdir(join(f.data,'registry/blobs')),[]);
    assert.deepEqual((await readdir(join(f.data,'registry'))).sort(),['blobs','indexes']);
    assert.deepEqual(await readFile(join(f.data,'images',f.image.sha256+'.gz')),f.bytes);
  });
});

test('platform-limited OCI saves retain the original index and only require Linux amd64 content',async t=>{
  const absent={digest:'sha256:'+'f'.repeat(64),size:321,mediaType:media,platform:{os:'linux',architecture:'arm64'}};
  const attestation=Buffer.from('{"attestation":"not runtime content"}');
  const extra={name:'blobs/sha256/'+digest(attestation),bytes:attestation};
  const f=await fixture(t,{index:child=>[absent,child,{...descriptor(attestation,media),platform:{os:'unknown',architecture:'unknown'}}],extra:[extra]});
  const original=await readFile(join(f.data,'artifacts',appId+'.json'));
  const first=await prepare(f),second=await prepare(f),index=await registryIndex(f.data,f.image);
  assert.equal(first.images[0].blobs,4);assert.equal(second.images[0].addedBlobBytes,0);
  assert.equal(index.platform,'linux/amd64');assert.equal(index.imageId,f.image.id);
  assert.deepEqual(await readFile(join(f.data,'registry/blobs',f.image.id.slice(7)+'.gz')),f.top);
  assert.equal(index.members[absent.digest],undefined);assert.equal(index.members['sha256:'+digest(attestation)],undefined);
  assert.deepEqual((await readdir(join(f.data,'registry/blobs'))).sort(),Object.keys(index.members).map(id=>id.slice(7)+'.gz').sort());
  assert.deepEqual(await readFile(join(f.data,'artifacts',appId+'.json')),original);
  assert.deepEqual(await readFile(join(f.data,'images',f.image.sha256+'.gz')),f.bytes);
});

test('platform selection rejects missing or ambiguous targets and never skips target integrity checks',async t=>{
  const armConfig=Buffer.from(JSON.stringify({architecture:'arm64',os:'linux'}));
  for(const [name,options] of [
    ['target manifest absent',{index:child=>[{...child,digest:'sha256:'+'e'.repeat(64)}]}],
    ['target layer absent',{index:true,omitLayer:true}],
    ['target descriptor size changed',{index:child=>[{...child,size:child.size+1}]}],
    ['no supported platform',{index:child=>[{...child,platform:{os:'linux',architecture:'arm64'}}]}],
    ['CPU variant requires newer hardware',{index:child=>[{...child,platform:{os:'linux',architecture:'amd64',variant:'v3'}}]}],
    ['ambiguous target',{index:child=>[child,{...child}]}],
    ['external nonselected descriptor',{index:child=>[child,{...child,platform:{os:'linux',architecture:'arm64'},urls:['https://example.invalid/layer']}]}],
    ['malformed platform',{index:child=>[{...child,platform:'linux/amd64'}]}],
    ['config disagrees with selected platform',{index:true,manifest:{...baseManifest,config:descriptor(armConfig,'application/vnd.oci.image.config.v1+json')},extra:[{name:'blobs/sha256/'+digest(armConfig),bytes:armConfig}]}],
  ])await t.test(name,async t=>{
    const f=await fixture(t,options);await assert.rejects(prepare(f),/indexing failed/);
    assert.equal(await registryIndex(f.data,f.image),null);
    assert.deepEqual(await readdir(join(f.data,'registry/blobs')),[]);
    assert.deepEqual((await readdir(join(f.data,'registry'))).sort(),['blobs','indexes']);
    assert.deepEqual(await readFile(join(f.data,'images',f.image.sha256+'.gz')),f.bytes);
  });
});

test('an unlabelled nested index resolves the baseline amd64 variant without requiring other architectures',async t=>{
  const manifestBytes=Buffer.from(JSON.stringify(baseManifest)),indexMedia='application/vnd.oci.image.index.v1+json';
  const nested=Buffer.from(JSON.stringify({schemaVersion:2,mediaType:indexMedia,manifests:[
    {...descriptor(manifestBytes,media),platform:{os:'linux',architecture:'amd64',variant:'v1'}},
    {digest:'sha256:'+'f'.repeat(64),size:100,mediaType:media,platform:{os:'windows',architecture:'amd64'}},
  ]}));
  const f=await fixture(t,{index:()=>[descriptor(nested,indexMedia)],extra:[{name:'blobs/sha256/'+digest(nested),bytes:nested}]});
  await prepare(f);const index=await registryIndex(f.data,f.image);
  assert.equal(Object.keys(index.manifests).length,3);assert.equal(Object.keys(index.members).length,5);
  assert.equal(index.members['sha256:'+'f'.repeat(64)],undefined);
});

test('OCI preparation verifies and deduplicates exact blobs while preserving the original artifact',async t=>{
  const f=await fixture(t,{index:true}),before=await readFile(join(f.data,'images',f.image.sha256+'.gz'));
  const first=await prepare(f),second=await prepare(f),index=await registryIndex(f.data,f.image);
  assert.equal(first.images[0].blobs,4);assert.ok(first.images[0].addedBlobBytes>0);assert.equal(second.images[0].addedBlobBytes,0);
  assert.equal(index.imageId,f.image.id);assert.equal(Object.keys(index.manifests).length,2);
  assert.deepEqual(await readFile(f.blobPath),layer);assert.deepEqual(await readFile(join(f.data,'images',f.image.sha256+'.gz')),before);
  assert.deepEqual((await readdir(join(f.data,'registry'))).sort(),['blobs','indexes']);
  assert.equal(await registryIndex(f.data,{...f.image,sha256:'f'.repeat(64)}),null);
});

test('OCI indexing rejects missing layers, external descriptors, invalid graph and unsafe TAR members',async t=>{
  for(const [name,options] of [
    ['missing layer',{omitLayer:true}],
    ['external source',{manifest:{...baseManifest,layers:[{...baseManifest.layers[0],urls:['http://127.0.0.1/private']}]}}],
    ['wrong descriptor size',{manifest:{...baseManifest,config:{...baseManifest.config,size:1}}}],
    ['unsupported graph',{manifest:{...baseManifest,schemaVersion:1}}],
    ['path traversal',{extra:[{name:'../outside',bytes:Buffer.from('no')}]}],
    ['symlink',{extra:[{name:'blobs/sha256/'+'f'.repeat(64),type:'2',link:'/etc/passwd'}]}],
    ['oversized PAX extension',{extra:[{name:'PaxHeader',type:'x',declaredSize:2*1024**3}]}],
    ['duplicate member',{extra:[{name:'blobs/sha256/'+digest(layer),bytes:layer}]}],
    ['wrong blob digest',{extra:[{name:'blobs/sha256/'+'f'.repeat(64),bytes:layer}]}],
  ])await t.test(name,async t=>{
    const f=await fixture(t,options);await assert.rejects(prepare(f),/indexing failed/);
    assert.equal(await registryIndex(f.data,f.image),null);
    assert.deepEqual((await readdir(join(f.data,'registry'))).sort(),['blobs','indexes']);
    assert.deepEqual(await readdir(join(f.data,'registry','blobs')),[]);
    assert.deepEqual(await readFile(join(f.data,'images',f.image.sha256+'.gz')),f.bytes);
  });
});

test('OCI indexing rejects changed archive and existing blob bytes without replacing them',async t=>{
  const f=await fixture(t);await prepare(f);await writeFile(f.blobPath,Buffer.alloc(layer.length));
  await assert.rejects(prepare(f),/Existing registry blob changed/);assert.deepEqual(await readFile(f.blobPath),Buffer.alloc(layer.length));
  await writeFile(join(f.data,'images',f.image.sha256+'.gz'),Buffer.alloc(f.image.bytes));
  await assert.rejects(prepare(f),/integrity check failed/);
});

test('image budgets include OCI metadata, blobs and staging bytes; a failed index leaves no staging data',async t=>{
  const f=await fixture(t);await assert.rejects(prepareRegistryForApp({data:f.data,appId,budget:f.image.bytes+512}),/storage is full/);
  assert.equal(await imageStoreBytes(f.data),f.image.bytes);await prepare(f);assert.ok(await imageStoreBytes(f.data)>f.image.bytes);
  await symlink(f.blobPath,join(f.data,'registry','alias'));await assert.rejects(imageStoreBytes(f.data),/non-regular/);
});

test('shared image writer lock prevents competing publication and preserves another writer',async t=>{
  const f=await fixture(t);
  await withImageStoreWrite(f.data,async()=>{
    await writeFile(join(f.data,'image-store-write.lock','owned'),'preserve');
    await assert.rejects(prepare(f),/store is busy/);
    assert.equal(await readFile(join(f.data,'image-store-write.lock','owned'),'utf8'),'preserve');
  });
  await assert.rejects(withImageStoreWrite(f.data,()=>{throw Error('failure');}),/failure/);await prepare(f);
});

test('OCI publication uses verified private blob storage and reuses indexes after partial remote failure',async t=>{
  const f=await fixture(t);let fail=true,calls=0;
  const delivery={publish:async(images,options)=>{
    calls++;assert.equal(options.contentType,'application/octet-stream');
    for(const image of images){const bytes=await readFile(join(options.directory,image.sha256+'.gz'));assert.equal(digest(bytes),image.sha256);assert.equal(bytes.length,image.bytes);}
    if(fail)throw Error('remote unavailable');
  }};
  await assert.rejects(prepareRegistryForApp({data:f.data,appId,budget,delivery}),/remote unavailable/);assert.ok(await registryIndex(f.data,f.image));
  fail=false;const result=await prepareRegistryForApp({data:f.data,appId,budget,delivery});assert.equal(result.images[0].addedBlobBytes,0);assert.equal(calls,2);
});

async function server(t,delivery=null,enabled=true,options={}) {
  const f=await fixture(t,options);await prepare(f);
  const app=await createApp({data:f.data,secret:'bc'.repeat(32),providers:{},imageDelivery:delivery,registryEnabled:enabled});
  await new Promise(done=>app.server.listen(0,'127.0.0.1',done));
  t.after(async()=>{await new Promise(done=>app.server.close(done));await app.closeResources();});
  const id='A'.repeat(32),token='launch-only-capability',launch={id,status:'starting',expiresAt:Date.now()+60000,tokenHash:digest(token),images:[f.image]};app.store.put('launch',id,launch);
  const origin=`http://127.0.0.1:${app.server.address().port}`,path=`/v2/pods/${Buffer.from(id).toString('hex')}/${f.image.sha256}`;
  const headers={Authorization:'Basic '+Buffer.from(id+':'+token).toString('base64')};
  return {...f,app,id,launch,origin,path,headers,get:(suffix,options={})=>fetch(origin+path+suffix,{headers,...options,redirect:'manual'})};
}

test('registry preserves a multi-platform index but refuses its nonselected platform digests',async t=>{
  let resolutions=0;const excluded='sha256:'+'f'.repeat(64);
  const f=await server(t,{resolve:async()=>{resolutions++;return null;}},true,{index:child=>[
    {digest:excluded,size:300,mediaType:media,platform:{os:'linux',architecture:'arm64'}},child,
  ]});
  const root=await f.get('/manifests/'+f.image.id);assert.equal(root.status,200);
  assert.equal(root.headers.get('content-type'),'application/vnd.oci.image.index.v1+json');
  assert.deepEqual(Buffer.from(await root.arrayBuffer()),f.top);
  for(const kind of ['manifests','blobs'])for(const method of ['GET','HEAD'])assert.equal((await f.get('/'+kind+'/'+excluded,{method})).status,404);
  assert.equal(resolutions,0);
});

test('registry serves exact authorized manifests and blobs with HEAD and bounded ranges',async t=>{
  const f=await server(t);
  let r=await fetch(f.origin+'/v2/');assert.equal(r.status,401);assert.match(r.headers.get('www-authenticate'),/^Basic /);
  r=await fetch(f.origin+'/v2/',{headers:f.headers});assert.equal(r.status,200);assert.equal(r.headers.get('docker-distribution-api-version'),'registry/2.0');await r.arrayBuffer();
  r=await f.get('/manifests/'+f.image.id);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),media);assert.equal(r.headers.get('docker-content-digest'),f.image.id);assert.deepEqual(Buffer.from(await r.arrayBuffer()),f.top);
  r=await f.get('/blobs/sha256:'+digest(layer),{method:'HEAD'});assert.equal(r.status,200);assert.equal(Number(r.headers.get('content-length')),layer.length);assert.equal((await r.arrayBuffer()).byteLength,0);
  r=await f.get('/blobs/sha256:'+digest(layer),{headers:{...f.headers,Range:'bytes=3-8'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes 3-8/${layer.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),layer.subarray(3,9));
  for(const range of ['bytes=-2','bytes=0-9999','bytes=4-3','bytes=0-1,3-4','bytes=9007199254740992-']) {r=await f.get('/blobs/sha256:'+digest(layer),{headers:{...f.headers,Range:range}});assert.equal(r.status,416);await r.arrayBuffer();}
});

test('registry rejects cross-launch, nonmember, expired and revoked requests before delivery resolution',async t=>{
  let calls=0;const f=await server(t,{resolve:async()=>{calls++;return null;}});
  for(const suffix of ['/blobs/sha256:'+'f'.repeat(64),'/manifests/sha256:'+digest(layer)])assert.equal((await f.get(suffix)).status,404);
  assert.equal((await fetch(f.origin+f.path.replace(Buffer.from(f.id).toString('hex'),'f'.repeat(64))+'/blobs/sha256:'+digest(layer),{headers:f.headers})).status,404);
  assert.equal((await f.get('/blobs/sha256:'+digest(layer),{method:'POST'})).status,405);
  for(const patch of [{expiresAt:0},{status:'stopped'},{status:'failed'},{stopRequested:true},{tokenHash:digest('another-token')}]) {f.app.store.put('launch',f.id,{...f.launch,...patch});assert.equal((await f.get('/blobs/sha256:'+digest(layer))).status,401);}
  assert.equal(calls,0);
});

test('registry checks revocation after CDN lookup and keeps redirects private with safe origin fallback',async t=>{
  let mode='cdn',f,calls=0;const signed='https://release-assets.githubusercontent.com/blob?sig=test-only';
  f=await server(t,{resolve:async image=>{calls++;assert.equal(image.sha256,digest(layer));if(mode==='revoke')f.app.store.put('launch',f.id,{...f.launch,stopRequested:true});return mode==='unsafe'?'http://127.0.0.1/private':mode==='missing'?null:signed;}});
  let r=await f.get('/blobs/sha256:'+digest(layer));assert.equal(r.status,307);assert.equal(r.headers.get('location'),signed);assert.equal(r.headers.get('cache-control'),'no-store');
  for(mode of ['unsafe','missing']) {r=await f.get('/blobs/sha256:'+digest(layer));assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),layer);}
  const previous=calls;r=await f.get('/blobs/sha256:'+digest(layer),{method:'HEAD'});assert.equal(r.status,200);assert.equal(calls,previous);
  mode='revoke';r=await f.get('/blobs/sha256:'+digest(layer));assert.equal(r.status,401);assert.equal(r.headers.get('location'),null);assert.doesNotMatch(await r.text(),/sig=|launch-only-capability/);
});

test('registry rejects changed manifest content and symlink blobs; disabled registry exposes no content',async t=>{
  const f=await server(t);await writeFile(join(f.data,'registry','blobs',f.image.id.slice(7)+'.gz'),Buffer.alloc(f.top.length));
  assert.equal((await f.get('/manifests/'+f.image.id)).status,404);
  await rm(f.blobPath);await symlink(join(f.data,'images',f.image.sha256+'.gz'),f.blobPath);assert.equal((await f.get('/blobs/sha256:'+digest(layer))).status,404);
  const disabled=await server(t,null,false);assert.equal((await disabled.get('/manifests/'+disabled.image.id)).status,404);
});

test('enabled preparation automatically indexes verified OCI images while unsupported archives retain full-image launches',async t=>{
  const {BuildManager}=await import('../src/builds.mjs');const {Store}=await import('../src/store.mjs');const {parseRepository}=await import('../src/repository.mjs');
  const f=await fixture(t),repository=parseRepository('https://github.com/example/registry-product'),store=new Store(f.data,'bc'.repeat(32));
  const metadata=JSON.parse(await readFile(join(f.data,'artifacts',appId+'.json'),'utf8')),artifact=await readFile(join(f.data,'artifacts',metadata.sha256+'.gz'));
  let invalid=false;
  const manager=new BuildManager({store,data:f.data,origin:'https://pods.example',registryEnabled:true,imageStorageBytes:budget,adapter:{initialize:async()=>{},close:async()=>{},build:async()=>{
    const blob=invalid?Buffer.from('legacy unsupported image'):f.bytes;
    const image=invalid?{...f.image,sha256:digest(blob),bytes:blob.length}:f.image;
    const bytes=invalid?gzipSync(JSON.stringify({format:2,runtime:'docker',healthPath:'/',containers:{web:'web',port:8080,images:[image],services:{web:{image:image.id}}}})):artifact;
    return {bytes,blobs:[{sha256:image.sha256,bytes:blob}],manifest:{id:'repo-'+repository.key,sha256:digest(bytes),bytes:bytes.length,applicationType:'container',source:{url:repository.url,folder:repository.folder,revision:'a'.repeat(40)},verification:{status:200,documentPath:'/',contentType:'text/html'}}};
  }}});
  try{
    await manager.initialize();
    for(invalid of [false,true]){
      const build=manager.submit('browser','fixture-account',{url:repository.url});await manager.running;
      const result=manager.own('browser',build.id);assert.equal(result.status,'ready');assert.equal(result.imageRegistry,invalid?'unavailable':'available');
      assert.ok(await readFile(join(f.data,'artifacts',result.app.sha256+'.gz')));if(!invalid)assert.ok(await registryIndex(f.data,f.image));
    }
  }finally{await manager.close();store.close();}
});

test('launcher selects only matching indexes when enabled and preserves immutable artifact bytes',async t=>{
  for(const mode of ['indexed','missing','corrupt','disabled'])await t.test(mode,async t=>{
    const f=await fixture(t);if(mode!=='missing')await prepare(f);
    if(mode==='corrupt')await writeFile(join(f.data,'registry/indexes',f.image.sha256+'.json'),'{}');
    const metadata=JSON.parse(await readFile(join(f.data,'artifacts',appId+'.json'),'utf8'));await writeFile(join(f.data,'artifacts',appId+'.json'),JSON.stringify({...metadata,name:'Registry fixture',runtime:'docker-linux-amd64'}));
    let received;const provider={validate:async()=>({name:'fixture',id:'fixture-account'}),launch:async(_,config)=>{received=config;return {status:'delivering'};}};
    const app=await createApp({data:f.data,secret:'bc'.repeat(32),providers:{github:provider},registryEnabled:mode!=='disabled',imageDelivery:null});
    await new Promise(done=>app.server.listen(0,'127.0.0.1',done));
    try{
      const origin='http://127.0.0.1:'+app.server.address().port,r=await fetch(origin+'/api/me'),cookie=r.headers.get('set-cookie').split(';')[0],me=await r.json();
      const post=(path,body)=>fetch(origin+path,{method:'POST',headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:JSON.stringify(body)});
      assert.equal((await post('/api/connections/github',{token:'t'.repeat(32)})).status,200);
      const launched=await post('/api/launches',{provider:'github',appId});assert.equal(launched.status,202);assert.ok(received);
      assert.deepEqual(received.registryImages,mode==='disabled'?undefined:mode==='indexed'?[f.image.sha256]:[]);
      assert.equal(received.sha256,metadata.sha256);assert.equal(received.token.length,32);assert.equal((await registryIndex(f.data,f.image).catch(()=>null))?.archiveSha256,mode==='indexed'||mode==='disabled'?f.image.sha256:undefined);
      const publicResult=await launched.text();assert.ok(!publicResult.includes(received.token));
    }finally{await new Promise(done=>app.server.close(done));await app.closeResources();}
  });
});
