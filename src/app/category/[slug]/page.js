'use client';

/**
 * @file app/category/[slug]/page.js
 * @description Dedicated Category Events Discovery Page matching the 10times reference screenshots
 * styled with the VisitExpo color theme (#FFCC00 primary gold, #FF2E63 ruby accent, clean white canvas).
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.js';
import ShareModal from '../../../components/ShareModal.js';
import { useAuth } from '../../../context/AuthContext.js';
import { getCategoryBySlug, CATEGORIES_CONFIG } from '../../../data/categoryEventsData.js';
import { renderCardDescription } from '../../../utils/textFormatters.js';
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Star,
  Share2,
  Bookmark,
  Users,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  ArrowRight,
  Lock,
  ExternalLink,
  Plus,
  Check,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const getPaginationItems = (currentPage, totalPages) => {
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages))]
    .sort((a, b) => a - b);

  return pages.reduce((items, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${pages[index - 1]}-${page}` });
    }
    items.push({ type: 'page', key: `page-${page}`, page });
    return items;
  }, []);
};

const parseEventDatePart = (value, inheritedDate = {}) => {
  const cleanedValue = value.replace(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?\b,?/gi, '');
  const monthMatch = cleanedValue.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i);
  const dayNumbers = [...cleanedValue.matchAll(/\b(\d{1,2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((day) => day >= 1 && day <= 31);
  const yearMatch = cleanedValue.match(/\b(20\d{2})\b/);
  const month = monthMatch
    ? new Date(Date.parse(`${monthMatch[1]} 1, 2000`)).getMonth()
    : inheritedDate.month;
  const day = dayNumbers[0] ?? inheritedDate.day;
  const year = yearMatch ? Number(yearMatch[1]) : inheritedDate.year;

  if (month === undefined || day === undefined || year === undefined) return null;
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
};

const getEventDateRange = (event) => {
  const explicitStart = event.startDate ? new Date(event.startDate) : null;
  const explicitEnd = event.endDate ? new Date(event.endDate) : null;
  const startDate = explicitStart && !Number.isNaN(explicitStart.getTime()) ? explicitStart : null;
  const endDate = explicitEnd && !Number.isNaN(explicitEnd.getTime()) ? explicitEnd : null;

  if (startDate && endDate) return { start: startDate, end: endDate };

  const dateText = (event.dates || '').replace(/\s+(?:-|–|—|to)\s+/i, ' | ');
  const [startText, endText] = dateText.split(' | ');
  const sharedMonth = dateText.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i);
  const sharedYear = dateText.match(/\b(20\d{2})\b/);
  const sharedDateParts = {
    ...(sharedMonth ? { month: new Date(Date.parse(`${sharedMonth[1]} 1, 2000`)).getMonth() } : {}),
    ...(sharedYear ? { year: Number(sharedYear[1]) } : {})
  };
  const parsedStart = startText ? parseEventDatePart(startText, sharedDateParts) : null;
  const parsedEnd = endText
    ? parseEventDatePart(endText, {
      ...sharedDateParts,
      ...(parsedStart ? {
        month: parsedStart.getMonth(),
        year: parsedStart.getFullYear()
      } : {})
    })
    : null;
  const start = startDate || parsedStart || (parsedEnd && startText
    ? parseEventDatePart(startText, {
      month: parsedEnd.getMonth(),
      year: parsedEnd.getFullYear()
    })
    : null);
  const end = endDate || parsedEnd || start;

  return { start, end };
};

export default function CategoryEventsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || 'it-technology';

  // Load category config
  const category = useMemo(() => {
    return getCategoryBySlug(slug);
  }, [slug]);

  // Local state
  const [activeTab, setActiveTab] = useState('events');
  const [activeSort, setActiveSort] = useState('trending');
  const [isFollowing, setIsFollowing] = useState(false);
  const [interestedMap, setInterestedMap] = useState({});
  const [shareToast, setShareToast] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMoreAbout, setShowMoreAbout] = useState(false);

  const hasCustomDateRange = Boolean(customStartDate || customEndDate);
  const getDateFilterLabel = () => {
    const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (customStartDate && customEndDate) {
      return `${formatDate(customStartDate)} – ${formatDate(customEndDate)}`;
    }
    if (customStartDate) return `From ${formatDate(customStartDate)}`;
    if (customEndDate) return `Until ${formatDate(customEndDate)}`;

    switch (selectedDateFilter) {
      case 'this_month': return 'This Month';
      case 'next_month': return 'Next Month';
      case 'next_3_months': return 'Next 3 Months';
      case '2026': return '2026 - 2027';
      default: return 'Select Date';
    }
  };

  // Filter expanders
  const [openSections, setOpenSections] = useState({
    calendar: false,
    format: true,
    country: true,
    category: true,
    designation: true
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [shareModalData, setShareModalData] = useState(null);

  const handleShare = (eventData = null) => {
    if (eventData) {
      setShareModalData({
        title: eventData.title,
        text: `Check out ${eventData.title} on VisitExpo! Dates: ${eventData.dates}${eventData.city ? `, ${eventData.city}` : ''}`,
        url: typeof window !== 'undefined' ? `${window.location.origin}/expo/${eventData.slug}` : `https://visitexpo.in/expo/${eventData.slug}`,
        image: eventData.logo || eventData.image,
        dates: eventData.dates,
        city: eventData.city,
        venue: eventData.venue
      });
    } else {
      setShareModalData({
        title: `${category.name} Expos & Trade Shows`,
        text: `Explore top ${category.name} conferences, trade exhibitions and industrial expos on VisitExpo!`,
        url: typeof window !== 'undefined' ? window.location.href : `https://visitexpo.in/category/${category.slug}`,
        image: category.heroBanner,
        category: category.name
      });
    }
  };

  const toggleInterested = (eventId) => {
    setInterestedMap((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Live WordPress events state for dynamic category discovery
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/wordpress-events')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.events)) {
          setLiveEvents(data.events);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const parseEventDateTimestamp = (evt) => {
    return getEventDateRange(evt).start?.getTime() ?? Number.MAX_SAFE_INTEGER;
  };

  // Filter and sort events based on selected format, country, date, and activeSort
  const filteredEvents = useMemo(() => {
    let baseEvents = (category.events && category.events.length > 0) ? category.events : [];

    if (baseEvents.length === 0 && liveEvents.length > 0) {
      const catNameLower = (category.name || '').toLowerCase();
      const shortNameLower = (category.shortName || '').toLowerCase();
      const slugLower = slug.replace(/-/g, ' ');

      baseEvents = liveEvents
        .filter((e) => {
          const c = (e.category || '').toLowerCase();
          const t = (e.title || '').toLowerCase();
          const d = (e.description || '').toLowerCase();
          return c.includes(shortNameLower) || c.includes(slugLower) || t.includes(shortNameLower) || c.includes(catNameLower) || d.includes(shortNameLower);
        })
        .map((e) => ({
          id: e.id,
          slug: e.slug || e.id,
          title: e.title,
          dates: e.dates || 'Upcoming 2026',
          daysToGo: 'Upcoming',
          edition: e.edition || 'Annual Edition',
          city: e.city || '',
          country: e.country || 'India',
          venue: e.venue || '',
          description: e.description || '',
          format: e.format || 'Business Events',
          subFormat: 'Trade Shows',
          category: e.category || category.shortName,
          tags: ['Tradeshow', category.shortName],
          interestedCount: e.interestedCount || 500,
          rating: e.rating || '4.5',
          reviewsCount: e.reviewCount || 100,
          logo: e.image || category.heroBanner
        }));
    }

    const filtered = baseEvents.filter((evt) => {
      if (selectedFormat === 'tradeshows' && !evt.tags?.includes('Tradeshow')) return false;
      if (selectedFormat === 'conferences' && !evt.tags?.includes('Conference')) return false;
      if (selectedCountry !== 'all' && (evt.country || '').toLowerCase() !== selectedCountry.toLowerCase()) return false;

      const eventDateRange = getEventDateRange(evt);
      if (customStartDate || customEndDate) {
        const rangeStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
        const rangeEnd = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;
        if (!eventDateRange.start || !eventDateRange.end) return false;
        if (rangeStart && eventDateRange.end < rangeStart) return false;
        if (rangeEnd && eventDateRange.start > rangeEnd) return false;
      } else if (selectedDateFilter !== 'all') {
        const now = new Date();
        const presetRanges = {
          this_month: [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)],
          next_month: [new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999)],
          next_3_months: [new Date(now.getFullYear(), now.getMonth(), now.getDate()), new Date(now.getFullYear(), now.getMonth() + 3, now.getDate(), 23, 59, 59, 999)],
          2026: [new Date(2026, 0, 1), new Date(2027, 11, 31, 23, 59, 59, 999)]
        };
        const presetRange = presetRanges[selectedDateFilter];
        if (presetRange && (!eventDateRange.start || !eventDateRange.end
          || eventDateRange.end < presetRange[0] || eventDateRange.start > presetRange[1])) {
          return false;
        }
      }

      return true;
    });

    // Active Sorting: 'date' vs 'trending'
    if (activeSort === 'date') {
      filtered.sort((a, b) => parseEventDateTimestamp(a) - parseEventDateTimestamp(b));
    } else {
      // Trending: highest turnout / demand first, tie-break by rating
      filtered.sort((a, b) => {
        const countA = typeof a.interestedCount === 'number' ? a.interestedCount : parseInt(a.interestedCount, 10) || 0;
        const countB = typeof b.interestedCount === 'number' ? b.interestedCount : parseInt(b.interestedCount, 10) || 0;
        if (countB !== countA) return countB - countA;
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      });
    }

    return filtered;
  }, [category, liveEvents, slug, selectedFormat, selectedCountry, selectedDateFilter, customStartDate, customEndDate, activeSort]);

  const EVENTS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));

  // Auto-clamp page if filter changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredEvents, currentPage]);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Category link copied to clipboard!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP SUB-NAV BAR (Events | Companies | People) (VisitExpo Theme)        */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-zinc-200 pt-20 sm:pt-22">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 text-xs font-bold -mb-px sm:gap-6 sm:px-6 sm:text-sm">
          {[
            { id: 'events', label: 'Events', icon: CalendarIcon },
            { id: 'companies', label: 'Companies', icon: Building },
            { id: 'people', label: 'People', icon: Users }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2.5 flex items-center gap-1.5 transition-colors cursor-pointer select-none font-bold ${
                  isActive
                    ? 'text-[#FF2E63] font-black'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#FF2E63]' : ''}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF2E63] rounded-full shadow-[0_1px_6px_rgba(255,46,99,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CATEGORY HERO BANNER (Compact, Space-Efficient Design)                 */}
      {/* ========================================================================= */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
        <div className="relative rounded-xl overflow-hidden bg-zinc-950 text-white shadow-xs">
          {/* Category image stays visible while the gradient keeps banner text readable. */}
          <img
            src={category.heroBanner}
            alt={category.name}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_45%] opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

          {/* Banner Content & Controls - Sleek & Compact */}
          <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight break-words">
                {category.name}
              </h1>

              {/* Stats line */}
              <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{category.followersCount}</span>
                </div>
                <span className="text-zinc-500">•</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{category.eventsCount}</span>
                </div>
              </div>
            </div>

            {/* Follow button */}
            <div className="flex items-center self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  isFollowing
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <span>Follow</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN MAIN CONTAINER (LEFT FILTERS, RIGHT EVENTS FEED)            */}
      {/* ========================================================================= */}
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12">
          
          {/* ===================================================================== */}
          {/* LEFT SIDEBAR: FILTERS & MATCHMAKING (4 of 12 cols) (Screenshots 1-3)  */}
          {/* ===================================================================== */}
          <div className="min-w-0 space-y-4 lg:col-span-4">
            
            {/* 1. Auth Status Callout */}
            {!user ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-zinc-600 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">ⓘ</span>
                  <span>
                    <Link href={`/login?redirect=/category/${slug}`} className="text-blue-600 font-semibold hover:underline">
                      Sign in
                    </Link>{' '}
                    to unlock all features
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-zinc-700 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Logged in as <strong className="text-zinc-900 font-bold">{user.name || user.email}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  All Features Unlocked
                </span>
              </div>
            )}

            {/* 2. WHO'S IN TOWN? Network Widget (VisitExpo Theme) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                {/* 3 Stacked Avatars */}
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF2E63] text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    OB
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#FFCC00] text-zinc-950 font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    LR
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-900 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    VK
                  </div>
                </div>

                <span className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                  Who's In Town?
                </span>
              </div>

              <p className="text-xs text-zinc-600 leading-snug">
                Network with professionals &amp; companies visiting your town.
              </p>

              <Link
                href={user ? "/events" : `/login?redirect=/category/${slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 3. Main Filter Card (Calendar, Format, Country, Category, Designation) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs divide-y divide-zinc-150 text-xs">
              
              {/* Calendar Filter (Screenshot 1) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('calendar')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#FF2E63]" />
                    <span className="text-xs font-bold text-zinc-900">Calendar</span>
                  </div>

                  {/* Prominently Highlighted, High-Contrast Select Date Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-200 shadow-xs cursor-pointer group-hover:scale-103 ${
                    selectedDateFilter !== 'all' || hasCustomDateRange
                      ? 'bg-[#FF2E63] text-white border border-[#FF2E63] ring-2 ring-rose-500/20 shadow-rose-500/25'
                      : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 border border-amber-400 ring-2 ring-amber-300/40'
                  }`}>
                    <CalendarIcon className={`h-3.5 w-3.5 ${selectedDateFilter !== 'all' || hasCustomDateRange ? 'text-white' : 'text-zinc-950'}`} />
                    <span className="tracking-tight">{getDateFilterLabel()}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openSections.calendar ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {openSections.calendar && (
                  <div className="mt-3 space-y-2.5 pt-2 border-t border-zinc-100 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      {[
                        { id: 'all', label: 'Any Date (All Upcoming)' },
                        { id: 'this_month', label: 'This Month' },
                        { id: 'next_month', label: 'Next Month' },
                        { id: 'next_3_months', label: 'Next 3 Months' },
                        { id: '2026', label: 'Later in 2026 - 2027' }
                      ].map((item) => {
                        const isSelected = selectedDateFilter === item.id && !hasCustomDateRange;
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300'
                                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="calDate"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedDateFilter(item.id);
                                  setCustomStartDate('');
                                  setCustomEndDate('');
                                  setCurrentPage(1);
                                }}
                                className="h-4 w-4 shrink-0 accent-[#FF2E63] focus:ring-[#FF2E63]"
                              />
                              <span>{item.label}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Custom date range */}
                    <div className="space-y-2.5 border-t border-zinc-100 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Or choose a date range
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="block min-w-0 space-y-1">
                          <span className="block text-[11px] font-semibold text-zinc-600">Start date</span>
                          <input
                            type="date"
                            value={customStartDate}
                            max={customEndDate || undefined}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomStartDate(value);
                              setSelectedDateFilter(value || customEndDate ? 'custom' : 'all');
                              setCurrentPage(1);
                              if (value && customEndDate && value > customEndDate) {
                                setCustomEndDate('');
                              }
                            }}
                            className="block w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-[#FF2E63] focus:ring-2 focus:ring-rose-100"
                          />
                        </label>
                        <label className="block min-w-0 space-y-1">
                          <span className="block text-[11px] font-semibold text-zinc-600">End date</span>
                          <input
                            type="date"
                            value={customEndDate}
                            min={customStartDate || undefined}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomEndDate(value);
                              setSelectedDateFilter(value || customStartDate ? 'custom' : 'all');
                              setCurrentPage(1);
                              if (value && customStartDate && value < customStartDate) {
                                setCustomStartDate('');
                              }
                            }}
                            className="block w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-[#FF2E63] focus:ring-2 focus:ring-rose-100"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        Events that overlap the selected dates will be shown.
                      </p>
                    </div>

                    {(selectedDateFilter !== 'all' || hasCustomDateRange) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateFilter('all');
                          setCustomStartDate('');
                          setCustomEndDate('');
                          setCurrentPage(1);
                        }}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-bold text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#FF2E63]"
                      >
                        Clear date filter
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Format Filter (Screenshot 1) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('format')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Format</span>
                  {openSections.format ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.format && (
                  <div className="mt-3 space-y-2.5">
                    {/* Business Events */}
                    <div>
                      <label className="flex items-center gap-2 font-bold text-zinc-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                        />
                        <span>Business Events</span>
                      </label>

                      {/* Sub options */}
                      <div className="ml-5 mt-2 space-y-2 text-zinc-600">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'all'}
                            onChange={() => setSelectedFormat('all')}
                            className="accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                          />
                          <span>All</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'tradeshows'}
                            onChange={() => setSelectedFormat('tradeshows')}
                            className="accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                          />
                          <span>Trade Shows</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'conferences'}
                            onChange={() => setSelectedFormat('conferences')}
                            className="accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                          />
                          <span>Conferences</span>
                        </label>
                      </div>
                    </div>

                    {/* Social Events */}
                    <div>
                      <label className="flex items-center gap-2 font-medium text-zinc-600 cursor-pointer hover:text-zinc-900">
                        <input type="checkbox" className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]" />
                        <span>Social Events</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Country Filter (Screenshot 2) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('country')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Country / Region</span>
                  {openSections.country ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.country && (
                  <div className="mt-3 space-y-2">
                    {[
                      { name: 'India', count: '14.2k' },
                      { name: 'USA', count: '50.1k' },
                      { name: 'UK', count: '11.9k' },
                      { name: 'Germany', count: '9808' },
                      { name: 'Canada', count: '9455' }
                    ].map((cnt, i) => (
                      <label
                        key={i}
                        className="flex items-center justify-between text-zinc-600 hover:text-zinc-900 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCountry.toLowerCase() === cnt.name.toLowerCase()}
                            onChange={() => {
                              setSelectedCountry(
                                selectedCountry.toLowerCase() === cnt.name.toLowerCase() ? 'all' : cnt.name
                              );
                            }}
                            className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                          />
                          <span>{cnt.name}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400">{cnt.count}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedCountry('all')}
                      className="text-[11px] font-bold text-blue-600 hover:underline pt-1 cursor-pointer block"
                    >
                      Reset Country
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filter (Screenshot 2) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('category')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Category</span>
                  {openSections.category ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.category && (
                  <div className="mt-3 space-y-2.5">
                    {/* Search topics input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for topics"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-3 pr-8 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF2E63]"
                      />
                      <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Category Checkboxes */}
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto scrollbar-none">
                      {Object.values(CATEGORIES_CONFIG).map((cat) => {
                        const isCurrentCategory = cat.slug === category.slug;

                        return (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className={`flex items-center justify-between cursor-pointer py-0.5 ${
                              isCurrentCategory ? 'font-bold text-[#FF2E63]' : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isCurrentCategory}
                                readOnly
                                className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]"
                              />
                              <span className="truncate max-w-[170px]">{cat.shortName}</span>
                            </div>
                            <span className={`text-[11px] ${isCurrentCategory ? 'text-[#FF2E63] font-bold' : 'text-zinc-400'}`}>
                              {cat.eventsCount.split(' ')[0]}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Designation Filter (Screenshot 3) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('designation')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Designation</span>
                  {openSections.designation ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.designation && (
                  <div className="mt-3 space-y-2">
                    {['Accountants', 'Database Administrators', 'Advertising Managers', 'Aerospace Engineers', 'Insurance Agents'].map((des, i) => (
                      <label key={i} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 cursor-pointer">
                        <input type="checkbox" className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]" />
                        <span>{des}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Gated / Unlocked Filters */}
              {!user ? (
                <div className="p-4 space-y-2.5 text-zinc-500 bg-zinc-50/50">
                  <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Entry Fee</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </div>

                  <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Rating</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </div>

                  <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Members</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3 bg-zinc-50/50 text-xs">
                  <div>
                    <span className="font-bold text-zinc-900 block mb-1.5">Entry Fee (Unlocked)</span>
                    <div className="space-y-1 text-zinc-600">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                        <input type="checkbox" defaultChecked className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]" />
                        <span>Free Visitor Passes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                        <input type="checkbox" className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]" />
                        <span>Paid Delegate Tickets</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60">
                    <span className="font-bold text-zinc-900 block mb-1.5">Rating (Unlocked)</span>
                    <div className="space-y-1 text-zinc-600">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                        <input type="checkbox" defaultChecked className="rounded accent-[#FF2E63] text-[#FF2E63] focus:ring-[#FF2E63]" />
                        <span>4.0+ Stars Rated</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Quick Links (Screenshot 3) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <Link href="/events" className="flex items-center justify-between font-bold text-zinc-800 hover:text-[#FF2E63]">
                <div>
                  <span className="block font-bold">Top 100 Events</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Discover and track top events</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#FF2E63]" />
              </Link>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: EVENTS FEED & PAGINATION (8 of 12 cols)                */}
          {/* ===================================================================== */}
          <div className="min-w-0 space-y-5 lg:col-span-8">
            
            {/* Sort Controls & Pagination Top Bar (Screenshot 1) */}
            <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 px-4 text-xs shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSort('trending');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSort === 'trending'
                      ? 'bg-zinc-900 text-white shadow-xs font-extrabold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>Trending ⇅</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSort('date');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSort === 'date'
                      ? 'bg-[#FF2E63] text-white shadow-xs font-extrabold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>Date 📅</span>
                </button>
              </div>

              {/* Quick Pagination */}
              <div className="flex max-w-full items-center gap-1 font-bold text-xs sm:justify-end">
                {totalPages > 1 && (
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                    }}
                    className="h-7 w-7 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Previous page"
                  >
                    «
                  </button>
                )}
                {paginationItems.map((item) => item.type === 'ellipsis' ? (
                  <span key={item.key} aria-hidden="true" className="px-1 text-zinc-400">…</span>
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`Go to page ${item.page}`}
                    aria-current={currentPage === item.page ? 'page' : undefined}
                    onClick={() => setCurrentPage(item.page)}
                    className={`h-7 w-7 shrink-0 rounded flex items-center justify-center transition-colors cursor-pointer text-xs font-bold ${
                      currentPage === item.page ? 'bg-zinc-900 text-white shadow-xs' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {item.page}
                  </button>
                ))}
                {totalPages > 1 && (
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    }}
                    className="h-7 w-7 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Next page"
                  >
                    »
                  </button>
                )}
              </div>
            </div>

            {/* Event Cards List matching Screenshots 1, 2, 3 */}
            <div className="space-y-4">
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((evt) => {
                  const isInterested = Boolean(interestedMap[evt.id]);

                  return (
                    <div
                      key={evt.id}
                      className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 group"
                    >
                      {/* Top Row: Date Line & Logo/Icon */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-zinc-700 block">
                            {evt.dates}
                          </span>
                          <Link
                            href={`/expo/${evt.slug}`}
                            className="text-base sm:text-lg font-bold text-[#0B4EA2] hover:text-[#083b7a] transition-colors leading-snug mt-0.5 block"
                          >
                            {evt.title}
                          </Link>
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            {evt.daysToGo} • {evt.edition}
                          </p>
                          <p className="text-xs text-zinc-500 font-normal mt-0.5">
                            {evt.venue ? `${evt.venue}, ` : ''}{evt.city}, {evt.country}
                          </p>
                        </div>

                        {/* Event Logo Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={evt.logo}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </div>

                      {/* Description Snippet */}
                      <div
                        className="text-xs text-zinc-600 leading-relaxed line-clamp-2 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_b]:font-semibold [&_b]:text-zinc-900 [&_em]:italic"
                        dangerouslySetInnerHTML={{
                          __html: renderCardDescription(evt.description)
                        }}
                      />

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {evt.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Card Action Footer matching reference */}
                      <div className="pt-3 border-t border-zinc-150 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Interested button */}
                          <button
                            type="button"
                            onClick={() => toggleInterested(evt.id)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                              isInterested
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                            <Star className={`h-3 w-3 ${isInterested ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
                            <span>Interested</span>
                            <span className="text-zinc-400 font-normal ml-0.5">
                              {isInterested ? evt.interestedCount + 1 : evt.interestedCount}
                            </span>
                          </button>
                        </div>

                        {/* Right: Green Rating Pill & Share Icon */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                            <span>{evt.rating}</span>
                            <Star className="h-2.5 w-2.5 fill-current" />
                          </span>

                          <button
                            type="button"
                            onClick={() => handleShare(evt)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                            title="Share event"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-zinc-900 text-sm">No Events Found</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No exhibitions match your current filter selection. Try selecting a different format, date, or reset filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('all');
                      setSelectedCountry('all');
                      setSelectedDateFilter('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Sign-In / Dashboard CTA Banner */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <p className="text-sm font-bold text-zinc-900 leading-snug">
                {user
                  ? 'Explore the full event directory or jump to your organizer/visitor dashboard to manage your tickets, booths, and live passes.'
                  : 'Sign in to view more events or explore advanced search to access all data, advanced filters, and powerful search for a deeper dive.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs shadow-xs transition-colors"
                    >
                      Go to My Dashboard
                    </Link>
                    <Link
                      href="/events"
                      className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Explore All Events
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/login?redirect=/category/${slug}`}
                      className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs shadow-xs transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/events"
                      className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Explore advanced search
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                >
                  « Prev
                </button>
                {paginationItems.map((item) => item.type === 'ellipsis' ? (
                  <span key={item.key} aria-hidden="true" className="px-1 text-zinc-400">…</span>
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`Go to page ${item.page}`}
                    aria-current={currentPage === item.page ? 'page' : undefined}
                    onClick={() => {
                      setCurrentPage(item.page);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === item.page ? 'bg-zinc-900 text-white shadow-xs' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {item.page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                >
                  Next »
                </button>
              </div>
            )}

            {/* "More about Category" Accordion */}
            <div className="pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowMoreAbout(!showMoreAbout)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <span>More about {category.shortName}</span>
                <span>{showMoreAbout ? '↑' : '↓'}</span>
              </button>

              {showMoreAbout && (
                <div className="mt-4 bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs text-xs text-zinc-600 leading-relaxed space-y-2 animate-in fade-in duration-200">
                  <h4 className="font-bold text-zinc-900 text-sm">About {category.name} on VisitExpo</h4>
                  <p>{category.description}</p>
                  <p>
                    VisitExpo provides real-time attendee accreditation, exhibitor matchmaking, stall inquiries, and digital entry badges for all verified events listed under {category.shortName}.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Share Platform Options Modal */}
      <ShareModal
        isOpen={Boolean(shareModalData)}
        onClose={() => setShareModalData(null)}
        data={shareModalData}
      />
    </div>
  );
}
