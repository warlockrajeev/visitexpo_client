'use client';

/**
 * @file Navbar.js
 * @description Fixed, responsive navigation bar for VisitExpo landing page and public views.
 * When a user is logged in:
 *  - Displays user profile pill and avatar in the navbar
 *  - Dropdown contains user identity details, role badge, quick links, and a prominent "My Dashboard" button
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';
import {
  ArrowRight,
  Menu,
  X,
  User,
  LayoutDashboard,
  Settings,
  Ticket,
  Calendar,
  LogOut,
  ChevronDown,
  Building,
  ShieldCheck
} from 'lucide-react';

export const Logo = ({ className = "w-9 h-9" }) => (
  <img
    src="/logo.png"
    alt="VisitExpo Logo"
    className={`${className} object-contain`}
  />
);

export default function Navbar({ solid = false }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isSolid = solid || (pathname && pathname !== '/');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getRoleBadge = (role) => {
    if (role === 'visitor') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
          <Ticket className="h-3 w-3" /> Visitor Pass Holder
        </span>
      );
    }
    if (role === 'exhibitor') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
          <Building className="h-3 w-3" /> Exhibitor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
        <ShieldCheck className="h-3 w-3" /> Verified Organizer
      </span>
    );
  };

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen || isSolid
          ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-4 border-b-0'
      }`}
      style={!scrolled && !mobileMenuOpen && !isSolid ? { borderBottom: 'none' } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Logo className="h-12 w-12 sm:h-14 sm:w-14 transition-transform duration-200 group-hover:scale-105 drop-shadow-md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-200">
          <Link href="/events" className="hover:text-white transition-colors">
            Explore Events
          </Link>
          <Link
            href={user ? '/dashboard' : '/login?role=organizer&signup=true'}
            className="hover:text-white transition-colors"
          >
            For Organizers
          </Link>
          <Link
            href={user ? '/dashboard' : '/login?role=exhibitor&signup=true'}
            className="hover:text-white transition-colors"
          >
            For Exhibitors
          </Link>
          <a href="#claim" className="hover:text-white transition-colors">
            Claim Listing
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Logged In User Profile Pill & Dropdown */
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-850 hover:border-zinc-600 transition-all text-left cursor-pointer shadow-sm group"
                aria-label="User account menu"
                aria-expanded={profileDropdownOpen}
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FFCC00] to-amber-500 text-zinc-950 font-black text-xs shrink-0 ring-2 ring-primary/20">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || 'User Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getUserInitial()}</span>
                  )}
                </div>

                {/* Name & Role */}
                <div className="hidden md:block leading-tight text-left">
                  <span className="block text-xs font-bold text-zinc-100 max-w-[130px] truncate group-hover:text-primary transition-colors">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <span className="block text-[10px] text-zinc-400 capitalize font-medium">
                    {user.role === 'visitor'
                      ? 'Visitor'
                      : user.role === 'exhibitor'
                      ? 'Exhibitor'
                      : 'Organizer'}
                  </span>
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-primary' : 'group-hover:text-zinc-200'
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl shadow-black/70 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  {/* User Profile Header Card */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FFCC00] to-amber-500 text-zinc-950 font-black text-sm shrink-0 ring-2 ring-primary/30">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name || 'User Avatar'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{getUserInitial()}</span>
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">
                        {user.name || 'Account'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      <div className="pt-0.5">{getRoleBadge(user.role)}</div>
                      {user.organization?.name && (
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 pt-0.5">
                          <Building className="h-3 w-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{user.organization.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Primary "My Dashboard" Button */}
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-zinc-950" />
                      <span>My Dashboard</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  {/* Role-tailored Quick Actions */}
                  <div className="space-y-0.5 pt-1 border-t border-zinc-800/80">
                    {user.role === 'visitor' ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Ticket className="h-4 w-4 text-primary" />
                          <span>My Passes &amp; Badges</span>
                        </Link>
                        <Link
                          href="/expos"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>Browse Live Expos</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/events/wizard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-amber-400" />
                          <span>Create New Event</span>
                        </Link>
                        <Link
                          href="/events/claim"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4 text-amber-400" />
                          <span>Claim Directory Expo</span>
                        </Link>
                      </>
                    )}

                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4 text-zinc-400" />
                      <span>My Profile &amp; Settings</span>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Visitor/User Actions */
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-5 py-2 text-xs transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer"
            >
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Actions & Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-[#FFCC00] text-zinc-950 font-bold px-3 py-1 text-xs shadow-xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-3.5 py-1.5 text-xs transition-colors shadow-xs"
            >
              Login
            </Link>
          )}

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
          {/* User Profile Card for Mobile */}
          {user && (
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FFCC00] to-amber-500 text-zinc-950 font-black text-sm shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || 'User Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getUserInitial()}</span>
                  )}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">
                    {user.name || 'Account'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* My Dashboard button in mobile view */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2.5 text-xs transition-colors shadow-xs w-full text-center"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to My Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-zinc-200">
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Explore Events
            </Link>
            <Link
              href={user ? '/dashboard' : '/login?role=organizer&signup=true'}
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              For Organizers
            </Link>
            <Link
              href={user ? '/dashboard' : '/login?role=exhibitor&signup=true'}
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

          {/* Mobile Footer Actions */}
          <div className="pt-3 border-t border-zinc-800">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white font-semibold py-2 text-xs w-full text-center"
                >
                  <Settings className="h-4 w-4 text-zinc-400" />
                  <span>My Profile &amp; Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 font-semibold py-2 text-xs w-full text-center cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2.5 text-xs transition-colors shadow-xs w-full text-center"
              >
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
