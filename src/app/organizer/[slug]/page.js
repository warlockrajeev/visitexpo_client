'use client';

/**
 * @file app/organizer/[slug]/page.js
 * @description Dedicated Organizer Profile & Trade Shows Page for VisitExpo.
 * Displays an organizer's official profile, verified status, corporate website,
 * and all live exhibitions organized by them loaded from /api/wordpress-events.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.js';
import {
  Building,
  Calendar,
  Star,
  Users,
  MapPin,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Globe,
  Loader2,
  Search,
  Check,
  Sparkles,
  Ticket,
  Briefcase
} from 'lucide-react';

const ORGANIZERS_CONFIG = {
  'informa-markets': {
    id: 'informa-markets',
    name: 'Informa Markets',
    shortName: 'Informa Markets',
    searchTerm: 'Informa',
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    website: 'https://www.informamarkets.com',
    badge: 'Global Leader',
    scope: 'World’s leading B2B exhibition and trade fair organiser, creating market-making platforms across technology, healthcare, pharma, and industrial sectors.',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop'
  },
  'ies-india': {
    id: 'ies-india',
    name: 'Indian Exhibition Services (IES)',
    shortName: 'IES India',
    searchTerm: 'Indian Exhibition Services',
    brandColor: '#1E40AF',
    accentColor: '#3B82F6',
    website: 'https://ies-india.com',
    badge: 'National Trade Expos',
    scope: 'Premier industrial trade fair organiser in India focusing on smart manufacturing, engineering, and infrastructure exhibitions.',
    banner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop'
  },
  'messe-frankfurt': {
    id: 'messe-frankfurt',
    name: 'Messe Frankfurt',
    shortName: 'Messe Frankfurt',
    searchTerm: 'Messe Frankfurt',
    brandColor: '#DC2626',
    accentColor: '#F59E0B',
    website: 'https://www.messefrankfurt.com',
    badge: 'German Fairs',
    scope: 'World’s largest trade fair, congress and event organiser with its own exhibition grounds, renowned for Automechanika, Light+Building, and Texworld.',
    banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop'
  },
  'rx-india': {
    id: 'rx-india',
    name: 'RX India (Reed Exhibitions)',
    shortName: 'RX India',
    searchTerm: 'RX India',
    brandColor: '#1E3A8A',
    accentColor: '#0284C7',
    website: 'https://rxglobal.com/rx-india',
    badge: 'Reed Exhibitions',
    scope: 'Global powerhouse creating industry-defining events that combine face-to-face networking with data-driven commercial intelligence.',
    banner: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1600&auto=format&fit=crop'
  },
  'nurnbergmesse': {
    id: 'nurnbergmesse',
    name: 'NürnbergMesse India',
    shortName: 'NürnbergMesse',
    searchTerm: 'NürnbergMesse',
    brandColor: '#0284C7',
    accentColor: '#0EA5E9',
    website: 'https://www.nm-india.com',
    badge: 'German Excellence',
    scope: 'One of the 15 largest exhibition companies in the world, organizing leading specialized trade shows in architecture, organic food, and industry.',
    banner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1600&auto=format&fit=crop'
  },
  'messe-dusseldorf': {
    id: 'messe-dusseldorf',
    name: 'Messe Düsseldorf India',
    shortName: 'Messe Düsseldorf',
    searchTerm: 'Messe Düsseldorf',
    brandColor: '#B91C1C',
    accentColor: '#EF4444',
    website: 'https://www.md-india.com',
    badge: 'Medical & Industrial',
    scope: 'Global leader in medical, metals, packaging, and plastics trade fairs, host to MEDICA, wire & Tube, and interpack global networks.',
    banner: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1600&auto=format&fit=crop'
  },
  'cems-global': {
    id: 'cems-global',
    name: 'CEMS-Global USA',
    shortName: 'CEMS-Global',
    searchTerm: 'CEMS-Global',
    brandColor: '#047857',
    accentColor: '#10B981',
    website: 'https://cems.global',
    badge: 'Multinational',
    scope: 'Multinational exhibition and convention organizer with operations across 4 continents, renowned for textile, garment technology, and energy expos.',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop'
  },
  'koelnmesse': {
    id: 'koelnmesse',
    name: 'Koelnmesse India',
    shortName: 'Koelnmesse',
    searchTerm: 'Koelnmesse',
    brandColor: '#EA580C',
    accentColor: '#F97316',
    website: 'https://koelnmesse-india.com',
    badge: 'Food & Hardware Fairs',
    scope: 'World leader in food and beverage technology trade fairs, host to Anuga, ISM, and international hardware exhibitions.',
    banner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop'
  }
};

export default function OrganizerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || '').toLowerCase().trim();

  // Resolve organizer config
  const org = useMemo(() => {
    if (ORGANIZERS_CONFIG[slug]) return ORGANIZERS_CONFIG[slug];
    // Dynamic matching by keyword or alias
    for (const [k, v] of Object.entries(ORGANIZERS_CONFIG)) {
      if (slug.includes(k) || k.includes(slug)) return v;
    }
    // Pretty-format arbitrary slug
    const formattedName = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      id: slug,
      name: formattedName || 'Verified Organizer',
      shortName: formattedName || 'Organizer',
      searchTerm: formattedName,
      brandColor: '#18181B',
      accentColor: '#FF2E63',
      website: 'https://visitexpo.in',
      badge: 'Verified Organizer',
      scope: `Official trade exhibitions and international business conventions organized by ${formattedName}.`,
      banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop'
    };
  }, [slug]);

  // Events State
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [shareToast, setShareToast] = useState(false);
  const [claimedPassIds, setClaimedPassIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch live WordPress events
  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      setLoading(true);
      try {
        const res = await fetch('/api/wordpress-events');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && Array.isArray(json.events)) {
            setAllEvents(json.events);
          }
        }
      } catch (err) {
        console.error('Failed to load organizer events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEvents();
    return () => { isMounted = false; };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleClaimPass = (evt) => {
    setClaimedPassIds(prev => new Set(prev).add(evt.id));
    showToast(`Pass Reserved! Free digital badge confirmed for "${evt.title}".`);
  };

  // Filter events matching this organizer
  const organizerEvents = useMemo(() => {
    const sTerm = (org.searchTerm || org.shortName || org.name).toLowerCase();
    const slugLower = slug.replace(/-/g, ' ');

    return allEvents.filter((item) => {
      const o = (item.organizer || '').toLowerCase();
      const t = (item.title || '').toLowerCase();
      const d = (item.description || '').toLowerCase();

      // Check if organizer matches
      const matchesOrg =
        o.includes(sTerm) ||
        t.includes(sTerm) ||
        d.includes(sTerm) ||
        o.includes(slugLower);

      if (!matchesOrg) return false;

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.city?.toLowerCase().includes(q) ||
          item.venue?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Format filter
      if (selectedFormat === 'in_person' && item.format !== 'In-Person Expo') return false;
      if (selectedFormat === 'hybrid' && item.format !== 'Hybrid Expo') return false;

      return true;
    });
  }, [allEvents, org, slug, searchQuery, selectedFormat]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Toast Notification */}
      {(toastMessage || shareToast) && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage || 'Organizer link copied to clipboard!'}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#organizers" className="hover:text-zinc-900 transition-colors">Organizers</Link>
          <span>/</span>
          <span className="text-zinc-900 font-bold">{org.name}</span>
        </nav>

        {/* Hero Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-xl">
          <img
            src={org.banner}
            alt={org.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />

          <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-bold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Verified Exhibition Organizer • {org.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {org.name}
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {org.scope}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-amber-400" />
                  <span>{loading ? '...' : `${organizerEvents.length} Active Trade Shows`}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span>Global B2B Network</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Share Organizer Link"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Official Website</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-900" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${org.name} exhibitions by sector, title, or venue...`}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFormat('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFormat === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All Formats
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('in_person')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFormat === 'in_person'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              In-Person
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('hybrid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFormat === 'hybrid'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Hybrid
            </button>
          </div>
        </div>

        {/* Exhibitions Feed Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Trade Shows by {org.name}
            </h2>
            <span className="text-xs font-bold text-zinc-500">
              {organizerEvents.length} {organizerEvents.length === 1 ? 'Exhibition' : 'Exhibitions'}
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF2E63]" />
              <p className="text-xs text-zinc-500">Loading {org.name} exhibitions...</p>
            </div>
          ) : organizerEvents.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Building className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">No Exhibitions Found for "{searchQuery}"</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Try clearing your search query or view all exhibitions across all verified organizers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFormat('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {organizerEvents.map((expo) => {
                const isClaimed = claimedPassIds.has(expo.id);

                return (
                  <div
                    key={expo.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Banner */}
                      <Link
                        href={`/expo/${expo.slug || expo.id}`}
                        className="relative h-44 w-full bg-zinc-100 overflow-hidden block"
                      >
                        <img
                          src={expo.image}
                          alt={expo.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          onError={(e) => {
                            if (expo.fallbackImage && e.currentTarget.src !== expo.fallbackImage) {
                              e.currentTarget.src = expo.fallbackImage;
                            }
                          }}
                        />

                        {/* Category Tag */}
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-zinc-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                          {expo.category}
                        </span>

                        {/* Format Tag */}
                        <span className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                          {expo.format}
                        </span>
                      </Link>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 space-y-2.5">
                        <Link href={`/expo/${expo.slug || expo.id}`} className="block group-hover:text-[#FF2E63] transition-colors">
                          <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 line-clamp-2 leading-snug">
                            {expo.title}
                          </h3>
                        </Link>

                        {/* Dates & Location */}
                        <div className="space-y-1 text-xs text-zinc-600">
                          <div className="flex items-center gap-1.5 font-medium text-amber-800">
                            <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>{expo.dates || 'Upcoming 2026'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 truncate text-zinc-500">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{expo.venue || expo.city}</span>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1 font-bold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span>{expo.rating}</span>
                            <span className="font-normal text-zinc-400">({expo.reviewCount})</span>
                          </div>

                          <div className="flex items-center gap-1 text-zinc-600">
                            <Users className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{expo.interestedCount?.toLocaleString()}+ Going</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 mt-2 flex items-center justify-between gap-2">
                      <Link
                        href={`/expo/${expo.slug || expo.id}`}
                        className="text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors"
                      >
                        View Details
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/onboarding/exhibitor?wp_slug=${encodeURIComponent(expo.slug || '')}`}
                          className="text-xs font-bold text-[#FF2E63] hover:underline"
                        >
                          Exhibit
                        </Link>

                        <span className="text-zinc-300">•</span>

                        {isClaimed ? (
                          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pass Ready
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaimPass(expo)}
                            className="text-xs font-extrabold text-zinc-900 hover:text-[#FF2E63] cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>Get Pass</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Organizers Showcase Section */}
        <div className="pt-8 border-t border-zinc-200 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900">
            Discover Other Premier Event Organizers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 text-xs">
            {Object.entries(ORGANIZERS_CONFIG).map(([k, o]) => (
              <Link
                key={k}
                href={`/organizer/${k}`}
                className={`p-3 rounded-xl border transition-all text-center flex flex-col justify-between h-20 ${
                  k === slug
                    ? 'bg-zinc-900 text-white font-bold border-zinc-900 shadow-xs'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:text-zinc-950 hover:border-zinc-300'
                }`}
              >
                <div className="font-bold line-clamp-1">{o.shortName}</div>
                <div className="text-[10px] text-zinc-400 line-clamp-1">{o.badge}</div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
