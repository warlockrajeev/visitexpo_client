'use client';

/**
 * @file BrowseByCategory.js
 * @description 10times.com-style "Browse By Category" section matching user reference screenshot.
 * Renders quick category cards with circular sector icons, titles, event counts, and a warm peach "View All" card.
 */

import React from 'react';
import {
  GraduationCap,
  BriefcaseMedical,
  Monitor,
  DollarSign,
  Briefcase,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'education',
    name: 'Education & Training',
    count: '334.5k Events',
    icon: <GraduationCap className="h-4 w-4" />,
    filterKey: 'Education'
  },
  {
    id: 'medical',
    name: 'Medical & Pharma',
    count: '139.4k Events',
    icon: <BriefcaseMedical className="h-4 w-4" />,
    filterKey: 'Healthcare & Pharma'
  },
  {
    id: 'it_tech',
    name: 'IT & Technology',
    count: '139.4k Events',
    icon: <Monitor className="h-4 w-4" />,
    filterKey: 'Technology & AI'
  },
  {
    id: 'finance',
    name: 'Banking & Finance',
    count: '81.0k Events',
    icon: <DollarSign className="h-4 w-4" />,
    filterKey: 'Trade & Industry'
  },
  {
    id: 'business',
    name: 'Business Services',
    count: '117.6k Events',
    icon: <Briefcase className="h-4 w-4" />,
    filterKey: 'Trade & Industry'
  }
];

export default function BrowseByCategory({ onSelectCategory, activeCategory, onResetCategory }) {
  return (
    <div className="space-y-4">
      {/* Section Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Browse By Category
          </h2>
        </div>
        {activeCategory && activeCategory !== 'All Categories' && (
          <button
            type="button"
            onClick={onResetCategory}
            className="text-xs font-bold text-[#FF2E63] hover:underline cursor-pointer"
          >
            Clear Filter ({activeCategory})
          </button>
        )}
      </div>

      {/* 6-Card Row Grid matching 10times screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.filterKey || activeCategory === cat.name;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`text-left p-4 sm:p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 sm:h-32 group ${
                isSelected
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-[#FFCC00]'
                  : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 text-zinc-900 shadow-2xs'
              }`}
            >
              {/* Circular Icon Holder */}
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 text-zinc-800 group-hover:bg-zinc-200/90'
                }`}
              >
                {cat.icon}
              </div>

              {/* Title & Count */}
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
                  {cat.count}
                </div>
              </div>
            </button>
          );
        })}

        {/* 6th Card: "View All" in Warm Peach / Coral (Matching Screenshot) */}
        <button
          type="button"
          onClick={onResetCategory}
          className="p-4 sm:p-4.5 rounded-xl bg-[#FFF9F2] hover:bg-[#FFF2E5] border border-[#FFE7D4] hover:border-[#FFD5B3] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center text-center h-28 sm:h-32 group"
        >
          <span className="font-extrabold text-sm sm:text-base text-[#FF5A36] group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>
    </div>
  );
}
