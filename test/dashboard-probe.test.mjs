import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeDashboard,dashboardProbeCommand} from '../scripts/probe-dashboard.mjs';
const key='repo-dashboard-fixture',port=24567,id='b'.repeat(12),project='pods-'+createHash('sha256').update(key).digest('hex').slice(0,24);
const web={service:'web',networkMode:project+'_default',ports:{'8080/tcp':[{HostPort:String(port)}]},mounts:[{Destination:'/data',Type:'volume',RW:true,Name:project+'_app-data-disk-v1'}],running:true};
const volume={driver:'local',options:{type:'none',o:'bind',device:`/workspaces/.pods-launch/volumes/${project}/app-data/data`}};
const database={version:'3.46.1',integrity:'ok',rowCount:1,savedCount:5};
const protocol={passed:true,version:'1.65.0',heading:'Streamlit + SQLite',before:4,afterWrite:5,afterReconnect:5};
const options={port,expectedCount:4,fixture:'gradio'};
function executor({runtime=web,storage=volume,ids=id,db=database,interaction=protocol}={},calls=[]){return async args=>{
 calls.push(args);if(args[0]==='ps')return ids;if(args[0]==='inspect')return JSON.stringify(runtime);if(args[0]==='volume')return JSON.stringify(storage);
 assert.deepEqual(args.slice(0,4),['exec',id,'python','-c']);
 if(args.length===6){assert.equal(args[5],'4');assert.match(args[4],/websockets.asyncio.client/);return JSON.stringify(interaction);}
 assert.match(args[4],/counter.sqlite\?mode=ro/);assert.doesNotMatch(args[4],/UPDATE|INSERT/);return JSON.stringify(db);
};}
function http({before=4,after=5,event,config,large=false}={},calls=[]){let reads=0;return async(url,init)=>{
 const path=new URL(url).pathname;calls.push({path,method:init.method||'GET'});assert.equal(new URL(url).origin,`http://127.0.0.1:${port}`);assert.equal(init.redirect,'error');
 if(path==='/')return new Response(large?'x'.repeat(1048577):'<html><title>Dashboard</title></html>',{headers:{'Content-Type':'text/html'}});
 if(path==='/config')return Response.json(config||{version:'6.29.1',api_prefix:'/gradio_api',dependencies:['read','increment'].map(api_name=>({api_name,inputs:[],api_visibility:'public'}))});
 if(init.method==='POST'){assert.equal(init.body,'{"data":[]}');return Response.json({event_id:'event-123'});}
 let count=after;if(path.includes('/read/'))count=reads++?after:before;
 return new Response(event??`event: complete\ndata: [${count}]\n\n`,{headers:{'Content-Type':'text/event-stream'}});
};}
test('dashboard probes verify real protocol results and independent durable SQLite inspection',async()=>{
 for(const fixture of ['gradio','streamlit']){
  const result=await probeDashboard(key,{...options,fixture},executor(),http());
  assert.equal(result.passed,true);assert.equal(result.before,4);assert.equal(result.afterRead,5);assert.equal(result.database.savedCount,5);assert.equal(result.durableWorkspaceVolume,true);assert.deepEqual(result.productHostPorts,[port]);assert.deepEqual(result.databaseHostPorts,[]);
 }
});
test('dashboard rejects stale data before writing and malformed or failed Gradio completions',async()=>{
 const calls=[];await assert.rejects(probeDashboard(key,options,executor(),http({before:3},calls)),/before writing/);assert.ok(calls.every(x=>!x.path.includes('increment')));
 for(const event of ['event: error\ndata: null\n\n','event: complete\ndata: [5]\n\nevent: complete\ndata: [5]\n\n','event: heartbeat\ndata: null\n\n','event: complete\ndata: ["4"]\n\n'])await assert.rejects(probeDashboard(key,options,executor(),http({event})),/Gradio/);
 await assert.rejects(probeDashboard(key,options,executor(),http({after:4})),/write\/read/);
 await assert.rejects(probeDashboard(key,options,executor(),http({config:{version:'unknown'}})),/interface/);
 await assert.rejects(probeDashboard(key,options,executor(),http({large:true})),/exceeded limit/);
});
test('dashboard rejects unsafe identity, cross-container boundaries, exposed ports and nondurable data before interaction',async()=>{
 for(const settings of [{...options,fixture:'__proto__'},{...options,port:80},{...options,expectedCount:-1},{...options,expectedCount:Number.MAX_SAFE_INTEGER}])await assert.rejects(probeDashboard(key,settings,()=>assert.fail('No Docker access for invalid input')));
 await assert.rejects(probeDashboard('../bad',options,()=>assert.fail('No Docker access')));
 for(const runtime of [{...web,service:'db'},{...web,running:false},{...web,networkMode:'host'},{...web,ports:{...web.ports,'5432/tcp':[{HostPort:'5432'}]}},{...web,mounts:[]}])await assert.rejects(probeDashboard(key,options,executor({runtime}),()=>assert.fail('No HTTP access')),/boundary|port|persistent/);
 for(const ids of ['',id+'\n'+'c'.repeat(12)])await assert.rejects(probeDashboard(key,options,executor({ids})),/exactly one/);
 await assert.rejects(probeDashboard(key,options,executor({storage:{...volume,options:{}}}),()=>assert.fail('No HTTP access')),/durable/);
});
test('dashboard rejects mismatched Streamlit results and corrupt or inconsistent saved database',async()=>{
 for(const interaction of [{...protocol,version:'unknown'},{...protocol,heading:'Other app'},{...protocol,before:3},{...protocol,afterReconnect:4}])await assert.rejects(probeDashboard(key,{...options,fixture:'streamlit'},executor({interaction}),http()),/interface|write\/read/);
 for(const db of [{...database,integrity:'corrupt'},{...database,rowCount:2},{...database,savedCount:4}])await assert.rejects(probeDashboard(key,options,executor({db}),http()),/SQLite/);
});
test('serialized dashboard command includes the Python protocol and runs independently',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pods-dashboard-'));t.after(()=>rm(root,{recursive:true,force:true}));const fake=join(root,'docker');
 await writeFile(fake,`#!${process.execPath}\nconst a=process.argv.slice(2);if(a[0]!=='--host'||a[1]!=='unix:///var/run/docker.sock')process.exit(2);process.stdout.write(a[2]==='ps'?${JSON.stringify(id)}:a[2]==='inspect'?${JSON.stringify(JSON.stringify(web))}:a[2]==='volume'?${JSON.stringify(JSON.stringify(volume))}:a[2]==='exec'&&a[3]===${JSON.stringify(id)}?a.length===8?${JSON.stringify(JSON.stringify(protocol))}:${JSON.stringify(JSON.stringify(database))}:process.exit(3));\n`);await chmod(fake,0o700);
 const command=`globalThis.fetch=async()=>new Response('<html></html>',{headers:{'Content-Type':'text/html'}});${dashboardProbeCommand(key,{...options,fixture:'streamlit'})}`;
 const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',command],{env:{...process.env,PATH:root+':'+process.env.PATH},timeout:10000});assert.equal(JSON.parse(stdout).database.savedCount,5);
});
