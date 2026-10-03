import os, sqlite3
import gradio as gr
path=os.path.join(os.environ.get("PODS_APP_DATA","/data"),"counter.sqlite")
os.makedirs(os.path.dirname(path),exist_ok=True)
def read(increment=False):
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
        db.execute("INSERT OR IGNORE INTO counter VALUES (1,0)")
        if increment: db.execute("UPDATE counter SET value=value+1 WHERE id=1")
        return db.execute("SELECT value FROM counter WHERE id=1").fetchone()[0]
with gr.Blocks(title="Gradio + SQLite") as app:
    gr.Markdown("# Gradio + SQLite")
    value=gr.Number(label="Saved count",value=read,interactive=False,precision=0)
    add=gr.Button("Add one")
    add.click(lambda: read(True),outputs=value,api_name="increment")
app.launch(server_name="0.0.0.0",server_port=int(os.environ.get("PORT","8080")))
