import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { eventInfo } from '../data/eventData';

/**
 * ประกาศความเป็นส่วนตัว (PDPA) — DRAFT for the organiser's review before launch.
 * Items marked [ยืนยัน] in comments are proposals the organiser must confirm.
 */
export const PRIVACY_POLICY_VERSION = '2026-10-22';
export const OPEN_PRIVACY_EVENT = 'changsuek_open_privacy';

export function openPrivacyNotice() {
  window.dispatchEvent(new Event(OPEN_PRIVACY_EVENT));
}

export const PrivacyNotice: React.FC = () => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_PRIVACY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PRIVACY_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    // Capture phase + stop: Esc closes only this notice, not the registration form underneath
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] bg-[#140826]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[24px] bg-white border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450]"
      >
        <div className="sticky top-0 bg-white border-b border-[#2A1450]/10 px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <h2 id="privacy-title" className="text-lg sm:text-xl font-bold text-[#2A1450]">
            ประกาศความเป็นส่วนตัว
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิด"
            className="w-11 h-11 rounded-full bg-[#F3EEFB] hover:bg-[#E6DBF7] text-[#2A1450] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-5 space-y-4 text-sm leading-relaxed text-[#3A2A52]">
          <p>
            กองบัญชาการตำรวจตระเวนชายแดน ("ผู้จัดงาน") ผู้จัดงาน CHANG SUEK RUN 2027 เก็บและใช้ข้อมูลส่วนบุคคลของผู้สมัครเท่าที่จำเป็นต่อการจัดงานวิ่งเท่านั้น
            ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </p>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">ข้อมูลที่เราเก็บ</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>ชื่อ-นามสกุล เบอร์โทรศัพท์ อีเมล และเบอร์ติดต่อฉุกเฉิน</li>
              <li>ระยะวิ่ง ไซซ์เสื้อ ชื่อผู้ร่วมวิ่ง (ถ้ามี) และชื่อ/สายพันธุ์สุนัข (ประเภท Dog Run)</li>
              <li>สถานะการชำระเงินและเลขอ้างอิงรายการจาก Omise</li>
            </ul>
            <p className="mt-1">
              เราไม่เก็บเลขบัตรประชาชน เลขหนังสือเดินทาง ข้อมูลบัตรหรือบัญชีธนาคาร การชำระเงินดำเนินการโดย Omise
              ตามนโยบายความเป็นส่วนตัวของ Omise
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">ใช้ข้อมูลเพื่อ</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>รับสมัคร ยืนยันการชำระเงิน ออกเลข BIB และแจกอุปกรณ์การแข่งขัน (ฐานสัญญา)</li>
              <li>ติดต่อผู้สมัครเรื่องการแข่งขัน และติดต่อผู้ติดต่อฉุกเฉินเมื่อเกิดเหตุระหว่างงาน (ฐานสัญญาและฐานประโยชน์สำคัญต่อชีวิต)</li>
              <li>ประกาศผลการแข่งขันด้วยชื่อ เลข BIB และเวลา (ฐานสัญญา)</li>
              <li>ถ่ายภาพและวิดีโอภายในงานเพื่อประชาสัมพันธ์กิจกรรม ตามข้อกำหนดและเงื่อนไขการสมัคร</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">การเปิดเผยและระยะเวลาเก็บ</h3>
            <p>
              เราไม่ขายหรือส่งข้อมูลให้ผู้สนับสนุนหรือบุคคลอื่นเพื่อการตลาด เปิดเผยเฉพาะผู้ให้บริการที่จำเป็นต่อการจัดงาน
              เช่น ผู้ให้บริการรับชำระเงิน ผู้ให้บริการจับเวลา บริษัทประกันภัย หรือหน่วยงานรัฐตามที่กฎหมายกำหนด ผู้จัดงานเก็บข้อมูลไว้เท่าที่จำเป็นอย่างสมเหตุสมผลเพื่อวัตถุประสงค์ข้างต้น
              หรือตามที่กฎหมายกำหนด
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">สิทธิของคุณ</h3>
            <p>
              คุณขอเข้าถึง แก้ไข ลบ หรือคัดค้านการใช้ข้อมูลของคุณได้ โดยติดต่อผู้จัดงานที่{' '}
              <a className="font-bold text-[#5B20A8] underline" href={`mailto:${eventInfo.contactEmail}`}>
                {eventInfo.contactEmail}
              </a>{' '}
              หรือโทร {eventInfo.contactPhone} หากเห็นว่าการใช้ข้อมูลไม่เป็นไปตามกฎหมาย
              คุณร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ได้
            </p>
          </section>

          <p className="text-xs text-[#6B5A85]">ฉบับวันที่ 22 ตุลาคม 2569</p>
        </div>
      </div>
    </div>
  );
};
