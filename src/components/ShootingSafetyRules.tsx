import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SHOOTING_FOUR_RULES, SHOOTING_MANDATORY_RULES } from '../data/shootingRules';

/**
 * Safety rules of the shooting range (from the signs at the range), shown in Thai and English only,
 * with the "I have read and accept" box the buyer must tick before paying.
 */
export const ShootingSafetyRules: React.FC<{
  accepted: boolean;
  onChange: (v: boolean) => void;
}> = ({ accepted, onChange }) => (
  <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 overflow-hidden">
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1E3A8A] text-white">
      <ShieldAlert className="w-5 h-5 shrink-0 text-[#FDE68A]" aria-hidden="true" />
      <div>
        <p className="text-sm font-black leading-tight">กฎการป้องกันที่ต้องปฏิบัติ</p>
        <p className="text-[11px] font-bold text-white/85 leading-tight">Mandatory Safety Requirements</p>
      </div>
    </div>

    <div className="p-3.5 space-y-3 bg-[#FFFBEB]">
      <div className="rounded-xl border-2 border-[#EAB308]/60 bg-white p-3">
        <p className="text-sm font-black text-[#2A1450] leading-snug">กฎความปลอดภัยในการใช้อาวุธปืน 4 ประการ</p>
        <p className="text-xs font-extrabold text-[#1E3A8A] italic leading-snug">The Four Fundamental Rules of Firearm Safety</p>
        <ol className="mt-2 space-y-2">
          {SHOOTING_FOUR_RULES.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FFC928] border-2 border-[#2A1450] text-xs font-black text-[#2A1450]">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[#2A1450] leading-snug">{r.th}</span>
                <span className="block text-xs font-semibold text-[#4B2D78] leading-snug">{r.en}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <ul className="space-y-2">
        {SHOOTING_MANDATORY_RULES.map((r, i) => (
          <li key={i} className="rounded-xl border border-[#1E3A8A]/20 bg-white px-3 py-2">
            <span className="block text-sm font-extrabold text-[#2A1450] leading-snug">{r.th}</span>
            <span className="block text-xs font-semibold text-[#4B2D78] leading-snug">{r.en}</span>
          </li>
        ))}
      </ul>

      <label className={`flex items-start gap-3 rounded-xl border-[3px] p-3 cursor-pointer ${accepted ? 'border-[#15803D] bg-[#DCFCE7]' : 'border-[#2A1450] bg-white'}`}>
        <input type="checkbox" required checked={accepted} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-6 h-6 accent-[#15803D] shrink-0" />
        <span className="text-sm font-extrabold text-[#2A1450] leading-snug">
          ข้าพเจ้าได้อ่านและเข้าใจกฎความปลอดภัยของสนามยิงปืนข้างต้น รับทราบความเสี่ยง และยอมรับเงื่อนไขการเข้าร่วมกิจกรรมยิงปืน *
          <span className="mt-0.5 block text-xs font-semibold text-[#4B2D78]">
            I have read and understood the shooting range safety rules above, acknowledge the risks, and accept the conditions of the shooting activity.
          </span>
        </span>
      </label>
    </div>
  </div>
);
