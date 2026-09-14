import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://visitexpo.in';
const WORDPRESS_API_KEY = process.env.WORDPRESS_API_KEY || 've_wp_sync_secret_2026_secure';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Cache for single event details
const singleEventCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

let cachedWpDocs = null;
let cachedWpDocsTimestamp = 0;
const WP_DOCS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getWpDocs() {
  if (cachedWpDocs && (Date.now() - cachedWpDocsTimestamp < WP_DOCS_CACHE_TTL)) {
    return cachedWpDocs;
  }
  try {
    const wpRes = await fetch(`${WORDPRESS_URL}/wp-json/visitexpo/v1/inspect-event-meta`, {
      headers: { 'X-VisitExpo-Key': WORDPRESS_API_KEY },
      cache: 'no-store'
    });
    if (wpRes.ok) {
      const wpData = await wpRes.json();
      const docs = wpData.data?.docs || [];
      if (docs.length > 0) {
        cachedWpDocs = docs;
        cachedWpDocsTimestamp = Date.now();
        return docs;
      }
    }
  } catch (wpErr) {
    console.warn('WordPress inspect-event-meta fetch failed:', wpErr.message);
  }
  return cachedWpDocs || [];
}

function parsePhpSerializedArray(str) {
  if (!str || typeof str !== 'string') return [];
  const results = [];
  const regex = /s:\d+:"((?:\\.|[^"\\])*)";/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    results.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
  }
  return results;
}

function parsePhpSchedule(str) {
  if (!str || typeof str !== 'string') return [];
  const items = [];
  const parts = str.split(/i:\d+;a:\d+:\{/);
  for (const part of parts) {
    if (!part.trim()) continue;
    const nameMatch = part.match(/s:4:"name";s:\d+:"([^"]*)";/);
    const dateMatch = part.match(/s:4:"date";s:\d+:"([^"]*)";/);
    if (nameMatch || dateMatch) {
      items.push({
        name: nameMatch ? nameMatch[1] : 'Event Session',
        date: dateMatch ? dateMatch[1].trim() : ''
      });
    }
  }
  return items;
}

function parsePhpSponsors(str) {
  if (!str || typeof str !== 'string') return [];
  const items = [];
  const regex = /s:4:"link";s:\d+:"([^"]*)";s:4:"logo";s:\d+:"([^"]*)";/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const link = match[1];
    let name = '';
    if (link) {
      try {
        const u = new URL(link.startsWith('http') ? link : `https://${link}`);
        const host = u.hostname.replace(/^www\./, '').split('.')[0];
        if (host) {
          name = host.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      } catch {}
    }
    items.push({
      name: name || 'Corporate Sponsor Partner',
      link: match[1],
      logoId: match[2]
    });
  }
  return items;
}

function extractCity(venue = '', city = '') {
  const combined = `${venue} ${city}`;
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
  if (/dubai|uae|world trade centre dubai/i.test(combined)) return 'Dubai';
  if (/riyadh/i.test(combined)) return 'Riyadh';
  if (/paris/i.test(combined)) return 'Paris';
  if (/london/i.test(combined)) return 'London';
  if (/frankfurt|berlin|munich|germany/i.test(combined)) return 'Germany';
  if (/singapore/i.test(combined)) return 'Singapore';
  if (/bangkok|thailand/i.test(combined)) return 'Bangkok';
  return city || 'India';
}

function getStoredImage(slug, id, title) {
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/wordpress-event-images.json');
    if (fs.existsSync(jsonPath)) {
      const map = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (slug && map[slug]) return map[slug];
      if (id && map[String(id)]) return map[String(id)];
      if (title) {
        const tSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (map[tSlug]) return map[tSlug];
      }
    }
  } catch {}
  return null;
}

