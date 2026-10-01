/**
 * @file calendarUtils.js
 * @description Client-side utility for Google Calendar synchronization,
 * Outlook calendar linking, RFC 5545 .ics generation, date parsing,
 * and reminder storage/preferences synchronization.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

/**
 * Intelligently parse event start and end dates from event object,
 * handling ISO strings, timestamps, and textual date ranges (e.g., '25 - 28 Mar, 2026').
 */
export function parseEventDates(event) {
  let start = null;
  let end = null;

  if (event?.startDate) {
    const s = new Date(event.startDate);
    if (!isNaN(s.getTime())) start = s;
  }
  if (event?.endDate) {
    const e = new Date(event.endDate);
    if (!isNaN(e.getTime())) end = e;
  }

  // If start or end are missing, attempt parsing event.dates or event.date
  const rawDates = event?.dates || event?.date || event?.dateRange;
  if ((!start || !end) && typeof rawDates === 'string') {
    const cleaned = rawDates.trim();

    // Pattern A: '25 - 28 Mar, 2026' or '25-28 March 2026' or '25 to 28 Mar 2026'
    const patternA = cleaned.match(/^(\d{1,2})\s*[-–to]+\s*(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})/i);
    if (patternA) {
      const [, startDay, endDay, month, year] = patternA;
      const parsedS = new Date(`${month} ${startDay}, ${year} 09:00:00`);
      const parsedE = new Date(`${month} ${endDay}, ${year} 18:00:00`);
      if (!isNaN(parsedS.getTime())) start = parsedS;
      if (!isNaN(parsedE.getTime())) end = parsedE;
    } else {
      // Pattern B: '25 Mar - 28 Mar 2026' or '25 Mar 2026 - 28 Mar 2026'
      const parts = cleaned.split(/[-–]|(?:\s+to\s+)/i).map((s) => s.trim());
      if (parts.length === 2) {
        const yearMatch = cleaned.match(/\b(202\d|203\d)\b/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

        let sStr = parts[0];
        let eStr = parts[1];

        if (!/\b(202\d|203\d)\b/.test(sStr) && year) sStr += ` ${year}`;
        if (!/\b(202\d|203\d)\b/.test(eStr) && year) eStr += ` ${year}`;

        const parsedS = new Date(`${sStr} 09:00:00`);
        const parsedE = new Date(`${eStr} 18:00:00`);

        if (!isNaN(parsedS.getTime())) start = parsedS;
        if (!isNaN(parsedE.getTime())) end = parsedE;
      } else {
        // Pattern C: Single day '15 Nov 2026' or 'November 15, 2026'
        const singleParsed = new Date(cleaned);
        if (!isNaN(singleParsed.getTime())) {
          start = new Date(singleParsed);
          start.setHours(9, 0, 0, 0);
          end = new Date(singleParsed);
          end.setHours(18, 0, 0, 0);
        }
      }
    }
  }

  // Graceful fallback: 7 days from now, 9 AM to 6 PM
  if (!start || isNaN(start.getTime())) {
    start = new Date();
    start.setDate(start.getDate() + 7);
    start.setHours(9, 0, 0, 0);
  }

  if (!end || isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime());
    end.setHours(start.getHours() + 9); // Full exhibition day
  }

  return { start, end };
}

/**
 * Format a Date to RFC 5545 / Google Calendar UTC string (YYYYMMDDTHHmmssZ)
 */
