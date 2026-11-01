import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';

/** What the pup says, picked by the section in view (first match wins). */
const LINES: { section: string; text: string }[] = [
  { section: 'schedule-and-map', text: 'ดูเส้นทางก่อนนะ เดี๋ยวหลง! 🗺️' },
  { section: 'concert', text: 'วิ่งเสร็จไปแดนซ์กัน 🎶' },
  { section: 'hotels', text: 'ค้างคืนชะอำกันมั้ย 🏖️' },
  { section: 'faq', text: 'สงสัยอะไร ถามได้เลย 💬' },
  { section: 'sponsors', text: 'ขอบคุณทุกคนนะครับ 💛' },
];
const PETS = ['โฮ่ง! 💖', 'เกาคางหน่อย 🥰', 'ขอขนมได้มั้ย 🦴', 'วิ่งด้วยกันนะ! 🐾', 'ตื่นเต้นจัง ✨'];

/**
 * A labrador that peeks in from the bottom-left corner once you scroll past the hero.
 * Tap it for a happy wiggle; the bubble follows the section you're reading. It can be closed.
 */
export const PeekingPup: React.FC = () => {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);
  const [text, setText] = useState(LINES[0].text);
  const [happy, setHappy] = useState(0);
  const petIdx = useRef(0);
  const petUntil = useRef(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('changsuek_pup_closed') === '1') setClosed(true);
    } catch {
      /* storage blocked: the pup just shows */
    }
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y > document.documentElement.scrollHeight - 420;
      // The shop fills the screen edge to edge (and on phones has a sticky basket bar in this
      // corner), so the pup steps aside while you're shopping.
      const shop = document.getElementById('distances')?.getBoundingClientRect();
      const overBasket = !!shop && shop.top < window.innerHeight && shop.bottom > window.innerHeight - 200;
      setShow(y > 700 && !nearBottom && !overBasket);
      if (Date.now() < petUntil.current) return;
      const mid = window.innerHeight * 0.45;
      for (const l of LINES) {
        const el = document.getElementById(l.section);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top < mid && r.bottom > mid) {
          setText(l.text);
          break;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The bubble only pops up for a few seconds (new line, or a pat), so it never sits on top of
  // what you're reading; the little dog stays in the corner.
  const [bubble, setBubble] = useState(false);
  useEffect(() => {
    if (!show) return;
    setBubble(true);
    const t = window.setTimeout(() => setBubble(false), 4500);
    return () => window.clearTimeout(t);
  }, [text, show, happy]);

  if (closed) return null;

  const pet = () => {
    setHappy((h) => h + 1);
    setText(PETS[petIdx.current++ % PETS.length]);
    petUntil.current = Date.now() + 2500;
  };

  return (
    <div
      className="pup-peek fixed left-1 sm:left-3 bottom-[76px] lg:bottom-4 z-[55] flex items-end gap-1"
      data-show={show ? 'true' : 'false'}
      aria-hidden={!show}
    >
      <button
        type="button"
        onClick={pet}
        aria-label="ลูบหัวน้องหมา"
        className="relative w-[54px] h-[60px] sm:w-[76px] sm:h-[84px] cursor-pointer select-none"
        style={{ minHeight: 0 }}
      >
        <img
          key={happy}
          src={LABRADOR_SVG_PATH}
          alt=""
          className={`pup-head w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(42,20,80,0.35)] ${happy ? 'happy' : ''}`}
          draggable={false}
        />
      </button>
      <div key={text} hidden={!bubble} className="pup-bubble relative mb-10 sm:mb-12 max-w-[170px] sm:max-w-[200px] rounded-2xl rounded-bl-sm bg-white border-[2.5px] border-[#2A1450] px-3 py-1.5 text-[12px] sm:text-[13px] font-extrabold text-[#2A1450] shadow-[0_4px_0_#2A1450]">
        {text}
        <button
          type="button"
          onClick={() => {
            setClosed(true);
            try {
              sessionStorage.setItem('changsuek_pup_closed', '1');
            } catch {
              /* ignore */
            }
          }}
          aria-label="ซ่อนน้องหมา"
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2A1450] text-white flex items-center justify-center cursor-pointer"
          style={{ minHeight: 0 }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
