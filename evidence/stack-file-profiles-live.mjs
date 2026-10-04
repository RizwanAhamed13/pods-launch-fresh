// Run as uid1000 in the isolated aswin QA guest; uses explicitly pinned stored framework artifacts.
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer,request} from 'node:http';
import {run,decodeArtifact} from '/output/file-profiles-candidate-4c96520/src/runner.mjs';
import {docker} from '/output/file-profiles-candidate-4c96520/src/containers.mjs';
import {probeFileCounterRuntime} from '/output/file-profiles-candidate-4c96520/scripts/probe-file-counter-runtime.mjs';
const fixture=process.argv[2];
const profiles={"php": {"heading": "PHP", "sha256": "e5f7104a97fd9ce67a922c38e1fadfdbbc7701fdce46ac04d9162a844428da26", "source": "index.php", "sourceSha256": "d24e79adbceba54f76d9da775080f525a0b6b9900f421ad64f8cab4faea8a501"}, "sinatra": {"heading": "Sinatra", "sha256": "61415baf2faa6d9d73280c9b05d5f1d5f47a65981d73c20aa8ebfbdd9b59d203", "source": "app.rb", "sourceSha256": "4abfb7f862b7dac94085a2625f59d064ec10c15e6a41acabd081f6857ad10301"}, "deno": {"heading": "Deno persistent", "sha256": "21f01a08587ef3bef871b7b953be04cc8c0fd9e0600ae5f5d9329f335fa3f376", "source": "server.ts", "sourceSha256": "321b7dfcb4906db32ae03c19f15e023636a42359acdebaf7f8acb105c9e065a5"}};
assert.ok(Object.hasOwn(profiles,fixture));const profile=profiles[fixture];
const sourceSha256=createHash('sha256').update(await readFile('/work/stacks/'+fixture+'/'+profile.source)).digest('hex');assert.equal(sourceSha256,profile.sourceSha256);
const bytes=await readFile('/output/'+fixture+'/artifact.gz');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,profile.sha256);
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-chunked-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const records=[],launchIds=[];let app;

async function inspectStorage(expectedCount){return probeFileCounterRuntime(dataKey,{port:18095,expectedCount,fixture},docker);}

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
  const storage=await inspectStorage(i+1);
  records.push({storage,scenario:i?'full-relaunch':'first-launch',before:before.count,post:saved,afterRead:after.count,transferEncoding:'chunked',contentType:null});
  await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_app-data-disk-v1';
 if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),fixture,scope:'Isolated real framework artifact, simulated proxy empty chunked POST and full application restart. Not a native provider or new browser acceptance test.',dataKey,project,artifactSha256:sha256,images:artifact.containers.images,sourceSha256,records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
