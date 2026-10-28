'use client';

/**
 * @file page.js (Email Promotions Hub)
 * @description Dedicated Email Promotions screen for Organizers on the Growth Plan.
 * Enables segmented email broadcasting to Leads, Visitors, Followers, and Interested Attendees
 * utilizing VisitExpo's cPanel relay: promotion@client.visitexpo.in.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext.js';
import { buildDashboardEventsUrl } from '../../../../utils/dashboardEvents.js';
import SearchableSelect from '../../../../components/SearchableSelect.js';
import {
  Mail,
  Send,
  Plus,
  Users,
  Target,
  Sparkles,
  Award,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Smartphone,
  Monitor,
  RefreshCw,
  X,
  Loader2,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  Server,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function EmailPromotionsPage() {
  const { user, accessToken } = useAuth();

  // Entitlement & loading
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasGrowthPlan, setHasGrowthPlan] = useState(false);
  const [userPlan, setUserPlan] = useState('free');

  // Events & Campaigns
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Compose Modal & Form
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [activeComposeTab, setActiveComposeTab] = useState('compose'); // 'compose' | 'preview'
  const [sendingTest, setSendingTest] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // Audience State
  const [selectedAudiences, setSelectedAudiences] = useState({
    leads: true,
    visitors: true,
    followers: true,
    interested: true
  });
  const [audienceData, setAudienceData] = useState({
    totalUnique: 0,
    breakdown: { leads: 0, visitors: 0, followers: 0, interested: 0 },
    recipients: [],
    loading: false
  });
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [showRecipientsList, setShowRecipientsList] = useState(true);

  // Compose Form Fields
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    preheader: '',
    headline: '',
    body: '',
    ctaText: 'Explore Exhibition & Get Passes',
    ctaUrl: '',
    bannerUrl: '',
    templateType: 'modern'
  });

  // Detail / Audit Log Modal
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Verify Growth Plan Entitlement
  useEffect(() => {
    const verifyGrowthAccess = async () => {
      setCheckingAccess(true);
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(`${API_URL}/campaigns/growth-access`, { headers });
        if (res.data?.success) {
          setHasGrowthPlan(Boolean(res.data.hasGrowthPlan));
          setUserPlan(res.data.plan || user?.plan || 'free');
        } else {
          // Fallback to auth context
          const isGrowth = Boolean(user?.hasGrowthPlan || user?.plan === 'growth');
          setHasGrowthPlan(isGrowth);
        }
      } catch (err) {
        console.warn('Could not verify growth access via API, using context:', err);
        const isGrowth = Boolean(user?.hasGrowthPlan || user?.plan === 'growth');
        setHasGrowthPlan(isGrowth);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (user) {
      verifyGrowthAccess();
    }
  }, [user, accessToken]);

  // 2. Fetch Events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(buildDashboardEventsUrl(API_URL, user), { headers });
        if (res.data?.success && res.data.data?.docs) {
          const list = res.data.data.docs;
          setEvents(list);
          if (list.length > 0 && !selectedEventId) {
            setSelectedEventId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    if (user && hasGrowthPlan) {
      fetchEvents();
    }
  }, [user, hasGrowthPlan, accessToken]);

  // 3. Fetch Campaigns list
  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const params = selectedEventId ? { eventId: selectedEventId } : {};
      const res = await axios.get(`${API_URL}/campaigns`, { params, headers });
      if (res.data?.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (hasGrowthPlan) {
      fetchCampaigns();
    }
  }, [selectedEventId, hasGrowthPlan, accessToken]);

  // 4. Fetch Live Target Audience counts when event or audience checkboxes change
  useEffect(() => {
    if (!selectedEventId || !isComposeOpen) return;

    const fetchAudienceCounts = async () => {
      setAudienceData(prev => ({ ...prev, loading: true }));
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const chosenTypes = Object.entries(selectedAudiences)
          .filter(([, checked]) => checked)
          .map(([type]) => type)
          .join(',');

        if (!chosenTypes) {
          setAudienceData({
            totalUnique: 0,
            breakdown: { leads: 0, visitors: 0, followers: 0, interested: 0 },
            recipients: [],
            loading: false
          });
          return;
        }

        const res = await axios.get(`${API_URL}/campaigns/target-audience`, {
          params: { eventId: selectedEventId, audiences: chosenTypes },
          headers
        });

        if (res.data?.success && res.data.data) {
          setAudienceData({
            totalUnique: res.data.data.totalUnique || 0,
            breakdown: res.data.data.breakdown || { leads: 0, visitors: 0, followers: 0, interested: 0 },
            recipients: res.data.data.recipients || [],
            loading: false
          });
        }
      } catch (err) {
        console.warn('Audience count error:', err);
        setAudienceData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAudienceCounts();
  }, [selectedEventId, selectedAudiences, isComposeOpen, accessToken]);

  // Find currently selected event object
  const currentEvent = useMemo(() => {
    return events.find(e => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filter recipients list by search term
  const filteredRecipients = useMemo(() => {
    const list = audienceData.recipients || [];
    if (!recipientSearchTerm.trim()) return list;
    const term = recipientSearchTerm.toLowerCase().trim();
    return list.filter(r =>
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.email && r.email.toLowerCase().includes(term)) ||
      (r.company && r.company.toLowerCase().includes(term)) ||
      (r.designation && r.designation.toLowerCase().includes(term)) ||
      (r.audienceType && r.audienceType.toLowerCase().includes(term))
    );
  }, [audienceData.recipients, recipientSearchTerm]);

  // Reset & Open Compose Modal
  const handleOpenCompose = () => {
    const defaultEvent = currentEvent || (events.length > 0 ? events[0] : null);
    setFormData({
      title: defaultEvent ? `${defaultEvent.title} - Official Invitation` : '',
      subject: defaultEvent ? `🏛️ You are Invited: ${defaultEvent.title}` : '',
      preheader: 'Exclusive invitation from the official exhibition management team.',
      headline: defaultEvent ? `Experience ${defaultEvent.title} Live` : 'Exclusive Exhibition Invitation',
      body: `We are delighted to extend a personal invitation to join us at this premier exhibition.\n\nConnect with leading international exhibitors, explore breakthrough product showcases, and participate in exclusive industry networking sessions.\n\nReserve your official pass today for complimentary express-badge entry.`,
      ctaText: 'Claim Your Exhibition Pass',
      ctaUrl: defaultEvent?.slug ? `https://visitexpo.in/event/${defaultEvent.slug}` : '',
      bannerUrl: defaultEvent?.bannerImage || defaultEvent?.featuredImage || '',
      templateType: 'modern'
    });
    setActiveComposeTab('compose');
    setIsComposeOpen(true);
  };

  // Toggle audience checkbox
  const handleToggleAudience = (type) => {
    setSelectedAudiences(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!formData.body) {
      Swal.fire({ icon: 'warning', title: 'Content Required', text: 'Please enter message body content.' });
      return;
    }

    setSendingTest(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(
        `${API_URL}/campaigns/send-test`,
        {
          eventId: selectedEventId,
          ...formData,
          testEmail: user?.email
        },
        { headers }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Test Email Dispatched!',
          html: `A live preview has been sent to <strong>${user?.email}</strong> via <code>promotion@client.visitexpo.in</code>. Please check your inbox.`,
          confirmButtonColor: '#4f46e5'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Test Dispatch Failed',
        text: err.response?.data?.error || err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Dispatch Live Campaign
  const handleDispatchCampaign = async () => {
    if (!selectedEventId) {
      Swal.fire({ icon: 'warning', title: 'Event Required', text: 'Please select an exhibition event.' });
      return;
    }
    if (!formData.title || !formData.body) {
      Swal.fire({ icon: 'warning', title: 'Content Required', text: 'Campaign title and body message are required.' });
      return;
    }

    const chosenAudienceTypes = Object.entries(selectedAudiences)
      .filter(([, checked]) => checked)
      .map(([type]) => type);

    if (chosenAudienceTypes.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Audience Required', text: 'Please select at least one target audience.' });
      return;
    }

    const recipients = audienceData.recipients || [];
    const recipientsTableHtml = recipients.length > 0
      ? `
        <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin: 12px 0 6px 0; text-transform: uppercase;">
          Attendees to receive this email (${recipients.length}):
        </div>
        <div style="max-height: 180px; overflow-y: auto; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 12px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: rgba(255,255,255,0.06); color: #94a3b8; font-size: 10px; text-transform: uppercase;">
                <th style="padding: 6px 10px;">#</th>
                <th style="padding: 6px 10px;">Attendee Name</th>
                <th style="padding: 6px 10px;">Email</th>
                <th style="padding: 6px 10px;">Audience</th>
              </tr>
            </thead>
            <tbody>
              ${recipients.map((r, i) => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 6px 10px; opacity: 0.6;">${i + 1}</td>
                  <td style="padding: 6px 10px; font-weight: bold; color: #ffffff;">${r.name || 'Valued Attendee'}</td>
                  <td style="padding: 6px 10px; font-family: monospace; color: #cbd5e1; font-size: 10px;">${r.email}</td>
                  <td style="padding: 6px 10px;">
                    <span style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 999px; text-transform: capitalize;">
                      ${r.audienceType}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

    const result = await Swal.fire({
      title: 'Dispatch Promotional Campaign?',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5;">
          <p style="margin-bottom: 6px;">
            You are about to broadcast this email to <strong>${audienceData.totalUnique} verified attendees</strong> via relay: <br>
            <code style="background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-size: 11px;">promotion@client.visitexpo.in</code>
          </p>
          ${recipientsTableHtml}
          <p style="font-size: 11px; color: #10b981; margin: 0;">
            ✓ Each attendee receives a personalized email with their name and official expo pass link.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Send to ${audienceData.totalUnique} Attendees`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5'
    });

    if (!result.isConfirmed) return;

    setDispatching(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(
        `${API_URL}/campaigns/send-promotion`,
        {
          eventId: selectedEventId,
          ...formData,
          audienceTypes: chosenAudienceTypes
        },
        { headers }
      );

      if (res.data?.success) {
        const deliveredRecipients = res.data?.campaign?.recipientsSummary || audienceData.recipients || [];
        const deliveredNamesHtml = deliveredRecipients.map((r, i) => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); text-align: left;">
            <td style="padding: 5px 8px; color: #10b981; font-weight: bold;">✓</td>
            <td style="padding: 5px 8px; font-weight: bold; color: #ffffff;">${r.name || 'Attendee'}</td>
            <td style="padding: 5px 8px; font-family: monospace; color: #94a3b8; font-size: 10px;">${r.email}</td>
            <td style="padding: 5px 8px; text-transform: capitalize; color: #34d399; font-size: 10px;">${r.audienceType}</td>
          </tr>
        `).join('');

        Swal.fire({
          icon: 'success',
          title: 'Promotion Dispatched Successfully!',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.5;">
              <p style="margin-bottom: 8px;">
                Campaign successfully delivered to <strong>${deliveredRecipients.length} attendees</strong> via <code>promotion@client.visitexpo.in</code>:
              </p>
              <div style="max-height: 160px; overflow-y: auto; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 10px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tbody>
                    ${deliveredNamesHtml}
                  </tbody>
                </table>
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Full logs recorded in your campaign history below.
              </p>
            </div>
          `,
          confirmButtonColor: '#4f46e5'
        });
        setIsComposeOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: err.response?.data?.error || err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setDispatching(false);
    }
  };

  // Open Campaign Audit Log Modal
  const handleOpenDetailModal = async (campaignId) => {
    setDetailLoading(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/campaigns/${campaignId}`, { headers });
      if (res.data?.success) {
        setSelectedCampaignDetail(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaign audit details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Loading State
  if (checkingAccess) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE A: ORGANIZER WITHOUT GROWTH PLAN (UPGRADE GATE)
  // --------------------------------------------------------------------------
  if (!hasGrowthPlan) {
    return (
      <div className="space-y-6">
        {/* Growth Plan Lock Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm">
          <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Exclusive Growth Plan Add-on</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                Unlock High-Impact Email Promotions to Leads, Visitors &amp; Followers
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reach verified high-intent exhibition attendees directly in their inbox with high deliverability via VisitExpo&apos;s authenticated email relay (<code className="text-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono">promotion@client.visitexpo.in</code>).
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                  🎯
                </div>
                <h3 className="text-xs font-bold text-foreground">Target 4 High-Intent Audiences</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Broadcast to verified CRM Leads, Registered Trade Visitors, Event Followers, and Interested Attendees with automatic email deduplication.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  📬
                </div>
                <h3 className="text-xs font-bold text-foreground">Verified SMTP Warm Relay</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dispatched via <strong>nexus.herosite.pro:465</strong> for pristine inbox deliverability, bypass spam folders, and guarantee brand reputation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  🎨
                </div>
                <h3 className="text-xs font-bold text-foreground">Branded Responsive Templates</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Modern email designs equipped with event banners, official verification tags, organizer contact cards, and custom Call-To-Action buttons.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  📊
                </div>
                <h3 className="text-xs font-bold text-foreground">Live Delivery &amp; Audit Logs</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Detailed recipient audit logs, test-email sandbox, and executive reporting synchronized directly with the platform admin console.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <span>Upgrade to Growth Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all"
              >
                <span>Inquire With VisitExpo Team</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE B: ORGANIZER WITH GROWTH PLAN (ACTIVE LAUNCHPAD)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Email Promotion Center
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Growth Plan Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Broadcast promotional email updates directly to verified leads, trade visitors, followers, and interested users via{' '}
            <code className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">promotion@client.visitexpo.in</code>.
          </p>
        </div>

        <button
          onClick={handleOpenCompose}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-primary text-black hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Email Promotion</span>
        </button>
      </div>

      {/* Filter and Event Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-foreground whitespace-nowrap">Exhibition Filter:</span>
          <div className="flex-1 max-w-sm">
            <SearchableSelect
              options={events.map(ev => ({
                value: ev._id,
                label: `${ev.title} (${ev.city || 'India'})`
              }))}
              value={selectedEventId}
              onChange={(val) => setSelectedEventId(val)}
              placeholder="Select exhibition event..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchCampaigns}
            disabled={loadingCampaigns}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingCampaigns ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Promotional Campaigns History Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span>Dispatched Email Promotions &amp; Logs</span>
          </h2>
          <span className="text-[11px] text-muted-foreground font-semibold">
            {campaigns.length} campaigns recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date Sent</th>
                <th className="py-3 px-4">Campaign Title &amp; Subject</th>
                <th className="py-3 px-4">Exhibition Event</th>
                <th className="py-3 px-4">Target Audiences</th>
                <th className="py-3 px-4 text-center">Delivered / Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingCampaigns ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    <span>Loading promotional campaigns...</span>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted-foreground">
                    <Send className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-bold text-foreground">No email promotions launched yet</p>
                    <p className="text-[11px] mt-1">Click &quot;Create New Email Promotion&quot; above to reach your leads, visitors, and followers.</p>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const sentDate = c.sentAt ? new Date(c.sentAt) : new Date(c.createdAt);
                  const targeted = c.targetAudience?.recipientCount || c.sentCount || 0;
                  const delivered = c.deliveredCount || (c.status === 'completed' ? targeted : 0);
                  const successRate = targeted > 0 ? Math.round((delivered / targeted) * 100) : 100;

                  return (
                    <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {sentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Title & Subject */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="font-bold text-foreground truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate" title={c.content?.subject}>
                          ✉️ {c.content?.subject || c.title}
                        </div>
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="font-semibold text-foreground truncate">
                          {c.event?.title || 'Selected Event'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          📍 {c.event?.city || 'India'}
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(c.targetAudience?.audienceTypes || ['leads', 'visitors']).map((type) => (
                            <span
                              key={type}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border capitalize"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Delivered / Total */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-foreground">
                          {delivered} <span className="text-muted-foreground font-normal">/ {targeted}</span>
                        </div>
                        <div className="w-16 bg-secondary rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${successRate >= 90 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : c.status === 'sending'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                          {c.status === 'completed' ? 'Delivered' : c.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetailModal(c._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Logs</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* COMPOSE PROMOTION MODAL & EMAIL DESIGNER */}
      {/* ====================================================================== */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Live Dispatching Overlay with Attendee Names */}
            {dispatching && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-150">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Send className="h-8 w-8 animate-pulse text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Broadcasting Promotional Emails...</h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Relay: promotion@client.visitexpo.in &bull; nexus.herosite.pro:465
                  </p>
                </div>
                <div className="w-full max-w-md bg-secondary/80 border border-border rounded-2xl p-4 text-left max-h-56 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/50">
                    <span>Sending To Attendees:</span>
                    <span className="text-indigo-400">{audienceData.recipients?.length || 0} Total</span>
                  </div>
                  {audienceData.recipients?.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{r.name}</span>
                        <span className="text-muted-foreground text-[11px] truncate">({r.email})</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize shrink-0 ml-2">
                        {r.audienceType}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span>Delivering personalized invitations with safe rate-limiting...</span>
                </div>
              </div>
            )}
            {/* Modal Header */}
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Growth Plan Email Promotion
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Sender: &quot;VisitExpo Promotions&quot; &lt;promotion@client.visitexpo.in&gt;
                  </span>
                </div>
                <h2 className="text-lg font-black text-foreground">
                  Compose Promotional Email Campaign
                </h2>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Compose Tabs (Editor vs Preview) */}
            <div className="flex items-center justify-between px-6 border-b border-border bg-secondary/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveComposeTab('compose')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    activeComposeTab === 'compose'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  1. Audience &amp; Content Designer
                </button>
                <button
                  onClick={() => setActiveComposeTab('preview')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    activeComposeTab === 'preview'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  2. Rendered Email Preview
                </button>
              </div>

              {activeComposeTab === 'preview' && (
                <div className="flex items-center gap-1.5 py-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                      previewMode === 'desktop'
                        ? 'bg-secondary text-foreground border-border'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                      previewMode === 'mobile'
                        ? 'bg-secondary text-foreground border-border'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {activeComposeTab === 'compose' ? (
                <>
                  {/* Event & Audience Selector Box */}
                  <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-400" />
                        <span>Target Audience Segmentation</span>
                      </span>
                      {audienceData.loading ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Calculating reach...
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          ⚡ Total Reach: {audienceData.totalUnique} Unique Verified Attendees
                        </span>
                      )}
                    </div>

                    {/* Audience Segment Checkboxes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        selectedAudiences.leads
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Event Leads</span>
                          <input
                            type="checkbox"
                            checked={selectedAudiences.leads}
                            onChange={() => handleToggleAudience('leads')}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-2">
                          {audienceData.breakdown.leads} available
                        </span>
                      </label>

                      <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        selectedAudiences.visitors
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Trade Visitors</span>
                          <input
                            type="checkbox"
                            checked={selectedAudiences.visitors}
                            onChange={() => handleToggleAudience('visitors')}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-2">
                          {audienceData.breakdown.visitors} available
                        </span>
                      </label>

                      <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        selectedAudiences.followers
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Event Followers</span>
                          <input
                            type="checkbox"
                            checked={selectedAudiences.followers}
                            onChange={() => handleToggleAudience('followers')}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-2">
                          {audienceData.breakdown.followers} available
                        </span>
                      </label>

                      <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        selectedAudiences.interested
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Interested Attendees</span>
                          <input
                            type="checkbox"
                            checked={selectedAudiences.interested}
                            onChange={() => handleToggleAudience('interested')}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-2">
                          {audienceData.breakdown.interested} available
                        </span>
                      </label>
                    </div>

                    {/* Target Recipients List with Attendee Names */}
                    <div className="pt-3 border-t border-border/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-400" />
                          <span className="font-bold text-foreground text-xs">
                            Attendees To Receive This Promotional Email ({audienceData.recipients?.length || 0})
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            (Showing personalized attendee names &amp; emails)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              value={recipientSearchTerm}
                              onChange={(e) => setRecipientSearchTerm(e.target.value)}
                              placeholder="Search attendee by name..."
                              className="bg-secondary/70 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRecipientsList(!showRecipientsList)}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>{showRecipientsList ? 'Hide Names' : 'Show Names'}</span>
                            {showRecipientsList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {showRecipientsList && (
                        <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
                          {audienceData.loading ? (
                            <div className="py-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                              <span>Loading recipient attendee names...</span>
                            </div>
                          ) : filteredRecipients.length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground">
                              <p className="font-semibold text-foreground">No attendees found</p>
                              <p className="text-[11px] mt-0.5">
                                {recipientSearchTerm ? 'No attendees match your search query.' : 'Please select at least one audience segment above.'}
                              </p>
                            </div>
                          ) : (
                            <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
                              {filteredRecipients.map((r, idx) => {
                                const initials = (r.name || 'Attendee')
                                  .split(' ')
                                  .map(n => n[0])
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase() || 'A';

                                const badgeStyle = {
                                  lead: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                  visitor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                  follower: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                  interested: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }[r.audienceType] || 'bg-secondary text-muted-foreground border-border';

                                return (
                                  <div
                                    key={idx}
                                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="h-7 w-7 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-indigo-500/30">
                                        {initials}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-foreground text-xs truncate flex items-center gap-1.5">
                                          <span>{r.name || 'Valued Attendee'}</span>
                                          {r.company && (
                                            <span className="text-[10px] font-normal text-muted-foreground truncate">
                                              &bull; {r.company}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                                          {r.email}
                                          {r.designation && (
                                            <span className="font-sans ml-1 text-muted-foreground/80">({r.designation})</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                        {r.audienceType}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Internal Campaign Title:
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. VIP Invitation for Auto Expo 2026"
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Email Subject Line:
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. 🏛️ You are cordially invited to..."
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Card Headline:
                      </label>
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="e.g. Experience Global Innovation Live"
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Preheader / Inbox Snippet:
                      </label>
                      <input
                        type="text"
                        value={formData.preheader}
                        onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                        placeholder="Short teaser shown in email client previews"
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Banner URL & Action */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Cover Banner Image URL:
                      </label>
                      {currentEvent?.bannerImage && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bannerUrl: currentEvent.bannerImage })}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Use Event Banner
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      placeholder="https://... (Cloudinary or image link)"
                      className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Promotional Message Body:
                    </label>
                    <textarea
                      rows={6}
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="Write your invitation message... (Separate paragraphs with double enters)"
                      className="w-full bg-secondary/60 border border-border rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Call to Action Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        CTA Button Label:
                      </label>
                      <input
                        type="text"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        placeholder="e.g. Claim Your Pass"
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        CTA Target URL:
                      </label>
                      <input
                        type="text"
                        value={formData.ctaUrl}
                        onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                        placeholder="https://visitexpo.in/event/... or ticket pass link"
                        className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* LIVE HTML PREVIEW TAB */
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground text-[11px]">
                    Viewing responsive email preview sent from <strong>&quot;VisitExpo Promotions&quot; &lt;promotion@client.visitexpo.in&gt;</strong>
                  </div>

                  <div className={`mx-auto bg-card border border-border rounded-3xl overflow-hidden shadow-2xl transition-all ${
                    previewMode === 'mobile' ? 'max-w-sm' : 'max-w-xl'
                  }`}>
                    {/* Email Header Bar */}
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-4 text-white flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20">
                        ⚡ VisitExpo Verified
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">
                        VIP Invited Attendee
                      </span>
                    </div>

                    {/* Banner */}
                    {formData.bannerUrl && (
                      <img
                        src={formData.bannerUrl}
                        alt="Preview Banner"
                        className="w-full h-44 object-cover"
                      />
                    )}

                    {/* Email Body Preview */}
                    <div className="p-6 space-y-4">
                      <div className="text-xs font-bold text-muted-foreground">
                        Hello Attendee,
                      </div>
                      <h2 className="text-xl font-black text-foreground leading-snug">
                        {formData.headline || formData.subject || 'Exhibition Invitation'}
                      </h2>

                      <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {formData.body}
                      </div>

                      {/* Event Card in Email */}
                      {currentEvent && (
                        <div className="p-3.5 rounded-xl bg-secondary/60 border border-border space-y-1">
                          <h4 className="font-bold text-foreground">🏛️ {currentEvent.title}</h4>
                          <div className="text-[11px] text-muted-foreground">
                            📍 {currentEvent.city || 'India'} &bull; 📅 {currentEvent.dates || 'Upcoming Expo'}
                          </div>
                        </div>
                      )}

                      {/* Button */}
                      <div className="pt-4 text-center">
                        <span className="inline-block px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30">
                          {formData.ctaText || 'Claim Passes'} &rarr;
                        </span>
                      </div>

                      {/* Organizer Signature */}
                      <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
                        <div className="font-bold text-foreground">{user?.name}</div>
                        <div>Official Verified Organizer on VisitExpo</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Controls Footer */}
            <div className="p-4 border-t border-border bg-secondary/30 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest || dispatching}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors disabled:opacity-50"
              >
                {sendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                ) : (
                  <Mail className="h-4 w-4 text-indigo-400" />
                )}
                <span>Send Test Preview to Me</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDispatchCampaign}
                  disabled={dispatching || sendingTest || audienceData.totalUnique === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {dispatching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Broadcast to {audienceData.totalUnique} Attendees</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* CAMPAIGN DETAIL & RECIPIENTS AUDIT MODAL */}
      {/* ====================================================================== */}
      {selectedCampaignDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">
                  Promotion Audit &amp; Delivery Log
                </span>
                <h3 className="text-lg font-black text-foreground">
                  {selectedCampaignDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCampaignDetail(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-muted-foreground text-[10px]">Delivered</span>
                  <span className="text-lg font-black text-emerald-400 block mt-0.5">
                    {selectedCampaignDetail.deliveredCount || selectedCampaignDetail.sentCount || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-muted-foreground text-[10px]">Failed</span>
                  <span className="text-lg font-black text-red-400 block mt-0.5">
                    {selectedCampaignDetail.failedCount || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-muted-foreground text-[10px]">Sender Email</span>
                  <span className="text-[11px] font-mono font-bold text-foreground block mt-0.5 truncate">
                    {selectedCampaignDetail.senderEmail || 'promotion@client.visitexpo.in'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-muted-foreground text-[10px]">Status</span>
                  <span className="text-xs font-bold text-emerald-400 block mt-0.5 capitalize">
                    {selectedCampaignDetail.status}
                  </span>
                </div>
              </div>

              {/* Recipient list */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">Recipients Dispatched:</h4>
                <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground font-bold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Audience</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(!selectedCampaignDetail.recipientsLog || selectedCampaignDetail.recipientsLog.length === 0) ? (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-muted-foreground">
                            No individual recipient logs found.
                          </td>
                        </tr>
                      ) : (
                        selectedCampaignDetail.recipientsLog.map((r, idx) => (
                          <tr key={idx} className="hover:bg-secondary/20">
                            <td className="py-2 px-3 font-semibold text-foreground">{r.name || 'Attendee'}</td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">{r.email}</td>
                            <td className="py-2 px-3 capitalize">{r.audienceType}</td>
                            <td className="py-2 px-3 text-right">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                r.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {r.status === 'sent' ? 'Delivered' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex justify-end">
              <button
                onClick={() => setSelectedCampaignDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
