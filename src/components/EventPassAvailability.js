import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { isEventExpired } from '../utils/eventDates.js';

export default function EventPassAvailability({ event, children, className = '' }) {
  if (!isEventExpired(event)) return children;

  return (
    <span
      role="status"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-center text-xs font-bold text-zinc-600 ${className}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
      <span>Show Concluded</span>
      <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">
        Past Show
      </span>
    </span>
  );
}
