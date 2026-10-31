import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVER_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

async function readBackendJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function GET(request, { params }) {
  const slug = (await params)?.slug?.toLowerCase().trim();
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Event slug is required.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const backendParams = new URLSearchParams();
  for (const key of ['email', 'userId']) {
    const value = searchParams.get(key);
    if (value) backendParams.set(key, value);
  }

  try {
    const response = await fetch(
      `${SERVER_API_URL}/engagements/event/${encodeURIComponent(slug)}?${backendParams.toString()}`,
      { cache: 'no-store' }
    );
    const result = await readBackendJson(response);
    if (!response.ok || !result?.success || !result?.data) {
      return NextResponse.json(
        { success: false, error: result?.error || result?.message || 'Could not load attendee records.' },
        { status: response.ok ? 502 : response.status }
      );
    }

    const attendees = (Array.isArray(result.data.attendees) ? result.data.attendees : [])
      .filter((attendee) => attendee.status === 'active' && (
        attendee.isInterested ||
        attendee.isFollowed ||
        ['interested', 'follower', 'both'].includes(attendee.type)
      ))
      .map((attendee) => {
        const name = attendee.userName || 'VisitExpo user';
        const isInterested = Boolean(attendee.isInterested || ['interested', 'both'].includes(attendee.type));
        const isFollowing = Boolean(attendee.isFollowed || ['follower', 'both'].includes(attendee.type));
        return {
          id: String(attendee._id || attendee.userId || attendee.userEmail),
          name,
          designation: attendee.userDesignation || '',
          company: attendee.userCompany || '',
          city: attendee.userCity || '',
          country: attendee.userCountry || '',
          avatar: attendee.userAvatar && !attendee.userAvatar.includes('ui-avatars.com')
            ? attendee.userAvatar
            : '',
          type: attendee.userRole === 'exhibitor'
            ? 'Exhibitor'
            : attendee.userRole === 'organizer'
              ? 'Organizer'
              : attendee.userRole === 'visitor'
                ? 'Visitor'
                : attendee.userRole || 'Platform user',
          isInterested,
          isFollowing,
          objective: attendee.objective === 'Networking, product discovery, and supplier sourcing.'
            ? ''
            : attendee.objective || '',
          verified: Boolean(attendee.isVerifiedUser),
          isRealUser: true,
          registeredDaysAgo: attendee.createdAt
            ? new Date(attendee.createdAt).toLocaleDateString()
            : ''
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        slug,
        followersCount: Number(result.data.counts?.followers) || 0,
        interestedCount: Number(result.data.counts?.interested) || 0,
        attendees,
        realCount: attendees.length,
        counts: {
          interested: Number(result.data.counts?.interested) || 0,
          followers: Number(result.data.counts?.followers) || 0
        },
        userStatus: result.data.userStatus || { isInterested: false, isFollower: false, engagement: null }
      }
    });
  } catch (error) {
    console.error('Could not fetch real event attendee records:', error);
    return NextResponse.json(
      { success: false, error: 'Attendee records are temporarily unavailable. Please try again.' },
      { status: 502 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const slug = (await params)?.slug?.toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Event slug is required.' }, { status: 400 });
    }

    const response = await fetch(`${SERVER_API_URL}/engagements/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventSlug: slug,
        actionType: body.action || body.actionType || 'interested',
        eventTitle: body.eventTitle || slug.replace(/-/g, ' ').toUpperCase(),
        eventId: body.eventId,
        eventCity: body.eventCity,
        eventCountry: body.eventCountry,
        eventVenue: body.eventVenue,
        eventDates: body.eventDates,
        eventCategory: body.eventCategory,
        eventImage: body.eventImage,
        organizerId: body.organizerId,
        organizerName: body.organizerName,
        user: body.user || {}
      })
    });
    const result = await readBackendJson(response);
    if (!response.ok || !result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || result?.message || 'Could not update event engagement.' },
        { status: response.ok ? 502 : response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Could not update real event engagement:', error);
    return NextResponse.json(
      { success: false, error: 'Event engagement is temporarily unavailable. Please try again.' },
      { status: 502 }
    );
  }
}
