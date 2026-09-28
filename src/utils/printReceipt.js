/**
 * @file printReceipt.js
 * @description Generates a high-quality, professional A4 text-based PDF/Print document for VisitExpo order receipts.
 * Renders cleanly formatted, selectable text without dialog chrome, modal frames, or dark mode artifacts.
 */

import { getCurrencySymbol } from '../app/(dashboard)/events/wizard/page.js';

/**
 * Generate a clean SVG vector barcode from a string
 */
function generateBarcodeSVG(code) {
  const cleanCode = (code || 'VISITEXPO').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const barHeight = 36;
  let x = 6;
  const bars = [];

  // Start guard bars
  bars.push(`<rect x="${x}" y="0" width="2.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 4.5;
  bars.push(`<rect x="${x}" y="0" width="1.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 3.5;

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = ((charCode % 3) + 1) * 1.1;
    const s1 = (((charCode >> 1) % 2) + 1) * 1.1;
    const w2 = (((charCode >> 2) % 3) + 1) * 1.1;
    const s2 = 1.6;

    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w1.toFixed(1)}" height="${barHeight}" fill="#0f172a"/>`);
    x += w1 + s1;
    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w2.toFixed(1)}" height="${barHeight}" fill="#0f172a"/>`);
    x += w2 + s2;
  }

  // End guard bars
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="1.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 3.5;
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="2.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(x)} ${barHeight}" style="height: 36px; max-width: 230px; width: 100%; display: block; margin: 0 auto;" preserveAspectRatio="none">${bars.join('')}</svg>`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}

function formatEventDates(event) {
  if (!event) return 'Dates as announced by organizer';
  if (event.startDate && event.endDate) {
    try {
      const s = new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const e = new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return s === e ? s : `${s} – ${e}`;
    } catch {
      return `${event.startDate} - ${event.endDate}`;
    }
  }
  if (event.startDate) {
    try {
      return new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(event.startDate);
    }
  }
  return 'Dates as announced by organizer';
}

function formatEventVenue(event) {
  if (!event) return 'Official Exhibition & Conference Center';
  const parts = [];
  if (event.venue) parts.push(event.venue);
  if (event.city) parts.push(event.city);
  if (event.country && event.country !== event.city) parts.push(event.country);
  return parts.length > 0 ? parts.join(', ') : 'Venue details shared by organizer';
}

function getOrganizerName(event) {
  if (!event) return 'VisitExpo Event Partner';
  if (event.organizer && typeof event.organizer === 'object' && event.organizer.name) {
    return event.organizer.name;
  }
  if (event.organizerName) return event.organizerName;
  return 'Authorized Event Organizer';
}

function formatPaymentMethod(method) {
  if (!method) return 'Card / UPI';
  const m = method.toLowerCase();
  if (m === 'free_pass' || m === 'freepass' || m === 'free') return 'Free Pass / Complimentary';
  if (m === 'card' || m === 'credit_card' || m === 'debit_card') return 'Credit / Debit Card';
  if (m === 'upi') return 'UPI / Instant Bank Pay';
  if (m === 'razorpay') return 'Razorpay Secure Checkout';
  if (m === 'stripe') return 'Stripe Online Payment';
  return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Generate full A4 HTML receipt string
 */
export function generateReceiptHTML(order, event) {
  if (!order) return '';

  const currencySym = getCurrencySymbol(order.currency || 'INR');
  const isFree = order.totalAmount === 0 || (order.paymentMethod && order.paymentMethod.toLowerCase().includes('free'));
  const isCompleted = (order.status || '').toLowerCase() === 'completed';

  const orderNum = order.orderNumber || `ORD-${order._id?.slice(-8) || '0000'}`;
  const orderDate = formatDateTime(order.createdAt);
  const paymentMethodStr = formatPaymentMethod(order.paymentMethod);
  const paymentIdStr = order.paymentId || order._id || 'TXN-FREE-PASS';

  // Event info
  const eventTitle = event?.title || (typeof order.event === 'object' && order.event?.title) || 'Official Exhibition & Trade Event';
  const eventDates = formatEventDates(event || (typeof order.event === 'object' ? order.event : null));
  const eventVenue = formatEventVenue(event || (typeof order.event === 'object' ? order.event : null));
  const eventOrg = getOrganizerName(event || (typeof order.event === 'object' ? order.event : null));

  // Buyer info
  const buyerName = order.buyer?.name || 'Registered Attendee';
  const buyerEmail = order.buyer?.email || 'N/A';
  const buyerPhone = order.buyer?.phone || '';
  const buyerCompany = order.buyer?.company || '';
  const buyerDesignation = order.buyer?.designation || '';
  const buyerCountry = order.buyer?.country || 'India';

  // Items
  const items = order.items && order.items.length > 0 ? order.items : [
    {
      title: 'Standard Delegate Pass',
      quantity: 1,
      price: order.totalAmount || 0
    }
  ];

  let calculatedSubtotal = 0;
  const itemsRows = items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineSubtotal = qty * price;
    calculatedSubtotal += lineSubtotal;

    const unitPriceDisplay = price === 0 ? 'FREE' : `${currencySym}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const lineTotalDisplay = lineSubtotal === 0 ? 'FREE' : `${currencySym}${lineSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">
          ${item.title || 'General Admission Pass'}
          <div style="font-size: 8.5px; font-weight: normal; color: #64748b; margin-top: 1px;">Full Event Entry • Digital Badge Access</div>
        </td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-family: monospace; font-weight: 700;">x${qty}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; color: #475569;">${unitPriceDisplay}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${lineTotalDisplay}</td>
      </tr>
    `;
  }).join('');

  const subtotalDisplay = calculatedSubtotal === 0 ? 'FREE' : `${currencySym}${calculatedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalAmountDisplay = isFree || order.totalAmount === 0 ? 'FREE' : `${currencySym}${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const barcodeSvg = generateBarcodeSVG(orderNum);
  const printTimestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt-${orderNum}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
    }
    .receipt-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }

    /* Header */
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-section {
      display: flex;
      flex-direction: column;
    }
    .brand-logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 32px;
      height: 32px;
      background: #0f172a;
      color: #facc15;
      font-weight: 900;
      font-size: 18px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.5px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .issuer-meta {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.35;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-type {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .order-number {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .order-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .status-completed {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .status-pending {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .status-failed {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Event Card */
    .event-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #facc15;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .section-label {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .event-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .event-details-grid {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 1fr;
      gap: 10px;
      font-size: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
    .event-detail-item {
      display: flex;
      flex-direction: column;
    }
    .event-detail-label {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .event-detail-value {
      font-weight: 600;
      color: #1e293b;
      margin-top: 1px;
    }

    /* Two Column Customer & Payment Summary */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #ffffff;
    }
    .info-box-title {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3.5px;
      font-size: 10px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .mono-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
    }

    /* Itemized Table */
    .table-container {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 7px 10px;
      font-size: 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td {
      border-bottom: none;
    }

    /* Summary & Barcode Block */
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 12px;
    }
    .barcode-block {
      flex: 1.1;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .barcode-wrapper {
      text-align: center;
    }
    .barcode-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #0f172a;
      text-align: center;
      margin-top: 4px;
      font-weight: 700;
    }
    .barcode-hint {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.3;
      text-align: center;
    }
    .totals-block {
      flex: 0.9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
      font-size: 10px;
      color: #64748b;
    }
    .total-row.grand-total {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .grand-total-amount {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }

    /* Terms */
    .terms-block {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 8px;
    }
    .terms-title {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .terms-list {
      margin: 0;
      padding-left: 14px;
      color: #64748b;
      font-size: 8.5px;
      line-height: 1.35;
    }

    /* Footer */
    .receipt-footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="receipt-header">
      <div class="brand-section">
        <div class="brand-logo-row">
          <div class="brand-mark">V</div>
          <div>
            <div class="brand-name">VisitExpo</div>
            <div class="brand-tagline">Global Event & Exhibition Platform</div>
          </div>
        </div>
        <div class="issuer-meta">
          Official Event Pass & Registration Confirmation<br/>
          www.visitexpo.in • support@visitexpo.in
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-type">Official Receipt</div>
        <div class="order-number">${orderNum}</div>
        <div class="order-date">Issued: ${orderDate}</div>
        <span class="status-badge ${isCompleted ? 'status-completed' : (order.status === 'failed' ? 'status-failed' : 'status-pending')}">
          ${(order.status || 'COMPLETED').toUpperCase()}
        </span>
      </div>
    </div>

    <!-- Event Banner -->
    <div class="event-card">
      <div class="section-label">Target Event Information</div>
      <div class="event-title">${eventTitle}</div>
      <div class="event-details-grid">
        <div class="event-detail-item">
          <span class="event-detail-label">Event Dates</span>
          <span class="event-detail-value">${eventDates}</span>
        </div>
        <div class="event-detail-item">
          <span class="event-detail-label">Location / Venue</span>
          <span class="event-detail-value">${eventVenue}</span>
        </div>
        <div class="event-detail-item">
          <span class="event-detail-label">Organized By</span>
          <span class="event-detail-value">${eventOrg}</span>
        </div>
      </div>
    </div>

    <!-- Customer & Payment Grid -->
    <div class="info-grid">
      <!-- Attendee Box -->
      <div class="info-box">
        <div class="info-box-title">Attendee / Billed To</div>
        <div class="info-row">
          <span class="info-label">Full Name:</span>
          <span class="info-value">${buyerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${buyerEmail}</span>
        </div>
        ${buyerPhone ? `
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${buyerPhone}</span>
        </div>
        ` : ''}
        ${buyerCompany ? `
        <div class="info-row">
          <span class="info-label">Organization:</span>
          <span class="info-value">${buyerCompany}${buyerDesignation ? ` (${buyerDesignation})` : ''}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Billing Country:</span>
          <span class="info-value">${buyerCountry}</span>
        </div>
      </div>

      <!-- Payment Summary Box -->
      <div class="info-box">
        <div class="info-box-title">Payment & Transaction</div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${paymentMethodStr}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Transaction ID:</span>
          <span class="info-value mono-val">${paymentIdStr}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Settlement Status:</span>
          <span class="info-value" style="color: #059669; font-weight: 700;">Confirmed / Settled</span>
        </div>
        <div class="info-row">
          <span class="info-label">Settlement Currency:</span>
          <span class="info-value mono-val">${order.currency || 'INR'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Category:</span>
          <span class="info-value">Event Pass & Delegate Access</span>
        </div>
      </div>
    </div>

    <!-- Itemized Passes Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Pass / Ticket Description</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Unit Price</th>
            <th style="width: 110px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Summary & Security Barcode -->
    <div class="summary-section">
      <!-- Digital Entry Barcode -->
      <div class="barcode-block">
        <div class="section-label" style="text-align: center; margin-bottom: 6px;">Digital Entry Verification</div>
        <div class="barcode-wrapper">
          ${barcodeSvg}
          <div class="barcode-text">* ${orderNum} *</div>
          <div class="barcode-hint">
            Present this printed document or digital barcode at the registration badge counter for physical badge printing and venue turnstile access.
          </div>
        </div>
      </div>

      <!-- Financial Totals -->
      <div class="totals-block">
        <div class="section-label">Financial Breakdown</div>
        <div class="total-row">
          <span>Items Subtotal:</span>
          <span style="font-family: monospace; font-weight: 600;">${subtotalDisplay}</span>
        </div>
        <div class="total-row">
          <span>Platform & Processing Fee:</span>
          <span style="font-family: monospace;">Inclusive (0.00)</span>
        </div>
        <div class="total-row">
          <span>Applicable Taxes (GST):</span>
          <span style="font-family: monospace;">Inclusive</span>
        </div>
        <div class="total-row grand-total">
          <span>Total Paid Amount:</span>
          <span class="grand-total-amount">${totalAmountDisplay}</span>
        </div>
        <div style="font-size: 8px; color: #059669; text-align: right; margin-top: 3px; font-weight: 700;">
          Payment Received in Full • No Outstanding Balance
        </div>
      </div>
    </div>

    <!-- Terms and Instructions -->
    <div class="terms-block">
      <div class="terms-title">Terms & Important Admission Information</div>
      <ol class="terms-list">
        <li><strong>Badge Collection:</strong> Please carry a government-issued photo ID or employee identification matching the attendee name for badge collection at the registration counter.</li>
        <li><strong>Non-Transferability:</strong> Event passes are non-transferable and valid only for the designated attendee unless authorized in writing by the event organizer.</li>
        <li><strong>Venue Entry:</strong> Admission to the exhibition halls, keynote sessions, and conference tracks is subject to venue capacity and organizer security protocols.</li>
        <li><strong>Electronic Confirmation:</strong> This is an electronically generated official receipt and registration confirmation. No physical signature is required.</li>
      </ol>
    </div>

    <!-- Footer -->
    <div class="receipt-footer">
      <div>VisitExpo Technologies • Secure Digital Event Ledger</div>
      <div>Printed: ${printTimestamp}</div>
      <div>Document Ref: ${order._id || orderNum} • Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers clean A4 document printing using an invisible iframe.
 * Avoids browser modal chrome, button captures, and dark backgrounds.
 */
export function printOrderReceipt(order, targetEvent) {
  if (!order) return;

  const html = generateReceiptHTML(order, targetEvent);
  const frameId = 'visitexpo-receipt-print-iframe';

  // Remove existing iframe if any
  let iframe = document.getElementById(frameId);
  if (iframe) {
    iframe.remove();
  }

  // Create isolated hidden iframe
  iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Allow styles and layout to compute before opening native print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to popup window:', err);
      const printWin = window.open('', '_blank', 'width=850,height=900');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    }
  }, 250);
}