export function formatDateToGoogleUtc(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Construct 1-click Google Calendar web creation URL with all event details,
 * official page link, venue, and digital pass reminder tips.
 */
export function buildGoogleCalendarUrl(event, options = {}) {
  const { start, end } = parseEventDates(event);
  const startStr = formatDateToGoogleUtc(start);
  const endStr = formatDateToGoogleUtc(end);

  const title = event?.title || 'VisitExpo Trade Exhibition';
  const venue = event?.location?.venueName || event?.venue || event?.city || 'Exhibition Centre';
  const locationParts = [venue, event?.city, event?.state, event?.country || 'India'].filter(Boolean);
  const fullLocation = Array.from(new Set(locationParts)).join(', ');

  const eventSlug = event?.slug || event?._id || event?.id || 'event';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://visitexpo.in';
  const eventUrl = `${origin}/expo/${eventSlug}`;

  const cleanDescription = (event?.description || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .substring(0, 450);

  const reminderText = options.reminderNotice
    ? `\n★ Reminder: ${options.reminderNotice}`
    : '\n★ Reminder: Present your VisitExpo digital pass at the registration desk for fast-track badge printing.';

  const details = [
    `Exhibition: ${title}`,
    event?.category ? `Industry: ${event.category}` : null,
    event?.organizer ? `Organizer: ${event.organizer}` : null,
    `Dates: ${event?.dates || start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    `Official Event Page: ${eventUrl}`,
    '',
    cleanDescription ? `${cleanDescription}...` : 'Official trade exhibition and conference.',
    reminderText
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: fullLocation,
    trp: 'true'
  });

  if (options.userEmail) {
    params.append('add', options.userEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Construct 1-click Microsoft Outlook Web Compose URL
 */
export function buildOutlookCalendarUrl(event, options = {}) {
  const { start, end } = parseEventDates(event);
  const title = event?.title || 'VisitExpo Trade Exhibition';
  const venue = event?.location?.venueName || event?.venue || event?.city || 'Exhibition Centre';
  const fullLocation = [venue, event?.city, event?.country || 'India'].filter(Boolean).join(', ');

  const eventSlug = event?.slug || event?._id || event?.id || 'event';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://visitexpo.in';
  const eventUrl = `${origin}/expo/${eventSlug}`;

  const body = `${title}\n\nVenue: ${fullLocation}\nOfficial Expo Page: ${eventUrl}\n\nFast-track pass included with VisitExpo registration.`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: body,
    location: fullLocation
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Generate RFC 5545 .ics calendar content with VALARM alarms for Apple/Universal Calendar
 */
export function generateIcsContent(event, options = {}) {
  const { start, end } = parseEventDates(event);
  const startUtc = formatDateToGoogleUtc(start);
  const endUtc = formatDateToGoogleUtc(end);
  const stampUtc = formatDateToGoogleUtc(new Date());

  const title = (event?.title || 'VisitExpo Exhibition').replace(/[\r\n]+/g, ' ');
  const venue = (event?.location?.venueName || event?.venue || event?.city || 'Exhibition Centre').replace(/[\r\n]+/g, ' ');
  const fullLocation = [venue, event?.city, event?.country || 'India'].filter(Boolean).join(', ');
  const eventSlug = event?.slug || event?._id || event?.id || 'event';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://visitexpo.in';
  const eventUrl = `${origin}/expo/${eventSlug}`;

  const uid = `visitexpo-${eventSlug}-${Date.now()}@visitexpo.in`;
  const reminderTimes = options.reminderTimes || ['24h', '1h', '15m'];

  let alarms = [];
  if (reminderTimes.includes('7d')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts in 1 week\r\nTRIGGER:-P7D\r\nEND:VALARM');
  }
  if (reminderTimes.includes('48h') || reminderTimes.includes('2d')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts in 2 days\r\nTRIGGER:-P2D\r\nEND:VALARM');
  }
  if (reminderTimes.includes('24h') || reminderTimes.includes('1d')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts tomorrow\r\nTRIGGER:-P1D\r\nEND:VALARM');
  }
  if (reminderTimes.includes('2h')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts in 2 hours\r\nTRIGGER:-PT2H\r\nEND:VALARM');
  }
  if (reminderTimes.includes('1h')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts in 1 hour\r\nTRIGGER:-PT1H\r\nEND:VALARM');
  }
  if (reminderTimes.includes('15m')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ' + title + ' starts in 15 minutes\r\nTRIGGER:-PT15M\r\nEND:VALARM');
  }
  if (reminderTimes.includes('0m')) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Happening Now: ' + title + '\r\nTRIGGER:-PT0M\r\nEND:VALARM');
  }

  if (alarms.length === 0) {
    alarms.push('BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Upcoming Expo Reminder\r\nTRIGGER:-PT1H\r\nEND:VALARM');
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VisitExpo Platform//Calendar Sync Service//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VisitExpo Events',
    'X-WR-TIMEZONE:UTC',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${title}\\nLocation: ${fullLocation}\\nEvent Details: ${eventUrl}`,
    `LOCATION:${fullLocation}`,
    `URL:${eventUrl}`,
    'STATUS:CONFIRMED',
    alarms.join('\r\n'),
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.join('\r\n');
}

/**
 * Direct browser trigger to download .ics calendar file
 */
export function downloadIcsFile(event, reminderTimes = ['24h', '1h', '15m']) {
  const icsData = generateIcsContent(event, { reminderTimes });
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${(event?.slug || event?.title || 'visitexpo-event').replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const LOCAL_STORAGE_REMINDERS_KEY = 'visitexpo_calendar_reminders';

/**
 * Retrieve all locally saved reminders
 */
export function getStoredReminders() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Check if a reminder has been configured for this event
 */
export function isEventReminderSet(eventIdOrSlug) {
  if (!eventIdOrSlug) return false;
  const reminders = getStoredReminders();
  return !!reminders[eventIdOrSlug];
}

/**
 * Get specific reminder info for an event
 */
export function getEventReminder(eventIdOrSlug) {
  if (!eventIdOrSlug) return null;
  const reminders = getStoredReminders();
  return reminders[eventIdOrSlug] || null;
}

/**
 * Save reminder preferences for an event in localStorage and sync with server
 */
export async function saveEventReminder(event, reminderConfig = {}) {
  if (!event) return;
  const key = event.slug || event._id || String(event.id);
  const { reminderTimes = ['24h', '1h', '15m'], provider = 'google', userEmail = '', channels = { email: true, inApp: true } } = reminderConfig;

  // 1. Save locally in localStorage for instant UI feedback
  if (typeof window !== 'undefined') {
    try {
      const stored = getStoredReminders();
      stored[key] = {
        eventId: event._id || event.id,
        eventSlug: event.slug,
        title: event.title,
        dates: event.dates,
        venue: event.venue || event.city,
        provider,
        reminderTimes,
        channels,
        userEmail,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(stored));
      // Dispatch storage event so other components update reactively
      window.dispatchEvent(new Event('visitexpo_reminder_updated'));
    } catch (e) {
      console.warn('Failed to save reminder in localStorage:', e);
    }
  }

  // 2. Sync with backend API
  try {
    const res = await fetch(`${API_URL}/calendar/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event._id || event.id,
        eventSlug: event.slug,
        provider,
        userEmail,
        reminderTimes,
        eventData: {
          title: event.title,
          slug: event.slug,
          dates: event.dates,
          startDate: event.startDate,
          endDate: event.endDate,
          venue: event.venue,
          city: event.city,
          country: event.country,
          description: event.description,
          organizer: event.organizer
        }
      })
    });
    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    // Return graceful offline success since local reminder is active
    return { success: true, localOnly: true, message: 'Reminder configured locally.' };
  }
}

/**
 * Remove reminder for an event
 */
export function removeEventReminder(eventIdOrSlug) {
  if (!eventIdOrSlug || typeof window === 'undefined') return;
  try {
    const stored = getStoredReminders();
    delete stored[eventIdOrSlug];
    localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(stored));
    window.dispatchEvent(new Event('visitexpo_reminder_updated'));
  } catch (e) {
    console.warn('Failed to remove reminder:', e);
  }
}
