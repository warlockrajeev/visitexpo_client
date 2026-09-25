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
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../components/Navbar.js';
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
  ChevronDown,
  ShieldCheck,
  Tag,
  Bookmark,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Globe,
  Store,
  Layers,
  Award,
  Bell,
  BellRing,
  LocateFixed,
  Navigation,
  Loader2
} from 'lucide-react';
import {
  calculateDistanceKm,
  resolveEventCoordinates,
  detectUserLocation,
  formatDistance
} from '../../utils/geoUtils.js';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Authentication Guard: require logged-in account to view Explore Events
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?role=visitor&redirect=/events');
    }
  }, [user, authLoading, router]);

  // Events State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State (WordPress Directory 7-Input Spec)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('upcoming'); // 'upcoming' | 'rating' | 'turnout' | 'title'
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Proximity / Nearby State
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userCityName, setUserCityName] = useState('');

  // Save, Follow & Pass State
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [followedSlugs, setFollowedSlugs] = useState(new Set());
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

  // Load saved bookmarks and followed events from localStorage & backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        if (saved) setSavedEventIds(new Set(JSON.parse(saved)));
        const followed = localStorage.getItem('visitexpo_followed_events');
        if (followed) setFollowedSlugs(new Set(JSON.parse(followed)));
      } catch (_) {}
    }

    if (user?.email) {
      axios.get(`/api/engagements/user/${encodeURIComponent(user.email)}`)
        .then(res => {
          if (res.data?.success && res.data?.data) {
            const followedList = res.data.data.followedEvents || [];
            if (followedList.length > 0) {
              setFollowedSlugs(prev => {
                const merged = new Set(prev);
                followedList.forEach(e => {
                  const s = (e.eventSlug || e.slug || e.id || '').toLowerCase().trim();
                  if (s) merged.add(s);
                });
                return merged;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

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

  // Distinct states list from events
  const availableStates = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const st = (e.state || '').trim();
      if (st && st !== 'India' && st.toLowerCase() !== (e.city || '').toLowerCase()) {
        set.add(st);
      }
    });
    return Array.from(set).sort();
  }, [events]);

  // Distinct venues list from events
  const availableVenues = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const v = (e.venue || '').trim();
      if (v && v.toLowerCase() !== 'exhibition center' && v.toLowerCase() !== (e.city || '').toLowerCase()) {
        set.add(v);
      }
    });
    return Array.from(set).sort();
  }, [events]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let list = [...events];

    // Search Query (Enter Name ...)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.address && e.address.toLowerCase().includes(q)) ||
          (e.city && e.city.toLowerCase().includes(q)) ||
          (e.state && e.state.toLowerCase().includes(q)) ||
          (e.country && e.country.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Category Filter (All Categories)
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // State Filter (All States)
    if (selectedState && selectedState !== 'all') {
      list = list.filter((e) => (e.state || '').toLowerCase() === selectedState.toLowerCase());
    }

    // City Filter (All Cities)
    if (selectedCity && selectedCity !== 'all') {
      list = list.filter((e) => (e.city || '').toLowerCase() === selectedCity.toLowerCase());
    }

    // Venue Filter (All Venue)
    if (selectedVenue && selectedVenue !== 'all') {
      list = list.filter((e) => (e.venue || '').toLowerCase() === selectedVenue.toLowerCase());
    }

    // Date Filter (From .. To ...)
    if (fromDate) {
      const fTime = new Date(fromDate).getTime();
      if (!isNaN(fTime)) {
        list = list.filter((e) => {
          const sTime = e.startDate ? new Date(e.startDate).getTime() : 0;
          return sTime >= fTime;
        });
      }
    }
    if (toDate) {
      const tTime = new Date(toDate).getTime();
      if (!isNaN(tTime)) {
        list = list.filter((e) => {
          const eTime = e.endDate ? new Date(e.endDate).getTime() : (e.startDate ? new Date(e.startDate).getTime() : 0);
          return eTime <= tTime + 86400000;
        });
      }
    }

    // Featured Only Filter
    if (featuredOnly) {
      list = list.filter((e) => e.featured);
    }

    // Proximity / Nearby Distance Calculation & Sorting
    if (isNearbyActive && userLocation) {
      list = list.map((e) => {
        const coords = resolveEventCoordinates(e);
        const distanceKm = coords ? calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : null;
        return { ...e, distanceKm };
      });

      // Sort closest first
      list.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      // Standard Sorting
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
    }

    return list;
  }, [events, searchQuery, selectedCategory, selectedState, selectedCity, selectedVenue, fromDate, toDate, sortBy, featuredOnly, isNearbyActive, userLocation]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedState, selectedCity, selectedVenue, fromDate, toDate, sortBy, featuredOnly, isNearbyActive]);

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

  const handleToggleFollow = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    if (!slug) return;

    if (!user) {
      router.push('/login?role=visitor&redirect=/events');
      return;
    }

    const isFollowing = followedSlugs.has(slug);
    const nextFollowing = !isFollowing;

    setFollowedSlugs(prev => {
      const next = new Set(prev);
      if (nextFollowing) next.add(slug);
      else next.delete(slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_followed_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    showToast(
      nextFollowing
        ? `Now following ${evt.title}! Notifications active.`
        : `Unfollowed ${evt.title}.`
    );

    try {
      await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
        actionType: 'follower',
        eventTitle: evt.title,
        eventCity: evt.city,
        eventVenue: evt.venue,
        eventDates: evt.dates,
        eventCategory: evt.category,
        eventImage: evt.image,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company || user.organization?.name || '',
          phone: user.phone || ''
        }
      });
    } catch (err) {
      console.warn('Failed to sync follow state to server:', err);
    }
  };

  const handleGetPass = (evt) => {
    if (!user) {
      router.push('/login?role=visitor&redirect=/events');
    } else {
      const next = new Set(claimedPassIds);
      next.add(evt.id);
      setClaimedPassIds(next);
      showToast(`Free Pass confirmed for ${evt.title}!`);
    }
  };

  const handleToggleNearby = async () => {
    if (isNearbyActive) {
      setIsNearbyActive(false);
      return;
    }

    setIsDetectingLocation(true);
    try {
      const loc = await detectUserLocation();
      setUserLocation({ lat: loc.lat, lng: loc.lng });
      setUserCityName(loc.city || 'Your Location');
      setIsNearbyActive(true);
      showToast(`Showing exhibitions closest to ${loc.city || 'your location'}!`);
    } catch (err) {
      console.error('Failed to get location:', err);
      showToast('Could not detect location. Using default exhibition hub.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedVenue('all');
    setFromDate('');
    setToDate('');
    setSortBy('upcoming');
    setFeaturedOnly(false);
    setIsNearbyActive(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedState !== 'all' ||
    selectedCity !== 'all' ||
    selectedVenue !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    sortBy !== 'upcoming' ||
    featuredOnly ||
    isNearbyActive;

  // Unauthenticated session guard screen
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
            <Loader2 className="h-7 w-7 animate-spin text-[#FFCC00]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Sign in to Explore Events</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Redirecting you to login to access verified exhibitions, visitor passes, and exhibitor directories...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FFCC00] selection:text-zinc-950 pb-24">
      {/* Universal Navbar */}
      <Navbar solid={true} />

      {/* ========================================================================= */}
      {/* COMPACT DIRECTORY HEADER & SEARCH CONSOLE (NOT Full-Screen)               */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-zinc-200/80 pt-20 sm:pt-24 pb-5 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top Title & Metrics Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-zinc-800 font-semibold">Exhibitions Directory</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
                <span>Explore Trade Shows &amp; Expos</span>
              </h1>
            </div>

            {/* Live Count Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 self-start sm:self-auto shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{events.length > 0 ? `${events.length.toLocaleString()} Verified Live Expos` : '2,100+ Live Expos'}</span>
            </div>
          </div>

          {/* Unified Compact Search & Filters Console */}
          <div className="bg-zinc-50/90 border border-zinc-200 rounded-2xl p-2 sm:p-2.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-2.5 items-center">
              {/* 1. Keyword Search */}
              <div className="lg:col-span-5 relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by event, keyword, or venue..."
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-amber-400 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-xs text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 2. City Dropdown */}
              <div className="lg:col-span-3 relative flex items-center">
                <MapPin className="absolute left-3.5 h-4 w-4 text-rose-500 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-amber-400 transition-all cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="all">All Locations / Cities</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>

              {/* 3. Sort Dropdown */}
              <div className="lg:col-span-2 relative flex items-center">
                <SlidersHorizontal className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-amber-400 transition-all cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="rating">Top Rated</option>
                  <option value="turnout">Turnout</option>
                  <option value="title">A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>

              {/* 4. Find Expos Button */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('events-grid-anchor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black text-xs sm:text-sm transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Find Expos</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Chips Bar + Quick Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            {/* Horizontal Category Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 text-xs font-bold ${
                      active
                        ? 'bg-zinc-950 text-[#FFCC00] shadow-sm ring-1 ring-zinc-950'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Quick Tools on Right: Nearby, Featured & Reset */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleNearby}
                disabled={isDetectingLocation}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isNearbyActive
                    ? 'bg-[#FF2E63] text-white border-[#FF2E63]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title="Show exhibitions closest to your location"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                ) : (
                  <LocateFixed className={`h-3 w-3 ${isNearbyActive ? 'text-white' : 'text-[#FF2E63]'}`} />
                )}
                <span>Nearby</span>
              </button>

              <button
                type="button"
                onClick={() => setFeaturedOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                  featuredOnly
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 font-semibold'
                }`}
              >
                <Tag className="h-3 w-3 text-amber-500" />
                <span>Featured</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Event Cards Grid starts right here! */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        <div id="events-grid-anchor" className="scroll-mt-4" />

        {/* Results Count Line */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pb-1">
          <div>
            Showing{' '}
            <strong className="text-zinc-950 font-bold">
              {filteredEvents.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}
            </strong>{' '}
            of <strong className="text-zinc-950 font-bold">{filteredEvents.length.toLocaleString()}</strong> verified exhibitions
          </div>
        </div>

        {/* Proximity Filter Active Banner */}
        {isNearbyActive && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#FF2E63] text-white shadow-2xs">
                <Navigation className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="font-extrabold text-zinc-950">Nearby Exhibitions Active:</span>{' '}
                <span>
                  Showing expos sorted by shortest distance to <strong className="text-[#FF2E63] font-bold">{userCityName || 'your detected location'}</strong>.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNearbyActive(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-zinc-900 font-bold transition-all shadow-2xs cursor-pointer text-xs"
            >
              Show All Locations (Reset)
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EVENTS GRID - Cutting-Edge Next-Gen Cards (3 Columns)                     */}
        {/* ========================================================================= */}
        {loading ? (
          /* Modern Pulsing Skeleton Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs animate-pulse flex flex-col">
                <div className="aspect-[16/10] bg-zinc-200 w-full relative">
                  <div className="absolute top-3.5 left-3.5 h-6 w-24 bg-zinc-300 rounded-full" />
                  <div className="absolute top-3.5 right-3.5 h-6 w-28 bg-zinc-300 rounded-full" />
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-4 bg-zinc-200 rounded w-1/2" />
                    <div className="h-3 bg-zinc-200 rounded w-full" />
                    <div className="h-3 bg-zinc-200 rounded w-5/6" />
                  </div>
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="h-4 bg-zinc-200 rounded w-20" />
                    <div className="h-8 bg-zinc-200 rounded-xl w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-14 text-center space-y-4 shadow-sm max-w-xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-amber-500 border border-amber-200/80 shadow-2xs">
              <Search className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-zinc-950">No exhibitions match your search</h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Try searching with a broader keyword, or explore other categories and cities to discover exciting trade shows.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#FFCC00] text-xs font-black transition-all shadow-md cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {paginatedEvents.map((evt, idx) => {
              const eventSlug = evt.slug || evt.id;
              const isSaved = savedEventIds.has(evt.id);
              const isClaimed = claimedPassIds.has(evt.id);
              const wpImg =
                wpEventImages[String(evt.slug || '').toLowerCase()] ||
                wpEventImages[String(evt.id)] ||
                wpEventImages[String(evt.wpPostId)] ||
                evt.image ||
                'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';

              return (
                <article
                  key={evt.id || idx}
                  className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden hover:border-amber-400/80 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col group relative"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    <img
                      src={wpImg}
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      onError={(e) => {
                        e.currentTarget.src =
                          evt.fallbackImage || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                      }}
                    />

                    {/* Gradient Overlay for Crisp Badge Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35 pointer-events-none" />

                    {/* Top Badges Row */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                      {/* Category Badge on Left */}
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-zinc-950/80 text-white shadow-lg border border-white/20 backdrop-blur-md">
                        {evt.category || 'Trade Show'}
                      </span>

                      {/* Free Visitor Pass Badge + Bookmark Button on Right */}
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#FFCC00] to-amber-400 text-zinc-950 shadow-lg tracking-tight">
                          Free Visitor Pass
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleSave(evt.id);
                          }}
                          className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95 ${
                            isSaved
                              ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                              : 'bg-black/40 text-white hover:bg-black/70'
                          }`}
                          aria-label="Save exhibition"
                          title={isSaved ? 'Saved in bookmarks' : 'Save event'}
                        >
                          <Bookmark className={`h-3 w-3 ${isSaved ? 'fill-white' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Dates in warm orange/amber with calendar icon */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{evt.dates || 'Upcoming 2026'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-zinc-950 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
                        <Link href={`/expo/${eventSlug}`}>
                          {evt.title}
                        </Link>
                      </h2>

                      {/* Location / Venue with MapPin */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium" title={evt.address || evt.venue || evt.city}>
                        <MapPin className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
                        <span className="truncate">
                          {evt.venue && evt.venue.toLowerCase() !== evt.city?.toLowerCase() && evt.venue.toLowerCase() !== 'exhibition center' ? (
                            <>
                              <span className="font-bold text-zinc-800">{evt.venue}</span>
                              <span className="text-zinc-500">, {evt.city || 'India'}</span>
                            </>
                          ) : (
                            `${evt.city || 'Global'}${evt.state && evt.state !== evt.city ? `, ${evt.state}` : ''}${evt.country ? `, ${evt.country}` : ''}`
                          )}
                        </span>
                        {isNearbyActive && evt.distanceKm != null && (
                          <span className="shrink-0 ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-[#FF2E63] border border-rose-200">
                            <Navigation className="h-2.5 w-2.5" />
                            {formatDistance(evt.distanceKm)}
                          </span>
                        )}
                      </div>

                      {/* Concise 2-line Description */}
                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed min-h-[34px]">
                        {evt.description || `Explore ${evt.title}, featuring international exhibitors, product showcases, and B2B business networking.`}
                      </p>
                    </div>

                    {/* Footer Row: [Country] on Left, [Exhibit • Get Pass →] on Right */}
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                      {/* Left: Country / City with Globe */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-semibold truncate max-w-[130px]">
                        <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{evt.country || evt.city || 'International'}</span>
                      </div>

                      {/* Right: Exhibit • Get Pass → */}
                      <div className="flex items-center gap-2">
                        <Link
                          href="/login?role=exhibitor&signup=true"
                          className="text-xs font-black text-[#FF2E63] hover:text-[#d91e52] hover:underline transition-colors px-1 py-0.5 cursor-pointer"
                        >
                          Exhibit
                        </Link>
                        <span className="text-zinc-300 font-bold">•</span>
                        <button
                          type="button"
                          onClick={() => handleGetPass(evt)}
                          className="cursor-pointer"
                        >
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Pass Issued
                            </span>
                          ) : (
                            <span className="group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 text-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 font-black text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                              <span>Get Pass</span>
                              <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </span>
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
        {/* PAGINATION CONTROLS (Modern & Sleek)                                      */}
        {/* ========================================================================= */}
        {totalPages > 1 && (
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-medium">
              Page <strong className="text-zinc-950 font-bold">{currentPage}</strong> of{' '}
              <strong className="text-zinc-950 font-bold">{totalPages}</strong> ({filteredEvents.length.toLocaleString()} total exhibitions)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
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
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className={`h-9 w-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-zinc-950 text-[#FFCC00] shadow-md shadow-zinc-950/20'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
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
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ORGANIZER CTA CARD (Eye-Catchy Dark Gradient Glass)                       */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-white overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Ambient Glow */}
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#FFCC00]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 text-center md:text-left relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFCC00] text-zinc-950 inline-block shadow-md">
              ★ For Exhibition Organizers &amp; Venue Owners
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Are you organizing a trade show or B2B expo?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              List your exhibition on VisitExpo to showcase your floorplan, capture attendee pre-registrations, and connect directly with verified exhibitors worldwide.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <Link
              href="/login?role=organizer&signup=true"
              className="px-6 py-3.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>List or Claim Your Expo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>



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
