'use client';

/**
 * @file BrowseByCity.js
 * @description 10times.com-style "Browse Events By City" section.
 * Renders 12 global event capitals with landmark iconography and event counters,
 * plus a quick toggle for Indian exhibition hubs.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Building,
  Landmark,
  Compass,
  ArrowRight
} from 'lucide-react';

// Exact 12 cities from 10times screenshot
const GLOBAL_CITIES = [
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    count: '31.2k Events',
    icon: '🎡' // London Eye
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    count: '11.2k Events',
    icon: '🏨' // Burj Al Arab
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    count: '8235 Events',
    icon: '🗼' // Eiffel Tower
  },
  {
    id: 'washington',
    name: 'Washington DC',
    country: 'United States',
    count: '11.4k Events',
    icon: '🏛️' // Capitol / White House
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    count: '7879 Events',
    icon: '🏛️' // Brandenburg Gate
  },
  {
    id: 'new_york',
    name: 'New York',
    country: 'United States',
    count: '9350 Events',
    icon: '🗽' // Statue of Liberty
  },
  {
    id: 'chicago',
    name: 'Chicago',
    country: 'United States',
    count: '10.6k Events',
    icon: '🏙️' // Willis Tower
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    country: 'United States',
    count: '6712 Events',
    icon: '☀️' // Desert Sun / Arizona
  },
  {
    id: 'orlando',
    name: 'Orlando',
    country: 'United States',
    count: '7714 Events',
    icon: '🏰' // Magic Kingdom / Castle
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    count: '6121 Events',
    icon: '🌬️' // Windmill
  },
  {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    count: '7922 Events',
    icon: '🗼' // CN Tower
  },
  {
    id: 'kuala_lumpur',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    count: '6580 Events',
    icon: '🏙️' // Petronas Towers
  }
];

// Top Indian exhibition centers
const INDIA_CITIES = [
  { id: 'delhi', name: 'New Delhi', country: 'Bharat Mandapam & Pragati Maidan', count: '14.8k Events', icon: '🇮🇳' },
  { id: 'noida', name: 'Greater Noida', country: 'India Expo Mart (IEML)', count: '9.2k Events', icon: '🏢' },
  { id: 'mumbai', name: 'Mumbai', country: 'Jio World & NESCO Goregaon', count: '16.5k Events', icon: '🌊' },
  { id: 'bengaluru', name: 'Bengaluru', country: 'BIEC Bangalore', count: '12.1k Events', icon: '💻' },
  { id: 'chennai', name: 'Chennai', country: 'Chennai Trade Centre', count: '7.4k Events', icon: '🏛️' },
  { id: 'hyderabad', name: 'Hyderabad', country: 'HITEX Exhibition Center', count: '8.3k Events', icon: '💎' }
];

export default function BrowseByCity({ onSelectCity, activeCity, onResetCity }) {
  const [hubTab, setHubTab] = useState('global'); // 'global' | 'india'

  const citiesToDisplay = hubTab === 'global' ? GLOBAL_CITIES : INDIA_CITIES;

  return (
    <section className="py-8 bg-zinc-50/50 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Header with Title and Hub Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Browse Events By City
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Explore leading international business trade shows and exhibitions by host city.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Hub Selector Tabs */}
            <div className="inline-flex rounded-xl bg-zinc-200/70 p-1 text-xs font-semibold text-zinc-600">
              <button
                type="button"
                onClick={() => setHubTab('global')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  hubTab === 'global'
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                    : 'hover:text-zinc-900'
                }`}
              >
                Global Destinations (12)
              </button>
              <button
                type="button"
                onClick={() => setHubTab('india')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  hubTab === 'india'
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                    : 'hover:text-zinc-900'
                }`}
              >
                India Expo Hubs
              </button>
            </div>

            {activeCity && (
              <button
                type="button"
                onClick={onResetCity}
                className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer"
              >
                Clear ({activeCity})
              </button>
            )}
          </div>
        </div>

        {/* 12-Card Grid (2 rows of 6 on large screens) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {citiesToDisplay.map((city) => {
            const isSelected = activeCity?.toLowerCase() === city.name.toLowerCase();

            return (
              <button
                key={city.id}
                type="button"
                onClick={() => onSelectCity(city.name)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-[#FFCC00]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md text-zinc-900'
                }`}
              >
                {/* Landmark Icon */}
                <div className="text-2xl h-8 w-8 flex items-center justify-start">
                  <span>{city.icon}</span>
                </div>

                {/* City & Event Count */}
                <div className="pt-2">
                  <div
                    className={`font-semibold text-xs sm:text-sm line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {city.name}
                  </div>
                  <div
                    className={`text-[11px] font-normal mt-0.5 ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {city.count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
