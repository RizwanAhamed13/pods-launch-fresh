import gzip, json, subprocess
from pathlib import Path

artifact = json.loads(gzip.decompress(Path('/output/streamlit/artifact.gz').read_bytes()))
image = artifact['containers']['images'][0]['id']
source = r'''
import os, sys, subprocess, socket, time, json, urllib.request
import streamlit
from streamlit import config
assert config.get_option('server.enableCORS') is True
assert config.get_option('server.enableXsrfProtection') is True
results=[]
for configured in [False, True]:
    env=dict(os.environ)
    if configured:
        env['STREAMLIT_BROWSER_SERVER_ADDRESS']='preview.example.test'
    server=subprocess.Popen(['streamlit','run','app.py','--server.port=8080','--server.address=127.0.0.1','--server.headless=true'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try:
                with urllib.request.urlopen('http://127.0.0.1:8080/_stcore/health',timeout=1) as r:
                    if r.status==200: break
            except Exception: time.sleep(.1)
        else: raise RuntimeError('Streamlit did not start')
        for origin, expected in [('https://preview.example.test',101 if configured else 403),('https://unrelated.example.test',403),('http://localhost:8080',101)]:
            request=('GET /_stcore/stream HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nOrigin: '+origin+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: streamlit\r\n\r\n')
            with socket.create_connection(('127.0.0.1',8080),timeout=15) as s:
                s.sendall(request.encode()); status=int(s.recv(8192).split(b' ')[1])
            results.append(dict(configured=configured,origin=origin,status=status,expected=expected))
            assert status==expected,results[-1]
    finally:
        server.terminate(); server.wait(timeout=15)
print(json.dumps(dict(streamlit=streamlit.__version__,corsEnabled=True,xsrfEnabled=True,handshakes=results),indent=2))
'''
result=subprocess.run(['docker','run','--rm','--network=none','--entrypoint','python',image,'-c',source],capture_output=True,text=True)
if result.returncode:
    print(result.stderr)
    raise SystemExit(result.returncode)
print(result.stdout)
