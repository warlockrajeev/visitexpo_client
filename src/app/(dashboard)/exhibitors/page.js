'use client';

/**
 * @file page.js (Exhibitors)
 * @description Exhibitor management and onboarding interface for organizers.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
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
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ExhibitorsPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected
  
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
    staff: []
  });
  const [newStaffMember, setNewStaffMember] = useState({ name: '', email: '', phone: '' });

  // 1. Fetch Events on Load
  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      try {
        const url = user.role === 'super_admin'
          ? `${API_URL}/events`
          : `${API_URL}/events?organizerId=${user._id}`;
        const res = await axios.get(url);
        if (res.data && res.data.success && res.data.data.docs) {
          setEvents(res.data.data.docs);
          if (res.data.data.docs.length > 0) {
            setSelectedEventId(res.data.data.docs[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load events', err);
        setError('Could not connect to API server. Ensure backend is running.');
      }
    };
    fetchEvents();
  }, [user]);

  // 2. Fetch Exhibitors when selected event changes
  useEffect(() => {
    if (!selectedEventId) return;

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
        setError('Error fetching exhibitors. Make sure database is seeded.');
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitors();
  }, [selectedEventId, accessToken]);

  // 3. Handle Status Updates (Approve / Reject)
  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axios.put(
        `${API_URL}/exhibitors/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        // Update local state
        setExhibitors(prev =>
          prev.map(ex => (ex._id === id ? { ...ex, status: res.data.exhibitor.status } : ex))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Error updating exhibitor status: ' + (err.response?.data?.error || err.message));
    }
  };

  // 4. Handle Delete
  const handleDeleteExhibitor = async (id) => {
    if (!window.confirm('Are you sure you want to remove this exhibitor?')) return;

    try {
      const res = await axios.delete(`${API_URL}/exhibitors/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setExhibitors(prev => prev.filter(ex => ex._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete exhibitor', err);
      alert('Error deleting exhibitor.');
    }
  };

  // 5. Add Staff Member in Form
  const addStaffMember = () => {
    if (!newStaffMember.name || !newStaffMember.email) {
      alert('Staff name and email are required');
      return;
    }
    setNewExhibitor(prev => ({
      ...prev,
      staff: [...prev.staff, newStaffMember]
    }));
    setNewStaffMember({ name: '', email: '', phone: '' });
  };

  // Remove Staff Member in Form
  const removeStaffMember = (idx) => {
    setNewExhibitor(prev => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== idx)
    }));
  };

  // 6. Handle Onboarding Form Submit
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!newExhibitor.name || !newExhibitor.description || !newExhibitor.contactEmail || !newExhibitor.contactPhone) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      // First register via public API (which defaults to pending)
      const res = await axios.post(`${API_URL}/exhibitors/register`, {
        ...newExhibitor,
        eventId: selectedEventId
      });

      if (res.data && res.data.success) {
        const created = res.data.exhibitor;
        
        // Auto-approve right away since it was created by an Organizer from dashboard
        const approveRes = await axios.put(
          `${API_URL}/exhibitors/${created._id}/status`,
          { status: 'approved' },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (approveRes.data && approveRes.data.success) {
          setExhibitors(prev => [approveRes.data.exhibitor, ...prev]);
        } else {
          setExhibitors(prev => [created, ...prev]);
        }

        // Reset form
        setNewExhibitor({
          name: '',
          description: '',
          logo: '',
          website: '',
          contactEmail: '',
          contactPhone: '',
          attendanceType: 'in_person',
          boothNumber: '',
          staff: []
        });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to onboard exhibitor', err);
      alert('Error onboarding exhibitor: ' + (err.response?.data?.error || err.message));
    }
  };

  // Computed Values
  const filteredExhibitors = exhibitors.filter(ex => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.boothNumber && ex.boothNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && ex.status === activeTab;
  });

  const totalExhibitors = exhibitors.length;
  const approvedCount = exhibitors.filter(e => e.status === 'approved').length;
  const pendingCount = exhibitors.filter(e => e.status === 'pending').length;
  const virtualCount = exhibitors.filter(e => e.attendanceType === 'virtual' && e.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Event Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Exhibitor Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage physical and virtual booths, approve onboarding requests, and coordinate staff.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Active Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-4 md:mt-0"
          >
            <Plus className="h-4 w-4" /> Onboard Exhibitor
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Registered', value: totalExhibitors, desc: 'All submitted requests', color: 'text-blue-500' },
          { title: 'Approved Booths', value: approvedCount, desc: 'Active in expo spaces', color: 'text-emerald-500' },
          { title: 'Pending Approval', value: pendingCount, desc: 'Awaiting organizer review', color: 'text-amber-500' },
          { title: 'Virtual Exposures', value: virtualCount, desc: 'Virtual booths enabled', color: 'text-pink-500' }
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
          <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 w-fit">
            {[
              { id: 'all', label: 'All' },
              { id: 'approved', label: 'Approved' },
              { id: 'pending', label: 'Pending' },
              { id: 'rejected', label: 'Rejected' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
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
              placeholder="Search by company, booth, email..."
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
                  <th className="px-6 py-4">Booth & Type</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Staff Count</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExhibitors.map((ex) => (
                  <tr key={ex._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary border border-border text-foreground font-bold shadow-sm">
                          {ex.logo ? (
                            <img src={ex.logo} alt={ex.name} className="h-full w-full object-contain rounded-lg" />
                          ) : (
                            ex.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">{ex.name}</p>
                            {ex.wpSource && (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                DIR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground max-w-xs truncate">{ex.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{ex.boothNumber || 'Not Assigned'}</p>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mt-1 uppercase ${
                        ex.attendanceType === 'virtual'
                          ? 'bg-pink-500/10 text-pink-500'
                          : ex.attendanceType === 'hybrid'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {ex.attendanceType.replace('_', ' ')}
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
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        ex.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : ex.status === 'rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {ex.status.charAt(0).toUpperCase() + ex.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ex.status === 'pending' && (
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
                        )}
                        {ex.status === 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(ex._id, 'pending')}
                            className="text-xs text-primary hover:underline px-2 py-1 font-semibold"
                          >
                            Revert to Pending
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

      {/* Sleek Glassmorphism Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Onboard New Exhibitor</h3>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
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
                  <select
                    value={newExhibitor.attendanceType}
                    onChange={(e) => setNewExhibitor(prev => ({ ...prev, attendanceType: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="in_person">In Person Only</option>
                    <option value="virtual">Virtual Only</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
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

              {/* Staff Management Section */}
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Representative Staff ({newExhibitor.staff.length})</h4>
                
                {/* Staff List */}
                {newExhibitor.staff.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newExhibitor.staff.map((st, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-secondary border border-border rounded-md px-2 py-1 text-xs">
                        <span className="font-semibold text-foreground">{st.name}</span> 
                        <span className="text-muted-foreground">({st.email})</span>
                        <button type="button" onClick={() => removeStaffMember(idx)} className="text-destructive font-bold ml-1 hover:text-destructive/80">×</button>
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors"
                >
                  Save & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
