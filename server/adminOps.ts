/**
 * Back-office support: a real audit log, individual admin accounts with roles, and "sign out everywhere".
 *
 *   csr.audit_log   who did what, to which order / account, when and from which address (append-only)
 *   csr.admin_users extra admin accounts (the ADMIN_USERNAME / ADMIN_PASSWORD account stays the owner)
 *
 * Both tables are created on first use (additive) and are also in server/schema.ts.
 */
import type { Request } from 'express';
import { dbQuery } from './db';
import { hashPassword, verifyPassword } from './runners';

export type AdminRole = 'owner' | 'manager' | 'viewer';
export const ROLE_RANK: Record<AdminRole, number> = { viewer: 1, manager: 2, owner: 3 };
export const isRole = (v: unknown): v is AdminRole => v === 'owner' || v === 'manager' || v === 'viewer';

let ready: Promise<void> | null = null;
export function ensureAdminTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await dbQuery(`create table if not exists csr.audit_log (
        id      bigserial primary key,
        at      timestamptz not null default now(),
        actor   text not null,
        role    text not null default '',
        action  text not null,
        target  text not null default '',
        detail  jsonb not null default '{}'::jsonb,
        ip      text not null default ''
      )`);
      await dbQuery('create index if not exists audit_log_at_idx on csr.audit_log (at desc)');
      await dbQuery(`create table if not exists csr.admin_users (
        username      text primary key,
        display_name  text not null default '',
        role          text not null,
        password_hash text not null,
        active        boolean not null default true,
        token_version integer not null default 0,
        created_at    timestamptz not null default now(),
        last_login_at timestamptz
      )`);
      await dbQuery('alter table csr.audit_log enable row level security');
      await dbQuery('alter table csr.admin_users enable row level security');
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export interface AuditActor {
  username: string;
  role: string;
  ip: string;
}

const cut = (v: unknown, n: number) => (typeof v === 'string' ? v : String(v ?? '')).slice(0, n);

/** Writes one audit row. Never throws: a logging problem must not block the admin's action. */
export async function writeAudit(actor: AuditActor, action: string, target = '', detail: Record<string, unknown> = {}): Promise<void> {
  try {
    await ensureAdminTables();
    await dbQuery('insert into csr.audit_log (actor, role, action, target, detail, ip) values ($1, $2, $3, $4, $5::jsonb, $6)', [
      cut(actor.username, 60),
      cut(actor.role, 20),
      cut(action, 60),
      cut(target, 120),
      JSON.stringify(detail).slice(0, 4000),
      cut(actor.ip, 80),
    ]);
  } catch (err) {
    console.error('[audit] could not write', action, err instanceof Error ? err.message : err);
  }
}

export interface AuditRow {
  id: number;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: Record<string, unknown>;
  ip: string;
}

export async function listAudit(opts: { limit?: number; before?: number; action?: string; actor?: string } = {}): Promise<AuditRow[]> {
  await ensureAdminTables();
  const limit = Math.min(500, Math.max(1, Math.floor(opts.limit || 100)));
  const where: string[] = [];
  const args: unknown[] = [];
  if (opts.before) {
    args.push(opts.before);
    where.push(`id < $${args.length}`);
  }
  if (opts.action) {
    args.push(`${opts.action}%`);
    where.push(`action like $${args.length}`);
  }
  if (opts.actor) {
    args.push(opts.actor);
    where.push(`actor = $${args.length}`);
  }
  args.push(limit);
  const rows = await dbQuery<AuditRow & { id: string | number; at: string | Date }>(
    `select id, at, actor, role, action, target, detail, ip from csr.audit_log ${where.length ? 'where ' + where.join(' and ') : ''} order by id desc limit $${args.length}`,
    args
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), at: new Date(r.at).toISOString() }));
}

// ---------------------------------------------------------------------------
// Admin accounts
// ---------------------------------------------------------------------------
export interface AdminUserRow {
  username: string;
  display_name: string;
  role: AdminRole;
  password_hash: string;
  active: boolean;
  token_version: number;
  created_at: string;
  last_login_at: string | null;
}

export const normAdminUsername = (v: unknown) => cut(v, 30).trim().toLowerCase();
export const validAdminUsername = (v: string) => /^[a-z0-9._-]{3,30}$/.test(v);
export const validAdminPassword = (v: string) => typeof v === 'string' && v.length >= 10 && v.length <= 200;

export async function findAdminUser(username: string): Promise<AdminUserRow | undefined> {
  await ensureAdminTables();
  const rows = await dbQuery<AdminUserRow>('select * from csr.admin_users where username = $1', [normAdminUsername(username)]);
  return rows[0];
}

export async function checkAdminUserPassword(username: string, password: string): Promise<AdminUserRow | null> {
  const u = await findAdminUser(username);
  // always run a hash check so a wrong user name takes as long as a wrong password
  const ok = verifyPassword(String(password || ''), u?.password_hash || 'scrypt$16384$00$00');
  return u && u.active && ok ? u : null;
}

