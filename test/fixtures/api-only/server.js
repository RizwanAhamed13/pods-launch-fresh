require('node:http').createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ healthy: true }));
}).listen(Number(process.env.PORT), '0.0.0.0');
