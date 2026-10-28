import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { getWinners, type Winner } from '../utils/api';

/** Winners board. Empty until the organiser adds names + photos in the admin page. */
export const WinnersSection: React.FC = () => {
  const [winners, setWinners] = useState<Winner[] | null>(null);

  useEffect(() => {
    let alive = true;
    getWinners()
      .then((w) => alive && setWinners(w))
      .catch(() => alive && setWinners([]));
    return () => {
      alive = false;
    };
  }, []);

  const has = !!winners && winners.length > 0;

  return (
    <section id="winners" aria-labelledby="winners-heading" className="py-10 sm:py-14 scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450] bg-gradient-to-b from-[#FFF4D2] via-[#FFFBEB] to-white overflow-hidden">
          <div
            aria-hidden="true"
            className="h-3 w-full"
            style={{ background: 'repeating-linear-gradient(135deg, #FFC928 0 14px, #2A1450 14px 28px)' }}
          />
          <div className="px-4 sm:px-8 py-8 sm:py-10 text-center">
            <motion.span
              animate={{ rotate: [-8, 8, -8], y: [0, -4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex w-16 h-16 rounded-3xl bg-[#FFC928] border-[3px] border-[#2A1450] items-center justify-center shadow-[0_6px_0_#2A1450]"
              aria-hidden="true"
            >
              <Trophy className="w-8 h-8 text-[#2A1450]" />
            </motion.span>
            <h2 id="winners-heading" className="mt-3 font-hero text-3xl sm:text-4xl font-bold text-[#2A1450]">
              ประกาศอันดับผู้ชนะ
            </h2>

            {!has ? (
              <p className="mt-2 text-sm sm:text-base font-semibold text-[#4B2D78] max-w-xl mx-auto text-balance">
                {winners === null ? 'กำลังโหลด…' : 'รอลุ้นกันได้เลย! ผู้ชนะทุกประเภท รวมถึงรางวัลประกวดแต่งตัวน้องสุนัข จะประกาศที่นี่หลังจบงาน'}
              </p>
            ) : (
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
                {winners!.map((w, i) => (
                  <motion.li
                    key={w.id}
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 150, damping: 16 }}
                    className="rounded-3xl bg-white border-[3px] border-[#2A1450] shadow-[0_6px_0_#2A1450] overflow-hidden"
                  >
                    {w.photo ? (
                      <img src={w.photo} alt={`ผู้ชนะ ${w.name}`} loading="lazy" className="block w-full aspect-[4/3] object-cover" />
                    ) : (
                      <div className="aspect-[4/3] flex items-center justify-center text-6xl bg-[#FFF4D2]" aria-hidden="true">🏆</div>
                    )}
                    <div className="p-4">
                      <p className="text-xs font-extrabold text-[#B45309] break-words">{w.title}</p>
                      <p className="mt-0.5 text-lg font-black text-[#2A1450] break-words">{w.name}</p>
                      {w.note && <p className="mt-0.5 text-sm font-semibold text-[#6B5A85] break-words">{w.note}</p>}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
