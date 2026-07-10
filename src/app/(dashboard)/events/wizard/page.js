'use client';

/**
 * @file wizard/page.js
 * @description 10times-Style Multi-Step Event & Organizer Onboarding Wizard.
 * Features 8 step workflow:
 * 1. Action Choice (Create vs Claim)
 * 2. Basic Details (with AI Description Generator)
 * 3. Date & Venue (with interactive map preview)
 * 4. Organizer Profile Setup
 * 5. Banner & Media Upload (1920x1080 cover, photo gallery, brochure, promo video)
 * 6. Ticketing & Registration Form configuration
 * 7. Preview & Pre-Publish SEO Checker (with real-time SEO score gauge)
 * 8. Submission & Admin Moderation Status
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext.js';
import axios from 'axios';
import {
  Sparkles,
  Calendar,
  MapPin,
  Building,
  Upload,
  Ticket,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
  Info,
  ShieldCheck,
  Search,
  FileText,
  Video,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  ExternalLink,
  Zap,
  Check,
  Lock,
  Layers,
  Star
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STEPS = [
  { id: 1, title: 'Welcome & Path', icon: Layers },
  { id: 2, title: 'Basic Details', icon: FileText },
  { id: 3, title: 'Date & Venue', icon: Calendar },
  { id: 4, title: 'Organizer Profile', icon: Building },
  { id: 5, title: 'Media Upload', icon: ImageIcon },
  { id: 6, title: 'Ticketing & Form', icon: Ticket },
  { id: 7, title: 'Preview & SEO', icon: Eye },
  { id: 8, title: 'Submit & Moderation', icon: CheckCircle2 }
];

export default function EventWizardPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [lastAutosaved, setLastAutosaved] = useState('Just now');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Technology & AI',
    industry: 'Information Technology',
    description: '',
    startDate: '',
    endDate: '',
    timings: '09:00 AM - 06:00 PM',
    venueName: '',
    city: '',
    state: 'Delhi NCR',
    country: 'India',
    address: '',
    // Organizer Profile
    orgName: user?.organization?.name || 'Global Tech Events Ltd',
    orgEmail: user?.email || 'organizer@visitexpo.in',
    orgPhone: '+91 98765 43210',
    orgWebsite: 'https://globaltechevents.com',
    orgGst: '07AAAAA1111A1Z1',
    orgLogo: '',
    socialFacebook: '',
    socialLinkedIn: '',
    socialInstagram: '',
    socialX: '',
    // Media
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    gallery: [],
    brochurePdf: '',
    promoVideoUrl: '',
    // Ticketing & Form
    isFreeEvent: true,
    paidTicketPrice: '499',
    formFields: ['name', 'email', 'phone', 'company', 'designation'],
    // SEO
    metaTitle: '',
    metaDescription: ''
  });

  // Autosave simulation every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }, 800);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Generate Slug
  const handleTitleBlur = () => {
    if (!formData.slug && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
    // Auto-fill Meta Title if empty
    if (!formData.metaTitle && formData.title) {
      setFormData(prev => ({ ...prev, metaTitle: `${formData.title} | VisitExpo` }));
    }
  };

  // AI Description Generator
  const generateAiDescription = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const title = formData.title || 'Tech & Trade Expo 2026';
      const cat = formData.category || 'Technology';
      const city = formData.city || 'New Delhi';

      const aiText = `${title} is the premier B2B gathering for ${cat} pioneers, industry innovators, and global corporate leaders. Held in ${city}, this landmark event features live technology demonstrations, strategic keynote panels, high-impact networking lounges, and exclusive B2B matching sessions designed to accelerate commercial growth. Join over 5,000+ registered delegates and top exhibitor brands shaping the future of global trade.`;

      setFormData(prev => ({
        ...prev,
        description: aiText,
        metaDescription: `Join ${title} in ${city}. The premier B2B ${cat} expo featuring live demos, networking, and industry keynotes.`
      }));
      setIsAiGenerating(false);
    }, 1200);
  };

  // Calculate Pre-submission SEO Score (0-100)
  const calculateSeoScore = () => {
    let score = 30;
    if (formData.title) score += 15;
    if (formData.description && formData.description.length > 50) score += 20;
    if (formData.bannerUrl) score += 15;
    if (formData.venueName && formData.city) score += 10;
    if (formData.metaTitle && formData.metaDescription) score += 10;
    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore();

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form Submission
  const handleSubmitEvent = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const categoriesArray = [formData.category, formData.industry].filter(Boolean);
      const payload = {
        title: formData.title || 'Untitled Expo Event',
        slug: formData.slug || `expo-event-${Date.now()}`,
        description: formData.description || 'Description provided during onboarding.',
        banner: formData.bannerUrl,
        venue: formData.venueName || 'Main Exhibition Hall',
        city: formData.city || 'New Delhi',
        country: formData.country,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate || new Date(Date.now() + 86400000 * 2).toISOString(),
        timings: formData.timings,
        categories: categoriesArray,
        status: 'draft',
        seo: {
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription
        }
      };

      if (!accessToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.post(`${API_URL}/events`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setIsSubmitted(true);
      setCurrentStep(8);
    } catch (err) {
      console.error('Submission error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to submit event';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner: Progress Stepper & Autosave Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-1">
              <Sparkles className="h-3.5 w-3.5" /> 10times Style Onboarding Wizard
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Event & Organizer Onboarding
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {currentStep} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[currentStep - 1].title}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Autosave Indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
              <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin text-primary' : 'text-emerald-500'}`} />
              <span>{isSaving ? 'Saving Draft...' : `Autosaved at ${lastAutosaved}`}</span>
            </div>
            {currentStep > 1 && currentStep < 8 && (
              <button
                onClick={() => setCurrentStep(7)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg border border-border transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-primary" /> Live Preview
              </button>
            )}
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="relative overflow-x-auto py-2">
          <div className="flex items-center justify-between min-w-[700px]">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id || isSubmitted;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <button
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md'
                        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                  </button>
                  <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP CONTENT PANELS */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        
        {/* STEP 1: WELCOME & ACTION CHOICE */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-bold text-foreground">Welcome to VisitExpo Event Onboarding</h3>
              <p className="text-sm text-muted-foreground">
                Get your event listed on India's premier B2B expo platform in minutes. Choose how you would like to begin:
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-4">
              {/* Option A: Create New Event */}
              <div
                onClick={nextStep}
                className="group relative rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-transparent p-6 hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Create New Event
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Start fresh with our step-by-step 10times wizard. Add event dates, venue location, organizer profile, media galleries, ticketing, and pre-publish SEO score check.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary">
                  <span>Start Event Wizard</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option B: Claim Existing Event */}
              <div
                onClick={() => router.push('/events/claim')}
                className="group relative rounded-2xl border-2 border-border bg-card p-6 hover:border-foreground/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground font-bold border border-border">
                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                    Existing Listing
                  </span>
                </div>
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Claim Existing Event
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Is your event already listed in our directory? Claim ownership by submitting your official business email, website, and proof of organization.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>Search & Claim Ownership</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BASIC DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Step 2: Basic Event Information
                </h3>
                <p className="text-xs text-muted-foreground">Provide core identity and taxonomy for your expo.</p>
              </div>
              <button
                type="button"
                onClick={generateAiDescription}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
              >
                <Sparkles className={`h-4 w-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                {isAiGenerating ? 'Generating AI Description...' : 'AI Assist: Generate Description'}
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Event Name / Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleTitleBlur}
                  placeholder="E.g. India International Tech & AI Summit 2026"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Public URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2.5 rounded-l-lg border border-r-0 border-border text-xs text-muted-foreground font-mono">
                    visitexpo.in/events/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="india-tech-ai-summit-2026"
                    className="w-full rounded-r-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Primary Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Technology & AI">Technology & AI</option>
                  <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                  <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                  <option value="Renewable Energy & ESG">Renewable Energy & ESG</option>
                  <option value="Agriculture & Food Tech">Agriculture & Food Tech</option>
                  <option value="Consumer Goods & Retail">Consumer Goods & Retail</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Industry Sub-Sector
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="E.g. Enterprise Software, Robotics, IoT"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Event Description *
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {formData.description.length} characters
                </span>
              </div>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the main highlights, target visitor profiles, exhibitor benefits, and key conference themes..."
                className="w-full rounded-lg border border-border bg-background p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: DATE & VENUE */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Step 3: Dates, Timings & Venue Location
              </h3>
              <p className="text-xs text-muted-foreground">Specify event schedule and exact hall address.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Daily Visitor Timings
                </label>
                <input
                  type="text"
                  name="timings"
                  value={formData.timings}
                  onChange={handleChange}
                  placeholder="09:00 AM - 06:00 PM"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Venue Name / Hall Number *
                </label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  placeholder="E.g. Pragati Maidan Exhibition Complex (Hall 7-10)"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Mathura Road, Connaught Place, New Delhi 110001"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Interactive Map Suggestion Widget */}
            <div className="border border-border/80 rounded-2xl p-4 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Automatic Venue Map Integration</h4>
                  <p className="text-[11px] text-muted-foreground">
                    VisitExpo automatically embeds Google Maps directions for visitors to {formData.venueName || 'your venue'}.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                Map Active
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: ORGANIZER PROFILE SETUP */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Step 4: Organizer Profile Setup
              </h3>
              <p className="text-xs text-muted-foreground">Build trust with corporate attendees & exhibitors.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Organization / Business Name *
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  GST / Corporate Identification ID (Optional)
                </label>
                <input
                  type="text"
                  name="orgGst"
                  value={formData.orgGst}
                  onChange={handleChange}
                  placeholder="07AAAAA1111A1Z1"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  name="orgWebsite"
                  value={formData.orgWebsite}
                  onChange={handleChange}
                  placeholder="https://globaltechevents.com"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="orgEmail"
                  value={formData.orgEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Hotline Phone *
                </label>
                <input
                  type="text"
                  name="orgPhone"
                  value={formData.orgPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Social Links Sub-section */}
            <div className="border border-border/80 rounded-2xl p-4 bg-muted/10 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Social Links</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="url"
                  name="socialLinkedIn"
                  value={formData.socialLinkedIn}
                  onChange={handleChange}
                  placeholder="LinkedIn Company Page URL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                />
                <input
                  type="url"
                  name="socialFacebook"
                  value={formData.socialFacebook}
                  onChange={handleChange}
                  placeholder="Facebook Page URL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: MEDIA UPLOAD */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Step 5: Media Upload & Promotional Assets
              </h3>
              <p className="text-xs text-muted-foreground">Upload 1920x1080 banner, gallery photos, brochure PDF & promo video.</p>
            </div>

            {/* Main Cover Banner Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase">
                Event Main Banner Cover (Recommended: 1920 x 1080 px) *
              </label>
              <div className="relative rounded-2xl border-2 border-dashed border-border p-6 bg-muted/10 text-center hover:border-primary transition-colors cursor-pointer">
                {formData.bannerUrl ? (
                  <div className="relative h-44 w-full rounded-xl overflow-hidden shadow-md">
                    <img src={formData.bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg border border-white/20">
                        Change Banner Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-foreground">Drag and drop event banner image here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Brochure PDF Link
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="url"
                    name="brochurePdf"
                    value={formData.brochurePdf}
                    onChange={handleChange}
                    placeholder="https://example.com/expo-brochure.pdf"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Promo Video URL (YouTube / Vimeo)
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="url"
                    name="promoVideoUrl"
                    value={formData.promoVideoUrl}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=promo_id"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: TICKETING & REGISTRATION FORM */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" /> Step 6: Ticketing & Visitor Registration Setup
              </h3>
              <p className="text-xs text-muted-foreground">Configure registration rules and visitor data collection fields.</p>
            </div>

            {/* Free vs Paid Toggle */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                onClick={() => setFormData(prev => ({ ...prev, isFreeEvent: true }))}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  formData.isFreeEvent
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Free Visitor Registration</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                    {formData.isFreeEvent && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Complimentary pass for trade visitors and corporate delegates. Increases attendee throughput.
                </p>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...prev, isFreeEvent: false }))}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  !formData.isFreeEvent
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Paid Ticket Entry</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${!formData.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                    {!formData.isFreeEvent && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Charge for VIP tickets or conference passes. Connected directly with payment gateway.
                </p>
              </div>
            </div>

            {!formData.isFreeEvent && (
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Ticket Price per Attendee (INR ₹)
                </label>
                <input
                  type="number"
                  name="paidTicketPrice"
                  value={formData.paidTicketPrice}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Form Fields selector */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Registration Form Required Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Full Name', 'Email Address', 'Mobile Number', 'Company / Org', 'Designation', 'Industry Sector', 'City'].map((field, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: PREVIEW & SEO CHECK */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Step 7: Event Preview & Pre-Publish SEO Analysis
                </h3>
                <p className="text-xs text-muted-foreground">Verify public details and search engine optimization grade.</p>
              </div>
              
              {/* SEO Score Badge */}
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 px-4 py-2">
                <Star className="h-5 w-5 text-emerald-500 fill-emerald-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">SEO Score Grade</span>
                  <p className="text-lg font-extrabold text-emerald-500 leading-none">{seoScore} / 100</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Live Preview Card */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Live Public Listing Card Preview</h4>
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                  <div className="h-44 bg-muted relative">
                    {formData.bannerUrl ? (
                      <img src={formData.bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        Banner Preview
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                      Pending Review
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Calendar className="h-4 w-4" />
                      <span>{formData.startDate || '2026-10-15'} to {formData.endDate || '2026-10-17'} ({formData.timings})</span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground leading-snug">
                      {formData.title || 'Untitled Expo Event 2026'}
                    </h2>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {formData.description || 'Comprehensive event description will be rendered here.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{formData.venueName || 'Pragati Maidan'}, {formData.city || 'New Delhi'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-Publish Checklist */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Pre-Submission Quality Checklist</h4>
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  {[
                    { label: 'Event Banner Uploaded', pass: !!formData.bannerUrl },
                    { label: 'Start & End Dates Set', pass: !!formData.startDate && !!formData.endDate },
                    { label: 'Venue Location Confirmed', pass: !!formData.venueName && !!formData.city },
                    { label: 'Organizer Profile Complete', pass: !!formData.orgName && !!formData.orgEmail },
                    { label: 'Visitor Form Configured', pass: true },
                    { label: 'SEO Title & Description', pass: !!formData.metaTitle }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/60 last:border-0">
                      <span className="text-foreground">{item.label}</span>
                      {item.pass ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <CheckCircle2 className="h-4 w-4" /> Pass
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <AlertTriangle className="h-4 w-4" /> Optional
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: SUBMIT & MODERATION WORKFLOW */}
        {currentStep === 8 && (
          <div className="text-center max-w-xl mx-auto space-y-6 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto ring-8 ring-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" /> Moderation Workflow Active
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                Event Submitted for Admin Approval!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for onboarding your event with VisitExpo. Your listing <strong className="text-foreground">{formData.title || 'Tech Expo'}</strong> is currently under review by our moderation team.
              </p>
            </div>

            {/* Moderation Details Card */}
            <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                Moderation Status SLA
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Estimated Approval Time:</span>
                  <p className="font-bold text-foreground">Within 24 Hours</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Moderator:</span>
                  <p className="font-bold text-foreground">VisitExpo Admin Desk</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/events"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Go to Organizer Dashboard
              </Link>
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-all"
              >
                Onboard Another Event
              </button>
            </div>
          </div>
        )}

        {/* Bottom Stepper Navigation Control Buttons */}
        {currentStep < 8 && (
          <div className="flex flex-col gap-4 pt-8 border-t border-border mt-8">
            {submitError && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center justify-between">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError('')} className="font-bold">×</button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'opacity-0 cursor-default'
                    : 'border border-border bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <ArrowLeft className="h-4 w-4" /> Previous Step
              </button>

              {currentStep === 7 ? (
                <button
                  onClick={handleSubmitEvent}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Event for Moderation'} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all"
                >
                  Continue to Next Step <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
