'use client';

/**
 * @file app/recommendations/page.js
 * @description Dedicated AI-Powered Event Recommendations & Personalized Discovery Feed for VisitExpo.
 * Suggests relevant trade exhibitions, B2B expos, and global summits based on:
 * - User geographic location & proximity
 * - Multi-select industry & category interests
 * - Schedule timing & recency
 * - Turnout & organizer credibility
 *
 * Theme: VisitExpo Yellow (#FFCC00), Pink (#FF2E63), and Clean Modern Slate.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import EventPassAvailability from '@/components/EventPassAvailability.js';
import StableEventImage from '@/components/StableEventImage.js';
import { sortEventsByStartDate } from '@/utils/eventDates.js';
import { useAuth } from '@/context/AuthContext.js';
import axios from 'axios';
import {
  MapPin,
  Calendar,
  Ticket,
  ArrowRight,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  LocateFixed,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Building,
  Users,
  Compass,
  Bookmark,
  Share2,
  Clock,
  Navigation,
  Filter,
  Search,
  Sliders,
  ShieldCheck,
  Star,
  X
} from 'lucide-react';
import { detectUserLocation } from '@/utils/geoUtils.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const INDUSTRY_SECTORS = [
  { id: 'tech', label: 'Technology & AI', icon: '💻', query: 'Technology' },
  { id: 'health', label: 'Healthcare & Pharma', icon: '🏥', query: 'Healthcare' },
  { id: 'auto', label: 'Automotive & EV', icon: '🚗', query: 'Automotive' },
  { id: 'mfg', label: 'Manufacturing & Machinery', icon: '⚙️', query: 'Manufacturing' },
  { id: 'food', label: 'Food & Hospitality', icon: '🍽️', query: 'Food' },
  { id: 'build', label: 'Building & Construction', icon: '🏗️', query: 'Construction' },
  { id: 'energy', label: 'Renewable Energy', icon: '⚡', query: 'Energy' },
  { id: 'textile', label: 'Textiles & Fashion', icon: '👔', query: 'Textile' },
  { id: 'agri', label: 'Agriculture & Dairy', icon: '🌾', query: 'Agriculture' },
  { id: 'fin', label: 'Finance & FinTech', icon: '💳', query: 'Finance' },
  { id: 'logistics', label: 'Logistics & Cargo', icon: '🚢', query: 'Logistics' },
  { id: 'tourism', label: 'Travel & Tourism', icon: '✈️', query: 'Tourism' }
];

const POPULAR_LOCATIONS = [
  { id: 'all', label: 'All Regions' },
  { id: 'delhi', label: 'Delhi NCR', query: 'New Delhi,Greater Noida' },
  { id: 'new-delhi', label: 'New Delhi', query: 'New Delhi' },
  { id: 'greater-noida', label: 'Greater Noida', query: 'Greater Noida' },
  { id: 'mumbai', label: 'Mumbai', query: 'Mumbai' },
  { id: 'bengaluru', label: 'Bengaluru', query: 'Bengaluru' },
  { id: 'hyderabad', label: 'Hyderabad', query: 'Hyderabad' },
  { id: 'chennai', label: 'Chennai', query: 'Chennai' },
  { id: 'dubai', label: 'Dubai (UAE)', query: 'Dubai' }
];

const DEFAULT_BANNER = 'https://visitexpo.in/wp-content/uploads/2026/08/ET-TECH-X-2026_new.jpg';

function getLocalFallbackEvents(locations = [], interests = [], maxCount = 60) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('visitexpo_home_events');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return [];

    const locs = (locations || []).map((l) => l.toLowerCase().trim()).filter((l) => l && l !== 'all');
    const ints = (interests || []).map((i) => i.toLowerCase().trim()).filter(Boolean);

    const scored = list.map((ev) => {
      let score = 68;
      const reasons = [];
      const city = (ev.city || '').toLowerCase();
      const title = (ev.title || '').toLowerCase();
      const cat = (ev.category || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();

      const isLocMatch =
        locs.length === 0 ||
        locs.some((l) => city.includes(l) || l.includes(city) || (l.includes('delhi') && (city.includes('noida') || city.includes('delhi'))));

      if (isLocMatch && locs.length > 0) {
        score += 20;
        reasons.push(`Hosted in ${ev.city || 'your area'}`);
      }

      const isIntMatch =
        ints.length === 0 ||
        ints.some((i) => cat.includes(i) || i.includes(cat) || title.includes(i) || desc.includes(i));

      if (isIntMatch && ints.length > 0) {
        score += 15;
        const matched = ints.find((i) => cat.includes(i) || title.includes(i)) || ints[0];
        reasons.push(`Matches your interest in ${matched.charAt(0).toUpperCase() + matched.slice(1)}`);
      }

      if (reasons.length === 0) {
        reasons.push('Popular Industry Exhibition');
      }

      return {
        ...ev,
        matchScore: Math.min(99, score),
        matchReasons: reasons.slice(0, 3)
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, maxCount);
  } catch (_) {
    return [];
  }
}

export default function RecommendationsPage() {
  const { user } = useAuth();

  // SSR-safe state initialization (identical on server and client initial render)
  const [selectedLocations, setSelectedLocations] = useState(() => ['New Delhi']);
  const [selectedInterests, setSelectedInterests] = useState(() => ['Technology']);

  // Hydrate preferences on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('visitexpo_user_preferences');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.locations) && parsed.locations.length > 0) setSelectedLocations(parsed.locations);
          if (Array.isArray(parsed.interests) && parsed.interests.length > 0) setSelectedInterests(parsed.interests);
        }
      } catch (_) {}
    }
  }, []);

  const [userCoords, setUserCoords] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCity, setDetectedCity] = useState('');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'date' | 'turnout'

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState(null);
  const [shareToast, setShareToast] = useState(false);

  // Close score breakdown tooltip when clicking outside or pressing Escape
  useEffect(() => {
    if (!activeTooltipId) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-tooltip-container="true"]')) {
        setActiveTooltipId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveTooltipId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTooltipId]);

  // Sync user profile once when user logs in
  const userSyncedRef = useRef(false);
  useEffect(() => {
    if (user && !userSyncedRef.current) {
      userSyncedRef.current = true;
      if (Array.isArray(user.preferredLocations) && user.preferredLocations.length > 0) {
        setSelectedLocations(user.preferredLocations);
      } else if (user.city) {
        setSelectedLocations([user.city]);
      }
      if (Array.isArray(user.interests) && user.interests.length > 0) {
        setSelectedInterests(user.interests);
      }
    }
  }, [user]);

  // Primitive cache keys to prevent infinite re-render cycles
  const locationsKey = selectedLocations.join(',');
  const interestsKey = selectedInterests.join(',');
  const coordsKey = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLocations.length > 0 && !selectedLocations.includes('all')) {
        params.append('location', selectedLocations.join(','));
      }
      if (selectedInterests.length > 0) {
        params.append('interests', selectedInterests.join(','));
      }
      if (userCoords?.lat && userCoords?.lng) {
        params.append('lat', userCoords.lat);
        params.append('lng', userCoords.lng);
      }
      if (timeframe) {
        params.append('timeframe', timeframe);
      }
      params.append('limit', '60');

      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('visitexpo_access_token') || localStorage.getItem('token'))
        : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_URL}/events/recommendations?${params.toString()}`, { headers, timeout: 8000 });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setEvents(res.data.data);
        setCriteria(res.data.criteria || null);
      } else {
        const fallback = getLocalFallbackEvents(selectedLocations, selectedInterests, 60);
        if (fallback.length > 0) setEvents(fallback);
        else if (res.data?.data) setEvents(res.data.data);
      }
    } catch (err) {
      console.warn('[RecommendationsPage] API error, using verified fallback:', err.message);
      const fallback = getLocalFallbackEvents(selectedLocations, selectedInterests, 60);
      if (fallback.length > 0) setEvents(fallback);
    } finally {
      setLoading(false);
    }
  }, [locationsKey, interestsKey, coordsKey, timeframe]);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedLocations.length > 0 && !selectedLocations.includes('all')) {
          params.append('location', selectedLocations.join(','));
        }
        if (selectedInterests.length > 0) {
          params.append('interests', selectedInterests.join(','));
        }
        if (userCoords?.lat && userCoords?.lng) {
          params.append('lat', userCoords.lat);
          params.append('lng', userCoords.lng);
        }
        if (timeframe) {
          params.append('timeframe', timeframe);
        }
        params.append('limit', '60');

        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('visitexpo_access_token') || localStorage.getItem('token'))
          : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_URL}/events/recommendations?${params.toString()}`, { headers, timeout: 8000 });
        if (!isCancelled) {
          if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
            setEvents(res.data.data);
            setCriteria(res.data.criteria || null);
          } else {
            const fallback = getLocalFallbackEvents(selectedLocations, selectedInterests, 60);
            if (fallback.length > 0) setEvents(fallback);
            else if (res.data?.data) setEvents(res.data.data);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[RecommendationsPage] Error, using fallback:', err.message);
          const fallback = getLocalFallbackEvents(selectedLocations, selectedInterests, 60);
          if (fallback.length > 0) setEvents(fallback);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [locationsKey, interestsKey, coordsKey, timeframe]);

  // Geolocation
  const handleDetectGPS = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectUserLocation();
      if (loc?.lat && loc?.lng) {
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        if (loc.city) {
          setDetectedCity(loc.city);
          setSelectedLocations([loc.city]);
        }
      }
    } catch (e) {
      console.warn('GPS detection failed:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  // Toggle Interest
  const toggleInterest = (query) => {
    setSelectedInterests((prev) =>
      prev.includes(query) ? prev.filter((i) => i !== query) : [...prev, query]
    );
  };

  // Select Location
  const handleSelectLocation = (query) => {
    if (query === 'all') {
      setSelectedLocations([]);
      setUserCoords(null);
      setDetectedCity('');
    } else {
      setSelectedLocations([query]);
    }
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'visitexpo_user_preferences',
          JSON.stringify({
            locations: selectedLocations,
            interests: selectedInterests
          })
        );
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && user) {
        await axios.post(
          `${API_URL}/events/recommendations/preferences`,
          {
            interests: selectedInterests,
            preferredLocations: selectedLocations
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Save failed:', err);
    } finally {
      setSavingPreferences(false);
    }
  };

  // Filter & sort
  const displayedEvents = useMemo(() => {
    let list = [...events];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.title?.toLowerCase().includes(q) ||
          ev.city?.toLowerCase().includes(q) ||
          ev.venue?.toLowerCase().includes(q) ||
          ev.category?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'date') {
      list.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
    } else if (sortBy === 'turnout') {
      list.sort((a, b) => (b.attendeesCount || 0) - (a.attendeesCount || 0));
    } else {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return sortEventsByStartDate(list);
  }, [events, searchQuery, sortBy]);

  // Pagination State & Controls
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // Default 9 (3x3 grid)

  // Reset page whenever filter or per-page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, locationsKey, interestsKey, timeframe, itemsPerPage]);

  const totalItems = displayedEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return displayedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedEvents, activePage, itemsPerPage]);

  const formatDates = (startDate, endDate) => {
    if (!startDate) return 'Dates TBA';
    try {
      const start = new Date(startDate);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!endDate) return startStr;
      const end = new Date(endDate);
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    } catch {
      return 'Dates TBA';
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 90) return 'from-emerald-600 to-teal-600 text-white';
    if (score >= 80) return 'from-amber-500 to-orange-500 text-white';
    return 'from-blue-600 to-indigo-600 text-white';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white flex flex-col justify-between">
      <Navbar solid={true} />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 space-y-4 sm:space-y-5 flex-1 w-full">
        {/* Hero Header Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-lg sm:rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-zinc-900/90" />
          <div className="relative z-10 space-y-5 p-5 sm:p-7 md:space-y-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="min-w-0 max-w-3xl space-y-3.5">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Events Recommended For You
                </h1>
                <p className="max-w-2xl text-sm font-normal leading-relaxed text-zinc-300 sm:text-base">
                  Discover trade shows and business expos scored against your geographic radius, selected industry clusters, and schedule readiness.
                </p>
              </div>

              {/* Save Preferences CTA */}
              <div className="flex w-full shrink-0 items-center gap-2.5 lg:w-auto lg:self-center">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:text-sm ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FFCC00] text-zinc-950 hover:bg-[#FFB703]'
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Preferences Saved</span>
                    </>
                  ) : savingPreferences ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <span>Save My Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stats Pill Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-zinc-300 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">{events.length}</span> expos tailored to your profile
              </div>
              <span className="hidden text-zinc-600 sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span>Top Match:</span>
                <span className="font-extrabold text-emerald-400">{events[0]?.matchScore || 95}%</span>
              </div>
              {detectedCity && (
                <>
                  <span className="hidden text-zinc-600 sm:inline">•</span>
                  <div className="flex items-center gap-1 text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                    <span>GPS: {detectedCity}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* INTERACTIVE CONTROLS CONTAINER                                        */}
        {/* ===================================================================== */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Location Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-600">
                <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                <span>Geographic Location &amp; Proximity</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetecting}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  userCoords
                    ? 'bg-[#FF2E63] text-white shadow-xs'
                    : 'bg-rose-50 text-[#FF2E63] border border-rose-200 hover:bg-rose-100'
                }`}
              >
                {isDetecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LocateFixed className="h-3 w-3" />
                )}
                <span>Detect My GPS</span>
              </button>

              {POPULAR_LOCATIONS.map((loc) => {
                const isSelected =
                  loc.id === 'all'
                    ? selectedLocations.length === 0 && !userCoords
                    : selectedLocations.some((l) => {
                        const low = l.toLowerCase().trim();
                        if (loc.id === 'delhi') return low === 'delhi ncr' || low === 'new delhi,greater noida';
                        return low === loc.label.toLowerCase() || low === (loc.query || '').toLowerCase();
                      });

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc.id === 'all' ? 'all' : loc.query)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs scale-102'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Industry Sectors Multi-Select */}
          <div className="space-y-2 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-600">
                <Compass className="h-3.5 w-3.5 text-[#FF2E63]" />
                <span>Industry Sectors &amp; Interests (Multi-Select)</span>
                {selectedInterests.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-[#FFCC00] text-zinc-950 px-2 py-0.5 rounded-full ml-1">
                    {selectedInterests.length} selected
                  </span>
                )}
              </div>
              {selectedInterests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedInterests([])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-600 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <X className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {INDUSTRY_SECTORS.map((s) => {
                const isSelected = selectedInterests.includes(s.query);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleInterest(s.query)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-xs ring-2 ring-amber-300 scale-102'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/60'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3] ml-0.5 text-zinc-950" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Sort Filters */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery((e.target.value || '').replace(/[<>!@#$%^&*()=+~`\\|{}[\];:"?]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key && e.key.length === 1 && /[<>!@#$%^&*()=+~`\\|{}[\];:"?]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Search matching expos by keyword..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-semibold text-zinc-600">
                <span>Timeframe:</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="upcoming">All Upcoming</option>
                  <option value="30days">Next 30 Days</option>
                  <option value="90days">Next 90 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-2 font-semibold text-zinc-600">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="match">Match Score (★)</option>
                  <option value="date">Date (Earliest)</option>
                  <option value="turnout">Turnout (High)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* RESULTS GRID                                                          */}
        {/* ===================================================================== */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between h-96"
              >
                <div className="h-48 w-full bg-zinc-200" />
                <div className="p-5 space-y-3 flex-1">
                  <div className="h-4 w-32 bg-zinc-200 rounded" />
                  <div className="h-5 w-4/5 bg-zinc-200 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white border border-zinc-200 rounded-3xl space-y-4">
            <Compass className="h-12 w-12 text-zinc-400 mx-auto" />
            <h3 className="text-base font-extrabold text-zinc-900">No Tailored Events Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              We couldn't find trade exhibitions matching the exact filters. Try broadening your location or checking more industry sectors.
            </p>
            <button
              onClick={() => {
                setSelectedLocations([]);
                setSelectedInterests(['Technology', 'Healthcare']);
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEvents.map((ev) => {
              const eventId = String(ev._id || ev.id || ev.slug || '');
              const score = ev.matchScore || 85;
              const reasons = ev.matchReasons || [];
              const scoreGradient = getScoreBadgeClass(score);
              const breakdown = ev.scoreBreakdown || {};
              const isTooltipOpen = Boolean(eventId && activeTooltipId === eventId);

              return (
                <div
                  key={ev._id || ev.id || ev.slug}
                  className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Banner Image */}
                  <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                    <StableEventImage
                      src={ev.bannerImage || ev.image || ev.banner || DEFAULT_BANNER}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Match Score Badge */}
                    <div className="absolute top-3 left-3">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${scoreGradient} shadow-md backdrop-blur-xs`}
                      >
                        <span>{score}% Match</span>
                      </div>
                    </div>

                    {/* Info Tooltip */}
                    <div className="absolute top-3 right-3" data-tooltip-container="true">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTooltipId((prev) => (prev === eventId ? null : eventId));
                        }}
                        className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Score Breakdown"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      {isTooltipOpen && (
                        <div
                          className="absolute right-0 top-8 z-30 w-64 bg-zinc-950 text-white text-[11px] p-3 rounded-xl shadow-2xl border border-zinc-800 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-extrabold text-amber-400 border-b border-zinc-800 pb-1 flex justify-between items-center">
                            <span>Score Breakdown</span>
                            <span className="text-[10px] text-zinc-400">Max 100</span>
                          </div>
                          <div className="space-y-1 text-zinc-300">
                            <div className="flex justify-between">
                              <span>Industry Match:</span>
                              <strong className="text-white">{breakdown.interest ?? 35} / 45</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Location &amp; Proximity:</span>
                              <strong className="text-white">{breakdown.location ?? 30} / 35</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Schedule &amp; Recency:</span>
                              <strong className="text-white">{breakdown.recency ?? 10} / 15</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Turnout &amp; Host:</span>
                              <strong className="text-white">{breakdown.social ?? 3} / 5</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-bold text-[11px] bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/20 truncate max-w-[65%]">
                        {ev.categories?.[0] || ev.category || 'Trade Exhibition'}
                      </span>
                      {ev.city && (
                        <span className="font-semibold text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-[#FFCC00]" />
                          <span>{ev.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Match Reasons */}
                      {reasons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {reasons.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md"
                            >
                              <Check className="h-2.5 w-2.5 text-amber-600 stroke-[3]" />
                              <span>{r}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 group-hover:text-[#FF2E63] transition-colors line-clamp-2 leading-tight">
                        <Link href={`/expo/${ev.slug || ev.id || ev._id}`}>
                          {ev.title}
                        </Link>
                      </h3>

                      {/* Info */}
                      <div className="space-y-1 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{formatDates(ev.startDate, ev.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate text-zinc-500">
                          <Building className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
                          <span className="truncate">
                            {ev.venue && ev.venue.toLowerCase() !== ev.city?.toLowerCase()
                              ? `${ev.venue}${ev.city ? ` • ${ev.city}` : ''}`
                              : ev.city || 'India'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/expo/${ev.slug || ev.id || ev._id}`}
                        className="text-xs font-bold text-zinc-700 hover:text-zinc-950"
                      >
                        Details
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/onboarding/exhibitor?wp_slug=${encodeURIComponent(ev.slug || '')}&wp_post_id=${ev.wpPostId || ev.id || ''}&title=${encodeURIComponent(ev.title || '')}&venue=${encodeURIComponent(ev.venue || '')}&city=${encodeURIComponent(ev.city || '')}&startDate=${encodeURIComponent(ev.startDate || '')}`}
                          onClick={() => {
                            try {
                              sessionStorage.setItem('visitexpo_selected_event', JSON.stringify(ev));
                            } catch (_) {}
                          }}
                          prefetch={true}
                          className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer"
                        >
                          Exhibit
                        </Link>
                        <span className="text-zinc-300">•</span>
                        <EventPassAvailability event={ev}>
                          <Link
                            href={`/expo/${ev.slug || ev.id || ev._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-xs"
                          >
                            <span>Get Pass</span>
                            <ArrowRight className="h-3 w-3 text-primary" />
                          </Link>
                        </EventPassAvailability>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================== */}
        {/* PAGINATION CONTROLS & PER-PAGE OPTIONS                                */}
        {/* ===================================================================== */}
        {!loading && displayedEvents.length > 0 && (
          <div className="pt-6 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left Section: Result Count & Per-Page Selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <div>
                Showing{' '}
                <strong className="text-zinc-950 font-bold">
                  {Math.min((activePage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(activePage * itemsPerPage, totalItems)}
                </strong>{' '}
                of <strong className="text-zinc-950 font-bold">{totalItems}</strong> recommendations
              </div>

              <div className="hidden sm:block text-zinc-300">•</div>

              {/* Per Page Option */}
              <div className="flex items-center gap-1.5 font-medium">
                <span>Per page:</span>
                <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs">
                  {[6, 9, 12, 24].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        itemsPerPage === size
                          ? 'bg-zinc-950 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section: Pagination Navigation */}
            <div className="flex items-center gap-1.5">
              {totalPages > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(p - 1, 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    disabled={activePage === 1}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Page Number Pills */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - activePage) <= 1)
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
                            className={`h-8 w-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              activePage === pageNum
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
                    disabled={activePage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                    aria-label="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-xs font-semibold text-zinc-400 bg-zinc-100/80 px-3 py-1.5 rounded-xl border border-zinc-200/60">
                  Page 1 of 1
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
