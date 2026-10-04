import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeRedisRuntime,redisRuntimeProbeCommand} from '../scripts/probe-redis-runtime.mjs';
const key='repo-redis-fixture',port=24567;
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24),ids=['a'.repeat(12),'b'.repeat(12)];
const containers=[
  {service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[],running:true},
  {service:'db',networkMode:project+'_default',ports:{'6379/tcp':null},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_records-disk-v1'}],running:true,health:'healthy'}
];
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/records/data`}};
const info='# Server\r\nredis_version:7.4.9\r\nredis_build_id:1234abcdef\r\nredis_mode:standalone\r\n# Persistence\r\nloading:0\r\naof_enabled:1\r\naof_last_write_status:ok\r\n';
function executor({server=info,value='4',directory='dir\n/data',runtime=containers}={},calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return args.includes('label=com.docker.compose.service=db')?ids[1]:ids.join('\n');
  if(args[0]==='inspect')return runtime.map(c=>JSON.stringify(c)).join('\n');
  if(args[0]==='volume')return JSON.stringify(volume);
  assert.deepEqual(args.slice(0,4),['exec',ids[1],'redis-cli','--raw']);
  if(args[4]==='INFO'){assert.deepEqual(args.slice(4),['INFO','server','persistence']);return server;}
  if(args[4]==='CONFIG'){assert.deepEqual(args.slice(4),['CONFIG','GET','dir']);return directory;}
  assert.deepEqual(args.slice(4),['GET','counter']);return value;
};}
test('Redis probe verifies the product record, append-only persistence and private durable runtime',async()=>{
  const calls=[],result=await probeRedisRuntime(key,{port,expectedCount:4},executor({},calls));
  assert.equal(result.databaseEngine,'Redis');assert.equal(result.savedCount,4);assert.equal(result.version,'7.4.9');assert.equal(result.appendOnly,true);
  assert.deepEqual(result.productHostPorts,[port]);assert.deepEqual(result.databaseHostPorts,[]);assert.equal(result.durableWorkspaceVolume,true);
  assert.equal(calls.filter(a=>a[0]==='exec').length,3);assert.doesNotMatch(JSON.stringify(result),/\/workspaces\/|redis:\/\//);
});
test('Redis probe rejects missing or unsafe persistence and incorrect engine or saved record',async()=>{
  for(const server of [info.replace('7.4.9','8.0.0'),info+'valkey_version:8.0.0\n',info.replace('standalone','cluster'),info.replace('1234abcdef','unknown'),info.replace('aof_enabled:1','aof_enabled:0'),info.replace('write_status:ok','write_status:err'),info.replace('loading:0','loading:1'),info+'redis_version:7.4.9\n','malformed']){
    await assert.rejects(probeRedisRuntime(key,{port,expectedCount:4},executor({server})),/Redis/);
  }
  for(const value of ['','5','04','4junk','-1','9007199254740992'])await assert.rejects(probeRedisRuntime(key,{port,expectedCount:4},executor({value})),/Redis record/);
  await assert.rejects(probeRedisRuntime(key,{port,expectedCount:4},executor({directory:'dir\n/tmp'})),/persistence directory/);
  await assert.rejects(probeRedisRuntime(key,{port,expectedCount:-1},async()=>assert.fail('Invalid count must not execute')),/Expected counter/);
});
test('Redis probe rejects a wrong volume mount or exposed database',async()=>{
  const wrong=structuredClone(containers);wrong[1].mounts[0].Destination='/data/db';
  await assert.rejects(probeRedisRuntime(key,{port,expectedCount:4},executor({runtime:wrong})),/persistent application volume/);
  const exposed=structuredClone(containers);exposed[1].ports['6379/tcp']=[{HostPort:'6379'}];
  await assert.rejects(probeRedisRuntime(key,{port,expectedCount:4},executor({runtime:exposed})),/published/);
});
test('serialized Redis probe executes read-only checks without module state in a fresh process',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-redis-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const fake=join(root,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const command=args[2];process.stdout.write(command==='ps'?(args.includes('label=com.docker.compose.service=db')?${JSON.stringify(ids[1])}:${JSON.stringify(ids.join('\n'))}):command==='inspect'?${JSON.stringify(containers.map(c=>JSON.stringify(c)).join('\n'))}:command==='volume'?${JSON.stringify(JSON.stringify(volume))}:args[6]==='INFO'?${JSON.stringify(info)}:args[6]==='CONFIG'?'dir\\n/data':args[6]==='GET'?'4':process.exit(3));\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',redisRuntimeProbeCommand(key,{port,expectedCount:4})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'Redis');
});
