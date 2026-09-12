'use client';

/**
 * @file page.js (Lead CRM)
 * @description Lead CRM Pipeline page for event organizers to track conversion, update statuses, score leads, and log timelines.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Target,
  Search,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  TrendingUp,
  User,
  Clock,
  MessageSquare,
  ChevronRight,
  ClipboardList,
  UserCheck,
  Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LeadsCRMPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, new, contacted, qualified, proposal, won, lost

  // Sidebar / Detail panel state
  const [selectedLead, setSelectedLead] = useState(null);
  const [newActivityContent, setNewActivityContent] = useState('');
  const [newActivityType, setNewActivityType] = useState('note'); // note, call, meeting, email
  
  // Follow Up Form state
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

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

  // 2. Fetch Leads
  const fetchLeads = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/leads`, {
        params: { eventId: selectedEventId, limit: 100 },
        headers
      });
      if (res.data && res.data.success) {
        setLeads(res.data.data.docs || []);
      }
    } catch (err) {
      console.error('Failed to load leads', err);
      setError('Error fetching CRM leads. Ensure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedEventId, accessToken]);

  // 3. Update Lead Status / Score / Agent
  const handleUpdateLead = async (leadId, fields) => {
    try {
      const res = await axios.put(`${API_URL}/leads/${leadId}`, fields, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        // Refresh local leads list
        setLeads(prev => prev.map(l => (l._id === leadId ? res.data.lead : l)));
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead(res.data.lead);
        }
      }
    } catch (err) {
      console.error('Error updating lead status', err);
      alert('Failed to update lead');
    }
  };

  // 4. Log custom activity note
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityContent.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/leads/${selectedLead._id}/activity`,
        { type: newActivityType, content: newActivityContent.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        // Update local logs
        setLeads(prev => prev.map(l => (l._id === selectedLead._id ? res.data.lead : l)));
        setSelectedLead(res.data.lead);
        setNewActivityContent('');
      }
    } catch (err) {
      console.error('Error adding activity', err);
      alert('Failed to add note');
    }
  };

  // 5. Schedule follow-up task
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpDate) {
      alert('Please fill out follow-up title and date');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/leads/${selectedLead._id}/followup`,
        { title: followUpTitle.trim(), dateTime: followUpDate, notes: followUpNotes.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        // Update local logs
        setLeads(prev => prev.map(l => (l._id === selectedLead._id ? res.data.lead : l)));
        setSelectedLead(res.data.lead);
        setFollowUpTitle('');
        setFollowUpDate('');
        setFollowUpNotes('');
      }
    } catch (err) {
      console.error('Error adding follow-up', err);
      alert('Failed to schedule follow-up');
    }
  };

  // Computed Values for funnel stats
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const wonLeads = leads.filter(l => l.status === 'won').length;

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && l.status === statusFilter;
  });

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Banner / Control section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Lead CRM Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Nurture registrants, assign deals to sales agents, record timeline logs, and monitor lead scores.
          </p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Active Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-64"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Funnel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Inflow Leads', value: totalLeads, desc: 'Self-registered and checkout leads', color: 'text-blue-500' },
          { title: 'Contacted Leads', value: contactedLeads, desc: 'Outreached by sales representatives', color: 'text-indigo-500' },
          { title: 'Qualified Potentials', value: qualifiedLeads, desc: 'Highly interested high-score deals', color: 'text-amber-500' },
          { title: 'Closed Won (Signed)', value: wonLeads, desc: 'Successfully onboarded partnerships', color: 'text-emerald-500' }
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

      {/* Main CRM Grid (Split-screen if lead selected) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Section: Leads list */}
        <div className={`flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden w-full ${selectedLead ? 'lg:max-w-[55%]' : ''}`}>
          {/* Header filters */}
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 w-fit overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'new', label: 'New' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'qualified', label: 'Qualified' },
                { id: 'proposal', label: 'Proposal' },
                { id: 'won', label: 'Won' },
                { id: 'lost', label: 'Lost' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Table display */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Fetching CRM database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-2">
              <Target className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="font-semibold text-foreground">No Leads Found</h3>
              <p className="text-sm max-w-sm">No sales leads match your filter parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-4">Lead</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Score</th>
                    <th className="px-5 py-4">Stage</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.map((ld) => (
                    <tr
                      key={ld._id}
                      onClick={() => setSelectedLead(ld)}
                      className={`hover:bg-secondary/40 cursor-pointer transition-colors ${
                        selectedLead?._id === ld._id ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{ld.name}</p>
                        <span className="text-xs text-muted-foreground">{ld.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{ld.company || 'Individual'}</p>
                        <p className="text-[10px] text-muted-foreground">{ld.designation || 'Visitor'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold font-mono ${
                          ld.leadScore >= 75
                            ? 'bg-red-500/10 text-red-500'
                            : ld.leadScore >= 45
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          <TrendingUp className="h-3 w-3" /> {ld.leadScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ld.status === 'won'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : ld.status === 'lost'
                            ? 'bg-destructive/10 text-destructive'
                            : ld.status === 'qualified'
                            ? 'bg-amber-500/10 text-amber-500'
                            : ld.status === 'proposal'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {ld.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Section: CRM Detail Workspace */}
        {selectedLead && (
          <div className="flex-1 w-full rounded-xl border border-border bg-card shadow-lg p-6 space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedLead.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {selectedLead.email} | <Phone className="h-3 w-3" /> {selectedLead.phone || 'No phone'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {selectedLead.company || 'Individual'} ({selectedLead.designation || 'Visitor'}) - {selectedLead.country || 'India'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-secondary rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick configuration settings */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 bg-muted/10 p-4 rounded-xl border border-border">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Deal Stage</label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateLead(selectedLead._id, { status: e.target.value })}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won (Closed)</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Lead Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedLead.leadScore}
                  onChange={(e) => handleUpdateLead(selectedLead._id, { leadScore: parseInt(e.target.value) || 0 })}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Source</label>
                <span className="inline-flex rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground w-full capitalize">
                  {selectedLead.source}
                </span>
              </div>
            </div>

            {/* CRM Notes */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Organizer CRM Notes</label>
              <textarea
                rows={2}
                value={selectedLead.notes || ''}
                onChange={(e) => handleUpdateLead(selectedLead._id, { notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                placeholder="Log internal details about this lead..."
              />
            </div>

            {/* Grid of activities / follow ups */}
            <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border/80">
              {/* Activity Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-primary" /> Activity History ({selectedLead.activityTimeline?.length || 0})
                </h4>

                {/* Log list */}
                <div className="max-h-64 overflow-y-auto space-y-2 border border-border/80 rounded-xl p-3 bg-muted/5">
                  {selectedLead.activityTimeline?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No logged activities.</p>
                  ) : (
                    selectedLead.activityTimeline.map((act, idx) => {
                      const timeStr = new Date(act.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={idx} className="bg-card border border-border rounded-lg p-2.5 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span className="font-semibold uppercase text-primary">{act.type}</span>
                            <span>{timeStr}</span>
                          </div>
                          <p className="text-foreground">{act.content}</p>
                          {act.performedBy && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/40">
                              <User className="h-2.5 w-2.5" /> By {act.performedBy.name || 'Staff'}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Log Input */}
                <form onSubmit={handleAddActivity} className="flex gap-2">
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-24"
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meet</option>
                    <option value="email">Email</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Type an activity update..."
                    value={newActivityContent}
                    onChange={(e) => setNewActivityContent(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1 placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-3 text-xs rounded-lg shadow-sm"
                  >
                    Log
                  </button>
                </form>
              </div>

              {/* Follow Ups schedule */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-primary" /> Follow Ups ({selectedLead.followUps?.length || 0})
                </h4>

                {/* Follow Ups list */}
                <div className="max-h-64 overflow-y-auto space-y-2 border border-border/80 rounded-xl p-3 bg-muted/5">
                  {selectedLead.followUps?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No scheduled follow-ups.</p>
                  ) : (
                    selectedLead.followUps.map((fl, idx) => {
                      const timeStr = new Date(fl.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={idx} className="bg-card border border-border rounded-lg p-2.5 text-xs flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{fl.title}</p>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {timeStr}
                            </span>
                            {fl.notes && <p className="text-[10px] text-muted-foreground pt-1">{fl.notes}</p>}
                          </div>
                          {fl.isCompleted ? (
                            <span className="bg-emerald-500/10 text-emerald-500 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Done
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-500 rounded px-1.5 py-0.5 text-[9px] font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Follow Up inputs */}
                <form onSubmit={handleAddFollowUp} className="border border-border p-3 rounded-lg bg-card space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Task name (e.g. Schedule Demo)"
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="datetime-local"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                    <input
                      type="text"
                      placeholder="Brief notes (optional)"
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold py-1.5 text-xs rounded-lg transition-colors"
                  >
                    Schedule Action
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
