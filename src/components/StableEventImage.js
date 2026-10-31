'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f8d84e"/><stop offset="1" stop-color="#f97362"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="400" cy="190" r="72" fill="#171717" fill-opacity=".12"/><path d="M330 225h140l-42-55-34 40-22-25z" fill="#fff" fill-opacity=".9"/><circle cx="380" cy="178" r="11" fill="#fff" fill-opacity=".9"/><text x="400" y="320" fill="#fff" font-family="Arial,sans-serif" font-size="30" font-weight="700" text-anchor="middle">VISITEXPO</text></svg>'
)}`;

export default function StableEventImage({ src, alt, className = '', loading = 'lazy' }) {
  const primarySrc = typeof src === 'string' && src.trim() ? src.trim() : FALLBACK_IMAGE;
  const [imageState, setImageState] = useState(null);
  const isStateForCurrentSource = imageState?.source === primarySrc;
  const displayedSrc = isStateForCurrentSource
    ? imageState.displaySrc
    : primarySrc;
  const failed = isStateForCurrentSource && imageState.failed;

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} image unavailable`}
        className={`${className} bg-gradient-to-br from-amber-300 via-orange-300 to-rose-400`}
      />
    );
  }

  return (
    <Image
      src={displayedSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      unoptimized
      className={className}
      onError={() => {
        if (displayedSrc === FALLBACK_IMAGE) {
          setImageState({ source: primarySrc, displaySrc: FALLBACK_IMAGE, failed: true });
          return;
        }
        setImageState({ source: primarySrc, displaySrc: FALLBACK_IMAGE, failed: false });
      }}
    />
  );
}
