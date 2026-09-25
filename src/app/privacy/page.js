'use client';

/**
 * @file app/privacy/page.js
 * @description Official Privacy Policy for VisitExpo.in.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import {
  ShieldCheck,
  Lock,
  Eye,
  Clock,
  ChevronRight,
  Database,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Globe
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
              <span className="text-[#FFCC00]">Privacy Policy</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Data Protection &amp; Privacy Practices</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Updated &amp; Effective
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                Secure Data Governance
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12 leading-relaxed text-zinc-700 text-sm">
          
          {/* Introductory Notice */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 space-y-3">
            <p>
              At <strong>VisitExpo.in</strong>, we take your privacy seriously. Please read this Privacy Policy to understand how we collect, use, and share your personal data. By accessing or using our website, you agree to the terms outlined in this Privacy Policy and consent to our collection and usage practices.
            </p>
            <p className="text-xs text-zinc-500">
              Remember, your use of VisitExpo.in is also governed by our <Link href="/terms" className="text-[#FF2E63] font-semibold hover:underline">Terms of Use</Link>, which incorporates this Privacy Policy. Any terms used here without definition are defined in the Terms of Use.
            </p>
          </div>

          {/* Privacy Policy Table of Contents */}
          <section className="p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-zinc-800">
              <FileText className="h-4 w-4 text-[#FF2E63]" />
              <span>Privacy Policy Table of Contents</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-zinc-700">
              <li>• What this Privacy Policy Covers</li>
              <li>• Personal Data (Categories, Sources &amp; Purposes)</li>
              <li>• How We Share Your Personal Data</li>
              <li>• Tracking Tools and Opt-Out</li>
              <li>• Data Security and Retention</li>
              <li>• Personal Data of Children</li>
              <li>• State Law Privacy Rights</li>
              <li>• Changes to this Privacy Policy</li>
              <li>• Contact Information</li>
            </ul>
          </section>

          {/* Section: What this Privacy Policy Covers */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              What this Privacy Policy Covers
            </h2>
            <p>
              This Privacy Policy covers how we treat Personal Data collected when you access or use VisitExpo.in. &ldquo;Personal Data&rdquo; refers to any information that identifies or relates to an individual, including &ldquo;personally identifiable information&rdquo; under applicable laws.
            </p>
            <p>
              This Privacy Policy does not apply to third-party practices outside our control.
            </p>
          </section>

          {/* Section: Personal Data */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Personal Data
            </h2>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-zinc-900">Categories of Personal Data We Collect</h3>
              <p>We collect the following types of personal data:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Contact Information (e.g., name, email, phone number)</li>
                <li>Login Credentials (if account-based features are used)</li>
                <li>Location Data (if permitted by your device)</li>
                <li>Usage Data (pages visited, time spent, interaction patterns)</li>
                <li>Cookies and Tracking Information</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-zinc-900">Categories of Sources of Personal Data</h3>
              <p>We collect data from:</p>
              <div className="space-y-3 pl-2">
                <div>
                  <strong className="text-zinc-900 text-xs sm:text-sm block">You:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-600">
                    <li>Through forms, contact inquiries, and registration on our site</li>
                    <li>Through communications (email, chat, etc.)</li>
                  </ul>
                </div>

                <div>
                  <strong className="text-zinc-900 text-xs sm:text-sm block">Automatically:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-600">
                    <li>Through browser Cookies and device tracking tools</li>
                    <li>Through location-enabled services (if opted in)</li>
                  </ul>
                </div>

                <div>
                  <strong className="text-zinc-900 text-xs sm:text-sm block">Third Parties:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-600">
                    <li>Analytics providers</li>
                    <li>Advertising and marketing partners</li>
                    <li>Business vendors and platforms that integrate with VisitExpo.in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-zinc-900">Our Commercial or Business Purposes for Collecting Personal Data</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>To provide and personalize our services</li>
                <li>To communicate with you regarding services and updates</li>
                <li>To improve and optimize website performance</li>
                <li>To prevent fraud and enhance security</li>
                <li>To comply with legal obligations</li>
                <li>For marketing and promotional purposes (based on your preferences)</li>
              </ul>
              <p className="text-xs text-zinc-500 pt-1">
                We do not use your personal data for materially different purposes without providing additional notice.
              </p>
            </div>
          </section>

          {/* Section: How We Share Your Personal Data */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              How We Share Your Personal Data
            </h2>
            <p>We may share your data with:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">Service Providers:</strong>
                <ul className="list-disc pl-4 text-xs text-zinc-600 space-y-0.5">
                  <li>Hosting and infrastructure providers</li>
                  <li>Customer support platforms</li>
                  <li>Email and communication tools</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">Analytics Partners:</strong>
                <ul className="list-disc pl-4 text-xs text-zinc-600 space-y-0.5">
                  <li>Web traffic and interaction trackers</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">Marketing Partners:</strong>
                <ul className="list-disc pl-4 text-xs text-zinc-600 space-y-0.5">
                  <li>Ad networks and marketing agencies (to improve campaign performance)</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">Legal and Compliance:</strong>
                <p className="text-xs text-zinc-600">
                  If required by law, legal process, or to protect rights, property, or safety.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">Business Transfers:</strong>
                <p className="text-xs text-zinc-600">
                  In case of merger, acquisition, or asset sale, your data may be transferred.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 text-xs sm:text-sm block font-bold mb-1">De-Identified Data:</strong>
                <p className="text-xs text-zinc-600">
                  Aggregated and anonymized data may be used for analytics or reporting.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Tracking Tools and Opt-Out */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Tracking Tools and Opt-Out
            </h2>
            <p>
              VisitExpo.in uses Cookies and similar technologies to improve user experience and analyze traffic. You may adjust your browser settings to refuse some or all Cookies. However, some features may become unavailable.
            </p>
            <p>We use:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Essential Cookies:</strong> For secure access and navigation.</li>
              <li><strong>Functional Cookies:</strong> To remember preferences.</li>
              <li><strong>Performance Cookies:</strong> (e.g., Google Analytics) to optimize experience.</li>
            </ul>
          </section>

          {/* Section: Data Security and Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Data Security and Retention
            </h2>
            <p>
              We implement security measures to protect your data but cannot guarantee absolute security. We retain data as long as necessary to provide services or comply with legal obligations.
            </p>
          </section>

          {/* Section: Personal Data of Children */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Personal Data of Children
            </h2>
            <p>
              VisitExpo.in does not knowingly collect data from children under 13. If we learn that we have inadvertently collected such data, we will delete it. Please contact us if you believe a child has submitted personal data.
            </p>
          </section>

          {/* Section: State Law Privacy Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              State Law Privacy Rights
            </h2>
            <div className="space-y-3 pl-3 border-l-2 border-zinc-200 text-xs sm:text-sm">
              <p>
                <strong>California Residents:</strong> You may request details about personal data shared with third parties for marketing purposes. Email us to submit such a request.
              </p>
              <p>
                <strong>Nevada Residents:</strong> You may opt out of the sale of certain data. To do so, email us with the subject line &ldquo;Nevada Do Not Sell Request.&rdquo;
              </p>
            </div>
          </section>

          {/* Section: Changes to this Privacy Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Changes to this Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of major changes via email or on our website. Continued use of VisitExpo.in after changes means you accept those changes.
            </p>
          </section>

          {/* Section: Contact Information */}
          <section className="space-y-4 pt-4 border-t border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900">
              Contact Information
            </h2>
            <p>If you have questions about this Privacy Policy or your data:</p>

            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
                <span className="font-semibold text-zinc-900">Website:</span>
                <a href="https://www.visitexpo.in" target="_blank" rel="noopener noreferrer" className="text-[#FF2E63] font-bold hover:underline">
                  www.visitexpo.in
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#FF2E63] shrink-0" />
                <span className="font-semibold text-zinc-900">Email:</span>
                <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-bold hover:underline">
                  support@visitexpo.in
                </a>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-900">Address:</span>{' '}
                  <span className="text-zinc-700">LEOMEO IT Solutions, Churchgate 35, Court Chambers, Mumbai</span>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
