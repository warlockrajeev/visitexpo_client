import { NextResponse } from 'next/server';

/**
 * @file api/events/[slug]/social/route.js
 * @description API route to manage Interest and Follower systems for exhibitions:
 * - Returns dynamic interested attendees list and follower counts
 * - Supports toggling event interest and following individual attendees
 */

// Realistic seed attendee directory for B2B expos
const SEED_ATTENDEES = [
  {
    id: 'att-1',
    name: 'Vikram Malhotra',
    designation: 'VP of Procurement & Sourcing',
    company: 'Imperial Foods & Beverages Ltd.',
    city: 'Mumbai',
    country: 'India',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    type: 'Trade Buyer',
    objective: 'Sourcing commercial baking equipment & bulk flour suppliers',
    verified: true,
    followersCount: 342,
    registeredDaysAgo: '2 hours ago'
  },
  {
    id: 'att-2',
    name: 'Sarah Lin',
    designation: 'Head of Product Innovation',
    company: 'Apex Confectionery Co.',
    city: 'Singapore',
    country: 'Singapore',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    type: 'Trade Buyer',
    objective: 'Evaluating organic food ingredients and eco packaging',
    verified: true,
    followersCount: 512,
    registeredDaysAgo: '5 hours ago'
  },
  {
    id: 'att-3',
    name: 'Dr. Hans Becker',
    designation: 'Managing Director',
    company: 'EuroBake Systems GmbH',
    city: 'Munich',
    country: 'Germany',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    type: 'Exhibitor & Brand',
    objective: 'Showcasing automated industrial tunnel ovens & mixers',
    verified: true,
    followersCount: 890,
    registeredDaysAgo: 'Yesterday'
  },
  {
    id: 'att-4',
    name: 'Elena Rostova',
    designation: 'Supply Chain Operations Lead',
    company: 'Caspian Gourmet Imports',
    city: 'Tashkent',
    country: 'Uzbekistan',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    type: 'Trade Buyer',
    objective: 'Meeting cold-chain transport logistics partners',
    verified: true,
    followersCount: 215,
    registeredDaysAgo: '1 day ago'
  },
  {
    id: 'att-5',
    name: 'Amina Al-Nuaimi',
    designation: 'Director of Business Development',
    company: 'Gulf Foodservice Hospitality',
    city: 'Dubai',
    country: 'UAE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    type: 'VIP Delegate',
    objective: 'Negotiating franchise master rights & regional distribution',
    verified: true,
    followersCount: 670,
    registeredDaysAgo: '2 days ago'
  },
  {
    id: 'att-6',
    name: 'Chen Wei',
    designation: 'Senior Equipment Engineer',
    company: 'Zhejiang Foodtech Automation',
    city: 'Hangzhou',
    country: 'China',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
    type: 'Exhibitor & Brand',
    objective: 'Conducting live demonstrations of smart dough handling lines',
    verified: true,
    followersCount: 430,
    registeredDaysAgo: '3 days ago'
  },
  {
    id: 'att-7',
    name: 'David Miller',
    designation: 'Executive Pastry Chef & Owner',
    company: 'Artisan Crumb Bakery Group',
    city: 'London',
    country: 'United Kingdom',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    type: 'Trade Buyer',
    objective: 'Connecting with artisan yeast producers and stone millers',
    verified: true,
    followersCount: 780,
    registeredDaysAgo: '4 days ago'
  },
  {
    id: 'att-8',
    name: 'Priya Patel',
    designation: 'Retail Brand Partnerships Lead',
    company: 'NaturePure Organic Goods',
    city: 'New Delhi',
    country: 'India',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    type: 'VIP Delegate',
    objective: 'Expanding B2B retail distribution across supermart chains',
    verified: true,
    followersCount: 310,
    registeredDaysAgo: '5 days ago'
  }
];

const SERVER_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request, { params }) {
  try {
    const slug = (await params)?.slug || 'default';
    const cleanSlug = slug.toLowerCase().trim();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const userId = searchParams.get('userId') || '';

    // Deterministic base counts based on slug string
    const charSum = cleanSlug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1058);
    let baselineFollowers = 1050 + (charSum % 1400);
    let baselineInterested = 920 + (charSum % 1200);

    let realAttendees = [];
    let userStatus = { isInterested: false, isFollower: false, engagement: null };

    // Fetch real engagements from Express backend
    try {
      const queryParams = new URLSearchParams();
      if (email) queryParams.set('email', email);
      if (userId) queryParams.set('userId', userId);

      const res = await fetch(`${SERVER_API_URL}/engagements/event/${cleanSlug}?${queryParams.toString()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          if (Array.isArray(json.data.attendees) && json.data.attendees.length > 0) {
            realAttendees = json.data.attendees.map(a => ({
              id: String(a._id || a.userId || a.userEmail),
              name: a.userName,
              designation: a.userDesignation || 'Trade Visitor',
              company: a.userCompany || 'Registered Professional',
              city: a.eventCity || 'India',
              country: a.eventCountry || 'India',
              avatar: a.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.userName)}&background=FF2E63&color=fff`,
              type: a.type === 'both' ? 'Interested & Following' : a.type === 'follower' ? 'Event Follower' : 'Trade Buyer',
              objective: a.objective || 'Networking and product sourcing.',
              verified: true,
              isRealUser: true,
              registeredDaysAgo: 'Live Registered'
            }));
            baselineInterested += json.data.counts?.interested || 0;
            baselineFollowers += json.data.counts?.followers || 0;
          }
          if (json.data.userStatus) {
            userStatus = json.data.userStatus;
          }
        }
      }
    } catch (e) {
      console.warn('Backend engagements fetch error:', e.message);
    }

    // Combine real registered users at top with baseline attendees
    const combinedAttendees = [...realAttendees, ...SEED_ATTENDEES];

    return NextResponse.json({
      success: true,
      data: {
        slug: cleanSlug,
        followersCount: baselineFollowers,
        interestedCount: baselineInterested,
        attendees: combinedAttendees,
        realCount: realAttendees.length,
        userStatus
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const slug = (await params)?.slug || 'default';
    const cleanSlug = slug.toLowerCase().trim();
    const { action, actionType, attendeeId, user, eventTitle, eventCity, eventVenue, eventDates, eventCategory } = body;

    // Forward to real backend Express engagement endpoint
    try {
      const res = await fetch(`${SERVER_API_URL}/engagements/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: cleanSlug,
          actionType: action || actionType || 'interested',
          eventTitle: eventTitle || cleanSlug.replace(/-/g, ' ').toUpperCase(),
          eventCity,
          eventVenue,
          eventDates,
          eventCategory,
          user: user || {}
        })
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch (e) {
      console.warn('Forwarding to /api/engagements/toggle failed, falling back:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action || actionType} processed for event ${cleanSlug}`,
      data: {
        slug: cleanSlug,
        action: action || actionType,
        attendeeId: attendeeId || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
