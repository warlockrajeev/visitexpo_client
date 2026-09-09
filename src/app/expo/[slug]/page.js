'use client';

/**
 * @file app/expo/[slug]/page.js
 * @description Dedicated 10times.com-style Expo Details Page (EDP) with VisitExpo color theme.
 * Implements the exact layout from the user's reference screenshots:
 * - Floating Header Card with Logo, Edition, Featured tag, Rating, Dates, Title, Location, Attendees Avatars, Interested & Booth CTAs
 * - Sticky Navigation Bar with mini header on scroll (About, Feed, Exhibitors, Speakers, Reviews, Deals)
 * - Media Gallery Carousel with slide navigation
 * - Highlights Box with key metrics and visitor tags
 * - "Listed In" hashtags & category badges
 * - Social invitation bar ("Who's coming with you?")
 * - Structured metadata grid (Timings, Entry Fees, Estimated Turnout, Event Type)
 * - 10times right sidebar (Matchmaking, Job vacancies / sponsor widgets, Networking)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import wpEventImages from '@/data/wordpress-event-images.json';
import { useAuth } from '../../../context/AuthContext.js';
import Navbar from '../../../components/Navbar.js';
import GatedAuthModal from '../../../components/GatedAuthModal.js';
import InterestedAttendeesModal from '../../../components/InterestedAttendeesModal.js';
import {
  Calendar,
  MapPin,
  Star,
  Users,
  Building,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Ticket,
  Store,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Briefcase,
  HelpCircle,
  Tag,
  Info,
  Layers,
  Lock,
  ThumbsUp,
  MessageSquare,
  Bell,
  BellRing,
  UserPlus,
  UserCheck,
  Send,
  Check,
  Search,
  Filter
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ExpoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug || '';

  // Event State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'about' | 'feed' | 'exhibitors' | 'speakers' | 'reviews' | 'deals'
  const [activeTab, setActiveTab] = useState('about');

  // Media Carousel State
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

  // Read More Description Toggle
  const [isReadMore, setIsReadMore] = useState(false);

  // Social & Interactive State
  const [isSaved, setIsSaved] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [isFollowingExpo, setIsFollowingExpo] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [followedAttendeeIds, setFollowedAttendeeIds] = useState(new Set());
  const [attendeeFilter, setAttendeeFilter] = useState('all');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [connectionModalUser, setConnectionModalUser] = useState(null);
  const [connectionNote, setConnectionNote] = useState('');
  const [connectionSent, setConnectionSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [gatedContext, setGatedContext] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch Event by slug or ID from WordPress API
  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/wordpress-events');
        if (res.data?.success && Array.isArray(res.data?.events)) {
          const cleanSlug = String(slug || '').toLowerCase().trim();
          const found = res.data.events.find((e) => {
            if (!e) return false;
            const itemSlug = String(e.slug || '').toLowerCase();
            const itemId = String(e.id || '').toLowerCase();
            const itemWpId = String(e.wpPostId || '').toLowerCase();
            const titleSlug = (e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              itemSlug === cleanSlug ||
              itemId === cleanSlug ||
              itemWpId === cleanSlug ||
              titleSlug === cleanSlug ||
              (cleanSlug.length > 3 && (titleSlug.includes(cleanSlug) || cleanSlug.includes(titleSlug)))
            );
          });
          if (found) {
            const charSum = (found.title || '').split('').reduce((acc, char, i) => acc + char.charCodeAt(0), 19);
            const resolvedImage =
              wpEventImages[cleanSlug] ||
              wpEventImages[String(found.id)] ||
              wpEventImages[String(found.wpPostId)] ||
              wpEventImages[found.slug] ||
              found.image;

            setEvent({
              ...found,
              image: resolvedImage || found.image,
              rating: found.rating || (4.5 + ((charSum % 5) * 0.1)).toFixed(1),
              reviewCount: found.reviewCount || (80 + (charSum % 180)),
              followersCount: found.followersCount || found.interestedCount || (1100 + (charSum % 2900)),
              edition: found.edition || `${8 + (charSum % 15)}th Edition`,
              timings: found.timings || '9:00 AM – 5:00 PM (General Admission)',
              entryType: found.entryType || 'Free Ticket for Industry Professionals',
              boothCost: found.boothCost || 'Starts from 145 USD / sqm',
              turnout: found.turnout || '100,000+ Visitors • 2,000+ Exhibitors',
              format: found.format || (charSum % 4 === 0 ? 'Hybrid Expo' : 'In-Person Expo')
            });
          } else {
            // Default synthesized event matching slug
            const resolvedFallbackImage =
              wpEventImages[cleanSlug] ||
              wpEventImages[slug] ||
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop';
            setEvent({
              id: slug || 'expo-event',
              title: decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'International Trade Exhibition 2026',
              slug: slug,
              category: 'Trade Show',
              city: 'Paris',
              country: 'France',
              venue: 'Exhibition Centre',
              dates: 'Upcoming 2026',
              rating: '4.8',
              reviewCount: 120,
              followersCount: 1420,
              edition: 'Annual Edition',
              image: resolvedFallbackImage,
              description:
                'Premier international trade exhibition featuring industry leaders, technology innovators, and global business delegates.',
              entryType: 'Free Ticket for Industry Professionals',
              boothCost: 'Starts from 145 USD / sqm',
              turnout: '50,000+ Visitors • 1,200+ Exhibitors',
              timings: '9:00 AM – 5:00 PM (General Admission)',
              featured: true
            });
          }
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [slug]);

  // Load Social Local Persistence
  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      try {
        const savedInterested = localStorage.getItem(`visitexpo_interested_${slug}`);
        if (savedInterested === 'true') setIsInterested(true);

        const savedFollowExpo = localStorage.getItem(`visitexpo_follow_expo_${slug}`);
        if (savedFollowExpo === 'true') setIsFollowingExpo(true);

        const savedFollowedAtt = localStorage.getItem(`visitexpo_followed_att_${slug}`);
        if (savedFollowedAtt) {
          try {
            setFollowedAttendeeIds(new Set(JSON.parse(savedFollowedAtt)));
          } catch (_) {}
        }
      } catch (err) {
        console.error('Error loading social state from localStorage:', err);
      }
    }
  }, [slug]);

  // Fetch verified attendees from Social API
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        const res = await axios.get(`/api/events/${slug}/social`);
        if (res.data?.success && res.data?.data) {
          if (Array.isArray(res.data.data.attendees)) {
            setAttendees(res.data.data.attendees);
          }
        }
      } catch (err) {
        console.warn('Using fallback seed for social data:', err);
      }
    };
    if (slug) fetchSocialData();
  }, [slug]);

  // Gallery Photos Pool
  const mediaGallery = useMemo(() => {
    if (!event) return [];
    return [
      {
        type: 'image',
        url: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
        caption: `${event.title || 'Exhibition'} • Official Exhibition Poster`
      },
      {
        type: 'video',
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
        caption: 'Live Masterclass & Product Demos'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
        caption: 'B2B Procurement & Supplier Stalls'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop',
        caption: 'Conference Keynote Stage'
      }
    ];
  }, [event]);

  // Social Proof Attendee Avatars
  const attendeeAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop'
  ];

  // "Listed In" Tags
  const listedInTags = [
    '#Food & Beverages',
    '#Beverage',
    '#Food',
    '#Bakery',
    '#Package',
    '#Home',
    '#Utensils',
    '#Home Baking',
    '#Bake',
    '#Business',
    '#Family',
    '#Machinery',
    '#Logistics'
  ];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast('Event link copied to clipboard!');
    }
  };

  const handleInterested = () => {
    if (!user) {
      setGatedContext({ action: 'ticket', event });
    } else {
      const next = !isInterested;
      setIsInterested(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`visitexpo_interested_${slug}`, String(next));
      }
      showToast(
        next
          ? 'Marked as Interested! Pass added to dashboard & attendee directory.'
          : 'Removed from your interested list.'
      );
    }
  };

  const handleToggleFollowExpo = () => {
    if (!user) {
      setGatedContext({ action: 'follow', event });
      return;
    }
    const next = !isFollowingExpo;
    setIsFollowingExpo(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`visitexpo_follow_expo_${slug}`, String(next));
    }
    showToast(
      next
        ? `You are now following ${event?.title}! Notifications enabled.`
        : `Unfollowed ${event?.title}.`
    );
  };

  const handleToggleFollowAttendee = (att) => {
    if (!user) {
      setGatedContext({ action: 'connect', event, attendee: att });
      return;
    }
    setFollowedAttendeeIds((prev) => {
      const updated = new Set(prev);
      const isFollowing = updated.has(att.id);
      if (isFollowing) {
        updated.delete(att.id);
        showToast(`Unfollowed ${att.name}`);
      } else {
        updated.add(att.id);
        showToast(`Now following ${att.name} (${att.company})`);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`visitexpo_followed_att_${slug}`, JSON.stringify(Array.from(updated)));
      }
      return updated;
    });
  };

  const handleConnectAttendee = (att) => {
    if (!user) {
      setGatedContext({ action: 'connect', event, attendee: att });
      return;
    }
    setConnectionModalUser(att);
    setConnectionNote(
      `Hi ${att.name}, I am also attending ${event?.title}. I would like to connect regarding ${
        att.objective || 'mutual B2B opportunities'
      }.`
    );
    setConnectionSent(false);
  };

  const handleSendConnectionNote = (e) => {
    e.preventDefault();
    setConnectionSent(true);
    setTimeout(() => {
      setConnectionModalUser(null);
      setConnectionSent(false);
      showToast(`Networking note sent to ${connectionModalUser?.name}!`);
    }, 1200);
  };

  const handleSave = () => {
    if (!user) {
      setGatedContext({ action: 'save', event });
    } else {
      setIsSaved(prev => !prev);
      showToast(isSaved ? 'Removed from saved events.' : 'Event saved to your Watchlist ♡');
    }
  };

  const handleRequestBooth = () => {
    router.push(`/onboarding/exhibitor?wp_slug=${encodeURIComponent(event?.slug || '')}&wp_post_id=${event?.wpPostId || event?.id || ''}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAuthSuccess = () => {
    setIsInterested(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`visitexpo_interested_${slug}`, 'true');
    }
    showToast(`Welcome! You are registered as Interested in ${event?.title}.`);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      showToast('Thank you! Your verified rating has been submitted.');
    }, 1500);
  };

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar solid={true} />
        <div className="flex items-center justify-center pt-32 pb-24">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 border-3 border-[#FF2E63] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">Loading exhibition details...</p>
          </div>
        </div>
      </div>
    );
  }

  const followersCount = (event?.followersCount || 1058) + (isFollowingExpo ? 1 : 0);
  const interestedCount = (event?.interestedCount || (event?.followersCount ? Math.floor(event.followersCount * 0.86) : 920)) + (isInterested ? 1 : 0);
  const ratingValue = event?.rating || '4.0';
  const reviewsCount = event?.reviewCount || 88;
  const editionLabel = event?.edition || '11th Edition';

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white pb-20">
      
      {/* Universal Navbar */}
      <Navbar solid={true} />

      {/* Main Container */}
      <main className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2">
          <Link href="/" className="hover:text-zinc-900 font-medium">Home</Link>
          <span>/</span>
          <Link href="/#events" className="hover:text-zinc-900 font-medium">Trade Shows</Link>
          <span>/</span>
          <span className="text-zinc-800 font-semibold truncate max-w-xs sm:max-w-md">{event?.title}</span>
        </div>

        {/* ========================================================================= */}
        {/* 1. FLOATING HERO / HEADER CARD (MATCHING 10TIMES SCREENSHOT 1)           */}
        {/* ========================================================================= */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs relative">
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            
            {/* Left Side: Logo & Main Meta */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              
              {/* Event Logo Box */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border border-zinc-200 bg-white p-2 shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
                <img
                  src={event?.image}
                  alt={event?.title}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </div>

              {/* Information Column */}
              <div className="space-y-2 min-w-0">
                
                {/* Badges & Actions Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {editionLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FF2E63] text-white">
                    Featured
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 ml-1 cursor-pointer"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>Add a review</span>
                  </button>
                </div>

                {/* Dates in Accent Red/Pink Color */}
                <div className="text-xs sm:text-sm font-bold text-[#FF2E63]">
                  {event?.dates || 'Upcoming 2026'}
                </div>

                {/* Event Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                  {event?.title}
                  <span className="inline-block ml-2 text-rose-500 text-base" title="Verified Trade Show">🛡️⭐</span>
                </h1>

                {/* Rating & Event Type */}
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                  <span className="font-extrabold text-amber-700 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {ratingValue} ({reviewsCount} Ratings)
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="font-semibold text-zinc-700">Trade Show</span>
                </div>

                {/* Location with "Show Interest to See Venue" link */}
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-zinc-800">
                    <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                    {event?.city}, {event?.country || 'India'}
                  </span>
                  {isInterested ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{event?.venue || `${event?.city} International Expo Center`}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInterested}
                      className="text-[11px] font-bold text-[#FF2E63] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    >
                      Show Interest to see venue
                    </button>
                  )}
                </div>

                {/* Followers / Attendees Avatar Stack (Clickable) */}
                <div
                  onClick={() => setShowAttendeesModal(true)}
                  className="pt-2 flex items-center gap-3 cursor-pointer group w-fit"
                  title="Click to view all interested attendees"
                >
                  <div className="flex -space-x-2 overflow-hidden">
                    {isInterested && (
                      <div
                        className="inline-flex h-7 w-7 rounded-full bg-emerald-600 text-white font-black text-[10px] items-center justify-center ring-2 ring-white z-10 shadow-xs"
                        title="You are marked as interested"
                      >
                        {user?.name?.charAt(0) || 'You'}
                      </div>
                    )}
                    {(attendees.length > 0
                      ? attendees.slice(0, isInterested ? 4 : 5)
                      : attendeeAvatars.map((src, i) => ({ avatar: src, id: i }))
                    ).map((att, idx) => (
                      <img
                        key={att.id || idx}
                        src={att.avatar || att}
                        alt="Attendee"
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover group-hover:scale-105 transition-transform"
                      />
                    ))}
                    <div className="h-7 w-7 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white group-hover:bg-[#FF2E63] transition-colors">
                      +
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-xs font-extrabold text-zinc-900 group-hover:text-[#FF2E63] transition-colors flex items-center gap-1.5">
                      <span>{interestedCount.toLocaleString()} Interested</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-600 font-semibold">{followersCount.toLocaleString()} Followers</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#FF2E63] group-hover:underline flex items-center gap-0.5">
                      View Attendee Directory &rarr;
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Side: Save / Share / Follow & CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-4 shrink-0">
              
              {/* Follow Expo, Save & Share Links */}
              <div className="flex items-center gap-3.5 sm:gap-4 text-xs font-semibold text-zinc-600 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleFollowExpo}
                  className={`inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isFollowingExpo
                      ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200'
                      : 'hover:text-zinc-900'
                  }`}
                  title={isFollowingExpo ? 'You are following this expo' : 'Follow expo for updates'}
                >
                  {isFollowingExpo ? (
                    <>
                      <BellRing className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      <span>Follow Expo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className={`inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer ${
                    isSaved ? 'text-[#FF2E63] font-bold' : ''
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#FF2E63]' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Main Action CTAs matching 10times design with our Yellow & Dark Slate */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleInterested}
                  className={`flex-1 sm:flex-none px-7 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                    isInterested
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 ring-1 ring-amber-400'
                  }`}
                >
                  {isInterested ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span>Interested ✓</span>
                    </>
                  ) : (
                    <span>Interested</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRequestBooth}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer text-center"
                >
                  Request a Booth
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. STICKY NAVIGATION TABS (MATCHING 10TIMES SCREENSHOT 1 & 2)             */}
        {/* ========================================================================= */}
        <div className="sticky top-16 sm:top-20 z-30 bg-white border border-zinc-200/90 rounded-xl px-4 sm:px-6 shadow-xs flex items-center justify-between">
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto text-xs sm:text-sm font-bold text-zinc-600 no-scrollbar">
            {[
              { id: 'about', label: 'About' },
              { id: 'attendees', label: `Attendees (${(attendees.length || 8) + (isInterested ? 1 : 0)})` },
              { id: 'feed', label: 'Feed' },
              { id: 'exhibitors', label: 'Exhibitors' },
              { id: 'speakers', label: 'Speakers' },
              { id: 'reviews', label: `${reviewsCount || 2} Reviews` },
              { id: 'deals', label: 'Deals' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#FF2E63] text-zinc-900 font-extrabold'
                    : 'border-transparent hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sticky Right CTA */}
          <div className="hidden md:flex items-center gap-3 py-2">
            <span className="text-xs font-bold text-zinc-800 truncate max-w-xs line-clamp-1">
              {event?.title}
            </span>
            <button
              onClick={handleInterested}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isInterested
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold'
              }`}
            >
              {isInterested ? 'Interested ✓' : 'Interested'}
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. TWO-COLUMN CONTENT GRID (MAIN CONTENT + 10TIMES SIDEBAR)               */}
        {/* ========================================================================= */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: ABOUT, GALLERY, HIGHLIGHTS, TAGS & STRUCTURED METADATA     */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeTab === 'attendees' ? (
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFCC00]/25 text-amber-950 border border-amber-300 flex items-center gap-1">
                        <Users className="h-3 w-3 text-amber-900" />
                        Live Network ({interestedCount.toLocaleString()})
                      </span>
                      <span className="text-xs text-zinc-500 font-semibold">
                        Verified B2B Attendees &amp; Followers
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                      Interested People &amp; Follower Directory
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Connect with trade buyers, exhibitors, and verified delegates attending {event?.title}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleInterested}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isInterested
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 ring-1 ring-amber-400'
                    }`}
                  >
                    {isInterested ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>You are Confirmed ✓</span>
                      </>
                    ) : (
                      <span>+ Mark Yourself Interested</span>
                    )}
                  </button>
                </div>

                {/* Confirmed user attendance banner */}
                {isInterested && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {user?.name?.charAt(0) || 'You'}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-emerald-900 flex items-center gap-1">
                          <span>You are registered as Interested!</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Your profile is featured to verified buyers and exhibitors attending this expo.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                      Confirmed
                    </span>
                  </div>
                )}

                {/* Search & Filter pills */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search attendees by name, company, city, or sourcing objective..."
                      value={attendeeSearch}
                      onChange={(e) => setAttendeeSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
                    {[
                      { id: 'all', label: `All Attendees (${attendees.length})` },
                      { id: 'Trade Buyer', label: 'Trade Buyers' },
                      { id: 'Exhibitor & Brand', label: 'Exhibitors & Brands' },
                      { id: 'VIP Delegate', label: 'VIP Delegates' },
                      { id: 'following', label: `Following (${followedAttendeeIds.size})` }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAttendeeFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                          attendeeFilter === tab.id
                            ? 'bg-zinc-900 text-white font-bold shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendee Cards List */}
                <div className="divide-y divide-zinc-100 space-y-3.5 pt-1">
                  {attendees
                    .filter((att) => {
                      if (attendeeFilter === 'following') {
                        if (!followedAttendeeIds.has(att.id)) return false;
                      } else if (attendeeFilter !== 'all') {
                        if (att.type !== attendeeFilter) return false;
                      }
                      if (attendeeSearch.trim()) {
                        const q = attendeeSearch.toLowerCase();
                        return (
                          att.name.toLowerCase().includes(q) ||
                          att.company.toLowerCase().includes(q) ||
                          att.designation.toLowerCase().includes(q) ||
                          att.city.toLowerCase().includes(q) ||
                          att.country.toLowerCase().includes(q) ||
                          att.objective.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((att) => {
                      const isFollowing = followedAttendeeIds.has(att.id);
                      return (
                        <div
                          key={att.id}
                          className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="relative h-11 w-11 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                              <img src={att.avatar} alt={att.name} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-zinc-900">{att.name}</span>
                                {att.verified && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" title="Verified Trade Profile" />
                                )}
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  att.type === 'Trade Buyer'
                                    ? 'bg-amber-100 text-amber-900'
                                    : att.type === 'VIP Delegate'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {att.type}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-zinc-700 truncate">{att.designation}</div>
                              <div className="flex items-center gap-2.5 text-[11px] text-zinc-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3 text-zinc-400" />
                                  <span>{att.company}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-[#FF2E63]" />
                                  <span>{att.city}, {att.country}</span>
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-600 italic pt-0.5">
                                "{att.objective}"
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleToggleFollowAttendee(att)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isFollowing
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs'
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span>+ Follow</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConnectAttendee(att)}
                              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                              title="Send B2B matchmaking note"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Bottom unlock note */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Want to connect with all 1,000+ trade buyers? Unlock direct contact details with your free pass.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleInterested}
                    className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 shrink-0 cursor-pointer"
                  >
                    Claim Badge
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* White Container for Core Info */}
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              
              {/* Media Gallery Carousel */}
              <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 group shadow-xs">
                <div className="relative h-72 sm:h-96 w-full overflow-hidden flex items-center justify-center bg-zinc-950">
                  {/* Ambient blurred backdrop */}
                  <img
                    src={mediaGallery[currentMediaIdx]?.url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110"
                  />
                  {/* Crisp centered poster/photo */}
                  <img
                    src={mediaGallery[currentMediaIdx]?.url}
                    alt={mediaGallery[currentMediaIdx]?.caption || 'Expo Media'}
                    className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain drop-shadow-md transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none z-10" />

                  {/* Video Play Overlay if video */}
                  {mediaGallery[currentMediaIdx]?.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="h-14 w-14 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg backdrop-blur-xs cursor-pointer hover:scale-108 transition-transform">
                        <Play className="h-6 w-6 fill-zinc-900 ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Caption & Counter */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold z-20">
                    <span className="drop-shadow">{mediaGallery[currentMediaIdx]?.caption}</span>
                    <span className="bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      {currentMediaIdx + 1} / {mediaGallery.length}
                    </span>
                  </div>

                  {/* Carousel Left/Right Buttons */}
                  <button
                    onClick={() =>
                      setCurrentMediaIdx((prev) => (prev === 0 ? mediaGallery.length - 1 : prev - 1))
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-zinc-900 shadow-md transition-all cursor-pointer z-20 hover:scale-105"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMediaIdx((prev) => (prev === mediaGallery.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-zinc-900 shadow-md transition-all cursor-pointer z-20 hover:scale-105"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Thumbnails Row */}
                <div className="grid grid-cols-4 gap-2 p-2.5 bg-zinc-900/60 border-t border-zinc-800">
                  {mediaGallery.map((med, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentMediaIdx(i)}
                      className={`relative h-14 sm:h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all bg-zinc-950 ${
                        currentMediaIdx === i ? 'border-[#FFCC00] scale-102 ring-1 ring-[#FFCC00]/50' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={med.url} alt="Thumb" className="w-full h-full object-cover" />
                      {med.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* About Description */}
              <div className="space-y-2 text-zinc-700 text-xs sm:text-sm leading-relaxed">
                <p>
                  {isReadMore
                    ? event?.description
                    : (event?.description?.slice(0, 310) || '') + '...'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsReadMore(!isReadMore)}
                  className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer inline-block"
                >
                  {isReadMore ? 'Show Less' : 'Read More'}
                </button>
              </div>

              {/* ============================================================= */}
              {/* HIGHLIGHTS BOX (WARM YELLOW/AMBER CONTAINER IN SCREENSHOT)     */}
              {/* ============================================================= */}
              <div className="bg-[#FFFBEB] border border-amber-200/90 rounded-xl p-5 space-y-3">
                <h3 className="font-extrabold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                  Highlights
                </h3>

                <ul className="space-y-2 text-xs text-amber-900 list-disc list-inside">
                  <li>
                    <strong className="font-bold">100,000+ On-site visits</strong> across 3 exhibition days.
                  </li>
                  <li>
                    <strong className="font-bold">100 onsite events</strong> offering a complex platform for exhibition, competition, conference, demo &amp; bazaar.
                  </li>
                  <li className="pt-1">
                    <span className="font-bold block mb-1">Popular among visitors for:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-[11px] font-bold text-amber-950 shadow-2xs">
                        Top 100 in {event?.category || 'Trade & Industry'} in {event?.country || event?.city || 'Global'}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-[11px] font-bold text-amber-950 shadow-2xs">
                        Quality of Participants &amp; Buyers
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* ============================================================= */}
              {/* WHO'S ATTENDING / INTERESTED ATTENDEES PREVIEW                */}
              {/* ============================================================= */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                        Interested Trade Attendees &amp; Followers
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-[#FF2E63] border border-rose-200">
                        {interestedCount.toLocaleString()} confirmed
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Connect with trade buyers and exhibitors registered for this edition.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAttendeesModal(true)}
                    className="text-xs font-extrabold text-[#FF2E63] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>View All ({interestedCount.toLocaleString()})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {(attendees.length > 0 ? attendees.slice(0, 4) : []).map((att) => {
                    const isFollowing = followedAttendeeIds.has(att.id);
                    return (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300 transition-all space-y-2.5 shadow-2xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                              <img src={att.avatar} alt={att.name} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-zinc-900 truncate flex items-center gap-1">
                                <span>{att.name}</span>
                                {att.verified && <ShieldCheck className="h-3 w-3 text-blue-600 shrink-0" />}
                              </div>
                              <div className="text-[11px] font-semibold text-zinc-700 truncate">{att.designation}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{att.company} • {att.city}</div>
                            </div>
                          </div>
                        </div>

                        {/* Objective */}
                        <div className="text-[10px] text-zinc-600 bg-white px-2 py-1 rounded border border-zinc-200/80 italic line-clamp-1">
                          "{att.objective}"
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            att.type === 'Trade Buyer'
                              ? 'bg-amber-100 text-amber-900'
                              : att.type === 'VIP Delegate'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {att.type}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleFollowAttendee(att)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                isFollowing
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                              }`}
                            >
                              {isFollowing ? 'Following ✓' : '+ Follow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConnectAttendee(att)}
                              className="p-1 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                              title="Connect note"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* "LISTED IN" HASHTAGS ROW (SCREENSHOT 2)                        */}
              {/* ============================================================= */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                  Listed In
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-900 flex items-center gap-1">
                    <Tag className="h-3 w-3 text-zinc-500" />
                    {event?.category || 'Trade Show'}
                  </span>
                  {listedInTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-600 font-medium hover:border-zinc-300 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Free for Students / Sponsor Ad Banner (Screenshot 2) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="font-bold text-sm text-zinc-900">Complimentary Pass for Trade Students &amp; Researchers</div>
                <p className="text-xs text-zinc-500">Access educational stages and student innovation demos free with institutional ID.</p>
              </div>
              <button
                type="button"
                onClick={handleInterested}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shrink-0 transition-colors"
              >
                Learn More &rarr;
              </button>
            </div>

            {/* Social Invite Bar: "You are heading to the event with 100k people!" */}
            <div className="bg-[#FFCC00] rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-amber-300">
              <div className="font-extrabold text-xs sm:text-sm text-zinc-950 text-center sm:text-left">
                You are heading to the event with 100k people! Who's coming with you?
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="px-5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* ============================================================= */}
            {/* STRUCTURED EVENT METADATA GRID (TIMINGS, ENTRY FEES, TURNOUT) */}
            {/* ============================================================= */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              
              <div className="grid sm:grid-cols-2 gap-6">
                
                {/* Timings */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Timings</span>
                  </div>
                  <div className="font-extrabold text-sm text-zinc-900">
                    {event?.timings || '9:00 AM – 5:00 PM (General Admission)'}
                  </div>
                  <p className="text-[11px] text-zinc-500">Subject to organizer confirmation</p>
                </div>

                {/* Entry Fees */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    <Ticket className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Entry Fees</span>
                  </div>
                  <div className="font-extrabold text-sm text-zinc-900">
                    Free Ticket <span className="font-normal text-xs text-zinc-500">For Industry Professionals</span>
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    Exhibit Booth Cost: <strong className="text-zinc-900">{event?.boothCost || 'Starts from 145 USD / sqm'}</strong>
                  </div>
                </div>

                {/* Estimated Turnout */}
                <div className="space-y-1 pt-4 sm:border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Estimated Turnout</span>
                  </div>
                  <div className="font-extrabold text-sm text-zinc-900">
                    {event?.turnout || '100,000+ Visitors • 2,000+ Exhibitors'}
                  </div>
                  <p className="text-[11px] text-zinc-500">Based on past verified edition statistics</p>
                </div>

                {/* Event Type */}
                <div className="space-y-1 pt-4 sm:border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    <Building className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Event Type &amp; Format</span>
                  </div>
                  <div className="font-extrabold text-sm text-zinc-900">
                    Trade Show, In-Person Exposition
                  </div>
                  <p className="text-[11px] text-zinc-500">B2B Trade Buyers &amp; Corporate Delegations</p>
                </div>

              </div>

            </div>

            {/* Exhibitor Preview & 10times Gated Directory */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
                    Featured Exhibitor Directory
                  </h3>
                  <p className="text-xs text-zinc-500">Explore participating companies, brands, and stall locations.</p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  250+ Stalls
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                {[
                  { name: 'Angel Yeast Co., Ltd.', hall: 'Hall A • Booth 104', cat: 'Ingredients & Fermentation' },
                  { name: 'Moffat Bakery Machinery', hall: 'Hall B • Booth 218', cat: 'Commercial Ovens & Tech' },
                  { name: 'Puratos Global Ingredients', hall: 'Hall A • Booth 302', cat: 'Confectionery & Bakery' }
                ].map((ex, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                    <div className="font-bold text-xs text-zinc-900 truncate">{ex.name}</div>
                    <div className="text-[10px] text-zinc-500">{ex.cat}</div>
                    <div className="text-[10px] font-bold text-[#FF2E63] pt-0.5">{ex.hall}</div>
                  </div>
                ))}
              </div>

              {/* Locked Gated Box */}
              <div className="p-5 rounded-xl border-2 border-dashed border-zinc-300 bg-gradient-to-b from-zinc-50 to-white text-center space-y-3">
                <div className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center mx-auto border border-zinc-200">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">
                    Unlock All 250+ Exhibitors &amp; Booth Rep Phone Numbers
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Access stall floorplans, downloadable product catalogs, and direct contact details with a free VisitExpo account.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleInterested}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-5 py-2.5 text-xs transition-colors cursor-pointer"
                  >
                    <span>Unlock Full Exhibitor Directory</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
            </>
          )}

          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: 10TIMES SIDEBAR CARDS (MATCHING USER SCREENSHOTS)         */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sidebar Card 1: Job Vacancies / Ads Widget (Image 1 & 2) */}
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3.5 text-xs font-extrabold flex items-center justify-between">
                <span>Available job vacancies — hiring now</span>
                <span className="text-[10px] font-normal opacity-80">Sponsored</span>
              </div>
              <div className="divide-y divide-zinc-100 text-xs">
                {[
                  'View urgent exhibition positions',
                  'Immediate start (this week)',
                  'Booth host & translator roles — no CV'
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-zinc-50 flex items-center justify-between cursor-pointer group">
                    <span className="font-semibold text-zinc-800 group-hover:text-blue-700">{item}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
              <div className="p-3.5 bg-zinc-50 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => showToast('Opening career portal...')}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View in minutes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Sidebar Card 2: Networking & Attendee Partner (Image 2) */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#FF2E63]">
                  Event Matchmaking
                </div>
                <h4 className="text-base font-extrabold text-zinc-900 leading-tight">
                  Don't go alone! {interestedCount.toLocaleString()} attendees are interested — find your event partner!
                </h4>
              </div>

              {/* Graphic Box */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-950 to-purple-950 text-white p-5 border border-indigo-900/60 space-y-3 shadow-inner">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-400/30">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-white">Where Your Buyers Going?</div>
                  <p className="text-[11px] text-zinc-300">Skip Hype. Only Real Demand &amp; Confirmed Attendees.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(true)}
                  className="w-full py-2.5 rounded-lg bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Explore Interested ({interestedCount.toLocaleString()})
                </button>
              </div>

              {/* Mini Preview of Top 2 Interested Attendees with Follow */}
              <div className="pt-1 space-y-2.5">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Recently Interested
                </div>
                {(attendees.length > 0 ? attendees.slice(0, 2) : []).map((att) => {
                  const isFollowing = followedAttendeeIds.has(att.id);
                  return (
                    <div key={att.id} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={att.avatar} alt={att.name} className="h-8 w-8 rounded-full object-cover shrink-0 border border-zinc-200" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 truncate">{att.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{att.company}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFollowAttendee(att)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          isFollowing
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        {isFollowing ? 'Following ✓' : '+ Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Card 3: Free Visitor Pass Guarantee */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-zinc-900">VisitExpo Official Pass Guarantee</h4>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Registered attendees receive a verified digital QR pass compatible with fast-track entry kiosks at {event?.city}.
              </p>
              <button
                type="button"
                onClick={handleInterested}
                className="w-full py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Claim Free Visitor Pass
              </button>
            </div>

            {/* Sidebar Card 4: Need Help Desk */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2.5">
              <div className="font-bold text-xs text-amber-950">Need Help with this Trade Show?</div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Connect with our concierge for bulk tickets, exhibitor stall pricing, or accommodation discounts.
              </p>
              <a
                href="mailto:contact@visitexpo.in"
                className="inline-block text-xs font-bold text-zinc-900 hover:underline pt-1"
              >
                Email Concierge &rarr;
              </a>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & TOASTS                                                        */}
      {/* ========================================================================= */}
      {/* Interested Attendees Modal */}
      <InterestedAttendeesModal
        isOpen={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        event={event}
        attendees={attendees}
        followedAttendeeIds={followedAttendeeIds}
        onToggleFollowAttendee={handleToggleFollowAttendee}
        isUserInterested={isInterested}
        currentUser={user}
        onTriggerGated={(action, attendee) => setGatedContext({ action, event, attendee })}
        onConnectAttendee={handleConnectAttendee}
      />

      {/* Connection Note Modal */}
      {connectionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={connectionModalUser.avatar}
                  alt={connectionModalUser.name}
                  className="h-11 w-11 rounded-full object-cover border border-zinc-200"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1">
                    <span>{connectionModalUser.name}</span>
                    {connectionModalUser.verified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500">{connectionModalUser.designation}</p>
                  <p className="text-[11px] font-semibold text-zinc-700">{connectionModalUser.company}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectionModalUser(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {connectionSent ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-900">Networking Note Sent!</p>
                <p className="text-[11px] text-zinc-500">{connectionModalUser.name} has been notified via their VisitExpo inbox.</p>
              </div>
            ) : (
              <form onSubmit={handleSendConnectionNote} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Personalized Message / B2B Matchmaking Note
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={connectionNote}
                    onChange={(e) => setConnectionNote(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    placeholder="Introduce yourself and specify products or cooperation you'd like to discuss..."
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConnectionModalUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <GatedAuthModal
        isOpen={Boolean(gatedContext)}
        onClose={() => setGatedContext(null)}
        context={gatedContext}
        onSuccess={handleAuthSuccess}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">
              Rate &amp; Review "{event?.title}"
            </h3>
            
            {reviewSubmitted ? (
              <div className="text-center py-6 text-emerald-600 font-bold text-xs space-y-1">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                <p>Review Submitted Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Feedback / Review</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Share your experience regarding exhibition stalls, crowd quality, or venue facilities..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
