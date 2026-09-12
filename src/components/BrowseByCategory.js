'use client';

/**
 * @file BrowseByCategory.js
 * @description Dynamic "Browse By Category" section connected directly to backend data.
 * Displays the 11 verified event categories with exact event counts, industry icons,
 * interactive category filtering, and an expandable 10times-style layout.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Cpu,
  HardHat,
  Activity,
  Compass,
  Car,
  Shirt,
  Sprout,
  Palette,
  Truck,
  Plane,
  ArrowRight,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

// Icon mapping for all 11 backend categories
const ICON_COMPONENTS = {
  'Trade & Industry': Briefcase,
  'Technology & AI': Cpu,
  'Construction & Infra': HardHat,
  'Healthcare & Pharma': Activity,
  'Travel & Tourism': Compass,
  'Automotive & EV': Car,
  'Textile & Fashion': Shirt,
  'Agri & Food Tech': Sprout,
  'Art & Lifestyle': Palette,
  'Logistics & Cargo': Truck,
  'Aerospace & Aviation': Plane
};

// Calibrated initial categories matching backend MongoDB & WordPress sync
const INITIAL_CATEGORIES = [
  {
    id: 'technology-ai',
    slug: 'technology-ai',
    name: 'Technology & AI',
    filterKey: 'Technology & AI',
    count: 301,
    countFormatted: '301 Events',
    iconName: 'Technology & AI'
  },
  {
    id: 'healthcare-pharma',
    slug: 'healthcare-pharma',
    name: 'Healthcare & Pharma',
    filterKey: 'Healthcare & Pharma',
    count: 117,
    countFormatted: '117 Events',
    iconName: 'Healthcare & Pharma'
  },
  {
    id: 'construction-infra',
    slug: 'construction-infra',
    name: 'Construction & Infra',
    filterKey: 'Construction & Infra',
    count: 134,
    countFormatted: '134 Events',
    iconName: 'Construction & Infra'
  },
  {
    id: 'automotive-ev',
    slug: 'automotive-ev',
    name: 'Automotive & EV',
    filterKey: 'Automotive & EV',
    count: 103,
    countFormatted: '103 Events',
    iconName: 'Automotive & EV'
  },
  {
    id: 'trade-industry',
    slug: 'trade-industry',
    name: 'Trade & Industry',
    filterKey: 'Trade & Industry',
    count: 904,
    countFormatted: '904 Events',
    iconName: 'Trade & Industry'
  },
  {
    id: 'travel-tourism',
    slug: 'travel-tourism',
    name: 'Travel & Tourism',
    filterKey: 'Travel & Tourism',
    count: 109,
    countFormatted: '109 Events',
    iconName: 'Travel & Tourism'
  },
  {
    id: 'textile-fashion',
    slug: 'textile-fashion',
    name: 'Textile & Fashion',
    filterKey: 'Textile & Fashion',
    count: 74,
    countFormatted: '74 Events',
    iconName: 'Textile & Fashion'
  },
  {
    id: 'agri-food-tech',
    slug: 'agri-food-tech',
    name: 'Agri & Food Tech',
    filterKey: 'Agri & Food Tech',
    count: 66,
    countFormatted: '66 Events',
    iconName: 'Agri & Food Tech'
  },
  {
    id: 'art-lifestyle',
    slug: 'art-lifestyle',
    name: 'Art & Lifestyle',
    filterKey: 'Art & Lifestyle',
    count: 50,
    countFormatted: '50 Events',
    iconName: 'Art & Lifestyle'
  },
  {
    id: 'logistics-cargo',
    slug: 'logistics-cargo',
    name: 'Logistics & Cargo',
    filterKey: 'Logistics & Cargo',
    count: 39,
    countFormatted: '39 Events',
    iconName: 'Logistics & Cargo'
  },
  {
    id: 'aerospace-aviation',
    slug: 'aerospace-aviation',
    name: 'Aerospace & Aviation',
    filterKey: 'Aerospace & Aviation',
    count: 27,
    countFormatted: '27 Events',
    iconName: 'Aerospace & Aviation'
  }
];

export default function BrowseByCategory({ onSelectCategory, activeCategory, onResetCategory }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalEvents, setTotalEvents] = useState(1924);

  // Fetch live categories and counts from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchBackendCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.data?.categories) && json.data.categories.length > 0) {
            if (isMounted) {
              const backendCats = json.data.categories.map((c) => ({
                id: c.slug || c.id,
                slug: c.slug || 'trade-industry',
                name: c.name,
                filterKey: c.name,
                count: c.count || 0,
                countFormatted: `${(c.count || 0).toLocaleString()} Events`,
                iconName: c.name
              }));
              setCategories(backendCats);
              if (json.data.totalEvents) {
                setTotalEvents(json.data.totalEvents);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not refresh /api/categories live:', err.message);
      }
    }

    fetchBackendCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine items to display: top 5 + view all card, or all 11
  const displayedCategories = isExpanded ? categories : categories.slice(0, 5);

  const handleCategoryClick = (cat) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Heading & Live Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Browse By Category
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
            11 Sectors • {totalEvents.toLocaleString()}+ Live Events
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeCategory && activeCategory !== 'All Categories' && (
            <button
              type="button"
              onClick={onResetCategory}
              className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer"
            >
              Clear Filter ({activeCategory})
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Show Top 5 ↑' : 'View All 11 Sectors →'}
          </button>
        </div>
      </div>

      {/* Grid: 6 Columns matching 10times layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 transition-all duration-300">
        {displayedCategories.map((cat) => {
          const isSelected = activeCategory === cat.filterKey || activeCategory === cat.name;
          const IconComp = ICON_COMPONENTS[cat.iconName || cat.name] || Briefcase;

          return (
            <div
              key={cat.id || cat.slug}
              onClick={() => handleCategoryClick(cat)}
              className={`text-left p-4 sm:p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 sm:h-32 group relative ${
                isSelected
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-[#FFCC00]'
                  : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 text-zinc-900 shadow-2xs'
              }`}
            >
              {/* Top Row: Circular Icon Holder + Link to Dedicated Category Page */}
              <div className="flex items-center justify-between">
                <div
                  className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-100 text-zinc-800 group-hover:bg-zinc-200/90'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                </div>

                <Link
                  href={`/category/${cat.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  title={`Open ${cat.name} Page`}
                  className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSelected ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-[#FF2E63]'
                  }`}
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Bottom: Title & Real Event Count */}
              <div>
                <div
                  className={`font-bold text-xs sm:text-[13px] leading-snug line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-[#FF2E63] transition-colors'
                  }`}
                >
                  {cat.name}
                </div>
                <div
                  className={`text-[11px] font-medium mt-0.5 ${
                    isSelected ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {cat.countFormatted || `${cat.count} Events`}
                </div>
              </div>
            </div>
          );
        })}

        {/* 6th Card: "View All" Toggle in Warm Peach / Coral (Matching Screenshot) */}
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-4 sm:p-4.5 rounded-xl bg-[#FFF9F2] hover:bg-[#FFF2E5] border border-[#FFE7D4] hover:border-[#FFD5B3] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center text-center h-28 sm:h-32 group"
          >
            <span className="font-extrabold text-sm sm:text-base text-[#FF5A36] group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-4 sm:p-4.5 rounded-xl bg-[#FFF9F2] hover:bg-[#FFF2E5] border border-[#FFE7D4] hover:border-[#FFD5B3] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center text-center h-28 sm:h-32 group"
          >
            <span className="font-extrabold text-sm sm:text-base text-[#FF5A36] group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
              <span>Show Top 5</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
