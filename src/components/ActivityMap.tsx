import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { ACTIVITY_LOCATIONS } from '../data/activityLocations';

/** Real map with a pin for each after-run activity (tower, shooting range, wind tunnel). */
export const ActivityMap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
        if (cancelled || !elRef.current) return;
        const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
        mapRef.current = map;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        const bounds = L.latLngBounds([]);
        for (const a of ACTIVITY_LOCATIONS) {
          const icon = L.divIcon({
            className: '',
            iconSize: [34, 42],
            iconAnchor: [17, 40],
            popupAnchor: [0, -36],
            html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${a.color};border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font-weight:900;font-size:15px;font-family:inherit">${a.station}</span></div>`,
          });
          const popup = document.createElement('div');
          popup.style.cssText = 'padding:10px 14px;min-width:150px';
          const title = document.createElement('div');
          title.style.cssText = 'font-weight:900;color:#2A1450;font-size:14px';
          title.textContent = `สถานีที่ ${a.station} · ${a.name}`;
          const link = document.createElement('a');
          link.href = a.mapsUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.cssText = 'display:inline-block;margin-top:4px;font-weight:800;font-size:12px;color:#5B20A8;text-decoration:underline';
          link.textContent = 'นำทางด้วย Google Maps';
          popup.append(title, link);
          L.marker([a.lat, a.lng], { icon, title: a.name }).addTo(map).bindPopup(popup);
          bounds.extend([a.lat, a.lng]);
        }
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const focus = (lat: number, lng: number) => {
    mapRef.current?.flyTo([lat, lng], 17, { duration: 0.8 });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-[#7B3FC6]" />
        <h4 className="text-sm font-black text-[#2A1450]">ตำแหน่งกิจกรรมหลังวิ่ง</h4>
      </div>
      {failed ? (
        <p role="alert" className="rounded-2xl border-2 border-[#2A1450]/15 bg-[#FAF7FF] p-4 text-xs font-bold text-[#6B5A85]">
          โหลดแผนที่ไม่สำเร็จ กดปุ่มด้านล่างเพื่อเปิดตำแหน่งใน Google Maps แทน
        </p>
      ) : (
        <div
          ref={elRef}
          role="region"
          aria-label="แผนที่ตำแหน่งสนามยิงปืน หอสูง และอุโมงค์ลม"
          className="h-[300px] sm:h-[360px] rounded-2xl border-[2.5px] border-[#2A1450] overflow-hidden bg-[#E6F1F5] z-0"
        />
      )}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ACTIVITY_LOCATIONS.map((a) => (
          <div key={a.id} className="rounded-2xl border-2 border-[#2A1450]/15 bg-white p-2.5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => focus(a.lat, a.lng)}
              aria-label={`ซูมไปที่${a.name}`}
              className="w-9 h-9 shrink-0 rounded-full text-white text-sm font-black cursor-pointer"
              style={{ background: a.color }}
            >
              {a.station}
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-[#2A1450] truncate">{a.name}</div>
              <a
                href={a.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5B20A8] underline"
              >
                <Navigation className="w-3 h-3" /> นำทาง <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
