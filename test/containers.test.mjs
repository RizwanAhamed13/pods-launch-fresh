import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateContainers, runtimeCompose } from '../src/containers.mjs';
import { normalizeCompose } from '../scripts/prepare-container.mjs';
import { decodeArtifact } from '../src/runner.mjs';
import { validateBuildOutput } from '../src/builds.mjs';
import { detectApplication } from '../src/detect.mjs';
import { parseRepository } from '../src/repository.mjs';
import { digest } from '../src/util.mjs';

const blob=Buffer.from('prepared image test data');
const image={id:'sha256:'+'a'.repeat(64),sha256:digest(blob),bytes:blob.length};
function plan(){return {web:'web',port:8000,images:[image],services:{web:{image:image.id,depends_on:{db:'service_healthy'}},db:{image:image.id,volumes:[{name:'records',target:'/var/lib/db',readOnly:false}],healthcheck:{test:['CMD','check'],interval:'2s',timeout:'1s',retries:20}}}};}

test('container artifact is integrity checked, bounded and rejects host access or missing dependencies',()=>{
  const value={format:2,runtime:'docker',healthPath:'/',containers:plan()};
  const bytes=gzipSync(JSON.stringify(value));assert.deepEqual(decodeArtifact(bytes,digest(bytes)),value);
  assert.throws(()=>decodeArtifact(bytes,'b'.repeat(64)),/integrity/);
  for(const change of [p=>p.services.web.privileged=true,p=>p.services.web.image='postgres:latest',p=>p.services.db.volumes[0].name='/host',p=>p.services.web.depends_on={missing:'service_started'},p=>p.services.db.depends_on={web:'service_started'},p=>p.images[0]={...image,bytes:2**31}]){const p=plan();change(p);assert.throws(()=>validateContainers(p));}
});

test('runtime exposes only the product, never rebuilds/pulls, and keeps named database volumes',()=>{
  const project='pods-'+'d'.repeat(24), a=runtimeCompose(plan(),project,8080), b=runtimeCompose(plan(),project,8081);
  assert.deepEqual(a.services.web.ports,[{target:8000,published:'8080',host_ip:'0.0.0.0',protocol:'tcp'}]);
  assert.equal(a.services.db.ports,undefined);assert.equal(a.services.web.build,undefined);
  assert.equal(a.services.db.pull_policy,'never');assert.deepEqual(a.volumes,b.volumes);assert.deepEqual(a.volumes,{records:{}});
  assert.equal(a.services.web.depends_on.db.condition,'service_healthy');
  assert.deepEqual(a.services.db.security_opt,['no-new-privileges:true']);
});

test('Compose detects the web service, database dependency, explicit defaults and portable storage',()=>{
  const doc={services:{web:{build:'.',ports:['3000:8000'],environment:{DATABASE_URL:'postgres://db/test',MODE:'${MODE:-preview}'},depends_on:{db:{condition:'service_healthy'}}},db:{image:'postgres:17-alpine',ports:['5432:5432'],volumes:['records:/var/lib/postgresql/data']}},volumes:{records:{}}};
  const p=normalizeCompose(doc);assert.equal(p.web,'web');assert.equal(p.port,8000);assert.equal(p.services.web.environment.MODE,'preview');assert.equal(p.services.db.volumes[0].name,'records');
  for(const change of [d=>d.services.web.privileged=true,d=>d.services.web.volumes=['/home:/host'],d=>d.services.web.environment={PASSWORD:'${PRIVATE_SECRET}'},d=>d.services.web.env_file='.env',d=>d.volumes.records={external:true},d=>d.services.web.build={context:'.',secrets:['token']}]){const d=structuredClone(doc);change(d);assert.throws(()=>normalizeCompose(d));}
});

test('publication verifies every separate image and binds data identity to the repository folder',()=>{
  const repo=parseRepository('https://github.com/example/app','frontend');
  const bytes=gzipSync(JSON.stringify({format:2,runtime:'docker',healthPath:'/',containers:plan()}));
  const result={id:'repo-'+repo.key,sha256:digest(bytes),bytes:bytes.length,applicationType:'container',source:{url:repo.url,folder:repo.folder,revision:'a'.repeat(40)},verification:{status:200,documentPath:'/',contentType:'text/html'}};
  const blobs=[{sha256:image.sha256,bytes:blob}];
  const published=validateBuildOutput(repo,result,bytes,blobs);assert.deepEqual(published.images,[image]);assert.equal(published.dataKey,'repo-'+repo.key);
  assert.throws(()=>validateBuildOutput(repo,result,bytes),/integrity/);
  assert.throws(()=>validateBuildOutput(repo,result,bytes,[{sha256:image.sha256,bytes:Buffer.from('changed')}]),/integrity/);
});

test('Angular browser output, SSR and non-Node runtimes use the correct preparation paths',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-stacks-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const pkg={name:'angular-example',scripts:{build:'ng build'},dependencies:{'@angular/core':'22.2.1'}};
  await writeFile(join(root,'package.json'),JSON.stringify(pkg));
  await writeFile(join(root,'angular.json'),JSON.stringify({projects:{product:{projectType:'application',architect:{build:{options:{outputPath:'dist/product'}}}}}}));
  assert.deepEqual((await detectApplication(root)).outputCandidates,['dist/product/browser','dist/product']);
  pkg.dependencies['@angular/ssr']='22.2.1';await writeFile(join(root,'package.json'),JSON.stringify(pkg));assert.equal((await detectApplication(root)).recipe,'node');
  await rm(join(root,'package.json'));await writeFile(join(root,'go.mod'),'module product\ngo 1.24');assert.equal((await detectApplication(root)).recipe,'go');
  await writeFile(join(root,'Dockerfile'),'FROM scratch');assert.equal((await detectApplication(root)).dockerfile,'Dockerfile');
});
