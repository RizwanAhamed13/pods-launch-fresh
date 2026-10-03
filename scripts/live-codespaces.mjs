// Explicit live test: creates/reuses a user-owned Codespace and consumes its quota.
// Usage: gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { probeBunWebSocket } from './probe-websocket.mjs';
import { ssrProbeCommand } from './probe-ssr.mjs';
import { mysqlRuntimeProbeCommand } from './probe-mysql-runtime.mjs';
import { staticProbeCommand } from './probe-static.mjs';
const exec = promisify(execFile);
const provider=process.argv[3]||'github';if(!['github','google'].includes(provider))throw new Error('Unknown provider');
const origin=process.argv[2];if(!origin)throw new Error('Supply the PODS URL');
// Opt-in checks only for our fixtures; requires gh signed in to the same account.
const counterCheck=process.env.PODS_COUNTER_CHECK==='1';
const mysqlRuntimeCheck=process.env.PODS_MYSQL_RUNTIME_CHECK==='1';
if(mysqlRuntimeCheck&&!counterCheck)throw new Error('MySQL runtime inspection requires the counter fixture check');
const apiProduct=process.env.PODS_API_PRODUCT==='1';
const expectedInitialCount=process.env.PODS_EXPECT_INITIAL_COUNT;
if(expectedInitialCount!==undefined&&(!counterCheck||!/^\d+$/.test(expectedInitialCount)||!Number.isSafeInteger(Number(expectedInitialCount))))throw new Error('Expected initial count requires a nonnegative integer and counter fixture checking');
if(apiProduct&&!counterCheck)throw new Error('API product checking requires the counter fixture check');
const workerCheck=process.env.PODS_WORKER_CHECK==='1';
const websocketCheck=process.env.PODS_WEBSOCKET_CHECK==='1';
const ssrCheck=process.env.PODS_SSR_CHECK==='1';
const ssrFixture=process.env.PODS_SSR_FIXTURE||'nuxt';
const staticCheck=process.env.PODS_STATIC_CHECK==='1';
const staticFixture=process.env.PODS_STATIC_FIXTURE||'react';
if(!['react','angular'].includes(staticFixture)||(!staticCheck&&process.env.PODS_STATIC_FIXTURE))throw new Error('Static fixture requires an enabled React or Angular check');
if(!['nuxt','next','sveltekit'].includes(ssrFixture)||(!ssrCheck&&process.env.PODS_SSR_FIXTURE))throw new Error('SSR fixture requires an enabled Nuxt, Next or SvelteKit SSR check');
if([counterCheck,workerCheck,websocketCheck,ssrCheck,staticCheck].filter(Boolean).length>1)throw new Error('Choose one fixture check: counter, worker, WebSocket, SSR or static');
if((counterCheck||workerCheck||websocketCheck||ssrCheck||staticCheck)&&(provider!=='github'||process.env.PODS_SINGLE_LAUNCH==='1'))throw new Error('Fixture checking requires two Codespaces launches');
let token='';for await(const b of process.stdin)token+=b;token=token.trim();
const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
async function api(path,method='GET',body){const r=await fetch(origin+path,{method,headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}
const appId=process.argv[4]||me.apps[0]?.id;
if(!me.apps.some(app=>app.id===appId))throw new Error('Prepared application not found');
const selectedApp=me.apps.find(app=>app.id===appId);
if(mysqlRuntimeCheck&&selectedApp.source?.folder!=='examples/stacks/flask-mysql')throw new Error('MySQL runtime inspection is restricted to its explicit fixture');
if(staticCheck&&selectedApp.source?.folder!=='examples/stacks/'+staticFixture)throw new Error('Static inspection is restricted to its explicit fixture');
const evidencePath=process.env.PODS_EVIDENCE_FILE||`evidence/${provider}.json`;
await api('/api/connections/'+provider,'POST',{token});token='';
const results=[];
const persist=()=>writeFile(evidencePath,JSON.stringify({testedAt:new Date().toISOString(),origin,results},null,2));
let previousCount, previousJob, currentLaunch;
async function probeEnvironment(environment,code) {
  if(!/^[a-z0-9-]+$/.test(environment||''))throw new Error('Invalid Codespace environment');
  const quoted="'"+code.replaceAll("'","'\\''")+"'";
  const {stdout}=await exec('gh',['codespace','ssh','-c',environment,'--','node --input-type=module -e '+quoted],{timeout:60000,maxBuffer:65536});
  return JSON.parse(stdout);
}
async function probeCounter(environment) {
  const code=`const base='http://127.0.0.1:8080';
    async function read(path,method='GET'){const r=await fetch(base+path,{method,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Counter HTTP '+r.status);return r;}
    const response=await read('/'),contentType=response.headers.get('content-type')||'',page=await response.text(),before=await(await read('/api/count')).json();
    const expected=${JSON.stringify(previousCount??(expectedInitialCount===undefined?null:Number(expectedInitialCount)))};
    if(expected!==null&&before.count!==expected)throw new Error('Saved counter did not match expected value before writing: expected '+expected+', got '+before.count);
    const after=await(await read('/api/count','POST')).json(),again=await(await read('/api/count')).json();
    let api=null;if(${apiProduct}){const initial=JSON.parse(page),latest=await(await read('/')).json(),docs=await(await read('/docs')).text();api={name:initial.name,before:initial.count,afterWrite:latest.count,documentationDocument:docs.includes('SwaggerUIBundle'),passed:contentType.toLowerCase().startsWith('application/json')&&initial.name==='Persistent counter API'&&initial.count===before.count&&latest.count===after.count&&docs.includes('SwaggerUIBundle')};}
    console.log(JSON.stringify({productDocument:/<(html|title|h1)\\b/i.test(page),api,before:before.count,afterWrite:after.count,afterRead:again.count}));`;
  const check=await probeEnvironment(environment,code);
  check.passed=(apiProduct?check.api?.passed:check.productDocument)&&Number.isInteger(check.before)&&check.afterWrite===check.before+1&&check.afterRead===check.afterWrite&&(previousCount===undefined||check.before===previousCount);
  if(previousCount!==undefined)check.expectedAfterRelaunch=previousCount;
  else if(expectedInitialCount!==undefined)check.expectedInitialCount=Number(expectedInitialCount);
  previousCount=check.afterWrite;
  return check;
}
async function probeWorker(environment) {
  const code=`const base='http://127.0.0.1:8080',previous=${JSON.stringify(previousJob||null)},input=${JSON.stringify('native worker '+results.length)};
    async function read(path,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('Worker HTTP '+r.status+' '+path);return r;}
    const page=await(await read('/')).text(),retained=previous?await(await read('/api/jobs/'+encodeURIComponent(previous.id))).json():null;
    const submitted=await(await read('/api/jobs','POST',{text:input})).json();
    if(typeof submitted.id!=='string'||!submitted.id)throw new Error('Worker did not return a job ID');
    if(previous&&submitted.id===previous.id)throw new Error('New work reused the previous job ID');
    const deadline=Date.now()+20000;let completed;
    do {completed=await(await read('/api/jobs/'+encodeURIComponent(submitted.id))).json();if(completed.state==='complete')break;await new Promise(r=>setTimeout(r,200));}while(Date.now()<deadline);
    const latest=await(await read('/api/latest')).json();
    console.log(JSON.stringify({productDocument:/<(html|title|h1)\\b/i.test(page),input,submittedId:submitted.id,retained,completed,latest}));`;
  const check=await probeEnvironment(environment,code);
  check.passed=check.productDocument&&check.completed.id===check.submittedId&&check.completed.state==='complete'&&check.completed.text===check.input&&check.completed.result===check.input.toUpperCase()&&check.latest.id===check.submittedId&&check.latest.state==='complete'&&check.latest.result===check.completed.result&&(!previousJob||(check.retained?.id===previousJob.id&&check.retained.state==='complete'&&check.retained.text===previousJob.text&&check.retained.result===previousJob.result));
  if(previousJob)check.expectedAfterRelaunch=previousJob;
  previousJob=check.completed;
  return check;
}
async function probeWebSocket(environment) {
  const check=await probeEnvironment(environment,`console.log(JSON.stringify(await (${probeBunWebSocket.toString()})()));`);
  check.scope='Authenticated SSH WebSocket/HTTP on user compute; native provider browser/proxy tested separately';
  if(previousCount!==undefined){check.expectedAfterRelaunch=previousCount;check.passed=check.passed&&check.before===previousCount;}
  previousCount=check.afterRead;
  return check;
}
async function stopLaunch(id) {
  await api('/api/launches/'+id+'/stop','POST',{});
  const deadline=Date.now()+45000;let stopped;
  do {await new Promise(r=>setTimeout(r,1000));stopped=await api('/api/launches/'+id);} while(stopped.status!=='stopped'&&Date.now()<deadline);
  if(stopped.status!=='stopped')throw new Error('Application stop was not confirmed; repeat test aborted');
  return stopped.status;
}
const scenarios=process.env.PODS_SINGLE_LAUNCH==='1'?['launch']:['first-launch','repeat-launch'];
try {
 for(const name of scenarios) {
  const started=await api('/api/launches','POST',{provider,appId});currentLaunch=started.id;
  if(results.some(result=>result.id===started.id))throw new Error('Repeat test reused the previous launch instead of restarting');
  let launch=started,last='';const deadline=Date.now()+360000;
  while(!['ready','failed','stopped'].includes(launch.status)){
   if(Date.now()>deadline)throw new Error('Live launch timed out');
   if(launch.status!==last){console.log(name+': '+launch.status);last=launch.status;}
   await new Promise(r=>setTimeout(r,3000));launch=await api('/api/launches/'+started.id);
  }
  const result={scenario:name,...launch};results.push(result);console.log(JSON.stringify({scenario:name,status:launch.status,totalMs:launch.totalMs,deliveryMs:launch.deliveryMs,timings:launch.timings,environment:launch.environment,storageMode:launch.storageMode,error:launch.error}));
  await persist();
  if(launch.status!=='ready')throw new Error(launch.error||'Launch failed');
  if(mysqlRuntimeCheck){result.mysqlRuntimeCheck=await probeEnvironment(launch.environment,mysqlRuntimeProbeCommand(selectedApp.dataKey||selectedApp.id));await persist();}
  if(apiProduct&&new URL(launch.previewUrl).pathname!=='/docs')throw new Error('API product did not select its verified interface');
  if(counterCheck){result.counterCheck=await probeCounter(launch.environment);await persist();if(!result.counterCheck.passed)throw new Error('Counter write/read/relaunch persistence failed');}
  if(workerCheck){result.workerCheck=await probeWorker(launch.environment);await persist();if(!result.workerCheck.passed)throw new Error('Worker completion/relaunch persistence failed');}
  if(websocketCheck){result.websocketCheck=await probeWebSocket(launch.environment);await persist();if(!result.websocketCheck.passed)throw new Error('WebSocket exchange/relaunch persistence failed');}
  if(ssrCheck){result.ssrCheck=await probeEnvironment(launch.environment,ssrProbeCommand(ssrFixture));await persist();if(!result.ssrCheck.passed)throw new Error('SSR product/client assets failed');}
  if(staticCheck){result.staticCheck=await probeEnvironment(launch.environment,staticProbeCommand(staticFixture));await persist();if(!result.staticCheck.passed)throw new Error('Static product/client assets failed');}
  if (process.env.PODS_KEEP_LAST === '1' && name === scenarios.at(-1)) { console.log('Live app left running until its 30-minute deadline: '+launch.previewUrl); break; }
  result.statusAfterStop=await stopLaunch(launch.id);await persist();
  currentLaunch=null;
 }
} catch(error) {
 if(results.length){results.at(-1).testError=error.message;await persist();}
 if(currentLaunch){
  try {const status=await stopLaunch(currentLaunch);if(results.length)results.at(-1).statusAfterStop=status;}
  catch(cleanupError){if(results.length)results.at(-1).cleanupError=cleanupError.message;}
  await persist();
 }
 throw error;
} finally { await api('/api/connections/'+provider,'DELETE').catch(()=>{}); }
