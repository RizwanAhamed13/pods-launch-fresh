import { readFile, lstat, realpath, readdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute, basename, join } from 'node:path';

const sourceExtensions = ['js', 'cjs', 'mjs', 'ts', 'mts', 'cts'];

export async function sourcePath(root, path, { optional = false } = {}) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0')) {
    throw new Error('Application paths must be relative file paths.');
  }
  const target = resolve(root, path);
  const rel = relative(root, target);
  if (isAbsolute(path) || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) {
    throw new Error('Source path escapes application.');
  }
  try {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || await realpath(target) !== target) {
      throw new Error('Symlink application paths are not supported.');
    }
    return { path: target, stat };
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function readJSON(root, path) {
  const file = await sourcePath(root, path, { optional: true });
  if (!file) return null;
  if (!file.stat.isFile() || file.stat.size > 1024 * 1024) throw new Error(`${path} is not a valid application manifest.`);
  try { return JSON.parse(await readFile(file.path, 'utf8')); }
  catch { throw new Error(`${path} contains invalid JSON.`); }
}

export function entryFromStart(command) {
  if (!command) return null;
  // Inspect simple start commands; never evaluate shell text while detecting.
  const match = /^(?:(?:NODE_ENV=production|cross-env NODE_ENV=production)\s+)?(?:node|tsx|ts-node)\s+(?:--(?:enable-source-maps|experimental-strip-types)\s+)?["']?([a-zA-Z0-9_./-]+\.(?:[cm]?js|[cm]?ts))["']?\s*$/.exec(command.trim());
  return match?.[1] || null;
}

function metadata(root, pkg, overrides) {
  const name = overrides.name || pkg?.name?.replace(/^@[^/]+\//, '') || basename(root);
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  return {
    id: overrides.id || (slug.length >= 2 ? slug : `app-${slug || 'preview'}`),
    name: String(name).slice(0, 120),
    description: String(overrides.description ?? pkg?.description ?? '').slice(0, 500),
    healthPath: '/', detected: true,
  };
}

export async function detectApplication(source, overrides = {}) {
  const root = await realpath(resolve(source));
  const configured = await readJSON(root, 'pods.json');
  if (configured) return { kind: 'node', ...configured, ...overrides, detected: false };
  const pkg = await readJSON(root, 'package.json');
  const common = metadata(root, pkg, overrides);
  const dependencies = { ...pkg?.dependencies, ...pkg?.devDependencies };
  const has = async path => Boolean((await sourcePath(root, path, { optional: true }))?.stat.isFile());
  const build = typeof pkg?.scripts?.build === 'string' ? 'build' : null;
  const manager = String(pkg?.packageManager || 'npm').split('@')[0];
  if (pkg && manager !== 'npm') throw new Error(`This application uses ${manager}. Automatic preparation currently supports npm projects.`);
  const base = { ...common, package: Boolean(pkg), build };
  if ('vite' in dependencies || 'react-scripts' in dependencies) {
    if (!build) throw new Error('This frontend needs a build script in its existing package.json.');
    return { ...base, kind: 'static', outputCandidates: 'react-scripts' in dependencies ? ['build'] : ['dist'] };
  }
  if ('next' in dependencies || 'nuxt' in dependencies) {
    throw new Error('This server-rendered framework needs a runtime adapter that is not available yet. No application was published.');
  }
  const start = entryFromStart(pkg?.scripts?.start);
  if (pkg?.scripts?.start && !start) {
    throw new Error('The start command could not be detected safely. Use a simple node/tsx/ts-node entrypoint in package.json, or an optional pods.json override.');
  }
  let entry = start;
  if (!entry && typeof pkg?.main === 'string' && await has(pkg.main)) entry = pkg.main;
  if (!entry && !pkg && await has('index.html')) return { ...base, kind: 'static', outputCandidates: ['.'] };
  if (!entry) {
    for (const group of [['server', 'app', 'src/server', 'src/app'], ['index', 'src/index']]) {
      const found = [];
      for (const prefix of group) for (const ext of sourceExtensions) {
        const candidate = `${prefix}.${ext}`;
        if (await has(candidate)) found.push(candidate);
      }
      if (found.length > 1) throw new Error(`More than one application entrypoint was found (${found.join(', ')}). Select one with package.json's start script.`);
      if (found.length === 1) { entry = found[0]; break; }
    }
  }
  if (entry) {
    if (!build && !await has(entry)) throw new Error(`The start entrypoint ${entry} was not found.`);
    const assets = [];
    for (const path of ['public', 'static', 'views', 'templates']) {
      if ((await sourcePath(root, path, { optional: true }))?.stat.isDirectory()) assets.push(path);
    }
    return { ...base, kind: 'node', entry, assets };
  }
  for (const dir of ['dist', 'build', 'public', '.']) {
    if (await has(join(dir, 'index.html'))) return { ...base, kind: 'static', outputCandidates: [dir] };
  }
  const nested = [];
  for (const item of await readdir(root, { withFileTypes: true })) {
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && await has(`${item.name}/package.json`)) nested.push(item.name);
  }
  if (nested.length) throw new Error(`The repository contains applications in ${nested.join(', ')}. Choose the application folder.`);
  throw new Error('No supported web application was detected. This version detects Node/TypeScript servers, Vite/React frontends and static HTML sites.');
}
