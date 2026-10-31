'use client';

/**
 * @file (dashboard)/expos/page.js
 * @description Dedicated in-dashboard Live Exhibitions Explorer.
 * Allows logged-in visitors and organizers to browse upcoming trade expos, filter by city and category, and claim digital visitor passes directly without leaving the dashboard.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Calendar,
  MapPin,
  Search,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  QrCode,
  Printer,
  Filter,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { showSweetConfirm, showSweetSuccess, showSweetError } from '../../../utils/sweetalert.js';
import { printBadge } from '../../../utils/printBadge.js';
import ShowCountdownTimer from '../../../components/ShowCountdownTimer.js';
import SearchableSelect from '../../../components/SearchableSelect.js';
import EventPassAvailability from '../../../components/EventPassAvailability.js';
import { allowEventPassClaim } from '../../../utils/eventPasses.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function ExposPage() {
  const { user, accessToken } = useAuth();

  // Events & Passes State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [sortBy, setSortBy] = useState('upcoming'); // 'upcoming' | 'title-asc' | 'title-desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Claim Pass State
  const [claimingId, setClaimingId] = useState(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [claimError, setClaimError] = useState('');
  const [selectedPassForBadge, setSelectedPassForBadge] = useState(null);

  // Fetch events from WordPress endpoint and backend with instant sessionStorage hydration
  useEffect(() => {
    // 1. Instant hydration from sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_dashboard_expos_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
            setLoadingEvents(false);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read expos cache:', e);
    }

    const fetchEvents = async () => {
      try {
        const res = await axios.get('/api/wordpress-events');
        if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
          const freshEvents = res.data.events;
          setEvents(freshEvents);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_dashboard_expos_cache', JSON.stringify(freshEvents));
            }
          } catch (e) {
            console.warn('Could not cache expos:', e);
          }
        } else {
          // Fallback to backend events
          const fallbackRes = await axios.get(`${API_URL}/events?limit=20`);
          if (fallbackRes.data?.success && fallbackRes.data?.data?.docs) {
            const fallbackEvents = fallbackRes.data.data.docs.map(e => ({
              id: e._id || e.id,
              title: e.title,
              image: e.banner || e.logo,
              category: e.category || 'Trade & Industry',
              entryType: 'Free Visitor Pass',
              dates: e.startDate ? `${new Date(e.startDate).toLocaleDateString()} - ${new Date(e.endDate || e.startDate).toLocaleDateString()}` : 'Upcoming 2026',
              venue: e.venue || 'Convention Center',
              city: e.city || 'India',
              description: e.shortDescription || e.description || ''
            }));
            setEvents(fallbackEvents);
            try {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('visitexpo_dashboard_expos_cache', JSON.stringify(fallbackEvents));
              }
            } catch (e) {
              console.warn('Could not cache fallback expos:', e);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch events list:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch visitor's existing passes
  const fetchMyPasses = async () => {
    if (!accessToken || user?.role !== 'visitor') return;
    setLoadingPasses(true);
    try {
      const res = await axios.get(`${API_URL}/visitors/my-passes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && res.data?.data?.docs) {
        setPasses(res.data.data.docs);
      }
    } catch (err) {
      console.warn('Failed to fetch visitor passes:', err);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchMyPasses();
  }, [user, accessToken]);

  // Set of registered event IDs
  const registeredEventIds = useMemo(() => {
    return new Set(
      passes.map(p => {
        if (p.event && typeof p.event === 'object') return p.event._id;
        return p.event;
      }).filter(Boolean)
    );
  }, [passes]);

  // Cities list
  const availableCities = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.city && e.city !== 'India') set.add(e.city);
    });
    return ['All Cities', ...Array.from(set).sort()];
  }, [events]);

  // Categories list
  const categoriesList = [
    'All',
    'Automotive & EV',
    'Technology & AI',
    'Textile & Fashion',
    'Construction & Infra',
    'Logistics & Cargo',
    'Healthcare & Pharma',
    'Agri & Food Tech',
    'Art & Lifestyle',
    'Trade & Industry'
  ];

  // Toggle multi-select category
  const toggleCategory = (cat) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      return;
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'All');
      if (withoutAll.includes(cat)) {
        const remaining = withoutAll.filter((c) => c !== cat);
        return remaining.length === 0 ? ['All'] : remaining;
      } else {
        return [...withoutAll, cat];
      }
    });
  };

  const isAllCategories = selectedCategories.includes('All') || selectedCategories.length === 0;

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchVenue = e.venue?.toLowerCase().includes(q);
        const matchCity = e.city?.toLowerCase().includes(q);
        const matchCategory = e.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchVenue && !matchCity && !matchCategory) return false;
      }
      if (selectedCity !== 'All Cities') {
        if (!e.city?.toLowerCase().includes(selectedCity.toLowerCase()) && !e.venue?.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }
      if (!isAllCategories) {
        const matchCat = selectedCategories.some(cat =>
          e.category?.toLowerCase().includes(cat.toLowerCase())
        );
        if (!matchCat) return false;
      }
      return true;
    });

    if (sortBy === 'title-asc') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'title-desc') {
      result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else {
      // Upcoming: Sort events with valid startDate first
      result.sort((a, b) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
        return timeA - timeB;
      });
    }

    return result;
  }, [events, searchQuery, selectedCity, selectedCategories, isAllCategories, sortBy]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, selectedCategories, sortBy, itemsPerPage]);

  const totalItems = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEvents, activePage, itemsPerPage]);

  // 1-Click Pass Claim
  const handleClaimPass = async (expo) => {
    if (!(await allowEventPassClaim(expo))) return;
    setClaimError('');
    setClaimSuccessMessage('');
    const eventId = expo.id || expo._id;

    const confirmed = await showSweetConfirm(
      {
        title: 'Claim Free Visitor Pass?',
        icon: 'question',
        confirmButtonText: 'Yes, Claim Pass',
        cancelButtonText: 'Cancel',
        isDanger: false
      },
      '',
      {
        html: `
          <div style="font-size: 13px; line-height: 1.5; margin-top: 6px; color: inherit;">
            <p style="margin-bottom: 8px;">Are you sure you want to claim a free visitor pass for:</p>
            <div style="font-weight: 800; font-size: 15px; margin: 8px 0; color: #f59e0b;">${expo.title}</div>
            ${expo.venue || expo.city ? `<div style="font-size: 12px; margin-bottom: 8px; opacity: 0.85;">📍 ${[expo.venue, expo.city].filter(Boolean).join(', ')}</div>` : ''}
            <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-top: 8px;">✓ Instant digital QR entry badge will be generated for gate check-in</div>
          </div>
        `
      }
    );

    if (!confirmed) return;

    setClaimingId(eventId);

    try {
      const res = await axios.post(`${API_URL}/visitors/register`, {
        eventId,
        name: user?.name || user?.email?.split('@')[0] || 'Visitor',
        email: user?.email,
        phone: user?.phone || '+91-9999999999',
        company: user?.organization?.name || 'Trade Attendee',
        designation: 'Business Visitor',
        country: 'India',
        attendanceType: 'in_person'
      });

      if (res.data && res.data.success) {
        setClaimSuccessMessage(`Pass confirmed for "${expo.title}"! Your QR badge is active.`);
        await fetchMyPasses();
        showSweetSuccess(`Your digital entry badge for "${expo.title}" is ready and available under My Passes & Badges.`, 'Pass Confirmed! 🎉');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration could not be completed. You may already be registered.';
      setClaimError(errMsg);
      showSweetError(errMsg, 'Registration Notice');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold text-foreground bg-background hover:bg-muted border border-border hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <div className="h-4.5 w-4.5 rounded-lg bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <ArrowLeft className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-hover:-translate-x-0.5" />
              </div>
              <span>Back to Passes &amp; Badges</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-xl border border-emerald-500/20 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Live Directory Feed</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            Explore Live Exhibitions &amp; Passes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Browse verified trade shows directly from visitexpo.in. Claim your digital badges and gate entry passes in 1 click without leaving your dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Ticket className="h-4 w-4" /> View My Confirmed Badges ({passes.length})
          </Link>
        </div>
      </div>

      {/* Status Alerts */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{claimSuccessMessage}</span>
          </div>
          <button onClick={() => setClaimSuccessMessage('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {claimError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{claimError}</span>
          </div>
          <button onClick={() => setClaimError('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Keyword Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expos by title, venue, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target.value || '').replace(/[<>!@#$%^&*()=+~`\\|{}[\];:"?]/g, ''))}
              onKeyDown={(e) => {
                if (e.key && e.key.length === 1 && /[<>!@#$%^&*()=+~`\\|{}[\];:"?]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                }
              }}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* City Dropdown (Searchable) */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
            <div className="w-full md:w-56">
              <SearchableSelect
                options={availableCities}
                value={selectedCity}
                onChange={(val) => setSelectedCity(val)}
                placeholder="All Cities"
                searchPlaceholder="Search cities..."
                className="h-10 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                dropdownClassName="min-w-[220px]"
                align="right"
              />
            </div>
          </div>
        </div>

        {/* Category Pills (Multi-Select with Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Industry:
            </span>

            {/* "All" button */}
            <button
              type="button"
              onClick={() => toggleCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isAllCategories
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border border-amber-500 shadow-sm ring-2 ring-amber-500/30 font-black'
                  : 'bg-card hover:bg-muted text-foreground/80 border border-border/80 hover:shadow-xs'
              }`}
            >
              All
            </button>

            {/* Category Options */}
            {categoriesList
              .filter((c) => c !== 'All')
              .map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border border-amber-500 shadow-sm ring-2 ring-amber-500/30 scale-102 font-black'
                        : 'bg-card hover:bg-amber-400 hover:text-black hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-black text-foreground/80 border border-border/80 hover:shadow-xs hover:-translate-y-0.5'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3] ml-0.5" />}
                  </button>
                );
              })}
          </div>

          {/* Reset & Count Indicator */}
          {!isAllCategories && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                {selectedCategories.length} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategories(['All'])}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-muted-foreground hover:text-rose-500 bg-muted/60 hover:bg-rose-500/10 border border-border hover:border-rose-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Reset industry filter"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exhibitions Grid & Controls */}
      <div className="space-y-4">
        {/* Sub-Header Bar with Counter, Sort, and Per-Page Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-card/60 border border-border/80 rounded-2xl p-3 px-4 shadow-2xs backdrop-blur-xs">
          {/* Left: Range and Active Filters */}
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>
              Showing{' '}
              <strong className="text-foreground font-bold">
                {totalItems === 0
                  ? 0
                  : `${Math.min((activePage - 1) * itemsPerPage + 1, totalItems)}–${Math.min(activePage * itemsPerPage, totalItems)}`}
              </strong>{' '}
              of <strong className="text-foreground font-bold">{totalItems.toLocaleString()}</strong> trade exhibitions
            </span>

            {(searchQuery || selectedCity !== 'All Cities' || !isAllCategories) && (
              <>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('All Cities');
                    setSelectedCategories(['All']);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                  <span>Reset Filters</span>
                </button>
              </>
            )}
          </div>

          {/* Right: Sort & Per Page Options */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="upcoming">Sort: Date (Earliest)</option>
                <option value="title-asc">Sort: Title (A–Z)</option>
                <option value="title-desc">Sort: Title (Z–A)</option>
              </select>
            </div>

            <span className="text-border hidden md:inline">•</span>

            {/* Per-Page Pill Group */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="hidden md:inline">Per page:</span>
              <div className="inline-flex rounded-lg border border-border bg-background p-0.5 shadow-2xs">
                {[12, 24, 48, 96].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setItemsPerPage(size)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      itemsPerPage === size
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-2xs font-black'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loadingEvents ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Fetching verified trade exhibitions...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">No exhibitions match your search criteria.</p>
            <p className="text-xs text-muted-foreground">Try selecting a different city or resetting your industry category filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.map((expo) => {
              const expoId = expo.id || expo._id;
              const isClaimed = registeredEventIds.has(expoId);
              const isClaiming = claimingId === expoId;

              return (
                <div
                  key={expoId}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/60 dark:hover:border-amber-400/50 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group"
                >
                  <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                    {expo.image ? (
                      <img
                        src={expo.image}
                        alt={expo.title}
                        className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10 group-hover:border-primary/40 transition-colors">
                      {expo.category || 'Trade Show'}
                    </span>
                    <span className="absolute top-3 right-3 rounded-md bg-[#FFCC00] px-2.5 py-0.5 text-[10px] font-extrabold text-zinc-950 shadow-sm">
                      {expo.entryType || 'Free Visitor Pass'}
                    </span>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{expo.dates || 'Upcoming 2026'}</span>
                      </div>

                      <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors" title={expo.title}>
                        {expo.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{expo.venue || 'Convention Center'}, {expo.city || 'India'}</span>
                      </div>

                      {expo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                          {expo.description}
                        </p>
                      )}

                      {expo.startDate && (
                        <div className="pt-2">
                          <ShowCountdownTimer
                            startDate={expo.startDate}
                            endDate={expo.endDate}
                            timings={expo.timings}
                            variant="compact"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Link
                        href={`/expo/${encodeURIComponent(expo.slug || expoId)}`}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        Details
                      </Link>

                      <EventPassAvailability event={expo}>
                        {isClaimed ? (
                          <div className="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pass Active
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaimPass(expo)}
                            disabled={isClaiming}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3.5 text-xs transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                          >
                            {isClaiming ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Issuing...
                              </>
                            ) : (
                              <>
                                <Ticket className="h-3.5 w-3.5" /> Claim Free Pass
                              </>
                            )}
                          </button>
                        )}
                      </EventPassAvailability>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================== */}
        {/* BOTTOM PAGINATION CONTROLS                                            */}
        {/* ===================================================================== */}
        {!loadingEvents && totalPages > 1 && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            {/* Page Count */}
            <div className="text-xs text-muted-foreground font-medium">
              Page <strong className="text-foreground font-bold">{activePage}</strong> of{' '}
              <strong className="text-foreground font-bold">{totalPages}</strong> ({totalItems.toLocaleString()} total exhibitions)
            </div>

            {/* Numeric Page Navigator */}
            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
                disabled={activePage === 1}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - activePage) <= 2)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-muted-foreground text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 320, behavior: 'smooth' });
                        }}
                        className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activePage === pageNum
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black shadow-md border border-amber-500'
                            : 'bg-background border border-border text-foreground hover:bg-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                aria-label="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Printable QR Entry Badge */}
      {selectedPassForBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-center printable-badge-card">
            <button
              type="button"
              onClick={() => setSelectedPassForBadge(null)}
              className="no-print absolute top-4 right-4 h-8 w-8 inline-flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary border border-border/60 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Close badge modal"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <Ticket className="h-3 w-3" /> Verified Entry Badge
              </div>
              <h3 className="text-base font-extrabold text-foreground leading-tight pt-1">
                {selectedPassForBadge.event?.title || 'Trade Exhibition'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {selectedPassForBadge.event?.venue}, {selectedPassForBadge.event?.city}
              </p>
            </div>

            <div className="bg-secondary/70 border border-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendee</span>
              <h2 className="text-lg font-extrabold text-foreground">{selectedPassForBadge.name}</h2>
              <span className="inline-block text-[11px] font-bold text-amber-500 uppercase">
                {selectedPassForBadge.company || 'Trade Visitor'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-zinc-300 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPassForBadge.qrCode || `VIS-${selectedPassForBadge._id}`)}`}
                alt="Entry QR Code"
                className="h-44 w-44 object-contain"
              />
              <span className="text-[10px] font-mono font-bold text-zinc-800 mt-2 tracking-widest">
                VIS-{selectedPassForBadge._id.slice(-8).toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Present this digital pass at the entrance scanner for instant check-in.
            </p>

            <div className="no-print flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => printBadge(selectedPassForBadge)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 text-xs shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Badge
              </button>
              <button
                type="button"
                onClick={() => setSelectedPassForBadge(null)}
                className="rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
