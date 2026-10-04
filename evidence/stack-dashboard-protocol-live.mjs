import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {run,decodeArtifact} from '/output/file-counter-candidate-3e0c04b/src/runner.mjs';
import {docker} from '/output/file-counter-candidate-3e0c04b/src/containers.mjs';
const fixture=process.argv[2],profiles={gradio:'65b87616014292da12e7795b8f021979f1576a1121d3ae7459d8a4d18cf5c591',streamlit:'3f0e05893c1f60cb45bb811343f39e3df2023c0e2fccbd82aae50dc57c711ff6'};
assert.ok(Object.hasOwn(profiles,fixture));
const bytes=await readFile('/output/'+fixture+'/artifact.gz'),sha256=profiles[fixture];
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-protocol-'+randomBytes(8).toString('hex'),project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24),launchIds=[],records=[];
const server=createServer(async(req,res)=>{const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);if(image&&artifact.containers.images.some(x=>x.sha256===image[1]))return createReadStream('/output/'+fixture+'/images/'+image[1]+'.gz').pipe(res);if(req.url==='/artifact')return res.end(bytes);for await(const chunk of req){}res.end('{}');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,base='http://127.0.0.1:18096';let app;
console.error(JSON.stringify({fixture,dataKey,project}));
async function gradioCall(name){
 const response=await fetch(base+'/gradio_api/call/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[]}),signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);
 const {event_id}=await response.json();assert.match(event_id,/^[a-zA-Z0-9_-]{1,128}$/);
 const events=await fetch(base+'/gradio_api/call/'+name+'/'+event_id,{signal:AbortSignal.timeout(20000)});assert.equal(events.status,200);assert.match(events.headers.get('content-type'),/text\/event-stream/);
 const text=await events.text();assert.ok(!/^event: error$/m.test(text));const match=/event: complete\r?\ndata: ([^\r\n]+)/.exec(text);assert.ok(match,'Gradio completion event missing');const data=JSON.parse(match[1]);assert.equal(data.length,1);assert.ok(Number.isSafeInteger(data[0]));return data[0];
}
try{
 for(let i=0;i<2;i++){
  const id=randomBytes(24).toString('base64url');launchIds.push(id);
  app=await run({id,provider:'github',appId:fixture+'-protocol-preflight',dataKey,containerRuntime:true,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18096,expiresAt:Date.now()+180000},{root});
  assert.equal((await fetch(base)).status,200);
  const container=(await docker(['ps','-q','--filter','label=com.docker.compose.project='+project])).trim();assert.match(container,/^[a-f0-9]{12,64}$/);
  let result;
  if(fixture==='gradio'){
   const config=await fetch(base+'/config').then(r=>r.json());assert.equal(config.version,'6.29.1');assert.equal(config.api_prefix,'/gradio_api');assert.ok(['read','increment'].every(name=>config.dependencies.some(x=>x.api_name===name&&x.api_visibility==='public'&&x.inputs.length===0)));
   const before=await gradioCall('read');assert.equal(before,i);const afterWrite=await gradioCall('increment'),afterRead=await gradioCall('read');assert.equal(afterWrite,i+1);assert.equal(afterRead,afterWrite);
   result={passed:true,version:config.version,protocol:'Gradio named endpoint and SSE completion',before,afterWrite,afterRead};
  }else result=JSON.parse(await docker(['exec',container,'python','-c',await readFile('/tmp/pods-streamlit-protocol.py','utf8'),String(i)]));
  const query='import json,sqlite3; c=sqlite3.connect("file:/data/counter.sqlite?mode=ro",uri=True); print(json.dumps({"engine":"SQLite","version":sqlite3.sqlite_version,"integrity":c.execute("PRAGMA quick_check").fetchone()[0],"rows":c.execute("SELECT COUNT(*) FROM counter").fetchone()[0],"savedCount":c.execute("SELECT value FROM counter WHERE id=1").fetchone()[0]})); c.close()';
  const database=JSON.parse(await docker(['exec',container,'python','-c',query]));assert.equal(database.integrity,'ok');assert.equal(database.rows,1);assert.equal(database.savedCount,i+1);
  records.push({scenario:i?'full-relaunch':'first-launch',result,database});await app.stop();app=null;
 }
}finally{
 await app?.stop();await new Promise(resolve=>server.close(resolve));
 assert.equal(await docker(['ps','-aq','--filter','label=com.docker.compose.project='+project]),'');
 const volume=project+'_app-data-disk-v1';if((await docker(['volume','ls','--format','{{.Name}}'])).split('\n').includes(volume))await docker(['volume','rm',volume]);
 for(const id of launchIds)await rm(root+'/'+id+'.json',{force:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),fixture,scope:'Real isolated artifact protocol interaction and SQLite persistence across complete application stop/relaunch. Not browser or native-provider acceptance.',artifactSha256:sha256,dataKey,project,records,passed:records.length===2,cleanup:{containersStopped:true,probeVolumeRemoved:true,probeStorageCleanupPending:true}},null,2));
