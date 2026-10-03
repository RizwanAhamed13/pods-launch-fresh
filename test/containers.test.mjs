import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { mkdtemp, readFile, readdir, writeFile, rm, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateContainers, runtimeCompose } from '../src/containers.mjs';
import { normalizeCompose, prepareImage, preparedImageTag } from '../scripts/prepare-container.mjs';
import { decodeArtifact } from '../src/runner.mjs';
import { validateBuildOutput } from '../src/builds.mjs';
import { detectApplication } from '../src/detect.mjs';
import { parseRepository } from '../src/repository.mjs';
import { digest } from '../src/util.mjs';
import { launchCompose, containersAlive, prepareRuntimeImages } from '../src/container-runtime.mjs';
import { containerRecipe } from '../src/container-recipes.mjs';

test('base64url preparation identities ending in separators produce valid Docker repository names',()=>{
  for(const id of ['ohnantgou5lpvrk7fgehgxkxkifa3i0-','_ABC__def_','prefix--suffix-']){
    assert.match(preparedImageTag(id),/^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/);
  }
});

test('image preparation retries only transient transport failures once within its original deadline',async()=>{
  const args=['build','--tag','fixture','.'], calls=[];
  const result=await prepareImage(args,{timeout:10000},async(a,o)=>{calls.push({a,o});if(calls.length===1)throw new Error('failed to copy: read tcp: connection reset by peer');return 'prepared';},async()=>{});
  assert.equal(result,'prepared');assert.equal(calls.length,2);assert.deepEqual(calls[1].a,args);assert.ok(calls[1].o.timeout<=10000&&calls[1].o.timeout>0);
  for(const message of ['image: not found','access denied','TypeScript compilation failed']){
    let attempts=0;await assert.rejects(()=>prepareImage(['pull','missing'],{timeout:10000},async()=>{attempts++;throw new Error(message);},async()=>{}));assert.equal(attempts,1);
  }
  let attempts=0;await assert.rejects(()=>prepareImage(['pull','fixture'],{timeout:10000},async()=>{attempts++;throw new Error('unexpected EOF');},async()=>{}),/unexpected EOF/);assert.equal(attempts,2);
  attempts=0;await assert.rejects(()=>prepareImage(args,{timeout:10000},async()=>{attempts++;throw new Error('Parse error: unexpected EOF');},async()=>{}),/unexpected EOF/);assert.equal(attempts,1);
});

test('prepared Node servers select existing production scripts instead of Angular or Nest development servers',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-production-start-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const pkg={scripts:{build:'ng build',start:'ng serve','serve:ssr:product':'node dist/product/server/server.mjs'},dependencies:{'@angular/ssr':'22.2.1'}};
  const save=()=>writeFile(join(root,'package.json'),JSON.stringify(pkg));await save();
  assert.match(await containerRecipe(root,'node'),/CMD \["npm","run","serve:ssr:product"\]/);
  pkg.scripts['serve:ssr:other']='node dist/other/server/server.mjs';await save();
  await assert.rejects(()=>containerRecipe(root,'node'),/multiple production servers/);
  delete pkg.scripts['serve:ssr:other'];delete pkg.scripts['serve:ssr:product'];await save();
  await assert.rejects(()=>containerRecipe(root,'node'),/ng serve rebuilds/);
  pkg.dependencies={'@nestjs/core':'11'};pkg.scripts={build:'nest build',start:'nest start','start:prod':'node dist/main.js'};await save();
  assert.match(await containerRecipe(root,'node'),/CMD \["npm","run","start:prod"\]/);
});

test('Adonis and Nest preserve framework runtime files even with a direct node start command',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-framework-runtime-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const dependency of ['@adonisjs/core','@nestjs/core']){
    await writeFile(join(root,'package.json'),JSON.stringify({scripts:{start:'node bin/server.js'},dependencies:{[dependency]:'latest'}}));
    const detected=await detectApplication(root);
    assert.equal(detected.kind,'container');assert.equal(detected.recipe,'node');
  }
});

