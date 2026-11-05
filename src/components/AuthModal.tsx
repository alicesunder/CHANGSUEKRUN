import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AtSign, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User, UserRound, X } from 'lucide-react';
import { useLang } from '../i18n/lang';
import { authApi, type Session } from '../utils/runnerAuth';
import { getPublicConfig } from '../utils/api';

type Tab = 'login' | 'signup';
type Method = 'email' | 'username';
type Social = { line: boolean; google: boolean; facebook: boolean };

/** Brand marks for the sign-in buttons (simple inline SVG, no external files). */
const FacebookMark = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path d="M13.4 19.5v-6.1h2l.4-2.5h-2.4V9.3c0-.7.3-1.3 1.4-1.3h1.1V5.8c-.2 0-.9-.1-1.7-.1-1.9 0-3.1 1.1-3.1 3.2v1.9H9.1v2.5h2v6.2z" fill="#fff" />
  </svg>
);
const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8a6.1 6.1 0 1 1 0-12.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.8 9.8 0 0 0 12 2.2a9.9 9.9 0 1 0 0 19.8c5.7 0 9.5-4 9.5-9.6 0-.6-.1-1.1-.2-1.6z" />
    <path fill="#34A853" d="M3.5 7.3l3.2 2.4A6.1 6.1 0 0 1 12 5.9c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.8 9.8 0 0 0 12 2.2 9.9 9.9 0 0 0 3.5 7.3z" opacity=".0" />
    <path fill="#FBBC05" d="M5.9 12c0-.7.1-1.3.3-1.9L3 7.7A9.9 9.9 0 0 0 2.2 12c0 1.6.4 3.1 1 4.4l3.2-2.5c-.3-.6-.5-1.200-.5-1.900z" />
    <path fill="#4285F4" d="M12 22c2.7 0 4.900-.9 6.600-2.400l-3.200-2.500c-.9.600-2 1-3.400 1a6 6 0 0 1-5.600-4.100L3.200 16.400A9.900 9.900 0 0 0 12 22z" />
  </svg>
);
const LineMark = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#06C755" />
    <path d="M12 5.2c-3.9 0-7 2.5-7 5.600 0 2.800 2.500 5.100 5.800 5.500.2 0 .5.2.6.4l.1.7c0 .2.1.6.5.4.4-.2 2.400-1.400 3.300-2.400 1.800-1.100 2.700-2.500 2.700-4.100 0-3.100-3.100-5.600-6-5.600z" fill="#fff" />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** called after a successful login / sign-up (runner or staff) */
  onAuthed: (s: Session) => void;
  /** why the page is asking: shown under the title */
  reason?: 'checkout' | 'center';
  initialTab?: Tab;
}

const field =
  'w-full min-h-[50px] pl-11 pr-4 rounded-2xl border-[2.5px] border-[#2A1450]/20 bg-white text-[15px] font-semibold text-[#2A1450] placeholder:text-[#6B5A85]/55 outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15';
