import React from 'react';
import { BookUser, CalendarDays, Globe, Phone, User, Users } from 'lucide-react';
import { BLOOD_TYPES, GENDERS, NATIONALITIES, PREFIXES, RELATIONSHIPS, ageFromBirthDate, isFutureIsoDate, isValidPassport, normalizePassport, type InsuranceInfo } from '../data/insurance';
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
  /** a foreign runner: nationality + passport number + expiry replace the Thai national ID */
  foreigner: boolean;
  nationality: string;
  passportNo: string;
  /** YYYY-MM-DD */
  passportExpiry: string;
  /** emergency contact: name, relationship to the runner, phone */
  emergencyName: string;
  relationship: string;
  emergencyPhone: string;
  /** runner 2+: use runner 1's emergency contact */
  sameEmergency: boolean;
  /** insurance beneficiary: the same person as the emergency contact (one tick), or their own name + relationship */
  beneficiarySame: boolean;
  beneficiaryName: string;
  beneficiaryRelationship: string;
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
  foreigner: false,
  nationality: '',
  passportNo: '',
  passportExpiry: '',
  emergencyName: '',
  relationship: '',
  emergencyPhone: '',
  sameEmergency: i > 0,
  beneficiarySame: true,
  beneficiaryName: '',
  beneficiaryRelationship: '',
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
    foreigner: !!ins.foreigner,
    nationality: ins.nationality || '',
    passportNo: ins.passportNo || '',
    passportExpiry: ins.passportExpiry || '',
    emergencyName: ins.emergencyName,
    relationship: ins.relationship,
    emergencyPhone: ins.emergencyPhone || '',
    sameEmergency: false,
    beneficiarySame: !ins.beneficiaryName,
    beneficiaryName: ins.beneficiaryName || '',
    beneficiaryRelationship: ins.beneficiaryRelationship || '',
  };
}

type Field =
  | 'prefix' | 'firstName' | 'lastName' | 'idCard' | 'nationality' | 'passportNo' | 'passportExpiry' | 'gender' | 'birthDate' | 'bloodType'
  | 'emergencyName' | 'relationship' | 'emergencyPhone' | 'beneficiaryName' | 'beneficiaryRelationship';

