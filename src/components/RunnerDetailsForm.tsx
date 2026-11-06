import React from 'react';
import { BLOOD_TYPES, GENDERS, PREFIXES, RELATIONSHIPS, ageFromBirthDate, type InsuranceInfo } from '../data/insurance';
import { digitsOnly, formatThaiId, isValidThaiId } from '../data/shooting';
import { SHIRT_CHART, SHIRT_SIZES as SHIRT_SIZE_IDS, isSpecialShirtSize, type ShirtSize } from '../data/shirts';

/**
 * Runner details of the registration form: one colourful card per runner (tabs on top), each with the
 * name, the insurance details and the jersey size. Runner 2+ fill exactly what runner 1 fills, and can
 * reuse runner 1's emergency contact with one tick. Checked in code (see runnerProblems), not by the
 * browser, because only the open tab is on screen.
 */
export interface RunnerEntry {
  prefix: string;
  firstName: string;
  lastName: string;
  /** 13-digit national ID, for the insurer */
  idCard: string;
  gender: string;
  /** YYYY-MM-DD (ค.ศ.) */
  birthDate: string;
  bloodType: string;
  medicalConditions: string;
  shirtSize: ShirtSize;
  emergencyName: string;
  relationship: string;
  /** runner 2+: use runner 1's emergency contact */
  sameEmergency: boolean;
}

export const emptyRunner = (i: number): RunnerEntry => ({
  prefix: '',
  firstName: '',
  lastName: '',
  idCard: '',
  gender: '',
  birthDate: '',
  bloodType: '',
  medicalConditions: '',
  shirtSize: i === 0 ? 'L' : 'M',
  emergencyName: '',
  relationship: '',
  sameEmergency: i > 0,
});

export const runnerName = (r: RunnerEntry | undefined) => (r ? `${r.firstName.trim()} ${r.lastName.trim()}`.trim() : '');

/** Back from a saved order (resuming an unfinished payment). */
export function runnerFromSaved(i: number, name: string, shirt: string | undefined, ins?: InsuranceInfo): RunnerEntry {
  const base = emptyRunner(i);
  const shirtSize = (SHIRT_SIZE_IDS as readonly string[]).includes(shirt || '') ? (shirt as ShirtSize) : base.shirtSize;
  if (!ins) {
    const [firstName = '', ...rest] = name.trim().split(/\s+/);
    return { ...base, shirtSize, firstName, lastName: rest.join(' ') };
  }
  return {
    ...base,
    shirtSize,
    prefix: ins.prefix,
    firstName: ins.firstName,
    lastName: ins.lastName,
    idCard: ins.idCard || '',
    gender: ins.gender,
    birthDate: ins.birthDate,
    bloodType: ins.bloodType,
    medicalConditions: ins.medicalConditions === 'ไม่มี' ? '' : ins.medicalConditions,
    emergencyName: ins.emergencyName,
    relationship: ins.relationship,
    sameEmergency: false,
  };
}

type Field = 'prefix' | 'firstName' | 'lastName' | 'idCard' | 'gender' | 'birthDate' | 'bloodType' | 'emergencyName' | 'relationship';

/** Missing fields of one runner (empty = complete). */
export function runnerProblems(r: RunnerEntry, i: number, insured: boolean): Field[] {
  const out: Field[] = [];
  if (insured && !r.prefix) out.push('prefix');
  if (!r.firstName.trim()) out.push('firstName');
  if (!r.lastName.trim()) out.push('lastName');
  if (!insured) return out;
  if (!isValidThaiId(r.idCard)) out.push('idCard');
  if (!r.gender) out.push('gender');
  const age = ageFromBirthDate(r.birthDate);
  if (age === null || age < 0 || age > 110) out.push('birthDate');
  if (!r.bloodType) out.push('bloodType');
  if (i === 0 || !r.sameEmergency) {
    if (r.emergencyName.trim().length < 2) out.push('emergencyName');
    if (!r.relationship) out.push('relationship');
  }
  return out;
}

