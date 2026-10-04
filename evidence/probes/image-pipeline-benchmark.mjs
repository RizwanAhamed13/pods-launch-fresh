// Isolated comparison: actual prepared bytes and Docker loads, a shared HTTP rate,
// and synthetic cache misses against an already-warmed Docker content store.
// Usage: node this-file BASELINE_SOURCE_DIR IMAGE_DIRECTORY MANIFEST_JSON
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {prepareRuntimeImages as candidate} from '../../src/container-runtime.mjs';
import {docker} from '../../src/containers.mjs';
const [baselineDirectory,imageDirectory,manifestPath]=process.argv.slice(2);
if(!baselineDirectory||!imageDirectory||!manifestPath)throw Error('Explicit baseline, image directory and manifest required');
const {prepareRuntimeImages:baseline}=await import(pathToFileURL(join(resolve(baselineDirectory),'container-runtime.mjs')));
const images=JSON.parse(await readFile(manifestPath,'utf8')).images;
if(images.length!==3||images.reduce((n,i)=>n+i.bytes,0)!==226330909)throw Error('Expected the selected three-image fixture');
for(const image of images){const hash=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(join(imageDirectory,image.sha256+'.gz'))){hash.update(chunk);bytes+=chunk.length;}if(hash.digest('hex')!==image.sha256||bytes!==image.bytes)throw Error('Fixture identity mismatch');}
const known=new Map(images.map(i=>['/artifact/images/'+i.sha256,i]));
const rate=20*1024**2;let nextChunk=0,activeRequests=0,peakRequests=0;
const server=createServer(async(req,res)=>{
 const image=known.get(req.url);if(!image||req.headers.authorization!=='Bearer comparison-only'){res.writeHead(404).end();return;}
 peakRequests=Math.max(peakRequests,++activeRequests);const input=createReadStream(join(imageDirectory,image.sha256+'.gz'),{highWaterMark:256*1024});
 res.on('close',()=>{if(!res.writableEnded)input.destroy();});
 try{res.writeHead(200,{'Content-Length':image.bytes});for await(const chunk of input){const at=Math.max(nextChunk,performance.now());nextChunk=at+chunk.length/rate*1000;await delay(Math.max(0,at-performance.now()));if(res.destroyed)throw Error('Comparison client closed');if(!res.write(chunk))await new Promise((resolve,reject)=>{const cleanup=()=>{res.off('drain',drain);res.off('close',close);};const drain=()=>{cleanup();resolve();};const close=()=>{cleanup();reject(Error('Comparison client closed'));};res.once('drain',drain);res.once('close',close);});}res.end();}catch{res.destroy();}finally{activeRequests--;}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const output={startedAt:new Date().toISOString(),scope:'Isolated prepared-image scheduling comparison; not native provider or product timing',bytes:226330909,images:images.length,aggregateHttpMiBPerSecond:20,syntheticCacheMiss:true,warmDockerContentStore:true,actualDockerLoads:true,samples:[]};
try{
 // Import the same images once before both implementations; never clear Docker cache.
 for(const image of images){await docker(['load','--input',join(imageDirectory,image.sha256+'.gz')],{timeout:180000});if(await docker(['image','inspect',image.id,'--format','{{.Id}}'])!==image.id)throw Error('Warmup identity mismatch');}
 for(const name of ['baseline','candidate','candidate','baseline']){
  const root=await mkdtemp(join(tmpdir(),'pods-pipeline-comparison-')),loaded=new Set(),timings={};let loads=0,activeLoads=0,peakLoads=0;nextChunk=0;peakRequests=0;
  const execute=async(args,options)=>{
   if(args[0]==='image'&&!loaded.has(args[2]))throw Error('Controlled cache miss');
   if(args[0]!=='load')return docker(args,options);
   const image=images.find(i=>args[2].endsWith(i.sha256+'.gz'));if(!image)throw Error('Unexpected archive');
   peakLoads=Math.max(peakLoads,++activeLoads);
   try{const result=await docker(args,options);loaded.add(image.id);loads++;return result;}finally{activeLoads--;}
  };
  try{const start=performance.now();await (name==='baseline'?baseline:candidate)(images,{id:'comparison-'+output.samples.length,artifactUrl:`http://127.0.0.1:${server.address().port}/artifact`,token:'comparison-only'},root,timings,execute);const sample={name,elapsedMs:Math.round(performance.now()-start),loads,peakRequests,peakLoads,timings};if(loads!==3||peakLoads!==1||peakRequests>(name==='candidate'?2:1))throw Error('Resource or loading invariant failed');output.samples.push(sample);console.log(JSON.stringify({event:'sample',...sample}));}
  finally{await rm(root,{recursive:true,force:true});}
 }
 output.meanMs=Object.fromEntries(['baseline','candidate'].map(name=>[name,Math.round(output.samples.filter(s=>s.name===name).reduce((sum,s)=>sum+s.elapsedMs,0)/2)]));
 output.reductionPercent=Math.round((1-output.meanMs.candidate/output.meanMs.baseline)*1000)/10;output.passed=true;
}finally{await new Promise(resolve=>server.close(resolve));output.finishedAt=new Date().toISOString();console.log(JSON.stringify({event:'complete',...output}));}
