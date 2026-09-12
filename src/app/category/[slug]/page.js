'use client';

/**
 * @file app/category/[slug]/page.js
 * @description Dedicated Category Events Discovery Page matching the 10times reference screenshots
 * styled with the VisitExpo color theme (#FF2E63 vibrant pink/orange, #FFCC00 yellow, clean white canvas).
 */

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.js';
import { getCategoryBySlug, CATEGORIES_CONFIG } from '../../../data/categoryEventsData.js';
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Star,
  Share2,
  Bookmark,
  Users,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  ArrowRight,
  Lock,
  ExternalLink,
  Plus,
  Check,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function CategoryEventsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || 'it-technology';

  // Load category config
  const category = useMemo(() => {
    return getCategoryBySlug(slug);
  }, [slug]);

  // Local state
  const [activeTab, setActiveTab] = useState('events');
  const [activeSort, setActiveSort] = useState('trending');
  const [isFollowing, setIsFollowing] = useState(false);
  const [interestedMap, setInterestedMap] = useState({});
  const [shareToast, setShareToast] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMoreAbout, setShowMoreAbout] = useState(false);

  // Filter expanders
  const [openSections, setOpenSections] = useState({
    calendar: false,
    format: true,
    country: true,
    category: true,
    designation: true
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const toggleInterested = (eventId) => {
    setInterestedMap((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Filter events based on selected format/country
  const filteredEvents = useMemo(() => {
    return category.events.filter((evt) => {
      if (selectedFormat === 'tradeshows' && !evt.tags.includes('Tradeshow')) return false;
      if (selectedFormat === 'conferences' && !evt.tags.includes('Conference')) return false;
      if (selectedCountry !== 'all' && evt.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      return true;
    });
  }, [category, selectedFormat, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Category link copied to clipboard!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP SUB-NAV BAR (Events | Companies | People) (Screenshot 1 Match)     */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-zinc-200 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'events'
                ? 'border-[#FF5A36] text-[#FF5A36]'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Events</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`py-3 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'companies'
                ? 'border-[#FF5A36] text-[#FF5A36]'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Companies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('people')}
            className={`py-3 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'people'
                ? 'border-[#FF5A36] text-[#FF5A36]'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>People</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CATEGORY HERO BANNER (Screenshot 1 Match)                              */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative rounded-2xl overflow-hidden bg-zinc-950 text-white shadow-sm">
          {/* Background Auditorium Crowd Image with Dark Overlay */}
          <img
            src={category.heroBanner}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />

          {/* Banner Content & Controls */}
          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                {category.name}
              </h1>

              {/* Stats line */}
              <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{category.followersCount}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{category.eventsCount}</span>
                </div>
              </div>
            </div>

            {/* Follow & Share buttons matching Screenshot 1 */}
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  isFollowing
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FF5A36] hover:bg-[#E84E2C] text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <span>Follow</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN MAIN CONTAINER (LEFT FILTERS, RIGHT EVENTS FEED)            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================================================================== */}
          {/* LEFT SIDEBAR: FILTERS & MATCHMAKING (4 of 12 cols) (Screenshots 1-3)  */}
          {/* ===================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Sign In Callout (Screenshot 1) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-zinc-600 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">ⓘ</span>
                <span>
                  <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </Link>{' '}
                  to unlock all features
                </span>
              </div>
            </div>

            {/* 2. WHO'S IN TOWN? Network Widget (Screenshot 1) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                {/* 3 Stacked Avatars (OB, L, R) */}
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF5A36] text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    OB
                  </div>
                  <div className="h-8 w-8 rounded-full bg-orange-400 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    LR
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
                    VK
                  </div>
                </div>

                <span className="text-xs font-extrabold text-[#FF5A36] uppercase tracking-wider">
                  Who's In Town?
                </span>
              </div>

              <p className="text-xs text-zinc-600 leading-snug">
                Network with professionals &amp; companies visiting your town.
              </p>

              <Link
                href="/login?redirect=network"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF5A36] hover:bg-[#E84E2C] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 3. Main Filter Card (Calendar, Format, Country, Category, Designation) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs divide-y divide-zinc-150 text-xs">
              
              {/* Calendar Filter (Screenshot 1) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('calendar')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Calendar</span>
                  <span className="text-zinc-400 text-[11px] font-normal">Select Date</span>
                </button>

                {openSections.calendar && (
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-zinc-100">
                    {['Any Date', 'This Month', 'Next 3 Months', '2026 - 2027'].map((d, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer text-zinc-600 hover:text-zinc-900">
                        <input type="radio" name="calDate" defaultChecked={i === 0} className="text-[#FF5A36] focus:ring-[#FF5A36]" />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Format Filter (Screenshot 1) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('format')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Format</span>
                  {openSections.format ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.format && (
                  <div className="mt-3 space-y-2.5">
                    {/* Business Events */}
                    <div>
                      <label className="flex items-center gap-2 font-bold text-[#FF5A36] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="rounded text-[#FF5A36] focus:ring-[#FF5A36]"
                        />
                        <span>Business Events</span>
                      </label>

                      {/* Sub options */}
                      <div className="ml-5 mt-2 space-y-2 text-zinc-600">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'all'}
                            onChange={() => setSelectedFormat('all')}
                            className="text-[#FF5A36] focus:ring-[#FF5A36]"
                          />
                          <span>All</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'tradeshows'}
                            onChange={() => setSelectedFormat('tradeshows')}
                            className="text-[#FF5A36] focus:ring-[#FF5A36]"
                          />
                          <span>Trade Shows</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900">
                          <input
                            type="radio"
                            name="subFormat"
                            checked={selectedFormat === 'conferences'}
                            onChange={() => setSelectedFormat('conferences')}
                            className="text-[#FF5A36] focus:ring-[#FF5A36]"
                          />
                          <span>Conferences</span>
                        </label>
                      </div>
                    </div>

                    {/* Social Events */}
                    <div>
                      <label className="flex items-center gap-2 font-medium text-zinc-600 cursor-pointer hover:text-zinc-900">
                        <input type="checkbox" className="rounded text-[#FF5A36] focus:ring-[#FF5A36]" />
                        <span>Social Events</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Country Filter (Screenshot 2) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('country')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Country / Region</span>
                  {openSections.country ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.country && (
                  <div className="mt-3 space-y-2">
                    {[
                      { name: 'India', count: '14.2k' },
                      { name: 'USA', count: '50.1k' },
                      { name: 'UK', count: '11.9k' },
                      { name: 'Germany', count: '9808' },
                      { name: 'Canada', count: '9455' }
                    ].map((cnt, i) => (
                      <label
                        key={i}
                        className="flex items-center justify-between text-zinc-600 hover:text-zinc-900 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCountry.toLowerCase() === cnt.name.toLowerCase()}
                            onChange={() => {
                              setSelectedCountry(
                                selectedCountry.toLowerCase() === cnt.name.toLowerCase() ? 'all' : cnt.name
                              );
                            }}
                            className="rounded text-[#FF5A36] focus:ring-[#FF5A36]"
                          />
                          <span>{cnt.name}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400">{cnt.count}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedCountry('all')}
                      className="text-[11px] font-bold text-blue-600 hover:underline pt-1 cursor-pointer block"
                    >
                      Reset Country
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filter (Screenshot 2) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('category')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Category</span>
                  {openSections.category ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.category && (
                  <div className="mt-3 space-y-2.5">
                    {/* Search topics input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for topics"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-3 pr-8 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                      />
                      <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Category Checkboxes */}
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto scrollbar-none">
                      {Object.values(CATEGORIES_CONFIG).map((cat) => {
                        const isCurrentCategory = cat.slug === category.slug;

                        return (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className={`flex items-center justify-between cursor-pointer py-0.5 ${
                              isCurrentCategory ? 'font-bold text-[#FF5A36]' : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isCurrentCategory}
                                readOnly
                                className="rounded text-[#FF5A36] focus:ring-[#FF5A36]"
                              />
                              <span className="truncate max-w-[170px]">{cat.shortName}</span>
                            </div>
                            <span className={`text-[11px] ${isCurrentCategory ? 'text-[#FF5A36]' : 'text-zinc-400'}`}>
                              {cat.eventsCount.split(' ')[0]}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Designation Filter (Screenshot 3) */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('designation')}
                  className="w-full flex items-center justify-between font-bold text-zinc-900 cursor-pointer"
                >
                  <span>Designation</span>
                  {openSections.designation ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {openSections.designation && (
                  <div className="mt-3 space-y-2">
                    {['Accountants', 'Database Administrators', 'Advertising Managers', 'Aerospace Engineers', 'Insurance Agents'].map((des, i) => (
                      <label key={i} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 cursor-pointer">
                        <input type="checkbox" className="rounded text-[#FF5A36] focus:ring-[#FF5A36]" />
                        <span>{des}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Locked / Gated Filters (Screenshot 3) */}
              <div className="p-4 space-y-2.5 text-zinc-500 bg-zinc-50/50">
                <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Entry Fee</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Rating</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer hover:text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Members</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              </div>

            </div>

            {/* Quick Links (Screenshot 3) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <Link href="/events" className="flex items-center justify-between font-bold text-zinc-800 hover:text-[#FF5A36]">
                <div>
                  <span className="block font-bold">Top 100 Events</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Discover and track top events</span>
                </div>
                <ArrowRight className="h-4 w-4 text-orange-500" />
              </Link>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: EVENTS FEED & PAGINATION (8 of 12 cols)                */}
          {/* ===================================================================== */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Sort Controls & Pagination Top Bar (Screenshot 1) */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2.5 px-4 shadow-2xs text-xs">
              <div className="flex items-center gap-4 font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSort('trending')}
                  className={`cursor-pointer transition-colors ${
                    activeSort === 'trending' ? 'text-[#FF5A36]' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Trending ⇅
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSort('date')}
                  className={`cursor-pointer transition-colors ${
                    activeSort === 'date' ? 'text-[#FF5A36]' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Date
                </button>
              </div>

              {/* Quick Pagination */}
              <div className="flex items-center gap-1 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`h-7 w-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === 1 ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={`h-7 w-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === 2 ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => (prev === 1 ? 2 : 1))}
                  className="h-7 w-7 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  »
                </button>
              </div>
            </div>

            {/* Event Cards List matching Screenshots 1, 2, 3 */}
            <div className="space-y-4">
              {filteredEvents.map((evt) => {
                const isInterested = Boolean(interestedMap[evt.id]);

                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 group"
                  >
                    {/* Top Row: Date Line & Logo/Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-zinc-700 block">
                          {evt.dates}
                        </span>
                        <Link
                          href={`/expo/${evt.slug}`}
                          className="text-base sm:text-lg font-bold text-[#0B4EA2] hover:text-[#083b7a] transition-colors leading-snug mt-0.5 block"
                        >
                          {evt.title}
                        </Link>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">
                          {evt.daysToGo} • {evt.edition}
                        </p>
                        <p className="text-xs text-zinc-500 font-normal mt-0.5">
                          {evt.venue ? `${evt.venue}, ` : ''}{evt.city}, {evt.country}
                        </p>
                      </div>

                      {/* Event Logo Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={evt.logo}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {evt.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Card Action Footer matching reference */}
                    <div className="pt-3 border-t border-zinc-150 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Interested button */}
                        <button
                          type="button"
                          onClick={() => toggleInterested(evt.id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                            isInterested
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          <Star className={`h-3 w-3 ${isInterested ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
                          <span>Interested</span>
                          <span className="text-zinc-400 font-normal ml-0.5">
                            {isInterested ? evt.interestedCount + 1 : evt.interestedCount}
                          </span>
                        </button>
                      </div>

                      {/* Right: Green Rating Pill & Share Icon */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                          <span>{evt.rating}</span>
                          <Star className="h-2.5 w-2.5 fill-current" />
                        </span>

                        <button
                          type="button"
                          onClick={handleShare}
                          className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                          title="Share event"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Sign-In CTA Banner (Screenshot 3 Match) */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <p className="text-sm font-bold text-zinc-900 leading-snug">
                Sign in to view more events or explore advanced search to access all data, advanced filters, and powerful search for a deeper dive.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E84E2C] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Sign in
                </Link>

                <Link
                  href="/events"
                  className="px-5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E84E2C] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Explore advanced search
                </Link>
              </div>
            </div>

            {/* Bottom Pagination */}
            <div className="flex items-center justify-end gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === 1 ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === 2 ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => (prev === 1 ? 2 : 1))}
                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
              >
                »
              </button>
            </div>

            {/* "More about Category" Accordion */}
            <div className="pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowMoreAbout(!showMoreAbout)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-[#083b7a] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <span>More about {category.shortName}</span>
                <span>{showMoreAbout ? '↑' : '↓'}</span>
              </button>

              {showMoreAbout && (
                <div className="mt-4 bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs text-xs text-zinc-600 leading-relaxed space-y-2 animate-in fade-in duration-200">
                  <h4 className="font-bold text-zinc-900 text-sm">About {category.name} on VisitExpo</h4>
                  <p>{category.description}</p>
                  <p>
                    VisitExpo provides real-time attendee accreditation, exhibitor matchmaking, stall inquiries, and digital entry badges for all verified events listed under {category.shortName}.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
