'use client';

/**
 * @file page.js
 * @description Clean, minimalist light-themed SaaS landing page for VisitExpo matching the user's reference design.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Check,
  CheckCircle2,
  Calendar,
  Users,
  Building,
  Target,
  Mail,
  Ticket,
  Search,
  HelpCircle,
  ChevronDown,
  Activity,
  Zap,
  Globe,
  Lock,
  ArrowRightLeft,
  Settings,
  TrendingUp,
  Download
} from 'lucide-react';

// Brand SVG Logo matching the yellow/black logo
const Logo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FFCC00" stroke="#000000" strokeWidth="0.5" />
    <text x="50" y="32" textAnchor="middle" fill="#000" fontSize="13" fontWeight="bold" fontFamily="system-ui, sans-serif" letterSpacing="0.2">visit</text>
    <text x="50" y="60" textAnchor="middle" fill="#000" fontSize="26" fontWeight="950" fontFamily="system-ui, sans-serif" fontStyle="italic" letterSpacing="-1">EXPO</text>
    <text x="50" y="78" textAnchor="middle" fill="#000" fontSize="8" fontWeight="600" fontFamily="system-ui, sans-serif" letterSpacing="0.5">visitexpo.in</text>
  </svg>
);

// Wavy underline effect for titles mimicking the hand-drawn style in the reference
const WavyUnderline = ({ text, className = "text-amber-500" }) => (
  <span className="relative inline-block whitespace-nowrap">
    <span className="relative z-10">{text}</span>
    <svg className="absolute left-0 bottom-[-6px] w-full h-[8px] z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
      <path
        d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5"
        fill="none"
        stroke="#FFCC00"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

// Professional startup/collaboration illustration image
const HeroIllustration = () => (
  <div className="relative w-full h-auto flex items-center justify-center overflow-hidden">
    <img
      src="/exhibition_digitalization_yellow.png"
      alt="Exhibition Digitalization Platform"
      className="w-full h-auto object-cover"
    />
  </div>
);

const MOCK_PREVIEW_EVENTS = [
  { title: '11th Asian Australian Rotorcraft Forum', city: 'Chennai', venue: 'IIT Madras', category: 'Aeronautics' },
  { title: '6th EV India Expo 2026', city: 'Greater Noida', venue: 'India Expo Mart', category: 'Automotive' },
  { title: '15th Cement Expo 2025', city: 'New Delhi', venue: 'Pragati Maidan', category: 'Industrial' },
  { title: '16th Mega Cargo Show 2026', city: 'Mumbai', venue: 'Bandra Kurla Complex', category: 'Logistics' }
];

const MOCK_PREVIEW_Solutions = [
  { title: 'Exhibitor Hub', desc: 'Custom portals for self-service staff badge setup & catalogues.' },
  { title: 'Lead Flow CRM', desc: 'Qualified visitor details and scoring filters ready to download.' },
  { title: 'Setup Wizard', desc: 'Deploy floor plans, session configurations, and tickets in minutes.' }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Navigation / Accordion states
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); 
  
  // Interactive Simulator States
  const [demoSearch, setDemoSearch] = useState('');
  const [selectedDemoEvent, setSelectedDemoEvent] = useState(null);
  const [demoClaimStep, setDemoClaimStep] = useState(0); 

  // Dashboard Preview Mock Tab
  const [activePreviewTab, setActivePreviewTab] = useState('analytics');

  // Interactive Floorplan Mock State
  const [selectedBooth, setSelectedBooth] = useState(null);

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const filteredDemoEvents = MOCK_PREVIEW_EVENTS.filter(evt =>
    evt.title.toLowerCase().includes(demoSearch.toLowerCase()) ||
    evt.city.toLowerCase().includes(demoSearch.toLowerCase())
  );

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-16 w-16 animate-pulse" />
          <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-primary selection:text-primary-foreground font-sans relative overflow-hidden">
      
      {/* HEADER SECTION (Matching reference) */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Logo className="h-12 w-12" />
            <div className="flex items-center gap-2 font-sans">
              <span className="text-xl font-black tracking-tight text-zinc-900">
                Visit<span className="text-amber-500">Expo</span>
              </span>
              <span className="text-zinc-300 text-sm">/</span>
              <span className="text-[11px] text-zinc-500 font-bold tracking-tight">A visitexpo.in Product</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-650">
            <a href="#about" className="hover:text-amber-500 transition-colors relative py-1">
              About us
              <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-amber-500 rounded-full" />
            </a>
            <a href="#features" className="hover:text-amber-500 transition-colors py-1">Solution</a>
            <a href="#demo" className="hover:text-amber-500 transition-colors py-1">Project Claim</a>
            <a href="#faq" className="hover:text-amber-500 transition-colors py-1">Contact us</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-zinc-500 hover:text-zinc-900 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?signup=true"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold px-5 py-2.5 text-xs sm:text-sm transition-all shadow-md shadow-primary/10"
            >
              Register Portal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Matching reference illustration & style) */}
      <section id="about" className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text */}
          <div className="md:col-span-7 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1]">
              VisitExpo is a new generation <br className="hidden lg:inline" />
              <WavyUnderline text="Digitalization of exhibitions" /> <br />
              Solution provider
            </h1>

            <p className="text-zinc-500 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl font-medium">
              We provide exhibition organizers with a suite of digital tools to quickly deploy private digital platforms, efficiently manage exhibition data, and ensure that visitors and exhibitors receive a high-quality digital experience, thereby empowering exhibitions.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/onboarding/organizer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold px-8 py-4 text-sm transition-all shadow-lg"
              >
                Schedule a demonstration
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-6 py-4 text-sm font-bold text-zinc-650 transition-all hover:text-zinc-900"
              >
                Claim Live Directory Portal &rarr;
              </a>
            </div>
          </div>

          {/* Right Column Illustration */}
          <div className="md:col-span-5 flex items-center justify-center">
            <HeroIllustration />
          </div>

        </div>
      </section>

      {/* SECOND HEADER (Matching reference underline style) */}
      <section className="py-12 bg-zinc-50/40 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            We are for many <WavyUnderline text="Professional exhibition organizers" /> Empower
          </h2>
        </div>
      </section>

      {/* PLATFORM FEATURES SOLUTION SECTION */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid md:grid-cols-3 gap-8">
          {MOCK_PREVIEW_Solutions.map((sol, idx) => (
            <div key={idx} className="p-8 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-zinc-900 flex items-center justify-center border border-primary/15 shadow-sm group-hover:scale-105 transition-transform">
                {idx === 0 ? <Building className="h-5 w-5 text-amber-600" /> : idx === 1 ? <Target className="h-5 w-5 text-amber-600" /> : <Settings className="h-5 w-5 text-amber-600" />}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 group-hover:text-amber-500 transition-colors">{sol.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{sol.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SAAS PRODUCT UI INTERACTIVE PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative">
        <div className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:p-5 shadow-2xl shadow-zinc-200/40 overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 mb-4 text-xs font-bold text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-1 text-[10px] tracking-wide uppercase bg-zinc-200/40 border border-zinc-200/60 px-3 py-1 rounded-lg">
              <Lock className="h-3 w-3 text-zinc-450" /> visitexpo-dashboard/organizer-portal
            </div>
            <span className="hidden sm:inline">VisitExpo SaaS</span>
          </div>

          <div className="grid md:grid-cols-12 gap-5 min-h-[380px] bg-white border border-zinc-200 rounded-xl overflow-hidden">
            
            {/* Sidebar */}
            <div className="md:col-span-3 bg-zinc-50/80 border-r border-zinc-200/80 p-3 space-y-4 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-2 px-2 py-1">
                <Logo className="h-7 w-7" />
                <span className="font-extrabold text-zinc-800">VisitExpo Dashboard</span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setActivePreviewTab('analytics')}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activePreviewTab === 'analytics' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'hover:bg-zinc-200/50 hover:text-zinc-800'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" /> Analytics Overview
                </button>
                <button
                  onClick={() => setActivePreviewTab('leads')}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activePreviewTab === 'leads' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'hover:bg-zinc-200/50 hover:text-zinc-800'
                  }`}
                >
                  <Target className="h-4 w-4" /> CRM Lead Scoring
                </button>
                <button
                  onClick={() => setActivePreviewTab('floorplan')}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activePreviewTab === 'floorplan' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'hover:bg-zinc-200/50 hover:text-zinc-800'
                  }`}
                >
                  <Building className="h-4 w-4" /> Exhibitor Floorplan
                </button>
              </div>
            </div>

            {/* Panel View */}
            <div className="md:col-span-9 p-6 space-y-4 overflow-y-auto">
              
              {activePreviewTab === 'analytics' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Analytics Overview</h3>
                      <p className="text-[11px] text-zinc-450 mt-0.5">Real-time sync performance tracking for 6th EV India Expo.</p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-550 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Globe className="h-3 w-3 text-emerald-500" /> Sync Active
                    </span>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-zinc-200 shadow-sm text-xs">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Directory Views</span>
                      <p className="text-2xl font-black text-zinc-900 mt-1">12,450</p>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1 block">▲ 14.2% this week</span>
                    </div>
                    <div className="p-4 rounded-xl border border-zinc-200 shadow-sm text-xs">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Attendee Registrants</span>
                      <p className="text-2xl font-black text-zinc-900 mt-1">1,940</p>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1 block">▲ 8.1% conversion</span>
                    </div>
                    <div className="p-4 rounded-xl border border-zinc-200 shadow-sm text-xs">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Ticket Revenue</span>
                      <p className="text-2xl font-black text-zinc-900 mt-1">$48,250</p>
                      <span className="text-[10px] font-bold text-zinc-500 mt-1 block">Payout Pending</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'leads' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Lead Flow CRM</h3>
                      <p className="text-[11px] text-zinc-450 mt-0.5">Scoring visitor intent based on profile data and booth check-ins.</p>
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-bold">
                          <th className="px-4 py-2">Visitor</th>
                          <th className="px-4 py-2">Company / Role</th>
                          <th className="px-4 py-2 text-center">Score</th>
                          <th className="px-4 py-2">Intent Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 font-medium">
                        <tr>
                          <td className="px-4 py-2 text-zinc-800 font-bold">Rohan Sharma</td>
                          <td className="px-4 py-2 text-zinc-500">Tata Motors • EV Developer</td>
                          <td className="px-4 py-2 text-center"><span className="font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">94%</span></td>
                          <td className="px-4 py-2"><span className="text-[10px] text-emerald-650 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">High Buy Intent</span></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-zinc-800 font-bold">Sarah Jenkins</td>
                          <td className="px-4 py-2 text-zinc-500">BMW Group • Buyer</td>
                          <td className="px-4 py-2 text-center"><span className="font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">87%</span></td>
                          <td className="px-4 py-2"><span className="text-[10px] text-emerald-650 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Hot Prospect</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activePreviewTab === 'floorplan' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Exhibitor Booth Layout</h3>
                      <p className="text-[11px] text-zinc-450 mt-0.5">Click on a booth in the layout to inspect exhibitor details.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    {[
                      { num: 'Booth A1', company: 'Tesla Motors Ltd', status: 'Booked' },
                      { num: 'Booth A2', company: 'Hero MotoCorp', status: 'Booked' },
                      { num: 'Booth B1', company: 'Available Space', status: 'Open' }
                    ].map((booth, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedBooth(booth)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                          selectedBooth?.num === booth.num
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-zinc-800">{booth.num}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 truncate">{booth.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* SEARCH & CLAIM SIMULATOR PORTAL */}
      <section id="demo" className="py-16 bg-zinc-50 border-t border-zinc-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Claim Your VisitExpo Directory Listing</h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Thousands of events are already pre-loaded into the VisitExpo directory. Test the onboarding module below to simulate event verification.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white border border-zinc-200 shadow-xl rounded-2xl overflow-hidden">
            {/* Header tab */}
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo className="h-7 w-7" />
                <span className="text-xs font-bold text-zinc-700">Verification Engine (Onboarding Simulator)</span>
              </div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 tracking-wider">Step {demoClaimStep + 1} of 3</span>
            </div>

            <div className="p-6 md:p-8">
              {demoClaimStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-2">1. Search Event Directory</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search pre-loaded events (e.g. Rotorcraft, EV India, Cement, Cargo)..."
                        value={demoSearch}
                        onChange={(e) => setDemoSearch(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pre-Loaded Matches ({filteredDemoEvents.length})</p>
                    <div className="grid gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {filteredDemoEvents.map((evt, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedDemoEvent(evt)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            selectedDemoEvent?.title === evt.title
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-zinc-100 bg-white hover:border-zinc-200 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-zinc-800">{evt.title}</h4>
                              <span className="text-[9px] font-bold uppercase text-zinc-700 bg-primary/25 px-2 py-0.5 rounded border border-primary/20">Directory Listing</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1">{evt.venue}, {evt.city} • Category: {evt.category}</p>
                          </div>
                          <button className="text-[11px] font-bold text-amber-600 group flex items-center gap-1 hover:underline">
                            {selectedDemoEvent?.title === evt.title ? 'Selected ✓' : 'Select'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-150 flex justify-end">
                    <button
                      onClick={() => selectedDemoEvent && setDemoClaimStep(1)}
                      disabled={!selectedDemoEvent}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-5 py-3 text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Onboarding Status <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {demoClaimStep === 1 && selectedDemoEvent && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-amber-650" /> 2. Verify Identity & Listing Ownership
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Claim verification requires an official business email matching the event website domain.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wide">Selected Event</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDemoEvent.title}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wide">Official Contact Email</label>
                      <input
                        type="email"
                        placeholder="organizer@officialdomain.com"
                        defaultValue="organizer@visitexpo.in"
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-205 bg-zinc-50 p-4 text-xs space-y-2 text-zinc-650">
                    <div className="flex justify-between">
                      <span>Verification Mode:</span>
                      <span className="font-bold text-zinc-700">VisitExpo Sync Integration</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moderation Status:</span>
                      <span className="font-semibold text-amber-650 flex items-center gap-1">
                        <Activity className="h-3 w-3 animate-pulse" /> Auto-Review active
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-150 flex justify-between">
                    <button
                      onClick={() => setDemoClaimStep(0)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-500 transition-all hover:text-zinc-800"
                    >
                      Back to Search
                    </button>
                    <button
                      onClick={() => setDemoClaimStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-6 py-3 text-xs transition-all"
                    >
                      Confirm Claim & Launch Portal <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {demoClaimStep === 2 && selectedDemoEvent && (
                <div className="text-center py-8 space-y-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto ring-8 ring-emerald-500/15">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-550/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Pending Moderation Approval
                    </span>
                    <h3 className="text-xl font-bold text-zinc-800 tracking-tight">Onboarding Request Created!</h3>
                    <p className="text-xs text-zinc-555 leading-relaxed">
                      Your simulator claim for <strong className="text-zinc-800">"{selectedDemoEvent.title}"</strong> has been processed successfully. In the live platform, the Super Admin moderation team validates this proof.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-150 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedDemoEvent(null);
                        setDemoClaimStep(0);
                        setDemoSearch('');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-500 transition-all hover:text-zinc-800"
                    >
                      Reset Simulator
                    </button>
                    <Link
                      href="/onboarding/organizer"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 text-xs transition-all shadow-md shadow-primary/15 animate-pulse"
                    >
                      Start Real Onboarding <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS / WP INTEGRATION FLOW */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Seamless Onboarding to visitexpo.in
          </h2>
          <p className="text-zinc-650 text-sm leading-relaxed">
            Four simple stages. Setup your parameters and publish expo details to the global visitor feed automatically.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid md:grid-cols-4 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-zinc-50/50 border border-zinc-200 rounded-2xl p-6 relative hover:border-zinc-300 transition-colors shadow-sm">
            <span className="text-4xl font-extrabold text-zinc-350 block">01</span>
            <h4 className="text-base font-bold text-zinc-900 mt-3">Claim Listing</h4>
            <p className="text-xs text-zinc-650 mt-2 leading-relaxed">
              Find your existing pre-loaded expo on the VisitExpo global directory and claim ownership of the listing.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-50/50 border border-zinc-200 rounded-2xl p-6 relative hover:border-zinc-300 transition-colors shadow-sm">
            <span className="text-4xl font-extrabold text-zinc-355 block">02</span>
            <h4 className="text-base font-bold text-zinc-900 mt-3">Configure Details</h4>
            <p className="text-xs text-zinc-655 mt-2 leading-relaxed">
              Input schedules, ticketing parameters, and layout slots. Changes deploy directly onto visitexpo.in.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-50/50 border border-zinc-200 rounded-2xl p-6 relative hover:border-zinc-300 transition-colors shadow-sm">
            <span className="text-4xl font-extrabold text-zinc-355 block">03</span>
            <h4 className="text-base font-bold text-zinc-900 mt-3">Exhibitor Bookings</h4>
            <p className="text-xs text-zinc-655 mt-2 leading-relaxed">
              Exhibitors gain credentials, customize catalog details, allocation requests, and staff credentials autonomously.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-zinc-50/50 border border-zinc-200 rounded-2xl p-6 relative hover:border-zinc-300 transition-colors shadow-sm">
            <span className="text-4xl font-extrabold text-zinc-355 block">04</span>
            <h4 className="text-base font-bold text-zinc-900 mt-3">Real-Time Sync</h4>
            <p className="text-xs text-zinc-655 mt-2 leading-relaxed">
              Registration forms submit directly to the Lead scoring CRM, automatically updating attendee listings.
            </p>
          </div>

        </div>
      </section>

      {/* WHY VISITEXPO COMPARISON */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl space-y-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 text-center">Why organizers switch to VisitExpo</h3>
            <div className="grid md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-200 pt-4">
              
              {/* Traditional */}
              <div className="space-y-4 pr-0 md:pr-6 pb-6 md:pb-0">
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Traditional Fragmented Apps</span>
                <ul className="text-xs text-zinc-550 space-y-3">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500/80 font-bold">✕</span> Double entry: updating details in frontend directories, database, and PDFs separately.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500/80 font-bold">✕</span> Exhibitors email documents and staff names manually back-and-forth.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500/80 font-bold">✕</span> No central CRM lead scoring. Lead spreadsheets lost in folders.
                  </li>
                </ul>
              </div>

              {/* VisitExpo */}
              <div className="space-y-4 pl-0 md:pl-8 pt-6 md:pt-0">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">The VisitExpo Advantage</span>
                <ul className="text-xs text-zinc-700 space-y-3">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold">✓</span> Sync engine: one update modifies main listings and apps instantly.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold">✓</span> Dedicated portal: exhibitors customize profiles and badges autonomously.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold">✓</span> CRM Scoring: leads are automatically scored and aggregated.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Honest Plans Built for Expo Scales
          </h2>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60 mt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Yearly billing <span className="bg-primary/20 text-zinc-900 text-[9px] px-1.5 py-0.5 rounded-full border border-primary/10">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Plan 1 */}
          <div className="bg-white border border-zinc-205 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-zinc-300 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-zinc-700">Basic Directory</h4>
                <p className="text-xs text-zinc-500 mt-1">For single event listings looking for directory presence on visitexpo.in.</p>
              </div>
              <p className="text-3xl font-black text-zinc-900">
                $0 <span className="text-xs font-normal text-zinc-400">Free forever</span>
              </p>
              <div className="border-t border-zinc-150 pt-4 space-y-3 text-xs text-zinc-650">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> 1 VisitExpo directory listing</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Basic schedule editing</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Max 50 attendee registrations</p>
                <p className="flex items-center gap-2 text-zinc-450"><Check className="h-4 w-4 text-zinc-300" /> Lead scoring CRM disabled</p>
              </div>
            </div>
            <Link
              href="/login?signup=true"
              className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-semibold py-2.5 text-xs text-zinc-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Plan 2: Recommended */}
          <div className="bg-white border-2 border-primary rounded-3xl p-8 space-y-6 flex flex-col justify-between relative shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-zinc-950 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                  Professional Hub <Sparkles className="h-4 w-4 text-amber-500" />
                </h4>
                <p className="text-xs text-zinc-500 mt-1">For event organizers seeking direct ownership claims and lead CRM.</p>
              </div>
              <p className="text-3xl font-black text-zinc-900">
                {billingCycle === 'monthly' ? '$99' : '$79'}{' '}
                <span className="text-xs font-normal text-zinc-400">/ month</span>
              </p>
              <div className="border-t border-zinc-150 pt-4 space-y-3 text-xs text-zinc-700">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Claim 1 active event listing</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Unlimited custom booth layouts</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Up to 1,000 visitor registrations</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Advanced lead scoring CRM</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Automated email campaigns</p>
              </div>
            </div>
            <Link
              href="/onboarding/organizer"
              className="w-full inline-flex items-center justify-center rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 text-xs transition-colors shadow-lg"
            >
              Start Claim Verification
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="bg-white border border-zinc-205 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-zinc-300 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-zinc-300">Scale Spotlight</h4>
                <p className="text-xs text-zinc-500 mt-1">For large agencies managing multiple expos and premium marketing tiers.</p>
              </div>
              <p className="text-3xl font-black text-zinc-900">
                {billingCycle === 'monthly' ? '$299' : '$239'}{' '}
                <span className="text-xs font-normal text-zinc-400">/ month</span>
              </p>
              <div className="border-t border-zinc-150 pt-4 space-y-3 text-xs text-zinc-650">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Claim up to 5 events concurrently</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Dedicated exhibitor portals</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Unlimited visitor registrations</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Spotlight featured placement</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Custom integrations & VIP support</p>
              </div>
            </div>
            <Link
              href="/login?signup=true"
              className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-semibold py-2.5 text-xs text-zinc-700 transition-colors"
            >
              Select Plan
            </Link>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight text-center">Got Questions? We’ve Got Answers.</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the publishing to the main VisitExpo frontend work?",
              a: "Once you configure your event in this dashboard, the details, ticket tiers, and exhibitor slots are automatically published to the main VisitExpo public directory portal. Attendees can search and register directly on visitexpo.in, and the data syncs back to your dashboard instantly."
            },
            {
              q: "Can exhibitors capture and retrieve visitor leads directly?",
              a: "Yes. Exhibitors have their own secure hubs. From their portal, they can access scanner codes for lead retrieval, register booth staff, and download list metrics in real-time."
            },
            {
              q: "How does the ownership claim system verify event listing rights?",
              a: "Organizers input their business email corresponding to the event directory domain. In addition, you can upload proof of incorporation, authorization letters, or official ID. The Super Admin team moderates and unlocks dashboard access once validated."
            },
            {
              q: "Are there any transaction fees for digital ticket sales?",
              a: "We do not charge transaction commissions. Ticket revenues are processed directly via your connected Stripe or payment gateway account, subject only to credit card processing fees."
            },
            {
              q: "Can I customize the visitor registration form fields?",
              a: "Yes. The onboarding and claim dashboards let you toggle custom fields (e.g. industry sector, job role, company size, telephone) to capture detailed profile fields that power the CRM lead scoring model."
            }
          ].map((item, index) => (
            <div key={index} className="border border-zinc-200/80 bg-zinc-50/20 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-800 hover:text-amber-600 transition-colors focus:outline-none"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${activeFaq === index ? 'rotate-180 text-amber-500' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 pt-1 text-xs text-zinc-650 leading-relaxed border-t border-zinc-150">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA BAR */}
      <section className="py-20 border-t border-zinc-100 relative bg-zinc-50/50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6 relative">
          <Logo className="h-16 w-16 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Ready to boost your expo footfall?</h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Claim your pre-loaded event directory item today, complete onboarding, and give your exhibitors a state-of-the-art lead experience.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding/organizer"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold px-8 py-4 text-sm transition-all"
            >
              Start Onboarding Wizard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-6 py-4 text-xs font-bold text-zinc-600 transition-all hover:text-zinc-900"
            >
              Access Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-150 bg-zinc-50 py-12 text-zinc-550">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <span className="text-sm font-black tracking-tight text-zinc-800">
              Visit<span className="text-amber-500">Expo</span>
            </span>
          </div>

          <p>© 2026 VisitExpo Inc. Connected with VisitExpo Event Directory. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-zinc-800 transition-colors">About us</a>
            <a href="#features" className="hover:text-zinc-800 transition-colors">Solution</a>
            <a href="#pricing" className="hover:text-zinc-800 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-zinc-800 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
