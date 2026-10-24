import {
  RouteId,
  RouteData,
  Hotel,
  ScheduleDay,
  ScheduleItem,
  FacilityItem,
  ParkingZone,
  TransportOption,
  FAQItem,
  Announcement,
  SafetyContact,
  VenueInfo,
} from '../types';

export const eventInfo = {
  name: 'เห็นช้างวิ่ง วิ่งตามช้าง',
  englishName: 'CHANG SUEK RUN',
  year: 2027,
  edition: '2027',
  tagline: 'RUN TOGETHER',
  subSlogan: 'วิ่งสนุก...ไปด้วยกัน สำหรับทุกคนในครอบครัว',
  subSloganEn: 'RUN WITH YOUR BEST FRIEND',
  description:
    'งานวิ่งมวลชนและครอบครัวสุดอบอุ่นริมหาดประวัติศาสตร์ชะอำ-หัวหิน ท่ามกลางธรรมชาติ ป่าสน ป่าชายเลน และกลิ่นอายค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน สัมผัสประสบการณ์ร่วมวิ่งเคียงข้างเพื่อนซี้สี่ขาและช้างศึกคู่ใจในบรรยากาศเปี่ยมพลัง',
  date: null as string | null, // Official date pending confirmation
  dateNotice: 'กำหนดการวันแข่งขันจะแจ้งให้ทราบอย่างเป็นทางการเร็ว ๆ นี้',
  venue: 'ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน / บริเวณหาดโรงแรม Sea Sand Sun',
  venueShort: 'ค่ายนเรศวร ชะอำ-หัวหิน',
  locationProvince: 'เพชรบุรี (รอยต่อชะอำ-หัวหิน)',
  venueCoordinates: [12.6948, 99.9642] as [number, number],
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sea+Sand+Sun+Hua+Hin+Resort',
  registrationStatus: 'เตรียมเปิดรับสมัครเร็ว ๆ นี้',
  raceStatus: 'อยู่ระหว่างสำรวจ GPS Track รับรองมาตรฐาน',
  routeStatus: 'เส้นทางตัวอย่างสำหรับวางแผนการเดินทาง',
  hotelCountNotice: '41 ที่พัก Pet-Friendly และข้อมูลห้องว่างล่าสุด',
  contactEmail: 'contact@changsuekrun.com',
  contactPhone: '032-471-299 / 081-890-2027',
  contactLine: '@changsuekrun',
  contactFacebook: 'facebook.com/changsuekrun',
};

export const venueInfo: VenueInfo = {
  name: 'ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน',
  nameEn: 'Naresuan Camp, Border Patrol Police',
  description:
    'ค่ายประวัติศาสตร์อันทรงเกียรติติดชายหาดชะอำ-หัวหิน ทัศนียภาพงดงาม ร่มรื่นด้วยป่าสน ชายทะเล และสิ่งอำนวยความสะดวกครบครัน พร้อมศูนย์ฝึกสุนัขสงครามแห่งประวัติศาสตร์',
  latitude: 12.6948,
  longitude: 99.9642,
  highlights: [
    'ชายหาดส่วนตัวยาว สะอาด ร่มรื่นด้วยแนวต้นสนยามรุ่งอรุณ',
    'พื้นที่ฝึกสุนัขสงครามและเส้นทางธรรมชาติเอกลักษณ์เฉพาะตัว',
    'อยู่ติดพระราชนิเวศน์มฤคทายวัน และวัดมฤคทายวัน',
    'ลานจอดรถกว้างขวางรองรับกว่า 800+ คัน พร้อมระบบรักษาความปลอดภัย 24 ชม.',
  ],
  rules: [
    'ผู้เข้าร่วมต้องแต่งกายสุภาพและติดเบอร์วิ่ง (BIB) ให้เห็นชัดเจน',
    'สุนัขที่เข้าร่วมวิ่งต้องมีสายจูงตลอดเวลา และเจ้าของต้องดูแลความสะอาด',
    'ไม่อนุญาตให้ทิ้งขยะนอกจุดคัดแยกขยะที่จัดเตรียมไว้',
    'ปฏิบัติตามคำแนะนำของเจ้าหน้าที่รักษาความปลอดภัยและสารวัตรทหารอย่างเคร่งครัด',
  ],
};

export const safetyContacts: SafetyContact[] = [
  {
    title: 'ศูนย์อำนวยการแข่งขัน (Race Center)',
    role: 'ฝ่ายประสานงานกลาง & ข้อมูลทั่วไป',
    phone: '081-890-2027',
  },
  {
    title: 'หน่วยแพทย์กู้ชีพค่ายนเรศวร',
    role: 'การแพทย์และพยาบาลฉุกเฉินประจำงาน',
    phone: '032-471-299',
  },
  {
    title: 'โรงพยาบาลหัวหิน (Hua Hin Hospital)',
    role: 'ศูนย์อุบัติเหตุ-ฉุกเฉินหลัก (ส่งต่อ 15 นาที)',
    phone: '032-523-000',
  },
  {
    title: 'สถานีตำรวจภูธรชะอำ',
    role: 'งานจัดการจราจรและสารวัตรทหาร',
    phone: '032-471-321',
  },
  {
    title: 'สัตวแพทย์อาสาประจำงาน (Pet Vet Care)',
    role: 'ดูแลสุขภาพสุนัขและสัตว์เลี้ยง',
    phone: '089-765-4321',
  },
];

