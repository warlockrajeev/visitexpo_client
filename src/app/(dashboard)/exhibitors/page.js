'use client';

/**
 * @file page.js (Exhibitors)
 * @description Exhibitor management and onboarding interface for organizers.
 * Tier gating rules:
 * - Free Plan: Locked paywall (Not available).
 * - Starter Plan: Normal level (Standard directory & booth management, up to 25 exhibitors/event).
 * - Enterprise Plan: Advance level (Unlimited exhibitors, 1-Click Excel export, VIP badging, priority halls).
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../context/AuthContext.js';
import { buildDashboardEventsUrl } from '../../../utils/dashboardEvents.js';
import SearchableSelect from '../../../components/SearchableSelect.js';
import {
  showSweetAlert,
  showSweetConfirm,
  showSweetSuccess,
  showSweetError,
  showSweetWarning
} from '../../../utils/sweetalert.js';
import {
  Building,
  Search,
  Plus,
  Check,
  X,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Trash2,
  AlertCircle,
  PlusCircle,
  Loader2,
  Clock,
  Lock,
  Crown,
  Sparkles,
  Download,
  Star,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Award,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  QrCode
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function ExhibitorsPage() {
  const { user, accessToken } = useAuth();

  // Plan Tier State (free, starter, enterprise)
  const [userPlan, setUserPlan] = useState('free');
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMyPlan = async () => {
      try {
        const token =
          accessToken ||
          (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_token') : null);
        if (!token) {
          if (user?.plan) setUserPlan(user.plan.toLowerCase());
          setIsPlanLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/plans/my-plan`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted && res.data?.success && res.data.plan) {
          setUserPlan(res.data.plan.toLowerCase());
        } else if (user?.plan) {
          setUserPlan(user.plan.toLowerCase());
        }
      } catch (err) {
        if (user?.plan) setUserPlan(user.plan.toLowerCase());
      } finally {
        if (isMounted) setIsPlanLoading(false);
      }
    };
    fetchMyPlan();
    return () => {
      isMounted = false;
    };
  }, [user, accessToken]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isFreePlan = !isSuperAdmin && (userPlan === 'free' || !userPlan);
  const isStarterPlan = !isSuperAdmin && userPlan === 'starter';
  const isEnterprisePlan = isSuperAdmin || userPlan === 'enterprise' || userPlan === 'growth';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, approved, pending, rejected, vip, virtual

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExhibitor, setNewExhibitor] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    attendanceType: 'in_person',
    boothNumber: '',
    priorityHall: '',
    isVipFeatured: false,
    leadRetrievalStatus: 'inactive',
    staff: []
  });
  const [newStaffMember, setNewStaffMember] = useState({ name: '', email: '', phone: '' });

  const resetExhibitorForm = () => {
    setNewExhibitor({
      name: '',
      description: '',
      logo: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
      attendanceType: 'in_person',
      boothNumber: '',
      priorityHall: '',
      isVipFeatured: false,
      leadRetrievalStatus: 'inactive',
      staff: []
    });
    setNewStaffMember({ name: '', email: '', phone: '' });
  };

  const handleOpenModal = () => {
    if (isFreePlan) {
      showSweetAlert({
        title: 'Exhibitor Management Locked',
        text: 'Exhibitor onboarding is not available on the Free Organizer Plan. Please upgrade to Starter or Enterprise.',
        icon: 'warning',
        confirmButtonText: 'Upgrade Now'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/pricing';
        }
      });
      return;
    }

    if (isStarterPlan && exhibitors.length >= 25) {
      showSweetAlert({
        title: 'Starter Limit Reached (Normal Level)',
        text: 'You have reached the Starter plan capacity of 25 exhibitors for this event. Upgrade to Enterprise to unlock unlimited exhibitors.',
        icon: 'warning',
        confirmButtonText: 'Upgrade to Enterprise',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/pricing?plan=enterprise';
        }
      });
      return;
    }

    resetExhibitorForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetExhibitorForm();
  };

  // 1. Fetch Events on Load (Only for authorized tiers)
  useEffect(() => {
    if (!user || isFreePlan) return;
    const userId = user._id || user.id || 'anonymous';
    const cacheKey = `visitexpo_dashboard_events_${userId}`;

    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
            setSelectedEventId(prev => prev || parsed[0]._id);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read cached events:', e);
    }

    const fetchEvents = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const url = buildDashboardEventsUrl(API_URL, user);

        let res = await axios.get(url, { headers });
        let docs = res.data?.data?.docs || [];

        // Fallback: If no events returned for specific organizerId filter, fetch all user accessible events with all=true
        if (docs.length === 0 && user.role !== 'super_admin') {
          const fallbackRes = await axios.get(`${API_URL}/events?limit=100&all=true`, { headers });
          docs = fallbackRes.data?.data?.docs || [];
        }

        setEvents(docs);
        if (docs.length > 0) {
          setSelectedEventId(prev => prev || docs[0]._id);
        }

        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify(docs));
          }
        } catch (e) {
          console.warn('Could not cache events:', e);
        }
      } catch (err) {
        console.error('Failed to load events', err);
        if (events.length === 0) {
          setError('Could not connect to API server. Ensure backend is running.');
        }
      }
    };
    fetchEvents();
  }, [user, accessToken, isFreePlan]);

  // 2. Fetch Exhibitors when selected event changes
  useEffect(() => {
    if (!selectedEventId || isFreePlan) return;

    const fetchExhibitors = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(`${API_URL}/exhibitors`, {
          params: { eventId: selectedEventId },
          headers
        });
        if (res.data && res.data.success) {
          setExhibitors(res.data.data.docs || []);
        }
      } catch (err) {
        console.error('Failed to load exhibitors', err);
        if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
          setUserPlan('free');
        } else {
          setError('Error fetching exhibitors. Make sure database is seeded.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitors();
  }, [selectedEventId, accessToken, isFreePlan]);

  // 3. Handle Status Updates (Approve / Reject)
  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axios.put(
        `${API_URL}/exhibitors/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setExhibitors(prev =>
          prev.map(ex => (ex._id === id ? { ...ex, status: res.data.exhibitor.status } : ex))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
      showSweetError('Error updating exhibitor status: ' + (err.response?.data?.error || err.message));
    }
  };

  // 4. Handle Delete
  const handleDeleteExhibitor = async (id) => {
    const confirmed = await showSweetConfirm({
      title: 'Remove Exhibitor?',
      text: 'Are you sure you want to remove this exhibitor from the event?',
      icon: 'warning',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_URL}/exhibitors/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setExhibitors(prev => prev.filter(ex => ex._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete exhibitor', err);
      showSweetError('Error deleting exhibitor.');
    }
  };

  // 5. Handle Advance Enterprise VIP Toggle
  const handleToggleVip = async (exhibitor) => {
    if (!isEnterprisePlan) {
      showSweetAlert({
        title: 'Advance Feature: VIP Exhibitor',
        text: 'Marking exhibitors as Featured / VIP Partners is available exclusively on the Enterprise Plan (Advance Level). Upgrade to highlight marquee brands.',
        icon: 'info',
        confirmButtonText: 'Upgrade to Enterprise',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/pricing?plan=enterprise';
        }
      });
      return;
    }

    try {
      const nextVip = !exhibitor.isVipFeatured;
      const res = await axios.put(
        `${API_URL}/exhibitors/${exhibitor._id}`,
        { isVipFeatured: nextVip },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setExhibitors(prev =>
          prev.map(ex => (ex._id === exhibitor._id ? { ...ex, isVipFeatured: nextVip } : ex))
        );
        showSweetSuccess(
          nextVip
            ? `"${exhibitor.name}" is now marked as a VIP Featured Partner.`
            : `"${exhibitor.name}" removed from VIP Featured status.`
        );
      }
    } catch (err) {
      showSweetError('Could not update VIP status: ' + (err.response?.data?.error || err.message));
    }
  };

  // 6. Handle 1-Click Directory Export (Enterprise Only)
  const handleExportDirectory = () => {
    if (!isEnterprisePlan) {
      showSweetAlert({
        title: 'Advance Feature: Directory Export',
        text: 'Downloading the complete Exhibitor Roster and Stall Directory in Excel format (.xlsx) is exclusively available on the Enterprise Plan.',
        icon: 'warning',
        confirmButtonText: 'Upgrade to Enterprise',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/pricing?plan=enterprise';
        }
      });
      return;
    }

    if (filteredExhibitors.length === 0) {
      showSweetWarning('No exhibitors available to export for this selection.');
      return;
    }

    try {
      const activeEvent = events.find(e => e._id === selectedEventId);
      const exportRows = filteredExhibitors.map((ex, idx) => ({
        '#': idx + 1,
        'Event Title': activeEvent?.title || 'Selected Expo',
        'Company Name': ex.name,
        'Booth Number': ex.boothNumber || 'Unassigned',
        'Priority Hall': ex.priorityHall || 'Standard Hall',
        'Booth Type': (ex.attendanceType || 'in_person').replace('_', ' ').toUpperCase(),
        'VIP Featured': ex.isVipFeatured ? 'YES (VIP)' : 'No',
        'Contact Email': ex.contactEmail,
        'Contact Phone': ex.contactPhone,
        'Website': ex.website || '',
        'Staff Count': ex.staff?.length || 0,
        'Staff Representatives': (ex.staff || []).map(s => `${s.name} (${s.email})`).join('; '),
        'Lead Retrieval Status': ex.leadRetrievalStatus || 'inactive',
        'Status': (ex.status || 'pending').toUpperCase(),
        'Registered Date': ex.createdAt ? new Date(ex.createdAt).toLocaleDateString('en-IN') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Exhibitors');
      const safeEventName = (activeEvent?.title || 'Expo').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const fileName = `VisitExpo_Exhibitors_${safeEventName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showSweetSuccess(`Exhibitor directory exported successfully as ${fileName}`);
    } catch (err) {
      console.error('Directory export error', err);
      showSweetError('Failed to generate Excel export.');
    }
  };

  // 7. Add Staff Member in Form
  const addStaffMember = () => {
    if (!newStaffMember.name || !newStaffMember.email) {
      showSweetWarning('Staff name and email are required');
      return;
    }
    setNewExhibitor(prev => ({
      ...prev,
      staff: [...prev.staff, newStaffMember]
    }));
    setNewStaffMember({ name: '', email: '', phone: '' });
  };

  const removeStaffMember = (idx) => {
    setNewExhibitor(prev => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== idx)
    }));
  };

  // 8. Handle Onboarding Form Submit
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      showSweetWarning('Please select an Active Event before onboarding an exhibitor.');
      return;
    }
    if (!newExhibitor.name || !newExhibitor.description || !newExhibitor.contactEmail || !newExhibitor.contactPhone) {
      showSweetWarning('Please fill out all required fields');
      return;
    }

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(
        `${API_URL}/exhibitors/register`,
        {
          ...newExhibitor,
          eventId: selectedEventId
        },
        { headers }
      );

      if (res.data && res.data.success) {
        const created = res.data.exhibitor;
        setExhibitors(prev => [created, ...prev]);

        showSweetSuccess(
          `Exhibitor "${created.name}" onboarded successfully! Application has been forwarded for admin approval.`
        );

        handleCloseModal();
      }
    } catch (err) {
      console.error('Failed to onboard exhibitor', err);
      const errMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
        showSweetAlert({
          title: 'Upgrade Required',
          text: errMsg,
          icon: 'warning',
          confirmButtonText: 'Upgrade Plan'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/pricing';
          }
        });
      } else {
        showSweetError('Error onboarding exhibitor: ' + errMsg);
      }
    }
  };

  // Computed Values
  const filteredExhibitors = exhibitors.filter(ex => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.boothNumber && ex.boothNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ex.priorityHall && ex.priorityHall.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'vip') return matchesSearch && ex.isVipFeatured;
    if (activeTab === 'virtual') return matchesSearch && (ex.attendanceType === 'virtual' || ex.attendanceType === 'hybrid');
    return matchesSearch && ex.status === activeTab;
  });

  const totalExhibitors = exhibitors.length;
  const approvedCount = exhibitors.filter(e => e.status === 'approved').length;
  const pendingCount = exhibitors.filter(e => e.status === 'pending').length;
  const vipCount = exhibitors.filter(e => e.isVipFeatured).length;
  const virtualCount = exhibitors.filter(e => e.attendanceType === 'virtual' || e.attendanceType === 'hybrid').length;

  // Plan loading skeleton
  if (isPlanLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Checking organizer plan tier...</p>
      </div>
    );
  }

  // ==========================================
  // FREE PLAN: PAYWALL UPGRADE STATE
  // Exhibitor Management will not be present in free organizer plan
  // ==========================================
  if (isFreePlan) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4">
        {/* Paywall Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-950/20 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 tracking-wide uppercase">
                <Lock className="h-3.5 w-3.5" /> Plan Restricted Feature
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Exhibitor Management is Locked on Free Plan
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Exhibitor Management is not available on the Free Organizer Plan. To onboard, assign stalls, coordinate staff, and manage exhibition rosters, please upgrade your subscription.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href="/pricing?plan=starter"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-black hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
              >
                Upgrade to Starter (Normal Level) <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing?plan=enterprise"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted/30 px-6 py-3.5 text-sm font-bold text-foreground transition-all shadow-sm"
              >
                <Crown className="h-4 w-4 text-amber-400" /> Enterprise (Advance Level)
              </Link>
            </div>
          </div>
        </div>

        {/* Available Tiers Comparison Matrix */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Starter Plan: Normal Level */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  <Building className="h-3.5 w-3.5" /> Starter Plan
                </span>
                <span className="text-xs font-semibold text-muted-foreground">Normal Level Access</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Standard Exhibitor Directory</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Perfect for standalone expos and organizers managing standard exhibitor rosters.
              </p>

              <ul className="space-y-3 text-sm text-foreground">
                {[
                  'Onboard exhibitors across your active expos (up to 25 exhibitors per event)',
                  'Booth number & attendance type (In-person, Virtual, Hybrid)',
                  'Assign representative booth staff & contact credentials',
                  'Standard company directory with logo, website & descriptions',
                  'Track pending and approved exhibitor onboarding requests',
                  'Standard email & fast-track organizer dashboard support'
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href="/pricing?plan=starter"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors"
              >
                Choose Starter Plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Enterprise Plan: Advance Level */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-card via-card to-amber-950/10 p-6 sm:p-7 shadow-xl hover:border-amber-500/70 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-1 rounded-full shadow-md">
                <Crown className="h-3.5 w-3.5" /> Advance Level
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Sparkles className="h-3.5 w-3.5" /> Enterprise Plan
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                Advance Exhibitor Management Suite
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Designed for large exhibition organizers, trade fairs, and multi-hall expos.
              </p>

              <ul className="space-y-3 text-sm text-foreground">
                {[
                  'Everything in Starter plan with Unlimited exhibitors capacity',
                  '1-Click Directory Export to Excel (.xlsx) & CSV with complete contact data',
                  'VIP & Featured Exhibitor badging for marquee sponsors & top brands',
                  'Priority Hall & Prime Zone stall positioning allocation',
                  'Stall Lead Retrieval scanner readiness & badge tracking',
                  'Multi-hall floor coordination & custom exhibitor login credentials',
                  'Dedicated Exhibition Account Manager & phone escalation SLA'
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href="/pricing?plan=enterprise"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 px-4 py-2.5 text-sm font-bold text-black transition-all shadow-md"
              >
                Upgrade to Enterprise <Crown className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Need Help Footnote */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <span>Have an existing organizer sponsorship or corporate account? Contact your support desk to activate your tier.</span>
          </div>
          <Link href="/pricing" className="text-primary font-bold hover:underline shrink-0">
            View All Plans & Comparison Matrix →
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STARTER (NORMAL LEVEL) & ENTERPRISE (ADVANCE LEVEL) VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Plan Tier Status Ribbon */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-xl border ${
        isEnterprisePlan
          ? 'bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 border-amber-500/30'
          : 'bg-card border-border'
      }`}>
        <div className="flex items-center gap-2.5">
          {isEnterprisePlan ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 rounded-full shadow-sm">
              <Crown className="h-3 w-3" /> Enterprise Plan: Advance Level
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              <Building className="h-3 w-3" /> Starter Plan: Normal Level
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            {isEnterprisePlan
              ? 'Advance suite active: Unlimited capacity, VIP badging & Excel export enabled.'
              : `Normal access active (${totalExhibitors}/25 exhibitors allowance). Upgrade to Enterprise for directory export & VIP badging.`}
          </p>
        </div>

        {isStarterPlan && (
          <Link
            href="/pricing?plan=enterprise"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors shrink-0"
          >
            <Crown className="h-3.5 w-3.5" /> Unlock Advance Enterprise Suite →
          </Link>
        )}
      </div>

      {/* Top Banner and Event Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Exhibitor Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage physical and virtual booths, track approval status, and coordinate staff.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col min-w-[280px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Active Event
            </label>
            <SearchableSelect
              options={events.map((evt) => ({ value: evt._id, label: evt.title }))}
              value={selectedEventId}
              onChange={(val) => setSelectedEventId(val)}
              placeholder="Select active event..."
              searchPlaceholder="Search active event..."
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {/* 1-Click Directory Export (Enterprise Unlocked / Starter Prompt) */}
            <button
              onClick={handleExportDirectory}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
                isEnterprisePlan
                  ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted border border-border cursor-pointer'
              }`}
              title={isEnterprisePlan ? 'Download complete directory in Excel (.xlsx)' : 'Available on Enterprise Plan'}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Export Directory</span>
              {!isEnterprisePlan && <Lock className="h-3 w-3 text-amber-500" />}
            </button>

            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              <Plus className="h-4 w-4" /> Onboard Exhibitor
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Total Registered',
            value: totalExhibitors,
            desc: isStarterPlan ? `${totalExhibitors} / 25 event limit (Normal Level)` : 'All submitted requests',
            color: 'text-blue-500'
          },
          { title: 'Approved Booths', value: approvedCount, desc: 'Active in expo spaces', color: 'text-emerald-500' },
          {
            title: isEnterprisePlan ? 'VIP Featured Partners' : 'Pending Approval',
            value: isEnterprisePlan ? vipCount : pendingCount,
            desc: isEnterprisePlan ? 'Advance marquee badges' : 'Awaiting organizer review',
            color: isEnterprisePlan ? 'text-amber-500' : 'text-amber-500'
          },
          { title: 'Virtual Exposures', value: virtualCount, desc: 'Virtual & Hybrid booths', color: 'text-pink-500' }
        ].map((kpi, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Filter and Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Tab Controls and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap border border-border rounded-lg p-0.5 bg-muted/20 w-fit">
            {[
              { id: 'all', label: 'All' },
              { id: 'approved', label: 'Approved' },
              { id: 'pending', label: 'Pending' },
              { id: 'rejected', label: 'Rejected' },
              ...(isEnterprisePlan ? [{ id: 'vip', label: '⭐ VIP Featured' }] : []),
              { id: 'virtual', label: 'Virtual & Hybrid' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search company, booth, hall, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Display Status or Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching event exhibitors...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Failed to Load Exhibitors</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : filteredExhibitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-2">
            <Building className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-foreground">No Exhibitors Found</h3>
            <p className="text-sm max-w-sm">No exhibitors matching the criteria are listed for this event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Booth & Hall</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Staff Count</th>
                  <th className="px-6 py-4">
                    {isEnterprisePlan ? 'Tier & Status' : 'Status'}
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExhibitors.map((ex) => (
                  <tr key={ex._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary border border-border text-foreground font-bold shadow-sm relative">
                          {ex.logo ? (
                            <img src={ex.logo} alt={ex.name} className="h-full w-full object-contain rounded-lg" />
                          ) : (
                            ex.name.slice(0, 2).toUpperCase()
                          )}
                          {ex.isVipFeatured && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black text-[9px]">
                              ★
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">{ex.name}</p>
                            {ex.isVipFeatured && (
                              <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Crown className="h-2.5 w-2.5" /> VIP
                              </span>
                            )}
                            {ex.wpSource && (
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                                DIR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground max-w-xs truncate">{ex.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-foreground">{ex.boothNumber || 'Not Assigned'}</p>
                        {ex.priorityHall && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {ex.priorityHall}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mt-1 uppercase ${
                          ex.attendanceType === 'virtual'
                            ? 'bg-pink-500/10 text-pink-500'
                            : ex.attendanceType === 'hybrid'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {(ex.attendanceType || 'in_person').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{ex.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{ex.contactPhone}</span>
                      </div>
                      {ex.website && (
                        <a
                          href={ex.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                        >
                          <Globe className="h-3.5 w-3.5" /> Visit site <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">{ex.staff?.length || 0} Members</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ex.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : ex.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {ex.status === 'pending'
                            ? 'Pending Admin Approval'
                            : ex.status.charAt(0).toUpperCase() + ex.status.slice(1)}
                        </span>

                        {/* Advance Enterprise Badge Scanner readiness indicator */}
                        {isEnterprisePlan && ex.leadRetrievalStatus === 'active' && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                            <QrCode className="h-3 w-3" /> Lead Retrieval Ready
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Advance VIP Badging Action (Enterprise 1-Click Toggle / Starter Prompt) */}
                        <button
                          onClick={() => handleToggleVip(ex)}
                          className={`p-1.5 rounded-md transition-colors ${
                            ex.isVipFeatured
                              ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                              : 'text-muted-foreground hover:text-amber-400 hover:bg-secondary'
                          }`}
                          title={
                            isEnterprisePlan
                              ? ex.isVipFeatured
                                ? 'Remove VIP Status'
                                : 'Mark as VIP Featured Partner'
                              : 'Advance Enterprise Feature: VIP Badging'
                          }
                        >
                          <Star className={`h-4 w-4 ${ex.isVipFeatured ? 'fill-amber-400' : ''}`} />
                        </button>

                        {ex.status === 'pending' &&
                          (user?.role === 'super_admin' ? (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(ex._id, 'approved')}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                                title="Approve request"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(ex._id, 'rejected')}
                                className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                title="Reject request"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                              title="Awaiting platform administrator review and approval"
                            >
                              <Clock className="h-3 w-3 animate-pulse" /> Pending
                            </span>
                          ))}

                        {ex.status === 'rejected' && user?.role === 'super_admin' && (
                          <button
                            onClick={() => handleStatusUpdate(ex._id, 'pending')}
                            className="text-xs text-primary hover:underline px-2 py-1 font-semibold"
                          >
                            Revert
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteExhibitor(ex._id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md transition-colors"
                          title="Remove exhibitor"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sleek Onboarding Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold text-foreground">Onboard New Exhibitor</h3>
              {isEnterprisePlan ? (
                <span className="text-[10px] font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 rounded-full">
                  Enterprise Advance
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Starter Normal Level ({totalExhibitors}/25 used)
                </span>
              )}
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Target Event *</label>
                <SearchableSelect
                  options={events.map((evt) => ({
                    value: evt._id,
                    label: `${evt.title}${evt.city ? ` (${evt.city})` : ''}`
                  }))}
                  value={selectedEventId}
                  onChange={(val) => setSelectedEventId(val)}
                  placeholder="Select target event..."
                  searchPlaceholder="Search events..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newExhibitor.name}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g. NeuroCore Systems"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Website</label>
                  <input
                    type="url"
                    value={newExhibitor.website}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newExhibitor.description}
                  onChange={(e) => setNewExhibitor(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Provide a brief summary of what this company exhibits."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newExhibitor.contactEmail}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={newExhibitor.contactPhone}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Booth Number</label>
                  <input
                    type="text"
                    value={newExhibitor.boothNumber}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, boothNumber: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g. A-12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Booth Type</label>
                  <SearchableSelect
                    options={[
                      { value: 'in_person', label: 'In Person Only' },
                      { value: 'virtual', label: 'Virtual Only' },
                      { value: 'hybrid', label: 'Hybrid' }
                    ]}
                    value={newExhibitor.attendanceType}
                    onChange={(val) => setNewExhibitor(prev => ({ ...prev, attendanceType: val }))}
                    placeholder="Select booth type..."
                    searchPlaceholder="Search type..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Logo URL</label>
                  <input
                    type="text"
                    value={newExhibitor.logo}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, logo: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://logo.com/img.png"
                  />
                </div>
              </div>

              {/* Advance Enterprise Controls */}
              {isEnterprisePlan && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Crown className="h-3.5 w-3.5" /> Enterprise Advance Controls
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase">
                        Priority Hall / Prime Stall Zone
                      </label>
                      <input
                        type="text"
                        value={newExhibitor.priorityHall}
                        onChange={(e) => setNewExhibitor(prev => ({ ...prev, priorityHall: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="E.g. Hall 1 - Prime Entrance"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={newExhibitor.isVipFeatured}
                          onChange={(e) => setNewExhibitor(prev => ({ ...prev, isVipFeatured: e.target.checked }))}
                          className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                        />
                        <span>Mark as VIP Featured Partner</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Management Section */}
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Representative Staff ({newExhibitor.staff.length})
                </h4>

                {/* Staff List */}
                {newExhibitor.staff.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newExhibitor.staff.map((st, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-secondary border border-border rounded-md px-2 py-1 text-xs">
                        <span className="font-semibold text-foreground">{st.name}</span>
                        <span className="text-muted-foreground">({st.email})</span>
                        <button
                          type="button"
                          onClick={() => removeStaffMember(idx)}
                          className="text-destructive font-bold ml-1 hover:text-destructive/80"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Staff Add Inputs */}
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Staff Name"
                    value={newStaffMember.name}
                    onChange={(e) => setNewStaffMember(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder="Staff Email"
                    value={newStaffMember.email}
                    onChange={(e) => setNewStaffMember(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Staff Phone (optional)"
                      value={newStaffMember.phone}
                      onChange={(e) => setNewStaffMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                    />
                    <button
                      type="button"
                      onClick={addStaffMember}
                      className="inline-flex items-center justify-center rounded-lg bg-secondary border border-border hover:bg-secondary/80 px-3 text-foreground"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors"
                >
                  Submit Exhibitor Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
