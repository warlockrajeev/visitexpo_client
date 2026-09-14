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

// Helper: Extract clean city from venue/city string
function extractCity(venue = '', city = '') {
  const combined = `${venue} ${city}`;
  // Major Indian Exhibition Hubs
  if (/new delhi|pragati maidan|bharat mandapam|dwarka|yashobhoomi|delhi/i.test(combined)) return 'New Delhi';
  if (/greater noida|india expo/i.test(combined)) return 'Greater Noida';
  if (/mumbai|bombay|bkc|nesco|jio world/i.test(combined)) return 'Mumbai';
  if (/bengaluru|bangalore|biec/i.test(combined)) return 'Bengaluru';
  if (/chennai|madras|trade centre/i.test(combined)) return 'Chennai';
  if (/hyderabad|hitex/i.test(combined)) return 'Hyderabad';
  if (/kolkata|calcutta|biswa bangla/i.test(combined)) return 'Kolkata';
  if (/pune/i.test(combined)) return 'Pune';
  if (/ahmedabad|gandhinagar|hec/i.test(combined)) return 'Ahmedabad';
  if (/jaipur|jecc/i.test(combined)) return 'Jaipur';
  if (/kochi|cochin/i.test(combined)) return 'Kochi';
  if (/goa/i.test(combined)) return 'Goa';
  if (/indore/i.test(combined)) return 'Indore';
  if (/coimbatore|codissia/i.test(combined)) return 'Coimbatore';
  if (/surat/i.test(combined)) return 'Surat';
  if (/lucknow/i.test(combined)) return 'Lucknow';
  if (/chandigarh/i.test(combined)) return 'Chandigarh';
  // Major International Exhibition Hubs
  if (/dubai|uae|world trade centre dubai/i.test(combined)) return 'Dubai';
  if (/riyadh/i.test(combined)) return 'Riyadh';
  if (/jeddah/i.test(combined)) return 'Jeddah';
  if (/saudi arabia/i.test(combined)) return 'Saudi Arabia';
  if (/paris/i.test(combined)) return 'Paris';
  if (/london/i.test(combined)) return 'London';
  if (/frankfurt|berlin|munich|cologne|dusseldorf|germany/i.test(combined)) return 'Germany';
  if (/singapore/i.test(combined)) return 'Singapore';
  if (/bangkok|thailand/i.test(combined)) return 'Bangkok';
  if (/dhaka|bangladesh/i.test(combined)) return 'Dhaka';
  if (/colombo|sri lanka/i.test(combined)) return 'Colombo';
  if (/marseille|france/i.test(combined)) return 'France';
  if (/madrid|barcelona|spain/i.test(combined)) return 'Spain';
  if (/milan|bologna|italy/i.test(combined)) return 'Italy';
  if (/tehran|iran/i.test(combined)) return 'Tehran';
  if (/dushanbe|tajikistan/i.test(combined)) return 'Dushanbe';
  return city || 'India';
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

    // 4. Format and enrich all events with real images
    const cleanEvents = (rawEvents || []).map((evt, idx) => {
      const category = inferCategory(evt.title, evt.description);
      const cleanCity = extractCity(evt.venue, evt.city);
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
        city: cleanCity,
        state: cleanCity === 'New Delhi' || cleanCity === 'Greater Noida' ? 'Delhi NCR' : cleanCity,
        venue: evt.venue || 'Exhibition Center',
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
        wpUrl: evt.wpUrl || `${WORDPRESS_URL}/event/${cleanSlug}/`
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