// Route definitions based on official Google Earth survey
export const routesData: Record<RouteId, RouteData> = {
  '1km': {
    id: '1km',
    name: '1 KM DOG MINI RUN',
    title: 'วิ่งเล่นกับน้องสุนัข ทางเรียบเลียบหาด (ไป-กลับ)',
    distanceKm: 1.0,
    measuredPerimeterKm: 1.03,
    googleEarthSummary: 'เส้นทางไป-กลับเลียบหาดหน้าโรงแรม Sea Sand Sun ระยะรวมประมาณ 1.03 กม. (เส้นทางตัวอย่างระหว่างรอรับรอง GPS Track)',
    color: '#FF8A3D',
    tagline: 'วิ่งเล่นสบาย ๆ เหมาะกับลูกสุนัข น้องสุนัขสูงวัย และเด็กเล็ก',
    type: 'Beach Path ไป-กลับ (ทางเรียบเลียบหาด)',
    difficulty: 'ง่าย (Easy)',
    durationEstimate: '10 - 20 นาที',
    startTime: '17.30 น.',
    cutoffTime: '18.15 น. (45 นาที)',
    description:
      'เส้นทางสั้นสำหรับคู่วิ่งสี่ขาที่อยากเริ่มต้นแบบสบาย ๆ ปล่อยตัวจากชายหาดหน้าโรงแรม Sea Sand Sun วิ่งเลียบหาดไปจุดกลับตัวแล้ววิ่งกลับมาเข้าเส้นชัยที่เดิม ไม่มีเนินชัน มีร่มเงาต้นสนบางช่วง',
    terrainType: 'ทางเลียบหาดค่ายนเรศวร พื้นเรียบ ไม่มีเนินชัน',
    roadCondition: 'ทางเรียบ 100% ปิดการจราจร มีเจ้าหน้าที่ดูแลที่จุดกลับตัว',
    recommendedFor: 'น้องสุนัขตัวเล็ก ลูกสุนัข น้องสุนัขสูงวัย เด็กเล็ก และคนที่เพิ่งเริ่มพาสุนัขออกกำลังกาย',
    waterStationCount: 1,
    medicalStationCount: 1,
    safetyNotes: 'มีน้ำดื่มสำหรับคนและสุนัขที่จุดกลับตัว (กม. 0.5) พร้อมทีมสัตวแพทย์อาสาประจำงาน',
    coordinates: [
      [12.69660, 99.96380],
      [12.69670, 99.96460],
      [12.69650, 99.96540],
      [12.69570, 99.96740],
      [12.69544, 99.96818],
      [12.69562, 99.96818],
      [12.69588, 99.96740],
      [12.69668, 99.96540],
      [12.69688, 99.96460],
      [12.69660, 99.96380],
    ],
    elevation: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'ทางเลียบหาด' },
      { distanceKm: 0.5, elevationM: 5, elevationMeters: 5, surface: 'จุดกลับตัว' },
      { distanceKm: 1.03, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมหาด' },
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'ทางเลียบหาด' },
      { distanceKm: 0.5, elevationM: 5, elevationMeters: 5, surface: 'จุดกลับตัว' },
      { distanceKm: 1.03, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมหาด' },
    ],
    landmarks: [
      {
        id: 'start-finish-1k',
        name: 'START / FINISH จุดปล่อยตัวและเส้นชัย',
        nameEn: 'Start & Finish Area (Sea Sand Sun Beach)',
        description: 'บริเวณชายหาดหน้าโรงแรม Sea Sand Sun ค่ายนเรศวร',
        type: 'start_finish',
        distanceFromStartKm: 0,
        latitude: 12.6966,
        longitude: 99.9638,
        services: ['จุดลงทะเบียน', 'จุดรับฝากของ', 'หน่วยแพทย์หลัก', 'ซุ้มน้ำสำหรับน้องสุนัข'],
      },
      {
        id: 'turnaround-1k',
        name: 'จุดกลับตัว + น้ำดื่มคนและสุนัข',
        nameEn: 'Turnaround & Pet Water Point',
        description: 'จุดกลับตัวเลียบหาด พร้อมน้ำดื่มสำหรับคนและน้องสุนัข',
        type: 'water',
        distanceFromStartKm: 0.5,
        latitude: 12.69544,
        longitude: 99.96818,
        services: ['น้ำดื่ม', 'น้ำสำหรับสุนัข', 'สัตวแพทย์อาสา'],
      },
    ],
  },
  '3km': {
    id: '3km',
    name: '3 KM DOG RUN',
    title: 'วิ่งคู่น้องสุนัข รอบแกนกลางค่ายนเรศวร',
    distanceKm: 3.0,
    measuredPerimeterKm: 4.08,
    measuredAreaSqM: 631710.65,
    googleEarthSummary: 'รังวัดจากภาพถ่ายดาวเทียม Google Earth: เส้นขอบรอบทิศ 4.08 กม. (พื้นที่รูปหลายเหลี่ยม 631,710.65 ม²)',
    color: '#2EAA59',
    tagline: 'วิ่งคู่เพื่อนสี่ขา เหมาะกับครอบครัวและผู้เริ่มต้น',
    type: 'Road & Coastal Path (ทางเรียบเลียบทะเลและถนนค่าย)',
    difficulty: 'ง่าย (Easy)',
    durationEstimate: '25 - 45 นาที',
    startTime: '17.15 น.',
    cutoffTime: '18.15 น. (1 ชั่วโมง)',
    description:
      'เส้นทางวิ่งรอบแกนกลางค่ายนเรศวร วัดระยะรอบขอบเขต 4.08 กม. ปล่อยตัวจากชายหาดหน้าโรงแรม Sea Sand Sun วิ่งรับลมทะเลไปทางทิศตะวันออก ผ่านหน้ากองร้อยฝึกรบพิเศษ เลี้ยวลงทิศใต้ผ่านถนนฝั่งตะวันออก มุ่งสู่พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช แล้วตัดเลี้ยวขึ้นเหนือผ่านถนนแกนกลางค่ายฝั่งสระน้ำกลับสู่หาดและเข้าเส้นชัย',
    terrainType: 'ถนนคอนกรีตเรียบและทางเลียบหาดค่ายนเรศวร ไม่มีเนินชัน',
    roadCondition: 'ทางเรียบ 100% กว้างขวาง ปลอดภัย ปิดการจราจรตลอดเส้นทาง มีเจ้าหน้าที่ดูแลทุกจุดเลี้ยว',
    recommendedFor: 'ครอบครัว, ผู้เริ่มต้นออกกำลังกาย, เจ้าของและสุนัข, ผู้ที่ต้องการเดิน-วิ่งผ่อนคลายรับลมทะเล',
    waterStationCount: 2,
    medicalStationCount: 2,
    safetyNotes: 'มีจุดบริการน้ำดื่มที่บริเวณกองร้อยฝึกรบพิเศษ (กม. 1.5) และหน้าพระบรมราชานุสาวรีย์ฯ (กม. 2.6)',
    coordinates: [
      [12.6966, 99.9638], // Start: Sea Sand Sun Beach
      [12.6967, 99.9646],
      [12.6965, 99.9654],
      [12.6957, 99.9674], // Coastal Beach Path
      [12.6948, 99.9701], // Pine turn to Special Forces
      [12.6937, 99.9700],
      [12.6931, 99.9727], // กองร้อยฝึกรบพิเศษ (Special Combat Training Company)
      [12.6920, 99.9733],
      [12.6908, 99.9733],
      [12.6896, 99.9731],
      [12.6888, 99.9728],
      [12.6879, 99.9714],
      [12.6872, 99.9703],
      [12.6860, 99.9701],
      [12.6853, 99.9688], // พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช
      [12.6852, 99.9680],
      [12.6852, 99.9670],
      [12.6845, 99.9664], // Southern perimeter road
      [12.6848, 99.9655],
      [12.6850, 99.9643],
      [12.6851, 99.9631],
      [12.6855, 99.9621], // South lake corner
      [12.6876, 99.9628], // Inner camp shortcut road north
      [12.6900, 99.9629], // Central camp zone
      [12.6914, 99.9634],
      [12.6928, 99.9643],
      [12.6946, 99.9626], // Return to beach approach
      [12.6953, 99.9626],
      [12.6966, 99.9638], // Finish: Sea Sand Sun Beach
    ],
    elevation: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'คอนกรีตเลียบหาด' },
      { distanceKm: 0.8, elevationM: 5, elevationMeters: 5, surface: 'ทางเลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.2, elevationM: 5, elevationMeters: 5, surface: 'ถนนฝั่งตะวันออก' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 3.4, elevationM: 4, elevationMeters: 4, surface: 'ถนนแกนกลางค่าย' },
      { distanceKm: 4.08, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมหาด' },
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'คอนกรีตเลียบหาด' },
      { distanceKm: 0.8, elevationM: 5, elevationMeters: 5, surface: 'ทางเลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.2, elevationM: 5, elevationMeters: 5, surface: 'ถนนฝั่งตะวันออก' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 3.4, elevationM: 4, elevationMeters: 4, surface: 'ถนนแกนกลางค่าย' },
      { distanceKm: 4.08, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมหาด' },
    ],
    landmarks: [
      {
        id: 'start-finish-3k',
        name: 'START / FINISH จุดปล่อยตัวและเส้นชัย',
        nameEn: 'Start & Finish Area (Sea Sand Sun Beach)',
        description: 'บริเวณชายหาดหน้าโรงแรม Sea Sand Sun ค่ายนเรศวร',
        type: 'start_finish',
        distanceFromStartKm: 0,
        latitude: 12.6966,
        longitude: 99.9638,
        services: ['จุดลงทะเบียน', 'ซุ้มอาหารและเครื่องดื่ม', 'จุดรับฝากของ', 'หน่วยแพทย์หลัก', 'เวทีพิธีการ'],
      },
      {
        id: 'beach-trail-3k',
        name: 'เส้นทางเลียบหาดค่ายนเรศวร',
        nameEn: 'Naresuan Beachfront Trail',
        description: 'วิ่งรับลมทะเลยามเย็น ชมแสงอาทิตย์อัสดงริมหาดชะอำ',
        type: 'photo',
        distanceFromStartKm: 0.8,
        latitude: 12.6957,
        longitude: 99.9674,
      },
      {
        id: 'special-forces-3k',
        name: 'กองร้อยฝึกรบพิเศษ',
        nameEn: 'Special Combat Training Company',
        description: 'หน่วยรบพิเศษค่ายนเรศวร พร้อมจุดบริการน้ำดื่มจุดที่ 1',
        type: 'water',
        distanceFromStartKm: 1.5,
        latitude: 12.6931,
        longitude: 99.9727,
        services: ['น้ำดื่ม', 'เกลือแร่', 'ผ้าเย็น', 'เจ้าหน้าที่ปฐมพยาบาล'],
      },
      {
        id: 'naresuan-monument-3k',
        name: 'พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช',
        nameEn: 'King Naresuan the Great Monument',
        description: 'จุดสักการะและลานสวนสนามหน้าสระน้ำขนาดใหญ่ พร้อมจุดบริการน้ำดื่ม 2',
        type: 'landmark',
        distanceFromStartKm: 2.6,
        latitude: 12.6853,
        longitude: 99.9688,
        services: ['จุดถ่ายภาพที่ระลึก', 'น้ำดื่ม', 'หน่วยแพทย์เคลื่อนที่'],
      },
      {
        id: 'central-pond-3k',
        name: 'ถนนแกนกลางค่ายและสระน้ำร่มรื่น',
        nameEn: 'Central Camp & Shaded Lake Road',
        description: 'ทางตัดลัดขึ้นสู่ทิศเหนือใต้ร่มเงาแมกไม้ธรรมชาติ',
        type: 'checkpoint',
        distanceFromStartKm: 3.2,
        latitude: 12.6900,
        longitude: 99.9629,
      },
    ],
  },
  '5km': {
    id: '5km',
    name: '5 KM RUN',
    title: 'วิ่งท้าทายเต็มรอบค่ายนเรศวร (5.2 กม. Google Earth)',
    distanceKm: 5.0,
    measuredPerimeterKm: 5.20,
    measuredAreaSqM: 888938.12,
    googleEarthSummary: 'รังวัดจากภาพถ่ายดาวเทียม Google Earth: เส้นขอบรอบทิศ 5.20 กม. (พื้นที่รูปหลายเหลี่ยม 888,938.12 ม²)',
    color: '#E53935',
    tagline: 'เพิ่มระยะทางและความท้าทาย วิ่งเต็มวงรอบอาณาเขตค่ายนเรศวร',
    type: 'Road & Camp Trail Mix (ทางถนนคอนกรีตผสมเลียบสระเก็บน้ำ)',
    difficulty: 'ปานกลาง (Moderate)',
    durationEstimate: '35 - 55 นาที',
    startTime: '17.00 น.',
    cutoffTime: '18.15 น. (1 ชั่วโมง 15 นาที)',
    description:
      'เส้นทาง Challenge Run เต็มรูปแบบรอบขอบเขตค่ายนเรศวร วัดระยะจาก Google Earth ได้ 5.20 กม. (พื้นที่ 888,938.12 ม²) ปล่อยตัวจากชายหาดหน้า Sea Sand Sun วิ่งเลียบหาดมุ่งหน้าสู่กองร้อยฝึกรบพิเศษ เลี้ยวลงทิศใต้ผ่านลานพระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช วิ่งเลียบถนนด้านทิศใต้ใกล้วัดมฤคทายวัน อ้อมรอบสระเก็บน้ำขนาดใหญ่ฝั่งตะวันตก วิ่งขึ้นถนนแนวเขตตะวันตกผ่าน "สถานีทดสอบจิตใจ" แล้ววนกลับเข้าสู่เส้นชัยริมทะเล',
    terrainType: 'ถนนคอนกรีตและลาดยางสลับทางเรียบเลียบสระน้ำ มีความร่มรื่นและปลอดภัย',
    roadCondition: 'ทางลาดยางและคอนกรีต 85% ทางเรียบเลียบสระน้ำ 15% มีเจ้าหน้าที่ประจำจุดปลอดภัยตลอดเส้นทาง',
    recommendedFor: 'นักวิ่งมินิมาราธอนที่ต้องการซ้อมความเร็ว หรือผู้ที่ต้องการสัมผัสพื้นที่สำคัญทั่วค่ายนเรศวร',
    waterStationCount: 3,
    medicalStationCount: 2,
    safetyNotes: 'มีจุดบริการน้ำดื่ม 3 จุด (กม. 1.5, กม. 2.7 และ กม. 4.2) พร้อมทีมแพทย์กู้ชีพประจำการ',
    coordinates: [
      [12.6966, 99.9638], // Start: Sea Sand Sun Beach
      [12.6967, 99.9646],
      [12.6965, 99.9654],
      [12.6957, 99.9674],
      [12.6948, 99.9701],
      [12.6937, 99.9700],
      [12.6931, 99.9727], // กองร้อยฝึกรบพิเศษ (Special Combat Training Company)
      [12.6920, 99.9733],
      [12.6908, 99.9733],
      [12.6896, 99.9731],
      [12.6888, 99.9728],
      [12.6879, 99.9714],
      [12.6872, 99.9703],
      [12.6860, 99.9701],
      [12.6853, 99.9688], // พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช
      [12.6852, 99.9680],
      [12.6852, 99.9670],
      [12.6845, 99.9664], // ใกล้วัดมฤคทายวัน
      [12.6848, 99.9655],
      [12.6850, 99.9643],
      [12.6851, 99.9631], // South lake corner
      [12.6855, 99.9621],
      [12.6842, 99.9599], // Southwest perimeter gate
      [12.6882, 99.9602], // West road north
      [12.6887, 99.9635], // Reservoir curve
      [12.6883, 99.9648],
      [12.6933, 99.9605], // สถานีทดสอบจิตใจ (Mental Toughness Station)
      [12.6942, 99.9610],
      [12.6948, 99.9625],
      [12.6953, 99.9626],
      [12.6966, 99.9638], // Finish: Sea Sand Sun Beach
    ],
    elevation: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'เลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 3.5, elevationM: 6, elevationMeters: 6, surface: 'ใกล้วัดมฤคทายวัน' },
      { distanceKm: 4.1, elevationM: 7, elevationMeters: 7, surface: 'อ่างเก็บน้ำฝั่งใต้' },
      { distanceKm: 4.7, elevationM: 6, elevationMeters: 6, surface: 'สถานีทดสอบจิตใจ' },
      { distanceKm: 5.2, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมทะเล' },
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'เลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 3.5, elevationM: 6, elevationMeters: 6, surface: 'ใกล้วัดมฤคทายวัน' },
      { distanceKm: 4.1, elevationM: 7, elevationMeters: 7, surface: 'อ่างเก็บน้ำฝั่งใต้' },
      { distanceKm: 4.7, elevationM: 6, elevationMeters: 6, surface: 'สถานีทดสอบจิตใจ' },
      { distanceKm: 5.2, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมทะเล' },
    ],
    landmarks: [
      {
        id: 'start-finish-5k',
        name: 'START / FINISH จุดปล่อยตัวและเส้นชัย',
        nameEn: 'Start & Finish Area',
        description: 'บริเวณชายหาดหน้าโรงแรม Sea Sand Sun ค่ายนเรศวร',
        type: 'start_finish',
        distanceFromStartKm: 0,
        latitude: 12.6966,
        longitude: 99.9638,
        services: ['จุดลงทะเบียน', 'ซุ้มอาหารเครื่องดื่ม', 'จุดรับฝากของ', 'หน่วยแพทย์หลัก'],
      },
      {
        id: 'special-forces-5k',
        name: 'กองร้อยฝึกรบพิเศษ',
        nameEn: 'Special Combat Training Company',
        description: 'มุมตะวันออกเฉียงเหนือของค่าย ใกล้จุดบริการน้ำดื่มที่ 1 (กม. 1.5)',
        type: 'water',
        distanceFromStartKm: 1.5,
        latitude: 12.6931,
        longitude: 99.9727,
        services: ['น้ำดื่ม', 'เกลือแร่', 'สเปรย์คลายกล้ามเนื้อ'],
      },
      {
        id: 'naresuan-monument-5k',
        name: 'พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช',
        nameEn: 'King Naresuan the Great Monument',
        description: 'ลานสวนสนามและสระน้ำด้านหน้า จุดสักการะสำคัญและจุดบริการน้ำดื่ม 2 (กม. 2.7)',
        type: 'landmark',
        distanceFromStartKm: 2.7,
        latitude: 12.6853,
        longitude: 99.9688,
        services: ['น้ำดื่ม', 'หน่วยพยาบาล', 'จุดถ่ายภาพ'],
      },
      {
        id: 'wat-marika-5k',
        name: 'แนวกำแพงใกล้วัดมฤคทายวัน',
        nameEn: 'Wat Marikathayawan Proximity',
        description: 'ถนนแนวรั้วทิศใต้ เลียบถนนเพชรเกษมและวัดมฤคทายวัน',
        type: 'checkpoint',
        distanceFromStartKm: 3.4,
        latitude: 12.6845,
        longitude: 99.9664,
      },
      {
        id: 'lake-west-5k',
        name: 'อ่างเก็บน้ำฝั่งทิศใต้และคันดิน',
        nameEn: 'Camp Reservoir Lake Loop',
        description: 'เส้นทางโค้งเลียบอ่างเก็บน้ำขนาดใหญ่ บรรยากาศเงียบสงบ',
        type: 'photo',
        distanceFromStartKm: 4.0,
        latitude: 12.6851,
        longitude: 99.9631,
      },
      {
        id: 'mental-test-station-5k',
        name: 'สถานีทดสอบจิตใจ',
        nameEn: 'Mental Toughness Testing Station',
        description: 'สถานีฝึกยุทธวิธีของตำรวจตระเวนชายแดน และจุดบริการน้ำดื่ม 3 (กม. 4.6)',
        type: 'water',
        distanceFromStartKm: 4.6,
        latitude: 12.6933,
        longitude: 99.9605,
        services: ['น้ำดื่ม', 'ผ้าเย็น', 'เจ้าหน้าที่ดูแลความปลอดภัย'],
      },
    ],
  },
  '10km': {
    id: '10km',
    name: '10 KM RUN',
    title: 'เส้นทางมินิมาราธอนผสมเทรล (10.52 กม. Google Earth)',
    distanceKm: 10.0,
    measuredPerimeterKm: 10.52,
    measuredAreaSqM: 687785.58,
    googleEarthSummary: 'รังวัดจากภาพถ่ายดาวเทียม Google Earth: เส้นขอบรอบทิศ 10.52 กม. (พื้นที่รูปหลายเหลี่ยม 687,785.58 ม²)',
    color: '#6F35B5',
    tagline: 'มินิมาราธอนผสมเทรล วิ่งเชื่อมค่ายนเรศวรและอุทยานสิ่งแวดล้อมนานาชาติสิรินธร',
    type: 'Road & Nature Trail (ทางถนนเลียบหาดผสมเทรลป่าชายเลนทูลกระหม่อม)',
    difficulty: 'ท้าทาย (Challenging)',
    durationEstimate: '55 - 90 นาที',
    startTime: '16.30 น.',
    cutoffTime: '18.30 น. (2 ชั่วโมง)',
    description:
      'เส้นทางไฮไลต์ระดับพรีเมียม วัดระยะทางจริงจาก Google Earth ได้ 10.52 กม. (พื้นที่รูปหลายเหลี่ยม 687,785.58 ม²) เชื่อมโยง 2 ดินแดนประวัติศาสตร์: ค่ายนเรศวร และ อุทยานสิ่งแวดล้อมนานาชาติสิรินธร ปล่อยตัวจากหาด Sea Sand Sun วิ่งรอบค่ายนเรศวรผ่านกองร้อยฝึกรบพิเศษ พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช ก่อนวิ่งข้ามเข้าสู่ "อุทยานสิ่งแวดล้อมนานาชาติสิรินธร" ลัดเลาะสะพานทางเดินธรรมชาติ "สวนป่าชายเลนทูลกระหม่อม" ใกล้พระราชนิเวศน์มฤคทายวัน สัมผัสป่าโกงกางเขียวขจีและลมทะเล ก่อนวนกลับเข้าเส้นชัยริมหาด',
    terrainType: 'ถนนคอนกรีตเลียบหาด ทางลาดยางในค่าย และทางเทรลธรรมชาติสะพานไม้ป่าชายเลน',
    roadCondition: 'ทางถนน 70% ทางเทรลธรรมชาติและสะพานไม้ป่าชายเลน 30% ร่มรื่น อากาศบริสุทธิ์ วิวทะเลและป่าโกงกาง',
    recommendedFor: 'นักวิ่งทั่วไปที่ต้องการประสบการณ์เทรลริมทะเล นักวิ่งสะสมระยะ และผู้ที่ต้องการท้าทายขีดจำกัด',
    waterStationCount: 4,
    medicalStationCount: 3,
    safetyNotes: 'มีจุดบริการน้ำดื่ม 4 จุดทุก 2.5 กม. มีป้ายบอกระยะและเชือกกั้นชัดเจน พร้อมเจ้าหน้าที่ประจำจุดตลอดเส้นทาง',
    coordinates: [
      [12.6966, 99.9638], // Start: Sea Sand Sun Beach
      [12.6967, 99.9646],
      [12.6965, 99.9654],
      [12.6957, 99.9674],
      [12.6948, 99.9701],
      [12.6937, 99.9700],
      [12.6931, 99.9727], // กองร้อยฝึกรบพิเศษ (Special Combat Training Company)
      [12.6920, 99.9733],
      [12.6908, 99.9733],
      [12.6896, 99.9731],
      [12.6888, 99.9728],
      [12.6879, 99.9714],
      [12.6872, 99.9703],
      [12.6860, 99.9701],
      [12.6853, 99.9688], // พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช
      [12.6852, 99.9680],
      [12.6852, 99.9670],
      [12.6845, 99.9664], // วัดมฤคทายวัน
      [12.6848, 99.9655],
      [12.6850, 99.9643],
      [12.6851, 99.9631],
      [12.6855, 99.9621],
      [12.6883, 99.9648],
      [12.6887, 99.9635],
      [12.6889, 99.9610],
      // Extension into Sirindhorn International Environmental Park & Mangrove
      [12.6924, 99.9608],
      [12.6934, 99.9606], // ใกล้สถานีทดสอบจิตใจ
      [12.6940, 99.9592],
      [12.6942, 99.9582],
      [12.6944, 99.9568],
      [12.6949, 99.9542],
      [12.6935, 99.9500], // อุทยานสิ่งแวดล้อมนานาชาติสิรินธร
      [12.6924, 99.9465],
      [12.6917, 99.9442],
      [12.6928, 99.9438],
      [12.6941, 99.9442],
      [12.6953, 99.9439],
      [12.6961, 99.9432],
      [12.6969, 99.9426],
      [12.6978, 99.9434], // สวนป่าชายเลนทูลกระหม่อม (Thunkramom Mangrove Park)
      [12.6989, 99.9442],
      [12.6997, 99.9455],
      [12.7003, 99.9468], // ใกล้พระราชนิเวศน์มฤคทายวัน
      [12.6995, 99.9482],
      [12.6982, 99.9479],
      [12.6970, 99.9482],
      [12.6958, 99.9490],
      [12.6963, 99.9525], // ทางกลับเชื่อมถนนค่าย
      [12.6960, 99.9555],
      [12.6955, 99.9592],
      [12.6952, 99.9618],
      [12.6955, 99.9626],
      [12.6966, 99.9638], // Finish: Sea Sand Sun Beach
    ],
    elevation: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'เลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 4.2, elevationM: 6, elevationMeters: 6, surface: 'ถนนเชื่อมทางทิศตะวันตก' },
      { distanceKm: 5.8, elevationM: 7, elevationMeters: 7, surface: 'อุทยานสิ่งแวดล้อมนานาชาติสิรินธร' },
      { distanceKm: 7.2, elevationM: 5, elevationMeters: 5, surface: 'สวนป่าชายเลนทูลกระหม่อม' },
      { distanceKm: 8.5, elevationM: 4, elevationMeters: 4, surface: 'ใกล้พระราชนิเวศน์มฤคทายวัน' },
      { distanceKm: 9.8, elevationM: 5, elevationMeters: 5, surface: 'ถนนเลียบแมกไม้เข้าสู่หาด' },
      { distanceKm: 10.52, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมทะเล' },
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 4, elevationMeters: 4, surface: 'เลียบหาด' },
      { distanceKm: 1.5, elevationM: 6, elevationMeters: 6, surface: 'กองร้อยฝึกรบพิเศษ' },
      { distanceKm: 2.7, elevationM: 5, elevationMeters: 5, surface: 'ลานพระบรมราชานุสาวรีย์ฯ' },
      { distanceKm: 4.2, elevationM: 6, elevationMeters: 6, surface: 'ถนนเชื่อมทางทิศตะวันตก' },
      { distanceKm: 5.8, elevationM: 7, elevationMeters: 7, surface: 'อุทยานสิ่งแวดล้อมนานาชาติสิรินธร' },
      { distanceKm: 7.2, elevationM: 5, elevationMeters: 5, surface: 'สวนป่าชายเลนทูลกระหม่อม' },
      { distanceKm: 8.5, elevationM: 4, elevationMeters: 4, surface: 'ใกล้พระราชนิเวศน์มฤคทายวัน' },
      { distanceKm: 9.8, elevationM: 5, elevationMeters: 5, surface: 'ถนนเลียบแมกไม้เข้าสู่หาด' },
      { distanceKm: 10.52, elevationM: 4, elevationMeters: 4, surface: 'เส้นชัยริมทะเล' },
    ],
    landmarks: [
      {
        id: 'start-finish-10k',
        name: 'START / FINISH จุดปล่อยตัวและเส้นชัย',
        nameEn: 'Start & Finish Area',
        description: 'บริเวณชายหาดหน้าโรงแรม Sea Sand Sun ค่ายนเรศวร',
        type: 'start_finish',
        distanceFromStartKm: 0,
        latitude: 12.6966,
        longitude: 99.9638,
        services: ['จุดลงทะเบียน', 'ซุ้มอาหารเครื่องดื่ม', 'จุดรับฝากของ', 'หน่วยแพทย์หลัก'],
      },
      {
        id: 'special-forces-10k',
        name: 'กองร้อยฝึกรบพิเศษ',
        nameEn: 'Special Combat Training Company',
        description: 'จุดเลี้ยวทิศตะวันออกเฉียงเหนือของค่ายนเรศวร',
        type: 'checkpoint',
        distanceFromStartKm: 1.5,
        latitude: 12.6931,
        longitude: 99.9727,
      },
      {
        id: 'naresuan-monument-10k',
        name: 'พระบรมราชานุสาวรีย์สมเด็จพระนเรศวรมหาราช',
        nameEn: 'King Naresuan the Great Monument',
        description: 'ลานสวนสนามหน้าสระน้ำ พร้อมจุดบริการน้ำดื่ม 1 (กม. 2.7)',
        type: 'water',
        distanceFromStartKm: 2.7,
        latitude: 12.6853,
        longitude: 99.9688,
        services: ['น้ำดื่ม', 'เกลือแร่', 'พยาบาลฉุกเฉิน'],
      },
      {
        id: 'sirindhorn-park-10k',
        name: 'อุทยานสิ่งแวดล้อมนานาชาติสิรินธร',
        nameEn: 'The Sirindhorn International Environmental Park',
        description: 'ศูนย์เรียนรู้พลังงานและสิ่งแวดล้อมระดับสากล พร้อมจุดบริการน้ำดื่ม 2 (กม. 5.5)',
        type: 'water',
        distanceFromStartKm: 5.5,
        latitude: 12.6935,
        longitude: 99.9500,
        services: ['น้ำดื่ม', 'เกลือแร่', 'ผ้าเย็น', 'จุดปฐมพยาบาล'],
      },
      {
        id: 'mangrove-forest-10k',
        name: 'สวนป่าชายเลนทูลกระหม่อม',
        nameEn: 'Thunkramom Mangrove Forest Park',
        description: 'สะพานทางเดินไม้ชมป่าชายเลนธรรมชาติและระบบนิเวศป่าโกงกาง',
        type: 'photo',
        distanceFromStartKm: 7.2,
        latitude: 12.6978,
        longitude: 99.9434,
      },
      {
        id: 'mrigadayavan-palace-10k',
        name: 'เขตพระราชนิเวศน์มฤคทายวัน (บริเวณใกล้เคียง)',
        nameEn: 'Mrigadayavan Palace Proximity',
        description: 'จุดชมวิวใต้ร่มเงาแมกไม้ใหญ่ใกล้เขตพระราชนิเวศน์ประวัติศาสตร์ พร้อมจุดบริการน้ำดื่ม 3 (กม. 8.2)',
        type: 'water',
        distanceFromStartKm: 8.2,
        latitude: 12.7003,
        longitude: 99.9468,
        services: ['น้ำดื่ม', 'เกลือแร่', 'เจ้าหน้าที่กู้ชีพ'],
      },
      {
        id: 'mental-test-station-10k',
        name: 'สถานีทดสอบจิตใจและสนามฝึกสุนัขสงคราม',
        nameEn: 'Mental Toughness & War Dog Fields',
        description: 'จุดเชื่อมต่อทางธรรมชาติก่อนเลี้ยวเข้าสู่ถนนมุ่งหน้าสู่ชายหาด',
        type: 'landmark',
        distanceFromStartKm: 9.5,
        latitude: 12.6933,
        longitude: 99.9605,
      },
    ],
  },

};

