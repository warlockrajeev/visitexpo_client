'use client';

/**
 * @file app/privacy/page.js
 * @description Privacy Policy for the VisitExpo platform.
 * Compliant with GDPR, CCPA, and India Digital Personal Data Protection (DPDP) Act.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import {
  ShieldCheck,
  Lock,
  Eye,
  Clock,
  ChevronRight,
  Database,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function PrivacyPage() {
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
              <span className="text-emerald-400">Privacy Policy</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Data Protection &amp; GDPR / DPDP Compliant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Last Updated: September 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                256-Bit SSL Encrypted Platform
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12 leading-relaxed text-zinc-700 text-sm">
          
          {/* Executive Summary Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Our Privacy Pledge to Trade Visitors &amp; Exhibitors</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-900">
              VisitExpo never sells your personal contact information to third-party data brokers. Your information is strictly utilized to facilitate exhibition pass delivery, B2B supplier networking, and direct organizer-delegate communications in compliance with international privacy laws.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              1. Information We Collect
            </h2>
            <p>
              When you register for an exhibition pass, onboard an event, or interact with our platform, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Identity &amp; Professional Profile:</strong> Full name, corporate email address, contact phone number, job designation, company name, industry sector, and trade purchasing authority.
              </li>
              <li>
                <strong>Exhibition Attendance History:</strong> Passes generated, bookmarked expos, exhibitors followed, and reviews submitted.
              </li>
              <li>
                <strong>Device &amp; Telemetry Data:</strong> IP address, browser type, operating system, and approximate geographical location (with your browser permission) to display nearby exhibitions.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              2. How We Use Your Information
            </h2>
            <p>We process your personal information for the following legitimate purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Generating and transmitting digital fast-track entry badges and QR passes.</li>
              <li>Confirming booth reservations and ticketing invoices.</li>
              <li>Providing organizers with verified attendee rosters for event security and hall logistics.</li>
              <li>Recommending curated trade expos aligned with your business category and sourcing interests.</li>
              <li>Detecting fraudulent ticket registrations and protecting platform integrity.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              3. Exhibition Badge QR Code Scanning Consent
            </h2>
            <p>
              Your digital pass features an encrypted QR code. When you physically visit an exhibition stall and permit an exhibitor to scan your badge:
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2 text-zinc-700">
              <p className="font-semibold text-zinc-900">What happens when your badge is scanned?</p>
              <p>
                Allowing an exhibitor to scan your badge is equivalent to handing them your business card. You explicitly authorize VisitExpo to share your professional registration details (Name, Title, Company, Work Email, Phone) with that exhibitor for follow-up trade quotes, brochures, and meetings.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              4. Data Sharing &amp; Third Parties
            </h2>
            <p>We share personal data exclusively with:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Authorized Event Organizers:</strong> For visitor accreditation, badge issuance, and safety enforcement.</li>
              <li><strong>Scanned Exhibitors:</strong> Only upon your affirmative consent when presenting your badge at their stall.</li>
              <li><strong>Essential Infrastructure Providers:</strong> Cloud hosting (AWS, MongoDB Cloud), transactional email (SendGrid), and payment processors (Stripe, Razorpay). All vendors are bound by strict Data Processing Agreements (DPAs).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              5. Data Security Standards
            </h2>
            <p>
              VisitExpo enforces enterprise security measures including 256-bit TLS/SSL encryption for all data in transit, AES-256 encryption for sensitive credentials at rest, multi-factor authentication for administrative users, and regular vulnerability audits.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              6. Your Privacy Rights (GDPR, CCPA &amp; DPDP)
            </h2>
            <p>Depending on your location, you hold legal rights regarding your personal information:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Right of Access:</strong> Request a copy of all personal records we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Update inaccurate or incomplete contact records.</li>
              <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request permanent deletion of your account and registration history.</li>
              <li><strong>Right to Opt-Out:</strong> Unsubscribe from marketing communications at any time with one click.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              7. Contact Our Data Protection Officer (DPO)
            </h2>
            <p>
              To exercise any of your privacy rights or file a data inquiry, please contact our Data Protection Office:
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-zinc-900">Data Protection Officer (DPO) — VisitExpo</p>
              <p>Email: <a href="mailto:privacy@visitexpo.in" className="text-primary hover:underline">privacy@visitexpo.in</a></p>
              <p>Security Response: <a href="mailto:security@visitexpo.in" className="text-primary hover:underline">security@visitexpo.in</a></p>
              <p>Response Time: Within 48 business hours</p>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