/** The insurance record sent to the server; runner 2+ may borrow runner 1's emergency contact. */
export function toInsurance(r: RunnerEntry, main: RunnerEntry): InsuranceInfo {
  const em = r.sameEmergency && r !== main ? main : r;
  return {
    prefix: r.prefix,
    firstName: r.firstName.trim(),
    lastName: r.lastName.trim(),
    idCard: r.idCard,
    gender: r.gender,
    birthDate: r.birthDate,
    age: ageFromBirthDate(r.birthDate) ?? 0,
    bloodType: r.bloodType,
    medicalConditions: r.medicalConditions.trim() || 'ไม่มี',
    emergencyName: em.emergencyName.trim(),
    relationship: em.relationship,
  };
}

const COLORS = ['#7C3AED', '#EC4899', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444'];
const CHEST: Record<string, string> = Object.fromEntries(Object.entries(SHIRT_CHART).map(([k, v]) => [k, `${v.chest}"`]));
const todayIso = new Date().toISOString().slice(0, 10);

const lbl = 'block text-xs font-extrabold text-[#2A1450] mb-1.5';
const box = (bad: boolean) =>
  `w-full min-h-[48px] px-3.5 rounded-xl border-2 bg-white text-sm font-semibold text-[#2A1450] outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 ${
    bad ? 'border-rose-500 bg-rose-50' : 'border-[#2A1450]/20'
  }`;

/** Pill buttons for short choices (gender, blood type, size): one tap instead of a dropdown. */
const Pills: React.FC<{
  label: string;
  options: readonly string[];
  value: string;
  onPick: (v: string) => void;
  color: string;
  bad?: boolean;
  sub?: (v: string) => string | undefined;
}> = ({ label, options, value, onPick, color, bad, sub }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map((o) => {
      const on = value === o;
      return (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onPick(o)}
          className={`min-h-[44px] min-w-[52px] px-3 rounded-xl border-2 text-sm font-black cursor-pointer transition-all leading-tight ${
            on ? 'text-white -translate-y-0.5 shadow-[0_3px_0_#2A1450] border-[#2A1450]' : bad ? 'bg-rose-50 border-rose-400 text-[#2A1450]' : 'bg-white border-[#2A1450]/15 text-[#2A1450] hover:border-[#2A1450]/50'
          }`}
          style={on ? { background: color } : undefined}
        >
          {o}
          {sub?.(o) && <span className={`block text-[11px] font-bold ${on ? 'text-white/85' : 'text-[#6B5A85]'}`}>{sub(o)}</span>}
        </button>
      );
    })}
  </div>
);

