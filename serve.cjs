const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const html=path.join(__dirname,'IMPULSO.html');
http.createServer((req,res)=>{if(req.url==='/'||req.url==='/index.html'||req.url==='/IMPULSO.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(html).pipe(res);}else{res.writeHead(404);res.end('Not found');}}).listen(8794,'127.0.0.1',()=>console.log('IMPULSO disponível em http://localhost:8794'));
