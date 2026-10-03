import os
import sqlite3
from fastapi import FastAPI

app = FastAPI(title='Persistent counter API', version='1.0.0')

def counter(add=False):
    with sqlite3.connect(os.path.join(os.environ.get('PODS_APP_DATA', '/data'), 'counter.db')) as db:
        db.execute('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)')
        db.execute('INSERT OR IGNORE INTO counter VALUES (1, 0)')
        if add:
            db.execute('UPDATE counter SET value = value + 1 WHERE id = 1')
        return db.execute('SELECT value FROM counter WHERE id = 1').fetchone()[0]

@app.get('/')
def product():
    return {'name': 'Persistent counter API', 'count': counter(), 'docs': '/docs',
            'operations': [{'method': 'GET', 'path': '/api/count'}, {'method': 'POST', 'path': '/api/count'}]}

@app.get('/api/count')
def read_count():
    return {'count': counter()}

@app.post('/api/count')
def increment_count():
    return {'count': counter(True)}
