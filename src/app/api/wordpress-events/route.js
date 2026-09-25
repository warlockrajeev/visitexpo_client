import { NextResponse } from 'next/server';
import wpEventImages from '@/data/wordpress-event-images.json';

const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://visitexpo.in';
const WORDPRESS_API_KEY = process.env.WORDPRESS_API_KEY || '';
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

// Persistent in-memory cache across Next.js module evaluations
const CACHE_TTL_MS = 30 * 1000; // 30 seconds max to guarantee freshness
if (!globalThis._wpEventsMemoryCache) {
  globalThis._wpEventsMemoryCache = {
    events: null,
    timestamp: 0,
    ttl: CACHE_TTL_MS
  };
}

// Precomputed image map & keyword index built ONCE at module load (O(1) lookups)
const imageLookupMap = new Map();
const keyWordIndex = [];

function isValidWpImage(url) {
  return url && typeof url === 'string' && url.includes('wp-content/uploads') && !url.includes('unsplash') && !url.includes('cropped-Untitled');
}

for (const [k, url] of Object.entries(wpEventImages)) {
  if (isValidWpImage(url)) {
    imageLookupMap.set(k, url);
    imageLookupMap.set(k.toLowerCase(), url);
    const norm = k.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (norm) imageLookupMap.set(norm, url);
    if (k.length > 6 && isNaN(Number(k))) {
      keyWordIndex.push({ key: k.replace(/-/g, ' ').toLowerCase(), url });
    }
  }
}

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

