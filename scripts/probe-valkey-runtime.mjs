import {probeDatabaseBoundary} from './probe-database-boundary.mjs';

// Explicit Valkey 8 counter fixture: fixed read-only commands, no database writes.
export async function probeValkeyRuntime(dataKey,{port,expectedCount},execute,inspectBoundary=probeDatabaseBoundary) {
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  if(!execute){
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const boundary=await inspectBoundary(dataKey,execute,{port,databasePath:'/data'});
  const id=(await execute(['ps','--quiet','--filter',`label=com.docker.compose.project=${boundary.project}`,'--filter','label=com.docker.compose.service=db'])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected one Valkey container in this application');
  const read=async args=>(await execute(['exec',id,'valkey-cli','--raw',...args])).trim();
  const info=Object.create(null);
  for(const line of (await read(['INFO','server','persistence'])).split(/\r?\n/)){
    if(!line||line.startsWith('#'))continue;
    const split=line.indexOf(':');
    if(split<1||Object.hasOwn(info,line.slice(0,split)))throw new Error('Malformed Valkey inspection response');
    info[line.slice(0,split)]=line.slice(split+1);
  }
  if(!/^8\.\d+\.\d+$/.test(info.valkey_version)||info.server_name!=='valkey'||info.server_mode!=='standalone'||!/^[a-f0-9]{1,40}$/.test(info.redis_build_id))throw new Error('Database did not return Valkey 8 standalone engine evidence');
  if(info.loading!=='0'||info.aof_enabled!=='1'||info.aof_last_write_status!=='ok')throw new Error('Valkey append-only persistence is not ready');
  if((await read(['CONFIG','GET','dir']))!=='dir\n/data')throw new Error('Valkey persistence directory is outside its application volume');
  const value=await read(['GET','counter']),savedCount=Number(value);
  if(!/^(0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(savedCount)||savedCount!==expectedCount)throw new Error('Valkey record does not match the value saved through the product');
  return {...boundary,databaseEngine:'Valkey',version:info.valkey_version,buildId:info.redis_build_id,appendOnly:true,appendOnlyWriteStatus:info.aof_last_write_status,savedCount,scope:'Read-only inspection of private Docker boundaries, durable Codespaces storage, Valkey engine, append-only persistence and the counter saved through the product. Browser execution is separate.'};
}

export function valkeyRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeValkeyRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)},undefined,${probeDatabaseBoundary.toString()})));`;
}
