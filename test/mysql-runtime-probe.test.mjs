import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeMysqlRuntime,mysqlRuntimeProbeCommand} from '../scripts/probe-mysql-runtime.mjs';

const key='repo-mysql-fixture';
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
function fixture(){
  return {
    ids:'a'.repeat(12)+'\n'+'b'.repeat(12),
    containers:[
      {service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostIp:'0.0.0.0',HostPort:'8080'}]},mounts:[],running:true,health:null},
      {service:'db',networkMode:project+'_default',ports:{'3306/tcp':null,'33060/tcp':null},mounts:[{Destination:'/var/lib/mysql',Type:'volume',RW:true,Name:project+'_records-disk-v1'}],running:true,health:'healthy'}
    ],
    volume:{driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/records/data`}}
  };
}
function executor(data,calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return data.ids;
  if(args[0]==='inspect')return data.containers.map(x=>JSON.stringify(x)).join('\n');
  if(args[0]==='volume')return JSON.stringify(data.volume);
  throw new Error('Unexpected Docker command');
};}
test('MySQL runtime evidence inspects only the selected project and redacts raw mount paths',async()=>{
  const calls=[],result=await probeMysqlRuntime(key,executor(fixture(),calls));
  assert.equal(result.passed,true);assert.deepEqual(result.databaseHostPorts,[]);assert.equal(result.durableWorkspaceVolume,true);
  assert.ok(calls[0].includes('label=com.docker.compose.project='+project));
  assert.ok(calls.filter(x=>x[0]==='inspect'||x[0]==='volume').every(x=>x.includes('--format')));
  assert.doesNotMatch(JSON.stringify(calls),/\.Env|\.Config\}\}/);assert.doesNotMatch(JSON.stringify(result),/\/workspaces\/|preview-fixture-only/);
});
test('MySQL runtime evidence rejects exposed, unhealthy and nonpersistent databases',async()=>{
  const changes=[
    d=>{d.ids+='\n'+'c'.repeat(12);},
    d=>{d.containers[1].service='unrelated';},
    d=>{d.containers[1].running=false;},
    d=>{d.containers[1].health='starting';},
    d=>{d.containers[1].networkMode='host';},
    d=>{d.containers[1].ports['3306/tcp']=[{HostIp:'0.0.0.0',HostPort:'3306'}];},
    d=>{d.containers[1].ports['33060/tcp']=[{HostIp:'127.0.0.1',HostPort:'33060'}];},
    d=>{d.containers[0].ports['9229/tcp']=[{HostPort:'9229'}];},
    d=>{d.containers[1].mounts=[];},
    d=>{d.containers[1].mounts[0].RW=false;},
    d=>{d.containers[1].mounts[0].Name='other-application';},
    d=>{d.volume.options.device='/tmp/ephemeral-data';}
  ];
  for(const change of changes){const d=fixture();change(d);await assert.rejects(probeMysqlRuntime(key,executor(d)));}
  await assert.rejects(probeMysqlRuntime('--wrong',async()=>{throw new Error('Should not execute');}),/Invalid application/);
});
test('serialized MySQL runtime probe executes in a fresh Node process',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-mysql-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const fake=join(root,'docker'),data=fixture();
  await writeFile(fake,`#!${process.execPath}\nconst data=${JSON.stringify(data)};const args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const cmd=args[2];process.stdout.write(cmd==='ps'?data.ids:cmd==='inspect'?data.containers.map(x=>JSON.stringify(x)).join('\\n'):JSON.stringify(data.volume));\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',mysqlRuntimeProbeCommand(key)],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  assert.equal(JSON.parse(stdout).passed,true);
});