// Accommodations near Naresuan Camp (Merged from Agoda, Booking.com, Traveloka, Expedia, Trip)
export { hotelsData } from "./hotelsData";

// Schedule Data
export const scheduleData: ScheduleDay[] = [
  {
    dateLabel: 'วันก่อนวันแข่งขัน (Expo & Bib Pickup)',
    title: 'วันรับอุปกรณ์และตรวจสอบเส้นทาง',
    description: 'ณ ลานกิจกรรมอเนกประสงค์ ค่ายนเรศวร / หน้าโรงแรม Sea Sand Sun',
    items: [
      {
        id: 's-1',
        day: 'day_before',
        time: '10:00 - 18:00',
        title: 'เปิดรับเบอร์วิ่ง (BIB) เสื้อที่ระลึก และสายรัดชิปจับเวลา',
        description: 'กรุณาแสดงบัตรประจำตัวประชาชนหรือหลักฐานการสมัครฉบับดิจิทัลเพื่อรับชุดแข่งขัน',
        iconName: 'Package',
      },
      {
        id: 's-2',
        day: 'day_before',
        time: '10:00 - 19:00',
        title: 'เปิดงานแสดงสินค้าวิ่งและของดีเมืองเพชรบุรี (Running Expo)',
        description: 'บูทอุปกรณ์วิ่ง อาหารพื้นเมืองเพชรบุรี และสินค้าที่ระลึก CHANG SUEK RUN 2027',
        iconName: 'ShoppingBag',
      },
      {
        id: 's-3',
        day: 'day_before',
        time: '14:00 - 16:30',
        title: 'จุดตรวจสุขภาพสุนัขสำหรับระยะพาสัตว์เลี้ยง (War Dog Vet Check)',
        description: 'สัตวแพทย์ตรวจเช็กความพร้อม ความกระตือรือร้น และวัคซีนสำหรับสุนัขที่ร่วมกิจกรรม',
        iconName: 'HeartPulse',
      },
      {
        id: 's-4',
        day: 'day_before',
        time: '16:30 - 17:15',
        title: 'สรุปข้อมูลเส้นทางและข้อควรปฏิบัติ (Race Briefing)',
        description: 'บรรยายสรุปเส้นทาง จุดบริการน้ำ จุดแพทย์ และกติกาความปลอดภัยโดย Race Director',
        iconName: 'Info',
        highlight: true,
      },
      {
        id: 's-5',
        day: 'day_before',
        time: '18:00',
        title: 'ปิดจุดรับเบอร์วิ่งวันแรก',
        description: 'ขอความร่วมมือนักวิ่งรับบิบให้เรียบร้อย (ไม่มีการแจกบิบหน้างานในเช้าวันแข่งขัน)',
        iconName: 'Clock',
      },
    ],
  },
  {
    dateLabel: 'กำหนดการวันจัดงาน (Official Event Schedule)',
    title: 'กำหนดการแข่งขัน กิจกรรมสถานี และคอนเสิร์ต',
    description: 'บริเวณชายหาดหน้าโรงแรม Sea Sand Sun ค่ายนเรศวร',
    items: [
      {
        id: 's-6',
        day: 'race_day',
        time: '09.00–14.00 น.',
        title: 'การแข่งขันประกวดสุนัข',
        description: 'สุนัขแฟนซีธีม War Dog • สุนัขสุขภาพดี • สุนัขเชื่อฟังคำสั่ง',
        iconName: 'Trophy',
        highlight: true,
      },
      {
        id: 's-7',
        day: 'race_day',
        time: '09.00–11.00 น.',
        title: 'กิจกรรมสถานีที่ 1 กิจกรรมยิงปืน',
        description: 'ฐานกิจกรรมสถานีที่ 1 ภายในค่ายนเรศวร',
        iconName: 'Activity',
      },
      {
        id: 's-8',
        day: 'race_day',
        time: '10.00–12.00 น.',
        title: 'กิจกรรมสถานีที่ 2 กิจกรรมหอสูง',
        description: 'ฐานกิจกรรมสถานีที่ 2 ภายในค่ายนเรศวร',
        iconName: 'Activity',
      },
      {
        id: 's-9',
        day: 'race_day',
        time: '13.00–15.00 น.',
        title: 'กิจกรรมสถานีที่ 3 กิจกรรมอุโมงค์ลม',
        description: 'ฐานกิจกรรมสถานีที่ 3 ภายในค่ายนเรศวร',
        iconName: 'Activity',
      },
      {
        id: 's-10',
        day: 'race_day',
        time: '15.00–17.00 น.',
        title: 'พิธีมอบรางวัลการประกวดสุนัข',
        description: 'ประกาศผลและมอบรางวัลแก่ผู้ชนะการแข่งขัน',
        iconName: 'Trophy',
        highlight: true,
      },
      {
        id: 's-11',
        day: 'race_day',
        time: '16.30 น.',
        title: 'ปล่อยตัวนักวิ่ง 10 กิโลเมตร',
        description: 'ประเภทบุคคลทั่วไป',
        iconName: 'Flag',
        highlight: true,
      },
      {
        id: 's-12',
        day: 'race_day',
        time: '17.00 น.',
        title: 'ปล่อยตัวนักวิ่ง 5 กิโลเมตร',
        description: 'ประเภทบุคคลทั่วไป',
        iconName: 'Flag',
        highlight: true,
      },
      {
        id: 's-13',
        day: 'race_day',
        time: '17.15 น.',
        title: 'ปล่อยตัวนักวิ่ง 3 กิโลเมตร',
        description: 'ประเภทวิ่งร่วมกับสุนัข',
        iconName: 'Flag',
        highlight: true,
      },
      {
        id: 's-14',
        day: 'race_day',
        time: '17.30 น.',
        title: 'ปล่อยตัวนักวิ่ง 1 กิโลเมตร',
        description: 'ประเภทวิ่งร่วมกับสุนัข',
        iconName: 'Flag',
        highlight: true,
      },
      {
        id: 's-15',
        day: 'race_day',
        time: '17.30 น. เป็นต้นไป',
        title: 'การแสดงดนตรีและคอนเสิร์ต',
        description: 'เปิดการแสดงโดยวงดนตรีตำรวจตระเวนชายแดน และการแสดงอื่น ๆ',
        iconName: 'Sparkles',
        highlight: true,
      },
    ],
  },
];

