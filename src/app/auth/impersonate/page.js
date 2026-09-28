'use client';

/**
 * @file page.js
 * @description Impersonation exchange receiver page.
 * Validates the one-time token issued by Super Admin, sets auth session,
 * and securely redirects the browser to the user's dashboard.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

function ImpersonateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { updateUser, setIsExhibitorView } = useAuth();
  const [status, setStatus] = useState('authenticating'); // 'authenticating', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No impersonation token provided in redirect URL.');
      return;
    }

    let isMounted = true;

    const performExchange = async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/impersonate-exchange`, { token });
        if (!isMounted) return;

        if (res.data && res.data.success) {
          const user = res.data.user;
          setUserName(user.name);
          setUserRole(user.role);
          setStatus('success');

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('visitexpo_user', JSON.stringify(user));
              if (res.data.refreshToken) {
                localStorage.setItem('visitexpo_refresh_token', res.data.refreshToken);
              }
              if (user.role === 'exhibitor') {
                localStorage.setItem('visitexpo_view_mode', 'exhibitor');
                if (setIsExhibitorView) setIsExhibitorView(true);
              } else if (user.role === 'organizer') {
                localStorage.setItem('visitexpo_view_mode', 'organizer');
                if (setIsExhibitorView) setIsExhibitorView(false);
              }
            } catch (storageErr) {
              console.warn('Storage write error:', storageErr);
            }
          }

          if (updateUser) {
            updateUser(user);
          }

          // Smooth short transition before directing to main dashboard
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        } else {
          setStatus('error');
          setErrorMsg(res.data?.error || 'Authentication exchange failed.');
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Invalid or expired impersonation token. Please request a new login link from Admin.');
      }
    };

    performExchange();

    return () => {
      isMounted = false;
    };
  }, [token, router, updateUser, setIsExhibitorView]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl text-center space-y-6">
        {status === 'authenticating' && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Authenticating Session
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verifying impersonation credentials and establishing secure session tokens...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
              <CheckCircle2 className="h-10 w-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Logged In as {userRole}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Welcome, {userName || 'User'}!
              </h2>
              <p className="text-xs text-muted-foreground">
                Session established successfully. Redirecting to your dashboard...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-inner">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Session Transfer Failed
              </h2>
              <p className="text-xs text-destructive font-medium px-4">{errorMsg}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => (window.location.href = '/login')}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer active:scale-95 shadow-md"
              >
                Go to Standard Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ImpersonateContent />
    </Suspense>
  );
}
