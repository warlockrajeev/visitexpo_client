'use client';

/**
 * @file claim/page.js
 * @description Claim Existing WordPress Event Listing Flow for Organizers.
 * Fetches all live WordPress event directory items, allows domain email verification, proof document upload, and claim moderation tracking.
 */

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  // Form State
  const [claimForm, setClaimForm] = useState({
    officialEmail: '',
    website: '',
    phone: '',
    proofFileName: '',
    additionalNotes: ''
  });

  // Fetch live claimable WP events from API
  useEffect(() => {
    const fetchClaimableEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/wordpress/claimable-events`);
        if (res.data && res.data.success && res.data.data.docs) {
          setWpEvents(res.data.data.docs);
        }
      } catch (err) {
        console.error('Failed to load claimable events from API', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaimableEvents();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClaimForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setClaimForm(prev => ({ ...prev, proofFileName: file.name }));
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError('Please select an event to claim.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: user?.name || 'Organizer User',
        email: claimForm.officialEmail,
        password: 'Password123!',
        organizationName: claimForm.website ? claimForm.website.replace('https://', '').replace('http://', '').split('/')[0] : 'Event Corp',
        website: claimForm.website,
        phone: claimForm.phone,
        claimType: 'claim_existing',
        eventId: selectedEvent._id || selectedEvent.id
      };

      const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
      const res = await axios.post(`${API_URL}/wordpress/onboard-organizer`, payload, config);

      if (res.data && res.data.success) {
        setSubmitting(false);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Claim submission error', err);
      setError(err.response?.data?.error || 'Failed to submit claim request. Please check your credentials.');
      setSubmitting(false);
    }
  };

  const filteredEvents = wpEvents.filter(evt => {
    const cleanTitle = evt.title.toLowerCase().trim();
    const isSystem = EXCLUDED_SYSTEM_TITLES.some(sys => cleanTitle === sys || cleanTitle.includes(sys));
    if (isSystem) return false;

    return (
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.city && evt.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full mb-1">
            <ShieldCheck className="h-3.5 w-3.5" /> WordPress Directory Ownership Verification
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Claim an Existing Event Listing
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search our live WordPress directory, verify organizer ownership, and take control of your event analytics.
          </p>
        </div>

        <Link
          href="/events/wizard"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Switch to Create New Event
        </Link>
      </div>

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
              href="/"
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
                  <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading WordPress event directory...
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
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Official Corporate Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="email"
                        name="officialEmail"
                        required
                        value={claimForm.officialEmail}
                        onChange={handleFormChange}
                        placeholder="organizer@officialdomain.com"
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Must match official event organizer website domain.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Official Website URL *
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <input
                          type="url"
                          name="website"
                          required
                          value={claimForm.website}
                          onChange={handleFormChange}
                          placeholder="https://eventdomain.com"
                          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Contact Phone Hotline *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <input
                          type="text"
                          name="phone"
                          required
                          value={claimForm.phone}
                          onChange={handleFormChange}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Proof Upload */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Upload Proof of Ownership (Incorporation Cert / Authorization Letter) *
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 bg-muted/10 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 overflow-hidden">
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {claimForm.proofFileName || 'Click to select PDF or Image file'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                      </div>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Notes to Moderation Team
                    </label>
                    <textarea
                      name="additionalNotes"
                      rows={3}
                      value={claimForm.additionalNotes}
                      onChange={handleFormChange}
                      placeholder="Briefly state your role (e.g. Event Director) and verification request details..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all mt-2"
                  >
                    {submitting ? 'Submitting Request...' : 'Submit Claim for Moderation'} <ArrowRight className="h-4 w-4" />
                  </button>
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
