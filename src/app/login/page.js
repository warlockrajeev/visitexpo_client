'use client';

/**
 * @file page.js
 * @description Dedicated Login / Signup page for Organizer Dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const { user, loading, login, signup } = useAuth();
  const router = useRouter();

  // Auth Form State
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        if (!formData.name || !formData.email || !formData.password || !formData.organizationName) {
          setFormError('All fields are required for registration.');
          setSubmitting(false);
          return;
        }
        const res = await signup(formData.name, formData.email, formData.password, formData.organizationName);
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

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-xl shadow-lg shadow-primary/20">
            VE
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">
            {isSignup ? 'Create an Account' : 'Welcome to VisitExpo'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isSignup ? 'Initialize your organizer profile & tenant portal' : 'Access your Event Organizer SaaS Dashboard'}
          </p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

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
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type="text"
                    name="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="E.g. Expo Masters Ltd"
                  />
                </div>
              </div>
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
                placeholder="organizer@visitexpo.in"
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
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 text-sm transition-all shadow-lg shadow-primary/10 mt-6"
          >
            {submitting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                {isSignup ? 'Register Portal' : 'Login'} <ArrowRight className="h-4 w-4" />
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
            className="text-xs text-zinc-400 hover:text-primary transition-colors font-medium block mx-auto"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need an organizer account? Register here'}
          </button>

          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
            <a
              href="/onboarding/organizer"
              className="text-xs font-semibold text-amber-400 hover:underline flex items-center justify-center gap-1"
            >
              ⚡ Complete Organizer Onboarding & WP Claim &rarr;
            </a>
            <a
              href="/onboarding/exhibitor"
              className="text-xs font-semibold text-pink-400 hover:underline flex items-center justify-center gap-1"
            >
              🏢 Register as Event Exhibitor &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
