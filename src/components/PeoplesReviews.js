'use client';

/**
 * @file PeoplesReviews.js
 * @description People's Reviews on Events component with a 3-review slider.
 * Fetches admin-approved reviews from the API, falls back to hardcoded data.
 * "Write a Review" modal submits to the backend for admin moderation.
 */

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import axios from 'axios';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  X,
  Send,
  Plus
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');
const HELPFUL_VOTES_STORAGE_KEY = 'visitexpo_helpful_review_votes';
const NOT_HELPFUL_VOTES_STORAGE_KEY = 'visitexpo_not_helpful_review_votes';

function getHelpfulVotesSnapshot() {
  try {
    return JSON.stringify({
      helpful: localStorage.getItem(HELPFUL_VOTES_STORAGE_KEY) || '[]',
      notHelpful: localStorage.getItem(NOT_HELPFUL_VOTES_STORAGE_KEY) || '[]'
    });
  } catch {
    return JSON.stringify({ helpful: '[]', notHelpful: '[]' });
  }
}

function subscribeToHelpfulVotes(callback) {
  const handleStorage = (event) => {
    if ([HELPFUL_VOTES_STORAGE_KEY, NOT_HELPFUL_VOTES_STORAGE_KEY].includes(event.key)) callback();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener('visitexpo:helpful-votes-changed', callback);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('visitexpo:helpful-votes-changed', callback);
  };
}

function notifyHelpfulVotesChanged() {
  window.dispatchEvent(new Event('visitexpo:helpful-votes-changed'));
}

const FALLBACK_REVIEWS = [
  {
    id: 1,
    name: 'Rajesh Singhania',
    role: 'Verified Trade Buyer',
    title: 'VP Procurement & Supply Chain',
    company: 'Tata Steel B2B Division',
    avatar: null,
    eventTitle: 'Automation Expo Asia 2026',
    venue: 'Bombay Exhibition Centre (BEC), Mumbai',
    rating: 5,
    date: '3 days ago',
    headline: 'Closed 2 major robotics contracts on day 2 alone!',
    review:
      'The digital pass retrieval on VisitExpo made entry instantaneous — zero queue at Hall 1. We pre-booked 6 B2B supplier meetings through the directory before even setting foot in Mumbai. Exceptional trade floor curation and verified exhibitor quality!',
    helpfulCount: 48,
    tags: ['Robotics', 'Industrial Automation', 'Procurement']
  },
  {
    id: 2,
    name: 'Dr. Ananya Roy',
    role: 'VIP Clinical Delegate',
    title: 'Chief Medical Officer',
    company: 'Apollo Diagnostic Network',
    avatar: null,
    eventTitle: 'India International Medical Expo',
    venue: 'Bharat Mandapam (IECC), New Delhi',
    rating: 5,
    date: '1 week ago',
    headline: 'Seamless digital badge scanning and paperless brochure downloads',
    review:
      'Attended as an institutional healthcare delegate. The interactive floor plan and pre-arranged clinical equipment demos saved our procurement team hours. Scanning QR codes at stalls directly synced specs to my email.',
    helpfulCount: 35,
    tags: ['Healthcare', 'Medical Devices', 'Diagnostics']
  },
  {
    id: 3,
    name: 'Vikramaditya Rao',
    role: 'Verified Exhibitor',
    title: 'Managing Director',
    company: 'AeroTech Hydraulics Ltd.',
    avatar: null,
    eventTitle: 'Aero & Defense Conclave 2026',
    venue: 'Hitex Exhibition Center, Hyderabad',
    rating: 5,
    date: '2 weeks ago',
    headline: 'Generated 380+ qualified buyer leads with 5x ROI on stall space',
    review:
      'Our 48sqm corner booth saw non-stop footfall from defense procurement officers across India and SE Asia. The VisitExpo exhibitor QR lead scanner worked flawlessly on mobile. Best organized aerospace fair we have participated in over a decade.',
    helpfulCount: 62,
    tags: ['Aerospace', 'Defense', 'Exhibitor Success']
  },
  {
    id: 4,
    name: 'Marcus H. Vance',
    role: 'International Trade Buyer',
    title: 'Global Sourcing Director',
    company: 'GlobalTex Trade (Frankfurt)',
    avatar: null,
    eventTitle: 'Tex-Styles & Apparel World',
    venue: 'Jio World Convention Centre, Mumbai',
    rating: 5,
    date: '3 weeks ago',
    headline: 'JWCC is world-class; pre-registration eliminated all hassle',
    review:
      'Traveled from Germany specifically for this fair. VisitExpo handled my VIP buyer accreditation and visa recommendation documentation effortlessly. Connected with 14 certified sustainable cotton exporters in 48 hours.',
    helpfulCount: 53,
    tags: ['Textiles', 'International Trade', 'Sustainable Fashion']
  },
  {
    id: 5,
    name: 'Pooja Deshmukh',
    role: 'Verified Exhibitor',
    title: 'Co-Founder & CEO',
    company: 'GreenPack Eco Solutions',
    avatar: null,
    eventTitle: 'Sustainable Packaging Expo 2026',
    venue: 'Bangalore Intl Exhibition Centre (BIEC)',
    rating: 5,
    date: '1 month ago',
    headline: 'Startup stall in Hall 3 signed 2 national distribution pacts!',
    review:
      'As a clean packaging startup, we were anxious about competing against legacy packaging giants. The category spotlight and attendee recommendations on VisitExpo drove high-intent FMCG brand managers right to our stall.',
    helpfulCount: 41,
    tags: ['Packaging', 'Sustainability', 'FMCG']
  },
  {
    id: 6,
    name: 'Meera Krishnan',
    role: 'Verified Trade Buyer',
    title: 'Senior Sourcing Specialist',
    company: 'Renewable Power Consortium',
    avatar: null,
    eventTitle: 'Renewable Energy India Expo (REI)',
    venue: 'YASHOBHOOMI (IICC), New Delhi',
    rating: 5,
    date: '1 month ago',
    headline: 'The seminar schedules synced seamlessly with Google Calendar',
    review:
      'The cleanest exhibition navigation we have experienced. Found Tier-1 solar inverter suppliers with immediate factory readiness. The pre-event exhibitor directory allowed us to shortlist booths well in advance.',
    helpfulCount: 29,
    tags: ['Solar Energy', 'CleanTech', 'Power Sector']
  }
];

