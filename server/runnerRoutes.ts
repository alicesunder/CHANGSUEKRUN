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
import { findOrderByCode, listOrdersByRunner, rateLimited, toRunnerView, updateOrder, getOrder } from './store';
import {
  checkStaff,
  createRunner,
  ensureRunnerTables,
  getRunner,
  issueSession,
  loginRunner,
  normEmail,
  publicRunner,
  requireRunner,
  sessionFromRequest,
  updateRunnerProfile,
  upsertSocialRunner,
  type RunnerSession,
} from './runners';
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
    res.json(sessionBody(s.token, s.expiresAt, 'runner', publicRunner(made.runner)));
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

  // ---- Social sign-in (LINE, Google, Facebook) --------------------------
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
    res.json({ user: publicRunner(out.runner) });
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

  // An order made before the runner had an account: needs the order id AND the e-mail written on that order.
  app.post('/api/me/claim', requireRunner, json, h(async (req, res) => {
    const s = (req as any).runner as RunnerSession;
    if (await rateLimited(`claim:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ลองบ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    const code = String(req.body?.orderId || '').trim().slice(0, 80);
    const email = normEmail(req.body?.email);
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
