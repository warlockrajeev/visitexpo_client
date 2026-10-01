import { NextResponse } from 'next/server';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_URL}/reviews/${encodeURIComponent(id)}/helpful`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Error proxying helpful POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
