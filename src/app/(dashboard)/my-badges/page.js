'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import QRCode from 'qrcode';
import { ArrowLeft, Calendar, Loader2, MapPin, Printer, QrCode, Ticket } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import { printBadge } from '../../../utils/printBadge.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

function getPassId(pass) {
  const id = String(pass?._id || pass?.id || '');
  return pass?.passId || `VIS-${id.toUpperCase()}`;
}

function getPassDates(event) {
  if (event?.dates) return event.dates;
  const dates = [event?.startDate, event?.endDate]
    .filter(Boolean)
    .map((date) => new Date(date).toLocaleDateString());
  return dates.join(' - ') || 'Date to be announced';
}

function PassCard({ pass, onView }) {
  const [qrImage, setQrImage] = useState('');
  const passId = getPassId(pass);

  useEffect(() => {
    let active = true;
    if (!pass.qrCode) {
      setQrImage('');
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(pass.qrCode, { errorCorrectionLevel: 'H', margin: 2, width: 180 })
      .then((image) => {
        if (active) setQrImage(image);
      })
      .catch((error) => {
        console.error('Could not generate visitor badge QR code:', error);
        if (active) setQrImage('');
      });

    return () => {
      active = false;
    };
  }, [pass.qrCode]);

  const eventTitle = pass.event?.title || 'Trade Exhibition';
  const eventLocation = [pass.event?.venue, pass.event?.city].filter(Boolean).join(', ');

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Ticket className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground">{eventTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {pass.attendanceType === 'virtual' ? 'Virtual visitor pass' : 'In-person visitor pass'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>{getPassDates(pass.event)}</span>
        </div>
        {eventLocation && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{eventLocation}</span>
          </div>
        )}
        <div><strong className="text-foreground">Visitor:</strong> {pass.name}</div>
        <div><strong className="text-foreground">Email:</strong> {pass.email}</div>
        {pass.company && <div><strong className="text-foreground">Company:</strong> {pass.company}</div>}
        <div><strong className="text-foreground">Pass ID:</strong> <span className="font-mono">{passId}</span></div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
        {qrImage ? (
          <img src={qrImage} alt={`QR code for ${eventTitle}`} className="h-20 w-20 rounded-lg bg-white p-1" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-label="QR code unavailable">
            <QrCode className="h-8 w-8" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Entry QR Code</p>
          <p className="mt-1 break-all font-mono text-[11px] font-semibold text-foreground">{passId}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Show this code at event entry.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onView(pass)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <QrCode className="h-4 w-4" /> View Pass
        </button>
        <button
          type="button"
          onClick={() => printBadge({ ...pass, passId })}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary/80"
        >
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>
    </article>
  );
}

export default function MyBadgesPage() {
  const { user, accessToken } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedQr, setSelectedQr] = useState('');

  useEffect(() => {
    let active = true;
    const fetchPasses = async () => {
      const token =
        accessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('visitexpo_access_token') || localStorage.getItem('visitexpo_token')
          : null);
      if (!token) {
        setError('Please sign in to view your confirmed badges.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/visitors/my-passes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Could not load your confirmed badges.');
        }
        if (active) {
          const docs = response.data.data?.docs || response.data.data || [];
          setPasses(Array.isArray(docs) ? docs : []);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.response?.data?.error || fetchError.message || 'Could not load your confirmed badges. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPasses();
    return () => {
      active = false;
    };
  }, [accessToken, user?.id, user?._id]);

  useEffect(() => {
    let active = true;
    if (!selectedPass?.qrCode) {
      setSelectedQr('');
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(selectedPass.qrCode, { errorCorrectionLevel: 'H', margin: 2, width: 280 })
      .then((image) => {
        if (active) setSelectedQr(image);
      })
      .catch((qrError) => {
        console.error('Could not generate visitor badge QR code:', qrError);
        if (active) setSelectedQr('');
      });

    return () => {
      active = false;
    };
  }, [selectedPass]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/expos" className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Live Exhibitions
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">My Confirmed Badges</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your claimed visitor passes and entry QR codes.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-foreground sm:self-auto">
          <Ticket className="h-4 w-4 text-primary" /> {passes.length} confirmed {passes.length === 1 ? 'badge' : 'badges'}
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading your confirmed badges...</p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Link href="/login" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            Sign in
          </Link>
        </div>
      ) : passes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Ticket className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">No Confirmed Badges Found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You have not claimed a visitor pass yet. Browse live exhibitions to find an event and claim your pass.
          </p>
          <Link href="/expos" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90">
            <Ticket className="h-4 w-4" /> Browse Live Exhibitions
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {passes.map((pass) => (
            <PassCard key={pass._id || pass.id} pass={pass} onView={setSelectedPass} />
          ))}
        </div>
      )}

      {selectedPass && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Visitor pass details">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <button type="button" onClick={() => setSelectedPass(null)} className="absolute right-4 top-4 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-secondary" aria-label="Close pass details">✕</button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Ticket className="h-6 w-6" /></div>
            <h2 className="mt-3 pr-7 text-lg font-extrabold text-foreground">{selectedPass.event?.title || 'Trade Exhibition'}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{getPassDates(selectedPass.event)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{[selectedPass.event?.venue, selectedPass.event?.city].filter(Boolean).join(', ')}</p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-3 text-left text-xs">
              <p><strong>Visitor:</strong> {selectedPass.name}</p>
              <p className="mt-1"><strong>Email:</strong> {selectedPass.email}</p>
              <p className="mt-1"><strong>Pass type:</strong> {selectedPass.attendanceType === 'virtual' ? 'Virtual visitor pass' : 'In-person visitor pass'}</p>
              <p className="mt-1 break-all font-mono"><strong>Pass ID:</strong> {getPassId(selectedPass)}</p>
            </div>
            <div className="mt-4 flex justify-center rounded-xl border border-border bg-white p-3">
              {selectedQr ? (
                <img src={selectedQr} alt="Visitor pass QR code" className="h-56 w-56 max-w-full object-contain" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-sm text-muted-foreground">QR code unavailable</div>
              )}
            </div>
            <button type="button" onClick={() => printBadge({ ...selectedPass, passId: getPassId(selectedPass) })} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              <Printer className="h-4 w-4" /> Download / Print Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
