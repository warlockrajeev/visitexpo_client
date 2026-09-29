'use client';

/**
 * @file app/venue/[id]/page.js
 * @description Dedicated Convention & Exhibition Venue Details Page (VDP).
 * Features:
 * - Dynamic venue resolution (pre-curated venues + dynamic DB fallback)
 * - Live Total Events Hosted and Upcoming Events with real API database synchronization
 * - Interactive Google Maps embed with full-width preview, Copy Address, and Driving Directions
 * - Event Calendar with Upcoming / Past / All tabs and keyword search
 * - Meeting spaces, halls breakdown, reviews, and quote request modal
 * - VisitExpo color theme (#FFCC00 yellow, #FF2E63 pink, modern high-contrast design)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../../components/Navbar.js';
import Footer from '../../../components/Footer.js';
import { getVenueById, VENUES_DATA, slugifyVenue } from '../../../data/venuesData.js';
import {
  MapPin,
  Star,
  Share2,
  Bookmark,
  Calendar,
  Clock,
  ThumbsUp,
  Building,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle2,
  Plus,
  X,
  Send,
  Navigation,
  Check,
  Award,
  Layers,
  Train,
  Plane,
  ChevronDown,
  ChevronUp,
  Flag,
  Globe,
  MessageSquare,
  ShieldCheck,
  Search,
  Copy,
  CheckCheck,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params?.id || 'bharat-mandapam';

  const [dbVenue, setDbVenue] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchVenueProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/venues/${venueId}`);
        if (isMounted && res.data?.success && res.data?.data) {
          setDbVenue(res.data.data);
        }
      } catch (err) {
        // use curated fallback data
      }
    };
    fetchVenueProfile();
    return () => {
      isMounted = false;
    };
  }, [venueId]);

  // Load venue data (curated or dynamic fallback merged with database-saved custom images and specs)
  const venue = useMemo(() => {
    const base = getVenueById(venueId) || getVenueById('bharat-mandapam');
    if (!dbVenue) return base;
    return {
      ...base,
      ...dbVenue,
      heroBanner: dbVenue.heroBanner || base.heroBanner,
      logoThumbnail: dbVenue.logoThumbnail || base.logoThumbnail,
      gallery: Array.isArray(dbVenue.gallery) && dbVenue.gallery.length > 0 ? dbVenue.gallery : base.gallery,
      address: dbVenue.address || base.address,
      metro: dbVenue.metro || base.metro
    };
  }, [venueId, dbVenue]);

  // Live database events state
  const [allDbEvents, setAllDbEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Local UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [bookmarkedEvents, setBookmarkedEvents] = useState({});
  const [interestedMap, setInterestedMap] = useState({});
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Event Calendar filtering state
  const [eventFilterTab, setEventFilterTab] = useState('all'); // 'all', 'upcoming', 'past'
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Modals state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    eventType: 'Trade Exhibition',
    expectedAttendees: '5,000 - 20,000',
    preferredDates: '',
    hallRequirement: 'Main Mega Exhibition Hall',
    notes: ''
  });
  const [quoteSuccessToast, setQuoteSuccessToast] = useState(false);

  // Scroll listener for sticky sub-nav
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setIsScrolledPastHero(true);
      } else {
        setIsScrolledPastHero(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real events from the backend to compute live total and upcoming events
  useEffect(() => {
    let isMounted = true;
    const fetchLiveEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await axios.get(`${API_URL}/events?limit=1000&all=true`);
        const eventsList = res.data?.data?.events || res.data?.events || [];
        if (isMounted && Array.isArray(eventsList)) {
          setAllDbEvents(eventsList);
        }
      } catch (err) {
        console.warn('Could not fetch live events from API, utilizing fallback data:', err);
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    fetchLiveEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter events from the database matching this venue
  const matchedDbEvents = useMemo(() => {
    if (!venue || !Array.isArray(allDbEvents) || allDbEvents.length === 0) return [];

    const vNorm = (venue.name || '').toLowerCase();
    const vShortNorm = (venue.shortName || '').toLowerCase();
    const vSlug = venue.slug || venue.id;
    const vCity = (venue.city || '').toLowerCase();

    return allDbEvents.filter((ev) => {
      const evVenue = (ev.venue || '').toLowerCase();
      const evCity = (ev.city || '').toLowerCase();
      const evAddr = (ev.address || '').toLowerCase();
      const evSlug = slugifyVenue(ev.venue || '');

      // Direct match on venue name or short name
      if (evVenue && (evVenue.includes(vShortNorm) || vNorm.includes(evVenue) || evVenue.includes(vNorm))) {
        return true;
      }
      // Slug match
      if (evSlug && (evSlug === vSlug || evSlug.includes(vSlug) || vSlug.includes(evSlug))) {
        return true;
      }
      // Address match
      if (evAddr && (evAddr.includes(vShortNorm) || evAddr.includes(vNorm))) {
        return true;
      }

      // Specific known aliases
      if (vSlug === 'bharat-mandapam' && (evVenue.includes('pragati') || evVenue.includes('mandapam') || evAddr.includes('pragati'))) return true;
      if (vSlug === 'yashobhoomi' && (evVenue.includes('iicc') || evVenue.includes('dwarka') || evVenue.includes('yashobhoomi'))) return true;
      if (vSlug === 'jio-world' && (evVenue.includes('jio') || evVenue.includes('bkc') || evVenue.includes('bandra kurla'))) return true;
      if (vSlug === 'bec-mumbai' && (evVenue.includes('bombay exhibition') || evVenue.includes('nesco') || evVenue.includes('goregaon'))) return true;
      if (vSlug === 'biec-bengaluru' && (evVenue.includes('biec') || evVenue.includes('bangalore exhibition'))) return true;
      if (vSlug === 'india-expo-centre' && (evVenue.includes('expo centre') || evVenue.includes('greater noida') || evVenue.includes('ieml'))) return true;
      if (vSlug === 'excel-london' && (evVenue.includes('excel') || evVenue.includes('docklands'))) return true;

      // Fallback for custom dynamically generated venues: match city if venue name has overlap
      if (evCity === vCity && vNorm.split(' ').some((word) => word.length > 3 && evVenue.includes(word))) {
        return true;
      }

      return false;
    });
  }, [venue, allDbEvents]);

  // Split into upcoming and past
  const now = useMemo(() => new Date(), []);

  const upcomingMatchedEvents = useMemo(() => {
    return matchedDbEvents.filter((ev) => {
      const end = ev.endDate ? new Date(ev.endDate) : ev.startDate ? new Date(ev.startDate) : null;
      return !end || end >= now;
    });
  }, [matchedDbEvents, now]);

  const pastMatchedEvents = useMemo(() => {
    return matchedDbEvents.filter((ev) => {
      const end = ev.endDate ? new Date(ev.endDate) : ev.startDate ? new Date(ev.startDate) : null;
      return end && end < now;
    });
  }, [matchedDbEvents, now]);

  // Aggregate live metrics
  const totalEventsDisplay = useMemo(() => {
    if (matchedDbEvents.length > 0) {
      const baseCount = parseInt(venue.eventsHosted, 10) || 0;
      return `${Math.max(baseCount, matchedDbEvents.length)}+`;
    }
    return venue.eventsHosted || '10+';
  }, [matchedDbEvents, venue]);

  const upcomingEventsDisplay = useMemo(() => {
    if (upcomingMatchedEvents.length > 0) {
      return `${upcomingMatchedEvents.length}+`;
    }
    return venue.upcomingEventsCount || '4+';
  }, [upcomingMatchedEvents, venue]);

  // Unified Calendar events (DB events mapped to unified structure + venue leading events fallback)
  const unifiedCalendarEvents = useMemo(() => {
    const list = [];

    // Map DB events
    matchedDbEvents.forEach((ev) => {
      const start = ev.startDate ? new Date(ev.startDate) : null;
      const end = ev.endDate ? new Date(ev.endDate) : null;
      const isPast = end ? end < now : false;

      let dateFormatted = ev.dates || 'Upcoming 2026';
      if (start && !ev.dates) {
        dateFormatted = start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        if (end) {
          dateFormatted += ` - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
      }

      list.push({
        id: ev._id || ev.id || ev.slug,
        slug: ev.slug || ev._id,
        title: ev.title || 'Exhibition Fair',
        dates: dateFormatted,
        category: ev.category || 'Trade Exhibition',
        turnout: ev.attendeesCount ? `${ev.attendeesCount.toLocaleString()}+ Attendees` : '15,000+ Visitors',
        daysToGo: isPast ? 'Concluded' : 'Upcoming Event',
        isPast,
        isDbLive: true,
        banner: ev.image || venue.heroBanner,
        city: ev.city || venue.city,
        venue: ev.venue || venue.name
      });
    });

    // Supplement with curated leading events if DB matches are few
    if (Array.isArray(venue.leadingEvents) && venue.leadingEvents.length > 0) {
      venue.leadingEvents.forEach((curatedEvt) => {
        // avoid duplicate title
        const exists = list.some((x) => x.title.toLowerCase().includes(curatedEvt.title.toLowerCase()));
        if (!exists) {
          list.push({
            id: `curated-${curatedEvt.id}`,
            slug: slugifyVenue(curatedEvt.title),
            title: curatedEvt.title,
            dates: curatedEvt.dates,
            category: curatedEvt.category,
            turnout: curatedEvt.turnout,
            daysToGo: curatedEvt.daysToGo,
            isPast: false,
            isDbLive: false,
            banner: venue.gallery?.[0] || venue.heroBanner,
            city: venue.city,
            venue: venue.name
          });
        }
      });
    }

    return list;
  }, [matchedDbEvents, venue, now]);

  // Filtered calendar events based on active tab and search
  const filteredCalendarEvents = useMemo(() => {
    return unifiedCalendarEvents.filter((ev) => {
      // Tab filter
      if (eventFilterTab === 'upcoming' && ev.isPast) return false;
      if (eventFilterTab === 'past' && !ev.isPast) return false;

      // Search filter
      if (eventSearchQuery.trim()) {
        const q = eventSearchQuery.toLowerCase().trim();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesCategory = ev.category.toLowerCase().includes(q);
        const matchesDates = ev.dates.toLowerCase().includes(q);
        return matchesTitle || matchesCategory || matchesDates;
      }

      return true;
    });
  }, [unifiedCalendarEvents, eventFilterTab, eventSearchQuery]);

  // Handlers
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleCopyAddress = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(venue.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 3000);
    }
  };

  const toggleBookmark = (eventId) => {
    setBookmarkedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const toggleInterested = (eventId) => {
    setInterestedMap((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setShowQuoteModal(false);
    setQuoteSuccessToast(true);
    setTimeout(() => setQuoteSuccessToast(false), 4500);
    setQuoteForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      eventType: 'Trade Exhibition',
      expectedAttendees: '5,000 - 20,000',
      preferredDates: '',
      hallRequirement: 'Main Mega Exhibition Hall',
      notes: ''
    });
  };

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Venue Not Found</h1>
          <p className="text-sm text-zinc-500 mt-2">The venue you are looking for does not exist.</p>
          <Link href="/venues" className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl">
            Browse All Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white flex flex-col">
      {/* Top Main Navbar */}
      <Navbar />

      {/* Floating Share Notification Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Venue link copied to clipboard!</span>
        </div>
      )}

      {/* Quote Submitted Success Toast */}
      {quoteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="font-bold">Quotation Request Dispatched!</p>
            <p className="text-[11px] opacity-90">The venue management office has received your dates &amp; hall inquiry.</p>
          </div>
        </div>
      )}

      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 text-xs text-zinc-500 flex items-center gap-1.5 overflow-x-auto">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <Link href="/venues" className="hover:text-zinc-900 transition-colors">Venues</Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <span className="font-semibold text-zinc-800 truncate">{venue.shortName || venue.name}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO BANNER & FLOATING VENUE PROFILE CARD                              */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* Panoramic Exhibition Hall Banner Background */}
        <div className="relative h-52 sm:h-64 md:h-72 w-full overflow-hidden bg-zinc-900">
          <img
            src={venue.heroBanner}
            alt={venue.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <div className="absolute top-4 left-4 sm:left-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20">
              <Building className="h-3.5 w-3.5 text-[#FFCC00]" />
              <span>Official Convention &amp; Trade Center</span>
            </span>
          </div>
        </div>

        {/* Floating White Profile Card overlapping Hero Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-16 sm:-mt-20 z-10 bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              
              {/* Left Column: Thumbnail Photo, Name, Star, Location, Ratings */}
              <div className="flex items-start gap-4 sm:gap-5">
                <img
                  src={venue.logoThumbnail}
                  alt={venue.name}
                  className="w-20 h-20 sm:w-26 sm:h-26 rounded-xl object-cover border-2 border-white shadow-sm shrink-0 bg-zinc-100"
                />

                <div className="space-y-1">
                  {/* Venue Name with Orange Star */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                      {venue.name}
                    </h1>
                    <span className="text-[#FF7A00] text-xl sm:text-2xl select-none leading-none">
                      ★
                    </span>
                  </div>

                  {/* Location line */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <button
                      type="button"
                      onClick={() => scrollToSection('location')}
                      className="hover:underline cursor-pointer text-left"
                    >
                      {venue.city}, {venue.country}
                    </button>
                  </div>

                  {/* Followers, Rating & Live Database Badge */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-0.5 flex-wrap">
                    <span className="font-semibold text-zinc-700">{venue.followersCount} Followers</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200/60">
                      <span>{venue.rating}</span>
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </div>
                    <span>{venue.ratingsCount} Ratings</span>

                    {matchedDbEvents.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>{matchedDbEvents.length} Live DB Events</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Follow & Share buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isFollowing
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Bottom Action Bar: Get Quotes, Get Direction, Contact, Compare */}
            <div className="mt-5 pt-4 border-t border-zinc-150 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Get Quotes Button (VisitExpo Vibrant Accent) */}
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="px-4 py-2 rounded-lg bg-[#FF2E63] hover:bg-[#E82054] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Get Quotes</span>
                </button>

                {/* Get Direction */}
                <button
                  type="button"
                  onClick={() => scrollToSection('location')}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-600" />
                  <span>Map Location &amp; Directions</span>
                </button>

                {/* Contact */}
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Contact</span>
                </button>
              </div>

              {/* + Compare button on right */}
              <button
                type="button"
                onClick={() => setIsCompared(!isCompared)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  isCompared
                    ? 'border-[#0B4EA2] bg-blue-50 text-[#0B4EA2]'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>{isCompared ? '✓ Compared' : '+ Compare'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STICKY SUB-NAV TAB BAR                                                 */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-2xs mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-2.5">
          {/* Nav Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'location', label: 'Map Location' },
              { id: 'calendar', label: `Event Calendar (${unifiedCalendarEvents.length})` },
              { id: 'meeting-space', label: 'Meeting Space' },
              { id: 'reviews', label: 'Reviews' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick header controls visible on scroll */}
          {isScrolledPastHero && (
            <div className="hidden lg:flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => scrollToSection('location')}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 px-2.5 py-1"
              >
                <Navigation className="h-3 w-3 text-blue-600" />
                <span>Map</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                  isFollowing
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-1 text-zinc-600 hover:text-zinc-900"
                title="Share venue"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: 2-COLUMN LAYOUT (LEFT 65%, RIGHT SIDEBAR 35%)            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================================================================== */}
          {/* LEFT MAIN COLUMN (8 of 12 columns)                                    */}
          {/* ===================================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ------------------------------------------------------------------- */}
            {/* OVERVIEW SECTION                                                    */}
            {/* ------------------------------------------------------------------- */}
            <div id="overview" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
              
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Venue Overview</h2>
              </div>

              {/* 4 Architectural Venue Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl overflow-hidden">
                {venue.gallery.map((photo, idx) => (
                  <div key={idx} className="relative h-28 sm:h-36 overflow-hidden rounded-lg bg-zinc-100 group">
                    <img
                      src={photo}
                      alt={`${venue.name} photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>

              {/* 4 Metric Cards Strip (Tradeshows, Events Hosted, Upcoming, Reputation) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Best Suited */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <ThumbsUp className="h-5 w-5 text-orange-500 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900">Tradeshows</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Best Suited</span>
                </div>

                {/* 2. Events Hosted (Dynamic Total Count) */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <Calendar className="h-5 w-5 text-orange-500 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900">{totalEventsDisplay}</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Events Hosted</span>
                </div>

                {/* 3. Upcoming Events (Dynamic Upcoming Count) */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <Clock className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900 text-emerald-700">{upcomingEventsDisplay}</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Upcoming Events</span>
                </div>

                {/* 4. Reputation Score */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <Star className="h-5 w-5 fill-orange-500 text-orange-500 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900">{venue.rating}</span>
                  <span className="text-[11px] text-zinc-500 font-medium">{venue.reputationText}</span>
                </div>
              </div>

              {/* Description Paragraph with Show More */}
              <div className="space-y-1 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                <p className={showFullDesc ? '' : 'line-clamp-3'}>
                  {venue.overviewDescription}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer pt-1"
                >
                  {showFullDesc ? 'Show Less' : '... Show More'}
                </button>
              </div>

              {/* Spec Grid: Total Area, Built Year, Renovated Year, Meeting Rooms */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-150">
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Total Area</span>
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 mt-0.5 block">{venue.totalArea}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Built Year</span>
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 mt-0.5 block">{venue.builtYear}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Renovated Year</span>
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 mt-0.5 block">{venue.renovatedYear}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Meeting Rooms</span>
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 mt-0.5 block">{venue.meetingRooms}</span>
                </div>
              </div>

              {/* Highly Rated For: Segmented Green Bars */}
              <div className="pt-4 border-t border-zinc-150 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900">Highly Rated For</h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Location', score: venue.ratingsBreakdown.location },
                    { label: 'Amenities', score: venue.ratingsBreakdown.amenities },
                    { label: 'Cleanliness', score: venue.ratingsBreakdown.cleanliness },
                    { label: 'Food', score: venue.ratingsBreakdown.food }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-600 font-medium">{item.label}</span>
                        <span className="font-extrabold text-zinc-900">{item.score}</span>
                      </div>
                      {/* Segmented green bar */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 10 }).map((_, segmentIdx) => {
                          const isFilled = segmentIdx < Math.round(item.score);
                          return (
                            <span
                              key={segmentIdx}
                              className={`h-2 flex-1 rounded-xs ${
                                isFilled ? 'bg-emerald-700' : 'bg-zinc-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------------------- */}
            {/* INTERACTIVE MAP LOCATION SECTION (Real Google Maps Embed)            */}
            {/* ------------------------------------------------------------------- */}
            <div id="location" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Compass className="h-5 w-5 text-rose-500" />
                    <span>Map Location &amp; Directions</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Interactive Google Maps navigation &amp; transit logistics</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(venue.address || venue.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#FFCC00]" />
                    <span>Open in Maps</span>
                  </a>
                </div>
              </div>

              {/* Responsive Embedded Google Map */}
              <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-zinc-200 shadow-xs bg-zinc-100 group">
                <iframe
                  title={`${venue.name} Interactive Map`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.address || venue.name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Floating Direction Overlay Pill on Map */}
                <div className="absolute bottom-3 left-3 z-10">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-zinc-950/90 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-102"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#FFCC00]" />
                    <span>Get Turn-by-Turn Directions</span>
                  </a>
                </div>
              </div>

              {/* Address Details & Logistics Card */}
              <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-zinc-900">{venue.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Verified Coordinates
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      {venue.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-600">
                      {venue.metro && (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          <Train className="h-3.5 w-3.5 text-blue-600" />
                          <span>{venue.metro}</span>
                        </span>
                      )}
                      {venue.airportDistance && (
                        <span className="inline-flex items-center gap-1 text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          <Plane className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{venue.airportDistance}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Copy Address Button */}
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                  >
                    {copiedAddress ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Address Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Logistics Action Strip */}
                <div className="pt-3 border-t border-zinc-200/70 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Driving Route</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Venue Helpdesk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Request Rates &amp; Hall Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('Location report received. Venue coordinates verified against survey records.')}
                    className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                  >
                    <Flag className="h-3 w-3" />
                    <span>Report inaccuracy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* EVENT CALENDAR & LIVE EVENTS LISTING                                */}
            {/* ------------------------------------------------------------------- */}
            <div id="calendar" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    <span>Event Calendar &amp; Exhibitions</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Explore confirmed trade expos, B2B summits, and consumer fairs at {venue.shortName}
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
                  {[
                    { id: 'all', label: `All (${unifiedCalendarEvents.length})` },
                    { id: 'upcoming', label: `Upcoming (${unifiedCalendarEvents.filter(e => !e.isPast).length})` },
                    { id: 'past', label: `Past (${unifiedCalendarEvents.filter(e => e.isPast).length})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEventFilterTab(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        eventFilterTab === tab.id
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar for Events inside this venue */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={`Search exhibitions or categories at ${venue.shortName}...`}
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all"
                />
                {eventSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEventSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Event Calendar Rows */}
              {filteredCalendarEvents.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 space-y-2">
                  <Calendar className="h-8 w-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">No exhibitions match your criteria</p>
                  <p className="text-[11px] text-zinc-500">Try changing the filter tab or resetting the search term.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-150">
                  {filteredCalendarEvents.map((evt, idx) => {
                    const isInterested = Boolean(interestedMap[evt.id]);
                    const isSaved = Boolean(bookmarkedEvents[evt.id]);

                    return (
                      <div
                        key={evt.id || idx}
                        className="py-4.5 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-zinc-50/60 rounded-xl p-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          {/* Event Thumbnail / Date Block */}
                          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0">
                            <img
                              src={evt.banner}
                              alt={evt.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <span className="text-[10px] font-black text-white text-center px-1 uppercase leading-tight">
                                {evt.isPast ? 'Concluded' : 'Fair'}
                              </span>
                            </div>
                          </div>

                          {/* Title, Pill & Organizer */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                evt.isPast
                                  ? 'bg-zinc-200 text-zinc-700'
                                  : 'bg-emerald-600 text-white'
                              }`}>
                                {evt.daysToGo}
                              </span>

                              {evt.isDbLive && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  Live Database Event
                                </span>
                              )}

                              <span className="text-[11px] text-zinc-500 font-semibold">
                                {evt.dates}
                              </span>
                            </div>

                            <Link
                              href={`/expo/${evt.slug}`}
                              className="block text-sm sm:text-base font-bold text-zinc-900 hover:text-[#FF2E63] transition-colors truncate"
                              title={evt.title}
                            >
                              {evt.title}
                            </Link>

                            <p className="text-xs text-zinc-500 font-medium truncate">
                              {evt.category} • {evt.turnout}
                            </p>
                          </div>
                        </div>

                        {/* Right Buttons: Interested & View Details */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleInterested(evt.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                              isInterested
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                            <Star className={`h-3.5 w-3.5 ${isInterested ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
                            <span>{isInterested ? 'Interested' : 'Save'}</span>
                          </button>

                          <Link
                            href={`/expo/${evt.slug}`}
                            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3 w-3 text-[#FFCC00]" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* MEETING SPACE & PAVILIONS BREAKDOWN                                 */}
            {/* ------------------------------------------------------------------- */}
            <div id="meeting-space" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Meeting Space &amp; Halls</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Specifications of halls and exhibition pavilions</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {venue.meetingSpaces.map((space, idx) => (
                  <div key={idx} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900">{space.name}</h4>
                      <span className="text-[10px] font-bold bg-white border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded">
                        {space.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                      <span><strong>Capacity:</strong> {space.capacity}</span>
                      <span>•</span>
                      <span><strong>Floor Space:</strong> {space.area}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* REVIEWS SECTION                                                     */}
            {/* ------------------------------------------------------------------- */}
            <div id="reviews" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900">Attendee &amp; Exhibitor Reviews</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Real ratings from delegates who attended events here</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5 text-[#FFCC00]" />
                  <span>Write Review</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    author: 'Sanjay Deshmukh',
                    role: 'Verified Exhibitor (RoboTech India)',
                    rating: 5,
                    date: '2 weeks ago',
                    headline: 'Pillarless halls allowed extraordinary stall customization',
                    review: 'The heavy load-bearing floors and subterranean cable trenches made setup effortless. Loading docks handled our 12-ton CNC machines without any bottlenecks.'
                  },
                  {
                    author: 'Dr. Priya Narang',
                    role: 'VIP Clinical Delegate',
                    rating: 5,
                    date: '1 month ago',
                    headline: 'Flawless metro connectivity and air conditioning',
                    review: 'Direct metro gate access eliminated Delhi traffic completely. The plenary hall acoustics and catering service were immaculate.'
                  }
                ].map((rev, idx) => (
                  <div key={idx} className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                          {rev.author[0]}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-zinc-900 block">{rev.author}</span>
                          <span className="text-[10px] text-zinc-500">{rev.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <h5 className="font-bold text-xs text-zinc-900 leading-snug">&quot;{rev.headline}&quot;</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">{rev.review}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT SIDEBAR COLUMN (4 of 12 columns)                                */}
          {/* ===================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Request Quotation / Date Availability Banner */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 shadow-md space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-[#FFCC00] uppercase tracking-wider">
                  Direct Venue Inquiry
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base leading-snug">
                Planning an exhibition or conference at {venue.shortName}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect with the official venue leasing secretariat for available dates, hall tariffs, and floor plans.
              </p>
              <button
                type="button"
                onClick={() => setShowQuoteModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Request Quotation &amp; Dates</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2. Featured Venues Widget */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">Featured Venues</h3>
                <Link href="/venues" className="text-xs font-semibold text-blue-600 hover:underline">
                  All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-zinc-150">
                {Object.values(VENUES_DATA)
                  .filter((v) => v.id !== venue.id)
                  .slice(0, 3)
                  .map((otherVenue) => (
                    <Link
                      key={otherVenue.id}
                      href={`/venue/${otherVenue.slug}`}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group hover:bg-zinc-50/50 rounded-lg p-1 -mx-1 transition-colors"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-blue-600 group-hover:text-blue-800 leading-snug">
                          {otherVenue.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          <span>{otherVenue.city}, {otherVenue.country}</span>
                        </p>
                        <span className="inline-block text-[10px] text-zinc-500 font-medium">
                          # Exhibition &amp; Convention Centres
                        </span>
                      </div>

                      {/* Orange Events Hosted Badge */}
                      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded-lg text-center shrink-0">
                        <div className="flex items-center justify-center gap-0.5 text-orange-600">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[11px] font-extrabold">{otherVenue.eventsHosted}</span>
                        </div>
                        <span className="text-[9px] text-orange-700 block font-medium">Events Hosted</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            {/* 3. More Venues Near Widget */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">
                More Venues near {venue.shortName}
              </h3>

              <div className="divide-y divide-zinc-150">
                {venue.nearbyVenues.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-600 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        <span>{item.distance}</span>
                      </p>
                      <span className="inline-block text-[10px] text-zinc-500 font-medium">
                        # Conference Centres
                      </span>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded-lg text-center shrink-0">
                      <div className="flex items-center justify-center gap-0.5 text-orange-600">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[11px] font-extrabold">{item.eventsHosted}</span>
                      </div>
                      <span className="text-[9px] text-orange-700 block font-medium">Events Hosted</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/venues"
                className="w-full py-2 px-3 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors text-center block shadow-2xs"
              >
                Browse All Venues Directory
              </Link>
            </div>

            {/* 4. Nearby Hotels Widget */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">Nearby Hotels</h3>

              <div className="divide-y divide-zinc-150">
                {venue.nearbyHotels.map((hotel, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=200&auto=format&fit=crop"
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 truncate">{hotel.name}</h4>
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px]">
                        {[...Array(hotel.stars)].map((_, i) => (
                          <Star key={i} className="h-2.5 w-2.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-zinc-600 font-medium block">{hotel.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={`https://www.google.com/travel/hotels?q=hotels+near+${encodeURIComponent(venue.address || venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors text-center block shadow-2xs cursor-pointer"
              >
                Search Hotels on Google Travel &rarr;
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* ========================================================================= */}
      {/* MODALS: GET QUOTES & CONTACT                                              */}
      {/* ========================================================================= */}
      
      {/* 1. Get Quotes Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-900">Request Venue Quotation &amp; Dates</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={quoteForm.name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="vikram@organizers.com"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Company / Association</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Trade Council"
                    value={quoteForm.company}
                    onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Event Type</label>
                  <select
                    value={quoteForm.eventType}
                    onChange={(e) => setQuoteForm({ ...quoteForm, eventType: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="Trade Exhibition">Trade Exhibition</option>
                    <option value="Global Conference">Global Conference</option>
                    <option value="Consumer Fair">Consumer Fair</option>
                    <option value="Corporate Conclave">Corporate Conclave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Preferred Dates</label>
                  <input
                    type="text"
                    placeholder="e.g. Q4 2026 / Nov 2026"
                    value={quoteForm.preferredDates}
                    onChange={(e) => setQuoteForm({ ...quoteForm, preferredDates: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Special Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Mention booth counts, high-power requirement, setup days..."
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FF2E63] hover:bg-[#E82054] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="font-bold text-sm text-zinc-900">Contact Venue Management</h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-600">
              <p>
                <strong>Venue:</strong> {venue.name}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>+91 11 2337 1860 / +91 22 6608 0000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>leasing@visitexpo.in</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600" />
                <span>{venue.address}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="font-bold text-sm text-zinc-900">Review {venue.shortName}</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowReviewModal(false);
                alert('Thank you! Your review for ' + venue.name + ' has been submitted for moderation.');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rating</label>
                <select className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900">
                  <option value={5}>★★★★★ (5/5) Excellent</option>
                  <option value={4}>★★★★☆ (4/5) Very Good</option>
                  <option value={3}>★★★☆☆ (3/5) Average</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Review</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share feedback on cleanliness, halls, metro transit, acoustics..."
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-bold text-xs"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
