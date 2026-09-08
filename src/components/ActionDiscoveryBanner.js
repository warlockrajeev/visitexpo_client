'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ActionDiscoveryBanner({ onKeywordClick }) {
  // Category filter state for "different keywords and labels"
  const [activeCategory, setActiveCategory] = useState('all');

  // Discover Row Data (Find What Matters & Where to Meet)
  const discoverKeywords = [
    // Original from screenshot
    { id: 'upcoming-events', label: 'Find Upcoming Events', category: 'meetups', action: 'events', search: 'upcoming' },
    { id: 'track-companies', label: 'Track Companies in Town', category: 'meetups', action: 'events', search: 'companies' },
    { id: 'discover-speakers', label: 'Discover Speakers', category: 'meetups', action: 'events', search: 'speakers' },
    { id: 'curated-communities', label: 'Join Curated Communities', category: 'meetups', action: 'events', search: 'community' },
    { id: 'solutions-growth', label: 'Explore Solutions for Growth', category: 'meetups', action: 'events', search: 'solutions' },
    
    // Additional B2B & Trade Show keywords
    { id: 'b2b-trade-expos', label: 'B2B Trade Expos & Summits', category: 'trade', action: 'events', search: 'trade' },
    { id: 'global-pavilions', label: 'Global Industry Pavilions', category: 'trade', action: 'events', search: 'international' },
    { id: 'digital-visitor-passes', label: 'Digital Free Visitor Passes', category: 'trade', action: 'events', search: 'free' },
    { id: 'tech-ai-conclaves', label: 'Tech & AI Innovation Demos', category: 'trade', action: 'events', search: 'tech' },
    { id: 'ev-auto-forums', label: 'EV, Auto & Logistics Expos', category: 'trade', action: 'trade', search: 'auto' },
    { id: 'buyer-delegations', label: 'VIP Buyer Delegations', category: 'business', action: 'events', search: 'buyer' }
  ];

  // Action Row Data (Time to Act. Don't just Scroll)
  const actionKeywords = [
    // Original from screenshot
    { id: 'introduce-yourself', label: 'Introduce Yourself', category: 'meetups', link: '/login?signup=true' },
    { id: 'host-meetups', label: 'Host Meetups', category: 'meetups', link: '/login?role=organizer&signup=true' },
    { id: 'showcase-products', label: 'Showcase Products', category: 'meetups', link: '/login?role=exhibitor&signup=true' },
    { id: 'get-give-advice', label: 'Get or Give Advice', category: 'meetups', link: '#contact' },
    { id: 'meet-people', label: 'Meet People', category: 'meetups', link: '#events' },

    // Additional B2B & Trade Show labels
    { id: 'reserve-booth', label: 'Reserve Prime Booth Stalls', category: 'business', link: '/login?role=exhibitor&signup=true' },
    { id: 'scan-qr-leads', label: 'Scan Visitor QR Leads', category: 'business', link: '/login?role=exhibitor&signup=true' },
    { id: 'claim-event-listing', label: 'Claim Pre-Loaded Event Listing', category: 'business', link: '#claim' },
    { id: 'launch-new-products', label: 'Launch New Products', category: 'trade', link: '/login?role=exhibitor&signup=true' },
    { id: 'schedule-b2b-meetings', label: 'Schedule B2B Meetings', category: 'trade', link: '#events' },
    { id: 'sponsor-industry-pavilion', label: 'Sponsor Industry Pavilions', category: 'business', link: '#contact' }
  ];

  // Filter based on active category tab
  const filteredDiscover = discoverKeywords.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory || (activeCategory === 'trade' && item.category === 'business')
  );

  const filteredAction = actionKeywords.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory || (activeCategory === 'trade' && item.category === 'business')
  );

  const handlePillClick = (item) => {
    if (onKeywordClick) {
      onKeywordClick(item);
    }
  };

  return (
    <section className="w-full border-y border-zinc-200">
      
      {/* Category selector / filter bar for different keywords and labels */}
      <div className="bg-[#f0eee9] border-b border-zinc-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-[#FF2E63]" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-700">Explore Keywords &amp; Labels:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Labels' },
              { id: 'trade', label: 'Trade Shows & B2B' },
              { id: 'meetups', label: 'Original & Meetups' },
              { id: 'business', label: 'Exhibitors & Organizers' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-zinc-700 border border-zinc-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: "Explore Premier Expos & Where Industry Meets."                    */}
      {/* Background: Soft warm beige / stone tone (#F7F6F2)                        */}
      {/* ========================================================================= */}
      <div className="bg-[#F7F6F2] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Heading */}
          <div className="lg:col-span-5 xl:col-span-5">
            <h2 className="text-2xl sm:text-3xl lg:text-[31px] font-bold tracking-tight text-zinc-900 leading-snug">
              Explore Premier <span className="text-[#FF2E63]">Expos</span> &amp; Where Industry <span className="text-[#FF2E63]">Meets</span>.
            </h2>
          </div>

          {/* Right Tags & CTA */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4 sm:space-y-5">
            
            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
              {filteredDiscover.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePillClick(item)}
                  className="px-3 py-1.5 rounded-[3px] border border-zinc-700/75 bg-white hover:bg-pink-50/50 hover:border-[#FF2E63] hover:text-[#FF2E63] text-zinc-900 text-xs sm:text-[13px] font-normal transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer select-none"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Get Started Button (VisitExpo Brand Yellow) */}
            <div>
              <a
                href="#events"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-[4px] bg-[#FFCC00] hover:bg-[#FFB703] active:bg-[#E5B800] text-zinc-950 text-xs sm:text-[13px] font-bold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
              >
                Get Started
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: "Step Onto the Floor. Don’t Just Spectate."                        */}
      {/* Background: Pure Crisp White (#FFFFFF)                                    */}
      {/* ========================================================================= */}
      <div className="bg-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Heading */}
          <div className="lg:col-span-5 xl:col-span-5">
            <h2 className="text-2xl sm:text-3xl lg:text-[31px] font-bold tracking-tight text-zinc-900 leading-snug">
              Step Onto the <span className="text-[#FF2E63]">Floor</span>. Don’t Just <span className="text-[#FF2E63]">Spectate</span>.
            </h2>
          </div>

          {/* Right Tags & CTAs */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4 sm:space-y-5">
            
            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
              {filteredAction.map((item) => {
                if (item.link?.startsWith('/')) {
                  return (
                    <Link
                      key={item.id}
                      href={item.link}
                      className="px-3 py-1.5 rounded-[3px] border border-zinc-700/75 bg-white hover:bg-pink-50/50 hover:border-[#FF2E63] hover:text-[#FF2E63] text-zinc-900 text-xs sm:text-[13px] font-normal transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer select-none"
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.link || '#events'}
                    onClick={() => handlePillClick(item)}
                    className="px-3 py-1.5 rounded-[3px] border border-zinc-700/75 bg-white hover:bg-pink-50/50 hover:border-[#FF2E63] hover:text-[#FF2E63] text-zinc-900 text-xs sm:text-[13px] font-normal transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer select-none"
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login?signup=true"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-[4px] bg-[#FF2E63] hover:bg-[#E82054] active:bg-[#D91B4F] text-white text-xs sm:text-[13px] font-bold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
              >
                Create Profile
              </Link>
              <Link
                href="/login?role=organizer&signup=true"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-[4px] border border-zinc-900 bg-white hover:bg-zinc-900 hover:text-white text-zinc-900 text-xs sm:text-[13px] font-bold tracking-wide transition-all shadow-xs cursor-pointer"
              >
                Host an Event
              </Link>
              <Link
                href="/login?role=exhibitor&signup=true"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-[4px] border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs sm:text-[13px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                Exhibit at Expo
              </Link>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
}
