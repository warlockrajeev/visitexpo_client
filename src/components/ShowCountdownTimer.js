'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Timer, CheckCircle2, Flame, Calendar } from 'lucide-react';

/**
 * Helper to safely pad numbers with leading zeros (e.g. 5 -> "05")
 */
function pad(num) {
  const n = Math.max(0, Math.floor(Number(num) || 0));
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Helper to parse start & end timestamps from event dates and optional timings string.
 */
function parseEventTimestamps(startDate, endDate, timings) {
  if (!startDate) return { startMs: null, endMs: null, isValid: false };

  const startObj = new Date(startDate);
  if (isNaN(startObj.getTime())) return { startMs: null, endMs: null, isValid: false };

  // If time is 00:00:00 (date-only ISO string or midnight), check timings string or default to 9:00 AM local
  let startMs = startObj.getTime();
  const isMidnight = startObj.getHours() === 0 && startObj.getMinutes() === 0;

  if (isMidnight && timings && typeof timings === 'string') {
    const match = timings.match(/([0-9]{1,2}):([0-9]{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3].toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      startObj.setHours(hours, minutes, 0, 0);
      startMs = startObj.getTime();
    } else {
      // Default expo opening time 09:00 AM
      startObj.setHours(9, 0, 0, 0);
      startMs = startObj.getTime();
    }
  }

  // End Date parsing
  let endMs = null;
  if (endDate) {
    const endObj = new Date(endDate);
    if (!isNaN(endObj.getTime())) {
      if (endObj.getHours() === 0 && endObj.getMinutes() === 0) {
        // If midnight, set to end of that day 23:59:59 (or 18:00 expo close)
        endObj.setHours(23, 59, 59, 999);
      }
      endMs = endObj.getTime();
    }
  }

  // If no end date, default to end of start date
  if (!endMs) {
    const fallbackEnd = new Date(startMs);
    fallbackEnd.setHours(23, 59, 59, 999);
    endMs = fallbackEnd.getTime();
  }

  return { startMs, endMs, isValid: true };
}

/**
 * ShowCountdownTimer Component
 * Computes exact days, hours, minutes, and seconds remaining for any trade show or event.
 *
 * Props:
 * - startDate: ISO string or Date
 * - endDate: ISO string or Date (optional)
 * - timings: string (e.g. "9:00 AM - 6:00 PM")
 * - variant: 'card' (default) | 'compact' | 'pill' | 'badge' | 'modal'
 * - showSeconds: boolean (default true)
 * - className: optional string
 */
export default function ShowCountdownTimer({
  startDate,
  endDate,
  timings = '',
  variant = 'card',
  showSeconds = true,
  className = ''
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { startMs, endMs, isValid } = useMemo(
    () => parseEventTimestamps(startDate, endDate, timings),
    [startDate, endDate, timings]
  );

  // If date is invalid or missing, render nothing
  if (!isValid || !startMs) {
    return null;
  }

  // Formatted date string for labels
  const formattedStartDate = useMemo(() => {
    try {
      return new Date(startMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }, [startMs]);

  const formattedEndDate = useMemo(() => {
    if (!endMs) return '';
    try {
      return new Date(endMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }, [endMs]);

  // Determine State: 'upcoming' | 'live' | 'ended'
  let status = 'upcoming';
  let diff = 0;

  if (now < startMs) {
    status = 'upcoming';
    diff = Math.max(0, startMs - now);
  } else if (endMs && now <= endMs) {
    status = 'live';
    diff = Math.max(0, endMs - now);
  } else {
    status = 'ended';
    diff = 0;
  }

  // Time calculations
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Days left badge text
  let daysLeftBadge = `${days} Days Left`;
  if (days === 0 && status === 'upcoming') {
    daysLeftBadge = hours > 0 ? `Starts in ${hours}h` : 'Starting Soon!';
  } else if (days === 1 && status === 'upcoming') {
    daysLeftBadge = 'Starts Tomorrow!';
  } else if (status === 'live') {
    daysLeftBadge = 'Live Today!';
  } else if (status === 'ended') {
    daysLeftBadge = 'Completed';
  }

  // SSR Placeholder to prevent Next.js hydration mismatch
  if (!mounted) {
    return (
      <div className={`animate-pulse rounded-xl bg-secondary/40 border border-border/50 p-2.5 ${className}`}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Loading Show Timer...
          </span>
          <span className="font-mono text-[11px] font-bold">--d --h --m</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE C: EVENT HAS CONCLUDED
  // =========================================================================
  if (status === 'ended') {
    if (variant === 'badge' || variant === 'pill') {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20 ${className}`}
        >
          <CheckCircle2 className="h-3 w-3" /> Show Concluded
        </span>
      );
    }
    return (
      <div
        className={`rounded-xl border border-border/70 bg-secondary/30 dark:bg-zinc-900/30 p-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-zinc-500/10 text-zinc-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-foreground block text-[11px]">Show Concluded</span>
            <span className="text-[10px] text-muted-foreground">Ended on {formattedEndDate || formattedStartDate}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/60">
          Past Show
        </span>
      </div>
    );
  }

  // =========================================================================
  // STATE B: EVENT IS CURRENTLY LIVE
  // =========================================================================
  if (status === 'live') {
    if (variant === 'badge' || variant === 'pill') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          LIVE NOW ({days > 0 ? `${days}d ` : ''}{pad(hours)}h {pad(minutes)}m left)
        </span>
      );
    }

    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-3 shadow-xs space-y-2.5 ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Expo Live Now
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
            <Flame className="h-3 w-3 text-emerald-500" /> In Progress
          </span>
        </div>

        {/* 4 Segmented Digital Time Blocks (Time Remaining in Expo) */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-card/90 dark:bg-zinc-900/90 border border-emerald-500/25 shadow-2xs">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
              {pad(days)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Days Left
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-card/90 dark:bg-zinc-900/90 border border-emerald-500/25 shadow-2xs">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
              {pad(hours)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Hours
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-card/90 dark:bg-zinc-900/90 border border-emerald-500/25 shadow-2xs">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
              {pad(minutes)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Mins
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-card/90 dark:bg-zinc-900/90 border border-emerald-500/25 shadow-2xs">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-emerald-500 leading-none">
              {pad(seconds)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Secs
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-emerald-500/15">
          <span>Gate QR scanner active today</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ends {formattedEndDate}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE A: UPCOMING SHOW COUNTDOWN (MAIN)
  // =========================================================================

  // Variant: Pill / Compact Inline
  if (variant === 'compact' || variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/5 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs ${className}`}
        title={`Show starts on ${formattedStartDate}`}
      >
        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
        <span className="font-mono tracking-tight">
          {days}d {pad(hours)}h {pad(minutes)}m {showSeconds ? `${pad(seconds)}s` : ''}
        </span>
        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200">
          {daysLeftBadge}
        </span>
      </div>
    );
  }

  // Variant: Badge chip only
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/35 shadow-2xs ${className}`}
        title={`Starts on ${formattedStartDate}`}
      >
        <Clock className="h-3 w-3 text-amber-500 animate-pulse" /> {daysLeftBadge}
      </span>
    );
  }

  // Variant: Modal Banner (Large Centered for QR Badge modal)
  if (variant === 'modal') {
    return (
      <div
        className={`rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card to-card p-4 text-center space-y-2.5 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>Show Countdown Timer</span>
        </div>

        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card border border-border shadow-xs">
            <span className="text-xl font-black font-mono text-foreground leading-none">{pad(days)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Days</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card border border-border shadow-xs">
            <span className="text-xl font-black font-mono text-foreground leading-none">{pad(hours)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Hours</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card border border-border shadow-xs">
            <span className="text-xl font-black font-mono text-foreground leading-none">{pad(minutes)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Mins</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card border border-border shadow-xs">
            <span className="text-xl font-black font-mono text-amber-500 leading-none">{pad(seconds)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Secs</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span>Starts: <strong className="text-foreground">{formattedStartDate}</strong></span>
          {timings ? <span>• {timings}</span> : null}
        </div>
      </div>
    );
  }

  // Variant: Full Card (Default for Visitor Pass cards)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-card to-card p-3 sm:p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-amber-500/40 hover:shadow-xs group/timer ${className}`}
    >
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-20 w-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

      {/* Header Row: Label & Days Left Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="h-3 w-3 animate-pulse" />
          </div>
          <span className="text-[11px] font-extrabold text-foreground tracking-tight">
            Show Starts In
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          {daysLeftBadge}
        </span>
      </div>

      {/* 4 Segmented Digital Timer Blocks */}
      <div className="relative z-10 grid grid-cols-4 gap-1.5 text-center">
        {/* Days */}
        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card/95 dark:bg-zinc-900/90 border border-border/80 shadow-2xs group-hover/timer:border-amber-500/30 transition-colors">
          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
            {pad(days)}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mt-1">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card/95 dark:bg-zinc-900/90 border border-border/80 shadow-2xs group-hover/timer:border-amber-500/30 transition-colors">
          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
            {pad(hours)}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mt-1">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-card/95 dark:bg-zinc-900/90 border border-border/80 shadow-2xs group-hover/timer:border-amber-500/30 transition-colors">
          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground leading-none">
            {pad(minutes)}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mt-1">
            Mins
          </span>
        </div>

        {/* Seconds (Active Ticking Accent) */}
        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-b from-amber-500/10 to-card/95 dark:from-amber-500/15 dark:to-zinc-900/90 border border-amber-500/30 shadow-2xs">
          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-500 leading-none">
            {pad(seconds)}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1">
            Secs
          </span>
        </div>
      </div>

      {/* Footer Meta Row */}
      <div className="relative z-10 flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
        <span className="truncate">
          Starts: <strong className="font-semibold text-foreground">{formattedStartDate}</strong>
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[9px] text-amber-600 dark:text-amber-400 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
          Live Ticker
        </span>
      </div>
    </div>
  );
}
