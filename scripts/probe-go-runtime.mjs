// Restricted Go fixtures: inspect copied files without executing container tools.
export async function probeGoRuntime(dataKey,{port,expectedCount,fixture='go'},execute) {
  const profiles={go:{module:'pods.example/counter',toolchain:/^go1\.24\.\d+$/},echo:{module:'pods.example/echo',toolchain:/^go1\.26\.\d+$/,dependency:'github.com/labstack/echo/v5',framework:'Echo',frameworkVersion:'v5.4.0'},fiber:{module:'pods.example/fiber',toolchain:/^go1\.26\.\d+$/,dependency:'github.com/gofiber/fiber/v3',framework:'Fiber',frameworkVersion:'v3.5.0'}};
  if(!Object.hasOwn(profiles,fixture))throw new Error('Unsupported Go fixture');
  const profile=profiles[fixture];
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
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected exactly one Go web container');
  const format='{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}},"path":{{json .Path}},"args":{{json .Args}}}';
  const web=JSON.parse(await execute(['inspect','--format',format,id]));
  if(web.service!=='web'||!web.running||web.networkMode!==project+'_default'||web.path!=='/product'||!Array.isArray(web.args)||web.args.length)throw new Error('Unexpected Go executable or application boundary');
  const ports=Object.entries(web.ports||{}).filter(([,bindings])=>bindings?.length);
  if(ports.length!==1||ports[0][0]!=='8080/tcp'||ports[0][1].some(p=>p.HostPort!==String(port)))throw new Error('Unexpected public product port');
  const volume=project+'_app-data-disk-v1',mount=web.mounts?.find(m=>m.Destination==='/data');
  if(!mount||mount.Type!=='volume'||!mount.RW||mount.Name!==volume)throw new Error('Go data is outside its persistent application volume');
  const storage=JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));
  if(storage.driver!=='local'||storage.options?.type!=='none'||storage.options?.o!=='bind'||storage.options?.device!==`/workspaces/.pods-launch/volumes/${project}/app-data/data`)throw new Error('Go storage is outside its durable Codespaces directory');
  const temporary=await mkdtemp(join(tmpdir(),'pods-go-inspection-'));
  try {
    const binaryPath=join(temporary,'product'),recordPath=join(temporary,'count');
    await execute(['cp',id+':/product',binaryPath]);await execute(['cp',id+':/data/count',recordPath]);
    for(const [path,max] of [[binaryPath,32*1024*1024],[recordPath,32]]){const file=await lstat(path);if(!file.isFile()||file.size>max)throw new Error('Unexpected Go inspection file');}
    const binary=await readFile(binaryPath),value=(await readFile(recordPath,'utf8')).trim();
    if(binary.length<64||binary.subarray(0,7).toString('hex')!=='7f454c46020101'||binary.readUInt16LE(16)!==2||binary.readUInt16LE(18)!==62)throw new Error('Go product is not an ELF Linux x64 executable');
    const magic=Buffer.from([255,...Buffer.from(' Go buildinf:')]);let offset=-1;
    do {offset=binary.indexOf(magic,offset+1);}while(offset>=0&&offset%16);
    if(offset<0||offset+32>binary.length||binary[offset+14]!==8||binary[offset+15]!==2)throw new Error('Go inline build information is missing');
    let cursor=offset+32;
    const readBytes=()=>{let length=0,factor=1;for(let n=0;n<4;n++){if(cursor>=binary.length)break;const byte=binary[cursor++];length+=(byte&127)*factor;if(byte<128){if(length>65536||cursor+length>binary.length)break;const result=binary.subarray(cursor,cursor+length);cursor+=length;return result;}factor*=128;}throw new Error('Malformed Go build information');};
    const version=readBytes().toString('utf8'),framedModule=readBytes(),moduleInfo=framedModule.subarray(16,-16).toString('utf8');
    const moduleLines=moduleInfo.split('\n');
    if(!profile.toolchain.test(version)||framedModule.length<33||framedModule.at(-17)!==10||!moduleLines.includes('path\t'+profile.module)||!moduleLines.includes('build\tCGO_ENABLED=0'))throw new Error('Go fixture build identity does not match');
    const dependency=profile.dependency&&moduleLines.find(line=>line.startsWith('dep\t'+profile.dependency+'\t'))?.split('\t');
    if(profile.dependency&&(dependency?.[2]!==profile.frameworkVersion||moduleLines.some(line=>line.startsWith('=>\t'))))throw new Error('Go framework dependency does not match');
    const savedCount=Number(value);
    if(!/^(0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(savedCount)||savedCount!==expectedCount)throw new Error('Go record does not match the value saved through the product');
    return {passed:true,project,services:['web'],runtime:'Go',version,module:profile.module,...(dependency?{framework:profile.framework,frameworkVersion:dependency[2],frameworkDependency:profile.dependency}:{}),binaryFormat:'ELF-linux-x64',binarySha256:createHash('sha256').update(binary).digest('hex'),binaryBytes:binary.length,cgoEnabled:false,savedCount,volume,durableWorkspaceVolume:true,productHostPorts:[port],databaseHostPorts:[],scope:'Read-only inspection of the compiled Go fixture, saved file counter and durable Codespaces volume. This is not database, power-loss or VM replacement evidence.'};
  } finally {await rm(temporary,{recursive:true,force:true});}
}

export function goRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeGoRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)})));`;
}
