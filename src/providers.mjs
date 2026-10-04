import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { command, request, shell, sleep } from './util.mjs';
import { ensureCodespacePreview } from './codespace-preview.mjs';
const github = (path, token, options) => request(`https://api.github.com${path}`, token, {...options,headers:{'X-GitHub-Api-Version':'2026-03-10'}});
const transient = error => [500,502,503,504].includes(error.status) || error.name==='TimeoutError' || ['ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET'].includes(error.cause?.code);
// A saved environment can serve either artifact format, but its label alone
// cannot prove that an older environment has the required runtime tools.
export function codespaceRuntimeProbe() {
  return `set -eu
PODS_NODE=''
for candidate in $(command -v node || true) /usr/local/nvm/versions/node/*/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do
  if [ -x "$candidate" ] && "$candidate" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' 2>/dev/null; then PODS_NODE="$candidate"; break; fi
done
[ -n "$PODS_NODE" ]
[ "$("$PODS_NODE" -p 'process.platform+"/"+process.arch')" = 'linux/x64' ]
case "$(env -i PATH="$PATH" HOME="$HOME" docker --host unix:///var/run/docker.sock info --format '{{.OSType}}/{{.Architecture}}')" in linux/x86_64|linux/amd64) ;; *) exit 1 ;; esac
env -i PATH="$PATH" HOME="$HOME" docker --host unix:///var/run/docker.sock compose version >/dev/null
printf 'PODS_RUNTIME_COMPATIBLE\\n'
`;
}
export function bootstrap(config, origin, runnerSha) {
  // Token goes through encrypted SSH stdin, never command-line arguments.
  return `set -eu\numask 077\nTASK_DIR=$(mktemp -d /tmp/pods-launch.XXXXXX)\ncd "$TASK_DIR"\ncurl --fail --silent --show-error --max-time 30 ${shell(origin + '/runner.mjs')} -o runner.mjs\nprintf '%s  runner.mjs\\n' ${shell(runnerSha)} | sha256sum -c - >/dev/null\ncat > launch.json <<'PODS_CONFIG'\n${JSON.stringify(config)}\nPODS_CONFIG\nPODS_NODE=''\nfor candidate in $(command -v node || true) /usr/local/nvm/versions/node/*/bin/node \"$HOME\"/.nvm/versions/node/*/bin/node; do\n  if [ -x \"$candidate\" ] && \"$candidate\" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' 2>/dev/null; then PODS_NODE=\"$candidate\"; break; fi\ndone\n[ -n \"$PODS_NODE\" ] || { echo 'Node.js 22 or newer was not found in PATH or NVM'; exit 1; }\nnohup \"$PODS_NODE\" runner.mjs launch.json > runner.log 2>&1 < /dev/null &\necho PODS_DELIVERED\n`;
}
export function providers({ repo, origin, runnerSha, api = github, cloudRequest = request, exec = command, preparePreview = ensureCodespacePreview, pollMs = 2000, provisionMs = 240000 }) {
  async function readGithub(path, token, deadline=Infinity) {
    for(let attempt=0;;attempt++){
      try{return await api(path,token);}
      catch(error){
        const delay=pollMs*2**attempt;
        if(!transient(error)||attempt>=2||Date.now()+delay>=deadline)throw error;
        await sleep(delay);
      }
    }
  }
  async function readCloud(url, token, deadline=Infinity) {
    for(let attempt=0;;attempt++){
      try{return await cloudRequest(url,token);}
      catch(error){
        const delay=pollMs*2**attempt;
        if(!transient(error)||attempt>=2||Date.now()+delay>=deadline)throw error;
        await sleep(delay);
      }
    }
  }
  return {
    github: {
      async validate(token) { const u = await api('/user', token); if(!u.id||!u.login)throw new Error('GitHub account identity was unavailable. Reconnect your account.');return {id:String(u.id),name:u.login}; },
      async launch(token, config, update) {
        const displayName = config.containerRuntime ? 'PODS launch containers' : 'PODS launch';
        let env, runtimeChanged = false;
        if (config.preferredEnvironment) {
          if (!/^[a-z0-9-]+$/.test(config.preferredEnvironment)) throw new Error('Invalid saved Codespace name.');
          try { env = await readGithub(`/user/codespaces/${config.preferredEnvironment}`, token); }
          catch (e) { if(e.status===404)throw new Error('Your saved Codespace is no longer accessible. Restore access to it to use the existing application data.');throw e; }
          if (env.name !== config.preferredEnvironment || env.repository?.full_name?.toLowerCase() !== repo.toLowerCase() || !['PODS launch','PODS launch containers'].includes(env.display_name)) throw new Error('Your saved Codespace no longer matches this PODS runtime. Restore its configuration before relaunching.');
          runtimeChanged = env.display_name !== displayName;
          if (['Failed','Deleted','Unavailable'].includes(env.state)) throw new Error(`Your saved Codespace is ${env.state}. Recover it in GitHub Codespaces before relaunching.`);
        } else {
          const found = await readGithub(`/repos/${repo}/codespaces?per_page=100`, token);
          const eligible = found.codespaces.filter(c => c.display_name === displayName);
          env = ['Available','Shutdown','Starting','Provisioning','Created','Queued','Awaiting','Updating','Rebuilding','ShuttingDown'].map(state => eligible.find(c => c.state === state)).find(Boolean);
        }
        const deadline = Date.now() + provisionMs;
        const compute = {initialState:env?.state??null,observedAt:Date.now()};
        if (!env) { compute.creationRequestedAt=Date.now(); await update({status:'provisioning',compute:{...compute}}); env = await api(`/repos/${repo}/codespaces`, token, {method:'POST',body:{ref:'main',display_name:displayName,idle_timeout_minutes:15,retention_period_minutes:1440}}); }
        let resumeRequested = false;
        await update({environment:env.name,compute:{...compute}});
        while (env.state !== 'Available') {
          if (Date.now() >= deadline) throw new Error('Codespace did not become available within the provisioning deadline. Retry from GitHub Codespaces.');
          if (['Failed','Deleted','Unavailable'].includes(env.state)) throw new Error(`Codespace is ${env.state}`);
          if (env.state === 'Shutdown' && !resumeRequested) {
            compute.resumeRequestedAt=Date.now();
            await update({status:'provisioning',compute:{...compute}});
            resumeRequested = true;
            try { env = await api(`/user/codespaces/${env.name}/start`, token, {method:'POST'}); }
            catch(error) {
              if(!transient(error))throw error;
              // A lost response may follow an accepted resume; observe this exact
              // environment without repeating the mutation or replacing its data.
            }
            if (env.state === 'Available') break;
          }
          await sleep(pollMs); env = await readGithub(`/user/codespaces/${env.name}`, token,deadline);
        }
        const port=config.port??8080;
        const previewUrl = `https://${env.name}-${port}.${env.runtime_constraints?.forwarded_ports_domain || 'app.github.dev'}`;
        await update({status:'delivering',providerReadyAt:Date.now(),previewUrl});
        // gh establishes authenticated SSH over GitHub's tunnel; no public inbound SSH needed.
        const envVars = { ...process.env, GH_TOKEN: token, GH_PROMPT_DISABLED: '1' };
        if (runtimeChanged) {
          let compatible = false;
          try { compatible = (await exec('gh',['codespace','ssh','-c',env.name,'--','-T','bash -s'],{env:envVars,input:codespaceRuntimeProbe(),timeout:60000})).trim() === 'PODS_RUNTIME_COMPATIBLE'; }
          catch (error) { if(error.code==='ENOENT')throw new Error('GitHub CLI is unavailable on the PODS server. Restore gh in the server PATH.'); }
          if (!compatible) throw new Error('Your saved Codespace cannot change application runtime yet. It needs Node.js 22 or newer, a Linux x64 Docker daemon and Docker Compose. Existing application data was preserved; restore these capabilities in the same Codespace and retry.');
        }
        // Finish private forwarding before the runner can announce readiness.
        await preparePreview({name:env.name,port,env:envVars,exec});
        let last;
        for (let n=0;n<3;n++) {
          try { await exec('gh', ['codespace','ssh','-c',env.name,'--','-T','bash -s'], {env:envVars,input:bootstrap({...config,previewUrl},origin,runnerSha),timeout:60000}); last=null; break; }
          catch(e) {
            if(e.code==='ENOENT')throw new Error('GitHub CLI is unavailable on the PODS server. Restore gh in the server PATH.');
            last=e; await sleep(pollMs);
          }
        }
        if (last) throw new Error('Could not reach the Codespace over SSH. Check that its image includes an SSH server and retry.');
        return {environment:env.name,previewUrl};
      },
      async stop(token, name) { if (name) await api(`/user/codespaces/${encodeURIComponent(name)}/stop`, token, {method:'POST'}); }
    },
    google: {
      async validate(token) {
        await cloudRequest('https://cloudshell.googleapis.com/v1/users/me/environments/default', token);
        const user = await cloudRequest('https://openidconnect.googleapis.com/v1/userinfo', token);
        if(typeof user.sub!=='string'||!user.sub)throw new Error('Google account identity was unavailable. Reconnect with OpenID and email access.');
        return {id:user.sub,name:user.email||'Google account'};
      },
      async launch(token, config, update) {
        const directory = await mkdtemp(join(tmpdir(), 'pods-key-'));
        const base = 'https://cloudshell.googleapis.com/v1/users/me/environments/default';
        let publicKey;
        try {
          const initial = await readCloud(base,token);
          const compute = {initialState:initial.state??null,observedAt:Date.now()};
          await exec('ssh-keygen', ['-q','-t','rsa','-b','3072','-N','','-f',join(directory,'key')]);
          publicKey = (await readFile(join(directory,'key.pub'),'utf8')).trim().split(' ').slice(0,2).join(' ');
          const deadline=Date.now()+provisionMs;
          const withinDeadline=()=>{
            if(Date.now()>=deadline)throw new Error('Cloud Shell did not confirm startup within the provisioning deadline. No additional request was sent.');
          };
          const waitForPoll=async()=>{
            if(Date.now()+pollMs>=deadline)throw new Error('Cloud Shell did not confirm startup within the provisioning deadline. No additional request was sent.');
            await sleep(pollMs);
          };
          const hasKey=env=>Array.isArray(env.publicKeys)&&env.publicKeys.includes(publicKey);
          async function activate(method,body,field) {
            withinDeadline();
            compute[`${field}RequestedAt`]=Date.now();
            await update({status:'provisioning',compute:{...compute}});
            let op, env, uncertain=false;
            try {
              op=await cloudRequest(base+':'+method,token,{method:'POST',body});
              compute[`${field}AcceptedAt`]=Date.now();
            } catch(error) {
              if(!transient(error))throw error;
              uncertain=true;compute[`${field}UncertainAt`]=Date.now();
            }
            await update({compute:{...compute}});
            withinDeadline();
            if(!uncertain) {
              let result=op;
              if(!result||typeof result!=='object')throw new Error('Cloud Shell did not return a valid startup operation');
              while(!result.done){
                if(typeof op.name!=='string'||!op.name.startsWith('operations/'))throw new Error('Cloud Shell did not return a valid startup operation');
                await waitForPoll();
                result=await readCloud(`https://cloudshell.googleapis.com/v1/${op.name}`,token,deadline);
                withinDeadline();
              }
              if(result.error)throw new Error(result.error.message);
            } else await waitForPoll();
            env=await readCloud(base,token,deadline);
            withinDeadline();
            // Even an acknowledged registration must expose this attempt's key.
            // Lost responses are observed without repeating their mutation.
            while(!hasKey(env)||(method==='start'&&env.state!=='RUNNING')){
              await waitForPoll();env=await readCloud(base,token,deadline);withinDeadline();
            }
            if(uncertain){compute[`${field}ReconciledAt`]=Date.now();await update({compute:{...compute}});}
            return env;
          }
          let env;
          if(initial.state==='RUNNING'){
            env=await activate('addPublicKey',{key:publicKey},'keyRegistration');
            // Registration can race suspension. Resume only this environment;
            // its key is already confirmed, so do not register it a second time.
            if(['SUSPENDED','PENDING'].includes(env.state))env=await activate('start',{},'start');
          } else env=await activate('start',{publicKeys:[publicKey]},'start');
          withinDeadline();
          if(env.state!=='RUNNING')throw new Error('Cloud Shell did not confirm a running environment');
          if (!env.sshHost || !env.sshUsername || !Number.isInteger(env.sshPort) || !env.webHost) throw new Error('Cloud Shell did not return connection details');
          if (!/^[a-zA-Z0-9.:-]+$/.test(env.sshHost) || !/^[a-zA-Z0-9_-]+$/.test(env.sshUsername) || !/^[a-zA-Z0-9.-]+$/.test(env.webHost)) throw new Error('Invalid Cloud Shell connection details');
          const previewUrl=`https://${config.port??8080}-${env.webHost}`;
          await update({status:'delivering',providerReadyAt:Date.now(),environment:'default',previewUrl});
          await exec('ssh',['-i',join(directory,'key'),'-p',String(env.sshPort),'-o','BatchMode=yes','-o','ConnectTimeout=20','-o','StrictHostKeyChecking=accept-new','-o',`UserKnownHostsFile=${join(directory,'known_hosts')}`,`${env.sshUsername}@${env.sshHost}`,'bash -s'],{input:bootstrap({...config,previewUrl},origin,runnerSha),timeout:60000});
          return {environment:'default',previewUrl};
        } finally {
          if(publicKey) await cloudRequest(base+':removePublicKey',token,{method:'POST',body:{key:publicKey}}).catch(()=>{});
          await rm(directory,{recursive:true,force:true});
        }
      },
      async stop() { /* Cloud Shell API has no stop operation. Runner stops its app. */ }
    }
  };
}
