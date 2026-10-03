import server from '@adonisjs/core/services/server';
server.errorHandler(()=>import('../app/handler.js'));
