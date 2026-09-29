import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
export const uid = () => randomBytes(24).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function same(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function shell(value) { return "'" + String(value).replaceAll("'", "'\\''") + "'"; }
export function command(file, args, { input, env, timeout = 90000, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(file, args, { env: env || process.env, cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '', done = false;
    const timer = setTimeout(() => { p.kill('SIGKILL'); finish(new Error(`${file} timed out`)); }, timeout);
    function finish(error) { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(out); }
    p.on('error', finish);
    p.stdout.on('data', b => { out = (out + b).slice(-65536); });
    p.stderr.on('data', b => { err = (err + b).slice(-8192); });
    p.on('close', code => finish(code === 0 ? null : new Error(`${file} exited ${code}: ${err.slice(-1500)}`)));
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}
export async function request(url, token, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(url, { method, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || data.error?.message || `Provider returned ${res.status}`); e.status = res.status; throw e; }
  return data;
}
