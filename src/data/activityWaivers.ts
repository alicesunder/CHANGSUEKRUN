// Legal waivers for the high tower and the wind tunnel (organiser's documents from บก.สอ.บช.ตชด.).
// Every participant's details are filled into the document automatically; the buyer reads the filled
// document and accepts it before paying. Shared by the form and the server (the server checks it).
import { digitsOnly, isValidThaiId } from './shooting';
import { isValidPassport, normalizePassport } from './insurance';

export type WaiverActivity = 'tower' | 'wind';

/** Bump when the document text changes, so stored orders show which wording was accepted. */
export const WAIVER_VERSION = '2026-11-02';

/** Activity day: age is counted on this date. */
export const WAIVER_ACTIVITY_DATE = '2027-01-10';
export const WAIVER_GUARDIAN_AGE = 15;

export type HealthAnswer = 'ok' | 'risk';

/** Wind tunnel health questions ("สภาพร่างกาย"), in the document's order. */
export const WIND_HEALTH_QUESTIONS: { id: string; text: string; ok: string; risk: string; extra?: string }[] = [
  {
    id: 'medical',
    text: 'ในกรณีที่เคยมีประวัติความเจ็บป่วยที่เกี่ยวข้องกับ คอ หลัง ไหล่ และหัวใจ ได้มีการปรึกษากับแพทย์เฉพาะทางแล้วก่อนที่จะเข้าใช้บริการอุโมงค์ลมชัยจินดา',
    ok: 'ปรึกษาแล้ว / ไม่เคยมีประวัติ',
    risk: 'ไม่ได้ปรึกษา',
  },
  { id: 'weight', text: 'ผู้ใช้บริการยืนยันว่าน้ำหนักไม่เกิน 100 กิโลกรัม', ok: 'ต่ำกว่า 100 กก.', risk: 'เกิน 100 กก.' },
  { id: 'shoulder', text: 'ผู้ใช้บริการยืนยันว่าไม่เคยมีอาการไหล่หลุด', ok: 'ไม่เคย', risk: 'เคย' },
  { id: 'pregnant', text: 'ผู้ใช้บริการยืนยันว่าไม่อยู่ระหว่างตั้งครรภ์', ok: 'ไม่อยู่ระหว่างตั้งครรภ์', risk: 'ตั้งครรภ์' },
  { id: 'cast', text: 'ผู้ใช้บริการยืนยันว่าไม่ได้เข้าเฝือก', ok: 'ไม่ได้เข้าเฝือก', risk: 'เข้าเฝือก' },
];

export interface WaiverParticipant {
  fullName: string;
  /** YYYY-MM-DD (Gregorian) */
  birthDate: string;
  phone: string;
  /** 13 digits, no dashes (empty for a foreign participant, who gives a passport number instead) */
  idCard: string;
  /** foreign participant: passport number instead of the Thai ID */
  foreigner?: boolean;
  passportNo?: string;
  /** required when the participant is under 15 on the activity day */
  guardianName?: string;
  /** wind tunnel only: one answer per WIND_HEALTH_QUESTIONS id */
  windHealth?: Record<string, HealthAnswer>;
}

export interface ActivityWaiverInfo {
  activities: WaiverActivity[];
  participants: WaiverParticipant[];
  /** when the buyer accepted each document (ISO) */
  acceptedAt: Partial<Record<WaiverActivity, string>>;
  version: string;
}

