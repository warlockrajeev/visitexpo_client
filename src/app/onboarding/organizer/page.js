'use client';

/**
 * @file onboarding/organizer/page.js
 * @description Dedicated Organizer Onboarding Portal with VisitExpo Event Directory Claim & Integration.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Building2,
  ShieldCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Globe,
  Phone,
  Calendar,
  MapPin,
  Sparkles,
  FileCheck,
  Loader2,
  Upload,
  Layers
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const MOCK_WP_EVENTS = [
  { id: 'wp-1', title: '11th Asian Australian Rotorcraft Forum', city: 'Chennai', country: 'India', dates: '2025-06-09', categories: ['Aeronautics', 'Engineering'], venue: 'IIT Madras' },
  { id: 'wp-2', title: '12th Symposium on Diseases in Asian Aquaculture (DAA12)', city: 'Chennai', country: 'India', dates: '2025-06-09', categories: ['Aquaculture', 'Marine'], venue: 'Chennai Convention Center' },
  { id: 'wp-3', title: '15th Cement Expo 2025', city: 'New Delhi', country: 'India', dates: '2025-10-29', categories: ['Construction', 'Industrial'], venue: 'Pragati Maidan' },
  { id: 'wp-4', title: '16th Mega Cargo Show 2026', city: 'Mumbai', country: 'India', dates: '2026-03-05', categories: ['Logistics', 'Shipping'], venue: 'Bandra Kurla Complex' },
  { id: 'wp-5', title: '6th EV India Expo 2026', city: 'Greater Noida', country: 'India', dates: '2026-07-03', categories: ['Automotive', 'EV Technology'], venue: 'India Expo Mart' },
  { id: 'wp-6', title: '74th India International Garment Fair (IIGF)', city: 'New Delhi', country: 'India', dates: '2026-01-04', categories: ['Textile', 'Fashion'], venue: 'Yashobhoomi Complex' },
  { id: 'wp-7', title: '83rd National Garment Fair – Kidswear', city: 'Mumbai', country: 'India', dates: '2026-05-08', categories: ['Textile', 'Retail'], venue: 'Bombay Exhibition Centre' }
];

function OrganizerOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClaimSlug = searchParams.get('claim_slug');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account & Org Info
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    website: '',
    phone: '',
    city: 'New Delhi'
  });

  // Step 2: Event Choice
  const [claimType, setClaimType] = useState('claim_existing'); // 'claim_existing' | 'create_new'
  const [searchTerm, setSearchTerm] = useState('');
  const [wpEvents, setWpEvents] = useState(MOCK_WP_EVENTS);
  const [selectedWpEvent, setSelectedWpEvent] = useState(null);

  // New Event Form (if creating new)
  const [newEvent, setNewEvent] = useState({
    title: '',
    city: 'Mumbai',
    venue: '',
    startDate: '',
    endDate: '',
    categories: 'Trade Show'
  });

  // Step 3: Verification
  const [proofFileName, setProofFileName] = useState('');

  // Fetch WP claimable events on mount
  useEffect(() => {
    const fetchClaimableEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/wordpress/claimable-events`);
        if (res.data && res.data.success && res.data.data.docs.length > 0) {
          setWpEvents(res.data.data.docs);
        }
      } catch (err) {
        console.warn('Using default VisitExpo event directory list for onboarding.');
      }
    };
    fetchClaimableEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.organizationName) {
      setError('Please complete all required account and organization fields.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (claimType === 'claim_existing' && !selectedWpEvent) {
      setError('Please select an event listing from the directory to claim.');
      return;
    }
    if (claimType === 'create_new' && (!newEvent.title || !newEvent.venue || !newEvent.startDate)) {
      setError('Please fill in required fields for your new event.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        website: formData.website,
        phone: formData.phone,
        claimType,
        eventId: selectedWpEvent?._id || selectedWpEvent?.id,
        newEventData: claimType === 'create_new' ? {
          title: newEvent.title,
          city: newEvent.city,
          venue: newEvent.venue,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate || newEvent.startDate,
          categories: [newEvent.categories]
        } : null
      };

      const res = await axios.post(`${API_URL}/wordpress/onboard-organizer`, payload);

      if (res.data && res.data.success) {
        setStep(4);
      }
    } catch (err) {
      console.error('Onboarding failed', err);
      setError(err.response?.data?.error || 'Registration failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const EXCLUDED_SYSTEM_TITLES = [
    'cart', 'checkout', 'my account', 'password reset', 'profile',
    'registration', 'register', 'refund policy', 'terms', 'privacy',
    'member login', 'thank you', 'faqs', 'faq', 'blog', 'contact', 'about us', 'home',
    'sample page', 'shop', 'your account', 'calendar', 'events-old', 'events',
    'subscription', 'upcoming event', 'join us'
  ];

  const filteredEvents = wpEvents.filter(evt => {
    const cleanTitle = evt.title.toLowerCase().trim();
    const isSystem = EXCLUDED_SYSTEM_TITLES.some(sys => cleanTitle === sys || cleanTitle.includes(sys));
    if (isSystem) return false;

    return (
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20">
              V
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Visit<span className="text-amber-500">Expo</span> <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Verified Directory Partner</span>
            </span>
          </Link>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Already have an account?</span>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-10 w-full flex-1">
        {/* Progress Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-300 -z-0"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />

            {[
              { num: 1, label: 'Account & Company' },
              { num: 2, label: 'Event Choice' },
              { num: 3, label: 'Verification' }
            ].map((s) => {
              const active = step >= s.num;
              return (
                <div key={s.num} className="flex flex-col items-center gap-1.5 z-10 bg-background px-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">×</button>
          </div>
        )}

        {/* STEP 1: Account & Organization Details */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-2">
                <Building2 className="h-3.5 w-3.5" /> Organizer Registration
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Set Up Your Organizer Account
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your official details to create your organization portal on VisitExpo.
              </p>
            </div>

            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Corporate Work Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="organizer@company.com"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      name="password"
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Organization / Business Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder="e.g. Expo Masters International"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Official Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://expomasters.com"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contact Phone Hotline</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
                >
                  Continue to Event Selection <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Event Choice (Claim WP vs Create New) */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full mb-1">
                  <Sparkles className="h-3.5 w-3.5" /> VisitExpo Directory & Expo Link
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Connect Your Event
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose whether to claim an existing listing from the VisitExpo main directory or create a new event.
                </p>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-muted/30 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setClaimType('claim_existing')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  claimType === 'claim_existing'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-4 w-4 text-amber-500" /> Claim Directory Listing (1,431+ Events)
              </button>
              <button
                type="button"
                onClick={() => setClaimType('create_new')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  claimType === 'create_new'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-4 w-4 text-primary" /> Create New Custom Event
              </button>
            </div>

            {claimType === 'claim_existing' ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search VisitExpo events by title or city (e.g. Rotorcraft, Cement, EV Expo)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedWpEvent?.id === evt.id || selectedWpEvent?._id === evt._id;
                    return (
                      <div
                        key={evt.id || evt._id}
                        onClick={() => setSelectedWpEvent(evt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                            : 'border-border bg-background hover:border-border/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground">{evt.title}</h4>
                            <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Directory Listing
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {evt.venue}, {evt.city} • <Calendar className="inline h-3 w-3" /> {new Date(evt.dates || evt.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Selected
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">Click to select</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/10">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">New Event Specifications</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Event Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={newEvent.title}
                      onChange={handleNewEventChange}
                      placeholder="e.g. International Solar Technology Summit 2026"
                      className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">City / Location *</label>
                    <input
                      type="text"
                      name="city"
                      value={newEvent.city}
                      onChange={handleNewEventChange}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Exhibition Venue *</label>
                    <input
                      type="text"
                      name="venue"
                      value={newEvent.venue}
                      onChange={handleNewEventChange}
                      placeholder="e.g. Jio World Convention Centre"
                      className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={newEvent.startDate}
                      onChange={handleNewEventChange}
                      className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Proceed to Verification <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verification & Ownership Proof */}
        {step === 3 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full mb-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Ownership Verification
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Finalize & Verify Onboarding
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {claimType === 'claim_existing'
                  ? `Claiming ownership of: "${selectedWpEvent?.title}"`
                  : `Creating new event: "${newEvent.title}"`}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organizer Email:</span>
                <span className="font-semibold text-foreground">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization Name:</span>
                <span className="font-semibold text-foreground">{formData.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connected Event:</span>
                <span className="font-bold text-amber-500">{selectedWpEvent?.title || newEvent.title}</span>
              </div>
            </div>

            {/* Document Proof Upload */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Upload Proof of Organizer Status (Optional / Recommended)
              </label>
              <label className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 bg-muted/10 cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-xs font-semibold text-foreground truncate block">
                    {proofFileName || 'Click to upload Incorporation Certificate or Authorization Letter'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                </div>
                <input
                  type="file"
                  onChange={(e) => setProofFileName(e.target.files?.[0]?.name || '')}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Completing Onboarding...
                  </>
                ) : (
                  <>
                    Complete Onboarding & Access Dashboard <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto ring-8 ring-amber-500/20">
              <ShieldCheck className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Pending Super Admin Approval
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                Registration Request Submitted!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your organizer profile and organization tenant have been created. The Super Admin team is reviewing your registration request and will approve your dashboard access shortly.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Return to Login Page <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        © 2026 VisitExpo Inc. Integrated with VisitExpo Directory.
      </footer>
    </div>
  );
}

export default function OrganizerOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading organizer onboarding...
      </div>
    }>
      <OrganizerOnboardingContent />
    </Suspense>
  );
}