test('Nuxt standalone packaging preserves the npm lifecycle and leaves custom runtimes intact',async t=>{
  const root=await realpath(await mkdtemp(join(tmpdir(),'pods-nuxt-runtime-')));t.after(()=>rm(root,{recursive:true,force:true}));
  const pkg={scripts:{build:'nuxt build',start:'node .output/server/index.mjs'},dependencies:{nuxt:'4.5.2'}};
  const recipe=async value=>{await writeFile(join(root,'package.json'),JSON.stringify(value));return containerRecipe(root,'node');};
  const optimized=await recipe(pkg);
  assert.match(optimized,/COPY --from=build \/app\/\.output \.\/\.output/);
  assert.match(optimized,/COPY --from=build \/app\/package.json/);assert.match(optimized,/CMD \["npm","run","start"\]/);
  assert.match(await recipe({...pkg,scripts:{...pkg.scripts,start:'node ./.output/server/index.mjs'}}),/COPY --from=build/);
  for(const scripts of [{...pkg.scripts,prestart:'node migrate.js'},{...pkg.scripts,poststart:'node cleanup.js'},{...pkg.scripts,start:'node custom-server.mjs'},{start:pkg.scripts.start}])
    assert.doesNotMatch(await recipe({...pkg,scripts}),/COPY --from=build/);
  assert.doesNotMatch(await recipe({...pkg,dependencies:{express:'5.1.0'}}),/COPY --from=build/);
  await writeFile(join(root,'.npmrc'),'node-options=--enable-source-maps\n');
  assert.doesNotMatch(await recipe(pkg),/COPY --from=build/);
});

const blob=Buffer.from('prepared image test data');
const image={id:'sha256:'+'a'.repeat(64),sha256:digest(blob),bytes:blob.length};
function plan(){return {web:'web',port:8000,images:[image],services:{web:{image:image.id,depends_on:{db:'service_healthy'}},db:{image:image.id,volumes:[{name:'records',target:'/var/lib/db',readOnly:false}],healthcheck:{test:['CMD','check'],interval:'2s',timeout:'1s',retries:20}}}};}

