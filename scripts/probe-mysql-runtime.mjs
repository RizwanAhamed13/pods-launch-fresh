import {probeDatabaseBoundary as probeMysqlRuntime} from './probe-database-boundary.mjs';
export {probeMysqlRuntime};

export function mysqlRuntimeProbeCommand(dataKey, options={}) {
  return `console.log(JSON.stringify(await (${probeMysqlRuntime.toString()})(${JSON.stringify(dataKey)},undefined,${JSON.stringify(options)})));`;
}
