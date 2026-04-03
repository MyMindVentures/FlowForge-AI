import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const app = express();
const port = Number(process.env.PORT || 8080);

app.disable('x-powered-by');

app.get('/healthz', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use(express.static(distDir, {
  extensions: ['html'],
  maxAge: '1h',
  setHeaders(response, filePath) {
    if (filePath.endsWith('index.html')) {
      response.setHeader('Cache-Control', 'no-store');
    }
  },
}));

app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api/')) {
    next();
    return;
  }

  response.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`FlowForge AI listening on port ${port}`);
});