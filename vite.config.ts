import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // og:image / og:url need an absolute address. Dev: localhost. Vercel build: SITE_URL, else the
        // project's production URL. Elsewhere the placeholder is filled per request by server.ts.
        name: 'site-origin',
        transformIndexHtml(html: string, ctx: { server?: unknown }) {
          const site = (process.env.SITE_URL || '').replace(/\/+$/, '');
          const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
          const origin = ctx.server ? site || 'http://localhost:3000' : site || vercel;
          return origin ? html.split('__SITE_ORIGIN__').join(origin) : html;
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
