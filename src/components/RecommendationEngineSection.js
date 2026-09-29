'use client';

/**
 * @file RecommendationEngineSection.js
 * @description Interactive, multi-factor AI Recommendation Engine for VisitExpo.
 * Suggests relevant trade exhibitions, B2B expos, and global summits based on:
 * - User geographic location (City, proximity radius, or GPS detection)
 * - Multi-select industry & category interests
 * - Recency & timing (Live today, Next 30 days, Next 90 days)
 * - Turnout & organizer credibility
 *
 * Provides real-time match scoring (e.g. 96% Match), match reasons badges,
 * score breakdown tooltips, and one-click visitor pass registration.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Sparkles,
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
  Navigation
} from 'lucide-react';
import { detectUserLocation, formatDistance, calculateDistanceKm } from '../utils/geoUtils.js';
import { useAuth } from '../context/AuthContext.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

// Curated industry sectors with friendly icons
const INDUSTRY_INTERESTS = [
  { id: 'technology', label: 'Technology & AI', icon: '💻', query: 'Technology' },
  { id: 'healthcare', label: 'Healthcare & Pharma', icon: '🏥', query: 'Healthcare' },
  { id: 'automotive', label: 'Automotive & EV', icon: '🚗', query: 'Automotive' },
  { id: 'manufacturing', label: 'Manufacturing & Machinery', icon: '⚙️', query: 'Manufacturing' },
  { id: 'food', label: 'Food & Hospitality', icon: '🍽️', query: 'Food' },
  { id: 'construction', label: 'Building & Construction', icon: '🏗️', query: 'Construction' },
  { id: 'energy', label: 'Renewable Energy', icon: '⚡', query: 'Energy' },
  { id: 'textile', label: 'Textiles & Fashion', icon: '👔', query: 'Textile' },
  { id: 'agriculture', label: 'Agriculture & Dairy', icon: '🌾', query: 'Agriculture' },
  { id: 'finance', label: 'Finance & FinTech', icon: '💳', query: 'Finance' }
];

// Popular exhibition cities
const POPULAR_CITIES = [
  { id: 'all', label: 'All Locations' },
  { id: 'delhi-ncr', label: 'Delhi NCR', query: 'New Delhi,Greater Noida' },
  { id: 'new-delhi', label: 'New Delhi', query: 'New Delhi' },
  { id: 'greater-noida', label: 'Greater Noida', query: 'Greater Noida' },
  { id: 'mumbai', label: 'Mumbai', query: 'Mumbai' },
  { id: 'bengaluru', label: 'Bengaluru', query: 'Bengaluru' },
  { id: 'hyderabad', label: 'Hyderabad', query: 'Hyderabad' },
  { id: 'chennai', label: 'Chennai', query: 'Chennai' },
  { id: 'dubai', label: 'Dubai (UAE)', query: 'Dubai' }
];

// Category fallback images pool
const CATEGORY_IMAGES = {
  'technology': 'https://visitexpo.in/wp-content/uploads/2026/08/ET-TECH-X-2026_new.jpg',
  'healthcare': 'https://visitexpo.in/wp-content/uploads/2026/08/48th-edition-Medicall-Expo-New-Delhi-2026_new.jpg',
  'automotive': 'https://visitexpo.in/wp-content/uploads/2026/07/Bharat-Mobility-Global-Expo_new.jpg',
  'manufacturing': 'https://visitexpo.in/wp-content/uploads/2026/09/Scotland-Manufacturing-and-Supply-Chain-Conference-Exhibition-2026_new.jpg',
  'food': 'https://visitexpo.in/wp-content/uploads/2026/08/Food-Connoisseurs-India-Convention-2026.jpg',
  'construction': 'https://visitexpo.in/wp-content/uploads/2026/07/Build-Bangladesh-Expo-31st-Edition.jpg',
  'energy': 'https://visitexpo.in/wp-content/uploads/2026/07/Water-Environment-Expo.jpg',
  'textile': 'https://visitexpo.in/wp-content/uploads/2026/07/gte.png',
  'agriculture': 'https://visitexpo.in/wp-content/uploads/2026/08/Food-Connoisseurs-India-Convention-2026.jpg',
  'finance': 'https://visitexpo.in/wp-content/uploads/2026/08/ET-TECH-X-2026_new.jpg'
};

const DEFAULT_BANNER = 'https://visitexpo.in/wp-content/uploads/2026/08/ET-TECH-X-2026_new.jpg';

export default function RecommendationEngineSection({
  title = 'Recommended For You',
  subtitle = 'Personalized exhibition discovery powered by your location and industry interests.',
  defaultLocation = '',
  defaultInterests = [],
  limit = 6,
  compact = false
}) {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState('');
  const [timeframe, setTimeframe] = useState('upcoming'); // 'all' | 'upcoming' | '30days'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeScoreTooltip, setActiveScoreTooltip] = useState(null);

  // Initialize preferences from user profile or localStorage on mount
  useEffect(() => {
    let initialLocs = [];
    let initialInts = [];

    if (defaultLocation) {
      initialLocs.push(defaultLocation);
    }
    if (defaultInterests && defaultInterests.length > 0) {
      initialInts.push(...defaultInterests);
    }

    // Check user profile
    if (user) {
      if (Array.isArray(user.preferredLocations) && user.preferredLocations.length > 0) {
        initialLocs = [...user.preferredLocations];
      } else if (user.city && initialLocs.length === 0) {
        initialLocs = [user.city];
      }

      if (Array.isArray(user.interests) && user.interests.length > 0) {
        initialInts = [...user.interests];
      }
    } else if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('visitexpo_user_preferences');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.locations && initialLocs.length === 0) initialLocs = parsed.locations;
          if (parsed.interests && initialInts.length === 0) initialInts = parsed.interests;
        }
      } catch (err) {
        // Ignore JSON error
      }
    }

    // Default to Technology & Healthcare and Delhi NCR if empty
    if (initialInts.length === 0) {
      initialInts = ['Technology'];
    }
    if (initialLocs.length === 0) {
      initialLocs = ['New Delhi'];
    }

    setSelectedLocations(initialLocs);
    setSelectedInterests(initialInts);
  }, [user, defaultLocation, defaultInterests]);

  // Fetch recommendations from backend
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
      params.append('limit', limit.toString());

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_URL}/events/recommendations?${params.toString()}`, { headers });
      if (res.data && res.data.success) {
        setEvents(res.data.data || []);
        setCriteria(res.data.criteria || null);
      }
    } catch (err) {
      console.warn('[RecommendationEngine] Failed to fetch recommendations:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedLocations, selectedInterests, userCoords, timeframe, limit]);

  // Auto-fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  // Handle GPS location detection
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectUserLocation();
      if (loc && loc.lat && loc.lng) {
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        if (loc.city) {
          setDetectedCityName(loc.city);
          setSelectedLocations([loc.city]);
        }
      }
    } catch (err) {
      console.warn('Location detection failed:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Toggle interest
  const toggleInterest = (interestQuery) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestQuery)) {
        const next = prev.filter((i) => i !== interestQuery);
        return next;
      } else {
        return [...prev, interestQuery];
      }
    });
  };

  // Select location pill
  const handleSelectLocation = (locQuery) => {
    if (locQuery === 'all') {
      setSelectedLocations([]);
      setUserCoords(null);
      setDetectedCityName('');
    } else {
      setSelectedLocations([locQuery]);
    }
  };

  // Save preferences to backend & localStorage
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
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Failed to save preferences:', err);
    } finally {
      setSavingPreferences(false);
    }
  };

  // Helper: Format event dates
  const formatEventDate = (startDate, endDate) => {
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

  // Helper: Get match score color class
  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/20';
    if (score >= 80) return 'from-amber-500 to-orange-500 text-white shadow-amber-500/20';
    return 'from-blue-600 to-indigo-600 text-white shadow-blue-500/20';
  };

  // Helper: Resolve image
  const resolveImage = (ev) => {
    if (ev.bannerImage) return ev.bannerImage;
    if (ev.thumbnailImage) return ev.thumbnailImage;
    if (ev.banner) return ev.banner;
    if (ev.image) return ev.image;
    // Check category fallback
    const firstCat = (ev.categories?.[0] || ev.category || '').toLowerCase();
    for (const [k, url] of Object.entries(CATEGORY_IMAGES)) {
      if (firstCat.includes(k)) return url;
    }
    return DEFAULT_BANNER;
  };

  return (
    <section className={`relative overflow-hidden ${compact ? 'py-8' : 'py-14 sm:py-18'}`}>
      {/* Subtle Background Mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-zinc-50/70 pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* ===================================================================== */}
        {/* HEADER & CONTROLS                                                     */}
        {/* ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-200/80 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500/15 via-[#FF2E63]/15 to-purple-500/15 text-zinc-900 border border-amber-300/40 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>AI Recommendation Engine</span>
              <span className="text-[10px] bg-zinc-900 text-white font-bold px-1.5 py-0.2 rounded-full">
                Multi-Factor
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Save Preferences Button */}
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingPreferences}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
              title="Save current filters to your profile for future visits"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Preferences Saved</span>
                </>
              ) : savingPreferences ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                  <span>Save For Me</span>
                </>
              )}
            </button>

            {/* Timeframe Selector */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-2xs text-xs font-semibold text-zinc-600">
              <button
                type="button"
                onClick={() => setTimeframe('upcoming')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'upcoming' ? 'bg-zinc-900 text-white font-bold' : 'hover:text-zinc-950'
                }`}
              >
                All Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('30days')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === '30days' ? 'bg-zinc-900 text-white font-bold' : 'hover:text-zinc-950'
                }`}
              >
                Next 30 Days
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchRecommendations}
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950 transition-colors shadow-2xs cursor-pointer"
              title="Refresh recommendations"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* INTERACTIVE CONTROLS BAR: LOCATIONS & INTERESTS                      */}
        {/* ===================================================================== */}
        <div className="bg-white/80 backdrop-blur-md border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Row 1: Location Filter Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-zinc-700">
                <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                <span>1. Filter by Location &amp; Proximity</span>
              </div>
              {detectedCityName && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Detected: {detectedCityName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Detect Location Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  userCoords
                    ? 'bg-[#FF2E63] text-white shadow-xs'
                    : 'bg-rose-50 text-[#FF2E63] border border-rose-200 hover:bg-rose-100'
                }`}
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LocateFixed className="h-3 w-3" />
                )}
                <span>Near My GPS</span>
              </button>

              {/* Popular Cities */}
              {POPULAR_CITIES.map((c) => {
                const isSelected =
                  c.id === 'all'
                    ? selectedLocations.length === 0 && !userCoords
                    : selectedLocations.some((loc) => c.query.toLowerCase().includes(loc.toLowerCase()));

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectLocation(c.id === 'all' ? 'all' : c.query)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs scale-102'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Multi-Select Industry Interests */}
          <div className="space-y-2 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-zinc-700">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>2. Select Your Industry Sectors (Multi-Select)</span>
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
                  className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {INDUSTRY_INTERESTS.map((ind) => {
                const isSelected = selectedInterests.includes(ind.query);
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => toggleInterest(ind.query)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-xs ring-2 ring-amber-300 scale-102'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/60'
                    }`}
                  >
                    <span>{ind.icon}</span>
                    <span>{ind.label}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3] ml-0.5 text-zinc-950" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* RECOMMENDATION RESULTS GRID                                           */}
        {/* ===================================================================== */}
        {loading ? (
          /* Skeletons */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between h-96"
              >
                <div className="h-48 w-full bg-zinc-200 relative">
                  <div className="absolute top-3 left-3 h-6 w-24 bg-zinc-300 rounded-full" />
                </div>
                <div className="p-5 space-y-3 flex-1">
                  <div className="h-4 w-32 bg-zinc-200 rounded" />
                  <div className="h-5 w-4/5 bg-zinc-200 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-200 rounded" />
                </div>
                <div className="p-5 pt-0 flex justify-between items-center">
                  <div className="h-8 w-28 bg-zinc-200 rounded-xl" />
                  <div className="h-8 w-24 bg-zinc-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Compass className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-zinc-900">No Direct Exhibition Matches</h3>
              <p className="text-xs text-zinc-500">
                We couldn't find an exact match for your specific combination. Try selecting a broader city or adding more industry sectors.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocations([]);
                  setSelectedInterests(['Technology', 'Healthcare', 'Manufacturing']);
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Reset to Popular Expos
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const imageUrl = resolveImage(ev);
              const score = ev.matchScore || 85;
              const reasons = ev.matchReasons || [];
              const scoreGradient = getMatchScoreColor(score);
              const breakdown = ev.scoreBreakdown || {};

              return (
                <div
                  key={ev._id || ev.id || ev.slug}
                  className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
                >
                  {/* Top Image Banner */}
                  <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_BANNER;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* MATCH SCORE BADGE */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${scoreGradient} shadow-md backdrop-blur-xs`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{score}% Match</span>
                      </div>
                    </div>

                    {/* Score Breakdown Info Trigger */}
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveScoreTooltip(activeScoreTooltip === ev.id ? null : ev.id);
                        }}
                        className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="View Score Breakdown"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      {/* Tooltip Popover */}
                      {activeScoreTooltip === ev.id && (
                        <div
                          className="absolute right-0 top-8 z-30 w-64 bg-zinc-950 text-white text-[11px] p-3 rounded-xl shadow-2xl border border-zinc-800 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-extrabold text-amber-400 border-b border-zinc-800 pb-1 flex justify-between items-center">
                            <span>Score Breakdown</span>
                            <span className="text-[10px] text-zinc-400 font-normal">Max 100</span>
                          </div>
                          <div className="space-y-1 text-zinc-300">
                            <div className="flex justify-between">
                              <span>Industry &amp; Keywords:</span>
                              <strong className="text-white">{breakdown.interest ?? 35} / 45</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Location &amp; Radius:</span>
                              <strong className="text-white">{breakdown.location ?? 30} / 35</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Timing &amp; Recency:</span>
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

                    {/* Category & City Pills over image */}
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
                      {/* Match Reasons Tags */}
                      {reasons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md"
                            >
                              <Check className="h-2.5 w-2.5 text-amber-600 stroke-[3]" />
                              <span>{reason}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Event Title */}
                      <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 group-hover:text-[#FF2E63] transition-colors line-clamp-2 leading-tight">
                        <Link href={`/expo/${ev.slug || ev.id || ev._id}`}>
                          {ev.title}
                        </Link>
                      </h3>

                      {/* Schedule and Location info */}
                      <div className="space-y-1 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{formatEventDate(ev.startDate, ev.endDate)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate text-zinc-500" title={ev.venue || ev.city}>
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
                        View Details
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95"
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

        {/* View All Dedicated Recommendations Link */}
        <div className="text-center pt-2">
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-zinc-900 hover:text-[#FF2E63] transition-colors group cursor-pointer"
          >
            <span>Explore Full Tailored Recommendations Feed</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-[#FF2E63]" />
          </Link>
        </div>

      </div>
    </section>
  );
}
