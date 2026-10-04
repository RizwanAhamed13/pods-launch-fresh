import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '/home/aswin/pods-launch-fresh/src/store.mjs';
import {command} from '/home/aswin/pods-launch-fresh/src/util.mjs';
const base='https://cloudshell.googleapis.com/v1/users/me/environments/default';
const out={startedAt:new Date().toISOString(),provider:'google',applicationStarted:false,productionChanged:false};
const db=new DatabaseSync('/home/aswin/pods-launch-fresh/.data/pods.sqlite',{readOnly:true});
const valid=db.prepare("SELECT value FROM records WHERE kind='connection'").all().map(r=>JSON.parse(r.value)).filter(r=>r.provider==='google'&&r.expiresAt>Date.now()+120000);
const active=db.prepare("SELECT value FROM records WHERE kind='launch'").all().map(r=>JSON.parse(r.value)).filter(r=>r.provider==='google'&&r.appId==='repo-46d8ac316f3e95857ce28b48-d6da2ed780ae-04f62fea5403'&&r.status==='ready'&&r.expiresAt>Date.now());db.close();
if(valid.length!==1||active.length!==1)throw new Error('Verified authorization and active selected application required');
out.launchId=active[0].id;
const token=Store.prototype.open.call({key:Buffer.from(process.env.PODS_SECRET,'hex')},valid[0].token);
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`Google HTTP ${r.status}`);return r.json();}
async function operation(op){const deadline=Date.now()+30000;while(!op.done){if(!/^operations\/[A-Za-z0-9_./-]+$/.test(op.name||'')||Date.now()>deadline)throw new Error('Operation did not complete');await new Promise(r=>setTimeout(r,500));op=await api('https://cloudshell.googleapis.com/v1/'+op.name);}if(op.error)throw new Error('Google operation failed');}
let root,key,attempted=false,beforeKeys;
try{
 const initial=await api(base);out.initialState=initial.state;beforeKeys=initial.publicKeys??[];out.initialPublicKeyCount=beforeKeys.length;
 if(initial.state!=='RUNNING')throw new Error('Probe requires already RUNNING compute');
 root=await mkdtemp(join(tmpdir(),'pods-registry-mariadb-runtime-key-'));
 await command('ssh-keygen',['-q','-t','rsa','-b','3072','-N','','-f',join(root,'key')],{timeout:20000});
 key=(await readFile(join(root,'key.pub'),'utf8')).trim().split(/\s+/).slice(0,2).join(' ');
 attempted=true;await operation(await api(base+':addPublicKey',{key}));
 const env=await api(base);if(env.state!=='RUNNING'||!env.publicKeys?.includes(key))throw new Error('Registered key unavailable');
 const input=await readFile('/tmp/pods-registry-mariadb-runtime-inspect.mjs','utf8');
 const remoteCommand = `set -eu; PODS_INSPECT_NODE=''; for candidate in $(command -v node || true) /usr/local/nvm/versions/node/*/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do if [ -x "$candidate" ] && "$candidate" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' 2>/dev/null; then PODS_INSPECT_NODE="$candidate"; break; fi; done; [ -n "$PODS_INSPECT_NODE" ]; exec "$PODS_INSPECT_NODE" --input-type=module`;
 const response=await command('ssh',['-i',join(root,'key'),'-p',String(env.sshPort),'-o','BatchMode=yes','-o','ConnectTimeout=20','-o','StrictHostKeyChecking=accept-new','-o',`UserKnownHostsFile=${join(root,'known_hosts')}`,`${env.sshUsername}@${env.sshHost}`,remoteCommand],{input,timeout:60000,maxBuffer:1024*1024});
 out.runtime=JSON.parse(response);out.completed=true;
}catch(error){out.completed=false;out.errorShape={name:error.name,sshExit:Number((/ssh exited (\d+)/.exec(error.message)||[])[1])||null,commandMissing:/command not found|not found/.test(error.message),syntaxError:/SyntaxError/.test(error.message),referenceError:/ReferenceError/.test(error.message),typeError:/TypeError/.test(error.message),invalidOption:/bad option|unknown option/.test(error.message),missingFile:/ENOENT|No such file/.test(error.message),connectionError:/Connection closed|Connection reset|Connection refused/.test(error.message)};out.safeErrorLine=(error.message.match(/(?:SyntaxError|ReferenceError|TypeError)(?: \[.*?\])?: [A-Za-z0-9 _.'"{}()-]{1,140}/)||[])[0]||null;out.failureCategory=/Permission denied/.test(error.message)?'ssh-authentication':/ssh timed out/.test(error.message)?'ssh-timeout':/Expected three live application services/.test(error.message)?'service-count':/Private dependency port invariant failed/.test(error.message)?'dependency-ports':/Product binding differs from runtime contract/.test(error.message)?'product-binding':/Database persistent storage mismatch/.test(error.message)?'database-storage':/Service availability mismatch/.test(error.message)?'service-state':/Dependency health mismatch/.test(error.message)?'dependency-health':/Database volume missing/.test(error.message)?'database-volume':/Unexpected token|JSON/.test(error.message)?'response-format':/docker|Cannot connect/.test(error.message)?'docker-inspection':'other';out.error=/^(Google HTTP \d+|Operation did not complete|Google operation failed|Probe requires already RUNNING compute|Registered key unavailable|Private redirect unavailable)$/.test(error.message)?error.message:'Runtime inspection failed; inspect sanitized status before retrying';process.exitCode=1;}
finally{
 if(attempted&&key){try{await operation(await api(base+':removePublicKey',{key}));const final=await api(base);out.finalState=final.state;out.keyRemoved=!final.publicKeys?.includes(key);out.existingKeysPreserved=beforeKeys.every(k=>final.publicKeys?.includes(k));out.finalPublicKeyCount=(final.publicKeys??[]).length;if(!out.keyRemoved||!out.existingKeysPreserved)throw new Error('Key cleanup unconfirmed');}catch{out.cleanupFailed=true;process.exitCode=1;}}
 if(root){await rm(root,{recursive:true,force:true});out.localKeyRemoved=true;}
 out.finishedAt=new Date().toISOString();console.log(JSON.stringify(out,null,2));
}
