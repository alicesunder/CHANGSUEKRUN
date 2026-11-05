import React, { useEffect, useRef, useState } from 'react';

export type ActivityStickerId = 'tower' | 'gun' | 'gunPremium' | 'wind' | 'mangrove' | 'resort' | 'camp' | 'statue';

const STICKERS: Record<ActivityStickerId, { src: string; title: string; emoji: string; glow: string }> = {
  tower: { src: '/images/addons/sticker-tower.webp', title: 'หอสูง', emoji: '🪂', glow: '#10B981' },
  gun: { src: '/images/addons/sticker-gun.webp', title: 'ยิงปืน', emoji: '🎯', glow: '#8B5CF6' },
  gunPremium: { src: '/images/addons/sticker-gun-premium.webp', title: 'ยิงปืน Premium', emoji: '🎯', glow: '#F59E0B' },
  wind: { src: '/images/addons/sticker-wind-3.webp', title: 'อุโมงค์ลม', emoji: '🌪️', glow: '#0EA5E9' },
  // landmarks on the course map
  mangrove: { src: '/images/map/sticker-mangrove.webp', title: 'หอดูนก · ป่าชายเลน', emoji: '🌳', glow: '#22C55E' },
  resort: { src: '/images/map/sticker-resort.webp', title: 'Sea Sand Sun Hua Hin Resort', emoji: '🏖️', glow: '#0EA5E9' },
  camp: { src: '/images/map/sticker-bpp-school.webp', title: 'ค่ายนเรศวร', emoji: '🐘', glow: '#8B5CF6' },
  statue: { src: '/images/map/sticker-statue.webp', title: 'พระบรมราชานุสาวรีย์', emoji: '🙏', glow: '#F59E0B' },
};
const WARM: ActivityStickerId[] = ['tower', 'gun', 'gunPremium', 'wind'];

const EVENT = 'changsuek:activity-sticker';

/** Pops the activity's sticker in the middle of the screen with light rays (see <ActivityStickerLayer />). */
export function showActivitySticker(id: ActivityStickerId, caption?: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, caption } }));
}

/**
 * Mounted once (App). Shows a sticker for ~1.9 s: it bounces in on a spinning burst of light,
 * glows, then floats away. It never blocks taps (pointer-events: none).
 */
export const ActivityStickerLayer: React.FC = () => {
  const [shown, setShown] = useState<{ id: ActivityStickerId; caption?: string; key: number; leaving: boolean } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onShow = (e: Event) => {
      const { id, caption } = (e as CustomEvent<{ id: ActivityStickerId; caption?: string }>).detail || {};
      if (!id || !STICKERS[id]) return;
      timers.current.forEach(window.clearTimeout);
      const key = Date.now();
      setShown({ id, caption, key, leaving: false });
      timers.current = [
        window.setTimeout(() => setShown((s) => (s && s.key === key ? { ...s, leaving: true } : s)), 1500),
        window.setTimeout(() => setShown((s) => (s && s.key === key ? null : s)), 1950),
      ];
    };
    window.addEventListener(EVENT, onShow);
    // Warm the activity images up once the page is idle, so the first pop is instant.
    const warm = window.setTimeout(() => WARM.forEach((id) => (new Image().src = STICKERS[id].src)), 4000);
    return () => {
      window.removeEventListener(EVENT, onShow);
      timers.current.forEach(window.clearTimeout);
      window.clearTimeout(warm);
    };
  }, []);

  if (!shown) return null;
  const st = STICKERS[shown.id];
  return (
    <div className="sticker-pop" aria-live="polite" role="status">
      <div key={shown.key} className={`sticker-card ${shown.leaving ? 'leaving' : ''}`} style={{ ['--glow' as string]: st.glow }}>
        <span className="sticker-rays" aria-hidden="true" />
        <span className="sticker-halo" aria-hidden="true" />
        {['12%', '82%', '20%', '76%', '50%'].map((left, i) => (
          <span key={i} className="sticker-spark" aria-hidden="true" style={{ left, ['--i' as string]: i }}>
            ✦
          </span>
        ))}
        <img src={st.src} alt="" className="sticker-img" draggable={false} />
        <span className="sticker-caption">
          {st.emoji} {shown.caption || `${st.title} · เลือกแล้ว!`}
        </span>
      </div>
    </div>
  );
};
