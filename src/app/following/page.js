'use client';

/**
 * @file following/page.js
 * @description Dedicated Followed Expos & Organizers Page for VisitExpo.
 * Displays which expos users have followed and which organizers manage those expos,
 * complete with organizer live chat capability and grouped organizer views.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import { useAuth } from '@/context/AuthContext.js';
import axios from 'axios';
import { showSweetConfirm } from '@/utils/sweetalert.js';
import {
  Bell,
  BellRing,
  Building,
  Building2,
  Calendar,
  MapPin,
  Globe,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Ticket,
  Sparkles,
  Users,
  Layers,
  Star,
  Bookmark,
  Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function FollowingPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [organizersDirectory, setOrganizersDirectory] = useState([]);
  const [followedSlugs, setFollowedSlugs] = useState(new Set());
  const [savedDetailsMap, setSavedDetailsMap] = useState({});
  const [activeTab, setActiveTab] = useState('expos'); // 'expos' | 'organizers'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const itemsPerPage = 6;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch live events & organizers directory in parallel with instant cache
  useEffect(() => {
    let isMounted = true;

    // Check instant sessionStorage cache first (0ms)
    if (typeof window !== 'undefined') {
      const cached =
        sessionStorage.getItem('visitexpo_bookmarks_events_cache') ||
        sessionStorage.getItem('visitexpo_home_events') ||
        sessionStorage.getItem('visitexpo_visitor_expos_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllEvents(parsed);
          }
        } catch (_) {}
      }
    }

    const maxTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    const fetchData = async () => {
      try {
        let eventsList = [];
        try {
          const res = await axios.get('/api/wordpress-events', { timeout: 3500 });
          if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
            eventsList = res.data.events;
          }
        } catch (_) {}

        if (eventsList.length === 0) {
          try {
            const fetchRes = await fetch('/api/wordpress-events', { signal: AbortSignal.timeout(3500) });
            if (fetchRes.ok) {
              const json = await fetchRes.json();
              if (json?.success && Array.isArray(json?.events)) {
                eventsList = json.events;
              }
            }
          } catch (_) {}
        }

        const orgsRes = await axios.get(`${API_URL}/chat/organizers-directory`, { timeout: 3000 }).catch(() => null);

        if (isMounted) {
          if (eventsList.length > 0) setAllEvents(eventsList);
          if (orgsRes?.data?.success && Array.isArray(orgsRes.data?.organizers)) {
            setOrganizersDirectory(orgsRes.data.organizers);
          }
        }
      } catch (err) {
        console.error('Failed to load following directory data:', err);
      } finally {
        if (isMounted) {
          clearTimeout(maxTimer);
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
      clearTimeout(maxTimer);
    };
  }, []);

  // 2. Load followed events from localStorage & backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const followed = localStorage.getItem('visitexpo_followed_events');
        if (followed) {
          const parsed = JSON.parse(followed);
          if (Array.isArray(parsed)) {
            setFollowedSlugs(new Set(parsed.map((s) => String(s).toLowerCase().trim())));
          }
        }

        const rawDetails = localStorage.getItem('visitexpo_saved_event_details');
        if (rawDetails) {
          setSavedDetailsMap(JSON.parse(rawDetails) || {});
        }

        if (followed || rawDetails) {
          setLoading(false);
        }
      } catch (_) {}
    }

    if (user?.email) {
      axios
        .get(`/api/engagements/user/${encodeURIComponent(user.email)}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            const followedList = res.data.data.followedEvents || [];
            if (followedList.length > 0) {
              setFollowedSlugs((prev) => {
                const next = new Set(prev);
                followedList.forEach((e) => {
                  const s = (e.eventSlug || e.slug || e.eventId || e.id || '').toLowerCase().trim();
                  if (s) next.add(s);
                });
                return next;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Handle Unfollow Expo
  const handleUnfollow = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    if (!slug) return;

    const confirmed = await showSweetConfirm({
      title: 'Unfollow this expo?',
      text: `Are you sure you want to unfollow "${evt.title || 'this exhibition'}"? You will no longer receive its updates.`,
      icon: 'warning',
      confirmButtonText: 'Yes, unfollow',
      cancelButtonText: 'Keep following',
      isDanger: true
    });

    if (!confirmed) return;

    setFollowedSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_followed_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    showToast(`Unfollowed "${evt.title}". Notifications disabled.`);

    if (user?.email) {
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'follower',
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Helper: Find organizer details for any event
  const getOrganizerForEvent = (evt) => {
    if (!evt) return null;

    // Direct lookup in organizers directory
    const matched = organizersDirectory.find((org) => {
      // By event list
      if (Array.isArray(org.events)) {
        const hasEvt = org.events.some(
          (e) =>
            String(e.slug || e.id || '').toLowerCase() === String(evt.slug || evt.id || '').toLowerCase() ||
            String(e.title || '').toLowerCase() === String(evt.title || '').toLowerCase()
        );
        if (hasEvt) return true;
      }
      // By name or organizer tag
      if (evt.organizer && org.name && org.name.toLowerCase() === evt.organizer.toLowerCase()) {
        return true;
      }
      if (evt.organizerName && org.name && org.name.toLowerCase() === evt.organizerName.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (matched) {
      return {
        id: matched.id || matched.organizerId,
        name: matched.name,
        company: matched.scope || matched.badge || 'Trade Show Council',
        logoUrl: matched.logoUrl,
        isChatEnabled: !!matched.isChatEnabled,
        chatStatus: matched.chatStatus || 'offline',
        isVerified: !!matched.isVerified
      };
    }

    // Fallback using event's own organizer fields
    return {
      id: evt.organizerId || 'org_general',
      name: evt.organizer || evt.organizerName || 'Exhibition Steering Committee',
      company: evt.organizerCompany || 'Official Trade Show Authority',
      logoUrl: null,
      isChatEnabled: false,
      chatStatus: 'offline',
      isVerified: true
    };
  };

  // Helper to test if event is followed
  const isEventFollowed = (evt) => {
    if (!evt || followedSlugs.size === 0) return false;
    const idStr = String(evt.id ?? '').toLowerCase().trim();
    const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
    const mongoStr = String(evt._id ?? '').toLowerCase().trim();
    const slugStr = String(evt.slug ?? '').toLowerCase().trim();
    const titleSlug = (evt.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    for (const item of Array.from(followedSlugs)) {
      if (!item) continue;
      const kStr = String(item).toLowerCase().trim();
      if (
        (idStr && kStr === idStr) ||
        (wpStr && kStr === wpStr) ||
        (mongoStr && kStr === mongoStr) ||
        (slugStr && kStr === slugStr) ||
        (titleSlug && kStr === titleSlug) ||
        (kStr.length > 3 && (slugStr.includes(kStr) || kStr.includes(slugStr)))
      ) {
        return true;
      }
    }
    return false;
  };

  // List of Followed Expos with Organizer Details
  const followedExposWithOrganizers = useMemo(() => {
    if (followedSlugs.size === 0) return [];

    const matchedMap = new Map();

    // 1. Match from live allEvents
    allEvents.forEach((evt) => {
      if (isEventFollowed(evt)) {
        const key = String(evt.slug || evt.id).toLowerCase();
        if (!matchedMap.has(key)) {
          matchedMap.set(key, {
            ...evt,
            organizer: getOrganizerForEvent(evt)
          });
        }
      }
    });

    // 2. Match from savedDetailsMap
    Object.values(savedDetailsMap).forEach((d) => {
      if (!d) return;
      const key = String(d.slug || d.id).toLowerCase();
      if (followedSlugs.has(key) && !matchedMap.has(key)) {
        const fullEvt = {
          id: d.id || key,
          slug: d.slug || key,
          title: d.title || key.replace(/-/g, ' ').toUpperCase(),
          dates: d.dates || 'Upcoming Edition 2026',
          venue: d.venue || d.city || 'Exhibition Centre',
          city: d.city || 'India',
          country: d.country || 'India',
          category: d.category || 'Trade Show',
          image: d.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: d.organizer || 'Verified Organizer'
        };
        matchedMap.set(key, {
          ...fullEvt,
          organizer: getOrganizerForEvent(fullEvt)
        });
      }
    });

    // 3. Fallback synthesis for any unmatched followed slug
    Array.from(followedSlugs).forEach((slugKey, idx) => {
      if (!slugKey) return;
      const strKey = String(slugKey).toLowerCase().trim();
      const alreadyPresent = Array.from(matchedMap.values()).some((evt) => {
        const idStr = String(evt.id || '').toLowerCase().trim();
        const sStr = String(evt.slug || '').toLowerCase().trim();
        return idStr === strKey || sStr === strKey;
      });

      if (!alreadyPresent) {
        const readableTitle = isNaN(strKey)
          ? decodeURIComponent(strKey).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : `Exhibition #${strKey}`;
        const synthetic = {
          id: strKey,
          slug: strKey,
          title: readableTitle || 'Followed Exhibition',
          dates: 'Upcoming 2026 Edition',
          venue: 'Convention & Trade Center',
          city: 'India',
          country: 'India',
          category: 'Trade Show',
          image: 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: 'Verified Organizer'
        };
        matchedMap.set(strKey, {
          ...synthetic,
          organizer: getOrganizerForEvent(synthetic)
        });
      }
    });

    let list = Array.from(matchedMap.values());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.organizer?.name?.toLowerCase().includes(q) ||
          e.organizer?.company?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allEvents, followedSlugs, organizersDirectory, savedDetailsMap, searchQuery]);

  // Grouped Organizers View: which organizers manage your followed expos
  const followedOrganizersGrouped = useMemo(() => {
    const map = new Map();

    followedExposWithOrganizers.forEach((evt) => {
      const orgName = evt.organizer?.name || 'Trade Fair Organizers';
      const orgKey = orgName.toLowerCase().trim();

      if (!map.has(orgKey)) {
        map.set(orgKey, {
          organizer: evt.organizer,
          expos: [evt]
        });
      } else {
        map.get(orgKey).expos.push(evt);
      }
    });

    return Array.from(map.values());
  }, [followedExposWithOrganizers]);

  const activeItems = activeTab === 'expos' ? followedExposWithOrganizers : followedOrganizersGrouped;
  const totalPages = Math.ceil(activeItems.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageStartIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedExpos = followedExposWithOrganizers.slice(pageStartIndex, pageStartIndex + itemsPerPage);
  const paginatedOrganizers = followedOrganizersGrouped.slice(pageStartIndex, pageStartIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FFCC00] selection:text-zinc-950 flex flex-col">
      <Navbar solid={true} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 text-white border border-zinc-700 shadow-2xl text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8">
        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/90 p-8 sm:p-10 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-800">
                <Bell className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
                <span>Following &amp; Notification Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
                Followed Expos &amp; Organizers
              </h1>
              <p className="text-zinc-600 text-sm sm:text-base max-w-xl leading-relaxed">
                Stay updated with your followed exhibitions and the trade show organizers behind them.
                Receive schedule updates, booth releases, and chat directly with organizer desks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/organizers"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black px-5 py-3 text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-zinc-950" />
                <span>Browse All Organizers</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Followed Expos</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{followedExposWithOrganizers.length || followedSlugs.size}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Associated Organizers</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{followedOrganizersGrouped.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Active Desk Channels</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">
                {
                  followedOrganizersGrouped.filter((g) => g.organizer?.isChatEnabled).length
                }
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & Search */}
        {(followedExposWithOrganizers.length > 0 || followedSlugs.size > 0) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Tab Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('expos');
                    setCurrentPage(1);
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'expos'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Followed Expos ({followedExposWithOrganizers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('organizers');
                    setCurrentPage(1);
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'organizers'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Organizers Followed ({followedOrganizersGrouped.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search expos or organizers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-[#F8F9FA] text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading && followedSlugs.size === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-16 flex flex-col items-center justify-center space-y-3 shadow-xs">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-500">
              Loading your followed exhibitions and organizers...
            </p>
          </div>
        ) : followedSlugs.size === 0 ? (
          /* EMPTY STATE */
          <div className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-white px-6 py-14 text-center shadow-sm sm:px-12 sm:py-16">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(219,234,254,0.65),transparent_58%)]" />
            <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border border-blue-100/70" />
            <div aria-hidden="true" className="absolute -right-8 -top-12 -z-10 h-48 w-48 rounded-full border border-blue-100/70" />

            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-8 ring-blue-50">
                <Bell className="h-9 w-9 fill-white" />
                <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-4 border-white bg-[#FFCC00]" />
              </div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Build your expo network
              </span>
              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
                Your next great connection starts here
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-600 sm:text-base">
                Follow exhibitions to keep event dates, booth announcements, and verified organizer updates all in one place.
              </p>
              <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFCC00] px-6 py-3 text-sm font-black text-zinc-950 shadow-md shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-[#FFB703] hover:shadow-lg active:translate-y-0 active:scale-95"
              >
                <span>Explore exhibitions</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/organizers"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                <Building2 className="h-4 w-4" />
                <span>Browse organizers</span>
              </Link>
              </div>
            </div>
          </div>
        ) : activeTab === 'expos' ? (
          /* ============================================================== */
          /* TAB 1: FOLLOWED EXPOS WITH ORGANIZER CONNECTION CARDS          */
          /* ============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {paginatedExpos.map((evt) => {
              const eventSlug = evt.slug || evt.id;
              const org = evt.organizer;

              return (
                <article
                  key={evt.id}
                  className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col group relative shadow-xs"
                >
                  {/* Media Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    <img
                      src={
                        evt.image ||
                        'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg'
                      }
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-zinc-950/80 text-white shadow-md border border-white/20 backdrop-blur-md">
                        {evt.category || 'Trade Show'}
                      </span>

                      {/* Following Status Indicator */}
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-md">
                        <Bell className="h-2.5 w-2.5 fill-white" />
                        <span>Following</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-3">
                      {/* Dates */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span>{evt.dates || 'Upcoming 2026 Edition'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-zinc-950 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        <Link href={`/expo/${eventSlug}`}>
                          {evt.title}
                        </Link>
                      </h2>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                      </div>

                      {/* ORGANIZER CONNECTION CARD */}
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Organized By
                          </span>
                          {org?.isVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-900 shrink-0">
                            {(org?.name || 'O').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-zinc-950 block truncate">
                              {org?.name || 'Trade Show Council'}
                            </span>
                            <span className="text-[11px] text-zinc-500 block truncate">
                              {org?.company}
                            </span>
                          </div>
                        </div>

                        {/* Live Chat Action with Organizer */}
                        {org?.isChatEnabled && (
                          <div className="pt-1.5 border-t border-zinc-200/80 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                              <span>Live Chat Desk</span>
                            </span>

                            <Link
                              href="/organizers"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Chat Now</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => handleUnfollow(evt)}
                        className="text-xs font-bold text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                        title="Unfollow this exhibition"
                      >
                        Unfollow Expo
                      </button>

                      <Link
                        href={`/expo/${eventSlug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-950 text-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 font-black text-xs transition shadow-sm active:scale-95"
                      >
                        <span>View Expo</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ============================================================== */
          /* TAB 2: GROUPED ORGANIZERS VIEW                                 */
          /* ============================================================== */
          <div className="space-y-6">
            {paginatedOrganizers.map((group, idx) => {
              const org = group.organizer;

              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Organizer Header */}
                  <div className="flex flex-col gap-5 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-xl font-black text-blue-800 shadow-sm ring-4 ring-blue-50">
                        {(org?.name || 'O').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold tracking-tight text-zinc-950 sm:text-xl">{org?.name}</h3>
                          {org?.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs font-medium text-zinc-500 sm:text-sm">
                          {org?.company || 'Verified Trade Fair Organizer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Link
                        href="/organizers"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span>All Organizer Expos</span>
                      </Link>

                      {org?.isChatEnabled && (
                        <Link
                          href="/organizers"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#FFCC00] px-3.5 py-2.5 text-xs font-black text-zinc-950 shadow-xs transition hover:bg-[#FFB703] active:scale-95"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat with Organizer</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Followed Expos under this Organizer */}
                  <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">Followed exhibitions</h4>
                        <p className="mt-0.5 text-xs text-zinc-500">Events managed by this organizer</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 ring-1 ring-blue-100">
                        {group.expos.length} {group.expos.length === 1 ? 'expo' : 'expos'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {group.expos.map((evt) => (
                        <div
                          key={evt.id}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row"
                        >
                          <div className="relative h-36 shrink-0 overflow-hidden bg-blue-50 sm:h-auto sm:min-h-44 sm:w-36">
                            <img
                              src={evt.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg'}
                              alt={evt.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent sm:bg-gradient-to-r" />
                            <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-blue-800 shadow-sm backdrop-blur">
                              {evt.category || 'Exhibition'}
                            </span>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                <Bell className="h-3 w-3 fill-blue-600" />
                                Following
                              </div>
                              <h5 className="line-clamp-2 text-base font-extrabold leading-snug text-zinc-950 transition-colors group-hover:text-blue-800">
                                {evt.title}
                              </h5>
                              <div className="space-y-2">
                                <p className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                                  <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                  <span className="line-clamp-1">{evt.dates || 'Upcoming'}</span>
                                </p>
                                {(evt.venue || evt.city) && (
                                  <p className="flex items-center gap-2 text-xs text-zinc-500">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                                    <span className="line-clamp-1">{evt.venue || evt.city}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-xs">
                              <button
                                type="button"
                                onClick={() => handleUnfollow(evt)}
                                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 font-semibold text-zinc-600 shadow-xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 cursor-pointer"
                              >
                                Unfollow
                              </button>

                              <Link
                                href={`/expo/${evt.slug || evt.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 font-bold text-[#FFCC00] transition hover:bg-[#FFCC00] hover:text-zinc-950"
                              >
                                View details
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-4 sm:flex-row">
            <p className="text-xs font-medium text-zinc-500">
              Showing <strong className="text-zinc-900">{pageStartIndex + 1}</strong>–<strong className="text-zinc-900">{Math.min(pageStartIndex + itemsPerPage, activeItems.length)}</strong> of{' '}
              <strong className="text-zinc-900">{activeItems.length}</strong> {activeTab === 'expos' ? 'expos' : 'organizers'}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="px-2 text-xs font-semibold text-zinc-600">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