// Facilities Data
export const facilitiesData: FacilityItem[] = [
  {
    id: 'toilets',
    name: 'ห้องน้ำและสุขาเคลื่อนที่',
    nameEn: 'Restrooms & Mobile Toilets',
    type: 'สุขอนามัย',
    iconName: 'Bath',
    operatingHours: '04:00 - 10:00 น.',
    location: 'ลานกิจกรรมหลัก และจุดบริการน้ำ กม. 5',
    description: 'ห้องน้ำสะอาดกว่า 30 ห้อง รองรับบริเวณจุด Start/Finish และตามจุดเช็กพอยต์ใหญ่',
    locationNote: 'ลานกิจกรรมหลัก และจุดบริการน้ำ กม. 5',
    notes: 'มีเจ้าหน้าที่ทำความสะอาดและเติมกระดาษชำระตลอดเวลา',
  },
  {
    id: 'water',
    name: 'จุดบริการน้ำดื่มและเกลือแร่',
    nameEn: 'Hydration Stations',
    type: 'เครื่องดื่ม',
    iconName: 'Droplets',
    operatingHours: '05:30 - 08:30 น.',
    location: 'ทุก 1.5 - 2 กม. ตามแผนที่เส้นทาง',
    description: 'น้ำดื่มสะอาด น้ำแร่ เกลือแร่เย็น และฟองน้ำซับเหงื่อมาตรฐานสากลทุก 1.5 - 2 กม.',
    locationNote: 'ประจำทุกระยะตามแผนที่เส้นทาง',
    notes: 'โปรดทิ้งแก้วน้ำลงในถังขยะที่จัดไว้ให้',
  },
  {
    id: 'food',
    name: 'ซุ้มอาหารและเครื่องดื่มหลังเข้าเส้นชัย',
    nameEn: 'Post-Race Refreshments',
    type: 'อาหาร',
    iconName: 'Utensils',
    operatingHours: '06:45 - 09:30 น.',
    location: 'ลาน Finisher Zone ริมหาด',
    description: 'ข้าวต้มกุ้งสดทะเล ขนมหวานเมืองเพชร ผลไม้ ผลิตภัณฑ์นม และเครื่องดื่มฟื้นฟูกล้ามเนื้อ',
    locationNote: 'ลาน Finisher Zone ริมหาด',
    notes: 'สำหรับนักวิ่งที่มีเบอร์วิ่ง (BIB) เท่านั้น',
  },
  {
    id: 'medical',
    name: 'หน่วยแพทย์และรถพยาบาลฉุกเฉิน',
    nameEn: 'Medical Care & Ambulance Standby',
    type: 'การแพทย์',
    iconName: 'Cross',
    operatingHours: '04:30 - 10:00 น.',
    location: 'จุดปล่อยตัว/เส้นชัย และหน่วยเคลื่อนที่เร็ว',
    description: 'ทีมแพทย์ พยาบาลฉุกเฉิน และรถพยาบาล ALS สแตนด์บายพร้อมส่งต่อโรงพยาบาลตลอด 24 ชม.',
    locationNote: 'จุดศูนย์การแพทย์หลัก และหน่วยเคลื่อนที่บนเส้นทาง',
    notes: 'พร้อมเครื่องกระตุกหัวใจ AED และยาจำเป็น',
  },
  {
    id: 'bag-drop',
    name: 'จุดรับฝากสัมภาระ',
    nameEn: 'Baggage Drop Service',
    type: 'บริการ',
    iconName: 'Luggage',
    operatingHours: '04:00 - 09:30 น.',
    location: 'เต็นท์ด้านข้างจุดปล่อยตัว',
    description: 'บริการฝากของปลอดภัยด้วยระบบสติ๊กเกอร์บาร์โค้ดคู่กับเบอร์บิบ (งดรับฝากของมีค่า)',
    locationNote: 'เต็นท์ด้านข้างจุดปล่อยตัว เปิดตั้งแต่ 04:00 น.',
    notes: 'งดรับฝากของมีค่า คอมพิวเตอร์ หรือเงินสด',
  },
  {
    id: 'parking',
    name: 'ลานจอดรถนักวิ่ง',
    nameEn: 'Runner Parking Lots',
    type: 'ที่จอดรถ',
    iconName: 'Car',
    operatingHours: '03:45 - 12:00 น.',
    location: 'โซน A ลานหน้าค่าย และโซน B ลานสำรอง',
    description: 'พื้นที่จอดรถกว้างขวางรองรับกว่า 800 คัน พร้อมเจ้าหน้าที่ทหารสารวัตรดูแลความปลอดภัย',
    locationNote: 'โซน A ลานหน้าค่าย และโซน B ลานสำรอง',
    notes: 'แนะนำให้เดินทางมาถึงก่อนเวลา 05:00 น.',
  },
  {
    id: 'info',
    name: 'ศูนย์ประชาสัมพันธ์และของหาย',
    nameEn: 'Information & Lost and Found',
    type: 'บริการ',
    iconName: 'HelpCircle',
    operatingHours: '04:00 - 10:00 น.',
    location: 'ข้างซุ้มลงทะเบียนหลัก',
    description: 'จุดสอบถามข้อมูล แนะนำโรงแรม ขอความช่วยเหลือฉุกเฉิน และติดตามสิ่งของสูญหาย',
    locationNote: 'ข้างซุ้มลงทะเบียนหลัก',
    notes: 'ติดต่อสอบถามได้ตลอดช่วงเวลาแข่งขัน',
  },
  {
    id: 'photo',
    name: 'จุดถ่ายภาพและสแตนด์เชียร์',
    nameEn: 'Official Photo Spots',
    type: 'ถ่ายภาพ',
    iconName: 'Camera',
    operatingHours: '05:45 - 09:00 น.',
    location: 'ริมหาด และหน้าพระราชนิเวศน์มฤคทายวัน',
    description: 'ซุ้มถ่ายภาพสัญลักษณ์ CHANG SUEK RUN 2027 ช่างภาพมืออาชีพบันทึกภาพฟรีตลอดเส้นทาง',
    locationNote: 'ริมหาด และหน้าพระราชนิเวศน์มฤคทายวัน',
    notes: 'ค้นหาภาพถ่ายฟรีได้จากระบบ Face Recognition หลังจบงาน',
  },
  {
    id: 'family',
    name: 'โซนพักผ่อนสำหรับครอบครัว',
    nameEn: 'Family & Kids Zone',
    type: 'ครอบครัว',
    iconName: 'Users',
    operatingHours: '05:00 - 09:30 น.',
    location: 'สวนสนริมหาด Sea Sand Sun',
    description: 'ลานสนามหญ้าร่มรื่น มีเต็นท์พักคอย เบาะนั่ง เก้าอี้ลม สำหรับผู้ติดตามและเด็กเล็ก',
    locationNote: 'สวนสนริมหาด Sea Sand Sun',
    notes: 'มีมุมกิจกรรมระบายสีและเกมสำหรับเด็ก',
  },
  {
    id: 'pet',
    name: 'โซนดูแลสัตว์เลี้ยง (Pet Friendly Area)',
    nameEn: 'Pet Comfort Zone',
    type: 'สัตว์เลี้ยง',
    iconName: 'PawPrint',
    operatingHours: '05:00 - 09:30 น.',
    location: 'บริเวณร่มไม้ข้างเส้นชัย',
    description: 'จุดบริการน้ำดื่มสัตว์เลี้ยง ชามน้ำ ถุงเก็บมูล และมุมพักเหนื่อยสำหรับเพื่อนซี้สี่ขา',
    locationNote: 'บริเวณร่มไม้ข้างเส้นชัย',
    notes: 'มีสัตวแพทย์อาสาประจำคอยดูแล',
  },
];

