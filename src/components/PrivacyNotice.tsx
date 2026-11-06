import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { eventInfo } from '../data/eventData';
import { useLang } from '../i18n/lang';

/**
 * ประกาศความเป็นส่วนตัว (PDPA) — DRAFT for the organiser's review before launch.
 * Items marked [ยืนยัน] in comments are proposals the organiser must confirm.
 */
export const PRIVACY_POLICY_VERSION = '2026-11-02';
export const OPEN_PRIVACY_EVENT = 'changsuek_open_privacy';

export function openPrivacyNotice() {
  window.dispatchEvent(new Event(OPEN_PRIVACY_EVENT));
}

export const PrivacyNotice: React.FC = () => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const { t, lang } = useLang();

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
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto ds-modal"
      >
        <div className="sticky top-0 bg-white border-b border-[#2A1450]/10 px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <h2 id="privacy-title" className="text-lg sm:text-xl font-bold text-[#2A1450]">
            {t('ประกาศความเป็นส่วนตัว', 'Privacy Notice')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('ปิด', 'Close')}
            className="w-11 h-11 rounded-full bg-[#F3EEFB] hover:bg-[#E6DBF7] text-[#2A1450] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-5 space-y-4 text-sm leading-relaxed text-[#3A2A52]">
          <p>
            {t(
              'กองบัญชาการตำรวจตระเวนชายแดน ("ผู้จัดงาน") ผู้จัดงาน CHANG SUEK RUN 2027 เก็บและใช้ข้อมูลส่วนบุคคลของผู้สมัครเท่าที่จำเป็นต่อการจัดงานวิ่งเท่านั้น ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
              'The Border Patrol Police Bureau (the "Organiser"), organiser of CHANG SUEK RUN 2027, collects and uses applicants\' personal data only as far as needed to run the event, in line with the Personal Data Protection Act B.E. 2562 (2019).'
            )}
          </p>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">{t('ข้อมูลที่เราเก็บ', 'Data we collect')}</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>{t('ชื่อ-นามสกุล เบอร์โทรศัพท์ อีเมล และเบอร์ติดต่อฉุกเฉิน', 'Full name, phone number, e-mail and emergency contact number')}</li>
              <li>{t('ระยะวิ่ง ไซซ์เสื้อ ชื่อผู้ร่วมวิ่ง (ถ้ามี) และชื่อ/สายพันธุ์สุนัข (ประเภท Dog Run)', 'Race distance, shirt size, running partner (if any), and dog name/breed (Dog Run)')}</li>
              <li>
                {t(
                  'รูปสลิปการโอนเงินที่คุณแนบ และข้อมูลบนสลิป ได้แก่ ชื่อผู้โอน ธนาคารผู้โอน เลขบัญชีบางส่วน (ตามที่ธนาคารปิดบังไว้) ยอดเงิน วันเวลา และเลขที่รายการ',
                  'The payment slip image you attach and what is on it: sender name, sender bank, partial account number (as masked by the bank), amount, date/time and transaction reference'
                )}
              </li>
              <li>{t('สถานะการชำระเงินและผลการตรวจสลิป', 'Payment status and slip-check result')}</li>
              <li>{t('ข้อมูลสำหรับทำประกันอุบัติเหตุของนักวิ่งทุกระยะ: คำนำหน้า ชื่อ เพศ วันเกิด เลขบัตรประจำตัวประชาชน กรุ๊ปเลือด โรคประจำตัว และผู้ติดต่อฉุกเฉิน (ซึ่งจะเป็นผู้รับผลประโยชน์ของประกันด้วย)', 'Accident-insurance details for runners of every distance: title, name, gender, date of birth, national ID number, blood group, medical conditions and emergency contact (who is also named as the insurance beneficiary)')}</li>
              <li>{t('ผู้ซื้อกิจกรรมยิงปืน: ชื่อ-นามสกุลและเลขบัตรประจำตัวประชาชนของผู้ยิงทุกคน และเวลาที่ยอมรับใบยินยอม', 'Shooting activity buyers: full name and national ID number of every shooter, and the time the consent form was accepted')}</li>
              <li>{t('ผู้ซื้อ VIP TABLE: ทะเบียนรถและจังหวัด สำหรับออกบัตรจอดรถ', 'VIP TABLE buyers: licence plate and province, used to issue the parking pass')}</li>
            </ul>
            <p className="mt-1">
              {t(
                'เราใช้รูปสลิปเพื่อยืนยันการชำระเงินเท่านั้น โดยส่งรูปสลิปให้ EasySlip (ผู้ให้บริการตรวจสอบสลิป) ตรวจกับข้อมูลของธนาคาร เลขบัตรประชาชนเก็บเพื่อสองวัตถุประสงค์เท่านั้น คือแจ้งชื่อผู้เอาประกันกับบริษัทประกัน และลงทะเบียนผู้ร่วมกิจกรรมยิงปืนกับสนามยิงปืน และแสดงให้เฉพาะเจ้าหน้าที่ที่เกี่ยวข้อง เราไม่เก็บเลขหนังสือเดินทาง ข้อมูลบัตร หรือเลขบัญชีธนาคารเต็มของคุณ',
                'We use the slip image only to confirm payment, by sending it to EasySlip (the slip-verification provider) to check against bank records. National ID numbers are collected for two purposes only: to enrol you with the insurer, and to register shooting-activity participants with the shooting range. They are shown to authorised staff only. We do not store passport numbers, card details or your full bank account number.'
              )}
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">{t('ใช้ข้อมูลเพื่อ', 'What we use it for')}</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>{t('รับสมัคร ยืนยันการชำระเงิน ออกเลข BIB และแจกอุปกรณ์การแข่งขัน (ฐานสัญญา)', 'Registration, confirming payment, issuing BIB numbers and handing out race kits (contract basis)')}</li>
              <li>{t('ติดต่อผู้สมัครเรื่องการแข่งขัน และติดต่อผู้ติดต่อฉุกเฉินเมื่อเกิดเหตุระหว่างงาน (ฐานสัญญาและฐานประโยชน์สำคัญต่อชีวิต)', 'Contacting you about the race, and your emergency contact if something happens during the event (contract and vital-interest basis)')}</li>
              <li>{t('ประกาศผลการแข่งขันด้วยชื่อ เลข BIB และเวลา (ฐานสัญญา)', 'Publishing results with name, BIB number and time (contract basis)')}</li>
              <li>{t('ถ่ายภาพและวิดีโอภายในงานเพื่อประชาสัมพันธ์กิจกรรม ตามข้อกำหนดและเงื่อนไขการสมัคร', 'Photos and video at the event to promote it, as set out in the registration terms and conditions')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">{t('การเปิดเผยและระยะเวลาเก็บ', 'Disclosure and retention')}</h3>
            <p>
              {t(
                'เราไม่ขายหรือส่งข้อมูลให้ผู้สนับสนุนหรือบุคคลอื่นเพื่อการตลาด เปิดเผยเฉพาะผู้ให้บริการที่จำเป็นต่อการจัดงาน เช่น ผู้ให้บริการตรวจสอบสลิป (EasySlip) ผู้ให้บริการจับเวลา บริษัทประกันภัย หรือหน่วยงานรัฐตามที่กฎหมายกำหนด ผู้จัดงานเก็บข้อมูลไว้เท่าที่จำเป็นอย่างสมเหตุสมผลเพื่อวัตถุประสงค์ข้างต้น หรือตามที่กฎหมายกำหนด',
                'We do not sell or pass your data to sponsors or anyone else for marketing. We share it only with providers the event needs — the slip-verification provider (EasySlip), the timing provider, the insurer, or government bodies where the law requires. We keep data only as long as reasonably necessary for the purposes above, or as the law requires.'
              )}
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#2A1450] mb-1">{t('สิทธิของคุณ', 'Your rights')}</h3>
            <p>
              {t('คุณขอเข้าถึง แก้ไข ลบ หรือคัดค้านการใช้ข้อมูลของคุณได้ โดยติดต่อผู้จัดงานที่', 'You may ask to access, correct, delete or object to the use of your data by contacting the Organiser at')}{' '}
              <a className="font-bold text-[#5B20A8] underline" href={`mailto:${eventInfo.contactEmail}`}>
                {eventInfo.contactEmail}
              </a>{' '}
              {t('หรือโทร', 'or by phone at')} {eventInfo.contactPhone}{' '}
              {t(
                'หากเห็นว่าการใช้ข้อมูลไม่เป็นไปตามกฎหมาย คุณร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ได้',
                'If you believe your data is being used unlawfully, you may complain to the Personal Data Protection Committee Office (PDPC).'
              )}
            </p>
          </section>

          <p className="text-xs text-[#6B5A85]">{t('ฉบับวันที่ 2 พฤศจิกายน 2569', 'Version dated 2 November 2026 (B.E. 2569)')}</p>
          {lang === 'en' && (
            <p className="text-xs text-[#6B5A85]">This English text is a convenience translation. If it differs from the Thai version, the Thai version prevails.</p>
          )}
        </div>
      </div>
    </div>
  );
};
