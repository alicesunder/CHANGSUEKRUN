import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { TERMS, TermsGroup } from '../data/terms';
import { openPrivacyNotice } from './PrivacyNotice';

const OPEN_TERMS_EVENT = 'changsuek_open_terms';
export function openTerms() {
  window.dispatchEvent(new Event(OPEN_TERMS_EVENT));
}

const GroupBody: React.FC<{ g: TermsGroup }> = ({ g }) => (
  <div className="space-y-3 text-sm leading-relaxed text-[#3A2A52]">
    {g.sections.map((s, i) => (
      <div key={i}>
        {s.heading && <h4 className="font-bold text-[#2A1450] mb-1">{s.heading}</h4>}
        <ul className="list-disc pl-5 space-y-1">
          {s.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      </div>
    ))}
    {g.note && <p className="text-xs font-bold text-[#B91C1C]">หมายเหตุ: {g.note}</p>}
    {g.id === 'media' && (
      <button
        type="button"
        onClick={openPrivacyNotice}
        className="min-h-[32px] text-xs font-bold text-[#5B20A8] underline underline-offset-2 cursor-pointer"
      >
        อ่านประกาศความเป็นส่วนตัวฉบับเต็ม
      </button>
    )}
  </div>
);

/** Compact, collapsed-by-default terms block at the bottom of the page. */
export const TermsSection: React.FC = () => (
  <section id="terms" aria-labelledby="terms-heading" className="py-10 sm:py-12 scroll-mt-20">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h2 id="terms-heading" className="text-xl sm:text-2xl font-bold text-[#2A1450]">
        ข้อกำหนดและเงื่อนไข
      </h2>
      <p className="mt-1 text-sm font-medium text-[#6B5A85]">
        การสมัครถือว่ายอมรับเงื่อนไขทั้งหมด ไม่มีการคืนเงินค่าสมัคร และไม่อนุญาตให้โอนสิทธิ์
      </p>
      <div className="mt-4 rounded-2xl bg-white border-2 border-[#2A1450]/15 divide-y divide-[#2A1450]/10">
        {TERMS.map((g) => (
          <details key={g.id} className="group">
            <summary className="flex items-center justify-between gap-3 px-4 sm:px-5 min-h-[52px] cursor-pointer list-none font-bold text-[#2A1450] [&::-webkit-details-marker]:hidden">
              {g.title}
              <ChevronDown className="w-5 h-5 shrink-0 text-[#5B20A8] transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 sm:px-5 pb-4">
              <GroupBody g={g} />
            </div>
          </details>
        ))}
      </div>
    </div>
  </section>
);

/** Same content in a dialog, opened from the registration form's consent link. */
export const TermsModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_TERMS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TERMS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    // Capture phase + stop: Esc closes only this dialog, not the registration form underneath
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
      className="fixed inset-0 z-[10040] bg-[#140826]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[24px] bg-white border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450]"
      >
        <div className="sticky top-0 bg-white border-b border-[#2A1450]/10 px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <h2 id="terms-modal-title" className="text-lg sm:text-xl font-bold text-[#2A1450]">
            ข้อกำหนดและเงื่อนไข
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
        <div className="px-5 sm:px-7 py-5 space-y-6">
          {TERMS.map((g) => (
            <section key={g.id}>
              <h3 className="text-base font-bold text-[#2A1450] mb-2">{g.title}</h3>
              <GroupBody g={g} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
