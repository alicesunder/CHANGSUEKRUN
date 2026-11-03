import React, { useEffect, useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { adminApi, type VisitStats } from '../utils/api';

const nf = (n: number) => n.toLocaleString('th-TH');
const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * Admin card: how many people visited the site. "คน" counts distinct browsers per day,
 * "ครั้ง" counts page loads. Last 14 days as a small bar chart.
 */
export const VisitStatsCard: React.FC = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setStats(await adminApi.visits());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดสถิติผู้เข้าชมไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const max = Math.max(1, ...(stats?.days.map((d) => d.visitors) ?? [1]));
  const week = stats?.days.slice(-7).reduce((a, d) => a + d.visitors, 0) ?? 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4" aria-labelledby="visit-stats-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="visit-stats-title" className="text-base font-black text-slate-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#7B3FC6]" />
          ผู้เข้าชมเว็บไซต์
        </h3>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {error && <p role="alert" className="text-xs font-bold text-rose-700">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">วันนี้</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{nf(stats.today.visitors)} <span className="text-sm">คน</span></p>
              <p className="text-[11px] text-slate-500">เปิดหน้าเว็บ {nf(stats.today.views)} ครั้ง</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">7 วันล่าสุด</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{nf(week)} <span className="text-sm">คน-วัน</span></p>
              <p className="text-[11px] text-slate-500">รวมผู้เข้าชมของแต่ละวัน</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">ทั้งหมด</p>
              <p className="text-2xl font-black text-[#7B3FC6] tabular-nums">{nf(stats.total.visitors)} <span className="text-sm">คน</span></p>
              <p className="text-[11px] text-slate-500">เปิดหน้าเว็บ {nf(stats.total.views)} ครั้ง</p>
            </div>
          </div>

          <div>
            <div className="flex items-end gap-1 h-24" role="img" aria-label="จำนวนผู้เข้าชม 14 วันล่าสุด">
              {stats.days.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${shortDay(d.day)}: ${nf(d.visitors)} คน · ${nf(d.views)} ครั้ง`}>
                  <span className="text-[9px] font-bold text-slate-600 leading-none mb-0.5 tabular-nums">{d.visitors || ''}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#7B3FC6] to-[#C084FC]"
                    style={{ height: `${Math.max(d.visitors ? 6 : 2, (d.visitors / max) * 100)}%`, opacity: d.visitors ? 1 : 0.25 }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{shortDay(stats.days[0].day)}</span>
              <span>วันนี้</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            นับ 1 คนต่อ 1 อุปกรณ์/เบราว์เซอร์ต่อวัน ไม่เก็บข้อมูลส่วนบุคคล · ไม่นับการเข้าหน้าหลังบ้าน
          </p>
        </>
      )}
    </section>
  );
};
