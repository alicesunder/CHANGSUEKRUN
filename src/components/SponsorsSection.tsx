import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Sponsor board — styled like the step-and-repeat backdrop at a race finish.
 *
 * Logos are sized by area, not by height: each one gets roughly the same visual
 * weight, so a wide wordmark (Solid Gold) is shorter and a compact mark
 * (We are family) is taller. `ratio` is the trimmed image's width / height.
 */
interface Sponsor {
  name: string;
  file: string;
  /** trimmed image width / height */
  ratio: number;
  /** logo has its own solid background colour (shown as a rounded tile) */
  tile?: boolean;
}

/** Main supporters — shown larger, in this order. */
const MAIN_SPONSORS: Sponsor[] = [
  { name: 'กองบัญชาการตำรวจตระเวนชายแดน', file: 'bpp', ratio: 1.36 },
  { name: 'Chang เครื่องดื่มตราช้าง', file: 'chang', ratio: 1.17, tile: true },
  { name: 'การท่องเที่ยวแห่งประเทศไทย (ททท.)', file: 'tat', ratio: 1.01 },
];

const SPONSORS: Sponsor[] = [
  { name: 'YuMOVE', file: 'yumove', ratio: 3.15 },
  { name: 'Dogster', file: 'dogster', ratio: 1.92, tile: true },
  { name: 'Amor', file: 'amor', ratio: 2.29, tile: true },
  { name: 'Konvy', file: 'konvy', ratio: 3.42 },
  { name: 'Bestie', file: 'bestie', ratio: 2.31 },
  { name: 'VetSynova', file: 'vetsynova', ratio: 0.75 },
  { name: 'Dr.Choice', file: 'dr-choice', ratio: 1.56 },
  { name: 'We are family for PET', file: 'we-are-family-for-pet', ratio: 1.2 },
  { name: 'VIF', file: 'vif', ratio: 1.47 },
  { name: 'Kitchen Flavor', file: 'kitchen-flavor', ratio: 1.44 },
  { name: 'Solid Gold', file: 'solid-gold', ratio: 3.6 },
  { name: 'MSD Animal Health', file: 'msd-animal-health', ratio: 2.57 },
  { name: 'Thonglor Pet Hospital', file: 'thonglor-pet-hospital', ratio: 1.47 },
];

/** Sizes by visual area (px² at desktop), capped so very wide or tall marks stay in proportion. */
function logoSize(ratio: number, area: number, maxW: number, maxH: number) {
  let width = Math.sqrt(area * ratio);
  let height = width / ratio;
  if (width > maxW) {
    width = maxW;
    height = width / ratio;
  }
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

const SponsorLogo: React.FC<{ s: Sponsor; size: { width: number; height: number } }> = ({ s, size }) => (
  <img
    src={`/images/sponsors/${s.file}.webp`}
    alt={s.name}
    loading="lazy"
    decoding="async"
    width={size.width}
    height={size.height}
    style={{
      width: `calc(${size.width}px * var(--logo-scale))`,
      aspectRatio: `${size.width} / ${size.height}`,
    }}
    className={`h-auto max-w-full object-contain ${s.tile ? 'rounded-xl' : ''}`}
  />
);

export const SponsorsSection: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="sponsors"
      aria-labelledby="sponsors-heading"
      className="py-14 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 sm:mb-10 text-center">
          <h2 id="sponsors-heading" className="text-4xl sm:text-5xl font-bold text-[#2A1450]">
            ผู้สนับสนุนงาน
          </h2>
          <p className="mt-2 text-sm sm:text-base font-medium text-[#4B2D78]">
            ขอบคุณทุกหน่วยงานและแบรนด์ที่ร่วมสนับสนุนงานนี้
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="sponsor-board relative rounded-[28px] bg-white border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450] overflow-hidden"
        >
          {/* Race-tape edge along the top of the board */}
          <div
            aria-hidden="true"
            className="h-3 w-full"
            style={{
              background:
                'repeating-linear-gradient(135deg, #FFC928 0 14px, #2A1450 14px 28px)',
            }}
          />

          {/* Main supporters */}
          <ul className="flex flex-wrap justify-center items-center px-3 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-8 [--logo-scale:0.6] sm:[--logo-scale:0.8] lg:[--logo-scale:1]">
            {MAIN_SPONSORS.map((s) => (
              <li
                key={s.file}
                className="basis-1/3 flex items-center justify-center px-1 sm:px-4 min-h-[120px] sm:min-h-[170px] lg:min-h-[200px]"
              >
                <SponsorLogo s={s} size={logoSize(s.ratio, 30000, 220, 175)} />
              </li>
            ))}
          </ul>

          <div aria-hidden="true" className="mx-6 sm:mx-10 border-t-2 border-dashed border-[#2A1450]/15" />

          {/* Other supporters */}
          <ul className="flex flex-wrap justify-center items-center px-2 sm:px-6 py-5 sm:py-8 [--logo-scale:0.48] sm:[--logo-scale:0.85] lg:[--logo-scale:1]">
            {SPONSORS.map((s) => (
              <li
                key={s.file}
                className="basis-1/3 sm:basis-1/4 lg:basis-1/5 flex items-center justify-center px-2 py-2 sm:py-4 min-h-[64px] sm:min-h-[104px] lg:min-h-[118px]"
              >
                <SponsorLogo s={s} size={logoSize(s.ratio, 8500, 180, 92)} />
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="mt-6 text-center text-xs sm:text-sm font-medium text-[#6B5A85]">
          สนใจร่วมเป็นผู้สนับสนุน ติดต่อทีมผู้จัดงานได้ที่ช่องทางด้านล่างของหน้า
        </p>
      </div>
    </section>
  );
};
