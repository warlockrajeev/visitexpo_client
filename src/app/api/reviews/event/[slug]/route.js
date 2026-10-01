import { NextResponse } from 'next/server';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.visitexpo.in/api' : 'http://localhost:5000/api');

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_URL}/reviews/event/${encodeURIComponent(slug)}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error proxying event reviews GET:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
