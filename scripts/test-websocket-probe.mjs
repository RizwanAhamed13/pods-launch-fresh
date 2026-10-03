// Isolated QA only: validate the shared probe against the prepared Bun artifact.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { run } from '../src/runner.mjs';
import { uid } from '../src/util.mjs';
import { probeBunWebSocket } from './probe-websocket.mjs';

if(process.env.PODS_ISOLATED_BUILD!=='1'||process.getuid?.()===0)throw new Error('Run only as the isolated QA user');
const output='/output/bun',manifest=JSON.parse(await readFile(output+'/manifest.json'));
const results=[];let running;
const server=createServer(async(req,res)=>{
  if(req.url==='/artifact')return createReadStream(output+'/artifact.gz').pipe(res);
  const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
  if(image&&manifest.images.some(i=>i.sha256===image[1]))return createReadStream(output+'/images/'+image[1]+'.gz').pipe(res);
  for await(const chunk of req){}res.end('{}');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
try{
  let previous;
  for(const scenario of ['first-launch','repeat-launch']){
    running=await run({id:uid(),appId:'bun',dataKey:'websocket-probe-bun',sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-test',port:8080,expiresAt:Date.now()+120000},{root:output+'/websocket-probe-compute'});
    const result=await probeBunWebSocket();assert.equal(result.passed,true);
    if(previous!==undefined)assert.equal(result.before,previous,'WebSocket write must survive full artifact restart');
    results.push({scenario,...result,timings:running.timings,expectedAfterRelaunch:previous});previous=result.afterRead;
    await running.stop();running=null;
  }
  console.log(JSON.stringify({passed:true,scope:'real prepared Bun artifact in isolated QA; native provider tests separate',results},null,2));
}finally{
  await running?.stop();await new Promise(r=>server.close(r));
  await writeFile('/output/evidence/websocket-probe.json',JSON.stringify({passed:results.length===2,results},null,2));
}
