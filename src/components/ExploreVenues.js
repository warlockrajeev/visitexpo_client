'use client';

/**
 * @file ExploreVenues.js
 * @description Clean showcase displaying exactly 6 premier Indian exhibition venues
 * matching the 3-column reference design (venue name with orange star, city & state, and event counts).
 */

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin, Star } from 'lucide-react';

const VENUES = [
  {
    id: 'bharat_mandapam',
    name: 'Bharat Mandapam Exhibition Complex',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    totalEvents: 342,
    upcomingEvents: 88,
    searchTerm: 'Pragati Maidan'
  },
  {
    id: 'yashobhoomi',
    name: 'Yashobhoomi Convention Centre',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    totalEvents: 229,
    upcomingEvents: 57,
    searchTerm: 'Yashobhoomi'
  },
  {
    id: 'jio_world',
    name: 'Jio World Convention Centre',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    totalEvents: 285,
    upcomingEvents: 64,
    searchTerm: 'Jio World'
  },
  {
    id: 'bec_mumbai',
    name: 'Bombay Exhibition Centre (NESCO)',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    totalEvents: 651,
    upcomingEvents: 105,
    searchTerm: 'Bombay Exhibition Centre'
  },
  {
    id: 'biec_bengaluru',
    name: 'Bangalore International Exhibition Centre (BIEC)',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    totalEvents: 312,
    upcomingEvents: 52,
    searchTerm: 'BIEC'
  },
  {
    id: 'india_expo_centre',
    name: 'India Expo Centre & Mart',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    totalEvents: 390,
    upcomingEvents: 76,
    searchTerm: 'India Expo Centre'
  }
];

export default function ExploreVenues({ onSelectVenue }) {
  return (
    <section id="venues" className="space-y-3.5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
          Explore Venues
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {VENUES.map((venue) => (
          <Link
            key={venue.id}
            href={`/venue/${venue.id.replace(/_/g, '-')}`}
            className="group relative flex min-h-48 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_40px_-20px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-50/80 blur-2xl transition-colors duration-300 group-hover:bg-blue-100/80" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors duration-300 group-hover:bg-blue-100">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Exhibition venue
                  </p>
                  <h3 className="text-[14px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-blue-700 sm:text-[15px]">
                    {venue.name}
                    <Star
                      className="ml-1.5 inline h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-label="Featured venue"
                    />
                  </h3>
                </div>
              </div>

              <ArrowUpRight
                className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600"
                aria-hidden="true"
              />
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <p className="truncate">
                {venue.city} <span className="text-zinc-300">·</span> {venue.state}, {venue.country}
              </p>
            </div>

            <div className="relative mt-auto pt-4">
              <div className="flex items-end justify-between gap-3 border-t border-zinc-100 pt-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Total events
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-zinc-800">
                    {venue.totalEvents.toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {venue.upcomingEvents.toLocaleString()} upcoming
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
