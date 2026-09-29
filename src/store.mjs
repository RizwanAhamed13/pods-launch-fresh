import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
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
  }
  get(kind, id) { const row = this.db.prepare('SELECT value FROM records WHERE kind=? AND id=?').get(kind, id); return row ? JSON.parse(row.value) : null; }
  put(kind, id, value) { this.db.prepare('INSERT OR REPLACE INTO records VALUES (?,?,?)').run(kind, id, JSON.stringify(value)); return value; }
  delete(kind, id) { this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind, id); }
  list(kind) { return this.db.prepare('SELECT value FROM records WHERE kind=?').all(kind).map(r => JSON.parse(r.value)); }
  seal(text) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', this.key, iv); return Buffer.concat([iv, c.update(text), c.final(), c.getAuthTag()]).toString('base64'); }
  open(text) { const b = Buffer.from(text, 'base64'), d = createDecipheriv('aes-256-gcm', this.key, b.subarray(0, 12)); d.setAuthTag(b.subarray(-16)); return Buffer.concat([d.update(b.subarray(12, -16)), d.final()]).toString(); }
  close() { this.db.close(); }
}
