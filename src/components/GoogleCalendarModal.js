'use client';

/**
 * @file GoogleCalendarModal.js
 * @description Interactive Google Calendar Sync & Event Reminder Modal.
 * Styled to perfectly match VisitExpo's signature color theme:
 * Dark slate / zinc, warm yellow gold (#FFCC00), and accent red/pink (#FF2E63).
 * Enables 1-click addition to Google Calendar, custom reminder scheduling,
 * attendee email alerts, Outlook sync, and universal .ics download.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  ExternalLink,
  Download,
  Share2,
  Mail,
  MapPin,
  X,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Info,
  Trash2
} from 'lucide-react';
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  downloadIcsFile,
  parseEventDates,
  saveEventReminder,
  removeEventReminder,
  getEventReminder
} from '../utils/calendarUtils.js';

// Predefined reminder timing options
const REMINDER_OPTIONS = [
  { id: '7d', label: '1 Week before', description: 'Plan travel & booth itinerary' },
  { id: '48h', label: '2 Days before', description: 'Confirm team & digital passes' },
  { id: '24h', label: '1 Day before', description: 'Badge print & arrival reminder', default: true },
  { id: '2h', label: '2 Hours before', description: 'Doors open & parking prep' },
  { id: '1h', label: '1 Hour before', description: 'Head to exhibition hall', default: true },
  { id: '15m', label: '15 Mins before', description: 'Keynote & opening bell', default: true },
  { id: '0m', label: 'At event start', description: 'Live event alert' }
];

export default function GoogleCalendarModal({
  isOpen,
  onClose,
  event,
  user = null,
  onReminderSaved = null
}) {
  const [selectedReminders, setSelectedReminders] = useState(['24h', '1h', '15m']);
  const [userEmail, setUserEmail] = useState('');
  const [activeProvider, setActiveProvider] = useState('google');
  const [channels, setChannels] = useState({ email: true, inApp: true, browser: true });
  const [isSaved, setIsSaved] = useState(false);
  const [savedTimeStr, setSavedTimeStr] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const eventIdentifier = event?.slug || event?._id || String(event?.id || '');

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen || !event) return;

    if (user?.email) {
      setUserEmail(user.email);
    } else {
      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_user_email') : '';
      if (storedEmail) setUserEmail(storedEmail);
    }

    const existingReminder = getEventReminder(eventIdentifier);
    if (existingReminder) {
      setIsSaved(true);
      if (existingReminder.reminderTimes && Array.isArray(existingReminder.reminderTimes)) {
        setSelectedReminders(existingReminder.reminderTimes);
      }
      if (existingReminder.provider) {
        setActiveProvider(existingReminder.provider);
      }
      if (existingReminder.savedAt) {
        setSavedTimeStr(new Date(existingReminder.savedAt).toLocaleDateString());
      }
    } else {
      setIsSaved(false);
      setSelectedReminders(['24h', '1h', '15m']);
    }
  }, [isOpen, event, user, eventIdentifier]);

  if (!isOpen || !event) return null;

  const { start, end } = parseEventDates(event);
  const formattedDates = event?.dates || `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const venueTitle = event?.location?.venueName || event?.venue || event?.city || 'Exhibition Centre';
  const fullLocation = [venueTitle, event?.city, event?.country || 'India'].filter(Boolean).join(', ');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  const toggleReminder = (id) => {
    setSelectedReminders((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // 1-Click Launch into Google Calendar
  const handleOpenGoogleCalendar = async () => {
    setIsSyncing(true);
    try {
      await saveEventReminder(event, {
        provider: 'google',
        reminderTimes: selectedReminders,
        userEmail: userEmail.trim(),
        channels
      });
      setIsSaved(true);
      setSavedTimeStr('Just now');
      if (onReminderSaved) onReminderSaved('google');

      const googleUrl = buildGoogleCalendarUrl(event, {
        userEmail: userEmail.trim(),
        reminderNotice: selectedReminders.length > 0 ? `Alerts set for ${selectedReminders.join(', ')}` : null
      });

      window.open(googleUrl, '_blank', 'noopener,noreferrer');
      showNotification('Google Calendar opened! Event details and reminders transferred.');
    } catch (err) {
      console.error('Failed to sync to Google Calendar:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1-Click Launch into Outlook
  const handleOpenOutlook = async () => {
    setIsSyncing(true);
    try {
      await saveEventReminder(event, {
        provider: 'outlook',
        reminderTimes: selectedReminders,
        userEmail: userEmail.trim(),
        channels
      });
      setIsSaved(true);
      if (onReminderSaved) onReminderSaved('outlook');

      const outlookUrl = buildOutlookCalendarUrl(event, { userEmail: userEmail.trim() });
      window.open(outlookUrl, '_blank', 'noopener,noreferrer');
      showNotification('Outlook Calendar opened! Event compose ready.');
    } catch (err) {
      console.error('Failed to sync Outlook:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Download Universal .ics
  const handleDownloadIcs = async () => {
    try {
      await saveEventReminder(event, {
        provider: 'ics',
        reminderTimes: selectedReminders,
        userEmail: userEmail.trim(),
        channels
      });
      setIsSaved(true);
      if (onReminderSaved) onReminderSaved('ics');
      downloadIcsFile(event, selectedReminders);
      showNotification('Universal .ics file downloaded! Double-click to add to Apple or Outlook Calendar.');
    } catch (err) {
      console.error('Failed to download .ics:', err);
    }
  };

  // Save Reminder settings without immediately opening external calendar
  const handleSaveReminderOnly = async () => {
    setIsSyncing(true);
    try {
      await saveEventReminder(event, {
        provider: activeProvider,
        reminderTimes: selectedReminders,
        userEmail: userEmail.trim(),
        channels
      });
      setIsSaved(true);
      setSavedTimeStr('Just now');
      if (onReminderSaved) onReminderSaved(activeProvider);
      showNotification('✓ Reminder schedule saved! You will receive notifications before the expo.');
    } catch (err) {
      console.error('Failed to save reminder:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Remove existing reminder
  const handleRemoveReminder = () => {
    removeEventReminder(eventIdentifier);
    setIsSaved(false);
    showNotification('Reminder removed for this exhibition.');
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://visitexpo.in';
    const link = `${origin}/expo/${event?.slug || event?._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl my-auto bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header: VisitExpo Brand Dark Slate Theme */}
        <div className="bg-zinc-950 text-white p-5 sm:p-6 relative border-b border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Badge: VisitExpo Gold */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FFCC00] text-zinc-950 shadow-2xs">
              Google Calendar
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Sync &amp; Reminders
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight line-clamp-2 pr-6">
            {event?.title}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 mt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/15">
              <Calendar className="h-3.5 w-3.5 text-[#FFCC00]" />
              {formattedDates}
            </span>
            <span className="inline-flex items-center gap-1 truncate max-w-xs text-zinc-300">
              <MapPin className="h-3.5 w-3.5 text-[#FF2E63] shrink-0" />
              <span className="truncate">{fullLocation}</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-zinc-800">
          
          {/* Active Reminder Status Banner if already set */}
          {isSaved && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-emerald-950">
                    Google Calendar Reminder is Active
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Configured for: {selectedReminders.join(', ')} before exhibition
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveReminder}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                title="Remove reminder"
              >
                <Trash2 className="h-3 w-3" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* Toast Notification alert */}
          {toastMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. Quick One-Click Google Calendar Action (VisitExpo Gold & Slate Theme) */}
          <div className="bg-gradient-to-br from-amber-50/40 via-zinc-50 to-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                  <span>1-Click Google Calendar Sync</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-zinc-900 text-[#FFCC00]">
                    Recommended
                  </span>
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Adds dates, hall venue, digital badge link, and pre-sets mobile push alerts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenGoogleCalendar}
              disabled={isSyncing}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] active:bg-amber-500 text-zinc-950 font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] border border-amber-400"
            >
              {/* Google Brand "G" Icon / Logo */}
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M21.35 11.1h-9.17v2.73h5.27c-.23 1.2-1.37 3.52-5.27 3.52-3.17 0-5.76-2.59-5.76-5.78s2.59-5.78 5.76-5.78c1.81 0 3.02.77 3.71 1.44l2.16-2.08C21.94 3.82 19.38 3 12.18 3 7.21 3 3.18 7.03 3.18 12s4.03 9 9 9c5.2 0 8.65-3.66 8.65-8.81 0-.6-.06-1.18-.18-1.09z"/>
              </svg>
              <span>Add to Google Calendar Now</span>
              <ExternalLink className="h-4 w-4 text-zinc-900" />
            </button>
          </div>

          {/* 2. Reminder Timing Options */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#FF2E63]" />
                <span>When should we remind you?</span>
              </label>
              <span className="text-[11px] text-zinc-500 font-medium">Select one or more</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REMINDER_OPTIONS.map((opt) => {
                const checked = selectedReminders.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleReminder(opt.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      checked
                        ? 'bg-amber-50/80 border-amber-400 text-zinc-950 ring-1 ring-amber-300 shadow-2xs'
                        : 'bg-zinc-50/80 border-zinc-200 hover:border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 mt-0.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        checked ? 'bg-zinc-950 border-zinc-950 text-[#FFCC00]' : 'border-zinc-300 bg-white'
                      }`}
                    >
                      {checked && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>{opt.label}</span>
                        {opt.default && (
                          <span className="text-[9px] font-extrabold text-amber-900 bg-[#FFCC00]/40 px-1 rounded border border-amber-300">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Attendee Notification Email */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#FF2E63]" />
              <span>Attendee Email for Calendar Invites &amp; Alerts</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 transition-all outline-none"
              />
              {userEmail && (
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Synced
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              We send calendar invites directly to this address so alerts pop up on your mobile calendar and smart watch.
            </p>
          </div>

          {/* 4. Alternative Calendar Options (Outlook, Apple / iCal, Universal) */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-600">
              Other Calendar Formats
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleOpenOutlook}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-zinc-900 group-hover:text-[#FF2E63] flex items-center justify-between">
                  <span>Outlook Web</span>
                  <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-[#FF2E63]" />
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Office 365 / Hotmail</div>
              </button>

              <button
                type="button"
                onClick={handleDownloadIcs}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-zinc-900 group-hover:text-[#FF2E63] flex items-center justify-between">
                  <span>Apple / iCal</span>
                  <Download className="h-3 w-3 text-zinc-400 group-hover:text-[#FF2E63]" />
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Universal .ics file</div>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer group col-span-2 sm:col-span-1"
              >
                <div className="text-xs font-bold text-zinc-900 group-hover:text-[#FF2E63] flex items-center justify-between">
                  <span>{copiedLink ? 'Copied!' : 'Share Event'}</span>
                  <Share2 className="h-3 w-3 text-zinc-400 group-hover:text-[#FF2E63]" />
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Copy official link</div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500">
            {isSaved ? `✓ Last saved: ${savedTimeStr}` : 'Reminders trigger automatically based on your local timezone.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveReminderOnly}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs font-bold transition-all cursor-pointer"
            >
              {isSaved ? 'Update Reminder Settings' : 'Save Preferences'}
            </button>

            <button
              type="button"
              onClick={handleOpenGoogleCalendar}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border border-amber-400"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-950" />
              <span>Open in Google Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
