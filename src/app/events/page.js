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
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { renderCardDescription } from '../../utils/textFormatters.js';
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
  Loader2,
  Heart,
  Crown,
  Sparkles,
  Ticket
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
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [locationQuery, setLocationQuery] = useState('');
  const [isLocationListOpen, setIsLocationListOpen] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('upcoming'); // 'upcoming' | 'rating' | 'turnout' | 'title'
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [top10Only, setTop10Only] = useState(false);
  const [freePassOnly, setFreePassOnly] = useState(false);
  const [minRating, setMinRating] = useState('all'); // 'all' | '4.8' | '4.5' | '4.0'
  const [dateQuickFilter, setDateQuickFilter] = useState('all'); // 'all' | 'this_month' | 'next_30' | 'next_90' | 'this_year' | 'weekend'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortReferenceTime] = useState(() => Date.now());

  // Proximity / Nearby State
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userCityName, setUserCityName] = useState('');

  // Save, Follow, Interest & Pass State
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [followedSlugs, setFollowedSlugs] = useState(new Set());
  const [interestedSlugs, setInterestedSlugs] = useState(new Set());
  const [claimedPassIds, setClaimedPassIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  // Read URL query parameters on initial page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const cityParam = sp.get('city');
      const countryParam = sp.get('country');
      const catParam = sp.get('category');
      const searchParam = sp.get('search') || sp.get('q') || sp.get('organizer');

      const sortParam = sp.get('sort');
      const filterParam = sp.get('filter');

      if (cityParam) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Apply URL filters after hydration to avoid server/client markup mismatches.
        setSelectedCity(cityParam);
        setLocationQuery(`City: ${cityParam}`);
      } else if (countryParam) {
        setSelectedCountry(countryParam);
        setLocationQuery(`Country: ${countryParam}`);
      }
      if (catParam) {
        setSelectedCategory(catParam);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
      if (sortParam === 'trending' || sortParam === 'turnout' || sortParam === 'popularity' || filterParam === 'trending') {
        setSortBy('turnout');
      } else if (sortParam === 'rating') {
        setSortBy('rating');
      }
      if (sp.get('top10') === 'true' || sortParam === 'top10') {
        setTop10Only(true);
        setSortBy('rating');
      }
      if (sp.get('state')) {
        setSelectedState(sp.get('state'));
      }
      if (sp.get('venue')) {
        setSelectedVenue(sp.get('venue'));
      }
      if (sp.get('minRating')) {
        setMinRating(sp.get('minRating'));
      }
      if (sp.get('freePass') === 'true') {
        setFreePassOnly(true);
      }
    }
  }, []);

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

  // Load saved bookmarks, interested, and followed events from localStorage & backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_saved_events');
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate saved state after mount to keep the initial render consistent with the server.
        if (saved) setSavedEventIds(new Set(JSON.parse(saved)));
        const followed = localStorage.getItem('visitexpo_followed_events');
        if (followed) setFollowedSlugs(new Set(JSON.parse(followed)));
        const interested = localStorage.getItem('visitexpo_interested_events');
        if (interested) setInterestedSlugs(new Set(JSON.parse(interested)));
      } catch (_) {}
    }

    if (user?.email) {
      axios.get(`/api/engagements/user/${encodeURIComponent(user.email)}`)
        .then(res => {
          if (res.data?.success && res.data?.data) {
            const followedList = res.data.data.followedEvents || [];
            const interestedList = res.data.data.interestedEvents || [];
            const bookmarkedList = res.data.data.bookmarkedEvents || [];

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

            if (interestedList.length > 0) {
              setInterestedSlugs(prev => {
                const merged = new Set(prev);
                interestedList.forEach(e => {
                  const s = (e.eventSlug || e.slug || e.id || '').toLowerCase().trim();
                  if (s) merged.add(s);
                });
                return merged;
              });
            }

            if (bookmarkedList.length > 0) {
              setSavedEventIds(prev => {
                const merged = new Set(prev);
                bookmarkedList.forEach(e => {
                  const id = e.eventId || e.eventSlug || e.id || '';
                  if (id) merged.add(id);
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

  const availableCountries = useMemo(() => {
    const countries = new Map();
    events.forEach((event) => {
      const country = (event.country || '').trim();
      if (country) countries.set(country.toLowerCase(), country);
    });
    return Array.from(countries.values()).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const locationOptions = useMemo(() => [
    ...availableCountries.map((value) => ({ type: 'Country', value })),
    ...availableCities.map((value) => ({ type: 'City', value }))
  ], [availableCountries, availableCities]);

  const filteredLocationOptions = useMemo(() => {
    const query = locationQuery.replace(/^(country|city):\s*/i, '').trim().toLowerCase();
    if (!query) return locationOptions;
    return locationOptions.filter((option) => option.value.toLowerCase().includes(query));
  }, [locationOptions, locationQuery]);

  const selectLocation = (option) => {
    if (!option) {
      setSelectedCity('all');
      setSelectedCountry('all');
      setLocationQuery('');
    } else if (option.type === 'City') {
      setSelectedCity(option.value);
      setSelectedCountry('all');
      setLocationQuery(`City: ${option.value}`);
    } else {
      setSelectedCity('all');
      setSelectedCountry(option.value);
      setLocationQuery(`Country: ${option.value}`);
    }
    setIsLocationListOpen(false);
    setActiveLocationIndex(0);
  };

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

    if (selectedCountry && selectedCountry !== 'all') {
      list = list.filter((e) => (e.country || '').toLowerCase() === selectedCountry.toLowerCase());
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

    // Free Pass Only Filter
    if (freePassOnly) {
      list = list.filter((e) => !e.entryType || e.entryType.toLowerCase().includes('free'));
    }

    // Minimum Rating Filter
    if (minRating !== 'all') {
      const min = parseFloat(minRating);
      list = list.filter((e) => (parseFloat(e.rating) || 4.0) >= min);
    }

    // Date Quick Filter
    if (dateQuickFilter !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      list = list.filter((e) => {
        if (!e.startDate) return true;
        const s = new Date(e.startDate);
        if (isNaN(s.getTime())) return true;

        if (dateQuickFilter === 'this_month') {
          return s.getMonth() === currentMonth && s.getFullYear() === currentYear;
        }
        if (dateQuickFilter === 'next_30') {
          const diffDays = (s.getTime() - now.getTime()) / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 30;
        }
        if (dateQuickFilter === 'next_90') {
          const diffDays = (s.getTime() - now.getTime()) / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 90;
        }
        if (dateQuickFilter === 'this_year') {
          return s.getFullYear() === currentYear;
        }
        if (dateQuickFilter === 'weekend') {
          const day = s.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
          return day === 0 || day === 5 || day === 6;
        }
        return true;
      });
    }

    // Featured Only Filter
    if (featuredOnly) {
      list = list.filter((e) => e.featured);
    }

    // Top 10 Rated Filter (specifically top 10 highest-rated expos across all events)
    if (top10Only) {
      list.sort((a, b) => {
        const rA = parseFloat(a.rating) || 4.5;
        const rB = parseFloat(b.rating) || 4.5;
        if (rB !== rA) return rB - rA;
        const cA = parseInt(String(a.reviewCount || 0), 10) || 0;
        const cB = parseInt(String(b.reviewCount || 0), 10) || 0;
        if (cB !== cA) return cB - cA;
        return (a.title || '').localeCompare(b.title || '');
      });
      list = list.slice(0, 10);
    } else {
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
          const now = sortReferenceTime;
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
    }

    return list;
  }, [events, searchQuery, selectedCategory, selectedState, selectedCity, selectedCountry, selectedVenue, fromDate, toDate, sortBy, featuredOnly, isNearbyActive, userLocation, top10Only, freePassOnly, minRating, dateQuickFilter, sortReferenceTime]);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Keep filter changes returning users to the first result page.
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedState, selectedCity, selectedCountry, selectedVenue, fromDate, toDate, sortBy, featuredOnly, isNearbyActive, top10Only, freePassOnly, minRating, dateQuickFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handleToggleSave = async (eventId, evt) => {
    const slug = (evt?.slug || evt?.id || eventId || '').toLowerCase().trim();
    const idStr = String(eventId || evt?.id || slug).trim();
    const next = new Set(savedEventIds);
    const isSaved = next.has(idStr) || (slug && next.has(slug)) || (eventId && next.has(eventId));
    if (isSaved) {
      next.delete(idStr);
      if (eventId) next.delete(eventId);
      if (slug) next.delete(slug);
      showToast('Event removed from bookmarks.');
    } else {
      next.add(idStr);
      if (slug) next.add(slug);
      showToast('Event saved to your bookmarks!');
    }
    setSavedEventIds(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(next)));
      try {
        const rawMap = localStorage.getItem('visitexpo_saved_event_details');
        const map = rawMap ? JSON.parse(rawMap) : {};
        if (isSaved) {
          delete map[idStr];
          if (slug) delete map[slug];
        } else if (evt) {
          const detail = {
            id: evt.id || idStr,
            slug: evt.slug || slug,
            title: evt.title,
            image: evt.image,
            dates: evt.dates,
            city: evt.city,
            venue: evt.venue,
            category: evt.category,
            country: evt.country || 'India',
            organizer: evt.organizer || evt.organizerName || ''
          };
          map[idStr] = detail;
          if (slug) map[slug] = detail;
        }
        localStorage.setItem('visitexpo_saved_event_details', JSON.stringify(map));
      } catch (_) {}
    }

    if (user?.email && evt) {
      try {
        await axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
          actionType: 'bookmark',
          eventTitle: evt.title,
          eventCity: evt.city,
          eventVenue: evt.venue,
          eventDates: evt.dates,
          eventCategory: evt.category,
          eventImage: evt.image,
          organizerId: evt.organizerId || evt.claimedBy || '',
          organizerName: evt.organizerName || evt.organizer || '',
          user: {
            id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } catch (_) {}
    }
  };

  const handleToggleInterest = async (evt) => {
    const slug = (evt.slug || evt.id || '').toLowerCase().trim();
    if (!slug) return;

    const isInterested = interestedSlugs.has(slug);
    const nextInterested = !isInterested;

    setInterestedSlugs(prev => {
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
        ? `Marked interest in ${evt.title}!`
        : `Removed interest from ${evt.title}.`
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
          organizerId: evt.organizerId || evt.claimedBy || '',
          organizerName: evt.organizerName || evt.organizer || '',
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
        console.warn('Failed to sync interest state to server:', err);
      }
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
    setSelectedCountry('all');
    setLocationQuery('');
    setIsLocationListOpen(false);
    setSelectedVenue('all');
    setFromDate('');
    setToDate('');
    setSortBy('upcoming');
    setFeaturedOnly(false);
    setIsNearbyActive(false);
    setTop10Only(false);
    setFreePassOnly(false);
    setMinRating('all');
    setDateQuickFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedState !== 'all' ||
    selectedCity !== 'all' ||
    selectedCountry !== 'all' ||
    selectedVenue !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    sortBy !== 'upcoming' ||
    featuredOnly ||
    isNearbyActive ||
    top10Only ||
    freePassOnly ||
    minRating !== 'all' ||
    dateQuickFilter !== 'all';

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
              {/* 2. Searchable Country / City Picker */}
              <div className="lg:col-span-3 relative flex items-center">
                <MapPin className="absolute left-3.5 h-4 w-4 text-rose-500 pointer-events-none" />
                <input
                  type="text"
                  role="combobox"
                  aria-label="Search locations by country or city"
                  aria-autocomplete="list"
                  aria-expanded={isLocationListOpen}
                  aria-controls="event-location-options"
                  aria-activedescendant={isLocationListOpen && filteredLocationOptions[activeLocationIndex]
                    ? `event-location-option-${activeLocationIndex}`
                    : undefined}
                  value={locationQuery}
                  onFocus={() => setIsLocationListOpen(true)}
                  onBlur={() => setIsLocationListOpen(false)}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setSelectedCity('all');
                    setSelectedCountry('all');
                    setActiveLocationIndex(0);
                    setIsLocationListOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setIsLocationListOpen(true);
                      if (filteredLocationOptions.length) {
                        setActiveLocationIndex((index) => Math.min(index + 1, filteredLocationOptions.length - 1));
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveLocationIndex((index) => Math.max(index - 1, 0));
                    } else if (e.key === 'Enter' && isLocationListOpen && filteredLocationOptions[activeLocationIndex]) {
                      e.preventDefault();
                      selectLocation(filteredLocationOptions[activeLocationIndex]);
                    } else if (e.key === 'Escape') {
                      setIsLocationListOpen(false);
                    }
                  }}
                  placeholder="Search country or city..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-amber-400 transition-all shadow-2xs"
                />
                {locationQuery ? (
                  <button
                    type="button"
                    aria-label="Clear location filter"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectLocation(null)}
                    className="absolute right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                ) : (
                  <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                )}
                {isLocationListOpen && (
                  <div
                    id="event-location-options"
                    role="listbox"
                    aria-label="Matching countries and cities"
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedCity === 'all' && selectedCountry === 'all' && !locationQuery}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectLocation(null)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                    >
                      All Locations
                    </button>
                    {['Country', 'City'].map((type) => {
                      const options = filteredLocationOptions
                        .map((option, index) => ({ ...option, index }))
                        .filter((option) => option.type === type);
                      if (!options.length) return null;
                      return (
                        <div key={type}>
                          <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                            {type === 'Country' ? 'Countries' : 'Cities'}
                          </div>
                          {options.map((option) => (
                            <button
                              key={`${type}-${option.value}`}
                              id={`event-location-option-${option.index}`}
                              type="button"
                              role="option"
                              aria-selected={type === 'City'
                                ? selectedCity === option.value
                                : selectedCountry === option.value}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setActiveLocationIndex(option.index)}
                              onClick={() => selectLocation(option)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs sm:text-sm cursor-pointer ${
                                activeLocationIndex === option.index ? 'bg-amber-50 text-zinc-950' : 'text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              <span className="truncate">{option.value}</span>
                              <span className="shrink-0 text-[10px] font-bold text-zinc-400">{type}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {filteredLocationOptions.length === 0 && (
                      <p className="px-3 py-3 text-xs text-zinc-500">No matching country or city</p>
                    )}
                  </div>
                )}
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
                  <option value="turnout">Trending &amp; Turnout</option>
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

            {/* Quick Tools on Right: Top 10 Rated, Nearby, Featured & Reset */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Top 10 Rated Quick Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !top10Only;
                  setTop10Only(next);
                  if (next) setSortBy('rating');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  top10Only
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 font-black shadow-amber-200/50 shadow-md ring-2 ring-amber-300'
                    : 'bg-white text-zinc-800 border-zinc-200 hover:bg-amber-50 hover:border-amber-300'
                }`}
                title="Filter to Top 10 Highest Rated Exhibitions"
              >
                <Crown className={`h-3.5 w-3.5 ${top10Only ? 'fill-zinc-950 text-zinc-950' : 'fill-amber-400 text-amber-500'}`} />
                <span>Top 10 Rated</span>
              </button>

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

          {/* ========================================================================= */}
          {/* ADVANCED SEARCHING & FILTERING CONSOLE (Highlighted Red Box Area)          */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-zinc-150 space-y-2.5">
            {/* Row 1: Fast Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-zinc-500" />
                <span>Quick Filters:</span>
              </span>

              {/* Free Pass Only */}
              <button
                type="button"
                onClick={() => setFreePassOnly((p) => !p)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                  freePassOnly
                    ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-emerald-500'
                }`}
              >
                <Ticket className="h-3.5 w-3.5 text-emerald-500" />
                <span>Free Visitor Pass</span>
              </button>

              {/* This Month */}
              <button
                type="button"
                onClick={() => setDateQuickFilter((d) => (d === 'this_month' ? 'all' : 'this_month'))}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                  dateQuickFilter === 'this_month'
                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-400'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>Happening This Month</span>
              </button>

              {/* Next 90 Days */}
              <button
                type="button"
                onClick={() => setDateQuickFilter((d) => (d === 'next_90' ? 'all' : 'next_90'))}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                  dateQuickFilter === 'next_90'
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-purple-400'
                }`}
              >
                <span>Next 90 Days</span>
              </button>

              {/* 4.5+ Rating */}
              <button
                type="button"
                onClick={() => setMinRating((r) => (r === '4.5' ? 'all' : '4.5'))}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                  minRating === '4.5'
                    ? 'bg-amber-500 text-white font-extrabold shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-amber-400'
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>⭐ 4.5+ Rating</span>
              </button>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((p) => !p)}
                className="ml-auto px-3 py-1 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Filter className="h-3 w-3 text-zinc-500" />
                <span>{showAdvancedFilters ? 'Hide Search Filters' : 'More Search Filters ▾'}</span>
              </button>
            </div>

            {/* Row 2: Expanded Secondary Dropdowns (State, Venue, Rating, Dates) */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-inner animate-in fade-in duration-200">
                {/* State Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Filter by State / Region
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] cursor-pointer shadow-2xs"
                  >
                    <option value="all">All States &amp; Regions</option>
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Venue Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Filter by Venue / Center
                  </label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Venues &amp; Centers</option>
                    {availableVenues.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Rating Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Ratings (Any Star)</option>
                    <option value="4.8">⭐ 4.8 Stars &amp; Above</option>
                    <option value="4.5">⭐ 4.5 Stars &amp; Above</option>
                    <option value="4.0">⭐ 4.0 Stars &amp; Above</option>
                  </select>
                </div>

                {/* Date Range Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Custom Date Range
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none shadow-2xs"
                      title="From date"
                    />
                    <span className="text-zinc-400 text-xs font-bold">–</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none shadow-2xs"
                      title="To date"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Row 3: Active Filters Summary Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-[11px] text-zinc-400 font-extrabold uppercase tracking-wider">Active:</span>
                {top10Only && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] shadow-2xs">
                    <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />
                    <span>Top 10 Rated</span>
                    <button
                      type="button"
                      onClick={() => setTop10Only(false)}
                      className="hover:text-amber-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {freePassOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px] shadow-2xs">
                    <span>Free Pass</span>
                    <button
                      type="button"
                      onClick={() => setFreePassOnly(false)}
                      className="hover:text-emerald-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCity !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>City: {selectedCity}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCity('all')}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCountry !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>Country: {selectedCountry}</span>
                    <button
                      type="button"
                      onClick={() => selectLocation(null)}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedState !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>State: {selectedState}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedState('all')}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedVenue !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>Venue: {selectedVenue}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVenue('all')}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {minRating !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] shadow-2xs">
                    <span>⭐ {minRating}+ Stars</span>
                    <button
                      type="button"
                      onClick={() => setMinRating('all')}
                      className="hover:text-amber-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {dateQuickFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[11px] shadow-2xs">
                    <span>Date: {dateQuickFilter.replace('_', ' ')}</span>
                    <button
                      type="button"
                      onClick={() => setDateQuickFilter('all')}
                      className="hover:text-blue-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>{selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-[11px] shadow-2xs">
                    <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-zinc-950 font-black cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Event Cards Grid starts right here! */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        <div id="events-grid-anchor" className="scroll-mt-4" />

        {/* Top 10 Rated Active Banner */}
        {top10Only && (
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-zinc-950 shadow-sm">
                <Crown className="h-4 w-4 fill-zinc-950" />
              </div>
              <div>
                <span className="font-black text-sm text-zinc-950 block">Top 10 Highest-Rated Exhibitions Active</span>
                <span className="text-zinc-700 text-xs">
                  Displaying the 10 most prestigious trade shows ranked by verified buyer ratings and attendee reviews.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTop10Only(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-zinc-950 font-black transition-all shadow-2xs cursor-pointer text-xs"
            >
              Show All Exhibitions
            </button>
          </div>
        )}

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
              const isSaved = savedEventIds.has(evt.id) || savedEventIds.has(eventSlug);
              const isInterested = interestedSlugs.has(String(eventSlug).toLowerCase()) || interestedSlugs.has(String(evt.id).toLowerCase());
              const isFollowing = followedSlugs.has(String(eventSlug).toLowerCase()) || followedSlugs.has(String(evt.id).toLowerCase());
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
                    <Image
                      src={wpImg}
                      alt={evt.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
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
                      {/* Category or Top Rank Badge on Left */}
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {(top10Only || (sortBy === 'rating' && (currentPage - 1) * ITEMS_PER_PAGE + idx < 10)) && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 shadow-xl ring-2 ring-white inline-flex items-center gap-1">
                            <Crown className="h-3 w-3 fill-zinc-950" />
                            <span>#{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1} Ranked</span>
                          </span>
                        )}
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-zinc-950/80 text-white shadow-lg border border-white/20 backdrop-blur-md">
                          {evt.category || 'Trade Show'}
                        </span>
                      </div>

                      {/* Free Visitor Pass Badge + Interest + Bookmark Buttons on Right */}
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#FFCC00] to-amber-400 text-zinc-950 shadow-lg tracking-tight">
                          Free Visitor Pass
                        </span>

                        {/* Quick Interest Star Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleInterest(evt);
                          }}
                          className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95 ${
                            isInterested
                              ? 'bg-amber-400 text-zinc-950 shadow-amber-400/40 scale-105'
                              : 'bg-black/40 text-white hover:bg-black/70'
                          }`}
                          aria-label="Mark as interested"
                          title={isInterested ? 'Interested (Click to remove)' : 'Show Interest'}
                        >
                          <Star className={`h-3 w-3 ${isInterested ? 'fill-zinc-950 text-zinc-950' : 'text-white'}`} />
                        </button>

                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleSave(evt.id, evt);
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
                      <div
                        className="text-xs text-zinc-600 line-clamp-2 leading-relaxed min-h-[34px] [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_b]:font-semibold [&_b]:text-zinc-900 [&_em]:italic"
                        dangerouslySetInnerHTML={{
                          __html: renderCardDescription(evt.description || `Explore ${evt.title}, featuring international exhibitors, product showcases, and B2B business networking.`)
                        }}
                      />
                    </div>

                    {/* Footer Row: [Country] on Left, [Exhibit • Get Pass →] on Right */}
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                      {/* Left: Country / City with Globe */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-semibold truncate max-w-[130px]">
                        <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{evt.country || evt.city || 'International'}</span>
                      </div>

                      {/* Right: Interested • Exhibit • Get Pass → */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleInterest(evt);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isInterested
                              ? 'bg-amber-400 text-zinc-950 font-black shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                          title={isInterested ? 'Interested (Click to remove)' : 'Show Interest'}
                        >
                          <Star className={`h-3 w-3 ${isInterested ? 'fill-zinc-950 text-zinc-950' : 'text-amber-500'}`} />
                          <span>{isInterested ? 'Interested' : 'Interest'}</span>
                        </button>

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
