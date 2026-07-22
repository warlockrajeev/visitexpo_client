'use client';

/**
 * @file page.js (Campaigns Overview)
 * @description Marketing campaigns screen for organizers to launch mock broadcasts (Email, WhatsApp, SMS) and view real-time open/click rates.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Mail,
  Send,
  Plus,
  Users,
  BarChart3,
  TrendingUp,
  Sparkles,
  Trash2,
  Clock,
  X,
  Loader2,
  MessageSquare,
  Smartphone
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CampaignsPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState(null);

  // Form State
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    channel: 'email',
    subject: '',
    body: ''
  });

  // 1. Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(`${API_URL}/events?limit=1000&all=true`, { headers });
        if (res.data && res.data.success && res.data.data.docs) {
          const rawEvents = res.data.data.docs;
          const userOrgId = user?.organization?._id || user?.organization;
          const userId = user?._id || user?.id;

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
            setSelectedEventId(sorted[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load events', err);
        setError('Could not connect to API server. Ensure backend is running.');
      }
    };
    fetchEvents();
  }, [user, accessToken]);

  // 2. Fetch Campaigns
  const fetchCampaigns = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/campaigns`, {
        params: { eventId: selectedEventId },
        headers
      });
      if (res.data && res.data.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching campaigns', err);
      setError('Could not retrieve campaigns. Verify backend setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedEventId, accessToken]);

  // 3. Create Campaign Draft
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.body) {
      alert('Campaign Title and Body content are required.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/campaigns`,
        { ...newCampaign, eventId: selectedEventId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setCampaigns(prev => [res.data.campaign, ...prev]);
        setIsCreateModalOpen(false);
        setNewCampaign({
          title: '',
          channel: 'email',
          subject: '',
          body: ''
        });
      }
    } catch (err) {
      console.error('Create campaign failed', err);
      alert('Failed to save campaign draft');
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
      }
    } catch (err) {
      console.error('Send broadcast failed', err);
      alert('Simulated broadcast failed');
    } finally {
      setBroadcastingId(null);
    }
  };

  // 5. Delete Campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await axios.delete(`${API_URL}/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setCampaigns(prev => prev.filter(c => c._id !== campaignId));
      }
    } catch (err) {
      console.error('Delete campaign failed', err);
      alert('Failed to delete campaign');
    }
  };

  // Aggregate Metrics
  const totalSent = campaigns.filter(c => c.status === 'completed').length;
  const totalAudience = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const avgOpens = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.openCount || 0), 0);
  const avgClicks = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.clickCount || 0), 0);

  const openRate = totalAudience > 0 ? ((avgOpens / totalAudience) * 100).toFixed(1) : '0';
  const clickRate = avgOpens > 0 ? ((avgClicks / avgOpens) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header Dropdown & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Marketing Campaigns
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch announcements via email, WhatsApp, or SMS, and track engagement statistics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Active Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-60"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4" /> Create Campaign
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Create Campaign Draft</h3>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="E.g. Keynote Speaker Announcement"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Channel</label>
                  <select
                    value={newCampaign.channel}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, channel: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="email">Email Broadcast</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="sms">SMS Text</option>
                  </select>
                </div>
              </div>

              {newCampaign.channel === 'email' && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Subject Line</label>
                  <input
                    type="text"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g. Meet our keynote speakers at CP!"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={newCampaign.body}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground"
                  placeholder="Enter details or announcements body content..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
