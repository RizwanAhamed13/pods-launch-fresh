import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import Fastify from 'fastify';

const db = new DatabaseSync(join(process.env.PODS_APP_DATA, 'counter.db'));
db.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER); INSERT OR IGNORE INTO counter VALUES (1,0)');
const app = Fastify();
app.get('/', (request, reply) => reply.type('text/html').send(`<html><title>fastify counter</title><h1>fastify counter</h1>
<p id="value"></p><button id="add">Add one</button><p id="error" role="alert"></p>
<script>
async function count(method = 'GET') {
  const options = method === 'POST' ? { method, headers: { 'Content-Type': 'application/json' }, body: '{}' } : {};
  const response = await fetch('/api/count', options);
  if (!response.ok) throw new Error('Counter request failed (' + response.status + ')');
  value.textContent = (await response.json()).count;
}
add.onclick = async () => {
  add.disabled = true; error.textContent = '';
  try { await count('POST'); } catch (failure) { error.textContent = failure.message; }
  finally { add.disabled = false; }
};
count().catch(failure => { error.textContent = failure.message; });
</script></html>`));
app.route({ method: ['GET', 'POST'], url: '/api/count', handler: request => {
  if (request.method === 'POST') db.exec('UPDATE counter SET value=value+1 WHERE id=1');
  return { count: db.prepare('SELECT value FROM counter WHERE id=1').get().value };
} });
app.listen({ port: Number(process.env.PORT), host: '0.0.0.0' });
