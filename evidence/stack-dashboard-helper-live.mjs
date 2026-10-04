import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {run,decodeArtifact} from '/output/dashboard-candidate-ada4194/src/runner.mjs';
import {docker} from '/output/dashboard-candidate-ada4194/src/containers.mjs';
import {dashboardProbeCommand} from '/output/dashboard-candidate-ada4194/scripts/probe-dashboard.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const fixture=process.argv[2],profiles={gradio:'65b87616014292da12e7795b8f021979f1576a1121d3ae7459d8a4d18cf5c591',streamlit:'3f0e05893c1f60cb45bb811343f39e3df2023c0e2fccbd82aae50dc57c711ff6'};
assert.ok(Object.hasOwn(profiles,fixture));
const bytes=await readFile('/output/'+fixture+'/artifact.gz'),sha256=profiles[fixture];
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-protocol-'+randomBytes(8).toString('hex'),project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24),launchIds=[],records=[];
const server=createServer(async(req,res)=>{const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);if(image&&artifact.containers.images.some(x=>x.sha256===image[1]))return createReadStream('/output/'+fixture+'/images/'+image[1]+'.gz').pipe(res);if(req.url==='/artifact')return res.end(bytes);for await(const chunk of req){}res.end('{}');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,base='http://127.0.0.1:18096';let app;
console.error(JSON.stringify({fixture,dataKey,project}));

try{
 for(let i=0;i<2;i++){
  const id=randomBytes(24).toString('base64url');launchIds.push(id);
  app=await run({id,provider:'github',appId:fixture+'-protocol-preflight',dataKey,containerRuntime:true,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18096,expiresAt:Date.now()+180000},{root});
  assert.equal((await fetch(base)).status,200);
  const container=(await docker(['ps','-q','--filter','label=com.docker.compose.project='+project])).trim();assert.match(container,/^[a-f0-9]{12,64}$/);
  const command=dashboardProbeCommand(dataKey,{fixture,port:18096,expectedCount:i});
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',command],{timeout:60000,maxBuffer:65536});
  const result=JSON.parse(stdout),database=result.database;
  assert.equal(result.passed,true);assert.equal(result.before,i);assert.equal(result.afterRead,i+1);
  records.push({scenario:i?'full-relaunch':'first-launch',result,database});await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_app-data-disk-v1';if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),fixture,scope:'Serialized native dashboard helper on real isolated artifacts, protocol interaction and SQLite persistence across complete application stop/relaunch. Not browser or native-provider acceptance.',artifactSha256:sha256,dataKey,project,records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
