'use client';

/**
 * @file layout.js
 * @description Dashboard sidebar navigation layout for Organizer Dashboard.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Loader2 } from 'lucide-react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Target,
  Mail,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Building,
  Wand2,
  ShieldCheck
} from 'lucide-react';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicEvents, setDynamicEvents] = useState([]);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout, isExhibitorView, setIsExhibitorView, hasExhibitorProfile } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Strict role-based route protection: prevent visitors and exhibitors from accessing organizer features
  useEffect(() => {
    if (!loading && user) {
      const organizerRoutes = ['/events', '/exhibitors', '/visitors', '/leads', '/campaigns', '/tickets'];
      const isOrganizerRoute = organizerRoutes.some(route => pathname.startsWith(route));

      if (user.role === 'visitor' && isOrganizerRoute) {
        router.replace('/dashboard');
      } else if (user.role === 'exhibitor' && !isExhibitorView && isOrganizerRoute) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router, isExhibitorView]);

  // Dynamically fetch live directory events from backend API for organizer sidebar only
  useEffect(() => {
    const fetchDynamicSidebarEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/wordpress/claimable-events?limit=5`);
        if (res.data && res.data.success && res.data.data.docs) {
          setDynamicEvents(res.data.data.docs.slice(0, 5));
        }
      } catch (err) {
        console.warn('Could not fetch dynamic sidebar events from backend API.');
      }
    };

    if (user && user.isVerified && user.role !== 'visitor' && user.role !== 'exhibitor' && !isExhibitorView) {
      fetchDynamicSidebarEvents();
    }
  }, [user, isExhibitorView]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Lock dashboard if organizer account is pending Super Admin verification
  if (user.role === 'organizer' && !user.isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto ring-8 ring-amber-500/20">
            <ShieldCheck className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Account Pending Super Admin Approval
            </span>
            <h2 className="text-2xl font-extrabold text-foreground">
              Welcome, {user.name}!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your organizer account registration request is currently under review by our Super Admin moderation team. Dashboard access will be unlocked automatically once approved.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border hover:bg-secondary/80 px-6 py-2.5 text-xs font-bold text-foreground transition-all"
            >
              Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lock dashboard if exhibitor account is pending Organizer verification
  if (user.role === 'exhibitor' && !user.isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto ring-8 ring-amber-500/20">
            <ShieldCheck className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Booth Pending Organizer Approval
            </span>
            <h2 className="text-2xl font-extrabold text-foreground">
              Welcome, {user.name}!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your exhibitor registration and booth allocation request is currently pending review. Access will be unlocked automatically once approved by the event organizers.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border hover:bg-secondary/80 px-6 py-2.5 text-xs font-bold text-foreground transition-all"
            >
              Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigation = user.role === 'visitor'
    ? [
        { name: 'My Passes & Badges', href: '/dashboard', icon: Ticket },
        { name: 'Browse Live Expos', href: '/expos', icon: Calendar },
        { name: 'My Profile & Settings', href: '/settings', icon: Settings },
      ]
    : (user.role === 'exhibitor' || isExhibitorView)
    ? [
        { name: 'Exhibitor Hub', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard Hub', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Event Wizard', href: '/events/wizard', icon: Wand2, badge: 'Onboarding' },
        { name: 'Claim Event', href: '/events/claim', icon: ShieldCheck },
        { name: 'Manage Events', href: '/manage-events', icon: Calendar },
        { name: 'Exhibitors', href: '/exhibitors', icon: Building },
        { name: 'Visitor CRM', href: '/visitors', icon: Users },
        { name: 'Lead CRM', href: '/leads', icon: Target },
        { name: 'Campaigns', href: '/campaigns', icon: Mail },
        { name: 'Ticketing', href: '/tickets', icon: Ticket },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];

  const getPageTitle = (path) => {
    if (!path || path === '/dashboard') {
      if (user?.role === 'visitor') return 'Visitor Pass & Expo Hub';
      if (user?.role === 'exhibitor' || isExhibitorView) return 'Exhibitor Hub';
      return 'Organizer Dashboard Hub';
    }
    if (path === '/expos') return 'Live Exhibitions & Passes';
    if (path === '/events/wizard') return 'Event Onboarding Wizard';
    if (path === '/events/claim') return 'Claim Existing Event';
    if (path === '/manage-events') return 'Event Management';
    const clean = (path || '').replace('/', '').replace(/-/g, ' ');
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Dashboard';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Back-drop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="VisitExpo Logo"
              className="h-9 w-9 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Visit<span className="text-primary">Expo</span>
            </span>
          </Link>
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Dynamic Backend Synced WP Events Subsection */}
          {dynamicEvents.length > 0 && user.role !== 'exhibitor' && !isExhibitorView && (
            <div className="pt-4 mt-2 border-t border-border/60">
              <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>Live Synced Events</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </span>
              <div className="space-y-1">
                {dynamicEvents.map((evt) => (
                  <Link
                    key={evt._id || evt.id}
                    href="/events/claim"
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-secondary/60 transition-colors truncate"
                  >
                    <span className="truncate max-w-[140px]">{evt.title}</span>
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      DIR
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Area with Theme Toggle & User Info */}
        <div className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground mb-3 transition-colors"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold uppercase text-xs">
              {user?.name?.slice(0, 2) || 'OR'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground">{user?.name || 'User'}</p>
              <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                {user?.role === 'visitor' ? (
                  <>
                    <Ticket className="h-3 w-3 text-primary" /> Visitor / Attendee
                  </>
                ) : user?.role === 'exhibitor' ? (
                  <>
                    <Building className="h-3 w-3 text-amber-500" /> Exhibitor
                  </>
                ) : (
                  <>
                    <Building className="h-3 w-3 text-primary" /> {user?.role || 'Organizer'}
                  </>
                )}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'visitor' ? (
              <Link
                href="/expos"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                <Ticket className="h-3.5 w-3.5" /> Browse Live Expos
              </Link>
            ) : (
              <>
                {hasExhibitorProfile && (
                  <button
                    onClick={() => setIsExhibitorView(!isExhibitorView)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                      isExhibitorView
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {isExhibitorView ? (
                      <>
                        <Building className="h-3.5 w-3.5" /> Switch to Organizer View
                      </>
                    ) : (
                      <>
                        <LayoutDashboard className="h-3.5 w-3.5" /> Switch to Exhibitor View
                      </>
                    )}
                  </button>
                )}
                {user.role !== 'exhibitor' && !isExhibitorView && (
                  <Link
                    href="/events/wizard"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Start Onboarding
                  </Link>
                )}
              </>
            )}
          </div>
        </header>

        {/* Scrollable Panel Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
