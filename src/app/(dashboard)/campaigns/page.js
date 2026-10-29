'use client';

/**
 * @file page.js (Campaigns Overview)
 * @description Marketing campaigns screen for organizers to launch mock broadcasts (Email, WhatsApp, SMS) and view real-time open/click rates.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Mail,
  Send,
  Plus,
  Users,
  BarChart3,
  TrendingUp,
  Trash2,
  Clock,
  X,
  Loader2,
  MessageSquare,
  Smartphone,
  AlertCircle
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const CAMPAIGN_TITLE_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.,&'’()\-/#]*$/u;
const CAMPAIGN_SUBJECT_PATTERN = /^[\p{L}\p{M}\p{N}\s.,!?&'’"():;\-/#@+]+$/u;

export default function CampaignsPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form State
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    channel: 'email',
    subject: '',
    body: ''
  });

  const resetCampaignForm = () => {
    setNewCampaign({
      title: '',
      channel: 'email',
      subject: '',
      body: ''
    });
    setFormErrors({});
  };

  const handleOpenCreateModal = () => {
    resetCampaignForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCampaignForm();
  };

  // 1. Fetch Events with instant sessionStorage caching
  useEffect(() => {
    const userId = user?._id || user?.id || 'anonymous';
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
        const res = await axios.get(buildDashboardEventsUrl(API_URL, user), { headers });
        if (res.data && res.data.success && res.data.data.docs) {
          const rawEvents = res.data.data.docs;
          const userOrgId = user?.organization?._id || user?.organization;

          const sorted = [...rawEvents].sort((a, b) => {
            const aOrg = a.organizer?._id || a.organizer;
            const bOrg = b.organizer?._id || b.organizer;
            const aIsMine = (userOrgId && aOrg?.toString() === userOrgId?.toString()) || (userId && a.claimedBy?.toString() === userId?.toString());
            const bIsMine = (userOrgId && bOrg?.toString() === userOrgId?.toString()) || (userId && b.claimedBy?.toString() === userId?.toString());

            if (aIsMine && !bIsMine) return -1;
            if (!aIsMine && bIsMine) return 1;
            return 0;
          });

          setEvents(sorted);
          if (sorted.length > 0) {
            setSelectedEventId(prev => prev || sorted[0]._id);
          }

          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
            }
          } catch (e) {
            console.warn('Could not cache events:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load events', err);
        if (events.length === 0) {
          setError('Could not connect to API server. Ensure backend is running.');
        }
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [user, accessToken]);

  // 2. Fetch Campaigns
  const fetchCampaigns = async (signal) => {
    if (!selectedEventId) {
      setCampaigns([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/campaigns`, {
        params: { eventId: selectedEventId },
        headers,
        signal,
        timeout: 15000
      });
      if (res.data && res.data.success) {
        setCampaigns(res.data.data || []);
      } else {
        setError('Could not retrieve campaigns. Please try again.');
      }
    } catch (err) {
      if (signal?.aborted || axios.isCancel(err)) return;
      console.error('Error fetching campaigns', err);
      setError(
        err.code === 'ECONNABORTED'
          ? 'Loading campaigns timed out. Check your connection and try again.'
          : 'Could not retrieve campaigns. Check your connection and try again.'
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchCampaigns(controller.signal);
    return () => controller.abort();
  }, [selectedEventId, accessToken]);

  // Field validation for Campaign Draft
  const validateCampaignForm = (data) => {
    const errors = {};

    // 1. Campaign Title Validation
    const trimmedTitle = (data.title || '').trim();
    if (!trimmedTitle) {
      errors.title = 'Campaign Title is required.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Campaign Title must be at least 3 characters.';
    } else if (trimmedTitle.length > 100) {
      errors.title = 'Campaign Title cannot exceed 100 characters.';
    } else if (!CAMPAIGN_TITLE_PATTERN.test(trimmedTitle)) {
      errors.title = 'Use letters, numbers, spaces, and common punctuation only in the campaign title.';
    } else if (!/[\p{L}\p{N}]/u.test(trimmedTitle)) {
      errors.title = 'Campaign Title must contain at least one letter or number.';
    }

    // 2. Email Subject Line Validation (when channel is email)
    if (data.channel === 'email') {
      const trimmedSubject = (data.subject || '').trim();
      if (trimmedSubject) {
        if (trimmedSubject.length < 3) {
          errors.subject = 'Subject Line must be at least 3 characters.';
        } else if (trimmedSubject.length > 150) {
          errors.subject = 'Subject Line cannot exceed 150 characters.';
        } else if (!CAMPAIGN_SUBJECT_PATTERN.test(trimmedSubject)) {
          errors.subject = 'Use letters, numbers, spaces, and common punctuation only in the subject line.';
        } else if (!/[\p{L}\p{N}]/u.test(trimmedSubject)) {
          errors.subject = 'Subject Line must contain at least one letter or number.';
        }
      }
    }

    // 3. Message Body Validation
    const trimmedBody = (data.body || '').trim();
    if (!trimmedBody) {
      errors.body = 'Message Body content is required.';
    } else if (trimmedBody.length < 10) {
      errors.body = 'Message Body must be at least 10 characters.';
    } else if (trimmedBody.length > 3000) {
      errors.body = 'Message Body cannot exceed 3000 characters.';
    } else if (!/[\p{L}\p{N}]/u.test(trimmedBody)) {
      errors.body = 'Message Body must contain meaningful text, not only special characters.';
    } else if (/<[a-z][\s\S]*>/i.test(trimmedBody)) {
      errors.body = 'HTML tags are not allowed in the message body.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // 3. Create Campaign Draft
  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    const { errors } = validateCampaignForm(newCampaign);
    const hasSelectedEvent = events.some((event) => String(event._id) === String(selectedEventId));
    if (!hasSelectedEvent) {
      errors.eventId = events.length
        ? 'Select an active expo event before saving the campaign draft.'
        : 'No active expo events are available. Create or activate an event first.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showSweetWarning('Please fix the validation errors in the form.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/campaigns`,
        {
          ...newCampaign,
          title: newCampaign.title.trim(),
          subject: newCampaign.subject.trim(),
          body: newCampaign.body.trim(),
          eventId: selectedEventId
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setCampaigns(prev => [res.data.campaign, ...prev]);
        showSweetSuccess('Campaign draft saved successfully!');
        handleCloseCreateModal();
      }
    } catch (err) {
      console.error('Create campaign failed', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save campaign draft.';
      showSweetError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Send Broadcast (Simulated)
  const handleSendBroadcast = async (campaignId) => {
    setBroadcastingId(campaignId);
    try {
      const res = await axios.post(
        `${API_URL}/campaigns/${campaignId}/send`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setCampaigns(prev => prev.map(c => (c._id === campaignId ? res.data.campaign : c)));
        showSweetSuccess('Campaign broadcast simulation initiated!');
      }
    } catch (err) {
      console.error('Send broadcast failed', err);
      showSweetError('Simulated broadcast failed.');
    } finally {
      setBroadcastingId(null);
    }
  };

  // 5. Delete Campaign
  const handleDeleteCampaign = async (campaignId) => {
    const confirmed = await showSweetConfirm(
      'Delete Campaign?',
      'Are you sure you want to delete this campaign? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_URL}/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setCampaigns(prev => prev.filter(c => c._id !== campaignId));
        showSweetSuccess('Campaign deleted successfully.');
      }
    } catch (err) {
      console.error('Delete campaign failed', err);
      showSweetError('Failed to delete campaign.');
    }
  };

  // Aggregate Metrics
  const totalSent = campaigns.filter(c => c.status === 'completed').length;
  const totalAudience = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const avgOpens = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.openCount || 0), 0);
  const avgClicks = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.clickCount || 0), 0);

  const openRate = totalAudience > 0 ? ((avgOpens / totalAudience) * 100).toFixed(1) : '0';
  const clickRate = avgOpens > 0 ? ((avgClicks / avgOpens) * 100).toFixed(1) : '0';
  const hasSelectedEvent = events.some((event) => String(event._id) === String(selectedEventId));

  return (
    <div className="space-y-6">
      {/* Header Dropdown & Actions Card */}
      <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Marketing Campaigns
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Multi-Channel Broadcasts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Dispatch announcements across Email, WhatsApp, or SMS, and track engagement statistics in real time.
            </p>
          </div>
        </div>

        {/* Right Controls: Event Selector & Create Campaign Button */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="w-full sm:w-[260px] md:w-[280px]">
            <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Active Expo Edition</span>
              {events.length > 0 && (
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {events.length} edition{events.length > 1 ? 's' : ''}
                </span>
              )}
            </label>
            <SearchableSelect
              options={events.map((evt) => ({ value: evt._id, label: evt.title }))}
              value={selectedEventId}
              onChange={(val) => setSelectedEventId(val)}
              placeholder={events.length === 0 ? 'No Active Editions' : 'Select active event...'}
              searchPlaceholder="Search active event..."
              className="h-10 text-xs font-medium rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition-all shadow-xs hover:shadow cursor-pointer btn-press active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign Statistics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Sent Campaigns', value: totalSent, desc: 'Successfully dispatched broadcasts', color: 'text-blue-500' },
          { title: 'Audience Reach', value: totalAudience, desc: 'Aggregated unique targets reached', color: 'text-indigo-500' },
          { title: 'Average Open Rate', value: `${openRate}%`, desc: 'Average open/read logs', color: 'text-emerald-500' },
          { title: 'Average Click Rate (CTR)', value: `${clickRate}%`, desc: 'Average link interaction records', color: 'text-pink-500' }
        ].map((kpi, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Logs Grid */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Campaign History</h3>
          <p className="text-xs text-muted-foreground">List of dispatched broadcasts and current drafts.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching campaigns list...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Campaigns couldn&apos;t be loaded</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchCampaigns()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Try again
            </button>
          </div>
        ) : !selectedEventId ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-2 text-muted-foreground">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Select an active expo edition</p>
            <p className="text-sm">Choose an event above to view its campaign history.</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-2">
            <Mail className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-xs font-semibold">No campaigns drafted for this event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Campaign Title</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Performance Analytics</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => {
                  const hasSent = c.status === 'completed';
                  return (
                    <tr key={c._id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{c.title}</p>
                        <span className="text-xs text-muted-foreground truncate max-w-xs block">
                          {c.content.subject ? `Subject: ${c.content.subject}` : c.content.body}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className="inline-flex items-center gap-1">
                          {c.channel === 'email' ? (
                            <Mail className="h-4 w-4 text-blue-500" />
                          ) : c.channel === 'whatsapp' ? (
                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-indigo-500" />
                          )}
                          {c.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : c.status === 'sending'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasSent ? (
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div>
                              <p className="font-semibold text-foreground font-mono">{c.sentCount}</p>
                              <span className="text-[10px] text-muted-foreground">Sent</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground font-mono">{c.openCount}</p>
                              <span className="text-[10px] text-muted-foreground">Opened</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground font-mono">{c.clickCount}</p>
                              <span className="text-[10px] text-muted-foreground">Clicked</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground font-mono text-emerald-500">{c.conversionCount}</p>
                              <span className="text-[10px] text-muted-foreground">Conversions</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-muted-foreground italic">
                            Stats populate after broadcast is sent.
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!hasSent && (
                            <button
                              disabled={broadcastingId === c._id}
                              onClick={() => handleSendBroadcast(c._id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-primary hover:bg-primary/95 px-2.5 py-1 rounded shadow-sm disabled:opacity-60"
                            >
                              {broadcastingId === c._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCampaign(c._id)}
                            className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseCreateModal}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Create Campaign Draft</h3>

            <form onSubmit={handleCreateCampaign} noValidate className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Active Expo Event <span className="text-rose-500">*</span>
                </label>
                {events.length > 0 ? (
                  <SearchableSelect
                    options={events.map((event) => ({
                      value: event._id,
                      label: event.title
                    }))}
                    value={selectedEventId}
                    onChange={(value) => {
                      setSelectedEventId(value);
                      setFormErrors((prev) => ({
                        ...prev,
                        eventId: value ? '' : 'Select an active expo event before saving the campaign draft.'
                      }));
                    }}
                    placeholder="Select an active expo event..."
                    searchPlaceholder="Search active events..."
                    allowClear
                    error={formErrors.eventId}
                    className="rounded-lg text-sm"
                  />
                ) : eventsLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground" role="status">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading active expo events...</span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900" role="status">
                    No active expo events are available. Create or activate an event before creating a campaign draft.
                  </div>
                )}
                {formErrors.eventId && events.length > 0 && (
                  <p id="campaign-event-error" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.eventId}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Campaign Title <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${newCampaign.title.length > 100 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                    {newCampaign.title.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={newCampaign.title}
                  maxLength={100}
                  required
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCampaign(prev => ({ ...prev, title: val }));
                    if (formErrors.title) {
                      setFormErrors(prev => ({
                        ...prev,
                        title: validateCampaignForm({ ...newCampaign, title: val }).errors.title || ''
                      }));
                    }
                  }}
                  onBlur={() => {
                    setFormErrors(prev => ({
                      ...prev,
                      title: validateCampaignForm(newCampaign).errors.title || ''
                    }));
                  }}
                  aria-invalid={Boolean(formErrors.title)}
                  aria-describedby={formErrors.title ? 'campaign-title-error' : undefined}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none transition-all ${
                    formErrors.title
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                      : 'border-border focus:ring-2 focus:ring-primary'
                  }`}
                  placeholder="E.g. Keynote Speaker Announcement"
                />
                {formErrors.title && (
                  <p id="campaign-title-error" className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.title}</span>
                  </p>
                )}
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Channel</label>
                  <SearchableSelect
                    options={[
                      { value: 'email', label: 'Email Broadcast' },
                      { value: 'whatsapp', label: 'WhatsApp Message' },
                      { value: 'sms', label: 'SMS Text' }
                    ]}
                    value={newCampaign.channel}
                    onChange={(val) => {
                      setNewCampaign(prev => ({ ...prev, channel: val }));
                      if (val !== 'email' && formErrors.subject) {
                        setFormErrors(prev => ({ ...prev, subject: '' }));
                      }
                    }}
                    placeholder="Select broadcast channel..."
                    searchPlaceholder="Search channel..."
                  />
                </div>
              </div>

              {newCampaign.channel === 'email' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-muted-foreground uppercase">
                      Subject Line
                    </label>
                    <span className={`text-[10px] font-mono ${newCampaign.subject.length > 150 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                      {newCampaign.subject.length}/150
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newCampaign.subject}
                    maxLength={150}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCampaign(prev => ({ ...prev, subject: val }));
                      if (formErrors.subject) {
                        setFormErrors(prev => ({
                          ...prev,
                          subject: validateCampaignForm({ ...newCampaign, subject: val }).errors.subject || ''
                        }));
                      }
                    }}
                    onBlur={() => {
                      setFormErrors(prev => ({
                        ...prev,
                        subject: validateCampaignForm(newCampaign).errors.subject || ''
                      }));
                    }}
                    aria-invalid={Boolean(formErrors.subject)}
                    aria-describedby={formErrors.subject ? 'campaign-subject-error' : undefined}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none transition-all ${
                      formErrors.subject
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                    placeholder="E.g. Meet our keynote speakers at CP!"
                  />
                  {formErrors.subject && (
                    <p id="campaign-subject-error" className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{formErrors.subject}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${newCampaign.body.length > 3000 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                    {newCampaign.body.length}/3000
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={newCampaign.body}
                  maxLength={3000}
                  required
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCampaign(prev => ({ ...prev, body: val }));
                    if (formErrors.body) {
                      setFormErrors(prev => ({
                        ...prev,
                        body: validateCampaignForm({ ...newCampaign, body: val }).errors.body || ''
                      }));
                    }
                  }}
                  onBlur={() => {
                    setFormErrors(prev => ({
                      ...prev,
                      body: validateCampaignForm(newCampaign).errors.body || ''
                    }));
                  }}
                  aria-invalid={Boolean(formErrors.body)}
                  aria-describedby={formErrors.body ? 'campaign-body-error' : undefined}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none resize-none transition-all placeholder:text-muted-foreground ${
                    formErrors.body
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                      : 'border-border focus:ring-2 focus:ring-primary'
                  }`}
                  placeholder="Enter details or announcements body content..."
                />
                {formErrors.body && (
                  <p id="campaign-body-error" className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.body}</span>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCloseCreateModal}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasSelectedEvent}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-4 py-2 text-sm transition-all shadow-sm cursor-pointer btn-press active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Draft...</span>
                    </>
                  ) : (
                    <span>Save Draft</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
