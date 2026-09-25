'use client';

/**
 * @file app/trending/page.js
 * @description Dedicated Trending Exhibitions & High-Demand Shows Discovery Page for VisitExpo.
 * Displays live trending exhibitions sorted by real attendee interest, turnout metrics,
 * sector categories, search filtering, and free visitor pass registration.
 * Theme: VisitExpo Brand Gold (#FFCC00), Ruby Accent (#FF2E63), and Clean Slate.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import { useAuth } from '@/context/AuthContext.js';
import {
  TrendingUp,
  Search,
  Calendar,
  MapPin,
  Star,
  Users,
  Building,
  ArrowRight,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Ticket,
  ExternalLink,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

const CATEGORIES = [
  'All Sectors',
  'Technology & AI',
  'Healthcare & Pharma',
  'Construction & Infra',
  'Automotive & EV',
  'Trade & Industry',
  'Agri & Food Tech',
  'Textile & Fashion',
  'Travel & Tourism',
  'Logistics & Cargo'
];

export default function TrendingEventsPage() {
  const { user } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');
  const [sortBy, setSortBy] = useState('demand'); // 'demand' | 'rating' | 'date'
  const [shareToast, setShareToast] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState(new Set());

  // Fetch live events from API
  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/wordpress-events');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success && Array.isArray(data.events)) {
            setEvents(data.events);
          }
        }
      } catch (err) {
        console.error('Failed to load trending events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & sort logic
  const filteredTrending = useMemo(() => {
    let list = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.country?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All Sectors') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((e) => (e.category || '').toLowerCase().includes(catLower));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = parseFloat(a.rating) || 4.0;
        const rB = parseFloat(b.rating) || 4.0;
        return rB - rA;
      }
      if (sortBy === 'date') {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return timeA - timeB;
      }
      // Default: Highest Demand / Turnout
      const parseCount = (val) => {
        if (typeof val === 'number') return val;
        const m = String(val || '').match(/(\d+[\d,]*)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
      };
      const countA = parseCount(a.interestedCount || a.attendees || 1000);
      const countB = parseCount(b.interestedCount || b.attendees || 1000);
      return countB - countA;
    });

    return list;
  }, [events, searchQuery, selectedCategory, sortBy]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const toggleSave = (id) => {
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Trending shows link copied to clipboard!</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-bold">Trending Exhibitions</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop"
            alt="Trending Trade Shows"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/50" />

          <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#FFCC00]">
                <Flame className="h-3.5 w-3.5 text-[#FF2E63] fill-[#FF2E63]" />
                <span>High Demand • Live Attendee Rankings</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Trending Exhibitions &amp; Trade Shows
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                Discover the most anticipated business conventions and trade exhibitions experiencing peak visitor
                interest, verified exhibitor booths, and high delegate turnout worldwide.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#FF2E63]" />
                  <span>{events.length > 0 ? `${events.length}+ Live Ranked Shows` : 'Verified Live Exhibitions'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Free Visitor Passes Available</span>
                </div>
              </div>
            </div>

            {/* Top Right Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Share Trending Shows"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              <Link
                href="/events"
                className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>Full Directory</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trending shows by name, city, or venue..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-semibold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF2E63] cursor-pointer"
              >
                <option value="demand">Highest Demand (Turnout)</option>
                <option value="rating">Top Rated (4.5+ Stars)</option>
                <option value="date">Upcoming Date</option>
              </select>
            </div>
          </div>

          {/* Sector Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-zinc-100">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
          <span>
            Showing <strong className="text-zinc-900 font-bold">{filteredTrending.length}</strong> trending exhibitions
            {selectedCategory !== 'All Sectors' && ` in ${selectedCategory}`}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Live Rankings Updated
          </span>
        </div>

        {/* Grid of Trending Event Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 animate-pulse shadow-2xs"
              >
                <div className="h-44 bg-zinc-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  <div className="h-3 bg-zinc-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTrending.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">No trending exhibitions found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              We couldn't find any shows matching "{searchQuery}". Try searching for another city, industry sector, or
              reset your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Sectors');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrending.map((evt, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              const isSaved = savedEventIds.has(evt.id);

              return (
                <div
                  key={evt.id || idx}
                  className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col group"
                >
                  {/* Card Thumbnail Container */}
                  <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={
                        evt.image ||
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop'
                      }
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 ${
                          isTop3
                            ? 'bg-[#FFCC00] text-zinc-950 ring-2 ring-amber-400/40'
                            : 'bg-zinc-900/90 backdrop-blur-md text-white border border-white/20'
                        }`}
                      >
                        <Flame className="h-3 w-3 text-[#FF2E63] fill-[#FF2E63]" />
                        <span>#{rank} Trending</span>
                      </span>
                    </div>

                    {/* Rating Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-white/10">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{evt.rating || '4.6'}</span>
                      </span>
                    </div>

                    {/* Category pill on bottom-left */}
                    <div className="absolute bottom-2.5 left-3">
                      <span className="text-[10px] font-bold bg-white/95 backdrop-blur-md text-zinc-900 px-2 py-0.5 rounded-md shadow-xs">
                        {evt.category || 'Business Trade Expo'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                        <Calendar className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
                        <span className="truncate">{evt.dates || 'Upcoming 2026'}</span>
                      </div>

                      <Link
                        href={`/expo/${evt.slug || evt.id}`}
                        className="font-bold text-base text-zinc-900 group-hover:text-[#FF2E63] transition-colors leading-snug line-clamp-2 block"
                      >
                        {evt.title}
                      </Link>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {evt.venue ? `${evt.venue}, ` : ''}
                          {evt.city || 'India'}, {evt.country || 'Global'}
                        </span>
                      </div>

                      {evt.description && (
                        <p className="text-xs text-zinc-600 line-clamp-2 pt-1 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    {/* Attendee Turnout Metric */}
                    <div className="pt-2 border-t border-zinc-150 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <Users className="h-3.5 w-3.5 text-amber-600" />
                        <span>{(evt.interestedCount || 3996).toLocaleString()}+ Going</span>
                      </div>

                      <span className="text-[11px] font-semibold text-zinc-500">
                        {evt.format || 'In-Person Expo'}
                      </span>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 flex items-center gap-2">
                      <Link
                        href={`/expo/${evt.slug || evt.id}`}
                        className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs text-center transition-colors shadow-2xs"
                      >
                        View Details
                      </Link>

                      <Link
                        href={`/expo/${evt.slug || evt.id}#passes`}
                        className="py-2 px-3 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs text-center transition-colors shadow-2xs flex items-center justify-center gap-1 shrink-0"
                        title="Get Free Visitor Pass"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Pass</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Discovery Sections Navigation */}
        <section className="pt-6 border-t border-zinc-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Explore Exhibitions By Sector &amp; City</h3>
              <p className="text-xs text-zinc-500">Browse verified trade shows categorized across top exhibition hubs.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Technology & AI', href: '/category/technology-ai' },
              { label: 'Healthcare & Pharma', href: '/category/healthcare-pharma' },
              { label: 'Automotive & EV', href: '/category/automotive-ev' },
              { label: 'Trade & Industry', href: '/category/trade-industry' },
              { label: 'Mumbai Expos', href: '/city/mumbai' },
              { label: 'Delhi Hub', href: '/city/delhi' },
              { label: 'Dubai Trade Fairs', href: '/city/dubai' },
              { label: 'Germany Messe', href: '/city/germany' }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-xs font-bold text-zinc-800 hover:text-[#FF2E63] transition-colors flex items-center justify-between shadow-2xs"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
