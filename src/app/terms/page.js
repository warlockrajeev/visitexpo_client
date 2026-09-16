'use client';

/**
 * @file app/terms/page.js
 * @description Comprehensive Terms & Conditions for the VisitExpo platform.
 * Sets forth legal agreements for attendees, exhibitors, and event organizers.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import {
  FileText,
  ShieldCheck,
  Clock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TermsPage() {
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
              <span className="text-amber-400">Terms &amp; Conditions</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <FileText className="h-3.5 w-3.5" />
              <span>VisitExpo Master Terms of Service</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms &amp; Conditions
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Effective Date: September 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Applies to all Visitors, Exhibitors &amp; Organizers
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12 leading-relaxed text-zinc-700 text-sm">
          
          {/* Quick Notice Callout */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Important Legal Notice</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">
              Please read these Terms carefully before accessing or using VisitExpo. By clicking &ldquo;Register&rdquo;, &ldquo;Claim Event&rdquo;, &ldquo;Get Free Pass&rdquo;, or accessing any VisitExpo SaaS services, you agree to be bound by these Terms. If you do not agree, you may not access our platform.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              1. Acceptance of Terms &amp; Scope
            </h2>
            <p>
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Attendee&rdquo;, &ldquo;Exhibitor&rdquo;, or &ldquo;Organizer&rdquo;) and VisitExpo Platform Inc. (&ldquo;VisitExpo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing access to and usage of the VisitExpo website (<a href="https://visitexpo.in" className="text-primary font-semibold hover:underline">visitexpo.in</a>), mobile applications, APIs, attendee portals, and organizer admin consoles.
            </p>
            <p>
              By accessing VisitExpo, you confirm that you are at least 18 years of age (or have reached the age of majority in your jurisdiction) and hold full authority to accept these Terms on behalf of yourself or the business entity you represent.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              2. User Roles &amp; Account Responsibility
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Trade Visitors &amp; Attendees:</strong> Individuals registering to discover exhibitions, claim complimentary passes, view exhibitors, and network with trade partners.
              </li>
              <li>
                <strong>Exhibitors:</strong> Registered business entities booking booth space, displaying products, cataloging showcase offerings, and utilizing VisitExpo QR lead capture tools.
              </li>
              <li>
                <strong>Event Organizers:</strong> Verified organizations creating, managing, ticketing, and publishing exhibition listings on VisitExpo.
              </li>
            </ul>
            <p className="text-xs text-zinc-500 pt-1">
              You are responsible for safeguarding your login credentials. Any activity conducted under your account remains your sole responsibility. Notify us immediately at <a href="mailto:security@visitexpo.in" className="text-primary hover:underline">security@visitexpo.in</a> if you suspect unauthorized access.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              3. Digital Passes, Badges &amp; Venue Entry
            </h2>
            <p>
              VisitExpo issues digital passes, registration confirmations, and QR-coded badges on behalf of affiliated exhibition organizers.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Passes are non-transferable unless explicitly authorized by the event organizer.</li>
              <li>Organizers and venue security reserve the right to inspect identification matching the name on your digital badge at gate turnstiles.</li>
              <li>Complimentary trade visitor passes are intended exclusively for verified trade professionals, procurement specialists, and industry buyers.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              4. QR Lead Scanning &amp; Contact Consent
            </h2>
            <p>
              When you present your VisitExpo digital badge or QR pass to an exhibitor or organizer for scanning at an exhibition booth, you explicitly consent to sharing your business contact details (including name, company, email, phone, and professional title) with that specific exhibitor as a direct B2B business lead.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              5. Organizer Publishing &amp; Content Warranties
            </h2>
            <p>
              Organizers publishing exhibition details on VisitExpo warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>All dates, venues, categories, exhibitor lists, and entry requirements are accurate and kept current.</li>
              <li>They own or possess valid licenses for all uploaded logos, brand banners, speaker portraits, and marketing collaterals.</li>
              <li>Listings do not infringe upon any third-party intellectual property or violate local exhibition licensing regulations.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              6. Fees, Subscriptions &amp; Payments
            </h2>
            <p>
              Certain services—such as premium event promotion, featured exhibitor placement, lead export tools, and organizer ticketing subscriptions—require payment of established fees. All payments are processed through certified PCI-DSS compliant payment gateways. Fees are non-refundable except as expressly stated in our <Link href="/refund-policy" className="text-primary font-bold hover:underline">Refund Policy</Link>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              7. Intellectual Property
            </h2>
            <p>
              The VisitExpo name, logos, platform UI, algorithms, design systems, and proprietary code are the exclusive intellectual property of VisitExpo Platform Inc. You may not copy, reverse-engineer, scrape, or distribute our platform assets without prior written consent.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              8. Limitation of Liability &amp; Disclaimers
            </h2>
            <p>
              VisitExpo provides discovery and ticketing technology. We do not organize, operate, or control the physical venues or exhibition proceedings. To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>VisitExpo is not liable for exhibition cancellations, schedule alterations, or force majeure events caused by weather, government orders, or organizer insolvency.</li>
              <li>VisitExpo disclaims liability for contracts, agreements, or product quality disputes concluded between visitors and exhibitors.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              9. Contact &amp; Legal Notices
            </h2>
            <p>
              For legal inquiries, dispute notifications, or questions regarding these Terms, please contact our Legal Counsel at:
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-zinc-900">VisitExpo Platform Inc. — Legal &amp; Compliance</p>
              <p>Email: <a href="mailto:legal@visitexpo.in" className="text-primary hover:underline">legal@visitexpo.in</a></p>
              <p>Corporate Address: Bharat Mandapam (IECC Complex), New Delhi / Mumbai, India</p>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
