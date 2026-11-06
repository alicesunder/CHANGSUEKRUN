import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X } from 'lucide-react';
import {
  WAIVER_GUARDIAN_AGE,
  WAIVER_LABEL,
  WIND_HEALTH_QUESTIONS,
  ageOn,
  participantProblems,
  windHealthProblems,
  type WaiverActivity,
  type WaiverParticipant,
} from '../data/activityWaivers';
import { digitsOnly, formatThaiId, isValidThaiId } from '../data/shooting';
import { WaiverDocument } from './WaiverDocument';

const labelCls = 'block text-xs font-extrabold text-[#2A1450] mb-1.5';
const inputCls = 'w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]';
const todayIso = new Date().toISOString().slice(0, 10);

/** Fills a participant from what the buyer already typed; anything the buyer edited here wins. */
export function mergeParticipant(auto: Partial<WaiverParticipant>, edit: Partial<WaiverParticipant> | undefined): WaiverParticipant {
  const e = edit || {};
  return {
    fullName: e.fullName ?? auto.fullName ?? '',
    birthDate: e.birthDate ?? auto.birthDate ?? '',
    phone: e.phone ?? auto.phone ?? '',
    idCard: e.idCard ?? auto.idCard ?? '',
    guardianName: e.guardianName ?? auto.guardianName ?? '',
    windHealth: { ...(auto.windHealth || {}), ...(e.windHealth || {}) },
  };
}

const ICON: Record<WaiverActivity, string> = { tower: '🪂', wind: '🌪️' };

/**
 * Tower / wind-tunnel block of the registration form: each participant's details (pre-filled from
 * the buyer's entries), the wind-tunnel health questions, and a button per document that opens the
 * filled-in waiver to read and accept. Accepting is undone automatically when the details change.
 */
