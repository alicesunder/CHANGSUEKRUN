/**
 * Local / Node-host entry: API (server/app.ts) + Vite dev middleware or the built site.
 * On Vercel the API runs as a function (api/index.js) and the site is served as static files.
 */
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';
import { DATA_DIR } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    const renderIndex = (req: express.Request) => {
      // LINE / Facebook link previews need absolute URLs for og:image
      const origin = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      return indexHtml.split('__SITE_ORIGIN__').join(origin.replace(/[<>"']/g, ''));
    };
    app.get(['/', '/index.html'], (req, res) => {
      res.type('html').send(renderIndex(req));
    });
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      res.type('html').send(renderIndex(req));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}  (${process.env.DATABASE_URL ? 'database: DATABASE_URL' : `embedded database in ${DATA_DIR}`})`);
  });
}

startServer();
