'use client';

/**
 * @file GatedAuthModal.js
 * @description 10times.com-style in-page Authentication Overlay (Screen C).
 * Triggered whenever an unregistered/guest user attempts a gated action
 * (e.g. Getting a Free Ticket, Saving an Event, Contacting Organizer, or Viewing Full Exhibitor Directory).
 * Retains context and executes the deferred action upon successful login.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Lock,
  Mail,
  Key,
  User,
  Ticket,
  Bookmark,
  MessageCircle,
  Building,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase.js';

export default function GatedAuthModal({ isOpen, onClose, context, onSuccess }) {
  const { login, signup, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const eventTitle = context?.event?.title || 'this Exhibition';
  const actionType = context?.action || 'ticket';

  // Context-specific messaging based on 10times flow
  const getContextHeadline = () => {
    switch (actionType) {
      case 'ticket':
        return {
          icon: <Ticket className="h-5 w-5 text-[#FF2E63]" />,
          badge: 'Free Visitor Pass Registration',
          title: `Sign in to Claim Your Free Pass`,
          desc: `Complete your free visitor registration for "${eventTitle}" to receive your digital QR pass instantly.`
        };
      case 'save':
        return {
          icon: <Bookmark className="h-5 w-5 text-amber-500" />,
          badge: 'Personalized Watchlist',
          title: `Save Event to Your Dashboard`,
          desc: `Sign in to bookmark "${eventTitle}" and receive schedule reminders and booth updates.`
        };
      case 'contact':
        return {
          icon: <MessageCircle className="h-5 w-5 text-emerald-500" />,
          badge: 'Direct Organizer Contact',
          title: `Contact Event Organizers`,
          desc: `Sign in to send direct inquiries and request booth pricing for "${eventTitle}".`
        };
      case 'exhibitors':
        return {
          icon: <Building className="h-5 w-5 text-blue-500" />,
          badge: 'Exclusive B2B Directory',
          title: `Unlock Full Exhibitor Directory`,
          desc: `Sign in to explore all verified exhibitors, booth locations, and product catalogs for "${eventTitle}".`
        };
      default:
        return {
          icon: <Lock className="h-5 w-5 text-[#FF2E63]" />,
          badge: 'VisitExpo Member Access',
          title: `Sign In or Join VisitExpo`,
          desc: `Create a free account or sign in to continue with ${eventTitle}.`
        };
    }
  };

  const info = getContextHeadline();

  // 1-Click Google Authentication
  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const idToken = await fbUser.getIdToken();

      const payload = {
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        photoURL: fbUser.photoURL,
        uid: fbUser.uid,
        idToken,
        role: 'visitor'
      };

      const res = await loginWithGoogle(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Google login failed.');
      }
    } catch (err) {
      console.error('Google auth error in GatedModal:', err);
      setError(err.message || 'Google authentication encountered an issue.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email / Password Authentication
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          if (onSuccess) onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Invalid email or password.');
        }
      } else {
        if (!name.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        const res = await signup(name, email, password, '', 'visitor');
        if (res.success) {
          if (onSuccess) onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FFCC00] via-[#FF2E63] to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Context Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700">
              {info.icon}
              <span>{info.badge}</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
              {info.title}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {info.desc}
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* 1-Click Google Sign-In */}
          <div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-800 shadow-xs transition-all hover:border-zinc-400 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
              or with email
            </span>
            <div className="border-t border-zinc-200 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center pt-1 text-xs text-zinc-500">
            {mode === 'login' ? (
              <span>
                Don't have a VisitExpo pass yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#FF2E63] hover:underline cursor-pointer"
                >
                  Join Free
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#FF2E63] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>

          {/* Trust Footnote */}
          <div className="pt-2 border-t border-zinc-150 flex items-center justify-center gap-4 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> 100% Free Pass
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#FFCC00]" /> Verified Expos
            </span>
            <span>•</span>
            <span>Privacy Protected</span>
          </div>

        </div>
      </div>
    </div>
  );
}
