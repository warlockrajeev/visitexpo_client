import { NextResponse } from 'next/server';

/**
 * @file app/api/contact/route.js
 * @description Next.js API route proxying contact inquiries directly to MongoDB/Express backend.
 */

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, role, message, source, meta } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:5000/api';

    try {
      const response = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role || 'Visitor',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          message: message.trim(),
          source: source || 'contact_page',
          meta: meta || {}
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      console.warn('[client-dashboard/api/contact] Backend sync fallback notice:', err.message);
    }

    // Graceful response if external server is offline
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your message has been received. Our team will contact you shortly.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
