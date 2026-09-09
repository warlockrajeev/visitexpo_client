'use client';

/**
 * @file BrowseByCity.js
 * @description 10times.com-style "Browse Events By City" section matching user reference screenshot.
 * Renders 12 global event capitals with custom landmark iconography and event counters,
 * plus a quick toggle for Indian exhibition hubs.
 */

import React, { useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';

/* ========================================================================= */
/* CUSTOM LANDMARK SVG ICONOGRAPHY MATCHING 10TIMES SCREENSHOT              */
/* ========================================================================= */

const LondonIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="14" r="10" />
    <circle cx="16" cy="14" r="2.5" fill="currentColor" />
    <path d="M16 4v20M6 14h20M9 7l14 14M7 21L21 7" strokeWidth="1.2" opacity="0.6" />
    <path d="M12 28l4-4 4 4M10 28h12" />
  </svg>
);

const DubaiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 27h14" />
    <path d="M14 27V5c5 2 10 9 10 16 0 2-1 6-4 6" />
    <path d="M14 9h6M14 14h8M14 19h7" strokeWidth="1.2" opacity="0.6" />
    <path d="M18 10h4" />
  </svg>
);

const ParisIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4v3" />
    <path d="M14 7h4l-1 8h-2z" />
    <path d="M12 15h8" />
    <path d="M13 15l-4 12h14l-4-12" />
    <path d="M11 23c2-2 4-2 6-2s4 0 6 2" />
    <path d="M10 27h12" />
  </svg>
);

const WashingtonIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-teal-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 5v2" />
    <path d="M12 11c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    <path d="M8 14h16M7 26h18M6 28h20" />
    <path d="M9 14v12M13 14v12M16 14v12M19 14v12M23 14v12" strokeWidth="1.2" />
  </svg>
);

const BerlinIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 6h4l-2-2z" fill="currentColor" opacity="0.4" />
    <path d="M5 10h22v3H5z" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 13v13M11 13v13M16 13v13M21 13v13M25 13v13" strokeWidth="1.4" />
    <path d="M4 26h24M3 28h26" />
  </svg>
);

const NewYorkIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 6l-2 3M24 8l-3 1M20 5v4" stroke="currentColor" />
    <circle cx="22" cy="7" r="1" fill="currentColor" />
    <path d="M14 11l2-3 2 3-1 1-2-1z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 14c1 0 3-1 4-1s3 1 4 1l-1 13h-6z" />
    <path d="M19 13l3-4" />
  </svg>
);

const ChicagoIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4v4M19 4v4" />
    <path d="M11 8h10v6h-2v6h-2v7h-2v-7h-2v-6h-2z" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 27h14" />
  </svg>
);

const PhoenixIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="11" r="5" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 3v3M16 19v3M8 11H5M27 11h-3M10 5l2 2M22 17l2 2M10 17l2-2M22 5l-2 2" strokeWidth="1.2" opacity="0.6" />
    <path d="M16 27v-8M13 23h3M13 21v2M19 25h-3M19 23v2" strokeWidth="1.6" />
  </svg>
);

const OrlandoIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 8l2-3 2 3M20 8l2-3 2 3M14 6l2-3 2 3" />
    <path d="M8 8v19h16V8M13 27v-5c0-1.5 1-3 3-3s3 1.5 3 3v5" />
    <path d="M12 12h2M18 12h2M15 15h2" strokeWidth="1.2" />
  </svg>
);

const AmsterdamIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 27l2-14h4l2 14z" fill="currentColor" fillOpacity="0.1" />
    <circle cx="16" cy="13" r="1.5" fill="currentColor" />
    <path d="M16 13L9 6M16 13l7-7M16 13l7 7M16 13l-7 7" strokeWidth="1.8" />
    <path d="M8 7h2M22 7h2M22 19h2M8 19h2" strokeWidth="1.2" />
  </svg>
);

const TorontoIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3v24" strokeWidth="1.8" />
    <path d="M12 14c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5c0 1.8-1.5 3-4 3s-4-1.2-4-3z" fill="currentColor" fillOpacity="0.2" />
    <path d="M13 27h6M14 24h4" />
  </svg>
);

const KualaLumpurIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4v4M22 4v4" />
    <path d="M8 8l2-2 2 2v19H8zM20 8l2-2 2 2v19h-4z" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 17h8" strokeWidth="2" />
    <path d="M7 27h18" />
  </svg>
);

