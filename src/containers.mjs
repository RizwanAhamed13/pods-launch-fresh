// Shared, dependency-free contract. The runtime never executes a source Compose file.
import { spawn } from 'node:child_process';
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const name = /^[a-z][a-z0-9_-]{0,62}$/;
export const IMAGE_LIMIT = 512 * 1024 * 1024;
export const IMAGE_TOTAL_LIMIT = 1024 * 1024 * 1024;

export function validateContainers(plan) {
  if (!object(plan) || !object(plan.services) || !name.test(plan.web) || !plan.services[plan.web]) throw new Error('Invalid container application');
  const entries = Object.entries(plan.services);
  if (!entries.length || entries.length > 8 || !Number.isInteger(plan.port) || plan.port < 1 || plan.port > 65535) throw new Error('Invalid container services or product port');
  if (!Array.isArray(plan.images) || !plan.images.length || plan.images.length > 8) throw new Error('Invalid prepared images');
  const images = new Set(); let bytes = 0;
  for (const image of plan.images) {
    if (!/^sha256:[a-f0-9]{64}$/.test(image.id) || !/^[a-f0-9]{64}$/.test(image.sha256) || !Number.isSafeInteger(image.bytes) || image.bytes < 1 || image.bytes > IMAGE_LIMIT || images.has(image.id)) throw new Error('Invalid prepared image identity');
    images.add(image.id); bytes += image.bytes;
  }
  if (bytes > IMAGE_TOTAL_LIMIT) throw new Error('Prepared images exceed 1 GiB');
  for (const [key, service] of entries) {
    if (!name.test(key) || !object(service) || !images.has(service.image)) throw new Error('Invalid service image');
    const allowed = new Set(['image','environment','command','entrypoint','volumes','depends_on','healthcheck','working_dir']);
    if (Object.keys(service).some(k => !allowed.has(k))) throw new Error('Unsupported container privilege or option');
    if (service.environment && (!object(service.environment) || Object.entries(service.environment).some(([k,v]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) || typeof v !== 'string' || v.length > 8192))) throw new Error('Invalid service environment');
    for (const field of ['command','entrypoint']) if (service[field] !== undefined && (!Array.isArray(service[field]) || service[field].length > 100 || service[field].some(x => typeof x !== 'string' || x.length > 8192))) throw new Error('Container commands must be argument arrays');
    if (service.working_dir && (!service.working_dir.startsWith('/') || service.working_dir.includes('\0'))) throw new Error('Invalid container working directory');
    if (service.volumes && (!Array.isArray(service.volumes) || service.volumes.length > 8 || service.volumes.some(v => !object(v) || !name.test(v.name) || typeof v.target !== 'string' || !v.target.startsWith('/') || v.target.includes('..') || v.target.includes(':') || v.target.includes('\0') || typeof v.readOnly !== 'boolean'))) throw new Error('Only application named volumes are allowed');
    if (service.depends_on && (!object(service.depends_on) || Object.entries(service.depends_on).some(([k,v]) => k === key || !plan.services[k] || !['service_started','service_healthy','service_completed_successfully'].includes(v)))) throw new Error('Invalid service dependency');
    const h = service.healthcheck;
    if (h && (!object(h) || !Array.isArray(h.test) || !['CMD','CMD-SHELL'].includes(h.test[0]) || h.test.length < 2 || h.test.some(x => typeof x !== 'string' || x.length > 8192) || Object.keys(h).some(k => !['test','interval','timeout','retries','start_period'].includes(k)))) throw new Error('Invalid service healthcheck');
    if (h) {
      for (const k of ['interval','timeout','start_period']) if (h[k] !== undefined && !/^\d+(?:ms|s|m)$/.test(h[k])) throw new Error('Invalid healthcheck duration');
      if (h.retries !== undefined && (!Number.isInteger(h.retries) || h.retries < 1 || h.retries > 100)) throw new Error('Invalid healthcheck retries');
    }
  }
  const visiting = new Set(), visited = new Set();
  function visit(k) { if (visiting.has(k)) throw new Error('Cyclic service dependency'); if (visited.has(k)) return; visiting.add(k); for (const dep of Object.keys(plan.services[k].depends_on || {})) visit(dep); visiting.delete(k); visited.add(k); }
  entries.forEach(([k]) => visit(k));
  return plan;
}

export function runtimeCompose(plan, project, port, previewUrl) {
  validateContainers(plan);
  if (!/^pods-[a-f0-9]{24}$/.test(project)) throw new Error('Invalid runtime project');
  const services = {}, volumes = {};
  for (const [key, service] of Object.entries(plan.services)) {
    services[key] = {
      image: service.image, pull_policy: 'never', restart: 'no',
      cpus: 1, mem_limit: '768m', pids_limit: 256,
      security_opt: ['no-new-privileges:true'],
      environment: { NODE_ENV: 'production', PODS_APP_DATA: '/data', ...service.environment },
      ...(service.command ? {command: service.command} : {}),
      ...(service.entrypoint ? {entrypoint: service.entrypoint} : {}),
      ...(service.working_dir ? {working_dir: service.working_dir} : {}),
      ...(service.healthcheck ? {healthcheck: service.healthcheck} : {}),
      ...(service.depends_on ? {depends_on: Object.fromEntries(Object.entries(service.depends_on).map(([k,condition]) => [k,{condition}]))} : {}),
      volumes: (service.volumes || []).map(v => { volumes[v.name] = {}; return {type:'volume',source:v.name,target:v.target,read_only:v.readOnly}; }),
    };
    if (key === plan.web) {
      services[key].ports = [{target:plan.port,published:String(port),host_ip:'0.0.0.0',protocol:'tcp'}];
      // Angular SSR uses its documented runtime allowlist for per-user preview hosts.
      const hosts = [services[key].environment.NG_ALLOWED_HOSTS, 'localhost', '127.0.0.1'];
      if (previewUrl) {
        const hostname = new URL(previewUrl).hostname;
        hosts.push(hostname);
        // Streamlit validates WebSocket origins behind provider proxies whose Host differs.
        services[key].environment.STREAMLIT_BROWSER_SERVER_ADDRESS = hostname;
      }
      services[key].environment.NG_ALLOWED_HOSTS = hosts.filter(Boolean).join(',');
    }
  }
  return { name: project, services, volumes };
}

export function docker(args, { cwd, timeout = 120000, env, output, input } = {}) {
  return new Promise((resolve, reject) => {
    // Do not forward cloud/provider credentials or arbitrary Docker endpoints.
    const p = spawn('docker', ['--host','unix:///var/run/docker.sock',...args], {cwd, env: env || {PATH:process.env.PATH,HOME:process.env.HOME}, stdio:[input === undefined ? 'ignore' : 'pipe','pipe','pipe']});
    if (input !== undefined) { p.stdin.on('error', () => {}); p.stdin.end(input); }
    let result = '', error = '';
    const timer = setTimeout(() => p.kill('SIGKILL'), timeout);
    p.stdout.on('data', b => { result = (result + b).slice(-65536); output?.(b); });
    p.stderr.on('data', b => { error = (error + b).slice(-2048); });
    p.once('error', e => { clearTimeout(timer); reject(e); });
    p.once('close', code => { clearTimeout(timer); code === 0 ? resolve(result.trim()) : reject(new Error(`Docker ${args[0]} failed (${code ?? 'timeout'}): ${args[0] === 'build' ? result.slice(-4000) + '\n' : ''}${error.slice(-800)}`)); });
  });
}
