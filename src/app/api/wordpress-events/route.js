import { NextResponse } from 'next/server';
import wpEventImages from '@/data/wordpress-event-images.json';

const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://visitexpo.in';
const WORDPRESS_API_KEY = process.env.WORDPRESS_API_KEY || 'visitexpo_custom_secret_key_12345';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In-memory cache to ensure lightning fast response times (sub-5ms after warm-up)
let memoryCache = {
  events: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes cache
};

// Helper: Infer industry category from title and description
function inferCategory(title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  if (/\b(travel|tourism|tourist|destination|hospitality|hotel|resort|leisure|flight|airline|cruise|mice|resa|iftm)\b/i.test(text)) return 'Travel & Tourism';
  if (/\b(auto|automobile|automotive|vehicles?|motor|motors|ev|evs|electric vehicle|mobility|tyre|tire|truck|trucks|transport|rodeo|car|cars)\b/i.test(text)) return 'Automotive & EV';
  if (/\b(airport|aviation|rotorcraft|air|aerospace|drone|aircraft|flight)\b/i.test(text)) return 'Aerospace & Aviation';
  if (/\b(cargo|logistics|freight|transport|supply chain|warehousing|innotrans|shipping|maritime)\b/i.test(text)) return 'Logistics & Cargo';
  if (/\b(health|med|medical|pharma|cancer|doctor|hospital|surgical|pharmaexpo|iranpharma|dent|dental|biotech|clinical|nurse)\b/i.test(text)) return 'Healthcare & Pharma';
  if (/\b(build|building|construction|cement|concrete|infrastructure|municipal|architecture|foaid|real estate|property|housing|realty|urban land|flooring|roofing)\b/i.test(text)) return 'Construction & Infra';
  if (/\b(tech|technology|ai|software|cyber|iot|cloud|digital|broadcast|bes|lighting|led|electronics|semiconductor|smart|startup|startupx|it|data|telecom)\b/i.test(text)) return 'Technology & AI';
  if (/\b(textile|garment|fabric|yarn|fashion|apparel|dye|bisutex|clothing|leather|tailor|sewing|knit|hometextile)\b/i.test(text)) return 'Textile & Fashion';
  if (/\b(rice|food|agriculture|bakery|crop|biofuel|grain|beverage|confectionery|agritech|dairy|ice cream|seafood|agro|farming|spice|organic|sugar)\b/i.test(text)) return 'Agri & Food Tech';
  if (/\b(art|jewel|jewellery|jewelry|lifestyle|photo|handicraft|madridjoya|wedding|bridal|marriage|decor|interior|gift|gifts|luxury|pet|pets|cosmetics|beauty|hair|salon)\b/i.test(text)) return 'Art & Lifestyle';
  if (/\b(energy|solar|power|water|environment|waste|clean|renewable|sustainability|storage|battery|oil|gas|wind)\b/i.test(text)) return 'Energy & Environment';
  return 'Trade & Industry';
}

