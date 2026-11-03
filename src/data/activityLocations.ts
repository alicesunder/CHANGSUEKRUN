/**
 * Where each after-run activity is. Coordinates come from the Plus Codes in the organiser's
 * Google Maps links (about 14 m accuracy); `mapsUrl` is the organiser's own link for navigation.
 */
export interface ActivityLocation {
  id: 'gun' | 'tower' | 'wind' | 'resort';
  /** activity station number; the resort (start & concert area) has none */
  station?: number;
  name: string;
  /** Plus Code shown in Google Maps */
  plusCode?: string;
  lat: number;
  lng: number;
  color: string;
  mapsUrl: string;
}

export const ACTIVITY_LOCATIONS: ActivityLocation[] = [
  {
    id: 'gun',
    station: 1,
    name: 'สนามยิงปืน',
    plusCode: 'MXP3+672',
    lat: 12.68551,
    lng: 99.95314,
    color: '#0369A1',
    mapsUrl: 'https://maps.app.goo.gl/t8Uv3veHAo6QttMj9',
  },
  {
    id: 'tower',
    station: 2,
    name: 'หอสูง',
    plusCode: 'MXX5+8XW',
    lat: 12.69836,
    lng: 99.95995,
    color: '#4F46E5',
    mapsUrl: 'https://maps.app.goo.gl/egFzX3SCKBZW7GFM9',
  },
  {
    id: 'wind',
    station: 3,
    name: 'อุโมงค์ลม',
    plusCode: 'MXH5+559',
    lat: 12.67791,
    lng: 99.95798,
    color: '#0F766E',
    mapsUrl: 'https://maps.app.goo.gl/1q9d2EVSFzD4HTYv5',
  },
  {
    id: 'resort',
    name: 'Sea Sand Sun Hua Hin Resort',
    lat: 12.6966,
    lng: 99.9638,
    color: '#E11D48',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sea+Sand+Sun+Hua+Hin+Resort',
  },
];

/** "สถานีที่ 1 · สนามยิงปืน", or just the name for a place that is not a station */
export const locationTitle = (a: ActivityLocation) => (a.station ? `สถานีที่ ${a.station} · ${a.name}` : a.name);
