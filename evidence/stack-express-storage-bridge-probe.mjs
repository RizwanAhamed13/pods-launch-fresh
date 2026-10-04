import { build } from '/opt/pods/node_modules/esbuild/lib/main.js';
import { run, decodeArtifact } from '/opt/pods/src/runner.mjs';
import { createHash, randomBytes } from 'node:crypto';
import { builtinModules } from 'node:module';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { mkdtemp, rm, readFile, cp, rename, lstat, mkdir, rmdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const source='/work/stacks/express/server.js';
const result=await build({entryPoints:[source],bundle:true,write:false,platform:'node',format:'cjs',target:'node22',minify:true,metafile:true,logLevel:'silent',logOverride:{'ignored-dynamic-import':'warning'}});
const builtins=new Set(builtinModules.flatMap(x=>[x,`node:${x}`]));
const external=Object.values(result.metafile.outputs).flatMap(x=>x.imports).filter(x=>x.external&&!builtins.has(x.path));
const optional=external.every(imp=>imp.kind==='require-call'&&result.warnings.some(w=>w.id==='ignored-dynamic-import'&&w.text.startsWith(`Importing ${JSON.stringify(imp.path)} was allowed even though it could not be resolved`)));
if(!external.length||!optional)throw new Error('Probe did not find only compiler-confirmed optional require calls');
const payload=Buffer.from(JSON.stringify({format:1,entry:'app.cjs',healthPath:'/',files:[{path:'app.cjs',data:Buffer.from(result.outputFiles[0].contents).toString('base64')}]}));
const bytes=gzipSync(payload,{level:9}),sha256=createHash('sha256').update(bytes).digest('hex');
decodeArtifact(bytes,sha256);

const root=await mkdtemp('/output/express-storage-bridge-probe-');
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
const migrations=[];
const nodeData=join(root,'data',dataKey);
const containerData=join(root,'volumes',project,'app-data','data');
const services=Object.values(container.containers.services);
if(services.length!==1||services[0].volumes.length!==1||services[0].volumes[0].name!=='app-data')throw new Error('Bridge probe requires the single-volume Express fixture');
async function bridge(target){
 const running=(await exec('docker',['ps','--quiet','--filter','label=com.docker.compose.project='+project])).stdout.trim();
 if(running)throw new Error('Refuse migration while the probe application is running');
 const source=target==='bundle'?containerData:nodeData;
 const destination=target==='bundle'?nodeData:containerData;
 const stagingRoot=await mkdtemp(join(root,'.handoff-'));
 const stage=join(stagingRoot,'data');
 let helper;
 try{
  if(target==='bundle'){
   await mkdir(stage,{mode:0o700});
   helper=(await exec('docker',['create','--network','none','--read-only','--entrypoint','/__pods_not_executed__','--mount',`type=bind,src=${source},dst=/pods-source,readonly`,services[0].image])).stdout.trim();
   await exec('docker',['cp',`${helper}:/pods-source/.`,stage]);
  }else await cp(source,stage,{recursive:true,dereference:false,verbatimSymlinks:true,force:false,errorOnExist:true});
  const file=await lstat(join(stage,'counter.db'));
  if(file.uid!==process.getuid())throw new Error('Copied database is not owned by the application user');
  const original=await lstat(join(source,'counter.db'));
  await rename(destination,destination+'.backup-'+migrations.length);
  await rename(stage,destination);
  await rmdir(stagingRoot);
  migrations.push({target,sourceFileUid:original.uid,copiedFileUid:file.uid,expectedUid:process.getuid(),helperExecutableRun:false});
 }finally{if(helper)await exec('docker',['rm',helper]);}
}
let cleanup,previous;
try{
 for(const [format,scenario] of [['container','existing-container'],['bundle','copy-container-to-bundle'],['container','copy-bundle-to-container'],['bundle','copy-container-to-bundle-again']]){
  if(previous&&previous!==format)await bridge(format);
  selected=format;
  app=await run({id:randomBytes(24).toString('base64url'),appId:'express-transition-probe',dataKey,sha256:format==='container'?containerSha:sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-transition',port:18095,expiresAt:Date.now()+120000},{root});
  const page=await fetch('http://127.0.0.1:18095/').then(r=>r.text());
  if(!page.includes('<h1>express counter</h1>'))throw new Error('Wrong product');
  const before=await fetch('http://127.0.0.1:18095/api/count').then(r=>r.json());
  let after=before;
  after=await fetch('http://127.0.0.1:18095/api/count',{method:'POST'}).then(r=>r.json());
  records.push({format,scenario,before:before.count,after:after.count,storageMode:app.storageMode});
  await app.stop();app=null;previous=format;
 }
 const reproduced=records.length===4&&records.every((r,i)=>r.before===i&&r.after===i+1);
 if(!reproduced)throw new Error('Explicit storage bridge did not preserve every record');
 console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Experimental explicit stopped-application copies in isolated disposable storage. Not a production migration implementation; crash recovery, ambiguous data and native providers remain unverified.',temporaryRoot:root,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),containerArtifactSha256:containerSha,containerImages:container.containers.images,bundleArtifactSha256:sha256,bundleBytes:bytes.length,records,migrations,dataContinuityPassed:reproduced,productionMigrationImplemented:false},null,2));
}finally{
 await app?.stop();await new Promise(r=>server.close(r));
 const containers=(await exec('docker',['ps','-aq','--filter','label=com.docker.compose.project='+project])).stdout.trim();
 if(containers)throw new Error('Probe containers remain; preserve data until cleanup');
 const volume=project+'_app-data-disk-v1';
 const names=(await exec('docker',['volume','ls','--format','{{.Name}}'])).stdout.trim().split('\n');
 if(names.includes(volume))await exec('docker',['volume','rm',volume]);
 try{await rm(root,{recursive:true,force:true});cleanup={containersStopped:true,probeVolumeRemoved:true,temporaryRootRemoved:true};}
 catch(e){if(e.code!=='EACCES'&&e.code!=='EPERM')throw e;cleanup={containersStopped:true,probeVolumeRemoved:true,temporaryRootRemoved:false,needsGuestRootCleanup:root};}
 console.log(JSON.stringify({cleanup}));
}
