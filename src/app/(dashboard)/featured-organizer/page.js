'use client';

/**
 * @file featured-organizer/page.js
 * @description Enterprise Organizer Featured Showcase Application.
 * Exclusively available to organizers on the Enterprise Plan.
 * Allows applying for homepage featured organizer placement, uploading brand assets,
 * previewing live carousel cards, and tracking Admin verification status.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Swal from 'sweetalert2';
import {
  Award,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Globe,
  Upload,
  ExternalLink,
  Lock,
  RefreshCw,
  AlertCircle,
  Eye,
  Layers,
  ArrowRight,
  Phone,
  Mail,
  Tag,
  Check,
  Loader2,
  Clock,
  Palette
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const PRESET_COLORS = [
  { name: 'Navy Blue', brand: '#002D62', accent: '#00A3E0' },
  { name: 'Royal Blue', brand: '#1E40AF', accent: '#3B82F6' },
  { name: 'Crimson Red', brand: '#DC2626', accent: '#F59E0B' },
  { name: 'Deep Indigo', brand: '#1E3A8A', accent: '#0284C7' },
  { name: 'Sky Tech', brand: '#0284C7', accent: '#0EA5E9' },
  { name: 'Ruby Dark', brand: '#B91C1C', accent: '#EF4444' },
  { name: 'Emerald Green', brand: '#047857', accent: '#10B981' },
  { name: 'Amber Bronze', brand: '#B45309', accent: '#F59E0B' },
  { name: 'Violet Purple', brand: '#4338CA', accent: '#6366F1' },
  { name: 'Forest Green', brand: '#15803D', accent: '#22C55E' }
];

const CATEGORIES = [
  'Trade & Industry',
  'Technology & AI',
  'Healthcare & Pharma',
  'Automotive & EV',
  'Construction & Infra',
  'Agri & Food Tech',
  'Travel & Tourism',
  'Textile & Fashion',
  'Consumer & Retail'
];

export default function FeaturedOrganizerApplicationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    website: '',
    logoUrl: '',
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    badge: 'Enterprise Partner',
    scope: '',
    category: 'Trade & Industry',
    applicantPhone: '',
    applicationNotes: ''
  });

  const checkPlanAndFetchApplication = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/featured-organizers/my-application`);
      if (res.data?.success) {
        setIsEnterprise(res.data.isEnterprise || user?.plan === 'enterprise' || user?.plan === 'growth');
        const app = res.data.application;
        setApplication(app);

        if (app) {
          setFormData({
            name: app.name || user?.company || user?.name || '',
            shortName: app.shortName || app.name || '',
            website: app.website || '',
            logoUrl: app.logoUrl || '',
            brandColor: app.brandColor || '#002D62',
            accentColor: app.accentColor || '#00A3E0',
            badge: app.badge || 'Enterprise Partner',
            scope: app.scope || '',
            category: app.category || 'Trade & Industry',
            applicantPhone: app.applicantPhone || user?.phone || '',
            applicationNotes: app.applicationNotes || ''
          });
        } else {
          // Pre-populate with user info
          setFormData((prev) => ({
            ...prev,
            name: user?.company || user?.name || '',
            shortName: user?.company ? user.company.split(' ')[0] : (user?.name || ''),
            applicantPhone: user?.phone || '',
            website: user?.website || ''
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch application:', err.message);
      setIsEnterprise(user?.plan === 'enterprise' || user?.plan === 'growth');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPlanAndFetchApplication();
  }, [user?.id, user?._id, user?.plan]);

  // Handle image upload to Cloudinary
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select a valid image file (PNG, JPG, SVG, WebP).'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image file size must be less than 5MB.'
      });
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.append('file', file);

    try {
      setUploadingLogo(true);
      const res = await axios.post(`${API_URL}/upload`, uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data.url) {
        setFormData((prev) => ({ ...prev, logoUrl: res.data.url }));
        Swal.fire({
          icon: 'success',
          title: 'Logo Uploaded',
          text: 'Corporate logo uploaded successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.response?.data?.error || 'Could not upload image. You can also paste an image URL directly.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Required Field',
        text: 'Please provide your organization or company name.'
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_URL}/featured-organizers/apply`, formData);
      if (res.data?.success) {
        setApplication(res.data.data);
        setIsEditing(false);
        await Swal.fire({
          icon: 'success',
          title: 'Application Submitted!',
          text: res.data.message || 'Your Featured Organizer application has been submitted for Super Admin review.',
          confirmButtonColor: '#FFCC00',
          confirmButtonText: 'Great, View Status'
        });
        checkPlanAndFetchApplication();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.response?.data?.error || 'Could not submit application. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ==========================================
  // CASE 1: FREE OR STARTER PLAN (LOCKED)
  // ==========================================
  if (!isEnterprise) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pt-1 sm:pt-2 px-2 sm:px-4 lg:px-6 pb-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500 shrink-0" />
            Homepage Featured Organizer Showcase
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Premier brand positioning for leading exhibition organizers across VisitExpo.
          </p>
        </div>

        {/* Lock Banner Card */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/20">
                <Lock className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Crown className="h-3.5 w-3.5" />
                  Enterprise Plan Exclusive Feature
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  Enterprise Plan Required to Apply
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground block font-medium">Your Current Tier</span>
              <span className="text-base font-extrabold text-foreground capitalize">
                {user?.plan || 'Free'} Organizer Plan
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              The <strong>Featured Organizers Showcase</strong> is exclusively reserved for organizations on the{' '}
              <strong className="text-foreground font-bold">Enterprise Plan</strong>. This premium placement puts your
              organization directly in front of over <strong>500,000+ trade visitors, buyers, and international exhibitors</strong> on
              the VisitExpo homepage carousel.
            </p>
            <p>
              Free and Starter plan accounts cannot apply for featured organizer status. Upgrading unlocks direct homepage
              spotlight, custom corporate brand badges, priority event listing ranks, and unmasked inquiry intelligence.
            </p>
          </div>

          {/* Feature Comparison Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Globe className="h-4 w-4 text-primary" />
                <span>Prime Homepage Carousel</span>
              </div>
              <p className="text-xs text-muted-foreground">
                High-converting interactive logo card with verified badge and direct event counter.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Brand Badging</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Custom corporate badge, brand colors, and verified organizer checkmark across all listings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>3x Exhibitor Inquiries</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Featured partners report 300% more inbound exhibitor booth inquiries and VIP passes.
              </p>
            </div>
          </div>

          {/* Upgrade Call to Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <span>Upgrade to Enterprise Plan</span>
              <ArrowRight className="h-3.5 w-3.5 text-black" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-background hover:bg-secondary/80 text-foreground text-xs sm:text-sm font-medium border border-border/80 transition-all active:scale-[0.98] cursor-pointer"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: ENTERPRISE PLAN (ACTIVE OR CAN APPLY)
  // ==========================================
  const isApproved = application?.status === 'approved';
  const isPending = application?.status === 'pending';
  const isRejected = application?.status === 'rejected';
  const hasApplication = Boolean(application);
  const showForm = !hasApplication || isEditing;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-1 sm:pt-2 px-2 sm:px-4 lg:px-6 pb-8">
      {/* Header with Enterprise Status Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500 shrink-0" />
            Featured Organizer Showcase
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Submit your corporate branding for homepage carousel placement and global directory spotlight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            Enterprise Plan Verified
          </span>
          <button
            onClick={checkPlanAndFetchApplication}
            title="Refresh status"
            className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Application Status Banner (if application exists and not currently editing) */}
      {hasApplication && !isEditing && (
        <div
          className={`rounded-3xl border p-6 sm:p-8 shadow-lg transition-all ${
            isApproved
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : isPending
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-rose-500/30 bg-rose-500/5'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-4 ${
                  isApproved
                    ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
                    : isPending
                    ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 ring-rose-500/20'
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : isPending ? (
                  <Clock className="h-6 w-6 text-amber-600 animate-pulse" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isApproved ? 'Approved & Featured' : isPending ? 'Pending Admin Review' : 'Needs Revision'}
                  </span>
                  {application.isActive && isApproved && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      Live on Homepage Carousel
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-foreground">
                  {isApproved
                    ? 'Congratulations! Your Organization is Featured'
                    : isPending
                    ? 'Application Submitted & Under Review'
                    : 'Application Requires Changes'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isApproved
                    ? 'Your organizer brand card is active in the Featured Organizers showcase on VisitExpo.'
                    : isPending
                    ? 'Our Super Admin team reviews corporate assets within 24 hours. You will see your card live upon approval.'
                    : application.adminReviewNotes || 'Please review the admin feedback below and update your application.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              {isApproved && (
                <Link
                  href="/#organizers"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Live Carousel
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                {isApproved ? 'Update Brand Details' : isPending ? 'Edit Application' : 'Revise & Resubmit'}
              </button>
            </div>
          </div>

          {/* Admin Feedback note if rejected */}
          {isRejected && application.adminReviewNotes && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold block mb-1">Admin Feedback:</span>
              <p>{application.adminReviewNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Form on Left, Live Carousel Card Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {hasApplication && !isEditing ? 'Registered Brand Dossier' : 'Featured Organizer Application'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Provide high-resolution branding assets and corporate details for optimal display.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              {/* Organization Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Organization / Company Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!showForm}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Informa Markets, Messe Frankfurt, Bharat Trade Fair Ltd."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                />
              </div>

              {/* Short Brand Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Display Short Name <span className="text-xs text-muted-foreground font-normal">(Card Label)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!showForm}
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="e.g. Informa, Messe Frankfurt, IES India"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                  />
                </div>

                {/* Badge Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Tagline / Badge Text
                  </label>
                  <input
                    type="text"
                    disabled={!showForm}
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Global Leader, German Fairs, National Trade Expos"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Website & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Official Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      disabled={!showForm}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Primary Exhibition Sector</label>
                  <select
                    disabled={!showForm}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logo Upload & URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Corporate Logo <span className="text-xs text-muted-foreground font-normal">(Transparent PNG or SVG recommended)</span>
                </label>
                {showForm && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold cursor-pointer transition-colors">
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-primary" />
                          <span>Choose Image File</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">or image URL:</span>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://.../logo.png"
                      className="flex-1 px-4 py-2 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                )}
                {formData.logoUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30 border border-border w-fit">
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="h-10 w-24 object-contain bg-white rounded-lg p-1 border border-zinc-200"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">Logo linked</span>
                  </div>
                )}
              </div>

              {/* Brand Colors (Primary & Accent) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Brand Theme Colors</span>
                  <span className="text-muted-foreground font-normal text-[11px]">Click preset or pick custom</span>
                </label>

                {showForm && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, brandColor: col.brand, accentColor: col.accent })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] hover:border-foreground/50 transition-colors cursor-pointer"
                        style={{
                          backgroundColor:
                            formData.brandColor === col.brand ? `${col.brand}15` : 'transparent'
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: col.brand }}
                        />
                        <span className="font-semibold">{col.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!showForm}
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <span className="text-[10px] text-muted-foreground block font-bold">Brand Primary</span>
                      <input
                        type="text"
                        disabled={!showForm}
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                        className="w-full text-xs font-mono font-bold bg-transparent border-none p-0 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!showForm}
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <span className="text-[10px] text-muted-foreground block font-bold">Accent Highlight</span>
                      <input
                        type="text"
                        disabled={!showForm}
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="w-full text-xs font-mono font-bold bg-transparent border-none p-0 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description / Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  About Organizer / Scope of Operations
                </label>
                <textarea
                  rows={3}
                  disabled={!showForm}
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="Briefly describe your exhibitions portfolio, annual editions, and industry reach..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Corporate Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      disabled={!showForm}
                      value={formData.applicantPhone}
                      onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Account Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-muted-foreground text-xs cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Notes to Super Admin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Notes for Reviewer <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  disabled={!showForm}
                  value={formData.applicationNotes}
                  onChange={(e) => setFormData({ ...formData, applicationNotes: e.target.value })}
                  placeholder="e.g. Please link our upcoming autumn expo edition, our brand palette is verified."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-70"
                />
              </div>

              {/* Action Buttons */}
              {showForm && (
                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-semibold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Award className="h-3.5 w-3.5 text-black" />
                        <span>
                          {hasApplication ? 'Update & Re-submit for Review' : 'Submit Application to Super Admin'}
                        </span>
                      </>
                    )}
                  </button>

                  {hasApplication && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl bg-background hover:bg-secondary/80 border border-border/80 text-foreground text-xs font-medium transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Live Card Preview Matching Homepage */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          {/* Card Preview Box */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Live Carousel Card Preview
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                10times Style Card
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This is how your brand appears on the VisitExpo homepage featured carousel.
            </p>

            {/* Simulated Carousel Track Item */}
            <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-4">
              {/* Simulated Card matching FeaturedOrganizers.js exactly */}
              <div className="w-32 h-26 bg-white rounded-xl flex flex-col items-center justify-center p-2.5 border border-zinc-200/90 shadow-md relative group hover:-translate-y-1 transition-all select-none">
                {/* Event Count pill */}
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {application?.eventsCount || '12'}
                </span>

                {/* Logo or Custom fallback */}
                <div className="flex-1 flex items-center justify-center w-full px-1">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt={formData.name || 'Preview'}
                      className="max-h-12 max-w-[90px] object-contain rounded-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span
                        className="text-xs font-black tracking-tight"
                        style={{ color: formData.brandColor || '#002D62' }}
                      >
                        {formData.shortName || formData.name || 'Your Brand'}
                      </span>
                      <span className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold">
                        {formData.badge || 'Organizer'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tooltip Demonstration */}
              <div className="bg-zinc-950 text-white text-[11px] font-medium px-3 py-1 rounded-md shadow-md border border-zinc-800 flex items-center gap-2">
                <span className="font-semibold text-white">
                  {formData.name || 'Your Company Name'}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-emerald-400 font-bold">
                  {formData.badge || 'Enterprise Partner'}
                </span>
              </div>
            </div>

            {/* Dossier details card */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Placement:</span>
                <span className="font-bold text-foreground">Top Homepage #1 Featured Track</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Plan Privilege:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Enterprise Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-bold capitalize text-foreground">
                  {application?.status || 'Not Submitted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Sector:</span>
                <span className="font-bold text-foreground">{formData.category}</span>
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Super Admin Approval Guidelines
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Transparent high-contrast logo file works best across light and dark backgrounds.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Keep display short name between 6 and 20 characters for clean card balance.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Only corporate verified organizers on active Enterprise plans receive approval.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
