// Safety rules posted at the shooting range (Thai + English; the signs also carry Chinese, which the site does not show).
// Bump the version when the wording changes: it is stored with the order next to the time the buyer accepted.
export const SHOOTING_RULES_VERSION = '2026-11-04';

export interface BilingualRule {
  th: string;
  en: string;
}

/** "The Four Fundamental Rules of Firearm Safety" */
export const SHOOTING_FOUR_RULES: BilingualRule[] = [
  { th: 'ปฏิบัติต่อปืนทุกกระบอกราวกับว่ามีกระสุนอยู่เสมอ', en: 'Treat every firearm as if it were loaded.' },
  { th: 'ห้ามหันกระบอกปืนไปยังสิ่งที่คุณไม่ตั้งใจจะยิง', en: 'Never point a firearm at anything you do not intend to shoot.' },
  { th: 'วางนิ้วให้พ้นไกปืนจนกว่าจะพร้อมยิง', en: 'Keep your finger off the trigger until ready to shoot.' },
  { th: 'มั่นใจในเป้าหมายและสิ่งที่อยู่ด้านหลังเป้าหมาย', en: 'Be sure of your target and what lies beyond it.' },
];

/** "Mandatory Safety Requirements" */
export const SHOOTING_MANDATORY_RULES: BilingualRule[] = [
  { th: 'ต้องสวมอุปกรณ์ป้องกันดวงตา และหู', en: 'Eye & Ear Protection Required.' },
  { th: 'ไม่มีข้อยกเว้น', en: 'No Exceptions.' },
  { th: 'หากไม่ปฏิบัติตาม ถือเป็นความเสี่ยงของตนเอง', en: 'Failure to Comply — At Your Own Risk.' },
  { th: 'ฝ่ายบริหารไม่รับผิดชอบต่อการบาดเจ็บใด ๆ', en: 'Management Assumes No Liability for Any Injuries.' },
  {
    th: 'สนามยิงปืนขอสงวนสิทธิ์ไม่รับผิดชอบความเสียหายหรือความผิดพลาดจากเหตุสุดวิสัยที่อาจเกิดขึ้นได้',
    en: 'The shooting range shall not be liable for any damages or incidents that may arise from force majeure.',
  },
  {
    th: 'เนื่องจากเป็นอาวุธที่มีอานุภาพสูง ผู้ใช้ต้องยอมรับความเสี่ยงและความเสียหายที่อาจเกิดขึ้นต่อชีวิตและร่างกายด้วยตนเอง สนามยิงปืนขอสงวนสิทธิ์ไม่รับผิดชอบความเสียหายต่อชีวิตและทรัพย์สินของท่านในทุกกรณี',
    en: 'As firearms are high-powered weapons, users must accept all risks and potential harm to life and bodily safety at their own responsibility. The shooting range assumes no liability for any damage to life or property under any circumstances.',
  },
];
