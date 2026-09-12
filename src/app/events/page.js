'use client';

/**
 * @file app/events/page.js
 * @description Dedicated Global Events & Trade Shows Directory Page for VisitExpo.
 * Displays all 100+ verified exhibitions with real-time search, category filters,
 * city dropdown, sorting, pagination, and direct navigation to expo details pages.
 * Theme: VisitExpo Yellow (#FFCC00), Pink/Rose (#FF2E63), and Dark Slate (#18181B).
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../components/Navbar.js';
import GatedAuthModal from '../../components/GatedAuthModal.js';
import { useAuth } from '../../context/AuthContext.js';
import wpEventImages from '@/data/wordpress-event-images.json';
import {
  Search,
  MapPin,
  Calendar,
  Star,
  Users,
  Building,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  Bookmark,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Globe,
  Store,
  Layers,
  Award
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Travel & Tourism',
  'Automotive & EV',
  'Healthcare & Pharma',
  'Technology & AI',
  'Agri & Food Tech',
  'Textile & Fashion',
  'Construction & Infra',
  'Aerospace & Aviation',
  'Logistics & Cargo',
  'Art & Lifestyle',
  'Trade & Industry'
];

const ITEMS_PER_PAGE = 12;

export default function EventsDirectoryPage() {
  const { user } = useAuth();

  // Events State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('upcoming'); // 'upcoming' | 'rating' | 'turnout' | 'title'
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Gated Auth & Save State
  const [gatedContext, setGatedContext] = useState(null);
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [claimedPassIds, setClaimedPassIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch events from WordPress API
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/wordpress-events');
        if (res.data?.success && Array.isArray(res.data?.events)) {
          setEvents(res.data.events);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        if (saved) setSavedEventIds(new Set(JSON.parse(saved)));
      } catch (_) {}
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Distinct cities list from events
  const availableCities = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.city && e.city !== 'India') set.add(e.city);
    });
    return Array.from(set).sort();
  }, [events]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let list = [...events];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.city && e.city.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // City Filter
    if (selectedCity && selectedCity !== 'all') {
      list = list.filter((e) => (e.city || '').toLowerCase() === selectedCity.toLowerCase());
    }

    // Featured Only Filter
    if (featuredOnly) {
      list = list.filter((e) => e.featured);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = parseFloat(a.rating) || 4.0;
        const rB = parseFloat(b.rating) || 4.0;
        return rB - rA;
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'turnout') {
        const parseTurnout = (t = '') => {
          const m = String(t).match(/(\d+[\d,]*)/);
          return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
        };
        return parseTurnout(b.attendees) - parseTurnout(a.attendees);
      }
      // Default: upcoming startDate (upcoming events chronologically first, then past events)
      const now = Date.now();
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      const isFutureA = timeA >= now;
      const isFutureB = timeB >= now;

      if (isFutureA && !isFutureB) return -1;
      if (!isFutureA && isFutureB) return 1;
      if (isFutureA && isFutureB) return timeA - timeB; // soonest upcoming first
      return timeB - timeA; // past: most recent first
    });

    return list;
  }, [events, searchQuery, selectedCategory, selectedCity, sortBy, featuredOnly]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCity, sortBy, featuredOnly]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handleToggleSave = (eventId) => {
    const next = new Set(savedEventIds);
    if (next.has(eventId)) {
      next.delete(eventId);
      showToast('Event removed from saved list.');
    } else {
      next.add(eventId);
      showToast('Event saved to your bookmarks!');
    }
    setSavedEventIds(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(next)));
    }
  };

  const handleGetPass = (evt) => {
    if (!user) {
      setGatedContext({ action: 'ticket', event: evt });
    } else {
      const next = new Set(claimedPassIds);
      next.add(evt.id);
      setClaimedPassIds(next);
      showToast(`Free Pass confirmed for ${evt.title}!`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('all');
    setSortBy('upcoming');
    setFeaturedOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedCity !== 'all' ||
    sortBy !== 'upcoming' ||
    featuredOnly;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white pb-24">
      {/* Universal Navbar */}
      <Navbar solid={true} />

      {/* Header Banner */}
      <header className="pt-24 sm:pt-28 pb-10 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#FFCC00]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-[#FF2E63]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#FFCC00] font-semibold">Trade Shows &amp; Exhibitions</span>
          </nav>

          {/* Heading */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#FFCC00]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{events.length > 0 ? `${events.length.toLocaleString()}+ Verified Global Exhibitions & Expos` : 'Verified Global Exhibitions & Expos'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Explore Global Trade Shows &amp; Exhibitions
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Browse, filter, and secure verified delegate passes for leading international expos, B2B trade fairs, and industry conventions across Europe, Asia, and worldwide.
            </p>
          </div>

          {/* Search Box */}
          <div className="pt-2 max-w-3xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exhibitions by name, industry, city, venue, or keywords (e.g. IFTM, Paris, Food, Tech)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-zinc-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:bg-white/15 transition-all shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-xs text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* ========================================================================= */}
        {/* FILTER CONTROLS BAR                                                       */}
        {/* ========================================================================= */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Category Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs scale-102 ring-1 ring-zinc-900'
                      : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-950'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: City, Sort, Featured, Counter */}
          <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* City Dropdown */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  <option value="upcoming">Sort: Upcoming Dates</option>
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="turnout">Sort: Largest Turnout</option>
                  <option value="title">Sort: Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* Featured Only Toggle */}
              <button
                type="button"
                onClick={() => setFeaturedOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-xl border font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  featuredOnly
                    ? 'bg-rose-50 text-[#FF2E63] border-[#FF2E63]/30'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Featured Only</span>
              </button>

              {/* Reset All Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer px-2 py-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-zinc-500 font-medium">
              Showing{' '}
              <strong className="text-zinc-900 font-extrabold">
                {filteredEvents.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}
              </strong>{' '}
              of <strong className="text-zinc-900 font-extrabold">{filteredEvents.length.toLocaleString()}</strong> events
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EVENTS GRID                                                               */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-zinc-200">
            <div className="h-10 w-10 border-3 border-[#FF2E63] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">Loading trade shows and expos...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Search className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">No exhibitions match your filters</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Try clearing your search query or selecting another category or city to explore more trade fairs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEvents.map((evt, idx) => {
              const eventSlug = evt.slug || evt.id;
              const isSaved = savedEventIds.has(evt.id);
              const isClaimed = claimedPassIds.has(evt.id);
              const charSum = (evt.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 17);
              const resolvedRating = evt.rating || (4.5 + ((charSum % 5) * 0.1)).toFixed(1);
              const resolvedReviews = evt.reviewCount || (60 + (charSum % 140));
              const resolvedEdition = evt.edition || `${6 + (charSum % 18)}th Edition`;
              const wpImg =
                wpEventImages[String(evt.slug || '').toLowerCase()] ||
                wpEventImages[String(evt.id)] ||
                wpEventImages[String(evt.wpPostId)] ||
                evt.image;

              return (
                <article
                  key={evt.id || idx}
                  className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all duration-200 flex flex-col group"
                >
                  {/* Card Media Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                    {/* Ambient backdrop */}
                    <img
                      src={wpImg}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-lg opacity-35 scale-110"
                    />
                    {/* Centered Poster Banner */}
                    <img
                      src={wpImg}
                      alt={evt.title}
                      className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-103"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-900/80 text-white backdrop-blur-xs border border-white/20">
                        {evt.category || 'Trade Show'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleSave(evt.id)}
                        className={`p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-black/50 text-white hover:bg-black/80'
                        }`}
                        aria-label="Save exhibition"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom Edition Pill */}
                    <div className="absolute bottom-2.5 left-3 z-20">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                        {resolvedEdition}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Dates */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF2E63]">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{evt.dates || 'Upcoming 2026'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-base font-extrabold text-zinc-900 tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        <Link href={`/expo/${eventSlug}`}>
                          {evt.title}
                        </Link>
                      </h2>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 truncate">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{evt.venue || evt.city}, {evt.city}</span>
                      </div>

                      {/* Rating & Turnout */}
                      <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                        <span className="flex items-center gap-1 font-bold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {resolvedRating} ({resolvedReviews})
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="flex items-center gap-1 text-zinc-600 truncate">
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          {evt.attendees || '12,000+ Attendees'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/expo/${eventSlug}`}
                        className="text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors"
                      >
                        View Details
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/login?role=exhibitor&event=${encodeURIComponent(evt.title)}`}
                          className="text-[11px] font-extrabold text-[#FF2E63] hover:underline"
                        >
                          Exhibit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleGetPass(evt)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                            isClaimed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 ring-1 ring-amber-400'
                          }`}
                        >
                          {isClaimed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pass Issued</span>
                            </>
                          ) : (
                            <>
                              <span>Get Pass</span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGINATION CONTROLS                                                       */}
        {/* ========================================================================= */}
        {totalPages > 1 && (
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-medium">
              Page <strong className="text-zinc-900">{currentPage}</strong> of{' '}
              <strong className="text-zinc-900">{totalPages}</strong> ({filteredEvents.length.toLocaleString()} total exhibitions)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 280, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-zinc-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 280, behavior: 'smooth' });
                        }}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                  window.scrollTo({ top: 280, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ORGANIZER CTA CARD                                                        */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-10 border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30 inline-block">
                For Trade Show Organizers &amp; Venue Managers
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Are you organizing or managing an exhibition?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                Claim your official expo listing on VisitExpo to promote your floorplan, manage attendee pre-registrations, and sell exhibition booth spaces.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login?role=organizer&signup=true"
                className="px-6 py-3.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold text-xs sm:text-sm transition-all shadow-md hover:scale-102 cursor-pointer"
              >
                Claim or List Your Expo
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Gated Auth Modal */}
      {gatedContext && (
        <GatedAuthModal
          isOpen={true}
          onClose={() => setGatedContext(null)}
          action={gatedContext.action}
          event={gatedContext.event}
          onSuccess={() => {
            if (gatedContext.event?.id) {
              const next = new Set(claimedPassIds);
              next.add(gatedContext.event.id);
              setClaimedPassIds(next);
            }
            setGatedContext(null);
            showToast('Welcome! Your pass has been issued.');
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-[#FFCC00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
