import subprocess,json,time,os,hashlib,shutil,sys
from pathlib import Path

ROOT=Path('/tmp/pods-registry-cdn-shared-v2-0791fe6'); REPO=Path('/home/aswin/pods-launch-fresh'); QA='pods-fresh-matrix-01'; LXC='/snap/lxd/current/bin/lxc'; DEVICE='pods-registry-cdn-shared-v2-0791fe6'
ROOT.mkdir(mode=0o700)
receipt={'scope':'Private OCI blob publication and actual integrated Docker CDN pulls in isolated QA; no native user compute or product timing','startedAt':time.time(),'sourceRevision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()};server=None;proxy_added=False
assert receipt['sourceRevision']=='0791fe68c4ed973bab1c11f3df5e2bec158291d6'
node=r'''import {createApp} from '/home/aswin/pods-launch-fresh/src/server.mjs';
import {GitHubImageDelivery} from '/home/aswin/pods-launch-fresh/src/image-delivery.mjs';
import {prepareRegistryForApp,registryIndex} from '/home/aswin/pods-launch-fresh/src/image-registry.mjs';
import {digest} from '/home/aswin/pods-launch-fresh/src/util.mjs';
import {randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const root='/tmp/pods-registry-cdn-shared-v2-0791fe6',data='/tmp/pods-registry-cdn-0791fe6/data';
const image={id:'sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672',sha256:'41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a',bytes:57046835};
process.env.PODS_BUILDS_ENABLED='0';
const app=await createApp({data,secret:randomBytes(32).toString('hex'),providers:{},registryEnabled:true});
const delivery=GitHubImageDelivery.fromEnv({data,store:app.store});if(!delivery)throw Error('Configured private delivery required');
const safeAsset=({id,name,size,digest,state})=>({id,name,size,digest,state});
const inventory=async()=>{const assets=await delivery.request(`releases/${delivery.releaseId}/assets?per_page=100`,{signal:AbortSignal.timeout(5000)});if(assets.length>=100)throw Error('QA inventory requires pagination');return assets.map(safeAsset);};
const before=await inventory(),after=await inventory(),publication={mode:'reuse-existing-verified-index-and-private-assets'},repeat={mode:'not-repeated'};
const mappings=app.store.list('image-delivery').map(({sha256,bytes,assetId})=>({sha256,bytes,assetId})).sort((a,b)=>a.sha256.localeCompare(b.sha256));
const preserved=JSON.stringify(before)===JSON.stringify(after);if(!preserved)throw Error('Asset inventory changed during read-only setup');
const index=await registryIndex(data,image),id=randomBytes(24).toString('base64url'),token=randomBytes(24).toString('base64url');
app.store.put('launch',id,{id,status:'starting',expiresAt:Date.now()+600000,tokenHash:digest(token),images:[image]});
const requests=[];
app.server.on('request',(req,res)=>{const phase=readFileSync(root+'/phase','utf8'),at=performance.now();res.on('finish',()=>requests.push({phase,elapsedMs:Math.round(performance.now()-at),method:req.method,kind:req.url.includes('/manifests/')?'manifest':req.url.includes('/blobs/')?'blob':req.url.includes('/artifact/images/')?'archive':'ping',status:res.statusCode,bytes:req.method==='HEAD'?0:Number(res.getHeader('content-length')||0),redirectHost:res.statusCode===307?new URL(String(res.getHeader('location'))).hostname:undefined}));});
await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
const port=app.server.address().port;
await writeFile(root+'/launch.json',JSON.stringify({id,token,image,artifactUrl:`http://127.0.0.1:${port}/api/agent/${id}/artifact`,registryImages:[image.sha256]}),{mode:0o600,flag:'wx'});
await writeFile(root+'/ready.json',JSON.stringify({port,image,publication,repeat,mappings,initialAssets:before.length,finalAssets:after.length,addedAssets:after.filter(a=>!before.some(b=>a.id===b.id)),existingAssetsPreserved:preserved,mappingsReused:true,members:index.members}),{mode:0o600,flag:'wx'});
process.on('SIGTERM',async()=>{await new Promise(resolve=>app.server.close(resolve));await app.closeResources();await writeFile(root+'/requests.json',JSON.stringify(requests,null,2));process.exit(0);});
'''

qa=r'''import subprocess,json,time,os,hashlib,threading,ssl,http.server,http.client,socket,shutil
from pathlib import Path
p=Path('/output/registry-cdn-shared-v2-0791fe6');p.mkdir(mode=0o700)
launch=Path('/tmp/pods-registry-cdn-shared-v2-launch.json');assert launch.stat().st_mode&0o777==0o600
metadata=json.loads(launch.read_text());image=metadata['image'];receipt={'runs':[],'scope':'Shared-base private CDN pull with TLS header inspection and unchanged45-second production pull limit'};daemons=[];proxy=None;tls_events=[];guard=threading.Lock()
def run(args,timeout=120,env=None):return subprocess.run(args,capture_output=True,text=True,timeout=timeout,env=env)
def main_images():
 r=run(['docker','image','ls','--quiet','--no-trunc']);assert r.returncode==0;return sorted(r.stdout.splitlines())
before=main_images()
def stop_process(name,process):
 if process.poll() is None:
  process.terminate()
  try:process.wait(timeout=20)
  except subprocess.TimeoutExpired:process.kill();process.wait();receipt.setdefault('forcedStops',[]).append(name)
 receipt.setdefault('stopped',{})[name]=process.poll() is not None
shim="""#!/usr/bin/python3
import os,sys
assert sys.argv[1:3]==['--host','unix:///var/run/docker.sock']
socket=os.environ['PODS_QA_SOCKET']
assert socket.startswith('unix:///output/registry-cdn-shared-v2-0791fe6/') and socket.endswith('/docker.sock')
os.execv('/usr/bin/docker',['docker','--host',socket,*sys.argv[3:]])
"""
(p/'bin').mkdir();(p/'bin/docker').write_text(shim);(p/'bin/docker').chmod(0o700)
client=r"""import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {prepareRuntimeImages} from '/output/registry-launch-candidate-adc78ff/src/container-runtime.mjs';
import {docker} from '/output/registry-launch-candidate-adc78ff/src/containers.mjs';
const root='/output/registry-cdn-shared-v2-0791fe6',socket=process.argv[2],phase=process.argv[3],config=JSON.parse(await readFile('/tmp/pods-registry-cdn-shared-v2-launch.json','utf8')),cache=root+'/runner-'+phase;
await mkdir(cache,{mode:0o700});const timings={};
await prepareRuntimeImages([config.image],config,cache,timings,(args,options)=>docker(args,{...options,env:{PATH:root+'/bin:'+process.env.PATH,HOME:root,PODS_QA_SOCKET:socket}}));
const result={timings,authDirectories:(await readdir(cache)).filter(n=>n.startsWith('.registry-auth-')).length,archiveFiles:(await readdir(cache+'/images')).length};
await writeFile(root+'/'+phase+'-result.json',JSON.stringify(result,null,2),{mode:0o600});
"""
(p/'client.mjs').write_text(client)
class Quiet(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def log_error(self,*args):pass
class Relay(Quiet):
 protocol_version='HTTP/1.1'
 def do_HEAD(self):self.forward()
 def do_GET(self):self.forward()
 def forward(self):
  began=time.monotonic();item={'startedAt':time.time(),'method':self.command,'authorizationPresent':bool(self.headers.get('Authorization')),'cookiePresent':bool(self.headers.get('Cookie')),'proxyAuthorizationPresent':bool(self.headers.get('Proxy-Authorization'))}
  try:
   assert self.headers.get('Host')=='release-assets.githubusercontent.com'
   assert self.path.startswith('/') and not self.path.startswith('//')
   assert not item['authorizationPresent'] and not item['cookiePresent'] and not item['proxyAuthorizationPresent'],'Unexpected credential header'
   conn=http.client.HTTPSConnection('release-assets.githubusercontent.com',443,timeout=45,context=ssl.create_default_context(cafile='/etc/ssl/certs/ca-certificates.crt'))
   conn.request(self.command,self.path,headers={k:v for k,v in self.headers.items() if k.lower() in ['user-agent','accept','accept-encoding','range']})
   response=conn.getresponse();item['firstResponseMs']=round((time.monotonic()-began)*1000);item['status']=response.status;self.send_response_only(response.status)
   for k,v in response.getheaders():
    if k.lower() not in ['connection','transfer-encoding','keep-alive']:self.send_header(k,v)
   self.send_header('Connection','close');self.end_headers();self.close_connection=True
   size=0;digest=hashlib.sha256()
   while True:
    chunk=response.read(1024*1024)
    if not chunk:break
    size+=len(chunk);digest.update(chunk);self.wfile.write(chunk)
   item.update(bytes=size,sha256=digest.hexdigest(),upstreamTlsVerified=True);conn.close()
  except Exception as error:
   item['errorType']=type(error).__name__;self.close_connection=True
  finally:
   item['elapsedMs']=round((time.monotonic()-began)*1000)
   with guard:tls_events.append(item)
class Connect(Quiet):
 def do_CONNECT(self):
  if self.path!='release-assets.githubusercontent.com:443':self.send_error(403);return
  self.connection.settimeout(60);self.send_response_only(200);self.end_headers()
  try:
   conn=ssl_server.wrap_socket(self.connection,server_side=True);Relay(conn,self.client_address,self.server);conn.close()
  except Exception as error:
   with guard:tls_events.append({'errorType':type(error).__name__,'stage':'tls-interception'})
  self.close_connection=True
try:
 cert=p/'ca.pem';key=p/'ca.key'
 r=run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(key),'-out',str(cert),'-days','1','-subj','/CN=release-assets.githubusercontent.com','-addext','subjectAltName=DNS:release-assets.githubusercontent.com','-addext','basicConstraints=critical,CA:TRUE']);assert r.returncode==0
 key.chmod(0o600);combined=p/'roots.pem';combined.write_bytes(Path('/etc/ssl/certs/ca-certificates.crt').read_bytes()+cert.read_bytes())
 ssl_server=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);ssl_server.load_cert_chain(cert,key)
 proxy=http.server.ThreadingHTTPServer(('127.0.0.1',0),Connect);threading.Thread(target=proxy.serve_forever,daemon=True).start()
 for mode in ['inspected-shared-base']:
  # Host phase is updated using the loopback control file by the outer supervisor.
  (p/'phase').write_text(mode)
  # Wait for supervisor acknowledgement so its request attribution is exact.
  deadline=time.monotonic()+20
  while not (p/(mode+'-ack')).exists():assert time.monotonic()<deadline,'Phase acknowledgement timeout';time.sleep(.1)
  d=p/mode;d.mkdir();cs=str(d/'containerd.sock');ds='unix://'+str(d/'docker.sock')
  env={'PATH':'/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin','HOME':'/root'}
  if mode=='inspected-shared-base':env.update(HTTPS_PROXY='http://127.0.0.1:'+str(proxy.server_address[1]),NO_PROXY='127.0.0.1,localhost',SSL_CERT_FILE=str(combined))
  (d/'containerd.toml').write_text('version = 3\ndisabled_plugins = ["io.containerd.cri.v1.images", "io.containerd.cri.v1.runtime"]\n')
  with (d/'containerd.log').open('w') as log:c=subprocess.Popen(['containerd','--config',str(d/'containerd.toml'),'--root',str(d/'containerd-root'),'--state',str(d/'containerd-state'),'--address',cs],stdout=log,stderr=subprocess.STDOUT,env=env);daemons.append((mode+'-containerd',c))
  def ctr(args):return run(['ctr','--address',cs,'--namespace','pods-registry-cdn',*args],10)
  deadline=time.monotonic()+20
  while ctr(['version']).returncode:assert c.poll() is None and time.monotonic()<deadline,'Private containerd readiness failed';time.sleep(.3)
  (d/'docker.json').write_text('{}')
  with (d/'docker.log').open('w') as log:engine=subprocess.Popen(['dockerd','--config-file',str(d/'docker.json'),'--data-root',str(d/'docker-data'),'--exec-root',str(d/'docker-exec'),'--pidfile',str(d/'docker.pid'),'--host',ds,'--containerd',cs,'--containerd-namespace','pods-registry-cdn','--containerd-plugins-namespace','pods-registry-cdn-plugins','--bridge','none','--iptables=false','--ip6tables=false','--ip-forward=false','--ip-masq=false'],stdout=log,stderr=subprocess.STDOUT,env=env);daemons.append((mode+'-docker',engine))
  def docker(args):return run(['docker','--host',ds,*args])
  deadline=time.monotonic()+25
  while True:
   assert engine.poll() is None and time.monotonic()<deadline,'Private Docker readiness failed';r=docker(['info','--format','{{json .}}'])
   if r.returncode==0:break
   time.sleep(.3)
  info=json.loads(r.stdout);assert info['DockerRootDir']==str(d/'docker-data')
  assert not docker(['image','ls','--quiet']).stdout.strip();assert not ctr(['content','ls','--quiet']).stdout.strip()
  blobs=d/'containerd-root/io.containerd.content.v1.content/blobs';assert not blobs.exists() or not any(x.is_file() for x in blobs.rglob('*'))
  base=Path('/output/layer-reuse-b75e0fb/base.gz');assert hashlib.sha256(base.read_bytes()).hexdigest()=='3f34e12c187fe7d2bdd50bb5910b72381a3b5d4d7c83633fa680fedea91d2032'
  r=docker(['load','--input',str(base)]);assert r.returncode==0
  assert docker(['image','inspect',image['id']]).returncode!=0
  result={'mode':mode,'engine':{k:info[k] for k in ['ServerVersion','Driver','DriverStatus']},'initialImages':0,'initialPhysicalBlobs':0,'verifiedFastapiBaseImported':True,'targetAbsentBeforePull':True};receipt['runs'].append(result)
  start=time.monotonic();r=run(['/opt/node/bin/node',str(p/'client.mjs'),ds,mode],150);(p/(mode+'-client.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,'Integrated runner failed; owned QA log retained'
  result.update(json.loads((p/(mode+'-result.json')).read_text()));result['elapsedMs']=round((time.monotonic()-start)*1000)
  assert result['timings']['imageRegistryPulls']==1 and result['timings']['imageRegistryFallbacks']==0 and result['timings']['imageOriginDownloads']==0
  assert result['authDirectories']==0 and result['archiveFiles']==0
  result['identityMatches']=docker(['image','inspect',image['id'],'--format','{{.Id}}']).stdout.strip()==image['id'];assert result['identityMatches']
  result['rootfs']=json.loads(docker(['image','inspect',image['id'],'--format','{{json .RootFS.Layers}}']).stdout)
  code='import importlib.metadata as m;print(m.version("flask"));print(m.version("pymysql"))'
  r=docker(['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','256m','--cpus','1','--pids-limit','64','--entrypoint','python',image['id'],'-B','-c',code]);result['runtimeCheck']={'exitCode':r.returncode,'output':r.stdout[-500:]};assert r.returncode==0
  assert not docker(['ps','--all','--quiet']).stdout.strip();result['remainingContainers']=0
  stop_process(mode+'-docker',engine);stop_process(mode+'-containerd',c)
 assert tls_events and all(not e.get('authorizationPresent') and not e.get('cookiePresent') and not e.get('proxyAuthorizationPresent') and e.get('status')==200 and e.get('upstreamTlsVerified') for e in tls_events)
 receipt['completed']=True
except Exception as error:receipt['failure']=str(error) or type(error).__name__;raise
finally:
 for name,process in reversed(daemons):stop_process(name,process)
 if proxy:proxy.shutdown();proxy.server_close()
 receipt['tlsInspection']=tls_events;receipt['existingQaImagesPreserved']=before==main_images()
 launch.unlink(missing_ok=True);(p/'ca.key').unlink(missing_ok=True)
 receipt['temporaryLaunchCredentialsRemoved']=not launch.exists();receipt['privateTestKeyRemoved']=not (p/'ca.key').exists()
 (p/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
'''

def lxc(args,**kwargs):return subprocess.run([LXC,*args],**kwargs)
def stop_server():
 if server is not None and server.poll() is None:
  server.terminate()
  try:server.wait(timeout=30)
  except subprocess.TimeoutExpired:server.kill();server.wait();receipt['serverForcedStop']=True
 receipt['serverStopped']=server is None or server.poll() is not None
before_devices=subprocess.check_output([LXC,'config','device','show',QA],text=True)
(ROOT/'server.mjs').write_text(node);(ROOT/'phase').write_text('publication')
try:
 with (ROOT/'server.log').open('w') as log:server=subprocess.Popen(['/home/aswin/pods-tools/node-v24.21.0-linux-x64/bin/node','--env-file=.env',str(ROOT/'server.mjs')],cwd=REPO,stdout=log,stderr=subprocess.STDOUT)
 deadline=time.monotonic()+300
 while not (ROOT/'ready.json').exists():
  assert server.poll() is None,'Private publication/server stopped before readiness; owned log retained'
  assert time.monotonic()<deadline,'Private publication readiness deadline'
  time.sleep(.5)
 ready=json.loads((ROOT/'ready.json').read_text());receipt['publication']=ready
 port=ready['port'];r=lxc(['config','device','add',QA,DEVICE,'proxy',f'listen=tcp:127.0.0.1:{port}',f'connect=tcp:127.0.0.1:{port}','bind=instance'],capture_output=True,text=True);assert r.returncode==0,'QA loopback proxy setup failed';proxy_added=True
 lxc(['file','push','--mode','0600',str(ROOT/'launch.json'),QA+'/tmp/pods-registry-cdn-shared-v2-launch.json'],check=True,capture_output=True)
 with (ROOT/'qa.stdout').open('w') as out,(ROOT/'qa.stderr').open('w') as err:
  worker=subprocess.Popen([LXC,'exec',QA,'--disable-stdin','--env','PATH=/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin','--','python3','-c',qa],stdout=out,stderr=err)
  seen=set();deadline=time.monotonic()+360
  while worker.poll() is None:
   assert time.monotonic()<deadline,'QA worker observation deadline'
   r=lxc(['exec',QA,'--disable-stdin','--','cat','/output/registry-cdn-shared-v2-0791fe6/phase'],capture_output=True,text=True)
   phase=r.stdout.strip()
   if r.returncode==0 and phase in ['inspected-shared-base'] and phase not in seen:
    (ROOT/'phase').write_text(phase)
    lxc(['exec',QA,'--disable-stdin','--','touch','/output/registry-cdn-shared-v2-0791fe6/'+phase+'-ack'],check=True,capture_output=True);seen.add(phase)
   time.sleep(.5)
  receipt['qaExitCode']=worker.returncode
 receipt['qa']=json.loads((ROOT/'qa.stdout').read_text());assert receipt['qaExitCode']==0 and receipt['qa']['completed']
 receipt['completed']=True
except Exception as error:receipt['failure']=str(error) or type(error).__name__;raise
finally:
 if proxy_added:
  r=lxc(['config','device','remove',QA,DEVICE],capture_output=True,text=True);receipt['ownedLoopbackProxyRemoved']=r.returncode==0
 receipt['qaDevicesPreserved']=before_devices==subprocess.check_output([LXC,'config','device','show',QA],text=True)
 stop_server()
 (ROOT/'launch.json').unlink(missing_ok=True);receipt['hostLaunchCredentialsRemoved']=not (ROOT/'launch.json').exists()
 if (ROOT/'requests.json').exists():receipt['requests']=json.loads((ROOT/'requests.json').read_text())
 receipt['finishedAt']=time.time();(ROOT/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
