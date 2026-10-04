// Restricted native acceptance fixtures; never execute tools inside the application.
export async function probeFileCounterRuntime(dataKey,{port,expectedCount,fixture},execute) {
  const profiles={actix:['/product',[]],axum:['/product',[]],rocket:['/product',[]],aspnet:['dotnet',['Counter.dll']]};
  if(!Object.hasOwn(profiles,fixture))throw new Error('Unsupported file counter fixture');
  if(!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey||''))throw new Error('Invalid application data identity');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid product port');
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  const {createHash}=await import('node:crypto');
  const {mkdtemp,readFile,lstat,rm}=await import('node:fs/promises');
  const {join}=await import('node:path');
  const {tmpdir}=await import('node:os');
  const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  if(!execute){
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const id=(await execute(['ps','--all','--quiet','--filter',`label=com.docker.compose.project=${project}`])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected exactly one file counter web container');
  const format='{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}},"path":{{json .Path}},"args":{{json .Args}}}';
  const web=JSON.parse(await execute(['inspect','--format',format,id]));
  const [path,args]=profiles[fixture];
  if(web.service!=='web'||!web.running||web.networkMode!==project+'_default'||web.path!==path||JSON.stringify(web.args)!==JSON.stringify(args))throw new Error('Unexpected file counter command or application boundary');
  const ports=Object.entries(web.ports||{}).filter(([,bindings])=>bindings?.length);
  if(ports.length!==1||ports[0][0]!=='8080/tcp'||ports[0][1].some(p=>p.HostPort!==String(port)))throw new Error('Unexpected public product port');
  const volume=project+'_app-data-disk-v1',mount=web.mounts?.find(m=>m.Destination==='/data');
  if(!mount||mount.Type!=='volume'||!mount.RW||mount.Name!==volume)throw new Error('Counter data is outside its persistent application volume');
  const storage=JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));
  if(storage.driver!=='local'||storage.options?.type!=='none'||storage.options?.o!=='bind'||storage.options?.device!==`/workspaces/.pods-launch/volumes/${project}/app-data/data`)throw new Error('Counter storage is outside its durable workspace directory');
  const temporary=await mkdtemp(join(tmpdir(),'pods-file-counter-inspection-'));
  try {
    const recordPath=join(temporary,'count');
    await execute(['cp',id+':/data/count',recordPath]);
    const file=await lstat(recordPath);
    if(!file.isFile()||file.size>32)throw new Error('Unexpected counter inspection file');
    const value=(await readFile(recordPath,'utf8')).trim(),savedCount=Number(value);
    if(!/^(0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(savedCount)||savedCount!==expectedCount)throw new Error('File counter does not match the value saved through the product');
    return {passed:true,fixtureProfile:fixture,project,services:['web'],savedCount,volume,durableWorkspaceVolume:true,productHostPorts:[port],databaseHostPorts:[],scope:'Read-only inspection of the fixture command, saved file counter and persistent workspace volume. Does not independently identify the framework version or prove database, power-loss or VM replacement durability.'};
  } finally {await rm(temporary,{recursive:true,force:true});}
}

export function fileCounterRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeFileCounterRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)})));`;
}
