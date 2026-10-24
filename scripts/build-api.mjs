// Bundles the API (server/vercel-entry.ts) into one self-contained file for Vercel: api/index.js
import { build } from 'esbuild';

await build({
  entryPoints: ['server/vercel-entry.ts'],
  outfile: 'api/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  // pg-native is optional; pglite is only for local development without DATABASE_URL
  external: ['pg-native', '@electric-sql/pglite'],
  banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
  legalComments: 'none',
  logLevel: 'info',
});
