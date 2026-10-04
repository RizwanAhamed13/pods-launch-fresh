// Explicit fixture acceptance: inspect an online SQLite backup without pausing the product.
export async function probeSqliteFileRuntime(dataKey,{port,expectedCount,fixture,workspace='/workspaces'},execute) {
  const java=['/__cacert_entrypoint.sh',['sh','-c','if [ -f /product/quarkus-run.jar ]; then exec java -jar /product/quarkus-run.jar; else exec java -jar /product/app.jar; fi']];
  const profiles={ktor:java,micronaut:java,phoenix:['/product/bin/pods_phoenix',['start']],symfony:['docker-php-entrypoint',['php','-S','0.0.0.0:8080','-t','public']]};
  if(!Object.hasOwn(profiles,fixture))throw new Error('Unsupported SQLite file fixture');
  if(!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey||''))throw new Error('Invalid application data identity');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid product port');
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  const {createHash}=await import('node:crypto');
  const {mkdtemp,readdir,lstat,realpath,rm}=await import('node:fs/promises');
  const {join,isAbsolute}=await import('node:path');
  const {tmpdir}=await import('node:os');
  const {DatabaseSync,backup}=await import('node:sqlite');
  if(!isAbsolute(workspace)||await realpath(workspace)!==workspace)throw new Error('Invalid inspection workspace');
  const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  if(!execute){
    const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const id=(await execute(['ps','--all','--quiet','--filter',`label=com.docker.compose.project=${project}`])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected exactly one SQLite web container');
  const format='{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}},"paused":{{json .State.Paused}},"path":{{json .Path}},"args":{{json .Args}}}';
  const web=JSON.parse(await execute(['inspect','--format',format,id]));const [path,args]=profiles[fixture];
  if(web.service!=='web'||!web.running||web.paused!==false||web.networkMode!==project+'_default'||web.path!==path||JSON.stringify(web.args)!==JSON.stringify(args))throw new Error('Unexpected SQLite fixture command or application boundary');
  const ports=Object.entries(web.ports||{}).filter(([,bindings])=>bindings?.length);
  if(ports.length!==1||ports[0][0]!=='8080/tcp'||ports[0][1].some(p=>p.HostPort!==String(port)))throw new Error('Unexpected public product port');
  const volume=project+'_app-data-disk-v1',mount=web.mounts?.find(m=>m.Destination==='/data');
  if(!mount||mount.Type!=='volume'||!mount.RW||mount.Name!==volume)throw new Error('SQLite file is outside its persistent application volume');
  const storage=JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));
  const source=join(workspace,'.pods-launch','volumes',project,'app-data','data');
  if(storage.driver!=='local'||storage.options?.type!=='none'||storage.options?.o!=='bind'||storage.options?.device!==source||await realpath(source)!==source)throw new Error('SQLite storage is outside its durable workspace directory');
  const files=(await readdir(source)).sort();
  if(!files.includes('counter.sqlite')||files.some(f=>!['counter.sqlite','counter.sqlite-wal','counter.sqlite-shm','counter.sqlite-journal'].includes(f)))throw new Error('Unexpected SQLite source files');
  for(const name of files){const stat=await lstat(join(source,name));if(!stat.isFile()||stat.size>16*1024*1024)throw new Error('Unexpected SQLite source file');}
  const temporary=await mkdtemp(join(tmpdir(),'pods-sqlite-file-inspection-'));let db,sourceDb;
  try {
    // SQLite's backup API includes committed WAL data while normal service checks continue.
    sourceDb=new DatabaseSync(join(source,'counter.sqlite'),{readOnly:true});
    await backup(sourceDb,join(temporary,'counter.sqlite'));
    sourceDb.close();sourceDb=null;
    db=new DatabaseSync(join(temporary,'counter.sqlite'),{readOnly:true});
    const integrity=db.prepare('PRAGMA quick_check').get().quick_check;
    const rowCount=db.prepare('SELECT COUNT(*) AS n FROM counter').get().n;
    const savedCount=db.prepare('SELECT value FROM counter WHERE id=1').get()?.value;
    if(integrity!=='ok'||rowCount!==1||!Number.isSafeInteger(savedCount)||savedCount!==expectedCount)throw new Error('SQLite snapshot does not match the saved product record');
    const inspectionEngineVersion=db.prepare('SELECT sqlite_version() AS version').get().version;
    const after=JSON.parse(await execute(['inspect','--format',format,id]));
    if(!after.running||after.paused)throw new Error('Application stopped during SQLite inspection');
    const snapshotFiles=(await readdir(temporary)).sort();
    return {passed:true,fixtureProfile:fixture,project,services:['web'],databaseEngine:'SQLite',inspectionEngineVersion,integrity,savedCount,sourceFiles:files,snapshotFiles,applicationPaused:false,applicationStayedRunning:true,volume,durableWorkspaceVolume:true,productHostPorts:[port],databaseHostPorts:[],scope:'Read-only source connection and SQLite online backup including committed WAL data; the application remains running and is never paused. Queries use a private temporary backup. SQLite version describes the inspector, not the application driver. No application SQL was changed; VM replacement and power-loss durability are separate.'};
  } finally {try{sourceDb?.close();db?.close();}finally{await rm(temporary,{recursive:true,force:true});}}
}

export function sqliteFileRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeSqliteFileRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)})));`;
}