// India Landmarks
const DelhiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 8h18v3H7zM9 11v16h14V11" />
    <path d="M12 27v-8c0-2 1.8-4 4-4s4 2 4 4v8" fill="currentColor" fillOpacity="0.1" />
    <path d="M6 27h20" />
  </svg>
);

const MumbaiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10h16M7 27h18" />
    <path d="M9 10v17M23 10v17" />
    <path d="M12 27v-9c0-2 1.8-4 4-4s4 2 4 4v9" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 7l2-2h12l2 2" />
  </svg>
);

const TechIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="7" width="18" height="18" rx="3" />
    <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
    <path d="M16 3v4M16 25v4M3 16h4M25 16h4" />
  </svg>
);

/* ========================================================================= */
/* CITY DATA (12 GLOBAL CITIES FROM 10TIMES SCREENSHOT + INDIA HUBS)         */
/* ========================================================================= */

const GLOBAL_CITIES = [
  { id: 'london', name: 'London', count: '31.2k Events', icon: <LondonIcon /> },
  { id: 'dubai', name: 'Dubai', count: '11.2k Events', icon: <DubaiIcon /> },
  { id: 'paris', name: 'Paris', count: '8235 Events', icon: <ParisIcon /> },
  { id: 'washington', name: 'Washington DC', count: '11.4k Events', icon: <WashingtonIcon /> },
  { id: 'berlin', name: 'Berlin', count: '7879 Events', icon: <BerlinIcon /> },
  { id: 'new_york', name: 'New York', count: '9350 Events', icon: <NewYorkIcon /> },
  { id: 'chicago', name: 'Chicago', count: '10.6k Events', icon: <ChicagoIcon /> },
  { id: 'phoenix', name: 'Phoenix', count: '6712 Events', icon: <PhoenixIcon /> },
  { id: 'orlando', name: 'Orlando', count: '7714 Events', icon: <OrlandoIcon /> },
  { id: 'amsterdam', name: 'Amsterdam', count: '6121 Events', icon: <AmsterdamIcon /> },
  { id: 'toronto', name: 'Toronto', count: '7922 Events', icon: <TorontoIcon /> },
  { id: 'kuala_lumpur', name: 'Kuala Lumpur', count: '6580 Events', icon: <KualaLumpurIcon /> }
];

const INDIA_CITIES = [
  { id: 'delhi', name: 'New Delhi', count: '14.8k Events', icon: <DelhiIcon /> },
  { id: 'mumbai', name: 'Mumbai', count: '16.5k Events', icon: <MumbaiIcon /> },
  { id: 'noida', name: 'Greater Noida', count: '9.2k Events', icon: <DelhiIcon /> },
  { id: 'bengaluru', name: 'Bengaluru', count: '12.1k Events', icon: <TechIcon /> },
  { id: 'hyderabad', name: 'Hyderabad', count: '8.3k Events', icon: <DelhiIcon /> },
  { id: 'chennai', name: 'Chennai', count: '7.4k Events', icon: <MumbaiIcon /> }
];

export default function BrowseByCity({ onSelectCity, activeCity, onResetCity }) {
  const [hubTab, setHubTab] = useState('global'); // 'global' | 'india'

  const citiesToDisplay = hubTab === 'global' ? GLOBAL_CITIES : INDIA_CITIES;

  return (
    <div className="space-y-4 pt-2">
      {/* Header with Title, Subtitle and Hub Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Browse Events By City
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Explore leading business trade shows and exhibitions by global &amp; domestic host cities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Hub Selector Switcher */}
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

      {/* 12-Card Grid (6 Columns x 2 Rows on Desktop) matching Screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {citiesToDisplay.map((city) => {
          const isSelected = activeCity?.toLowerCase() === city.name.toLowerCase();

          return (
            <button
              key={city.id}
              type="button"
              onClick={() => onSelectCity(city.name)}
              className={`text-left p-4 sm:p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 sm:h-32 group ${
                isSelected
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-[#FFCC00]'
                  : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 text-zinc-900 shadow-2xs'
              }`}
            >
              {/* Landmark Icon */}
              <div className="h-7 w-7 flex items-center justify-start group-hover:scale-108 transition-transform">
                {city.icon}
              </div>

              {/* City & Event Count */}
              <div>
                <div
                  className={`font-bold text-xs sm:text-[13px] leading-snug line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-[#FF2E63] transition-colors'
                  }`}
                >
                  {city.name}
                </div>
                <div
                  className={`text-[11px] font-medium mt-0.5 ${
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
  );
}
