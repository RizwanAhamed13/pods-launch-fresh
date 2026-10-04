import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeGoRuntime,goRuntimeProbeCommand} from '../scripts/probe-go-runtime.mjs';
const key='repo-go-fixture',port=24567,id='a'.repeat(12),project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const web={service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true,path:'/product',args:[]};
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/app-data/data`}};
function executable(version='go1.24.13',module='pods.example/counter',cgo=0){
  const header=Buffer.alloc(96);Buffer.from('7f454c46020101','hex').copy(header);header.writeUInt16LE(2,16);header.writeUInt16LE(62,18);
  Buffer.from([255,...Buffer.from(' Go buildinf:')]).copy(header,64);header[78]=8;header[79]=2;
  const encoded=b=>{const length=[];let n=b.length;do{length.push((n&127)|(n>=128?128:0));n=Math.floor(n/128);}while(n);return Buffer.concat([Buffer.from(length),b]);};
  const mod=Buffer.concat([Buffer.alloc(16,255),Buffer.from(`path\t${module}\nbuild\tCGO_ENABLED=${cgo}\n`),Buffer.alloc(16,255)]);
  return Buffer.concat([header,encoded(Buffer.from(version)),encoded(mod)]);
}
function executor({binary=executable(),value='4',runtime=web,storage=volume,ids=id,failCopy=false}={},calls=[]){return async args=>{
  calls.push(args);
  if(args[0]==='ps')return ids;
  if(args[0]==='inspect')return JSON.stringify(runtime);
  if(args[0]==='volume')return JSON.stringify(storage);
  assert.equal(args[0],'cp');assert.ok([id+':/product',id+':/data/count'].includes(args[1]));
  if(failCopy)throw new Error('Copy unavailable');
  await writeFile(args[2],args[1].endsWith('/product')?binary:value);return '';
};}
test('Go probe verifies compiled ELF/module identity, persistent counter and private boundary without executing container tools',async()=>{
  const calls=[],result=await probeGoRuntime(key,{port,expectedCount:4},executor({},calls));
  assert.equal(result.runtime,'Go');assert.equal(result.version,'go1.24.13');assert.equal(result.module,'pods.example/counter');assert.equal(result.cgoEnabled,false);assert.equal(result.savedCount,4);
  assert.equal(result.binarySha256,createHash('sha256').update(executable()).digest('hex'));assert.equal(result.durableWorkspaceVolume,true);assert.deepEqual(result.productHostPorts,[port]);
  const copies=calls.filter(x=>x[0]==='cp');assert.equal(copies.length,2);await assert.rejects(access(dirname(copies[0][2])));assert.doesNotMatch(JSON.stringify(result),/\/workspaces\/|inspection-/);
});
test('Go probe rejects non-Go binaries, unsupported build metadata and malformed inline lengths',async()=>{
  const wrongArch=executable();wrongArch.writeUInt16LE(183,18);
  const missingMagic=executable();missingMagic[64]=0;
  const malformed=executable();malformed.fill(255,96,100);
  for(const binary of [Buffer.from('#!/bin/sh'),wrongArch,missingMagic,executable('go1.25.0'),executable('go1.24.13','wrong/module'),executable('go1.24.13','pods.example/counter',1),malformed,executable().subarray(0,99)])await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({binary})),/Go/);
  for(const value of ['','5','04','4junk','-1','9007199254740992'])await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({value})),/Go record/);
});
test('Go probe rejects a changed launch command, exposed port, wrong storage, extra container and invalid input before copying',async()=>{
  for(const runtime of [{...web,path:'/bin/sh'},{...web,args:['extra']},{...web,ports:{...web.ports,'9090/tcp':[{HostPort:'9090'}]}},{...web,mounts:[]}])await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({runtime})),/boundary|port|persistent/);
  await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({storage:{...volume,options:{}}})),/durable/);
  await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({ids:id+'\n'+'b'.repeat(12)})),/exactly one/);
  for(const [dataKey,options] of [['../bad',{port,expectedCount:4}],[key,{port:80,expectedCount:4}],[key,{port,expectedCount:-1}]])await assert.rejects(probeGoRuntime(dataKey,options,()=>assert.fail('Invalid input must not execute')));
});
test('Go probe cleans its temporary copies on inspection failure',async()=>{
  const calls=[];await assert.rejects(probeGoRuntime(key,{port,expectedCount:4},executor({failCopy:true},calls)),/Copy unavailable/);
  await assert.rejects(access(dirname(calls.find(x=>x[0]==='cp')[2])));
});
test('serialized Go probe inspects copied executable and record in a fresh process',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-go-probe-'));t.after(()=>rm(root,{recursive:true,force:true}));const fake=join(root,'docker');
  await writeFile(fake,`#!${process.execPath}\nconst fs=require('node:fs');const a=process.argv.slice(2);if(a[0]!=='--host'||a[1]!=='unix:///var/run/docker.sock')process.exit(2);if(a[2]==='cp'){if(a[3]!==${JSON.stringify(id+':/product')}&&a[3]!==${JSON.stringify(id+':/data/count')})process.exit(3);fs.writeFileSync(a[4],a[3].endsWith('/product')?Buffer.from(${JSON.stringify(executable().toString('base64'))},'base64'):'4');}else process.stdout.write(a[2]==='ps'?${JSON.stringify(id)}:a[2]==='inspect'?${JSON.stringify(JSON.stringify(web))}:a[2]==='volume'?${JSON.stringify(JSON.stringify(volume))}:process.exit(4));\n`);await chmod(fake,0o700);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',goRuntimeProbeCommand(key,{port,expectedCount:4})],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.passed,true);assert.equal(result.savedCount,4);assert.equal(result.runtime,'Go');
});
