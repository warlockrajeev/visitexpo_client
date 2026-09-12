'use client';

/**
 * @file BrowseByCity.js
 * @description Dynamic "Browse Events By City" section connected directly to backend data.
 * Displays verified Indian exhibition hubs and global business destinations with live event counts,
 * custom landmark iconography, and interactive event filtering.
 */

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

/* ========================================================================= */
/* CUSTOM LANDMARK SVG ICONOGRAPHY FOR BACKEND CITIES                        */
/* ========================================================================= */

// Delhi (India Gate / Exhibition Pavilion)
const DelhiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 8h18v3H7zM9 11v16h14V11" />
    <path d="M12 27v-8c0-2 1.8-4 4-4s4 2 4 4v8" fill="currentColor" fillOpacity="0.1" />
    <path d="M6 27h20" />
  </svg>
);

// Mumbai (Gateway of India / Coastal Hub)
const MumbaiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10h16M7 27h18" />
    <path d="M9 10v17M23 10v17" />
    <path d="M12 27v-9c0-2 1.8-4 4-4s4 2 4 4v9" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 7l2-2h12l2 2" />
  </svg>
);

// Tech / Innovation Hub (Bengaluru / Hyderabad)
const TechIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="7" width="18" height="18" rx="3" />
    <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
    <path d="M16 3v4M16 25v4M3 16h4M25 16h4" />
  </svg>
);

// Chennai / Maritime Trade Port
const CoastalHubIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-teal-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 24c4-2 7 2 11 0s7-2 11 0" />
    <path d="M16 5v13M12 11l4-6 4 6M10 18h12" />
    <circle cx="16" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

// Ahmedabad / Industrial Manufacturing Hub
const IndustrialIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 26h22M6 26V14l6 4v-4l6 4v-8l8 5v9" />
    <rect x="9" y="21" width="3" height="5" fill="currentColor" fillOpacity="0.2" />
    <rect x="15" y="21" width="3" height="5" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

// Kolkata (Howrah Bridge / Cultural Landmark)
const BridgeIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h24M6 22L11 8l5 14 5-14 5 14" strokeWidth="1.5" />
    <path d="M11 8h10M4 25h24" />
  </svg>
);

// Jaipur / Heritage Palace
const PalaceIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 26h20M7 26V13l3-4 3 4v13M19 26V13l3-4 3 4v13" />
    <path d="M13 15h6v11h-6z" fill="currentColor" fillOpacity="0.15" />
    <circle cx="16" cy="9" r="2" fill="currentColor" />
  </svg>
);

// Colombo (Lotus Tower Landmark)
const LotusTowerIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-pink-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4v22M12 26h8" />
    <path d="M16 7c-4 3-4 8 0 11 4-3 4-8 0-11z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 12c-3 3-1 6 4 6 5 0 7-3 4-6" />
  </svg>
);

// Dhaka (National Monument Landmark)
const DhakaMonumentIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 26h22M16 5l-7 21h14z" fill="currentColor" fillOpacity="0.1" />
    <path d="M16 8l-4 18h8z" />
    <path d="M16 12l-2 14h4z" fill="currentColor" />
  </svg>
);

// London (London Eye & Big Ben Landmark)
const LondonIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="14" r="9" />
    <circle cx="16" cy="14" r="2.5" fill="currentColor" />
    <path d="M16 5v18M7 14h18M9.5 7.5l13 13M7.5 20.5l13-13" strokeWidth="1.1" opacity="0.6" />
    <path d="M12 27l4-4 4 4M10 27h12" />
  </svg>
);

// Dubai (Burj Al Arab Landmark)
const DubaiIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 27h14" />
    <path d="M14 27V5c5 2 10 9 10 16 0 2-1 6-4 6" />
    <path d="M14 9h6M14 14h8M14 19h7" strokeWidth="1.2" opacity="0.6" />
    <path d="M18 10h4" />
  </svg>
);

// Paris (Eiffel Tower Landmark)
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

// Germany (Brandenburg Gate / Frankfurt Messe Landmark)
const GermanyIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 6h4l-2-2z" fill="currentColor" opacity="0.4" />
    <path d="M5 10h22v3H5z" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 13v13M11 13v13M16 13v13M21 13v13M25 13v13" strokeWidth="1.4" />
    <path d="M4 26h24M3 28h26" />
  </svg>
);

// Italy (Fiera Milano / Roman Architecture)
const ItalyIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-amber-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12c0-3 4-5 11-5s11 2 11 5v12H5V12z" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 16h4v8H8zM14 16h4v8h-4zM20 16h4v8h-4z" />
    <path d="M4 25h24" />
  </svg>
);

// Bangkok (Temple Tower / Asian Mega Hub)
const BangkokIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4v4M14 8l2-4 2 4M10 12l6-4 6 4M8 16h16M7 20h18M6 26h20" />
    <path d="M12 26v-6h8v6" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// Singapore (Marina Bay Sands & Modern Skyline)
const SingaporeIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7c7-2 13-2 20 0l-2 3c-6-1-11-1-16 0z" fill="currentColor" fillOpacity="0.2" />
    <path d="M9 10v16M16 10v16M23 10v16" strokeWidth="2" />
    <path d="M5 26h22" />
  </svg>
);

// Spain (Madrid IFEMA / Mediterranean Sun)
const SpainIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="14" r="6" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 4v4M16 20v4M6 14h4M22 14h4M9 7l3 3M20 18l3 3M9 21l3-3M20 10l3-3" strokeWidth="1.3" />
    <path d="M10 26h12" />
  </svg>
);

