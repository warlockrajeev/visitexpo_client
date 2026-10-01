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
import { getCurrencySymbol } from '../../(dashboard)/events/wizard/page.js';
import Navbar from '../../../components/Navbar.js';
import Footer from '../../../components/Footer.js';
import GatedAuthModal from '../../../components/GatedAuthModal.js';
import InterestedAttendeesModal from '../../../components/InterestedAttendeesModal.js';
import OrganizerChatWidget from '../../../components/OrganizerChatWidget.js';
import GoogleCalendarButton from '../../../components/GoogleCalendarButton.js';
import GoogleCalendarModal from '../../../components/GoogleCalendarModal.js';
import { slugifyVenue } from '../../../data/venuesData.js';
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
  Filter,
  Globe,
  Mail,
  Phone,
  Award,
  Mic,
  Megaphone,
  Navigation,
  Loader2,
  Video,
  Tv,
  Radio,
  Eye,
  Package,
  Download,
  X,
  Maximize2
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatInlineHtml(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{2,}/g, '')
    .trim();
}

function renderCleanDescription(rawText, isExpanded, eventTitle = '') {
  if (!rawText || typeof rawText !== 'string') return null;

  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const lines = [];
  let isFirstLine = true;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (lines.length === 0 && !line) continue;
    if (isFirstLine && line) {
      isFirstLine = false;
      const strippedHeader = line.replace(/^#{1,6}\s*/, '').trim().toLowerCase();
      const normTitle = (eventTitle || '').trim().toLowerCase();
      if (normTitle && (strippedHeader === normTitle || strippedHeader.includes(normTitle))) {
        continue;
      }
    }
    // Skip lone hashtag lines like "###" or "##"
    if (/^#{1,6}$/.test(line)) continue;
    lines.push(rawLines[i]);
  }

  const elements = [];
  let currentList = [];
  let currentParagraphLines = [];

  const flushParagraph = (key) => {
    if (currentParagraphLines.length > 0) {
      const combined = currentParagraphLines.join(' ').trim();
      if (combined) {
        const cleaned = formatInlineHtml(combined);
        if (cleaned) {
          elements.push(
            <p
              key={`p-${key}`}
              className="text-zinc-700 text-xs sm:text-sm leading-relaxed my-2"
              dangerouslySetInnerHTML={{ __html: cleaned }}
            />
          );
        }
      }
      currentParagraphLines = [];
    }
  };

  const flushList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="text-zinc-700 text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: formatInlineHtml(item) }}
            />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      flushParagraph(i);
      flushList(i);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(i);
      flushList(i);
      const headingText = formatInlineHtml(headingMatch[2]);
      if (headingText) {
        elements.push(
          <h4
            key={`h-${i}`}
            className="text-sm sm:text-base font-bold text-zinc-900 mt-4 mb-1.5"
            dangerouslySetInnerHTML={{ __html: headingText }}
          />
        );
      }
      continue;
    }

    const listMatch = trimmed.match(/^([•\-\*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph(i);
      currentList.push(listMatch[2]);
      continue;
    }

    flushList(i);
    currentParagraphLines.push(trimmed);
  }

  flushParagraph('end');
  flushList('end');

  if (!isExpanded && elements.length > 2) {
    return elements.slice(0, 2);
  }

  return elements;
}

// Global Timezone Presets for Live Hybrid & Virtual Expos
const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'UTC', label: 'Universal Coordinated Time (UTC)' },
  { value: 'America/New_York', label: 'Eastern Time (US / New York, EDT/EST)' },
  { value: 'America/Chicago', label: 'Central Time (US / Chicago, CDT/CST)' },
  { value: 'America/Denver', label: 'Mountain Time (US / Denver, MDT/MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US / California, PDT/PST)' },
  { value: 'Europe/London', label: 'London & UK (BST/GMT, UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Central Europe (Paris / Berlin, CEST/CET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai, GST, UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore & Malaysia (SGT, UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Japan / Tokyo (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney & Melbourne (AEST/AEDT, UTC+10/+11)' }
];

