import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import {ensureCodespacePreview} from '/home/aswin/pods-launch-fresh/src/codespace-preview.mjs';
import {command} from '/home/aswin/pods-launch-fresh/src/util.mjs';
let token='';for await(const b of process.stdin)token+=b;token=token.trim();assert.ok(token);
const name='pods-launch-containers-69rw5vx4xp46c5qw5',repo='RizwanAhamed13/pods-launch-runtime-fresh';
const ports=[26630,26525,23905,20841],modes=['serial','eager','eager','serial'];
const env={...process.env,PATH:'/home/aswin/pods-tools/bin:'+process.env.PATH,GH_TOKEN:token,GH_PROMPT_DISABLED:'1',GH_DEBUG:'0'};
const out={startedAt:new Date().toISOString(),order:modes,samples:[],applicationStarted:false,productionChanged:false};
const checkpoint=()=>writeFile('/tmp/pods-preview-overlap-progress.json',JSON.stringify(out,null,2)+'\n',{mode:0o600});
async function api(path,method='GET'){
 const r=await fetch('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10'},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Object.assign(new Error('Provider request failed'),{status:r.status});return r.status===204?null:r.json();
}
async function state(){return (await api('/user/codespaces/'+name)).state;}
async function awaitState(expected,from,timeout=240000){const until=Date.now()+timeout;let actual;do{actual=await state();if(actual===expected)return;assert.ok(from.includes(actual),`Unexpected provider state: ${actual}`);await sleep(2000);}while(Date.now()<until);assert.equal(actual,expected);}
async function list(){return JSON.parse(await command('gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],{env,timeout:60000}));}
// Experimental ordering only. The candidate retains the production deadline,
// privacy checks, loopback-only forwarding and termination/reaping behavior.
async function eager({name,port,env,exec,spawnProcess,pollMs=1000,timeoutMs=60000}){
 const deadline=Date.now()+timeoutMs;
 const options=()=>{const timeout=deadline-Date.now();if(timeout<=0)throw new Error('Codespaces preview registration timed out.');return {env,timeout};};
 const lookup=async()=>{const p=JSON.parse(await exec('gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],options()));if(!Array.isArray(p))throw new Error('Codespaces did not return its preview ports.');return p.find(v=>v.sourcePort===port);};
 let forward,closed,forwardError;
 try{
  forward=spawnProcess('gh',['codespace','ports','forward',`${port}:0`,'-c',name],{env,stdio:'ignore'});
  closed=new Promise(resolve=>{forward.once('error',error=>{forwardError=error;resolve();});forward.once('exit',(code,signal)=>{forwardError=new Error(`Codespaces forwarding ended before registration (${code??signal}).`);resolve();});});
  let mapping=await lookup();
  while(!mapping){if(forwardError)throw forwardError;if(Date.now()>=deadline)throw new Error('Codespaces preview registration timed out.');await sleep(Math.min(pollMs,deadline-Date.now()));mapping=await lookup();}
  if(mapping.visibility!=='private')await exec('gh',['codespace','ports','visibility',`${port}:private`,'-c',name],options());
 }finally{if(forward){forward.kill('SIGTERM');const timer=setTimeout(()=>forward.kill('SIGKILL'),2000);await closed;clearTimeout(timer);}}
}
async function sample(mode,port,existing){
 const record={mode,port,existingMapping:existing,commands:[],processes:[]};out.samples.push(record);await checkpoint();const start=Date.now();
 const options={name,port,env,exec:async(file,args,opts)=>{const c={operation:args.includes('visibility')?'visibility':'lookup',startedMs:Date.now()-start};record.commands.push(c);try{const text=await command(file,args,opts);c.success=true;if(c.operation==='lookup'){const m=JSON.parse(text).find(v=>v.sourcePort===port);c.mappingPresent=Boolean(m);c.visibility=m?.visibility??null;}return text;}finally{c.elapsedMs=Date.now()-start-c.startedMs;}},spawnProcess:(file,args,opts)=>{const row={startedMs:Date.now()-start,loopbackOnly:!args.includes('--all-interfaces')};record.processes.push(row);const c=spawn(file,args,opts);c.once('exit',(code,signal)=>Object.assign(row,{elapsedMs:Date.now()-start-row.startedMs,exitCode:code,signal}));return c;}};
 await (mode==='serial'?ensureCodespacePreview:eager)(options);record.elapsedMs=Date.now()-start;
 record.privateAfter=(await list()).find(v=>v.sourcePort===port)?.visibility==='private';assert.ok(record.privateAfter);record.success=true;await checkpoint();
}
let resumed=false;
try{
 const initial=await api('/user/codespaces/'+name);assert.equal(initial.repository?.full_name?.toLowerCase(),repo.toLowerCase());assert.equal(initial.display_name,'PODS launch containers');out.initialState=initial.state;assert.ok(['Shutdown','Available'].includes(initial.state));
 resumed=true;out.restoreTargetState='Shutdown';out.stage='provider-ready';
 if(initial.state==='Shutdown'){out.resumeRequestedAt=new Date().toISOString();await api('/user/codespaces/'+name+'/start','POST');}
 else out.reusesComputeFromRetainedFailedAttempt=true;
 await awaitState('Available',['Shutdown','Starting','Provisioning','Created','Queued','Awaiting','Updating']);out.availableAt=new Date().toISOString();out.stage='initial-mappings';await checkpoint();
 const before=await list();assert.ok(ports.every(port=>!before.some(p=>p.sourcePort===port)));out.allTargetMappingsInitiallyAbsent=true;
 out.stage='absent-mapping-samples';for(let i=0;i<ports.length;i++)await sample(modes[i],ports[i],false);
 out.stage='existing-mapping-samples';for(let i=0;i<ports.length;i++)await sample(modes[i],ports[i],true);
 out.completed=true;
}catch(e){out.completed=false;out.errorClass=e.name;out.httpStatus=e.status??null;process.exitCode=1;}
finally{
 if(resumed){try{out.stopRequestedAt=new Date().toISOString();await api('/user/codespaces/'+name+'/stop','POST');out.restoreStopAccepted=true;await checkpoint();await awaitState('Shutdown',['ShuttingDown','Available','Starting','Provisioning','Created','Queued','Awaiting','Updating']);out.finalState='Shutdown';}catch{out.cleanupFailed=true;process.exitCode=1;}}
}
out.finishedAt=new Date().toISOString();await checkpoint();console.log(JSON.stringify(out,null,2));