// Parking Zones
export const parkingZones: ParkingZone[] = [
  {
    id: 'zone-a',
    name: 'ลานจอดรถโซน A (ลานหลักหน้าค่าย)',
    capacity: '~450 คัน',
    openingTime: '03:45 น.',
    distanceToStart: 'เดิน 200 เมตร (~3 นาที)',
    status: 'AVAILABLE',
    suitableFor: 'รถยนต์ส่วนตัวทั่วไป / VIP',
    description: 'ลานจอดคอนกรีตและพื้นหินบดหน้าทางเข้าค่ายนเรศวร สะดวกสบายและใกล้จุดปล่อยตัวที่สุด',
    notes: 'ทางเข้าหลักถนนเพชรเกษม แนะนำให้มาก่อน 05:00 น.',
    shuttleService: false,
  },
  {
    id: 'zone-b',
    name: 'ลานจอดรถโซน B (ลานอเนกประสงค์ทิศเหนือ)',
    capacity: '~350 คัน',
    openingTime: '04:00 น.',
    distanceToStart: 'เดิน 450 เมตร (~6 นาที)',
    status: 'AVAILABLE',
    suitableFor: 'รถยนต์ส่วนตัว / รถตู้หมู่คณะ',
    description: 'ลานสำรองกว้างขวาง มีรถกอล์ฟบริการรับส่งสำหรับผู้สูงอายุและครอบครัว',
    notes: 'มีรถกอล์ฟและเจ้าหน้าที่คอยบอกทางสู่จุดปล่อยตัว',
    shuttleService: true,
  },
  {
    id: 'zone-c',
    name: 'ลานจอดรถมอเตอร์ไซค์',
    capacity: '~200 คัน',
    openingTime: '03:45 น.',
    distanceToStart: 'เดิน 100 เมตร (~1 นาที)',
    status: 'AVAILABLE',
    suitableFor: 'รถจักรยานยนต์ / บิ๊กไบค์',
    description: 'จุดจอดมอเตอร์ไซค์โดยเฉพาะ ใกล้ประตูทางเข้าเลียบหาด สะดวกและคล่องตัวสูง',
    notes: 'ตั้งอยู่ติดประตูทางเข้าเลียบหาด สะดวกและใกล้ที่สุด',
    shuttleService: false,
  },
  {
    id: 'zone-staff',
    name: 'ลานจอดรถทีมงานและรถพยาบาล (Official / Emergency)',
    capacity: 'จำกัดเฉพาะเจ้าหน้าที่',
    openingTime: 'ตลอด 24 ชั่วโมง',
    distanceToStart: 'ติดจุดปล่อยตัว',
    status: 'LIMITED',
    suitableFor: 'รถพยาบาล รถกู้ชีพ และคณะกรรมการ',
    description: 'พื้นที่ควบคุมพิเศษสำหรับรถกู้ชีพ รถพยาบาลฉุกเฉิน และยานพาหนะจัดการแข่งขัน',
    notes: 'ต้องมีบัตรอนุญาตผ่านทางหน้ารถเท่านั้น',
    shuttleService: false,
  },
];

