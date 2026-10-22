export const EVENT_VENUE_COORDS: [number, number] = [12.6948, 99.9642]; // Sea Sand Sun Resort / Naresuan Camp Beachfront

/**
 * Calculates distance in kilometers between two lat/lng coordinates using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number = EVENT_VENUE_COORDS[0],
  lon2: number = EVENT_VENUE_COORDS[1]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Generates a clean, safe Google Maps search URL
 */
export function getGoogleMapsUrl(queryOrUrl: string, lat?: number, lng?: number): string {
  if (queryOrUrl && (queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://'))) {
    return queryOrUrl;
  }
  if (lat !== undefined && lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const cleanQuery = encodeURIComponent(queryOrUrl);
  return `https://www.google.com/maps/search/?api=1&query=${cleanQuery}`;
}

/**
 * Strips non-numeric characters for tel: links
 */
export function formatTelLink(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `tel:${cleaned}`;
}

/**
 * Estimates driving time based on approximate coastal road speed (~30 km/h)
 */
export function estimateDriveTimeMinutes(distanceKm: number): number {
  const minutes = Math.round((distanceKm / 30) * 60);
  return Math.max(minutes, 2);
}
