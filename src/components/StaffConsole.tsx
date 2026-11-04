import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, ScanLine, X } from 'lucide-react';
import { LangSwitch, useLang } from '../i18n/lang';
import { clearSession, staffApi, type Session } from '../utils/runnerAuth';
import { TicketScannerAdmin } from './TicketScannerAdmin';

/**
 * What ticket-checking staff see after logging in: only the QR scanner (find a ticket, check the kit in).
 * The staff token can reach nothing else on the server.
 */
export const StaffConsole: React.FC<{ isOpen: boolean; session: Session; onClose: () => void }> = ({ isOpen, session, onClose }) => {
  const { t } = useLang();
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10090] overflow-y-auto bg-[#140826]/85 p-2 backdrop-blur-md sm:p-6">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border-[3px] border-[#2A1450] bg-[#FAF8FF] text-[#2A1450] shadow-[0_10px_0_#2A1450]">
        <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-gradient-to-br from-[#0F766E] via-[#4C1D95] to-[#2D1052] px-4 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#FFE268] bg-white/95 text-[#0F766E]" aria-hidden="true">
              <ScanLine className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FFE268]">CHANGSUEK RUN 2027 · STAFF</p>
              <h2 className="truncate text-lg font-black leading-tight">{t('เจ้าหน้าที่ตรวจบัตร', 'Ticket check')} · {session.user.name}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LangSwitch className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => {
                clearSession();
                onClose();
              }}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-black hover:bg-white/25 cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> {t('ออก', 'Log out')}
            </button>
            <button type="button" onClick={onClose} aria-label={t('ปิด', 'Close')} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <TicketScannerAdmin api={staffApi} />
        </div>
      </div>
    </div>,
    document.body
  );
};
