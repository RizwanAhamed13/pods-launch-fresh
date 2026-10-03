import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import type {DatabaseSync as SQLiteDatabase} from 'node:sqlite';
const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
const app=express(), engine=new AngularNodeAppEngine();
let database: SQLiteDatabase | undefined;
function db(){
  if(!database){
    const data=process.env['PODS_APP_DATA'] || '/tmp/pods-angular-ssr';mkdirSync(data,{recursive:true});
    database=new DatabaseSync(join(data,'records.sqlite'));
    database.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL); INSERT OR IGNORE INTO counter VALUES (1,0)');
  }
  return database;
}
app.all('/api/count',(req,res)=>{
  if(req.method==='POST')db().exec('UPDATE counter SET value=value+1 WHERE id=1');
  res.json(db().prepare('SELECT value AS count FROM counter WHERE id=1').get());
});
app.use(express.static(join(import.meta.dirname,'../browser'),{index:false,redirect:false}));
app.use((req,res,next)=>{engine.handle(req).then(response=>response?writeResponseToNodeResponse(response,res):next()).catch(next);});
if(isMainModule(import.meta.url))app.listen(Number(process.env['PORT'] || 8080),'0.0.0.0');
export const reqHandler=createNodeRequestHandler(app);
