import {probeDatabaseBoundary} from './probe-database-boundary.mjs';

// Restricted to the pinned public MongoDB counter fixture; inspection never writes.
export async function probeMongodbRuntime(dataKey,{port,expectedCount},execute,inspectBoundary=probeDatabaseBoundary) {
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  if(!execute){
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const boundary=await inspectBoundary(dataKey,execute,{port,databasePath:'/data/db'});
  const id=(await execute(['ps','--quiet','--filter',`label=com.docker.compose.project=${boundary.project}`,'--filter','label=com.docker.compose.service=db'])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected one MongoDB container in this application');
  const query='const b=db.adminCommand({buildInfo:1});const s=db.serverStatus();const r=db.getSiblingDB("pods").counter.findOne({_id:"count"});print(JSON.stringify({version:b.version,gitVersion:b.gitVersion,storageEngine:s.storageEngine.name,savedCount:r?.value}));';
  const record=JSON.parse(await execute(['exec',id,'mongosh','--quiet','--eval',query]));
  if(record.version!=='7.0.43'||!/^[a-f0-9]{40}$/.test(record.gitVersion)||record.storageEngine!=='wiredTiger')throw new Error('Database did not return the pinned MongoDB engine evidence');
  if(!Number.isSafeInteger(record.savedCount)||record.savedCount!==expectedCount)throw new Error('MongoDB record does not match the value saved through the product');
  return {...boundary,databaseEngine:'MongoDB',version:record.version,gitVersion:record.gitVersion,storageEngine:record.storageEngine,savedCount:record.savedCount,scope:'Read-only inspection of private Docker boundaries, durable Codespaces storage, MongoDB server build and the document saved through the product. Browser execution is separate.'};
}

export function mongodbRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeMongodbRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)},undefined,${probeDatabaseBoundary.toString()})));`;
}
