// Isolated QA only. Reuses worker-redis images; never prepares or publishes an app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { run } from '../src/runner.mjs';
import { docker } from '../src/containers.mjs';
import { uid, sleep } from '../src/util.mjs';

if(process.env.PODS_ISOLATED_BUILD!=='1'||process.getuid?.()===0)throw new Error('Run only as the isolated QA user');
const output='/output/worker-redis',root=output+'/liveness-compute';
const artifact=JSON.parse(gunzipSync(await readFile(output+'/artifact.gz')));
// A real one-time dependency must remain valid after exiting successfully.
artifact.containers.services.migrate={image:artifact.containers.services.web.image,command:['python','-c','print("migration complete")']};
artifact.containers.services.web.depends_on.migrate='service_completed_successfully';
artifact.containers.services.db.healthcheck={test:['CMD-SHELL','redis-cli ping && test ! -f /tmp/pods-health-fault'],interval:'1s',timeout:'1s',retries:1};
const bytes=gzipSync(JSON.stringify(artifact)),sha256=createHash('sha256').update(bytes).digest('hex');
const events=[],results=[];
const server=createServer(async(req,res)=>{
  if(req.url==='/artifact')return res.end(bytes);
  const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
  if(image&&artifact.containers.images.some(i=>i.sha256===image[1]))return createReadStream(output+'/images/'+image[1]+'.gz').pipe(res);
  let body='';for await(const chunk of req)body+=chunk;
  events.push({...JSON.parse(body),at:Date.now()});res.end('{}');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,dataKey='liveness-worker-redis';
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const service=async name=>{const id=await docker(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project,'--filter','label=com.docker.compose.service='+name]);assert.ok(id&&!id.includes('\n'));return id;};
let running,previous;
try{
  for(const fault of ['stopped-worker','unhealthy-database']){
    events.length=0;
    running=await run({id:uid(),appId:'worker-redis',dataKey,sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-test',port:8080,expiresAt:Date.now()+120000},{root});
    const migration=await docker(['inspect','--format','{{.State.Status}}/{{.State.ExitCode}}',await service('migrate')]);assert.equal(migration,'exited/0');
    await sleep(3500);assert.ok(events.some(e=>e.status==='heartbeat'),'completed migration must not fail ongoing readiness');
    if(previous){const retained=await fetch('http://127.0.0.1:8080/api/jobs/'+previous.id).then(r=>r.json());assert.deepEqual(retained,previous);}
    const {id}=await fetch('http://127.0.0.1:8080/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'service fault '+fault})}).then(r=>r.json());
    let job;for(let i=0;i<40;i++){job=await fetch('http://127.0.0.1:8080/api/jobs/'+id).then(r=>r.json());if(job.state==='complete')break;await sleep(100);}
    assert.equal(job.result,('service fault '+fault).toUpperCase());
    const at=Date.now();
    if(fault==='stopped-worker')await docker(['kill',await service('worker')]);
    else await docker(['exec',await service('db'),'touch','/tmp/pods-health-fault']);
    const webStillRunning=await docker(['inspect','--format','{{.State.Running}}',await service('web')]);assert.equal(webStillRunning,'true');
    const pageStatus=(await fetch('http://127.0.0.1:8080/')).status;assert.equal(pageStatus,200);
    for(let i=0;i<60&&!events.some(e=>e.status==='failed');i++)await sleep(250);
    const failure=events.find(e=>e.status==='failed');assert.ok(failure,'dependency failure must revoke readiness');
    let remaining;for(let i=0;i<120;i++){remaining=await docker(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project]);if(!remaining)break;await sleep(500);}assert.equal(remaining,'');
    results.push({fault,webStillRunning:true,pageStatus,migration,heartbeatAfterMigration:true,job,persistedPriorJob:previous||null,failureMs:failure.at-at,cleanupMs:Date.now()-at,error:failure.error,allServicesStopped:true});
    previous=job;running=null;
  }
  console.log(JSON.stringify({passed:true,scope:'isolated QA; existing worker-redis artifact images with one-time migration and fault-injectable database healthcheck',results},null,2));
}finally{
  await running?.stop();await new Promise(r=>server.close(r));
  await writeFile('/output/evidence/container-liveness.json',JSON.stringify({passed:results.length===2,results},null,2));
}
