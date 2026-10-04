// Run as uid1000 in the isolated aswin QA guest; uses explicitly pinned stored framework artifacts.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {sqliteFileRuntimeProbeCommand} from '/output/sqlite-online-candidate-2cad8f8/scripts/probe-sqlite-file-runtime.mjs';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer,request} from 'node:http';
import {run,decodeArtifact} from '/output/sqlite-online-candidate-2cad8f8/src/runner.mjs';
import {containersAlive} from '/output/sqlite-online-candidate-2cad8f8/src/container-runtime.mjs';
import {docker} from '/output/sqlite-online-candidate-2cad8f8/src/containers.mjs';
const fixture=process.argv[2];
const profiles={"ktor": {"heading": "Ktor + SQLite", "sha256": "49296597e69e533a327361f5dc38f89f282c8d0757c29c74754b3563c3bfa780", "source": "src/main/kotlin/example/Application.kt", "sourceSha256": "8f94b8e355f4506a68070ccc7e25af162bd683cb885f106d21d0dcf4a8a34b78"}, "micronaut": {"heading": "Micronaut + SQLite", "sha256": "e8d70b34f83d2437c0a79b10ce6d95f5169f378aa84fca5464d182043ebf997b", "source": "src/main/java/example/Product.java", "sourceSha256": "3d4d4aa5b6bb0067d93ab03630d6e6d1e8786256a954f892463395f956b629d5"}, "phoenix": {"heading": "Phoenix + SQLite", "sha256": "7308461467ce0b24285428c542b402856037ab0c4ca8420e4bb4d313bacc0e98", "source": "priv/product.html", "sourceSha256": "2e144615570aaa27bb6e8ef60ebf3bddac7e21ad6d1b1d8cfab2fb03789f00f9"}, "symfony": {"heading": "Symfony + SQLite", "sha256": "81b78431ad424b1b412bc73b3b44540d6bf01e98076eced7d532cdc37be2f817", "source": "product.html", "sourceSha256": "405d631ffa88a53f55192cfe6022918a87407151584ebeb971fb28f1930c5e8e"}};
assert.ok(Object.hasOwn(profiles,fixture));const profile=profiles[fixture];
const sourceSha256=createHash('sha256').update(await readFile('/work/stacks/'+fixture+'/'+profile.source)).digest('hex');assert.equal(sourceSha256,profile.sourceSha256);
const bytes=await readFile('/output/'+fixture+'/artifact.gz');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,profile.sha256);
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-sqlite-snapshot-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const records=[],launchIds=[];let app;
const alive=()=>containersAlive(artifact.containers,['probe-compose'],args=>args[0]==='probe-compose'?docker(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project]):docker(args));
let legacyPauseAlive;


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
  app=await run({id,provider:'github',appId:fixture+'-sqlite-snapshot-probe',dataKey,containerRuntime:true,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18095,expiresAt:Date.now()+120000},{root});
  assert.ok((await fetch(base).then(r=>r.text())).includes('<h1>'+profile.heading+'</h1>'));
  const before=await fetch(base+'/api/count').then(r=>r.json());assert.equal(before.count,i);
  const saved=await post();assert.equal(saved.status,200);assert.equal(saved.count,i+1);
  const after=await fetch(base+'/api/count').then(r=>r.json());assert.equal(after.count,i+1);
  if(i===0){const id=(await docker(['ps','--quiet','--filter','label=com.docker.compose.project='+project])).trim();try{await docker(['pause',id]);legacyPauseAlive=await alive();assert.equal(legacyPauseAlive,false);}finally{await docker(['unpause',id]);}assert.equal(await alive(),true);}
  let inspecting=true,liveChecks=0,monitorError;const monitor=(async()=>{while(inspecting){assert.equal(await alive(),true);liveChecks++;await new Promise(r=>setTimeout(r,50));}})().catch(e=>{monitorError=e;});
  let stdout;try{({stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',sqliteFileRuntimeProbeCommand(dataKey,{fixture,port:18095,expectedCount:after.count})],{timeout:60000,maxBuffer:65536}));}finally{inspecting=false;await monitor;}if(monitorError)throw monitorError;assert.ok(liveChecks>0);
  const sqliteFileRuntimeCheck=JSON.parse(stdout);assert.ok(sqliteFileRuntimeCheck.passed);assert.equal(sqliteFileRuntimeCheck.savedCount,i+1);
  const afterInspection=await fetch(base+'/api/count').then(r=>r.json());assert.equal(afterInspection.count,i+1);
  records.push({scenario:i?'full-relaunch':'first-launch',before:before.count,post:saved,afterRead:after.count,afterInspection:afterInspection.count,liveChecks,sqliteFileRuntimeCheck});
  await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_app-data-disk-v1';
 if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),fixture,scope:'Isolated real framework artifact and exact serialized native SQLite file helper; real HTTP write/read, independent SQLite snapshot integrity and saved-row query, online backup while continuous production liveness checks remain healthy and full restart retention. Not a native provider or new browser acceptance test.',dataKey,project,legacyPauseAlive,artifactSha256:sha256,images:artifact.containers.images,sourceSha256,records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
