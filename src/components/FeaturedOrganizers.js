'use client';

/**
 * @file FeaturedOrganizers.js
 * @description Worldwide leading event organisers logo showcase matching 10times UI.
 * Features a clean horizontal logo card slider with navigation arrows and hover tooltips.
 */

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ORGANIZERS = [
  {
    id: 'medicall',
    name: 'Medicall - Hospital & Healthcare Expo',
    shortName: 'Medicall',
    searchTerm: 'Medicall',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center">
          <span className="text-rose-600 font-extrabold text-lg tracking-tight font-serif italic">medicall</span>
          <span className="text-rose-500 text-xs font-bold -mt-2">)</span>
        </div>
        <span className="text-[8px] text-zinc-400 tracking-wider -mt-1 font-medium">health expo</span>
      </div>
    )
  },
  {
    id: 'canton_fair_ad',
    name: 'Canton Fair Advertising Co., Ltd.',
    shortName: 'Canton Fair Ad',
    searchTerm: 'Canton Fair',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <svg viewBox="0 0 100 36" className="w-16 h-7" fill="none">
          <path
            d="M 10 24 C 30 10, 70 8, 90 20 C 68 14, 32 15, 10 24 Z"
            fill="url(#canton-grad)"
          />
          <path
            d="M 22 28 C 45 18, 75 18, 88 27 C 70 23, 40 23, 22 28 Z"
            fill="#9CA3AF"
          />
          <defs>
            <linearGradient id="canton-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4B5563" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-[9px] font-bold text-zinc-800 tracking-tight leading-none mt-0.5">
          canton fair ad
        </span>
      </div>
    )
  },
  {
    id: 'teyin',
    name: 'TEYIN International Exhibition Group',
    shortName: 'TEYIN',
    searchTerm: 'Teyin',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-12 h-6 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mb-2.5" />
          <svg viewBox="0 0 60 20" className="absolute bottom-0 w-12 h-3" fill="none">
            <path d="M 5 16 C 20 6, 40 6, 55 16" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 12 18 C 25 10, 35 10, 48 18" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[11px] font-black text-blue-700 tracking-widest italic mt-0.5">
          TEYIN
        </span>
      </div>
    )
  },
  {
    id: 'adsale',
    name: 'Adsale Exhibition Services Ltd.',
    shortName: 'ADSALE',
    searchTerm: 'Adsale',
    logo: (
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs font-black text-[#0B4EA2] tracking-wider">ADSALE</span>
        <span className="bg-[#FF6600] text-white text-[9px] font-bold px-1 py-0.5 rounded-xs leading-none">
          雅式
        </span>
      </div>
    )
  },
  {
    id: 'messe_frankfurt',
    name: 'Messe Frankfurt Middle East GmbH',
    shortName: 'Messe Frankfurt',
    searchTerm: 'Messe Frankfurt',
    logo: (
      <div className="flex items-center justify-center gap-1.5">
        <div className="grid grid-cols-2 gap-0.5">
          <span className="w-1.5 h-1.5 bg-rose-600 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-zinc-900 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-xs" />
        </div>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[10px] font-bold text-zinc-800 lowercase">messe frankfurt</span>
        </div>
      </div>
    )
  },
  {
    id: 'asia_autoventure',
    name: 'Asia AutoVenture Expos & Summits',
    shortName: 'Asia AutoVenture',
    searchTerm: 'Auto',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-black text-rose-600 lowercase tracking-tight">asia</span>
          <span className="text-rose-600 text-xs">▶</span>
        </div>
        <span className="text-[10px] font-bold text-zinc-900 tracking-tight -mt-0.5">autoventure</span>
      </div>
    )
  },
  {
    id: 'seattle_home_show',
    name: 'Seattle Home Show Group',
    shortName: 'Seattle Home Show',
    searchTerm: 'Home Show',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <svg viewBox="0 0 50 40" className="w-8 h-8" fill="none" stroke="#0284C7" strokeWidth="1.8">
          <ellipse cx="25" cy="8" rx="12" ry="3" />
          <path d="M 25 11 L 25 35" />
          <path d="M 22 22 L 28 22" />
          <path d="M 18 36 L 18 26 L 25 20 L 32 26 L 32 36 Z" stroke="#0EA5E9" />
        </svg>
        <span className="text-[7px] font-bold text-sky-800 tracking-tight leading-none mt-0.5 uppercase">
          Seattle Home Show
        </span>
      </div>
    )
  },
  {
    id: 'jd_expos',
    name: 'J&D Global Events & Exhibitions',
    shortName: 'J&D',
    searchTerm: 'J&D',
    logo: (
      <div className="flex items-center justify-center">
        <span className="text-2xl font-serif font-black text-purple-900 tracking-tight">
          J<span className="text-base text-purple-600">&</span>D
        </span>
      </div>
    )
  },
  {
    id: 'informa_markets',
    name: 'Informa Markets India & Global',
    shortName: 'Informa Markets',
    searchTerm: 'Informa',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00A3E0]" />
          <span className="text-xs font-black text-[#002D62] tracking-tight">informa</span>
        </div>
        <span className="text-[8px] font-semibold text-zinc-500 uppercase tracking-wider">markets</span>
      </div>
    )
  },
  {
    id: 'itpo',
    name: 'India Trade Promotion Organisation (ITPO)',
    shortName: 'ITPO',
    searchTerm: 'ITPO',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-5 h-5 rounded-full border-2 border-amber-600 flex items-center justify-center text-amber-700 font-bold text-[8px]">
          🇮🇳
        </div>
        <span className="text-xs font-black text-amber-800 tracking-widest mt-0.5">ITPO</span>
      </div>
    )
  },
  {
    id: 'cii',
    name: 'Confederation of Indian Industry (CII)',
    shortName: 'CII',
    searchTerm: 'CII',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-sm font-black text-emerald-700 tracking-widest">CII</span>
        <span className="text-[7px] text-zinc-500 font-medium">India Industry</span>
      </div>
    )
  },
  {
    id: 'ficci',
    name: 'Federation of Indian Chambers of Commerce & Industry',
    shortName: 'FICCI',
    searchTerm: 'FICCI',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-sm font-black text-rose-700 tracking-wider">FICCI</span>
        <span className="text-[7px] text-zinc-500 font-medium">Apex Chamber</span>
      </div>
    )
  },
  {
    id: 'nesco',
    name: 'NESCO Events & Exhibitions',
    shortName: 'NESCO',
    searchTerm: 'NESCO',
    logo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black text-zinc-900 tracking-widest">NESCO</span>
        <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">Events</span>
      </div>
    )
  }
];

