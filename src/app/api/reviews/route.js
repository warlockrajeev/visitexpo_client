import { NextResponse } from 'next/server';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventSlug = searchParams.get('eventSlug');
    const limit = searchParams.get('limit') || '50';
    
    const query = new URLSearchParams();
    if (eventSlug) query.set('eventSlug', eventSlug);
    query.set('limit', limit);

    const res = await fetch(`${BACKEND_API_URL}/reviews?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error proxying reviews GET:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Error proxying reviews POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
