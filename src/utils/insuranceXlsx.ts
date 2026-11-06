import type { TicketOrder } from './runnerStorage';
import { appendSecurityAuditLog } from './securityShield';

/**
 * Insurance list in the insurer's own form (MTI "Excel file MTI.XLS": sheets "แจ้งเพิ่ม" = add, "แจ้งออก" = remove).
 * One row per paid runner who has insurance details (runner 1 of each order + extra runners with their own details).
 *
 * Fixed values come from here so they are easy to change:
 *  - position: what the insurer calls "ตำแหน่ง"
 *  - plan / premium: left empty until the organiser knows the plan chosen with the insurer (the insurer's own numbers)
 *  - cover dates: the race day
 * Beneficiary = the emergency contact the runner named (name + relationship) — the form tells the runner so.
 * Dates are written dd/mm/yyyy in the Buddhist era (พ.ศ.) as text, the way Thai insurers usually want them.
 */
export const MTI_DEFAULTS: {
  position: string;
  planOrSumInsured: number | null;
  premium: number | null;
  coverFrom: string;
  coverTo: string;
} = {
  position: 'นักวิ่ง',
  planOrSumInsured: null,
  premium: null,
  coverFrom: '2027-01-09',
  coverTo: '2027-01-09',
};

/** "2027-01-09" -> "09/01/2570" */
export function thaiBuddhistDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) + 543}` : '';
}

const ADD_HEADER_1 = [
  'ลำดับ',
  'คำนำ',
  'ชื่อ',
  'นามสกุล',
  'วันเกิด',
  'อายุ',
  'เลขบัตรประจำตัวประชาชน',
  'ตำแหน่ง',
  'แผนที่เลือก / ทุนประกันภัย',
  'เบี้ยประกันภัย',
  'รายละเอียดบัตรประชาชน / VISA / PASSPORT',
  '',
  'ชื่อผู้รับผลประโยชน์',
  'ความสัมพันธ์ของ\nผู้รับผลประโยชน์',
  'วันเริ่มคุ้มครอง',
  'วันที่สิ้นสุด',
];
const REMOVE_HEADER_1 = [...ADD_HEADER_1.slice(0, 8), 'แผนที่เลือก', 'เบี้ยประกันภัย', ADD_HEADER_1[10], '', ADD_HEADER_1[12], ADD_HEADER_1[13], 'วันที่มีผลบังคับ'];
const HEADER_2 = ['', '', '', '', '', '', '', '', '', '', 'เลขที่', 'วันที่หมดอายุ', '', '', '', ''];

/** Header rows exactly like the template: single columns merged over both rows, K:L (ID details) merged on row 1. */
function templateSheet(XLSX: typeof import('xlsx'), header1: string[], rows: (string | number)[][]) {
  const width = header1.length;
  const ws = XLSX.utils.aoa_to_sheet([header1, HEADER_2.slice(0, width), ...rows]);
  const merges: import('xlsx').Range[] = [];
  for (let c = 0; c < width; c++) {
    if (c === 10) merges.push({ s: { r: 0, c: 10 }, e: { r: 0, c: 11 } });
    else if (c !== 11) merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  }
  ws['!merges'] = merges;
  ws['!cols'] = [6, 9, 14, 16, 13, 7, 21, 12, 20, 13, 19, 16, 27, 18, 14, 14].slice(0, width).map((wch) => ({ wch }));
  return ws;
}

/** Downloads the .xlsx and returns how many people it holds. */
export async function exportInsuranceXlsx(orders: TicketOrder[], actor = 'admin'): Promise<number> {
  const insured = orders.filter((o) => o.insurance && o.paymentStatus === 'PAID');
  const people = insured.flatMap((o) => [
    o.insurance!,
    ...(o.extraRunners || []).filter((r) => r.insurance).map((r) => r.insurance!),
  ]);
  const rows = people.map((n, i) => [
    i + 1,
    n.prefix,
    n.firstName,
    n.lastName,
    thaiBuddhistDate(n.birthDate),
    n.age,
    n.idCard || '', // text: a 13-digit number must not turn into 1.23E+12
    MTI_DEFAULTS.position,
    MTI_DEFAULTS.planOrSumInsured ?? '',
    MTI_DEFAULTS.premium ?? '',
    '',
    '',
    n.emergencyName,
    n.relationship,
    thaiBuddhistDate(MTI_DEFAULTS.coverFrom),
    thaiBuddhistDate(MTI_DEFAULTS.coverTo),
  ]);

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, templateSheet(XLSX, ADD_HEADER_1, rows), 'แจ้งเพิ่ม');
  XLSX.utils.book_append_sheet(wb, templateSheet(XLSX, REMOVE_HEADER_1, []), 'แจ้งออก');
  XLSX.writeFile(wb, `CHANGSUEK_RUN_2027_MTI_INSURANCE_${new Date().toISOString().slice(0, 10)}.xlsx`);

  appendSecurityAuditLog({
    action: 'CSV_EXPORTED_FULL',
    severity: 'WARNING',
    actor,
    detail: `ส่งออกรายชื่อทำประกัน (แบบฟอร์ม MTI, มีเลขบัตรประชาชน) จำนวน ${people.length} คน`,
  });
  return people.length;
}