/** Missing fields of one runner (empty = complete). */
export function runnerProblems(r: RunnerEntry, i: number, insured: boolean): Field[] {
  const out: Field[] = [];
  if (insured && !r.prefix) out.push('prefix');
  if (!r.firstName.trim()) out.push('firstName');
  if (!r.lastName.trim()) out.push('lastName');
  if (!insured) return out;
  if (r.foreigner) {
    if (!r.nationality) out.push('nationality');
    if (!isValidPassport(normalizePassport(r.passportNo))) out.push('passportNo');
    if (!isFutureIsoDate(r.passportExpiry)) out.push('passportExpiry');
  } else if (!isValidThaiId(r.idCard)) out.push('idCard');
  if (!r.gender) out.push('gender');
  const age = ageFromBirthDate(r.birthDate);
  if (age === null || age < 0 || age > 110) out.push('birthDate');
  if (!r.bloodType) out.push('bloodType');
  if (i === 0 || !r.sameEmergency) {
    if (r.emergencyName.trim().length < 2) out.push('emergencyName');
    if (!r.relationship) out.push('relationship');
    if (digitsOnly(r.emergencyPhone).length < 9) out.push('emergencyPhone');
  }
  if (!r.beneficiarySame) {
    if (r.beneficiaryName.trim().length < 2) out.push('beneficiaryName');
    if (!r.beneficiaryRelationship) out.push('beneficiaryRelationship');
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
    idCard: r.foreigner ? '' : r.idCard,
    ...(r.foreigner ? { foreigner: true, nationality: r.nationality, passportNo: normalizePassport(r.passportNo), passportExpiry: r.passportExpiry } : {}),
    gender: r.gender,
    birthDate: r.birthDate,
    age: ageFromBirthDate(r.birthDate) ?? 0,
    bloodType: r.bloodType,
    medicalConditions: r.medicalConditions.trim() || 'ไม่มี',
    emergencyName: em.emergencyName.trim(),
    relationship: em.relationship,
    emergencyPhone: digitsOnly(em.emergencyPhone),
    beneficiaryName: r.beneficiarySame ? em.emergencyName.trim() : r.beneficiaryName.trim(),
    beneficiaryRelationship: r.beneficiarySame ? em.relationship : r.beneficiaryRelationship,
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

/** Icon in front of a field (decoration only). */
const FieldIcon: React.FC<{ Icon: React.ComponentType<{ className?: string }> }> = ({ Icon }) => (
  <span aria-hidden="true" className="hidden sm:flex w-9 shrink-0 pt-8 justify-center text-[#6D28D9]">
    <Icon className="w-5 h-5" />
  </span>
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

      <div role={runners.length > 1 ? 'tabpanel' : undefined} className="ds-card overflow-hidden">
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
                <input id={`r${i}-first`} type="text" maxLength={60} value={r.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="เช่น ชัยโรจน์" autoComplete={i === 0 ? 'given-name' : 'off'} className={box(bad('firstName'))} />
              </div>
              <div>
                <label className={lbl} htmlFor={`r${i}-last`}>นามสกุล *</label>
                <input id={`r${i}-last`} type="text" maxLength={60} value={r.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="เช่น สหัสภูริพัฒน์" autoComplete={i === 0 ? 'family-name' : 'off'} className={box(bad('lastName'))} />
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
                  <span className={lbl}>สัญชาติ *</span>
                  <Pills
                    label="สัญชาติ"
                    options={['คนไทย', 'ชาวต่างชาติ (Foreigner)']}
                    value={r.foreigner ? 'ชาวต่างชาติ (Foreigner)' : 'คนไทย'}
                    onPick={(v) => set({ foreigner: v !== 'คนไทย' })}
                    color={color}
                  />
                </div>
                {!r.foreigner ? (
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
                ) : (
                  <div className="sm:col-span-2 space-y-3 rounded-2xl bg-[#F3ECFF] border-2 border-[#C9B4EE] p-3 sm:p-4">
                    <div className="flex gap-2">
                      <FieldIcon Icon={Globe} />
                      <div className="flex-1 min-w-0">
                        <label className={lbl} htmlFor={`r${i}-nat`}>Nationality (สัญชาติ) *</label>
                        <select id={`r${i}-nat`} value={r.nationality} onChange={(e) => set({ nationality: e.target.value })} className={box(bad('nationality'))}>
                          <option value="">เลือกสัญชาติ</option>
                          {NATIONALITIES.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FieldIcon Icon={BookUser} />
                      <div className="flex-1 min-w-0">
                        <label className={lbl} htmlFor={`r${i}-passport`}>Passport no. (เลขที่หนังสือเดินทาง) *</label>
                        <input
                          id={`r${i}-passport`}
                          type="text"
                          maxLength={20}
                          autoComplete="off"
                          autoCapitalize="characters"
                          value={r.passportNo}
                          onChange={(e) => set({ passportNo: normalizePassport(e.target.value) })}
                          placeholder="กรอกเลขที่หนังสือเดินทาง"
                          aria-invalid={bad('passportNo')}
                          className={`${box(bad('passportNo'))} font-mono uppercase`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FieldIcon Icon={CalendarDays} />
                      <div className="flex-1 min-w-0">
                        <label className={lbl} htmlFor={`r${i}-pexp`}>Expiry date (วันหมดอายุหนังสือเดินทาง) *</label>
                        <input id={`r${i}-pexp`} type="date" min={todayIso} max="2099-12-31" value={r.passportExpiry} onChange={(e) => set({ passportExpiry: e.target.value })} aria-invalid={bad('passportExpiry')} className={box(bad('passportExpiry'))} />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-[#6B5A85]">Used for the accident insurance only · ใช้ส่งบริษัทประกันเท่านั้น</p>
                  </div>
                )}
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
            <Group icon="🆘" title="ผู้ติดต่อกรณีฉุกเฉิน" tint="#FFEFF3" note="ผู้ที่เจ้าหน้าที่จะโทรหาถ้าเกิดเหตุฉุกเฉินระหว่างงาน">
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
                  <div className="sm:col-span-2">
                    <label className={lbl} htmlFor={`r${i}-emname`}>ชื่อ-นามสกุล *</label>
                    <div className="relative">
                      <User aria-hidden="true" className="w-5 h-5 text-[#6D28D9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input id={`r${i}-emname`} type="text" maxLength={80} value={r.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} placeholder="กรอกชื่อ-นามสกุล" className={`${box(bad('emergencyName'))} pl-11`} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl} htmlFor={`r${i}-emphone`}>เบอร์โทรศัพท์ *</label>
                    <div className="relative">
                      <Phone aria-hidden="true" className="w-5 h-5 text-[#6D28D9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input id={`r${i}-emphone`} type="tel" inputMode="tel" maxLength={20} value={r.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} placeholder="08x-xxx-xxxx" className={`${box(bad('emergencyPhone'))} pl-11`} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl} htmlFor={`r${i}-rel`}>ความสัมพันธ์ *</label>
                    <select id={`r${i}-rel`} value={r.relationship} onChange={(e) => set({ relationship: e.target.value })} className={box(bad('relationship'))}>
                      <option value="">เลือกความสัมพันธ์</option>
                      {RELATIONSHIPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </Group>
          )}

          {insured && (
            <Group icon="☂️" title="ผู้รับผลประโยชน์ (ประกันอุบัติเหตุ)" tint="#EEF2FF" note="ผู้ที่จะได้รับสิทธิประโยชน์จากกรมธรรม์ประกันอุบัติเหตุตามเงื่อนไขของกิจกรรม">
              <label className="flex items-center gap-2.5 rounded-xl bg-white border-2 border-[#2A1450]/15 px-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={r.beneficiarySame} onChange={(e) => set({ beneficiarySame: e.target.checked })} className="w-5 h-5 accent-[#7C3AED] shrink-0" />
                <span className="text-sm font-bold text-[#2A1450]">เป็นคนเดียวกับผู้ติดต่อฉุกเฉิน</span>
              </label>
              {!r.beneficiarySame && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl} htmlFor={`r${i}-bename`}>ชื่อ-นามสกุล *</label>
                    <div className="relative">
                      <User aria-hidden="true" className="w-5 h-5 text-[#6D28D9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input id={`r${i}-bename`} type="text" maxLength={80} value={r.beneficiaryName} onChange={(e) => set({ beneficiaryName: e.target.value })} placeholder="กรอกชื่อ-นามสกุล" className={`${box(bad('beneficiaryName'))} pl-11`} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl} htmlFor={`r${i}-berel`}>ความสัมพันธ์ *</label>
                    <select id={`r${i}-berel`} value={r.beneficiaryRelationship} onChange={(e) => set({ beneficiaryRelationship: e.target.value })} className={box(bad('beneficiaryRelationship'))}>
                      <option value="">เลือกความสัมพันธ์</option>
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