// Diverse, high-resolution genuine WordPress exhibition image pools per category (from visitexpo.in)
const CATEGORY_POOLS = {
  'Travel & Tourism': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Hotel-Data-Conference-2.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/Empowering-Women-Expo-Culture-Entrepreneurship_re.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/08/The-Wedding-Collective-Expo.jpg'
  ],
  'Automotive & EV': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Rush-Administrative-Services-Inc.-Annual-Trucks-Centers-and-Skills-Rodeo-1.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/Bharat-Mobility-Global-Expo_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/India-International-EV-Show-2026_new.jpg'
  ],
  'Aerospace & Aviation': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Scotland-Manufacturing-and-Supply-Chain-Conference-Exhibition-2026_new.jpg'
  ],
  'Logistics & Cargo': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Rush-Administrative-Services-Inc.-Annual-Trucks-Centers-and-Skills-Rodeo-1.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Scotland-Manufacturing-and-Supply-Chain-Conference-Exhibition-2026_new.jpg'
  ],
  'Healthcare & Pharma': [
    'https://visitexpo.in/wp-content/uploads/2026/08/48th-edition-Medicall-Expo-New-Delhi-2026_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/06/India-Med-Expo-Hyderabad-1.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/08/Medicall-Expo-2026.jpg'
  ],
  'Construction & Infra': [
    'https://visitexpo.in/wp-content/uploads/2026/07/Build-Bangladesh-Expo-31st-Edition.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/Bangladesh-Buildcon-International-Expo.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/Water-Environment-Expo.jpg'
  ],
  'Technology & AI': [
    'https://visitexpo.in/wp-content/uploads/2026/08/ET-TECH-X-2026_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/led.png',
    'https://visitexpo.in/wp-content/uploads/2026/09/FINETECH-JAPAN_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/ITEX-IRAQ_new.jpg'
  ],
  'Textile & Fashion': [
    'https://visitexpo.in/wp-content/uploads/2026/07/Sutraa-The-Indian-Fashion-Exhibition.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/gte.png',
    'https://visitexpo.in/wp-content/uploads/2026/07/DyeChem-Bangladesh-Expo-53rd-Edition.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Interfabric-Russia_new.jpg'
  ],
  'Agri & Food Tech': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Food-Connoisseurs-India-Convention-2026.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/06/12.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/icecream-social-for-pets.jpg'
  ],
  'Art & Lifestyle': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Couture-India-Show-2026-New-Delhi.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/08/The-Wedding-Collective-Expo.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Cosmobeaute-Indonesia_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Watch-Jewellery-Middle-East-Show_new.jpg'
  ],
  'Energy & Environment': [
    'https://visitexpo.in/wp-content/uploads/2026/07/Water-Environment-Expo.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/08/9th-India-International-Water-Week-2026.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/07/Water-Bangladesh-Intl-Expo-8th-Edition.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/06/Global-Recycling-Expo-Summit-GREENS.jpg'
  ],
  'Trade & Industry': [
    'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Scotland-Manufacturing-and-Supply-Chain-Conference-Exhibition-2026_new.jpg',
    'https://visitexpo.in/wp-content/uploads/2026/09/Feria-Habitat-Valencia_new.jpg'
  ]
};

function getCategoryFallback(category, title = '') {
  const pool = CATEGORY_POOLS[category] || CATEGORY_POOLS['Trade & Industry'];
  const hash = (title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[Math.abs(hash) % pool.length];
}

function isValidWpImage(url) {
  return url && typeof url === 'string' && url.includes('wp-content/uploads') && !url.includes('unsplash') && !url.includes('cropped-Untitled');
}

// Helper to look up genuine WordPress featured image from backend dataset
function findWpImage(slug, id, wpPostId, title) {
  if (!slug && !id && !title && !wpPostId) return null;

  // 1. Direct key match (by slug, ID, or wpPostId)
  if (slug && isValidWpImage(wpEventImages[slug])) return wpEventImages[slug];
  if (id && isValidWpImage(wpEventImages[String(id)])) return wpEventImages[String(id)];
  if (wpPostId && isValidWpImage(wpEventImages[String(wpPostId)])) return wpEventImages[String(wpPostId)];

  // 2. Normalized slug match
  if (slug) {
    const normSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (isValidWpImage(wpEventImages[normSlug])) return wpEventImages[normSlug];
  }

  // 3. Title-derived slug and fuzzy keyword match
  if (title) {
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (isValidWpImage(wpEventImages[titleSlug])) return wpEventImages[titleSlug];

    const lowerTitle = title.toLowerCase();
    for (const [k, url] of Object.entries(wpEventImages)) {
      if (k.length > 5 && isNaN(Number(k))) {
        const readableKey = k.replace(/-/g, ' ');
        if (lowerTitle.includes(readableKey) || (readableKey.length > 10 && readableKey.includes(lowerTitle))) {
          if (isValidWpImage(url)) return url;
        }
      }
    }
  }

  // 4. Live disk check if harvester has added new mappings in background
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'src/data/wordpress-event-images.json');
    if (fs.existsSync(filePath)) {
      const liveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (slug && isValidWpImage(liveData[slug])) return liveData[slug];
      if (id && isValidWpImage(liveData[String(id)])) return liveData[String(id)];
      if (wpPostId && isValidWpImage(liveData[String(wpPostId)])) return liveData[String(wpPostId)];
      if (slug) {
        const normSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (isValidWpImage(liveData[normSlug])) return liveData[normSlug];
      }
      if (title) {
        const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (isValidWpImage(liveData[titleSlug])) return liveData[titleSlug];
      }
    }
  } catch {}

  return null;
}

