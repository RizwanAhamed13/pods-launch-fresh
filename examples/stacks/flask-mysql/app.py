from flask import Flask, jsonify, request
import os
app=Flask(__name__)
import pymysql
def count(add):
    c=pymysql.connect(host='db',user='pods',password='preview-fixture-only',database='pods')
    try:
        with c.cursor() as q:
            q.execute('CREATE TABLE IF NOT EXISTS counter (id INT PRIMARY KEY, value INT)')
            q.execute('INSERT IGNORE INTO counter VALUES (1,0)')
            if add: q.execute('UPDATE counter SET value=value+1 WHERE id=1')
            q.execute('SELECT value FROM counter WHERE id=1')
            n=q.fetchone()[0]
        c.commit()
        return n
    finally: c.close()
@app.get("/")
def home():
    return '<!doctype html><html><head><title>PODS stack counter</title></head><body><h1>Flask + mysql counter</h1><p id="value">Loading</p><button id="add">Add one</button><script>async function refresh(){document.querySelector(\'#value\').textContent=(await(await fetch(\'/api/count\')).json()).count}document.querySelector(\'#add\').onclick=async()=>{await fetch(\'/api/count\',{method:\'POST\'});await refresh()};refresh()</script></body></html>'
@app.route("/api/count",methods=["GET","POST"])
def api():
    return jsonify(count=count(request.method=="POST"))