/** A tinted block inside the card with an emoji title. */
const Group: React.FC<{ icon: string; title: string; tint: string; children: React.ReactNode; note?: string }> = ({ icon, title, tint, children, note }) => (
  <div className="rounded-2xl p-3.5 sm:p-4 space-y-3" style={{ background: tint }}>
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-xl bg-white border-2 border-[#2A1450] flex items-center justify-center text-base shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-sm font-black text-[#2A1450] leading-tight">{title}</p>
        {note && <p className="text-[11px] font-bold text-[#6B5A85] leading-snug">{note}</p>}
      </div>
    </div>
    {children}
  </div>
);

export const RunnerDetailsForm: React.FC<{
  runners: RunnerEntry[];
  onChange: (i: number, patch: Partial<RunnerEntry>) => void;
  active: number;
  onActive: (i: number) => void;
  /** every running distance is insured; false shows only name + size */
  insured: boolean;
  /** show missing fields in red (after a submit attempt) */
  showErrors: boolean;
  bibPreview?: string;
  distanceLabel: string;
}> = ({ runners, onChange, active, onActive, insured, showErrors, bibPreview, distanceLabel }) => {
  const i = Math.min(active, runners.length - 1);
  const r = runners[i];
  const color = COLORS[i % COLORS.length];
  const probs = runnerProblems(r, i, insured);
  const bad = (f: Field) => showErrors && probs.includes(f);
  const set = (patch: Partial<RunnerEntry>) => onChange(i, patch);
  const age = ageFromBirthDate(r.birthDate);
  const main = runners[0];

  return (
    <div className="space-y-3">
      {runners.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="เลือกนักวิ่งที่จะกรอกข้อมูล">
          {runners.map((x, k) => {
            const done = runnerProblems(x, k, insured).length === 0;
            const on = k === i;
            const c = COLORS[k % COLORS.length];
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onActive(k)}
                className={`inline-flex items-center gap-2 min-h-[46px] pl-2 pr-3.5 rounded-2xl border-[2.5px] text-sm font-black cursor-pointer transition-all ${
                  on ? 'text-white border-[#2A1450] shadow-[0_4px_0_#2A1450] -translate-y-0.5' : 'bg-white text-[#2A1450] border-[#2A1450]/20 hover:border-[#2A1450]/60'
                }`}
                style={on ? { background: c } : undefined}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 border-white"
                  style={{ background: on ? '#2A1450' : c, color: '#fff' }}
                >
                  {k + 1}
                </span>
                <span className="max-w-[9rem] truncate">{runnerName(x) || (k === 0 ? 'ผู้สมัครหลัก' : `นักวิ่งคนที่ ${k + 1}`)}</span>
                <span aria-label={done ? 'กรอกครบแล้ว' : 'ยังกรอกไม่ครบ'}>{done ? '✅' : showErrors ? '❗' : '✏️'}</span>
              </button>
            );
          })}
        </div>
      )}

      <div role={runners.length > 1 ? 'tabpanel' : undefined} className="rounded-3xl border-[3px] border-[#2A1450] bg-white overflow-hidden shadow-[0_6px_0_#2A1450]">
        <div className="relative px-4 sm:px-5 py-3 text-white flex flex-wrap items-center justify-between gap-2" style={{ background: `linear-gradient(120deg, ${color}, #2A1450)` }}>
          <span aria-hidden="true" className="absolute right-3 -top-3 text-6xl opacity-15 select-none">🏃</span>
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
              นักวิ่งคนที่ {i + 1} {i === 0 ? '· ผู้สมัครหลัก' : '· กรอกเหมือนคนที่ 1'}
            </p>
            <p className="text-lg sm:text-xl font-black leading-tight">{runnerName(r) || 'กรอกชื่อนักวิ่ง'}</p>
          </div>
          <span className="relative rounded-xl bg-white/15 border border-white/30 px-2.5 py-1 text-xs font-black">
            {distanceLabel}
            {i === 0 && bibPreview ? ` · BIB #${bibPreview}` : ''}
          </span>
        </div>

        <div className="p-3.5 sm:p-5 space-y-3.5">
          <Group icon="🪪" title="ชื่อ-นามสกุล (ตามบัตรประชาชน)" tint="#F5F0FF" note="ชื่อนี้ใช้ทั้งบน BIB ประกัน และเอกสารกิจกรรม กรอกครั้งเดียวพอ">
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr_1fr] gap-2.5">
              {insured && (
                <div>
                  <label className={lbl} htmlFor={`r${i}-prefix`}>คำนำหน้า *</label>
                  <select id={`r${i}-prefix`} value={r.prefix} onChange={(e) => set({ prefix: e.target.value })} className={box(bad('prefix'))}>
                    <option value="">เลือก</option>
                    {PREFIXES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={insured ? '' : 'sm:col-span-2'}>
                <label className={lbl} htmlFor={`r${i}-first`}>ชื่อ *</label>
                <input id={`r${i}-first`} type="text" maxLength={60} value={r.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="เช่น สมชาย" autoComplete={i === 0 ? 'given-name' : 'off'} className={box(bad('firstName'))} />
              </div>
              <div>
                <label className={lbl} htmlFor={`r${i}-last`}>นามสกุล *</label>
                <input id={`r${i}-last`} type="text" maxLength={60} value={r.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="เช่น ใจดี" autoComplete={i === 0 ? 'family-name' : 'off'} className={box(bad('lastName'))} />
              </div>
            </div>
          </Group>

          {insured && (
            <Group icon="🛡️" title="ข้อมูลทำประกันอุบัติเหตุ" tint="#E9FBF6" note="นักวิ่งทุกระยะได้รับความคุ้มครอง ใช้ส่งบริษัทประกันเท่านั้น">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className={lbl}>เพศ *</span>
                  <Pills label="เพศ" options={GENDERS} value={r.gender} onPick={(v) => set({ gender: v })} color={color} bad={bad('gender')} />
                </div>
                <div>
                  <span className={lbl}>กรุ๊ปเลือด *</span>
                  <Pills label="กรุ๊ปเลือด" options={BLOOD_TYPES} value={r.bloodType} onPick={(v) => set({ bloodType: v })} color={color} bad={bad('bloodType')} />
                </div>
                <div>
                  <label className={lbl} htmlFor={`r${i}-birth`}>วันเกิด (ค.ศ.) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`r${i}-birth`}
                      type="date"
                      min="1900-01-01"
                      max={todayIso}
                      value={r.birthDate}
                      onChange={(e) => set({ birthDate: e.target.value })}
                      autoComplete={i === 0 ? 'bday' : 'off'}
                      className={box(bad('birthDate'))}
                    />
                    <span className="shrink-0 min-w-[64px] min-h-[48px] px-2 rounded-xl bg-white border-2 border-dashed border-[#2A1450]/25 flex items-center justify-center text-sm font-black text-[#2A1450]" aria-live="polite">
                      {age !== null && age >= 0 && age <= 110 ? `${age} ปี` : 'อายุ'}
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl} htmlFor={`r${i}-idcard`}>เลขบัตรประชาชน 13 หลัก *</label>
                  <input
                    id={`r${i}-idcard`}
                    type="text"
                    inputMode="numeric"
                    maxLength={17}
                    autoComplete="off"
                    value={formatThaiId(r.idCard)}
                    onChange={(e) => set({ idCard: digitsOnly(e.target.value).slice(0, 13) })}
                    placeholder="x-xxxx-xxxxx-xx-x"
                    aria-invalid={bad('idCard')}
                    className={`${box(bad('idCard'))} font-mono`}
                  />
                  <p className="mt-1 text-[11px] font-bold text-[#6B5A85]">ใช้ส่งบริษัทประกันเท่านั้น (เด็กที่ยังไม่มีบัตร ใช้เลขประจำตัวประชาชน 13 หลักในสูติบัตร)</p>
                </div>
                <div>
                  <label className={lbl} htmlFor={`r${i}-med`}>โรคประจำตัว / แพ้ยา</label>
                  <input id={`r${i}-med`} type="text" maxLength={200} value={r.medicalConditions} onChange={(e) => set({ medicalConditions: e.target.value })} placeholder="ไม่มี เว้นว่างได้" className={box(false)} />
                </div>
              </div>
            </Group>
          )}

          <Group icon="👕" title="ไซส์เสื้อวิ่ง" tint="#FFF7DB">
            <Pills label="ไซส์เสื้อ" options={SHIRT_SIZE_IDS} value={r.shirtSize} onPick={(v) => set({ shirtSize: v as ShirtSize })} color={color} sub={(v) => (CHEST[v] ? `อก ${CHEST[v]} · ยาว ${SHIRT_CHART[v as ShirtSize].length}"${isSpecialShirtSize(v) ? ' · พิเศษ' : ''}` : undefined)} />
            <p className="mt-2 text-[11px] font-bold text-[#6B5A85]">ไซส์ 4XL ขึ้นไปเป็นไซส์พิเศษ · วัดรอบอกกับความยาวเสื้อเป็นนิ้ว ดูตารางไซส์ได้ที่หน้า Race Pack</p>
          </Group>

          {insured && (
            <Group icon="🆘" title="ผู้ติดต่อกรณีฉุกเฉิน / ผู้รับผลประโยชน์ประกัน" tint="#FFEFF3" note={i === 0 ? 'บุคคลนี้จะเป็นผู้รับผลประโยชน์ของประกันอุบัติเหตุด้วย · เบอร์โทรกรอกในส่วน "ช่องทางติดต่อ" ด้านล่าง' : 'บุคคลนี้จะเป็นผู้รับผลประโยชน์ของประกันอุบัติเหตุด้วย'}>
              {i > 0 && (
                <label className="flex items-center gap-2.5 rounded-xl bg-white border-2 border-[#2A1450]/15 px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={r.sameEmergency} onChange={(e) => set({ sameEmergency: e.target.checked })} className="w-5 h-5 accent-[#7C3AED] shrink-0" />
                  <span className="text-sm font-bold text-[#2A1450]">
                    ใช้ผู้ติดต่อเดียวกับคนที่ 1{main.emergencyName.trim() ? ` (${main.emergencyName.trim()})` : ''}
                  </span>
                </label>
              )}
              {(i === 0 || !r.sameEmergency) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl} htmlFor={`r${i}-emname`}>ชื่อผู้ติดต่อ *</label>
                    <input id={`r${i}-emname`} type="text" maxLength={80} value={r.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} placeholder="ชื่อ-นามสกุล" className={box(bad('emergencyName'))} />
                  </div>
                  <div>
                    <label className={lbl} htmlFor={`r${i}-rel`}>ความสัมพันธ์ *</label>
                    <select id={`r${i}-rel`} value={r.relationship} onChange={(e) => set({ relationship: e.target.value })} className={box(bad('relationship'))}>
                      <option value="">เลือก</option>
                      {RELATIONSHIPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </Group>
          )}

          {showErrors && probs.length > 0 && (
            <p role="alert" className="rounded-xl bg-rose-50 border-2 border-rose-400 px-3 py-2 text-xs sm:text-sm font-extrabold text-rose-700">
              ยังกรอกไม่ครบ: ช่องสีแดงด้านบน
            </p>
          )}

          {i < runners.length - 1 && (
            <button
              type="button"
              onClick={() => onActive(i + 1)}
              className="w-full min-h-[52px] rounded-2xl text-white text-base font-black border-[3px] border-[#2A1450] shadow-[0_4px_0_#2A1450] cursor-pointer active:translate-y-0.5"
              style={{ background: `linear-gradient(120deg, ${COLORS[(i + 1) % COLORS.length]}, #2A1450)` }}
            >
              ต่อไป: กรอกข้อมูลนักวิ่งคนที่ {i + 2} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Numbered, coloured header for each part of the form (1 ข้อมูลนักวิ่ง, 2 ช่องทางติดต่อ, ...). */
export const FormSection: React.FC<{ n: number; icon: string; title: string; sub?: string; color: string; children: React.ReactNode }> = ({
  n,
  icon,
  title,
  sub,
  color,
  children,
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-3">
      <span className="relative w-11 h-11 shrink-0 rounded-2xl border-[2.5px] border-[#2A1450] flex items-center justify-center text-xl shadow-[0_3px_0_#2A1450]" style={{ background: color }} aria-hidden="true">
        {icon}
        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#2A1450] text-[#FFE268] text-[11px] font-black flex items-center justify-center border-2 border-white">{n}</span>
      </span>
      <div className="min-w-0">
        <h3 className="text-base sm:text-lg font-black text-[#2A1450] leading-tight">{title}</h3>
        {sub && <p className="text-xs font-bold text-[#6B5A85] leading-snug">{sub}</p>}
      </div>
      <span aria-hidden="true" className="h-1 flex-1 rounded-full opacity-40" style={{ background: color }} />
    </div>
    {children}
  </section>
);
