import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';

const COLORS = ['#FFC928', '#FF4D8D', '#7C3AED', '#22D3EE', '#34D399', '#FF7A00', '#FFFFFF', '#A855F7'];

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: 0 | 1 | 2; // ribbon, dot, star
  life: number;
}

/**
 * Full-screen "wow" right after a payment goes through: confetti cannons from both bottom corners,
 * three firework bursts, a clean card with the mascot. Tap anywhere (or wait
 * ~3.5 s) and it fades away; it never blocks the ticket underneath for longer than that.
 */
export const PaymentWow: React.FC<{ title: string; line: string; onDone: () => void }> = ({ title, line, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => doneRef.current(), 450);
  };

  useEffect(() => {
    const t = window.setTimeout(close, 3500);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const bits: Bit[] = [];
    const add = (x: number, y: number, angle: number, spread: number, speed: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const s = speed * (0.55 + Math.random() * 0.6);
        bits.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4,
          size: 6 + Math.random() * 8,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          shape: ([0, 0, 1, 2] as const)[(Math.random() * 4) | 0],
          life: 1,
        });
      }
    };
    const scale = Math.max(0.7, Math.min(1.3, W() / 900));
    // two cannons, then fireworks
    add(0, H(), -Math.PI / 3, 0.7, 24 * scale, 110);
    add(W(), H(), (-2 * Math.PI) / 3, 0.7, 24 * scale, 110);
    const timers = [
      window.setTimeout(() => add(W() * 0.25, H() * 0.3, 0, Math.PI * 2, 9 * scale, 70), 450),
      window.setTimeout(() => add(W() * 0.75, H() * 0.25, 0, Math.PI * 2, 9 * scale, 70), 800),
      window.setTimeout(() => add(W() * 0.5, H() * 0.18, 0, Math.PI * 2, 11 * scale, 90), 1150),
      window.setTimeout(() => {
        add(0, H() * 0.9, -Math.PI / 4, 0.6, 20 * scale, 60);
        add(W(), H() * 0.9, (-3 * Math.PI) / 4, 0.6, 20 * scale, 60);
      }, 1600),
    ];

    const star = (r: number) => {
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 ? r * 0.45 : r;
        const a = (k * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    };
    let raf = 0;
    const tick = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W(), H());
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.vy += 0.35;
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        if (b.vy > 0) b.life -= 0.006;
        if (b.life <= 0 || b.y > H() + 40) {
          bits.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 1.4));
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        if (b.shape === 0) ctx.fillRect(-b.size / 2, -b.size / 5, b.size, b.size / 2.5);
        else if (b.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, b.size / 3, 0, Math.PI * 2);
          ctx.fill();
        } else star(b.size / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(window.clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return createPortal(
    <div className={`pay-wow ${leaving ? 'leaving' : ''}`} role="status" aria-live="assertive" onClick={close}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
      <div className="pay-wow-card">
        <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32">
          <span className="pay-wow-ring" aria-hidden="true" />
          <img src={LABRADOR_SVG_PATH} alt="" className="pay-wow-dog relative w-full h-full object-contain" />
          <span className="absolute -left-5 top-2 text-3xl pay-wow-pop [animation-delay:.5s]" aria-hidden="true">🎉</span>
        </div>
        <p className="mt-3 text-[11px] sm:text-xs font-black tracking-[0.25em] text-[#7C3AED]">PAYMENT SUCCESS</p>
        <h2 className="pay-wow-title font-hero text-3xl sm:text-5xl font-black leading-tight">{title}</h2>
        <p className="mt-2 text-sm sm:text-base font-extrabold text-[#2A1450]">{line}</p>
        <p className="mt-3 text-[11px] font-bold text-[#6B5A85]">แตะที่ใดก็ได้เพื่อดูบัตรของคุณ</p>
      </div>
    </div>,
    document.body
  );
};
