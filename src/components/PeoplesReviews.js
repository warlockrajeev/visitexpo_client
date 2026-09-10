'use client';

/**
 * @file PeoplesReviews.js
 * @description People's Reviews on Events component with a 3-review slider.
 * Shows 3 reviews at a time with left/right slider arrows, helpful upvoting,
 * and an interactive "Write a Review" submission modal.
 */

import React, { useState } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  X,
  Send,
  Plus
} from 'lucide-react';

const INITIAL_REVIEWS = [
  {
    id: 1,
    name: 'Rajesh Singhania',
    role: 'Verified Trade Buyer',
    title: 'VP Procurement & Supply Chain',
    company: 'Tata Steel B2B Division',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=140&auto=format&fit=crop',
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
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=140&auto=format&fit=crop',
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
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=140&auto=format&fit=crop',
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
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=140&auto=format&fit=crop',
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
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=140&auto=format&fit=crop',
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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=140&auto=format&fit=crop',
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

export default function PeoplesReviews() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [startIndex, setStartIndex] = useState(0);
  const [helpfulVoted, setHelpfulVoted] = useState({});

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
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState(false);

  const visibleCount = 3;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const handlePrev = () => {
    setStartIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleHelpfulClick = (reviewId) => {
    if (helpfulVoted[reviewId]) return;
    setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      )
    );
  };

  const handleCreateReview = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.review || !newReview.eventTitle) return;

    const created = {
      id: Date.now(),
      name: newReview.name.trim(),
      role: newReview.role,
      title: newReview.title.trim() || 'Trade Professional',
      company: newReview.company.trim() || 'Verified Corporation',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=140&auto=format&fit=crop',
      eventTitle: newReview.eventTitle.trim(),
      venue: 'Major Convention Centre',
      rating: newReview.rating,
      date: 'Just now',
      headline: newReview.headline.trim() || 'Great experience at the event!',
      review: newReview.review.trim(),
      helpfulCount: 0,
      tags: newReview.tags ? newReview.tags.split(',').map((t) => t.trim()) : ['Verified Attendee']
    };

    setReviews([created, ...reviews]);
    setStartIndex(0);
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

    setReviewSubmittedToast(true);
    setTimeout(() => {
      setReviewSubmittedToast(false);
    }, 4000);
  };

  // Slice exactly 3 reviews for display
  const currentReviews = reviews.slice(startIndex, startIndex + visibleCount);

  return (
    <section id="reviews" className="space-y-4">
      {/* Toast Notification */}
      {reviewSubmittedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Review submitted successfully! Thank you for sharing your experience.</span>
        </div>
      )}

      {/* Section Header with Slider Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            People's Reviews on Events
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#FF2E63]" />
            <span>Write a Review</span>
          </button>

          {/* Slider Arrow Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous reviews"
              className="h-8 w-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next reviews"
              className="h-8 w-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Reviews Grid matching 3 visible reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentReviews.map((item) => {
          const isVoted = Boolean(helpfulVoted[item.id]);

          return (
            <div
              key={item.id}
              className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name, Role & Star Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-200 shadow-2xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                          {item.name}
                        </h4>
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" title="Verified Attendee" />
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[170px]">
                        {item.title}, {item.company}
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
                    "{item.headline}"
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

              {/* Bottom: Role Pill & Helpful Button */}
              <div className="pt-3 mt-3 border-t border-zinc-150 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                  {item.role}
                </span>

                <button
                  type="button"
                  onClick={() => handleHelpfulClick(item.id)}
                  disabled={isVoted}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    isVoted
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <ThumbsUp className={`h-3 w-3 ${isVoted ? 'fill-emerald-600' : ''}`} />
                  <span>Helpful ({item.helpfulCount})</span>
                </button>
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
            <form onSubmit={handleCreateReview} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newReview.name}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
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
                    placeholder="e.g. Head of Sourcing"
                    value={newReview.title}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Industrial Corp"
                    value={newReview.company}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, company: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Event / Expo Attended *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Automation Expo 2026"
                    value={newReview.eventTitle}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, eventTitle: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
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
                  placeholder="e.g. Seamless buyer badge retrieval and high ROI"
                  value={newReview.headline}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, headline: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  Your Review &amp; Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details on exhibition layout, crowd quality, networking, or stall ROI..."
                  value={newReview.review}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, review: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                />
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
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
