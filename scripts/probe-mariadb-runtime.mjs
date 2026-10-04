import {probeMysqlRuntime} from './probe-mysql-runtime.mjs';

// Restricted to the public MariaDB counter fixture; only SELECT queries execute.
export async function probeMariadbRuntime(dataKey,{port,expectedCount},execute,inspectBoundary=probeMysqlRuntime) {
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
  return {...boundary,databaseEngine:'MariaDB',version,versionComment,savedCount,scope:'Read-only inspection of private Docker boundaries, durable Codespaces storage, MariaDB server version and the record saved through the product. Browser execution is separate.'};
}

export function mariadbRuntimeProbeCommand(dataKey,options) {
  return `console.log(JSON.stringify(await (${probeMariadbRuntime.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)},undefined,${probeMysqlRuntime.toString()})));`;
}
