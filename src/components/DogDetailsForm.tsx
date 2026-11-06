import React from 'react';
import {
  DOG_GENDERS,
  DOG_NEUTERED,
  DOG_SIZES,
  DOG_TEMPERAMENTS,
  DOG_VACCINES,
  dogProfileProblems,
  type DogProfile,
} from '../data/dogProfile';

/** The dog's details beyond name + breed: birth year, sex, weight, size, neutered, vaccine, allergies, temperament. */
export type DogExtra = Omit<DogProfile, 'name' | 'breed'>;

export const emptyDogExtra = (): DogExtra => ({ birthYear: 0, gender: '', weightKg: 0, size: '', neutered: '', vaccine: '', allergies: '', temperament: '' });

export const dogExtraFromProfile = (p?: DogProfile): DogExtra =>
  p ? { birthYear: p.birthYear, gender: p.gender, weightKg: p.weightKg, size: p.size, neutered: p.neutered, vaccine: p.vaccine, allergies: p.allergies, temperament: p.temperament } : emptyDogExtra();

const lbl = 'block text-xs font-extrabold text-[#14532D] mb-1.5';
const box = (bad: boolean) =>
  `w-full min-h-[48px] px-3.5 rounded-xl border-2 ${bad ? 'border-rose-500' : 'border-emerald-300'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 bg-white text-sm font-semibold text-[#14532D] outline-none`;

const Pills: React.FC<{ label: string; options: readonly string[]; value: string; onPick: (v: string) => void; bad: boolean }> = ({ label, options, value, onPick, bad }) => (
  <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-2 ${bad ? 'rounded-xl ring-2 ring-rose-500 p-1' : ''}`}>
    {options.map((o) => (
      <button
        key={o}
        type="button"
        role="radio"
        aria-checked={value === o}
        onClick={() => onPick(o)}
        className={`min-h-[44px] px-4 rounded-full border-2 text-sm font-extrabold cursor-pointer transition-colors ${
          value === o ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-emerald-300 text-[#14532D] hover:bg-emerald-50'
        }`}
      >
        {o}
      </button>
    ))}
  </div>
);

export const DogDetailsForm: React.FC<{
  name: string;
  breed: string;
  extra: DogExtra;
  onChange: (next: DogExtra) => void;
  showErrors: boolean;
}> = ({ name, breed, extra, onChange, showErrors }) => {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => thisYear - i);
  const problems = dogProfileProblems({ name, breed, ...extra }, thisYear);
  const bad = (what: string) => showErrors && problems.includes(what);
  const set = (patch: Partial<DogExtra>) => onChange({ ...extra, ...patch });
  return (
    <div className="mt-3.5 ds-card p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={lbl} htmlFor="dog-year">ปีเกิดน้อง (ประมาณเอาก็ได้) *</label>
          <select id="dog-year" value={extra.birthYear || ''} onChange={(e) => set({ birthYear: Number(e.target.value) || 0 })} className={box(bad('ปีเกิดน้อง'))}>
            <option value="">เลือกปี (ค.ศ.)</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y} ({thisYear - y === 0 ? 'ไม่ถึงปี' : `${thisYear - y} ปี`})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl} htmlFor="dog-weight">น้ำหนัก (กก.) *</label>
          <input
            id="dog-weight"
            type="number"
            inputMode="decimal"
            min={0.5}
            max={120}
            step={0.1}
            value={extra.weightKg || ''}
            onChange={(e) => set({ weightKg: Number(e.target.value) || 0 })}
            placeholder="เช่น 12"
            className={box(bad('น้ำหนักน้อง'))}
          />
        </div>
      </div>

      <div>
        <span className={lbl}>เพศ *</span>
        <Pills label="เพศ" options={DOG_GENDERS} value={extra.gender} onPick={(v) => set({ gender: v })} bad={bad('เพศน้อง')} />
      </div>
      <div>
        <span className={lbl}>ขนาด *</span>
        <Pills label="ขนาด" options={DOG_SIZES} value={extra.size} onPick={(v) => set({ size: v })} bad={bad('ขนาดน้อง')} />
      </div>
      <div>
        <span className={lbl}>ทำหมันแล้วหรือยัง *</span>
        <Pills label="ทำหมัน" options={DOG_NEUTERED} value={extra.neutered} onPick={(v) => set({ neutered: v })} bad={bad('ทำหมันแล้วหรือยัง')} />
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-3.5 space-y-4">
        <p className="text-sm font-black text-[#14532D]">🩺 สุขภาพและนิสัย</p>
        <div>
          <span className={lbl}>วัคซีน *</span>
          <Pills label="วัคซีน" options={DOG_VACCINES} value={extra.vaccine} onPick={(v) => set({ vaccine: v })} bad={bad('สถานะวัคซีน')} />
        </div>
        <div>
          <label className={lbl} htmlFor="dog-allergy">ภูมิแพ้</label>
          <input id="dog-allergy" type="text" maxLength={200} value={extra.allergies} onChange={(e) => set({ allergies: e.target.value })} placeholder="เช่น ไก่ หญ้า (ถ้าไม่มี เว้นว่างไว้ได้เลย)" className={box(false)} />
        </div>
        <div>
          <span className={lbl}>เมื่ออยู่กับน้องหมาตัวอื่น *</span>
          <Pills label="นิสัย" options={DOG_TEMPERAMENTS} value={extra.temperament} onPick={(v) => set({ temperament: v })} bad={bad('นิสัยเมื่ออยู่กับน้องหมาตัวอื่น')} />
        </div>
      </div>
    </div>
  );
};
