import { createServer } from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
const file = process.env.PODS_APP_DATA + '/notes.json';
let notes: {id:string;title:string;body:string;updated:string}[] = [];
try { notes = JSON.parse(readFileSync(file, 'utf8')); } catch {}
let saves = Promise.resolve();
createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  try {
    const path = new URL(req.url!, 'http://localhost').pathname;
    if (path === '/health') return res.end(JSON.stringify({ok:true,host:hostname(),pid:process.pid}));
    if (path === '/api/notes' && req.method === 'GET') return res.end(JSON.stringify({notes,host:hostname()}));
    if (path === '/api/notes' && req.method === 'POST') {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 100000) { res.statusCode=413; return res.end('{}'); } }
      const n = JSON.parse(body); if (typeof n.title !== 'string' || typeof n.body !== 'string') throw new Error('Write a title and note');
      const note = {id: typeof n.id === 'string' ? n.id : randomUUID(),title:n.title.slice(0,200),body:n.body.slice(0,50000),updated:new Date().toISOString()};
      notes = [note,...notes.filter(x=>x.id!==note.id)].slice(0,100);
      const snapshot = JSON.stringify(notes); saves = saves.then(async()=>{await writeFile(file+'.tmp',snapshot);await rename(file+'.tmp',file);}); await saves;
      return res.end(JSON.stringify(note));
    }
    if (path === '/') { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(await readFile('public/index.html')); }
    res.statusCode=404;res.end('{}');
  } catch { res.statusCode=400;res.end(JSON.stringify({error:'Could not save this note. Try again.'})); }
}).listen(Number(process.env.PORT || 8080), '0.0.0.0');
