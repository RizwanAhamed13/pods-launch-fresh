const candidate=process.env.PODS_CANDIDATE_ROOT || '/output/optional-candidate-aa02036';
const {prepare}=await import(candidate+'/scripts/prepare.mjs');
import { run as legacyRun, decodeArtifact } from '/opt/pods/src/runner.mjs';
const {run}=await import(candidate+'/src/runner.mjs');
import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
const source='/work/stacks/express/server.js';
const root=await mkdtemp('/output/express-prepared-transition-');
const manifest=await prepare('/work/stacks/express',join(root,'prepared'));
if(manifest.applicationType!=='node')throw new Error('Express did not become a prepared Node bundle');
const bytes=await readFile(join(root,'prepared','artifacts',manifest.sha256+'.gz'));
const sha256=manifest.sha256;
if(decodeArtifact(bytes,sha256).format!==1)throw new Error('Expected format1 bundle');

const dataKey='transition-'+randomBytes(8).toString('hex');
const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
const containerBytes=await readFile('/output/express/artifact.gz');
const containerSha=createHash('sha256').update(containerBytes).digest('hex');
const container=decodeArtifact(containerBytes,containerSha);
if(container.format!==2)throw new Error('Expected stored Express container artifact');
let selected='container',app;
const exec=promisify(execFile),records=[];
const server=createServer(async(req,res)=>{
 const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
 if(image&&container.containers.images.some(x=>x.sha256===image[1]))return createReadStream('/output/express/images/'+image[1]+'.gz').pipe(res);
 if(req.url==='/artifact')return res.end(selected==='container'?containerBytes:bytes);
 for await(const chunk of req){}res.end('{}');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
let cleanup;
try{
 for(const [format,scenario] of [['container','legacy-container'],['bundle','automatic-container-to-bundle'],['container','automatic-bundle-to-container'],['bundle','automatic-container-to-bundle-again']]){
  selected=format;
  app=await (scenario==='legacy-container'?legacyRun:run)({id:randomBytes(24).toString('base64url'),appId:'express-transition-probe',dataKey,sha256:format==='container'?containerSha:sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-transition',port:18095,expiresAt:Date.now()+120000},{root});
  const page=await fetch('http://127.0.0.1:18095/').then(r=>r.text());
  if(!page.includes('<h1>express counter</h1>'))throw new Error('Wrong product');
  const before=await fetch('http://127.0.0.1:18095/api/count').then(r=>r.json());
  let after=before;
  after=await fetch('http://127.0.0.1:18095/api/count',{method:'POST'}).then(r=>r.json());
  records.push({format,scenario,before:before.count,after:after.count,storageMode:app.storageMode});
  await app.stop();app=null;
 }
 const reproduced=records.length===4&&records.every((record,i)=>record.before===i&&record.after===i+1);
 if(!reproduced)throw new Error('Automatic storage handoff failed to preserve every counter value');
 console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Actual candidate prepare() builds Express, then real isolated runners migrate its legacy container through bundle/container/bundle. No manual bundling or data copy; not native provider acceptance.',temporaryRoot:root,preparerSha256:createHash('sha256').update(await readFile(candidate+'/scripts/prepare.mjs')).digest('hex'),sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),containerArtifactSha256:containerSha,containerImages:container.containers.images,bundleArtifactSha256:sha256,bundleBytes:bytes.length,records,dataContinuityPassed:reproduced,automaticRunnerMigration:true},null,2));
}finally{
 await app?.stop();await new Promise(r=>server.close(r));
 const containers=(await exec('docker',['ps','-aq','--filter','label=com.docker.compose.project='+project])).stdout.trim();
 if(containers)throw new Error('Probe containers remain; preserve data until cleanup');
 const helpers=(await exec('docker',['image','ls','--filter','label=org.pods.storage-copy','--quiet'])).stdout.trim();
 if(helpers)throw new Error('Temporary storage helper images remain');
 const volume=project+'_app-data-disk-v1';
 const names=(await exec('docker',['volume','ls','--format','{{.Name}}'])).stdout.trim().split('\n');
 if(names.includes(volume))await exec('docker',['volume','rm',volume]);
 try{await rm(root,{recursive:true,force:true});cleanup={containersStopped:true,probeVolumeRemoved:true,temporaryRootRemoved:true};}
 catch(e){if(e.code!=='EACCES'&&e.code!=='EPERM')throw e;cleanup={containersStopped:true,probeVolumeRemoved:true,temporaryRootRemoved:false,needsGuestRootCleanup:root};}
 console.log(JSON.stringify({cleanup}));
}
