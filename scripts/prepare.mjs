import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir, lstat, realpath, rename } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';
import { digest, uid } from '../src/util.mjs';
import { detectApplication, sourcePath } from '../src/detect.mjs';
import { prepareContainer } from './prepare-container.mjs';

const MAX_PAYLOAD = 50 * 1024 * 1024;
const ignored = new Set(['node_modules', '.git', '.env', '.npmrc', '.netrc', '.ssh', '.aws']);

export async function prepare(source, dataDir = process.env.PODS_DATA || '.data', overrides = {}) {
  const root = await realpath(resolve(source));
  const config = await detectApplication(root, overrides);
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(config.id)) throw new Error('Invalid app id');
  if (!config.name || !/^\/[a-zA-Z0-9/_-]*$/.test(config.healthPath || '') || config.healthPath.includes('//')) {
    throw new Error('Application name and HTTP health path are required.');
  }
  if (config.kind === 'container') return prepareContainer(root,dataDir,config);
  const files = [];
  let encodedSize = 0;
  function include(path, bytes) {
    encodedSize += Math.ceil(bytes.length / 3) * 4 + path.length + 30;
    if (encodedSize > MAX_PAYLOAD || files.length >= 5000) throw new Error('Artifact exceeds the 50 MiB or 5000-file limit');
    files.push({ path, data: Buffer.from(bytes).toString('base64') });
  }
  async function add(path, destination) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error('Symlink assets are not supported');
    if (stat.isDirectory()) {
      for (const name of (await readdir(path)).sort()) {
        if (name.startsWith('.') || ignored.has(name)) continue;
        await add(join(path, name), destination ? `${destination}/${name}` : name);
      }
    } else {
      if (!stat.isFile()) throw new Error('Only regular file assets are supported');
      if (stat.size > MAX_PAYLOAD) throw new Error('Asset exceeds the artifact size limit');
      if (ignored.has(destination.split('/').at(-1)) || destination.split('/').some(p => p.startsWith('.'))) {
        throw new Error('Private configuration files cannot be packaged as assets.');
      }
      include(destination, await readFile(path));
    }
  }
  if (config.kind === 'static') {
    let site;
    for (const candidate of config.outputCandidates) {
      const index = await sourcePath(root, join(candidate, 'index.html'), { optional: true });
      if (index?.stat.isFile()) { site = (await sourcePath(root, candidate)).path; break; }
    }
    if (!site) throw new Error('The frontend build did not produce index.html in its detected output folder.');
    include('app.cjs', await readFile(new URL('../src/static-server.cjs', import.meta.url)));
    await add(site, 'site');
  } else {
    const entry = await sourcePath(root, config.entry);
    let result;
    try { result = await build({
      entryPoints: [entry.path], bundle: true, write: false, platform: 'node',
      format: 'cjs', target: 'node22', minify: true, metafile: true, logLevel: 'silent',
      logOverride: { 'ignored-dynamic-import': 'warning' },
    }); } catch (error) {
      if(config.detected && config.package) return prepareContainer(root,dataDir,{...config,kind:'container',recipe:'node'});
      throw error;
    }
    const builtins = new Set(builtinModules.flatMap(x => [x, `node:${x}`]));
    for (const output of Object.values(result.metafile.outputs)) {
      for (const imp of output.imports) {
        // esbuild leaves a literal require intact when its missing-module error
        // is handled by the application. Preserve that fallback, without stubs.
        const optionalRequire = imp.kind === 'require-call' && result.warnings.some(warning =>
          warning.id === 'ignored-dynamic-import' && warning.text.startsWith(
            `Importing ${JSON.stringify(imp.path)} was allowed even though it could not be resolved because dynamic import failures appear to be handled here:`));
        if (imp.external && !builtins.has(imp.path) && !optionalRequire) {
          if(config.detected && config.package) return prepareContainer(root,dataDir,{...config,kind:'container',recipe:'node'});
          throw new Error(`Unbundled runtime dependency: ${imp.path}. Use an existing Dockerfile for this application.`);
        }
      }
    }
    include('app.cjs', result.outputFiles[0].contents);
    for (const asset of config.assets || []) {
      const path = (await sourcePath(root, asset)).path;
      await add(path, relative(root, path));
    }
  }
  if (new Set(files.map(f => f.path)).size !== files.length) throw new Error('Duplicate asset path');
  const payload = Buffer.from(JSON.stringify({ format: 1, entry: 'app.cjs', healthPath: config.healthPath, files }));
  if (payload.length > MAX_PAYLOAD) throw new Error('Artifact exceeds 50 MiB unpacked limit');
  const archive = gzipSync(payload, { level: 9 }), sha256 = digest(archive);
  if (archive.length > 20 * 1024 * 1024) throw new Error('Artifact exceeds 20 MiB download limit');
  const folder = resolve(dataDir, 'artifacts');
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, `${sha256}.gz`), archive);
  const manifest = {
    id: config.id, name: config.name, description: config.description || '', sha256,
    bytes: archive.length, unpackedBytes: payload.length, runtime: 'node22+',
    applicationType: config.kind, detected: config.detected,
    builtAt: new Date().toISOString(),
  };
  const temp = join(folder, `${config.id}.${uid()}.tmp`);
  await writeFile(temp, JSON.stringify(manifest, null, 2));
  await rename(temp, join(folder, `${config.id}.json`));
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await prepare(process.argv[2] || 'examples/notes'), null, 2));
}
