import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Contest {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  accent: string;
  tint: string;
  /** what the judges score, out of 100 */
  criteria: { label: string; pts: number }[];
  rules: string[];
}

/**
 * Two dog contests on run day (Sat 9 Jan 2570, judging 09.00–14.00, awards 15.00–17.00).
 * The rules below are a first draft for the organiser to confirm.
 */
const CONTESTS: Contest[] = [
  {
    id: 'healthy',
    emoji: '💪',
    title: 'ประกวดสุนัขสุขภาพดี',
    tagline: 'ใครดูแลน้องดีที่สุด สัตวแพทย์ร่วมตัดสิน!',
    accent: '#10B981',
    tint: '#ECFDF5',
    criteria: [
      { label: 'รูปร่าง & น้ำหนักเหมาะสม', pts: 30 },
      { label: 'ขนและผิวหนัง', pts: 20 },
      { label: 'ความร่าเริง กระฉับกระเฉง', pts: 20 },
      { label: 'ฟันและช่องปาก', pts: 15 },
      { label: 'ตา หู สะอาด', pts: 15 },
    ],
    rules: [
      'น้องหมาอายุ 1 ปีขึ้นไป แสดงสมุดวัคซีน (พิษสุนัขบ้า + วัคซีนรวม) ที่ฉีดไม่เกิน 1 ปี',
      'แบ่ง 3 รุ่นตามน้ำหนัก: เล็ก (ไม่เกิน 10 กก.) · กลาง (10–25 กก.) · ใหญ่ (เกิน 25 กก.) ชั่งน้ำหนักที่จุดลงทะเบียน',
      'สัตวแพทย์ตรวจคัดกรองก่อนขึ้นเวที น้องที่ป่วย ตั้งท้อง หรือมีแผลเปิด ขอให้งดประกวดเพื่อความปลอดภัย',
      'ไม่ตัดสินจากสายพันธุ์หรือความสวย ดูที่สุขภาพและการดูแลของเจ้าของเท่านั้น',
      'กรรมการขอจับตัวน้องหมาได้ เจ้าของต้องอยู่ข้างน้องและจูงสายตลอดเวลา',
    ],
  },
  {
    id: 'obedience',
    emoji: '🎓',
    title: 'ประกวดสุนัขเชื่อฟังคำสั่ง',
    tagline: '5 ด่าน ภายใน 3 นาที ทำได้ครบ ได้คะแนนเต็ม 100',
    accent: '#7C3AED',
    tint: '#F5F3FF',
    criteria: [
      { label: 'นั่ง (Sit)', pts: 20 },
      { label: 'หมอบ (Down)', pts: 20 },
      { label: 'รอ 30 วินาที (Stay)', pts: 20 },
      { label: 'เรียกมา 5 เมตร (Recall)', pts: 20 },
      { label: 'เดินชิด 10 เมตร (Heel)', pts: 20 },
    ],
    rules: [
      'ทำ 5 ด่านต่อเนื่องภายใน 3 นาที สั่งได้ทั้งเสียงและมือ แต่ละด่านสั่งได้ไม่เกิน 3 ครั้ง',
      'ด่าน "รอ" เจ้าของถอยห่าง 3 เมตร น้องต้องอยู่กับที่ 30 วินาที · ด่าน "เรียกมา" ใช้สายจูงยาว 5 เมตรที่ผู้จัดเตรียมให้',
      'ให้ขนมได้หลังจบแต่ละด่านเท่านั้น ห้ามถือขนมล่อระหว่างสั่ง',
      'ห้ามดุ ตี กระชากสาย หรือใช้ปลอกคอช็อตไฟฟ้า/ปลอกคอหนาม ฝ่าฝืนถูกตัดสิทธิ์ทันที',
      'คะแนนเท่ากัน น้องที่ใช้เวลาน้อยกว่าชนะ',
    ],
  },
];

