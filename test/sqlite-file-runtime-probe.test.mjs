import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,rm,readFile,writeFile,chmod,readdir,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeSqliteFileRuntime,sqliteFileRuntimeProbeCommand} from '../scripts/probe-sqlite-file-runtime.mjs';
const key='repo-sqlite-file-fixture',port=24567,id='a'.repeat(12),expectedCount=4;
const project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const commands={ktor:['/__cacert_entrypoint.sh',['sh','-c','if [ -f /product/quarkus-run.jar ]; then exec java -jar /product/quarkus-run.jar; else exec java -jar /product/app.jar; fi']],micronaut:['/__cacert_entrypoint.sh',['sh','-c','if [ -f /product/quarkus-run.jar ]; then exec java -jar /product/quarkus-run.jar; else exec java -jar /product/app.jar; fi']],phoenix:['/product/bin/pods_phoenix',['start']],symfony:['docker-php-entrypoint',['php','-S','0.0.0.0:8080','-t','public']]};
async function setup(t,fixture='phoenix'){
  const workspace=await realpath(await mkdtemp(join(tmpdir(),'pods-sqlite-wal-fixture-')));
  const source=join(workspace,'.pods-launch','volumes',project,'app-data','data');await mkdir(source,{recursive:true});
  const db=new DatabaseSync(join(source,'counter.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE counter(id INTEGER PRIMARY KEY, value INTEGER); INSERT INTO counter VALUES(1,4)');
  t.after(async()=>{if(db.isOpen)db.close();await rm(workspace,{recursive:true,force:true});});
  const context={workspace,source,db,calls:[],web:{service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true,paused:false,path:commands[fixture][0],args:commands[fixture][1]},volume:{driver:'local',options:{type:'none',o:'bind',device:source}},ids:id};
  context.options={port,expectedCount,fixture,workspace};let inspected=0;
  context.execute=async args=>{
    context.calls.push(args);
    if(args[0]==='ps')return context.ids;
    if(args[0]==='inspect'){inspected++;return JSON.stringify(inspected>1&&context.after?context.after:context.web);}
    if(args[0]==='volume')return JSON.stringify(context.volume);
    assert.fail('Inspection must not mutate container state: '+args[0]);
  };
  return context;
}
test('all four SQLite profiles inspect committed WAL through online backup without pausing or writing the source',async t=>{
  for(const fixture of Object.keys(commands)){
    const c=await setup(t,fixture),before=await readFile(join(c.source,'counter.sqlite-wal'));
    const result=await probeSqliteFileRuntime(key,c.options,c.execute);
    assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'SQLite');assert.equal(result.integrity,'ok');
    assert.ok(result.sourceFiles.includes('counter.sqlite-wal'));assert.ok(result.snapshotFiles.includes('counter.sqlite'));
    assert.ok(result.snapshotFiles.every(f=>['counter.sqlite','counter.sqlite-wal','counter.sqlite-shm'].includes(f)));
    assert.equal(result.applicationPaused,false);assert.equal(result.applicationStayedRunning,true);
    assert.deepEqual(c.calls.map(x=>x[0]),['ps','inspect','volume','inspect']);assert.deepEqual(result.databaseHostPorts,[]);assert.deepEqual(result.productHostPorts,[port]);
    assert.doesNotMatch(JSON.stringify(result),/\/data\/|\/workspaces\/|\/tmp\//);
    assert.deepEqual(await readFile(join(c.source,'counter.sqlite-wal')),before);assert.equal(c.db.prepare('SELECT value FROM counter').get().value,4);
  }
});
test('online SQLite inspection rejects stale, corrupt, extra and symlinked source files',async t=>{
  for(const kind of ['value','corrupt','extra','symlink']){
    const c=await setup(t);
    if(kind==='value')c.db.exec('UPDATE counter SET value=5');
    if(kind==='corrupt'){c.db.close();await writeFile(join(c.source,'counter.sqlite'),'not a database');}
    if(kind==='extra')await writeFile(join(c.source,'unrelated'),'not a fixture database');
    if(kind==='symlink'){c.db.close();await rm(join(c.source,'counter.sqlite'));await symlink(join(c.workspace,'missing'),join(c.source,'counter.sqlite'));}
    await assert.rejects(probeSqliteFileRuntime(key,c.options,c.execute),undefined,kind);
    assert.ok(c.calls.every(x=>['ps','inspect','volume'].includes(x[0])));
  }
});
test('online SQLite inspection rejects a product that stopped or paused during its read',async t=>{
  for(const state of [{running:false},{paused:true}]){
    const c=await setup(t);c.after={...c.web,...state};
    await assert.rejects(probeSqliteFileRuntime(key,c.options,c.execute),/Application stopped/);
    assert.equal(c.db.prepare('SELECT value FROM counter').get().value,4);
  }
});
test('online SQLite inspection rejects wrong service, runtime, network, exposure or persistent storage before reading',async t=>{
  const mutations=[c=>c.ids+='\n'+'b'.repeat(12),c=>c.web.paused=true,c=>c.web.path='/wrong',c=>c.web.networkMode='host',c=>c.web.ports['9000/tcp']=[{HostPort:'9000'}],c=>c.web.mounts[0].Name='other',c=>c.volume.options.device='/tmp/ephemeral'];
  for(const mutate of mutations){const c=await setup(t);mutate(c);await assert.rejects(probeSqliteFileRuntime(key,c.options,c.execute));assert.ok(c.calls.length<=3);}
  for(const options of [{port:80,expectedCount,fixture:'phoenix'},{port,expectedCount:-1,fixture:'phoenix'},{port,expectedCount,fixture:'unknown'}])await assert.rejects(probeSqliteFileRuntime(key,options,async()=>assert.fail('invalid input executed')));
  await assert.rejects(probeSqliteFileRuntime('../bad',{port,expectedCount,fixture:'phoenix'},async()=>assert.fail('invalid identity executed')));
});
test('serialized online SQLite probe runs in a fresh process and performs no pause/copy/container exec',async t=>{
  const c=await setup(t),bin=await mkdtemp(join(tmpdir(),'pods-sqlite-fake-docker-'));t.after(()=>rm(bin,{recursive:true,force:true}));
  const fake=join(bin,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const a=args.slice(2);const reply=a[0]==='ps'?${JSON.stringify(id)}:a[0]==='inspect'?${JSON.stringify(JSON.stringify(c.web))}:a[0]==='volume'?${JSON.stringify(JSON.stringify(c.volume))}:null;if(reply===null)process.exit(3);process.stdout.write(reply);\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',sqliteFileRuntimeProbeCommand(key,c.options)],{env:{...process.env,PATH:bin+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.savedCount,4);assert.equal(result.passed,true);assert.ok(result.sourceFiles.includes('counter.sqlite-wal'));assert.equal(result.applicationPaused,false);
  assert.equal(c.db.prepare('SELECT value FROM counter').get().value,4);assert.deepEqual((await readdir(c.source)).sort(),['counter.sqlite','counter.sqlite-shm','counter.sqlite-wal']);
});
