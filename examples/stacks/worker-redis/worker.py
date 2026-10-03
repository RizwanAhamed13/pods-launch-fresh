from redis import Redis
connection=Redis(host="db",decode_responses=True)
while True:
    item=connection.blpop("queue",timeout=5)
    if not item:continue
    job=item[1]
    text=connection.hget("job:"+job,"text")
    connection.hset("job:"+job,mapping={"state":"complete","result":text.upper()})
