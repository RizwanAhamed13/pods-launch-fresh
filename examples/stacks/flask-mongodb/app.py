from flask import Flask, jsonify, request
import os
app=Flask(__name__)
from pymongo import MongoClient,ReturnDocument
client=MongoClient('mongodb://db:27017')
def count(add):
    collection=client.pods.counter
    result=collection.find_one_and_update({'_id':'count'},{'$inc':{'value':1 if add else 0}},upsert=True,return_document=ReturnDocument.AFTER)
    return result['value']
@app.get("/")
def home():
    return '<!doctype html><html><head><title>PODS stack counter</title></head><body><h1>Flask + mongodb counter</h1><p id="value">Loading</p><button id="add">Add one</button><script>async function refresh(){document.querySelector(\'#value\').textContent=(await(await fetch(\'/api/count\')).json()).count}document.querySelector(\'#add\').onclick=async()=>{await fetch(\'/api/count\',{method:\'POST\'});await refresh()};refresh()</script></body></html>'
@app.route("/api/count",methods=["GET","POST"])
def api():
    return jsonify(count=count(request.method=="POST"))
