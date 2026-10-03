// Run only inside the disposable LXD matrix guest, never on a user's environment.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {run} from '../src/runner.mjs';
import {probeMysqlRuntime} from './probe-mysql-runtime.mjs';

assert.equal(process.env.PODS_ISOLATED_BUILD,'1','Explicit disposable-guest marker required');
const output='/output/flask-mysql',root='/workspaces/.pods-launch';
const manifest=JSON.parse(await readFile(output+'/manifest.json','utf8'));
const dataKey='qa-mysql-boundary-'+randomUUID();
const server=createServer(async(req,res)=>{
  if(req.url==='/artifact')return createReadStream(output+'/artifact.gz').pipe(res);
  const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
  if(image&&manifest.images.some(i=>i.sha256===image[1]))return createReadStream(output+'/images/'+image[1]+'.gz').pipe(res);
  for await(const chunk of req){}res.end('{}');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const launch=()=>run({id:randomUUID(),appId:dataKey,dataKey,sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-fixture',port:8080,expiresAt:Date.now()+180000},{root});
const count=async method=>{const r=await fetch('http://127.0.0.1:8080/api/count',{method,signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);return(await r.json()).count;};
let running;
try{
  running=await launch();const first=await probeMysqlRuntime(dataKey),before=await count('GET'),saved=await count('POST');assert.equal(saved,before+1);await running.stop();
  running=await launch();const repeat=await probeMysqlRuntime(dataKey),afterRestart=await count('GET');assert.equal(afterRestart,saved);await running.stop();running=null;
  const evidence={passed:true,scope:'Real isolated Docker/MySQL and durable-volume boundary inspection under a Codespaces-shaped workspace path; not native provider evidence.',dataKey,first,repeat,before,saved,afterRestart,stopped:true,recordedAt:new Date().toISOString()};
  await writeFile('/output/evidence/mysql-runtime-boundary-01.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(evidence));
}finally{await running?.stop();await new Promise(resolve=>server.close(resolve));}
