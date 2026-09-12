'use client';

/**
 * @file EventDetailModal.js
 * @description 10times.com-style Event Detail Page (EDP) Modal (Screen B) with VisitExpo Color Theme.
 * Matches the user reference screenshots:
 * - Floating Header with Logo, Edition, Featured tag, Red Date highlight, Title, Star Rating, Location, Attendees avatars, and CTAs (Interested & Request Booth)
 * - Tabs: About, Feed, Exhibitors, Speakers, Reviews, Deals
 * - Media Gallery with thumbnail slides
 * - Warm Yellow/Amber Highlights Box
 * - "Listed In" hashtags & category pills
 * - "Open Full Expo Page" action
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Calendar,
  MapPin,
  Star,
  Users,
  Building,
  Ticket,
  Bookmark,
  Share2,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Layers,
  Lock,
  CheckCircle2,
  Tag,
  Play,
  ArrowRight
} from 'lucide-react';

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
  isLoggedIn,
  isSaved,
  onToggleSave,
  onTriggerGated,
  onClaimTicketSuccess
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimedPass, setClaimedPass] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);

  if (!isOpen || !event) return null;

  const rating = event.rating || (4.6 + ((event.title?.length || 5) % 4) * 0.1).toFixed(1);
  const reviewCount = event.reviewCount || (85 + ((event.title?.length || 10) * 11) % 240);
  const followersCount = event.interestedCount || 1058;
  const edition = event.edition || '11th Edition';
  const eventSlug = event.slug || String(event.id);

  // Gallery Photos
  const mediaGallery = [
    { type: 'image', url: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop', caption: 'Main Expo Floor' },
    { type: 'video', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop', caption: 'Live Demonstrations' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop', caption: 'B2B Stalls & Buyers' }
  ];

  const attendeeAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop'
  ];

  const listedInTags = [
    '#Food & Beverages',
    '#Beverage',
    '#Food',
    '#Bakery',
    '#Package',
    '#Home',
    '#Utensils',
    '#Home Baking',
    '#Business'
  ];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + `/expo/${eventSlug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleInterested = () => {
    if (isLoggedIn) {
      setClaimedPass(true);
      if (onClaimTicketSuccess) onClaimTicketSuccess(event);
    } else {
      onTriggerGated('ticket', event);
    }
  };

  const handleSave = () => {
    if (isLoggedIn) {
      if (onToggleSave) onToggleSave(event.id);
    } else {
      onTriggerGated('save', event);
    }
  };

  const handleOpenFullPage = () => {
    onClose();
    router.push(`/expo/${eventSlug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-[#F6F7F9] rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Floating Header Card (Screenshot 1) */}
        <div className="bg-white border-b border-zinc-200 p-5 sm:p-6 space-y-4">
          
          {/* Top Row: Actions & Close */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {edition}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FF2E63] text-white">
                Featured
              </span>
              <span className="text-xs text-zinc-500 font-semibold hidden sm:inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Add a review
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-600">
              <button
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer ${
                  isSaved ? 'text-[#FF2E63] font-bold' : ''
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-[#FF2E63]' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFullPage}
                className="inline-flex items-center gap-1 text-[#FF2E63] font-bold hover:underline cursor-pointer ml-1"
                title="Open full page"
              >
                <span>Full Page</span>
                <ExternalLink className="h-3 w-3" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Core Event Identity Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-zinc-200 bg-white p-1.5 shrink-0 shadow-2xs overflow-hidden flex items-center justify-center">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-[#FF2E63]">
                  {event.dates}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                  {event.title} <span className="text-rose-500 text-sm">🛡️</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                  <span className="font-extrabold text-amber-700 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {rating} ({reviewCount} Ratings)
                  </span>
                  <span>•</span>
                  <span>{event.category || 'Trade Show'}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 text-[#FF2E63]" />
                  <span>{event.venue || event.city}</span>
                </div>

                {/* Followers Stack */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {attendeeAvatars.map((src, i) => (
                      <img key={i} src={src} alt="" className="h-5 w-5 rounded-full ring-2 ring-white object-cover" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-zinc-700">
                    {followersCount.toLocaleString()} Followers
                  </span>
                </div>
              </div>
            </div>

            {/* Header CTAs */}
            <div className="flex items-center gap-2.5 sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleInterested}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-102 cursor-pointer ${
                  claimedPass
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 ring-1 ring-amber-400'
                }`}
              >
                {claimedPass ? 'Interested ✓' : 'Interested'}
              </button>

              <Link
                href={`/onboarding/exhibitor?wp_slug=${encodeURIComponent(event.slug || '')}&wp_post_id=${event.wpPostId || event.id || ''}`}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition-all text-center"
              >
                Request a Booth
              </Link>
            </div>

          </div>

        </div>

        {/* Sticky Tabs Bar */}
        <div className="bg-white border-b border-zinc-200 px-6 flex gap-6 text-xs sm:text-sm font-bold text-zinc-600 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'about', label: 'About' },
            { id: 'feed', label: 'Feed' },
            { id: 'exhibitors', label: 'Exhibitors' },
            { id: 'speakers', label: 'Speakers' },
            { id: 'reviews', label: `${reviewCount} Reviews` },
            { id: 'deals', label: 'Deals' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#FF2E63] text-zinc-900 font-extrabold'
                  : 'border-transparent hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-zinc-700 text-xs leading-relaxed">
          
          {/* Media Carousel */}
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
            <div className="relative h-56 sm:h-72 w-full overflow-hidden">
              <img
                src={mediaGallery[currentMediaIdx]?.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {mediaGallery[currentMediaIdx]?.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg backdrop-blur-xs">
                    <Play className="h-5 w-5 fill-zinc-900 ml-0.5" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-white text-[11px] font-semibold">
                <span>{mediaGallery[currentMediaIdx]?.caption}</span>
                <span className="bg-black/60 px-2 py-0.5 rounded-full text-[10px]">
                  {currentMediaIdx + 1} / {mediaGallery.length}
                </span>
              </div>

              <button
                onClick={() => setCurrentMediaIdx((prev) => (prev === 0 ? mediaGallery.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-zinc-900 shadow-md cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentMediaIdx((prev) => (prev === mediaGallery.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-zinc-900 shadow-md cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 space-y-2">
            <p className="text-zinc-600 leading-relaxed text-xs">
              {isReadMore ? event.description : (event.description?.slice(0, 240) || '') + '...'}
            </p>
            <button
              onClick={() => setIsReadMore(!isReadMore)}
              className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer"
            >
              {isReadMore ? 'Show Less' : 'Read More'}
            </button>
          </div>

          {/* Highlights Box (Warm Yellow/Amber Box in Screenshot) */}
          <div className="bg-[#FFFBEB] border border-amber-200 rounded-xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-950">
              Highlights
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
              <li><strong>100,000+ On-site visits</strong> across 3 trade days.</li>
              <li><strong>100 onsite events</strong> offering a comprehensive platform for exhibitions, competitions &amp; demos.</li>
              <li className="pt-1">
                <span className="font-bold block mb-1">Popular among visitors for:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-[10px] font-bold text-amber-950">
                    Top 100 in {event.category || 'Trade'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-[10px] font-bold text-amber-950">
                    Quality of Participants &amp; B2B Buyers
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* "Listed In" Tags */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 space-y-2">
            <div className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
              Listed In
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-900 flex items-center gap-1">
                <Tag className="h-3 w-3 text-zinc-500" />
                {event.category || 'Trade Exhibition'}
              </span>
              {listedInTags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Social Invite Banner */}
          <div className="bg-[#FFCC00] rounded-xl p-4 flex items-center justify-between gap-3 text-zinc-950 border border-amber-300">
            <div className="font-extrabold text-xs sm:text-sm">
              You are heading to the event with 100k people! Who's coming with you?
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-1.5 rounded-lg bg-zinc-950 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              Share
            </button>
          </div>

          {/* Structured Meta Grid */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 grid sm:grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timings</div>
              <div className="font-bold text-xs text-zinc-900">{event.timings || '9:00 AM – 5:00 PM (General)'}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Entry Fees</div>
              <div className="font-bold text-xs text-zinc-900">Free Ticket for Industry Professionals</div>
            </div>
            <div className="space-y-0.5 pt-2 border-t border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estimated Turnout</div>
              <div className="font-bold text-xs text-zinc-900">{event.turnout || '100,000+ Visitors • 2,000+ Exhibitors'}</div>
            </div>
            <div className="space-y-0.5 pt-2 border-t border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Event Type</div>
              <div className="font-bold text-xs text-zinc-900">Trade Show, In-Person</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleOpenFullPage}
            className="font-bold text-[#FF2E63] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Dedicated Expo Page</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