export const parkingZonesData = parkingZones;

// Transport Options
export const transportOptions: TransportOption[] = [
  {
    id: 'private-car',
    title: 'รถยนต์ส่วนตัว (เดินทางจาก กทม. / เพชรบุรี / หัวหิน)',
    type: 'รถยนต์ส่วนตัว',
    estimatedTime: '2 ชม. 15 นาที จากกรุงเทพฯ',
    iconName: 'Car',
    description:
      'ใช้เส้นทางถนนเพชรเกษม (ทล.4) มุ่งหน้าชะอำ-หัวหิน เลี้ยวซ้ายเข้าสู่ซอยทางเข้าค่ายนเรศวร / พระราชนิเวศน์มฤคทายวัน เดินทางจากกรุงเทพฯ ประมาณ 2 ชั่วโมง 15 นาที จากตัวเมืองชะอำ 10 นาที จากหัวหิน 15 นาที',
    tips: 'ควรตั้ง GPS มาที่ "โรงแรม Sea Sand Sun Hua Hin Resort" หรือ "ค่ายนเรศวร"',
  },
  {
    id: 'train',
    title: 'รถไฟทางคู่ / รถไฟสายใต้ (สถานีชะอำ / สถานีหัวหิน)',
    type: 'รถไฟ',
    estimatedTime: '3 - 3.5 ชม. จาก กทม.',
    iconName: 'Train',
    description:
      'สามารถนั่งรถไฟสายใต้มาลงที่สถานีรถไฟชะอำ หรือสถานีรถไฟหัวหิน แล้วต่อรถสองแถวหรือแท็กซี่ท้องถิ่นมายังค่ายนเรศวรในระยะทางไม่เกิน 10-15 นาที',
    tips: 'แนะนำให้เดินทางมาถึงในวันรับบิบล่วงหน้าเพื่อพักผ่อนเต็มอิ่ม',
  },
  {
    id: 'van',
    title: 'รถตู้โดยสารสาธารณะ (กรุงเทพฯ - ชะอำ - หัวหิน)',
    type: 'รถตู้สาธารณะ',
    estimatedTime: '2.5 ชม.',
    iconName: 'Bus',
    description:
      'ขึ้นรถตู้จากสถานีขนส่งหมอชิต หรือสายใต้ใหม่ สายกรุงเทพฯ-หัวหิน แจ้งพนักงานลงบริเวณปากทางเข้าค่ายนเรศวร (ถนนเพชรเกษม) แล้วต่อมอเตอร์ไซค์รับจ้างเข้าสู่งาน',
    tips: 'มีรถออกทุก 30 - 45 นาทีตั้งแต่เช้าจรวดค่ำ',
  },
  {
    id: 'taxi',
    title: 'แท็กซี่ / Grab / Bolt (พื้นที่หัวหิน-ชะอำ)',
    type: 'แท็กซี่ & เรียกรถผ่านแอป',
    estimatedTime: '15 - 20 นาที จากตัวเมือง',
    iconName: 'Navigation',
    description:
      'ในเขตชะอำและหัวหินมีบริการ GrabCar และ Bolt สะดวกสบาย สามารถเรียกรถมารับ-ส่งถึงหน้าทางเข้าค่ายนเรศวรได้โดยตรง ไม่ต้องกังวลเรื่องหาที่จอดรถ',
    tips: 'เช้าวันแข่งขันควรจองล่วงหน้าหรือเรียกรถก่อนเวลาอย่างน้อย 40 นาที',
  },
];

