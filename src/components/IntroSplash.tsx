import React, { useEffect, useState } from 'react';

const SEEN_KEY = 'changsuek:intro-seen';

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#admin') return false;
  try {
    return sessionStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

const CONFETTI = [
  { l: '8%', t: '18%', c: '#FFC928', d: 0.15 },
  { l: '86%', t: '14%', c: '#FF6FA8', d: 0.3 },
  { l: '16%', t: '78%', c: '#5EEAD4', d: 0.45 },
  { l: '80%', t: '74%', c: '#FFC928', d: 0.2 },
  { l: '48%', t: '9%', c: '#C4B5FD', d: 0.55 },
  { l: '92%', t: '46%', c: '#5EEAD4', d: 0.35 },
  { l: '4%', t: '48%', c: '#FF6FA8', d: 0.5 },
];

/**
 * Opening animation, once per browser tab session: the logo bounces in on spinning light rays,
 * paw prints trot across, a pup runs along the loading line, then the curtain lifts.
 * Tap anywhere (or "ข้าม") to skip. Shorter and calmer when the visitor prefers reduced motion.
 */
export const IntroSplash: React.FC = () => {
  const [phase, setPhase] = useState<'show' | 'leave' | 'done'>(() => (shouldShow() ? 'show' : 'done'));
  // the show starts when the logo has loaded (or after 1.5 s on a slow connection)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (phase === 'done') return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: just show it */
    }
    const t = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(t);
    // runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setPhase((p) => (p === 'show' ? 'leave' : p)), calm ? 700 : 2400);
    return () => window.clearTimeout(t);
  }, [ready]);

  // after a skip, finish the lift-off animation and unmount
  useEffect(() => {
    if (phase !== 'leave') return;
    const t = window.setTimeout(() => setPhase('done'), 650);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;
  const skip = () => setPhase((p) => (p === 'show' ? 'leave' : p));

  return (
    <div className={`intro-splash ${ready ? 'is-ready' : ''} ${phase === 'leave' ? 'is-leaving' : ''}`} onClick={skip} role="status" aria-label="กำลังเปิดเว็บไซต์ CHANGSUEK RUN">
      <span className="intro-rays" aria-hidden="true" />
      {CONFETTI.map((c, i) => (
        <span key={i} className="intro-confetti" aria-hidden="true" style={{ left: c.l, top: c.t, background: c.c, animationDelay: `${c.d}s` }} />
      ))}

      <div className="intro-center">
        <img src="/images/brand/changsuek-run-logo.webp" alt="CHANGSUEK RUN เห็นช้างวิ่ง วิ่งตามช้าง" className="intro-logo" width={800} height={400} draggable={false} onLoad={() => setReady(true)} />
        <div className="intro-paws" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ animationDelay: `${0.75 + i * 0.12}s` }}>
              🐾
            </span>
          ))}
        </div>
        <p className="intro-tag">9 – 10 ม.ค. 2570 · ค่ายนเรศวร ชะอำ-หัวหิน</p>
        <div className="intro-track" aria-hidden="true">
          <span className="intro-fill" />
          <span className="intro-pup">🐕</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="intro-skip"
      >
        ข้าม ›
      </button>
    </div>
  );
};
