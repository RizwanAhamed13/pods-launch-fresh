import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeMariadbRuntime,mariadbRuntimeProbeCommand} from '../scripts/probe-mariadb-runtime.mjs';
const key='repo-mariadb-fixture',port=23456;
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const ids=['a'.repeat(12),'b'.repeat(12)];
const containers=[
  {service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[],running:true},
  {service:'db',networkMode:project+'_default',ports:{'3306/tcp':null},mounts:[{Destination:'/var/lib/mysql',Type:'volume',RW:true,Name:project+'_records-disk-v1'}],running:true,health:'healthy'}
];
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/records/data`}};
const sql='11.4.8-MariaDB-ubu2404\tmariadb.org binary distribution\n4';
function executor(reply=sql,calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return args.includes('label=com.docker.compose.service=db')?ids[1]:ids.join('\n');
  if(args[0]==='inspect')return containers.map(c=>JSON.stringify(c)).join('\n');
  if(args[0]==='volume')return JSON.stringify(volume);
  assert.deepEqual(args.slice(0,5),['exec',ids[1],'sh','-eu','-c']);return reply;
};}
test('MariaDB probe verifies the real database record and private durable runtime on an assigned port',async()=>{
  const calls=[],result=await probeMariadbRuntime(key,{port,expectedCount:4},executor(sql,calls));
  assert.equal(result.databaseEngine,'MariaDB');assert.equal(result.savedCount,4);
  assert.equal(result.version,'11.4.8-MariaDB-ubu2404');assert.deepEqual(result.productHostPorts,[port]);
  assert.deepEqual(result.databaseHostPorts,[]);assert.equal(result.durableWorkspaceVolume,true);
  const query=calls.find(a=>a[0]==='exec').at(-1);assert.match(query,/SELECT @@version/);assert.match(query,/SELECT value FROM counter WHERE id=1/);
  assert.doesNotMatch(query,/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP)\b/);
  assert.doesNotMatch(JSON.stringify(result),/MYSQL_PASSWORD|\/workspaces\/|preview-fixture-only/);
});
test('MariaDB evidence rejects a different engine, wrong saved record and malformed output',async()=>{
  for(const reply of ['8.4.6\tMySQL Community Server - GPL\n4',sql.replace('\n4','\n5'),sql+'\n5','11.4.8-MariaDB\t\n4','11.4.8-MariaDB\tmariadb.org\nnot-a-count']){
    await assert.rejects(probeMariadbRuntime(key,{port,expectedCount:4},executor(reply)),/MariaDB/);
  }
  await assert.rejects(probeMariadbRuntime(key,{port,expectedCount:-1},async()=>assert.fail('Invalid count must not execute')),/Expected counter/);
});
test('serialized MariaDB probe runs without module closure state in a fresh Node process',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-mariadb-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const fake=join(root,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const command=args[2];process.stdout.write(command==='ps'?(args.includes('label=com.docker.compose.service=db')?${JSON.stringify(ids[1])}:${JSON.stringify(ids.join('\n'))}):command==='inspect'?${JSON.stringify(containers.map(c=>JSON.stringify(c)).join('\n'))}:command==='volume'?${JSON.stringify(JSON.stringify(volume))}:${JSON.stringify(sql)});\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',mariadbRuntimeProbeCommand(key,{port,expectedCount:4})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'MariaDB');
});
