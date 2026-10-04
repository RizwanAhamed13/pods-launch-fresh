// Explicit native test; gh auth token is supplied on stdin. Preserves saved data.
// Args: PODS origin, new bundle ID, existing container ID, expected count, Codespace, evidence file.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);
const [origin,bundleId,containerId,countText,environment,evidencePath]=process.argv.slice(2);
assert.ok(origin&&bundleId&&containerId&&evidencePath);
assert.match(countText,/^\d+$/);assert.match(environment,/^[a-z0-9-]+$/);
let expected=Number(countText);assert.ok(Number.isSafeInteger(expected));
let token='';for await(const chunk of process.stdin)token+=chunk;token=token.trim();
const response=await fetch(origin+'/api/me'),cookie=response.headers.get('set-cookie').split(';')[0],me=await response.json();
async function api(path,method='GET',body){
 const r=await fetch(origin+path,{method,headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await r.json();if(!r.ok)throw new Error(data.error);return data;
}
const bundle=me.apps.find(a=>a.id===bundleId),container=me.apps.find(a=>a.id===containerId);
assert.equal(bundle?.applicationType,'node');assert.equal(container?.applicationType,'container');
assert.equal(bundle.source?.folder,'examples/stacks/express');assert.equal(container.source?.folder,bundle.source.folder);
assert.ok(bundle.dataKey);assert.equal(bundle.dataKey,container.dataKey);
const evidence={scope:'Real Codespaces API dispatch and authenticated HTTP across prepared Express artifact formats; not native browser execution.',apps:{bundle:bundleId,container:containerId,dataKey:bundle.dataKey},expectedEnvironment:environment,initialCount:expected,results:[]};
const persist=()=>writeFile(evidencePath,JSON.stringify({...evidence,recordedAt:new Date().toISOString()},null,2)+'\n');
let current;
async function stop(id){
 await api('/api/launches/'+id+'/stop','POST',{});const deadline=Date.now()+45000;
 while(Date.now()<deadline){const state=await api('/api/launches/'+id);if(state.status==='stopped')return 'stopped';await new Promise(r=>setTimeout(r,1000));}
 throw new Error('Full application stop was not confirmed');
}
await api('/api/connections/github','POST',{token});token='';
try{
 for(const [scenario,appId] of [['container-to-bundle',bundleId],['bundle-to-container',containerId],['container-to-bundle-again',bundleId]]){
  const started=await api('/api/launches','POST',{provider:'github',appId});current=started.id;
  assert.ok(!evidence.results.some(r=>r.id===current));
  let launch=started,previous='';const deadline=Date.now()+360000;
  while(!['ready','failed','stopped'].includes(launch.status)){
   if(Date.now()>deadline)throw new Error('Native format transition timed out');
   if(launch.status!==previous){console.log(scenario+': '+launch.status);previous=launch.status;}
   await new Promise(r=>setTimeout(r,3000));launch=await api('/api/launches/'+current);
  }
  const result={scenario,...launch};evidence.results.push(result);await persist();
  assert.equal(launch.status,'ready',launch.error);assert.equal(launch.environment,environment);
  assert.equal(launch.appId,appId);assert.equal(launch.storageMode,'persistent');
  const code=`const base=${JSON.stringify('http://127.0.0.1:') }+${JSON.stringify(launch.port)};
   const read=async(path,method='GET')=>{const r=await fetch(base+path,{method,signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);return r;};
   const page=await(await read('/')).text();if(!page.includes('<h1>express counter</h1>'))throw Error('Wrong product');
   const before=(await(await read('/api/count')).json()).count;
   if(before!==${expected})throw Error('Saved counter changed before write: expected ${expected}, got '+before);
   const after=(await(await read('/api/count','POST')).json()).count,readBack=(await(await read('/api/count')).json()).count;
   if(after!==before+1||readBack!==after)throw Error('SQLite write/read failed');
   console.log(JSON.stringify({before,afterWrite:after,afterRead:readBack,productDocument:true,passed:true}));`;
  const quoted="'"+code.replaceAll("'","'\\''")+"'";
  const {stdout}=await exec('gh',['codespace','ssh','-c',environment,'--','node --input-type=module -e '+quoted],{timeout:60000,maxBuffer:65536});
  result.counterCheck=JSON.parse(stdout);expected=result.counterCheck.afterRead;await persist();
  result.statusAfterStop=await stop(current);current=null;await persist();
  console.log(JSON.stringify({scenario,totalMs:launch.totalMs,deliveryMs:launch.deliveryMs,compute:launch.compute,timings:launch.timings,counterCheck:result.counterCheck,statusAfterStop:result.statusAfterStop}));
 }
 evidence.passed=true;await persist();
}catch(error){
 evidence.error=error.message;
 if(current){try{const status=await stop(current);if(evidence.results.length)evidence.results.at(-1).statusAfterStop=status;}catch(cleanupError){evidence.cleanupError=cleanupError.message;}}
 await persist();throw error;
}finally{await api('/api/connections/github','DELETE').catch(()=>{});}
