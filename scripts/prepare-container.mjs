import { parse } from 'yaml';
import { readFile, writeFile, mkdir, stat, rm, realpath } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync, createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { docker, validateContainers, IMAGE_LIMIT } from '../src/containers.mjs';
import { containerRecipe } from '../src/container-recipes.mjs';
import { sourcePath } from '../src/detect.mjs';
import { digest, uid } from '../src/util.mjs';

const slug = /^[a-z][a-z0-9_-]{0,62}$/;
function interpolate(value) {
  if(typeof value !== 'string')return value;
  return value.replace(/\$\{([^}]+)\}/g, (_,expr) => {
    const m=/^[A-Za-z_][A-Za-z0-9_]*:-([^$]*)$/.exec(expr);
    if(!m)throw new Error('Required environment values must be declared by the app. PODS does not copy server secrets into artifacts.');
    return m[1];
  });
}
export function normalizeCompose(doc) {
  if(!doc || typeof doc!=='object' || !doc.services || Object.keys(doc.services).length>8)throw new Error('Compose must declare 1–8 services.');
  if(Object.keys(doc).some(k=>!['name','version','services','volumes'].includes(k)&&!k.startsWith('x-')))throw new Error('Compose external networks, secrets and includes need a portable application definition.');
  for(const [key,v] of Object.entries(doc.volumes||{}))if(!slug.test(key)||v&&Object.keys(v).length)throw new Error('External volumes and volume drivers are not portable.');
  const services={},builds={},ports={};
  for(const [key,s] of Object.entries(doc.services)) {
    if(!slug.test(key)||!s||typeof s!=='object')throw new Error('Invalid Compose service name.');
    const allowed=['build','image','environment','command','entrypoint','volumes','depends_on','healthcheck','working_dir','ports','expose','restart','container_name'];
    if(Object.keys(s).some(k=>!allowed.includes(k)&&!k.startsWith('x-')))throw new Error(`Unsupported Compose option in ${key}. Host mounts, privileges and external credentials are not portable.`);
    const service={};
    if(s.image){if(typeof s.image!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9./_:@-]{0,300}$/.test(s.image))throw new Error('Invalid container image');service.image=s.image;}
    if(s.build){const b=typeof s.build==='string'?{context:s.build}:s.build;if(Object.keys(b).some(k=>!['context','dockerfile','args','target'].includes(k)))throw new Error('Unsupported Compose build option.');builds[key]=b;}
    if(!s.image&&!s.build)throw new Error('Every service needs an image or build definition.');
    if(s.environment){
      const entries=Array.isArray(s.environment)?s.environment.map(x=>{const i=x.indexOf('=');if(i<1)throw new Error('Inherited environment values are not portable.');return [x.slice(0,i),x.slice(i+1)];}):Object.entries(s.environment);
      service.environment=Object.fromEntries(entries.map(([k,v])=>{if(v===null||typeof v==='object')throw new Error('Environment values must be explicit.');return [k,interpolate(String(v))];}));
    }
    for(const k of ['command','entrypoint'])if(s[k]!==undefined){if(!Array.isArray(s[k]))throw new Error(`Compose ${k} must use its standard argument-array form.`);service[k]=s[k].map(interpolate);}
    if(s.working_dir)service.working_dir=s.working_dir;
    if(s.healthcheck){if(s.healthcheck.disable)throw new Error('Disabled healthchecks are not supported.');service.healthcheck=s.healthcheck;}
    if(s.depends_on)service.depends_on=Array.isArray(s.depends_on)?Object.fromEntries(s.depends_on.map(k=>[k,'service_started'])):Object.fromEntries(Object.entries(s.depends_on).map(([k,v])=>[k,v.condition || 'service_started']));
    service.volumes=(s.volumes||[]).map(v=>{
      if(typeof v==='string'){const [name,target,mode]=v.split(':');if(!slug.test(name)||!target||!Object.hasOwn(doc.volumes||{},name)||mode&&!['ro','rw'].includes(mode))throw new Error('Declare a named volume; source/host bind mounts cannot be delivered precompiled.');return {name,target,readOnly:mode==='ro'};}
      if(v.type!=='volume'||!Object.hasOwn(doc.volumes||{},v.source)||Object.keys(v).some(k=>!['type','source','target','read_only'].includes(k)))throw new Error('Only declared named volumes are portable.');
      return {name:v.source,target:v.target,readOnly:Boolean(v.read_only)};
    });
    ports[key]=(s.ports||[]).map(p=>{const n=Number(typeof p==='object'?p.target:String(p).split(':').at(-1).replace(/\/tcp$/,''));if(!Number.isInteger(n)||n<1||n>65535)throw new Error('Only TCP product ports are supported.');return n;});
    services[key]=service;
  }
  const candidates=Object.keys(services).filter(k=>ports[k].length&& !/^(?:db|database|postgres|mysql|mariadb|mongo|mongodb|redis|valkey)$/.test(k));
  const preferred=['web','frontend','app'].filter(k=>candidates.includes(k));
  const web=candidates.length===1?candidates[0]:preferred.length===1?preferred[0]:null;
  if(!web||ports[web].length!==1)throw new Error('Declare one web/frontend/app product port in the existing Compose file.');
  return {services,builds,web,port:ports[web][0]};
}

