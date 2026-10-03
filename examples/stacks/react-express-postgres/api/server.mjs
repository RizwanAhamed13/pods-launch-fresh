import express from 'express';
import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
await pool.query('CREATE TABLE IF NOT EXISTS counter(id INTEGER PRIMARY KEY,value INTEGER NOT NULL)');
await pool.query('INSERT INTO counter VALUES(1,0) ON CONFLICT DO NOTHING');
const app=express();
app.get('/api/count',async(req,res)=>res.json({count:(await pool.query('SELECT value FROM counter WHERE id=1')).rows[0].value}));
app.post('/api/count',async(req,res)=>res.json({count:(await pool.query('UPDATE counter SET value=value+1 WHERE id=1 RETURNING value')).rows[0].value}));
app.listen(8080,'0.0.0.0');
