// Restricted Flask + SQLite fixture inspection; opens the existing file read-only.
export async function probeSqliteRuntime(dataKey,{port,expectedCount},execute) {
  if(!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey||''))throw new Error('Invalid application data identity');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid product port');
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  const {createHash}=await import('node:crypto');
  const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  if(!execute){
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const id=(await execute(['ps','--all','--quiet','--filter',`label=com.docker.compose.project=${project}`])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected exactly one SQLite web container');
  const format='{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}}}';
  const web=JSON.parse(await execute(['inspect','--format',format,id]));
  if(web.service!=='web'||!web.running||web.networkMode!==project+'_default')throw new Error('Unexpected SQLite application boundary');
  const ports=Object.entries(web.ports||{}).filter(([,bindings])=>bindings?.length);
  if(ports.length!==1||ports[0][0]!=='8080/tcp'||ports[0][1].some(p=>p.HostPort!==String(port)))throw new Error('Unexpected public product port');
  const volume=project+'_app-data-disk-v1',mount=web.mounts?.find(m=>m.Destination==='/data');
  if(!mount||mount.Type!=='volume'||!mount.RW||mount.Name!==volume)throw new Error('SQLite file is outside its persistent application volume');
  const storage=JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));
  if(storage.driver!=='local'||storage.options?.type!=='none'||storage.options?.o!=='bind'||storage.options?.device!==`/workspaces/.pods-launch/volumes/${project}/app-data/data`)throw new Error('SQLite storage is outside its durable Codespaces directory');
  const query='import sqlite3,json; c=sqlite3.connect("file:/data/counter.db?mode=ro",uri=True); row=c.execute("SELECT value FROM counter WHERE id=1").fetchone(); print(json.dumps({"version":sqlite3.sqlite_version,"integrity":c.execute("PRAGMA quick_check").fetchone()[0],"rowCount":c.execute("SELECT COUNT(*) FROM counter").fetchone()[0],"savedCount":row[0] if row else None})); c.close()';
  const record=JSON.parse(await execute(['exec',id,'python','-c',query]));
  if(!/^3\.\d+\.\d+$/.test(record.version)||record.integrity!=='ok'||record.rowCount!==1)throw new Error('SQLite engine, integrity or fixture row count did not match');
  if(!Number.isSafeInteger(record.savedCount)||record.savedCount!==expectedCount)throw new Error('SQLite record does not match the value saved through the product');
  return {passed:true,project,services:['web'],databaseEngine:'SQLite',version:record.version,integrity:record.integrity,savedCount:record.savedCount,volume,durableWorkspaceVolume:true,productHostPorts:[port],databaseHostPorts:[],scope:'Read-only inspection of the actual SQLite file, saved product row, isolated container and durable Codespaces volume. Browser execution and VM replacement are separate.'};
}

export function sqliteRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeSqliteRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)})));`;
}
