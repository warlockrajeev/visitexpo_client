'use client';

/**
 * @file app/venues/page.js
 * @description Dedicated Venue Profiles Directory page for VisitExpo.
 * Displays premier exhibition and convention centers with total/upcoming events and interactive exploration.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import { VENUES_DATA, slugifyVenue } from '../../data/venuesData.js';
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  Search,
  Building,
  ArrowRight,
  Train,
  CheckCircle2,
  Navigation,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function VenuesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [apiVenues, setApiVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch backend venues with custom images & media
  useEffect(() => {
    let isMounted = true;
    const fetchVenues = async () => {
      try {
        const res = await axios.get(`${API_URL}/venues`);
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setApiVenues(res.data.data);
        }
      } catch (err) {
        console.warn('Using curated venue data pool:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchVenues();
    return () => { isMounted = false; };
  }, []);

  // Merge pre-curated venues with database-saved custom images and new venues
  const allVenues = useMemo(() => {
    const list = Object.values(VENUES_DATA).map((v) => ({ ...v }));
    
    if (Array.isArray(apiVenues)) {
      apiVenues.forEach((v) => {
        const norm = (v.name || v.venueName || '').toLowerCase();
        const vSlug = v.slug || slugifyVenue(v.name || v.venueName || '');
        
        const existingIdx = list.findIndex(
          (curated) =>
            curated.slug === vSlug ||
            curated.name.toLowerCase() === norm ||
            (v.shortName && curated.shortName.toLowerCase() === v.shortName.toLowerCase())
        );

        if (existingIdx !== -1) {
          // Merge custom database images and specs over curated defaults
          list[existingIdx] = {
            ...list[existingIdx],
            ...v,
            heroBanner: v.heroBanner || list[existingIdx].heroBanner,
            logoThumbnail: v.logoThumbnail || list[existingIdx].logoThumbnail,
            gallery: Array.isArray(v.gallery) && v.gallery.length > 0 ? v.gallery : list[existingIdx].gallery,
            eventsHosted: v.liveTotalEvents ? `${v.liveTotalEvents}+` : (v.eventsHosted || list[existingIdx].eventsHosted),
            upcomingEventsCount: v.liveUpcomingEvents !== undefined ? `${v.liveUpcomingEvents}+` : (v.upcomingEventsCount || list[existingIdx].upcomingEventsCount)
          };
        } else if ((v.name || v.venueName) && (v.name || v.venueName).length > 3) {
          list.push({
            id: vSlug,
            slug: vSlug,
            name: v.name || v.venueName,
            shortName: v.shortName || (v.name || v.venueName).split(',')[0],
            tagline: v.tagline || `Convention & Exhibition Center in ${v.city || 'India'}`,
            city: v.city || 'India',
            country: v.country || 'India',
            address: v.address || `${v.name || v.venueName}, ${v.city || ''}, ${v.country || 'India'}`,
            metro: v.metro || 'Rapid transit & highway connectivity',
            heroBanner: v.heroBanner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
            logoThumbnail: v.logoThumbnail || 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
            rating: v.rating || 4.8,
            eventsHosted: v.liveTotalEvents ? `${v.liveTotalEvents}+` : (v.eventsHosted || '10+'),
            upcomingEventsCount: v.liveUpcomingEvents !== undefined ? `${v.liveUpcomingEvents}+` : (v.upcomingEventsCount || '4+'),
            totalArea: v.totalArea || '40,000+ sqm Indoor Space',
            reputationText: v.reputationText || 'Recognized Venue'
          });
        }
      });
    }

    return list;
  }, [apiVenues]);

  // Unique cities list for filter pills
  const cities = useMemo(() => {
    const set = new Set(allVenues.map((v) => v.city).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allVenues]);

  // Filtered venues list
  const filteredVenues = useMemo(() => {
    return allVenues.filter((v) => {
      const matchesCity = selectedCity === 'All' || v.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        v.shortName?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q);
      return matchesCity && matchesSearch;
    });
  }, [allVenues, selectedCity, searchQuery]);

  // Calculate aggregated stats
  const totalHostedCount = useMemo(() => {
    return allVenues.reduce((acc, v) => acc + (parseInt(v.eventsHosted, 10) || 10), 0);
  }, [allVenues]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
      <Navbar />

      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 text-xs text-zinc-500 flex items-center gap-1.5 overflow-x-auto">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <span className="font-semibold text-zinc-800">Venues</span>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <span className="text-zinc-500">Exhibition &amp; Convention Centers</span>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="bg-gradient-to-b from-white via-zinc-50 to-zinc-100/70 border-b border-zinc-200/80 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Building className="h-3.5 w-3.5 text-amber-600" />
              <span>Global Convention &amp; Trade Venues</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              Venue Profiles &amp; Exhibition Complexes
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Explore premier convention centers, hall capacities, live and upcoming trade fairs, and interactive map locations worldwide.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-1 text-xs">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs">
              <Building className="h-4 w-4 text-primary" />
              <span className="font-extrabold text-zinc-900">{allVenues.length}</span>
              <span className="text-zinc-500">Exhibition Complexes</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span className="font-extrabold text-zinc-900">{totalHostedCount.toLocaleString()}+</span>
              <span className="text-zinc-500">Events Hosted</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span className="font-extrabold text-zinc-900">{cities.length - 1}</span>
              <span className="text-zinc-500">Major Cities</span>
            </div>
          </div>

          {/* Search Bar & City Filters */}
          <div className="space-y-3 pt-2">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search venue by name, city, address, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-zinc-200 text-xs sm:text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* City Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Filter:
              </span>
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
            <span>Showing {filteredVenues.length} Venue Profiles</span>
            {selectedCity !== 'All' && (
              <span className="text-xs font-normal text-zinc-500">in {selectedCity}</span>
            )}
          </h2>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200 p-8 space-y-3">
            <Building className="h-10 w-10 text-zinc-300 mx-auto" />
            <h3 className="font-bold text-base text-zinc-900">No Venues Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              We couldn&apos;t find any venues matching &quot;{searchQuery}&quot; in {selectedCity}. Try searching with another keyword.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCity('All'); }}
              className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const venueSlug = venue.slug || slugifyVenue(venue.name);

              return (
                <div
                  key={venue.id || venueSlug}
                  className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Banner Image with Overlay Badges */}
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={venue.heroBanner}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Location Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                        <MapPin className="h-3 w-3 text-[#FF2E63]" />
                        <span>{venue.city}, {venue.country}</span>
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-xs">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{venue.rating || 4.8}</span>
                      </span>
                    </div>

                    {/* Bottom Title Bar Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-extrabold text-base leading-snug drop-shadow-sm line-clamp-1">
                        {venue.name}
                      </h3>
                      <p className="text-[11px] text-zinc-200 drop-shadow-sm line-clamp-1 mt-0.5">
                        {venue.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/60">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs font-black text-orange-950">{venue.eventsHosted}</span>
                        </div>
                        <span className="text-[10px] text-orange-800 font-semibold uppercase">Total Events</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                        <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-black text-emerald-950">{venue.upcomingEventsCount}</span>
                        </div>
                        <span className="text-[10px] text-emerald-800 font-semibold uppercase">Upcoming</span>
                      </div>
                    </div>

                    {/* Address & Transit Snippet */}
                    <div className="space-y-1.5 text-xs text-zinc-600">
                      <p className="flex items-start gap-1.5 line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{venue.address}</span>
                      </p>
                      {venue.metro && (
                        <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 line-clamp-1">
                          <Train className="h-3 w-3 text-blue-600 shrink-0" />
                          <span>{venue.metro}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                      <Link
                        href={`/venue/${venueSlug}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 group/btn shadow-2xs"
                      >
                        <span>View Venue Profile</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#FFCC00] group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>

                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors"
                        title="Open in Google Maps"
                      >
                        <Navigation className="h-4 w-4 text-blue-600" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