export default function FeaturedOrganizers({ onSelectOrganizer }) {
  const scrollContainerRef = useRef(null);
  const [hoveredOrg, setHoveredOrg] = useState(null);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 280;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section id="organizers" className="space-y-3">
      {/* Header matching Screenshot 1 */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            Featured Organizers
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-0.5">
            Worldwide leading event organisers
          </p>
        </div>

        {/* Left / Right Slider Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Previous organizers"
            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Next organizers"
            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Square Logo Cards */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none py-2 px-0.5 scroll-smooth"
        >
          {ORGANIZERS.map((org) => {
            const isHovered = hoveredOrg === org.id;

            return (
              <div
                key={org.id}
                className="relative shrink-0"
                onMouseEnter={() => setHoveredOrg(org.id)}
                onMouseLeave={() => setHoveredOrg(null)}
              >
                {/* Tooltip on hover matching Screenshot 1 */}
                {isHovered && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap bg-zinc-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg transition-opacity duration-150">
                    {org.name}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectOrganizer) {
                      onSelectOrganizer(org.searchTerm || org.shortName);
                    }
                  }}
                  className="w-28 sm:w-32 h-24 sm:h-26 bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl flex items-center justify-center p-3 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer group"
                >
                  <div className="group-hover:scale-105 transition-transform duration-200 select-none">
                    {org.logo}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