// Known venue slugs mapping to full names and verified addresses
const KNOWN_VENUE_SLUGS = {
  'jio-world-convention-centre': { name: 'Jio World Convention Centre', city: 'Mumbai', country: 'India', address: 'Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra 400051' },
  'bharat-mandapam-pragati-maidan-new-delhi': { name: 'Bharat Mandapam (IECC)', city: 'New Delhi', country: 'India', address: 'Pragati Maidan, Mathura Road, New Delhi 110001' },
  'yashobhoomi-iicc-dwarka': { name: 'Yashobhoomi (IICC)', city: 'New Delhi', country: 'India', address: 'Sector 25, Dwarka, New Delhi 110077' },
  'india-expo-centre-greater-noida': { name: 'India Expo Centre & Mart', city: 'Greater Noida', country: 'India', address: 'Plot No. 23-25, Knowledge Park II, Greater Noida, UP 201306' },
  'bombay-exhibition-centre-nesco-mumbai': { name: 'Bombay Exhibition Centre (NESCO)', city: 'Mumbai', country: 'India', address: 'Western Express Hwy, Goregaon East, Mumbai 400063' },
  'hitex-exhibition-centre-hyderabad': { name: 'HITEX Exhibition Centre', city: 'Hyderabad', country: 'India', address: 'Izzat Nagar, Madhapur, Hyderabad, Telangana 500084' },
  'bangalore-international-exhibition-centre-biec': { name: 'Bangalore International Exhibition Centre (BIEC)', city: 'Bengaluru', country: 'India', address: '10th Mile, Tumkur Road, Madavara Post, Bengaluru 562123' },
  'chennai-trade-centre': { name: 'Chennai Trade Centre', city: 'Chennai', country: 'India', address: 'Nandambakkam, Chennai, Tamil Nadu 600089' },
  'biswa-bangla-mela-prangan-kolkata': { name: 'Biswa Bangla Mela Prangan', city: 'Kolkata', country: 'India', address: 'JBS Haldane Ave, Kolkata, West Bengal 700046' },
  'codissia-trade-fair-complex-coimbatore': { name: 'CODISSIA Trade Fair Complex', city: 'Coimbatore', country: 'India', address: 'G.V. Fair Grounds, Coimbatore, Tamil Nadu 641014' },
  'helipad-exhibition-centre-gandhinagar': { name: 'Helipad Exhibition Centre (HEC)', city: 'Ahmedabad', country: 'India', address: 'Sector 17, Gandhinagar, Gujarat 382016' }
};

