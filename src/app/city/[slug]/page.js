'use client';

/**
 * @file app/city/[slug]/page.js
 * @description Dedicated City Exhibition Discovery Page for VisitExpo.
 * Displays all trade shows, expos, and conventions in a given host city,
 * with live event loading from /api/wordpress-events, category filtering,
 * format filtering, search, and pass reservation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.js';
import {
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
  ShieldCheck,
  Tag,
  Bookmark,
  ExternalLink,
  Share2,
  CheckCircle2,
  Globe,
  Loader2,
  Search,
  Sparkles,
  Ticket,
  Briefcase
} from 'lucide-react';

// City metadata configuration matching VisitExpo directory
const CITY_PROFILES = {
  'colombo': {
    name: 'Colombo',
    country: 'Sri Lanka',
    region: 'South Asia',
    tagline: 'Leading maritime trade and business conference destination in South Asia.',
    banner: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=1600&auto=format&fit=crop'
  },
  'dhaka': {
    name: 'Dhaka',
    country: 'Bangladesh',
    region: 'South Asia',
    tagline: 'Fast-growing textile, garment machinery, and industrial fair hub.',
    banner: 'https://images.unsplash.com/photo-1609137144822-4740264104d4?q=80&w=1600&auto=format&fit=crop'
  },
  'germany': {
    name: 'Germany',
    country: 'Germany',
    region: 'Europe',
    tagline: 'The undisputed heart of global trade fairs, industrial technology, and Hannover Messe.',
    banner: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1600&auto=format&fit=crop'
  },
  'italy': {
    name: 'Italy',
    country: 'Italy',
    region: 'Europe',
    tagline: 'World-renowned design, fashion machinery, and agricultural expos at Fiera Milano.',
    banner: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1600&auto=format&fit=crop'
  },
  'bangkok': {
    name: 'Bangkok',
    country: 'Thailand',
    region: 'Southeast Asia',
    tagline: 'Premier ASEAN commercial hub hosting major food, hospitality, and automotive conventions.',
    banner: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1600&auto=format&fit=crop'
  },
  'paris': {
    name: 'Paris',
    country: 'France',
    region: 'Europe',
    tagline: 'Global capital of luxury fashion, food innovation (SIAL), and international summits.',
    banner: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop'
  },
  'singapore': {
    name: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    tagline: 'Asia’s premier financial hub and smart tech expo capital at Marina Bay Sands and SingEx.',
    banner: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1600&auto=format&fit=crop'
  },
  'spain': {
    name: 'Spain',
    country: 'Spain',
    region: 'Europe',
    tagline: 'Host of Mobile World Congress (MWC) Barcelona and leading Iberian industrial trade shows.',
    banner: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=1600&auto=format&fit=crop'
  },
  'london': {
    name: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    tagline: 'Major European hub for enterprise software, fintech, and international trade at ExCeL London.',
    banner: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1600&auto=format&fit=crop'
  },
  'dubai': {
    name: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    tagline: 'The Crossroads of Global Commerce. Host to GITEX, Arab Health, and Big 5 Global.',
    banner: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop'
  },
  'jeddah': {
    name: 'Jeddah',
    country: 'Saudi Arabia',
    region: 'Middle East',
    tagline: 'Commercial gateway to the Kingdom of Saudi Arabia and Red Sea trade exhibitions.',
    banner: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=1600&auto=format&fit=crop'
  },
  'riyadh': {
    name: 'Riyadh',
    country: 'Saudi Arabia',
    region: 'Middle East',
    tagline: 'Booming capital hub driving Saudi Vision 2030 megaprojects, LEAP tech, and industrial expos.',
    banner: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=1600&auto=format&fit=crop'
  },
  'delhi': {
    name: 'New Delhi',
    country: 'India',
    region: 'Delhi NCR',
    tagline: 'India’s exhibition capital with world-class facilities at Bharat Mandapam & Yashobhoomi.',
    banner: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1600&auto=format&fit=crop'
  },
  'new-delhi': {
    name: 'New Delhi',
    country: 'India',
    region: 'Delhi NCR',
    tagline: 'India’s exhibition capital with world-class facilities at Bharat Mandapam & Yashobhoomi.',
    banner: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1600&auto=format&fit=crop'
  },
  'mumbai': {
    name: 'Mumbai',
    country: 'India',
    region: 'Maharashtra',
    tagline: 'Financial capital of India hosting blockbuster expos at Jio World Centre and BEC NESCO.',
    banner: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1600&auto=format&fit=crop'
  },
  'bengaluru': {
    name: 'Bengaluru',
    country: 'India',
    region: 'Karnataka',
    tagline: 'Silicon Valley of Asia hosting aerospace, deep-tech, and manufacturing expos at BIEC.',
    banner: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1600&auto=format&fit=crop'
  },
  'chennai': {
    name: 'Chennai',
    country: 'India',
    region: 'Tamil Nadu',
    tagline: 'Automotive and maritime trade powerhouse of South India hosting mega expos at CTC.',
    banner: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1600&auto=format&fit=crop'
  },
  'ahmedabad': {
    name: 'Ahmedabad',
    country: 'India',
    region: 'Gujarat',
    tagline: 'Industrial manufacturing, chemicals, and textiles epicenter hosting expos at Helipad & Mahatma Mandir.',
    banner: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?q=80&w=1600&auto=format&fit=crop'
  },
  'hyderabad': {
    name: 'Hyderabad',
    country: 'India',
    region: 'Telangana',
    tagline: 'Global pharma capital and IT corridor hosting major life sciences expos at HITEX.',
    banner: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?q=80&w=1600&auto=format&fit=crop'
  },
  'pune': {
    name: 'Pune',
    country: 'India',
    region: 'Maharashtra',
    tagline: 'Engineering, automotive components, and IT manufacturing expo hub of Western India.',
    banner: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1600&auto=format&fit=crop'
  },
  'kolkata': {
    name: 'Kolkata',
    country: 'India',
    region: 'West Bengal',
    tagline: 'Gateway to Eastern India, ASEAN trade corridors, and heavy engineering exhibitions.',
    banner: 'https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1600&auto=format&fit=crop'
  },
  'greater-noida': {
    name: 'Greater Noida',
    country: 'India',
    region: 'Uttar Pradesh',
    tagline: 'Home to India Expo Centre & Mart (IEML), hosting Auto Expo and major B2B mega-events.',
    banner: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1600&auto=format&fit=crop'
  },
  'jaipur': {
    name: 'Jaipur',
    country: 'India',
    region: 'Rajasthan',
    tagline: 'Gem & jewelry, handicrafts, and stone architectural expos at JECC Sitapura.',
    banner: 'https://images.unsplash.com/photo-1603228254119-e6aefd832962?q=80&w=1600&auto=format&fit=crop'
  },
  'indore': {
    name: 'Indore',
    country: 'India',
    region: 'Madhya Pradesh',
    tagline: 'Commercial capital of Central India hosting pharma, food processing, and textile trade fairs.',
    banner: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1600&auto=format&fit=crop'
  },
  'coimbatore': {
    name: 'Coimbatore',
    country: 'India',
    region: 'Tamil Nadu',
    tagline: 'Pump, motor, foundry, and textile machinery capital hosting engineering expos at CODISSIA.',
    banner: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1600&auto=format&fit=crop'
  }
};

const CATEGORIES = [
  'All Sectors',
  'Technology & AI',
  'Healthcare & Pharma',
  'Construction & Infra',
  'Automotive & EV',
  'Trade & Industry',
  'Logistics & Cargo',
  'Agri & Food Tech'
];

export default function CityEventsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || '').toLowerCase().trim();

  // Resolve city metadata
  const cityProfile = useMemo(() => {
    if (CITY_PROFILES[slug]) return CITY_PROFILES[slug];
    // Pretty-format arbitrary slug: e.g. "san-francisco" -> "San Francisco"
    const formattedName = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      name: formattedName || 'Exhibition City',
      country: 'Global',
      region: 'Verified Hub',
      tagline: `Discover leading trade exhibitions and business conferences in ${formattedName}.`,
      banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop'
    };
  }, [slug]);

  // Events State
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');
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
        console.error('Failed to load city events:', err);
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
    showToast(`Pass Reserved! Free digital visitor badge confirmed for "${evt.title}".`);
  };

  // Filter events matching this city
  const cityEvents = useMemo(() => {
    const cityNameLower = cityProfile.name.toLowerCase();
    const slugLower = slug.replace(/-/g, ' ');

    return allEvents.filter((item) => {
      const c = (item.city || '').toLowerCase();
      const v = (item.venue || '').toLowerCase();
      const co = (item.country || '').toLowerCase();
      const s = (item.state || '').toLowerCase();

      // Check if event belongs to this city/country hub
      const matchesCity =
        c.includes(cityNameLower) ||
        v.includes(cityNameLower) ||
        co.includes(cityNameLower) ||
        s.includes(cityNameLower) ||
        c.includes(slugLower) ||
        co.includes(slugLower);

      if (!matchesCity) return false;

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.venue?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Category filter
      if (selectedCategory !== 'All Sectors') {
        if (!item.category?.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // Format filter
      if (selectedFormat === 'in_person' && item.format !== 'In-Person Expo') return false;
      if (selectedFormat === 'hybrid' && item.format !== 'Hybrid Expo') return false;

      return true;
    });
  }, [allEvents, cityProfile, slug, searchQuery, selectedCategory, selectedFormat]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Toast Notification */}
      {(toastMessage || shareToast) && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage || 'City page link copied to clipboard!'}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#cities" className="hover:text-zinc-900 transition-colors">Cities</Link>
          <span>/</span>
          <span className="text-zinc-900 font-bold">{cityProfile.name}</span>
        </nav>

        {/* Hero Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-xl">
          <img
            src={cityProfile.banner}
            alt={cityProfile.name}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40" />

          <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>{cityProfile.country} • {cityProfile.region}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Exhibitions &amp; Trade Shows in {cityProfile.name}
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {cityProfile.tagline}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-amber-400" />
                  <span>{loading ? '...' : `${cityEvents.length} Verified Exhibitions`}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Free Visitor Passes Available</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Share City Link"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              <Link
                href="/events"
                className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>All Global Hubs</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search trade shows, venues, or sectors in ${cityProfile.name}...`}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all"
              />
            </div>

            {/* Format Toggle */}
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
                In-Person Only
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

          {/* Industry Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
              Sector:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Exhibitions Feed Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Verified Exhibitions in {cityProfile.name}
            </h2>
            <span className="text-xs font-bold text-zinc-500">
              {cityEvents.length} {cityEvents.length === 1 ? 'Exhibition' : 'Exhibitions'} Found
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF2E63]" />
              <p className="text-xs text-zinc-500">Loading verified exhibitions in {cityProfile.name}...</p>
            </div>
          ) : cityEvents.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Building className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">No Exhibitions Found Matching Filter</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Try clearing your search query or selecting "All Sectors" to discover other exhibitions in {cityProfile.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Sectors');
                  setSelectedFormat('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cityEvents.map((expo) => {
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

        {/* Other Global Exhibition Hubs Footer Section */}
        <div className="pt-8 border-t border-zinc-200 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900">
            Explore Other Premier Exhibition Hubs
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs">
            {Object.entries(CITY_PROFILES).slice(0, 12).map(([k, c]) => (
              <Link
                key={k}
                href={`/city/${k}`}
                className={`p-3 rounded-xl border transition-all text-center ${
                  k === slug
                    ? 'bg-zinc-900 text-white font-bold border-zinc-900'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:border-zinc-300'
                }`}
              >
                <div className="font-bold truncate">{c.name}</div>
                <div className="text-[10px] text-zinc-400 truncate">{c.country}</div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
