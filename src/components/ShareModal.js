'use client';

/**
 * @file ShareModal.js
 * @description Universal branded Social Share Modal for VisitExpo.
 * Allows users to share events, categories, expos, and organizers across
 * WhatsApp, LinkedIn, X (Twitter), Facebook, Telegram, Email, and 1-click Copy Link.
 * Includes native Web Share API integration when available.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  ExternalLink,
  Calendar,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && Boolean(navigator.share)) {
      setHasNativeShare(true);
    }
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const title = data.title || 'Check this out on VisitExpo';
  const rawUrl = data.url || (typeof window !== 'undefined' ? window.location.href : 'https://visitexpo.in');
  // Ensure absolute URL
  const shareUrl = rawUrl.startsWith('http')
    ? rawUrl
    : typeof window !== 'undefined'
    ? `${window.location.origin}${rawUrl}`
    : `https://visitexpo.in${rawUrl}`;

  const shareText =
    data.text ||
    `Explore ${title} on VisitExpo — The Global Expo & Trade Show Discovery Platform:`;

  const copyToClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (_) {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share canceled or failed:', err);
        }
      }
    }
  };

  const sharePlatforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      subtitle: 'Chat & Groups',
      bgClass: 'bg-[#25D366] hover:bg-[#1EBE5D] text-white',
      borderClass: 'border-[#25D366]/30',
      badgeClass: 'bg-[#25D366]/10 text-[#25D366]',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.12.82.83-3.04-.19-.3a8.2 8.2 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
        </svg>
      )
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      subtitle: 'Feed & Network',
      bgClass: 'bg-[#0A66C2] hover:bg-[#084e96] text-white',
      borderClass: 'border-[#0A66C2]/30',
      badgeClass: 'bg-[#0A66C2]/10 text-[#0A66C2]',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.66-.74 1.66-1.66 0-.91-.74-1.66-1.66-1.66-.92 0-1.66.75-1.66 1.66 0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
        </svg>
      )
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      subtitle: 'Post to Feed',
      bgClass: 'bg-black hover:bg-zinc-800 text-white',
      borderClass: 'border-zinc-800',
      badgeClass: 'bg-zinc-100 text-zinc-900',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      id: 'facebook',
      name: 'Facebook',
      subtitle: 'News Feed',
      bgClass: 'bg-[#1877F2] hover:bg-[#1464c9] text-white',
      borderClass: 'border-[#1877F2]/30',
      badgeClass: 'bg-[#1877F2]/10 text-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5C10 6.46 11.82 5 14.5 5c1.28 0 2.62.23 2.62.23v2.88h-1.48c-1.5 0-1.97.93-1.97 1.89V12h3.25l-.52 3h-2.73v6.8c4.56-.93 8-4.96 8-9.8z" />
        </svg>
      )
    },
    {
      id: 'telegram',
      name: 'Telegram',
      subtitle: 'Channel & DM',
      bgClass: 'bg-[#24A1DE] hover:bg-[#1f8ec4] text-white',
      borderClass: 'border-[#24A1DE]/30',
      badgeClass: 'bg-[#24A1DE]/10 text-[#24A1DE]',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      )
    },
    {
      id: 'email',
      name: 'Email',
      subtitle: 'Send Direct',
      bgClass: 'bg-[#6366F1] hover:bg-[#4f46e5] text-white',
      borderClass: 'border-[#6366F1]/30',
      badgeClass: 'bg-[#6366F1]/10 text-[#6366F1]',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
      icon: <Mail className="w-5 h-5" />
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with VisitExpo Ruby Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FFCC00] via-[#FF2E63] to-[#FFCC00]" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top Bar: Title & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-200 text-[#FF2E63] flex items-center justify-center shrink-0">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 leading-tight">
                  Share with Your Network
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Select a platform below to invite colleagues & attendees
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close share dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Event Preview Snippet */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-start gap-3">
            {data.image ? (
              <img
                src={data.image}
                alt={title}
                className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#FFCC00]/20 text-[#FF2E63] flex items-center justify-center font-extrabold text-sm border border-amber-200 shrink-0">
                VE
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-zinc-900 truncate leading-snug">
                {title}
              </h4>
              {(data.dates || data.city) && (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-500 font-medium">
                  {data.dates && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      <span>{data.dates}</span>
                    </span>
                  )}
                  {data.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      <span>{data.city}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Social Platform Grid */}
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Share Platform Options
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {sharePlatforms.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 hover:shadow-xs transition-all duration-150 cursor-pointer text-center"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-150 group-hover:scale-105 ${platform.bgClass}`}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-xs font-bold text-zinc-900 mt-2 leading-tight">
                    {platform.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate max-w-[85px]">
                    {platform.subtitle}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* 1-Click Copy Link */}
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Or Copy Page Link
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => e.target.select()}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white border border-emerald-600'
                    : 'bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 border border-amber-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Native Device Share */}
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-[#FF2E63]" />
              <span>More Options on Your Device...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