const SHARED_RULES = [
  'ร่วมได้เฉพาะผู้ถือตั๋ว Dog Run (1K / 3.8K) ไม่เสียค่าสมัครเพิ่ม · 1 ตั๋ว ส่งน้องหมาได้ 1 ตัว และลงได้ทั้ง 2 รายการ',
  'ลงทะเบียนที่เต็นท์ประกวด วันเสาร์ที่ 9 ม.ค. 2570 เวลา 08.00–09.30 น. (ประกวด 09.00–14.00 น. · มอบรางวัล 15.00–17.00 น.)',
  'จูงสายตลอดเวลา และเก็บมูลน้องหมาทุกครั้ง · ถ้าน้องเครียดหรือร้อน ขอพักหรือถอนตัวได้ทันที',
  'คำตัดสินของคณะกรรมการและสัตวแพทย์ถือเป็นที่สิ้นสุด',
];

/** Healthy-dog and obedience contests: two bright cards with scoring bars and the rules. */
export const DogContestSection: React.FC = () => (
  <section id="dog-contest" aria-labelledby="dog-contest-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="text-center mb-5">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#047857]">
        🐶 ประกวดน้องหมา · วันเสาร์ที่ 9 ม.ค. 2570
      </span>
      <h2 id="dog-contest-heading" className="squiggle squiggle-center mt-2 font-hero text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-[1.35]">
        ประกวด <span className="text-[#10B981]">สุขภาพดี</span> &amp; <span className="text-[#7C3AED]">เชื่อฟังคำสั่ง</span>
      </h2>
      <p className="mt-1 text-sm sm:text-base font-semibold text-[#4B2D78]">ฟรีสำหรับคู่วิ่ง Dog Run · ลงได้ทั้ง 2 รายการ</p>
    </div>

    <div data-reveal-stagger="tilt" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {CONTESTS.map((c) => (
        <article
          key={c.id}
          className="relative sticker overflow-hidden p-4 sm:p-5 flex flex-col gap-3"
          style={{ background: `linear-gradient(160deg, #FFFFFF 0%, ${c.tint} 100%)` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 shrink-0 rounded-2xl border-[3px] border-[var(--ink)] flex items-center justify-center text-2xl shadow-[0_3px_0_var(--ink)]"
              style={{ background: c.accent }}
              aria-hidden="true"
            >
              {c.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] leading-tight">{c.title}</h3>
              <p className="text-xs sm:text-sm font-bold" style={{ color: c.accent }}>
                {c.tagline}
              </p>
            </div>
          </div>

          <ul className="space-y-1.5" aria-label={`เกณฑ์ให้คะแนน ${c.title}`}>
            {c.criteria.map((k) => (
              <li key={k.label} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[var(--ink)]">
                <span className="w-[46%] sm:w-[44%] shrink-0 leading-snug">{k.label}</span>
                <span className="flex-1 h-2.5 rounded-full bg-[#EEE7F8] overflow-hidden">
                  <span className="block h-full rounded-full" style={{ width: `${k.pts * 2.5}%`, background: c.accent }} />
                </span>
                <span className="w-7 text-right tabular-nums" style={{ color: c.accent }}>
                  {k.pts}
                </span>
              </li>
            ))}
          </ul>

          <details className="group rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15 mt-auto">
            <summary className="list-none cursor-pointer min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-extrabold text-[var(--ink)]">
              <span>📋 กติกา{c.title}</span>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" style={{ color: c.accent }} aria-hidden="true" />
            </summary>
            <ul className="px-4 pb-4 space-y-1.5 text-xs sm:text-sm font-semibold text-[#4B2D78] list-disc pl-8">
              {c.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
        </article>
      ))}
    </div>

    <div className="mt-4 rounded-2xl bg-[#FFF8E1] border-2 border-[var(--ink)]/15 p-4">
      <h3 className="text-sm sm:text-base font-extrabold text-[var(--ink)] mb-1.5">📌 กติการ่วมของทั้ง 2 รายการ</h3>
      <ul className="space-y-1 text-xs sm:text-sm font-semibold text-[#4B2D78] list-disc pl-5">
        {SHARED_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs font-bold text-[#8A5A00]">🎁 รางวัล: ประกาศเร็วๆ นี้</p>
    </div>
  </section>
);
