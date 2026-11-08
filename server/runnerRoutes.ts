/**
 * Routes of the runner / staff login system (see runners.ts).
 *   POST /api/auth/register   sign up (e-mail or own username)
 *   POST /api/auth/login      runners (e-mail or username) and staff
 *   GET  /api/auth/me
 *   GET  /api/auth/line/start, /api/auth/line/callback   LINE Login
 *   PATCH /api/me             profile used to pre-fill the booking form
 *   GET  /api/me/orders       everything this runner bought
 *   POST /api/me/claim        attach an older order (order id + the e-mail on it)
 */
import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import { docsSignature } from './auth';
import { addParkingPlates, parseParkingPlates } from '../src/data/vipParking';
import { eventInfo } from '../src/data/eventData';
import { SITE_URL, maskEmail, sendAccountMail, sendTicketEmail } from './mailer';
import { findOrderByCode, listOrdersByRunner, rateLimited, recordEmailResult, toRunnerView, updateOrder, getOrder } from './store';
import {
  type RunnerRow,
  checkStaff,
  createRunner,
  ensureRunnerTables,
  emailFingerprint,
  getRunner,
  hashPassword,
  issueActionToken,
  issueSession,
  passwordFingerprint,
  readActionToken,
  loginRunner,
  normEmail,
  publicRunner,
  requireRunner,
  sessionFromRequest,
  updateRunnerProfile,
  upsertSocialRunner,
  type RunnerSession,
} from './runners';
import { dbQuery } from './db';
import { authorizeUrl, fetchProfile, isProvider, newState, providerConfigured, stateOk } from './socialLogin';

type Wrap = (fn: (req: Request, res: Response) => Promise<void>) => RequestHandler;

