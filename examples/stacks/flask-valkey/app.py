from flask import Flask, jsonify, request
import os
app=Flask(__name__)
import redis
def count(add):
    c=redis.Redis(host="db",decode_responses=True)
    if add: c.incr("counter")
    return int(c.get("counter") or 0)
@app.get("/")
def home():
    return '<!doctype html><html><head><title>PODS stack counter</title></head><body><h1>Flask + valkey counter</h1><p id="value">Loading</p><button id="add">Add one</button><script>async function refresh(){document.querySelector(\'#value\').textContent=(await(await fetch(\'/api/count\')).json()).count}document.querySelector(\'#add\').onclick=async()=>{await fetch(\'/api/count\',{method:\'POST\'});await refresh()};refresh()</script></body></html>'
@app.route("/api/count",methods=["GET","POST"])
def api():
    return jsonify(count=count(request.method=="POST"))
