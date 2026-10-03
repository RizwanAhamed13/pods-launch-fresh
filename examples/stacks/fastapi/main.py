from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import sqlite3,os
app=FastAPI()
def value(add=False):
    with sqlite3.connect(os.environ.get('PODS_APP_DATA','/data')+'/counter.db') as c:
        c.execute('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER)')
        c.execute('INSERT OR IGNORE INTO counter VALUES (1,0)')
        if add: c.execute('UPDATE counter SET value=value+1 WHERE id=1')
        return {'count':c.execute('SELECT value FROM counter WHERE id=1').fetchone()[0]}
@app.get('/',response_class=HTMLResponse)
def home(): return '<!doctype html><html><title>FastAPI counter</title><h1>FastAPI counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector("#value").textContent=(await(await fetch("/api/count")).json()).count}document.querySelector("#add").onclick=async()=>{await fetch("/api/count",{method:"POST"});refresh()};refresh()</script></html>'
@app.get('/api/count')
def read(): return value()
@app.post('/api/count')
def add(): return value(True)
