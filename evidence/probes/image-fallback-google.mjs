import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '/home/aswin/pods-launch-fresh/src/store.mjs';
import {command} from '/home/aswin/pods-launch-fresh/src/util.mjs';
import {GitHubImageDelivery} from '/home/aswin/pods-launch-fresh/src/image-delivery.mjs';
const base='https://cloudshell.googleapis.com/v1/users/me/environments/default';
const out={startedAt:new Date().toISOString(),provider:'google',applicationStarted:false,productionChanged:false};
const image={sha256:'8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7',bytes:125123048};
const db=new DatabaseSync('/home/aswin/pods-launch-fresh/.data/pods.sqlite',{readOnly:true});
const valid=db.prepare("SELECT value FROM records WHERE kind='connection'").all().map(r=>JSON.parse(r.value)).filter(r=>r.provider==='google'&&r.expiresAt>Date.now()+120000);
const mapping=db.prepare("SELECT value FROM records WHERE kind='image-delivery'").all().map(r=>JSON.parse(r.value)).find(r=>r.sha256===image.sha256);db.close();
if(valid.length!==1||mapping?.assetId!==609893443||mapping.bytes!==image.bytes)throw new Error('Verified authorization and asset mapping required');
const token=Store.prototype.open.call({key:Buffer.from(process.env.PODS_SECRET,'hex')},valid[0].token);
const delivery=GitHubImageDelivery.fromEnv({data:'/home/aswin/pods-launch-fresh/.data',store:{get:(kind,key)=>kind==='image-delivery'&&key===image.sha256?mapping:null}});
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`Google HTTP ${r.status}`);return r.json();}
async function operation(op){const deadline=Date.now()+30000;while(!op.done){if(!/^operations\/[A-Za-z0-9_./-]+$/.test(op.name||'')||Date.now()>deadline)throw new Error('Operation did not complete');await new Promise(r=>setTimeout(r,500));op=await api('https://cloudshell.googleapis.com/v1/'+op.name);}if(op.error)throw new Error('Google operation failed');}
let root,key,attempted=false,beforeKeys;
try{
 const initial=await api(base);out.initialState=initial.state;beforeKeys=initial.publicKeys??[];out.initialPublicKeyCount=beforeKeys.length;
 if(initial.state!=='RUNNING')throw new Error('Probe requires already RUNNING compute');
 root=await mkdtemp(join(tmpdir(),'pods-cdn-key-'));
 await command('ssh-keygen',['-q','-t','rsa','-b','3072','-N','','-f',join(root,'key')],{timeout:20000});
 key=(await readFile(join(root,'key.pub'),'utf8')).trim().split(/\s+/).slice(0,2).join(' ');
 attempted=true;await operation(await api(base+':addPublicKey',{key}));
 const env=await api(base);if(env.state!=='RUNNING'||!env.publicKeys?.includes(key))throw new Error('Registered key unavailable');
 const url=await delivery.resolve(image);if(!url)throw new Error('Private redirect unavailable');
 out.redirectExpiresAt=new URL(url).searchParams.get('se');
 const code=await readFile('/tmp/pods-cdn-fallback-download-bundle.mjs','utf8');
 const input=code+'\nconsole.log(JSON.stringify(await probe('+JSON.stringify(url)+','+JSON.stringify(image)+')));';
 out.diagnosticStage='ssh-transfer';
 const remoteCommand=`PODS_NODE=''; for candidate in $(command -v node || true) /usr/local/nvm/versions/node/*/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do if [ -x "$candidate" ] && "$candidate" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' 2>/dev/null; then PODS_NODE="$candidate"; break; fi; done; [ -n "$PODS_NODE" ] || { echo PODS_NODE_MISSING >&2; exit 127; }; exec "$PODS_NODE" --input-type=module`;
 const response=await command('ssh' ,['-i',join(root,'key'),'-p',String(env.sshPort),'-o','BatchMode=yes','-o','ConnectTimeout=20','-o','StrictHostKeyChecking=accept-new','-o',`UserKnownHostsFile=${join(root,'known_hosts')}`,`${env.sshUsername}@${env.sshHost}`,remoteCommand],{input,timeout:60000,maxBuffer:1024*1024});
 out.diagnosticStage='parse-receipt';out.transfer=JSON.parse(response);out.completed=true;
}catch(error){out.errorCategory=/Permission denied/.test(error.message)?'ssh-auth':/PODS_NODE_MISSING/.test(error.message)?'node-missing':/timed out/.test(error.message)?'timeout':/SyntaxError/.test(error.message)?'syntax':error.name;out.exitCodeMatch=/exited (\d+)/.exec(error.message)?.[1]||null;out.completed=false;out.error=/^(Google HTTP \d+|Operation did not complete|Google operation failed|Probe requires already RUNNING compute|Registered key unavailable|Private redirect unavailable)$/.test(error.message)?error.message:'Diagnostic failed; inspect sanitized status without repeating the transfer';process.exitCode=1;}
finally{
 if(attempted&&key){try{await operation(await api(base+':removePublicKey',{key}));const final=await api(base);out.finalState=final.state;out.keyRemoved=!final.publicKeys?.includes(key);out.existingKeysPreserved=beforeKeys.every(k=>final.publicKeys?.includes(k));out.finalPublicKeyCount=(final.publicKeys??[]).length;if(!out.keyRemoved||!out.existingKeysPreserved)throw new Error('Key cleanup unconfirmed');}catch{out.cleanupFailed=true;process.exitCode=1;}}
 if(root){await rm(root,{recursive:true,force:true});out.localKeyRemoved=true;}
 out.finishedAt=new Date().toISOString();console.log(JSON.stringify(out,null,2));
}
