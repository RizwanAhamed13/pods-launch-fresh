import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir, lstat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { digest } from '../src/util.mjs';
export async function prepare(source, dataDir = process.env.PODS_DATA || '.data') {
  const root = resolve(source), config = JSON.parse(await readFile(join(root, 'pods.json'), 'utf8'));
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(config.id)) throw new Error('Invalid app id');
  if (!config.name || (!/^\/[a-zA-Z0-9/_-]*$/.test(config.healthPath || '') || config.healthPath.includes('//'))) throw new Error('Set name and an HTTP healthPath in pods.json');
  function within(p) { const rel = relative(root, resolve(root, p)); if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Source path escapes application'); return resolve(root, p); }
  const result = await build({ entryPoints: [within(config.entry)], bundle: true, write: false, platform: 'node', format: 'cjs', target: 'node22', minify: true, metafile: true, logLevel: 'silent' });
  const { builtinModules } = await import('node:module');
  const builtins = new Set(builtinModules.flatMap(x => [x, `node:${x}`]));
  for (const output of Object.values(result.metafile.outputs)) for (const imp of output.imports) if (imp.external && !builtins.has(imp.path)) throw new Error(`Unbundled runtime dependency: ${imp.path}. Native dependencies are not supported yet.`);
  const files = [{ path: 'app.cjs', data: Buffer.from(result.outputFiles[0].contents).toString('base64') }];
  async function add(path) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error('Symlink assets are not supported');
    if (stat.isDirectory()) { for (const name of (await readdir(path)).sort()) await add(join(path, name)); }
    else { if (!stat.isFile()) throw new Error('Only regular file assets are supported'); files.push({ path: relative(root, path), data: (await readFile(path)).toString('base64') }); }
  }
  for (const asset of config.assets || []) await add(within(asset));
  if (new Set(files.map(f => f.path)).size !== files.length) throw new Error('Duplicate asset path');
  const payload = Buffer.from(JSON.stringify({ format: 1, entry: 'app.cjs', healthPath: config.healthPath, files }));
  if (payload.length > 50 * 1024 * 1024) throw new Error('Artifact exceeds 50 MiB unpacked limit');
  const archive = gzipSync(payload, { level: 9 }), sha256 = digest(archive);
  if (archive.length > 20 * 1024 * 1024) throw new Error('Artifact exceeds 20 MiB download limit');
  const folder = resolve(dataDir, 'artifacts'); await mkdir(folder, { recursive: true });
  await writeFile(join(folder, `${sha256}.gz`), archive);
  const manifest = { id: config.id, name: config.name, description: config.description || '', sha256, bytes: archive.length, unpackedBytes: payload.length, runtime: 'node22+', builtAt: new Date().toISOString() };
  const tmp = join(folder, `${config.id}.json.tmp`); await writeFile(tmp, JSON.stringify(manifest, null, 2));
  const { rename } = await import('node:fs/promises'); await rename(tmp, join(folder, `${config.id}.json`));
  return manifest;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await prepare(process.argv[2] || 'examples/notes'), null, 2));
