import {execFileSync} from 'node:child_process';
import {stat,readFile} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const app={"id": "repo-46d8ac316f3e95857ce28b48-d6da2ed780ae-04f62fea5403", "sha256": "04f62fea5403e11a5262471ed1fe76b0f279775263de7a047c1e3f550f445cf7", "images": [{"id": "sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672", "sha256": "41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a", "bytes": 57046835}, {"id": "sha256:1292844148b311e4ed4300022a996d39083f415a963e970cf47cad1b3b18e3a6", "sha256": "f078164d28ddf31c6ea97c0356b9eba598645ee7b47f02329b1e304bbea85d4f", "bytes": 104507545}]};
const docker=args=>execFileSync('docker',['--host','unix:///var/run/docker.sock',...args],{encoding:'utf8',timeout:15000,maxBuffer:16384,stdio:['ignore','pipe','pipe']}).trim();
const roots=[join(homedir(),'.local/share/pods-launch'),join(tmpdir(),`pods-launch-${process.getuid?.()||'user'}`)];
const images=[];
for(const image of app.images){let dockerPresent=false;try{dockerPresent=docker(['image','inspect',image.id,'--format','{{.Id}}'])===image.id;}catch(error){if(error.status!==1)throw Error('Image inspection failed');}
 const archives=[];for(let i=0;i<roots.length;i++){const p=join(roots[i],'images',image.sha256+'.gz');try{const s=await stat(p);archives.push({root:i===0?'persistent':'fallback',exists:true,bytes:s.size});}catch(e){if(e.code!=='ENOENT')throw e;archives.push({root:i===0?'persistent':'fallback',exists:false});}}
 images.push({...image,dockerPresent,archives});}
const p=join(roots[0],'cache',app.sha256+'.gz');let manifestCache=false;try{manifestCache=createHash('sha256').update(await readFile(p)).digest('hex')===app.sha256;}catch(e){if(e.code!=='ENOENT')throw e;}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),appId:app.id,images,manifestCache,allImageAndArchiveCachesAbsent:images.every(i=>!i.dockerPresent&&i.archives.every(a=>!a.exists)),readOnly:true}));
