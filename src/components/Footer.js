'use client';

/**
 * @file Footer.js
 * @description Minimal, simple, and professional Footer for VisitExpo.
 * Clean monochrome styling without loud or excessive colors.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Logo } from './Navbar.js';

const LinkedInIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const TwitterIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

const YouTubeIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 text-xs border-t border-zinc-800/80">
      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="text-sm font-bold text-zinc-100 tracking-tight">VisitExpo</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Global exhibition discovery and event management platform connecting trade buyers, organizers, and exhibitors worldwide.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-1 max-w-sm">
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
                <input
                  type="email"
                  required
                  placeholder="Get expo updates (enter email)..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shrink-0 transition-colors cursor-pointer"
                >
                  {subscribed ? <Check className="h-3.5 w-3.5 text-zinc-950" /> : 'Subscribe'}
                </button>
              </form>
              {subscribed && (
                <p className="text-[11px] text-zinc-400 mt-1">Thank you for subscribing.</p>
              )}
            </div>

            <div className="pt-1 text-[11px] text-zinc-500 space-y-0.5">
              <p>Email: support@visitexpo.in</p>
              <p>Helpline: +91 93236 77688 (Mon–Fri, 9am–6pm IST)</p>
            </div>
          </div>

          {/* Company & Support */}
          <div className="lg:col-span-4 space-y-3 md:pl-6">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Company &amp; Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-zinc-200 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-200 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-200 transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-zinc-200 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Minimal Bottom Bar */}
      <div className="border-t border-zinc-900 py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} VisitExpo Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refunds</Link>
            <span>·</span>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>

          {/* Official Social Links */}
          <div className="flex items-center gap-3.5 text-zinc-500">
            <a
              href="https://www.facebook.com/visitexpo.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/visitexpo_in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
              aria-label="X (Twitter)"
            >
              <TwitterIcon className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.instagram.com/visitexpo.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.youtube.com/@visitexpo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
              aria-label="YouTube"
            >
              <YouTubeIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/visitexpo/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
