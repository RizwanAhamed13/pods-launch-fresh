// Explicit live test: creates/reuses a user-owned Codespace and consumes its quota.
// Usage: gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const provider=process.argv[3]||'github';if(!['github','google'].includes(provider))throw new Error('Unknown provider');
const origin=process.argv[2];if(!origin)throw new Error('Supply the PODS URL');
// Opt-in only for our counter fixtures; requires gh signed in to the same account.
const counterCheck=process.env.PODS_COUNTER_CHECK==='1';
if(counterCheck&&(provider!=='github'||process.env.PODS_SINGLE_LAUNCH==='1'))throw new Error('Counter persistence checking requires two Codespaces launches');
let token='';for await(const b of process.stdin)token+=b;token=token.trim();
const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
async function api(path,method='GET',body){const r=await fetch(origin+path,{method,headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}
const appId=process.argv[4]||me.apps[0]?.id;
if(!me.apps.some(app=>app.id===appId))throw new Error('Prepared application not found');
const evidencePath=process.env.PODS_EVIDENCE_FILE||`evidence/${provider}.json`;
await api('/api/connections/'+provider,'POST',{token});token='';
const results=[];
const persist=()=>writeFile(evidencePath,JSON.stringify({testedAt:new Date().toISOString(),origin,results},null,2));
let previousCount, currentLaunch;
async function probeCounter(environment) {
  if(!/^[a-z0-9-]+$/.test(environment||''))throw new Error('Invalid Codespace environment');
  const code=`const base='http://127.0.0.1:8080';
    async function read(path,method='GET'){const r=await fetch(base+path,{method,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Counter HTTP '+r.status);return r;}
    const page=await(await read('/')).text(),before=await(await read('/api/count')).json(),after=await(await read('/api/count','POST')).json(),again=await(await read('/api/count')).json();
    console.log(JSON.stringify({productDocument:/<(html|title|h1)\\b/i.test(page),before:before.count,afterWrite:after.count,afterRead:again.count}));`;
  const quoted="'"+code.replaceAll("'","'\\''")+"'";
  const {stdout}=await exec('gh',['codespace','ssh','-c',environment,'--','node --input-type=module -e '+quoted],{timeout:60000,maxBuffer:65536});
  const check=JSON.parse(stdout);
  check.passed=check.productDocument&&Number.isInteger(check.before)&&check.afterWrite===check.before+1&&check.afterRead===check.afterWrite&&(previousCount===undefined||check.before===previousCount);
  if(previousCount!==undefined)check.expectedAfterRelaunch=previousCount;
  previousCount=check.afterWrite;
  return check;
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
  if(counterCheck){result.counterCheck=await probeCounter(launch.environment);await persist();if(!result.counterCheck.passed)throw new Error('Counter write/read/relaunch persistence failed');}
  if (process.env.PODS_KEEP_LAST === '1' && name === scenarios.at(-1)) { console.log('Live app left running until its 30-minute deadline: '+launch.previewUrl); break; }
  await api('/api/launches/'+launch.id+'/stop','POST',{});
  const stopDeadline=Date.now()+45000;let stopped;
  do {await new Promise(r=>setTimeout(r,1000));stopped=await api('/api/launches/'+launch.id);} while(stopped.status!=='stopped'&&Date.now()<stopDeadline);
  result.statusAfterStop=stopped.status;await persist();
  if(stopped.status!=='stopped')throw new Error('Application stop was not confirmed; repeat test aborted');
  currentLaunch=null;
 }
} catch(error) {
 if(results.length){results.at(-1).testError=error.message;await persist();}
 if(currentLaunch)await api('/api/launches/'+currentLaunch+'/stop','POST',{}).catch(()=>{});
 throw error;
} finally { await api('/api/connections/'+provider,'DELETE').catch(()=>{}); }
