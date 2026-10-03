from flask import Flask, jsonify, request
import os
app=Flask(__name__)
import sqlite3
def count(add):
    with sqlite3.connect(os.environ.get("PODS_APP_DATA","/data")+"/counter.db") as c:
        c.execute("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER)")
        c.execute("INSERT OR IGNORE INTO counter VALUES (1,0)")
        if add: c.execute("UPDATE counter SET value=value+1 WHERE id=1")
        return c.execute("SELECT value FROM counter WHERE id=1").fetchone()[0]
@app.get("/")
def home():
    return '<!doctype html><html><head><title>PODS stack counter</title></head><body><h1>Flask + sqlite counter</h1><p id="value">Loading</p><button id="add">Add one</button><script>async function refresh(){document.querySelector(\'#value\').textContent=(await(await fetch(\'/api/count\')).json()).count}document.querySelector(\'#add\').onclick=async()=>{await fetch(\'/api/count\',{method:\'POST\'});await refresh()};refresh()</script></body></html>'
@app.route("/api/count",methods=["GET","POST"])
def api():
    return jsonify(count=count(request.method=="POST"))