test('image delivery distinguishes verified download, archive reuse and installed-image reuse',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-image-phases-'));t.after(()=>rm(root,{recursive:true,force:true}));
  let requests=0,loaded=false,loads=0;
  const server=createServer((req,res)=>{requests++;assert.equal(req.url,'/artifact/images/'+image.sha256);assert.equal(req.headers.authorization,'Bearer test-capability');res.end(blob);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const config={id:'launch-one',artifactUrl:`http://127.0.0.1:${server.address().port}/artifact`,token:'test-capability'};
  const execute=async args=>{if(args[0]==='load'){loads++;assert.deepEqual(await readFile(args[2]),blob);loaded=true;return '';}if(!loaded)throw new Error('image absent');return image.id;};
  const cold={};await prepareRuntimeImages([image],config,root,cold,execute);
  assert.equal(requests,1);assert.equal(loads,1);assert.equal(cold.imageCacheHits,0);assert.equal(cold.imageArchiveCacheHits,0);
  for(const key of ['imagesMs','imageCacheCheckMs','imageDownloadMs','imageLoadMs'])assert.ok(Number.isInteger(cold[key])&&cold[key]>=0);
  assert.deepEqual(await readdir(join(root,'images')),[]);
  const warm={};await prepareRuntimeImages([image],config,root,warm,execute);
  assert.equal(warm.imageCacheHits,1);assert.equal(warm.imageDownloadMs,0);assert.equal(warm.imageLoadMs,0);assert.equal(requests,1);assert.equal(loads,1);
  loaded=false;await writeFile(join(root,'images',image.sha256+'.gz'),blob);
  const archive={};await prepareRuntimeImages([image],config,root,archive,execute);
  assert.equal(archive.imageArchiveCacheHits,1);assert.equal(archive.imageDownloadMs,0);assert.equal(requests,1);assert.equal(loads,2);
  loaded=false;await writeFile(join(root,'images',image.sha256+'.gz'),Buffer.alloc(blob.length));
  const corruptCache={};await prepareRuntimeImages([image],config,root,corruptCache,execute);
  assert.equal(corruptCache.imageArchiveCacheHits,0);assert.equal(requests,2);assert.equal(loads,3);
});

test('image timing keeps integrity failures visible without loading unverified bytes',async t=>{
  const root=await mkdtemp(join(tmpdir(),'pods-image-integrity-'));t.after(()=>rm(root,{recursive:true,force:true}));
  let response=Buffer.alloc(blob.length),loads=0,loaded=false;
  const server=createServer((req,res)=>res.end(response));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const config={id:'launch-two',artifactUrl:`http://127.0.0.1:${server.address().port}/artifact`,token:'test-capability'};
  const execute=async args=>{if(args[0]==='load'){loads++;loaded=true;return '';}if(!loaded)throw new Error('image absent');return 'sha256:'+'b'.repeat(64);};
  for(const bytes of [Buffer.alloc(blob.length),blob.subarray(1),Buffer.concat([blob,Buffer.from('extra')])]){
    response=bytes;const timings={};
    await assert.rejects(prepareRuntimeImages([image],config,root,timings,execute),/integrity check failed|exceeds declared size/);
    assert.equal(loads,0);assert.equal(timings.imageLoadMs,0);assert.ok(Number.isInteger(timings.imageDownloadMs));
    assert.deepEqual(await readdir(join(root,'images')),[]);
  }
  response=blob;const timings={};
  await assert.rejects(prepareRuntimeImages([image],config,root,timings,execute),/Loaded image identity mismatch/);
  assert.equal(loads,1);assert.ok(Number.isInteger(timings.imageLoadMs));
});

test('runtime readiness requires the worker and healthy database even while the web service runs',async()=>{
  const p=plan();p.services.worker={image:image.id};
  const base=Object.keys(p.services).map(service=>({service,status:'running',running:true,...(service==='db'?{health:'healthy'}:{})}));
  const check=async containers=>containersAlive(p,['compose'],async args=>args[1]==='ps'?(containers.length?'web\ndb\nworker':''):containers.map(c=>JSON.stringify(c)).join('\n'));
  assert.equal(await check(base),true);
  for(const [name,change] of [['worker',{status:'exited',running:false,exitCode:0}],['db',{health:'unhealthy'}],['db',{health:'starting'}],['worker',{paused:true}],['worker',{restarting:true}],['web',{status:'exited',running:false,exitCode:0}]]){
    const states=structuredClone(base);Object.assign(states.find(c=>c.service===name),change);
    assert.equal(await check(states),false,`${name}: ${JSON.stringify(change)}`);
  }
  assert.equal(await check(base.slice(0,2)),false);assert.equal(await check([]),false);
  const duplicate=structuredClone(base[2]);duplicate.status='dead';assert.equal(await check([...base,duplicate]),false);
});

test('successful one-time dependencies stay valid but failed migrations and stopped web services fail',async()=>{
  const p=plan();p.services.web.depends_on.migrate='service_completed_successfully';p.services.migrate={image:image.id};
  const states=[{service:'web',status:'running',running:true},{service:'db',status:'running',running:true,health:'healthy'},{service:'migrate',status:'exited',running:false,exitCode:0}];
  const check=()=>containersAlive(p,['compose'],async args=>args[1]==='ps'?'web\ndb\nmigrate':states.map(c=>JSON.stringify(c)).join('\n'));
  assert.equal(await check(),true);
  states[2].exitCode=1;assert.equal(await check(),false);
  states[2].exitCode=0;states[2].oomKilled=true;assert.equal(await check(),false);
  states[2].oomKilled=false;p.services.migrate.depends_on={web:'service_completed_successfully'};
  Object.assign(states[0],{status:'exited',running:false,exitCode:0});assert.equal(await check(),false);
});

test('stale resumed container task retries once without rebuilding; other application failures do not retry',async()=>{
  const events=[],timings={};let attempts=0;
  await launchCompose(['compose','--project-name','test'],async()=>events.push('stop'),timings,async args=>{events.push(args);if(++attempts===1)throw new Error('OCI runtime create failed: runc create failed: container with given ID already exists');});
  assert.equal(attempts,2);assert.equal(events[1],'stop');assert.equal(timings.runtimeRetries,1);
  assert.ok(events[0].includes('--no-build'));assert.ok(!events.flat().includes('--volumes'));
  let stopped=false;
  await assert.rejects(()=>launchCompose([],async()=>{stopped=true;},{},async()=>{throw new Error('Database health failed');}),/Database health failed/);
  assert.equal(stopped,false);
});

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

test('Angular SSR receives the exact provider preview host and local health hosts at runtime',()=>{
  const p=plan();p.services.web.environment={NG_ALLOWED_HOSTS:'existing.example'};
  for(const url of ['https://8080-cs-example.cloudshell.dev/','https://example-8080.app.github.dev/']){
    const compose=runtimeCompose(p,'pods-'+'d'.repeat(24),8080,url);
    assert.deepEqual(compose.services.web.environment.NG_ALLOWED_HOSTS.split(','),['existing.example','localhost','127.0.0.1',new URL(url).hostname]);
    assert.equal(compose.services.db.environment.NG_ALLOWED_HOSTS,undefined);
  }
  assert.equal(runtimeCompose(plan(),'pods-'+'d'.repeat(24),8080).services.web.environment.NG_ALLOWED_HOSTS,'localhost,127.0.0.1');
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