export async function prepareContainer(root, data, config) {
  await docker(['info','--format','{{.ServerVersion}}']);
  const folder=resolve(data,'artifacts'), imagesDir=resolve(data,'images'), scratch=resolve(data,'container-build');
  await Promise.all([mkdir(folder,{recursive:true}),mkdir(imagesDir,{recursive:true}),mkdir(scratch,{recursive:true})]);
  let plan;
  if(config.compose){
    const f=await sourcePath(root,config.compose);if(f.stat.size>256*1024)throw new Error('Compose file too large.');
    plan=normalizeCompose(parse(await readFile(f.path,'utf8'),{maxAliasCount:50}));
  } else plan={services:{web:{volumes:[{name:'app-data',target:'/data',readOnly:false}]}},builds:{web:{context:'.',dockerfile:config.dockerfile}},web:'web',port:8080};
  const images=[];
  for(const [key,service] of Object.entries(plan.services)) {
    const b=plan.builds[key];
    if(b){
      const context=(await sourcePath(root,b.context||'.')).path;
      let file;
      if(config.recipe){file=join(scratch,'Dockerfile');await writeFile(file,await containerRecipe(root,config.recipe));}
      else file=(await sourcePath(context,b.dockerfile||'Dockerfile')).path;
      const tag='pods-prepared-'+uid().toLowerCase().replace(/_/g,'-');
      const args=['build','--platform','linux/amd64','--tag',tag,'--file',file];
      if(b.target){if(!slug.test(b.target))throw new Error('Invalid build stage');args.push('--target',b.target);}
      for(const [k,v] of Object.entries(b.args||{})){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)||typeof v!=='string')throw new Error('Build arguments must have explicit string values');args.push('--build-arg',k+'='+interpolate(v));}
      args.push(context);await docker(args,{timeout:600000});service.image=tag;
    } else await docker(['pull','--platform','linux/amd64',service.image],{timeout:300000});
    const info=JSON.parse(await docker(['image','inspect',service.image]))[0];
    if(info.Os!=='linux'||info.Architecture!=='amd64')throw new Error('Prepared image must target Linux amd64.');
    service.image=info.Id;
    if(!config.compose){
      const ports=Object.keys(info.Config.ExposedPorts||{}).filter(p=>p.endsWith('/tcp')).map(p=>Number(p.split('/')[0]));
      if(ports.length===1)plan.port=ports[0];else if(ports.length>1)throw new Error('Dockerfile exposes multiple ports; an existing Compose file must identify the product port.');
    }
    if(images.some(i=>i.id===info.Id))continue;
    const tar=join(scratch,'image.tar'), gz=join(scratch,'image.gz');
    try{
      await docker(['save','--output',tar,info.Id],{timeout:180000});
      if((await stat(tar)).size>2*1024*1024*1024)throw new Error('Image exceeds 2 GiB unpacked.');
      await pipeline(createReadStream(tar),createGzip({level:1}),createWriteStream(gz));
      const bytes=(await stat(gz)).size;if(bytes>IMAGE_LIMIT)throw new Error('Image exceeds 512 MiB compressed.');
      const hash=createHash('sha256');for await(const chunk of createReadStream(gz))hash.update(chunk);const sha256=hash.digest('hex');
      await import('node:fs/promises').then(fs=>fs.rename(gz,join(imagesDir,sha256+'.gz')));
      images.push({id:info.Id,sha256,bytes});
    }finally{await rm(tar,{force:true});await rm(gz,{force:true});}
  }
  delete plan.builds;plan.images=images;validateContainers(plan);
  const archive=gzipSync(JSON.stringify({format:2,runtime:'docker',healthPath:config.healthPath||'/',containers:plan}));
  const sha256=digest(archive);
  await writeFile(join(folder,sha256+'.gz'),archive);
  const manifest={id:config.id,name:config.name,description:config.description||'',sha256,bytes:archive.length,runtime:'docker-linux-amd64',applicationType:'container',images,detected:config.detected,builtAt:new Date().toISOString()};
  await writeFile(join(folder,config.id+'.json'),JSON.stringify(manifest,null,2));
  return manifest;
}
