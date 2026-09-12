'use client';

/**
 * @file (dashboard)/expos/page.js
 * @description Dedicated in-dashboard Live Exhibitions Explorer.
 * Allows logged-in visitors and organizers to browse upcoming trade expos, filter by city and category, and claim digital visitor passes directly without leaving the dashboard.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Calendar,
  MapPin,
  Search,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  QrCode,
  Printer,
  Filter
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ExposPage() {
  const { user, accessToken } = useAuth();

  // Events & Passes State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Claim Pass State
  const [claimingId, setClaimingId] = useState(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [claimError, setClaimError] = useState('');
  const [selectedPassForBadge, setSelectedPassForBadge] = useState(null);

  // Fetch events from WordPress endpoint and backend
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await axios.get('/api/wordpress-events');
        if (res.data?.success && Array.isArray(res.data?.events) && res.data.events.length > 0) {
          setEvents(res.data.events);
        } else {
          // Fallback to backend events
          const fallbackRes = await axios.get(`${API_URL}/events?limit=20`);
          if (fallbackRes.data?.success && fallbackRes.data?.data?.docs) {
            setEvents(fallbackRes.data.data.docs.map(e => ({
              id: e._id || e.id,
              title: e.title,
              image: e.banner || e.logo,
              category: e.category || 'Trade & Industry',
              entryType: 'Free Visitor Pass',
              dates: e.startDate ? `${new Date(e.startDate).toLocaleDateString()} - ${new Date(e.endDate || e.startDate).toLocaleDateString()}` : 'Upcoming 2026',
              venue: e.venue || 'Convention Center',
              city: e.city || 'India',
              description: e.shortDescription || e.description || ''
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch events list:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch visitor's existing passes
  const fetchMyPasses = async () => {
    if (!accessToken || user?.role !== 'visitor') return;
    setLoadingPasses(true);
    try {
      const res = await axios.get(`${API_URL}/visitors/my-passes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && res.data?.data?.docs) {
        setPasses(res.data.data.docs);
      }
    } catch (err) {
      console.warn('Failed to fetch visitor passes:', err);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchMyPasses();
  }, [user, accessToken]);

  // Set of registered event IDs
  const registeredEventIds = useMemo(() => {
    return new Set(
      passes.map(p => {
        if (p.event && typeof p.event === 'object') return p.event._id;
        return p.event;
      }).filter(Boolean)
    );
  }, [passes]);

  // Cities list
  const availableCities = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.city && e.city !== 'India') set.add(e.city);
    });
    return ['All Cities', ...Array.from(set).sort()];
  }, [events]);

  // Categories list
  const categoriesList = [
    'All',
    'Automotive & EV',
    'Technology & AI',
    'Textile & Fashion',
    'Construction & Infra',
    'Logistics & Cargo',
    'Healthcare & Pharma',
    'Agri & Food Tech',
    'Art & Lifestyle',
    'Trade & Industry'
  ];

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchVenue = e.venue?.toLowerCase().includes(q);
        const matchCity = e.city?.toLowerCase().includes(q);
        const matchCategory = e.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchVenue && !matchCity && !matchCategory) return false;
      }
      if (selectedCity !== 'All Cities') {
        if (!e.city?.toLowerCase().includes(selectedCity.toLowerCase()) && !e.venue?.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }
      if (selectedCategory !== 'All') {
        if (!e.category?.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [events, searchQuery, selectedCity, selectedCategory]);

  // 1-Click Pass Claim
  const handleClaimPass = async (expo) => {
    setClaimError('');
    setClaimSuccessMessage('');
    const eventId = expo.id || expo._id;
    setClaimingId(eventId);

    try {
      const res = await axios.post(`${API_URL}/visitors/register`, {
        eventId,
        name: user?.name || user?.email?.split('@')[0] || 'Visitor',
        email: user?.email,
        phone: user?.phone || '+91-9999999999',
        company: user?.organization?.name || 'Trade Attendee',
        designation: 'Business Visitor',
        country: 'India',
        attendanceType: 'in_person'
      });

      if (res.data && res.data.success) {
        setClaimSuccessMessage(`Pass confirmed for "${expo.title}"! Your QR badge is active.`);
        await fetchMyPasses();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration could not be completed. You may already be registered.';
      setClaimError(errMsg);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Passes &amp; Badges
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" /> Live Directory Feed
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Explore Live Exhibitions &amp; Passes
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Browse verified trade shows directly from visitexpo.in. Claim your digital badges and gate entry passes in 1 click without leaving your dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <Ticket className="h-4 w-4" /> View My Confirmed Badges ({passes.length})
          </Link>
        </div>
      </div>

      {/* Status Alerts */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{claimSuccessMessage}</span>
          </div>
          <button onClick={() => setClaimSuccessMessage('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {claimError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{claimError}</span>
          </div>
          <button onClick={() => setClaimError('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Keyword Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expos by title, venue, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* City Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full md:w-52 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Industry:
          </span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exhibitions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">{filteredEvents.length}</strong> trade exhibitions</span>
          {(searchQuery || selectedCity !== 'All Cities' || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('All Cities');
                setSelectedCategory('All');
              }}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loadingEvents ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Fetching verified trade exhibitions...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">No exhibitions match your search criteria.</p>
            <p className="text-xs text-muted-foreground">Try selecting a different city or resetting your industry category filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((expo) => {
              const expoId = expo.id || expo._id;
              const isClaimed = registeredEventIds.has(expoId);
              const isClaiming = claimingId === expoId;

              return (
                <div
                  key={expoId}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                    {expo.image ? (
                      <img
                        src={expo.image}
                        alt={expo.title}
                        className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10">
                      {expo.category || 'Trade Show'}
                    </span>
                    <span className="absolute top-3 right-3 rounded-md bg-[#FFCC00] px-2.5 py-0.5 text-[10px] font-extrabold text-zinc-950 shadow-sm">
                      {expo.entryType || 'Free Visitor Pass'}
                    </span>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{expo.dates || 'Upcoming 2026'}</span>
                      </div>

                      <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2" title={expo.title}>
                        {expo.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{expo.venue || 'Convention Center'}, {expo.city || 'India'}</span>
                      </div>

                      {expo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                          {expo.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center gap-2">
                      {isClaimed ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Pass Confirmed &amp; Active
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleClaimPass(expo)}
                          disabled={isClaiming}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 text-xs transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Issuing Digital Badge...
                            </>
                          ) : (
                            <>
                              <Ticket className="h-4 w-4" /> Claim Free Visitor Pass
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Printable QR Entry Badge */}
      {selectedPassForBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setSelectedPassForBadge(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs p-1 rounded-lg border border-border bg-secondary cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <Ticket className="h-3 w-3" /> Verified Entry Badge
              </div>
              <h3 className="text-base font-extrabold text-foreground leading-tight pt-1">
                {selectedPassForBadge.event?.title || 'Trade Exhibition'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {selectedPassForBadge.event?.venue}, {selectedPassForBadge.event?.city}
              </p>
            </div>

            <div className="bg-secondary/70 border border-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendee</span>
              <h2 className="text-lg font-extrabold text-foreground">{selectedPassForBadge.name}</h2>
              <span className="inline-block text-[11px] font-bold text-amber-500 uppercase">
                {selectedPassForBadge.company || 'Trade Visitor'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-zinc-300 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPassForBadge.qrCode || `VIS-${selectedPassForBadge._id}`)}`}
                alt="Entry QR Code"
                className="h-44 w-44 object-contain"
              />
              <span className="text-[10px] font-mono font-bold text-zinc-800 mt-2 tracking-widest">
                VIS-{selectedPassForBadge._id.slice(-8).toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Present this digital pass at the entrance scanner for instant check-in.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 text-xs shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Badge
              </button>
              <button
                type="button"
                onClick={() => setSelectedPassForBadge(null)}
                className="rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
