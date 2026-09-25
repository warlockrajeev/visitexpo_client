'use client';

/**
 * @file app/refund-policy/page.js
 * @description Official Refund Policy for VisitExpo.in.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import {
  CreditCard,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  RefreshCw,
  HelpCircle
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
              <span className="text-[#FFCC00]">Refund Policy</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Financial Guidelines &amp; Cancellations</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Refund Policy &ndash; VisitExpo.in
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Updated &amp; Effective
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Credited within 7–10 Business Days
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-10 leading-relaxed text-zinc-700 text-sm">
          
          {/* Introduction Card */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 space-y-2">
            <p className="text-xs sm:text-sm leading-relaxed">
              At <strong>VisitExpo.in</strong>, we are committed to delivering a high-quality, immersive virtual event experience. However, we understand that unforeseen circumstances may arise, and this policy outlines how refund requests are handled for various services offered on our platform.
            </p>
          </div>

          {/* Section: Refund Eligibility */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Refund Eligibility
            </h2>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-zinc-900">For Visitors:</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>A full refund will be provided if an event is canceled by VisitExpo.in or the organizer.</li>
                <li>If technical failures attributable to VisitExpo.in prevent access to a virtual event, and the issue is not resolved within 24 hours, a partial or full refund may be considered.</li>
                <li>
                  <strong>No refunds will be given for:</strong>
                  <ul className="list-[circle] pl-5 space-y-1 mt-1 text-zinc-600">
                    <li>Inability to attend due to user-side issues.</li>
                    <li>Technical problems from the user&rsquo;s internet, device, or software.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-zinc-900">For Organizers:</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Full refunds are available for event listings canceled at least 7 days prior to the event start date.</li>
                <li>No refunds for cancellations made within 7 days unless due to verified emergencies.</li>
                <li>If VisitExpo.in service disruptions affect organizer booths or livestreams, a partial refund or credit may be issued after internal evaluation.</li>
              </ul>
            </div>
          </section>

          {/* Section: Provision and Nature of Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Provision and Nature of Services
            </h2>
            <p>VisitExpo.in is a dynamic and evolving platform. You acknowledge and agree that:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>The form and nature of services may change without prior notice.</li>
              <li>VisitExpo.in reserves the right to suspend, cancel, or modify any service, content, or feature at any time, with or without advance notice.</li>
              <li>If your account is deactivated, access to associated data and content may be permanently barred.</li>
              <li>VisitExpo.in may introduce subscription or membership fees in the future, with reasonable prior notice.</li>
              <li>VisitExpo.in reserves the right to limit the volume of service usage at its discretion.</li>
            </ul>
          </section>

          {/* Section: Specific Conditions for On-Site Virtual Tour or Broadcast Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Specific Conditions for On-Site Virtual Tour or Broadcast Services
            </h2>
            <p>
              For any live broadcasting, content capture, or virtual tours conducted by VisitExpo.in personnel or representatives from physical events (&ldquo;On-Site Services&rdquo;), you acknowledge and agree that VisitExpo.in is not liable for service failures caused by:
            </p>
            <ol className="list-roman pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Internet Failures:</strong> Poor or unavailable connectivity at the venue.</li>
              <li><strong>Personnel Unavailability:</strong> Sudden absence or incapacity of staff.</li>
              <li><strong>Equipment Malfunction:</strong> Technical failure of essential gear (camera, audio, power, etc.).</li>
              <li><strong>Access Denial:</strong> Entry denial or restrictions by venue organizers or authorities.</li>
              <li><strong>Force Majeure Events:</strong> Unforeseen natural, governmental, or systemic disruptions.</li>
            </ol>
            <p className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              While VisitExpo.in will make every reasonable effort to fulfill On-Site Services, we do not guarantee flawless delivery. If services are significantly impaired or not rendered, any related refund or compensation will be assessed on a case-by-case basis, at the sole discretion of VisitExpo.in.
            </p>
          </section>

          {/* Section: Communications Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Communications Policy
            </h2>
            <p>By using our services, you agree to receive communication via calls, SMS, email, and app notifications. You:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Confirm ownership or permission to use the contact details provided.</li>
              <li>Acknowledge that delivery of messages is dependent on your carrier or service provider.</li>
              <li>Can opt-out at any time by updating notification preferences or emailing <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-semibold hover:underline">support@visitexpo.in</a>.</li>
            </ul>
          </section>

          {/* Section: Mobile Software and SDK Policy (If Applicable) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Mobile Software and SDK Policy (If Applicable)
            </h2>
            <p>
              If you use a VisitExpo.in mobile app:
            </p>
            <p>
              We may use mobile SDKs to collect device-specific info (e.g., email, GPS location, app usage) for performance, analytics, or advertising.
            </p>
            <div className="space-y-1.5 pl-4 border-l-2 border-zinc-300 text-xs sm:text-sm">
              <p>You can opt-out of:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                <li><strong>Push Notifications:</strong> Through your device&rsquo;s settings.</li>
                <li><strong>Cross-app advertising:</strong> Via device ad settings (e.g., disable &ldquo;interest-based ads&rdquo; in Android settings).</li>
              </ul>
            </div>
          </section>

          {/* Section: Refund Request Process */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Refund Request Process
            </h2>
            <p>
              Send all refund requests to <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-bold hover:underline">support@visitexpo.in</a> within <strong>7 days</strong> of the scheduled event.
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <p className="font-bold text-xs text-zinc-900 uppercase tracking-wider">Please Include in Your Request:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-700">
                <li>Full Name</li>
                <li>Booking Email</li>
                <li>Transaction ID</li>
                <li>Reason for Request</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Refunds, once approved, will be credited within <strong>7–10 business days</strong> to the original payment method.</span>
            </div>
          </section>

          {/* Section: No-Show Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              No-Show Policy
            </h2>
            <p>
              VisitExpo.in is not responsible for refunding missed sessions or events due to user inaction. We strongly recommend timely login and pre-checks of your internet and device.
            </p>
          </section>

          {/* Section: Cancellation by VisitExpo.in */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Cancellation by VisitExpo.in
            </h2>
            <p>
              In rare instances where VisitExpo.in cancels a service or event, you will receive either a full refund or credit for future use.
            </p>
          </section>

          {/* Section: Policy Updates */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Policy Updates
            </h2>
            <p>
              This Refund Policy may be updated from time to time. Continued use of our services implies agreement with any modifications.
            </p>
          </section>

          {/* Section: Questions or Concerns */}
          <section className="space-y-4 pt-4 border-t border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900">
              Questions or Concerns?
            </h2>
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#FF2E63]" />
                  <span className="font-semibold text-zinc-900">Email:</span>
                  <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-bold hover:underline">
                    support@visitexpo.in
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-zinc-900">Phone:</span>
                  <a href="tel:+919323677688" className="text-zinc-900 font-bold hover:underline">
                    +91-9323677688
                  </a>
                </div>
              </div>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shrink-0"
              >
                Go to Contact Us
              </Link>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
