'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExhibitorDiscoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/campaigns/exhibitor-discovery');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground text-sm">
      Redirecting to Exhibitor Discovery...
    </div>
  );
}