// Convert API review to display format
function formatApiReview(r) {
  const createdDate = r.createdAt ? new Date(r.createdAt) : new Date();
  const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  let dateLabel = 'Just now';
  if (daysDiff >= 30) dateLabel = `${Math.floor(daysDiff / 30)} month${Math.floor(daysDiff / 30) > 1 ? 's' : ''} ago`;
  else if (daysDiff >= 7) dateLabel = `${Math.floor(daysDiff / 7)} week${Math.floor(daysDiff / 7) > 1 ? 's' : ''} ago`;
  else if (daysDiff >= 1) dateLabel = `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;

  return {
    id: r._id || r.id,
    name: r.name,
    role: r.role || 'Verified Trade Buyer',
    title: r.title || 'Trade Professional',
    company: r.company || '',
    avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=FF2E63&color=fff&size=140`,
    eventTitle: r.eventTitle,
    venue: r.venue || 'Major Convention Centre',
    rating: r.rating || 5,
    date: dateLabel,
    headline: r.headline || 'Great experience at the event!',
    review: r.review,
    helpfulCount: r.helpfulCount || 0,
    notHelpfulCount: r.notHelpfulCount || 0,
    tags: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : ['Verified Attendee']
  };
}

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-pink-600',
  'from-rose-500 to-red-600',
  'from-cyan-600 to-blue-600'
];

