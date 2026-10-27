'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Building,
  ArrowRight,
  Award
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

// Curated high-resolution fallback exhibition photos matching cinematic banner lighting
const FALLBACK_IMAGES = [
  'https://visitexpo.in/wp-content/uploads/2025/05/IT-OT-in-oil-gas-1.jpg',
  'https://visitexpo.in/wp-content/uploads/2025/05/a-1.jpg',
  'https://visitexpo.in/wp-content/uploads/2025/05/images-2-11.jpeg',
  'https://visitexpo.in/wp-content/uploads/2025/05/images-2-10.jpeg',
  'https://visitexpo.in/wp-content/uploads/2025/05/download-1-1.png',
  'https://visitexpo.in/wp-content/uploads/2025/05/qww-1.jpg'
];

// Badge styles matching reference screenshot (NEWS = Red, GALLERY = Orange, EXPO = Amber, etc.)
const BADGE_CONFIG = [
  { label: 'NEWS', color: 'bg-[#E53935]' },
  { label: 'GALLERY', color: 'bg-[#FB8C00]' },
  { label: 'NEWS', color: 'bg-[#E53935]' },
  { label: 'EXPO', color: 'bg-[#F59E0B]' },
  { label: 'GALLERY', color: 'bg-[#FB8C00]' },
  { label: 'SPOTLIGHT', color: 'bg-[#10B981]' }
];

const RELATIVE_TIMESTAMPS = [
  '35 mins ago',
  'Yesterday',
  '2 hours ago',
  'Yesterday',
  'Just now',
  '3 days ago'
];

// Default 6 real events fallback
const DEFAULT_SIX_EVENTS = [
  {
    _id: 'def-1',
    title: 'World Education Fair 2025',
    city: 'Mumbai',
    dates: '18 May 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/download-1-1.png',
    slug: 'world-education-fair-world-education-fair-2025',
    organizer: 'Edwise Overseas Education Consultants'
  },
  {
    _id: 'def-2',
    title: 'Asset Integrity & Maintenance India Summit',
    city: 'Mumbai',
    dates: '24-25 May 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/a-1.jpg',
    slug: 'annual-asset-integrity-and-maintenance-india-summit-2025',
    organizer: 'Industrial Engineering Council India'
  },
  {
    _id: 'def-3',
    title: 'Annual Conference on IT & OT in Oil & Gas',
    city: 'New Delhi',
    dates: '12-13 Jun 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/IT-OT-in-oil-gas-1.jpg',
    slug: 'annual-conference-on-it-ot-in-oil-gas-2025',
    organizer: 'Energy Trade & Infrastructure Forum'
  },
  {
    _id: 'def-4',
    title: 'Electric Expo Ahmedabad 2025',
    city: 'Ahmedabad',
    dates: '08-10 Jul 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/images-2-11.jpeg',
    slug: 'electric-expo-ahemdabad',
    organizer: 'Gujarat Electrical Association'
  },
  {
    _id: 'def-5',
    title: 'Dubai Real Estate Investment Conclave',
    city: 'Ahmedabad',
    dates: '15-16 Aug 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/images-2-10.jpeg',
    slug: 'dubai-real-estate-event-in-ahmedabad-2025',
    organizer: 'Global Realty Advisory'
  },
  {
    _id: 'def-6',
    title: 'International Clean Energy & Solar Expo',
    city: 'Madurai',
    dates: '20-22 Sep 2025',
    banner: 'https://visitexpo.in/wp-content/uploads/2025/05/qww-1.jpg',
    slug: 'dubai-real-estate-event-in-madurai-2025',
    organizer: 'CleanEnergy Trade Council'
  }
];

// Prepared initial slides for instant SSR and zero flicker
const INITIAL_SLIDES = DEFAULT_SIX_EVENTS.map((def, idx) => ({
  ...def,
  timeAgo: RELATIVE_TIMESTAMPS[idx % RELATIVE_TIMESTAMPS.length],
  badge: BADGE_CONFIG[idx % BADGE_CONFIG.length].label,
  badgeColor: BADGE_CONFIG[idx % BADGE_CONFIG.length].color,
  image: def.banner || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
  link: def.slug ? `/event/${def.slug}` : '/events'
}));

