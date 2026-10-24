/**
 * Database access.
 *  - Production / Vercel: Postgres via DATABASE_URL (use Supabase's "Transaction pooler" URI).
 *  - Local development without DATABASE_URL: an embedded Postgres (PGlite) stored in DATA_DIR/pgdata,
 *    running the exact same SQL, so nothing needs to be installed.
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { SCHEMA_SQL } from './schema';

export type Q = <T = any>(text: string, params?: unknown[]) => Promise<T[]>;
interface Driver {
  q: Q;
  tx<T>(fn: (q: Q) => Promise<T>): Promise<T>;
  kind: 'pg' | 'pglite';
}

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

let driver: Promise<Driver> | null = null;

async function makePg(url: string): Promise<Driver> {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  // sslmode in the URL would force strict certificate checks; we set TLS explicitly instead.
  const cleanUrl = url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
  const pool = new pg.Pool({
    connectionString: cleanUrl,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  pool.on('error', (e) => console.warn('[db] idle client error:', e.message));
  const q: Q = async (text, params) => (await pool.query(text, params as any[])).rows;
  const tx = async <T>(fn: (q: Q) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    const cq: Q = async (text, params) => (await client.query(text, params as any[])).rows;
    try {
      await client.query('begin');
      const out = await fn(cq);
      await client.query('commit');
      return out;
    } catch (err) {
      try {
        await client.query('rollback');
      } catch {
        /* connection already broken */
      }
      throw err;
    } finally {
      client.release();
    }
  };
  if (process.env.DB_AUTO_MIGRATE === 'true') await pool.query(SCHEMA_SQL);
  return { q, tx, kind: 'pg' };
}

async function makeLocal(): Promise<Driver> {
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(DATA_DIR, 'pgdata');
  fs.mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.exec(SCHEMA_SQL);
  const q: Q = async (text, params) => (await db.query(text, params as any[])).rows as any[];
  const tx = <T>(fn: (q: Q) => Promise<T>): Promise<T> =>
    db.transaction(async (t) => fn(async (text, params) => (await t.query(text, params as any[])).rows as any[]));
  return { q, tx, kind: 'pglite' };
}

function getDriver(): Promise<Driver> {
  if (!driver) {
    const url = (process.env.DATABASE_URL || '').trim();
    if (!url && (process.env.VERCEL || process.env.NODE_ENV === 'production' && process.env.REQUIRE_DATABASE_URL === 'true')) {
      driver = Promise.reject(new Error('DATABASE_URL is not set'));
    } else {
      driver = url ? makePg(url) : makeLocal();
    }
    driver.then(
      (d) => console.log(`[db] using ${d.kind === 'pg' ? 'Postgres (DATABASE_URL)' : `embedded Postgres in ${DATA_DIR}/pgdata`}`),
      (e) => {
        console.error('[db] cannot start:', e.message);
        driver = null; // allow a retry on the next request
      }
    );
  }
  return driver;
}

export const dbQuery: Q = async (text, params) => (await getDriver()).q(text, params);
export async function dbTx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  return (await getDriver()).tx(fn);
}