export async function listAdminUsers() {
  await ensureAdminTables();
  const rows = await dbQuery<AdminUserRow>('select * from csr.admin_users order by created_at');
  return rows.map((r) => ({
    username: r.username,
    displayName: r.display_name,
    role: r.role,
    active: r.active,
    createdAt: new Date(r.created_at).toISOString(),
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
  }));
}

export async function createAdminUser(input: { username: string; displayName: string; role: AdminRole; password: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminTables();
  const username = normAdminUsername(input.username);
  if (!validAdminUsername(username)) return { ok: false, error: 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–30 ตัว' };
  if (!validAdminPassword(input.password)) return { ok: false, error: 'รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร' };
  if (input.role === 'owner') return { ok: false, error: 'บัญชีเจ้าของมีได้บัญชีเดียว (ตั้งใน Vercel) สร้างได้เฉพาะ manager หรือ viewer' };
  if (!isRole(input.role)) return { ok: false, error: 'สิทธิ์ไม่ถูกต้อง' };
  const taken = await findAdminUser(username);
  if (taken) return { ok: false, error: 'มีชื่อผู้ใช้นี้แล้ว' };
  await dbQuery('insert into csr.admin_users (username, display_name, role, password_hash) values ($1, $2, $3, $4)', [
    username,
    cut(input.displayName, 80).trim() || username,
    input.role,
    hashPassword(input.password),
  ]);
  return { ok: true };
}

export async function updateAdminUser(
  username: string,
  patch: { role?: AdminRole; active?: boolean; password?: string; displayName?: string; signOut?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await findAdminUser(username);
  if (!u) return { ok: false, error: 'ไม่พบบัญชีนี้' };
  const sets: string[] = [];
  const args: unknown[] = [u.username];
  const add = (col: string, v: unknown) => {
    args.push(v);
    sets.push(`${col} = $${args.length}`);
  };
  if (patch.role !== undefined) {
    if (patch.role === 'owner' || !isRole(patch.role)) return { ok: false, error: 'สิทธิ์ไม่ถูกต้อง' };
    add('role', patch.role);
  }
  if (patch.displayName !== undefined) add('display_name', cut(patch.displayName, 80).trim() || u.username);
  if (patch.active !== undefined) add('active', patch.active);
  if (patch.password !== undefined) {
    if (!validAdminPassword(patch.password)) return { ok: false, error: 'รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร' };
    add('password_hash', hashPassword(patch.password));
  }
  // any change of role / status / password, or an explicit sign-out, ends the sessions already issued
  if (patch.signOut || patch.role !== undefined || patch.active === false || patch.password !== undefined) sets.push('token_version = token_version + 1');
  if (!sets.length) return { ok: true };
  await dbQuery(`update csr.admin_users set ${sets.join(', ')} where username = $1`, args);
  return { ok: true };
}

export async function touchAdminLogin(username: string) {
  await dbQuery('update csr.admin_users set last_login_at = now() where username = $1', [normAdminUsername(username)]).catch(() => {});
}

// ---------------------------------------------------------------------------
// "Sign out everywhere": the owner account's tokens carry the epoch; bumping it ends every owner session
// ---------------------------------------------------------------------------
let epochCache: { n: number; at: number } | null = null;

export async function ownerEpoch(): Promise<number> {
  if (epochCache && Date.now() - epochCache.at < 5000) return epochCache.n;
  await ensureAdminTables();
  const rows = await dbQuery<{ value: { n?: number } }>("select value from csr.settings where key = 'admin_epoch'");
  const n = Number(rows[0]?.value?.n) || 0;
  epochCache = { n, at: Date.now() };
  return n;
}

export async function bumpOwnerEpoch(): Promise<number> {
  const n = (await ownerEpoch()) + 1;
  await dbQuery(
    "insert into csr.settings (key, value) values ('admin_epoch', $1::jsonb) on conflict (key) do update set value = excluded.value",
    [JSON.stringify({ n })]
  );
  epochCache = { n, at: Date.now() };
  return n;
}

/** The current token version of an account (what a freshly issued token must carry). */
export async function currentVersion(username: string, role: AdminRole): Promise<number> {
  if (role === 'owner') return ownerEpoch();
  const u = await findAdminUser(username);
  return u?.token_version ?? 0;
}

/** True while the token's version still matches (the account may also have been switched off). */
export async function sessionStillValid(username: string, role: AdminRole, version: number): Promise<{ ok: boolean; role: AdminRole }> {
  if (role === 'owner') return { ok: version === (await ownerEpoch()), role };
  const u = await findAdminUser(username);
  if (!u || !u.active || u.token_version !== version) return { ok: false, role };
  return { ok: true, role: u.role };
}

export const actorOf = (req: Request, ip: string): AuditActor => {
  const a = (req as any).admin as { username: string; role: string } | undefined;
  if (a) return { username: a.username, role: a.role, ip };
  const s = (req as any).staffSession as { sub: string } | undefined;
  if (s) return { username: s.sub, role: 'staff', ip };
  return { username: 'unknown', role: '', ip };
};

/** Ends every admin session (owner and extra accounts). */
export async function signOutEveryone(): Promise<void> {
  await bumpOwnerEpoch();
  await dbQuery('update csr.admin_users set token_version = token_version + 1');
}
