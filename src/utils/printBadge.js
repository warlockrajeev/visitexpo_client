/**
 * @file printBadge.js
 * @description Dedicated, standalone badge printing utility for VisitExpo.
 * Renders an isolated, print-optimized document in a hidden iframe so that only
 * the clean badge card is printed, with crisp vector QR and zero background bleed.
 */

export const printBadge = (pass) => {
  if (typeof window === 'undefined' || !pass) return;

  const eventTitle = pass.event?.title || 'Trade Exhibition';
  const eventVenue = pass.event?.venue || '';
  const eventCity = pass.event?.city || 'India';
  const eventLocation = [eventVenue, eventCity].filter(Boolean).join(', ');
  const attendeeName = pass.name || 'Visitor';
  const attendeeCompany = pass.company || 'Trade Visitor';
  const passId = pass._id ? String(pass._id).slice(-8).toUpperCase() : 'VISITOR';
  const qrData = pass.qrCode || `VIS-${pass._id || passId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(eventTitle)} - Digital Entry Badge</title>
  <style>
    @page {
      size: auto;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .badge-container {
      width: 360px;
      max-width: 100%;
      border: 2px solid #cbd5e1;
      border-radius: 24px;
      padding: 28px 24px;
      text-align: center;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .badge-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #d97706;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 9999px;
      padding: 5px 14px;
      margin-bottom: 14px;
    }
    .event-title {
      font-size: 17px;
      font-weight: 800;
      line-height: 1.35;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .event-location {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 18px;
    }
    .attendee-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .attendee-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .attendee-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .attendee-role {
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .qr-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 18px;
      padding: 14px;
      display: inline-block;
      margin-bottom: 14px;
    }
    .qr-image {
      width: 190px;
      height: 190px;
      display: block;
      margin: 0 auto;
    }
    .qr-code-text {
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #334155;
      letter-spacing: 2.5px;
      margin-top: 8px;
      display: block;
    }
    .badge-footer {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }
    @media print {
      body {
        min-height: auto;
        padding: 0;
      }
      .badge-container {
        margin: 15mm auto;
        border: 2px solid #94a3b8;
      }
    }
  </style>
</head>
<body>
  <div class="badge-container">
    <div class="badge-pill">VisitExpo Verified Badge</div>
    <div class="event-title">${escapeHtml(eventTitle)}</div>
    ${eventLocation ? `<div class="event-location">${escapeHtml(eventLocation)}</div>` : ''}
    <div class="attendee-card">
      <div class="attendee-label">Attendee</div>
      <div class="attendee-name">${escapeHtml(attendeeName)}</div>
      <div class="attendee-role">${escapeHtml(attendeeCompany)}</div>
    </div>
    <div class="qr-card">
      <img class="qr-image" src="${qrUrl}" alt="Digital Entry Badge QR Code" />
      <span class="qr-code-text">VIS-${passId}</span>
    </div>
    <div class="badge-footer">
      Present this digital pass at the entrance scanner for instant check-in.
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const img = doc.querySelector('.qr-image');
  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  };

  if (img && img.complete) {
    setTimeout(triggerPrint, 200);
  } else if (img) {
    img.onload = () => setTimeout(triggerPrint, 200);
    img.onerror = () => triggerPrint();
  } else {
    triggerPrint();
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