// Middle East Hub (Jeddah / Riyadh Gateway)
const SaudiHubIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l4 8h-8zM14 12h4v14h-4z" fill="currentColor" fillOpacity="0.15" />
    <path d="M8 26h16M11 20h10" />
  </svg>
);

/* ========================================================================= */
/* BASELINE CITIES WITH LIVE DATABASE COUNTS                                  */
/* ========================================================================= */

const INITIAL_INDIA_CITIES = [
  { id: 'delhi', name: 'New Delhi', count: 340, countFormatted: '340 Events', icon: <DelhiIcon /> },
  { id: 'mumbai', name: 'Mumbai', count: 338, countFormatted: '338 Events', icon: <MumbaiIcon /> },
  { id: 'chennai', name: 'Chennai', count: 75, countFormatted: '75 Events', icon: <CoastalHubIcon /> },
  { id: 'ahmedabad', name: 'Ahmedabad', count: 72, countFormatted: '72 Events', icon: <IndustrialIcon /> },
  { id: 'hyderabad', name: 'Hyderabad', count: 72, countFormatted: '72 Events', icon: <TechIcon /> },
  { id: 'bengaluru', name: 'Bengaluru', count: 55, countFormatted: '55 Events', icon: <TechIcon /> },
  { id: 'pune', name: 'Pune', count: 40, countFormatted: '40 Events', icon: <IndustrialIcon /> },
  { id: 'kolkata', name: 'Kolkata', count: 22, countFormatted: '22 Events', icon: <BridgeIcon /> },
  { id: 'noida', name: 'Greater Noida', count: 21, countFormatted: '21 Events', icon: <DelhiIcon /> },
  { id: 'indore', name: 'Indore', count: 10, countFormatted: '10 Events', icon: <DelhiIcon /> },
  { id: 'coimbatore', name: 'Coimbatore', count: 8, countFormatted: '8 Events', icon: <TechIcon /> },
  { id: 'jaipur', name: 'Jaipur', count: 6, countFormatted: '6 Events', icon: <PalaceIcon /> }
];

const INITIAL_GLOBAL_CITIES = [
  { id: 'colombo', name: 'Colombo', count: 51, countFormatted: '51 Events', icon: <LotusTowerIcon /> },
  { id: 'dhaka', name: 'Dhaka', count: 31, countFormatted: '31 Events', icon: <DhakaMonumentIcon /> },
  { id: 'germany', name: 'Germany', count: 23, countFormatted: '23 Events', icon: <GermanyIcon /> },
  { id: 'italy', name: 'Italy', count: 11, countFormatted: '11 Events', icon: <ItalyIcon /> },
  { id: 'bangkok', name: 'Bangkok', count: 9, countFormatted: '9 Events', icon: <BangkokIcon /> },
  { id: 'paris', name: 'Paris', count: 8, countFormatted: '8 Events', icon: <ParisIcon /> },
  { id: 'singapore', name: 'Singapore', count: 6, countFormatted: '6 Events', icon: <SingaporeIcon /> },
  { id: 'spain', name: 'Spain', count: 5, countFormatted: '5 Events', icon: <SpainIcon /> },
  { id: 'london', name: 'London', count: 4, countFormatted: '4 Events', icon: <LondonIcon /> },
  { id: 'dubai', name: 'Dubai', count: 6, countFormatted: '6 Events', icon: <DubaiIcon /> },
  { id: 'jeddah', name: 'Jeddah', count: 2, countFormatted: '2 Events', icon: <SaudiHubIcon /> },
  { id: 'riyadh', name: 'Riyadh', count: 2, countFormatted: '2 Events', icon: <SaudiHubIcon /> }
];

export default function BrowseByCity({ onSelectCity, activeCity, onResetCity }) {
  const [hubTab, setHubTab] = useState('global'); // 'global' | 'india'
  const [indiaCities, setIndiaCities] = useState(INITIAL_INDIA_CITIES);
  const [globalCities, setGlobalCities] = useState(INITIAL_GLOBAL_CITIES);

  // Fetch live city counts from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchBackendCities() {
      try {
        const res = await fetch('/api/cities');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            if (isMounted) {
              if (Array.isArray(json.data.indiaCities) && json.data.indiaCities.length > 0) {
                setIndiaCities((prev) =>
                  prev.map((c) => {
                    const match = json.data.indiaCities.find((ic) => ic.name.toLowerCase() === c.name.toLowerCase());
                    return match ? { ...c, count: match.count, countFormatted: match.countFormatted } : c;
                  })
                );
              }
              if (Array.isArray(json.data.globalCities) && json.data.globalCities.length > 0) {
                setGlobalCities((prev) =>
                  prev.map((c) => {
                    const match = json.data.globalCities.find((gc) => gc.name.toLowerCase() === c.name.toLowerCase());
                    return match ? { ...c, count: match.count, countFormatted: match.countFormatted } : c;
                  })
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not refresh /api/cities live:', err.message);
      }
    }

    fetchBackendCities();
    return () => {
      isMounted = false;
    };
  }, []);

  const citiesToDisplay = hubTab === 'global' ? globalCities : indiaCities;

  return (
    <div className="space-y-4 pt-2">
      {/* Header with Title, Subtitle and Hub Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Browse Events By City
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
              24 Verified Hubs
            </span>
          </div>
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
              Global Destinations ({globalCities.length})
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
              India Expo Hubs ({indiaCities.length})
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

              {/* City & Real Event Count */}
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
                  {city.countFormatted || `${city.count} Events`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
