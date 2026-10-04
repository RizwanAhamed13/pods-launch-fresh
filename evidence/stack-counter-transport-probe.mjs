// Run as uid1000 in the isolated aswin QA guest; uses explicitly pinned stored framework artifacts.
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,rm,mkdtemp,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createReadStream} from 'node:fs';
import {createServer,request} from 'node:http';
import {run,decodeArtifact} from '/output/counter-transport-candidate-ed35ee0/src/runner.mjs';
import {docker} from '/output/counter-transport-candidate-ed35ee0/src/containers.mjs';
const fixture=process.argv[2];
const profiles={"actix":{"heading":"Actix","sha256":"fb5950ff5e983739e52f688983f3ede11ffc29a3a4733b9e902a89fb681a321d","source":"src/main.rs","sourceSha256":"16cfecd68940d5f59d8e98e6dace69dc60a94335c21e2d376faed2e9f31de6cd"},"axum":{"heading":"Axum","sha256":"f83a4c121bf3ccd2ba80df7b0b69f35e82cf63593e5f1d2afc7a9aedec03035d","source":"src/main.rs","sourceSha256":"e7882957be1d0304114d6ffb43c2be2521bb5bc0f3f8fbd25a6b999370edda0b"},"rocket":{"heading":"Rocket","sha256":"501979e7d63d7ebea4ee9cfc1db23c4b913b0a029d94c5a26aa0e805cfdd2f0f","source":"src/main.rs","sourceSha256":"311dba2baa837f6a7826702c0a6d25fb08b51ec53709ac4dc7885ce801580602"},"aspnet":{"heading":"ASP.NET Core","sha256":"d2e156fc65ecacc6a43efa9e441a1ba30d84e44423a409ff018b4675677c45c9","source":"Program.cs","sourceSha256":"a4c66dc0f1954594cacb41c38b84a619bbd49dc2a8359a40bc0908622cb184c7"}};
assert.ok(Object.hasOwn(profiles,fixture));const profile=profiles[fixture];
const sourceSha256=createHash('sha256').update(await readFile('/work/stacks/'+fixture+'/'+profile.source)).digest('hex');assert.equal(sourceSha256,profile.sourceSha256);
const bytes=await readFile('/output/'+fixture+'/artifact.gz');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,profile.sha256);
const artifact=decodeArtifact(bytes,sha256),root='/workspaces/.pods-launch';
const dataKey=fixture+'-chunked-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const records=[],launchIds=[];let app;

async function inspectStorage(expectedCount){
 const id=(await docker(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project])).trim();assert.match(id,/^[a-f0-9]{12,64}$/);
 const web=JSON.parse(await docker(['inspect','--format','{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"network":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}}}',id]));
 assert.equal(web.service,'web');assert.equal(web.running,true);assert.equal(web.network,project+'_default');
 const ports=Object.entries(web.ports||{}).filter(([,v])=>v?.length);assert.equal(ports.length,1);assert.equal(ports[0][0],'8080/tcp');assert.ok(ports[0][1].every(p=>p.HostPort==='18095'));
 const volume=project+'_app-data-disk-v1',mount=web.mounts.find(m=>m.Destination==='/data');assert.ok(mount&&mount.Type==='volume'&&mount.RW&&mount.Name===volume);
 const storage=JSON.parse(await docker(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));assert.equal(storage.driver,'local');assert.equal(storage.options?.type,'none');assert.equal(storage.options?.o,'bind');assert.equal(storage.options?.device,root+'/volumes/'+project+'/app-data/data');
 const temporary=await mkdtemp(join(tmpdir(),'pods-counter-storage-'));
 try{const path=join(temporary,'count');await docker(['cp',id+':/data/count',path]);const file=await lstat(path);assert.ok(file.isFile()&&file.size<=32);const value=(await readFile(path,'utf8')).trim();assert.match(value,/^(0|[1-9]\d*)$/);assert.equal(Number(value),expectedCount);return{passed:true,project,services:['web'],savedCount:Number(value),volume,durableWorkspaceVolume:true,productHostPorts:[18095],databaseHostPorts:[],scope:'Isolated guest inspection of the saved file counter, product port and persistent volume. Not native provider, database or power-loss evidence.'};}finally{await rm(temporary,{recursive:true,force:true});}
}

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
