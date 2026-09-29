// Explicit live test: creates/reuses a user-owned Codespace and consumes its quota.
// Usage: gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
import { writeFile } from 'node:fs/promises';
const origin=process.argv[2];if(!origin)throw new Error('Supply the PODS URL');
let token='';for await(const b of process.stdin)token+=b;token=token.trim();
const initial=await fetch(origin+'/api/me'),cookie=initial.headers.get('set-cookie').split(';')[0],me=await initial.json();
async function api(path,method='GET',body){const r=await fetch(origin+path,{method,headers:{Cookie:cookie,'X-Pods-CSRF':me.csrf,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}
await api('/api/connections/github','POST',{token});token='';
const results=[];
try {
 for(const name of ['cold','warm']) {
  const started=await api('/api/launches','POST',{provider:'github',appId:me.apps[0].id});let launch=started,last='';const deadline=Date.now()+360000;
  while(!['ready','failed','stopped'].includes(launch.status)){
   if(Date.now()>deadline)throw new Error('Live launch timed out');
   if(launch.status!==last){console.log(name+': '+launch.status);last=launch.status;}
   await new Promise(r=>setTimeout(r,3000));launch=await api('/api/launches/'+started.id);
  }
  results.push({scenario:name,...launch});console.log(JSON.stringify({scenario:name,status:launch.status,totalMs:launch.totalMs,deliveryMs:launch.deliveryMs,timings:launch.timings,environment:launch.environment,error:launch.error}));
  await writeFile('evidence/codespaces.json',JSON.stringify({testedAt:new Date().toISOString(),origin,results},null,2));
  if(launch.status!=='ready')throw new Error(launch.error||'Launch failed');
  await api('/api/launches/'+launch.id+'/stop','POST',{});
  for(let n=0;n<15;n++){await new Promise(r=>setTimeout(r,1000));if((await api('/api/launches/'+launch.id)).status==='stopped')break;}
 }
} finally { await api('/api/connections/github','DELETE').catch(()=>{}); }
