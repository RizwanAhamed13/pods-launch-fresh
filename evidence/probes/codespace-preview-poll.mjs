import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {ensureCodespacePreview} from '/home/aswin/pods-launch-fresh/src/codespace-preview.mjs';
import {command} from '/home/aswin/pods-launch-fresh/src/util.mjs';
let token='';for await(const b of process.stdin)token+=b;token=token.trim();assert.ok(token);
const name='pods-launch-containers-69rw5vx4xp46c5qw5',repo='RizwanAhamed13/pods-launch-runtime-fresh';
const ports=[26630,26525,23905,20841,22269,23608],intervals=[1000,0,500,500,0,1000];
const env={...process.env,PATH:'/home/aswin/pods-tools/bin:'+process.env.PATH,GH_TOKEN:token,GH_PROMPT_DISABLED:'1',GH_DEBUG:'0'};
const out={startedAt:new Date().toISOString(),pollMsOrder:intervals,samples:[],providerStates:[],applicationStarted:false,productionChanged:false};
const checkpoint=()=>writeFile('/tmp/pods-preview-poll-progress.json',JSON.stringify(out,null,2)+'\n',{mode:0o600});
async function api(path,method='GET'){
 const r=await fetch('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10'},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Object.assign(new Error('Provider request failed'),{status:r.status});return r.status===204?null:r.json();
}
async function awaitState(expected,from,timeout=240000){const until=Date.now()+timeout;let actual;do{actual=(await api('/user/codespaces/'+name)).state;out.lastObservedState=actual;if(out.providerStates.at(-1)?.state!==actual){out.providerStates.push({at:new Date().toISOString(),stage:out.stage,state:actual});await checkpoint();}if(actual===expected)return;assert.ok(from.includes(actual));await sleep(2000);}while(Date.now()<until);assert.equal(actual,expected);}
async function list(){return JSON.parse(await command('gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],{env,timeout:60000}));}
async function sample(pollMs,port){
 const record={pollMs,port,commands:[],processes:[]};out.samples.push(record);await checkpoint();const start=Date.now();
 await ensureCodespacePreview({name,port,env,pollMs,
  exec:async(file,args,opts)=>{const c={operation:args.includes('visibility')?'visibility':'lookup',startedMs:Date.now()-start};record.commands.push(c);try{const text=await command(file,args,opts);c.success=true;if(c.operation==='lookup'){const m=JSON.parse(text).find(v=>v.sourcePort===port);c.mappingPresent=Boolean(m);c.visibility=m?.visibility??null;}return text;}finally{c.elapsedMs=Date.now()-start-c.startedMs;}},
  spawnProcess:(file,args,opts)=>{const row={startedMs:Date.now()-start,loopbackOnly:!args.includes('--all-interfaces')};record.processes.push(row);const c=spawn(file,args,opts);c.once('exit',(code,signal)=>Object.assign(row,{elapsedMs:Date.now()-start-row.startedMs,exitCode:code,signal}));return c;}
 });
 record.elapsedMs=Date.now()-start;record.privateAfter=(await list()).find(v=>v.sourcePort===port)?.visibility==='private';assert.ok(record.privateAfter);assert.equal(record.commands[0].mappingPresent,false);record.success=true;await checkpoint();
}
let resumed=false;
try{
 out.sourceSha256=createHash('sha256').update(await readFile('/home/aswin/pods-launch-fresh/src/codespace-preview.mjs')).digest('hex');assert.equal(out.sourceSha256,'f754213af6dd999ac0f9574d37f6e9aa4fc16e39cf64f52398caefe03c133ae7');
 out.stage='initial';const initial=await api('/user/codespaces/'+name);assert.equal(initial.repository?.full_name?.toLowerCase(),repo.toLowerCase());assert.equal(initial.display_name,'PODS launch containers');out.initialState=initial.state;assert.equal(initial.state,'Shutdown');
 out.stage='starting';out.resumeRequestedAt=new Date().toISOString();resumed=true;await api('/user/codespaces/'+name+'/start','POST');await awaitState('Available',['Shutdown','Starting','Provisioning','Created','Queued','Awaiting','Updating']);out.availableAt=new Date().toISOString();out.stage='initial-mappings';await checkpoint();
 const before=await list();assert.ok(ports.every(port=>!before.some(p=>p.sourcePort===port)));out.allTargetMappingsInitiallyAbsent=true;out.stage='samples';
 for(let i=0;i<ports.length;i++)await sample(intervals[i],ports[i]);out.completed=true;
}catch(e){out.completed=false;out.errorStage=out.stage;out.errorClass=e.name;out.httpStatus=e.status??null;process.exitCode=1;}
finally{if(resumed){try{out.stage='stopping';out.stopRequestedAt=new Date().toISOString();await api('/user/codespaces/'+name+'/stop','POST');out.restoreStopAccepted=true;await checkpoint();await awaitState('Shutdown',['ShuttingDown','Available','Starting','Provisioning','Created','Queued','Awaiting','Updating']);out.finalState='Shutdown';}catch(e){out.cleanupFailed=true;out.cleanupErrorClass=e.name;process.exitCode=1;}}}
out.finishedAt=new Date().toISOString();out.stage='finished';await checkpoint();console.log(JSON.stringify(out,null,2));
