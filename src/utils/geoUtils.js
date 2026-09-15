/**
 * @file client-dashboard/src/utils/geoUtils.js
 * @description Geographic distance, user positioning, and exhibition coordinate resolver.
 * Computes distances between user location and trade show venues/cities using the Haversine formula.
 */

// Curated geographic database for Indian and major global exhibition hubs & convention centers
export const CITY_COORDINATES = {
  // Major Indian Exhibition Hubs
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai', state: 'Maharashtra' },
  'bombay': { lat: 19.0760, lng: 72.8777, name: 'Mumbai', state: 'Maharashtra' },
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi', state: 'Delhi' },
  'greater noida': { lat: 28.4744, lng: 77.5040, name: 'Greater Noida', state: 'Uttar Pradesh' },
  'noida': { lat: 28.5355, lng: 77.3910, name: 'Noida', state: 'Uttar Pradesh' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurugram', state: 'Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, name: 'Gurugram', state: 'Haryana' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru', state: 'Karnataka' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru', state: 'Karnataka' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai', state: 'Tamil Nadu' },
  'madras': { lat: 13.0827, lng: 80.2707, name: 'Chennai', state: 'Tamil Nadu' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad', state: 'Telangana' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata', state: 'West Bengal' },
  'calcutta': { lat: 22.5726, lng: 88.3639, name: 'Kolkata', state: 'West Bengal' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune', state: 'Maharashtra' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad', state: 'Gujarat' },
  'gandhinagar': { lat: 23.2156, lng: 72.6369, name: 'Gandhinagar', state: 'Gujarat' },
  'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur', state: 'Rajasthan' },
  'indore': { lat: 22.7196, lng: 75.8577, name: 'Indore', state: 'Madhya Pradesh' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, name: 'Coimbatore', state: 'Tamil Nadu' },
  'surat': { lat: 21.1702, lng: 72.8311, name: 'Surat', state: 'Gujarat' },
  'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi', state: 'Kerala' },
  'cochin': { lat: 9.9312, lng: 76.2673, name: 'Kochi', state: 'Kerala' },
  'goa': { lat: 15.4909, lng: 73.8278, name: 'Goa', state: 'Goa' },
  'panaji': { lat: 15.4909, lng: 73.8278, name: 'Goa', state: 'Goa' },
  'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow', state: 'Uttar Pradesh' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh', state: 'Punjab' },
  'bhopal': { lat: 23.2599, lng: 77.4126, name: 'Bhopal', state: 'Madhya Pradesh' },
  'nagpur': { lat: 21.1458, lng: 79.0882, name: 'Nagpur', state: 'Maharashtra' },
  'vadodara': { lat: 22.3072, lng: 73.1812, name: 'Vadodara', state: 'Gujarat' },
  'rajkot': { lat: 22.3039, lng: 70.8022, name: 'Rajkot', state: 'Gujarat' },
  'patna': { lat: 25.5941, lng: 85.1376, name: 'Patna', state: 'Bihar' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar', state: 'Odisha' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'guwahati': { lat: 26.1445, lng: 91.7362, name: 'Guwahati', state: 'Assam' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, name: 'Ludhiana', state: 'Punjab' },
  'agra': { lat: 27.1767, lng: 78.0081, name: 'Agra', state: 'Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, name: 'Varanasi', state: 'Uttar Pradesh' },
  'raipur': { lat: 21.2514, lng: 81.6296, name: 'Raipur', state: 'Chhattisgarh' },

  // Key Convention Venues (Pinpoint accurate)
  'bombay exhibition centre': { lat: 19.1551, lng: 72.8532, name: 'Mumbai', state: 'Maharashtra' },
  'jio world convention centre': { lat: 19.0633, lng: 72.8687, name: 'Mumbai', state: 'Maharashtra' },
  'pragati maidan': { lat: 28.6186, lng: 77.2435, name: 'New Delhi', state: 'Delhi' },
  'bharat mandapam': { lat: 28.6186, lng: 77.2435, name: 'New Delhi', state: 'Delhi' },
  'india expo centre': { lat: 28.4619, lng: 77.4988, name: 'Greater Noida', state: 'Uttar Pradesh' },
  'biec': { lat: 13.0645, lng: 77.4815, name: 'Bengaluru', state: 'Karnataka' },
  'bangalore international exhibition centre': { lat: 13.0645, lng: 77.4815, name: 'Bengaluru', state: 'Karnataka' },
  'hitex': { lat: 17.4721, lng: 78.3756, name: 'Hyderabad', state: 'Telangana' },
  'chennai trade centre': { lat: 13.0135, lng: 80.1873, name: 'Chennai', state: 'Tamil Nadu' },
  'mahatma mandir': { lat: 23.2201, lng: 72.6375, name: 'Gandhinagar', state: 'Gujarat' },
  'helipad exhibition centre': { lat: 23.2372, lng: 72.6683, name: 'Gandhinagar', state: 'Gujarat' },
  'auto cluster exhibition center': { lat: 18.6369, lng: 73.8102, name: 'Pune', state: 'Maharashtra' },
  'biswa bangla mela prangan': { lat: 22.5358, lng: 88.3976, name: 'Kolkata', state: 'West Bengal' },

  // Major International Hubs
  'dubai': { lat: 25.2048, lng: 55.2708, name: 'Dubai', country: 'United Arab Emirates' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, name: 'Abu Dhabi', country: 'United Arab Emirates' },
  'singapore': { lat: 1.3521, lng: 103.8198, name: 'Singapore', country: 'Singapore' },
  'bangkok': { lat: 13.7563, lng: 100.5018, name: 'Bangkok', country: 'Thailand' },
  'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo', country: 'Sri Lanka' },
  'dhaka': { lat: 23.8103, lng: 90.4125, name: 'Dhaka', country: 'Bangladesh' },
  'london': { lat: 51.5074, lng: -0.1278, name: 'London', country: 'United Kingdom' },
  'paris': { lat: 48.8566, lng: 2.3522, name: 'Paris', country: 'France' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, name: 'Frankfurt', country: 'Germany' },
  'dusseldorf': { lat: 51.2277, lng: 6.7735, name: 'Dusseldorf', country: 'Germany' },
  'tokyo': { lat: 35.6762, lng: 139.6503, name: 'Tokyo', country: 'Japan' },
  'shanghai': { lat: 31.2304, lng: 121.4737, name: 'Shanghai', country: 'China' },
  'hong kong': { lat: 22.3193, lng: 114.1694, name: 'Hong Kong', country: 'Hong Kong' }
};