function validateReviewField(field, value) {
  const text = typeof value === 'string' ? value.trim() : '';
  const letter = /\p{L}/u;
  const alphanumericCount = (text.match(/[\p{L}\p{N}]/gu) || []).length;
  const humanText = /^[\p{L}\p{M}\p{N}\s.,!?'"’“”&()/\-:;]+$/u;

  if (field === 'name') {
    if (!text) return 'Your full name is required.';
    if (text.length < 2 || text.length > 120 || !letter.test(text) || !/^[\p{L}\p{M}\s.'’-]+$/u.test(text)) {
      return 'Enter a valid name using letters, spaces, apostrophes, or hyphens.';
    }
  } else if (field === 'title' && text) {
    if (text.length < 2 || text.length > 80 || !letter.test(text) || !humanText.test(text)) {
      return 'Enter a valid designation using letters and common punctuation.';
    }
  } else if (field === 'company' && text) {
    if (text.length < 2 || text.length > 120 || alphanumericCount < 2 || !humanText.test(text)) {
      return 'Enter a valid company name with at least two letters or numbers.';
    }
  } else if (field === 'eventTitle') {
    if (!text) return 'Event or expo name is required.';
    if (text.length < 2 || text.length > 160 || alphanumericCount < 2 || !humanText.test(text)) {
      return 'Enter a valid event name using letters, numbers, and common punctuation.';
    }
  } else if (field === 'headline' && text) {
    if (text.length < 2 || text.length > 300 || alphanumericCount < 2 || !humanText.test(text)) {
      return 'Enter a meaningful headline using letters, numbers, and common punctuation.';
    }
  } else if (field === 'review') {
    if (!text) return 'Your review is required.';
    if (text.length < 4 || text.length > 2000 || alphanumericCount < 4 || !humanText.test(text)) {
      return 'Enter at least 4 letters or numbers and use only common punctuation.';
    }
  }

  return '';
}

function ReviewAvatar({ name, avatar }) {
  const [error, setError] = useState(false);
  const initials = (name || '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const charSum = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgGrad = AVATAR_GRADIENTS[charSum % AVATAR_GRADIENTS.length];

  if (!avatar || error || avatar.includes('unsplash') || avatar.includes('ui-avatars.com')) {
    return (
      <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${bgGrad} flex items-center justify-center text-white font-extrabold text-xs shadow-2xs shrink-0 select-none border border-white/20`}>
        {initials || 'VP'}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="h-10 w-10 rounded-full object-cover border border-zinc-200 shadow-2xs shrink-0"
    />
  );
}

export default function PeoplesReviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [startIndex, setStartIndex] = useState(0);
  const helpfulVotesSerialized = useSyncExternalStore(
    subscribeToHelpfulVotes,
    getHelpfulVotesSnapshot,
    () => JSON.stringify({ helpful: '[]', notHelpful: '[]' })
  );
  const reviewVotes = useMemo(() => {
    try {
      const savedVotes = JSON.parse(helpfulVotesSerialized);
      const readIds = (value) => {
        const ids = JSON.parse(value);
        return Array.isArray(ids) ? Object.fromEntries(ids.map((id) => [String(id), true])) : {};
      };
      return {
        helpful: readIds(savedVotes.helpful),
        notHelpful: readIds(savedVotes.notHelpful)
      };
    } catch {
      return { helpful: {}, notHelpful: {} };
    }
  }, [helpfulVotesSerialized]);
  const helpfulVoted = reviewVotes.helpful;
  const notHelpfulVoted = reviewVotes.notHelpful;
  const [helpfulVoteError, setHelpfulVoteError] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    role: 'Verified Trade Buyer',
    title: '',
    company: '',
    eventTitle: '',
    rating: 5,
    headline: '',
    review: '',
    tags: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState(false);
  const [reviewFormErrors, setReviewFormErrors] = useState({});

  // Fetch featured reviews from API on mount
  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        const res = await axios.get(`${API_URL}/reviews/featured`, { timeout: 3000 });
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setReviews(res.data.data.map(formatApiReview));
        }
        // If no featured reviews from API, keep the fallback data
      } catch (err) {
        // Silently keep fallback reviews
        console.log('Using fallback reviews:', err?.message);
      }
    };
    fetchFeaturedReviews();
  }, []);

  const visibleCount = 3;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const handlePrev = () => {
    setStartIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleHelpfulClick = async (reviewId, reaction = 'helpful') => {
    const voteId = String(reviewId);
    if (helpfulVoted[voteId] || notHelpfulVoted[voteId]) return;
    setHelpfulVoteError('');
    setReviews((prev) =>
      prev.map((r) =>
        String(r.id) === voteId
          ? {
              ...r,
              helpfulCount: r.helpfulCount + (reaction === 'helpful' ? 1 : 0),
              notHelpfulCount: (r.notHelpfulCount || 0) + (reaction === 'notHelpful' ? 1 : 0)
            }
          : r
      )
    );

    try {
      const storageKey = reaction === 'helpful' ? HELPFUL_VOTES_STORAGE_KEY : NOT_HELPFUL_VOTES_STORAGE_KEY;
      const savedVotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const votes = new Set(Array.isArray(savedVotes) ? savedVotes.map(String) : []);
      votes.add(voteId);
      localStorage.setItem(storageKey, JSON.stringify([...votes]));
      notifyHelpfulVotesChanged();

      const endpoint = reaction === 'helpful' ? 'helpful' : 'not-helpful';
      const response = await axios.post(`${API_URL}/reviews/${encodeURIComponent(voteId)}/${endpoint}`);
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Could not save your review reaction.');
      }

      const countKey = reaction === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
      const savedCount = response.data?.data?.[countKey];
      if (Number.isFinite(savedCount)) {
        setReviews((prev) =>
          prev.map((review) =>
            String(review.id) === voteId ? { ...review, [countKey]: savedCount } : review
          )
        );
      }
    } catch (err) {
      console.error('Error saving review reaction:', err);
      setReviews((prev) =>
        prev.map((review) =>
          String(review.id) === voteId
            ? {
                ...review,
                helpfulCount: Math.max(0, review.helpfulCount - (reaction === 'helpful' ? 1 : 0)),
                notHelpfulCount: Math.max(
                  0,
                  (review.notHelpfulCount || 0) - (reaction === 'notHelpful' ? 1 : 0)
                )
              }
            : review
        )
      );
      try {
        const storageKey = reaction === 'helpful' ? HELPFUL_VOTES_STORAGE_KEY : NOT_HELPFUL_VOTES_STORAGE_KEY;
        const savedVotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(
          storageKey,
          JSON.stringify(Array.isArray(savedVotes) ? savedVotes.filter((id) => String(id) !== voteId) : [])
        );
        notifyHelpfulVotesChanged();
      } catch (storageError) {
        console.error('Could not clear failed review reaction:', storageError);
      }
      setHelpfulVoteError('Your reaction could not be saved. Please try again.');
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    const errors = {
      name: validateReviewField('name', newReview.name),
      title: validateReviewField('title', newReview.title),
      company: validateReviewField('company', newReview.company),
      eventTitle: validateReviewField('eventTitle', newReview.eventTitle),
      headline: validateReviewField('headline', newReview.headline),
      review: validateReviewField('review', newReview.review)
    };
    setReviewFormErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setReviewSubmitting(true);
    try {
      await axios.post(`${API_URL}/reviews`, {
        name: newReview.name.trim(),
        role: newReview.role,
        title: newReview.title.trim() || 'Trade Professional',
        company: newReview.company.trim() || '',
        eventTitle: newReview.eventTitle.trim(),
        rating: newReview.rating,
        headline: newReview.headline.trim() || '',
        review: newReview.review.trim(),
        tags: newReview.tags ? newReview.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      });

      setShowReviewModal(false);
      setNewReview({
        name: '',
        role: 'Verified Trade Buyer',
        title: '',
        company: '',
        eventTitle: '',
        rating: 5,
        headline: '',
        review: '',
        tags: ''
      });
      setReviewFormErrors({});

      setReviewSubmittedToast(true);
      setTimeout(() => {
        setReviewSubmittedToast(false);
      }, 4000);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewFieldChange = (field, value) => {
    const sanitizedValue = value.replace(/[<>]/g, '');
    setNewReview((prev) => ({ ...prev, [field]: sanitizedValue }));
    setReviewFormErrors((prev) => ({
      ...prev,
      [field]: sanitizedValue !== value
        ? 'Angle brackets (< and >) are not allowed.'
        : validateReviewField(field, sanitizedValue)
    }));
  };

  const reviewInputClass = (field) =>
    `w-full rounded-lg border ${reviewFormErrors[field] ? 'border-red-400' : 'border-zinc-200'} bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 ${
      reviewFormErrors[field] ? 'focus:ring-red-400' : 'focus:ring-zinc-900'
    }`;

  // Slice exactly 3 reviews for display
  const currentReviews = reviews.slice(startIndex, startIndex + visibleCount);

  return (
    <section id="reviews" className="space-y-4">
      {/* Toast Notification */}
      {reviewSubmittedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Review submitted successfully! It will appear after admin approval.</span>
        </div>
      )}
      {helpfulVoteError && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {helpfulVoteError}
        </p>
      )}

      {/* Section Header with Slider Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            People&apos;s Reviews on Events
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-0.5">
            Real ratings &amp; feedback from verified trade attendees, buyers, and exhibitors
          </p>
        </div>

        {/* Action Controls: Write Review Button & Slider Arrows */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-zinc-950 stroke-[3]" />
            <span>Write a Review</span>
          </button>

          {/* Slider Arrow Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous reviews"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 hover:border-zinc-300 text-zinc-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next reviews"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 hover:border-zinc-300 text-zinc-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Reviews Grid matching 3 visible reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentReviews.map((item) => {
          const reaction = helpfulVoted[String(item.id)]
            ? 'helpful'
            : notHelpfulVoted[String(item.id)]
              ? 'notHelpful'
              : null;
          const isVoted = reaction !== null;

          return (
            <div
              key={item.id}
              className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name, Role & Star Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ReviewAvatar name={item.name} avatar={item.avatar} />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                          {item.name}
                        </h4>
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" title="Verified Attendee" />
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[170px]">
                        {item.title}{item.company ? `, ${item.company}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-[#FF7A00] shrink-0">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Event Attended Badge */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-2 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase">
                    <span className="text-[#FF2E63] font-bold">Expo Attended:</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {item.eventTitle}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {item.venue}
                  </p>
                </div>

                {/* Headline & Review Text */}
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-zinc-900 leading-snug">
                    &quot;{item.headline}&quot;
                  </h5>
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                    {item.review}
                  </p>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom: Role Pill & Review Reactions */}
              <div className="pt-3 mt-3 border-t border-zinc-150 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                  {item.role}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(item.id, 'helpful')}
                    disabled={isVoted}
                    aria-pressed={reaction === 'helpful'}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                      reaction === 'helpful'
                        ? 'bg-emerald-50 text-emerald-600'
                        : isVoted
                          ? 'cursor-not-allowed text-zinc-300'
                          : 'cursor-pointer text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    <ThumbsUp className={`h-3 w-3 ${reaction === 'helpful' ? 'fill-emerald-600' : ''}`} />
                    <span>Helpful ({item.helpfulCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(item.id, 'notHelpful')}
                    disabled={isVoted}
                    aria-pressed={reaction === 'notHelpful'}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                      reaction === 'notHelpful'
                        ? 'bg-rose-50 text-rose-600'
                        : isVoted
                          ? 'cursor-not-allowed text-zinc-300'
                          : 'cursor-pointer text-zinc-500 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    <ThumbsDown className={`h-3 w-3 ${reaction === 'notHelpful' ? 'fill-rose-600' : ''}`} />
                    <span>Not helpful ({item.notHelpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setStartIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              startIndex === idx ? 'w-5 bg-zinc-900' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
            }`}
          />
        ))}
      </div>

      {/* Write a Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#FF2E63]" />
                <h3 className="font-bold text-sm text-zinc-900">Write an Event Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form noValidate onSubmit={handleCreateReview} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    aria-invalid={Boolean(reviewFormErrors.name)}
                    placeholder="e.g. Vikram Malhotra"
                    value={newReview.name}
                    onChange={(e) => handleReviewFieldChange('name', e.target.value)}
                    className={reviewInputClass('name')}
                  />
                  {reviewFormErrors.name && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Participation Role
                  </label>
                  <select
                    value={newReview.role}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="Verified Trade Buyer">Verified Trade Buyer</option>
                    <option value="Verified Exhibitor">Verified Exhibitor</option>
                    <option value="VIP Clinical Delegate">VIP Clinical Delegate</option>
                    <option value="Conference Speaker">Conference Speaker</option>
                    <option value="Trade Visitor">Trade Visitor</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    aria-invalid={Boolean(reviewFormErrors.title)}
                    placeholder="e.g. Head of Sourcing"
                    value={newReview.title}
                    onChange={(e) => handleReviewFieldChange('title', e.target.value)}
                    className={reviewInputClass('title')}
                  />
                  {reviewFormErrors.title && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    aria-invalid={Boolean(reviewFormErrors.company)}
                    placeholder="e.g. Apex Industrial Corp"
                    value={newReview.company}
                    onChange={(e) => handleReviewFieldChange('company', e.target.value)}
                    className={reviewInputClass('company')}
                  />
                  {reviewFormErrors.company && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.company}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Event / Expo Attended *
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    aria-invalid={Boolean(reviewFormErrors.eventTitle)}
                    placeholder="e.g. Automation Expo 2026"
                    value={newReview.eventTitle}
                    onChange={(e) => handleReviewFieldChange('eventTitle', e.target.value)}
                    className={reviewInputClass('eventTitle')}
                  />
                  {reviewFormErrors.eventTitle && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.eventTitle}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Rating (1-5 Stars)
                  </label>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value={5}>★★★★★ (5/5)</option>
                    <option value={4}>★★★★☆ (4/5)</option>
                    <option value={3}>★★★☆☆ (3/5)</option>
                    <option value={2}>★★☆☆☆ (2/5)</option>
                    <option value={1}>★☆☆☆☆ (1/5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  Headline / Summary
                </label>
                <input
                  type="text"
                  maxLength={300}
                  aria-invalid={Boolean(reviewFormErrors.headline)}
                  placeholder="e.g. Seamless buyer badge retrieval and high ROI"
                  value={newReview.headline}
                  onChange={(e) => handleReviewFieldChange('headline', e.target.value)}
                  className={reviewInputClass('headline')}
                />
                {reviewFormErrors.headline && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.headline}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  Your Review &amp; Feedback *
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  aria-invalid={Boolean(reviewFormErrors.review)}
                  placeholder="Share details on exhibition layout, crowd quality, networking, or stall ROI..."
                  value={newReview.review}
                  onChange={(e) => handleReviewFieldChange('review', e.target.value)}
                  className={`${reviewInputClass('review')} resize-none`}
                />
                {reviewFormErrors.review && <p className="mt-1 text-[10px] text-red-600">{reviewFormErrors.review}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
