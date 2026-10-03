import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
export class Store {
  constructor(directory, key) {
    if (!/^[a-f0-9]{64}$/i.test(key || '')) throw new Error('PODS_SECRET must be 32 random bytes encoded as 64 hex characters');
    this.key = Buffer.from(key, 'hex');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(join(directory, 'pods.sqlite'));
    chmodSync(join(directory, 'pods.sqlite'), 0o600);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (kind TEXT, id TEXT, value TEXT, PRIMARY KEY(kind,id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS preview_ports (compute_key TEXT, data_key TEXT, port INTEGER CHECK(port BETWEEN 20000 AND 29999), PRIMARY KEY(compute_key,data_key), UNIQUE(compute_key,port))');
  }
  get(kind, id) { const row = this.db.prepare('SELECT value FROM records WHERE kind=? AND id=?').get(kind, id); return row ? JSON.parse(row.value) : null; }
  put(kind, id, value) { this.db.prepare('INSERT OR REPLACE INTO records VALUES (?,?,?)').run(kind, id, JSON.stringify(value)); return value; }
  delete(kind, id) { this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind, id); }
  list(kind) { return this.db.prepare('SELECT value FROM records WHERE kind=?').all(kind).map(r => JSON.parse(r.value)); }
  previewPort(computeKey, dataKey) {
    // Reserve origins independently of expiring browser sessions and launch history.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const saved=this.db.prepare('SELECT port FROM preview_ports WHERE compute_key=? AND data_key=?').get(computeKey,dataKey);
      if(saved){this.db.exec('COMMIT');return saved.port;}
      const used=new Set(this.db.prepare('SELECT port FROM preview_ports WHERE compute_key=?').all(computeKey).map(row=>row.port));
      const start=createHash('sha256').update(dataKey).digest().readUInt32BE(0)%10000;
      for(let offset=0;offset<10000;offset++){
        const port=20000+(start+offset)%10000;
        if(used.has(port))continue;
        this.db.prepare('INSERT INTO preview_ports VALUES (?,?,?)').run(computeKey,dataKey,port);
        this.db.exec('COMMIT');return port;
      }
      throw Object.assign(new Error('This compute account has no unused application preview ports.'),{status:409});
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  seal(text) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', this.key, iv); return Buffer.concat([iv, c.update(text), c.final(), c.getAuthTag()]).toString('base64'); }
  open(text) { const b = Buffer.from(text, 'base64'), d = createDecipheriv('aes-256-gcm', this.key, b.subarray(0, 12)); d.setAuthTag(b.subarray(-16)); return Buffer.concat([d.update(b.subarray(12, -16)), d.final()]).toString(); }
  close() { this.db.close(); }
}
