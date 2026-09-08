'use client';

/**
 * @file Navbar.js
 * @description Fixed, responsive navigation bar for VisitExpo landing page and public views.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

export const Logo = ({ className = "w-9 h-9" }) => (
  <img
    src="/logo.png"
    alt="VisitExpo Logo"
    className={`${className} object-contain`}
  />
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-4 border-b-0'
      }`}
      style={!scrolled && !mobileMenuOpen ? { borderBottom: 'none' } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Logo className="h-12 w-12 sm:h-14 sm:w-14 transition-transform duration-200 group-hover:scale-105 drop-shadow-md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-200">
          <a href="#events" className="hover:text-white transition-colors">
            Explore Events
          </a>
          <Link href="/login?role=organizer&signup=true" className="hover:text-white transition-colors">
            For Organizers
          </Link>
          <Link href="/login?role=exhibitor&signup=true" className="hover:text-white transition-colors">
            For Exhibitors
          </Link>
          <a href="#claim" className="hover:text-white transition-colors">
            Claim Listing
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login?signup=true"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2 text-xs transition-colors shadow-xs"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Actions & Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-300 hover:text-white px-2.5 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-6 py-5 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-zinc-200">
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Explore Events
            </a>
            <Link
              href="/login?role=organizer&signup=true"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              For Organizers
            </Link>
            <Link
              href="/login?role=exhibitor&signup=true"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              For Exhibitors
            </Link>
            <a
              href="#claim"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Claim Listing
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Contact
            </a>
          </nav>
          <div className="pt-3 border-t border-zinc-800">
            <Link
              href="/login?signup=true"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2.5 text-xs transition-colors shadow-xs w-full text-center"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
