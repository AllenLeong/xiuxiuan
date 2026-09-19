import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const p=(await stat(file)).isDirectory()?path.join(file,'index.html'):file;const data=await readFile(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`青野 · http://127.0.0.1:${port}`));
