// Execute only inside the isolated build container, as its unprivileged user.
import { readFile, writeFile, mkdir, copyFile, lstat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { detectApplication } from '../src/detect.mjs';
import { parseRepository } from '../src/repository.mjs';
import { prepare } from './prepare.mjs';
import { run } from '../src/runner.mjs';
import { command, uid, sleep } from '../src/util.mjs';

const exists = path => lstat(path).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; });
const stage = status => console.log(JSON.stringify({ status }));

function requireIsolation() {
  if (process.env.PODS_ISOLATED_BUILD !== '1' || process.getuid?.() === 0) {
    throw new Error('Repository builds must run as an unprivileged user in an isolated build container.');
  }
}

export async function waitForRepositoryNetwork({ resolveName = lookup, pause = sleep } = {}) {
  for (let attempt = 0; attempt < 15; attempt++) {
    try { await resolveName('github.com', { family: 4 }); return; }
    catch {
      if (attempt === 14) throw new Error('Build environment networking did not become ready. Retry preparation.');
      await pause(1000);
    }
  }
}

export async function buildSource(source, output, overrides = {}) {
  requireIsolation();
  const root = await realpath(resolve(source));
  await mkdir(output, { recursive: true });
  stage('detecting');
  const plan = await detectApplication(root, overrides);
  const env = {
    PATH: process.env.PATH, HOME: '/home/pods', TMPDIR: '/tmp',
    npm_config_cache: '/tmp/npm-cache', npm_config_userconfig: '/dev/null',
    CI: 'true', NODE_OPTIONS: '--max-old-space-size=1536',
  };
  if (plan.kind !== 'container' && await exists(join(root, 'package.json'))) {
    stage('installing');
    const install = await exists(join(root, 'package-lock.json')) ? 'ci' : 'install';
    await command('npm', [install, '--include=dev', '--no-audit', '--no-fund'], { cwd: root, env, timeout: 300000 });
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (pkg.scripts?.build) {
      stage('compiling');
      await command('npm', ['run', 'build'], { cwd: root, env, timeout: 300000 });
    }
  }
  stage('packaging');
  const manifest = await prepare(root, join(output, 'prepared'), { ...overrides, id: overrides.id || plan.id });
  const archive = join(output, 'prepared/artifacts', manifest.sha256 + '.gz');
  const bytes = await readFile(archive);
  const callbacks = createServer(async (req, res) => {
    const image = /\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
    if (image && manifest.images?.some(i=>i.sha256===image[1])) return createReadStream(join(output,'prepared/images',image[1]+'.gz')).pipe(res);
    if (req.url === '/artifact') return res.end(bytes);
    for await (const part of req) { /* Consume local runner callback. */ }
    res.end('{}');
  });
  await new Promise(resolve => callbacks.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${callbacks.address().port}`;
  let running;
  try {
    stage('verifying');
    running = await run({
      id: uid(), appId: manifest.id, sha256: manifest.sha256,
      // Build verification must never claim a real application's durable volume.
      dataKey: 'verify-' + uid().toLowerCase().replace(/[^a-z0-9]/g, ''),
      artifactUrl: origin + '/artifact', callbackUrl: origin + '/callback',
      token: uid(), port: 8080, expiresAt: Date.now() + 180000,
    }, { root: join(output, 'verification') });
    const page = await fetch('http://127.0.0.1:8080/', { signal: AbortSignal.timeout(5000), redirect: 'error' });
    const contentType = page.headers.get('content-type') || '';
    if (!page.ok || !/^(?:text\/html|application\/json)(?:;|$)/i.test(contentType)) {
      await page.body?.cancel();
      throw new Error('The application started, but did not serve a web product or JSON API at /.');
    }
    let document = '';
    for await (const chunk of page.body) {
      document += Buffer.from(chunk).toString('utf8');
      if (document.length > 128 * 1024) break;
    }
    if (contentType.includes('application/json')) { JSON.parse(document); manifest.productType='api'; }
    else if (!/<(?:html|!doctype\s+html|head|body)(?:\s|>)/i.test(document)) throw new Error('The application did not return an HTML product document.');
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(document)?.[1]?.slice(0, 150) || manifest.name;
    manifest.verification = { documentPath: '/', status: page.status, contentType, title, checkedAt: new Date().toISOString() };
    await copyFile(archive, join(output, 'artifact.gz'));
    if (manifest.images) {
      await mkdir(join(output,'images'),{recursive:true});
      for (const image of manifest.images) await copyFile(join(output,'prepared/images',image.sha256+'.gz'),join(output,'images',image.sha256+'.gz'));
    }
    return manifest;
  } finally {
    await running?.stop();
    await new Promise(resolve => callbacks.close(resolve));
  }
}

async function main() {
  requireIsolation();
  const repository = parseRepository(process.argv[2], process.argv[3] || '');
  const root = '/work/repository';
  const env = {
    PATH: process.env.PATH, HOME: '/home/pods', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0',
  };
  stage('fetching');
  await waitForRepositoryNetwork();
  await command('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'protocol.allow=never', '-c', 'protocol.https.allow=always', 'clone', '--depth=1', '--no-recurse-submodules', repository.url + '.git', root], { env, timeout: 120000 });
  const revision = (await command('git', ['-C', root, 'rev-parse', 'HEAD'], { env })).trim();
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Repository revision could not be verified.');
  const source = await realpath(join(root, repository.folder));
  if (source !== root && !source.startsWith(root + '/')) throw new Error('Application folder escapes repository.');
  const manifest = await buildSource(source, '/output', { id: `repo-${repository.key}`, name: repository.name });
  manifest.source = { url: repository.url, folder: repository.folder, revision };
  await writeFile('/output/result.json', JSON.stringify(manifest, null, 2));
  stage('verified');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