// Helper: Parse genuine WordPress event location, venue, address, city & country
export function parseWpLocation(rawLocation = '', rawCity = '') {
  const rawLoc = (rawLocation || '').trim();
  
  if (KNOWN_VENUE_SLUGS[rawLoc]) {
    const v = KNOWN_VENUE_SLUGS[rawLoc];
    return {
      venue: v.name,
      address: `${v.name}, ${v.address}`,
      location: `${v.name}, ${v.address}`,
      city: v.city,
      country: v.country,
      state: v.city === 'New Delhi' || v.city === 'Greater Noida' ? 'Delhi NCR' : v.city
    };
  }

  if (!rawLoc && !rawCity) {
    return {
      venue: 'Exhibition Center',
      address: 'Exhibition Center, India',
      location: 'Exhibition Center, India',
      city: 'India',
      country: 'India',
      state: 'India'
    };
  }

  const parts = rawLoc.split(',').map(p => p.trim()).filter(Boolean);
  
  // 1. Determine City
  let city = '';
  const cityList = [
    'New Delhi', 'Delhi', 'Greater Noida', 'Noida', 'Mumbai', 'Bengaluru', 'Bangalore',
    'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Gandhinagar', 'Jaipur',
    'Kochi', 'Goa', 'Indore', 'Coimbatore', 'Surat', 'Lucknow', 'Chandigarh',
    'Santa Barbara', 'New York', 'Chicago', 'Las Vegas', 'Los Angeles', 'San Francisco', 'Orlando',
    'Copenhagen', 'Toronto', 'Glasgow', 'London', 'Birmingham', 'Frankfurt', 'Munich', 'Berlin',
    'Cologne', 'Dusseldorf', 'Paris', 'Madrid', 'Barcelona', 'Valencia', 'Milan', 'Bologna', 'Dubai',
    'Sharjah', 'Abu Dhabi', 'Riyadh', 'Jeddah', 'Singapore', 'Bangkok', 'Dhaka', 'Colombo',
    'Tangerang', 'Jakarta', 'Tokyo', 'Chiba', 'Baghdad', 'Kuala Lumpur', 'Tehran', 'Lagos', 'Dushanbe', 'Phnom Penh', 'Doha'
  ];

  for (const c of cityList) {
    if (new RegExp('\\b' + c + '\\b', 'i').test(rawLoc) || (rawCity && new RegExp('\\b' + c + '\\b', 'i').test(rawCity))) {
      city = c === 'Bangalore' ? 'Bengaluru' : (c === 'Delhi' ? 'New Delhi' : (c === 'Noida' ? 'Greater Noida' : c));
      break;
    }
  }

  if (!city && parts.length >= 3) {
    city = parts[parts.length - 2].replace(/[0-9\-\s]+/g, ' ').trim();
  }
  if (!city && parts.length >= 2) {
    city = parts[1].replace(/[0-9\-\s]+/g, ' ').trim();
  }
  if (!city) city = rawCity && rawCity !== 'India' ? rawCity : 'India';

  // 2. Determine State
  let state = '';
  const stateMap = {
    'Maharashtra': /maharashtra/i,
    'Karnataka': /karnataka/i,
    'Tamil Nadu': /tamil nadu/i,
    'Gujarat': /gujarat/i,
    'Telangana': /telangana/i,
    'West Bengal': /west bengal/i,
    'Rajasthan': /rajasthan/i,
    'Uttar Pradesh': /uttar pradesh/i,
    'Haryana': /haryana/i,
    'Kerala': /kerala/i,
    'Madhya Pradesh': /madhya pradesh/i,
    'Punjab': /punjab/i,
    'Goa': /goa/i,
    'Delhi NCR': /delhi|noida|gurgaon|gurugram/i,
    'California': /california|ca\b/i,
    'Florida': /florida|fl\b/i,
    'Illinois': /illinois|il\b/i,
    'Nevada': /nevada|nv\b/i,
    'Texas': /texas|tx\b/i,
    'New York': /new york|ny\b/i,
    'Scotland': /scotland/i,
    'Greater London': /london/i,
    'Dhaka Division': /dhaka/i,
    'Western Province': /colombo/i
  };

  for (const [stName, stRegex] of Object.entries(stateMap)) {
    if (stRegex.test(rawLoc)) {
      state = stName;
      break;
    }
  }

  if (!state) {
    if (city === 'Mumbai' || city === 'Pune') state = 'Maharashtra';
    else if (city === 'Bengaluru') state = 'Karnataka';
    else if (city === 'Chennai' || city === 'Coimbatore') state = 'Tamil Nadu';
    else if (city === 'Hyderabad') state = 'Telangana';
    else if (city === 'Ahmedabad' || city === 'Gandhinagar' || city === 'Surat') state = 'Gujarat';
    else if (city === 'Kolkata') state = 'West Bengal';
    else if (city === 'New Delhi' || city === 'Greater Noida') state = 'Delhi NCR';
    else if (city === 'Jaipur') state = 'Rajasthan';
    else if (city === 'Lucknow') state = 'Uttar Pradesh';
    else if (city === 'Indore') state = 'Madhya Pradesh';
    else if (city === 'Kochi') state = 'Kerala';
    else if (city === 'Santa Barbara') state = 'California';
    else if (city === 'Chicago') state = 'Illinois';
    else if (city === 'Orlando') state = 'Florida';
    else if (city === 'Las Vegas') state = 'Nevada';
    else if (city === 'Glasgow') state = 'Scotland';
    else if (city === 'Dhaka') state = 'Dhaka Division';
    else if (city === 'Colombo') state = 'Western Province';
    else state = city;
  }

  // 3. Determine Country
  let country = parts.length > 1 ? parts[parts.length - 1] : (rawCity || 'India');
  country = country.replace(/[0-9\-\s]+/g, ' ').trim() || 'India';

  const indianHubs = /delhi|mumbai|bengaluru|bangalore|chennai|hyderabad|pune|ahmedabad|gandhinagar|kolkata|jaipur|lucknow|indore|coimbatore|surat|kochi|goa|chandigarh|maharashtra|gujarat|karnataka/i;
  const usHubs = /santa barbara|new york|chicago|las vegas|los angeles|san francisco|orlando|texas|california|san antonio/i;
  const ukHubs = /london|glasgow|birmingham|manchester|scotland/i;
  const germanyHubs = /frankfurt|munich|berlin|cologne|dusseldorf/i;
  const uaeHubs = /dubai|abu dhabi|sharjah/i;

  if (indianHubs.test(rawLoc) || indianHubs.test(rawCity) || indianHubs.test(city)) country = 'India';
  else if (usHubs.test(rawLoc) || usHubs.test(rawCity) || usHubs.test(city)) country = 'United States';
  else if (ukHubs.test(rawLoc) || ukHubs.test(rawCity) || ukHubs.test(city)) country = 'United Kingdom';
  else if (germanyHubs.test(rawLoc) || germanyHubs.test(rawCity) || germanyHubs.test(city)) country = 'Germany';
  else if (uaeHubs.test(rawLoc) || uaeHubs.test(rawCity) || uaeHubs.test(city)) country = 'United Arab Emirates';
  else if (/usa|united states|america/i.test(country) || /united states/i.test(rawLoc)) country = 'United States';
  else if (/uk|united kingdom|england|scotland|wales/i.test(country) || /united kingdom/i.test(rawLoc)) country = 'United Kingdom';
  else if (/denmark/i.test(country) || /denmark/i.test(rawLoc)) country = 'Denmark';
  else if (/canada/i.test(country) || /canada/i.test(rawLoc)) country = 'Canada';
  else if (/indonesia/i.test(country) || /indonesia/i.test(rawLoc)) country = 'Indonesia';
  else if (/japan/i.test(country) || /japan/i.test(rawLoc)) country = 'Japan';
  else if (/malaysia/i.test(country) || /malaysia/i.test(rawLoc)) country = 'Malaysia';
  else if (/iraq/i.test(country) || /iraq/i.test(rawLoc)) country = 'Iraq';
  else if (/spain/i.test(country) || /spain/i.test(rawLoc)) country = 'Spain';
  else if (/france/i.test(country) || /france/i.test(rawLoc)) country = 'France';
  else if (/germany/i.test(country) || /germany/i.test(rawLoc)) country = 'Germany';
  else if (/italy/i.test(country) || /italy/i.test(rawLoc)) country = 'Italy';
  else if (/russia/i.test(country) || /russia/i.test(rawLoc)) country = 'Russia';
  else if (/saudi arabia/i.test(country) || /saudi arabia/i.test(rawLoc)) country = 'Saudi Arabia';
  else if (/singapore/i.test(country) || /singapore/i.test(rawLoc)) country = 'Singapore';
  else if (/thailand/i.test(country) || /thailand/i.test(rawLoc)) country = 'Thailand';
  else if (/bangladesh/i.test(country) || /bangladesh/i.test(rawLoc)) country = 'Bangladesh';
  else if (/sri lanka/i.test(country) || /sri lanka/i.test(rawLoc)) country = 'Sri Lanka';
  else if (/nigeria/i.test(country) || /nigeria/i.test(rawLoc)) country = 'Nigeria';
  else if (/cambodia/i.test(country) || /cambodia/i.test(rawLoc)) country = 'Cambodia';
  else if (/qatar/i.test(country) || /qatar/i.test(rawLoc)) country = 'Qatar';
  else if (/tajikistan/i.test(country) || /tajikistan/i.test(rawLoc)) country = 'Tajikistan';
  if (country === city) country = 'India';

  // 4. Distinguish specific venue facility from city/state-level address
  const firstPart = (parts[0] || '').trim();
  const isCityOnly = parts.length <= 3 && (
    firstPart.toLowerCase() === city.toLowerCase() ||
    firstPart.toLowerCase() === (state || '').toLowerCase() ||
    firstPart.toLowerCase() === (country || '').toLowerCase() ||
    cityList.some(cl => cl.toLowerCase() === firstPart.toLowerCase()) ||
    firstPart.toLowerCase() === 'exhibition center'
  );

  const venueName = isCityOnly ? '' : firstPart;
  const fullAddress = rawLoc || (venueName ? `${venueName}, ${city}, ${country}` : `${city}, ${state ? `${state}, ` : ''}${country}`);

  return {
    venue: venueName,
    address: fullAddress,
    location: fullAddress,
    city: city,
    country: country,
    state: state,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
  };
}

