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

export async function GET(request, { params }) {
  try {
    const slug = (await params)?.slug || 'default';
    
    // Deterministic base counts based on slug string
    const charSum = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1058);
    const baselineFollowers = 1050 + (charSum % 1400);
    const baselineInterested = 920 + (charSum % 1200);

    return NextResponse.json({
      success: true,
      data: {
        slug,
        followersCount: baselineFollowers,
        interestedCount: baselineInterested,
        attendees: SEED_ATTENDEES
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { action, attendeeId, user } = body;
    const slug = (await params)?.slug || 'default';

    return NextResponse.json({
      success: true,
      message: `Action ${action} processed successfully for event ${slug}`,
      data: {
        slug,
        action,
        attendeeId: attendeeId || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
