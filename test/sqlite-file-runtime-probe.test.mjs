import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,cp,rm,readFile,writeFile,chmod,lstat,readdir,symlink} from 'node:fs/promises';
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
  const source=await mkdtemp(join(tmpdir(),'pods-sqlite-wal-fixture-')),db=new DatabaseSync(join(source,'counter.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE counter(id INTEGER PRIMARY KEY, value INTEGER); INSERT INTO counter VALUES(1,4)');
  t.after(async()=>{db.close();await rm(source,{recursive:true,force:true});});
  const context={source,db,calls:[],web:{service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true,paused:false,path:commands[fixture][0],args:commands[fixture][1]},volume:{driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/app-data/data`}},ids:id};
  context.execute=async args=>{
    context.calls.push(args);
    if(args[0]==='ps')return context.ids;
    if(args[0]==='inspect')return JSON.stringify(context.web);
    if(args[0]==='volume')return JSON.stringify(context.volume);
    if(args[0]==='pause'){if(context.pauseError)throw new Error('pause response lost');return '';}
    if(args[0]==='unpause'){if(context.resumeError)throw new Error('resume failed');return '';}
    assert.equal(args[0],'cp');assert.equal(args[1],id+':/data/.');context.snapshot=args[2];
    if(context.copyError)throw new Error('copy failed');
    await cp(source,context.snapshot,{recursive:true});
    if(context.omitWal)await rm(join(context.snapshot,'counter.sqlite-wal'));
    if(context.alter)await context.alter(context.snapshot);
    return '';
  };
  return context;
}
test('all four SQLite framework profiles inspect committed WAL data and resume before querying',async t=>{
  for(const fixture of Object.keys(commands)){
    const c=await setup(t,fixture),result=await probeSqliteFileRuntime(key,{port,expectedCount,fixture},c.execute);
    assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.databaseEngine,'SQLite');assert.equal(result.integrity,'ok');
    assert.ok(result.snapshotFiles.includes('counter.sqlite-wal'));assert.equal(result.applicationResumed,true);
    assert.deepEqual(c.calls.slice(-3).map(x=>x[0]),['pause','cp','unpause']);assert.deepEqual(result.databaseHostPorts,[]);assert.deepEqual(result.productHostPorts,[port]);
    assert.doesNotMatch(JSON.stringify(result),/\/data\/|\/workspaces\/|\/tmp\//);
    await assert.rejects(lstat(c.snapshot),{code:'ENOENT'});assert.equal(c.db.prepare('SELECT value FROM counter').get().value,4);
  }
});
test('SQLite snapshot cannot omit its WAL or accept stale, corrupt, extra or linked files',async t=>{
  for(const kind of ['wal','value','corrupt','extra','symlink']){
    const c=await setup(t);
    if(kind==='wal')c.omitWal=true;
    if(kind==='value')c.db.exec('UPDATE counter SET value=5');
    if(kind==='corrupt')c.alter=async dir=>{await writeFile(join(dir,'counter.sqlite'),'not a database');await rm(join(dir,'counter.sqlite-wal'));await rm(join(dir,'counter.sqlite-shm'));};
    if(kind==='extra')c.alter=dir=>writeFile(join(dir,'unrelated'),'not a fixture database');
    if(kind==='symlink')c.alter=async dir=>{await rm(join(dir,'counter.sqlite'));await symlink(join(c.source,'counter.sqlite'),join(dir,'counter.sqlite'));};
    await assert.rejects(probeSqliteFileRuntime(key,{port,expectedCount,fixture:'phoenix'},c.execute),undefined,kind);
    assert.equal(c.calls.at(-1)[0],'unpause');await assert.rejects(lstat(c.snapshot),{code:'ENOENT'});
  }
});
test('SQLite snapshot attempts resume on failed pause/copy and fails closed on failed resume',async t=>{
  for(const fault of ['pauseError','copyError','resumeError']){
    const c=await setup(t);c[fault]=true;
    await assert.rejects(probeSqliteFileRuntime(key,{port,expectedCount,fixture:'phoenix'},c.execute),/lost|failed/);
    assert.equal(c.calls.at(-1)[0],'unpause');if(c.snapshot)await assert.rejects(lstat(c.snapshot),{code:'ENOENT'});
  }
});
test('SQLite snapshot rejects wrong service, runtime, network, exposure or persistent storage before pausing',async t=>{
  const mutations=[c=>c.ids+='\n'+'b'.repeat(12),c=>c.web.paused=true,c=>c.web.path='/wrong',c=>c.web.networkMode='host',c=>c.web.ports['9000/tcp']=[{HostPort:'9000'}],c=>c.web.mounts[0].Name='other',c=>c.volume.options.device='/tmp/ephemeral'];
  for(const mutate of mutations){const c=await setup(t);mutate(c);await assert.rejects(probeSqliteFileRuntime(key,{port,expectedCount,fixture:'phoenix'},c.execute));assert.ok(!c.calls.some(a=>a[0]==='pause'));}
  for(const options of [{port:80,expectedCount,fixture:'phoenix'},{port,expectedCount:-1,fixture:'phoenix'},{port,expectedCount,fixture:'unknown'}])await assert.rejects(probeSqliteFileRuntime(key,options,async()=>assert.fail('invalid input executed')));
  await assert.rejects(probeSqliteFileRuntime('../bad',{port,expectedCount,fixture:'phoenix'},async()=>assert.fail('invalid identity executed')));
});
test('serialized SQLite snapshot probe runs in a fresh process with real WAL data',async t=>{
  const c=await setup(t),bin=await mkdtemp(join(tmpdir(),'pods-sqlite-fake-docker-'));t.after(()=>rm(bin,{recursive:true,force:true}));
  const fake=join(bin,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst fs=require('node:fs');const args=process.argv.slice(2);if(args[0]!=='--host'||args[1]!=='unix:///var/run/docker.sock')process.exit(2);const a=args.slice(2);const reply=a[0]==='ps'?${JSON.stringify(id)}:a[0]==='inspect'?${JSON.stringify(JSON.stringify(c.web))}:a[0]==='volume'?${JSON.stringify(JSON.stringify(c.volume))}:'';if(a[0]==='cp'){fs.cpSync(${JSON.stringify(c.source)},a[2],{recursive:true});fs.writeFileSync(${JSON.stringify(join(bin,'snapshot'))},a[2]);}else if(!['ps','inspect','volume','pause','unpause'].includes(a[0]))process.exit(3);process.stdout.write(reply);\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',sqliteFileRuntimeProbeCommand(key,{port,expectedCount,fixture:'phoenix'})],{env:{...process.env,PATH:bin+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.savedCount,4);assert.equal(result.passed,true);assert.ok(result.snapshotFiles.includes('counter.sqlite-wal'));
  await assert.rejects(lstat(await readFile(join(bin,'snapshot'),'utf8')),{code:'ENOENT'});
  assert.equal(c.db.prepare('SELECT value FROM counter').get().value,4);assert.deepEqual((await readdir(c.source)).sort(),['counter.sqlite','counter.sqlite-shm','counter.sqlite-wal']);
});
