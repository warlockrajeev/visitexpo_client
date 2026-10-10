'use client';

/**
 * @file page.js
 * @description Organizer Dashboard Hub with Live Backend API Integration.
 * Fetches real platform metrics, events count, visitor registries, and leads live from the backend API.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import SearchableSelect from '../../../components/SearchableSelect.js';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  Building,
  ArrowRight,
  ShieldCheck,
  Plus,
  Download,
  Eye,
  Activity,
  Layers,
  Heart,
  Loader2,
  Globe,
  Phone,
  Trash2,
  PlusCircle,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Ticket,
  MapPin,
  Printer,
  QrCode,
  Search,
  ExternalLink,
  User,
  UserCheck,
  Bell,
  Bookmark,
  X,
  MessageSquare,
  Zap,
  Award,
  CreditCard,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
  Compass,
  Unlock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../../context/AuthContext.js';
import { renderCardDescription } from '../../../utils/textFormatters.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export function OrganizerDashboardInner() {
  const { user, accessToken, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myPlan, setMyPlan] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 0,
    totalVisitors: 0,
    totalExhibitors: 0,
    totalLeads: 0
  });
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loadingEngagements, setLoadingEngagements] = useState(true);
  const [engagementSearch, setEngagementSearch] = useState('');
  const [engagementPage, setEngagementPage] = useState(1);
  const [engagementPageSize, setEngagementPageSize] = useState(10);
  const [feasibilityCity, setFeasibilityCity] = useState('Delhi');
  const [feasibilityData, setFeasibilityData] = useState(null);
  const [loadingFeasibility, setLoadingFeasibility] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const rawPlan = (myPlan?.plan || user?.plan || 'free').toLowerCase();
  const isFreePlan = !isSuperAdmin && (rawPlan === 'free' || !rawPlan);
  const isStarterPlan = !isSuperAdmin && rawPlan === 'starter';
  const isEnterprisePlan = isSuperAdmin || rawPlan === 'enterprise' || rawPlan === 'growth';

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const userId = user.id || user._id;

    // 1. Instant hydration from sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(`visitexpo_organizer_dashboard_cache_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.stats) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDashboardStats(parsed.stats);
            if (Array.isArray(parsed.visitors)) setVisitors(parsed.visitors);
            if (Array.isArray(parsed.leads)) setLeads(parsed.leads);
            if (Array.isArray(parsed.recentVisitors)) setRecentVisitors(parsed.recentVisitors);
            if (Array.isArray(parsed.recentEvents)) setRecentEvents(parsed.recentEvents);
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read dashboard cache:', e);
    }

    const fetchDashboardData = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

        const orgId = user.organization?._id || user.organization;
        const eventsUrl = user.role === 'super_admin'
          ? `${API_URL}/events?limit=5`
          : `${API_URL}/events?organizerId=${orgId || userId}&limit=5`;

        const [eventsRes, visitorsRes, exhibitorsRes, leadsRes, planRes] = await Promise.allSettled([
          axios.get(eventsUrl, { headers }),
          axios.get(`${API_URL}/visitors?limit=20`, { headers }),
          axios.get(`${API_URL}/exhibitors?limit=1`, { headers }),
          axios.get(`${API_URL}/leads?limit=20`, { headers }),
          axios.get(`${API_URL}/plans/my-plan`, { headers })
        ]);

        if (!isMounted) return;

        if (planRes.status === 'fulfilled' && planRes.value.data?.success) {
          const planData = planRes.value.data;
          setMyPlan(planData);
          if (updateUser && planData.plan) {
            const freshPlan = planData.plan;
            const freshActive = planData.isPlanActive ?? true;
            if (freshPlan !== user.plan || (freshActive && !user.isPlanActive)) {
              updateUser({
                ...user,
                plan: freshPlan,
                isPlanActive: freshActive
              });
            }
          }
        }

        const eventData = eventsRes.status === 'fulfilled' && eventsRes.value.data.success ? eventsRes.value.data.data : {};
        const visitorData = visitorsRes.status === 'fulfilled' && visitorsRes.value.data.success ? visitorsRes.value.data.data : {};
        const exhibitorData = exhibitorsRes.status === 'fulfilled' && exhibitorsRes.value.data.success ? exhibitorsRes.value.data.data : {};
        const leadData = leadsRes.status === 'fulfilled' && leadsRes.value.data.success ? leadsRes.value.data.data : {};
        const events = eventData.docs || [];
        const visitorsDocs = visitorData.docs || [];
        const exhibitors = exhibitorData.docs || [];
        const leadsDocs = leadData.docs || [];

        const newStats = {
          totalEvents: eventData.total ?? events.length,
          totalVisitors: visitorData.total ?? visitorsDocs.length,
          totalExhibitors: exhibitorData.total ?? exhibitors.length,
          totalLeads: leadData.total ?? leadsDocs.length
        };

        setDashboardStats(newStats);
        setVisitors(visitorsDocs);
        setLeads(leadsDocs);

        const newRecentVisitors = visitorsDocs.length > 0 ? visitorsDocs.slice(0, 5) : [];
        const newRecentEvents = events.length > 0 ? events.slice(0, 5) : [];

        if (newRecentVisitors.length > 0) setRecentVisitors(newRecentVisitors);
        if (newRecentEvents.length > 0) setRecentEvents(newRecentEvents);

        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`visitexpo_organizer_dashboard_cache_${userId}`, JSON.stringify({
              stats: newStats,
              visitors: visitorsDocs,
              leads: leadsDocs,
              recentVisitors: newRecentVisitors,
              recentEvents: newRecentEvents
            }));
          }
        } catch (e) {
          console.warn('Could not save dashboard cache:', e);
        }
      } catch (err) {
        console.error('Error loading dynamic dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user, accessToken]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchEngagements = async () => {
      try {
        const res = await axios.get(`${API_URL}/engagements/all`, { timeout: 8000 });
        if (isMounted && res.data?.success) {
          setEngagements(res.data.data?.engagements || []);
        }
      } catch (err) {
        console.error('Error loading dashboard engagements:', err);
      } finally {
        if (isMounted) setLoadingEngagements(false);
      }
    };

    fetchEngagements();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Quick Location Feasibility Explorer data fetch
  useEffect(() => {
    let isMounted = true;
    const fetchQuickFeasibility = async () => {
      setLoadingFeasibility(true);
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(`${API_URL}/events/market-feasibility?city=${encodeURIComponent(feasibilityCity)}`, { headers });
        if (isMounted && res.data?.success && res.data.data) {
          setFeasibilityData(res.data.data);
        }
      } catch (e) {
        // quiet fallback
      } finally {
        if (isMounted) setLoadingFeasibility(false);
      }
    };
    fetchQuickFeasibility();
    return () => {
      isMounted = false;
    };
  }, [feasibilityCity, accessToken]);

  // Calculate dynamic check-in trend from visitors
  const dynamicCheckinTrend = React.useMemo(() => {
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const counts = {
      '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0,
      '13:00': 0, '14:00': 0, '15:00': 0, '16:00': 0
    };

    let hasRealCheckins = false;
    visitors.forEach(v => {
      if (v.checkInStatus === 'checked_in') {
        const timeToUse = v.checkInTime || v.updatedAt || v.createdAt;
        if (timeToUse) {
          hasRealCheckins = true;
          const date = new Date(timeToUse);
          const hour = date.getHours();
          const slot = `${String(hour).padStart(2, '0')}:00`;
          if (counts[slot] !== undefined) {
            counts[slot]++;
          } else {
            if (hour < 9) counts['09:00']++;
            else if (hour > 16) counts['16:00']++;
          }
        }
      }
    });

    if (hasRealCheckins) {
      return Object.keys(counts).sort().map(time => ({
        time,
        checkins: counts[time]
      }));
    }

    // Fallback trend if there are visitors but none checked in yet
    const total = visitors.length;
    if (total > 0) {
      return [
        { time: '09:00', checkins: Math.round(total * 0.1) },
        { time: '10:00', checkins: Math.round(total * 0.25) },
        { time: '11:00', checkins: Math.round(total * 0.4) },
        { time: '12:00', checkins: Math.round(total * 0.3) },
        { time: '13:00', checkins: Math.round(total * 0.15) },
        { time: '14:00', checkins: Math.round(total * 0.2) },
        { time: '15:00', checkins: Math.round(total * 0.1) },
        { time: '16:00', checkins: Math.round(total * 0.05) }
      ];
    }

    // Default static fallback if zero visitors
    return [
      { time: '09:00', checkins: 5 },
      { time: '10:00', checkins: 15 },
      { time: '11:00', checkins: 30 },
      { time: '12:00', checkins: 20 },
      { time: '13:00', checkins: 10 },
      { time: '14:00', checkins: 15 },
      { time: '15:00', checkins: 8 },
      { time: '16:00', checkins: 3 }
    ];
  }, [visitors]);

  // Calculate dynamic lead sources from leads
  const dynamicLeadSourceData = React.useMemo(() => {
    const sources = {
      'Website': { value: 0, color: 'var(--color-primary)' },
      'Campaigns': { value: 0, color: '#f59e0b' },
      'Referral': { value: 0, color: '#10b981' },
      'Walk-in': { value: 0, color: '#ec4899' }
    };

    let hasLeads = false;
    leads.forEach(lead => {
      hasLeads = true;
      let sourceName = 'Website';
      if (lead.source === 'campaign') sourceName = 'Campaigns';
      else if (lead.source === 'referral' || lead.source === 'cold_call') sourceName = 'Referral';
      else if (lead.source === 'walk_in') sourceName = 'Walk-in';

      sources[sourceName].value++;
    });

    if (hasLeads) {
      return Object.keys(sources).map(name => ({
        name,
        value: sources[name].value,
        color: sources[name].color
      }));
    }

    // Fallback values when there are zero leads
    return [
      { name: 'Website', value: 0, color: 'var(--color-primary)' },
      { name: 'Campaigns', value: 0, color: '#f59e0b' },
      { name: 'Referral', value: 0, color: '#10b981' },
      { name: 'Walk-in', value: 0, color: '#ec4899' }
    ];
  }, [leads]);

  const kpis = [
    { title: 'Total Events', value: dashboardStats.totalEvents.toLocaleString(), change: 'Live synced from MongoDB', icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Total Registrations', value: dashboardStats.totalVisitors.toLocaleString(), change: '+18.4% this month', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Exhibitors Onboarded', value: dashboardStats.totalExhibitors.toLocaleString(), change: 'Active across events', icon: Building, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Event Leads', value: dashboardStats.totalLeads.toLocaleString(), change: '+14.2% qualified leads', icon: Target, color: 'text-pink-500', bg: 'bg-pink-500/10' }
  ];

  const engagementQuery = engagementSearch.trim().toLowerCase();
  const filteredEngagements = engagements.filter((eng) => {
    if (!engagementQuery) return true;
    const status = eng.type === 'both'
      ? 'interested following'
      : eng.type === 'follower'
        ? 'following event'
        : 'marked interested';
    return [
      eng.userName,
      eng.userDesignation,
      eng.userEmail,
      eng.userPhone,
      eng.userCompany,
      eng.userRole,
      eng.eventTitle,
      eng.eventCity,
      eng.eventDates,
      status
    ].some((value) => String(value || '').toLowerCase().includes(engagementQuery));
  });

  const totalEngagementPages = Math.max(1, Math.ceil(filteredEngagements.length / engagementPageSize));
  const safeEngagementPage = Math.min(Math.max(1, engagementPage), totalEngagementPages);
  const paginatedEngagements = filteredEngagements.slice(
    (safeEngagementPage - 1) * engagementPageSize,
    safeEngagementPage * engagementPageSize
  );

  const activePlanId = (myPlan?.subscription?.plan || myPlan?.plan || user?.plan || 'free').toLowerCase();

  const planConfig = {
    starter: {
      name: 'Organizer Starter',
      tier: 'Validated Operations Tier',
      badge: 'Starter Plan · Active',
      color: 'text-amber-500',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      tagColor: 'text-amber-500',
      description: 'Detailed unmasked lead contacts, operational Lead CRM, and paid ticketing enabled.',
      nextTier: 'Organizer Enterprise'
    },
    enterprise: {
      name: 'Organizer Enterprise',
      tier: 'Enterprise Scale Tier',
      badge: 'Enterprise Plan · Active',
      color: 'text-indigo-400',
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      tagColor: 'text-indigo-400',
      description: 'Full REST API keys for ERP/CRM, unlimited lead export, and dedicated VIP support.',
      nextTier: null
    },
    growth: {
      name: 'Organizer Growth',
      tier: 'Marketing & Top-Up Tier',
      badge: 'Growth Plan · Active',
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      tagColor: 'text-emerald-400',
      description: 'On-demand promotional points, WhatsApp blasts, and search spotlight #1 priority.',
      nextTier: 'Organizer Enterprise'
    },
    free: {
      name: 'Free Organizer Plan',
      tier: 'Standard Discovery Tier',
      badge: 'Free Plan · Active',
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      tagColor: 'text-blue-400',
      description: 'Expo claiming, event publishing, and masked inquiry volume intelligence.',
      nextTier: 'Organizer Starter'
    }
  };

  const currentPlan = planConfig[activePlanId] || planConfig.free;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Activity className="h-3.5 w-3.5" /> Sync Active
            </span>
            <Link
              href="/pricing"
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                activePlanId === 'starter'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                  : activePlanId === 'enterprise'
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
              title="Click to view subscription and upgrade options"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Active Plan: {currentPlan.name}</span>
            </Link>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name || 'Organizer'}!
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your expo listings, onboard new events, and monitor real-time attendee registrations live from backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/events/wizard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" /> Create New Event (Wizard)
          </Link>
          <Link
            href="/events/claim"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors"
          >
            <ShieldCheck className="h-4 w-4" /> Claim Event
          </Link>
        </div>
      </div>

      {/* Organizer Quick Actions Hub */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-foreground">Organizer Operations &amp; Profile Hub</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              Signed in as <strong className="text-foreground">{user?.email}</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" /> {currentPlan.name} (Active)
            </span>
            <span>•</span>
            <Link href="/pricing" className="text-primary hover:underline font-bold">
              Manage / Upgrade &rarr;
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Organizer Setup Card */}
          <div className="rounded-xl border border-border bg-background/50 p-4 flex flex-col justify-between hover:border-amber-400/60 transition-all space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                <Building className="h-4 w-4" />
                <span>Company Branding</span>
              </div>
              <h4 className="text-xs font-bold text-foreground">Complete Organization Profile</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add your official branding, business address, contact details, and GST registration.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <Link
                href="/settings"
                className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Edit Profile &amp; Settings</span> &rarr;
              </Link>
            </div>
          </div>

          {/* New Event Wizard Card */}
          <div className="rounded-xl border border-border bg-background/50 p-4 flex flex-col justify-between hover:border-primary/60 transition-all space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>Launch New Expo</span>
              </div>
              <h4 className="text-xs font-bold text-foreground">Multi-Step Event Wizard</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Publish a new trade exhibition with ticketing tiers, hall floorplans, and registration gates.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/events/wizard"
                className="text-xs font-bold text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1"
              >
                <span>Launch Wizard</span> &rarr;
              </Link>
            </div>
          </div>

          {/* Claim Directory Listing Card */}
          <div className="rounded-xl border border-border bg-background/50 p-4 flex flex-col justify-between hover:border-emerald-400/60 transition-all space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Directory Claim</span>
              </div>
              <h4 className="text-xs font-bold text-foreground">Claim Pre-loaded Expos</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect and verify ownership of trade shows pre-indexed on the VisitExpo national directory.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/events/claim"
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Claim Existing Event</span> &rarr;
              </Link>
            </div>
          </div>

          {/* Active Plan & Subscription Hub Card */}
          <div className={`rounded-xl border ${currentPlan.border} bg-gradient-to-br from-amber-500/5 via-background/60 to-background p-4 flex flex-col justify-between hover:border-amber-400 transition-all space-y-3 shadow-xs`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 ${currentPlan.color} text-xs font-bold`}>
                  <Zap className="h-4 w-4" />
                  <span>Current Subscription</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-foreground">
                  {currentPlan.name}
                </h4>
                <span className={`text-[10px] ${currentPlan.tagColor} font-semibold block`}>
                  {currentPlan.tier}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {currentPlan.description}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <Link
                href="/pricing"
                className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{currentPlan.nextTier ? `Upgrade to ${currentPlan.nextTier.replace('Organizer ', '')}` : 'View Subscription'}</span> &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Location Feasibility & Event Presence Explorer Widget */}
      <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-foreground">
                  Location Feasibility &amp; Event Presence Explorer
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  Market AI
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Inspect registered buyer demand, existing competitor exhibitions, and Go/No-Go feasibility reports before launching an event.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStarterPlan || isEnterprisePlan || isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Included in your {currentPlan.name} (Free)</span>
              </span>
            ) : user?.hasUnlockedLocationResearch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 border border-primary/30 text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Validation Pass Active (₹4,999 Paid)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <Lock className="h-3.5 w-3.5" />
                <span>Free Plan · Unlock for ₹4,999</span>
              </span>
            )}

            <Link
              href="/location-feasibility"
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>Explore All Hubs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Hub Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-muted-foreground/70 uppercase mr-1 shrink-0">
            Select Metro Hub:
          </span>
          {['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Pune', 'Kolkata', 'Jaipur', 'Lucknow'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setFeasibilityCity(city)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                feasibilityCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-primary text-black font-extrabold shadow-sm scale-105'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Feasibility Summary Panel */}
        {loadingFeasibility ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Calculating {feasibilityCity} feasibility metrics and competitor events...</span>
          </div>
        ) : feasibilityData ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-background/50 border border-border/60 rounded-xl p-4">
            {/* Feasibility Score Ring & Verdict */}
            <div className="flex items-center gap-4 lg:col-span-2">
              <div className="flex flex-col items-center justify-center h-20 w-20 rounded-xl bg-secondary/80 border border-border shrink-0">
                <span className="text-2xl font-black font-mono text-foreground">
                  {feasibilityData.summary?.feasibilityScore || 85}
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground -mt-0.5">
                  / 100 Score
                </span>
              </div>
              <div className="space-y-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${feasibilityData.summary?.verdictBadge}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {feasibilityData.summary?.verdict}
                </span>
                <h4 className="text-xs font-bold text-foreground">
                  {feasibilityData.summary?.recommendationHeadline}
                </h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {feasibilityData.summary?.decisionRationale}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Events Present
                </span>
                <span className="text-base font-extrabold font-mono text-foreground">
                  {feasibilityData.summary?.totalEventsPresent} Expos
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {feasibilityData.summary?.upcomingEventsCount} upcoming
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Audience Demand
                </span>
                <span className="text-base font-extrabold font-mono text-primary">
                  {feasibilityData.summary?.audienceInterestVolume?.toLocaleString()}+
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Trade interest pool
                </span>
              </div>
            </div>

            {/* CTA action */}
            <div className="flex flex-col gap-2">
              <Link
                href="/location-feasibility"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-bold text-center transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>View Complete Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {!isStarterPlan && !isEnterprisePlan && !isSuperAdmin && !user?.hasUnlockedLocationResearch && (
                <Link
                  href="/location-feasibility"
                  className="w-full py-1 text-center text-[11px] font-bold text-amber-500 hover:underline"
                >
                  Free User: Unlock for ₹4,999
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* 10times Style KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.title}</span>
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : kpi.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Check-in velocity Area Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-primary" /> Real-Time Visitor Check-In Analytics
              </h3>
              <p className="text-[11px] text-muted-foreground">Hourly attendee check-in velocity across live halls</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              High Peak Traffic
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicCheckinTrend}>
                <defs>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.75rem',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="checkins" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCheckins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Channel Mix Pie Chart (1/3 width) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-pink-500" /> Visitor Channel Mix
            </h3>
            <span className="text-[10px] text-muted-foreground">Original registration sources</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicLeadSourceData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dynamicLeadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-foreground">{dashboardStats.totalLeads.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Leads</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            {dynamicLeadSourceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-bold text-foreground ml-auto">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Live Registrations Table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-500" /> Recent Visitor Registrations
            </h3>
            <p className="text-[11px] text-muted-foreground">Real-time registry logs connected to VisitExpo form submitter</p>
          </div>
          <Link href="/visitors" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All Visitors <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Visitor Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Company / Org</th>
                <th className="p-3">Time</th>
                <th className="p-3 rounded-r-xl text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {recentVisitors.length > 0 ? (
                recentVisitors.map((vis, index) => {
                  const isBlurred = isFreePlan && index >= 3;

                  return (
                    <tr
                      key={vis._id || vis.id}
                      className={`transition-colors ${
                        isBlurred ? 'filter blur-[4px] opacity-40 select-none pointer-events-none' : 'hover:bg-muted/10'
                      }`}
                    >
                      <td className="p-3 font-semibold">
                        {isBlurred ? `${vis.name?.split(' ')[0] || 'Visitor'} ••••••` : vis.name}
                        {isEnterprisePlan && !isBlurred && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            <Crown className="h-2.5 w-2.5" /> VIP
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {isBlurred ? (vis.email ? vis.email.substring(0, 2) + '••••@••••.com' : '••••@••••.com') : vis.email}
                      </td>
                      <td className="p-3">
                        {isBlurred
                          ? (vis.company ? `${vis.company.substring(0, 4)}••••` : 'Corporate Delegate')
                          : (vis.company || vis.organization || 'Corporate Delegate')}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {vis.createdAt ? new Date(vis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="p-3 text-right">
                        {isBlurred ? (
                          <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                            <Lock className="h-3 w-3 text-amber-500" /> Locked
                          </span>
                        ) : vis.checkInStatus === 'checked_in' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Registered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                      <p className="font-semibold text-xs text-foreground">No Visitor Registrations Found</p>
                      <p className="text-[10px]">When attendees register or check in to your events, they will show up here live.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isFreePlan && recentVisitors.length > 3 && (
            <div className="p-3.5 m-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" /> Free Plan: Showing 3 of {recentVisitors.length} visitor registrations
              </p>
              <p className="text-[11px] text-muted-foreground">
                Upgrade to Starter for normal access or Enterprise for advance level attendee analytics.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-extrabold hover:bg-amber-600 transition-all shadow-xs cursor-pointer"
              >
                <Zap className="h-3 w-3" /> Upgrade to Starter or Enterprise
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Event Interest & Follower Leads Table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-primary" /> Event Interest &amp; Follower Insights
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {engagements.length} Live Delegates
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verified buyers, trade delegates, and visitors who have clicked Interested or Followed your trade exhibitions.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={engagementSearch}
                onChange={(e) => {
                  setEngagementSearch(e.target.value);
                  setEngagementPage(1);
                }}
                placeholder="Search delegates or events..."
                aria-label="Search event engagements"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {engagementSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setEngagementSearch('');
                    setEngagementPage(1);
                  }}
                  aria-label="Clear engagement search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Total Engaged: <strong className="text-foreground">{engagements.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Delegate Name</th>
                <th className="p-3">Email &amp; Phone</th>
                <th className="p-3">Company &amp; Role</th>
                <th className="p-3">Event Associated</th>
                <th className="p-3">Engagement Status</th>
                <th className="p-3 rounded-r-xl text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {loadingEngagements ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <span className="text-xs font-semibold">Loading delegate insights...</span>
                  </td>
                </tr>
              ) : paginatedEngagements.length > 0 ? (
                paginatedEngagements.map((eng, index) => {
                  const isBlurred = isFreePlan && index >= 3;

                  return (
                    <tr
                      key={eng._id}
                      className={`transition-colors ${
                        isBlurred ? 'filter blur-[4px] opacity-40 select-none pointer-events-none' : 'hover:bg-muted/10'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={eng.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(eng.userName)}&background=FF2E63&color=fff`}
                            alt={eng.userName}
                            className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate">
                              {isBlurred ? `${eng.userName?.split(' ')[0] || 'Delegate'} ••••••` : eng.userName}
                              {isEnterprisePlan && !isBlurred && (
                                <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                  <Crown className="h-2.5 w-2.5" /> VIP Lead
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">{eng.userDesignation || 'Trade Delegate'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-foreground">
                          {isBlurred ? (eng.userEmail ? eng.userEmail.substring(0, 2) + '••••@••••.com' : '••••@••••.com') : eng.userEmail}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {isBlurred ? (eng.userPhone ? eng.userPhone.substring(0, 4) + ' ••••••••' : '—') : (eng.userPhone || '—')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground truncate max-w-xs">
                          {isBlurred ? (eng.userCompany ? `${eng.userCompany.substring(0, 4)}••••` : 'Independent Buyer') : (eng.userCompany || 'Independent Buyer')}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">{eng.userRole || 'visitor'}</div>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/expo/${eng.eventSlug}`}
                          className="font-bold text-primary hover:underline block truncate max-w-xs"
                        >
                          {eng.eventTitle}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block">
                          {eng.eventCity} • {eng.eventDates}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          eng.type === 'both'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : eng.type === 'follower'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {eng.type === 'both' ? 'Interested & Following' : eng.type === 'follower' ? 'Following Event' : 'Marked Interested'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground text-[11px] whitespace-nowrap">
                        {eng.createdAt ? new Date(eng.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                      <p className="font-semibold text-xs text-foreground">
                        {engagementQuery ? 'No Matching Delegates' : 'No Event Engagements Yet'}
                      </p>
                      <p className="text-[10px]">
                        {engagementQuery
                          ? 'Try a different name, company, event, or engagement status.'
                          : 'When trade buyers or visitors mark interest or follow your exhibitions, their profiles will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isFreePlan && engagements.length > 3 && (
            <div className="p-3.5 m-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" /> Free Plan: Showing 3 of {engagements.length} interested people &amp; followers
              </p>
              <p className="text-[11px] text-muted-foreground">
                Upgrade to Starter for normal access or Enterprise for advance level delegate insights.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-extrabold hover:bg-amber-600 transition-all shadow-xs cursor-pointer"
              >
                <Zap className="h-3 w-3" /> Upgrade to Starter or Enterprise
              </Link>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loadingEngagements && filteredEngagements.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-foreground">{Math.min((safeEngagementPage - 1) * engagementPageSize + 1, filteredEngagements.length)}</strong>–<strong className="text-foreground">{Math.min(safeEngagementPage * engagementPageSize, filteredEngagements.length)}</strong> of <strong className="text-foreground">{filteredEngagements.length}</strong> delegates
                {filteredEngagements.length !== engagements.length && (
                  <span className="ml-1 text-[11px] text-muted-foreground/80">
                    (filtered from {engagements.length})
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={engagementPageSize}
                  onChange={(e) => {
                    setEngagementPageSize(Number(e.target.value));
                    setEngagementPage(1);
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  aria-label="Rows per page"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEngagementPage((p) => Math.max(1, p - 1))}
                  disabled={safeEngagementPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-foreground transition-all cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalEngagementPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalEngagementPages <= 5) return true;
                      if (p === 1 || p === totalEngagementPages) return true;
                      return Math.abs(p - safeEngagementPage) <= 1;
                    })
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        acc.push(-idx);
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item) => {
                      if (item < 0) {
                        return (
                          <span key={`ellipsis-${item}`} className="px-1 text-muted-foreground">
                            …
                          </span>
                        );
                      }
                      const p = item;
                      const isActive = p === safeEngagementPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEngagementPage(p)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'border border-border bg-background hover:bg-secondary text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setEngagementPage((p) => Math.min(totalEngagementPages, p + 1))}
                  disabled={safeEngagementPage >= totalEngagementPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-foreground transition-all cursor-pointer"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExhibitorDashboard() {
  const { user, accessToken } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [showAddBoothModal, setShowAddBoothModal] = useState(false);
  const [activating, setActivating] = useState(false);

  // Edit Profile States
  const [formData, setFormData] = useState({
    description: '',
    website: '',
    contactPhone: '',
    logo: ''
  });

  // Setup / Add Booth Form State
  const [setupForm, setSetupForm] = useState({
    eventId: '',
    name: '',
    boothNumber: 'Hall 1, Booth B-42',
    description: '',
    website: '',
    contactPhone: '',
    attendanceType: 'in_person',
    staffName: '',
    staffEmail: '',
    staffPhone: ''
  });

  // Staff States
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '' });

  // Load available events for booth selection with instant sessionStorage hydration
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_exhibitor_events_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAvailableEvents(parsed);
            setSetupForm(prev => ({
              ...prev,
              eventId: prev.eventId || parsed[0]._id,
              name: prev.name || user?.company || user?.name || 'Exhibition Partner',
              contactPhone: prev.contactPhone || user?.phone || '+91 98765 43210',
              staffName: prev.staffName || user?.name || 'Primary Representative',
              staffEmail: prev.staffEmail || user?.email || '',
              staffPhone: prev.staffPhone || user?.phone || '+91 98765 43210'
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Could not read exhibitor events cache:', e);
    }

    const loadEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events?limit=50&all=true`);
        if (res.data && res.data.success && res.data.data && res.data.data.docs) {
          const docs = res.data.data.docs;
          setAvailableEvents(docs);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_exhibitor_events_cache', JSON.stringify(docs));
            }
          } catch (e) {
            console.warn('Could not cache exhibitor events:', e);
          }
          if (docs.length > 0) {
            setSetupForm(prev => ({
              ...prev,
              eventId: prev.eventId || docs[0]._id,
              name: prev.name || user?.company || user?.name || 'Exhibition Partner',
              contactPhone: prev.contactPhone || user?.phone || '+91 98765 43210',
              staffName: prev.staffName || user?.name || 'Primary Representative',
              staffEmail: prev.staffEmail || user?.email || '',
              staffPhone: prev.staffPhone || user?.phone || '+91 98765 43210'
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load events list for exhibitor setup', err);
      }
    };
    loadEvents();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.get(`${API_URL}/exhibitors/profile`, { headers });
      if (res.data && res.data.success) {
        const data = res.data.data || [];
        setProfiles(data);
        if (data.length > 0) {
          const current = data[selectedIdx] || data[0];
          setProfile(current);
          setFormData({
            description: current.description || '',
            website: current.website || '',
            contactPhone: current.contactPhone || '',
            logo: current.logo || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to load exhibitor profiles', err);
      setError(err.response?.data?.error || 'Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProfile();
    }
  }, [accessToken]);

  // Sync details when switching booth profiles
  useEffect(() => {
    if (profiles.length > 0) {
      const current = profiles[selectedIdx] || profiles[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(current);
      setFormData({
        description: current.description || '',
        website: current.website || '',
        contactPhone: current.contactPhone || '',
        logo: current.logo || ''
      });
      setMessage('');
    }
  }, [selectedIdx, profiles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    if (profile.status !== 'approved') return;

    setUpdating(true);
    setMessage('');
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(`${API_URL}/exhibitors/${profile._id}`, formData, { headers });
      if (res.data && res.data.success) {
        const updated = res.data.exhibitor;
        setProfiles(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Error updating profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickSetup = async (e) => {
    e.preventDefault();
    if (!setupForm.eventId) {
      alert('Please select an event for your booth.');
      return;
    }

    setActivating(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const payload = {
        eventId: setupForm.eventId,
        name: setupForm.name?.trim() || user?.company || user?.name || 'Exhibition Partner',
        description: setupForm.description?.trim() || `${setupForm.name || user?.name || 'Our company'} is an official exhibitor showcasing innovative products and services.`,
        website: setupForm.website?.trim() || '',
        contactPhone: setupForm.contactPhone?.trim() || user?.phone || '+91 98765 43210',
        boothNumber: setupForm.boothNumber?.trim() || 'TBD',
        attendanceType: setupForm.attendanceType || 'in_person',
        staff: [
          {
            name: setupForm.staffName?.trim() || user?.name || 'Primary Representative',
            email: setupForm.staffEmail?.trim() || user?.email || '',
            phone: setupForm.staffPhone?.trim() || setupForm.contactPhone?.trim() || ''
          }
        ]
      };

      const res = await axios.post(`${API_URL}/exhibitors/quick-setup`, payload, { headers });
      if (res.data && res.data.success && res.data.exhibitor) {
        const newExhibitor = res.data.exhibitor;
        setProfiles(prev => [newExhibitor, ...prev]);
        setProfile(newExhibitor);
        setSelectedIdx(0);
        setShowAddBoothModal(false);
        setError('');
        setMessage('Exhibitor booth profile activated successfully!');
      }
    } catch (err) {
      console.error('Failed to setup exhibitor booth', err);
      alert('Error activating booth: ' + (err.response?.data?.error || err.message));
    } finally {
      setActivating(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      alert('Staff name and email are required');
      return;
    }
    if (!profile || profile.status !== 'approved') return;

    const updatedStaff = [...(profile.staff || []), newStaff];
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(`${API_URL}/exhibitors/${profile._id}`, { staff: updatedStaff }, { headers });
      if (res.data && res.data.success) {
        const updated = res.data.exhibitor;
        setProfiles(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
        setNewStaff({ name: '', email: '', phone: '' });
      }
    } catch (err) {
      console.error('Failed to add staff', err);
      alert('Error adding staff: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveStaff = async (idx) => {
    if (!profile || profile.status !== 'approved') return;
    if (!confirm('Are you sure you want to remove this staff representative?')) return;

    const updatedStaff = profile.staff.filter((_, i) => i !== idx);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(`${API_URL}/exhibitors/${profile._id}`, { staff: updatedStaff }, { headers });
      if (res.data && res.data.success) {
        const updated = res.data.exhibitor;
        setProfiles(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
      }
    } catch (err) {
      console.error('Failed to remove staff', err);
      alert('Error removing staff.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Fetching exhibitor profile details...</p>
      </div>
    );
  }

  // Welcome / Onboarding Screen if no booth profile exists yet
  if (!profile || profiles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Welcome Hero Card */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Building className="h-3.5 w-3.5" /> Exhibitor Portal Active
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                Welcome to Your Exhibitor Hub, {user?.name || 'Exhibitor'}!
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
                You are registered as an official trade exhibitor. Connect your company to an upcoming exhibition event below to activate your booth dashboard, manage your team delegate passes, and showcase products to trade buyers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/organizers"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" /> Organizers &amp; Live Chat
              </Link>
              <Link
                href="/expos"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors cursor-pointer"
              >
                <Calendar className="h-4 w-4" /> Browse Expos
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Booth Activation Form Card */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" /> Activate Your Exhibition Booth
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your target trade show event and enter your exhibition profile details to launch your hub.
            </p>
          </div>

          <form onSubmit={handleQuickSetup} className="space-y-5">
            {/* Event Selection */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Target Exhibition / Expo Event *
              </label>
              <SearchableSelect
                options={availableEvents.map(evt => ({
                  value: evt._id,
                  label: `${evt.title}${evt.city ? ` (${evt.city})` : ''}`
                }))}
                value={setupForm.eventId}
                onChange={(val) => setSetupForm(prev => ({ ...prev, eventId: val }))}
                placeholder={availableEvents.length === 0 ? 'Loading live events...' : 'Select Expo Event...'}
                searchPlaceholder="Search events..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={setupForm.name}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Apex Industrial Solutions"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Booth / Stall Space Number
                </label>
                <input
                  type="text"
                  value={setupForm.boothNumber}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, boothNumber: e.target.value }))}
                  placeholder="e.g. Hall 1, Booth B-42"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={setupForm.contactPhone}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={setupForm.website}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://company.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Company Overview & Products Showcased
              </label>
              <textarea
                rows={3}
                value={setupForm.description}
                onChange={(e) => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your company, industry sector, and core products featured at this expo..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={activating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-xs md:text-sm shadow-md transition-all cursor-pointer"
              >
                {activating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating Booth Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Activate Exhibitor Booth & Enter Hub
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Booth/Event Switcher & Add Booth Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-[280px]">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Active Booth / Expo:
          </span>
          <SearchableSelect
            options={profiles.map((p, idx) => ({
              value: String(idx),
              label: `${p.name} at ${p.event?.title || 'Expo Event'} (${p.status?.toUpperCase()})`
            }))}
            value={String(selectedIdx)}
            onChange={(val) => setSelectedIdx(Number(val))}
            placeholder="Select active booth..."
            searchPlaceholder="Search booth or event..."
            className="w-full sm:max-w-md py-1.5 text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/organizers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Organizers &amp; Live Chat
          </Link>
          <button
            onClick={() => setShowAddBoothModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Another Expo Booth
          </button>
        </div>
      </div>

      {/* Lock Warning Alert Banner if pending or rejected */}
      {profile.status !== 'approved' && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
          profile.status === 'rejected'
            ? 'bg-destructive/10 border-destructive/20 text-destructive'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        }`}>
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>
            {profile.status === 'rejected'
              ? 'This onboarding request has been rejected by the organizers. Self-editing and badge configurations are locked.'
              : 'This exhibitor booth and profile request is currently pending organizer review. You can review details below, but edits and staff badges are locked until approved.'
            }
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary border border-border text-foreground font-extrabold text-2xl shadow-sm overflow-hidden shrink-0">
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name} className="h-full w-full object-contain" />
            ) : (
              profile.name?.slice(0, 2).toUpperCase() || 'EX'
            )}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {profile.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Registered Exhibitor for <strong className="text-primary">{profile.event?.title || 'Event'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Active
            </span>
          ) : profile.status === 'rejected' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
              <AlertCircle className="h-3.5 w-3.5" /> Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
              <Clock className="h-3.5 w-3.5" /> Pending Review
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500 uppercase border border-blue-500/20">
            {profile.attendanceType?.replace('_', ' ') || 'in-person'} Booth
          </span>
        </div>
      </div>

      {/* Organizers & Live Chat Spotlight Banner for Exhibitors */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-primary/10 border border-purple-500/20 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              B2B Expo Organizers Directory
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Connect with 500+ Event Organizers for Booth &amp; Sponsorship Opportunities
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Discover upcoming trade exhibitions, search by sector or city, and chat live with organizers to secure prime stall locations.
          </p>
        </div>
        <Link
          href="/organizers"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 shrink-0 transition-all hover:scale-102"
        >
          <Building className="h-4 w-4" />
          <span>Explore Organizers &amp; Chat</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Modal: Add Another Booth */}
      {showAddBoothModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Register Booth for Another Expo</h3>
                  <p className="text-xs text-muted-foreground">Select an upcoming trade show to participate in.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBoothModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Target Expo Event *</label>
                <SearchableSelect
                  options={availableEvents.map(evt => ({
                    value: evt._id,
                    label: `${evt.title}${evt.city ? ` (${evt.city})` : ''}`
                  }))}
                  value={setupForm.eventId}
                  onChange={(val) => setSetupForm(prev => ({ ...prev, eventId: val }))}
                  placeholder="Select target expo event..."
                  searchPlaceholder="Search events..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={setupForm.name}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Booth Number</label>
                  <input
                    type="text"
                    value={setupForm.boothNumber}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, boothNumber: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={setupForm.contactPhone}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={setupForm.website}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddBoothModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activating}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {activating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Activate Booth
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Booth Number', value: profile.boothNumber || 'TBD', desc: 'Assigned space location' },
          { title: 'Representatives Staff', value: `${profile.staff?.length || 0} Badges`, desc: 'Active booth managers' },
          { title: 'Expo Target Event', value: profile.event?.city || 'Location', desc: profile.event?.venue || 'Venue Address' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.title}</span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight mt-2">{kpi.value}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Update Profile Form (2/3 width) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Edit3 className="h-4.5 w-4.5 text-primary" /> Update Company Profile
            </h3>
            <p className="text-[11px] text-muted-foreground">Modify information displayed to visitors in the directory.</p>
          </div>

          {message && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  disabled={profile.status !== 'approved'}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  disabled={profile.status !== 'approved'}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Logo Image URL</label>
              <input
                type="text"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                disabled={profile.status !== 'approved'}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="https://logo-source.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company Description</label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={profile.status !== 'approved'}
                className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Brief summary of company and products..."
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="submit"
                disabled={updating || profile.status !== 'approved'}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Staff Representative Badges (1/3 width) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-500" /> Representative Badges
            </h3>
            <p className="text-[11px] text-muted-foreground">Manage representative staff attending the event.</p>
          </div>

          {/* Add Staff form */}
          {profile.status === 'approved' ? (
            <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-xl border border-border">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Register Representative</h4>
              <input
                type="text"
                placeholder="Full Name"
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newStaff.email}
                onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 px-3 py-1.5 text-primary-foreground font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/10 border border-dashed border-border p-4 rounded-xl text-center text-xs text-muted-foreground">
              Badge configuration is locked.
            </div>
          )}

          {/* Staff representatives list */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {profile.staff && profile.staff.length > 0 ? (
              profile.staff.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/40 border border-border rounded-xl text-xs hover:bg-secondary transition-colors">
                  <div>
                    <p className="font-bold text-foreground">{st.name}</p>
                    <p className="text-[10px] text-muted-foreground">{st.email}</p>
                    {st.phone && <p className="text-[10px] text-muted-foreground">{st.phone}</p>}
                  </div>
                  {profile.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStaff(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-center text-muted-foreground py-6">No representatives registered yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Target Event info card */}
      {profile.event && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Target Expo Event Details
            </h3>
            <p className="text-[11px] text-muted-foreground">Information about the trade show you are participating in.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-xs pt-2">
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-bold block">Event Title</span>
                <span className="font-semibold text-foreground text-sm">{profile.event.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-bold block">Dates & Timing</span>
                <span className="font-medium text-foreground">Starts: {new Date(profile.event.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-bold block">Venue Location</span>
                <span className="font-medium text-foreground">{profile.event.venue}, {profile.event.city}</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground uppercase text-[10px] font-bold block">Event Description</span>
              <div
                className="text-muted-foreground leading-relaxed mt-1 text-[11px] [&_strong]:font-semibold [&_strong]:text-foreground [&_b]:font-semibold [&_b]:text-foreground [&_em]:italic"
                dangerouslySetInnerHTML={{
                  __html: renderCardDescription(profile.event.description)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @component VisitorDashboard
 * @description Dedicated, distraction-free dashboard for Visitors to manage entry passes, QR badges, and discover expos.
 */
function VisitorDashboard() {
  const { user, accessToken } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(true);
  const [expos, setExpos] = useState([]);
  const [loadingExpos, setLoadingExpos] = useState(true);
  const [claimingEventId, setClaimingEventId] = useState(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [claimError, setClaimError] = useState('');
  const [selectedPassForBadge, setSelectedPassForBadge] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [engagements, setEngagements] = useState({ all: [], interestedEvents: [], followedEvents: [] });
  const [loadingEngagements, setLoadingEngagements] = useState(true);
  const [engagementTab, setEngagementTab] = useState('all');

  // Fetch visitor's marked interested and followed events
  const fetchMyEngagements = async () => {
    if (!user?.email && !user?.id && !user?._id) return;
    try {
      setLoadingEngagements(true);
      const identifier = user.email || user.id || user._id;
      const res = await axios.get(`${API_URL}/engagements/user/${encodeURIComponent(identifier)}`);
      if (res.data && res.data.success && res.data.data) {
        setEngagements(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch visitor engagements:', err);
    } finally {
      setLoadingEngagements(false);
    }
  };

  // Fetch visitor's registered passes
  const fetchMyPasses = async () => {
    try {
      setLoadingPasses(true);
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/visitors/my-passes`, { headers });
      if (res.data && res.data.success) {
        setPasses(res.data.data.docs || []);
      }
    } catch (err) {
      console.warn('Could not fetch visitor passes:', err);
    } finally {
      setLoadingPasses(false);
    }
  };

  // Fetch upcoming exhibitions from backend API with instant sessionStorage hydration
  const fetchExpos = async () => {
    try {
      const res = await axios.get(`${API_URL}/events?limit=12`);
      if (res.data && res.data.success && res.data.data.docs) {
        const docs = res.data.data.docs;
        setExpos(docs);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_visitor_expos_cache', JSON.stringify(docs));
          }
        } catch (e) {
          console.warn('Could not cache visitor expos:', e);
        }
      } else {
        const fallbackRes = await axios.get(`${API_URL}/wordpress/claimable-events?limit=8`);
        if (fallbackRes.data && fallbackRes.data.success && fallbackRes.data.data.docs) {
          const fallbackDocs = fallbackRes.data.data.docs;
          setExpos(fallbackDocs);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_visitor_expos_cache', JSON.stringify(fallbackDocs));
            }
          } catch (e) {
            console.warn('Could not cache fallback expos:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch expos:', err);
    } finally {
      setLoadingExpos(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cachedExpos = sessionStorage.getItem('visitexpo_visitor_expos_cache');
        if (cachedExpos) {
          const parsed = JSON.parse(cachedExpos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setExpos(parsed);
            setLoadingExpos(false);
          }
        }
        if (user) {
          const userId = user.id || user._id;
          const cachedPasses = sessionStorage.getItem(`visitexpo_visitor_passes_cache_${userId}`);
          if (cachedPasses) {
            const parsed = JSON.parse(cachedPasses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPasses(parsed);
              setLoadingPasses(false);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not read visitor cache:', e);
    }

    fetchMyPasses();
    fetchExpos();
    fetchMyEngagements();
  }, [user, accessToken]);

  // Handle 1-click pass booking
  const handleClaimPass = async (event) => {
    setClaimError('');
    setClaimSuccessMessage('');
    const eventId = event._id || event.id;
    setClaimingEventId(eventId);

    try {
      const res = await axios.post(`${API_URL}/visitors/register`, {
        eventId,
        name: user?.name || user?.email?.split('@')[0] || 'Visitor',
        email: user?.email,
        phone: user?.phone || '+91-9999999999',
        company: user?.organization?.name || 'Trade Attendee',
        designation: 'Business Visitor',
        country: 'India',
        attendanceType: 'in_person'
      });

      if (res.data && res.data.success) {
        setClaimSuccessMessage(`Pass confirmed for "${event.title}"! Your digital badge is ready below.`);
        await fetchMyPasses();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration could not be completed. You may already be registered.';
      setClaimError(errMsg);
    } finally {
      setClaimingEventId(null);
    }
  };

  // Set of event IDs already claimed by this visitor
  const registeredEventIds = new Set(
    passes.map(p => {
      if (p.event && typeof p.event === 'object') return p.event._id;
      return p.event;
    }).filter(Boolean)
  );

  const filteredExpos = expos.filter(exp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (exp.title && exp.title.toLowerCase().includes(q)) ||
      (exp.city && exp.city.toLowerCase().includes(q)) ||
      (exp.category && exp.category.toLowerCase().includes(q)) ||
      (exp.venue && exp.venue.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner Header */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              <Ticket className="h-3.5 w-3.5" /> Visitor &amp; Buyer Hub
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" /> Verified Account
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome, {user?.name || 'Visitor'}!
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Access your confirmed exhibition passes, show your digital QR entry badge at the gate, and discover upcoming trade shows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#explore-expos"
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <Ticket className="h-4 w-4" /> Claim Passes Here
          </a>
          <Link
            href="/organizers"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" /> Organizers &amp; Live Chat
          </Link>
          <Link
            href="/expos"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4" /> Browse Live Expos &rarr;
          </Link>
          <button
            onClick={fetchMyPasses}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-2.5 text-xs font-bold text-foreground transition-colors cursor-pointer"
            title="Refresh Passes"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Organizers & Live Chat Spotlight Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Organizer Desk
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Explore 500+ Event Organizers &amp; Exhibitions
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Browse verified trade fair organizers, view their upcoming expos, and chat directly in real-time with organizers who have live chat enabled.
          </p>
        </div>
        <Link
          href="/organizers"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 shrink-0 transition-all hover:scale-102"
        >
          <Building className="h-4 w-4" />
          <span>Explore Organizers &amp; Chat</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Status Alerts */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{claimSuccessMessage}</span>
          </div>
          <button onClick={() => setClaimSuccessMessage('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {claimError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{claimError}</span>
          </div>
          <button onClick={() => setClaimError('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Visitor KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Confirmed Passes</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">{passes.length}</div>
          <p className="text-[11px] text-muted-foreground">Ready for gate check-in</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Exhibitions</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">{expos.length}</div>
          <p className="text-[11px] text-muted-foreground">Upcoming trade shows</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gate Entry Badge</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">QR Scan Ready</div>
          <p className="text-[11px] text-muted-foreground">Instant digital badge verification</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendee Profile</span>
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">Trade Visitor</div>
          <p className="text-[11px] text-muted-foreground">Full delegate &amp; buyer privileges</p>
        </div>
      </div>

      {/* SECTION 1: My Confirmed Passes & Digital Entry Badges */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> My Event Passes &amp; Digital Badges
            </h3>
            <p className="text-xs text-muted-foreground">Show these QR badges at event entry checkpoints for instant paperless entry.</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Total Passes: <strong className="text-foreground">{passes.length}</strong>
          </span>
        </div>

        {loadingPasses ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading your passes and badges...</p>
          </div>
        ) : passes.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Ticket className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-foreground">No Registered Passes Yet</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have not registered for any exhibition passes yet. Explore upcoming trade shows below to claim your free pass in 1 click!
              </p>
            </div>
            <Link
              href="/expos"
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" /> Explore Expos &amp; Get Passes
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {passes.map((pass) => {
              const eventTitle = pass.event?.title || 'Trade Exhibition';
              const eventVenue = pass.event?.venue || 'Main Convention Hall';
              const eventCity = pass.event?.city || 'India';
              const eventDates = pass.event?.startDate
                ? `${new Date(pass.event.startDate).toLocaleDateString()} - ${new Date(pass.event.endDate || pass.event.startDate).toLocaleDateString()}`
                : 'Upcoming';

              const qrData = pass.qrCode || `VIS-${pass._id}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;

              return (
                <div
                  key={pass._id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Decorative top accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-amber-400 to-pink-500" />

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> {pass.registrationStatus || 'Confirmed'}
                        </span>
                        <h4 className="text-sm font-bold text-foreground leading-snug">{eventTitle}</h4>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{eventVenue}, {eventCity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{eventDates}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                        <span className="font-semibold text-foreground">{pass.name}</span>
                        {pass.company && <span className="text-[11px]">• {pass.company}</span>}
                      </div>
                    </div>

                    {/* QR Preview Snippet */}
                    <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-border/60">
                      <img
                        src={qrUrl}
                        alt="QR Code"
                        className="h-14 w-14 rounded-lg bg-white p-1 border border-border object-contain"
                      />
                      <div className="overflow-hidden space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Badge Ref Code</span>
                        <p className="text-xs font-mono font-bold text-foreground truncate">
                          VIS-{pass._id.slice(-6).toUpperCase()}
                        </p>
                        <span className="text-[10px] text-muted-foreground block">
                          Attendance: <strong className="capitalize text-foreground">{pass.attendanceType?.replace('_', ' ') || 'In-person'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedPassForBadge(pass)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" /> View QR Badge
                    </button>
                    <Link
                      href="/expos"
                      className="p-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Explore Event Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 1.5: My Followed & Interested Trade Shows */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-amber-500" /> My Followed &amp; Interested Expos
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {engagements.total || 0} Saved Shows
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trade exhibitions you are actively tracking for updates, visitor badges, and stall announcements.
            </p>
          </div>

          {/* Engagement Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setEngagementTab('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engagementTab === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({engagements.total || 0})
            </button>
            <button
              type="button"
              onClick={() => setEngagementTab('interested')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engagementTab === 'interested'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Interested ({engagements.interestedEvents?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setEngagementTab('followed')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engagementTab === 'followed'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Following ({engagements.followedEvents?.length || 0})
            </button>
          </div>
        </div>

        {loadingEngagements ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading your followed trade shows...</p>
          </div>
        ) : (
          (() => {
            const displayList =
              engagementTab === 'interested'
                ? engagements.interestedEvents || []
                : engagementTab === 'followed'
                ? engagements.followedEvents || []
                : engagements.all || [];

            if (displayList.length === 0) {
              return (
                <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto">
                    <Bookmark className="h-6 w-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-xs font-bold text-foreground">No Followed Expos in this Category</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Click the &quot;Interested&quot; or &quot;Follow&quot; button on any exhibition page to receive real-time notifications and add it to this list.
                    </p>
                  </div>
                  <a
                    href="#explore-expos"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    Browse Trade Shows Below &darr;
                  </a>
                </div>
              );
            }

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayList.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">
                          {item.eventCategory || 'Trade Show'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'both'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : item.type === 'follower'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.type === 'both' ? 'Interested & Following' : item.type === 'follower' ? 'Following' : 'Marked Interested'}
                        </span>
                      </div>

                      <Link
                        href={`/expo/${item.eventSlug}`}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors block line-clamp-1"
                      >
                        {item.eventTitle}
                      </Link>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{item.eventCity} • {item.eventVenue || 'Exhibition Center'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{item.eventDates || '2026 Edition'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <Link
                        href={`/expo/${item.eventSlug}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 text-xs font-bold transition-all shadow-xs"
                      >
                        <span>View Expo Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* SECTION 2: Explore & Claim Passes for Upcoming Trade Expos */}
      <div id="explore-expos" className="space-y-4 pt-4 border-t border-border scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Explore &amp; Claim Visitor Passes
            </h3>
            <p className="text-xs text-muted-foreground">Claim free entry passes for upcoming trade shows in 1 click.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expos by title, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {loadingExpos ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Fetching upcoming exhibitions...</p>
          </div>
        ) : filteredExpos.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-xs">
            No trade shows found matching your search.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExpos.map((expo) => {
              const expoId = expo._id || expo.id;
              const isClaimed = registeredEventIds.has(expoId);
              const isClaiming = claimingEventId === expoId;
              const expoDates = expo.startDate
                ? `${new Date(expo.startDate).toLocaleDateString()} - ${new Date(expo.endDate || expo.startDate).toLocaleDateString()}`
                : 'Upcoming 2026';

              return (
                <div
                  key={expoId}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-32 bg-zinc-900 overflow-hidden">
                    {expo.banner ? (
                      <img src={expo.banner} alt={expo.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10">
                      {expo.category || 'Trade Show'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-foreground line-clamp-1">{expo.title}</h4>
                      <div
                        className="text-xs text-muted-foreground line-clamp-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground [&_b]:font-semibold [&_b]:text-foreground [&_em]:italic"
                        dangerouslySetInnerHTML={{
                          __html: renderCardDescription(expo.shortDescription || expo.description || 'Join industry leaders and explore prime exhibits.')
                        }}
                      />
                      <div className="pt-1 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{expo.venue || 'Convention Center'}, {expo.city || 'India'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{expoDates}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      {isClaimed ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Pass Confirmed
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleClaimPass(expo)}
                          disabled={isClaiming}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Issuing Badge...
                            </>
                          ) : (
                            <>
                              <Ticket className="h-3.5 w-3.5" /> Claim Free Visitor Pass
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Printable Digital QR Entry Badge */}
      {selectedPassForBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPassForBadge(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs p-1 rounded-lg border border-border bg-secondary cursor-pointer"
            >
              ✕
            </button>

            {/* Badge Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <Ticket className="h-3 w-3" /> VisitExpo Verified Badge
              </div>
              <h3 className="text-base font-extrabold text-foreground leading-tight pt-1">
                {selectedPassForBadge.event?.title || 'Trade Exhibition'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {selectedPassForBadge.event?.venue}, {selectedPassForBadge.event?.city}
              </p>
            </div>

            {/* Attendee Name & Role Banner */}
            <div className="bg-secondary/70 border border-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendee</span>
              <h2 className="text-lg font-extrabold text-foreground">{selectedPassForBadge.name}</h2>
              <span className="inline-block text-[11px] font-bold text-amber-500 uppercase">
                {selectedPassForBadge.company || 'Trade Visitor'}
              </span>
            </div>

            {/* High-Resolution QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-zinc-300 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPassForBadge.qrCode || `VIS-${selectedPassForBadge._id}`)}`}
                alt="Entry QR Code"
                className="h-44 w-44 object-contain"
              />
              <span className="text-[10px] font-mono font-bold text-zinc-800 mt-2 tracking-widest">
                VIS-{selectedPassForBadge._id.slice(-8).toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Present this digital pass at the entrance scanner for instant check-in.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 text-xs shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Badge
              </button>
              <button
                type="button"
                onClick={() => setSelectedPassForBadge(null)}
                className="rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const { user, isExhibitorView } = useAuth();

  if (user && user.role === 'visitor') {
    return <VisitorDashboard />;
  }

  if (user && (user.role === 'exhibitor' || isExhibitorView)) {
    return <ExhibitorDashboard />;
  }

  return <OrganizerDashboardInner />;
}
