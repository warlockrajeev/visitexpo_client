'use client';

/**
 * @file EventDetailModal.js
 * @description 10times.com-style Event Detail Page (EDP) Modal (Screen B).
 * Allows unregistered visitors to inspect comprehensive public details:
 * (Overview, Dates, Venue, Star Rating, Interested Count, Schedule highlights, Preview Exhibitors)
 * while triggering the GatedAuthModal when clicking "Get Ticket", "Save", "Contact", or "Unlock Full Exhibitors".
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Star,
  Users,
  Building,
  Ticket,
  Bookmark,
  MessageCircle,
  Share2,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  Lock,
  CheckCircle2,
  PhoneCall
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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'schedule' | 'exhibitors' | 'venue'
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimedPass, setClaimedPass] = useState(false);

  if (!isOpen || !event) return null;

  // Safe calculated social proof metrics
  const rating = event.rating || (4.6 + ((event.title?.length || 5) % 4) * 0.1).toFixed(1);
  const reviewCount = event.reviewCount || (85 + ((event.title?.length || 10) * 11) % 240);
  const interestedCount = event.interestedCount || (1200 + ((event.title?.length || 7) * 73) % 2800);
  const edition = event.edition || `${8 + ((event.title?.length || 4) % 15)}th Edition`;
  const format = event.format || 'In-Person Expo';

  // Sample preview exhibitors
  const previewExhibitors = [
    { name: 'Siemens Industrial Tech', booth: 'Hall 1 • Stall A-104', sector: 'Automation & Hardware' },
    { name: 'Tata Mobility & Defense', booth: 'Hall 2 • Stall B-212', sector: 'Advanced Systems' },
    { name: 'Schneider Electric India', booth: 'Hall 1 • Stall C-301', sector: 'Clean Energy & Power' }
  ];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + `?event=${encodeURIComponent(event.slug || event.id)}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleGetPass = () => {
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

  const handleContact = () => {
    if (isLoggedIn) {
      alert(`Organizer Contact Details:\nEmail: contact@visitexpo.in\nDirect Liaison: +91 (11) 4980-0000\nEvent: ${event.title}`);
    } else {
      onTriggerGated('contact', event);
    }
  };

  const handleUnlockExhibitors = () => {
    if (isLoggedIn) {
      alert('You have full directory access. Scrolling to directory...');
    } else {
      onTriggerGated('exhibitors', event);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Banner & Close */}
        <div className="relative h-44 sm:h-52 w-full bg-zinc-900 shrink-0 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover filter brightness-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

          {/* Top Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FFCC00] text-zinc-950 shadow-sm">
                {event.category || 'Trade Expo'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                {edition}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
                title="Share Event"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Event Header in Banner */}
          <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Verified B2B Exhibition</span>
              <span className="text-white/40">•</span>
              <span className="text-white/90">{format}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight line-clamp-1 drop-shadow-md">
              {event.title}
            </h1>
          </div>
        </div>

        {/* 10times Social Proof Bar */}
        <div className="bg-zinc-50 px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{rating}</span>
              </div>
              <span className="text-zinc-500 font-medium">({reviewCount} verified reviews)</span>
            </div>

            {/* Interested Counter */}
            <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
              <Users className="h-3.5 w-3.5 text-[#FF2E63]" />
              <span>
                <strong className="text-zinc-900 font-bold">{interestedCount.toLocaleString()}+</strong> People Interested
              </span>
            </div>
          </div>

          {/* Quick Date/Venue pill */}
          <div className="flex items-center gap-2 text-zinc-600 font-medium text-[11px]">
            <span className="flex items-center gap-1 text-zinc-800">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              {event.dates}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              {event.city}
            </span>
          </div>
        </div>

        {/* Primary Action Button Bar */}
        <div className="p-4 sm:px-6 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {claimedPass ? (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Pass Issued! Badge Ready in Dashboard</span>
              </div>
            ) : (
              <button
                onClick={handleGetPass}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-extrabold px-5 py-2.5 text-xs shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <Ticket className="h-4 w-4 text-zinc-900" />
                <span>Get Free Visitor Pass</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-rose-50 border-rose-200 text-[#FF2E63]'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-[#FF2E63]' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save ♡'}</span>
            </button>
          </div>

          <button
            onClick={handleContact}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5 text-zinc-600" />
            <span>Contact Organizer</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-zinc-200 flex gap-6 text-xs font-bold text-zinc-500 bg-white">
          {[
            { id: 'overview', label: 'Overview & About' },
            { id: 'schedule', label: 'Schedule & Timings' },
            { id: 'exhibitors', label: 'Exhibitors (120+)' },
            { id: 'venue', label: 'Venue & Directions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 relative cursor-pointer transition-colors ${
                activeTab === tab.id ? 'text-zinc-900 font-extrabold' : 'hover:text-zinc-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF2E63] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-700 text-xs leading-relaxed">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">About the Exhibition</h3>
                <p className="text-zinc-600 leading-relaxed text-xs">
                  {event.description ||
                    `${event.title} is an international premier trade exhibition showcasing modern innovations, industry-leading manufacturers, and next-generation technologies. Connect with verified exhibitors, negotiate wholesale procurement deals, and network with leading decision makers.`}
                </p>
              </div>

              {/* Key Highlights Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-base font-extrabold text-zinc-900">15,000+</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Expected Buyers</div>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-base font-extrabold text-zinc-900">250+</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Exhibitor Stalls</div>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-base font-extrabold text-amber-600">Free Pass</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Badge Entry</div>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-base font-extrabold text-zinc-900">B2B Trade</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Expo Type</div>
                </div>
              </div>

              {/* Venue Snapshot */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Official Venue Address</h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{event.venue}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Free parking available on-site • Metro direct connectivity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">Event Timings &amp; Agenda</h3>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                    <span>Day 1: Inauguration &amp; VIP B2B Buyer Preview</span>
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">10:00 AM – 6:00 PM</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Official keynote ribbon-cutting, executive bilateral buyer meets, and press announcements.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                    <span>Day 2: Product Demos &amp; Conference Keynotes</span>
                    <span className="text-[11px] text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">10:00 AM – 6:00 PM</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Live machine trials, technical paper presentations, and supply chain panel discussions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                    <span>Day 3: Open Visitor Hours &amp; Awards Ceremony</span>
                    <span className="text-[11px] text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">10:00 AM – 5:00 PM</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    General business visitor networking, innovation trophy awards, and closing ceremony.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXHIBITORS & GATED LOCK */}
          {activeTab === 'exhibitors' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Featured Exhibitor Preview</h3>
                <p className="text-[11px] text-zinc-500">
                  Showing top public exhibitors. Sign in to download full brochures and contact booth staff.
                </p>
              </div>

              {/* Public Preview Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                {previewExhibitors.map((ex, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                    <div className="font-bold text-zinc-900 text-xs truncate">{ex.name}</div>
                    <div className="text-[10px] text-zinc-500">{ex.sector}</div>
                    <div className="text-[10px] font-semibold text-amber-700 pt-1">{ex.booth}</div>
                  </div>
                ))}
              </div>

              {/* 10times Gated Directory Teaser Box */}
              <div className="p-5 rounded-xl border-2 border-dashed border-zinc-300 bg-gradient-to-b from-zinc-50 to-white text-center space-y-3">
                <div className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center mx-auto border border-zinc-200">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">
                    120+ Additional Verified Exhibitor Contacts &amp; Catalogs
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Access stall contact numbers, sales reps, floor locations, and product PDF brochures with a free VisitExpo account.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleUnlockExhibitors}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-4 py-2 text-xs transition-colors cursor-pointer"
                  >
                    <span>Unlock Full Exhibitor Directory</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VENUE & DIRECTIONS */}
          {activeTab === 'venue' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Venue &amp; Getting There</h3>
                <p className="text-[11px] text-zinc-500">{event.venue}</p>
              </div>

              <div className="h-48 rounded-xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center gap-2 text-center p-4">
                <MapPin className="h-7 w-7 text-[#FF2E63]" />
                <div className="font-bold text-zinc-800 text-xs">{event.venue}</div>
                <div className="text-[11px] text-zinc-500">{event.city}, India</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-800 shadow-2xs transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Official Listing on VisitExpo Directory</span>
          <button
            onClick={onClose}
            className="font-bold text-zinc-700 hover:text-zinc-950 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
