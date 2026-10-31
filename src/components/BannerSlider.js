'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { sortEventsByStartDate } from '../utils/eventDates.js';
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

const isEventExpired = (event) => {
  const endDate = event?.endDate || event?.startDate;
  if (!endDate) return false;

  const parsedDate = new Date(endDate);
  if (Number.isNaN(parsedDate.getTime())) return false;

  parsedDate.setHours(23, 59, 59, 999);
  return parsedDate < new Date();
};

const normalizeBannerLink = (link, slug) => {
  const fallbackLink = slug ? `/expo/${slug}` : '/events';
  if (!link) return fallbackLink;

  try {
    const url = new URL(link, window.location.origin);
    if (url.origin === window.location.origin && url.pathname.startsWith('/event/')) {
      url.pathname = url.pathname.replace(/^\/event\//, '/expo/');
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return fallbackLink;
  }

  return link;
};

export default function BannerSlider() {
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const timerRef = useRef(null);

  // Responsive dimension tracker for smooth peek/active carousel offset
  const [carouselMetrics, setCarouselMetrics] = useState({
    activeWidth: 560,
    inactiveWidth: 230,
    gap: 20,
    peekOffset: 64
  });

  // Measure screen size to adjust card dimensions
  useEffect(() => {
    const updateMetrics = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setCarouselMetrics({
          activeWidth: Math.min(w - 32, 340),
          inactiveWidth: 160,
          gap: 12,
          peekOffset: 16
        });
      } else if (w < 768) {
        setCarouselMetrics({
          activeWidth: 430,
          inactiveWidth: 190,
          gap: 16,
          peekOffset: 36
        });
      } else if (w < 1024) {
        setCarouselMetrics({
          activeWidth: 500,
          inactiveWidth: 210,
          gap: 20,
          peekOffset: 48
        });
      } else {
        setCarouselMetrics({
          activeWidth: 560,
          inactiveWidth: 230,
          gap: 20,
          peekOffset: 64
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
          axios.get(`${API_URL}/events?limit=50&status=published&sort=%7B%22createdAt%22%3A-1%7D`, { timeout: 2500 })
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
        activeBanners.filter((banner) => !isEventExpired(banner.event)).forEach((b, i) => {
          combined.push({
            _id: b._id || `banner-${i}`,
            title: b.headline || b.event?.title || 'Featured Exhibition',
            city: b.event?.city || 'India',
            dates: b.event?.dates || '',
            badge: b.badgeText || BADGE_CONFIG[i % BADGE_CONFIG.length].label,
            badgeColor: BADGE_CONFIG[i % BADGE_CONFIG.length].color,
            image: b.bannerImage || b.event?.bannerImage || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
            slug: b.event?.slug,
            link: normalizeBannerLink(b.ctaLink, b.event?.slug),
            organizer: b.organizer?.company || b.organizer?.name || 'VisitExpo Verified',
            isCustomBanner: true
          });
        });

        // 2. Fill remaining slots with the 6 events from DB
        const eventsSource = sortEventsByStartDate(rawEvents.filter((event) => !isEventExpired(event)));
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
              : (e.dates || ''),
            badge: BADGE_CONFIG[configIdx].label,
            badgeColor: BADGE_CONFIG[configIdx].color,
            image: bannerImg,
            slug: e.slug,
            link: e.slug ? `/expo/${e.slug}` : '/events',
            organizer: e.orgName || e.organizer?.company || 'VisitExpo Partner',
            isCustomBanner: false
          });
        });

        setSlides(combined.slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured spotlight events:', err);
        setSlides([]);
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
      <div className="w-full bg-[#18181b] py-4 px-4">
        <div className="max-w-6xl mx-auto h-[270px] sm:h-[300px] rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  // Calculate carousel horizontal translation to keep active card centered with peek
  const { activeWidth, inactiveWidth, gap, peekOffset } = carouselMetrics;
  const currentTranslateX =
    currentIndex === 0
      ? 0
      : Math.max(0, currentIndex * (inactiveWidth + gap) - peekOffset);

  return (
    <section
      aria-label="Featured Exhibitions Banner Slider"
      className="relative w-full overflow-hidden select-none border-y border-zinc-800/80 bg-gradient-to-b from-[#1b1c20] to-[#141518] py-4 sm:py-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">

        {/* Header Bar */}
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 sm:text-[11px]">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              Featured Spotlight
            </span>
            <span className="hidden text-xs font-medium text-zinc-400 sm:inline">
              Top 6 Verified Exhibitions &amp; Growth Summits
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
            <Link
              href="/banner-spotlight"
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition-colors hover:bg-amber-400/20 hover:text-white sm:text-[11px]"
            >
              <span>Feature Your Event</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            {/* Slider Navigation */}
            {slides.length > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-900/90 p-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Slide"
                  className="h-5 w-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
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
        <div className="relative w-full overflow-hidden rounded-2xl py-1">
          <div
            className="flex items-center gap-3 transition-transform duration-700 ease-out sm:gap-4 md:gap-5"
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
                    else {
                      handleBannerClick(slide);
                      router.push(slide.link);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                    e.preventDefault();
                    if (!isActive) setCurrentIndex(idx);
                    else {
                      handleBannerClick(slide);
                      router.push(slide.link);
                    }
                  }}
                  role={isActive ? 'link' : 'button'}
                  tabIndex={0}
                  aria-label={isActive ? `View details for ${slide.title}` : `Show ${slide.title}`}
                  className={`group relative h-[250px] shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-xl transition-all duration-700 sm:h-[270px] md:h-[300px] ${
                    isActive
                      ? 'ring-1 ring-white/20'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ width: `${isActive ? activeWidth : inactiveWidth}px` }}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5 md:p-6">

                    {/* Top Row: Pill Badge + City */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md ${slide.badgeColor}`}
                      >
                        {slide.badge}
                      </span>

                      {isActive && slide.city && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md sm:text-[11px]">
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

                      {slide.dates && (
                        <div className="text-[11px] font-medium text-white/80 sm:text-xs">
                          {slide.dates}
                        </div>
                      )}

                      {/* Read More Action Link with circular arrow icon */}
                      <div className="pt-1">
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
            className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white hover:text-black active:scale-95 sm:right-4 sm:h-10 sm:w-10"
            title="Next Exhibition Banner"
          >
            <ChevronRight className="h-5 w-5 stroke-[2.5]" />
          </button>

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white hover:text-black active:scale-95 sm:left-4 sm:h-10 sm:w-10"
              title="Previous Exhibition Banner"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

        </div>

        {/* Bottom Pagination Dots */}
        {slides.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 sm:mt-4">
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
