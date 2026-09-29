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
  ChevronRight,
  Building,
  Users,
  Compass,
  Bookmark,
  Share2,
  RefreshCw,
  Clock,
  Navigation,
  Filter,
  Search,
  Sliders,
  ShieldCheck,
  Star
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

export default function RecommendationsPage() {
  const { user } = useAuth();

  // Filters & State with lazy initializers
  const [selectedLocations, setSelectedLocations] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('visitexpo_user_preferences');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.locations) && parsed.locations.length > 0) return parsed.locations;
        }
      } catch (err) {}
    }
    return ['New Delhi'];
  });

  const [selectedInterests, setSelectedInterests] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('visitexpo_user_preferences');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.interests) && parsed.interests.length > 0) return parsed.interests;
        }
      } catch (err) {}
    }
    return ['Technology'];
  });

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
      params.append('limit', '24');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_URL}/events/recommendations?${params.toString()}`, { headers });
      if (res.data?.success) {
        setEvents(res.data.data || []);
        setCriteria(res.data.criteria || null);
      }
    } catch (err) {
      console.warn('[RecommendationsPage] Error:', err.message);
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
        params.append('limit', '24');

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_URL}/events/recommendations?${params.toString()}`, { headers });
        if (!isCancelled && res.data?.success) {
          setEvents(res.data.data || []);
          setCriteria(res.data.criteria || null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[RecommendationsPage] Error:', err.message);
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

    return list;
  }, [events, searchQuery, sortBy]);

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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar solid={true} />

      {/* Hero Header */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-primary/20 text-primary border border-primary/30">
                <span>Personalized Matchmaking Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Events Recommended For You
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Discover trade shows and business expos scored against your geographic radius, selected industry clusters, and schedule readiness.
              </p>
            </div>

            {/* Save Preferences CTA */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPreferences}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  savedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary hover:bg-amber-400 text-zinc-950 font-black'
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

              <button
                type="button"
                onClick={fetchRecommendations}
                className="p-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Stats Pill Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-t border-zinc-850">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">{events.length}</span> expos tailored to your profile
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span>Top Match:</span>
              <span className="text-emerald-400 font-extrabold">{events[0]?.matchScore || 95}%</span>
            </div>
            {detectedCity && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1 text-zinc-300">
                  <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                  <span>GPS: {detectedCity}</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-8 w-full">
        
        {/* ===================================================================== */}
        {/* INTERACTIVE CONTROLS CONTAINER                                        */}
        {/* ===================================================================== */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-5">
          
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
                    : selectedLocations.some((l) => loc.query.toLowerCase().includes(l.toLowerCase()));

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
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Industry Sectors &amp; Interests (Multi-Select)</span>
                {selectedInterests.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-primary text-zinc-950 px-2 py-0.5 rounded-full ml-1">
                    {selectedInterests.length} selected
                  </span>
                )}
              </div>
              {selectedInterests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedInterests([])}
                  className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  Clear all
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {displayedEvents.map((ev) => {
              const score = ev.matchScore || 85;
              const reasons = ev.matchReasons || [];
              const scoreGradient = getScoreBadgeClass(score);
              const breakdown = ev.scoreBreakdown || {};

              return (
                <div
                  key={ev._id || ev.id || ev.slug}
                  className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Banner Image */}
                  <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={ev.bannerImage || ev.image || ev.banner || DEFAULT_BANNER}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_BANNER;
                      }}
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
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => setActiveTooltipId(activeTooltipId === ev.id ? null : ev.id)}
                        className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Score Breakdown"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      {activeTooltipId === ev.id && (
                        <div className="absolute right-0 top-8 z-30 w-64 bg-zinc-950 text-white text-[11px] p-3 rounded-xl shadow-2xl border border-zinc-800 space-y-2">
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
                          href={`/onboarding/exhibitor?wp_slug=${encodeURIComponent(ev.slug || '')}`}
                          className="text-xs font-bold text-[#FF2E63] hover:underline"
                        >
                          Exhibit
                        </Link>
                        <span className="text-zinc-300">•</span>
                        <Link
                          href={`/expo/${ev.slug || ev.id || ev._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-xs"
                        >
                          <span>Get Pass</span>
                          <ArrowRight className="h-3 w-3 text-primary" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
