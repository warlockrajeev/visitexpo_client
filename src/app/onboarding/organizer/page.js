'use client';

/**
 * @file onboarding/organizer/page.js
 * @description Automatic redirect handler to unify registration into /login.
 *  - Logged in organizers are routed directly to in-dashboard Event Claim (/events/claim)
 *  - New organizers are routed directly to the unified registration portal (/login?role=organizer&signup=true)
 */

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { Loader2 } from 'lucide-react';

function OrganizerOnboardingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Already logged in: go directly to event claim in dashboard
      router.replace('/events/claim');
    } else {
      // Not logged in: route to the unified registration form
      const claimSlug = searchParams.get('claim_slug') || searchParams.get('wp_slug');
      if (claimSlug) {
        router.replace(`/login?role=organizer&signup=true&claim_slug=${encodeURIComponent(claimSlug)}`);
      } else {
        router.replace('/login?role=organizer&signup=true');
      }
    }
  }, [user, loading, router, searchParams]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-300 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-xs font-semibold tracking-wide">
        Redirecting to unified registration portal...
      </span>
    </div>
  );
}

export default function OrganizerOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrganizerOnboardingRedirect />
    </Suspense>
  );
}
