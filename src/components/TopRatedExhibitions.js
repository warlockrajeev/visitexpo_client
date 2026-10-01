'use client';

/**
 * @file TopRatedExhibitions.js
 * @description Showcases the Top 10 Exhibitions & Trade Shows ranked by Rating on VisitExpo.
 * Displays rank badges (#1 to #10), star ratings, reviews count, location, dates, and visitor pass actions.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Calendar,
  MapPin,
  ArrowRight,
  Ticket,
  Award,
  Crown,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';

export default function TopRatedExhibitions({ events = [] }) {
  // Compute Top 10 Events sorted by rating desc, then reviewCount/turnout
  const top10Events = useMemo(() => {
    if (!events || events.length === 0) return [];

    const sorted = [...events].sort((a, b) => {
      const rA = parseFloat(a.rating) || 4.5;
      const rB = parseFloat(b.rating) || 4.5;
      if (rB !== rA) return rB - rA;

      const cA = parseInt(String(a.reviewCount || 0), 10) || 0;
      const cB = parseInt(String(b.reviewCount || 0), 10) || 0;
      if (cB !== cA) return cB - cA;

      return (a.title || '').localeCompare(b.title || '');
    });

    return sorted.slice(0, 10);
  }, [events]);

  if (top10Events.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-b from-white via-amber-50/20 to-white border-y border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 border border-amber-300 px-3.5 py-1 text-xs font-black text-amber-900 shadow-2xs">
              <Crown className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
              <span>Hall of Fame • Top 10 Highest Rated</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
              Top 10 Rated Exhibitions &amp; Expos
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              The highest-rated international trade shows, industrial expositions, and B2B summits
              evaluated by verified trade buyers, delegates, and exhibitors.
            </p>
          </div>

          <Link
            href="/events?sort=rating&top10=true"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-950 hover:text-amber-600 transition-colors group cursor-pointer shrink-0"
          >
            <span>Explore All Ranked Expos</span>
            <ArrowRight className="h-4 w-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Top 10 Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {top10Events.map((evt, idx) => {
            const rank = idx + 1;
            const eventSlug = evt.slug || evt.id;
            const ratingNum = parseFloat(evt.rating) || 4.9;
            const reviewCount = evt.reviewCount || (80 + (idx * 17));

            // Rank Styling
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;

            return (
              <article
                key={evt.id || idx}
                className="group relative bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Media Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                  <img
                    src={
                      evt.image ||
                      'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg'
                    }
                    alt={evt.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://visitexpo.in/wp-content/uploads/2026/08/Refining-India-2026.jpg';
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Rank Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {isRank1 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 shadow-md ring-2 ring-white">
                        <Crown className="h-3 w-3 fill-zinc-950" />
                        <span>#1 Ranked</span>
                      </span>
                    )}
                    {isRank2 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-slate-200 via-zinc-200 to-slate-300 text-zinc-900 shadow-md ring-2 ring-white">
                        <Award className="h-3 w-3 fill-zinc-800" />
                        <span>#2 Ranked</span>
                      </span>
                    )}
                    {isRank3 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-md ring-2 ring-white">
                        <Award className="h-3 w-3 fill-white" />
                        <span>#3 Ranked</span>
                      </span>
                    )}
                    {!isRank1 && !isRank2 && !isRank3 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-zinc-950/85 backdrop-blur-md text-[#FFCC00] shadow-md border border-white/20">
                        <span>#{rank} Ranked</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Rating on image */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white z-10">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-xs font-black text-amber-400 border border-white/10">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{ratingNum.toFixed(1)}</span>
                      <span className="text-[10px] text-zinc-300 font-normal">({reviewCount})</span>
                    </div>

                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FFCC00] text-zinc-950">
                      Free Pass
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Category */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      {evt.category || 'Trade Show'}
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-zinc-950 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                      <Link href={`/expo/${eventSlug}`}>{evt.title}</Link>
                    </h3>

                    {/* Dates */}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-700 pt-0.5">
                      <Calendar className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="truncate">{evt.dates || 'Upcoming 2026 Edition'}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                      <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-zinc-400 truncate">
                      {evt.city || 'India'}
                    </span>

                    <Link
                      href={`/expo/${eventSlug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-[#FFCC00] text-[#FFCC00] hover:text-zinc-950 text-[11px] font-black transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
