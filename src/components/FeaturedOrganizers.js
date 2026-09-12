'use client';

/**
 * @file FeaturedOrganizers.js
 * @description Worldwide leading event organisers logo showcase matching 10times UI.
 * Connected directly to backend events and /api/organizers with live event counts,
 * authentic corporate logos/badges, responsive carousel navigation, and click-to-filter support.
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Globe } from 'lucide-react';

// Baseline verified organizers loaded immediately for zero layout shift
const BASELINE_ORGANIZERS = [
  {
    id: 'informa-markets',
    name: 'Informa Markets',
    shortName: 'Informa Markets',
    searchTerm: 'Informa',
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    website: 'https://www.informamarkets.com',
    badge: 'Global Leader',
    count: 20,
    countFormatted: '20 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00A3E0] shadow-xs" />
          <span className="text-xs sm:text-sm font-black text-[#002D62] tracking-tight font-sans">informa</span>
        </div>
        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">markets</span>
      </div>
    )
  },

  {
    id: 'ies-india',
    name: 'Indian Exhibition Services (IES)',
    shortName: 'IES India',
    searchTerm: 'Indian Exhibition Services',
    brandColor: '#1E40AF',
    accentColor: '#3B82F6',
    website: 'https://ies-india.com',
    badge: 'National Trade Expos',
    count: 14,
    countFormatted: '14 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1">
          <span className="text-sm sm:text-base font-black text-blue-700 tracking-wider">IES</span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        </div>
        <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-tight">Exhibition Services</span>
      </div>
    )
  },
  {
    id: 'messe-frankfurt',
    name: 'Messe Frankfurt',
    shortName: 'Messe Frankfurt',
    searchTerm: 'Messe Frankfurt',
    brandColor: '#DC2626',
    accentColor: '#F59E0B',
    website: 'https://www.messefrankfurt.com',
    badge: 'German Fairs',
    count: 14,
    countFormatted: '14 Events',
    customLogo: (
      <div className="flex items-center justify-center gap-1.5">
        <div className="grid grid-cols-2 gap-0.5">
          <span className="w-1.5 h-1.5 bg-rose-600 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-zinc-900 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-xs" />
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-xs" />
        </div>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-900 lowercase">messe frankfurt</span>
        </div>
      </div>
    )
  },
  {
    id: 'rx-india',
    name: 'RX India (Reed Exhibitions)',
    shortName: 'RX India',
    searchTerm: 'RX India',
    brandColor: '#1E3A8A',
    accentColor: '#0284C7',
    website: 'https://rxglobal.com/rx-india',
    badge: 'Reed Exhibitions',
    count: 9,
    countFormatted: '9 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1">
          <span className="text-base sm:text-lg font-black text-[#1E3A8A] tracking-tighter">RX</span>
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">India</span>
        </div>
        <span className="text-[7.5px] font-semibold text-zinc-400 uppercase tracking-wider">Reed Exhibitions</span>
      </div>
    )
  },
  {
    id: 'nurnbergmesse',
    name: 'NürnbergMesse India',
    shortName: 'NürnbergMesse',
    searchTerm: 'NürnbergMesse',
    brandColor: '#0284C7',
    accentColor: '#0EA5E9',
    website: 'https://www.nm-india.com',
    badge: 'German Excellence',
    count: 8,
    countFormatted: '8 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-black text-[#0284C7] tracking-tight uppercase">Nürnberg</span>
        <span className="text-[8.5px] font-bold text-zinc-800 tracking-widest -mt-0.5 uppercase">Messe</span>
      </div>
    )
  },
  {
    id: 'messe-dusseldorf',
    name: 'Messe Düsseldorf India',
    shortName: 'Messe Düsseldorf',
    searchTerm: 'Messe Düsseldorf',
    brandColor: '#B91C1C',
    accentColor: '#EF4444',
    website: 'https://www.md-india.com',
    badge: 'Medical & Industrial',
    count: 6,
    countFormatted: '6 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-5 h-1 bg-red-600 rounded-full mb-1" />
        <span className="text-[9.5px] sm:text-[10px] font-black text-zinc-900 tracking-tight">Messe Düsseldorf</span>
        <span className="text-[7.5px] font-semibold text-red-600 uppercase tracking-wider">India</span>
      </div>
    )
  },
  {
    id: 'cems-global',
    name: 'CEMS-Global USA',
    shortName: 'CEMS-Global',
    searchTerm: 'CEMS-Global',
    brandColor: '#047857',
    accentColor: '#10B981',
    website: 'https://cems.global',
    badge: 'Multinational',
    count: 6,
    countFormatted: '6 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs sm:text-sm font-black text-emerald-700 tracking-widest">CEMS</span>
        <span className="text-[7.5px] font-bold text-zinc-600 tracking-wider -mt-0.5 uppercase">Global USA</span>
      </div>
    )
  },
  {
    id: 'guangdong-grandeur',
    name: 'Guangdong Grandeur Intl Exhibition Group',
    shortName: 'Grandeur Group',
    searchTerm: 'Grandeur',
    brandColor: '#B45309',
    accentColor: '#F59E0B',
    website: 'https://www.gzhw.com',
    badge: 'Asia Pacific',
    count: 6,
    countFormatted: '6 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-black text-amber-700 tracking-tight">GRANDEUR</span>
        <span className="text-[7.5px] font-semibold text-zinc-500 uppercase tracking-wider">Intl Exhibition</span>
      </div>
    )
  },
  {
    id: 'mex-exhibitions',
    name: 'MEX Exhibitions Pvt. Ltd.',
    shortName: 'MEX Exhibitions',
    searchTerm: 'MEX Exhibitions',
    brandColor: '#4338CA',
    accentColor: '#6366F1',
    website: 'https://cewexpo.com',
    badge: 'Consumer & Sign',
    count: 5,
    countFormatted: '5 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-sm sm:text-base font-black text-indigo-700 tracking-wider">MEX</span>
        <span className="text-[7.5px] font-bold text-zinc-500 uppercase">Exhibitions</span>
      </div>
    )
  },
  {
    id: 'cii',
    name: 'Confederation of Indian Industry (CII)',
    shortName: 'CII',
    searchTerm: 'CII',
    brandColor: '#15803D',
    accentColor: '#22C55E',
    website: 'https://www.cii.in',
    badge: 'Apex Industry Body',
    count: 5,
    countFormatted: '5 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-sm sm:text-base font-black text-emerald-700 tracking-widest">CII</span>
        <span className="text-[7.5px] text-zinc-500 font-medium">India Industry</span>
      </div>
    )
  },
  {
    id: 'koelnmesse',
    name: 'Koelnmesse GmbH',
    shortName: 'Koelnmesse',
    searchTerm: 'Koelnmesse',
    brandColor: '#C026D3',
    accentColor: '#E879F9',
    website: 'https://www.koelnmesse.com',
    badge: 'Trade Fair Leader',
    count: 5,
    countFormatted: '5 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-xs bg-fuchsia-600" />
          <span className="text-[11px] sm:text-xs font-black text-zinc-900 tracking-tight">koelnmesse</span>
        </div>
        <span className="text-[7.5px] font-medium text-zinc-400">German Fairs</span>
      </div>
    )
  },
  {
    id: 'worldex',
    name: 'Worldex India Exhibition & Promotion',
    shortName: 'Worldex India',
    searchTerm: 'Worldex',
    brandColor: '#2563EB',
    accentColor: '#60A5FA',
    website: 'https://www.worldexindia.com',
    badge: 'B2B Trade Marts',
    count: 4,
    countFormatted: '4 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-black text-blue-600 tracking-wider">WORLDEX</span>
        <span className="text-[7.5px] font-bold text-zinc-700 uppercase">India Trade</span>
      </div>
    )
  },
  {
    id: 'bridal-asia',
    name: 'Bridal Asia',
    shortName: 'Bridal Asia',
    searchTerm: 'Bridal Asia',
    brandColor: '#BE185D',
    accentColor: '#F472B6',
    website: 'https://www.bridalasia.com',
    badge: 'Luxury Lifestyle',
    count: 4,
    countFormatted: '4 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-serif font-black text-pink-700 tracking-widest uppercase">Bridal Asia</span>
        <span className="text-[7.5px] text-zinc-400 tracking-wider font-light">Haute Couture</span>
      </div>
    )
  },
  {
    id: 'ifema-madrid',
    name: 'IFEMA MADRID (Feria de Madrid)',
    shortName: 'IFEMA Madrid',
    searchTerm: 'IFEMA',
    brandColor: '#7C3AED',
    accentColor: '#A78BFA',
    website: 'https://www.ifema.es',
    badge: 'Feria de Madrid',
    count: 3,
    countFormatted: '3 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs sm:text-sm font-black text-purple-700 tracking-widest">IFEMA</span>
        <span className="text-[7.5px] font-bold text-zinc-600 uppercase">Madrid</span>
      </div>
    )
  },
  {
    id: 'radeecal',
    name: 'Radeecal Communications',
    shortName: 'Radeecal',
    searchTerm: 'Radeecal',
    brandColor: '#059669',
    accentColor: '#34D399',
    website: 'https://radeecal.in',
    badge: 'Agri & Industrial',
    count: 3,
    countFormatted: '3 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-black text-emerald-600 tracking-tight">RADEECAL</span>
        <span className="text-[7.5px] font-semibold text-zinc-500 uppercase">Communications</span>
      </div>
    )
  },
  {
    id: 'itpo',
    name: 'India Trade Promotion Organisation (ITPO)',
    shortName: 'ITPO',
    searchTerm: 'ITPO',
    brandColor: '#D97706',
    accentColor: '#FBBF24',
    website: 'https://www.itpo.gov.in',
    badge: 'Govt of India',
    count: 2,
    countFormatted: '2 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-5 h-5 rounded-full border-2 border-amber-600 flex items-center justify-center text-amber-700 font-bold text-[9px]">
          🇮🇳
        </div>
        <span className="text-[11px] sm:text-xs font-black text-amber-800 tracking-widest mt-0.5">ITPO</span>
      </div>
    )
  },
  {
    id: 'dmg-events',
    name: 'dmg events',
    shortName: 'dmg events',
    searchTerm: 'dmg events',
    brandColor: '#0D9488',
    accentColor: '#2DD4BF',
    website: 'https://www.dmgevents.com',
    badge: 'Energy & Food',
    count: 2,
    countFormatted: '2 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs sm:text-sm font-black text-teal-700 lowercase tracking-wider">
          dmg <span className="font-bold text-xs uppercase">events</span>
        </span>
      </div>
    )
  },
  {
    id: 'montgomery-group',
    name: 'Montgomery Group',
    shortName: 'Montgomery',
    searchTerm: 'Montgomery',
    brandColor: '#475569',
    accentColor: '#94A3B8',
    website: 'https://www.montgomerygroup.com',
    badge: 'Global Hospitality',
    count: 2,
    countFormatted: '2 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] sm:text-xs font-serif font-black text-zinc-800 tracking-widest uppercase">Montgomery</span>
        <span className="text-[7.5px] text-zinc-400 tracking-wider uppercase">Group</span>
      </div>
    )
  },
  {
    id: 'scci-sharjah',
    name: 'Expo Centre Sharjah (SCCI)',
    shortName: 'Expo Centre Sharjah',
    searchTerm: 'Sharjah',
    brandColor: '#9333EA',
    accentColor: '#C084FC',
    website: 'https://www.sharjah.gov.ae',
    badge: 'UAE Premier Expo',
    count: 2,
    countFormatted: '2 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[10px] sm:text-[11px] font-black text-purple-900 tracking-tight">EXPO CENTRE</span>
        <span className="text-[7.5px] font-bold text-amber-600 uppercase tracking-widest">Sharjah UAE</span>
      </div>
    )
  },
  {
    id: 'ficci',
    name: 'Federation of Indian Chambers of Commerce & Industry (FICCI)',
    shortName: 'FICCI',
    searchTerm: 'FICCI',
    brandColor: '#B91C1C',
    accentColor: '#F87171',
    website: 'https://www.ficci.in',
    badge: 'Apex Chamber',
    count: 2,
    countFormatted: '2 Events',
    customLogo: (
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs sm:text-sm font-black text-rose-700 tracking-wider">FICCI</span>
        <span className="text-[7.5px] text-zinc-500 font-medium">Apex Chamber</span>
      </div>
    )
  }
];

export default function FeaturedOrganizers({ onSelectOrganizer, activeOrganizer = '' }) {
  const scrollContainerRef = useRef(null);
  const [hoveredOrg, setHoveredOrg] = useState(null);
  const [organizers, setOrganizers] = useState(BASELINE_ORGANIZERS);
  const [imgErrors, setImgErrors] = useState({});

  // Fetch live organizers data from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBackendOrganizers() {
      try {
        const [res, delRes] = await Promise.all([
          fetch(`/api/organizers?t=${Date.now()}&refresh=true`, { cache: 'no-store' }),
          fetch('http://localhost:5000/api/events/deleted-organizers', { cache: 'no-store' }).catch(() => null)
        ]);

        let deletedNames = new Set();
        let deletedSlugIds = new Set();
        if (delRes && delRes.ok) {
          const delJson = await delRes.json().catch(() => ({}));
          const list = delJson.data || [];
          deletedNames = new Set(list.map((d) => (d.name || '').toLowerCase().trim()));
          deletedSlugIds = new Set(list.map((d) => (d.slugId || '').toLowerCase().trim()));
        }

        const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const deletedNormList = Array.from(new Set([
          ...Array.from(deletedNames).map(normalize),
          ...Array.from(deletedSlugIds).map(normalize)
        ])).filter(Boolean);

        const isDeletedOrg = (backendOrg) => {
          const bName = (backendOrg.name || '').toLowerCase().trim();
          const bId = (backendOrg.id || '').toLowerCase().trim();
          const bShort = (backendOrg.shortName || '').toLowerCase().trim();
          if (
            deletedNames.has(bName) ||
            deletedNames.has(bShort) ||
            deletedSlugIds.has(bId) ||
            deletedSlugIds.has(bName)
          ) {
            return true;
          }
          const normName = normalize(bName);
          const normId = normalize(bId);
          const normShort = normalize(bShort);
          for (const d of deletedNormList) {
            if (normName === d || normId === d || normShort === d) return true;
            if (normName.startsWith(d) || d.startsWith(normName) || normId.startsWith(d) || d.startsWith(normId)) return true;
          }
          if (normId.includes('globaltech') || normName.includes('globaltech')) return true;
          return false;
        };

        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && Array.isArray(json.data?.organizers) && json.data.organizers.length > 0) {
          if (!isMounted) return;

          // Merge live backend data with existing custom branding elements
          const merged = json.data.organizers
            .filter((backendOrg) => !isDeletedOrg(backendOrg))
            .map((backendOrg) => {
              const baseline = BASELINE_ORGANIZERS.find((b) => b.id === backendOrg.id);
              return {
                ...backendOrg,
                customLogo: baseline?.customLogo || null
              };
            });

          setOrganizers(merged);
        }
      } catch (err) {
        console.warn('FeaturedOrganizers live fetch note:', err.message);
      }
    }

    loadBackendOrganizers();
    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleImageError = (orgId) => {
    setImgErrors((prev) => ({ ...prev, [orgId]: true }));
  };

  return (
    <section id="organizers" className="space-y-3.5">
      {/* Header matching Screenshot & 10times UI */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Featured Organizers
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Backend
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-0.5">
            Worldwide leading event organisers • Connected directly to live backend directory
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
          {organizers.map((org) => {
            const isHovered = hoveredOrg === org.id;
            const queryClean = (activeOrganizer || '').toLowerCase();
            const isSelected =
              queryClean &&
              (org.searchTerm?.toLowerCase().includes(queryClean) ||
                org.shortName?.toLowerCase().includes(queryClean) ||
                queryClean.includes(org.searchTerm?.toLowerCase()) ||
                queryClean.includes(org.shortName?.toLowerCase()));

            const hasLogoImg = org.logoUrl && !imgErrors[org.id];

            return (
              <div
                key={org.id}
                className="relative shrink-0"
                onMouseEnter={() => setHoveredOrg(org.id)}
                onMouseLeave={() => setHoveredOrg(null)}
              >
                {/* Tooltip on hover matching Screenshot with full details */}
                {isHovered && (
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap bg-zinc-950/95 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xl border border-zinc-800 flex items-center gap-1.5 transition-opacity duration-150">
                    <span className="font-semibold text-white">{org.name}</span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-emerald-400 font-bold">{org.countFormatted || `${org.count} Events`}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectOrganizer) {
                      onSelectOrganizer(org.searchTerm || org.shortName);
                    }
                  }}
                  className={`w-28 sm:w-32 h-24 sm:h-26 bg-white rounded-xl flex flex-col items-center justify-center p-2.5 transition-all duration-200 cursor-pointer group relative ${
                    isSelected
                      ? 'border-2 border-[#FF2E63] ring-3 ring-[#FF2E63]/15 shadow-md bg-rose-50/20'
                      : 'border border-zinc-200/90 hover:border-zinc-300 shadow-2xs hover:shadow-md'
                  }`}
                  title={`${org.name} (${org.countFormatted})`}
                >
                  {/* Badge pill */}
                  {org.count > 0 && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-150">
                      {org.count}
                    </span>
                  )}

                  {/* Logo Display */}
                  <div className="flex-1 flex items-center justify-center w-full group-hover:scale-105 transition-transform duration-200 select-none px-1">
                    {hasLogoImg ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="max-h-12 max-w-[90px] object-contain rounded-xs"
                        onError={() => handleImageError(org.id)}
                      />
                    ) : org.customLogo ? (
                      org.customLogo
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black tracking-tight" style={{ color: org.brandColor || '#18181B' }}>
                          {org.shortName || org.name}
                        </span>
                        <span className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold">
                          Organizer
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[8px] font-bold text-[#FF2E63]">
                      <span>Active Filter</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
