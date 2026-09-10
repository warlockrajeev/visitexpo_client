'use client';

/**
 * @file ExploreVenues.js
 * @description Clean showcase displaying exactly 6 premier Indian exhibition venues
 * matching the 3-column reference design (venue name with orange star, city & state, and event counts).
 */

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const VENUES = [
  {
    id: 'bharat_mandapam',
    name: 'Bharat Mandapam Exhibition Complex',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    totalEvents: '342 Total Events',
    upcomingEvents: '88 Upcoming Events',
    searchTerm: 'Pragati Maidan'
  },
  {
    id: 'yashobhoomi',
    name: 'Yashobhoomi Convention Centre',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    totalEvents: '229 Total Events',
    upcomingEvents: '57 Upcoming Events',
    searchTerm: 'Yashobhoomi'
  },
  {
    id: 'jio_world',
    name: 'Jio World Convention Centre',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    totalEvents: '285 Total Events',
    upcomingEvents: '64 Upcoming Events',
    searchTerm: 'Jio World'
  },
  {
    id: 'bec_mumbai',
    name: 'Bombay Exhibition Centre (NESCO)',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    totalEvents: '651 Total Events',
    upcomingEvents: '105 Upcoming Events',
    searchTerm: 'Bombay Exhibition Centre'
  },
  {
    id: 'biec_bengaluru',
    name: 'Bangalore International Exhibition Centre (BIEC)',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    totalEvents: '312 Total Events',
    upcomingEvents: '52 Upcoming Events',
    searchTerm: 'BIEC'
  },
  {
    id: 'india_expo_centre',
    name: 'India Expo Centre & Mart',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    totalEvents: '390 Total Events',
    upcomingEvents: '76 Upcoming Events',
    searchTerm: 'India Expo Centre'
  }
];

export default function ExploreVenues({ onSelectVenue }) {
  return (
    <section id="venues" className="space-y-3.5">
      {/* Header matching Screenshot 2 */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
          Explore Venues
        </h2>
      </div>

      {/* 3-Column Clean Cards Grid (2 rows of 3 = 6 venues) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {VENUES.map((venue) => (
          <Link
            key={venue.id}
            href={`/venue/${venue.id.replace(/_/g, '-')}`}
            className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
          >
            <div>
              {/* Line 1: Blue Venue Name with orange star */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] sm:text-[15px] font-medium text-[#1A56DB] group-hover:text-[#0B4EA2] transition-colors leading-snug">
                  {venue.name}
                  <span className="inline-block text-[#FF7A00] ml-1.5 text-xs select-none">
                    ★
                  </span>
                </h3>

                <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-[#1A56DB] shrink-0 transition-colors opacity-0 group-hover:opacity-100 mt-0.5" />
              </div>

              {/* Line 2: City • State, India */}
              <p className="text-xs text-zinc-500 font-normal mt-1">
                {venue.city} • {venue.state}, {venue.country}
              </p>
            </div>

            {/* Line 3: Total Events • Upcoming Events */}
            <div className="text-xs text-zinc-500 font-normal mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span>{venue.totalEvents}</span>
              <span className="text-zinc-300">•</span>
              <span className="inline-flex items-center gap-1 text-zinc-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {venue.upcomingEvents}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
