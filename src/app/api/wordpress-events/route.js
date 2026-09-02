import { NextResponse } from 'next/server';

const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://visitexpo.in';
const WORDPRESS_API_KEY = process.env.WORDPRESS_API_KEY || 'visitexpo_custom_secret_key_12345';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper: Infer industry category from title and description
function inferCategory(title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('auto') || text.includes('vehicle') || text.includes('ev') || text.includes('mobility') || text.includes('motor')) return 'Automotive & EV';
  if (text.includes('airport') || text.includes('aviation') || text.includes('rotorcraft') || text.includes('air') || text.includes('aerospace')) return 'Aerospace & Aviation';
  if (text.includes('cargo') || text.includes('logistics') || text.includes('freight') || text.includes('transport') || text.includes('supply chain')) return 'Logistics & Cargo';
  if (text.includes('health') || text.includes('med') || text.includes('cancer') || text.includes('doctor') || text.includes('hospital') || text.includes('surgical')) return 'Healthcare & Pharma';
  if (text.includes('build') || text.includes('construction') || text.includes('cement') || text.includes('concrete') || text.includes('infrastructure') || text.includes('municipal')) return 'Construction & Infra';
  if (text.includes('tech') || text.includes('ai') || text.includes('software') || text.includes('cyber') || text.includes('iot') || text.includes('cloud') || text.includes('digital') || text.includes('engineer')) return 'Technology & AI';
  if (text.includes('textile') || text.includes('garment') || text.includes('fabric') || text.includes('yarn') || text.includes('fashion') || text.includes('apparel') || text.includes('dye')) return 'Textile & Fashion';
  if (text.includes('rice') || text.includes('food') || text.includes('agriculture') || text.includes('bakery') || text.includes('crop') || text.includes('biofuel') || text.includes('grain')) return 'Agri & Food Tech';
  if (text.includes('art') || text.includes('jewel') || text.includes('lifestyle') || text.includes('photo') || text.includes('handicraft')) return 'Art & Lifestyle';
  return 'Trade & Industry';
}

// Category image pool
const CATEGORY_IMAGES = {
  'Automotive & EV': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop',
  'Aerospace & Aviation': 'https://images.unsplash.com/photo-1517976487588-468a356cb0b7?q=80&w=800&auto=format&fit=crop',
  'Logistics & Cargo': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop',
  'Healthcare & Pharma': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop',
  'Construction & Infra': 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?q=80&w=800&auto=format&fit=crop',
  'Technology & AI': 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
  'Textile & Fashion': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop',
  'Agri & Food Tech': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop',
  'Art & Lifestyle': 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=800&auto=format&fit=crop',
  'Trade & Industry': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop'
};

// Helper: Extract clean city from venue/city string
function extractCity(venue = '', city = '') {
  const combined = `${venue} ${city}`;
  if (combined.includes('New Delhi') || combined.includes('Pragati Maidan') || combined.includes('Bharat Mandapam') || combined.includes('Dwarka')) return 'New Delhi';
  if (combined.includes('Greater Noida') || combined.includes('India Expo')) return 'Greater Noida';
  if (combined.includes('Mumbai') || combined.includes('BKC') || combined.includes('NESCO') || combined.includes('Jio')) return 'Mumbai';
  if (combined.includes('Bengaluru') || combined.includes('BIEC')) return 'Bengaluru';
  if (combined.includes('Chennai') || combined.includes('IIT Madras') || combined.includes('Trade Centre')) return 'Chennai';
  if (combined.includes('Hyderabad') || combined.includes('HITEX')) return 'Hyderabad';
  if (combined.includes('Kolkata') || combined.includes('Biswa Bangla')) return 'Kolkata';
  if (combined.includes('Pune')) return 'Pune';
  if (combined.includes('Ahmedabad') || combined.includes('Gandhinagar')) return 'Ahmedabad';
  if (combined.includes('Dhaka') || combined.includes('Bangladesh')) return 'Dhaka';
  if (combined.includes('Colombo') || combined.includes('Sri Lanka') || combined.includes('BMICH')) return 'Colombo';
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
    // 1. Fetch directly from WordPress live REST API
    let rawEvents = [];
    let source = 'wordpress_direct';

    try {
      const wpRes = await fetch(`${WORDPRESS_URL}/wp-json/visitexpo/v1/claimable-events`, {
        headers: {
          'X-VisitExpo-Key': WORDPRESS_API_KEY
        },
        next: { revalidate: 60 } // Cache for 60s
      });

      if (wpRes.ok) {
        const wpData = await wpRes.json();
        rawEvents = wpData.data?.docs || wpData.data || [];
      }
    } catch (wpError) {
      console.warn('Direct WordPress fetch failed, trying backend fallback:', wpError.message);
    }

    // 2. Fallback to Express backend if needed
    if (!rawEvents || rawEvents.length === 0) {
      try {
        const backendRes = await fetch(`${BACKEND_API_URL}/wordpress/claimable-events?limit=100`, {
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

    // 3. Format and enrich events
    const cleanEvents = (rawEvents || []).map((evt, idx) => {
      const category = inferCategory(evt.title, evt.description);
      const cleanCity = extractCity(evt.venue, evt.city);
      const image = evt.coverImage || evt.image || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Trade & Industry'];

      return {
        id: evt._id || evt.id || `wp-${idx}`,
        title: evt.title || 'Exhibition Event',
        slug: evt.slug || '',
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
        organizer: 'Verified Organizer',
        image: image,
        wpPostId: evt.wpPostId || evt.id || null,
        wpUrl: evt.wpUrl || `${WORDPRESS_URL}/${evt.slug || ''}`
      };
    });

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
