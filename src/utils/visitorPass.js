import QRCode from 'qrcode';
import { printBadge } from './printBadge.js';
import { showSweetAlert, showSweetError } from './sweetalert.js';
import { rememberClaimedPass } from './claimedPasses.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

export async function issueVisitorPass({ endpoint, event, user }) {
  const eventId = event?._id || event?.id || event?.wpPostId;
  if (!endpoint || !eventId || !user?.email) {
    await showSweetError('Event or visitor information is missing. Please refresh the page and try again.', 'Unable to Issue Pass');
    return null;
  }

  let registration;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        name: user.name || user.email.split('@')[0] || 'Visitor',
        email: user.email,
        phone: user.phone || '+91-9999999999',
        company: user.organization?.name || user.company || 'Trade Attendee',
        designation: 'Business Visitor',
        country: 'India',
        attendanceType: 'in_person'
      })
    });
    const data = await response.json();
    if (!response.ok || !data?.success || !data?.visitor) {
      throw new Error(data?.error || 'Registration could not be completed. Please try again.');
    }
    registration = data.visitor;
  } catch (error) {
    await showSweetError(error.message || 'Registration could not be completed. Please try again.', 'Registration Unsuccessful');
    return null;
  }

  if (!registration.id || !registration.qrCode) {
    await showSweetError(
      'Your registration was received, but the pass ID or QR token is missing. Please open My Passes & Badges or contact support.',
      'Pass Details Unavailable'
    );
    return null;
  }

  const pass = {
    ...registration,
    _id: registration.id,
    passId: registration.passId || `VIS-${String(registration.id).toUpperCase()}`,
    name: registration.name || user.name || user.email.split('@')[0] || 'Visitor',
    email: registration.email || user.email,
    phone: registration.phone || user.phone || '',
    company: registration.company || user.organization?.name || user.company || 'Trade Visitor',
    attendanceType: registration.attendanceType || 'in_person',
    event: {
      ...event,
      ...(registration.event || {}),
      title: registration.event?.title || event.title || event.name || 'Trade Exhibition',
      dates: event.dates || registration.event?.dates,
      venue: registration.event?.venue || event.venue || '',
      city: registration.event?.city || event.city || ''
    }
  };
  rememberClaimedPass(event, pass);

  try {
    const qrImage = await QRCode.toDataURL(pass.qrCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 240
    });
    const eventLocation = [pass.event.venue, pass.event.city].filter(Boolean).join(', ');
    const eventDates =
      pass.event.dates ||
      [pass.event.startDate, pass.event.endDate].filter(Boolean)
        .map((date) => new Date(date).toLocaleDateString())
        .join(' - ') ||
      'Date to be announced';
    const passType = pass.attendanceType === 'virtual'
      ? 'Free Virtual Visitor Pass'
      : 'Free In-person Visitor Pass';

    const result = await showSweetAlert({
      title: 'Visitor Pass Confirmed!',
      icon: 'success',
      width: 'min(94vw, 560px)',
      padding: '1.25rem',
      confirmButtonText: 'Download / Print Pass',
      showCancelButton: true,
      cancelButtonText: 'View My Passes',
      showCloseButton: true,
      reverseButtons: true,
      html: `
        <div style="text-align:left;color:#3f3f46;">
          <div style="padding:14px;border:1px solid #e4e4e7;border-radius:14px;background:#fafafa;">
            <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#a16207;">Event</div>
            <div style="margin-top:4px;font-size:16px;font-weight:800;color:#18181b;">${escapeHtml(pass.event.title)}</div>
            <div style="margin-top:5px;font-size:12px;">${escapeHtml(eventDates)}</div>
            ${eventLocation ? `<div style="margin-top:3px;font-size:12px;">${escapeHtml(eventLocation)}</div>` : ''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px;">
            <div style="padding:11px;border:1px solid #e4e4e7;border-radius:12px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">Visitor</div>
              <div style="margin-top:3px;font-size:13px;font-weight:700;color:#18181b;">${escapeHtml(pass.name)}</div>
              <div style="font-size:11px;overflow-wrap:anywhere;">${escapeHtml(pass.email)}</div>
              ${pass.phone ? `<div style="font-size:11px;">${escapeHtml(pass.phone)}</div>` : ''}
              ${pass.company ? `<div style="font-size:11px;">${escapeHtml(pass.company)}</div>` : ''}
            </div>
            <div style="padding:11px;border:1px solid #e4e4e7;border-radius:12px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">Pass type</div>
              <div style="margin-top:3px;font-size:13px;font-weight:700;color:#18181b;">${escapeHtml(passType)}</div>
              <div style="margin-top:5px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">Pass ID</div>
              <div style="font-size:11px;font-family:monospace;font-weight:700;overflow-wrap:anywhere;">${escapeHtml(pass.passId)}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;margin-top:12px;padding:12px;border:1px solid #e4e4e7;border-radius:14px;background:#fff;">
            <img src="${qrImage}" alt="Scannable visitor pass QR code" width="192" height="192" style="display:block;width:192px;height:192px;max-width:100%;" />
            <span style="margin-top:6px;font-size:10px;font-family:monospace;font-weight:700;overflow-wrap:anywhere;">${escapeHtml(pass.passId)}</span>
          </div>
          <p style="margin:10px 0 0;text-align:center;font-size:11px;color:#71717a;">Show this QR code at the event entrance. Download or print your pass, or view it later under My Passes &amp; Badges.</p>
        </div>
      `
    });

    if (result?.isConfirmed) {
      await printBadge(pass);
    } else if (result?.dismiss === 'cancel') {
      window.location.assign('/dashboard');
    }
  } catch (error) {
    await showSweetError(
      `Your registration is confirmed, but the digital pass could not be prepared: ${error.message || 'Please try again.'}`,
      'Pass Preparation Failed'
    );
  }

  return pass;
}
