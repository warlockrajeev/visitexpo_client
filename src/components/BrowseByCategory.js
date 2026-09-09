'use client';

/**
 * @file BrowseByCategory.js
 * @description 10times.com-style "Browse By Category" section.
 * Renders quick category cards with sector icons, title, event count, and a warm "View All" CTA.
 */

import React from 'react';
import {
  GraduationCap,
  BriefcaseMedical,
  Monitor,
  DollarSign,
  Briefcase,
  Wrench,
  Car,
  Building2,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'education',
    name: 'Education & Training',
    count: '334.5k Events',
    icon: <GraduationCap className="h-4 w-4 text-zinc-800" />,
    filterKey: 'Education'
  },
  {
    id: 'medical',
    name: 'Medical & Pharma',
    count: '139.4k Events',
    icon: <BriefcaseMedical className="h-4 w-4 text-zinc-800" />,
    filterKey: 'Healthcare & Pharma'
  },
  {
    id: 'it_tech',
    name: 'IT & Technology',
    count: '139.4k Events',
    icon: <Monitor className="h-4 w-4 text-zinc-800" />,
    filterKey: 'Technology & AI'
  },
  {
    id: 'finance',
    name: 'Banking & Finance',
    count: '81.0k Events',
    icon: <DollarSign className="h-4 w-4 text-zinc-800" />,
    filterKey: 'Trade & Industry'
  },
  {
    id: 'business',
    name: 'Business Services',
    count: '117.6k Events',
    icon: <Briefcase className="h-4 w-4 text-zinc-800" />,
    filterKey: 'Trade & Industry'
  }
];

export default function BrowseByCategory({ onSelectCategory, activeCategory, onResetCategory }) {
  return (
    <section className="py-8 bg-zinc-50/70 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Browse By Category
          </h2>
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

        {/* Categories Grid matching 10times */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.filterKey || activeCategory === cat.name;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-[#FFCC00]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md text-zinc-900'
                }`}
              >
                {/* Circular Icon Holder */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {cat.icon}
                </div>

                {/* Content */}
                <div className="pt-3">
                  <div
                    className={`font-semibold text-xs sm:text-sm line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {cat.name}
                  </div>
                  <div
                    className={`text-[11px] font-normal mt-0.5 ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {cat.count}
                  </div>
                </div>
              </button>
            );
          })}

          {/* "View All" Card with 10times Warm Peach Style */}
          <button
            type="button"
            onClick={onResetCategory}
            className="p-4 rounded-xl bg-[#FFF9F2] hover:bg-[#FFF2E5] border border-[#FFE5CE] hover:border-[#FFD2AE] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center text-center group"
          >
            <span className="font-bold text-xs sm:text-sm text-[#FF5A36] group-hover:scale-105 transition-transform flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

      </div>
    </section>
  );
}
