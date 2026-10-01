'use client';

/**
 * @file GoogleCalendarButton.js
 * @description Reusable, reactive Google Calendar & Reminder CTA button.
 * Integrates into event headers, cards, sticky bars, and modals.
 * Reflects live reminder status and opens GoogleCalendarModal.
 */

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Bell, Sparkles } from 'lucide-react';
import { isEventReminderSet } from '../utils/calendarUtils.js';
import GoogleCalendarModal from './GoogleCalendarModal.js';
import { useAuth } from '../context/AuthContext.js';

export default function GoogleCalendarButton({
  event,
  variant = 'outline', // 'primary', 'outline', 'pill', 'compact', 'mini'
  className = '',
  buttonText = null,
  showActiveLabel = true,
  onReminderChange = null
}) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);

  const eventIdentifier = event?.slug || event?._id || String(event?.id || '');

  // Check reminder status on mount and subscribe to updates
  useEffect(() => {
    if (!eventIdentifier) return;

    const checkStatus = () => {
      setHasReminder(isEventReminderSet(eventIdentifier));
    };

    checkStatus();

    // Listen for custom reminder updates across components
    if (typeof window !== 'undefined') {
      window.addEventListener('visitexpo_reminder_updated', checkStatus);
      return () => {
        window.removeEventListener('visitexpo_reminder_updated', checkStatus);
      };
    }
  }, [eventIdentifier]);

  if (!event) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleReminderSaved = (provider) => {
    setHasReminder(true);
    if (onReminderChange) onReminderChange(true, provider);
  };

  // Google Calendar "G" Multi-color icon
  const GoogleCalIcon = () => (
    <span className="relative flex items-center justify-center shrink-0">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        <path fill="#EA4335" d="M12 10.5h-1.5v3H9v-3H7.5V9H12v1.5z" />
      </svg>
    </span>
  );

  // Variant Styling
  let variantClasses = '';
  let content = null;

  if (variant === 'primary') {
    variantClasses = hasReminder
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold'
      : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-black shadow-sm border border-amber-400';
    content = (
      <>
        {hasReminder ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
        ) : (
          <Calendar className="h-4 w-4 text-zinc-950" />
        )}
        <span>
          {buttonText || (hasReminder ? 'Reminder Set ✓' : 'Google Calendar Reminder')}
        </span>
      </>
    );
  } else if (variant === 'pill') {
    variantClasses = hasReminder
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold hover:bg-emerald-100'
      : 'bg-[#FFCC00]/20 text-amber-950 border-amber-300 font-extrabold hover:bg-[#FFCC00]/35';
    content = (
      <>
        {hasReminder ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <GoogleCalIcon />
        )}
        <span>
          {buttonText || (hasReminder ? 'Reminder Set' : 'Google Calendar')}
        </span>
      </>
    );
  } else if (variant === 'compact') {
    variantClasses = hasReminder
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold'
      : 'bg-white hover:bg-amber-50/70 text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:border-amber-400 font-bold';
    content = (
      <>
        {hasReminder ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <GoogleCalIcon />
        )}
        <span className="hidden sm:inline">
          {buttonText || (hasReminder ? 'Reminder Active' : 'Add to Calendar')}
        </span>
      </>
    );
  } else if (variant === 'mini') {
    variantClasses = hasReminder
      ? 'p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
      : 'p-1.5 rounded-lg bg-white hover:bg-amber-50 text-zinc-600 hover:text-zinc-950 border border-zinc-200 hover:border-amber-400';
    content = (
      <div title={hasReminder ? 'Google Calendar Reminder is Active' : 'Set Google Calendar Reminder'}>
        {hasReminder ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Calendar className="h-4 w-4 text-amber-600" />
        )}
      </div>
    );
  } else {
    // Default 'outline'
    variantClasses = hasReminder
      ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
      : 'bg-white hover:bg-amber-50/70 text-zinc-800 hover:text-zinc-950 border-zinc-200 hover:border-amber-400 font-bold';
    content = (
      <>
        {hasReminder ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        ) : (
          <GoogleCalIcon />
        )}
        <span className="truncate">
          {buttonText || (hasReminder ? 'Reminder Set ✓' : 'Add to Google Calendar')}
        </span>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer ${variantClasses} ${className}`}
        title={hasReminder ? 'Click to view or edit calendar reminder' : 'Add event to Google Calendar with custom reminders'}
      >
        {content}
      </button>

      {/* Interactive Modal */}
      <GoogleCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        user={user}
        onReminderSaved={handleReminderSaved}
      />
    </>
  );
}
