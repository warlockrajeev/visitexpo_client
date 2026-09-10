'use client';

/**
 * @file app/venue/[id]/page.js
 * @description Dedicated Convention & Exhibition Venue Details Page (VDP).
 * Faithfully implements the 10times reference layout from the user's screenshots
 * styled with the VisitExpo color theme (#FFCC00 yellow, #FF2E63 pink, modern white canvas).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.js';
import { getVenueById, VENUES_DATA } from '../../../data/venuesData.js';
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
  Sparkles
} from 'lucide-react';

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params?.id || 'bharat-mandapam';

  // Load venue data
  const venue = useMemo(() => {
    return getVenueById(venueId) || getVenueById('bharat-mandapam');
  }, [venueId]);

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [bookmarkedEvents, setBookmarkedEvents] = useState({});
  const [interestedMap, setInterestedMap] = useState({});
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareToast, setShareToast] = useState(false);

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

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
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
          <Link href="/" className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
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

      {/* ========================================================================= */}
      {/* 1. HERO BANNER & FLOATING VENUE PROFILE CARD (Image 1 Match)              */}
      {/* ========================================================================= */}
      <div className="relative pt-20 sm:pt-24">
        {/* Panoramic Exhibition Hall Banner Background */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-zinc-900">
          <img
            src={venue.heroBanner}
            alt={venue.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
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
                      className="hover:underline cursor-pointer"
                    >
                      {venue.city}, {venue.country}
                    </button>
                  </div>

                  {/* Followers & Rating stats */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-0.5 flex-wrap">
                    <span className="font-semibold text-zinc-700">{venue.followersCount} Followers</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200/60">
                      <span>{venue.rating}</span>
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </div>
                    <span>{venue.ratingsCount} Ratings</span>
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
                  <Sparkles className="h-3.5 w-3.5 text-[#FFCC00]" />
                  <span>Get Quotes</span>
                </button>

                {/* Get Direction */}
                <button
                  type="button"
                  onClick={() => scrollToSection('location')}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-600" />
                  <span>Get Direction</span>
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
      {/* 2. STICKY SUB-NAV TAB BAR (Image 1, 2, 3, 4 Match)                       */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-2xs mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-2.5">
          {/* Nav Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'location', label: 'Location' },
              { id: 'calendar', label: 'Event Calendar' },
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
                <span>Get Direction</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================================================================== */}
          {/* LEFT MAIN COLUMN (8 of 12 columns)                                    */}
          {/* ===================================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ------------------------------------------------------------------- */}
            {/* OVERVIEW SECTION (Image 2 Match)                                    */}
            {/* ------------------------------------------------------------------- */}
            <div id="overview" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
              
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Overview</h2>
              </div>

              {/* 4 Architectural Venue Photos Grid (Image 2 Match) */}
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

                {/* 2. Events Hosted */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <Calendar className="h-5 w-5 text-orange-500 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900">{venue.eventsHosted}</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Events Hosted</span>
                </div>

                {/* 3. Upcoming Events */}
                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                  <Clock className="h-5 w-5 text-orange-500 mb-0.5" />
                  <span className="font-extrabold text-sm text-zinc-900">{venue.upcomingEventsCount}</span>
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

              {/* Highly Rated For: Segmented Green Bars (Image 2 & 3 Match) */}
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
            {/* LEADING EVENTS SECTION (Image 3 Match)                              */}
            {/* ------------------------------------------------------------------- */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Leading Events</h2>
                <button
                  type="button"
                  onClick={() => scrollToSection('calendar')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All Events →
                </button>
              </div>

              {/* 2-Column Grid of Leading Events */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                {venue.leadingEvents.map((evt) => {
                  const isSaved = Boolean(bookmarkedEvents[evt.id]);

                  return (
                    <div
                      key={evt.id}
                      className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition-colors leading-snug line-clamp-2">
                            {evt.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(evt.id)}
                            className="text-zinc-400 hover:text-zinc-800 p-1 cursor-pointer shrink-0"
                            title="Bookmark Event"
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-zinc-900 text-zinc-900' : ''}`} />
                          </button>
                        </div>

                        <p className="text-[11px] text-zinc-500 font-medium">
                          {evt.dates}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="font-semibold text-zinc-600 truncate max-w-[180px]">{evt.category}</span>
                        <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-bold">{evt.daysToGo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* ADDRESS & LOCATION SECTION (Image 4 Match)                          */}
            {/* ------------------------------------------------------------------- */}
            <div id="location" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Address</h2>
              </div>

              <div className="grid md:grid-cols-12 gap-5 items-center">
                {/* Map Snapshot Visual */}
                <div className="md:col-span-4 relative h-36 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 group">
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop"
                    alt="Map snapshot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-blue-900/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Address Details & Action Buttons */}
                <div className="md:col-span-8 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                      <span>{venue.name}</span>
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      {venue.address}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                      <Train className="h-3 w-3 text-blue-600" />
                      <span>{venue.metro}</span>
                    </p>
                  </div>

                  {/* 4 Quick Action Buttons (Contact, Website, Get Quotes, Report) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContactModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3 text-zinc-500" />
                      <span>Contact</span>
                    </button>

                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3 text-blue-600" />
                      <span>Website</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowQuoteModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3 text-[#FF2E63]" />
                      <span>Get Quotes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert('Report submitted. Our moderation team will verify venue coordinates.')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Flag className="h-3 w-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* EVENT CALENDAR SECTION (Image 4 Match)                              */}
            {/* ------------------------------------------------------------------- */}
            <div id="calendar" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Event Calendar</h2>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-zinc-800 text-white rounded-md text-xs font-bold shadow-2xs">
                  All Events
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  Showing upcoming exhibitions scheduled at {venue.shortName}
                </span>
              </div>

              {/* Event Calendar Rows */}
              <div className="divide-y divide-zinc-150">
                {venue.leadingEvents.map((evt, idx) => {
                  const isInterested = Boolean(interestedMap[evt.id]);

                  return (
                    <div
                      key={evt.id}
                      className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Big Date Block */}
                        <div className="w-16 h-16 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-center shrink-0">
                          <span className="text-[11px] font-extrabold text-zinc-800 leading-tight">
                            {idx === 0 ? '14th - 27th' : idx === 1 ? '10th - 14th' : idx === 2 ? '06th - 14th' : '08th - 10th'}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                            {idx === 0 ? 'NOV, 26' : idx === 1 ? 'MAR, 27' : idx === 2 ? 'FEB, 27' : 'OCT, 26'}
                          </span>
                        </div>

                        {/* Title, Pill & Organizer */}
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500 text-white">
                            {evt.daysToGo}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                            {evt.title}
                          </h3>
                          <p className="text-xs text-zinc-500 font-medium">
                            Tradeshow • {evt.turnout} • Verified Business Fair
                          </p>
                        </div>
                      </div>

                      {/* Interested Button */}
                      <button
                        type="button"
                        onClick={() => toggleInterested(evt.id)}
                        className={`self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isInterested
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isInterested ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
                        <span>Interested ({isInterested ? '204' : '203'})</span>
                      </button>
                    </div>
                  );
                })}
              </div>
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
                    <h5 className="font-bold text-xs text-zinc-900 leading-snug">"{rev.headline}"</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">{rev.review}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT SIDEBAR COLUMN (4 of 12 columns) (Images 2, 3, 4 Match)        */}
          {/* ===================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Request Quotation / Date Availability Banner */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 shadow-md space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FFCC00]" />
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

            {/* 2. Featured Venues Widget (Image 2 Match) */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">Featured Venues</h3>

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

            {/* 3. More Venues Near... Widget (Image 3 Match) */}
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
                href="/#venues"
                className="w-full py-2 px-3 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors text-center block shadow-2xs"
              >
                All Venues Nearby
              </Link>
            </div>

            {/* 4. Nearby Hotels Widget (Image 4 Match) */}
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

              <button
                type="button"
                onClick={() => alert('Hotel reservations portal opening soon on VisitExpo travel hub.')}
                className="w-full py-2 px-3 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors text-center block shadow-2xs cursor-pointer"
              >
                More Hotels
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: GET QUOTES & CONTACT                                              */}
      {/* ========================================================================= */}
      
      {/* 1. Get Quotes Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF2E63]" />
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
