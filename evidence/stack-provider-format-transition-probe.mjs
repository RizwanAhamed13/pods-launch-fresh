import assert from 'node:assert/strict';
import {providers} from '../src/providers.mjs';
const repo='example/pods-runtime',name='pods-isolated-transition-check',results=[];
for(const [savedDisplayName,containerRuntime] of [['PODS launch containers',false],['PODS launch',true]]){
 const calls=[];
 const adapter=providers({repo,origin:'https://pods.example',runnerSha:'a'.repeat(64),api:async(path)=>{calls.push({kind:'api-read',path});assert.equal(path,'/user/codespaces/'+name);return {name,state:'Available',display_name:savedDisplayName,repository:{full_name:repo}};},preparePreview:async()=>{calls.push({kind:'preview'});throw new Error('Unexpected preview mutation');},exec:async()=>{calls.push({kind:'exec'});throw new Error('Unexpected compute mutation');}}).github;
 let failure;
 try{await adapter.launch('isolated-fake-token',{preferredEnvironment:name,containerRuntime},async()=>{});}catch(e){failure=e.message;}
 assert.match(failure,/saved Codespace no longer matches this PODS runtime/);
 assert.deepEqual(calls,[{kind:'api-read',path:'/user/codespaces/'+name}]);
 results.push({savedDisplayName,requestedRuntime:containerRuntime?'container':'node-bundle',failure,computeMutation:false});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Real provider adapter with mocked API only; no native environment or credentials used.',formatTransitionSupported:false,safeRejectionReproduced:true,results},null,2));
