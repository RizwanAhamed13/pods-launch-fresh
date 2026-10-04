// Explicit fixture acceptance: inspect only container boundaries, never environment secrets.
export async function probeMysqlRuntime(dataKey, execute, {port=8080}={}) {
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey || '')) throw new Error('Invalid application data identity');
  if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('Invalid product port');
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
  const mount = db.mounts?.find(m => m.Destination === '/var/lib/mysql');
  const name = project+'_records-disk-v1';
  if (!mount || mount.Type !== 'volume' || !mount.RW || mount.Name !== name) throw new Error('Database does not use its persistent application volume');
  const volume = JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',name]));
  const expected = `/workspaces/.pods-launch/volumes/${project}/records/data`;
  if (volume.driver !== 'local' || volume.options?.type !== 'none' || volume.options?.o !== 'bind' || volume.options?.device !== expected) throw new Error('Database storage is outside the durable Codespaces application directory');
  return {passed:true,project,services:['web','db'],databaseHealth:db.health,databaseHostPorts:[],productHostPorts:[port],volume:name,durableWorkspaceVolume:true,scope:'Read-only Docker boundary and volume inspection on Codespaces; record persistence is verified separately through HTTP before and after restart.'};
}

export function mysqlRuntimeProbeCommand(dataKey, options={}) {
  return `console.log(JSON.stringify(await (${probeMysqlRuntime.toString()})(${JSON.stringify(dataKey)},undefined,${JSON.stringify(options)})));`;
}