const cookieOf = (req: Request, name: string) => {
  const m = String(req.headers.cookie || '')
    .split(/;\s*/)
    .find((c) => c.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
};

export function registerRunnerRoutes(app: Express, h: Wrap, clientIp: (req: Request) => string) {
  const json = express.json({ limit: '50kb' });

  /** Sends the "verify your e-mail" link (never throws; the account works without it, except claiming old orders). */
  const sendVerifyMail = async (runnerId: string, email: string | null) => {
    if (!email) return false;
    const token = issueActionToken('verify', runnerId, emailFingerprint(email));
    const r = await sendAccountMail(email, 'ยืนยันอีเมลบัญชีนักวิ่ง · CHANGSUEK RUN', 'ยืนยันอีเมลของคุณ', 'กดปุ่มด้านล่างเพื่อยืนยันว่าอีเมลนี้เป็นของคุณ จะได้ผูกคำสั่งซื้อเดิมและรับอีเมลตั๋วได้อย่างมั่นใจ ลิงก์ใช้ได้ 3 วัน', 'ยืนยันอีเมล', `${SITE_URL}/#verify=${token}`);
    if (!r.ok) console.log(`[mail] verify ${runnerId}: not sent (${r.error})`);
    return r.ok;
  };

  const sessionBody = (token: string, expiresAt: number, role: 'runner' | 'staff', user: unknown) => ({ token, expiresAt, role, user });

  app.post('/api/auth/register', json, h(async (req, res) => {
    if (await rateLimited(`signup:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'สมัครบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const b = req.body || {};
    const made = await createRunner({ name: b.name, email: b.email, username: b.username, password: b.password, phone: b.phone });
    if (!made.ok) {
      res.status(400).json({ error: made.error });
      return;
    }
    const s = issueSession('runner', made.runner.runner_id);
    await sendVerifyMail(made.runner.runner_id, made.runner.email);
    res.json(sessionBody(s.token, s.expiresAt, 'runner', publicRunner(made.runner)));
  }));

  // ---- Forgot / reset password, verify e-mail ----------------------------
  // Always answers the same way, so nobody can use it to find out which e-mails have an account.
  app.post('/api/auth/forgot', json, h(async (req, res) => {
    const email = normEmail(req.body?.email);
    const generic = { ok: true, message: 'ถ้าอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ให้แล้ว (ลิงก์ใช้ได้ 1 ชั่วโมง)' };
    if (!email || (await rateLimited(`forgot-ip:${clientIp(req)}`, 8, 60 * 60 * 1000)) || (await rateLimited(`forgot:${email}`, 3, 60 * 60 * 1000))) {
      res.json(generic);
      return;
    }
    await ensureRunnerTables();
    const rows = await dbQuery<{ runner_id: string; password_hash: string | null }>('select runner_id, password_hash from csr.runners where email = $1', [email]);
    const row = rows[0];
    if (row && row.password_hash) {
      const token = issueActionToken('reset', row.runner_id, passwordFingerprint(row.password_hash));
      const r = await sendAccountMail(email, 'ตั้งรหัสผ่านใหม่ · CHANGSUEK RUN', 'ตั้งรหัสผ่านใหม่', 'มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีนักวิ่งของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์ใช้ได้ 1 ชั่วโมงและใช้ได้ครั้งเดียว', 'ตั้งรหัสผ่านใหม่', `${SITE_URL}/#reset=${token}`);
      if (!r.ok) console.log(`[mail] reset ${row.runner_id}: not sent (${r.error})`);
    }
    res.json(generic);
  }));

  app.post('/api/auth/reset', json, h(async (req, res) => {
    const pw = String(req.body?.password || '');
    if (pw.length < 8 || pw.length > 200) {
      res.status(400).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' });
      return;
    }
    if (await rateLimited(`reset-ip:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ลองบ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const t = readActionToken('reset', String(req.body?.token || ''));
    const row = t ? await getRunner(t.runnerId) : undefined;
    if (!t || !row || !row.password_hash || passwordFingerprint(row.password_hash) !== t.fp) {
      res.status(400).json({ error: 'ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่' });
      return;
    }
    // receiving this e-mail also proves the address, so it counts as verified
    const rows = await dbQuery<RunnerRow>('update csr.runners set password_hash = $2, email_verified = true, last_login_at = now() where runner_id = $1 returning *', [row.runner_id, hashPassword(pw)]);
    const s = issueSession('runner', row.runner_id);
    res.json(sessionBody(s.token, s.expiresAt, 'runner', publicRunner(rows[0])));
  }));

  app.post('/api/auth/verify-email', json, h(async (req, res) => {
    const t = readActionToken('verify', String(req.body?.token || ''));
    const row = t ? await getRunner(t.runnerId) : undefined;
    if (!t || !row || !row.email || emailFingerprint(row.email) !== t.fp) {
      res.status(400).json({ error: 'ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่ในศูนย์นักวิ่ง' });
      return;
    }
    await dbQuery('update csr.runners set email_verified = true where runner_id = $1', [row.runner_id]);
    res.json({ ok: true });
  }));

  app.post('/api/me/verify/resend', requireRunner, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    if (await rateLimited(`verify-resend:${s.sub}`, 3, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ขอลิงก์บ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const row = await getRunner(s.sub);
    if (!row || !row.email) {
      res.status(400).json({ error: 'ยังไม่มีอีเมลในบัญชี กรุณาเพิ่มอีเมลที่แท็บ "ข้อมูลของฉัน" ก่อน' });
      return;
    }
    if (row.email_verified) {
      res.json({ ok: true, already: true });
      return;
    }
    const ok = await sendVerifyMail(row.runner_id, row.email);
    if (!ok) {
      res.status(503).json({ error: 'ส่งอีเมลไม่สำเร็จในขณะนี้ กรุณาลองใหม่ภายหลัง' });
      return;
    }
    res.json({ ok: true, to: maskEmail(row.email) });
  }));

  app.post('/api/auth/login', json, h(async (req, res) => {
    const ip = clientIp(req);
    const identifier = String(req.body?.identifier || '').slice(0, 120);
    const password = String(req.body?.password || '').slice(0, 200);
    if (!identifier || !password) {
      res.status(400).json({ error: 'กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน' });
      return;
    }
    // per IP and per account name, so one account cannot be guessed from many addresses either
    if ((await rateLimited(`login:${ip}`, 20, 15 * 60 * 1000)) || (await rateLimited(`login-id:${identifier.toLowerCase()}`, 10, 15 * 60 * 1000))) {
      res.status(429).json({ error: 'เข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่' });
      return;
    }
    // staff first (the scanner account)
    const staff = checkStaff(identifier, password);
    if (staff) {
      const s = issueSession('staff', staff);
      res.json(sessionBody(s.token, s.expiresAt, 'staff', { id: staff, name: staff, username: staff }));
      return;
    }
    const runner = await loginRunner(identifier, password);
    if (!runner) {
      res.status(401).json({ error: 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }
    const s = issueSession('runner', runner.runner_id);
    res.json(sessionBody(s.token, s.expiresAt, 'runner', publicRunner(runner)));
  }));

  app.get('/api/auth/me', h(async (req, res) => {
    const s = sessionFromRequest(req);
    if (!s) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ', needLogin: true });
      return;
    }
    if (s.role === 'staff') {
      res.json({ role: 'staff', user: { id: s.sub, name: s.sub, username: s.sub } });
      return;
    }
    const runner = await getRunner(s.sub);
    if (!runner) {
      res.status(401).json({ error: 'ไม่พบบัญชี กรุณาเข้าสู่ระบบใหม่', needLogin: true });
      return;
    }
    res.json({ role: 'runner', user: publicRunner(runner) });
  }));

  // ---- Social sign-in (LINE, Google) ---------------------------------------
  const redirectUri = (req: Request, provider: string) => `${(process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '')}/api/auth/${provider}/callback`;
  const STATE_COOKIE = 'csr_oauth_state';

  app.get('/api/auth/:provider/start', h(async (req, res) => {
    const provider = req.params.provider;
    if (!isProvider(provider)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (!providerConfigured(provider)) {
      res.status(503).json({ error: 'ยังไม่ได้เปิดใช้การเข้าสู่ระบบด้วยช่องทางนี้' });
      return;
    }
    const { state, nonce } = newState(provider);
    res.setHeader('Set-Cookie', `${STATE_COOKIE}=${nonce}; Path=/api/auth; Max-Age=600; HttpOnly; SameSite=Lax${req.secure ? '; Secure' : ''}`);
    res.redirect(authorizeUrl(provider, redirectUri(req, provider), state));
  }));

  app.get('/api/auth/:provider/callback', h(async (req, res) => {
    const provider = req.params.provider;
    const back = (q: string) => res.redirect(`/${q}`);
    if (!isProvider(provider) || !providerConfigured(provider)) return back('#login-error=off');
    const code = String(req.query.code || '');
    if (!code || !stateOk(provider, String(req.query.state || ''), cookieOf(req, STATE_COOKIE))) return back('#login-error=state');
    try {
      const profile = await fetchProfile(provider, code, redirectUri(req, provider));
      const runner = await upsertSocialRunner(provider, profile);
      const s = issueSession('runner', runner.runner_id);
      res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax`);
      back(`#runner-auth=${s.token}`);
    } catch (err: any) {
      console.error(`[${provider}-login]`, err?.message || err);
      back('#login-error=fail');
    }
  }));

  // ---- My account --------------------------------------------------------
  app.patch('/api/me', requireRunner, json, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    const out = await updateRunnerProfile(s.sub, { name: req.body?.name, phone: req.body?.phone, email: req.body?.email, profile: req.body?.profile });
    if (!out.ok) {
      res.status(400).json({ error: out.error });
      return;
    }
    // a new e-mail address has to be verified again
    if (req.body?.email !== undefined && out.runner.email && !out.runner.email_verified) await sendVerifyMail(out.runner.runner_id, out.runner.email);
    res.json({ user: publicRunner(out.runner) });
  }));

  // Send the ticket e-mail again (the buyer's own paid order only; a few times per hour).
  app.post('/api/me/orders/:orderId/resend-ticket', requireRunner, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    const id = String(req.params.orderId).slice(0, 40);
    if (await rateLimited(`resend-me:${id}`, 3, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ขอส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const order = await getOrder(id);
    if (!order || order.runnerId !== s.sub || order.paymentStatus !== 'PAID' || order.cancelledAt) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อที่ชำระแล้วของคุณ' });
      return;
    }
    const r = await sendTicketEmail(order);
    await recordEmailResult(order.orderId, r);
    if (!r.ok) {
      res.status(503).json({ error: 'ส่งอีเมลไม่สำเร็จในขณะนี้ ลองใหม่ภายหลัง หรือเปิดเอกสาร A4 จากปุ่มด้านบนแทน' });
      return;
    }
    res.json({ ok: true, to: maskEmail(order.email) });
  }));

  app.get('/api/me/orders', requireRunner, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    await ensureRunnerTables();
    const orders = await listOrdersByRunner(s.sub);
    res.json({
      orders: orders.map((o) => ({
        ...toRunnerView(o),
        // signed link to the A4 documents (BIB, e-ticket...) of a paid order
        docsUrl: o.paymentStatus === 'PAID' && !o.cancelledAt ? `/api/orders/${encodeURIComponent(o.orderId)}/documents?s=${docsSignature(o.orderId)}` : undefined,
      })),
    });
  }));

  // VIP parking: a table comes with 2 car passes; the buyer registers the cars left over later (paid, own order only).
  app.post('/api/me/orders/:orderId/parking-plates', requireRunner, json, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    const id = String(req.params.orderId).slice(0, 40);
    if (await rateLimited(`plates-me:${s.sub}`, 20, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ลองบ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const order = await getOrder(id);
    if (!order || order.runnerId !== s.sub || order.paymentStatus !== 'PAID' || order.cancelledAt || !order.vipTables) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ VIP ที่ชำระแล้วของคุณ' });
      return;
    }
    const r = addParkingPlates(order.parkingPlates || [], req.body?.plates, order.vipTables);
    if (!r.ok) {
      res.status(400).json({ error: r.error });
      return;
    }
    const updated = await updateOrder(order.orderId, (o) => {
      // re-check against the freshest copy so two quick requests can't go over the limit
      const again = addParkingPlates(o.parkingPlates || [], req.body?.plates, o.vipTables || 0);
      if (again.ok) o.parkingPlates = again.value;
    });
    res.json({ ok: true, order: toRunnerView(updated || order) });
  }));

  // The buyer may also change the plates already registered (a wrong digit, another car), until the event day.
  // The full list is sent; every plate is checked again and a changed plate gets a new pass QR.
  app.put('/api/me/orders/:orderId/parking-plates', requireRunner, json, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    const id = String(req.params.orderId).slice(0, 40);
    if (await rateLimited(`plates-edit:${s.sub}`, 30, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ลองบ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const order = await getOrder(id);
    if (!order || order.runnerId !== s.sub || order.paymentStatus !== 'PAID' || order.cancelledAt || !order.vipTables) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ VIP ที่ชำระแล้วของคุณ' });
      return;
    }
    if (Date.now() >= Date.parse(`${eventInfo.date}T00:00:00+07:00`)) {
      res.status(403).json({ error: 'แก้ไขทะเบียนรถได้ถึงก่อนวันงานเท่านั้น กรุณาติดต่อผู้จัดงานหน้างาน' });
      return;
    }
    const r = parseParkingPlates(req.body?.plates, order.vipTables);
    if (!r.ok) {
      res.status(400).json({ error: r.error });
      return;
    }
    const updated = await updateOrder(order.orderId, (o) => {
      const again = parseParkingPlates(req.body?.plates, o.vipTables || 0);
      if (again.ok) o.parkingPlates = again.value;
    });
    res.json({ ok: true, order: toRunnerView(updated || order) });
  }));

  // An order made before the runner had an account: needs the order id AND the e-mail written on that order.
  app.post('/api/me/claim', requireRunner, json, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    if (await rateLimited(`claim:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ลองบ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const code = String(req.body?.orderId || '').trim().slice(0, 80);
    const email = normEmail(req.body?.email);
    const me = await getRunner(s.sub);
    if (!me || !me.email || !me.email_verified || normEmail(me.email) !== email) {
      res.status(403).json({ error: 'ต้องยืนยันอีเมลของบัญชีก่อน และอีเมลต้องตรงกับที่ใช้สั่งซื้อ (ดูปุ่ม "ส่งลิงก์ยืนยัน" ในแท็บ ข้อมูลของฉัน)', needVerify: true });
      return;
    }
    const found = code ? await findOrderByCode(code) : undefined;
    const order = found ? await getOrder(found.orderId) : undefined;
    if (!order || !email || normEmail(order.email) !== email) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อที่ตรงกับเลขที่และอีเมลนี้' });
      return;
    }
    if (order.runnerId && order.runnerId !== s.sub) {
      res.status(409).json({ error: 'คำสั่งซื้อนี้ผูกกับบัญชีอื่นแล้ว' });
      return;
    }
    const updated = await updateOrder(order.orderId, (o) => {
      if (!o.runnerId) o.runnerId = s.sub;
    });
    res.json({ order: updated ? toRunnerView(updated) : toRunnerView(order) });
  }));
}
