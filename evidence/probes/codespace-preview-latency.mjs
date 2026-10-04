import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {ensureCodespacePreview} from '/home/aswin/pods-launch-fresh/src/codespace-preview.mjs';
import {command} from '/home/aswin/pods-launch-fresh/src/util.mjs';
let token='';for await(const b of process.stdin)token+=b;token=token.trim();assert.ok(token);
const name='pods-launch-containers-69rw5vx4xp46c5qw5',port=26630,repo='RizwanAhamed13/pods-launch-runtime-fresh';
const out={startedAt:new Date().toISOString(),samples:[],applicationStarted:false,productionChanged:false,existingProductPortOnly:true};
const env={...process.env,GH_TOKEN:token,GH_PROMPT_DISABLED:'1',GH_DEBUG:'1',PATH:'/home/aswin/pods-tools/bin:'+process.env.PATH};
async function api(path,method='GET'){
 const r=await fetch('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10'},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Object.assign(new Error('Provider request failed'),{status:r.status});
 return r.status===204?null:r.json();
}
function category(value){try{const u=new URL(value);if(u.hostname==='api.github.com'){if(u.pathname.includes('/contents/'))return 'repository-content';if(u.pathname.includes('/connection'))return 'codespace-connection';if(u.pathname.includes('/codespaces/'))return 'codespace-metadata';return 'github-api-other';}if(u.hostname.endsWith('.devtunnels.ms'))return 'dev-tunnel';return 'other-provider';}catch{return 'unparsed';}}
async function lookup(){
 const started=Date.now(),events=[];let stdout='',line='';
 const child=spawn('/home/aswin/pods-tools/bin/gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],{env,stdio:['ignore','pipe','pipe'],detached:true});
 child.stdout.on('data',b=>{stdout+=b;});
 child.stderr.on('data',b=>{line+=b;let at;while((at=line.indexOf('\n'))>=0){const row=line.slice(0,at);line=line.slice(at+1);let m;if(m=row.match(/^\* Request to (\S+)/))events.push({atMs:Date.now()-started,kind:'request',category:category(m[1])});else if(m=row.match(/^\* Request took ([0-9.hmsµun]+)\s*$/))events.push({atMs:Date.now()-started,kind:'completed',duration:m[1]});}});
 let killed=false;const timer=setTimeout(()=>{killed=true;try{process.kill(-child.pid,'SIGKILL');}catch{}},60000);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);}).finally(()=>clearTimeout(timer));
 const sample={elapsedMs:Date.now()-started,exitCode:code,timedOut:killed,events};out.samples.push(sample);
 assert.equal(code,0);const ports=JSON.parse(stdout);assert.ok(Array.isArray(ports));const found=ports.find(p=>p.sourcePort===port);sample.mappingPresent=Boolean(found);sample.visibility=found?.visibility??null;sample.productPortPrivate=found?.visibility==='private';return sample;
}
let resumed=false;
try{
 let initial=await api('/user/codespaces/'+name);out.entryState=initial.state;
 if(initial.state==='ShuttingDown'){const deadline=Date.now()+240000;do{await sleep(5000);initial=await api('/user/codespaces/'+name);}while(initial.state==='ShuttingDown'&&Date.now()<deadline);out.transitionFinishedAt=new Date().toISOString();}
 assert.equal(initial.name,name);assert.equal(initial.repository?.full_name?.toLowerCase(),repo.toLowerCase());assert.equal(initial.display_name,'PODS launch containers');out.initialState=initial.state;
 if(initial.state==='Shutdown'){
   out.resumeRequestedAt=new Date().toISOString();resumed=true;await api('/user/codespaces/'+name+'/start','POST');
   const deadline=Date.now()+180000;let current;
   do{current=await api('/user/codespaces/'+name);if(current.state==='Available')break;assert.ok(!['Deleted','Failed','Unavailable'].includes(current.state));await sleep(2000);}while(Date.now()<deadline);
   assert.equal(current.state,'Available');out.availableAt=new Date().toISOString();
 }else assert.equal(initial.state,'Available');
 const original=await lookup();
 const registration={startedAt:new Date().toISOString(),commands:[],processes:[]};out.registration=registration;const at=Date.now();
 await ensureCodespacePreview({name,port,env,exec:async(file,args,opts)=>{const c={operation:args.includes('visibility')?'visibility':'lookup',startedMs:Date.now()-at};registration.commands.push(c);try{const value=await command(file,args,{...opts,env:{...opts.env,GH_DEBUG:'0'}});c.success=true;if(c.operation==='lookup'){const found=JSON.parse(value).find(p=>p.sourcePort===port);c.mappingPresent=Boolean(found);c.visibility=found?.visibility??null;}return value;}finally{c.elapsedMs=Date.now()-at-c.startedMs;}},spawnProcess:(file,args,opts)=>{const row={operation:'forward',startedMs:Date.now()-at};registration.processes.push(row);const child=spawn(file,args,{...opts,env:{...opts.env,GH_DEBUG:'0'}});child.once('exit',(code,signal)=>Object.assign(row,{elapsedMs:Date.now()-at-row.startedMs,exitCode:code,signal}));return child;}});
 registration.elapsedMs=Date.now()-at;registration.success=true;
 for(let i=0;i<2;i++){const after=await lookup();assert.ok(after.productPortPrivate);}out.previewConfirmedPrivate=true;
 out.completed=true;
}catch(e){out.completed=false;out.errorClass=e.name;out.httpStatus=e.status??null;process.exitCode=1;}
finally{if(resumed){try{await api('/user/codespaces/'+name+'/stop','POST');out.restoreStopAccepted=true;const deadline=Date.now()+240000;let state;do{await sleep(5000);state=(await api('/user/codespaces/'+name)).state;}while(state==='ShuttingDown'&&Date.now()<deadline);out.finalState=state;assert.equal(state,'Shutdown');}catch{out.restoreStopAccepted=false;process.exitCode=1;}}}
out.finishedAt=new Date().toISOString();console.log(JSON.stringify(out,null,2));
