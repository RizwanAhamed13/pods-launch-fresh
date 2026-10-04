import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeSqliteRuntime,sqliteRuntimeProbeCommand} from '../scripts/probe-sqlite-runtime.mjs';
const key='repo-sqlite-fixture',port=24567,id='a'.repeat(12);
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const web={service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true};
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/app-data/data`}};
const record={version:'3.46.1',integrity:'ok',rowCount:1,savedCount:4};
function executor({container=web,storage=volume,reply=JSON.stringify(record),ids=id}={},calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return ids;
  if(args[0]==='inspect')return JSON.stringify(container);
  if(args[0]==='volume')return JSON.stringify(storage);
  assert.deepEqual(args.slice(0,4),['exec',id,'python','-c']);return reply;
};}
test('SQLite probe reads the actual saved row and verifies its isolated persistent volume',async()=>{
  const calls=[],result=await probeSqliteRuntime(key,{port,expectedCount:4},executor({},calls));
  assert.equal(result.databaseEngine,'SQLite');assert.equal(result.integrity,'ok');assert.equal(result.savedCount,4);
  assert.deepEqual(result.productHostPorts,[port]);assert.deepEqual(result.databaseHostPorts,[]);assert.equal(result.durableWorkspaceVolume,true);
  const query=calls.find(a=>a[0]==='exec').at(-1);assert.match(query,/counter\.db\?mode=ro/);assert.match(query,/PRAGMA quick_check/);
  assert.doesNotMatch(query,/\b(?:INSERT|UPDATE|DELETE|CREATE|DROP)\b/);assert.doesNotMatch(JSON.stringify(result),/\/workspaces\/|\/data\//);
});
test('SQLite probe rejects corrupt or wrong databases, missing rows and incorrect saved values',async()=>{
  for(const change of [{version:'4.0.0'},{integrity:'malformed'},{rowCount:0},{rowCount:2},{savedCount:5},{savedCount:'4'},{savedCount:null}]){
    await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({reply:JSON.stringify({...record,...change})})),/SQLite/);
  }
  await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({reply:'not-json'})));
});
test('SQLite probe rejects extra containers, wrong mounts, extra ports and unsafe identities before querying',async()=>{
  await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({ids:id+'\n'+'b'.repeat(12)})),/exactly one/);
  const wrong=structuredClone(web);wrong.mounts[0].Name='other-app-volume';
  await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({container:wrong})),/persistent application volume/);
  const exposed=structuredClone(web);exposed.ports['9000/tcp']=[{HostPort:'9000'}];
  await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({container:exposed})),/public product port/);
  const ephemeral=structuredClone(volume);ephemeral.options.device='/tmp/data';
  await assert.rejects(probeSqliteRuntime(key,{port,expectedCount:4},executor({storage:ephemeral})),/durable Codespaces/);
  for(const [dataKey,options] of [['../bad',{port,expectedCount:4}],[key,{port:80,expectedCount:4}],[key,{port,expectedCount:-1}]]){
    await assert.rejects(probeSqliteRuntime(dataKey,options,async()=>assert.fail('Invalid input must not execute')),/Invalid|Expected counter/);
  }
});
test('serialized SQLite probe opens read-only in a fresh Node process without module state',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-sqlite-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));const fake=join(root,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const command=args[2];if(command==='exec'&&!args.at(-1).includes('mode=ro'))process.exit(3);process.stdout.write(command==='ps'?${JSON.stringify(id)}:command==='inspect'?${JSON.stringify(JSON.stringify(web))}:command==='volume'?${JSON.stringify(JSON.stringify(volume))}:command==='exec'?${JSON.stringify(JSON.stringify(record))}:process.exit(4));\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',sqliteRuntimeProbeCommand(key,{port,expectedCount:4})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'SQLite');
});
