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
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Building,
  Wand2,
  ShieldCheck,
  Compass,
  Globe,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bookmark,
  Star,
  Bell,
  Zap,
  MapPin
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { isCorporateEmail } from '../../utils/emailValidator.js';

import { initSweetAlertInterceptors } from '../../utils/sweetalert.js';
import OrganizerSupportWidget from '../../components/OrganizerSupportWidget.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout, updateUser, isExhibitorView, setIsExhibitorView, toggleDashboardView, hasExhibitorProfile } = useAuth();

  useEffect(() => {
    initSweetAlertInterceptors();
  }, []);

  const handleToggleView = () => {
    if (typeof toggleDashboardView === 'function') {
      toggleDashboardView();
    } else {
      setIsExhibitorView(!isExhibitorView);
    }
    router.push('/dashboard');
  };

  useEffect(() => {
    if (!loading && !user) {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_user') : null;
      if (!storedUser) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Auto-sync organizer active plan from backend
  useEffect(() => {
    if (!user || user.role !== 'organizer') return;
    let isMounted = true;
    const syncOrganizerPlan = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_token') : null;
        if (!token) return;
        const res = await axios.get(`${API_URL}/plans/my-plan`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted && res.data?.success && res.data.plan) {
          const freshPlan = res.data.plan;
          const freshActive = res.data.isPlanActive ?? true;
          if (freshPlan !== user.plan || (freshActive && !user.isPlanActive)) {
            if (updateUser) {
              updateUser({
                ...user,
                plan: freshPlan,
                isPlanActive: freshActive
              });
            }
          }
        }
      } catch (e) {
        // quiet fallback
      }
    };
    syncOrganizerPlan();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?._id]);

  // Strict role-based route protection: prevent visitors and exhibitors in exhibitor view from accessing organizer features
  useEffect(() => {
    if (!loading && user) {
      const organizerRoutes = ['/events', '/exhibitors', '/visitors', '/leads', '/campaigns', '/tickets'];
      const isOrganizerRoute = organizerRoutes.some(route => pathname.startsWith(route));

      if (user.role === 'visitor' && isOrganizerRoute) {
        router.replace('/dashboard');
      } else if (isExhibitorView && isOrganizerRoute) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router, isExhibitorView]);

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

  // Handle Free Organizer Plan activation (₹0 corporate, ₹1,499 general)
  const handleActivateFreePlan = async () => {
    setActivatingPlan(true);
    try {
      const res = await axios.post(`${API_URL}/plans/activate-free-plan`, {
        transactionId: `TXN_DASH_${Date.now()}`
      });
      if (res.data?.success) {
        if (updateUser && res.data.user) {
          updateUser(res.data.user);
        }
        await Swal.fire({
          icon: 'success',
          title: 'Plan Activated Successfully!',
          text: res.data.message || 'Free Organizer Plan is now active. Welcome to your organizer dashboard!',
          confirmButtonColor: '#FFCC00',
          confirmButtonText: 'Enter Dashboard'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Activation Failed',
        text: err.response?.data?.message || 'Could not activate plan. Please try again or contact support.'
      });
    } finally {
      setActivatingPlan(false);
    }
  };

  // Lock dashboard if organizer account has not yet activated their plan
  if (user.role === 'organizer' && (!user.isVerified || !user.isPlanActive)) {
    const isCorporate = user?.emailType === 'corporate' || isCorporateEmail(user?.email);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto ring-8 ring-amber-500/20">
            <ShieldCheck className="h-10 w-10 text-amber-600" />
          </div>

          <div className="space-y-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
              isCorporate
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              {isCorporate ? 'Corporate Domain Detected' : 'Personal Email Registration'}
            </span>
            <h2 className="text-2xl font-extrabold text-foreground">
              {isCorporate ? 'Activate Free Organizer Plan' : 'Free Organizer Plan Activation'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isCorporate ? (
                <>
                  Your account is registered with corporate domain <span className="font-bold text-foreground">@{user.email?.split('@')[1]}</span>. You qualify for 100% Free Organizer Plan access (₹0). Click below to activate your dashboard immediately.
                </>
              ) : (
                <>
                  Your account is registered with personal email <span className="font-bold text-foreground">{user.email}</span>. Corporate business emails qualify for free registration, while personal emails require a one-time verification fee of <strong>₹1,499</strong> to unlock all organizer capabilities.
                </>
              )}
            </p>
          </div>

          {/* Pricing & Plan Details Box */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-left space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Free Organizer Plan</span>
                <span className="text-[11px] text-muted-foreground">Lifetime validity · No monthly fee</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-foreground">
                  {isCorporate ? '₹0' : '₹1,499'}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {isCorporate ? 'Corporate complimentary' : 'One-time verification fee'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Claim any number of expos (up to 3 claims per day)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Publish new, upcoming &amp; prospective B2B/B2C exhibitions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Token demand test: 1/10 nominal token request model</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Real-time buyer and exhibitor inquiry counts</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleActivateFreePlan}
              disabled={activatingPlan}
              className="w-full py-3.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {activatingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>Activating Your Plan...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 text-black" />
                  <span>
                    {isCorporate ? 'Activate Free Organizer Plan (₹0)' : 'Pay ₹1,499 & Unlock Organizer Dashboard'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-xs font-medium">
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors underline"
              >
                View Full Pricing Details
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
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
              Booth Pending Admin Approval
            </span>
            <h2 className="text-2xl font-extrabold text-foreground">
              Welcome, {user.name}!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your exhibitor registration and booth allocation request is currently pending review by the platform administrator. Access will be unlocked automatically once approved by the Admin team.
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
        { name: 'Saved Bookmarks', href: '/bookmarks', icon: Bookmark },
        { name: 'Interested Events', href: '/interested', icon: Star },
        { name: 'Followed Expos', href: '/following', icon: Bell },
        { name: 'Organizers & Expos', href: '/organizers', icon: Building, badge: 'Live Chat' },
        { name: 'Recommended For You', href: '/recommendations', icon: Compass, badge: 'AI Match' },
        { name: 'Browse Live Expos', href: '/expos', icon: Calendar },
        { name: 'My Profile & Settings', href: '/settings', icon: Settings },
      ]
    : (user.role === 'exhibitor' || isExhibitorView)
    ? [
        { name: 'Exhibitor Hub', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Saved Bookmarks', href: '/bookmarks', icon: Bookmark },
        { name: 'Interested Events', href: '/interested', icon: Star },
        { name: 'Followed Expos', href: '/following', icon: Bell },
        { name: 'Organizers & Expos', href: '/organizers', icon: Building, badge: 'Live Chat' },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard Hub', href: '/dashboard', icon: LayoutDashboard },
        {
          name: 'Live Chat',
          href: '/chat',
          icon: MessageSquare,
          badge: (user?.role === 'organizer' && (!user?.plan || user?.plan === 'free')) ? 'Upgrade' : (user?.isChatEnabled ? 'Live' : null)
        },
        { name: 'Saved Bookmarks', href: '/bookmarks', icon: Bookmark },
        { name: 'Interested Events', href: '/interested', icon: Star },
        { name: 'Followed Expos', href: '/following', icon: Bell },
        { name: 'Event Wizard', href: '/events/wizard', icon: Wand2, badge: 'Onboarding' },
        { name: 'Claim Event', href: '/events/claim', icon: ShieldCheck },
        { name: 'Manage Events', href: '/manage-events', icon: Calendar },
        { name: 'Location Feasibility', href: '/location-feasibility', icon: MapPin, badge: 'Market AI' },
        {
          name: 'Exhibitors',
          href: '/exhibitors',
          icon: Building,
          badge: (user?.role === 'organizer' && (!user?.plan || user?.plan === 'free')) ? 'Starter+' : (user?.plan === 'enterprise' ? 'Advance' : null)
        },
        { name: 'Visitor CRM', href: '/visitors', icon: Users },
        { name: 'Lead CRM', href: '/leads', icon: Target },
        { name: 'Marketing & Campaigns', href: '/campaigns', icon: Mail },
        { name: 'Exhibitor Discovery', href: '/campaigns/exhibitor-discovery', icon: Compass },
        { name: 'Ticketing', href: '/tickets', icon: Ticket },
        { name: 'Plans & Pricing', href: '/pricing', icon: CreditCard, badge: 'Upgrade' },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];

  const getPageTitle = (path) => {
    if (!path || path === '/dashboard') {
      if (user?.role === 'visitor') return 'Visitor Pass & Expo Hub';
      if (user?.role === 'exhibitor' || isExhibitorView) return 'Exhibitor Hub';
      return 'Organizer Dashboard Hub';
    }
    if (path === '/bookmarks') return 'My Saved Bookmarks';
    if (path === '/interested') return 'My Interested Exhibitions';
    if (path === '/following') return 'Followed Expos & Organizers';
    if (path === '/organizers') return 'Event Organizers & Exhibitions Directory';
    if (path === '/chat') return 'Live Chat Desk & Attendee Hub';
    if (path === '/expos') return 'Live Exhibitions & Passes';
    if (path === '/events/wizard') return 'Event Onboarding Wizard';
    if (path === '/events/claim') return 'Claim Existing Event';
    if (path === '/manage-events') return 'Event Management';
    if (path === '/location-feasibility') return 'Location Feasibility & Event Presence Intelligence';
    if (path === '/campaigns/exhibitor-discovery') return 'Exhibitor Discovery';
    if (path === '/campaigns') return 'Marketing & Campaigns';
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

        </nav>

        {/* Footer Area with Theme Toggle & User Info */}
        <div className="p-4 border-t border-border bg-muted/20">
          <Link
            href="/"
            className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground mb-2 transition-colors"
            title="Go back to VisitExpo landing page"
          >
            <span className="flex items-center gap-3">
              <Home className="h-4.5 w-4.5 text-primary" />
              Explore Events
            </span>
            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>

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
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-primary" /> Organizer
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-extrabold uppercase text-[9px] border border-amber-500/30">
                      {user?.plan || 'Free'}
                    </span>
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
            {/* Back to Landing Page Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-all shadow-2xs cursor-pointer btn-press active:scale-95"
              title="Return to VisitExpo Landing Page"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-primary" />
              <span>Explore Events</span>
            </Link>

            {/* Active Plan Pill for Organizer */}
            {user?.role === 'organizer' && !isExhibitorView && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-500 transition-all shadow-2xs cursor-pointer btn-press active:scale-95"
                title="View active plan details and pricing"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="capitalize">{user?.plan ? `${user.plan} Plan` : 'Free Plan'}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </Link>
            )}

            {user?.role === 'visitor' ? (
              <Link
                href="/expos"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                <Ticket className="h-3.5 w-3.5" /> Browse Live Expos
              </Link>
            ) : user?.role === 'exhibitor' ? (
              <Link
                href="/expos"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground transition-all shadow-sm"
              >
                <Ticket className="h-3.5 w-3.5 text-primary" /> Browse Live Expos
              </Link>
            ) : (
              <>
                {user?.role === 'organizer' && hasExhibitorProfile && (
                  <button
                    onClick={handleToggleView}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer btn-press active:scale-95 ${
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
                {!isExhibitorView && (
                  <Link
                    href="/events/wizard"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer btn-press active:scale-95"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Start Onboarding
                  </Link>
                )}
              </>
            )}
          </div>
        </header>

        {/* Scrollable Panel Area */}
        <main className={`flex-1 min-h-0 ${pathname === '/chat' ? 'flex flex-col overflow-hidden p-0 bg-background' : 'overflow-y-auto p-6 bg-muted/10'}`}>
          {children}
        </main>
      </div>
      {user?.role === 'organizer' && !isExhibitorView && pathname !== '/chat' && <OrganizerSupportWidget />}
    </div>
  );
}
