// Run inside an isolated, disposable LXD matrix container after source delivery.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { buildSource } from './build-worker.mjs';
import { run } from '../src/runner.mjs';
import { uid } from '../src/util.mjs';

const names=process.argv.slice(2);
if(!names.length)throw new Error('Choose one or more stack fixtures.');
const evidence=[];await mkdir('/output/evidence',{recursive:true});
for(const name of names){
  if(!/^[a-z0-9-]+$/.test(name))throw new Error('Invalid fixture');
  const output='/output/'+name,started=Date.now();let server,running;
  try{
    const manifest=await buildSource('/work/stacks/'+name,output,{id:name,name});
    const buildMs=Date.now()-started;
    server=createServer(async(req,res)=>{
      if(req.url==='/artifact')return createReadStream(join(output,'artifact.gz')).pipe(res);
      const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
      if(image&&manifest.images?.some(i=>i.sha256===image[1]))return createReadStream(join(output,'images',image[1]+'.gz')).pipe(res);
      for await(const chunk of req){}res.end('{}');
    });
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
    const launch=()=>run({id:uid(),appId:name,sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'fixture',port:8080,expiresAt:Date.now()+300000},{root:join(output,'compute')});
    running=await launch();const first={...running.timings};
    const page=await fetch('http://127.0.0.1:8080/').then(r=>r.text());
    let persistence=null;
    const before=await fetch('http://127.0.0.1:8080/api/count');
    if(before.headers.get('content-type')?.includes('application/json')){
      const count=(await before.json()).count;
      const saved=await fetch('http://127.0.0.1:8080/api/count',{method:'POST'}).then(r=>r.json());
      if(saved.count!==count+1)throw new Error('Counter write/read failed');
      await running.stop();running=await launch();
      const restored=await fetch('http://127.0.0.1:8080/api/count').then(r=>r.json());
      if(restored.count!==saved.count)throw new Error('Database record lost after application restart');
      persistence={before:count,saved:saved.count,afterRestart:restored.count};
    }else{
      await running.stop();running=await launch();
      const reloaded=await fetch('http://127.0.0.1:8080/');
      if(!reloaded.ok)throw new Error('Product failed after restart');
    }
    const result={stack:name,status:'passed',scope:'real isolated server build, artifact launch, HTTP product and API interaction; not native provider browser evidence',buildMs,first,repeat:running.timings,persistence,htmlBytes:page.length,runtime:manifest.runtime,images:manifest.images,sha256:manifest.sha256};
    evidence.push(result);await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(result));
  }catch(e){evidence.push({stack:name,status:'failed',error:e.message});console.error(name,e.message);process.exitCode=1;}
  finally{await running?.stop();if(server)await new Promise(r=>server.close(r));await writeFile('/output/evidence/matrix.json',JSON.stringify(evidence,null,2));}
}
