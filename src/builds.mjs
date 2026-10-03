import { mkdir, readFile, writeFile, rename, rm, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseRepository } from './repository.mjs';
import { decodeArtifact } from './runner.mjs';
import { digest, uid } from './util.mjs';
import { IMAGE_TOTAL_LIMIT } from './containers.mjs';

const terminal = new Set(['ready', 'failed']);
const fail = (status, message) => Object.assign(new Error(message), { status });
export const publicBuild = ({ owner, account, ...build }) => build;

// All fields crossing from the disposable container are untrusted. Reconstruct,
// rather than spread, the manifest which becomes public control-plane metadata.
export function validateBuildOutput(repository, result, bytes, blobs = []) {
  if (!result || result.id !== `repo-${repository.key}` ||
      result.source?.url !== repository.url || result.source?.folder !== repository.folder ||
      !/^[a-f0-9]{40}$/.test(result.source?.revision || '') ||
      !/^[a-f0-9]{64}$/.test(result.sha256 || '') || result.bytes !== bytes.length) {
    throw new Error('Build output did not match the submitted repository or artifact.');
  }
  const artifact = decodeArtifact(bytes, result.sha256);
  if (!['node', 'static', 'container'].includes(result.applicationType) || result.verification?.status !== 200 ||
      result.verification?.documentPath !== '/' ||
      !/^(?:text\/html|application\/json)(?:;|$)/i.test(result.verification?.contentType || '')) {
    throw new Error('Build output did not include a valid product document verification.');
  }
  const api=/^application\/json/i.test(result.verification.contentType), docs=result.verification.apiDocumentation;
  if(docs!==undefined && (!api||docs?.path!=='/docs'||docs?.schemaPath!=='/openapi.json'||!/^3\.\d+\.\d+$/.test(docs?.schemaVersion)||docs?.status!==200||docs?.contentType!=='text/html'))throw new Error('Build output did not include valid API documentation verification.');
  const images=artifact.containers?.images || [];
  if((artifact.format===2)!==(result.applicationType==='container'))throw new Error('Artifact runtime mismatch');
  if(images.length!==blobs.length || images.some(i=>!blobs.some(b=>b.sha256===i.sha256&&b.bytes.length===i.bytes&&digest(b.bytes)===i.sha256)))throw new Error('Prepared image integrity check failed');
  const clean = (text, limit) => typeof text === 'string' ? text.replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, limit) : '';
  const revision = result.source.revision;
  return {
    id: `repo-${repository.key}-${revision.slice(0, 12)}-${result.sha256.slice(0, 12)}`,
    name: clean(result.name, 100) || repository.name,
    description: clean(result.description, 300),
    sha256: result.sha256, bytes: bytes.length, files: artifact.files?.length || 0,
    healthPath: artifact.healthPath, applicationType: result.applicationType, runtime: artifact.format===2?'docker-linux-amd64':'node22+',
    dataKey:`repo-${repository.key}`, ...(images.length?{images} : {}),
    productType: api?'api':'web', productPath:docs?'/docs':'/',
    source: { url: repository.url, folder: repository.folder, revision },
    verification: { documentPath: '/', status: 200, title: clean(docs?.title||result.verification.title, 150), ...(docs?{apiDocumentation:{path:'/docs',schemaPath:'/openapi.json',schemaVersion:docs.schemaVersion}}:{}) },
    preparedAt: new Date().toISOString(),
  };
}

