'use client';

/**
 * @file page.js
 * @description Dedicated Login / Signup page with Google OAuth & role-tailored registration:
 *  - Visitors: Instant 1-click Google authentication to access passes and expos
 *  - Organizers & Exhibitors: Google Auth initiates Basic Details Registration form to collect organization name, phone, city, and sector
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.js';
import {
  Mail,
  Key,
  Building,
  User,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Ticket,
  Briefcase,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../../lib/firebase.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const INDUSTRY_OPTIONS = [
  'Information Technology & Software',
  'Industrial & Manufacturing',
  'Automotive, EV & Clean Energy',
  'Textile, Apparel & Fashion',
  'Healthcare, Pharma & Biotech',
  'Building, Architecture & Real Estate',
  'Consumer Electronics & Retail',
  'Food, Beverage & Hospitality',
  'Other Industry / Specialty'
];

export default function LoginPage() {
  const { user, loading, login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Auth Form State
  const [userRole, setUserRole] = useState('organizer'); // 'organizer', 'exhibitor', or 'visitor'
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Google Auth Pending Basic Details Form State
  const [googlePendingUser, setGooglePendingUser] = useState(null);
  const [googleDetailsForm, setGoogleDetailsForm] = useState({
    name: '',
    email: '',
    role: 'organizer',
    organizationName: '',
    phone: '',
    city: '',
    website: '',
    industry: 'Industrial & Manufacturing'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    phone: '',
    city: ''
  });

  // Read URL query params for visitor/event redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'visitor' || params.get('event')) {
        setUserRole('visitor');
      } else if (roleParam === 'exhibitor') {
        setUserRole('exhibitor');
      } else if (roleParam === 'organizer') {
        setUserRole('organizer');
      }
      if (params.get('signup') === 'true') {
        setIsSignup(true);
      }
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'visitor' ? '/' : '/dashboard');
    }
  }, [user, loading, router]);

  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Google Authentication Handler
  const handleGoogleLogin = async () => {
    setFormError('');
    setGoogleSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const idToken = await fbUser.getIdToken();

      const basePayload = {
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        photoURL: fbUser.photoURL,
        uid: fbUser.uid,
        idToken,
        role: userRole
      };

      // Visitors can immediately proceed to website with active session
      if (userRole === 'visitor') {
        const res = await loginWithGoogle(basePayload);
        if (!res.success) {
          setFormError(res.error || 'Google login failed.');
        } else {
          router.push('/');
        }
        return;
      }

      // For Organizers and Exhibitors: Check if user already exists with an established profile
      try {
        const checkRes = await axios.post(`${API_URL}/auth/google/check`, {
          email: fbUser.email,
          role: userRole
        });

        if (checkRes.data?.exists && checkRes.data?.user?.hasDetails) {
          // Existing user with registered details: login directly
          const res = await loginWithGoogle(basePayload);
          if (!res.success) {
            setFormError(res.error || 'Google login failed.');
          } else {
            router.push('/');
          }
          return;
        }
      } catch (checkErr) {
        console.warn('Pre-check skipped, opening registration form for details:', checkErr.message);
      }

      // New organizer/exhibitor: Prompt for basic registration details form
      setGooglePendingUser(basePayload);
      setGoogleDetailsForm({
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        role: userRole,
        organizationName: '',
        phone: '',
        city: '',
        website: '',
        industry: userRole === 'exhibitor' ? 'Industrial & Manufacturing' : ''
      });
    } catch (err) {
      console.error('Firebase Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setFormError('Google sign-in was closed by user.');
      } else if (err.code === 'auth/popup-blocked') {
        setFormError('Popup blocked by browser. Please allow popups for Google sign-in.');
      } else {
        setFormError(err.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  // Submit Google Basic Details Registration Form (for Organizers / Exhibitors)
  const handleGoogleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!googlePendingUser) return;

    if (!googleDetailsForm.organizationName.trim()) {
      setFormError(
        googleDetailsForm.role === 'exhibitor'
          ? 'Company / Brand Name is required.'
          : 'Organization Name is required.'
      );
      return;
    }

    if (!googleDetailsForm.phone.trim()) {
      setFormError('Contact Phone / WhatsApp number is required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const fullPayload = {
        ...googlePendingUser,
        name: googleDetailsForm.name,
        role: googleDetailsForm.role,
        organizationName: googleDetailsForm.organizationName.trim(),
        phone: googleDetailsForm.phone.trim(),
        city: googleDetailsForm.city.trim(),
        website: googleDetailsForm.website.trim(),
        industry: googleDetailsForm.industry,
        company: googleDetailsForm.organizationName.trim()
      };

      const res = await loginWithGoogle(fullPayload);
      if (!res.success) {
        setFormError(res.error || 'Registration failed. Please try again.');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Google details submission error:', err);
      setFormError(err.response?.data?.error || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Regular Email/Password Form Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        if (!formData.name || !formData.email || !formData.password) {
          setFormError('Name, email, and password are required.');
          setSubmitting(false);
          return;
        }
        if ((userRole === 'organizer' || userRole === 'exhibitor') && !formData.organizationName) {
          setFormError(
            userRole === 'exhibitor'
              ? 'Company / Exhibitor name is required.'
              : 'Organization name is required.'
          );
          setSubmitting(false);
          return;
        }
        const res = await signup(
          formData.name,
          formData.email,
          formData.password,
          userRole !== 'visitor' ? formData.organizationName : '',
          userRole
        );
        if (!res.success) {
          setFormError(res.error || 'Registration failed.');
        } else {
          router.push('/');
        }
      } else {
        if (!formData.email || !formData.password) {
          setFormError('Email and Password are required.');
          setSubmitting(false);
          return;
        }
        const res = await login(formData.email, formData.password);
        if (!res.success) {
          setFormError(res.error || 'Invalid credentials.');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-7 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to VisitExpo Home
          </Link>
          <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure Auth Hub
          </span>
        </div>

        {/* STEP 2: GOOGLE REGISTRATION BASIC DETAILS FORM */}
        {googlePendingUser ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Google Identity Verification Banner */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="h-11 w-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base shrink-0 overflow-hidden">
                {googlePendingUser.photoURL ? (
                  <img src={googlePendingUser.photoURL} alt="Google Avatar" className="h-full w-full object-cover" />
                ) : (
                  (googlePendingUser.name || 'G').charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-100 truncate">{googlePendingUser.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">{googlePendingUser.email}</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Complete {googleDetailsForm.role === 'exhibitor' ? 'Exhibitor' : 'Organizer'} Registration
              </h2>
              <p className="text-xs text-zinc-400">
                Provide your basic business details to initialize your portal and access your dashboard.
              </p>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Role switch toggle in Google step */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGoogleDetailsForm(prev => ({ ...prev, role: 'organizer' }))}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  googleDetailsForm.role === 'organizer'
                    ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building className="h-3.5 w-3.5 text-amber-400" />
                <span>Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => setGoogleDetailsForm(prev => ({ ...prev, role: 'exhibitor' }))}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  googleDetailsForm.role === 'exhibitor'
                    ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                <span>Exhibitor</span>
              </button>
            </div>

            {/* Basic Details Form */}
            <form onSubmit={handleGoogleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                  {googleDetailsForm.role === 'exhibitor' ? 'Company / Exhibitor Brand Name *' : 'Organization Name *'}
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={googleDetailsForm.organizationName}
                    onChange={(e) => setGoogleDetailsForm(prev => ({ ...prev, organizationName: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={googleDetailsForm.role === 'exhibitor' ? 'e.g. Apex Industrial Solutions Ltd' : 'e.g. Global Tech Expos Pvt Ltd'}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                    Contact Phone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                    <input
                      type="tel"
                      required
                      value={googleDetailsForm.phone}
                      onChange={(e) => setGoogleDetailsForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                    City / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                    <input
                      type="text"
                      value={googleDetailsForm.city}
                      onChange={(e) => setGoogleDetailsForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g. Mumbai, New Delhi"
                    />
                  </div>
                </div>
              </div>

              {googleDetailsForm.role === 'exhibitor' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                    Industry Sector / Product Category
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                    <select
                      value={googleDetailsForm.industry}
                      onChange={(e) => setGoogleDetailsForm(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                    >
                      {INDUSTRY_OPTIONS.map((ind) => (
                        <option key={ind} value={ind} className="bg-zinc-900 text-zinc-200">
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                  Website / Portfolio (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="url"
                    value={googleDetailsForm.website}
                    onChange={(e) => setGoogleDetailsForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 px-4 text-sm transition-all shadow-lg shadow-primary/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" /> Completing Registration...
                    </>
                  ) : (
                    <>
                      <span>Complete Registration &amp; Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGooglePendingUser(null);
                    setFormError('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 1: REGULAR LOGIN / GOOGLE AUTH VIEW */
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="VisitExpo Logo"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">
                {isSignup
                  ? userRole === 'visitor'
                    ? 'Create Visitor Pass Account'
                    : userRole === 'exhibitor'
                    ? 'Create Exhibitor Account'
                    : 'Create Organizer Account'
                  : 'Welcome to VisitExpo'}
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {userRole === 'visitor'
                  ? 'Sign in to browse live trade expos, get free entry passes, and access QR badges'
                  : userRole === 'exhibitor'
                  ? 'Sign in to manage booth allocations, showcase products, and connect with buyers'
                  : isSignup
                  ? 'Initialize your organizer profile & manage world-class trade shows'
                  : 'Access your Event Organizer SaaS Dashboard'}
              </p>
            </div>

            {/* 3-Role Selector: Organizer, Exhibitor, Visitor */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setUserRole('organizer');
                  setFormError('');
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userRole === 'organizer'
                    ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building className="h-3.5 w-3.5 text-amber-400" />
                <span className="truncate">Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole('exhibitor');
                  setFormError('');
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userRole === 'exhibitor'
                    ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate">Exhibitor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole('visitor');
                  setFormError('');
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userRole === 'visitor'
                    ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">Visitor</span>
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Continue with Google Option */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleSubmitting || submitting}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 active:bg-zinc-750 text-zinc-100 font-semibold py-2.5 px-4 text-sm transition-all shadow-sm hover:border-zinc-500 cursor-pointer disabled:opacity-50"
            >
              {googleSubmitting ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-zinc-300" />
              ) : (
                <>
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {userRole === 'visitor'
                      ? 'Continue with Google (Instant Pass Access)'
                      : userRole === 'exhibitor'
                      ? 'Continue with Google as Exhibitor'
                      : 'Continue with Google as Organizer'}
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-800" />
              <span className="bg-zinc-900/90 px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-500 shrink-0">
                or continue with email
              </span>
              <div className="w-full border-t border-zinc-800" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {userRole !== 'visitor' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                        {userRole === 'exhibitor' ? 'Company / Exhibitor Name' : 'Organization Name'}
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                        <input
                          type="text"
                          name="organizationName"
                          required
                          value={formData.organizationName}
                          onChange={handleFormChange}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder={userRole === 'exhibitor' ? 'e.g. Apex Industrial Solutions' : 'e.g. Expo Masters Ltd'}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 text-sm transition-all shadow-lg shadow-primary/10 mt-6 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <>
                    {isSignup
                      ? userRole === 'visitor'
                        ? 'Register as Visitor'
                        : userRole === 'exhibitor'
                        ? 'Register as Exhibitor'
                        : 'Register Portal'
                      : userRole === 'visitor'
                      ? 'Sign In & Browse Passes'
                      : 'Login'}{' '}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 space-y-3">
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setFormError('');
                }}
                className="text-xs text-zinc-400 hover:text-primary transition-colors font-medium block mx-auto cursor-pointer"
              >
                {isSignup
                  ? 'Already have an account? Sign In'
                  : userRole === 'visitor'
                  ? 'Need a visitor pass account? Register here'
                  : userRole === 'exhibitor'
                  ? 'Need an exhibitor booth account? Register here'
                  : 'Need an organizer account? Register here'}
              </button>

              <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
                <Link
                  href="/expos"
                  className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1"
                >
                  🎫 Browse Live Exhibitions &amp; Visitor Passes &rarr;
                </Link>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
