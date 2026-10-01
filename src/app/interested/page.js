'use client';

/**
 * @file interested/page.js
 * @description Dedicated Interested Events Page for VisitExpo.
 * Clean, modern white & light theme matching the exhibitions directory.
 * Displays all exhibitions and summits the user has expressed interest in attending.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import { useAuth } from '@/context/AuthContext.js';
import axios from 'axios';
import {
  Star,
  Bookmark,
  Calendar,
  MapPin,
  Globe,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Ticket,
  Sparkles,
  Building,
  Layers,
  Heart
} from 'lucide-react';

export default function InterestedEventsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [interestedSlugs, setInterestedSlugs] = useState(new Set());
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [savedDetailsMap, setSavedDetailsMap] = useState({});
  const [backendInterestedEvents, setBackendInterestedEvents] = useState([]);
  const [claimedPassIds, setClaimedPassIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch live events list (with axios + fetch fallback)
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
        console.error('Failed to load events in interested page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Interested and Saved events from localStorage & backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const interested = localStorage.getItem('visitexpo_interested_events');
        if (interested) {
          const parsed = JSON.parse(interested);
          if (Array.isArray(parsed)) {
            setInterestedSlugs(new Set(parsed.map((s) => String(s).toLowerCase().trim())));
          }
        }

        const saved = localStorage.getItem('visitexpo_saved_events');
        if (saved) {
          const parsedSaved = JSON.parse(saved);
          if (Array.isArray(parsedSaved)) {
            setSavedEventIds(new Set(parsedSaved));
          }
        }

        const rawDetails = localStorage.getItem('visitexpo_saved_event_details');
        if (rawDetails) {
          setSavedDetailsMap(JSON.parse(rawDetails) || {});
        }
      } catch (_) {}
    }

    if (user?.email) {
      axios
        .get(`/api/engagements/user/${encodeURIComponent(user.email)}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            const interestedList = res.data.data.interestedEvents || [];
            const bookmarkedList = res.data.data.bookmarkedEvents || [];

            if (interestedList.length > 0) {
              setBackendInterestedEvents(interestedList);
              setInterestedSlugs((prev) => {
                const next = new Set(prev);
                interestedList.forEach((e) => {
                  const s = (e.eventSlug || e.slug || e.eventId || e.id || '').toLowerCase().trim();
                  if (s) next.add(s);
                });
                return next;
              });
            }

            if (bookmarkedList.length > 0) {
              setSavedEventIds((prev) => {
                const next = new Set(prev);
                bookmarkedList.forEach((e) => {
                  const id = e.eventId || e.eventSlug || e.id || '';
                  if (id) next.add(id);
                });
                return next;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Handle Remove Interest
  const handleRemoveInterest = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    if (!slug) return;

    setInterestedSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_interested_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    setBackendInterestedEvents((prev) =>
      prev.filter((e) => {
        const bSlug = (e.eventSlug || e.slug || e.eventId || '').toLowerCase().trim();
        return bSlug !== slug;
      })
    );

    showToast(`Removed interest from "${evt.title}".`);

    if (user?.email) {
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'interested',
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Toggle Bookmark
  const handleToggleBookmark = async (evt) => {
    const id = evt.id;
    const isCurrentlySaved = savedEventIds.has(id);
    const nextSaved = !isCurrentlySaved;

    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (nextSaved) next.add(id);
      else next.delete(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    showToast(
      nextSaved
        ? `Saved "${evt.title}" to bookmarks!`
        : `Removed "${evt.title}" from bookmarks.`
    );

    if (user?.email) {
      const slug = (evt.slug || evt.id || '').toLowerCase().trim();
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'bookmark',
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Claim Pass
  const handleClaimPass = (evt) => {
    setClaimedPassIds((prev) => new Set(prev).add(evt.id));
    showToast(`Pass confirmed for "${evt.title}"! Badge generated.`);
  };

  // Match helper for interested events
  const isEventInterested = (evt) => {
    if (!evt || interestedSlugs.size === 0) return false;
    const idStr = String(evt.id ?? '').toLowerCase().trim();
    const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
    const mongoStr = String(evt._id ?? '').toLowerCase().trim();
    const slugStr = String(evt.slug ?? '').toLowerCase().trim();
    const titleSlug = (evt.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    for (const item of Array.from(interestedSlugs)) {
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

  // Filter Interested Events
  const interestedEvents = useMemo(() => {
    if (interestedSlugs.size === 0 && backendInterestedEvents.length === 0) return [];

    const matchedMap = new Map();

    // 1. Match from live allEvents
    allEvents.forEach((evt) => {
      if (isEventInterested(evt)) {
        const key = String(evt.slug || evt.id).toLowerCase();
        if (!matchedMap.has(key)) matchedMap.set(key, evt);
      }
    });

    // 2. Match from backendInterestedEvents
    backendInterestedEvents.forEach((b) => {
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

    // 3. Match from savedDetailsMap
    Object.values(savedDetailsMap).forEach((d) => {
      if (!d) return;
      const key = String(d.slug || d.id).toLowerCase();
      if (interestedSlugs.has(key) && !matchedMap.has(key)) {
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

    // 4. Fallback synthesis for any unmatched interested items
    Array.from(interestedSlugs).forEach((slugKey, idx) => {
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
        matchedMap.set(strKey, {
          id: strKey,
          slug: strKey,
          title: readableTitle || 'Interested Exhibition',
          dates: 'Upcoming 2026 Edition',
          venue: 'Convention & Trade Center',
          city: 'India',
          country: 'India',
          category: 'Trade Show',
          image: 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: 'Verified Organizer'
        });
      }
    });

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

    return list;
  }, [allEvents, interestedSlugs, backendInterestedEvents, savedDetailsMap, selectedCategory, searchQuery]);

  // Distinct Categories in interested events
  const availableCategories = useMemo(() => {
    const cats = new Set();
    interestedEvents.forEach((evt) => {
      if (evt.category) cats.add(evt.category);
    });
    return Array.from(cats);
  }, [interestedEvents]);

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
          <span className="text-zinc-950 font-bold">Interested Events</span>
        </div>

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/90 p-8 sm:p-10 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-900">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Attendance Intent Calendar</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
                Events You're Interested In
              </h1>
              <p className="text-zinc-600 text-sm sm:text-base max-w-xl leading-relaxed">
                Trade shows and summits you plan to visit. Monitor exhibitor updates, get verified passes,
                or arrange business meetings with organizers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black px-5 py-3 text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>Browse All Expos</span>
                <ArrowRight className="h-4 w-4 text-zinc-950" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Total Interested</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{interestedEvents.length || interestedSlugs.size}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Passes Reserved</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{claimedPassIds.size}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-semibold block">Industry Sectors</span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5 block">{availableCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        {(interestedEvents.length > 0 || interestedSlugs.size > 0) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search in your interested exhibitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-[#F8F9FA] text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
              </div>

              {availableCategories.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Sectors ({availableCategories.length})</option>
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

        {/* Interested Events Content */}
        {loading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-16 flex flex-col items-center justify-center space-y-3 shadow-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-500">
              Loading your interested exhibitions...
            </p>
          </div>
        ) : interestedEvents.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <Star className="h-8 w-8 fill-amber-500 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-950">
              {searchQuery || selectedCategory !== 'all'
                ? 'No matching interested exhibitions'
                : 'No Interested Exhibitions Marked Yet'}
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try clearing your search filters to see all your interested events.'
                : 'Click the "Show Interest" button on any trade show card to build your personalized attendance calendar.'}
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
          /* GRID OF INTERESTED EVENTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {interestedEvents.map((evt) => {
              const eventSlug = evt.slug || evt.id;
              const isSaved = savedEventIds.has(evt.id) || savedEventIds.has(eventSlug);
              const isClaimed = claimedPassIds.has(evt.id);

              return (
                <article
                  key={evt.id}
                  className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col group relative shadow-xs"
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
                        {/* Interested Tag */}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-zinc-950 shadow-md">
                          <Star className="h-2.5 w-2.5 fill-zinc-950" />
                          <span>Interested</span>
                        </span>

                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(evt)}
                          className={`p-2 rounded-full transition active:scale-95 cursor-pointer shadow-md ${
                            isSaved
                              ? 'bg-rose-500 text-white'
                              : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                          title={isSaved ? 'Saved in Bookmarks' : 'Save Bookmark'}
                        >
                          <Bookmark className={`h-3 w-3 ${isSaved ? 'fill-white' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-2.5">
                      {/* Dates */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{evt.dates || 'Upcoming 2026 Edition'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-zinc-950 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
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
                      {/* Remove Interest Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(evt)}
                        className="text-xs font-bold text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove from interested list"
                      >
                        Remove Interest
                      </button>

                      {/* Right: Get Pass Button */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/expo/${eventSlug}`}
                          className="text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:underline"
                        >
                          Details
                        </Link>

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
                            <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-zinc-950 text-[#FFCC00] hover:bg-[#FFCC00] hover:text-zinc-950 font-black text-xs transition shadow-sm active:scale-95">
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
