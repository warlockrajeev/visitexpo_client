'use client';

/**
 * @file bookmarks/page.js
 * @description Dedicated Bookmarks Page for VisitExpo users.
 * Displays all exhibitions, trade shows, and summits bookmarked by the user.
 * Seamlessly merges localStorage and authenticated backend user engagements.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import { useAuth } from '@/context/AuthContext.js';
import axios from 'axios';
import {
  Bookmark,
  Calendar,
  MapPin,
  Globe,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Tag,
  Star,
  Sparkles,
  Ticket,
  SlidersHorizontal,
  RefreshCw,
  Building,
  Layers,
  ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BookmarksPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [savedDetailsMap, setSavedDetailsMap] = useState({});
  const [backendBookmarkedEvents, setBackendBookmarkedEvents] = useState([]);
  const [interestedSlugs, setInterestedSlugs] = useState(new Set());
  const [claimedPassIds, setClaimedPassIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('upcoming');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch live events list (with resilient axios + fetch fallback)
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let eventsList = [];
        try {
          const res = await axios.get('/api/wordpress-events');
          if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
            eventsList = res.data.events;
          }
        } catch (_) {}

        if (eventsList.length === 0) {
          const fetchRes = await fetch('/api/wordpress-events');
          if (fetchRes.ok) {
            const json = await fetchRes.json();
            if (json?.success && Array.isArray(json?.events)) {
              eventsList = json.events;
            }
          }
        }

        if (isMounted && eventsList.length > 0) {
          setAllEvents(eventsList);
        }
      } catch (err) {
        console.error('Failed to load events in bookmarks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Bookmarks & Interests from localStorage & backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedEventIds(new Set(parsed));
          }
        }

        const rawDetails = localStorage.getItem('visitexpo_saved_event_details');
        if (rawDetails) {
          setSavedDetailsMap(JSON.parse(rawDetails) || {});
        }

        const interested = localStorage.getItem('visitexpo_interested_events');
        if (interested) {
          const parsedInt = JSON.parse(interested);
          if (Array.isArray(parsedInt)) {
            setInterestedSlugs(new Set(parsedInt.map((s) => String(s).toLowerCase().trim())));
          }
        }
      } catch (_) {}
    }

    if (user?.email) {
      axios
        .get(`/api/engagements/user/${encodeURIComponent(user.email)}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            const bookmarkedList = res.data.data.bookmarkedEvents || [];
            const interestedList = res.data.data.interestedEvents || [];

            if (bookmarkedList.length > 0) {
              setBackendBookmarkedEvents(bookmarkedList);
              setSavedEventIds((prev) => {
                const next = new Set(prev);
                bookmarkedList.forEach((e) => {
                  if (e.eventId) next.add(e.eventId);
                  if (e.eventSlug) next.add(e.eventSlug);
                  if (e.id) next.add(e.id);
                  if (e._id) next.add(e._id);
                });
                return next;
              });
            }

            if (interestedList.length > 0) {
              setInterestedSlugs((prev) => {
                const next = new Set(prev);
                interestedList.forEach((e) => {
                  const s = (e.eventSlug || e.slug || e.id || '').toLowerCase().trim();
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

  // Handle Remove Bookmark
  const handleRemoveBookmark = async (eventId, evt) => {
    const slug = (evt?.slug || evt?.id || eventId || '').toLowerCase().trim();
    const idKey = String(eventId || evt?.id || slug).trim();

    setSavedEventIds((prev) => {
      const next = new Set();
      Array.from(prev).forEach((item) => {
        if (!item) return;
        if (typeof item === 'object') {
          const oId = String(item.id || item.eventId || '').trim();
          const oSlug = String(item.slug || item.eventSlug || '').toLowerCase().trim();
          if (oId !== idKey && oSlug !== slug) next.add(item);
        } else {
          const str = String(item).toLowerCase().trim();
          if (str !== slug && str !== idKey.toLowerCase()) next.add(item);
        }
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(next)));
        try {
          const rawMap = localStorage.getItem('visitexpo_saved_event_details');
          const map = rawMap ? JSON.parse(rawMap) : {};
          delete map[idKey];
          if (slug) delete map[slug];
          setSavedDetailsMap(map);
          localStorage.setItem('visitexpo_saved_event_details', JSON.stringify(map));
        } catch (_) {}
      }
      return next;
    });

    setBackendBookmarkedEvents((prev) =>
      prev.filter((e) => {
        const bSlug = (e.eventSlug || e.slug || e.eventId || '').toLowerCase().trim();
        return bSlug !== slug && bSlug !== idKey.toLowerCase();
      })
    );

    showToast(`Removed "${evt?.title || 'Event'}" from bookmarks.`);

    if (user?.email) {
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'bookmark',
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Toggle Interest
  const handleToggleInterest = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    if (!slug) return;

    const isCurrentlyInterested = interestedSlugs.has(slug);
    const nextInterested = !isCurrentlyInterested;

    setInterestedSlugs((prev) => {
      const next = new Set(prev);
      if (nextInterested) next.add(slug);
      else next.delete(slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_interested_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    showToast(
      nextInterested
        ? `Marked interest in "${evt.title}"!`
        : `Removed interest from "${evt.title}".`
    );

    if (user?.email) {
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'interested',
          eventTitle: evt.title,
          eventCity: evt.city,
          eventVenue: evt.venue,
          eventDates: evt.dates,
          eventCategory: evt.category,
          eventImage: evt.image,
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Claim Pass
  const handleClaimPass = (evt) => {
    setClaimedPassIds((prev) => new Set(prev).add(evt.id));
    showToast(`Free Visitor Pass confirmed for "${evt.title}"! Badge ready.`);
  };

  // Universal Matcher: checks if an event matches any item in savedEventIds or savedDetailsMap
  const isEventSaved = (evt) => {
    if (!evt || savedEventIds.size === 0) return false;
    const rawList = Array.from(savedEventIds);

    const idStr = String(evt.id ?? '').toLowerCase().trim();
    const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
    const mongoStr = String(evt._id ?? '').toLowerCase().trim();
    const slugStr = String(evt.slug ?? '').toLowerCase().trim();
    const titleSlug = (evt.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    for (const item of rawList) {
      if (!item) continue;
      if (typeof item === 'object') {
        const oId = String(item.id || item.eventId || item._id || '').toLowerCase().trim();
        const oSlug = String(item.slug || item.eventSlug || '').toLowerCase().trim();
        const oWp = String(item.wpPostId || '').toLowerCase().trim();
        if (oId && (oId === idStr || oId === wpStr || oId === mongoStr)) return true;
        if (oWp && (oWp === wpStr || oWp === idStr)) return true;
        if (oSlug && (oSlug === slugStr || oSlug === titleSlug)) return true;
        continue;
      }

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

    if (savedDetailsMap) {
      if (idStr && savedDetailsMap[idStr]) return true;
      if (slugStr && savedDetailsMap[slugStr]) return true;
      if (wpStr && savedDetailsMap[wpStr]) return true;
    }

    return false;
  };

  // Filter Bookmarked Events (combining allEvents, savedDetailsMap, and backendBookmarkedEvents)
  const bookmarkedEvents = useMemo(() => {
    if (savedEventIds.size === 0 && backendBookmarkedEvents.length === 0 && Object.keys(savedDetailsMap).length === 0) {
      return [];
    }

    // 1. Match from live directory (allEvents)
    const matchedMap = new Map();
    allEvents.forEach((evt) => {
      if (isEventSaved(evt)) {
        const key = String(evt.slug || evt.id).toLowerCase();
        if (!matchedMap.has(key)) {
          matchedMap.set(key, evt);
        }
      }
    });

    // 2. Include any savedDetailsMap items not yet matched
    Object.values(savedDetailsMap).forEach((d) => {
      if (!d) return;
      const key = String(d.slug || d.id).toLowerCase();
      if (!matchedMap.has(key)) {
        matchedMap.set(key, {
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
        });
      }
    });

    // 3. Include any backendBookmarkedEvents not yet matched
    backendBookmarkedEvents.forEach((b) => {
      if (!b) return;
      const key = String(b.eventSlug || b.slug || b.eventId || b.id).toLowerCase();
      if (!matchedMap.has(key)) {
        matchedMap.set(key, {
          id: b.eventId || b.eventSlug || b._id || key,
          slug: b.eventSlug || b.slug || key,
          title: b.eventTitle || b.title || key.replace(/-/g, ' ').toUpperCase(),
          dates: b.eventDates || b.dates || 'Upcoming Edition 2026',
          venue: b.eventVenue || b.venue || 'Exhibition Centre',
          city: b.eventCity || b.city || 'India',
          country: b.eventCountry || b.country || 'India',
          category: b.eventCategory || b.category || 'Trade Show',
          image: b.eventImage || b.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: b.organizerName || b.organizer || 'Verified Organizer'
        });
      }
    });

    // 4. Guarantee EVERY saved entry in savedEventIds is matched or synthesized
    if (savedEventIds.size > 0) {
      Array.from(savedEventIds).forEach((item, idx) => {
        if (!item) return;
        const rawKey = typeof item === 'object' ? (item.slug || item.eventSlug || item.id || `saved-${idx}`) : String(item);
        const strKey = String(rawKey).toLowerCase().trim();
        if (!strKey) return;

        // Check if any event in matchedMap already corresponds to this saved key
        const alreadyMatched = Array.from(matchedMap.values()).some((evt) => {
          const idStr = String(evt.id ?? '').toLowerCase().trim();
          const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
          const slugStr = String(evt.slug ?? '').toLowerCase().trim();
          return idStr === strKey || wpStr === strKey || slugStr === strKey;
        });

        if (!alreadyMatched) {
          // Check if we can find it in allEvents by id, wpPostId, or slug
          const found = allEvents.find((evt) => {
            const idStr = String(evt.id ?? '').toLowerCase().trim();
            const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
            const slugStr = String(evt.slug ?? '').toLowerCase().trim();
            return idStr === strKey || wpStr === strKey || slugStr === strKey;
          });

          if (found) {
            matchedMap.set(String(found.slug || found.id).toLowerCase(), found);
          } else {
            // Check savedDetailsMap
            const d = savedDetailsMap[strKey] || savedDetailsMap[rawKey];
            if (d) {
              matchedMap.set(strKey, {
                id: d.id || strKey,
                slug: d.slug || strKey,
                title: d.title || strKey.replace(/-/g, ' ').toUpperCase(),
                dates: d.dates || 'Upcoming Edition 2026',
                venue: d.venue || d.city || 'Exhibition Centre',
                city: d.city || 'India',
                country: d.country || 'India',
                category: d.category || 'Trade Show',
                image: d.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
                organizer: d.organizer || 'Verified Organizer'
              });
            } else {
              const readableTitle = isNaN(strKey)
                ? decodeURIComponent(strKey).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : `Exhibition #${strKey}`;
              matchedMap.set(strKey, {
                id: strKey,
                slug: strKey,
                title: readableTitle || 'Saved Exhibition',
                dates: 'Upcoming 2026 Edition',
                venue: 'Convention & Trade Center',
                city: 'India',
                country: 'India',
                category: 'Trade Show',
                image: 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
                organizer: 'Verified Organizer'
              });
            }
          }
        }
      });
    }

    let list = Array.from(matchedMap.values());

    // Category Filter
    if (selectedCategory !== 'all') {
      list = list.filter((e) =>
        e.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return (a.title || '').localeCompare(b.title || '');
    });

    return list;
  }, [allEvents, savedEventIds, savedDetailsMap, backendBookmarkedEvents, selectedCategory, searchQuery, sortBy]);

  // Distinct Categories in bookmarks
  const availableCategories = useMemo(() => {
    const cats = new Set();
    bookmarkedEvents.forEach((evt) => {
      if (evt.category) cats.add(evt.category);
    });
    return Array.from(cats);
  }, [bookmarkedEvents]);

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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Link href="/" className="hover:text-zinc-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/events" className="hover:text-zinc-950 transition-colors">
            Events
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-950 font-bold">Saved Bookmarks</span>
        </div>

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/90 p-8 sm:p-10 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-800">
                <Bookmark className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
                <span>Personal Event Collection</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
                My Bookmarked Exhibitions
              </h1>
              <p className="text-zinc-600 text-sm sm:text-base max-w-xl leading-relaxed">
                Your saved trade shows, exhibitions, and B2B summits. Review dates, reserve free passes,
                or connect with organizers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black px-5 py-3 text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>Browse More Events</span>
                <ArrowRight className="h-4 w-4 text-zinc-950" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Total Bookmarked</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{bookmarkedEvents.length || savedEventIds.size}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Free Passes Available</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{bookmarkedEvents.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Distinct Categories</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{availableCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        {(bookmarkedEvents.length > 0 || savedEventIds.size > 0) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search in your bookmarked exhibitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-[#F8F9FA] text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition"
                />
              </div>

              {availableCategories.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories ({availableCategories.length})</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookmarked Events Content */}
        {loading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-16 flex flex-col items-center justify-center space-y-3 shadow-xs">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-500">
              Loading your bookmarked exhibitions...
            </p>
          </div>
        ) : bookmarkedEvents.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 sm:p-16 text-center space-y-4 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <Bookmark className="h-8 w-8 fill-rose-600 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-950">
              {searchQuery || selectedCategory !== 'all'
                ? 'No matching bookmarked exhibitions'
                : 'No Bookmarked Exhibitions Yet'}
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try clearing your search filters to see all your saved events.'
                : 'Click the bookmark ribbon on any exhibition card to save it here for quick access, schedule reminders, and pass issuing.'}
            </p>
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black px-6 py-3 text-sm shadow-md transition active:scale-95"
              >
                <span>Browse Verified Exhibitions</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* GRID OF BOOKMARKED EVENTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {bookmarkedEvents.map((evt) => {
              const eventSlug = evt.slug || evt.id;
              const isClaimed = claimedPassIds.has(evt.id);
              const isInterested = interestedSlugs.has(String(eventSlug).toLowerCase()) || interestedSlugs.has(String(evt.id).toLowerCase());

              return (
                <article
                  key={evt.id}
                  className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden hover:border-rose-400 hover:shadow-xl transition-all duration-300 flex flex-col group relative shadow-xs"
                >
                  {/* Card Media Header */}
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

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges Row */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-zinc-950/80 text-white shadow-md border border-white/20 backdrop-blur-md">
                        {evt.category || 'Trade Show'}
                      </span>

                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FFCC00] to-amber-400 text-zinc-950 shadow-md">
                          Free Pass
                        </span>

                        {/* Remove Bookmark Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(evt.id, evt)}
                          className="p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition active:scale-95 cursor-pointer"
                          title="Remove from bookmarks"
                        >
                          <Bookmark className="h-3 w-3 fill-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-2.5">
                      {/* Dates */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{evt.dates || 'Upcoming 2026 Edition'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-zinc-950 leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors">
                        <Link href={`/expo/${eventSlug}`}>
                          {evt.title}
                        </Link>
                      </h2>

                      {/* Venue & Location */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {evt.venue || evt.city || 'India'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {evt.description ||
                          `Explore ${evt.title}, featuring international exhibitors, product showcases, and business networking.`}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
                      {/* Country */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-semibold truncate max-w-[100px]">
                        <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{evt.country || evt.city || 'India'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {/* Interested Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleInterest(evt)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isInterested
                              ? 'bg-amber-400 text-zinc-950 font-black shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                          title={isInterested ? 'Remove Interest' : 'Show Interest'}
                        >
                          <Star className={`h-3 w-3 ${isInterested ? 'fill-zinc-950' : 'text-amber-500'}`} />
                          <span className="hidden xs:inline">{isInterested ? 'Interested' : 'Interest'}</span>
                        </button>

                        {/* Get Pass */}
                        <button
                          type="button"
                          onClick={() => handleClaimPass(evt)}
                          className="cursor-pointer"
                        >
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Pass Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-950 text-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 font-black text-xs transition shadow-sm active:scale-95">
                              <span>Get Pass</span>
                              <ArrowRight className="h-3 w-3" />
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
      </main>

      <Footer />
    </div>
  );
}
