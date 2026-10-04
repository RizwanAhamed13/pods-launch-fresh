// Read-only check of explicitly named, already available PODS Codespaces.
// Usage: node evidence/stack-codespaces-runtime-capabilities-probe.mjs NAME...
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {codespaceRuntimeProbe} from '../src/providers.mjs';
import {command} from '../src/util.mjs';
const names=process.argv.slice(2),results=[];
assert.ok(names.length>0 && names.every(name=>/^[a-z0-9-]+$/.test(name)));
const script=codespaceRuntimeProbe();
for(const name of names){
 const saved=JSON.parse(await command('gh',['api','/user/codespaces/'+name]));
 assert.equal(saved.name,name);assert.equal(saved.state,'Available');
 assert.equal(saved.repository.full_name.toLowerCase(),'rizwanahamed13/pods-launch-runtime-fresh');
 assert.ok(['PODS launch','PODS launch containers'].includes(saved.display_name));
 const output=await command('gh',['codespace','ssh','-c',name,'--','-T','bash -s'],{input:script,timeout:60000});
 assert.equal(output.trim(),'PODS_RUNTIME_COMPATIBLE');
 results.push({environment:name,displayName:saved.display_name,initialState:saved.state,compatible:true});
}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Read-only capability probe on existing available user Codespaces. No runner dispatched, environment replaced, application data copied or native format transition claimed.',providerSourceSha256:createHash('sha256').update(await readFile(new URL('../src/providers.mjs',import.meta.url))).digest('hex'),probeSha256:createHash('sha256').update(script).digest('hex'),requirements:['Node.js >=22','Linux x64 Node process','Accessible local Linux x64 Docker daemon','Docker Compose available'],results,passed:true},null,2));
