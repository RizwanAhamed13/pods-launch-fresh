// Isolated QA only: capture fresh-database startup errors before cleanup.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {docker,runtimeCompose} from '../src/containers.mjs';
import {persistentVolumes} from '../src/storage.mjs';
import {randomBytes} from 'node:crypto';
if(process.getuid()===0 || process.env.PODS_ISOLATED_BUILD!=='1')throw new Error('Run inside the unprivileged QA guest.');
const original=JSON.parse(gunzipSync(await readFile('/output/react-express-postgres/artifact.gz'))).containers,results=[];
for(const tcpReady of [false,true]){
const plan=structuredClone(original);
// Extend PostgreSQL's real socket-only initialization window deterministically.
plan.services.db.entrypoint=['sh','-c',"printf 'SELECT pg_sleep(8);' > /docker-entrypoint-initdb.d/00-readiness.sql; exec docker-entrypoint.sh postgres"];
if(tcpReady)plan.services.db.healthcheck.test=plan.services.db.healthcheck.test.map(x=>x.replace('pg_isready ','pg_isready -h 127.0.0.1 '));
const project='pods-'+randomBytes(12).toString('hex'),root='/output/combined-start-diagnostic';
await mkdir(root,{recursive:true});
const compose=runtimeCompose(plan,project,18091);compose.volumes=await persistentVolumes(plan,project,root);
const file=root+'/'+project+'.json';await writeFile(file,JSON.stringify(compose));
const args=['compose','--project-name',project,'--file',file], evidence={tcpReady,project,startedAt:new Date().toISOString(),status:'pending',services:[]};
try{await docker([...args,'up','--detach','--no-build','--pull','never','--wait','--wait-timeout','90'],{timeout:120000});evidence.status='passed';}
catch(e){evidence.status='failed';evidence.error=e.message.slice(-1200);}
finally{
  for(const key of Object.keys(plan.services)){
    const id=await docker([...args,'ps','--all','--quiet',key]);if(!id)continue;
    const state=JSON.parse(await docker(['inspect','--format','{{json .State}}',id]));
    evidence.services.push({service:key,status:state.Status,exitCode:state.ExitCode,health:state.Health,logs:await docker([...args,'logs','--no-color','--tail','30',key]).catch(e=>e.message)});
  }
  results.push(evidence);await writeFile('/output/evidence/combined-start-diagnostic.json',JSON.stringify(results,null,2));
  await docker([...args,'down','--timeout','10'],{timeout:60000});
}
console.log(JSON.stringify(evidence));
}
