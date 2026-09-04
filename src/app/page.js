'use client';

/**
 * @file page.js
 * @description Minimalist, high-end Event Management & Expo Discovery Platform Landing Page for VisitExpo.
 * Fetches events directly from visitexpo.in.
 * Palette: Pure White canvas, VisitExpo Yellow (#FFCC00), and vibrant Pink (#FF2E63).
 */

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Ticket,
  ChevronDown,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle,
  Building,
  Store,
  Layers,
  ExternalLink,
  Globe,
  Loader2
} from 'lucide-react';
import axios from 'axios';

// VisitExpo Circular Logo
const Logo = ({ className = "w-9 h-9" }) => (
  <img
    src="/logo.png"
    alt="VisitExpo Logo"
    className={`${className} object-contain`}
  />
);

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // WordPress Events State
  const [events, setEvents] = useState([]);
  const [isFetchingWp, setIsFetchingWp] = useState(true);
  const [wpSource, setWpSource] = useState('wordpress_direct');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');

  // Claim Quick Search State
  const [claimSearch, setClaimSearch] = useState('');

  // Contact Form State
  const [contactRole, setContactRole] = useState('Organizer');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch events directly from WordPress website via route handler
  useEffect(() => {
    const fetchWordPressEvents = async () => {
      setIsFetchingWp(true);
      try {
        const res = await axios.get('/api/wordpress-events');
        if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
          setEvents(res.data.events);
          setWpSource(res.data.source || 'wordpress_direct');
        }
      } catch (err) {
        console.error('Failed to fetch WordPress events:', err);
      } finally {
        setIsFetchingWp(false);
      }
    };
    fetchWordPressEvents();
  }, []);

  // Distinct cities list from live WordPress events
  const availableCities = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.city && e.city !== 'India') set.add(e.city);
    });
    return Array.from(set);
  }, [events]);

  // Distinct categories list from live WordPress events
  const availableCategories = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.city?.toLowerCase().includes(q) ||
          item.venue?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedCity && selectedCity !== 'All Cities') {
        if (!item.city?.toLowerCase().includes(selectedCity.toLowerCase()) && !item.venue?.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }
      if (selectedCategory && selectedCategory !== 'All Categories') {
        if (!item.category?.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      if (activeCategoryTab !== 'all') {
        if (activeCategoryTab === 'automotive' && !item.category?.toLowerCase().includes('auto')) return false;
        if (activeCategoryTab === 'logistics' && !item.category?.toLowerCase().includes('logistics') && !item.category?.toLowerCase().includes('cargo')) return false;
        if (activeCategoryTab === 'aerospace' && !item.category?.toLowerCase().includes('aero') && !item.category?.toLowerCase().includes('aviation')) return false;
        if (activeCategoryTab === 'healthcare' && !item.category?.toLowerCase().includes('health')) return false;
        if (activeCategoryTab === 'tech' && !item.category?.toLowerCase().includes('tech') && !item.category?.toLowerCase().includes('ai')) return false;
        if (activeCategoryTab === 'construction' && !item.category?.toLowerCase().includes('construct') && !item.category?.toLowerCase().includes('infra')) return false;
      }
      if (quickFilter === 'upcoming' && !item.upcoming) return false;
      if (quickFilter === 'featured' && !item.featured) return false;
      if (quickFilter === 'free' && !item.entryType?.toLowerCase().includes('free')) return false;

      return true;
    });
  }, [events, searchQuery, selectedCity, selectedCategory, activeCategoryTab, quickFilter]);

  // Display only recent 6 events on the landing page
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, 6);
  }, [filteredEvents]);

  // Claim filtered events
  const claimMatches = useMemo(() => {
    if (!claimSearch.trim()) return [];
    const q = claimSearch.toLowerCase();
    return events.filter(e => e.title?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q)).slice(0, 5);
  }, [events, claimSearch]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Logo className="h-12 w-12 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">

      {/* ========================================================================= */}
      {/* 1 & 2. HERO & NAVBAR CONTAINER (Continuous Event Management Background)    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800">
        
        {/* Continuous Background Image & Dark Overlays spanning Navbar & Hero */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/hero-event-bg.jpg"
            alt="Event Management & Expo Background"
            className="w-full h-full object-cover object-center scale-105 filter brightness-70"
          />
          {/* Multi-layered dark overlay for high contrast and conference atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-transparent to-black/75" />
        </div>

        {/* Navbar (Seamless over background image, no separate background, no bottom border) */}
        <header className="relative z-20 w-full text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Logo className="h-14 w-14 sm:h-16 sm:w-16 transition-transform duration-200 group-hover:scale-105 drop-shadow-md" />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-200">
              <a href="#events" className="hover:text-white transition-colors">Explore Events</a>
              <Link href="/onboarding/organizer" className="hover:text-white transition-colors">For Organizers</Link>
              <Link href="/onboarding/exhibitor" className="hover:text-white transition-colors">For Exhibitors</Link>
              <a href="#claim" className="hover:text-white transition-colors">Claim Listing</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?signup=true"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2 text-xs transition-colors shadow-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20 md:pt-10 md:pb-28 text-center space-y-6">
          
          {/* Live Sync Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-white border border-white/20 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Connected to <strong className="text-white">visitexpo.in</strong>
              {events.length > 0 && ` • ${events.length} Live Events`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            Discover Upcoming Trade Shows &amp; Exhibitions in <span className="text-amber-400">India</span> and <span className="text-[#FF2E63]">Worldwide</span>
          </h1>

          <p className="text-sm sm:text-lg text-zinc-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
            Experience Expos Like Never Before—In-Person or Virtually. Connect directly with event organizers, book verified exhibitor booths, and register for digital passes.
          </p>

          {/* Hero CTAs */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#events"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-7 py-3 text-xs sm:text-sm transition-all shadow-md hover:scale-102"
            >
              <span>Explore Exhibitions</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/onboarding/organizer"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold px-7 py-3 text-xs sm:text-sm transition-all shadow-sm hover:scale-102"
            >
              For Organizers
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THREE PERSONA ONBOARDING CARDS                                         */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">How would you like to participate?</h2>
          <p className="text-xs sm:text-sm text-zinc-500">VisitExpo bridges organizers, exhibitors, and trade visitors on a single platform.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Organizers Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-400 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">For Organizers</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Claim your pre-loaded exhibition listing from visitexpo.in, configure tickets, publish interactive booth maps, and sync attendees in real-time.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/onboarding/organizer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <span>Onboard as Organizer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Exhibitors Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between hover:border-pink-300 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-50 text-[#FF2E63] flex items-center justify-center border border-pink-200">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">For Exhibitors</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Reserve prime booth spaces, manage your digital product catalog, register booth staff, and scan visitor leads via QR.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/onboarding/exhibitor"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF2E63] hover:text-[#E82054]"
              >
                <span>Register as Exhibitor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Visitors Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200">
                <Ticket className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">For Visitors &amp; Buyers</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Discover upcoming trade exhibitions across India and worldwide, get free visitor badges, and schedule B2B meetings.
              </p>
            </div>
            <div className="pt-6">
              <a
                href="#events"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:text-zinc-950"
              >
                <span>Browse Free Passes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE WORDPRESS EVENT DIRECTORY GRID                                    */}
      {/* ========================================================================= */}
      <section id="events" className="py-16 bg-zinc-50/50 border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Featured Exhibitions</h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Directory Feed
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Showing recent {displayedEvents.length} events directly from <strong className="text-zinc-800">visitexpo.in</strong>
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'automotive', label: 'EV & Automotive' },
                { id: 'tech', label: 'Tech & AI' },
                { id: 'construction', label: 'Construction & Infra' },
                { id: 'logistics', label: 'Logistics' },
                { id: 'healthcare', label: 'Healthcare' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeCategoryTab === tab.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {isFetchingWp && (
            <div className="flex items-center justify-center py-12 gap-2 text-xs text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF2E63]" />
              <span>Fetching live events directly from visitexpo.in...</span>
            </div>
          )}

          {/* Cards Grid */}
          {!isFetchingWp && displayedEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No events found matching your search.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((expo) => (
                <div
                  key={expo.id}
                  className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full bg-zinc-100">
                    <img src={expo.image} alt={expo.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {expo.category}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-[#FFCC00] text-zinc-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-xs">
                      {expo.entryType}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{expo.dates}</span>
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 line-clamp-1" title={expo.title}>
                        {expo.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{expo.venue}</span>
                      </div>
                      {expo.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed pt-1">
                          {expo.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-medium">{expo.city}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/onboarding/exhibitor?wp_slug=${encodeURIComponent(expo.slug || '')}&wp_post_id=${expo.wpPostId || ''}`}
                          className="text-xs font-bold text-[#FF2E63] hover:underline"
                        >
                          Exhibit
                        </Link>
                        <span className="text-zinc-300">•</span>
                        <Link
                          href={`/login?signup=true&event=${encodeURIComponent(expo.slug || '')}`}
                          className="text-xs font-bold text-zinc-800 hover:underline"
                        >
                          Get Pass &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All on visitexpo.in CTA */}
          {filteredEvents.length > 6 && (
            <div className="pt-4 flex justify-center">
              <a
                href="https://visitexpo.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold px-6 py-2.5 text-xs transition-colors shadow-2xs"
              >
                <span>View All {events.length}+ Events on visitexpo.in</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DIRECTORY CLAIM FOR ORGANIZERS (Search from live WP events)            */}
      {/* ========================================================================= */}
      <section id="claim" className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">For Event Organizers</span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Claim Your Pre-Loaded Event Listing</h2>
            <p className="text-xs text-zinc-600">
              Is your exhibition already listed on visitexpo.in? Search below to claim ownership and take control of ticketing and exhibitor spaces.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search your event (e.g. Municipalika, Art Festival, Airport)..."
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
              />
            </div>

            {/* Claim Match Results dropdown */}
            {claimMatches.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-2 text-left space-y-1.5 shadow-md">
                {claimMatches.map(m => (
                  <div key={m.id} className="p-2 hover:bg-zinc-50 rounded-lg flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="text-xs font-bold text-zinc-900 truncate">{m.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{m.venue}</div>
                    </div>
                    <Link
                      href={`/onboarding/organizer?wp_slug=${encodeURIComponent(m.slug || '')}&wp_post_id=${m.wpPostId || ''}`}
                      className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md shrink-0 transition-colors"
                    >
                      Claim &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {!claimSearch && (
              <Link
                href="/onboarding/organizer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-4 py-2 text-xs transition-colors"
              >
                <span>Launch Organizer Onboarding</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CONTACT & ONBOARDING FORM                                              */}
      {/* ========================================================================= */}
      <section id="contact" className="py-16 bg-white border-t border-zinc-150">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            
            {/* Left: Contact Info */}
            <div className="md:col-span-5 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2E63]">Direct Assistance</span>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Contact the VisitExpo Team</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Have questions about onboarding your trade show, booking exhibitor booths, or custom ticketing? Reach out directly.
              </p>

              <div className="pt-2 space-y-3 text-xs text-zinc-700">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <a href="mailto:support@visitexpo.in" className="font-semibold hover:text-[#FF2E63]">support@visitexpo.in</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a href="tel:+919876543210" className="font-semibold hover:text-[#FF2E63]">+91 (0) 11 4987 6543</a>
                </div>
              </div>

              <div className="pt-3">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 text-xs transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right: Simple Inquiry Form */}
            <div className="md:col-span-7 bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              {contactSubmitted ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-900">Inquiry Sent Successfully</h4>
                  <p className="text-xs text-zinc-500">We will get back to you within 2 business hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">I am an:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Organizer', 'Exhibitor', 'Visitor'].map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setContactRole(r)}
                          className={`py-1.5 rounded-lg font-bold border transition-colors ${
                            contactRole === r ? 'bg-[#FF2E63] text-white border-[#FF2E63]' : 'bg-white text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Vikram Malhotra"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="vikram@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Message / Requirements</label>
                    <textarea
                      rows={3}
                      placeholder="How can we assist you with your expo or onboarding?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold py-2.5 text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ ACCORDION                                                          */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-2 text-xs">
          {[
            {
              q: "How do I claim or publish an event on VisitExpo?",
              a: "Organizers can search for their event above or click 'Onboard as Organizer'. Once your business email is verified, you gain instant dashboard access to manage schedules, tickets, and floorplans."
            },
            {
              q: "How can exhibitors book booths and collect visitor leads?",
              a: "Exhibitors can click 'Register as Exhibitor' on any listed expo. Once approved, your team receives an Exhibitor Hub login with QR lead scanner capabilities."
            },
            {
              q: "Are visitor entry passes complimentary?",
              a: "Yes! Most trade exhibitions on VisitExpo offer free digital entry passes for industry professionals and trade buyers. Simply register to receive your instant digital badge."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-4 py-3 text-left flex items-center justify-between font-bold text-zinc-800 hover:text-zinc-950 cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <p className="px-4 pb-3 pt-1 text-zinc-600 leading-relaxed border-t border-zinc-100">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-10 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold text-zinc-800">VisitExpo</span>
            <span>• Powering trade exhibitions worldwide.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/onboarding/organizer" className="hover:text-zinc-800">Organizers</Link>
            <Link href="/onboarding/exhibitor" className="hover:text-zinc-800">Exhibitors</Link>
            <Link href="/login" className="hover:text-zinc-800">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
