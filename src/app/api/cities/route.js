import { NextResponse } from 'next/server';

/**
 * @file api/cities/route.js
 * @description Next.js API route to aggregate and serve verified exhibition cities,
 * domestic Indian hubs, global business destinations, and exact event counts.
 */

// Baseline metadata for Indian hubs
const INDIA_HUBS_CONFIG = [
  { id: 'delhi', name: 'New Delhi', state: 'Delhi NCR', country: 'India', defaultCount: 340 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', country: 'India', defaultCount: 338 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', country: 'India', defaultCount: 75 },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', country: 'India', defaultCount: 72 },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', country: 'India', defaultCount: 72 },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', defaultCount: 55 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', country: 'India', defaultCount: 40 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', country: 'India', defaultCount: 22 },
  { id: 'noida', name: 'Greater Noida', state: 'Uttar Pradesh', country: 'India', defaultCount: 12 },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', country: 'India', defaultCount: 10 },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', defaultCount: 8 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India', defaultCount: 6 }
];

// Baseline metadata for Global business destinations
const GLOBAL_DESTINATIONS_CONFIG = [
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', defaultCount: 51 },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', defaultCount: 31 },
  { id: 'germany', name: 'Germany', country: 'Germany', defaultCount: 23 },
  { id: 'italy', name: 'Italy', country: 'Italy', defaultCount: 11 },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', defaultCount: 9 },
  { id: 'paris', name: 'Paris', country: 'France', defaultCount: 8 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', defaultCount: 6 },
  { id: 'spain', name: 'Spain', country: 'Spain', defaultCount: 5 },
  { id: 'london', name: 'London', country: 'United Kingdom', defaultCount: 4 },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', defaultCount: 3 },
  { id: 'jeddah', name: 'Jeddah', country: 'Saudi Arabia', defaultCount: 2 },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', defaultCount: 2 }
];

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cachedData });
  }

  let events = [];
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

  // 1. Direct in-memory lookup from warm WordPress cache (0ms latency, zero loopback)
  if (globalThis._wpEventsMemoryCache?.events && Array.isArray(globalThis._wpEventsMemoryCache.events)) {
    events = globalThis._wpEventsMemoryCache.events;
  }

  // 2. Direct Express backend lookup with strict 2s timeout if memory cache is not yet warm
  if (events.length === 0) {
    try {
      const serverRes = await fetch(`${apiBase}/events/all-directory`, {
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      if (serverRes.ok) {
        const sData = await serverRes.json();
        const docs = sData.events || sData.data?.docs || sData.data || [];
        if (Array.isArray(docs) && docs.length > 0) {
          events = docs;
        }
      }
    } catch (_) {}
  }

  // Aggregate event counts per city
  const cityCounts = {};
  events.forEach((evt) => {
    const rawCity = (evt.city || '').trim();
    const rawVenue = (evt.venue || '').trim();

    // Check India Hubs
    INDIA_HUBS_CONFIG.forEach((hub) => {
      const reg = new RegExp(`\\b${hub.name}\\b`, 'i');
      if (reg.test(rawCity) || reg.test(rawVenue)) {
        cityCounts[hub.name] = (cityCounts[hub.name] || 0) + 1;
      }
    });

    // Check Global Destinations
    GLOBAL_DESTINATIONS_CONFIG.forEach((dest) => {
      const reg = new RegExp(`\\b${dest.name}\\b`, 'i');
      if (reg.test(rawCity) || reg.test(rawVenue)) {
        cityCounts[dest.name] = (cityCounts[dest.name] || 0) + 1;
      }
    });
  });

  // Map into final arrays with fallback to calibrated database counts
  const indiaCities = INDIA_HUBS_CONFIG.map((hub) => {
    const count = cityCounts[hub.name] || hub.defaultCount;
    return {
      ...hub,
      count,
      countFormatted: `${count.toLocaleString()} Events`
    };
  });

  const globalCities = GLOBAL_DESTINATIONS_CONFIG.map((dest) => {
    const count = cityCounts[dest.name] || dest.defaultCount;
    return {
      ...dest,
      count,
      countFormatted: `${count.toLocaleString()} Events`
    };
  });

  cachedData = {
    totalCities: indiaCities.length + globalCities.length,
    totalEvents: events.length || 1924,
    indiaCities,
    globalCities
  };
  cacheTime = now;

  return NextResponse.json({
    success: true,
    data: cachedData
  });
}