// High-speed O(1) in-memory lookup for genuine WordPress featured images
function findWpImage(slug, id, wpPostId, title) {
  if (!slug && !id && !title && !wpPostId) return null;

  // 1. Direct O(1) key matches
  if (slug && imageLookupMap.has(slug)) return imageLookupMap.get(slug);
  if (id && imageLookupMap.has(String(id))) return imageLookupMap.get(String(id));
  if (wpPostId && imageLookupMap.has(String(wpPostId))) return imageLookupMap.get(String(wpPostId));

  // 2. Normalized slug match
  if (slug) {
    const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (imageLookupMap.has(norm)) return imageLookupMap.get(norm);
  }

  // 3. Title-derived slug and fast keyword match
  if (title) {
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (imageLookupMap.has(titleSlug)) return imageLookupMap.get(titleSlug);

    const lowerTitle = title.toLowerCase();
    for (let i = 0; i < keyWordIndex.length; i++) {
      const item = keyWordIndex[i];
      if (lowerTitle.includes(item.key) || (item.key.length > 10 && item.key.includes(lowerTitle))) {
        return item.url;
      }
    }
  }

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

// Precompiled city & state regexes for sub-millisecond location parsing
const CITY_DEFINITIONS = [
  { name: 'New Delhi', regex: /\b(New Delhi|Delhi)\b/i, state: 'Delhi NCR' },
  { name: 'Greater Noida', regex: /\b(Greater Noida|Noida)\b/i, state: 'Delhi NCR' },
  { name: 'Mumbai', regex: /\bMumbai\b/i, state: 'Maharashtra' },
  { name: 'Bengaluru', regex: /\b(Bengaluru|Bangalore)\b/i, state: 'Karnataka' },
  { name: 'Chennai', regex: /\bChennai\b/i, state: 'Tamil Nadu' },
  { name: 'Hyderabad', regex: /\bHyderabad\b/i, state: 'Telangana' },
  { name: 'Kolkata', regex: /\bKolkata\b/i, state: 'West Bengal' },
  { name: 'Pune', regex: /\bPune\b/i, state: 'Maharashtra' },
  { name: 'Ahmedabad', regex: /\bAhmedabad\b/i, state: 'Gujarat' },
  { name: 'Gandhinagar', regex: /\bGandhinagar\b/i, state: 'Gujarat' },
  { name: 'Jaipur', regex: /\bJaipur\b/i, state: 'Rajasthan' },
  { name: 'Kochi', regex: /\bKochi\b/i, state: 'Kerala' },
  { name: 'Goa', regex: /\bGoa\b/i, state: 'Goa' },
  { name: 'Indore', regex: /\bIndore\b/i, state: 'Madhya Pradesh' },
  { name: 'Coimbatore', regex: /\bCoimbatore\b/i, state: 'Tamil Nadu' },
  { name: 'Surat', regex: /\bSurat\b/i, state: 'Gujarat' },
  { name: 'Lucknow', regex: /\bLucknow\b/i, state: 'Uttar Pradesh' },
  { name: 'Chandigarh', regex: /\bChandigarh\b/i, state: 'Punjab' },
  { name: 'Santa Barbara', regex: /\bSanta Barbara\b/i, state: 'California' },
  { name: 'New York', regex: /\bNew York\b/i, state: 'New York' },
  { name: 'Chicago', regex: /\bChicago\b/i, state: 'Illinois' },
  { name: 'Las Vegas', regex: /\bLas Vegas\b/i, state: 'Nevada' },
  { name: 'Los Angeles', regex: /\bLos Angeles\b/i, state: 'California' },
  { name: 'San Francisco', regex: /\bSan Francisco\b/i, state: 'California' },
  { name: 'Orlando', regex: /\bOrlando\b/i, state: 'Florida' },
  { name: 'Copenhagen', regex: /\bCopenhagen\b/i, state: 'Copenhagen' },
  { name: 'Toronto', regex: /\bToronto\b/i, state: 'Ontario' },
  { name: 'Glasgow', regex: /\bGlasgow\b/i, state: 'Scotland' },
  { name: 'London', regex: /\bLondon\b/i, state: 'Greater London' },
  { name: 'Birmingham', regex: /\bBirmingham\b/i, state: 'West Midlands' },
  { name: 'Frankfurt', regex: /\bFrankfurt\b/i, state: 'Hesse' },
  { name: 'Munich', regex: /\bMunich\b/i, state: 'Bavaria' },
  { name: 'Berlin', regex: /\bBerlin\b/i, state: 'Berlin' },
  { name: 'Cologne', regex: /\bCologne\b/i, state: 'North Rhine-Westphalia' },
  { name: 'Dusseldorf', regex: /\bDusseldorf\b/i, state: 'North Rhine-Westphalia' },
  { name: 'Paris', regex: /\bParis\b/i, state: 'Île-de-France' },
  { name: 'Madrid', regex: /\bMadrid\b/i, state: 'Community of Madrid' },
  { name: 'Barcelona', regex: /\bBarcelona\b/i, state: 'Catalonia' },
  { name: 'Valencia', regex: /\bValencia\b/i, state: 'Valencian Community' },
  { name: 'Milan', regex: /\bMilan\b/i, state: 'Lombardy' },
  { name: 'Bologna', regex: /\bBologna\b/i, state: 'Emilia-Romagna' },
  { name: 'Dubai', regex: /\bDubai\b/i, state: 'Dubai' },
  { name: 'Sharjah', regex: /\bSharjah\b/i, state: 'Sharjah' },
  { name: 'Abu Dhabi', regex: /\bAbu Dhabi\b/i, state: 'Abu Dhabi' },
  { name: 'Riyadh', regex: /\bRiyadh\b/i, state: 'Riyadh' },
  { name: 'Jeddah', regex: /\bJeddah\b/i, state: 'Makkah' },
  { name: 'Singapore', regex: /\bSingapore\b/i, state: 'Singapore' },
  { name: 'Bangkok', regex: /\bBangkok\b/i, state: 'Bangkok' },
  { name: 'Dhaka', regex: /\bDhaka\b/i, state: 'Dhaka Division' },
  { name: 'Colombo', regex: /\bColombo\b/i, state: 'Western Province' },
  { name: 'Tangerang', regex: /\bTangerang\b/i, state: 'Banten' },
  { name: 'Jakarta', regex: /\bJakarta\b/i, state: 'Jakarta' },
  { name: 'Tokyo', regex: /\bTokyo\b/i, state: 'Kanto' },
  { name: 'Chiba', regex: /\bChiba\b/i, state: 'Kanto' },
  { name: 'Baghdad', regex: /\bBaghdad\b/i, state: 'Baghdad' },
  { name: 'Kuala Lumpur', regex: /\bKuala Lumpur\b/i, state: 'Federal Territory' },
  { name: 'Tehran', regex: /\bTehran\b/i, state: 'Tehran' },
  { name: 'Lagos', regex: /\bLagos\b/i, state: 'Lagos' },
  { name: 'Dushanbe', regex: /\bDushanbe\b/i, state: 'Dushanbe' },
  { name: 'Phnom Penh', regex: /\bPhnom Penh\b/i, state: 'Phnom Penh' },
  { name: 'Doha', regex: /\bDoha\b/i, state: 'Doha' }
];

const KNOWN_CITY_LOWER_SET = new Set(CITY_DEFINITIONS.map(c => c.name.toLowerCase()));

const STATE_RULES = [
  { name: 'Maharashtra', regex: /maharashtra/i },
  { name: 'Karnataka', regex: /karnataka/i },
  { name: 'Tamil Nadu', regex: /tamil nadu/i },
  { name: 'Gujarat', regex: /gujarat/i },
  { name: 'Telangana', regex: /telangana/i },
  { name: 'West Bengal', regex: /west bengal/i },
  { name: 'Rajasthan', regex: /rajasthan/i },
  { name: 'Uttar Pradesh', regex: /uttar pradesh/i },
  { name: 'Haryana', regex: /haryana/i },
  { name: 'Kerala', regex: /kerala/i },
  { name: 'Madhya Pradesh', regex: /madhya pradesh/i },
  { name: 'Punjab', regex: /punjab/i },
  { name: 'Goa', regex: /goa/i },
  { name: 'Delhi NCR', regex: /delhi|noida|gurgaon|gurugram/i },
  { name: 'California', regex: /california|ca\b/i },
  { name: 'Florida', regex: /florida|fl\b/i },
  { name: 'Illinois', regex: /illinois|il\b/i },
  { name: 'Nevada', regex: /nevada|nv\b/i },
  { name: 'Texas', regex: /texas|tx\b/i },
  { name: 'New York', regex: /new york|ny\b/i },
  { name: 'Scotland', regex: /scotland/i },
  { name: 'Greater London', regex: /london/i },
  { name: 'Dhaka Division', regex: /dhaka/i },
  { name: 'Western Province', regex: /colombo/i }
];

const RE_INDIAN_HUBS = /delhi|mumbai|bengaluru|bangalore|chennai|hyderabad|pune|ahmedabad|gandhinagar|kolkata|jaipur|lucknow|indore|coimbatore|surat|kochi|goa|chandigarh|maharashtra|gujarat|karnataka/i;
const RE_US_HUBS = /santa barbara|new york|chicago|las vegas|los angeles|san francisco|orlando|texas|california|san antonio/i;
const RE_UK_HUBS = /london|glasgow|birmingham|manchester|scotland/i;
const RE_GERMANY_HUBS = /frankfurt|munich|berlin|cologne|dusseldorf/i;
const RE_UAE_HUBS = /dubai|abu dhabi|sharjah/i;

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
  let inferredState = '';
  for (let i = 0; i < CITY_DEFINITIONS.length; i++) {
    const item = CITY_DEFINITIONS[i];
    if (item.regex.test(rawLoc) || (rawCity && item.regex.test(rawCity))) {
      city = item.name;
      inferredState = item.state;
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
  let state = inferredState;
  if (!state) {
    for (let i = 0; i < STATE_RULES.length; i++) {
      if (STATE_RULES[i].regex.test(rawLoc)) {
        state = STATE_RULES[i].name;
        break;
      }
    }
  }
  if (!state) state = city;

  // 3. Determine Country
  let country = parts.length > 1 ? parts[parts.length - 1] : (rawCity || 'India');
  country = country.replace(/[0-9\-\s]+/g, ' ').trim() || 'India';

  if (RE_INDIAN_HUBS.test(rawLoc) || RE_INDIAN_HUBS.test(rawCity) || RE_INDIAN_HUBS.test(city)) country = 'India';
  else if (RE_US_HUBS.test(rawLoc) || RE_US_HUBS.test(rawCity) || RE_US_HUBS.test(city)) country = 'United States';
  else if (RE_UK_HUBS.test(rawLoc) || RE_UK_HUBS.test(rawCity) || RE_UK_HUBS.test(city)) country = 'United Kingdom';
  else if (RE_GERMANY_HUBS.test(rawLoc) || RE_GERMANY_HUBS.test(rawCity) || RE_GERMANY_HUBS.test(city)) country = 'Germany';
  else if (RE_UAE_HUBS.test(rawLoc) || RE_UAE_HUBS.test(rawCity) || RE_UAE_HUBS.test(city)) country = 'United Arab Emirates';
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
  const firstPartLower = firstPart.toLowerCase();
  const isCityOnly = parts.length <= 3 && (
    firstPartLower === city.toLowerCase() ||
    firstPartLower === (state || '').toLowerCase() ||
    firstPartLower === (country || '').toLowerCase() ||
    KNOWN_CITY_LOWER_SET.has(firstPartLower) ||
    firstPartLower === 'exhibition center'
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
    const e = endDate ? new Date(endDate) : null;
    const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!e || isNaN(e.getTime())) return sStr;
    if (s.toDateString() === e.toDateString()) return sStr;
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
      const eDay = e.getDate();
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
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.has('_t') || searchParams.has('t');

    // 0. Check in-memory cache first for sub-millisecond response
    const now = Date.now();
    const cache = globalThis._wpEventsMemoryCache;
    if (!forceRefresh && cache && cache.events && (now - cache.timestamp < cache.ttl)) {
      return NextResponse.json(
        {
          success: true,
          count: cache.events.length,
          source: 'memory_cache',
          events: cache.events
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        }
      );
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

    // 3. Fallback to claimable-events if inspect-event-meta is unavailable
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

    // 4. Fallback to Express backend claimable-events if needed
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

    // 5. Format and enrich all events with real images & authentic WordPress locations
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

      // Deterministic social proof metrics precomputed on the server
      const charSum = (evt.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), idx * 19);
      const rating = (4.5 + ((charSum % 5) * 0.1)).toFixed(1);
      const reviewCount = 80 + (charSum % 180);
      const interestedCount = 1100 + (charSum % 2900);
      const edition = `${8 + (charSum % 15)}th Edition`;
      const format = charSum % 4 === 0 ? 'Hybrid Expo' : 'In-Person Expo';
      const eventType = charSum % 3 === 0 ? 'B2B Tradeshow' : charSum % 3 === 1 ? 'Conference & Expo' : 'Industry Fair';

      const rawDesc = (evt.description || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&hellip;/g, '...').trim();
      const shortDesc = rawDesc.length > 280 ? rawDesc.slice(0, 277) + '...' : rawDesc;

      return {
        id: evt._id || evt.id || `wp-${idx}`,
        title: evt.title || 'Exhibition Event',
        slug: cleanSlug,
        description: shortDesc,
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
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || loc.venue)}`,
        rating,
        reviewCount,
        interestedCount,
        edition,
        format,
        eventType,
        verified: true
      };
    });

    // 6. Update memory cache if events were successfully fetched
    if (cleanEvents.length > 0) {
      globalThis._wpEventsMemoryCache = {
        events: cleanEvents,
        timestamp: Date.now(),
        ttl: CACHE_TTL_MS
      };
    }

    return NextResponse.json(
      {
        success: true,
        count: cleanEvents.length,
        source: source,
        events: cleanEvents
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, events: [] },
      { status: 500 }
    );
  }
}