export async function publishArtifact(data, manifest, bytes, blobs = []) {
  const directory = join(data, 'artifacts');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if(blobs.length){
    const images=join(data,'images');await mkdir(images,{recursive:true,mode:0o700});
    for(const blob of blobs){
      if(!/^[a-f0-9]{64}$/.test(blob.sha256)||digest(blob.bytes)!==blob.sha256)throw new Error('Prepared image integrity check failed');
      const target=join(images,blob.sha256+'.gz'),temporary=target+'.'+uid();
      try{await writeFile(temporary,blob.bytes,{flag:'wx',mode:0o600});await rename(temporary,target);}finally{await rm(temporary,{force:true});}
    }
  }
  const archive = join(directory, manifest.sha256 + '.gz');
  const metadata = join(directory, manifest.id + '.json');
  // Repeated preparation of the same revision and bytes keeps its original link.
  try {
    const previous = JSON.parse(await readFile(metadata, 'utf8'));
    decodeArtifact(await readFile(archive), manifest.sha256);
    if (previous.sha256 !== manifest.sha256) throw new Error('Published version collision.');
    return previous;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temp = join(directory, '.publish-' + uid());
  try {
    await writeFile(temp, bytes, { flag: 'wx', mode: 0o600 });
    await rename(temp, archive);
    await writeFile(temp, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await rename(temp, metadata); // Readers see a version only after its archive exists.
    return manifest;
  } finally { await rm(temp, { force: true }); }
}

export class BuildManager {
  constructor({ store, data, adapter, origin, maxPending = 4, accountLimit = 3, globalLimit = 12 }) {
    Object.assign(this, { store, data, adapter, origin, maxPending, accountLimit, globalLimit });
    this.pending = [];
    this.closed = false;
    this.fault = null;
    this.running = null;
  }

  async initialize() {
    await this.adapter.initialize();
    for (const build of this.store.list('build')) {
      if (!terminal.has(build.status)) this.update(build.id, { status: 'failed', error: 'Preparation was interrupted by a server restart. Submit the repository again.' });
    }
  }

  update(id, patch) {
    const current = this.store.get('build', id);
    if (current) this.store.put('build', id, { ...current, ...patch, updatedAt: Date.now() });
  }

  own(owner, id) {
    const build = this.store.get('build', id);
    if (!build || build.owner !== owner) throw fail(404, 'Preparation not found.');
    return publicBuild(build);
  }

  list(owner) {
    return this.store.list('build').filter(b => b.owner === owner).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20).map(publicBuild);
  }

  submit(owner, identity, input) {
    if (this.closed || this.fault) throw fail(503, 'The preparation service is unavailable. Please try again later.');
    let repository;
    try { repository = parseRepository(input.url, input.folder || ''); }
    catch (error) { throw fail(400, error.message); }
    const account = digest(identity);
    const all = this.store.list('build');
    const active = all.find(b => b.owner === owner && !terminal.has(b.status));
    if (active) {
      if (active.repository.key === repository.key) return publicBuild(active);
      throw fail(409, 'Your previous preparation is still running. Wait for it to finish.');
    }
    if (all.some(b => b.account === account && !terminal.has(b.status))) throw fail(409, 'This account already has a preparation in progress.');
    const recent = all.filter(b => b.createdAt > Date.now() - 3600000);
    if (recent.length >= this.globalLimit || recent.filter(b => b.account === account).length >= this.accountLimit) {
      throw fail(429, 'Preparation limit reached. Please try again in an hour.');
    }
    if (this.pending.length + (this.running ? 1 : 0) >= this.maxPending) throw fail(429, 'The preparation queue is full. Please try again shortly.');
    const now = Date.now();
    const build = { id: uid(), owner, account, repository, status: 'queued', createdAt: now, updatedAt: now };
    this.store.put('build', build.id, build);
    this.pending.push(build.id);
    this.startNext();
    return publicBuild(build);
  }

  startNext() {
    if (this.running || this.closed || this.fault || !this.pending.length) return;
    const id = this.pending.shift();
    this.running = this.execute(id).finally(() => { this.running = null; this.startNext(); });
  }

  async execute(id) {
    try {
      const directory = join(this.data, 'artifacts');
      await mkdir(directory, { recursive: true });
      const entries = await readdir(directory);
      const sizes = await Promise.all(entries.filter(n => n.endsWith('.gz')).map(n => stat(join(directory, n)).then(s => s.size)));
      if (entries.filter(n => n.endsWith('.json')).length >= 100 || sizes.reduce((a, b) => a + b, 0) > 256 * 1024 * 1024) {
        throw new Error('Prepared application storage is full. Contact the PODS operator.');
      }
      const build = this.store.get('build', id);
      this.update(id, { status: 'preparing', startedAt: Date.now() });
      const result = await this.adapter.build(build.repository, stage => {
        if (['fetching', 'detecting', 'installing', 'compiling', 'packaging', 'verifying'].includes(stage)) this.update(id, { status: stage });
      });
      const imageDir=join(this.data,'images');await mkdir(imageDir,{recursive:true});
      const storedImages=await readdir(imageDir), imageSizes=await Promise.all(storedImages.filter(n=>n.endsWith('.gz')).map(n=>stat(join(imageDir,n)).then(s=>s.size)));
      if(imageSizes.reduce((a,b)=>a+b,0)+(result.blobs||[]).reduce((a,b)=>a+b.bytes.length,0)>5*IMAGE_TOTAL_LIMIT)throw new Error('Prepared image storage is full.');
      this.update(id, { status: 'publishing' });
      const manifest = validateBuildOutput(build.repository, result.manifest, result.bytes, result.blobs);
      const published = await publishArtifact(this.data, manifest, result.bytes, result.blobs);
      this.update(id, { status: 'ready', finishedAt: Date.now(), app: published, launchUrl: this.origin + '/launch/' + published.id });
    } catch (error) {
      this.update(id, { status: 'failed', finishedAt: Date.now(), error: String(error.message).slice(-500) });
      if (error.cleanupFailed) {
        this.fault = error.message;
        for (const queued of this.pending.splice(0)) this.update(queued, { status: 'failed', error: 'Preparation is unavailable while the operator restores builder isolation.' });
      }
    }
  }

  async close() {
    this.closed = true;
    for (const id of this.pending.splice(0)) this.update(id, { status: 'failed', error: 'The server is restarting. Submit the repository again.' });
    await this.running;
    await this.adapter.close();
  }
}
