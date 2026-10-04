import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { bootstrap } from '/home/aswin/pods-launch-fresh/src/providers.mjs';
import { command } from '/home/aswin/pods-launch-fresh/src/util.mjs';

let token='';for await(const b of process.stdin)token+=b;token=token.trim();
const name='pods-launch-containers-69rw5vx4xp46c5qw5',port=26630;
const origin='https://collection-conferences-ages-clearly.trycloudflare.com';
const sha='be6b31d3791059d5833b20f2b7bdac6c7f99d78e00d4fd0c1ab3c7f0d688cc64';
const env={...process.env,PATH:'/home/aswin/pods-tools/bin:'+process.env.PATH,GH_TOKEN:token,GH_PROMPT_DISABLED:'1'};
const out={startedAt:new Date().toISOString(),order:['download','inline','inline','download'],samples:[],probeOnly:true,applicationStarted:false,productionChanged:false};
try {
 const response=await fetch(origin+'/runner.mjs',{signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200);const runner=Buffer.from(await response.arrayBuffer());
 assert.equal(createHash('sha256').update(runner).digest('hex'),sha);out.runnerSha256=sha;out.runnerBytes=runner.length;
 for(const mode of out.order){
  const stateResponse=await fetch('https://api.github.com/user/codespaces/'+name,{headers:{Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10'},signal:AbortSignal.timeout(20000)});
  assert.equal(stateResponse.status,200);const state=(await stateResponse.json()).state;assert.equal(state,'Available');
  const sample={mode,initialState:state};out.samples.push(sample);
  const previewStart=Date.now();
  const ports=JSON.parse(await command('gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],{env,timeout:60000}));
  sample.previewLookupMs=Date.now()-previewStart;
  assert.equal(ports.find(p=>p.sourcePort===port)?.visibility,'private');sample.productPortPrivate=true;
  let script=bootstrap({},origin,sha);
  const lines=script.split('\n');assert.equal(lines.filter(l=>l.startsWith('nohup ')).length,1);assert.equal(lines.filter(l=>l.startsWith('curl ')).length,1);
  if(mode==='inline')script=script.replace(lines.find(l=>l.startsWith('curl ')),`base64 --decode > runner.mjs <<'PODS_RUNNER_BYTES'\n${runner.toString('base64')}\nPODS_RUNNER_BYTES`);
  script=script.replace('cd "$TASK_DIR"\n',`trap 'rm -rf "$TASK_DIR"' EXIT\ncd "$TASK_DIR"\nPODS_PROBE_TRANSFER_START=$(date +%s%3N)\n`);
  script=script.replace("cat > launch.json <<'PODS_CONFIG'",`PODS_PROBE_TRANSFER_END=$(date +%s%3N)\ncat > launch.json <<'PODS_CONFIG'`);
  script=script.replace(/^nohup [^\n]*\n/m,'PODS_PROBE_NODE_END=$(date +%s%3N)\n');
  script=script.replace('echo PODS_DELIVERED',`printf '{"verifiedTransferMs":%s,"nodeCheckMs":%s,"runnerVerified":true,"runnerExecuted":false}\\n' "$((PODS_PROBE_TRANSFER_END-PODS_PROBE_TRANSFER_START))" "$((PODS_PROBE_NODE_END-PODS_PROBE_TRANSFER_END))"`);
  assert.ok(!script.includes('nohup '));assert.ok(!script.includes('runner.mjs launch.json'));
  sample.stdinBytes=Buffer.byteLength(script);
  const sshStart=Date.now();
  const result=await command('gh',['codespace','ssh','-c',name,'--','-T','bash -s'],{env,input:script,timeout:60000});
  sample.sshElapsedMs=Date.now()-sshStart;Object.assign(sample,JSON.parse(result));
  sample.transportAndSetupResidualMs=sample.sshElapsedMs-sample.verifiedTransferMs-sample.nodeCheckMs;
  assert.equal(sample.runnerVerified,true);assert.equal(sample.runnerExecuted,false);
  assert.ok(sample.transportAndSetupResidualMs>=0);sample.temporaryDirectoryCleanupViaTrap=true;
 }
 out.completed=true;
}catch(error){out.completed=false;out.error='Probe failed; provider and credential details withheld';out.errorClass=error.name;process.exitCode=1;}
out.finishedAt=new Date().toISOString();console.log(JSON.stringify(out,null,2));
