'use client';

/**
 * @file app/about/page.js
 * @description About Us page for VisitExpo.
 * Highlights the platform story, global statistics, mission, and leadership vision.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import {
  Globe,
  Award,
  Users,
  Building2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#FF2E63] selection:text-white flex flex-col justify-between">
      <div>
        <Navbar solid={true} />

        {/* Hero Header */}
        <section className="relative overflow-hidden bg-zinc-950 text-white pt-32 pb-20 px-4 sm:px-6 border-b border-zinc-800">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <img
              src="/hero-event-bg.jpg"
              alt="VisitExpo Global Events"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-amber-400">About Us</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#FFCC00]/15 text-amber-400 border border-amber-400/30">
              <Globe className="h-3.5 w-3.5" />
              <span>World's Fast-Growing Exhibition SaaS Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
              Powering the Next Era of Global Trade Exhibitions
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              VisitExpo simplifies exhibition discovery, digital pass issuance, and exhibitor lead capture. We bridge verified trade buyers, innovative manufacturers, and world-class organizers on one unified digital network.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-7 py-3 text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              >
                <span>Explore Exhibitions</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?role=organizer&signup=true"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-7 py-3 text-xs sm:text-sm transition-all cursor-pointer"
              >
                <span>For Organizers</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Global Impact Stats */}
        <section className="py-12 bg-zinc-50 border-b border-zinc-200 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900">500+</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Annual Trade Shows</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FF2E63]">100K+</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Verified Exhibitors</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-500">2M+</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Passes Generated</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">40+</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Industry Sectors</div>
            </div>
          </div>
        </section>

        {/* Mission & Story */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
                Eliminating queues and paper badges with instant digital intelligence
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Traditional trade fairs often suffer from slow on-site registration desks, lost paper visiting cards, and fragmented exhibitor directories. VisitExpo was created to provide a paperless, instantaneous, and verified ecosystem.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Whether attending an automation show at Bombay Exhibition Centre, a pharma expo at Bharat Mandapam, or a mobility summit in Frankfurt, VisitExpo ensures trade buyers get instant verified passes and direct B2B vendor matchmaking.
              </p>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 rounded-3xl text-white space-y-6 shadow-xl border border-zinc-800">
              <h3 className="text-lg font-bold text-amber-400">Why Global Organizers Trust VisitExpo</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Queue Entry:</strong> Instant QR passes deliver contactless gate validation in under 2 seconds.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Exhibitor Lead Hub:</strong> Booth teams scan badges and export verified buyer contacts in real time.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>10times-Style Directory:</strong> Rich SEO event pages with speakers, verified reviews, schedules, and floorplans.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Regional Hubs */}
          <div className="space-y-6 border-t border-zinc-200 pt-12">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-zinc-900">Our Strategic Hubs</h2>
              <p className="text-xs text-zinc-500">Operating across premier exhibition centers and international trade hubs.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-2 text-center hover:border-amber-400 transition-colors">
                <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">New Delhi (National Hub)</h4>
                <p className="text-xs text-zinc-500">Bharat Mandapam (IECC) &amp; Yashobhoomi (IICC)</p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-2 text-center hover:border-[#FF2E63] transition-colors">
                <div className="h-10 w-10 rounded-full bg-rose-50 text-[#FF2E63] flex items-center justify-center mx-auto">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">Mumbai (Financial Capital)</h4>
                <p className="text-xs text-zinc-500">Jio World Convention Centre &amp; BEC Goregaon</p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-2 text-center hover:border-blue-400 transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">Bangalore (Tech Hub)</h4>
                <p className="text-xs text-zinc-500">Bangalore International Exhibition Centre (BIEC)</p>
              </div>
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}
