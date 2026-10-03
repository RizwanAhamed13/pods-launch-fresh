// Run only in the disposable matrix guest. Reuses its existing PostgreSQL fixture.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { run, decodeArtifact } from '../src/runner.mjs';
import { docker, runtimeCompose } from '../src/containers.mjs';
import { uid } from '../src/util.mjs';

const stack='flask-postgres',output='/output/'+stack;
const manifest=JSON.parse(await readFile(output+'/manifest.json','utf8'));
const identity='storage-probe-'+createHash('sha256').update(uid()).digest('hex').slice(0,16);
const root='/output/'+identity;await mkdir(root,{mode:0o700});
const project='pods-'+createHash('sha256').update(identity).digest('hex').slice(0,24);
const plan=decodeArtifact(await readFile(output+'/artifact.gz'),manifest.sha256).containers;
// Seed a real legacy named volume without importing an old checkout.
const legacyFile=root+'/legacy-compose.json';
await writeFile(legacyFile,JSON.stringify(runtimeCompose(plan,project,18088)));
const legacyArgs=['compose','--project-name',project,'--file',legacyFile];
const stopLegacy=()=>docker([...legacyArgs,'down','--timeout','10','--remove-orphans']);
const server=createServer(async(req,res)=>{
  if(req.url==='/artifact')return createReadStream(output+'/artifact.gz').pipe(res);
  const m=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
  if(m&&manifest.images.some(i=>i.sha256===m[1]))return createReadStream(output+'/images/'+m[1]+'.gz').pipe(res);
  for await(const chunk of req){}res.end('{}');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const launch=()=>run({id:uid(),appId:identity,sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'fixture',port:18088,expiresAt:Date.now()+300000},{root});
const count=method=>fetch('http://127.0.0.1:18088/api/count',{method}).then(r=>r.json()).then(x=>x.count);
let running;
try {
  await docker([...legacyArgs,'up','--detach','--no-build','--pull','never','--wait','--wait-timeout','90']);
  const deadline=Date.now()+60000;
  while(true){try{await count('GET');break;}catch(e){if(Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,200));}}
  const before=await count('GET');const saved=await count('POST');assert.equal(saved,before+1);await stopLegacy();
  running=await launch();const migrated=await count('GET');assert.equal(migrated,saved);const updated=await count('POST');assert.equal(updated,saved+1);await running.stop();
  const volumes=JSON.parse(await docker(['volume','inspect',project+'_records-disk-v1']));
  assert.equal(volumes[0].Options.o,'bind');assert.ok(volumes[0].Options.device.startsWith(root+'/volumes/'));
  await docker(['volume','rm',project+'_records-disk-v1']);
  running=await launch();const afterMetadataRecreation=await count('GET');assert.equal(afterMetadataRecreation,updated);
  const evidence={status:'passed',scope:'Real isolated Docker/PostgreSQL: legacy migration and Docker volume metadata recreation; native provider checks are separate',identity,before,saved,migrated,updated,afterMetadataRecreation,timings:running.timings,storage:volumes[0].Options,at:new Date().toISOString()};
  await writeFile('/output/evidence/storage-live.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
} finally { await running?.stop();await stopLegacy().catch(()=>{});await new Promise(r=>server.close(r)); }
