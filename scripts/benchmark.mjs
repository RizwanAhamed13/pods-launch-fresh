// Local runner microbenchmark, intentionally excludes provider provisioning and SSH.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { prepare } from './prepare.mjs';
import { run } from '../src/runner.mjs';
import { uid, sleep } from '../src/util.mjs';
const root=await mkdtemp(join(tmpdir(),'pods-bench-'));
const manifest=await prepare('examples/notes',root),bytes=await readFile(join(root,'artifacts',manifest.sha256+'.gz'));
const server=createServer(async(req,res)=>{if(req.url==='/artifact')return res.end(bytes);for await(const p of req){}res.end('{}');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const samples=[];
try {
 for(let i=0;i<10;i++) {
  const result=await run({id:uid(),appId:manifest.id,sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:uid(),port:18083,expiresAt:Date.now()+60000},{root:join(root,'compute')});
  samples.push(result.timings);await result.stop();await sleep(100);
 }
 const sorted=samples.map(x=>x.runtimeReadyMs).sort((a,b)=>a-b);
 const result={scope:'Local runner only: no provider, no SSH, loopback artifact delivery',testedAt:new Date().toISOString(),node:process.version,artifactBytes:manifest.bytes,sha256:manifest.sha256,samples,p50Ms:sorted[4],p95Ms:sorted[9]};
 await writeFile('evidence/local-runner.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally {await new Promise(r=>server.close(r));await sleep(100);await rm(root,{recursive:true,force:true});}
