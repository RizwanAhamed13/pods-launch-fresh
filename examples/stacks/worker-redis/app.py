import uuid
from flask import Flask, request, jsonify
from redis import Redis
app=Flask(__name__)
db=Redis(host="db",decode_responses=True)
@app.get("/")
def home():
    return app.send_static_file("index.html")
@app.post("/api/jobs")
def submit():
    text=(request.get_json(silent=True) or {}).get("text","")
    if not isinstance(text,str) or not 1<=len(text)<=100:
        return jsonify(error="Enter between 1 and 100 characters"),400
    job=uuid.uuid4().hex
    with db.pipeline(transaction=True) as tx:
        tx.hset("job:"+job,mapping={"id":job,"text":text,"state":"queued"})
        tx.set("latest",job);tx.rpush("queue",job);tx.execute()
    return jsonify(id=job),202
@app.get("/api/jobs/<job>")
def get_job(job):
    value=db.hgetall("job:"+job)
    return (jsonify(value),200) if value else (jsonify(error="Unknown job"),404)
@app.get("/api/latest")
def latest():
    job=db.get("latest")
    return jsonify(db.hgetall("job:"+job) if job else {})