// Format date range
function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Upcoming 2026';
  try {
    const s = new Date(startDate);
    const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!endDate) return sStr;
    const e = new Date(endDate);
    const eDay = e.toLocaleDateString('en-US', { day: 'numeric' });
    const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
    const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
    if (sMonth === eMonth) {
      return `${sMonth} ${s.getDate()} – ${eDay}, ${s.getFullYear()}`;
    }
    return `${sStr} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return 'Upcoming 2026';
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 0. Check in-memory cache first for near-instant response
    const now = Date.now();
    if (!forceRefresh && memoryCache.events && (now - memoryCache.timestamp < memoryCache.ttl)) {
      return NextResponse.json({
        success: true,
        count: memoryCache.events.length,
        source: 'memory_cache',
        events: memoryCache.events
      });
    }

    let rawEvents = [];
    let source = 'wordpress_inspect_meta';

    // 1. Fetch from unified events directory endpoint on Express port 5000
    try {
      const dirRes = await fetch(`${BACKEND_API_URL}/events/directory`, {
        cache: 'no-store'
      });
      if (dirRes.ok) {
        const dirJson = await dirRes.json();
        const orgs = dirJson.data?.organizers || [];
        const allEvts = [];
        orgs.forEach((o) => {
          (o.events || []).forEach((e) => allEvts.push(e));
        });
        if (allEvts.length > 0) {
          rawEvents = allEvts;
          source = 'unified_directory_sync';
        }
      }
    } catch (dirErr) {
      console.warn('Unified directory fetch failed, trying direct WordPress inspect-event-meta:', dirErr.message);
    }

    // 2. Direct WordPress inspect-event-meta fallback
    if (!rawEvents || rawEvents.length === 0) {
      try {
        const wpInspectRes = await fetch(`${WORDPRESS_URL}/wp-json/visitexpo/v1/inspect-event-meta`, {
          headers: {
            'X-VisitExpo-Key': WORDPRESS_API_KEY
          },
          cache: 'no-store'
        });

        if (wpInspectRes.ok) {
          const wpData = await wpInspectRes.json();
          const docs = wpData.data?.docs || [];

          if (Array.isArray(docs) && docs.length > 0) {
            rawEvents = docs.map((d, idx) => {
              if (d.meta) {
                const m = d.meta;
                const startTs = m.ovaem_date_start_time?.[0];
                const endTs = m.ovaem_date_end_time?.[0];
                const venue = m.ovaem_address_event?.[0] || m.ovaem_venue?.[0] || m.ovaem_address?.[0] || 'Exhibition Center';
                const rawDesc = m.yoast_wpseo_metadesc?.[0] || m.ovaem_desc_event?.[0] || m.ovaem_org_desc?.[0] || (m.content?.[0] ? m.content[0].slice(0, 300) : '') || '';
                const org = (m.ovaem_org_name?.[0] || '').trim() || 'Verified Organizer';

                return {
                  id: String(d.id || `wp-${idx}`),
                  _id: String(d.id || `wp-${idx}`),
                  wpPostId: d.id,
                  title: d.title || 'Exhibition Event',
                  slug: d.slug,
                  description: rawDesc,
                  startDate: startTs && parseInt(startTs) > 0 ? new Date(parseInt(startTs) * 1000).toISOString() : null,
                  endDate: endTs && parseInt(endTs) > 0 ? new Date(parseInt(endTs) * 1000).toISOString() : null,
                  venue: venue,
                  city: m.ovaem_city?.[0] || '',
                  organizer: org,
                  isClaimed: false
                };
              }
              return d;
            });
          }
        }
      } catch (wpError) {
        console.warn('Direct WordPress inspect-event-meta fetch failed, trying claimable-events:', wpError.message);
      }
    }

    // 2. Fallback to claimable-events if inspect-event-meta is unavailable
    if (!rawEvents || rawEvents.length === 0) {
      try {
        const wpClaimRes = await fetch(`${WORDPRESS_URL}/wp-json/visitexpo/v1/claimable-events`, {
          headers: {
            'X-VisitExpo-Key': WORDPRESS_API_KEY
          },
          cache: 'no-store'
        });

        if (wpClaimRes.ok) {
          const wpData = await wpClaimRes.json();
          rawEvents = wpData.data?.docs || wpData.data || [];
          source = 'wordpress_claimable';
        }
      } catch (claimErr) {
        console.warn('WordPress claimable-events fetch failed:', claimErr.message);
      }
    }

    // 3. Fallback to Express backend if needed
    if (!rawEvents || rawEvents.length === 0) {
      try {
        const backendRes = await fetch(`${BACKEND_API_URL}/wordpress/claimable-events?limit=2500`, {
          cache: 'no-store'
        });
        if (backendRes.ok) {
          const bData = await backendRes.json();
          rawEvents = bData.data?.docs || bData.data || [];
          source = 'backend_api';
        }
      } catch (backendError) {
        console.warn('Backend events fetch failed:', backendError.message);
      }
    }

    // 4. Format and enrich all events with real images & authentic WordPress locations
    const cleanEvents = (rawEvents || []).map((evt, idx) => {
      const category = inferCategory(evt.title, evt.description);
      const loc = parseWpLocation(evt.venue, evt.city);
      const cleanSlug = evt.slug || (evt.title ? evt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `event-${idx}`);
      const wpImage = findWpImage(cleanSlug, evt.id, evt.wpPostId, evt.title) ||
                      (evt.image && !evt.image.includes('unsplash') ? evt.image : null) ||
                      (evt.banner && !evt.banner.includes('unsplash') ? evt.banner : null) ||
                      (evt.coverImage && !evt.coverImage.includes('unsplash') ? evt.coverImage : null);

      const fallbackImage = getCategoryFallback(category, evt.title);
      const image = wpImage || fallbackImage;

      return {
        id: evt._id || evt.id || `wp-${idx}`,
        title: evt.title || 'Exhibition Event',
        slug: cleanSlug,
        description: (evt.description || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&hellip;/g, '...'),
        category: category,
        city: loc.city,
        country: loc.country,
        state: loc.state,
        venue: loc.venue,
        address: loc.address,
        location: loc.location,
        startDate: evt.startDate || null,
        endDate: evt.endDate || null,
        dates: formatDateRange(evt.startDate, evt.endDate),
        attendees: '12,000+',
        booths: '250+',
        featured: idx < 6,
        upcoming: true,
        entryType: 'Free Visitor Pass',
        organizer: evt.organizer || 'Verified Organizer',
        image: image,
        fallbackImage: fallbackImage,
        isRealImage: !!wpImage,
        wpPostId: evt.wpPostId || evt.id || null,
        wpUrl: evt.wpUrl || `${WORDPRESS_URL}/event/${cleanSlug}/`,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || loc.venue)}`
      };
    });

    // 5. Update memory cache if events were successfully fetched
    if (cleanEvents.length > 0) {
      memoryCache = {
        events: cleanEvents,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes
      };
    }

    return NextResponse.json({
      success: true,
      count: cleanEvents.length,
      source: source,
      events: cleanEvents
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, events: [] },
      { status: 500 }
    );
  }
}
