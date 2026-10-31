'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, ExternalLink, LoaderCircle, Radio, Video } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

function getEventBounds(event) {
  const start = event.startDate ? new Date(event.startDate) : null;
  const end = event.endDate ? new Date(event.endDate) : null;
  if (end && end.getUTCHours() === 0 && end.getUTCMinutes() === 0 &&
      end.getUTCSeconds() === 0 && end.getUTCMilliseconds() === 0) {
    end.setUTCHours(23, 59, 59, 999);
  }
  return { start, end };
}

function formatTime(value) {
  if (!value) return 'Time not scheduled';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function getEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    if (['www.youtube.com', 'youtube.com'].includes(parsedUrl.hostname)) {
      if (parsedUrl.pathname === '/watch') {
        const videoId = parsedUrl.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : '';
      }
      return parsedUrl.pathname.startsWith('/embed/') ? parsedUrl.toString() : '';
    }
    if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : '';
    }
    if (parsedUrl.hostname === 'player.vimeo.com' &&
        parsedUrl.pathname.startsWith('/video/')) {
      return parsedUrl.toString();
    }
    if (parsedUrl.hostname === 'meet.jit.si') return parsedUrl.toString();
  } catch {
    return '';
  }
  return '';
}

function getEventState(event, stream) {
  const now = Date.now();
  const { start, end } = getEventBounds(event);
  if (end && end.getTime() < now) return 'ended';
  if (start && start.getTime() > now) return 'upcoming';
  if (stream.status === 'ended') return 'ended';
  if (!stream.enabled || stream.status !== 'live' || (!stream.streamUrl && !stream.zoomMeetingId)) {
    return 'offline';
  }
  return 'live';
}

export default function VirtualStreamPage() {
  const [access, setAccess] = useState(null);
  const [visitorId, setVisitorId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const requestedVisitorId = new URLSearchParams(window.location.search).get('visitorId') || '';
    setVisitorId(requestedVisitorId);
    if (!requestedVisitorId) {
      setError('This join link is missing its visitor registration ID.');
      setLoading(false);
      return;
    }

    let active = true;
    fetch(`${API_URL}/visitors/virtual-access/${encodeURIComponent(requestedVisitorId)}`, {
      cache: 'no-store'
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load this virtual event.');
        }
        if (active) {
          setAccess(result.data);
          setJoined(result.data.visitor.virtualJoinStatus === 'checked_in');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load this virtual event.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/visitors/virtual-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not verify this visitor registration.');
      }
      setJoined(true);
    } catch (requestError) {
      setError(requestError.message || 'Could not join this virtual event.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Verifying your visitor registration...
        </div>
      </main>
    );
  }

  if (error && !access) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-white">
          <Video className="mx-auto mb-4 h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-bold">Unable to open the virtual event</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
        </section>
      </main>
    );
  }

  const { event, stream, sessions, visitor } = access;
  const eventState = getEventState(event, stream);
  const streamUrl = stream.streamUrl ||
    (stream.zoomMeetingId ? `https://zoom.us/j/${encodeURIComponent(stream.zoomMeetingId.replace(/\s+/g, ''))}` : '');
  const embedUrl = getEmbedUrl(streamUrl);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
            <Radio className={`h-3.5 w-3.5 ${eventState === 'live' ? 'text-red-400' : 'text-slate-400'}`} />
            {eventState === 'live' ? 'Live event' : eventState === 'upcoming' ? 'Upcoming event' : eventState === 'ended' ? 'Event concluded' : 'Stream offline'}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Welcome{visitor.name ? `, ${visitor.name}` : ''}. Your visitor registration has been verified.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
            {event.startDate && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatTime(event.startDate)}
              </span>
            )}
            {event.endDate && (
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Ends {formatTime(event.endDate)}
              </span>
            )}
            {(event.venue || event.city) && <span>{[event.venue, event.city].filter(Boolean).join(', ')}</span>}
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          {eventState === 'live' ? (
            <div className="p-5 sm:p-8">
              <h2 className="mb-4 text-xl font-bold">Live stream</h2>
              {joined && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${event.title} live stream`}
                  className="aspect-video w-full rounded-2xl border-0 bg-black"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 p-8 text-center">
                  <Video className="mb-4 h-10 w-10 text-amber-400" />
                  <p className="max-w-xl text-sm leading-6 text-slate-300">
                    {joined
                      ? 'The stream is available through the event’s external meeting link.'
                      : 'Join with your verified visitor registration to access the live stream.'}
                  </p>
                  {!joined ? (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joining}
                      className="mt-5 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
                    >
                      {joining ? 'Verifying...' : 'Join live stream'}
                    </button>
                  ) : streamUrl ? (
                    <a
                      href={streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
                    >
                      Open stream <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              )}
              {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
              {joined && embedUrl && (
                <p className="mt-4 text-xs text-slate-400">You are checked in as a virtual attendee.</p>
              )}
            </div>
          ) : (
            <div className="p-8 sm:p-12">
              <div className="mx-auto max-w-2xl text-center">
                <Video className="mx-auto mb-4 h-10 w-10 text-amber-400" />
                <h2 className="text-2xl font-bold">
                  {eventState === 'upcoming'
                    ? 'This event has not started yet'
                    : eventState === 'ended'
                      ? 'This event has concluded'
                      : 'The virtual stream is currently offline'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {eventState === 'upcoming'
                    ? 'The stream will be available when the event begins.'
                    : eventState === 'ended'
                      ? 'The live stream is no longer available.'
                      : 'The organizer has not started or configured a live stream for this event yet.'}
                </p>
              </div>
            </div>
          )}
        </section>

        {sessions.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold">Virtual sessions</h2>
            {error && eventState !== 'live' && (
              <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>
            )}
            <div className="grid gap-3">
              {sessions.map((session) => {
                const now = Date.now();
                const startsAt = session.startTime ? new Date(session.startTime).getTime() : 0;
                const endsAt = session.endTime ? new Date(session.endTime).getTime() : 0;
                const sessionLive =
                  eventState !== 'upcoming' &&
                  eventState !== 'ended' &&
                  startsAt <= now &&
                  now <= endsAt;
                const sessionUpcoming = eventState === 'upcoming' || startsAt > now;
                const sessionUrl = session.streamUrl ||
                  (session.zoomMeetingId ? `https://zoom.us/j/${encodeURIComponent(session.zoomMeetingId.replace(/\s+/g, ''))}` : '');
                const sessionEmbedUrl = getEmbedUrl(sessionUrl);
                const sessionJoined = joined && sessionLive && Boolean(sessionUrl);
                return (
                  <article key={session.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold">{session.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatTime(session.startTime)} – {formatTime(session.endTime)}
                        </p>
                        {session.description && <p className="mt-2 text-sm text-slate-300">{session.description}</p>}
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${sessionLive ? 'bg-red-500/15 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                        {sessionLive ? 'Live' : sessionUpcoming ? 'Upcoming' : 'Ended'}
                      </span>
                    </div>
                    {sessionLive && sessionUrl && (
                      <div className="mt-4">
                        {sessionJoined && sessionEmbedUrl ? (
                          <iframe
                            src={sessionEmbedUrl}
                            title={`${session.title} stream`}
                            className="aspect-video w-full rounded-xl border-0 bg-black"
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                          />
                        ) : sessionJoined ? (
                          <a
                            href={sessionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
                          >
                            Open session <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleJoin}
                            disabled={joining}
                            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                          >
                            {joining ? 'Verifying...' : 'Join session'}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
