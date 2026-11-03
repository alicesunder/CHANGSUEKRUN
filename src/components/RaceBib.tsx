import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { eventInfo } from '../data/eventData';

/**
 * The race BIB in the organiser's design (public/images/bib/bib-base.webp, 1536 x 1024, sponsor strip
 * included, number / name / QR areas left blank): number, name, distance, age group and QR are drawn on top.
 * Sizes are in container units, so the card scales to any width. Styles: .rbib-* in index.css.
 */
const DIST: Record<string, { label: string; sub: string }> = {
  '10km': { label: '10K', sub: 'THAILAND' },
  '5km': { label: '5K', sub: 'THAILAND' },
  '3km': { label: '3.8K', sub: 'DOG RUN' },
  '1km': { label: '1K', sub: 'DOG RUN' },
};

export const RaceBib: React.FC<{
  bib: string;
  routeId: string;
  name: string;
  orderId?: string;
  gender?: string;
  age?: number | null;
  /** Dog Run: the dog's name goes next to the runner's */
  dogName?: string;
  className?: string;
}> = ({ bib, routeId, name, orderId, gender, age, dogName, className = '' }) => {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let off = false;
    QRCode.toDataURL(JSON.stringify(orderId ? { orderId, bib } : { bib }), { margin: 1, width: 280, errorCorrectionLevel: 'M', color: { dark: '#1E0B3D', light: '#FFFFFF' } })
      .then((u) => !off && setQr(u))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [orderId, bib]);

  const d = DIST[routeId] || { label: routeId.toUpperCase(), sub: 'THAILAND' };
  const hasAge = typeof age === 'number' && age > 0 && age < 111;
  const decade = hasAge ? Math.floor((age as number) / 10) : null;
  const letter = gender === 'หญิง' ? 'F' : gender === 'ชาย' ? 'M' : '•';
  const numSize = Math.min(17.6, 64 / (Math.max(bib.length, 4) * 0.62));

  return (
    <div className={`rbib ${className}`} role="img" aria-label={`ป้าย BIB หมายเลข ${bib} ${name} ระยะ ${d.label}`}>
      <img className="rbib-bg" src="/images/bib/bib-base.webp" alt="" draggable={false} />
      <div className="rbib-dist">
        <b>{d.label}</b>
        <span>{d.sub}</span>
      </div>
      <div className="rbib-age">
        <div className="rbib-age-box">
          <b>{letter}</b>
          <i />
          <b>{decade ?? '•'}</b>
        </div>
        <small>AGE GROUP</small>
        <strong>{hasAge ? `${decade! * 10}-${decade! * 10 + 9}` : '—'}</strong>
      </div>
      <div className="rbib-num" style={{ fontSize: `${numSize.toFixed(2)}cqw` }}>
        {bib}
      </div>
      <div className="rbib-line" />
      <div className="rbib-name">
        {name || 'นักวิ่งช้างศึก'}
        {dogName ? <span className="rbib-dog"> · 🐶 {dogName}</span> : null}
      </div>
      <div className="rbib-qr">
        {qr ? <img src={qr} alt="" /> : <span className="rbib-qr-wait" />}
        <small>CHECK-IN · RACE RESULT</small>
      </div>
      <div className="rbib-sos">
        <small>EMERGENCY CONTACT</small>
        {eventInfo.contactPhones.map((p) => (
          <b key={p}>{p}</b>
        ))}
      </div>
    </div>
  );
};

/** BIB number of runner n in an order: runner 1 keeps the order's BIB, the others get -2, -3, ... */
export const runnerBib = (bib: string, i: number) => (i === 0 ? bib : `${bib}-${i + 1}`);
