'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Globe,
  Ticket,
  Cpu,
  Building2,
  Store,
  QrCode,
  ShieldCheck,
  Users,
  Zap,
  ArrowRight,
  Flame,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function ActionDiscoveryBanner({ onKeywordClick }) {
  // Active Filter Tab state: 'all' | 'visitors' | 'exhibitors' | 'organizers'
  const [activeTab, setActiveTab] = useState('all');

  // Interactive Discovery Tracks (For Visitors & Buyers)
  const discoveryTracks = [
    {
      id: 'global-pavilions',
      title: 'Global Trade Pavilions',
      desc: 'International country pavilions & multi-sector sourcing hubs',
      badge: 'Worldwide',
      category: 'visitors',
      icon: Globe,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200',
      action: 'events',
      search: 'international'
    },
    {
      id: 'tech-ai-conclaves',
      title: 'Tech & AI Innovation Summits',
      desc: 'Next-gen enterprise software, AI models & robotics showcases',
      badge: 'High Demand',
      category: 'visitors',
      icon: Cpu,
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200',
      action: 'events',
      search: 'tech'
    },
    {
      id: 'digital-visitor-passes',
      title: 'Digital Free Visitor Passes',
      desc: 'Instant badge registration for trade visitors with QR entry',
      badge: '100% Free',
      category: 'visitors',
      icon: Ticket,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
      action: 'events',
      search: 'free'
    },
    {
      id: 'ev-auto-forums',
      title: 'EV, Auto & Logistics Expos',
      desc: 'Future mobility, heavy commercial fleet & supply-chain fairs',
      badge: 'B2B Hub',
      category: 'visitors',
      icon: Activity,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200',
      action: 'events',
      search: 'auto'
    },
    {
      id: 'healthcare-pharma',
      title: 'Healthcare & Pharma Expos',
      desc: 'Accredited medical devices, pharma manufacturing & clinical tech',
      badge: 'Accredited',
      category: 'visitors',
      icon: ShieldCheck,
      color: 'from-rose-500/10 to-red-500/10 text-rose-600 border-rose-200',
      action: 'events',
      search: 'health'
    },
    {
      id: 'infra-construction',
      title: 'Smart Infra & Real Estate',
      desc: 'Architecture, municipal engineering, construction & realty',
      badge: 'Mega Projects',
      category: 'visitors',
      icon: Building2,
      color: 'from-cyan-500/10 to-sky-500/10 text-cyan-600 border-cyan-200',
      action: 'events',
      search: 'construction'
    }
  ];

  // Business Action Tracks (For Exhibitors & Organizers)
  const businessActions = [
    {
      id: 'reserve-booth',
      title: 'Reserve Prime Booth Stalls',
      desc: 'Direct floor booking in high-traffic exhibition hall halls & pavilions',
      badge: 'For Exhibitors',
      category: 'exhibitors',
      icon: Store,
      color: 'from-amber-500/15 to-yellow-500/15 text-amber-400 border-amber-500/30',
      link: '/login?role=exhibitor&signup=true'
    },
    {
      id: 'scan-qr-leads',
      title: 'Instant QR Lead Retrieval',
      desc: 'Scan attendee visitor passes directly into your CRM with zero hardware',
      badge: 'Lead Tech',
      category: 'exhibitors',
      icon: QrCode,
      color: 'from-pink-500/15 to-rose-500/15 text-pink-400 border-pink-500/30',
      link: '/login?role=exhibitor&signup=true'
    },
    {
      id: 'claim-event-listing',
      title: 'Claim Pre-Loaded Event Listing',
      desc: 'Take full administrative control of your official exhibition on visitexpo.in',
      badge: 'For Organizers',
      category: 'organizers',
      icon: Zap,
      color: 'from-blue-500/15 to-cyan-500/15 text-blue-400 border-blue-500/30',
      link: '#claim'
    },
    {
      id: 'schedule-b2b-meetings',
      title: 'Pre-Schedule 1-on-1 B2B Meetings',
      desc: 'Coordinate buyer delegations & high-value commercial matchmaking',
      badge: 'Matchmaking',
      category: 'organizers',
      icon: Users,
      color: 'from-emerald-500/15 to-teal-500/15 text-emerald-400 border-emerald-500/30',
      link: '#events'
    }
  ];

  const handleTileClick = (item) => {
    if (item.action === 'events' && onKeywordClick) {
      onKeywordClick(item);
    }
  };

  const filteredDiscovery = discoveryTracks.filter(
    (item) => activeTab === 'all' || activeTab === 'visitors'
  );

  const filteredActions = businessActions.filter(
    (item) => activeTab === 'all' || activeTab === item.category || (activeTab === 'exhibitors' && item.category === 'exhibitors') || (activeTab === 'organizers' && item.category === 'organizers')
  );

  return (
    <section className="w-full bg-gradient-to-b from-zinc-50 via-white to-zinc-50/60 py-14 sm:py-18 border-y border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* ========================================================================= */}
        {/* HEADER & SEGMENTED TABS                                                   */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-zinc-200/70">
          <div className="space-y-2.5 max-w-2xl">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold tracking-wide uppercase shadow-2xs">
              <Compass className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>Smart Expo Discovery &amp; Action Hub</span>
            </div> */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Navigate Industry Opportunities.{' '}
              <span className="bg-gradient-to-r from-amber-500 via-[#FF2E63] to-pink-600 bg-clip-text text-transparent">
                Own the Floor.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
              Whether sourcing global suppliers across 2,000+ verified trade shows, booking prime booths, or capturing qualified visitor leads—experience purposeful B2B execution.
            </p>
          </div>

          {/* Segmented Filter Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 shadow-2xs">
            {[
              { id: 'all', label: 'All Pathways' },
              { id: 'visitors', label: 'Visitor Tracks' },
              { id: 'exhibitors', label: 'Exhibitor Floor' },
              { id: 'organizers', label: 'Organizer Hub' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DUAL INTERACTIVE EXPERIENCE CARDS                                         */}
        {/* ========================================================================= */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* ----------------------------------------------------------------------- */}
          {/* CARD 1: CURATED EXPO DISCOVERY (Visitors & Buyers)                      */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
            
            {/* Ambient subtle glow background */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                      Spotlight Discovery Tracks
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Curated international pavilions, live demos, and visitor badges
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  For Trade Visitors
                </span>
              </div>

              {/* Spotlight Micro-Tiles Grid */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {filteredDiscovery.map((track) => {
                  const IconComp = track.icon;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTileClick(track)}
                      className="text-left p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 hover:bg-white hover:border-amber-400/80 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group/tile cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`p-2 rounded-xl border ${track.color}`}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/90 px-2 py-0.5 rounded-md border border-zinc-200/70">
                          {track.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 group-hover/tile:text-amber-600 transition-colors flex items-center justify-between">
                          <span>{track.title}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover/tile:translate-x-0.5 group-hover/tile:text-amber-600 transition-all" />
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 font-normal leading-relaxed">
                          {track.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 relative z-10">
              <span className="text-xs text-zinc-500 font-medium">
                Showing vetted summits &amp; global pavilions across India &amp; overseas
              </span>
              <a
                href="#events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer"
              >
                <span>Browse All Live Expos</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
              </a>
            </div>

          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 2: THE BUSINESS ACTION FLOOR (Exhibitors & Organizers)             */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-zinc-950 text-white rounded-3xl border border-zinc-800/90 p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group">
            
            {/* Ambient luxury accent glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#FF2E63]/20 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#FF2E63]/15 border border-[#FF2E63]/30 flex items-center justify-center text-[#FF2E63] shadow-xs">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      The Industry Action Floor
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      High-ROI tools for exhibitors, sponsors &amp; expo organizers
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-amber-400 border border-white/15">
                  B2B Growth
                </span>
              </div>

              {/* Action Tiles Stack */}
              <div className="space-y-2.5 pt-1">
                {filteredActions.map((act) => {
                  const IconComp = act.icon;
                  const isExternalOrInternalLink = act.link && act.link.startsWith('/');
                  
                  const Content = (
                    <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between gap-3 group/act cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border ${act.color} shrink-0`}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover/act:text-amber-400 transition-colors truncate">
                              {act.title}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400 bg-white/10 px-1.5 py-0.2 rounded border border-white/10 shrink-0">
                              {act.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
                            {act.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-500 group-hover/act:text-white group-hover/act:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );

                  if (isExternalOrInternalLink) {
                    return (
                      <Link key={act.id} href={act.link} className="block">
                        {Content}
                      </Link>
                    );
                  }

                  return (
                    <a key={act.id} href={act.link || '#events'} className="block">
                      {Content}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Button Group */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-3 relative z-10">
              <Link
                href="/login?signup=true"
                className="flex-1 min-w-[130px] inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FF2E63] hover:bg-[#E82054] active:scale-98 text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer text-center"
              >
                Create Account
              </Link>
              <Link
                href="/login?role=exhibitor&signup=true"
                className="flex-1 min-w-[130px] inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] active:scale-98 text-zinc-950 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer text-center"
              >
                Exhibit at Expo
              </Link>
              <a
                href="#claim"
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 text-xs font-semibold transition-all cursor-pointer text-center"
              >
                Claim Pre-Loaded Expo
              </a>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* VALUE METRIC STRIP                                                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[
            { label: 'Verified Trade Shows', val: '2,000+', icon: CheckCircle2, text: 'Across India & Worldwide' },
            { label: 'Industry Sectors', val: '15+ Verticals', icon: Layers, text: 'From Tech to Mobility' },
            { label: 'Digital Visitor Badges', val: '100% Free', icon: Ticket, text: 'Instant QR Registration' },
            { label: 'Lead Retrieval Tech', val: 'Real-Time CRM', icon: QrCode, text: 'Built-in for Exhibitors' }
          ].map((stat, idx) => {
            const IconC = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/80 border border-zinc-200/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-zinc-300 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-700 shrink-0">
                  <IconC className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold text-zinc-900 truncate">
                    {stat.val}
                  </div>
                  <div className="text-[11px] font-medium text-zinc-500 truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