export const transportationData = transportOptions;

// FAQ Items
export const faqData: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'งานวิ่ง CHANG SUEK RUN 2027 จัดขึ้นที่ไหน?',
    answer:
      'จัดขึ้น ณ ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน บริเวณหน้าหาดโรงแรม Sea Sand Sun อำเภอชะอำ จังหวัดเพชรบุรี (รอยต่อชะอำ-หัวหิน ถนนเพชรเกษม กม. 219)',
  },
  {
    id: 'faq-2',
    category: 'routes',
    question: 'เส้นทางวิ่ง 3 KM, 5 KM และ 10 KM แตกต่างกันอย่างไร?',
    answer:
      'ระยะ 3 KM (Fun Run) เป็นทางเรียบเลียบหาด เหมาะสำหรับครอบครัวและเด็ก; ระยะ 5 KM (Challenge Run) เพิ่มระยะทางเข้าสู่พื้นที่ด้านในค่ายนเรศวร; ระยะ 10 KM (War Dog Trail) เป็นระยะมินิมาราธอนผสมเทรล ผ่านธรรมชาติ บึงน้ำ ป่าชายเลน และสนามฝึกสุนัขสงคราม',
  },
  {
    id: 'faq-3',
    category: 'transport',
    question: 'มีโรงแรมแนะนำใกล้พื้นที่จัดงานหรือไม่?',
    answer:
      'มีโรงแรมและรีสอร์ต Pet-Friendly ต้อนรับสัตว์เลี้ยงรอบค่ายนเรศวรทั้งหมด 41 แห่ง เช่น Radisson Resort (1.92 กม.), Cera Resort (2.20 กม.), VALA Hua Hin (2.28 กม.), AVANI+ (2.8 กม.), Mida De Sea (5.2 กม.) และที่พักราคาประหยัดเริ่มต้น ฿467+ สามารถดูรายชื่อทั้ง 41 แห่งพร้อมจำนวนห้องว่างและเบอร์โทรได้ในหัวข้อ "ค้นหาที่พัก"',
  },
  {
    id: 'faq-4',
    category: 'pet',
    question: 'สามารถนำสุนัขหรือสัตว์เลี้ยงเข้าร่วมวิ่งได้หรือไม่?',
    answer:
      'สุนัขร่วมวิ่งได้เฉพาะประเภท Dog Run 1 กม. และ 3 กม. สุนัขต้องมีอายุ 1 ปีขึ้นไป แสดงหลักฐานการฉีดวัคซีนครบถ้วน อยู่ในสายจูงตลอดเวลา และเจ้าของต้องเตรียมถุงเก็บมูลมาด้วย',
  },
  {
    id: 'faq-5',
    category: 'race_pack',
    question: 'การรับเสื้อและเบอร์วิ่ง (BIB) ดำเนินการอย่างไร?',
    answer:
      'ผู้จัดงานจะประกาศวันและเวลารับอุปกรณ์การแข่งขันผ่านช่องทางทางการ ผู้สมัครต้องรับด้วยตนเองโดยแสดงเลข BIB หรือบัตรดิจิทัล',
  },
  {
    id: 'faq-6',
    category: 'transport',
    question: 'มีจุดรับฝากสัมภาระและที่จอดรถหรือไม่?',
    answer:
      'มีจุดรับฝากสัมภาระฟรี (เวลาเปิดจะประกาศอีกครั้ง) มีลานจอดรถรองรับได้กว่า 800 คันในโซน A, B และลานมอเตอร์ไซค์ พร้อมเจ้าหน้าที่ดูแลความปลอดภัย',
  },
  {
    id: 'faq-7',
    category: 'routes',
    question: 'มีจุดบริการน้ำดื่มและหน่วยพยาบาลตลอดเส้นทางหรือไม่?',
    answer:
      'มีจุดบริการน้ำดื่มทุก ๆ 1.5 - 2 กิโลเมตร พร้อมเกลือแร่และผลไม้สดในระยะ 5KM และ 10KM พร้อมทั้งมีแพทย์ พยาบาลฉุกเฉิน และรถกู้ชีพสแตนด์บายตลอดเวลาการแข่งขัน',
  },
  {
    id: 'faq-8',
    category: 'general',
    question: 'หากมีฝนตก การแข่งขันจะยังคงดำเนินต่อไปหรือไม่?',
    answer:
      'หากเป็นฝนตกปรอย ๆ กิจกรรมจะดำเนินต่อไปตามปกติ แต่หากเกิดพายุฝนฟ้าคะนองรุนแรงหรือสภาวะที่เป็นอันตราย คณะกรรมการฝ่ายจัดการแข่งขันจะพิจารณาชะลอเวลาปล่อยตัวหรือปรับเปลี่ยนเส้นทางตามเกณฑ์มาตรฐานความปลอดภัย',
  },
];