function persistImageMapping(slug, id, title, url) {
  if (!url) return;
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/wordpress-event-images.json');
    let map = {};
    if (fs.existsSync(jsonPath)) {
      map = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    let updated = false;
    if (slug && !map[slug]) { map[slug] = url; updated = true; }
    if (id && !map[String(id)]) { map[String(id)] = url; updated = true; }
    if (title) {
      const tSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!map[tSlug]) { map[tSlug] = url; updated = true; }
    }
    if (updated) {
      fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2), 'utf8');
      // Also update server copy
      const serverPath = path.resolve(process.cwd(), '../server/data/wordpress-event-images.json');
      if (fs.existsSync(serverPath)) {
        fs.writeFileSync(serverPath, JSON.stringify(map, null, 2), 'utf8');
      }
    }
  } catch {}
}

async function fetchRealWpImage(slug) {
  if (!slug) return null;
  try {
    const oembedUrl = `${WORDPRESS_URL}/wp-json/oembed/1.0/embed?url=${encodeURIComponent(`${WORDPRESS_URL}/event/${slug}/`)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail_url && typeof data.thumbnail_url === 'string') {
        return data.thumbnail_url.replace(/^http:/, 'https:');
      }
    }
  } catch {}

  // Fallback: fetch page HTML and match og:image
  try {
    const pageRes = await fetch(`${WORDPRESS_URL}/event/${slug}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (match && match[1] && match[1].includes('uploads')) {
        return match[1].replace(/^http:/, 'https:');
      }
    }
  } catch {}

  return null;
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    // 1. Check cache
    const cached = singleEventCache.get(cleanSlug);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    // 2. Try native MongoDB backend first
    try {
      const mongoRes = await fetch(`${BACKEND_API_URL}/events/${cleanSlug}`, {
        cache: 'no-store'
      });
      if (mongoRes.ok) {
        const mongoJson = await mongoRes.json();
        if (mongoJson.success && mongoJson.event) {
          const e = mongoJson.event;
          const formatted = {
            id: String(e._id || e.id),
            title: e.title,
            slug: e.slug,
            description: e.description,
            venue: e.venue,
            city: e.city,
            country: e.country || 'India',
            startDate: e.startDate,
            endDate: e.endDate,
            timings: e.timings || '9:00 AM – 6:00 PM',
            category: Array.isArray(e.categories) && e.categories[0] ? e.categories[0] : 'Trade & Industry',
            categories: e.categories || [],
            image: e.banner || (e.gallery && e.gallery[0]) || null,
            gallery: e.gallery || [],
            organizer: e.orgName || (e.organizer && e.organizer.name) || 'VisitExpo Verified Organizer',
            organizerWebsite: e.orgWebsite || (e.organizer && e.organizer.website) || '',
            organizerDesc: e.orgDesc || (e.organizer && e.organizer.description) || '',
            organizerEmail: e.orgEmail || (e.organizer && e.organizer.email) || '',
            organizerPhone: e.orgPhone || (e.organizer && e.organizer.phone) || '',
            isFreeEvent: e.isFreeEvent,
            paidTicketPrice: e.paidTicketPrice,
            schedules: e.schedules || [],
            faqs: (e.faqsList || []).map(f => ({ question: f.question, answer: f.answer })),
            sponsors: e.sponsorsList || [],
            speakers: e.speakers || [],
            exhibitors: e.exhibitors || [],
            status: e.status || 'published',
            isWordPress: false,
            isRealImage: !!(e.banner || (e.gallery && e.gallery[0]))
          };
          singleEventCache.set(cleanSlug, { data: formatted, timestamp: Date.now() });
          return NextResponse.json({ success: true, data: formatted });
        }
      }
    } catch (mErr) {
      // Proceed to WordPress lookup
    }

    // 3. WordPress Event Lookup via cached docs
    let wpDoc = null;
    try {
      const docs = await getWpDocs();
      wpDoc = docs.find(d => {
        const s = (d.slug || '').toLowerCase().trim();
        const id = String(d.id || '').trim();
        const tSlug = (d.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return s === cleanSlug || id === cleanSlug || tSlug === cleanSlug || (cleanSlug.length > 5 && (s.includes(cleanSlug) || cleanSlug.includes(s)));
      });
    } catch (wpErr) {
      console.warn('WordPress getWpDocs lookup failed:', wpErr.message);
    }

    if (wpDoc) {
      const m = wpDoc.meta || {};
      const startTs = m.ovaem_date_start_time?.[0];
      const endTs = m.ovaem_date_end_time?.[0];
      const venue = m.ovaem_address_event?.[0] || m.ovaem_venue?.[0] || m.ovaem_address?.[0] || 'International Exhibition Center';
      const cleanCity = extractCity(venue, m.ovaem_city?.[0]);
      
      const rawDesc = m.content?.[0] || m.yoast_wpseo_metadesc?.[0] || m.ovaem_desc_event?.[0] || m.ovaem_org_desc?.[0] || '';
      const cleanDesc = rawDesc
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&hellip;/g, '...')
        .replace(/&#8217;/g, "'")
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .trim();

      // Resolve real image
      let realImg = getStoredImage(wpDoc.slug, wpDoc.id, wpDoc.title);
      if (!realImg) {
        realImg = await fetchRealWpImage(wpDoc.slug);
        if (realImg) {
          persistImageMapping(wpDoc.slug, wpDoc.id, wpDoc.title, realImg);
        }
      }

      // Parse FAQs
      const rawFaqTitles = m.ovaem_faq_title?.[0];
      const rawFaqDescs = m.ovaem_faq_desc?.[0];
      const faqTitles = parsePhpSerializedArray(rawFaqTitles);
      const faqDescs = parsePhpSerializedArray(rawFaqDescs);
      const faqs = faqTitles.map((q, i) => ({
        question: q,
        answer: faqDescs[i] || ''
      })).filter(f => f.question && f.answer);

      // Parse Schedule
      const rawSchedule = m.ovaem_schedule_date?.[0];
      const schedules = parsePhpSchedule(rawSchedule);

      // Parse Sponsors
      const rawSponsors = m.ovaem_sponsor_info?.[0];
      const sponsors = parsePhpSponsors(rawSponsors);

      // Organizer details
      const orgName = (m.ovaem_org_name?.[0] || '').trim() || 'Verified Organizer';
      const orgWebsite = m.ovaem_org_website?.[0] || '';
      const orgDesc = m.ovaem_org_desc?.[0] || '';
      const orgEmail = m.ovaem_org_email?.[0] || '';
      const orgPhone = m.ovaem_org_phone?.[0] || '';

      const formatted = {
        id: String(wpDoc.id),
        wpPostId: String(wpDoc.id),
        title: wpDoc.title,
        slug: wpDoc.slug,
        description: cleanDesc,
        venue: venue,
        address: venue,
        city: cleanCity,
        country: venue.includes('United States') || venue.includes('USA') ? 'United States' :
                 venue.includes('Germany') ? 'Germany' :
                 venue.includes('France') ? 'France' :
                 venue.includes('UAE') || venue.includes('Dubai') ? 'United Arab Emirates' :
                 venue.includes('UK') || venue.includes('London') ? 'United Kingdom' : 'India',
        startDate: startTs && parseInt(startTs) > 0 ? new Date(parseInt(startTs) * 1000).toISOString() : null,
        endDate: endTs && parseInt(endTs) > 0 ? new Date(parseInt(endTs) * 1000).toISOString() : null,
        dates: startTs
          ? new Date(parseInt(startTs) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Upcoming 2026',
        timings: '9:00 AM – 5:00 PM (General Admission)',
        category: 'Trade Show',
        organizer: orgName,
        organizerWebsite: orgWebsite,
        organizerDesc: orgDesc,
        organizerEmail: orgEmail,
        organizerPhone: orgPhone,
        image: realImg,
        isRealImage: !!realImg,
        faqs: faqs,
        schedules: schedules,
        sponsors: sponsors,
        isWordPress: true,
        wpUrl: `https://visitexpo.in/event/${wpDoc.slug}/`
      };

      singleEventCache.set(cleanSlug, { data: formatted, timestamp: Date.now() });
      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching single event:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
