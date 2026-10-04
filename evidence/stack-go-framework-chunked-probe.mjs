// Run as uid1000 in the isolated aswin QA guest; uses its stored Go artifact.
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer,request} from 'node:http';
import {run,decodeArtifact} from '/output/go-framework-candidate-3947f18/src/runner.mjs';
import {probeGoRuntime} from '/output/go-framework-candidate-3947f18/scripts/probe-go-runtime.mjs';
import {docker} from '/output/go-framework-candidate-3947f18/src/containers.mjs';
const fixture=process.argv[2];
const profiles={echo:{heading:'Echo',sha256:'f9c2e4f0c2a2bc61d08204a35384dac0619122eaaa6f749011a56b6e8389a842',sourceSha256:'40e3364a488e445835a0f8099780f14e5fe81ce0d99ba9305ccc45dd400f8061'},fiber:{heading:'Fiber',sha256:'a95883401a9e6863b48d8045c1f9cf36f40b0a4757d35d9dbbc47fb9a8c0e19a',sourceSha256:'53d370518607a7c80b811f8cddf6797c4437fa207bfda123ce5071feb7a8f19e'}};
assert.ok(Object.hasOwn(profiles,fixture));const profile=profiles[fixture];
const sourceSha256=createHash('sha256').update(await readFile('/work/stacks/'+fixture+'/main.go')).digest('hex');assert.equal(sourceSha256,profile.sourceSha256);
const bytes=await readFile('/output/'+fixture+'/artifact.gz');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,profile.sha256);
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-chunked-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const records=[],launchIds=[];let app;
const server=createServer(async(req,res)=>{
 const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
 if(image&&artifact.containers.images.some(x=>x.sha256===image[1]))return createReadStream('/output/'+fixture+'/images/'+image[1]+'.gz').pipe(res);
 if(req.url==='/artifact')return res.end(bytes);
 for await(const chunk of req){}res.end('{}');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,base='http://127.0.0.1:18095';
const post=()=>new Promise((resolve,reject)=>{
 const req=request(base+'/api/count',{method:'POST',headers:{'Transfer-Encoding':'chunked'}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{try{resolve({status:res.statusCode,...JSON.parse(body)});}catch(error){reject(error);}});});
 req.on('error',reject);req.setTimeout(10000,()=>req.destroy(new Error('POST timed out')));req.end();
});
console.error(JSON.stringify({fixture,dataKey,project}));
try{
 for(let i=0;i<2;i++){
  const id=randomBytes(24).toString('base64url');launchIds.push(id);
  app=await run({id,provider:'github',appId:fixture+'-chunked-probe',dataKey,containerRuntime:true,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18095,expiresAt:Date.now()+120000},{root});
  assert.ok((await fetch(base).then(r=>r.text())).includes('<h1>'+profile.heading+' counter</h1>'));
  const before=await fetch(base+'/api/count').then(r=>r.json());assert.equal(before.count,i);
  const saved=await post();assert.equal(saved.status,200);assert.equal(saved.count,i+1);
  const after=await fetch(base+'/api/count').then(r=>r.json());assert.equal(after.count,i+1);
  const compiledRuntime=await probeGoRuntime(dataKey,{port:18095,expectedCount:i+1,fixture});compiledRuntime.scope='Isolated aswin guest: compiled Go executable/module, saved file counter, product port and persistent bind volume; not database or native provider evidence.';
  records.push({compiledRuntime,scenario:i?'full-relaunch':'first-launch',before:before.count,post:saved,afterRead:after.count,transferEncoding:'chunked',contentType:null});
  await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_app-data-disk-v1';
 if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),fixture,scope:'Isolated real Go artifact, simulated proxy empty chunked POST and full application restart. Not a native provider or new browser acceptance test.',dataKey,project,artifactSha256:sha256,images:artifact.containers.images,sourceSha256,records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
