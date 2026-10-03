from django.http import HttpResponse,JsonResponse
from django.urls import path
from django.db import connection,transaction
from django.views.decorators.csrf import csrf_exempt
def home(request): return HttpResponse('<!doctype html><html><title>Django counter</title><h1>Django counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector("#value").textContent=(await(await fetch("/api/count")).json()).count}document.querySelector("#add").onclick=async()=>{await fetch("/api/count",{method:"POST"});refresh()};refresh()</script></html>')
@csrf_exempt
def count(request):
    with transaction.atomic(),connection.cursor() as c:
        c.execute('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY,value INTEGER)')
        c.execute('INSERT OR IGNORE INTO counter VALUES (1,0)')
        if request.method=='POST': c.execute('UPDATE counter SET value=value+1 WHERE id=1')
        c.execute('SELECT value FROM counter WHERE id=1')
        return JsonResponse({'count':c.fetchone()[0]})
urlpatterns=[path('',home),path('api/count',count)]