const lbl = 'block text-xs font-extrabold text-[#2A1450] mb-1.5';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; label: string; right?: React.ReactNode }> = ({ icon, label, right, id, ...rest }) => (
  <div>
    <label className={lbl} htmlFor={id}>
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6D28D9]" aria-hidden="true">
        {icon}
      </span>
      <input id={id} {...rest} className={`${field} ${right ? 'pr-12' : ''}`} />
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  </div>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthed, reason = 'center', initialTab = 'login' }) => {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [method, setMethod] = useState<Method>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [social, setSocial] = useState<Social>({ line: false, google: false, facebook: false });
  // the first screen lists the sign-in choices; the e-mail / username form opens from the first one
  const [showForm, setShowForm] = useState(false);

  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setError(null);
    setShowForm(false);
    getPublicConfig()
      .then((c) => setSocial((c as { socialLogin?: Social }).socialLogin ?? { line: Boolean((c as { lineLoginReady?: boolean }).lineLoginReady), google: false, facebook: false }))
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const run = async (fn: () => Promise<Session>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const s = await fn();
      setPassword('');
      onAuthed(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ไม่สำเร็จ กรุณาลองใหม่', 'Something went wrong, please try again'));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') run(() => authApi.login(identifier.trim(), password));
    else
      run(() =>
        authApi.register({
          name: name.trim(),
          email: method === 'email' ? email.trim() : undefined,
          username: method === 'username' ? username.trim() : undefined,
          password,
          phone: phone.trim() || undefined,
        })
      );
  };

  const methods: { id: Method; emoji: string; th: string; en: string }[] = [
    { id: 'email', emoji: '✉️', th: 'ใช้อีเมล', en: 'Use e-mail' },
    { id: 'username', emoji: '🧑‍💻', th: 'ตั้งชื่อผู้ใช้เอง', en: 'Own username' },
  ];

  const socials: { id: 'facebook' | 'google' | 'line'; label: string; mark: React.ReactNode }[] = [
    { id: 'facebook', label: 'Facebook', mark: <FacebookMark /> },
    { id: 'google', label: 'Google', mark: <GoogleMark /> },
    { id: 'line', label: 'LINE', mark: <LineMark /> },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-3 sm:p-6 bg-[#140826]/80 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('เข้าสู่ระบบนักวิ่ง', 'Runner login')}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto overflow-hidden rounded-[30px] border-[3px] border-[#2A1450] bg-[#FAF8FF] text-[#2A1450] shadow-[0_10px_0_#2A1450,0_30px_70px_-20px_rgba(20,8,38,0.7)]"
      >
        {/* header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2D1052] via-[#4C1D95] to-[#7C3AED] px-5 pt-5 pb-6 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#FFC928]/35 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-[#EC4899]/35 blur-2xl" />
          <button type="button" onClick={onClose} aria-label={t('ปิด', 'Close')} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-[#FFE268] bg-white/95 text-3xl shadow-lg" aria-hidden="true">
              🐘
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FFE268]">CHANGSUEK RUN 2027</p>
              <h2 className="text-xl font-black leading-tight">{tab === 'login' ? t('เข้าสู่ระบบ', 'Log in') : t('สมัครสมาชิกนักวิ่ง', 'Create runner account')}</h2>
            </div>
          </div>
          <p className="relative mt-3 rounded-xl bg-white/12 px-3 py-2 text-xs font-bold leading-snug text-white/95">
            {reason === 'checkout'
              ? t('🎟️ เข้าสู่ระบบก่อนกรอกข้อมูลสั่งซื้อ — ระบบจะเติมข้อมูลของคุณให้ และเก็บตั๋วไว้ในศูนย์นักวิ่ง', '🎟️ Log in before checkout — we pre-fill your details and keep your tickets in the Runner Center')
              : t('ศูนย์นักวิ่ง: ดูตั๋วและกิจกรรมที่ซื้อ แก้ข้อมูลของคุณ และซื้อเพิ่มได้ในที่เดียว', 'Runner Center: see your tickets and activities, edit your details and buy more in one place')}
          </p>
        </div>

        {/* tabs */}
        <div className="grid grid-cols-2 gap-2 px-5 pt-4">
          {(['login', 'signup'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                setError(null);
              }}
              aria-pressed={tab === k}
              className={`min-h-[46px] rounded-2xl border-[3px] text-sm font-black cursor-pointer transition ${
                tab === k ? 'border-[#2A1450] bg-[#FFC928] text-[#2A1450] shadow-[0_4px_0_#2A1450]' : 'border-[#2A1450]/20 bg-white text-[#4B2D78] hover:border-[#2A1450]/50'
              }`}
            >
              {k === 'login' ? t('เข้าสู่ระบบ', 'Log in') : t('สมัครสมาชิก', 'Sign up')}
            </button>
          ))}
        </div>

        {!showForm && (
          <div className="space-y-2.5 px-5 pb-5 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex min-h-[54px] w-full items-center gap-3 rounded-full bg-[#2B2B2B] px-5 text-[15px] font-extrabold text-white shadow-[0_4px_0_#000] transition hover:bg-[#3a3a3a] active:translate-y-0.5 cursor-pointer"
            >
              <UserRound className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-center">{t('ใช้อีเมลหรือชื่อผู้ใช้', 'Use e-mail or username')}</span>
            </button>
            {socials.map((s) => {
              const on = social[s.id];
              const cls = 'flex min-h-[54px] w-full items-center gap-3 rounded-full px-5 text-[15px] font-extrabold transition';
              const inner = (
                <>
                  <span className="shrink-0">{s.mark}</span>
                  <span className="flex-1 text-center">
                    {t('ดำเนินการต่อด้วย', 'Continue with')} {s.label}
                    {!on && <span className="ml-1.5 text-xs font-bold opacity-75">({t('เร็ว ๆ นี้', 'coming soon')})</span>}
                  </span>
                </>
              );
              return on ? (
                <a key={s.id} href={`/api/auth/${s.id}/start`} className={`${cls} bg-[#2B2B2B] text-white shadow-[0_4px_0_#000] hover:bg-[#3a3a3a] active:translate-y-0.5`}>
                  {inner}
                </a>
              ) : (
                <button key={s.id} type="button" disabled className={`${cls} cursor-not-allowed bg-[#EFEAF7] text-[#6B5A85]`}>
                  <span className="shrink-0 grayscale opacity-70">{s.mark}</span>
                  <span className="flex-1 text-center">
                    {t('ดำเนินการต่อด้วย', 'Continue with')} {s.label}
                    <span className="ml-1.5 text-xs font-bold">({t('เร็ว ๆ นี้', 'coming soon')})</span>
                  </span>
                </button>
              );
            })}
            <p className="pt-1 text-center text-[11px] font-semibold leading-snug text-[#6B5A85]">
              {tab === 'login'
                ? t('ยังไม่มีบัญชี? ปุ่มด้านบนสร้างบัญชีให้อัตโนมัติ หรือเลือกแท็บ "สมัครสมาชิก"', 'No account yet? The buttons above create one for you, or use the "Sign up" tab')
                : t('สมัครด้วย Facebook / Google / LINE ได้ในคลิกเดียว หรือใช้อีเมลของคุณเอง', 'Sign up with Facebook / Google / LINE in one click, or use your own e-mail')}
            </p>
          </div>
        )}

        <form onSubmit={submit} className={`space-y-3.5 px-5 pb-5 pt-4 ${showForm ? '' : 'hidden'}`}>
          <button type="button" onClick={() => setShowForm(false)} className="text-xs font-extrabold text-[#5B20A8] underline underline-offset-2 cursor-pointer">
            ← {t('ตัวเลือกอื่น (Facebook / Google / LINE)', 'Other options (Facebook / Google / LINE)')}
          </button>
          {tab === 'signup' && (
            <>
              <div role="radiogroup" aria-label={t('วิธีสมัคร', 'Sign-up method')} className="grid grid-cols-2 gap-2">
                {methods.map((m) => {
                  const on = m.id === method;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setMethod(m.id)}
                      className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-[3px] px-2 text-center text-xs font-black cursor-pointer transition ${
                        on ? 'border-[#2A1450] bg-[#2A1450] text-white shadow-[0_4px_0_#FFC928]' : 'border-[#2A1450]/20 bg-white text-[#2A1450] hover:border-[#2A1450]/50'
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">{m.emoji}</span>
                      {t(m.th, m.en)}
                    </button>
                  );
                })}
              </div>

              <Input id="auth-name" icon={<User className="h-4 w-4" />} label={t('ชื่อ - นามสกุล *', 'Full name *')} required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('เช่น สมชาย ใจดี', 'e.g. Somchai Jaidee')} autoComplete="name" maxLength={80} />
              {method === 'email' ? (
                <Input id="auth-email" icon={<Mail className="h-4 w-4" />} label={t('อีเมล *', 'Email *')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              ) : (
                <Input id="auth-username" icon={<AtSign className="h-4 w-4" />} label={t('ชื่อผู้ใช้ที่ตั้งเอง * (a-z 0-9 . _ -)', 'Your own username * (a-z 0-9 . _ -)')} required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="somchai.run" autoComplete="username" minLength={4} maxLength={30} />
              )}
              <Input id="auth-phone" icon={<Phone className="h-4 w-4" />} label={t('เบอร์โทรศัพท์ (ไม่บังคับ)', 'Phone (optional)')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" autoComplete="tel" />
            </>
          )}

          {tab === 'login' && (
            <Input id="auth-id" icon={<UserRound className="h-4 w-4" />} label={t('อีเมล หรือ ชื่อผู้ใช้', 'Email or username')} required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t('อีเมล / ชื่อผู้ใช้', 'Email / username')} autoComplete="username" autoCapitalize="none" />
          )}

          <Input
            id="auth-pw"
            icon={<Lock className="h-4 w-4" />}
            label={tab === 'login' ? t('รหัสผ่าน', 'Password') : t('ตั้งรหัสผ่าน * (อย่างน้อย 8 ตัว)', 'Password * (at least 8 characters)')}
            type={showPw ? 'text' : 'password'}
            required
            minLength={tab === 'login' ? undefined : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            right={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t('ซ่อนรหัสผ่าน', 'Hide password') : t('แสดงรหัสผ่าน', 'Show password')} className="grid h-9 w-9 place-items-center rounded-full text-[#6D28D9] hover:bg-[#F3E8FF] cursor-pointer">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {error && (
            <p role="alert" className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[54px] w-full rounded-2xl border-[3px] border-[#140826] bg-[#FFC928] text-base font-black text-[#2A1450] shadow-[0_5px_0_#140826] transition active:translate-y-0.5 active:shadow-[0_3px_0_#140826] disabled:opacity-60 cursor-pointer"
          >
            {busy ? t('กำลังดำเนินการ…', 'Please wait…') : tab === 'login' ? t('เข้าสู่ระบบ', 'Log in') : t('สมัครและเข้าสู่ระบบ', 'Sign up & log in')}
          </button>


          <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-[#6B5A85]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]" aria-hidden="true" />
            {t('รหัสผ่านถูกเข้ารหัสเก็บไว้ ผู้จัดงานไม่เห็นรหัสของคุณ · เจ้าหน้าที่ตรวจบัตรเข้าสู่ระบบจากฟอร์มนี้ได้เช่นกัน', 'Passwords are stored encrypted — the organiser never sees yours · ticket-checking staff also log in from this form')}
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
};
