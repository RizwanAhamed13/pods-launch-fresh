import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { Ignitor, prettyPrintError } from '@adonisjs/core';
process.env.APP_KEY ||= randomBytes(32).toString('hex');
process.env.LOG_LEVEL ||= 'info';
const root=new URL('../',import.meta.url);
const importer=file=>import(file.startsWith('./') || file.startsWith('../') ? new URL(file,root).href : file);
new Ignitor(root,{importer}).tap(app=>{
  app.booting(()=>import('#start/env'));
  app.listen('SIGTERM',()=>app.terminate());
}).httpServer().start().catch(error=>{process.exitCode=1;prettyPrintError(error)});
