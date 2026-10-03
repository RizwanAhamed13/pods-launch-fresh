import os, sqlite3
import streamlit as st
path=os.path.join(os.environ.get("PODS_APP_DATA","/data"),"counter.sqlite")
os.makedirs(os.path.dirname(path),exist_ok=True)
def read(increment=False):
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
        db.execute("INSERT OR IGNORE INTO counter VALUES (1,0)")
        if increment: db.execute("UPDATE counter SET value=value+1 WHERE id=1")
        return db.execute("SELECT value FROM counter WHERE id=1").fetchone()[0]
st.title("Streamlit + SQLite")
st.button("Add one",on_click=lambda: read(True))
st.metric("Saved count",read())
