// Run as uid1000 in the isolated aswin QA guest; uses its stored Valkey artifact.
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer,request} from 'node:http';
import {run,decodeArtifact} from '/output/valkey-candidate-4bb9326/src/runner.mjs';
import {probeValkeyRuntime} from '/output/valkey-candidate-4bb9326/scripts/probe-valkey-runtime.mjs';
import {docker} from '/output/valkey-candidate-4bb9326/src/containers.mjs';
const bytes=await readFile('/output/flask-valkey/artifact.gz');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,'e631a8a2e603ab0d9fee2243afeec633c899010f1c6e599b407256b18199c330');
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey='flask-valkey-chunked-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const records=[],launchIds=[];let app;
const server=createServer(async(req,res)=>{
 const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
 if(image&&artifact.containers.images.some(x=>x.sha256===image[1]))return createReadStream('/output/flask-valkey/images/'+image[1]+'.gz').pipe(res);
 if(req.url==='/artifact')return res.end(bytes);
 for await(const chunk of req){}res.end('{}');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,base='http://127.0.0.1:18095';
const post=()=>new Promise((resolve,reject)=>{
 const req=request(base+'/api/count',{method:'POST',headers:{'Transfer-Encoding':'chunked'}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{try{resolve({status:res.statusCode,...JSON.parse(body)});}catch(error){reject(error);}});});
 req.on('error',reject);req.setTimeout(10000,()=>req.destroy(new Error('POST timed out')));req.end();
});
try{
 for(let i=0;i<2;i++){
  const id=randomBytes(24).toString('base64url');launchIds.push(id);
  app=await run({id,provider:'github',appId:'flask-valkey-chunked-probe',dataKey,containerRuntime:true,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18095,expiresAt:Date.now()+120000},{root});
  assert.match(await fetch(base).then(r=>r.text()),/<h1>Flask \+ valkey counter<\/h1>/);
  const before=await fetch(base+'/api/count').then(r=>r.json());assert.equal(before.count,i);
  const saved=await post();assert.equal(saved.status,200);assert.equal(saved.count,i+1);
  const after=await fetch(base+'/api/count').then(r=>r.json());assert.equal(after.count,i+1);
  const database=await probeValkeyRuntime(dataKey,{port:18095,expectedCount:i+1});database.scope='Isolated aswin guest: actual Valkey version, saved counter, private ports and persistent bind volume; not a native provider launch.';
  records.push({database,scenario:i?'full-relaunch':'first-launch',before:before.count,post:saved,afterRead:after.count,transferEncoding:'chunked',contentType:null});
  await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_records-disk-v1';
 if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Isolated real Valkey artifact, simulated proxy empty chunked POST and full application restart. Not a native provider or new browser acceptance test.',dataKey,project,artifactSha256:sha256,images:artifact.containers.images,sourceSha256:createHash('sha256').update(await readFile('/work/stacks/flask-valkey/app.py')).digest('hex'),records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
