import React from 'react';
import {
  WAIVER_ACTIVITY_DATE,
  WAIVER_DOCS,
  WAIVER_GUARDIAN_AGE,
  WIND_HEALTH_QUESTIONS,
  ageOn,
  thaiDate,
  type WaiverActivity,
  type WaiverParticipant,
} from '../data/activityWaivers';
import { formatThaiId, maskThaiId } from '../data/shooting';

/*
 * One filled-in waiver for one participant. Inline styles only, so the same markup can be copied
 * into a print window (admin) and still look like the paper form.
 */

const S = {
  page: { fontFamily: "'Sarabun','TH Sarabun New','Leelawadee UI',Tahoma,sans-serif", color: '#111', fontSize: 15, lineHeight: 1.75, background: '#fff' } as React.CSSProperties,
  center: { textAlign: 'center' } as React.CSSProperties,
  org: { textAlign: 'center', fontWeight: 800, fontSize: 16 } as React.CSSProperties,
  title: { textAlign: 'center', fontWeight: 900, fontSize: 19, margin: '2px 0 8px' } as React.CSSProperties,
  p: { margin: '0 0 8px', textIndent: 28, textAlign: 'justify' } as React.CSSProperties,
  fill: { fontWeight: 800, color: '#2A1450', borderBottom: '1.5px dotted #555', padding: '0 4px' } as React.CSSProperties,
  h: { fontWeight: 800 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', margin: '6px 0 10px', fontSize: 14 } as React.CSSProperties,
  td: { border: '1px solid #999', padding: '4px 6px', verticalAlign: 'top' } as React.CSSProperties,
  sigRow: { display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', marginTop: 14 } as React.CSSProperties,
  sig: { minWidth: 220, flex: 1, textAlign: 'center', fontSize: 14 } as React.CSSProperties,
  esign: { display: 'inline-block', marginTop: 4, padding: '2px 8px', border: '1.5px solid #15803D', borderRadius: 6, color: '#15803D', fontSize: 12, fontWeight: 800 } as React.CSSProperties,
};

const Fill: React.FC<{ v?: string; w?: number }> = ({ v, w = 140 }) => (
  <span style={{ ...S.fill, display: 'inline-block', minWidth: w }}>{v || ' '}</span>
);

const Box: React.FC<{ on: boolean }> = ({ on }) => (
  <span style={{ display: 'inline-block', width: 15, textAlign: 'center', fontWeight: 900 }}>{on ? '☑' : '☐'}</span>
);

const Sign: React.FC<{ name?: string; role?: string; date?: string; esign?: boolean }> = ({ name, role, date, esign }) => (
  <div style={S.sig}>
    <div>ลงชื่อ ....................................................{role ? ` ${role}` : ''}</div>
    <div>( {name || ' '.repeat(40)} )</div>
    <div>{date || '......../......../........'}</div>
    {esign && <div style={S.esign}>✔ ยอมรับเอกสารทางออนไลน์แล้ว</div>}
  </div>
);

export const WaiverDocument: React.FC<{
  activity: WaiverActivity;
  participant: WaiverParticipant;
  /** order id shown in the corner (admin print) */
  orderId?: string;
  /** when the buyer accepted the document online (ISO) */
  acceptedAt?: string;
  /** show the national ID as x-xxxx-xxxxx-12-3 (copies sent to the buyer) */
  maskId?: boolean;
}> = ({ activity, participant: p, orderId, acceptedAt, maskId }) => {
  const doc = WAIVER_DOCS[activity];
  const age = ageOn(p.birthDate);
  const minor = age !== null && age < WAIVER_GUARDIAN_AGE;
  const accepted = acceptedAt ? thaiDate(acceptedAt.slice(0, 10)) : '';

  return (
    <article style={S.page} className="waiver-doc">
      {orderId && <div style={{ textAlign: 'right', fontSize: 11, color: '#666' }}>คำสั่งซื้อ {orderId}</div>}
      <div style={S.org}>{doc.org}</div>
      <div style={S.title}>{doc.title}</div>
      {doc.intro.map((t, i) => (
        <p key={i} style={i === 0 ? { ...S.p, textIndent: 0, textAlign: 'center', fontWeight: 700 } : S.p}>
          {t}
        </p>
      ))}

      <p style={S.p}>
        ข้าพเจ้า <Fill v={p.fullName} w={200} /> วัน เดือน ปี เกิด <Fill v={thaiDate(p.birthDate)} w={130} /> อายุ <Fill v={age !== null ? String(age) : ''} w={36} /> ปี
        วันเดือนปีที่ใช้บริการ <Fill v={thaiDate(WAIVER_ACTIVITY_DATE)} w={130} /> เบอร์โทรศัพท์มือถือ <Fill v={p.phone} w={110} /> เลขบัตรประชาชน{' '}
        <Fill v={maskId ? maskThaiId(p.idCard) : formatThaiId(p.idCard)} w={150} /> ยอมรับเงื่อนไขดังต่อไปนี้
      </p>

      {doc.body.map((b, i) => (
        <React.Fragment key={i}>
          <p style={S.p}>
            {b.heading && <span style={S.h}>“{b.heading}” </span>}
            {b.text}
          </p>
          {doc.health && i === 0 && (
            <>
              <p style={{ ...S.p, textIndent: 0, marginTop: 6 }}>
                <span style={S.h}>“สภาพร่างกาย”</span>
              </p>
              <table style={S.table}>
                <tbody>
                  {WIND_HEALTH_QUESTIONS.map((q) => {
                    const a = p.windHealth?.[q.id];
                    return (
                      <tr key={q.id}>
                        <td style={S.td}>{q.text}</td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          <Box on={a === 'ok'} /> {q.ok}
                        </td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          <Box on={a === 'risk'} /> {q.risk}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p style={{ ...S.p, textIndent: 0 }}>ข้าพเจ้าเข้าใจและตระหนักถึงความสำคัญของคำถามสุขภาพข้างต้น</p>
            </>
          )}
        </React.Fragment>
      ))}

      <div style={S.sigRow}>
        <Sign name={p.fullName} role="ผู้ใช้บริการ" date={accepted} esign={Boolean(acceptedAt)} />
        <Sign role="พยาน" />
      </div>

      {minor && (
        <div style={{ marginTop: 14 }}>
          <p style={{ ...S.p, textIndent: 0, fontWeight: 800, textDecoration: 'underline' }}>ในกรณีที่ผู้ใช้บริการอายุต่ำกว่า {WAIVER_GUARDIAN_AGE} ปี</p>
          <p style={S.p}>{doc.guardianText}</p>
          <div style={S.sigRow}>
            <Sign name={p.guardianName} role="ผู้ปกครอง" date={accepted} />
            <Sign role="พยาน" />
          </div>
        </div>
      )}
    </article>
  );
};

/**
 * Prints the given documents (one per A4 page) from a hidden frame, so no pop-up window is needed.
 * In the print dialog the admin can also pick "Save as PDF".
 */
export function printWaivers(container: HTMLElement | null, title: string) {
  if (!container) return;
  const docs = [...container.querySelectorAll('.waiver-doc')].map((d) => `<section class="sheet">${d.outerHTML}</section>`).join('');
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/><title>${title.replace(/[<>&]/g, '')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap" rel="stylesheet"/>
<style>@page{size:A4;margin:14mm}body{margin:0;background:#fff}.sheet{page-break-after:always;padding:8px 4px}.sheet:last-child{page-break-after:auto}</style>
</head><body>${docs}</body></html>`;
  document.getElementById('waiver-print-frame')?.remove();
  const frame = document.createElement('iframe');
  frame.id = 'waiver-print-frame';
  frame.title = title;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  frame.onload = () => {
    const w = frame.contentWindow;
    if (!w) return;
    // give the Thai web font a moment to load before printing
    const go = () => setTimeout(() => w.print(), 200);
    const fonts = (w.document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(go, go);
    else go();
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
}
