export type RouteId = '1km' | '3km' | '5km' | '10km';

export interface Landmark {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  type: 'start_finish' | 'water' | 'medical' | 'toilet' | 'photo' | 'parking' | 'checkpoint' | 'landmark';
  distanceFromStartKm: number;
  latitude: number;
  longitude: number;
  services?: string[];
  notes?: string;
}

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  elevationMeters?: number;
  surface?: string;
}

export interface RouteData {
  id: RouteId;
  name: string;
  title: string;
  distanceKm: number;
  color: string;
  tagline: string;
  type: string;
  difficulty: 'ง่าย (Easy)' | 'ปานกลาง (Moderate)' | 'ท้าทาย (Challenging)';
  durationEstimate: string;
  startTime: string;
  cutoffTime: string;
  description: string;
  terrainType: string;
  roadCondition: string;
  recommendedFor: string;
  waterStationCount: number;
  medicalStationCount: number;
  safetyNotes: string;
  coordinates: [number, number][]; // [lat, lng]
  elevation: ElevationPoint[];
  elevationProfile: ElevationPoint[];
  landmarks: Landmark[];
  measuredPerimeterKm?: number;
  measuredAreaSqM?: number;
  googleEarthSummary?: string;
}

export interface HotelBookingLinks {
  agoda?: string;
  booking?: string;
  traveloka?: string;
  expedia?: string;
  trip?: string;
  maps?: string;
  web?: string;
}

export interface Hotel {
  id: string;
  rank?: number; // อันดับ 1-41
  name: string;
  nameTh: string;
  nameEn: string;
  distanceKm: number; // ระยะห่างจากค่าย (กม.)
  drivingTimeMinutes: number;
  priceStart?: string; // ราคาเริ่มต้น เช่น ฿1,500, ฿500+, ฿472+
  priceMin: number;
  priceMax: number;
  priceCurrency?: string;
  priceRange: string;
  priceNote?: string;
  availableRooms?: string; // จำนวนห้องว่าง เช่น "6 ห้อง", "ไม่ระบุ", "29 ห้อง"
  availableRoomsCount?: number | null; // จำนวนห้องว่างตัวเลข
  phone: string;
  website: string | null;
  facebook: string | null;
  googleMaps: string;
  latitude: number;
  longitude: number;
  type: 'Resort' | 'Hotel' | 'Villa' | 'Guest House' | 'Hostel' | 'Condo' | string;
  amenities: string[];
  facilities: string[];
  description: string;
  address: string;
  addressSnippet: string;
  petFriendly: boolean;
  petPolicy: string; // ข้อมูล Pet Friendly
  petFriendlyDetails?: string;
  recommendedFor: string;
  rating?: number;
  // Enhanced multi-platform fields:
  travelokaPrice?: string | null;
  agodaPrice?: string | null;
  bookingPrice?: string | null;
  expediaTripPrice?: string | null;
  conditions?: string;
  sourceBadge?: string;
  bookingLinks?: HotelBookingLinks;
}

export interface ScheduleItem {
  id?: string;
  day: 'day_before' | 'race_day';
  time: string;
  title: string;
  description: string;
  iconName?: string;
  highlight?: boolean;
}

export interface ScheduleDay {
  dateLabel: string;
  title: string;
  description: string;
  items: ScheduleItem[];
}

export interface FacilityItem {
  id: string;
  name: string;
  nameEn?: string;
  type: string;
  iconName?: string;
  operatingHours: string;
  location: string;
  description: string;
  notes?: string;
  locationNote?: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  capacity: string;
  openingTime: string;
  distanceToStart: string;
  status: 'AVAILABLE' | 'LIMITED' | 'FULL';
  suitableFor?: string;
  description?: string;
  notes?: string;
  shuttleService?: boolean;
}

export interface TransportOption {
  id: string;
  title: string;
  type: string;
  estimatedTime: string;
  description: string;
  tips: string;
  iconName?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Announcement {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  isImportant?: boolean;
}

export interface SafetyContact {
  title: string;
  role: string;
  phone: string;
}

export interface VenueInfo {
  name: string;
  nameEn: string;
  description: string;
  latitude: number;
  longitude: number;
  highlights: string[];
  rules: string[];
}