export function ageOn(birthDate: string, onDate = WAIVER_ACTIVITY_DATE): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(onDate);
  if (!m || !d) return null;
  let age = +d[1] - +m[1];
  if (+d[2] < +m[2] || (+d[2] === +m[2] && +d[3] < +m[3])) age--;
  return age >= 0 && age < 120 ? age : null;
}

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** 2027-01-10 → 10 มกราคม 2570 */
export function thaiDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${+m[3]} ${THAI_MONTHS[+m[2] - 1]} ${+m[1] + 543}` : '';
}

/** Health answers that rule a person out of the wind tunnel (safety limits in the document). */
export function windHealthProblems(h: WaiverParticipant['windHealth']): string[] {
  return WIND_HEALTH_QUESTIONS.filter((q) => h?.[q.id] === 'risk').map((q) => q.risk);
}

// ---------------------------------------------------------------------------
// Document text (as in the organiser's documents; blanks are filled per participant)
// ---------------------------------------------------------------------------
export interface WaiverDoc {
  activity: WaiverActivity;
  title: string;
  org: string;
  /** paragraphs before the "ข้าพเจ้า..." line */
  intro: string[];
  /** paragraphs after the participant line; headings are given in quotes in the original */
  body: { heading?: string; text: string }[];
  /** the wind document also has the health questions */
  health: boolean;
  /** the extra paragraph for a parent when the participant is under 15 */
  guardianText: string;
}

export const WAIVER_DOCS: Record<WaiverActivity, WaiverDoc> = {
  tower: {
    activity: 'tower',
    title: 'เอกสารสละสิทธิ์ฟ้องร้องตามกฎหมาย',
    org: 'งานมวลชนโดดหอสูง บก.สอ.บช.ตชด. (ค่ายนเรศวร)',
    intro: [
      'กรุณาอ่านเอกสารนี้โดยละเอียด เมื่อท่านลงนามในเอกสารนี้หมายถึงการสละสิทธิ์ในการเรียกร้องใดๆ ตามกฎหมาย',
      'เอกสารนี้ใช้เพื่อประกอบการพิจารณาก่อนอนุญาตให้ใช้บริการโดดหอสูง บก.สอ.บช.ตชด. (ค่ายนเรศวร) ความสูง 34 ฟุต เพื่อทำการทดสอบจิตใจ ให้กับ หน่วยงานภาครัฐ เอกชน ประชาชนทั่วไป นิสิต นักศึกษา นักเรียน อื่นๆ',
    ],
    body: [
      {
        heading: 'ความเสี่ยง',
        text: 'ข้าพเจ้าและ/หรือ ผู้ที่อยู่ในปกครองของข้าพเจ้าสมัครใจที่จะใช้ให้บริการโดดหอสูง บก.สอ.บช.ตชด. (ค่ายนเรศวร) ความสูง 34 ฟุต ข้าพเจ้าตระหนักถึงความเสี่ยงทั้งหลาย เช่น การบาดเจ็บ เสียชีวิต หรือทุพพลภาพ มีความเสี่ยงอยู่แล้วเป็นปกติวิสัย ข้าพเจ้าเข้าใจและยอมรับความเสี่ยงข้างต้นซึ่งเกี่ยวกับการใช้บริการโดดหอสูง บก.สอ.บช.ตชด. (ค่ายนเรศวร) ดังกล่าว',
      },
      {
        heading: 'การสละสิทธิ์ในการฟ้องร้อง',
        text: 'ข้าพเจ้าซึ่งเป็นผู้ใช้บริการเอง และในนามของผู้ที่อยู่ในปกครองของข้าพเจ้า ตัวแทน/ทายาท/ผู้สืบทอด ทั้งของข้าพเจ้า และผู้ที่อยู่ในปกครองของข้าพเจ้า จะไม่ฟ้องร้องเรียกค่าเสียหายใดๆ ทุกกรณีจาก บก.สอ.บช.ตชด. ซึ่งเป็นผลจากการใช้บริการโดดหอสูง บก.สอ.บช.ตชด. (ค่ายนเรศวร)',
      },
      {
        text: 'เอกสารสละสิทธิ์นี้ครอบคลุมถึง การบาดเจ็บ เจ็บป่วย อุบัติเหตุ ซึ่งอาจเป็นผลมาจาก (ก) การใช้สถานที่ หรือการดูแลรักษาที่ไม่ถูกต้องครบถ้วน (ข) อุปกรณ์ทำงานผิดพลาด เสียหาย หรือการดูแลรักษาที่ไม่ถูกต้องครบถ้วน (ค) คำแนะนำ หรือการควบคุมดูแลของเจ้าหน้าที่ (ง) การลื่นล้มในขณะใช้บริการโดดหอสูงหรือบริเวณโดยรอบ ข้าพเจ้าเข้าใจที่จะสละสิทธิ์ในการฟ้องร้องในทุกกรณีที่กล่าวข้างต้น',
      },
      {
        text: 'ข้าพเจ้าขอยืนยันว่าได้อ่านเอกสารสละสิทธิ์นี้แล้วอย่างครบถ้วนและเข้าใจเป็นอย่างดีว่าสละสิทธิ์ในการฟ้องร้องหรือเรียกร้องใดๆ ในนามของข้าพเจ้าและผู้ปกครองของข้าพเจ้า หากมีการฟ้องร้องหรือร้องเรียนเกิดขึ้นข้าพเจ้าจะรับผิดชอบค่าใช้จ่ายต่างๆ ในการต่อสู้คดีที่เกิดขึ้นกับ บก.สอ.บช.ตชด.',
      },
    ],
    health: false,
    guardianText:
      'ข้าพเจ้าได้อ่านข้อความข้างบนแล้วและมีโอกาสได้ซักถามข้อมูล พิจารณาถึงผลกระทบต่างๆ ที่อาจเกิดขึ้น มีความเข้าใจในรายละเอียดของเอกสารและข้อตกลงตามเงื่อนไขต่างๆ ข้างต้นในนามของข้าพเจ้า และผู้อยู่ในความปกครองของข้าพเจ้า ข้าพเจ้ายินยอมที่จะจ่ายค่าชดเชยต่างๆ ซึ่งเป็นผลจากการกระทำของข้าพเจ้า และ/หรือผู้อยู่ในความปกครองของข้าพเจ้า ให้แก่ บก.สอ.บช.ตชด. ซึ่งรวมไปถึงค่าทนายและค่าใช้จ่ายอื่นๆ ในการต่อสู้คดี',
  },
  wind: {
    activity: 'wind',
    title: 'เอกสารสละสิทธิ์ฟ้องร้องตามกฎหมาย',
    org: 'อุโมงค์ลมชัยจินดา บก.สอ.บช.ตชด.',
    intro: [
      'กรุณาอ่านเอกสารนี้โดยละเอียด เมื่อท่านลงนามในเอกสารนี้หมายถึงการสละสิทธิ์ในการเรียกร้องใดๆ ตามกฎหมาย',
      'เอกสารนี้ใช้เพื่อประกอบการพิจารณาก่อนอนุญาตให้ใช้บริการอุโมงค์ลมชัยจินดา คือการจำลองการโดดร่มแบบกระตุกเองโดยเป็นอุโมงค์ลมแนวดิ่งแบบปิด แรงลมสูงสุด 280 กิโลเมตร/ชั่วโมง ดำเนินงานโดย บก.สอ.บช.ตชด.',
      'สำหรับ “หน่วยงานที่เกี่ยวข้อง” ในที่นี้หมายถึง บริษัทที่เกี่ยวข้อง และ/หรือ หน่วยงานใดๆ ของ บก.สอ.บช.ตชด. “ฝ่ายบริหาร/จัดการ” ในที่นี้หมายถึง ผู้ฝึกสอน เจ้าหน้าที่ ผู้บังคับบัญชา ตัวแทน ของ บก.สอ.บช.ตชด. และ/หรือ หน่วยงานที่เกี่ยวข้อง',
    ],
    body: [
      {
        heading: 'ความเสี่ยง',
        text: 'ข้าพเจ้า และ/หรือ ผู้ที่อยู่ในปกครองของข้าพเจ้าสมัครใจที่จะใช้อุโมงค์ลมชัยจินดาที่ บก.สอ.บช.ตชด. จัดไว้ เพื่อให้บริการซึ่งรวมไปถึงการใช้อุปกรณ์ สิ่งอำนวยความสะดวก สิ่งก่อสร้างหรือสถานที่ที่ได้จัดเตรียมไว้ ข้าพเจ้าตระหนักถึงความเสี่ยงทั้งหลาย เช่น การบาดเจ็บ เสียชีวิต หรือทุพพลภาพ ที่อาจจะเกิดแก่ข้าพเจ้า และ/หรือ ผู้ที่อยู่ในปกครองของข้าพเจ้าหรือของผู้อื่นที่อยู่ในปกครองของข้าพเจ้า ข้าพเจ้าตระหนักดีว่า อุโมงค์ลมชัยจินดา คือการจำลองสถานการณ์การโดดร่มแบบกระตุกเองโดยใช้ลมเป่าในแนวดิ่งแบบปิด ความเร็วสูงสุดไม่เกิน 280 กิโลเมตร/ชั่วโมง ซึ่งมีความเสี่ยงอยู่แล้วเป็นปกติวิสัย ข้าพเจ้าเข้าใจและยอมรับความเสี่ยงข้างต้นซึ่งเกี่ยวข้องกับการใช้บริการอุโมงค์ลมชัยจินดาดังกล่าว',
      },
      {
        heading: 'การสละสิทธิ์ในการฟ้องร้อง',
        text: 'ข้าพเจ้าซึ่งเป็นผู้ใช้บริการเอง และในนามของผู้ที่อยู่ในปกครองของข้าพเจ้า ตัวแทน / ทายาท / ผู้สืบทอด ทั้งของข้าพเจ้า และผู้ที่อยู่ในปกครองของข้าพเจ้า จะไม่ฟ้องร้องเรียกค่าเสียหายใดๆ ทุกกรณีจาก บก.สอ.บช.ตชด. (ทั้งนี้รวมถึงบริษัท ผู้บริหาร ฝ่ายจัดการ พนักงาน และ/หรือหน่วยงานใดๆ ที่เกี่ยวข้องกับ บก.สอ.บช.ตชด. ผู้ผลิต และ/หรือผู้ติดตั้งอุโมงค์ลมชัยจินดา) ซึ่งเป็นผลการใช้บริการอุโมงค์ลมชัยจินดา ข้าพเจ้าขอสละสิทธิ์ในการเรียกร้องค่าเสียหาย ค่าชดเชยหรือร้องเรียนในทุกกรณี ไม่ว่าจะเป็นความเสียหาย การบาดเจ็บหรือเสียชีวิตของข้าพเจ้าเอง และ/หรือผู้อยู่ในปกครองของข้าพเจ้า อันสืบเนื่องมาจากการใช้บริการอุโมงค์ลมชัยจินดา',
      },
      {
        text: 'เอกสารสละสิทธิ์นี้ครอบคลุมถึง การบาดเจ็บ เจ็บป่วย อุบัติเหตุ ซึ่งอาจเป็นผลมาจาก (ก) การใช้สถานที่ หรือการดูแลรักษาที่ไม่ถูกต้องครบถ้วน (ข) อุปกรณ์ทำงานผิดพลาด เสียหาย หรือการดูแลรักษาที่ไม่ถูกต้องครบถ้วน (ค) คำแนะนำ หรือการควบคุมดูแลของเจ้าหน้าที่ (ง) การลื่นล้มในขณะใช้บริการอุโมงค์ลมชัยจินดาหรือบริเวณโดยรอบ ข้าพเจ้าเข้าใจ และสมัครใจที่จะสละสิทธิ์ในการฟ้องร้องในทุกกรณีที่กล่าวข้างต้น',
      },
      {
        text: 'ข้าพเจ้ายินยอมให้ บก.สอ.บช.ตชด. และ/หรือ บริษัท หน่วยงานที่เกี่ยวข้อง สามารถถ่ายภาพ และ/หรือ บันทึกภาพ ของข้าพเจ้า และผู้อยู่ในปกครองของข้าพเจ้าลงในแถบวีดีทัศน์ เพื่อเผยแพร่ลงในสื่อโฆษณา สื่อสิ่งพิมพ์หรือนิทรรศการต่างๆ ได้ ไม่สงวนสิทธิ์ใดๆ',
      },
      {
        text: 'ข้าพเจ้าขอยืนยันว่าได้อ่านเอกสารสละสิทธิ์นี้แล้วอย่างครบถ้วนและเข้าใจเป็นอย่างดีว่าการสละสิทธิ์ในการฟ้องร้องหรือเรียกร้องใดๆ ในนามของข้าพเจ้าและผู้อยู่ในปกครองของข้าพเจ้า หากมีการฟ้องร้องหรือร้องเรียนเกิดขึ้นข้าพเจ้าจะรับผิดชอบค่าใช้จ่ายต่างๆ ในการต่อสู้คดีที่เกิดขึ้นกับ บก.สอ.บช.ตชด.',
      },
      {
        text: 'ข้าพเจ้าได้อ่านข้อความด้านบนแล้ว และมีโอกาสได้ซักถามข้อมูลพิจารณาถึงผลกระทบต่างๆ ที่อาจจะเกิดขึ้น มีความเข้าใจในรายละเอียดของเอกสาร และตกลงตามเงื่อนไขต่างๆ ข้างต้น',
      },
    ],
    health: true,
    guardianText:
      'ข้าพเจ้าได้อ่านข้อความด้านบนแล้วและมีโอกาสได้ซักถามข้อมูล พิจารณาถึงผลกระทบต่างๆ ที่อาจจะเกิดขึ้น มีความเข้าใจในรายละเอียดของเอกสารและตกลงตามเงื่อนไขต่างๆ ข้างต้นในนามของทั้งข้าพเจ้า และผู้อยู่ในปกครองของข้าพเจ้า ข้าพเจ้ายินยอมที่จะจ่ายค่าชดเชยต่างๆ ซึ่งเป็นผลจากการกระทำของข้าพเจ้า และ/หรือผู้อยู่ในปกครองของข้าพเจ้า ให้แก่ บก.สอ.บช.ตชด. ซึ่งรวมไปถึงค่าทนายและค่าใช้จ่ายอื่นๆ ในการต่อสู้คดี',
  },
};

export const WAIVER_LABEL: Record<WaiverActivity, string> = { tower: 'โดดหอสูง', wind: 'อุโมงค์ลม' };

/** Which waivers an add-on selection needs. */
export function waiversFor(addOns: { tower?: boolean; windTunnel?: boolean } | undefined): WaiverActivity[] {
  return [...(addOns?.tower ? (['tower'] as const) : []), ...(addOns?.windTunnel ? (['wind'] as const) : [])];
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');

/** Checks one participant; returns the problems in Thai (empty = fine). */
export function participantProblems(p: WaiverParticipant, i: number, activities: WaiverActivity[]): string[] {
  const n = `ผู้ร่วมกิจกรรมคนที่ ${i + 1}`;
  const errs: string[] = [];
  if (p.fullName.length < 3) errs.push(`กรุณากรอกชื่อ-นามสกุล${n}`);
  const age = ageOn(p.birthDate);
  if (age === null) errs.push(`กรุณากรอกวันเกิด${n}`);
  if (p.phone.length < 9) errs.push(`เบอร์โทรศัพท์${n}ไม่ถูกต้อง`);
  if (p.foreigner) {
    if (!isValidPassport(normalizePassport(p.passportNo))) errs.push(`เลขที่หนังสือเดินทาง (Passport)${n}ไม่ถูกต้อง`);
  } else if (!isValidThaiId(p.idCard)) errs.push(`เลขบัตรประชาชน${n}ไม่ถูกต้อง`);
  if (age !== null && age < WAIVER_GUARDIAN_AGE && (p.guardianName || '').length < 3) errs.push(`${n} อายุต่ำกว่า ${WAIVER_GUARDIAN_AGE} ปี กรุณากรอกชื่อผู้ปกครอง`);
  if (activities.includes('wind')) {
    const missing = WIND_HEALTH_QUESTIONS.some((q) => p.windHealth?.[q.id] !== 'ok' && p.windHealth?.[q.id] !== 'risk');
    if (missing) errs.push(`กรุณาตอบคำถามสภาพร่างกาย (อุโมงค์ลม) ของ${n}ให้ครบ`);
    else {
      const bad = windHealthProblems(p.windHealth);
      if (bad.length) errs.push(`${n} ไม่สามารถใช้บริการอุโมงค์ลมได้ตามเงื่อนไขความปลอดภัย (${bad.join(', ')})`);
    }
  }
  return errs;
}

/** Cleans what the browser sent. One participant per person on the add-on; every needed document must be accepted. */
export function parseActivityWaiver(
  raw: unknown,
  people: number,
  activities: WaiverActivity[]
): { ok: true; value: ActivityWaiverInfo } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(r.participants) ? r.participants.slice(0, people) : [];
  const accepted = (r.accepted && typeof r.accepted === 'object' ? r.accepted : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const participants: WaiverParticipant[] = [];
  for (let i = 0; i < people; i++) {
    const x = (list[i] && typeof list[i] === 'object' ? list[i] : {}) as Record<string, unknown>;
    const hRaw = (x.windHealth && typeof x.windHealth === 'object' ? x.windHealth : {}) as Record<string, unknown>;
    const p: WaiverParticipant = {
      fullName: clip(x.fullName, 120),
      birthDate: /^\d{4}-\d{2}-\d{2}$/.test(String(x.birthDate || '')) ? String(x.birthDate) : '',
      phone: digitsOnly(x.phone).slice(0, 15),
      idCard: x.foreigner === true ? '' : digitsOnly(x.idCard).slice(0, 13),
      ...(x.foreigner === true ? { foreigner: true, passportNo: normalizePassport(x.passportNo) } : {}),
    };
    const age = ageOn(p.birthDate);
    if (age !== null && age < WAIVER_GUARDIAN_AGE) p.guardianName = clip(x.guardianName, 120);
    if (activities.includes('wind')) {
      p.windHealth = {};
      for (const q of WIND_HEALTH_QUESTIONS) if (hRaw[q.id] === 'ok' || hRaw[q.id] === 'risk') p.windHealth[q.id] = hRaw[q.id] as HealthAnswer;
    }
    errors.push(...participantProblems(p, i, activities));
    participants.push(p);
  }
  const ids = participants.map((p) => (p.foreigner ? `P${p.passportNo}` : p.idCard)).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push('เลขบัตรประชาชน/หนังสือเดินทางของผู้ร่วมกิจกรรมซ้ำกัน');
  const now = new Date().toISOString();
  const acceptedAt: Partial<Record<WaiverActivity, string>> = {};
  for (const a of activities) {
    if (accepted[a] !== true) errors.push(`กรุณาอ่านและยอมรับเอกสารสละสิทธิ์ฟ้องร้อง (${WAIVER_LABEL[a]})`);
    else acceptedAt[a] = now;
  }
  if (errors.length) return { ok: false, error: errors.join(' · ') };
  return { ok: true, value: { activities, participants, acceptedAt, version: WAIVER_VERSION } };
}
