'use client';

/**
 * @file app/refund-policy/page.js
 * @description Refund & Cancellation Policy for VisitExpo.
 * Outlines guidelines for visitor passes, delegate tickets, and exhibitor booth bookings.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import {
  CreditCard,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#FF2E63] selection:text-white flex flex-col justify-between">
      <div>
        <Navbar solid={true} />

        {/* Hero Header */}
        <section className="bg-zinc-950 text-white pt-32 pb-16 px-4 sm:px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-amber-400">Refund Policy</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Financial Terms &amp; Ticket Cancellations</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Refund &amp; Cancellation Policy
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Effective: September 2026
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                Transparent 5–7 Day Bank Processing
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-10 leading-relaxed text-zinc-700 text-sm">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              1. General Refund Principles
            </h2>
            <p>
              At VisitExpo, we aim to ensure complete clarity regarding registration passes, delegate tickets, and exhibitor stall commitments. Because exhibition organizers incur significant venue leasing, security, and staging expenses well in advance of event dates, specific refund criteria apply depending on the ticket or booth category.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              2. Complimentary Trade Visitor Passes
            </h2>
            <p>
              The vast majority of trade visitor passes on VisitExpo are <strong>100% complimentary</strong> for verified industry professionals. There are no fees to cancel or relinquish a complimentary digital badge. If you are unable to attend, no penalties apply.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              3. Paid Conference &amp; Delegate Passes
            </h2>
            <p>For premium paid passes (such as VIP Buyer Lounges, Masterclasses, and Gala Dinner tickets):</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Cancellation &gt; 15 Days Before Event:</strong> 100% refund minus a 5% administrative gateway fee.</li>
              <li><strong>Cancellation 7–14 Days Before Event:</strong> 50% refund.</li>
              <li><strong>Cancellation &lt; 7 Days Before Event:</strong> Non-refundable due to finalized delegate seating and catering. However, substitute attendee name transfers are permitted free of charge up to 24 hours prior to day 1.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              4. Exhibitor Booth Cancellations
            </h2>
            <p>
              Exhibitor stall contracts are governed by specific agreements between the exhibitor and the event organizer. Generally:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Notice given 90+ days prior to expo: 75% refund of booth rental fees.</li>
              <li>Notice given 60–89 days prior: 50% refund of booth rental fees.</li>
              <li>Notice given within 60 days of expo: 0% refund, as stall spaces cannot be reassigned or re-fabricated on short notice.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              5. Event Postponement or Relocation
            </h2>
            <p>
              If an organizer postpones an exhibition or relocates to an alternate city venue, all issued passes and booth bookings automatically transfer to the rescheduled dates. Attendees or exhibitors unable to attend the new dates may submit a refund request within 14 calendar days of the postponement announcement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              6. Refund Request Procedure
            </h2>
            <p>
              To request a refund, submit your booking reference ID, registered email, and reason to our billing department:
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-zinc-900">VisitExpo Billing &amp; Refunds Desk</p>
              <p>Email: <a href="mailto:refunds@visitexpo.in" className="text-primary hover:underline">refunds@visitexpo.in</a></p>
              <p>Turnaround: Approved refunds are processed to your original payment method within 5–7 banking business days.</p>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