/**
 * Calculates distance in kilometers between two lat/lng coordinates using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers (rounded)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Resolves event coordinates from direct latitude/longitude attributes or matches
 * venue, city, and address against the known coordinates dictionary.
 * @param {Object} event
 * @returns {{ lat: number, lng: number } | null}
 */
export function resolveEventCoordinates(event) {
  if (!event) return null;

  // 1. Direct coordinates
  const lat = event.lat || event.latitude || event.mapLat || event.ovaem_event_map_lat;
  const lng = event.lng || event.longitude || event.mapLng || event.ovaem_event_map_lng;
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  // 2. Search by venue keywords
  const venue = (event.venue || '').toLowerCase().trim();
  if (venue) {
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (venue.includes(key)) {
        return { lat: coords.lat, lng: coords.lng };
      }
    }
  }

  // 3. Search by city name
  const city = (event.city || '').toLowerCase().trim();
  if (city && city !== 'india') {
    if (CITY_COORDINATES[city]) {
      return { lat: CITY_COORDINATES[city].lat, lng: CITY_COORDINATES[city].lng };
    }
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (city.includes(key) || key.includes(city)) {
        return { lat: coords.lat, lng: coords.lng };
      }
    }
  }

  // 4. Search by address / state
  const address = (event.address || event.state || '').toLowerCase().trim();
  if (address) {
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (address.includes(key)) {
        return { lat: coords.lat, lng: coords.lng };
      }
    }
  }

  return null;
}

/**
 * Finds the closest recognized city name for a given lat/lng pair.
 * @param {number} lat
 * @param {number} lng
 * @returns {string} city name
 */
export function findNearestCityName(lat, lng) {
  if (!lat || !lng) return 'Your Location';
  let closestCity = 'Your Location';
  let minDistance = Infinity;

  for (const info of Object.values(CITY_COORDINATES)) {
    const dist = calculateDistanceKm(lat, lng, info.lat, info.lng);
    if (dist != null && dist < minDistance) {
      minDistance = dist;
      closestCity = info.name;
    }
  }

  return closestCity;
}

/**
 * Detects the user's location via the browser Geolocation API, with graceful fallback.
 * @returns {Promise<{ lat: number, lng: number, city: string, source: 'device' | 'fallback' }>}
 */
export function detectUserLocation() {
  return new Promise((resolve) => {
    // Default fallback hub (Mumbai)
    const fallback = {
      lat: 19.0760,
      lng: 72.8777,
      city: 'Mumbai',
      source: 'fallback'
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(fallback);
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const city = findNearestCityName(lat, lng);
        resolve({
          lat,
          lng,
          city,
          source: 'device'
        });
      },
      (error) => {
        console.warn('Browser geolocation denied or timed out, using proximity fallback:', error.message);
        resolve(fallback);
      },
      options
    );
  });
}

/**
 * Formats distance into a clean user-friendly badge string.
 * @param {number} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return '';
  if (km < 1) return '< 1 km away';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km away`;
  return `${km.toLocaleString()} km away`;
}
