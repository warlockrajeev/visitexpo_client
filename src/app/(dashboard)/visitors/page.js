'use client';

/**
 * @file page.js (Visitors CRM)
 * @description Visitor CRM dashboard page for managing registrations, in-person check-ins, and virtual attendees.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Copy,
  Check,
  X,
  AlertCircle,
  Loader2,
  Video
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function VisitorsCRMPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // all, in_person, virtual
  
  // Modal State for onboarding
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null); // For displaying mock QR modal
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    country: 'India',
    attendanceType: 'in_person',
    notes: ''
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

  // 2. Fetch Visitors
  const fetchVisitors = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/visitors`, {
        params: { eventId: selectedEventId, limit: 100 },
        headers
      });
      if (res.data && res.data.success) {
        setVisitors(res.data.data.docs || []);
      }
    } catch (err) {
      console.error('Failed to load visitors', err);
      setError('Error fetching visitors. Make sure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [selectedEventId, accessToken]);

  // 3. Handle Physical Check-In
  const handlePhysicalCheckIn = async (qrCode) => {
    try {
      const res = await axios.post(
        `${API_URL}/visitors/checkin`,
        { qrCode, eventId: selectedEventId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        // Refresh local list
        fetchVisitors();
      }
    } catch (err) {
      console.error('Checkin error', err);
      alert(err.response?.data?.error || 'Check-in failed');
    }
  };

  // 4. Handle Virtual Join Simulation
  const handleVirtualJoin = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/visitors/virtual-join`, {
        email,
        eventId: selectedEventId
      });
      if (res.data && res.data.success) {
        // Refresh local list
        fetchVisitors();
      }
    } catch (err) {
      console.error('Virtual join error', err);
      alert(err.response?.data?.error || 'Virtual join failed');
    }
  };

  // 5. Register a New Visitor (Onboarding)
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!newVisitor.name || !newVisitor.email || !newVisitor.phone) {
      alert('Name, Email, and Phone are required.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/visitors/register`, {
        ...newVisitor,
        eventId: selectedEventId
      });

      if (res.data && res.data.success) {
        // Refresh visitors
        fetchVisitors();
        // Reset form
        setNewVisitor({
          name: '',
          email: '',
          phone: '',
          company: '',
          designation: '',
          country: 'India',
          attendanceType: 'in_person',
          notes: ''
        });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to register visitor', err);
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Helper: Copy virtual join link
  const copyJoinLink = (visitorId) => {
    const mockLink = `https://visitexpo.in/virtual-stream?visitorId=${visitorId}`;
    navigator.clipboard.writeText(mockLink);
    setCopiedId(visitorId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Computed Fields
  const filteredVisitors = visitors.filter(vis => {
    const matchesSearch =
      vis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vis.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vis.company && vis.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (attendanceFilter === 'all') return matchesSearch;
    return matchesSearch && vis.attendanceType === attendanceFilter;
  });

  const totalRegistered = visitors.length;
  const inPersonTotal = visitors.filter(v => v.attendanceType === 'in_person').length;
  const inPersonCheckedIn = visitors.filter(v => v.attendanceType === 'in_person' && v.checkInStatus === 'checked_in').length;
  const virtualJoined = visitors.filter(v => v.attendanceType === 'virtual' && v.virtualJoinStatus === 'checked_in').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Visitor CRM & Registry
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register visitors, manage QR codes for in-person attendees, and track virtual connections.
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
            <Plus className="h-4 w-4" /> Onboard Visitor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Registered', value: totalRegistered, desc: 'Across all attendance channels', color: 'text-blue-500' },
          { title: 'In-Person Registrants', value: inPersonTotal, desc: 'Planning physical attendance', color: 'text-indigo-500' },
          { title: 'In-Person Checked In', value: inPersonCheckedIn, desc: `Physical check-in rate: ${inPersonTotal ? Math.round((inPersonCheckedIn / inPersonTotal) * 100) : 0}%`, color: 'text-emerald-500' },
          { title: 'Virtual Active Attendees', value: virtualJoined, desc: 'Logged in to virtual spaces', color: 'text-pink-500' }
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

      {/* Registry Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 w-fit">
            {[
              { id: 'all', label: 'All Channels' },
              { id: 'in_person', label: 'In-Person' },
              { id: 'virtual', label: 'Virtual' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAttendanceFilter(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  attendanceFilter === tab.id
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
              placeholder="Search by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Content Render */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching visitors directory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Error Loading Visitors</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-2">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-foreground">No Visitors Found</h3>
            <p className="text-sm max-w-sm">No visitor registries match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Company Details</th>
                  <th className="px-6 py-4">Attendance Channel</th>
                  <th className="px-6 py-4">Status & Check-In</th>
                  <th className="px-6 py-4 text-right">Badge / Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVisitors.map((vis) => (
                  <tr key={vis._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{vis.name}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {vis.email}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {vis.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{vis.company || 'Individual'}</p>
                      <p className="text-xs text-muted-foreground">{vis.designation || 'Visitor'}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-3 w-3" /> {vis.country}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${
                        vis.attendanceType === 'virtual'
                          ? 'bg-pink-500/10 text-pink-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {vis.attendanceType === 'virtual' ? <Video className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
                        {vis.attendanceType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {vis.attendanceType === 'in_person' ? (
                        vis.checkInStatus === 'checked_in' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                              <CheckCircle className="h-3.5 w-3.5" /> Checked In
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {vis.checkInTime ? new Date(vis.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePhysicalCheckIn(vis.qrCode)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-200"
                          >
                            Mark Checked In
                          </button>
                        )
                      ) : vis.virtualJoinStatus === 'checked_in' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-xs font-semibold text-pink-500">
                            <CheckCircle className="h-3.5 w-3.5" /> Virtual Connected
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {vis.virtualJoinTime ? new Date(vis.virtualJoinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVirtualJoin(vis.email)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs font-semibold text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-200"
                        >
                          Simulate Join
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {vis.attendanceType === 'in_person' ? (
                        <button
                          onClick={() => setSelectedQR({ name: vis.name, qrCode: vis.qrCode, company: vis.company })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary hover:bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground border border-border shadow-sm transition-all"
                        >
                          <QrCode className="h-4 w-4 text-muted-foreground" /> View Badge
                        </button>
                      ) : (
                        <button
                          onClick={() => copyJoinLink(vis._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary hover:bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground border border-border shadow-sm transition-all"
                        >
                          {copiedId === vis._id ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 text-muted-foreground" /> Join Link
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR/Badge Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Physical Badge Layout */}
            <div className="border border-border/80 rounded-xl p-4 bg-muted/5 mt-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Global Tech Expo 2026</span>
              <h3 className="text-lg font-bold text-foreground mt-2">{selectedQR.name}</h3>
              <p className="text-xs text-muted-foreground font-medium">{selectedQR.company || 'Visitor'}</p>
              
              {/* Mock QR Code Drawing */}
              <div className="my-6 mx-auto flex h-40 w-40 flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-white p-2 rounded-lg shadow-inner">
                <QrCode className="h-32 w-32 text-black" />
              </div>

              <div className="border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground uppercase">PHYSICAL ACCESS BADGE</span>
                <p className="mt-1 font-mono tracking-wider text-[9px]">{selectedQR.qrCode}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedQR.qrCode);
                alert('QR Token copied to clipboard');
              }}
              className="w-full mt-4 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Copy Badge Token
            </button>
          </div>
        </div>
      )}

      {/* Sleek Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Onboard Visitor</h3>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newVisitor.email}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company</label>
                  <input
                    type="text"
                    value={newVisitor.company}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tech LLC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Designation</label>
                  <input
                    type="text"
                    value={newVisitor.designation}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Country</label>
                  <input
                    type="text"
                    value={newVisitor.country}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Attendance Type</label>
                  <select
                    value={newVisitor.attendanceType}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, attendanceType: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="in_person">In Person (QR Access)</option>
                    <option value="virtual">Virtual (Digital Stream)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Onboarding Notes</label>
                <textarea
                  rows={2}
                  value={newVisitor.notes}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Any additional details or requirements..."
                />
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
                  Onboard Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
