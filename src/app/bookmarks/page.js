'use client';

/**
 * @file bookmarks/page.js
 * @description Dedicated Bookmarks & Saved Exhibitions Hub for VisitExpo users.
 * Displays all exhibitions, trade shows, and summits bookmarked by the visitor.
 * Seamlessly merges localStorage and authenticated backend user engagements.
 * Features live countdown timers, 1-click visitor pass booking, and instant recommendations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import ShowCountdownTimer from '@/components/ShowCountdownTimer.js';
import EventPassAvailability from '@/components/EventPassAvailability.js';
import { allowEventPassClaim } from '@/utils/eventPasses.js';
import { isEventExpired, sortEventsByStartDate } from '@/utils/eventDates.js';
import { issueVisitorPass } from '@/utils/visitorPass.js';
import { useAuth } from '@/context/AuthContext.js';
import axios from 'axios';
import {
  Bookmark,
  Calendar,
  MapPin,
  Globe,
  ArrowRight,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Tag,
  Star,
  Ticket,
  RotateCw,
  RotateCcw,
  Layers,
  LayoutGrid,
  List,
  Clock,
  X,
  Compass,
  Check
} from 'lucide-react';
import { showSweetConfirm, showSweetSuccess, showSweetError, showSweetAlert } from '@/utils/sweetalert.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function BookmarksPage() {
  const { user, accessToken } = useAuth();

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [toastMessage, setToastMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('upcoming');
    setViewMode('grid');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch live events directory with instant sessionStorage cache & resilient fallback
  const fetchLiveEvents = async () => {
    try {
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

      let eventsList = [];
      // Try primary API with strict 3.5s timeout and sensible limit
      try {
        const res = await axios.get(`${API_URL}/events?limit=100&status=published`, { timeout: 3500 });
        if (res.data?.success && Array.isArray(res.data?.data?.docs)) {
          eventsList = res.data.data.docs;
        } else if (res.data?.success && Array.isArray(res.data?.data)) {
          eventsList = res.data.data;
        }
      } catch (_) {}

      // Fallback to local next route or wordpress-events with timeout
      if (eventsList.length === 0) {
        try {
          const res = await axios.get('/api/wordpress-events', { timeout: 3500 });
          if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
            eventsList = res.data.events;
          }
        } catch (_) {}
      }

      if (eventsList.length > 0) {
        setAllEvents(eventsList);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('visitexpo_bookmarks_events_cache', JSON.stringify(eventsList.slice(0, 100)));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Could not load events in bookmarks:', err);
    }
  };

  // 2. Fetch User Engagements & Bookmarks from Backend & LocalStorage
  const loadUserBookmarks = async () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedEventIds(new Set(parsed));
          }
        }

        const rawDetails = localStorage.getItem('visitexpo_saved_event_details');
        if (rawDetails) {
          const parsedDetails = JSON.parse(rawDetails) || {};
          setSavedDetailsMap(parsedDetails);
        }

        const interested = localStorage.getItem('visitexpo_interested_events');
        if (interested) {
          const parsedInt = JSON.parse(interested);
          if (Array.isArray(parsedInt) && parsedInt.length > 0) {
            setInterestedSlugs(new Set(parsedInt.map((s) => String(s).toLowerCase().trim())));
          }
        }

        const claimed = localStorage.getItem('visitexpo_claimed_passes');
        if (claimed) {
          const parsedClaimed = JSON.parse(claimed);
          if (Array.isArray(parsedClaimed) && parsedClaimed.length > 0) {
            setClaimedPassIds(new Set(parsedClaimed.map(String)));
          }
        }
      } catch (_) {}
    }

    const identifier = user?.email || user?.id || user?._id;
    if (identifier) {
      try {
        const res = await axios.get(`${API_URL}/engagements/user/${encodeURIComponent(identifier)}`, { timeout: 3000 });
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
      } catch (err) {
        console.warn('Could not fetch user engagements:', err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Fast synchronous hydration on client mount (0ms)
    let hasImmediateData = false;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        const rawDetails = localStorage.getItem('visitexpo_saved_event_details');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedEventIds(new Set(parsed));
            hasImmediateData = true;
          }
        }
        if (rawDetails) {
          const parsedDetails = JSON.parse(rawDetails) || {};
          if (Object.keys(parsedDetails).length > 0) {
            setSavedDetailsMap(parsedDetails);
            hasImmediateData = true;
          }
        }
        const interested = localStorage.getItem('visitexpo_interested_events');
        if (interested) {
          const parsedInt = JSON.parse(interested);
          if (Array.isArray(parsedInt) && parsedInt.length > 0) {
            setInterestedSlugs(new Set(parsedInt.map((s) => String(s).toLowerCase().trim())));
          }
        }
        const claimed = localStorage.getItem('visitexpo_claimed_passes');
        if (claimed) {
          const parsedClaimed = JSON.parse(claimed);
          if (Array.isArray(parsedClaimed) && parsedClaimed.length > 0) {
            setClaimedPassIds(new Set(parsedClaimed.map(String)));
          }
        }
        const cached =
          sessionStorage.getItem('visitexpo_bookmarks_events_cache') ||
          sessionStorage.getItem('visitexpo_home_events') ||
          sessionStorage.getItem('visitexpo_visitor_expos_cache');
        if (cached) {
          const parsedEvents = JSON.parse(cached);
          if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            setAllEvents(parsedEvents);
          }
        }
      } catch (_) {}
    }

    // If local bookmarks exist, unlock UI immediately without waiting for server network!
    if (hasImmediateData) {
      setLoading(false);
    }

    // Maximum 1.2s safety timeout for empty-state users so spinner never hangs indefinitely
    const maxLoadingTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    // Non-blocking network sync in background
    (async () => {
      try {
        await Promise.all([fetchLiveEvents(), loadUserBookmarks()]);
      } finally {
        if (isMounted) {
          clearTimeout(maxLoadingTimer);
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(maxLoadingTimer);
    };
  }, [user]);

  // Handle Refresh Action
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccess(false);
    await Promise.all([fetchLiveEvents(), loadUserBookmarks()]);
    setIsRefreshing(false);
    setRefreshSuccess(true);
    showToast('Bookmarks synchronized with latest event catalog!');
    setTimeout(() => setRefreshSuccess(false), 2500);
  };

  // Handle Remove Bookmark
  const handleRemoveBookmark = async (eventId, evt) => {
    const title = evt?.title || 'this exhibition';
    const confirmed = await showSweetConfirm(
      {
        title: 'Remove Bookmark?',
        icon: 'question',
        confirmButtonText: 'Yes, Remove',
        cancelButtonText: 'Keep Bookmark',
        isDanger: true
      },
      `Remove "${title}" from your saved bookmarks collection?`
    );

    if (!confirmed) return;

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

    showToast(`Removed "${title}" from your bookmarks.`);

    if (user?.email) {
      try {
        await axios.post(`${API_URL}/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'bookmark',
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Quick Add Bookmark (from recommendations)
  const handleAddBookmark = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    const id = evt._id || evt.id || slug;
    if (!slug && !id) return;

    setSavedEventIds((prev) => {
      const next = new Set(prev);
      next.add(slug);
      if (id) next.add(String(id));
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    setSavedDetailsMap((prev) => {
      const next = {
        ...prev,
        [slug]: {
          id: evt._id || evt.id,
          slug,
          title: evt.title,
          dates: evt.dates || (evt.startDate ? `${new Date(evt.startDate).toLocaleDateString()} - ${new Date(evt.endDate || evt.startDate).toLocaleDateString()}` : 'Upcoming 2026'),
          venue: evt.venue,
          city: evt.city,
          country: evt.country || 'India',
          category: evt.category || (Array.isArray(evt.categories) ? evt.categories[0] : 'Trade Show'),
          image: evt.banner || evt.image,
          organizer: evt.organizer?.name || evt.orgName || 'Verified Organizer',
          startDate: evt.startDate,
          endDate: evt.endDate,
          timings: evt.timings
        }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_saved_event_details', JSON.stringify(next));
      }
      return next;
    });

    showSweetSuccess(`"${evt.title}" has been saved to your personal collection!`, 'Bookmarked! ⭐');

    if (user?.email) {
      try {
        await axios.post(`${API_URL}/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'bookmark',
          eventTitle: evt.title,
          eventCity: evt.city,
          eventVenue: evt.venue,
          eventCategory: evt.category,
          eventImage: evt.banner || evt.image,
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
        await axios.post(`${API_URL}/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'interested',
          eventTitle: evt.title,
          eventCity: evt.city,
          eventVenue: evt.venue,
          eventDates: evt.dates,
          eventCategory: evt.category,
          eventImage: evt.image || evt.banner,
          user: { id: user.id || user._id, email: user.email, name: user.name }
        });
      } catch (_) {}
    }
  };

  // Handle Claim Pass (with Theme-Aware Interactive Confirmation Pop-up)
  const handleClaimPass = async (evt) => {
    if (!(await allowEventPassClaim(evt))) return;
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    const idKey = String(evt.id || evt._id || slug).trim();
    const isAlreadyClaimed =
      claimedPassIds.has(idKey) ||
      claimedPassIds.has(slug) ||
      (evt._id && claimedPassIds.has(String(evt._id))) ||
      (evt.id && claimedPassIds.has(String(evt.id)));

    // If pass is already issued, display informative status confirmation modal
    if (isAlreadyClaimed) {
      await showSweetAlert(
        {
          title: 'Visitor Pass Already Issued! ✓',
          icon: 'success',
          confirmButtonText: 'Great, Understood',
          html: `
            <div style="font-size: 13px; line-height: 1.6; text-align: left; padding: 4px;">
              <p style="margin-bottom: 8px; font-weight: 500;">You already have an active complimentary pass for:</p>
              <div style="font-weight: 800; font-size: 15px; margin-bottom: 6px; color: #10b981;">${evt.title}</div>
              ${evt.dates ? `<p style="font-size: 12px; margin-bottom: 4px; font-weight: 600;">📅 ${evt.dates}</p>` : ''}
              ${evt.venue || evt.city ? `<p style="font-size: 12px; opacity: 0.8; margin-bottom: 12px;">📍 ${[evt.venue, evt.city].filter(Boolean).join(', ')}</p>` : ''}
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 12px; font-size: 12px; font-weight: 600; color: #059669;">
                ✓ Active pass registered to your account.<br />
                ✓ Present your name or registered email at the registration gate for fast-track badge printing.
              </div>
            </div>
          `
        },
        'success'
      );
      return;
    }

    // Confirmation pop-up before issuing pass
    const confirmed = await showSweetConfirm(
      {
        title: 'Confirm Free Visitor Pass?',
        icon: 'question',
        confirmButtonText: 'Yes, Issue Pass',
        cancelButtonText: 'Cancel',
        isDanger: false,
        html: `
          <div style="font-size: 13px; line-height: 1.6; text-align: left; padding: 4px;">
            <p style="margin-bottom: 8px; font-weight: 500;">Confirm your complimentary registration and digital badge for:</p>
            <div style="font-weight: 800; font-size: 15px; margin-bottom: 6px; color: #f59e0b;">${evt.title}</div>
            ${evt.dates ? `<p style="font-size: 12px; margin-bottom: 4px; font-weight: 600;">📅 ${evt.dates}</p>` : ''}
            ${evt.venue || evt.city ? `<p style="font-size: 12px; opacity: 0.8; margin-bottom: 12px;">📍 ${[evt.venue, evt.city].filter(Boolean).join(', ')}</p>` : ''}
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 12px; font-size: 12px; color: #d97706; font-weight: 600;">
              ✓ Free gate admission to exhibition halls<br />
              ✓ Digital badge synced directly with your visitor account
            </div>
          </div>
        `
      }
    );

    if (!confirmed) return;

    const pass = await issueVisitorPass({
      endpoint: `${API_URL}/visitors/register`,
      event: evt,
      user
    });
    if (!pass) return;

    setClaimedPassIds((prev) => {
      const next = new Set(prev);
      const keys = [evt.id, evt._id, evt.slug, slug, idKey].filter(Boolean).map(String);
      keys.forEach((k) => next.add(k));
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_claimed_passes', JSON.stringify(Array.from(next)));
      }
      return next;
    });

  };

  // Universal Matcher: checks if an event matches any saved ID/Slug
  const isEventSaved = (evt) => {
    if (!evt || savedEventIds.size === 0) return false;
    const rawList = Array.from(savedEventIds);

    const idStr = String(evt.id ?? evt._id ?? '').toLowerCase().trim();
    const wpStr = String(evt.wpPostId ?? '').toLowerCase().trim();
    const slugStr = String(evt.slug ?? '').toLowerCase().trim();
    const titleSlug = (evt.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    for (const item of rawList) {
      if (!item) continue;
      if (typeof item === 'object') {
        const oId = String(item.id || item.eventId || item._id || '').toLowerCase().trim();
        const oSlug = String(item.slug || item.eventSlug || '').toLowerCase().trim();
        const oWp = String(item.wpPostId || '').toLowerCase().trim();
        if (oId && (oId === idStr || oId === wpStr)) return true;
        if (oWp && (oWp === wpStr || oWp === idStr)) return true;
        if (oSlug && (oSlug === slugStr || oSlug === titleSlug)) return true;
        continue;
      }

      const kStr = String(item).toLowerCase().trim();
      if (
        (idStr && kStr === idStr) ||
        (wpStr && kStr === wpStr) ||
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

  // Filter Bookmarked Events (combines allEvents, savedDetailsMap, and backendBookmarkedEvents)
  const bookmarkedEvents = useMemo(() => {
    if (savedEventIds.size === 0 && backendBookmarkedEvents.length === 0 && Object.keys(savedDetailsMap).length === 0) {
      return [];
    }

    const matchedMap = new Map();

    // 1. Match from live directory (allEvents)
    allEvents.forEach((evt) => {
      if (isEventSaved(evt)) {
        const key = String(evt.slug || evt._id || evt.id).toLowerCase();
        if (!matchedMap.has(key)) {
          matchedMap.set(key, {
            id: evt._id || evt.id || key,
            slug: evt.slug || key,
            title: evt.title,
            dates: evt.dates || (evt.startDate ? `${new Date(evt.startDate).toLocaleDateString()} - ${new Date(evt.endDate || evt.startDate).toLocaleDateString()}` : 'Upcoming 2026'),
            startDate: evt.startDate,
            endDate: evt.endDate,
            timings: evt.timings,
            venue: evt.venue || 'Exhibition Centre',
            city: evt.city || 'India',
            country: evt.country || 'India',
            category: evt.category || (Array.isArray(evt.categories) ? evt.categories[0] : 'Trade Show'),
            image: evt.banner || evt.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
            organizer: evt.organizer?.name || evt.orgName || 'Verified Organizer',
            description: evt.shortDescription || evt.description
          });
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
          startDate: d.startDate,
          endDate: d.endDate,
          timings: d.timings,
          venue: d.venue || d.city || 'Exhibition Centre',
          city: d.city || 'India',
          country: d.country || 'India',
          category: d.category || 'Trade Show',
          image: d.image || d.banner || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: d.organizer || 'Verified Organizer',
          description: d.description
        });
      }
    });

    // 3. Include backend engagements not yet matched
    backendBookmarkedEvents.forEach((b) => {
      if (!b) return;
      const key = String(b.eventSlug || b.slug || b.eventId || b.id).toLowerCase();
      if (!matchedMap.has(key)) {
        matchedMap.set(key, {
          id: b.eventId || b.eventSlug || b._id || key,
          slug: b.eventSlug || b.slug || key,
          title: b.eventTitle || b.title || key.replace(/-/g, ' ').toUpperCase(),
          dates: b.eventDates || b.dates || 'Upcoming Edition 2026',
          startDate: b.startDate,
          endDate: b.endDate,
          venue: b.eventVenue || b.venue || 'Exhibition Centre',
          city: b.eventCity || b.city || 'India',
          country: b.eventCountry || b.country || 'India',
          category: b.eventCategory || b.category || 'Trade Show',
          image: b.eventImage || b.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
          organizer: b.organizerName || b.organizer || 'Verified Organizer'
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

    // Sort
    if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'category') {
      list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }

    return sortEventsByStartDate(list);
  }, [allEvents, savedEventIds, savedDetailsMap, backendBookmarkedEvents, selectedCategory, searchQuery, sortBy]);

  // Distinct Categories in bookmarks
  const availableCategories = useMemo(() => {
    const cats = new Set();
    bookmarkedEvents.forEach((evt) => {
      if (evt.category) cats.add(evt.category);
    });
    return Array.from(cats);
  }, [bookmarkedEvents]);

  // Curated Suggested Expos for empty state
  const suggestedExpos = useMemo(() => {
    return sortEventsByStartDate(allEvents
      .filter((e) => !isEventSaved(e))
      .map((e) => ({
        id: e._id || e.id,
        slug: e.slug || e.id,
        title: e.title,
        dates: e.dates || (e.startDate ? `${new Date(e.startDate).toLocaleDateString()} - ${new Date(e.endDate || e.startDate).toLocaleDateString()}` : 'Upcoming 2026'),
        startDate: e.startDate,
        endDate: e.endDate,
        timings: e.timings,
        venue: e.venue || 'Exhibition Hall',
        city: e.city || 'India',
        category: e.category || (Array.isArray(e.categories) ? e.categories[0] : 'Trade Show'),
        image: e.banner || e.image || 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg',
        organizer: e.organizer?.name || e.orgName || 'Verified Organizer'
      })).slice(0, 6));
  }, [allEvents, savedEventIds]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-amber-400 selection:text-black flex flex-col">
      <Navbar solid={true} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 text-white border border-zinc-700 shadow-2xl text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 pb-16 pt-20 sm:px-6 lg:px-8">

        {/* Hero Header Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
          {/* Subtle gold radial background glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-gradient-to-br from-amber-500/15 via-primary/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full shadow-2xs">
                  <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Curated Event Collection
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Synced with Account
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                My Bookmarked Exhibitions
              </h1>

              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Your saved trade shows, exhibitions, and B2B summits. Review dates, reserve free passes, track live show timers, or connect directly with event organizers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              <Link
                href="/expos"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-amber-400 text-primary-foreground font-bold px-5 py-3 text-xs sm:text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Calendar className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span>Browse More Events</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`group inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                  refreshSuccess
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'border-border/80 bg-secondary/80 hover:bg-card text-foreground hover:text-primary'
                }`}
                title="Refresh and sync bookmarks"
              >
                {refreshSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in" />
                    <span>Synced!</span>
                  </>
                ) : (
                  <>
                    <RotateCw
                      className={`h-4 w-4 shrink-0 transition-transform duration-500 ${
                        isRefreshing ? 'animate-spin text-primary' : 'group-hover:rotate-180'
                      }`}
                    />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Elevated Stat Cards Bar */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-3">
            {/* Total Bookmarked */}
            <div className="group rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/70 hover:border-amber-500/40 p-4 transition-all duration-200 shadow-2xs hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saved Shows</span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Bookmark className="h-4 w-4 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mt-2 tracking-tight">
                {bookmarkedEvents.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Actively tracked exhibitions</p>
            </div>

            {/* Passes Available */}
            <div className="group rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/70 hover:border-emerald-500/40 p-4 transition-all duration-200 shadow-2xs hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Free Passes Available</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mt-2 tracking-tight">
                {bookmarkedEvents.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">1-Click instant QR badges</p>
            </div>

            {/* Industry Domains */}
            <div className="group rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/70 hover:border-indigo-500/40 p-4 transition-all duration-200 shadow-2xs hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Distinct Sectors</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mt-2 tracking-tight">
                {availableCategories.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Diverse business categories</p>
            </div>
          </div>
        </div>

        {/* Filter, Search & View Controls Bar */}
        {(bookmarkedEvents.length > 0 || savedEventIds.size > 0 || searchQuery) && (
          <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs sm:p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Field */}
              <div className="relative w-full min-w-0 sm:flex-1 lg:max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search bookmarked exhibitions by title, city, or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Select */}
              {availableCategories.length > 0 && (
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-48"
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

              {/* Sort Dropdown */}
              <div className="w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-52"
                >
                  <option value="upcoming">Sort by: Default</option>
                  <option value="title">Sort by: Event Title (A-Z)</option>
                  <option value="category">Sort by: Category</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-border/80 bg-secondary p-1 sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {(searchQuery.trim() || selectedCategory !== 'all' || sortBy !== 'upcoming') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                  title="Clear search and restore default filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Section: Loading | Empty State | Bookmarked Cards */}
        {loading && bookmarkedEvents.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-16 flex flex-col items-center justify-center space-y-3 shadow-xs">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">
              Loading your bookmarked exhibitions...
            </p>
          </div>
        ) : bookmarkedEvents.length === 0 ? (
          /* =========================================================
             ENHANCED EMPTY STATE + INSTANT 1-CLICK DISCOVERY
             ========================================================= */
          <div className="space-y-10">
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 sm:p-14 text-center space-y-5 shadow-xs relative overflow-hidden">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                <Bookmark className="h-8 w-8 fill-amber-500 text-amber-500" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No Matching Bookmarked Exhibitions'
                    : 'Your Saved Collection is Empty'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting or clearing your search filters to see all bookmarked events.'
                    : 'Bookmark trade shows, B2B expos, and industry conferences to easily track dates, claim free entry passes, and receive organizer updates.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {searchQuery || selectedCategory !== 'all' ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold px-4 py-2.5 text-xs transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Clear Search Filters
                  </button>
                ) : (
                  <Link
                    href="/expos"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-amber-400 text-primary-foreground font-bold px-5 py-2.5 text-xs shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Explore 500+ Live Expos</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Suggested Exhibitions: 1-Click Bookmark Discovery */}
            {suggestedExpos.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Compass className="h-4.5 w-4.5 text-primary" /> Recommended Exhibitions You Might Like
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click the &quot;Bookmark&quot; button on any show below to add it directly to your personal collection in 1 click.
                    </p>
                  </div>
                  <Link
                    href="/expos"
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                  >
                    Browse All Expos →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {suggestedExpos.map((expo) => (
                    <div
                      key={expo.id}
                      className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/60 dark:hover:border-amber-400/50 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group"
                    >
                      <div className="relative aspect-[16/9] w-full bg-zinc-900 overflow-hidden">
                        <img
                          src={expo.image}
                          alt={expo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = 'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10">
                          {expo.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{expo.dates}</span>
                          </div>

                          <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            <Link href={`/expo/${expo.slug}`}>{expo.title}</Link>
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{expo.venue}, {expo.city}</span>
                          </div>

                          {/* Show Countdown Timer */}
                          {expo.startDate && (
                            <div className="pt-1.5">
                              <ShowCountdownTimer
                                startDate={expo.startDate}
                                endDate={expo.endDate}
                                timings={expo.timings}
                                variant="compact"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddBookmark(expo)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-black font-bold py-2 px-3 text-xs border border-amber-500/30 transition-all cursor-pointer shadow-2xs"
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>+ Save to Bookmarks</span>
                          </button>

                          <Link
                            href={`/expo/${expo.slug}`}
                            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition border border-border"
                            title="View Expo Details"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================
             SAVED BOOKMARKS COLLECTION (GRID OR LIST VIEW)
             ========================================================= */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {bookmarkedEvents.map((evt) => {
              const eventSlug = (evt.slug || evt.id || '').toLowerCase().trim();
              const idKey = String(evt.id || evt._id || eventSlug).trim();
              const isClaimed =
                claimedPassIds.has(idKey) ||
                claimedPassIds.has(eventSlug) ||
                (evt._id && claimedPassIds.has(String(evt._id))) ||
                (evt.id && claimedPassIds.has(String(evt.id)));
              const isExpired = isEventExpired(evt);
              const isInterested =
                interestedSlugs.has(eventSlug) ||
                interestedSlugs.has(idKey);

              if (viewMode === 'list') {
                return (
                  <article
                    key={evt.id}
                    className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm hover:shadow-lg hover:shadow-primary/10 hover:border-primary/60 dark:hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-20 w-28 rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative">
                        <img
                          src={evt.image}
                          alt={evt.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                          }}
                        />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                            {evt.category || 'Trade Show'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Free Pass Available
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          <Link href={`/expo/${eventSlug}`}>{evt.title}</Link>
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-amber-500" />
                            {evt.dates}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {evt.venue}, {evt.city}
                          </span>
                        </div>

                        {/* Countdown Timer */}
                        {evt.startDate && (
                          <div className="pt-1">
                            <ShowCountdownTimer
                              startDate={evt.startDate}
                              endDate={evt.endDate}
                              timings={evt.timings}
                              variant="compact"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleInterest(evt)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${
                          isInterested
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'border-border bg-secondary hover:bg-secondary/80 text-muted-foreground'
                        }`}
                        title={isInterested ? 'Remove Interest' : 'Mark Interested'}
                      >
                        <Star className={`h-4 w-4 ${isInterested ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      <EventPassAvailability event={evt}>
                        <button
                          type="button"
                          onClick={() => handleClaimPass(evt)}
                          className="cursor-pointer"
                          title={isClaimed ? 'Pass already issued - click to view details' : 'Claim free pass'}
                        >
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold shadow-2xs hover:bg-emerald-100 transition-colors">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Pass Issued</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-amber-400 text-primary-foreground font-black px-3.5 py-1.5 text-xs transition shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                              <Ticket className="h-3.5 w-3.5" />
                              <span>Get Pass</span>
                            </span>
                          )}
                        </button>
                      </EventPassAvailability>

                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(evt.id, evt)}
                        className="p-2.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition cursor-pointer"
                        title="Remove from bookmarks"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              }

              // Default: Rich Grid Card
              return (
                <article
                  key={evt.id}
                  className="rounded-3xl border border-border/80 bg-card overflow-hidden hover:border-primary/60 dark:hover:border-amber-400/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group shadow-sm"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />

                    {/* Top Badges Row */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-black/65 text-white shadow-md border border-white/20 backdrop-blur-md">
                        {evt.category || 'Trade Show'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md ${
                            isExpired
                              ? 'bg-zinc-200 text-zinc-700'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black'
                          }`}
                        >
                          {isExpired ? 'Past Show' : 'Free Pass'}
                        </span>

                        {/* Remove Bookmark Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(evt.id, evt)}
                          className="p-1.5 rounded-full bg-destructive/90 text-white shadow-md hover:bg-destructive transition active:scale-95 cursor-pointer"
                          title="Remove from bookmarks"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-2">
                      {/* Dates */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>{evt.dates || 'Upcoming 2026 Edition'}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        <Link href={`/expo/${eventSlug}`}>{evt.title}</Link>
                      </h2>

                      {/* Venue & Location */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                      </div>

                      {/* Live Show Countdown Timer */}
                      {evt.startDate && (
                        <div className="pt-1.5">
                          <ShowCountdownTimer
                            startDate={evt.startDate}
                            endDate={evt.endDate}
                            timings={evt.timings}
                            variant="card"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs gap-2">
                      {/* Country Tag */}
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold truncate max-w-[90px]">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{evt.country || evt.city || 'India'}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Interested Star */}
                        <button
                          type="button"
                          onClick={() => handleToggleInterest(evt)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isInterested
                              ? 'bg-amber-400 text-black border-amber-400 font-black shadow-xs'
                              : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
                          }`}
                          title={isInterested ? 'Remove Interest' : 'Show Interest'}
                        >
                          <Star className={`h-3 w-3 ${isInterested ? 'fill-black' : 'text-amber-500'}`} />
                          <span className="hidden xs:inline">{isInterested ? 'Saved' : 'Interest'}</span>
                        </button>

                        {/* Claim Pass / Pass Issued Button with Confirmation Pop-up */}
                        <EventPassAvailability event={evt}>
                          <button
                            type="button"
                            onClick={() => handleClaimPass(evt)}
                            className="cursor-pointer"
                            title={isClaimed ? 'Pass already issued - click to view details' : 'Claim free pass'}
                          >
                            {isClaimed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold shadow-2xs hover:bg-emerald-100 transition-colors">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Pass Issued</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-amber-400 text-primary-foreground font-black text-xs transition shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                                <span>Get Pass</span>
                                <ArrowRight className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        </EventPassAvailability>
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
