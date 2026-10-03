// Explicit live test: creates/reuses a user-owned Codespace and consumes its quota.
// Usage: gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
import { writeFile } from 'node:fs/promises';
const provider=process.argv[3]||'github';if(!['github','google'].includes(provider))throw new Error('Unknown provider');
const origin=process.argv[2];if(!origin)throw new Error('Supply the PODS URL');
let token='';for await(const b of process.stdin)token+=b;token=token.trim();
const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
async function api(path,method='GET',body){const r=await fetch(origin+path,{method,headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}
const appId=process.argv[4]||me.apps[0]?.id;
if(!me.apps.some(app=>app.id===appId))throw new Error('Prepared application not found');
const evidencePath=process.env.PODS_EVIDENCE_FILE||`evidence/${provider}.json`;
await api('/api/connections/'+provider,'POST',{token});token='';
const results=[];
const scenarios=process.env.PODS_SINGLE_LAUNCH==='1'?['launch']:['first-launch','repeat-launch'];
try {
 for(const name of scenarios) {
  const started=await api('/api/launches','POST',{provider,appId});let launch=started,last='';const deadline=Date.now()+360000;
  while(!['ready','failed','stopped'].includes(launch.status)){
   if(Date.now()>deadline)throw new Error('Live launch timed out');
   if(launch.status!==last){console.log(name+': '+launch.status);last=launch.status;}
   await new Promise(r=>setTimeout(r,3000));launch=await api('/api/launches/'+started.id);
  }
  results.push({scenario:name,...launch});console.log(JSON.stringify({scenario:name,status:launch.status,totalMs:launch.totalMs,deliveryMs:launch.deliveryMs,timings:launch.timings,environment:launch.environment,storageMode:launch.storageMode,error:launch.error}));
  await writeFile(evidencePath,JSON.stringify({testedAt:new Date().toISOString(),origin,results},null,2));
  if(launch.status!=='ready')throw new Error(launch.error||'Launch failed');
  if (process.env.PODS_KEEP_LAST === '1' && name === scenarios.at(-1)) { console.log('Live app left running until its 30-minute deadline: '+launch.previewUrl); break; }
  await api('/api/launches/'+launch.id+'/stop','POST',{});
  for(let n=0;n<15;n++){await new Promise(r=>setTimeout(r,1000));if((await api('/api/launches/'+launch.id)).status==='stopped')break;}
 }
} finally { await api('/api/connections/'+provider,'DELETE').catch(()=>{}); }