// Announcements Data
export const announcementsData: Announcement[] = [
  {
    id: 'ann-1',
    date: 'อัปเดตล่าสุด',
    category: 'กำหนดการ',
    title: 'เตรียมพบกับการเปิดรับสมัคร CHANG SUEK RUN 2027 อย่างเป็นทางการเร็ว ๆ นี้',
    summary:
      'คณะกรรมการกำลังสรุปรายละเอียดระบบรับสมัครออนไลน์และแพ็กเกจเสื้อที่ระลึก พร้อมโปรโมชั่น Early Bird สุดพิเศษ โปรดติดตามประกาศผ่านช่องทางทางการ',
    content:
      'คณะกรรมการกำลังสรุปรายละเอียดระบบรับสมัครออนไลน์และแพ็กเกจเสื้อที่ระลึก พร้อมโปรโมชั่น Early Bird สุดพิเศษ โปรดติดตามประกาศผ่านช่องทางทางการ',
    isImportant: true,
  },
  {
    id: 'ann-2',
    date: 'อัปเดตล่าสุด',
    category: 'เส้นทาง',
    title: 'เปิดตัวผังเส้นทางวิ่ง 3 KM, 5 KM, 10 KM WAR DOG TRAIL ประจำปี 2027',
    summary:
      'ชวนชมแผนที่เส้นทางวิ่งตัวอย่างที่ผสมผสานระหว่างชายหาดค่ายนเรศวร ป่าสน และสนามฝึกสุนัขสงคราม ออกแบบให้วิ่งสนุกและปลอดภัยสำหรับทุกคน',
    content:
      'ชวนชมแผนที่เส้นทางวิ่งตัวอย่างที่ผสมผสานระหว่างชายหาดค่ายนเรศวร ป่าสน และสนามฝึกสุนัขสงคราม ออกแบบให้วิ่งสนุกและปลอดภัยสำหรับทุกคน',
    isImportant: false,
  },
  {
    id: 'ann-3',
    date: 'อัปเดตล่าสุด',
    category: 'ที่พัก',
    title: 'อัปเดตรายชื่อที่พัก Pet-Friendly 41 แห่ง พร้อมจำนวนห้องว่างล่าสุด',
    summary:
      'รวบรวมรายชื่อโรงแรมและรีสอร์ต Pet-Friendly ทั้งหมด 41 แห่ง พร้อมระยะทาง ราคาเริ่มต้น จำนวนห้องว่าง และเบอร์ติดต่อโดยตรง เพื่อให้นักวิ่งและสัตว์เลี้ยงวางแผนเข้าพักได้อย่างสะดวก',
    content:
      'รวบรวมรายชื่อโรงแรมและรีสอร์ต Pet-Friendly ทั้งหมด 41 แห่ง พร้อมระยะทาง ราคาเริ่มต้น จำนวนห้องว่าง และเบอร์ติดต่อโดยตรง เพื่อให้นักวิ่งและสัตว์เลี้ยงวางแผนเข้าพักได้อย่างสะดวก',
    isImportant: true,
  },
];

// Rules & Guidelines
export const raceRules = [
  {
    title: 'คุณสมบัติและการลงทะเบียน',
    details: [
      'ผู้สมัครต้องมีสุขภาพร่างกายแข็งแรงและไม่มีโรคประจำตัวที่เป็นอันตรายต่อการวิ่งระยะไกล',
      'ผู้สมัครอายุต่ำกว่า 13 ปี ต้องมีผู้ปกครองดูแลใกล้ชิดตลอดกิจกรรม อายุต่ำกว่า 17 ปีต้องได้รับความยินยอมจากผู้ปกครอง และระยะ 10 กม. ต้องอายุ 18 ปีขึ้นไป',
      'การลงทะเบียนถือเป็นสิทธิ์เฉพาะบุคคล ห้ามจำหน่ายหรือโอนสิทธิ์เบอร์วิ่ง (BIB) ให้ผู้อื่นในทุกกรณี',
    ],
  },
  {
    title: 'เบอร์วิ่ง (BIB) และชิปจับเวลา',
    details: [
      'นักวิ่งทุกคนต้องติดเบอร์วิ่ง (BIB) ไว้ที่บริเวณหน้าอกให้เห็นชัดเจนตลอดการแข่งขัน',
      'ห้ามพับ ตัด หรือเจาะรูทับแถบชิปจับเวลาอิเล็กทรอนิกส์ด้านหลังบิบ',
      'ผู้ที่ไม่มีเบอร์วิ่งจะไม่ได้รับสิทธิ์รับเหรียญรางวัล อาหาร และความคุ้มครองประกันอุบัติเหตุ',
    ],
  },
  {
    title: 'เวลาตัดตัว (Cut-off Time) และความปลอดภัย',
    details: [
      'ระยะ 10 KM ตัดตัวที่เวลา 2 ชั่วโมง (18:30 น.)',
      'ระยะ 5 KM ตัดตัวที่เวลา 1 ชั่วโมง 15 นาที (18:15 น.)',
      'ระยะ 3 KM ตัดตัวที่เวลา 1 ชั่วโมง (18:15 น.)',
      'นักวิ่งที่ไม่ผ่านจุดตัดตัวตามเวลาที่กำหนด ต้องขึ้นรถพยาบาลหรือรถรับส่งนักวิ่ง (Sweeper Car) เพื่อความปลอดภัย',
    ],
  },
  {
    title: 'การอนุรักษ์ธรรมชาติและสิ่งแวดล้อม',
    details: [
      'ห้ามทิ้งขวดน้ำ แก้วกระดาษ หรือซองเจลนอกจุดทิ้งขยะที่ผู้จัดกำหนดไว้เด็ดขาด',
      'ร่วมรณรงค์ "วิ่งเก็บขยะ / ไม่สร้างขยะ" บนหาดทรายและพื้นที่ป่าชายเลนอันทรงคุณค่า',
    ],
  },
];

// ---------------------------------------------------------------------------
// Ticket categories & pricing (single source of truth for every price on the site)
// Individual: 5 KM, 10 KM  |  Dog + owner: 1 KM, 3 KM
// ---------------------------------------------------------------------------
export type TicketGroup = 'individual' | 'dog';

export interface TicketCategory {
  id: RouteId;
  group: TicketGroup;
  category?: TicketGroup;
  distanceLabel: string; // e.g. '5K'
  name: string;
  subtitle: string;
  basePrice: number; // THB
  baseLabel: string; // what the base price covers
  addPersonPrice?: number; // THB per extra person (dog categories only)
  addDogPrice?: number; // THB per extra dog (dog categories only)
  extraPersonPrice?: number;
  extraDogPrice?: number;
  badge?: string;
  emoji: string;
}

export const ticketCategories: TicketCategory[] = [
  {
    id: '5km',
    group: 'individual',
    category: 'individual',
    distanceLabel: '5K',
    name: '5 KM วิ่งบุคคลทั่วไป',
    subtitle: 'ก้าวแรกสู่สุขภาพที่ดี',
    basePrice: 690,
    baseLabel: 'ต่อ 1 คน',
    badge: 'ยอดนิยม',
    emoji: '👟',
  },
  {
    id: '10km',
    group: 'individual',
    category: 'individual',
    distanceLabel: '10K',
    name: '10 KM วิ่งบุคคลทั่วไป',
    subtitle: 'ท้าทายตัวเอง ไปให้ไกลกว่าเดิม',
    basePrice: 890,
    baseLabel: 'ต่อ 1 คน',
    emoji: '🏃',
  },
  {
    id: '1km',
    group: 'dog',
    category: 'dog',
    distanceLabel: '1K',
    name: '1 KM วิ่งคู่น้องสุนัข',
    subtitle: 'วิ่งเล่นสบาย ๆ เหมาะกับทุกวัย',
    basePrice: 790,
    baseLabel: '1 คน + 1 น้องสุนัข',
    addPersonPrice: 450,
    addDogPrice: 250,
    extraPersonPrice: 450,
    extraDogPrice: 250,
    badge: 'เริ่มต้นง่าย',
    emoji: '🐶',
  },
  {
    id: '3km',
    group: 'dog',
    category: 'dog',
    distanceLabel: '3K',
    name: '3 KM วิ่งคู่น้องสุนัข',
    subtitle: 'คนกับน้องสุนัข วิ่งเคียงข้างกัน',
    basePrice: 890,
    baseLabel: '1 คน + 1 น้องสุนัข',
    addPersonPrice: 500,
    addDogPrice: 300,
    extraPersonPrice: 500,
    extraDogPrice: 300,
    emoji: '🐕',
  },
];

export const ticketById = (id: RouteId): TicketCategory =>
  ticketCategories.find((t) => t.id === id) ?? ticketCategories[0];

export const isDogCategory = (id: RouteId) => ticketById(id).group === 'dog';

export const formatBaht = (n: number) => `${n.toLocaleString('th-TH')}`;

export const calcTicketTotal = (id: RouteId, extraPeople = 0, extraDogs = 0) => {
  const t = ticketById(id);
  return (
    t.basePrice +
    extraPeople * (t.addPersonPrice ?? 0) +
    extraDogs * (t.addDogPrice ?? 0)
  );
};
