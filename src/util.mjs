import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
export const uid = () => randomBytes(24).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function same(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function shell(value) { return "'" + String(value).replaceAll("'", "'\\''") + "'"; }
export function command(file, args, { input, env, timeout = 90000, cwd, onStdout } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(file, args, { env: env || process.env, cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '', done = false, timedOut;
    const timer = setTimeout(() => { timedOut = new Error(`${file} timed out`); p.kill('SIGKILL'); }, timeout);
    function finish(error) { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(out); }
    p.on('error', finish);
    p.stdout.on('data', b => { out = (out + b).slice(-65536); onStdout?.(b.toString()); });
    p.stderr.on('data', b => { err = (err + b).slice(-8192); });
    // A caller may hold a publication lock. Keep it until the child has exited.
    p.on('close', code => finish(timedOut || (code === 0 ? null : new Error(`${file} exited ${code}: ${(err + out).slice(-1500)}`))));
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}
export async function request(url, token, { method = 'GET', body, headers = {} } = {}) {
  const signal=AbortSignal.timeout(20000);
  const res = await fetch(url, { method, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, signal });
  const data = await res.json().catch(error => { if(signal.aborted)throw signal.reason; if(error instanceof SyntaxError)return {}; throw error; });
  if (!res.ok) { const e = new Error(data.message || data.error?.message || `Provider returned ${res.status}`); e.status = res.status; throw e; }
  return data;
}
