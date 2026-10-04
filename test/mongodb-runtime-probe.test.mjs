import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeMongodbRuntime,mongodbRuntimeProbeCommand} from '../scripts/probe-mongodb-runtime.mjs';
import {probeDatabaseBoundary} from '../scripts/probe-database-boundary.mjs';
const key='repo-mongodb-fixture',port=24567;
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24),ids=['a'.repeat(12),'b'.repeat(12)];
const containers=[
  {service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[],running:true},
  {service:'db',networkMode:project+'_default',ports:{'27017/tcp':null},mounts:[{Destination:'/data/db',Type:'volume',RW:true,Name:project+'_records-disk-v1'}],running:true,health:'healthy'}
];
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/records/data`}};
const record={version:'7.0.43',gitVersion:'f'.repeat(40),storageEngine:'wiredTiger',savedCount:4};
function executor(reply=JSON.stringify(record),calls=[],runtime=containers){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return args.includes('label=com.docker.compose.service=db')?ids[1]:ids.join('\n');
  if(args[0]==='inspect')return runtime.map(c=>JSON.stringify(c)).join('\n');
  if(args[0]==='volume')return JSON.stringify(volume);
  assert.deepEqual(args.slice(0,5),['exec',ids[1],'mongosh','--quiet','--eval']);return reply;
};}
test('MongoDB probe verifies its pinned build, saved document and private durable runtime',async()=>{
  const calls=[],result=await probeMongodbRuntime(key,{port,expectedCount:4},executor(JSON.stringify(record),calls));
  assert.equal(result.databaseEngine,'MongoDB');assert.equal(result.savedCount,4);assert.equal(result.storageEngine,'wiredTiger');
  assert.equal(result.version,'7.0.43');assert.deepEqual(result.productHostPorts,[port]);assert.deepEqual(result.databaseHostPorts,[]);assert.equal(result.durableWorkspaceVolume,true);
  const query=calls.find(a=>a[0]==='exec').at(-1);assert.match(query,/buildInfo:1/);assert.match(query,/findOne\(\{_id:"count"\}\)/);
  assert.doesNotMatch(query,/\b(?:insert|update|delete|drop|remove)\b/i);assert.doesNotMatch(JSON.stringify(result),/\/workspaces\/|mongodb:\/\//);
});
test('MongoDB probe rejects another version, storage engine and wrong or malformed saved document',async()=>{
  for(const change of [{version:'8.0.0'},{gitVersion:'unknown'},{storageEngine:'inMemory'},{savedCount:5},{savedCount:'4'},{savedCount:null}]){
    await assert.rejects(probeMongodbRuntime(key,{port,expectedCount:4},executor(JSON.stringify({...record,...change}))),/MongoDB/);
  }
  await assert.rejects(probeMongodbRuntime(key,{port,expectedCount:4},executor('not-json')));
  await assert.rejects(probeMongodbRuntime(key,{port,expectedCount:-1},async()=>assert.fail('Invalid count must not execute')),/Expected counter/);
});
test('MongoDB boundary rejects a MySQL mount, exposed database and unsupported mount path',async()=>{
  const wrong=structuredClone(containers);wrong[1].mounts[0].Destination='/var/lib/mysql';
  await assert.rejects(probeMongodbRuntime(key,{port,expectedCount:4},executor(JSON.stringify(record),[],wrong)),/persistent application volume/);
  const exposed=structuredClone(containers);exposed[1].ports['27017/tcp']=[{HostPort:'27017'}];
  await assert.rejects(probeMongodbRuntime(key,{port,expectedCount:4},executor(JSON.stringify(record),[],exposed)),/published/);
  await assert.rejects(probeDatabaseBoundary(key,async()=>assert.fail('Unsupported path must not execute'),{port,databasePath:'/tmp'}),/Unsupported database mount/);
});
test('serialized MongoDB probe executes without module closure state in a fresh process',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-mongodb-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const fake=join(root,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const command=args[2];process.stdout.write(command==='ps'?(args.includes('label=com.docker.compose.service=db')?${JSON.stringify(ids[1])}:${JSON.stringify(ids.join('\n'))}):command==='inspect'?${JSON.stringify(containers.map(c=>JSON.stringify(c)).join('\n'))}:command==='volume'?${JSON.stringify(JSON.stringify(volume))}:${JSON.stringify(JSON.stringify(record))});\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',mongodbRuntimeProbeCommand(key,{port,expectedCount:4})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'MongoDB');
});
