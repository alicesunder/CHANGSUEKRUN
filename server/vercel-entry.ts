/** Vercel function entry. Bundled by scripts/build-api.mjs into api/index.js. */
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from './app';

let app: ReturnType<typeof createApp> | null = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  app ??= createApp();
  return (app as unknown as (a: IncomingMessage, b: ServerResponse) => void)(req, res);
}
