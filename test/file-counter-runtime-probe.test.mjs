import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod,access,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeFileCounterRuntime,fileCounterRuntimeProbeCommand} from '../scripts/probe-file-counter-runtime.mjs';
const key='repo-file-counter-fixture',port=24567,id='b'.repeat(12),project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const web={service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true,path:'/product',args:[]};
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/app-data/data`}};
const options={port,expectedCount:4,fixture:'actix'};
const recipes={actix:['/product',[]],axum:['/product',[]],rocket:['/product',[]],aspnet:['dotnet',['Counter.dll']],deno:['/product',[],'counter.txt'],php:['docker-php-entrypoint',['php','-S','0.0.0.0:8080','-t','.']],sinatra:['bundle',['exec','rackup','--host','0.0.0.0','--port','8080']]};
function executor({value='4',runtime=web,storage=volume,ids=id,copy,filename='count'}={},calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return ids;
  if(args[0]==='inspect')return JSON.stringify(runtime);
  if(args[0]==='volume')return JSON.stringify(storage);
  assert.deepEqual(args.slice(0,2),['cp',id+':/data/'+filename]);
  if(copy)await copy(args[2]);else await writeFile(args[2],value);
  return '';
};}
test('file counter inspection verifies each explicit recipe command, stored value and workspace volume without container execution',async()=>{
  for(const [fixture,[path,args,filename='count']] of Object.entries(recipes)){
    const calls=[],runtime={...web,path,args};
    const result=await probeFileCounterRuntime(key,{...options,fixture},executor({runtime,filename},calls));
    assert.equal(result.passed,true);assert.equal(result.fixtureProfile,fixture);assert.equal(result.savedCount,4);assert.equal(result.durableWorkspaceVolume,true);assert.deepEqual(result.productHostPorts,[port]);
    assert.deepEqual(result.databaseHostPorts,[]);assert.match(result.scope,/Does not independently identify the framework version/);
    assert.ok(calls.every(a=>['ps','inspect','volume','cp'].includes(a[0])));
    await assert.rejects(access(dirname(calls.find(a=>a[0]==='cp')[2])));
  }
});
test('file counter inspection rejects incorrect saved values, noncanonical records and unsafe integers',async()=>{
  for(const value of ['','5','04','4junk','-1','9007199254740992'])await assert.rejects(probeFileCounterRuntime(key,options,executor({value})),/does not match/);
});
test('file counter inspection rejects wrong commands, exposed services, host networking and nondurable storage before copying',async()=>{
  for(const runtime of [{...web,path:'/bin/sh'},{...web,args:['extra']},{...web,service:'db'},{...web,running:false},{...web,networkMode:'host'},{...web,ports:{...web.ports,'9090/tcp':[{HostPort:'9090'}]}},{...web,ports:{'8080/tcp':[{HostPort:'8081'}]}},{...web,mounts:[]}]){
    const calls=[];await assert.rejects(probeFileCounterRuntime(key,options,executor({runtime},calls)),/boundary|port|persistent/);assert.ok(calls.every(a=>a[0]!=='cp'));
  }
  await assert.rejects(probeFileCounterRuntime(key,{...options,fixture:'aspnet'},executor()),/command/);
  await assert.rejects(probeFileCounterRuntime(key,options,executor({storage:{...volume,options:{}}})),/durable/);
  for(const ids of ['',id+'\n'+'c'.repeat(12)])await assert.rejects(probeFileCounterRuntime(key,options,executor({ids})),/exactly one/);
});
test('file counter inspection rejects untrusted profile and identity inputs before Docker access',async()=>{
  for(const [dataKey,settings] of [['../bad',options],[key,{...options,port:80}],[key,{...options,expectedCount:-1}],[key,{...options,expectedCount:1.5}],[key,{...options,expectedCount:Number.MAX_SAFE_INTEGER+1}],...['unknown','__proto__','toString',null].map(fixture=>[key,{...options,fixture}])])await assert.rejects(probeFileCounterRuntime(dataKey,settings,()=>assert.fail('Invalid input must not execute')));
});
test('file counter inspection refuses oversized files, directories and symlinks and removes temporary data after copy errors',async()=>{
  for(const copy of [p=>writeFile(p,'4'.repeat(33)),p=>mkdir(p),p=>symlink('/nonexistent-pods-counter',p),()=>{throw new Error('Copy unavailable');}]){
    const calls=[];await assert.rejects(probeFileCounterRuntime(key,options,executor({copy},calls)),/inspection file|Copy unavailable/);
    await assert.rejects(access(dirname(calls.find(a=>a[0]==='cp')[2])));
  }
});
test('serialized file counter probe works independently for all fixed commands and counter filenames',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-file-counter-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));const fake=join(root,'docker');
  for(const [fixture,[path,args,filename='count']] of Object.entries(recipes)){
    const runtime={...web,path,args};
    await writeFile(fake,`#!${process.execPath}\nconst fs=require('node:fs');const a=process.argv.slice(2);if(a[0]!=='--host'||a[1]!=='unix:///var/run/docker.sock')process.exit(2);if(a[2]==='cp'){if(a[3]!==${JSON.stringify(id+':/data/'+filename)})process.exit(3);fs.writeFileSync(a[4],'4');}else process.stdout.write(a[2]==='ps'?${JSON.stringify(id)}:a[2]==='inspect'?${JSON.stringify(JSON.stringify(runtime))}:a[2]==='volume'?${JSON.stringify(JSON.stringify(volume))}:process.exit(4));\n`);await chmod(fake,0o700);
    const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',fileCounterRuntimeProbeCommand(key,{...options,fixture})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
    const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.fixtureProfile,fixture);
  }
});
