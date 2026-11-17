import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directoryArgument = process.argv.indexOf('--directory');
if (directoryArgument !== -1 && !process.argv[directoryArgument + 1]) throw new Error('--directory 需要目录路径');
const task = path.dirname(fileURLToPath(import.meta.url));
const root = directoryArgument === -1 ? path.join(task, 'dist') : path.resolve(task, process.argv[directoryArgument + 1]);
const port = Number(process.env.PORT || 4178);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.md': 'text/plain; charset=utf-8' };
await fs.access(path.join(root, 'index.html'));
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const requested = decodeURIComponent(url.pathname);
    const target = path.resolve(root, `.${requested}${requested.endsWith('/') ? 'index.html' : ''}`);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const data = await fs.readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(data);
  } catch (error) {
    const status = error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500;
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end(status === 404 ? 'Not found' : 'Preview server error');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`OneLauncher preview: http://127.0.0.1:${port}`));
