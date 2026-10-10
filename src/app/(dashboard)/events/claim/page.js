'use client';

/**
 * @file claim/page.js
 * @description Claim Existing VisitExpo Event Listing Flow for Organizers.
 * Fetches all live VisitExpo event directory items, allows domain email verification, proof document upload, and claim moderation tracking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext.js';
import {
  ShieldCheck,
  Search,
  Building,
  Mail,
  Globe,
  Phone,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const EXCLUDED_SYSTEM_TITLES = [
  'cart', 'checkout', 'my account', 'password reset', 'profile',
  'registration', 'register', 'refund policy', 'terms', 'privacy',
  'member login', 'thank you', 'faqs', 'faq', 'blog', 'contact', 'about us', 'home',
  'sample page', 'shop', 'your account', 'calendar', 'events-old', 'events',
  'subscription', 'upcoming event', 'join us'
];

export default function ClaimEventPage() {
  const { user, accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [wpEvents, setWpEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [quota, setQuota] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  // Form State
  const [claimForm, setClaimForm] = useState({
    officialEmail: '',
    website: '',
    phone: '',
    proofFileName: '',
    additionalNotes: ''
  });

  const validateSingleField = (name, value) => {
    let errorMsg = '';
    if (name === 'officialEmail') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!value || !value.trim()) {
        errorMsg = 'Official corporate email is mandatory.';
      } else if (!emailRegex.test(value.trim())) {
        errorMsg = 'Please enter a valid email address (e.g. organizer@company.com).';
      }
    } else if (name === 'website') {
      const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
      if (!value || !value.trim()) {
        errorMsg = 'Official website URL is mandatory.';
      } else if (!urlRegex.test(value.trim())) {
        errorMsg = 'Please enter a valid URL (e.g. https://eventdomain.com).';
      }
    } else if (name === 'phone') {
      if (!value || !value.trim()) {
        errorMsg = 'Contact phone hotline is mandatory.';
      } else {
        const hasLetters = /[a-zA-Z]/.test(value);
        const cleanDigits = value.replace(/\D/g, '');
        if (hasLetters) {
          errorMsg = 'Phone number cannot contain letters or alphabets.';
        } else if (cleanDigits.length < 10) {
          errorMsg = `Phone number must have at least 10 digits (currently ${cleanDigits.length}).`;
        } else if (cleanDigits.length > 15) {
          errorMsg = `Phone number cannot exceed 15 digits (currently ${cleanDigits.length}).`;
        }
      }
    } else if (name === 'proofFileName') {
      if (!value || !value.trim()) {
        errorMsg = 'Upload proof of ownership document is mandatory.';
      }
    } else if (name === 'additionalNotes') {
      if (value && value.length > 1000) {
        errorMsg = `Notes cannot exceed 1000 characters (currently ${value.length}).`;
      }
    }
    return errorMsg;
  };

  const validateAllFields = () => {
    const errors = {
      officialEmail: validateSingleField('officialEmail', claimForm.officialEmail),
      website: validateSingleField('website', claimForm.website),
      phone: validateSingleField('phone', claimForm.phone),
      proofFileName: validateSingleField('proofFileName', claimForm.proofFileName),
      additionalNotes: validateSingleField('additionalNotes', claimForm.additionalNotes)
    };
    const activeErrors = Object.fromEntries(Object.entries(errors).filter(([_, v]) => Boolean(v)));
    setFieldErrors(activeErrors);
    return Object.keys(activeErrors).length === 0;
  };

  // Fetch live claimable WP events from API and read URL search param if present with instant sessionStorage cache
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialSearch = params.get('search');
      if (initialSearch) {
        setSearchTerm(initialSearch);
      }

      // 1. Instant hydration from sessionStorage
      try {
        const cached = sessionStorage.getItem('visitexpo_claimable_events_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWpEvents(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('Could not read claimable events cache:', e);
      }
    }

    const fetchClaimableEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/wordpress/claimable-events`);
        if (res.data && res.data.success && res.data.data.docs) {
          const freshEvents = res.data.data.docs;
          setWpEvents(freshEvents);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_claimable_events_cache', JSON.stringify(freshEvents));
            }
          } catch (e) {
            console.warn('Could not save claimable events cache:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load claimable events from API', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimableEvents();
  }, []);

  const fetchQuota = async () => {
    try {
      const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
      const res = await axios.get(`${API_URL}/wordpress/claim-quota`, config);
      if (res.data?.success && res.data.quota) {
        setQuota(res.data.quota);
      }
    } catch (err) {
      console.warn('Could not fetch claim quota:', err);
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [accessToken, user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClaimForm(prev => ({ ...prev, [name]: value }));
    const errorMsg = validateSingleField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setClaimForm(prev => ({ ...prev, phone: val }));
    const errorMsg = validateSingleField('phone', val);
    setFieldErrors(prev => ({ ...prev, phone: errorMsg }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValidExt) {
      setFieldErrors(prev => ({
        ...prev,
        proofFileName: 'Unsupported file format. Please upload PDF, PNG, JPG, or JPEG file.'
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        proofFileName: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 5MB limit.`
      }));
      return;
    }

    setClaimForm(prev => ({ ...prev, proofFileName: file.name }));
    setFieldErrors(prev => ({ ...prev, proofFileName: '' }));
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError('Please select an event to claim.');
      return;
    }

    const isValid = validateAllFields();
    if (!isValid) {
      setError('Please fix the highlighted validation errors before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: user?.name || 'Organizer User',
        email: user?.email || claimForm.officialEmail,
        officialEmail: claimForm.officialEmail,
        city: selectedEvent.city || user?.city || 'India',
        organizationName: claimForm.website 
          ? claimForm.website.replace('https://', '').replace('http://', '').split('/')[0] 
          : (user?.company || user?.name || 'Event Organization'),
        website: claimForm.website,
        phone: claimForm.phone,
        claimType: 'claim_existing',
        eventId: selectedEvent._id || selectedEvent.id,
        eventSlug: selectedEvent.slug,
        wpPostId: selectedEvent.wpPostId || selectedEvent.id,
        eventData: selectedEvent,
        proofFileName: claimForm.proofFileName,
        additionalNotes: claimForm.additionalNotes
      };

      const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
      const res = await axios.post(`${API_URL}/wordpress/onboard-organizer`, payload, config);

      if (res.data && res.data.success) {
        setSubmitting(false);
        setSubmitted(true);
        fetchQuota();
      }
    } catch (err) {
      console.error('Claim submission error', err);
      const errData = err.response?.data;
      if (errData?.dailyLimitReached) {
        setError(errData.error || 'Daily event claim limit reached (3 claims per day for Free organizers). Upgrade to Starter or Enterprise plan to claim unlimited events.');
        fetchQuota();
      } else {
        setError(errData?.error || 'Failed to submit claim request. Please check your credentials.');
      }
      setSubmitting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return wpEvents.filter(evt => {
      const cleanTitle = (evt.title || '').toLowerCase().trim();
      const isSystem = EXCLUDED_SYSTEM_TITLES.some(sys => cleanTitle === sys || cleanTitle.includes(sys));
      if (isSystem) return false;

      if (!q) return true;
      return (
        cleanTitle.includes(q) ||
        (evt.city && evt.city.toLowerCase().includes(q)) ||
        (evt.venue && evt.venue.toLowerCase().includes(q))
      );
    });
  }, [wpEvents, searchTerm]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full mb-1">
            <ShieldCheck className="h-3.5 w-3.5" /> VisitExpo Directory Ownership Verification
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Claim an Existing Event Listing
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search our live VisitExpo directory, verify organizer ownership, and take control of your event analytics.
          </p>
        </div>

        <Link
          href="/events/wizard"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Switch to Create New Event
        </Link>
      </div>

      {/* Daily Claim Limit & Plan Allowance Banner */}
      {!loadingQuota && quota && (
        <div className={`p-4 rounded-2xl border transition-all ${
          quota.isUnlimited
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : quota.canClaim
              ? 'bg-card border-border shadow-xs'
              : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                quota.isUnlimited
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : quota.canClaim
                    ? 'bg-primary/10 text-primary'
                    : 'bg-amber-500/20 text-amber-500'
              }`}>
                {quota.canClaim ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">
                    {quota.isUnlimited
                      ? `${quota.plan ? quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1) : 'Paid'} Tier · Unlimited Event Claims`
                      : 'Free Organizer Plan · Daily Claim Quota'}
                  </h4>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    quota.isUnlimited
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : quota.canClaim
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}>
                    {quota.isUnlimited
                      ? 'Unlimited Active'
                      : quota.canClaim
                        ? `${quota.claimsToday} of 3 Used Today (${quota.claimsRemaining} left)`
                        : 'Daily Limit Reached (3/3 Used)'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {quota.isUnlimited
                    ? 'Your active plan enables you to claim any number of event listings from the VisitExpo directory without daily limits.'
                    : quota.canClaim
                      ? `Free organizers can claim up to 3 events per day. You have ${quota.claimsRemaining} claim${quota.claimsRemaining === 1 ? '' : 's'} remaining today (resets daily at midnight).`
                      : 'You have reached the maximum 3 event claims allowed per day on the Free plan. Daily quota will reset at midnight, or upgrade to Starter/Enterprise for unlimited claiming.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {!quota.isUnlimited && (
                <Link
                  href="/pricing"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !quota.canClaim
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-xs'
                      : 'border border-border bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{quota.canClaim ? 'Upgrade Plan' : 'Unlock Unlimited Claims'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Visual 3-slot progress indicator for Free plan */}
          {!quota.isUnlimited && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Daily Claim Slots:</span>
              {[1, 2, 3].map((slot) => {
                const isUsed = slot <= quota.claimsToday;
                return (
                  <div
                    key={slot}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      isUsed
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-secondary/60 text-muted-foreground border-border'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isUsed ? 'bg-amber-400' : 'bg-muted-foreground/40'}`} />
                    <span>Claim {slot}: {isUsed ? 'Used' : 'Available'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {submitted ? (
        /* Submission Confirmation Card */
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto ring-8 ring-amber-500/20">
            <ShieldCheck className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> Claim Request Pending
            </span>
            <h3 className="text-2xl font-extrabold text-foreground">
              Ownership Verification Submitted
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We have received your claim request for <strong className="text-foreground">{selectedEvent?.title}</strong>. Our admin team will verify your domain email and uploaded documentation within 24 hours.
            </p>
          </div>

          {/* Details Box */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verification Email:</span>
              <span className="font-semibold text-foreground">{claimForm.officialEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proof Document:</span>
              <span className="font-semibold text-foreground">{claimForm.proofFileName || 'Authorization Letter'}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              Return to Organizer Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-5">
          {/* STEP 1: Search Screen (Left Column 2/5) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> 1. Search Directory
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by event title or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading VisitExpo event directory...
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedEvent?._id === evt._id || selectedEvent?.id === evt.id;
                    return (
                      <div
                        key={evt._id || evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                            : 'border-border bg-background hover:border-border/80'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-foreground leading-snug">{evt.title}</h4>
                        <p className="text-[11px] text-muted-foreground">{evt.venue || 'Exhibition Venue'}, {evt.city || 'India'}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="text-muted-foreground">{evt.startDate ? new Date(evt.startDate).toLocaleDateString() : 'Upcoming'}</span>
                          <span className="text-amber-500 font-semibold uppercase">Unclaimed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Ownership Verification Form (Right Column 3/5) */}
          <div className="md:col-span-3">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> 2. Ownership Verification Form
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedEvent
                    ? `Claiming: ${selectedEvent.title}`
                    : 'Select an event from the search list to proceed with claim.'}
                </p>
              </div>

              {selectedEvent ? (
                <form onSubmit={handleSubmitClaim} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center justify-between">
                      <span>Official Corporate Email *</span>
                      {fieldErrors.officialEmail && (
                        <span className="text-[10px] text-red-500 font-semibold lowercase">
                          {fieldErrors.officialEmail}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-2.5 h-4.5 w-4.5 transition-colors ${fieldErrors.officialEmail ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <input
                        type="email"
                        name="officialEmail"
                        value={claimForm.officialEmail}
                        onChange={handleFormChange}
                        placeholder="organizer@officialdomain.com"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.officialEmail
                            ? 'border-red-500/80 bg-red-500/5 focus:ring-red-500/30 ring-1 ring-red-500/20'
                            : 'border-border focus:ring-primary'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Must match official event organizer website domain.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center justify-between">
                        <span>Official Website URL *</span>
                        {fieldErrors.website && (
                          <span className="text-[10px] text-red-500 font-semibold lowercase">
                            {fieldErrors.website}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Globe className={`absolute left-3 top-2.5 h-4.5 w-4.5 transition-colors ${fieldErrors.website ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <input
                          type="text"
                          name="website"
                          value={claimForm.website}
                          onChange={handleFormChange}
                          placeholder="https://eventdomain.com"
                          className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.website
                              ? 'border-red-500/80 bg-red-500/5 focus:ring-red-500/30 ring-1 ring-red-500/20'
                              : 'border-border focus:ring-primary'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center justify-between">
                        <span>Contact Phone Hotline *</span>
                        {fieldErrors.phone && (
                          <span className="text-[10px] text-red-500 font-semibold lowercase">
                            {fieldErrors.phone}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-3 top-2.5 h-4.5 w-4.5 transition-colors ${fieldErrors.phone ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <input
                          type="tel"
                          name="phone"
                          value={claimForm.phone}
                          onChange={handlePhoneChange}
                          placeholder="+91 98765 43210"
                          className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.phone
                              ? 'border-red-500/80 bg-red-500/5 focus:ring-red-500/30 ring-1 ring-red-500/20'
                              : 'border-border focus:ring-primary'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">10 to 15 digits (numbers and + only, no letters).</p>
                    </div>
                  </div>

                  {/* Document Proof Upload */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center justify-between">
                      <span>Upload Proof of Ownership (Incorporation Cert / Authorization Letter) *</span>
                      {fieldErrors.proofFileName && (
                        <span className="text-[10px] text-red-500 font-semibold lowercase">
                          {fieldErrors.proofFileName}
                        </span>
                      )}
                    </label>
                    <label className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${
                      fieldErrors.proofFileName
                        ? 'border-red-500/80 bg-red-500/5 hover:border-red-500'
                        : claimForm.proofFileName
                        ? 'border-primary/60 bg-primary/5 hover:border-primary'
                        : 'border-border bg-muted/10 hover:border-primary'
                    }`}>
                      <Upload className={`h-5 w-5 ${fieldErrors.proofFileName ? 'text-red-500' : claimForm.proofFileName ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 overflow-hidden">
                        <span className={`text-xs font-semibold truncate block ${claimForm.proofFileName ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {claimForm.proofFileName || 'Click to select PDF or Image file'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                      </div>
                      {claimForm.proofFileName && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Selected
                        </span>
                      )}
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-muted-foreground uppercase">
                        Notes to Moderation Team
                      </label>
                      <span className={`text-[10px] ${claimForm.additionalNotes.length > 1000 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        {claimForm.additionalNotes.length}/1000
                      </span>
                    </div>
                    <textarea
                      name="additionalNotes"
                      rows={3}
                      maxLength={1000}
                      value={claimForm.additionalNotes}
                      onChange={handleFormChange}
                      placeholder="Briefly state your role (e.g. Event Director) and verification request details..."
                      className={`w-full rounded-xl border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.additionalNotes
                          ? 'border-red-500/80 bg-red-500/5 focus:ring-red-500/30 ring-1 ring-red-500/20'
                          : 'border-border focus:ring-primary'
                      }`}
                    />
                    {fieldErrors.additionalNotes && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.additionalNotes}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (quota && !quota.canClaim)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
                      </>
                    ) : quota && !quota.canClaim ? (
                      <>
                        <AlertCircle className="h-4 w-4" /> Daily Limit Reached (3/3 Used Today)
                      </>
                    ) : (
                      <>
                        Submit Claim for Moderation <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {quota && !quota.canClaim && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">Free organizers can claim up to 3 events per day.</span>
                      </div>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline shrink-0"
                      >
                        Upgrade to Starter or Enterprise <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2 bg-muted/10 rounded-xl border border-border">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-xs font-semibold text-foreground">No Event Selected</p>
                  <p className="text-[11px] max-w-xs">Please click on an event card from the left search directory to fill the ownership claim form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