export const ActivityWaiverForm: React.FC<{
  activities: WaiverActivity[];
  people: WaiverParticipant[];
  /** windHealth in a patch holds only the changed answers (they are merged) */
  onEdit: (i: number, patch: Partial<WaiverParticipant>) => void;
  /** activities whose document was accepted for the current details */
  accepted: Partial<Record<WaiverActivity, boolean>>;
  onAccept: (a: WaiverActivity) => void;
}> = ({ activities, people, onEdit, accepted, onAccept }) => {
  const [reading, setReading] = useState<WaiverActivity | null>(null);
  const wind = activities.includes('wind');
  const ready = people.every((p, i) => participantProblems(p, i, activities).length === 0);

  return (
    <div className="rounded-3xl border-2 border-[#0F766E] bg-[#F0FDFA] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-10 rounded-2xl bg-white border-2 border-[#2A1450] flex items-center justify-center text-lg shrink-0" aria-hidden="true">
          📜
        </span>
        <div>
          <h3 className="text-base font-black text-[#2A1450] leading-tight">ข้อมูลผู้ร่วมกิจกรรม {activities.map((a) => WAIVER_LABEL[a]).join(' / ')}</h3>
          <p className="text-xs font-bold text-[#6B5A85]">
            ใช้กรอกลงเอกสารสละสิทธิ์ฟ้องร้องตามกฎหมายของ บก.สอ.บช.ตชด. ให้อัตโนมัติ ({people.length} คน) · ระบบเติมข้อมูลที่กรอกไว้แล้วให้ก่อน ตรวจและแก้ได้
          </p>
        </div>
      </div>
      <p className="text-xs font-black text-[#7C2D12] bg-[#FFF7ED] border-2 border-dashed border-[#FDBA74] rounded-xl px-3 py-2 leading-snug">
        หมายเหตุ: เป็นเอกสารที่เจ้าหน้าที่ประจำสถานีเตรียมไว้ให้ลงลายมือชื่อก่อนทำกิจกรรม
      </p>

      {people.map((p, i) => {
        const age = ageOn(p.birthDate);
        const minor = age !== null && age < WAIVER_GUARDIAN_AGE;
        const idBad = p.idCard.length === 13 && !isValidThaiId(p.idCard);
        const healthBad = wind ? windHealthProblems(p.windHealth) : [];
        return (
          <fieldset key={i} className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3 space-y-2.5">
            <legend className="px-1.5 text-xs font-black text-[#0F766E]">ผู้ร่วมกิจกรรมคนที่ {i + 1}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>ชื่อ-นามสกุล (ตามบัตรประชาชน) *</label>
                <input type="text" required maxLength={120} value={p.fullName} onChange={(e) => onEdit(i, { fullName: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  วันเกิด *{age !== null && <span className="ml-1.5 text-[#0F766E]">(อายุ {age} ปี ณ วันกิจกรรม)</span>}
                </label>
                <input type="date" required min="1900-01-01" max={todayIso} value={p.birthDate} onChange={(e) => onEdit(i, { birthDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>เบอร์โทรศัพท์มือถือ *</label>
                <input type="tel" inputMode="tel" required value={p.phone} onChange={(e) => onEdit(i, { phone: digitsOnly(e.target.value).slice(0, 15) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>เลขบัตรประจำตัวประชาชน 13 หลัก *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  maxLength={17}
                  value={formatThaiId(p.idCard)}
                  onChange={(e) => onEdit(i, { idCard: digitsOnly(e.target.value).slice(0, 13) })}
                  placeholder="x-xxxx-xxxxx-xx-x"
                  aria-invalid={idBad}
                  className={`${inputCls} font-mono ${idBad ? '!border-rose-500' : ''}`}
                />
                {idBad && <p className="mt-1 text-xs font-bold text-rose-600">เลขบัตรไม่ถูกต้อง กรุณาตรวจอีกครั้ง</p>}
              </div>
              {minor && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>อายุต่ำกว่า {WAIVER_GUARDIAN_AGE} ปี: ชื่อ-นามสกุลผู้ปกครองที่ลงนามแทน *</label>
                  <input type="text" required maxLength={120} value={p.guardianName || ''} onChange={(e) => onEdit(i, { guardianName: e.target.value })} className={inputCls} />
                </div>
              )}
            </div>

            {wind && (
              <div className="rounded-xl bg-[#F0FDFA] border border-[#0F766E]/25 p-2.5">
                <p className="text-xs font-black text-[#2A1450] mb-1.5">🌪️ สภาพร่างกาย (อุโมงค์ลม) *</p>
                <ul className="space-y-2">
                  {WIND_HEALTH_QUESTIONS.map((q) => {
                    const v = p.windHealth?.[q.id];
                    return (
                      <li key={q.id} className="text-xs font-semibold text-[#2A1450]">
                        <p className="leading-snug">{q.text}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label={q.text}>
                          {(['ok', 'risk'] as const).map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              role="radio"
                              aria-checked={v === ans}
                              onClick={() => onEdit(i, { windHealth: { [q.id]: ans } })}
                              className={`min-h-[36px] px-3 rounded-lg border-2 text-xs font-extrabold cursor-pointer ${
                                v === ans
                                  ? ans === 'ok'
                                    ? 'bg-[#0F766E] border-[#0F766E] text-white'
                                    : 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-white border-[#2A1450]/20 text-[#2A1450]'
                              }`}
                            >
                              {v === ans ? '☑' : '☐'} {ans === 'ok' ? q.ok : q.risk}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {healthBad.length > 0 && (
                  <p role="alert" className="mt-2 text-xs font-bold text-rose-700">
                    ไม่สามารถใช้บริการอุโมงค์ลมได้ตามเงื่อนไขความปลอดภัย ({healthBad.join(', ')}) กรุณานำอุโมงค์ลมออกจากคำสั่งซื้อ หรือติดต่อผู้จัดงาน
                  </p>
                )}
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activities.map((a) => (
          <button
            key={a}
            type="button"
            disabled={!ready}
            onClick={() => setReading(a)}
            className={`min-h-[56px] px-4 rounded-2xl border-[3px] text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              accepted[a] ? 'bg-[#DCFCE7] border-[#15803D] text-[#14532D]' : 'bg-[#FFC928] border-[#2A1450] text-[#2A1450] shadow-[0_4px_0_#2A1450]'
            }`}
          >
            {accepted[a] ? '✅' : <FileText className="w-5 h-5" />}
            {accepted[a] ? `ยอมรับเอกสาร${WAIVER_LABEL[a]}แล้ว` : `อ่านเอกสารสละสิทธิ์ ${ICON[a]} ${WAIVER_LABEL[a]}`}
          </button>
        ))}
      </div>
      <p className="text-[11px] font-bold text-[#6B5A85] leading-snug">
        {ready
          ? 'ต้องอ่านเอกสารจนจบและกดยอมรับทุกฉบับก่อนชำระเงิน · ผู้จัดงานเก็บเอกสารที่กรอกแล้วไว้ และอาจให้ผู้ร่วมกิจกรรมลงนามฉบับพิมพ์ที่จุดลงทะเบียน'
          : 'กรอกข้อมูลผู้ร่วมกิจกรรมให้ครบก่อน จึงจะเปิดอ่านเอกสารได้'}
      </p>

      {reading && (
        <WaiverReader
          activity={reading}
          people={people}
          onClose={() => setReading(null)}
          onAccept={() => {
            onAccept(reading);
            setReading(null);
          }}
        />
      )}
    </div>
  );
};

/** Full-screen reader: the filled-in document for every participant; accept unlocks at the end. */
const WaiverReader: React.FC<{ activity: WaiverActivity; people: WaiverParticipant[]; onClose: () => void; onAccept: () => void }> = ({
  activity,
  people,
  onClose,
  onAccept,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 24 && setAtEnd(true);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-[#140826]/80 flex items-center justify-center p-2 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`เอกสารสละสิทธิ์ฟ้องร้อง ${WAIVER_LABEL[activity]}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[94vh] flex flex-col ds-modal overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#2A1450] text-white">
          <div>
            <p className="text-[11px] font-extrabold text-[#FFC928]">อ่านให้จบก่อนกดยอมรับ</p>
            <h3 className="text-sm sm:text-base font-black">
              {ICON[activity]} เอกสารสละสิทธิ์ฟ้องร้องตามกฎหมาย · {WAIVER_LABEL[activity]} ({people.length} ฉบับ)
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-8 bg-[#FAFAFA]">
          {people.map((p, i) => (
            <div key={i} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
              <WaiverDocument activity={activity} participant={p} />
            </div>
          ))}
        </div>
        <div className="border-t-2 border-[#2A1450]/10 p-3 sm:p-4 space-y-2.5 bg-white">
          <label className={`flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#2A1450] ${atEnd ? 'cursor-pointer' : 'opacity-50'}`}>
            <input type="checkbox" disabled={!atEnd} checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#15803D] shrink-0" />
            <span>
              ข้าพเจ้าได้อ่านเอกสารสละสิทธิ์ฟ้องร้องตามกฎหมาย ({WAIVER_LABEL[activity]}) ครบถ้วนแล้ว เข้าใจความเสี่ยง และยอมรับเงื่อนไขทั้งหมดในนามของข้าพเจ้าและผู้ร่วมกิจกรรมทุกคนในคำสั่งซื้อนี้
              {!atEnd && <span className="block text-[11px] font-bold text-amber-700">เลื่อนอ่านให้ถึงท้ายเอกสารก่อน ↓</span>}
            </span>
          </label>
          <button
            type="button"
            disabled={!agree}
            onClick={onAccept}
            className="w-full min-h-[52px] rounded-2xl bg-[#15803D] text-white text-base font-black border-[3px] border-[#14532D] shadow-[0_4px_0_#14532D] disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            ✍️ รับทราบและยอมรับ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
