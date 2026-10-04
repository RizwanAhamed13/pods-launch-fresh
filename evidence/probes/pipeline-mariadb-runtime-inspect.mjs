console.log(JSON.stringify(await (async function probeMariadbRuntime(dataKey,{port,expectedCount},execute,inspectBoundary=probeMysqlRuntime) {
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0)throw new Error('Expected counter value is required');
  if(!execute){
    const {execFile}=await import('node:child_process');
    const {promisify}=await import('node:util');
    const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const boundary=await inspectBoundary(dataKey,execute,{port});
  const id=(await execute(['ps','--quiet','--filter',`label=com.docker.compose.project=${boundary.project}`,'--filter','label=com.docker.compose.service=db'])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected one MariaDB container in this application');
  // Existing fixture credentials stay inside the container and are never read out.
  const query='MYSQL_PWD="$MYSQL_PASSWORD" mariadb --host=127.0.0.1 --user="$MYSQL_USER" --database="$MYSQL_DATABASE" --batch --skip-column-names --execute="SELECT @@version, @@version_comment; SELECT value FROM counter WHERE id=1;"';
  const lines=(await execute(['exec',id,'sh','-eu','-c',query])).trim().split('\n');
  const [version,versionComment,...extra]=lines[0].split('\t');
  if(lines.length!==2||extra.length||!/^\d+\.\d+\.\d+.*MariaDB/i.test(version)||!versionComment||!/^\d+$/.test(lines[1]))throw new Error('Database did not return MariaDB version and counter evidence');
  const savedCount=Number(lines[1]);
  if(!Number.isSafeInteger(savedCount)||savedCount!==expectedCount)throw new Error('MariaDB record does not match the value saved through the product');
  return {...boundary,databaseEngine:'MariaDB',version,versionComment,savedCount,scope:'Read-only inspection of private Docker boundaries, persistent Cloud Shell home storage, MariaDB server version and the record saved through the product. Browser execution is separate.'};
})('repo-46d8ac316f3e95857ce28b48',{port:23877,expectedCount:3},undefined,async function probeDatabaseBoundary(dataKey, execute, {port=8080,databasePath='/var/lib/mysql'}={}) {
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey || '')) throw new Error('Invalid application data identity');
  if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('Invalid product port');
  if (!['/var/lib/mysql','/data/db','/data'].includes(databasePath)) throw new Error('Unsupported database mount path');
  const {createHash} = await import('node:crypto');
  const project = 'pods-' + createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  if (!execute) {
    const {execFile} = await import('node:child_process');
    const {promisify} = await import('node:util');
    const run = promisify(execFile);
    execute = async args => (await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:15000,maxBuffer:16384})).stdout.trim();
  }
  const ids = (await execute(['ps','--all','--quiet','--filter',`label=com.docker.compose.project=${project}`])).trim().split(/\s+/);
  if (ids.length !== 2 || ids.some(id => !/^[a-f0-9]{12,64}$/.test(id))) throw new Error('Expected exactly the fixture web and database containers');
  const format = '{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}null{{end}}}';
  const containers = (await execute(['inspect','--format',format,...ids])).trim().split('\n').map(line => JSON.parse(line));
  const web = containers.find(c => c.service === 'web'), db = containers.find(c => c.service === 'db');
  if (containers.length !== 2 || !web || !db || containers.some(c => !c.running || c.networkMode !== project+'_default')) throw new Error('Unexpected container state or shared network boundary');
  if (db.health !== 'healthy') throw new Error('Database health check is not healthy');
  if (Object.values(db.ports || {}).some(bindings => bindings?.length)) throw new Error('Database port is published on the host');
  const ports = Object.entries(web.ports || {}).filter(([,bindings]) => bindings?.length);
  if (ports.length !== 1 || ports[0][0] !== '8080/tcp' || ports[0][1].some(p => p.HostPort !== String(port))) throw new Error('Unexpected public product port');
  const mount = db.mounts?.find(m => m.Destination === databasePath);
  const name = project+'_records-disk-v1';
  if (!mount || mount.Type !== 'volume' || !mount.RW || mount.Name !== name) throw new Error('Database does not use its persistent application volume');
  const volume = JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',name]));
  const {homedir}=await import('node:os'); const expected = `${homedir()}/.local/share/pods-launch/volumes/${project}/records/data`;
  if (volume.driver !== 'local' || volume.options?.type !== 'none' || volume.options?.o !== 'bind' || volume.options?.device !== expected) throw new Error('Database storage is outside the durable Cloud Shell application directory');
  return {passed:true,project,services:['web','db'],databaseHealth:db.health,databaseHostPorts:[],productHostPorts:[port],volume:name,persistentHomeVolume:true,scope:'Read-only Docker boundary and volume inspection on Cloud Shell; record persistence is verified separately through HTTP before and after restart.'};
})));
