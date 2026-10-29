import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const port = Number(process.env.PORT ?? 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.md':'text/plain; charset=utf-8', '.ts':'text/plain; charset=utf-8' };
const server = createServer(async (request, response) => {
  try {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (file !== directory && !file.startsWith(directory + path.sep)) { response.writeHead(403).end(); return; }
    if (!(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': contents.length, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch { response.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }).end('Не найдено'); }
});
server.on('error', (error) => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => process.stdout.write(`Documentation: http://127.0.0.1:${port}\n`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close());
