import { useEffect, useState } from 'react';
import { getPublicConfig } from './api';

/** Sales status for the public page: closed by hand, or not open yet (opensAt = the scheduled opening, ISO). */
export function useSalesInfo(): { closed: boolean; opensAt: string | null } {
  const [info, setInfo] = useState<{ closed: boolean; opensAt: string | null }>({ closed: false, opensAt: null });
  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => {
        if (alive) setInfo({ closed: c.salesOpen === false, opensAt: c.salesOpensAt || null });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return info;
}

/** "9 พ.ย. 2569 เวลา 09.00 น." / "9 Nov 2026, 09:00" in Bangkok time. */
export function formatOpenAt(iso: string, en: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString(en ? 'en-GB' : 'th-TH-u-ca-buddhist', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false });
  return en ? `${date}, ${time}` : `${date} เวลา ${time.replace(':', '.')} น.`;
}

/** True while the admin's early-bird switch is on (read from the public config, once per page load). */
export function useEarlyBird(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => {
        if (alive) setOn(c.earlyBird === true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return on;
}