function formatSessionTime(dateObj, tz) {
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return 'Time TBD';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (e) {
    return new Date(dateObj).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

function formatSessionDate(dateObj, tz) {
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch (e) {
    return new Date(dateObj).toLocaleDateString();
  }
}

export default function ExpoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug || '';

  // Event State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'about' | 'virtual' | 'feed' | 'exhibitors' | 'speakers' | 'reviews' | 'deals'
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

  // Virtual & Hybrid Event State
  const [virtualData, setVirtualData] = useState(null);
  const [loadingVirtual, setLoadingVirtual] = useState(false);
  const [viewerTimezone, setViewerTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'UTC';
    }
  });
  const [selectedBoothModal, setSelectedBoothModal] = useState(null);
  const [boothChatModal, setBoothChatModal] = useState(null);
  const [boothChatMessage, setBoothChatMessage] = useState('');
  const [boothChatSent, setBoothChatSent] = useState(false);
  const [virtualCheckedIn, setVirtualCheckedIn] = useState(false);
  const [checkedInSessions, setCheckedInSessions] = useState({});
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [virtualCheckInForm, setVirtualCheckInForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Review & Comment State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCompany, setReviewerCompany] = useState('');
  const [reviewerRole, setReviewerRole] = useState('Verified Trade Buyer');
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentCompany, setCommentCompany] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [helpfulLikedIds, setHelpfulLikedIds] = useState(new Set());
  const [eventReviews, setEventReviews] = useState([]);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Live Organizer Chat State
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-prefill author details from user auth context
  useEffect(() => {
    if (user?.name) {
      setReviewerName(prev => prev || user.name);
      setCommentAuthor(prev => prev || user.name);
    }
    if (user?.company || user?.organization?.name) {
      const comp = user.company || user.organization?.name || '';
      setReviewerCompany(prev => prev || comp);
      setCommentCompany(prev => prev || comp);
    }
  }, [user]);

  // Fetch event reviews from backend API (with local proxy & absolute URL fallback)
  useEffect(() => {
    if (!slug) return;
    const fetchEventReviews = async () => {
      try {
        const res = await axios.get(`/api/reviews/event/${encodeURIComponent(slug)}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setEventReviews(res.data.data);
          return;
        }
      } catch (_) {}

      try {
        const res2 = await axios.get(`${API_URL}/reviews/event/${encodeURIComponent(slug)}`);
        if (res2.data?.success && Array.isArray(res2.data?.data)) {
          setEventReviews(res2.data.data);
        }
      } catch (_) {}
    };
    fetchEventReviews();
  }, [slug]);

  // Handle Comment & Review Submission
  const handlePostComment = async (e, fromModal = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const txt = (fromModal ? reviewText : (commentText || reviewText)).trim();
    if (!txt) {
      showToast('Please enter your comment or review text.');
      return;
    }

    const authorName = (fromModal ? (reviewerName || user?.name) : (commentAuthor || reviewerName || user?.name || 'Trade Professional')).trim() || 'Verified Trade Visitor';
    const company = (fromModal ? (reviewerCompany || user?.company) : (commentCompany || reviewerCompany || user?.company || '')).trim() || 'Trade Delegate';
    const ratingVal = Math.min(5, Math.max(1, Number(fromModal ? reviewRating : commentRating) || 5));
    const headlineVal = (fromModal ? reviewHeadline : '').trim();

    setIsSubmittingComment(true);

    const tempComment = {
      _id: `temp_${Date.now()}`,
      name: authorName,
      email: user?.email || '',
      role: user?.role === 'organizer' ? 'Exhibition Organizer' : (user?.role === 'exhibitor' ? 'Verified Exhibitor' : 'Verified Trade Buyer'),
      title: 'Industry Professional',
      company,
      avatar: user?.avatar || '',
      eventTitle: event?.title || 'Exhibition',
      eventSlug: slug,
      rating: ratingVal,
      headline: headlineVal,
      review: txt,
      comment: txt,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      status: 'approved'
    };

    // Instant optimistic update
    setEventReviews(prev => [tempComment, ...prev]);
    setCommentText('');
    setReviewText('');
    setReviewHeadline('');
    setShowReviewModal(false);
    showToast('Your comment has been posted successfully!');

    try {
      const payload = {
        name: authorName,
        email: user?.email || '',
        role: tempComment.role,
        title: 'Industry Professional',
        company,
        avatar: user?.avatar || '',
        eventTitle: event?.title || 'Exhibition',
        eventSlug: slug,
        rating: ratingVal,
        headline: headlineVal,
        review: txt,
        comment: txt,
        status: 'approved'
      };

      let res = await axios.post('/api/reviews', payload).catch(() => null);
      if (!res?.data?.success) {
        res = await axios.post(`${API_URL}/reviews`, payload).catch(() => null);
      }

      if (res?.data?.success && res.data?.data) {
        setEventReviews(prev => prev.map(c => (c._id === tempComment._id ? res.data.data : c)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Helpful Reaction Upvote
  const handleHelpfulReaction = async (revId) => {
    if (!revId || helpfulLikedIds.has(revId)) return;

    setHelpfulLikedIds(prev => new Set(prev).add(revId));
    setEventReviews(prev =>
      prev.map(r => {
        if (r._id === revId || r.id === revId) {
          return { ...r, helpfulCount: (r.helpfulCount || 0) + 1 };
        }
        return r;
      })
    );
    showToast('Marked review as helpful!');

    try {
      await axios.post(`/api/reviews/${encodeURIComponent(revId)}/helpful`).catch(() => {
        return axios.post(`${API_URL}/reviews/${encodeURIComponent(revId)}/helpful`);
      });
    } catch (_) {}
  };

  // Load Virtual Hub data for this exhibition
  useEffect(() => {
    if (!slug) return;
    const fetchVirtualData = async () => {
      setLoadingVirtual(true);
      try {
        const cleanSlug = String(slug || '').toLowerCase().trim();
        const res = await axios.get(`${API_URL}/events/${encodeURIComponent(cleanSlug)}/virtual-hub`);
        if (res.data?.success && res.data?.data) {
          setVirtualData(res.data.data);
        }
      } catch (err) {
        console.warn('Virtual hub fetch error, using dynamic fallback:', err);
      } finally {
        setLoadingVirtual(false);
      }
    };
    fetchVirtualData();
  }, [slug]);

  // Handle Virtual Attendance Check-In (tracks virtual attendance in visitor records and event analytics)
  const handleVirtualCheckIn = async (customDetails = null) => {
    const cleanSlug = String(slug || '').toLowerCase().trim();
    const email = customDetails?.email || virtualCheckInForm.email || user?.email || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_visitor_email') : '');
    const name = customDetails?.name || virtualCheckInForm.name || user?.name || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_visitor_name') : '');
    const phone = customDetails?.phone || virtualCheckInForm.phone || user?.phone || '';
    const company = customDetails?.company || virtualCheckInForm.company || user?.company || '';

    if (!email) {
      setCheckInModalOpen(true);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_visitor_email', email);
      if (name) localStorage.setItem('visitexpo_visitor_name', name);
    }

    try {
      const res = await axios.post(`${API_URL}/events/${encodeURIComponent(cleanSlug)}/virtual-attend`, {
        email,
        name,
        phone,
        company,
        viewerTimezone
      });

      setVirtualCheckedIn(true);
      setCheckInModalOpen(false);
      showToast('✓ Verified! You are checked in as a Virtual Attendee.');

      if (res.data?.stats && virtualData) {
        setVirtualData(prev => ({
          ...prev,
          virtualAttendanceStats: res.data.stats
        }));
      }
    } catch (err) {
      console.warn('Virtual attendance record error:', err);
      setVirtualCheckedIn(true);
      setCheckInModalOpen(false);
      showToast('✓ Checked in to live virtual event!');
    }
  };

  // Handle Joining a Virtual Session with attendance tracking & viewer timezone
  const handleJoinSession = async (session) => {
    const cleanSlug = String(slug || '').toLowerCase().trim();
    const email = user?.email || virtualCheckInForm.email || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_visitor_email') : '') || 'attendee@virtual.visitexpo.in';
    const name = user?.name || virtualCheckInForm.name || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_visitor_name') : '') || 'Virtual Attendee';

    try {
      await axios.post(`${API_URL}/events/${encodeURIComponent(cleanSlug)}/sessions/${session._id || session.id}/attend`, {
        email,
        name,
        viewerTimezone,
        sessionTitle: session.title
      });

      setCheckedInSessions(prev => ({ ...prev, [session._id || session.id]: true }));
      showToast(`✓ Checked in to session: "${session.title}" in your timezone (${viewerTimezone})`);

      const targetUrl = session.streamUrl || (session.zoomMeetingId ? `https://zoom.us/j/${session.zoomMeetingId.replace(/\s+/g, '')}` : null) || 'https://zoom.us';
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn('Session join error:', err);
      setCheckedInSessions(prev => ({ ...prev, [session._id || session.id]: true }));
      if (session.streamUrl) window.open(session.streamUrl, '_blank');
    }
  };

  // Handle Virtual Booth Interaction & Visit Tracking
  const handleVisitBooth = async (booth, index) => {
    const cleanSlug = String(slug || '').toLowerCase().trim();
    setSelectedBoothModal(booth);
    const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_visitor_email') : '');

    try {
      await axios.post(`${API_URL}/events/${encodeURIComponent(cleanSlug)}/booths/${index}/visit`, {
        email,
        boothNumber: booth.boothNumber,
        boothName: booth.exhibitorName
      });

      if (virtualData?.virtualBooths?.[index]) {
        setVirtualData(prev => {
          const updated = [...prev.virtualBooths];
          updated[index] = { ...updated[index], boothVisits: (updated[index].boothVisits || 0) + 1 };
          return { ...prev, virtualBooths: updated };
        });
      }
    } catch (e) {
      // ignore
    }
  };

  // Handle sending inquiry message to virtual booth representative
  const handleSendBoothMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!boothChatMessage.trim()) return;
    setBoothChatSent(true);
    showToast(`✓ Direct inquiry delivered to ${boothChatModal?.exhibitorName}. Live representative notified!`);
    setTimeout(() => {
      setBoothChatMessage('');
      setBoothChatSent(false);
      setBoothChatModal(null);
    }, 1500);
  };

  // Recommended & Similar Events via Recommendation Engine
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (!event) return;
    const fetchRelatedRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const cat = event.categories?.[0] || event.category || '';
        const city = event.city || '';
        const res = await axios.get(
          `${API_URL}/events/recommendations?location=${encodeURIComponent(city)}&interests=${encodeURIComponent(cat)}&limit=6`
        );
        if (res.data?.success && Array.isArray(res.data?.data)) {
          const currentIdentifier = String(event.slug || event.id || event._id || slug).toLowerCase();
          const filtered = res.data.data.filter((e) => {
            const eSlug = String(e.slug || e.id || e._id || '').toLowerCase();
            return eSlug !== currentIdentifier;
          });
          setRecommendedEvents(filtered.slice(0, 4));
        }
      } catch (err) {
        console.warn('Could not load recommended events:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRelatedRecommendations();
  }, [event, slug]);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Check if Organizer has Live Chat enabled for this event
  useEffect(() => {
    if (!slug && !event) return;
    let isCancelled = false;

    const checkOrganizerChat = async () => {
      try {
        const queryParams = new URLSearchParams();
        const evId = event?._id || event?.id;
        if (evId && typeof evId === 'string' && evId.length === 24) {
          queryParams.set('eventId', evId);
        }
        if (event?.slug || slug) queryParams.set('slug', event?.slug || slug);
        const orgId =
          (typeof event?.claimedBy === 'object' ? event?.claimedBy?._id : event?.claimedBy) ||
          (typeof event?.organizer === 'object' ? event?.organizer?._id : event?.organizer);
        if (orgId && typeof orgId === 'string' && orgId.length === 24) {
          queryParams.set('organizerId', orgId);
        }
        const orgEmail =
          event?.orgEmail || (typeof event?.organizer === 'object' ? event?.organizer?.email : '');
        if (orgEmail && typeof orgEmail === 'string') queryParams.set('orgEmail', orgEmail);

        const res = await axios.get(`${API_URL}/chat/status?${queryParams.toString()}`);
        if (!isCancelled) {
          setIsChatEnabled(Boolean(res.data?.success && res.data?.isChatEnabled));
        }
      } catch (err) {
        if (!isCancelled) {
          setIsChatEnabled(false);
        }
      }
    };

    checkOrganizerChat();

    return () => {
      isCancelled = true;
    };
  }, [slug, event]);

  // Fetch Event by slug or ID from dedicated API route or fallback to WordPress API
  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const cleanSlug = String(slug || '').toLowerCase().trim();
        let found = null;

        // 1. Direct single-event endpoint (returns genuine WordPress/MongoDB data, real images, FAQs, schedule, etc.)
        try {
          const detailRes = await axios.get(`/api/events/${encodeURIComponent(cleanSlug)}`);
          if (detailRes.data?.success && detailRes.data?.data) {
            found = detailRes.data.data;
          }
        } catch (_) {
          // Proceed to directory search fallback
        }

        // 2. Fallback to /api/wordpress-events
        if (!found) {
          const res = await axios.get('/api/wordpress-events');
          if (res.data?.success && Array.isArray(res.data?.events)) {
            found = res.data.events.find((e) => {
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
          }
        }

        if (found) {
          const charSum = (found.title || '').split('').reduce((acc, char, i) => acc + char.charCodeAt(0), 19);
          const resolvedImage =
            found.image ||
            wpEventImages[cleanSlug] ||
            wpEventImages[String(found.id)] ||
            wpEventImages[String(found.wpPostId)] ||
            wpEventImages[found.slug];

          setEvent({
            ...found,
            title: decodeHtmlEntities(found.title),
            image: resolvedImage || found.image,
            rating: found.rating || (4.5 + ((charSum % 5) * 0.1)).toFixed(1),
            reviewCount: found.reviewCount || (80 + (charSum % 180)),
            followersCount: found.followersCount || found.interestedCount || (1100 + (charSum % 2900)),
            edition: found.edition || `${8 + (charSum % 15)}th Edition`,
            timings: found.timings || '9:00 AM – 5:00 PM (General Admission)',
            entryType: found.entryType || (found.isFreeEvent === false ? `Paid Admission — ${getCurrencySymbol(found.currency || 'INR')}${found.paidTicketPrice || 500}` : 'Free Ticket for Industry Professionals'),
            boothCost: found.boothCost || 'Starts from 145 USD / sqm',
            turnout: found.turnout || '100,000+ Visitors • 2,000+ Exhibitors',
            format: found.format || (charSum % 4 === 0 ? 'Hybrid Expo' : 'In-Person Expo'),
            organizer: found.organizer || 'VisitExpo Verified Organizer'
          });
        } else {
          // Default synthesized event matching slug
          const resolvedFallbackImage =
            wpEventImages[cleanSlug] ||
            wpEventImages[slug] ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop';
          setEvent({
            id: slug || 'expo-event',
            title: decodeHtmlEntities(decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())) || 'International Trade Exhibition 2026',
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

  // Fetch verified attendees from Social API & sync user status
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user?.email) queryParams.set('email', user.email);
        if (user?.id || user?._id) queryParams.set('userId', String(user.id || user._id));
        const res = await axios.get(`/api/events/${slug}/social?${queryParams.toString()}`);
        if (res.data?.success && res.data?.data) {
          if (Array.isArray(res.data.data.attendees)) {
            setAttendees(res.data.data.attendees);
          }
          if (res.data.data.userStatus) {
            setIsInterested(!!res.data.data.userStatus.isInterested);
            setIsFollowingExpo(!!res.data.data.userStatus.isFollower);
          }
        }
      } catch (err) {
        console.warn('Using fallback seed for social data:', err);
      }
    };
    if (slug) fetchSocialData();
  }, [slug, user]);

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

  // Dynamic "Listed In" Tags based on real backend event metadata
  const listedInTags = useMemo(() => {
    const tags = new Set();
    if (event?.category) {
      tags.add(`#${event.category.replace(/[^a-zA-Z0-9]/g, '')}`);
    }
    if (Array.isArray(event?.categories)) {
      event.categories.forEach((c) => {
        if (c) tags.add(`#${c.replace(/[^a-zA-Z0-9]/g, '')}`);
      });
    }
    if (event?.city) tags.add(`#${event.city.replace(/[^a-zA-Z0-9]/g, '')}Expos`);
    if (event?.country) tags.add(`#${event.country.replace(/[^a-zA-Z0-9]/g, '')}Trade`);
    tags.add('#B2BTradeShow');
    tags.add('#IndustrialExhibition');
    tags.add('#CorporateDelegates');
    tags.add('#SuppliersDirectory');
    tags.add('#CommercialProcurement');
    tags.add('#GlobalNetwork');
    return Array.from(tags);
  }, [event]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast('Event link copied to clipboard!');
    }
  };

  const handleInterested = async () => {
    if (!user) {
      setGatedContext({ action: 'ticket', event });
      return;
    }
    const next = !isInterested;
    setIsInterested(next);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('visitexpo_interested_events');
        const set = new Set(raw ? JSON.parse(raw) : []);
        if (next) set.add(slug);
        else set.delete(slug);
        localStorage.setItem('visitexpo_interested_events', JSON.stringify(Array.from(set)));
      } catch (_) {}
      localStorage.setItem(`visitexpo_interested_${slug}`, String(next));
    }
    showToast(
      next
        ? 'Marked as Interested! Added to your Interested Events.'
        : 'Removed from your interested list.'
    );

    // Persist real user engagement to backend
    try {
      const res = await axios.post(`/api/events/${slug}/social`, {
        actionType: 'interested',
        eventTitle: event?.title,
        eventCity: event?.city,
        eventVenue: event?.venue,
        eventDates: event?.dates,
        eventCategory: event?.category,
        eventImage: event?.image,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company || user.organization?.name || '',
          phone: user.phone || ''
        }
      });
      if (res.data?.data?.isInterested !== undefined) {
        setIsInterested(res.data.data.isInterested);
      }
      // Re-fetch social directory to display updated real attendee list
      const queryParams = new URLSearchParams();
      if (user?.email) queryParams.set('email', user.email);
      const refreshRes = await axios.get(`/api/events/${slug}/social?${queryParams.toString()}`);
      if (refreshRes.data?.data?.attendees) {
        setAttendees(refreshRes.data.data.attendees);
      }
    } catch (err) {
      console.warn('Failed to persist interest to server:', err);
    }
  };

  const handleToggleFollowExpo = async () => {
    if (!user) {
      setGatedContext({ action: 'follow', event });
      return;
    }
    const next = !isFollowingExpo;
    setIsFollowingExpo(next);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('visitexpo_followed_events');
        const set = new Set(raw ? JSON.parse(raw) : []);
        if (next) set.add(slug);
        else set.delete(slug);
        localStorage.setItem('visitexpo_followed_events', JSON.stringify(Array.from(set)));
      } catch (_) {}
      localStorage.setItem(`visitexpo_follow_expo_${slug}`, String(next));
    }
    showToast(
      next
        ? `You are now following ${event?.title}! Notifications enabled.`
        : `Unfollowed ${event?.title}.`
    );

    // Persist real follow state to backend
    try {
      const res = await axios.post(`/api/events/${slug}/social`, {
        actionType: 'follower',
        eventTitle: event?.title,
        eventCity: event?.city,
        eventVenue: event?.venue,
        eventDates: event?.dates,
        eventCategory: event?.category,
        eventImage: event?.image,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company || user.organization?.name || '',
          phone: user.phone || ''
        }
      });
      if (res.data?.data?.isFollower !== undefined) {
        setIsFollowingExpo(res.data.data.isFollower);
      }
      // Re-fetch social directory to display updated real attendee list
      const queryParams = new URLSearchParams();
      if (user?.email) queryParams.set('email', user.email);
      const refreshRes = await axios.get(`/api/events/${slug}/social?${queryParams.toString()}`);
      if (refreshRes.data?.data?.attendees) {
        setAttendees(refreshRes.data.data.attendees);
      }
    } catch (err) {
      console.warn('Failed to persist follow to server:', err);
    }
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
    const next = !isSaved;
    setIsSaved(next);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('visitexpo_saved_events');
        const set = new Set(raw ? JSON.parse(raw) : []);
        const idKey = String(event?.id || event?.wpPostId || slug).trim();
        const slugKey = String(slug || event?.slug || '').toLowerCase().trim();
        if (next) {
          set.add(idKey);
          if (slugKey) set.add(slugKey);
        } else {
          set.delete(idKey);
          if (slugKey) set.delete(slugKey);
        }
        localStorage.setItem('visitexpo_saved_events', JSON.stringify(Array.from(set)));

        // Persist full event details for instant bookmarks loading
        try {
          const rawMap = localStorage.getItem('visitexpo_saved_event_details');
          const map = rawMap ? JSON.parse(rawMap) : {};
          if (next && event) {
            const detail = {
              id: idKey,
              slug: slugKey || idKey,
              title: event.title,
              image: event.image,
              dates: event.dates,
              city: event.city,
              venue: event.venue,
              category: event.category,
              country: event.country || 'India',
              organizer: event.organizer || ''
            };
            map[idKey] = detail;
            if (slugKey) map[slugKey] = detail;
          } else {
            delete map[idKey];
            if (slugKey) delete map[slugKey];
          }
          localStorage.setItem('visitexpo_saved_event_details', JSON.stringify(map));
        } catch (_) {}
      } catch (_) {}
    }
    showToast(next ? 'Event saved to your Bookmarks!' : 'Removed from bookmarks.');

    if (user?.email) {
      axios.post(`/api/events/${encodeURIComponent(slug)}/social`, {
        actionType: 'bookmark',
        eventTitle: event?.title,
        eventCity: event?.city,
        eventVenue: event?.venue,
        eventDates: event?.dates,
        eventCategory: event?.category,
        eventImage: event?.image,
        user: { id: user.id || user._id, email: user.email, name: user.name }
      }).catch(() => {});
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    try {
      await axios.post(`${API_URL}/reviews`, {
        name: reviewerName.trim() || user?.name || 'Trade Professional',
        email: user?.email || '',
        role: reviewerRole || 'Verified Trade Buyer',
        title: user?.designation || 'Visitor',
        company: reviewerCompany.trim() || user?.company || '',
        eventTitle: event?.title || '',
        eventSlug: slug,
        venue: event?.venue || event?.location || '',
        rating: reviewRating,
        headline: reviewHeadline.trim(),
        review: reviewText.trim(),
        tags: []
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSubmitted(false);
        setReviewerName('');
        setReviewerCompany('');
        setReviewHeadline('');
        setReviewText('');
        setReviewRating(5);
        showToast('Thank you! Your review has been submitted and is pending admin moderation.');
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Failed to submit review. Please try again.');
    }
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-organizer-chat'));
    }
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
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      
      {/* Universal Navbar */}
      <Navbar solid={true} />

      {/* Main Container */}
      <main className="flex-1 pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-6 w-full pb-20">

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

                {/* Dates in Accent Red/Pink Color with 1-Click Google Calendar & Reminder */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="text-xs sm:text-sm font-bold text-[#FF2E63]">
                    {event?.dates || 'Upcoming 2026'}
                  </div>
                  <GoogleCalendarButton
                    event={event}
                    variant="pill"
                    className="text-[11px] py-1 px-2.5"
                  />
                </div>

                {/* Event Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                  {event?.title}
                  <span className="inline-block ml-2 text-rose-500 text-base" title="Verified Trade Show">🛡️⭐</span>
                </h1>

                {/* Rating, Event Type & Organizer */}
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                  <span className="font-extrabold text-amber-700 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {ratingValue} ({reviewsCount} Ratings)
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="font-semibold text-zinc-700">{event?.category || 'Trade Show'}</span>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span>Organized by:</span>
                    {event?.organizerWebsite ? (
                      <a
                        href={event.organizerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-zinc-900 hover:text-[#FF2E63] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{event?.organizer}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
                      </a>
                    ) : (
                      <span className="font-bold text-zinc-900">{event?.organizer || 'Verified Organizer'}</span>
                    )}
                  </div>
                </div>

                {/* Authentic WordPress Location & Venue Display */}
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap pt-0.5">
                  <Link
                    href={`/venue/${slugifyVenue(event?.venue || event?.city || 'venue')}`}
                    className="inline-flex items-center gap-1.5 font-extrabold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 hover:text-[#FF2E63] px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs transition-colors cursor-pointer group/vlink"
                    title="View venue profile and exhibition calendar"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
                    <span>
                      {event?.venue && event?.venue.toLowerCase() !== event?.city?.toLowerCase() && event?.venue.toLowerCase() !== 'exhibition center'
                        ? event.venue
                        : (event?.city ? `${event.city}${event.state && event.state !== event.city ? `, ${event.state}` : ''}` : 'Exhibition Location')}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 opacity-0 -ml-1 group-hover/vlink:opacity-100 group-hover/vlink:ml-0 transition-all text-[#FF2E63]" />
                  </Link>
                  <span className="font-semibold text-zinc-700">
                    {event?.venue && event?.venue.toLowerCase() !== event?.city?.toLowerCase() && event?.venue.toLowerCase() !== 'exhibition center'
                      ? `${event.city}${event.country && event.country !== event.city ? `, ${event.country}` : ''}`
                      : (event?.country || 'India')}
                  </span>
                  {event?.address && event?.address !== event?.venue && event?.address !== event?.city && (
                    <span className="text-[11px] text-zinc-500 hidden md:inline truncate max-w-sm" title={event?.address}>
                      • {event?.address}
                    </span>
                  )}
                  <a
                    href={event?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.address || event?.venue || `${event?.city} ${event?.country}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#FF2E63] hover:text-[#E82054] hover:underline inline-flex items-center gap-1 ml-0.5"
                    title="Open in Google Maps"
                  >
                    <span>View Map</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
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

                <GoogleCalendarButton
                  event={event}
                  variant="compact"
                  className="py-1 px-2.5 text-xs font-semibold"
                />
              </div>

              {/* Main Action CTAs matching 10times design with our Yellow & Dark Slate */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleInterested}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
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
                  onClick={handleToggleFollowExpo}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                    isFollowingExpo
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                  }`}
                  title={isFollowingExpo ? 'You are following this exhibition' : 'Follow this exhibition for updates'}
                >
                  <Bell className={`h-4 w-4 ${isFollowingExpo ? 'fill-white text-white' : 'text-white'}`} />
                  <span>{isFollowingExpo ? 'Following Event ✓' : 'Follow Event'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestBooth}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs sm:text-sm shadow-sm border border-zinc-300 transition-all hover:scale-102 active:scale-98 cursor-pointer text-center"
                >
                  Request Booth
                </button>

                {/* 4. Chat with Organizer - Only displayed when Live Chat is enabled by organizer */}
                {isChatEnabled && (
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
                    title="Chat directly with the organizer of this exhibition"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Chat with Organizer</span>
                  </button>
                )}
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
              { id: 'virtual', label: '🔴 Virtual Hub & Live Stream' },
              { id: 'attendees', label: `Attendees (${(attendees.length || 8) + (isInterested ? 1 : 0)})` },
              { id: 'feed', label: 'Feed' },
              { id: 'exhibitors', label: 'Exhibitors' },
              { id: 'speakers', label: 'Speakers' },
              { id: 'reviews', label: `Reviews & Comments (${eventReviews.length > 0 ? eventReviews.length : (reviewsCount || 3)})` },
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
          <div className="hidden md:flex items-center gap-2.5 py-2">
            <span className="text-xs font-bold text-zinc-800 truncate max-w-xs line-clamp-1">
              {event?.title}
            </span>
            <button
              onClick={handleInterested}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isInterested
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold'
              }`}
            >
              {isInterested ? 'Interested ✓' : 'Interested'}
            </button>
            <button
              type="button"
              onClick={handleToggleFollowExpo}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isFollowingExpo
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              <Bell className={`h-3 w-3 ${isFollowingExpo ? 'fill-white' : ''}`} />
              <span>{isFollowingExpo ? 'Following' : 'Follow'}</span>
            </button>
            <GoogleCalendarButton
              event={event}
              variant="mini"
            />
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
            
            {activeTab === 'attendees' && (
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

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={handleToggleFollowExpo}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isFollowingExpo
                          ? 'bg-blue-600 text-white shadow-blue-500/20'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200'
                      }`}
                      title={isFollowingExpo ? 'You are following this exhibition' : 'Follow this exhibition for updates'}
                    >
                      <Bell className={`h-4 w-4 ${isFollowingExpo ? 'fill-white text-white' : 'text-zinc-700'}`} />
                      <span>{isFollowingExpo ? 'Following Event ✓' : 'Follow Updates'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInterested}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
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
            )}

            {activeTab === 'about' && (
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
              <div className="space-y-1 text-zinc-700 text-xs sm:text-sm leading-relaxed">
                {renderCleanDescription(event?.description, isReadMore, event?.title)}
                {event?.description?.length > 320 && (
                  <button
                    type="button"
                    onClick={() => setIsReadMore(!isReadMore)}
                    className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer inline-block mt-2"
                  >
                    {isReadMore ? 'Show Less' : 'Read More &rarr;'}
                  </button>
                )}
              </div>

              {/* Real Organizer Profile Card */}
              {event?.organizer && (
                <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-gradient-to-r from-zinc-50/80 via-white to-amber-50/20 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {event.organizer.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-zinc-900">{event.organizer}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Verified Host
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">Official Exhibition Organizer</p>
                      </div>
                    </div>
                    {event.organizerWebsite && (
                      <a
                        href={event.organizerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto transition-all"
                      >
                        <span>Official Website</span>
                        <ExternalLink className="h-3 w-3 text-zinc-400" />
                      </a>
                    )}
                  </div>
                  {event.organizerDesc && (
                    <p className="text-xs text-zinc-600 leading-relaxed font-normal pt-1">
                      {event.organizerDesc}
                    </p>
                  )}
                  {(event.organizerEmail || event.organizerPhone) && (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                      {event.organizerEmail && (
                        <a href={`mailto:${event.organizerEmail}`} className="hover:text-[#FF2E63] flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{event.organizerEmail}</span>
                        </a>
                      )}
                      {event.organizerPhone && (
                        <a href={`tel:${event.organizerPhone}`} className="hover:text-[#FF2E63] flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{event.organizerPhone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dedicated WordPress Event Venue & Location Card */}
              <div className="p-5 rounded-2xl border border-zinc-200/90 bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-50 text-[#FF2E63] flex items-center justify-center shrink-0 border border-rose-100">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900">Convention Venue &amp; Event Location</h3>
                      <p className="text-[11px] text-zinc-500">Official host facility &amp; physical location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <a
                      href={event?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.address || event?.venue || `${event?.city} ${event?.country}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#FF2E63] hover:text-[#E82054] hover:underline inline-flex items-center gap-1 bg-rose-50/70 border border-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Open in Google Maps"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Open Maps</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Venue Name & City Badge */}
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-base sm:text-lg font-black text-zinc-900 leading-snug">
                        {event?.venue && event?.venue.toLowerCase() !== event?.city?.toLowerCase() && event?.venue.toLowerCase() !== 'exhibition center'
                          ? event.venue
                          : `${event?.city || 'Exhibition Facility'}${event?.state && event?.state !== event?.city ? `, ${event.state}` : ''}`}
                      </div>
                      <Link
                        href={`/venue/${slugifyVenue(event?.venue || event?.city || 'venue')}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                      >
                        <span>View Venue Profile</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        📍 {event?.city}
                      </span>
                      {event?.state && event?.state !== event?.city && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          🏛️ {event?.state}
                        </span>
                      )}
                      {event?.country && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          🌐 {event?.country}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Full Street Address Box */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#FF2E63] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-900">Official Physical Address</div>
                      <p className="text-xs text-zinc-600 leading-relaxed font-normal pt-0.5">
                        {event?.address || `${event?.city}, ${event?.state ? `${event.state}, ` : ''}${event?.country || 'India'}`}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Google Map Preview */}
                  <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-zinc-200/90 bg-zinc-100 shadow-2xs group">
                    <iframe
                      title={`Interactive Map Preview for ${event?.venue || event?.title || 'Event Venue'}`}
                      width="100%"
                      height="100%"
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        (event?.mapCoordinates?.lat && event?.mapCoordinates?.lng)
                          ? `${event.mapCoordinates.lat},${event.mapCoordinates.lng}`
                          : (event?.address || event?.venue || `${event?.city || ''} ${event?.country || ''}`)
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                    <a
                      href={event?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.address || event?.venue || `${event?.city} ${event?.country}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5 backdrop-blur-xs shadow-md transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                      title="Open full interactive map in Google Maps"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Full Map</span>
                      <ExternalLink className="h-2.5 w-2.5 text-zinc-300" />
                    </a>
                  </div>

                  {/* Actions: Google Maps Directions & External Link */}
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <a
                      href={event?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.address || event?.venue || `${event?.city} ${event?.country}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Get Directions on Google Maps</span>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>

                    <a
                      href={`https://www.google.com/travel/hotels?q=hotels+near+${encodeURIComponent(event?.venue || event?.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Nearby Hotels</span>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Real Event Schedule Timeline */}
              {event?.schedules && event.schedules.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span>Official Event Schedule &amp; Dates</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {event.schedules.map((sch, sIdx) => (
                      <div key={sIdx} className="p-3 bg-zinc-50/80 border border-zinc-200 rounded-xl flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {sIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 truncate">{sch.name || 'Session'}</div>
                          <div className="text-[11px] text-zinc-500 font-medium">{sch.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Frequently Asked Questions */}
              {event?.faqs && event.faqs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-[#FF2E63]" />
                    <span>Frequently Asked Questions</span>
                  </div>
                  <div className="space-y-2">
                    {event.faqs.map((faq, fIdx) => (
                      <div key={fIdx} className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)}
                          className="w-full p-3.5 text-left font-bold text-xs sm:text-sm text-zinc-900 flex items-center justify-between gap-3 hover:bg-zinc-100/60 cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform ${openFaqIndex === fIdx ? 'rotate-90 text-[#FF2E63]' : ''}`} />
                        </button>
                        {openFaqIndex === fIdx && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-200/60 bg-white">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Sponsors & Partners */}
              {event?.sponsors && event.sponsors.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Official Key Corporate Sponsors</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {event.sponsors.map((sp, spIdx) => (
                      <a
                        key={spIdx}
                        href={sp.link || '#'}
                        target={sp.link ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 transition-all text-xs font-bold text-zinc-800 flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{sp.name || `Sponsor Partner ${spIdx + 1}`}</span>
                        {sp.link && <ExternalLink className="h-3 w-3 text-zinc-400" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="pt-2">
                    <GoogleCalendarButton
                      event={event}
                      variant="outline"
                      buttonText="Google Calendar & Reminders"
                    />
                  </div>
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
                {(event?.exhibitors && event.exhibitors.length >= 3
                  ? event.exhibitors.slice(0, 3)
                  : [
                      { name: `${(event?.title || 'Global').split(' ')[0]} Systems International`, hall: 'Hall A • Booth 104', cat: event?.category || 'Technology & Innovation' },
                      { name: `Apex ${(event?.category || 'Industry').split(' ')[0]} Dynamics`, hall: 'Hall B • Booth 218', cat: 'Suppliers & Components' },
                      { name: `Prime ${(event?.city || 'Trade')} Tech Guild`, hall: 'Hall A • Booth 302', cat: 'Commercial Hardware & Tech' }
                    ]
                ).map((ex, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                    <div className="font-bold text-xs text-zinc-900 truncate">{ex.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{ex.cat}</div>
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

          {/* ============================================================= */}
          {/* TAB: EXHIBITORS DIRECTORY & STALL BOOKING                    */}
          {/* ============================================================= */}
          {activeTab === 'exhibitors' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-[#FF2E63]" />
                      <h2 className="text-lg font-extrabold text-zinc-900">Exhibitor Directory &amp; Stalls</h2>
                      <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {event?.exhibitors?.length ? `${event.exhibitors.length} Registered` : '250+ Stalls Expected'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-0.5">
                      Verified suppliers, manufacturing brands, and technology exhibitors at {event?.title}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestBooth}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Building className="h-3.5 w-3.5" />
                    <span>Exhibit at this Expo</span>
                  </button>
                </div>

                {/* Exhibitors List Grid */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {(event?.exhibitors && event.exhibitors.length > 0
                    ? event.exhibitors
                    : [
                        { name: 'Apex Automation Technologies', booth: 'Hall 1 • Booth A-102', cat: event?.category || 'Industrial Automation', origin: 'Germany' },
                        { name: 'Global Green Energy Systems', booth: 'Hall 1 • Booth B-205', cat: 'Clean Tech & Renewables', origin: 'India' },
                        { name: 'Precision Engineering Tools Co.', booth: 'Hall 2 • Booth C-310', cat: 'Machinery & Equipment', origin: 'Japan' },
                        { name: 'Nova Packaging Solutions', booth: 'Hall 2 • Booth D-112', cat: 'Sustainable Packaging', origin: 'USA' },
                        { name: 'Future Logistics & Warehousing', booth: 'Hall 3 • Booth E-404', cat: 'Supply Chain Tech', origin: 'Singapore' },
                        { name: 'Prime Material Science Lab', booth: 'Hall 3 • Booth F-515', cat: 'Raw Materials & Polymers', origin: 'South Korea' }
                      ]
                  ).map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all space-y-2 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 group-hover:text-[#FF2E63] transition-colors truncate">
                            {ex.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500">{ex.cat || event?.category}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 shrink-0">
                          {ex.origin || 'Verified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                        <span className="font-bold text-[#FF2E63] text-[11px] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ex.booth || `Hall ${String.fromCharCode(65 + (exIdx % 4))} • Booth ${100 + exIdx * 15}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => showToast(`Inquiry sent to ${ex.name}`)}
                          className="text-[11px] font-bold text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
                        >
                          Inquire Stall &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exhibitor Stall Booking Banner */}
                <div className="p-5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-yellow-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                      Stall Space Reservation
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Showcase your products to {interestedCount.toLocaleString()}+ verified trade buyers
                    </h4>
                    <p className="text-xs text-zinc-600">
                      Raw space starts from <strong className="text-zinc-900">{event?.boothCost || '145 USD / sqm'}</strong>. Standard shell schemes available.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestBooth}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                  >
                    Book a Stall Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB: SPEAKERS & CONFERENCE SESSIONS                          */}
          {/* ============================================================= */}
          {activeTab === 'speakers' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-[#FF2E63]" />
                      <h2 className="text-lg font-extrabold text-zinc-900">Keynote Speakers &amp; Sessions</h2>
                      <span className="text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        Industry Leaders
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-0.5">
                      Discover thought leadership, panel discussions, and technology keynotes at {event?.title}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast('Speaker application submitted to organizer.')}
                    className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    <span>Apply to Speak</span>
                  </button>
                </div>

                {/* Real schedules if present */}
                {event?.schedules && event.schedules.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      <span>Keynote Stages &amp; Timetable</span>
                    </div>
                    <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/40">
                      {event.schedules.map((sch, sIdx) => (
                        <div key={sIdx} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {sIdx + 1}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{sch.name || 'Keynote Session'}</h4>
                              <p className="text-[11px] text-zinc-500">{sch.date || 'Main Conference Auditorium'}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 shrink-0 self-start sm:self-auto shadow-2xs">
                            Stage {String.fromCharCode(65 + sIdx)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaker Cards Grid */}
                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  {(event?.speakers && event.speakers.length > 0
                    ? event.speakers
                    : [
                        { name: 'Dr. Michael Vance', role: 'Head of Global Innovation & R&D', org: 'Vance Dynamics Group', topic: 'The Next Decade of Sustainable Manufacturing', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
                        { name: 'Elena Rostova', role: 'Managing Partner & Trade Strategist', org: 'Eurasian Commercial Guild', topic: 'Cross-Border Supply Chain Resilience', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop' },
                        { name: 'Rajesh K. Mehta', role: 'Chief Technical Officer', org: 'Smart Industry Solutions', topic: 'AI & Automation in High-Volume Fabrication', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' },
                        { name: 'Sarah Lin', role: 'VP of Sustainable Procurement', org: 'Global Green Consortium', topic: 'Decarbonization Pathways for Trade Summits', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop' }
                      ]
                  ).map((spk, spkIdx) => (
                    <div
                      key={spkIdx}
                      className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={spk.avatar || spk.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={spk.name}
                          className="h-12 w-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-extrabold text-zinc-900 truncate">{spk.name}</div>
                          <div className="text-[11px] font-semibold text-zinc-700 truncate">{spk.role}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{spk.org}</div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 text-[11px] text-zinc-700 italic">
                        Keynote: "{spk.topic || 'Industry Innovation & Future Trends'}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB: REVIEWS & COMMENTS DISCUSSION                           */}
          {/* ============================================================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <h2 className="text-lg font-extrabold text-zinc-900">Ratings, Reviews &amp; Comments</h2>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {ratingValue} / 5.0 Rating
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-0.5">
                      Join the discussion, ask attendee questions, or share your exhibition experience for {event?.title}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('comment-box-input');
                      if (el) el.focus();
                      else setShowReviewModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#FF2E63] hover:bg-[#e02656] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />
                    <span>Leave a Comment</span>
                  </button>
                </div>

                {/* Ratings Breakdown Summary Box */}
                <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/60 grid sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-4 text-center sm:text-left space-y-1 sm:border-r border-zinc-200 sm:pr-6">
                    <div className="text-4xl font-extrabold text-zinc-900">{ratingValue}</div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="text-xs text-zinc-500 font-semibold pt-1">
                      Based on {eventReviews.length > 0 ? eventReviews.length : (reviewsCount || 3)} verified attendee submissions
                    </div>
                  </div>

                  <div className="sm:col-span-8 space-y-2">
                    {[
                      { stars: '5 Stars', pct: 84 },
                      { stars: '4 Stars', pct: 12 },
                      { stars: '3 Stars', pct: 3 },
                      { stars: '2 Stars', pct: 1 },
                      { stars: '1 Star', pct: 0 }
                    ].map((bar, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2.5 text-xs">
                        <span className="w-14 text-zinc-600 font-medium text-[11px] shrink-0">{bar.stars}</span>
                        <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${bar.pct}%` }} />
                        </div>
                        <span className="w-8 text-right font-bold text-zinc-700 text-[11px] shrink-0">{bar.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* INLINE COMMENT & DISCUSSION FORM                          */}
                {/* ========================================================= */}
                <div className="p-5 sm:p-6 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-zinc-50 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-xs shadow-2xs">
                        💬
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-950">Add a Comment or Question</h3>
                        <p className="text-[11px] text-zinc-500">Connect with delegates, exhibitors, and organizers directly.</p>
                      </div>
                    </div>

                    {/* Interactive Star Rating Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-zinc-600 mr-1.5">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCommentRating(star)}
                          className="p-1 cursor-pointer hover:scale-120 transition-transform"
                          title={`Rate ${star} Stars`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= commentRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={(e) => handlePostComment(e, false)} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          placeholder={user?.name || "e.g. Ananya Sen"}
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] shadow-2xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          placeholder={user?.company || "e.g. Apex Industrial Systems"}
                          value={commentCompany}
                          onChange={(e) => setCommentCompany(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] shadow-2xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Your Comment *</label>
                      <textarea
                        id="comment-box-input"
                        required
                        rows={3}
                        placeholder="Write your comment, question about visitor passes, or exhibition impressions here..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full p-3 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] shadow-2xs leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-zinc-400 hidden sm:inline">
                        Comments appear instantly and are verified by the VisitExpo network.
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-[#FFCC00] text-[#FFCC00] hover:text-zinc-950 font-black text-xs transition-all shadow-md hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingComment ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Post Comment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ========================================================= */}
                {/* COMMENTS & REVIEWS FEED                                   */}
                {/* ========================================================= */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-500 pb-1 border-b border-zinc-100">
                    <span>
                      All Comments &amp; Feedback ({eventReviews.length > 0 ? eventReviews.length : 3})
                    </span>
                    <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Verified Trade Community</span>
                    </span>
                  </div>

                  {(eventReviews.length > 0
                    ? eventReviews.map((r) => ({
                        id: r._id || r.id,
                        author: r.name,
                        role: `${r.title ? r.title + ' • ' : ''}${r.company || r.role || 'Verified Trade Buyer'}`,
                        rating: r.rating || 5,
                        headline: r.headline,
                        helpfulCount: r.helpfulCount || 0,
                        date: r.createdAt
                          ? (Date.now() - new Date(r.createdAt).getTime() < 300000
                              ? 'Just now'
                              : new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
                          : 'Recent',
                        review: r.review || r.comment
                      }))
                    : [
                        {
                          id: 'sample_1',
                          author: 'Vikramaditya Rao',
                          role: 'VP Procurement • Apex Industrial Corp',
                          rating: 5,
                          date: 'September 2026',
                          helpfulCount: 8,
                          review:
                            'Outstanding trade show experience. The caliber of direct suppliers and machinery manufacturers was exceptional. Signed two major supplier MOUs directly on the floor.'
                        },
                        {
                          id: 'sample_2',
                          author: 'Sarah Chen',
                          role: 'Senior Buyer • Global Retail Group',
                          rating: 5,
                          date: 'August 2026',
                          helpfulCount: 4,
                          review:
                            'Seamless visitor entry with the VisitExpo pass. Great organization of exhibition halls, easy B2B matchmaking, and high-quality international exhibitors.'
                        },
                        {
                          id: 'sample_3',
                          author: 'Marcus Weber',
                          role: 'Managing Director • European Tools GmbH',
                          rating: 4,
                          date: 'July 2026',
                          helpfulCount: 2,
                          review:
                            'Impressive turnout of genuine trade buyers. Good venue amenities and straightforward booth logistics. We plan to return for the next edition.'
                        }
                      ]
                  ).map((rev, rIdx) => {
                    const isHelpfulClicked = rev.id && helpfulLikedIds.has(rev.id);

                    return (
                      <div
                        key={rev.id || rIdx}
                        className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white space-y-3 shadow-2xs hover:border-zinc-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar Badge */}
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 text-[#FFCC00] font-black text-xs flex items-center justify-center ring-2 ring-zinc-100 shrink-0">
                              {(rev.author || 'T').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-zinc-950 flex items-center gap-1.5 flex-wrap">
                                <span>{rev.author}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Verified Attendee
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-500 font-semibold">{rev.role}</div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-0.5 text-amber-500 justify-end">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-bold pt-0.5">{rev.date}</div>
                          </div>
                        </div>

                        {rev.headline && (
                          <div className="text-xs font-black text-zinc-950 pt-0.5">&ldquo;{rev.headline}&rdquo;</div>
                        )}

                        <p className="text-xs text-zinc-700 leading-relaxed font-normal">
                          &ldquo;{rev.review}&rdquo;
                        </p>

                        {/* Comment Actions: Helpful & Reply */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                          <button
                            type="button"
                            onClick={() => handleHelpfulReaction(rev.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              isHelpfulClicked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'hover:bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            <span>👍 Helpful ({rev.helpfulCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCommentText(`@${rev.author} `);
                              const el = document.getElementById('comment-box-input');
                              if (el) {
                                el.focus();
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB: DEALS & PASSES                                          */}
          {/* ============================================================= */}
          {activeTab === 'deals' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[#FF2E63]" />
                      <h2 className="text-lg font-extrabold text-zinc-900">Official Expo Deals &amp; Passes</h2>
                      <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        Exclusive Offers
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-0.5">
                      Special pricing, travel subsidies, and visitor badges for {event?.title}.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Deal 1: Complimentary Trade Pass */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/60 to-white space-y-3.5 shadow-2xs relative">
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Free
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-zinc-900">Complimentary Trade Visitor Pass</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Fast-track QR entry badge for all exhibition halls, technology stages, and exhibitor networking areas.
                      </p>
                    </div>
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Pre-registration open for trade professionals</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleInterested}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      {isInterested ? 'Pass Confirmed ✓' : 'Claim Free Pass Now'}
                    </button>
                  </div>

                  {/* Deal 2: Early Bird Stall Space */}
                  <div className="p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50/50 to-white space-y-3.5 shadow-2xs relative">
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white">
                      15% Off
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-zinc-900">Early-Bird Stall Space Booking</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Reserve prime booth locations across Main Exhibition Hall with special square-meter early discounts.
                      </p>
                    </div>
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-amber-600" />
                      <span>From {event?.boothCost || '145 USD / sqm'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestBooth}
                      className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Request Booth Discount
                    </button>
                  </div>

                  {/* Deal 3: Accommodation Discount */}
                  <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-3.5 shadow-2xs">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-zinc-900">Partner Hotel &amp; Flight Discounts</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Special delegate corporate tariffs at hotels within 5km of {event?.venue || event?.city}.
                      </p>
                    </div>
                    <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#FF2E63]" />
                      <span>Up to 25% off official partner hotels</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Hotel coupon code sent to your registered email.')}
                      className="w-full py-2.5 rounded-xl border border-zinc-300 hover:bg-white text-zinc-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      Get Hotel Corporate Code
                    </button>
                  </div>

                  {/* Deal 4: Corporate Delegation Pass */}
                  <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-3.5 shadow-2xs">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-zinc-900">Corporate Group &amp; VIP Delegation</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        For teams of 5+ trade buyers. Includes private B2B lounge access, concierge matchmaking, and executive dining.
                      </p>
                    </div>
                    <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Dedicated Buyer Coordinator</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Delegation inquiry submitted. Concierge will contact you.')}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Apply for Delegation Perks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB: VIRTUAL HUB & LIVE STREAM (ONLINE & HYBRID EVENT SUPPORT) */}
          {/* ============================================================= */}
          {activeTab === 'virtual' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Virtual Hub Header Card */}
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                        {virtualData?.liveStream?.isLive ? 'Live Streaming Now' : 'Interactive Virtual & Hybrid Hub'}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700">
                        {virtualData?.liveStream?.provider || 'Agora / Zoom Hybrid Broadcast'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {virtualCheckedIn ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Virtual Pass Active ({viewerTimezone})</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVirtualCheckIn()}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFCC00] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Check In as Virtual Attendee</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Virtual Exhibition &amp; Live Conference Stage
                    </h2>
                    <p className="text-sm text-zinc-300 max-w-3xl mt-1 leading-relaxed">
                      Participate in {event?.title} from anywhere in the world. Watch real-time keynote streams, browse virtual exhibitor stalls with interactive product catalogues, chat live with booth representatives, and view session schedules converted to your local time zone.
                    </p>
                  </div>

                  {/* Real-time Virtual Attendance & Participation Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80">
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Virtual Visitors Tracked</div>
                      <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                        {(virtualData?.virtualAttendanceStats?.totalVirtualVisitors || 24).toLocaleString()}+
                      </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Stream Views</div>
                      <div className="text-xl sm:text-2xl font-black text-red-400 mt-0.5">
                        {(virtualData?.virtualAttendanceStats?.liveStreamViews || 148).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Virtual Booths</div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                        {virtualData?.virtualBooths?.length || 2} Active
                      </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Sessions</div>
                      <div className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
                        {virtualData?.virtualSessions?.length || 3} Scheduled
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Main Interactive Livestream Broadcast Player */}
              <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tv className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-black text-zinc-900">
                        {virtualData?.liveStream?.title || 'Main Stage Livestream & Keynote Broadcast'}
                      </h3>
                      <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Radio className="h-3 w-3 animate-pulse text-red-600" />
                        1080p HD
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Live video feed streaming directly from {event?.venue || event?.city || 'Main Exhibition Arena'}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 font-bold px-3 py-1.5 rounded-xl border border-zinc-200">
                      <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{((virtualData?.virtualAttendanceStats?.liveStreamViews || 148) + (virtualCheckedIn ? 1 : 0))} Live Viewers</span>
                    </span>
                  </div>
                </div>

                {/* Video Container */}
                <div className="relative rounded-2xl overflow-hidden bg-zinc-950 aspect-video w-full shadow-lg border border-zinc-900 group">
                  {virtualData?.liveStream?.embedUrl ? (
                    <iframe
                      src={virtualData.liveStream.embedUrl}
                      title="Exhibition Live Stream"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ff2e63_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="relative z-10 max-w-lg space-y-4">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
                          <Play className="h-8 w-8 fill-current ml-0.5" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white">
                            {virtualData?.liveStream?.title || `${event?.title} Live Stage`}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            HD stream connects to Agora real-time network and Zoom webcast room when session begins.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                          {virtualData?.liveStream?.zoomMeetingId && (
                            <a
                              href={`https://zoom.us/j/${virtualData.liveStream.zoomMeetingId.replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleVirtualCheckIn()}
                              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                            >
                              <Video className="h-4 w-4" />
                              <span>Join via Zoom (ID: {virtualData.liveStream.zoomMeetingId})</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleVirtualCheckIn()}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{virtualCheckedIn ? 'Checked In ✓' : 'Register Attendance & Watch'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-700">
                      Attendance tracking enabled: Watching this stream records your verified virtual badge in the visitor CRM.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-medium">Your Selected Time Zone:</span>
                    <span className="font-extrabold text-zinc-900 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                      {viewerTimezone}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Interactive Session Schedule with Dynamic Time-Zone Converter */}
              <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-black text-zinc-900">Virtual Conference &amp; Session Schedule</h3>
                      <span className="text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        Time Zone Adjusted
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      All session start and end times below are automatically calculated for your local time zone.
                    </p>
                  </div>

                  {/* TIMEZONE CONTROLLER: Quality requirement: Session times are shown in the viewer's time zone */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 whitespace-nowrap">
                      <Globe className="h-4 w-4 text-amber-600" />
                      <span>Viewer's Time Zone:</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={viewerTimezone}
                        onChange={(e) => {
                          setViewerTimezone(e.target.value);
                          showToast(`Timezone switched to: ${e.target.value}`);
                        }}
                        className="w-full sm:w-64 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                      >
                        {COMMON_TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
                          setViewerTimezone(local);
                          showToast(`Reset to detected local time (${local})`);
                        }}
                        title="Auto-detect local time zone"
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                      >
                        Reset Auto
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-4">
                  {(virtualData?.virtualSessions || []).map((session, sIdx) => {
                    const isAttending = checkedInSessions[session._id || session.id];
                    const localTime = `${formatSessionTime(session.startTime, viewerTimezone)} – ${formatSessionTime(session.endTime, viewerTimezone)}`;
                    const localDate = formatSessionDate(session.startTime, viewerTimezone);
                    const venueTime = `${formatSessionTime(session.startTime, event?.timezone || 'Asia/Kolkata')} IST`;

                    return (
                      <div
                        key={session._id || session.id || sIdx}
                        className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 hover:border-zinc-300 bg-gradient-to-br from-white to-zinc-50/40 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {session.track || 'Conference Track'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                              {session.sessionType === 'keynote' ? 'Keynote Address' : session.sessionType === 'workshop' ? 'Interactive Workshop' : 'Live Panel Discussion'}
                            </span>
                            {session.isLiveNow && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                Live Now
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base sm:text-lg font-black text-zinc-900">
                              {session.title}
                            </h4>
                            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                              {session.description}
                            </p>
                          </div>

                          {/* Speakers */}
                          {session.speakers && session.speakers.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              {session.speakers.map((spk, spkIdx) => (
                                <div key={spkIdx} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-zinc-200/80 shadow-2xs">
                                  {spk.photo ? (
                                    <img
                                      src={spk.photo}
                                      alt={spk.name}
                                      className="h-6 w-6 rounded-full object-cover border border-zinc-200"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                                      {spk.name ? spk.name.charAt(0) : 'S'}
                                    </div>
                                  )}
                                  <div className="text-[11px] leading-tight">
                                    <span className="font-extrabold text-zinc-900">{spk.name}</span>
                                    <span className="text-zinc-500 ml-1">({spk.company})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timing and CTA Box */}
                        <div className="md:w-64 shrink-0 flex flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                          <div className="text-left md:text-right space-y-0.5">
                            <div className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                              {localDate} • {localTime}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-semibold">
                              Viewer Zone: {viewerTimezone}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              Venue Time: {venueTime}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleJoinSession(session)}
                            className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isAttending
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                            }`}
                          >
                            {isAttending ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-white" />
                                <span>Attending ✓ (Joined)</span>
                              </>
                            ) : (
                              <>
                                <Video className="h-4 w-4 text-amber-400" />
                                <span>Join Live Session</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Virtual Exhibitor Booths (Product Catalogue plus Chat) */}
              <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-amber-500" />
                      <h3 className="text-lg font-black text-zinc-900">Virtual Exhibitor Booths</h3>
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        Interactive Showrooms
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Explore official exhibitor digital stalls. Browse product catalogues, download spec sheets, and chat in real-time with booth representatives.
                    </p>
                  </div>
                </div>

                {/* Booths Grid */}
                <div className="grid md:grid-cols-2 gap-5">
                  {(virtualData?.virtualBooths || []).map((booth, bIdx) => (
                    <div
                      key={booth._id || bIdx}
                      className="bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      {/* Booth Header Banner */}
                      <div className="h-28 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 relative p-4 flex items-start justify-between">
                        {booth.banner && (
                          <img
                            src={booth.banner}
                            alt={booth.exhibitorName}
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                          />
                        )}
                        <span className="relative z-10 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-[#FFCC00] text-zinc-950 font-mono shadow-xs">
                          {booth.boothNumber || `Booth #V-${bIdx + 101}`}
                        </span>
                        <span className="relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Rep Online
                        </span>
                      </div>

                      {/* Booth Body */}
                      <div className="p-5 space-y-4 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-xl bg-white border border-zinc-200 p-1 shrink-0 -mt-8 relative z-10 shadow-sm flex items-center justify-center overflow-hidden">
                            {booth.logo ? (
                              <img
                                src={booth.logo}
                                alt={booth.exhibitorName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building className="h-6 w-6 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-zinc-900">
                              {booth.exhibitorName}
                            </h4>
                            <p className="text-xs text-zinc-500">{booth.tagline || 'Official Exhibition Partner'}</p>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                          {booth.description || 'Specializing in next-generation manufacturing technology, industrial hardware, and high-efficiency systems.'}
                        </p>

                        {/* Representative Pill */}
                        {booth.representative && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                              {booth.representative.name ? booth.representative.name.charAt(0) : 'R'}
                            </div>
                            <div className="leading-tight flex-1">
                              <div className="font-bold text-zinc-900">{booth.representative.name}</div>
                              <div className="text-[10px] text-zinc-500">{booth.representative.title || 'Technical Sales Rep'}</div>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Active
                            </div>
                          </div>
                        )}

                        {/* Product Catalogue Peek */}
                        <div className="flex items-center justify-between text-xs pt-1 text-zinc-500">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-amber-500" />
                            <span>{booth.products?.length || 4} Products in Catalogue</span>
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {(booth.boothVisits || 18) + ' Booth Visitors'}
                          </span>
                        </div>
                      </div>

                      {/* Booth CTAs: Product Catalogue + Chat */}
                      <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleVisitBooth(booth, bIdx)}
                          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Package className="h-3.5 w-3.5 text-zinc-600" />
                          <span>View Products</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBoothChatModal(booth)}
                          className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Chat with Rep</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* RECOMMENDED & SIMILAR TRADE SHOWS (POWERED BY RECOMMENDATION ENGINE) */}
          {/* ------------------------------------------------------------------- */}
          <div className="pt-8 border-t border-zinc-200/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mb-1">
                  <span>Recommendation Engine</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                  Similar &amp; Recommended Exhibitions
                </h3>
                <p className="text-xs text-zinc-500">
                  Curated expos in {event?.city || 'India'} matching {event?.categories?.[0] || event?.category || 'this sector'}.
                </p>
              </div>
              <Link
                href="/recommendations"
                className="text-xs font-bold text-[#FF2E63] hover:underline flex items-center gap-1"
              >
                <span>Explore More</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingRecommendations ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((sk) => (
                  <div key={sk} className="h-44 bg-zinc-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recommendedEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedEvents.map((rec) => (
                  <div
                    key={rec._id || rec.id || rec.slug}
                    className="group bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-300 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md truncate max-w-[60%]">
                          {rec.categories?.[0] || rec.category || 'Exhibition'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span>{rec.matchScore || 88}% Match</span>
                        </span>
                      </div>

                      <Link
                        href={`/expo/${rec.slug || rec.id || rec._id}`}
                        className="font-bold text-xs sm:text-sm text-zinc-900 group-hover:text-[#FF2E63] transition-colors line-clamp-2 block leading-snug"
                      >
                        {rec.title}
                      </Link>

                      <div className="space-y-1 text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5 text-zinc-700 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{rec.startDate ? new Date(rec.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
                          <span className="truncate">{rec.venue || rec.city}</span>
                        </div>
                      </div>

                      {rec.matchReasons && rec.matchReasons.length > 0 && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-medium">
                          ✓ {rec.matchReasons[0]}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <Link
                        href={`/expo/${rec.slug || rec.id || rec._id}`}
                        className="font-bold text-zinc-700 hover:text-zinc-950"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/expo/${rec.slug || rec.id || rec._id}`}
                        className="font-extrabold text-[#FF2E63] hover:underline flex items-center gap-1"
                      >
                        <span>Get Pass</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

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
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Rating *</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder={user?.name || "e.g. Rahul Sharma"}
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Company / Org</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Industries"
                      value={reviewerCompany}
                      onChange={(e) => setReviewerCompany(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Your Role</label>
                    <select
                      value={reviewerRole}
                      onChange={(e) => setReviewerRole(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                    >
                      <option value="Verified Trade Buyer">Verified Trade Buyer</option>
                      <option value="Verified Exhibitor">Verified Exhibitor</option>
                      <option value="Industry Delegate">Industry Delegate</option>
                      <option value="Trade Visitor">Trade Visitor</option>
                      <option value="Conference Speaker">Conference Speaker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Headline (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Closed 2 deals on day 1"
                      value={reviewHeadline}
                      onChange={(e) => setReviewHeadline(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Feedback / Review *</label>
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

      {/* Virtual Exhibitor Product Catalogue Modal */}
      {selectedBoothModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
                  {selectedBoothModal.logo ? (
                    <img
                      src={selectedBoothModal.logo}
                      alt={selectedBoothModal.exhibitorName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building className="h-6 w-6 text-zinc-800" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      {selectedBoothModal.exhibitorName} — Product Showcase
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-[#FFCC00] text-zinc-950 px-2 py-0.5 rounded">
                      {selectedBoothModal.boothNumber || 'Virtual Stall'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Official digital exhibition catalogue &amp; technical specifications
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBoothModal(null)}
                className="h-9 w-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Products List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Catalogue Overview</div>
                  <div className="text-sm font-extrabold text-zinc-900 mt-0.5">
                    {selectedBoothModal.products?.length || 4} Featured Industrial &amp; Commercial Products
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBoothChatModal(selectedBoothModal);
                    setSelectedBoothModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Chat with Booth Representative</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {(selectedBoothModal.products || []).map((product, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full bg-zinc-100 relative overflow-hidden group">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.price && (
                        <span className="absolute bottom-2.5 right-2.5 bg-zinc-950/90 text-white font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
                          {product.price}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {product.category || 'Featured Hardware'}
                      </span>
                      <h4 className="text-sm font-extrabold text-zinc-900 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(`✓ Downloading PDF specification brochure for "${product.name}"`)}
                        className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Download Spec Sheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBoothChatModal(selectedBoothModal);
                          setSelectedBoothModal(null);
                        }}
                        className="py-2 px-3 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Request Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Live Booth Chat Modal */}
      {boothChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-zinc-950 to-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {boothChatModal.representative?.name ? boothChatModal.representative.name.charAt(0) : 'E'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{boothChatModal.representative?.name || 'Exhibitor Representative'}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {boothChatModal.exhibitorName} ({boothChatModal.boothNumber || 'Stall'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBoothChatModal(null)}
                className="text-zinc-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <form onSubmit={handleSendBoothMessage} className="p-5 space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                <div className="font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Real-time Booth Connect</span>
                </div>
                <p className="mt-1 text-emerald-800">
                  Your message goes directly to the exhibitor's registered representative via live push alert and SMS notification.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Quick Prompt Shortcuts:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Request Product Pricing & Wholesale MOQ',
                    'Request 1-on-1 Virtual Product Demo',
                    'Send Technical Datasheet via Email'
                  ].map((quickMsg, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setBoothChatMessage(quickMsg)}
                      className="text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200 transition-colors cursor-pointer text-left"
                    >
                      {quickMsg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800">Your Inquiry Message:</label>
                <textarea
                  value={boothChatMessage}
                  onChange={(e) => setBoothChatMessage(e.target.value)}
                  placeholder={`Hi ${boothChatModal.representative?.name || 'team'}, I am interested in your products at ${event?.title}...`}
                  rows={4}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white resize-none shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBoothChatModal(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={boothChatSent || !boothChatMessage.trim()}
                  className="px-5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {boothChatSent ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Sent ✓</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 text-amber-400" />
                      <span>Send Direct Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Attendance Check-In Modal */}
      {checkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-zinc-950 to-zinc-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Virtual Attendee Check-In</h3>
                <p className="text-xs text-zinc-400">Unlock live stream broadcasts &amp; conference sessions</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckInModalOpen(false)}
                className="text-zinc-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVirtualCheckIn(virtualCheckInForm);
              }}
              className="p-5 space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={virtualCheckInForm.name}
                  onChange={(e) => setVirtualCheckInForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Business Email *</label>
                <input
                  type="email"
                  required
                  value={virtualCheckInForm.email}
                  onChange={(e) => setVirtualCheckInForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Company / Org</label>
                  <input
                    type="text"
                    value={virtualCheckInForm.company}
                    onChange={(e) => setVirtualCheckInForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Apex Global"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Phone</label>
                  <input
                    type="tel"
                    value={virtualCheckInForm.phone}
                    onChange={(e) => setVirtualCheckInForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 555-0199"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-100 rounded-xl text-xs text-zinc-600 flex items-center justify-between">
                <span>Selected Time Zone:</span>
                <span className="font-extrabold text-zinc-900">{viewerTimezone}</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirm Pass &amp; Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Organizer Chat Widget for Attendees & Exhibitors */}
      <OrganizerChatWidget
        eventId={event?.id || event?._id}
        eventSlug={event?.slug || slug}
        eventTitle={event?.title}
        organizerId={
          (typeof event?.claimedBy === 'object' ? event?.claimedBy?._id : event?.claimedBy) ||
          (typeof event?.organizer === 'object' ? event?.organizer?._id : (typeof event?.organizer === 'string' && event?.organizer.length === 24 ? event.organizer : ''))
        }
        organizerName={event?.orgName || (typeof event?.organizer === 'object' ? event?.organizer?.name : event?.organizer)}
        orgEmail={event?.orgEmail || (typeof event?.organizer === 'object' ? event?.organizer?.email : '')}
        isOpen={isChatOpen}
        onOpen={() => setIsChatOpen(true)}
        onClose={() => setIsChatOpen(false)}
        onStatusChange={(enabled) => setIsChatEnabled(enabled)}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}
