'use client';

/**
 * @file onboarding/exhibitor/page.js
 * @description Standalone Exhibitor Onboarding Portal connected with WordPress event pages.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Building,
  CheckCircle2,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Phone,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function ExhibitorOnboardingContent() {
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get('eventId');
  const urlWpSlug = searchParams.get('wp_slug');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [submittedExhibitor, setSubmittedExhibitor] = useState(null);

  // Form State
  const [exhibitorForm, setExhibitorForm] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    attendanceType: 'in_person',
    boothNumber: '',
    productCategories: 'Technology, Industrial',
    staff: []
  });

  const [staffInput, setStaffInput] = useState({ name: '', email: '', phone: '' });

  // Load events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events`);
        if (res.data && res.data.success && res.data.data.docs) {
          const fetchedDocs = res.data.data.docs;
          setEvents(fetchedDocs);

          // Auto select matching event by eventId or slug
          if (urlEventId) {
            const match = fetchedDocs.find(e => e._id === urlEventId);
            if (match) setSelectedEvent(match);
          } else if (urlWpSlug) {
            const match = fetchedDocs.find(e => e.slug === urlWpSlug || e.slug.includes(urlWpSlug));
            if (match) setSelectedEvent(match);
          } else if (fetchedDocs.length > 0) {
            setSelectedEvent(fetchedDocs[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [urlEventId, urlWpSlug]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setExhibitorForm(prev => ({ ...prev, [name]: value }));
  };

  const addStaffMember = () => {
    if (!staffInput.name || !staffInput.email) {
      alert('Staff Representative name and email are required');
      return;
    }
    setExhibitorForm(prev => ({
      ...prev,
      staff: [...prev.staff, staffInput]
    }));
    setStaffInput({ name: '', email: '', phone: '' });
  };

  const removeStaffMember = (index) => {
    setExhibitorForm(prev => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError('Please select an event for exhibitor registration.');
      return;
    }

    if (!exhibitorForm.name || !exhibitorForm.description || !exhibitorForm.contactEmail || !exhibitorForm.contactPhone) {
      setError('Company Name, Description, Contact Email, and Contact Phone are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const categoriesArray = exhibitorForm.productCategories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        eventId: selectedEvent._id,
        name: exhibitorForm.name,
        description: exhibitorForm.description,
        logo: exhibitorForm.logo,
        website: exhibitorForm.website,
        contactEmail: exhibitorForm.contactEmail,
        contactPhone: exhibitorForm.contactPhone,
        attendanceType: exhibitorForm.attendanceType,
        productCategories: categoriesArray,
        staff: exhibitorForm.staff
      };

      const res = await axios.post(`${API_URL}/exhibitors/register`, payload);

      if (res.data && res.data.success) {
        setSubmittedExhibitor(res.data.exhibitor);
        setStep(4);
      }
    } catch (err) {
      console.error('Exhibitor onboarding failed', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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

  const filteredEvents = events.filter(evt => {
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
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white font-extrabold shadow-md shadow-primary/20">
              V
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Visit<span className="text-primary">Expo</span> <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Exhibitor Portal</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-10 w-full flex-1">
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-xl mx-auto relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-300 -z-0"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              />

              {[
                { num: 1, label: 'Target Event' },
                { num: 2, label: 'Company Profile' },
                { num: 3, label: 'Staff & Review' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1.5 z-10 bg-background px-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step >= s.num
                        ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`text-xs font-medium ${step >= s.num ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">×</button>
          </div>
        )}

        {/* STEP 1: Select Event & Attendance */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-2">
                <Building className="h-3.5 w-3.5" /> Exhibitor Onboarding
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Select Expo Event to Exhibit At
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the trade fair or conference where your business wants to register a booth.
              </p>
            </div>

            {/* Event Selector */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {eventsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading expo event directory...
                </div>
              ) : (
                <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedEvent?._id === evt._id;
                    return (
                      <div
                        key={evt._id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-background hover:border-border/80'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{evt.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {evt.venue}, {evt.city} • <Calendar className="inline h-3 w-3" /> {new Date(evt.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <Check className="h-4 w-4" /> Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance Type Selector */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase">Booth Preference & Attendance Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'in_person', label: 'In-Person Booth', desc: 'Physical expo booth' },
                  { type: 'virtual', label: 'Virtual Only', desc: 'Online 3D booth space' },
                  { type: 'hybrid', label: 'Hybrid Package', desc: 'Both Physical & Virtual' }
                ].map((att) => (
                  <div
                    key={att.type}
                    onClick={() => setExhibitorForm(prev => ({ ...prev, attendanceType: att.type }))}
                    className={`p-3.5 rounded-xl border cursor-pointer text-center space-y-1 transition-all ${
                      exhibitorForm.attendanceType === att.type
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground block">{att.label}</span>
                    <span className="text-[10px] text-muted-foreground block">{att.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!selectedEvent) return setError('Please select an event');
                  setError('');
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Continue to Company Profile <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Company Profile */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Exhibitor Company Details
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Provide company information that will be published in the event catalog and visitor directory.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={exhibitorForm.name}
                    onChange={handleFormChange}
                    placeholder="e.g. NeuroCore Robotics Corp"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Website URL</label>
                  <input
                    type="url"
                    name="website"
                    value={exhibitorForm.website}
                    onChange={handleFormChange}
                    placeholder="https://company.com"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company / Booth Overview *</label>
                <textarea
                  required
                  rows={3}
                  name="description"
                  value={exhibitorForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe your products, solutions, or services to be showcased..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    name="contactEmail"
                    value={exhibitorForm.contactEmail}
                    onChange={handleFormChange}
                    placeholder="exhibits@company.com"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    name="contactPhone"
                    value={exhibitorForm.contactPhone}
                    onChange={handleFormChange}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Logo Image URL</label>
                  <input
                    type="url"
                    name="logo"
                    value={exhibitorForm.logo}
                    onChange={handleFormChange}
                    placeholder="https://company.com/logo.png"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Product Categories (Comma separated)</label>
                  <input
                    type="text"
                    name="productCategories"
                    value={exhibitorForm.productCategories}
                    onChange={handleFormChange}
                    placeholder="Automation, Robotics, AI, Manufacturing"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

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
                onClick={() => {
                  if (!exhibitorForm.name || !exhibitorForm.description || !exhibitorForm.contactEmail || !exhibitorForm.contactPhone) {
                    return setError('Please fill in required company profile fields.');
                  }
                  setError('');
                  setStep(3);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Continue to Representative Staff <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Staff & Final Submission */}
        {step === 3 && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Representative Staff Badges
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Add staff members who will attend and manage your booth at <strong className="text-foreground">{selectedEvent?.title}</strong>.
              </p>
            </div>

            {/* Staff list */}
            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase">Registered Representatives ({exhibitorForm.staff.length})</h4>
              
              {exhibitorForm.staff.length > 0 && (
                <div className="space-y-2">
                  {exhibitorForm.staff.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border text-xs">
                      <div>
                        <span className="font-bold text-foreground">{st.name}</span> • <span className="text-muted-foreground">{st.email}</span>
                      </div>
                      <button type="button" onClick={() => removeStaffMember(idx)} className="text-destructive font-bold hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-3 pt-2">
                <input
                  type="text"
                  placeholder="Staff Full Name"
                  value={staffInput.name}
                  onChange={(e) => setStaffInput(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Staff Email"
                  value={staffInput.email}
                  onChange={(e) => setStaffInput(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Staff Phone (optional)"
                    value={staffInput.phone}
                    onChange={(e) => setStaffInput(prev => ({ ...prev, phone: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                  />
                  <button
                    type="button"
                    onClick={addStaffMember}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 text-primary-foreground font-bold text-xs"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Registration...
                  </>
                ) : (
                  <>
                    Submit Exhibitor Application <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Registration Received */}
        {step === 4 && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto ring-8 ring-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Application Pending Review
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                Exhibitor Application Submitted!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Thank you for applying to exhibit at <strong className="text-foreground">{selectedEvent?.title}</strong>. The organizer moderation team has received your registration request.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company Name:</span>
                <span className="font-semibold text-foreground">{submittedExhibitor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Email:</span>
                <span className="font-semibold text-foreground">{submittedExhibitor?.contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-amber-500 uppercase">{submittedExhibitor?.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Return to Homepage <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        © 2026 VisitExpo Inc. Connected with WordPress Event Directory.
      </footer>
    </div>
  );
}

export default function ExhibitorOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading exhibitor onboarding...
      </div>
    }>
      <ExhibitorOnboardingContent />
    </Suspense>
  );
}