export default function BannerSlider() {
  const [slides, setSlides] = useState(INITIAL_SLIDES);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const timerRef = useRef(null);

  // Responsive dimension tracker for smooth peek/active carousel offset
  const [carouselMetrics, setCarouselMetrics] = useState({
    activeWidth: 620,
    inactiveWidth: 260,
    gap: 24,
    peekOffset: 70
  });

  // Measure screen size to adjust card dimensions
  useEffect(() => {
    const updateMetrics = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setCarouselMetrics({
          activeWidth: Math.min(w - 60, 340),
          inactiveWidth: 190,
          gap: 14,
          peekOffset: 20
        });
      } else if (w < 1024) {
        setCarouselMetrics({
          activeWidth: 480,
          inactiveWidth: 220,
          gap: 18,
          peekOffset: 50
        });
      } else {
        setCarouselMetrics({
          activeWidth: 620,
          inactiveWidth: 260,
          gap: 24,
          peekOffset: 80
        });
      }
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, []);

  // Fetch approved banners + top 6 events
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [bannersRes, eventsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/banners/active`, { timeout: 2500 }),
          axios.get(`${API_URL}/events?limit=8&status=published`, { timeout: 2500 })
        ]);

        if (!isMounted) return;

        let activeBanners = [];
        if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.success && Array.isArray(bannersRes.value.data.banners)) {
          activeBanners = bannersRes.value.data.banners;
        }

        let rawEvents = [];
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.data) {
          rawEvents = eventsRes.value.data.data.docs || eventsRes.value.data.data || [];
        }

        // Build 6 unified slides
        const combined = [];

        // 1. Add custom approved banners first if available
        activeBanners.forEach((b, i) => {
          combined.push({
            _id: b._id || `banner-${i}`,
            title: b.headline || b.event?.title || 'Featured Exhibition',
            city: b.event?.city || 'India',
            dates: b.event?.dates || 'Upcoming 2025',
            timeAgo: RELATIVE_TIMESTAMPS[i % RELATIVE_TIMESTAMPS.length],
            badge: b.badgeText || BADGE_CONFIG[i % BADGE_CONFIG.length].label,
            badgeColor: BADGE_CONFIG[i % BADGE_CONFIG.length].color,
            image: b.bannerImage || b.event?.bannerImage || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
            slug: b.event?.slug,
            link: b.ctaLink || (b.event?.slug ? `/event/${b.event.slug}` : '/events'),
            organizer: b.organizer?.company || b.organizer?.name || 'VisitExpo Verified',
            isCustomBanner: true
          });
        });

        // 2. Fill remaining slots with the 6 events from DB
        const eventsSource = rawEvents.length > 0 ? rawEvents : DEFAULT_SIX_EVENTS;
        eventsSource.forEach((e, idx) => {
          if (combined.length >= 6) return;
          const configIdx = combined.length % BADGE_CONFIG.length;
          const fallbackImg = FALLBACK_IMAGES[configIdx % FALLBACK_IMAGES.length];
          const bannerImg = e.banner || e.bannerImage || e.featuredImage || fallbackImg;

          combined.push({
            _id: e._id || `event-${idx}`,
            title: e.title || 'Exhibition & Trade Summit 2025',
            city: e.city || 'India',
            dates: e.startDate
              ? new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : (e.dates || 'Upcoming 2025'),
            timeAgo: RELATIVE_TIMESTAMPS[configIdx],
            badge: BADGE_CONFIG[configIdx].label,
            badgeColor: BADGE_CONFIG[configIdx].color,
            image: bannerImg,
            slug: e.slug,
            link: e.slug ? `/event/${e.slug}` : '/events',
            organizer: e.orgName || e.organizer?.company || 'VisitExpo Partner',
            isCustomBanner: false
          });
        });

        // Fallback safety: ensure exactly 6 slides minimum
        while (combined.length < 6) {
          const idx = combined.length;
          const def = DEFAULT_SIX_EVENTS[idx % DEFAULT_SIX_EVENTS.length];
          const configIdx = idx % BADGE_CONFIG.length;
          combined.push({
            ...def,
            timeAgo: RELATIVE_TIMESTAMPS[configIdx],
            badge: BADGE_CONFIG[configIdx].label,
            badgeColor: BADGE_CONFIG[configIdx].color,
            image: FALLBACK_IMAGES[configIdx],
            link: def.slug ? `/event/${def.slug}` : '/events'
          });
        }

        setSlides(combined.slice(0, 6));
      } catch (err) {
        console.warn('Banner data load fallback:', err);
        setSlides(
          DEFAULT_SIX_EVENTS.map((def, idx) => ({
            ...def,
            timeAgo: RELATIVE_TIMESTAMPS[idx % RELATIVE_TIMESTAMPS.length],
            badge: BADGE_CONFIG[idx % BADGE_CONFIG.length].label,
            badgeColor: BADGE_CONFIG[idx % BADGE_CONFIG.length].color,
            image: FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
            link: def.slug ? `/event/${def.slug}` : '/events'
          }))
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-play interval (5.5s)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleBannerClick = async (slide) => {
    if (slide?._id && slide.isCustomBanner) {
      try {
        axios.post(`${API_URL}/banners/${slide._id}/click`).catch(() => {});
      } catch (e) {
        // silent
      }
    }
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <div className="w-full bg-[#18181b] py-6 px-4">
        <div className="max-w-6xl mx-auto h-[320px] rounded-3xl bg-zinc-900/60 animate-pulse border border-zinc-800" />
      </div>
    );
  }

  // Calculate carousel horizontal translation to keep active card centered with peek
  const { inactiveWidth, gap, peekOffset } = carouselMetrics;
  const currentTranslateX =
    currentIndex === 0
      ? 0
      : Math.max(0, currentIndex * (inactiveWidth + gap) - peekOffset);

  return (
    <section
      aria-label="Featured Exhibitions Banner Slider"
      className="relative w-full bg-[#16171a] py-6 sm:py-8 border-b border-zinc-800/80 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <Award className="h-3 w-3 text-amber-400" />
              Featured Spotlight
            </span>
            <span className="hidden sm:inline text-xs text-zinc-400 font-medium">
              Top 6 Verified Exhibitions &amp; Growth Summits
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/banner-spotlight"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10"
            >
              <span>Feature Your Event</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            {/* Slider Counter & Navigation */}
            {slides.length > 1 && (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/60 rounded-full px-2 py-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Slide"
                  className="h-5 w-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-zinc-300 px-1">
                  <span className="text-white">{String(currentIndex + 1).padStart(2, '0')}</span>
                  <span className="opacity-40"> / </span>
                  <span>{String(slides.length).padStart(2, '0')}</span>
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Slide"
                  className="h-5 w-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* MULTI-CARD EXPANDING CAROUSEL SLIDER (Matching Reference Design)     */}
        {/* =================================================================== */}
        <div className="relative w-full overflow-hidden py-1">
          <div
            className="flex items-center gap-3.5 sm:gap-4 md:gap-6 transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${currentTranslateX}px)`
            }}
          >
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={slide._id || idx}
                  onClick={() => {
                    if (!isActive) setCurrentIndex(idx);
                  }}
                  className={`relative shrink-0 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 cursor-pointer group ${
                    isActive
                      ? 'w-[320px] sm:w-[480px] md:w-[580px] lg:w-[640px] h-[340px] sm:h-[380px] md:h-[410px] ring-1 ring-white/20'
                      : 'w-[180px] sm:w-[220px] md:w-[250px] lg:w-[270px] h-[340px] sm:h-[380px] md:h-[410px] opacity-80 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                >
                  {/* Background Cover Image */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                    }}
                    className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient Overlays for maximum text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 md:p-7 flex flex-col justify-between z-10">

                    {/* Top Row: Pill Badge + City */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider text-white shadow-md ${slide.badgeColor}`}
                      >
                        {slide.badge}
                      </span>

                      {isActive && slide.city && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
                          <MapPin className="h-2.5 w-2.5 text-red-400" />
                          {slide.city}
                        </span>
                      )}
                    </div>

                    {/* Bottom Area: Headline, Subtext, Read More */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <h3
                        className={`font-black text-white leading-tight drop-shadow-md tracking-tight ${
                          isActive
                            ? 'text-xl sm:text-2xl md:text-3xl line-clamp-2'
                            : 'text-sm sm:text-base md:text-lg line-clamp-3'
                        }`}
                      >
                        {slide.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80 font-medium">
                        <span>{slide.timeAgo}</span>
                        {slide.dates && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="truncate">{slide.dates}</span>
                          </>
                        )}
                      </div>

                      {/* Read More Action Link with circular arrow icon */}
                      <div className="pt-2">
                        <Link
                          href={slide.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBannerClick(slide);
                          }}
                          className="inline-flex items-center gap-2 text-white font-bold text-xs sm:text-sm group/btn hover:underline"
                        >
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/80 flex items-center justify-center text-xs text-white group-hover/btn:bg-white group-hover/btn:text-black transition-all shadow-sm">
                            →
                          </span>
                          <span>Read more</span>
                        </Link>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* =============================================================== */}
          {/* FLOATING CIRCULAR FROSTED BUTTON WITH WHITE RING (From Ref Img) */}
          {/* =============================================================== */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 md:right-8 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-white/90 bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md shadow-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Next Exhibition Banner"
          >
            <ChevronRight className="h-6 w-6 stroke-[3]" />
          </button>

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-white/90 bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md shadow-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Previous Exhibition Banner"
            >
              <ChevronLeft className="h-6 w-6 stroke-[3]" />
            </button>
          )}

        </div>

        {/* Bottom Pagination Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
