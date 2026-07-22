'use client';

/**
 * @file page.js (Ticketing, Sales & Support Helpdesk)
 * @description Dual-mode workspace for Event Pass Tiers & Sales Orders, plus Support Helpdesk Tickets for Organizers/Clients.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Ticket,
  Plus,
  CreditCard,
  DollarSign,
  Users,
  Award,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  Receipt,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Check,
  Tag,
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TicketingPage() {
  const { user, accessToken } = useAuth();

  // Mode Switcher
  const [activeTab, setActiveTab] = useState('event_pricing'); // 'event_pricing' or 'support_helpdesk'

  // Event Pricing & Sales state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state for Pricing Tiers
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // New Ticket Tier Form State
  const [newTier, setNewTier] = useState({
    title: '',
    description: '',
    type: 'free',
    price: 0,
    currency: 'INR',
    capacity: 500
  });

  // Simulated Checkout Form State
  const [simulateForm, setSimulateForm] = useState({
    ticketId: '',
    quantity: 1,
    buyer: {
      name: '',
      email: '',
      phone: '',
      company: '',
      designation: '',
      country: 'India'
    }
  });

  // --- SUPPORT HELPDESK TICKETS STATE ---
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportStatusFilter, setSupportStatusFilter] = useState('all');
  const [supportPriorityFilter, setSupportPriorityFilter] = useState('all');
  const [supportSearchTerm, setSupportSearchTerm] = useState('');

  // Raise Ticket Modal State
  const [isRaiseTicketModalOpen, setIsRaiseTicketModalOpen] = useState(false);
  const [raisingTicket, setRaisingTicket] = useState(false);
  const [newSupportTicket, setNewSupportTicket] = useState({
    title: '',
    description: '',
    category: 'technical',
    priority: 'medium',
    eventId: ''
  });

  // Ticket Detail & Reply Thread Modal State
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [postingReply, setPostingReply] = useState(false);

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

          // Prioritize organizer's own / claimed events at the top
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

  // 2. Fetch Ticket Tiers & Orders
  const fetchData = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const ticketRes = await axios.get(`${API_URL}/tickets`, {
        params: { eventId: selectedEventId },
        headers
      });
      if (ticketRes.data && ticketRes.data.success) {
        setTickets(ticketRes.data.data || []);
        if (ticketRes.data.data.length > 0) {
          setSimulateForm(prev => ({ ...prev, ticketId: ticketRes.data.data[0]._id }));
        }
      }

      const orderRes = await axios.get(`${API_URL}/orders`, {
        params: { eventId: selectedEventId, limit: 20 },
        headers
      });
      if (orderRes.data && orderRes.data.success) {
        setOrders(orderRes.data.data.docs || []);
        setTotalRevenue(orderRes.data.data.totalRevenue || 0);
      }
    } catch (err) {
      console.error('Error fetching ticketing details', err);
      setError('Could not retrieve ticketing details. Verify seed file was run.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEventId, accessToken]);

  // 3. Fetch Support Tickets
  const fetchSupportTickets = async () => {
    if (!accessToken) return;
    setLoadingSupport(true);
    try {
      const res = await axios.get(`${API_URL}/support-tickets`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setSupportTickets(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets', err);
    } finally {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'support_helpdesk') {
      fetchSupportTickets();
    }
  }, [activeTab, accessToken]);

  // 4. Handle Create Ticket Tier
  const handleCreateTier = async (e) => {
    e.preventDefault();
    if (!newTier.title || newTier.capacity === undefined) {
      alert('Ticket name and Capacity are required');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/tickets`,
        { ...newTier, eventId: selectedEventId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setTickets(prev => [...prev, res.data.ticket]);
        setIsTierModalOpen(false);
        setNewTier({
          title: '',
          description: '',
          type: 'free',
          price: 0,
          currency: 'INR',
          capacity: 500
        });
      }
    } catch (err) {
      console.error('Error creating ticket tier', err);
      alert('Failed to save ticket tier');
    }
  };

  // 5. Handle Simulate checkout
  const handleSimulateCheckout = async (e) => {
    e.preventDefault();
    if (!simulateForm.ticketId || !simulateForm.buyer.name || !simulateForm.buyer.email) {
      alert('Please select a ticket tier and fill name/email.');
      return;
    }

    setSimulating(true);
    try {
      const res = await axios.post(`${API_URL}/orders/checkout`, {
        eventId: selectedEventId,
        ticketId: simulateForm.ticketId,
        quantity: parseInt(simulateForm.quantity, 10) || 1,
        buyer: simulateForm.buyer
      });

      if (res.data && res.data.success) {
        alert(`Purchase successful!\nOrder: ${res.data.orderNumber}\nStatus: ${res.data.status}`);
        setIsSimulateModalOpen(false);
        setSimulateForm({
          ticketId: tickets[0]?._id || '',
          quantity: 1,
          buyer: { name: '', email: '', phone: '', company: '', designation: '', country: 'India' }
        });
        
        fetchData();
      }
    } catch (err) {
      console.error('Error in simulation checkout', err);
      alert(err.response?.data?.error || 'Simulated purchase failed');
    } finally {
      setSimulating(false);
    }
  };

  // Delete Ticket Tier
  const handleDeleteTier = async (id) => {
    if (!window.confirm('Are you sure you want to remove this ticket tier?')) return;
    try {
      const res = await axios.delete(`${API_URL}/tickets/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setTickets(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error('Delete tier failed', err);
      alert('Failed to delete tier');
    }
  };

  // 6. Handle Raise Support Ticket
  const handleRaiseSupportTicket = async (e) => {
    e.preventDefault();
    if (!newSupportTicket.title || !newSupportTicket.description) {
      alert('Ticket title and description are required.');
      return;
    }

    setRaisingTicket(true);
    try {
      const res = await axios.post(
        `${API_URL}/support-tickets`,
        {
          ...newSupportTicket,
          eventId: newSupportTicket.eventId || selectedEventId || undefined
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        alert(`Support Ticket ${res.data.ticket.ticketId} submitted successfully!`);
        setIsRaiseTicketModalOpen(false);
        setNewSupportTicket({
          title: '',
          description: '',
          category: 'technical',
          priority: 'medium',
          eventId: ''
        });
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Error raising support ticket', err);
      alert(err.response?.data?.error || 'Failed to submit support ticket.');
    } finally {
      setRaisingTicket(false);
    }
  };

  // 7. Handle Reply to Support Ticket Thread
  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketDetail) return;

    setPostingReply(true);
    try {
      const res = await axios.post(
        `${API_URL}/support-tickets/${selectedTicketDetail._id}/responses`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setSelectedTicketDetail(res.data.ticket);
        setReplyMessage('');
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Error posting reply', err);
      alert('Failed to send reply');
    } finally {
      setPostingReply(false);
    }
  };

  // 8. Handle Client Mark Ticket Resolved
  const handleResolveSupportTicket = async (ticketId) => {
    try {
      const res = await axios.put(
        `${API_URL}/support-tickets/${ticketId}`,
        { status: 'resolved', resolutionNotes: 'Resolved by ticket submitter' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        if (selectedTicketDetail && selectedTicketDetail._id === ticketId) {
          setSelectedTicketDetail(res.data.ticket);
        }
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Error marking resolved', err);
      alert('Failed to update ticket status');
    }
  };

  const totalTicketsSold = tickets.reduce((sum, t) => sum + (t.soldCount || 0), 0);

  // Filter support tickets
  const filteredSupportTickets = supportTickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(supportSearchTerm.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(supportSearchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(supportSearchTerm.toLowerCase());
    
    const matchesStatus = supportStatusFilter === 'all' || t.status === supportStatusFilter;
    const matchesPriority = supportPriorityFilter === 'all' || t.priority === supportPriorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingSupportCount = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedSupportCount = supportTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Top Bar Header & View Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {activeTab === 'event_pricing' ? (
              <Ticket className="h-6 w-6 text-primary" />
            ) : (
              <LifeBuoy className="h-6 w-6 text-primary" />
            )}
            {activeTab === 'event_pricing' ? 'Ticketing & Sales Manager' : 'Support Helpdesk & Tickets'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'event_pricing'
              ? 'Define registration pass pricing tiers, review live transaction order logs, and test checkout.'
              : 'Raise technical/billing support tickets to system administrators and track real-time issue resolutions.'}
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex border border-border rounded-xl p-1 bg-muted/20 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('event_pricing')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'event_pricing'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Ticket className="h-4 w-4 text-primary" /> Event Pass Tiers
          </button>
          <button
            onClick={() => setActiveTab('support_helpdesk')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 relative ${
              activeTab === 'support_helpdesk'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LifeBuoy className="h-4 w-4 text-primary" /> Support Helpdesk
            {pendingSupportCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                {pendingSupportCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: EVENT PRICING TIERS & SALES ================= */}
      {activeTab === 'event_pricing' && (
        <>
          {/* Active Event Selector Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Event:</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-64"
              >
                {events.map((evt) => {
                  const userOrgId = user?.organization?._id || user?.organization;
                  const userId = user?._id || user?.id;
                  const aOrg = evt.organizer?._id || evt.organizer;
                  const isMine = (userOrgId && aOrg?.toString() === userOrgId?.toString()) || (userId && evt.claimedBy?.toString() === userId?.toString());
                  return (
                    <option key={evt._id} value={evt._id}>
                      {isMine ? `⭐ ${evt.title} (Your Event)` : evt.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSimulateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Simulate Purchase
              </button>
              <button
                onClick={() => setIsTierModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <Plus className="h-4 w-4" /> Add Ticket Tier
              </button>
            </div>
          </div>

          {/* KPI Sales Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', desc: 'Total payments successfully logged' },
              { title: 'Tickets Redeemed', value: totalTicketsSold, icon: Ticket, color: 'text-indigo-500', desc: 'Aggregated pass checkouts' },
              { title: 'Active Pricing Tiers', value: tickets.length, icon: CreditCard, color: 'text-blue-500', desc: 'Configured ticket categories' }
            ].map((kpi, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">{kpi.value}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
              </div>
            ))}
          </div>

          {/* Grid: Pricing Cards & Recent Orders */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket pricing tiers column */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="h-5 w-5 text-primary" /> Ticket Tiers
              </h3>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="border border-border rounded-xl p-6 text-center text-muted-foreground bg-card">
                  <Ticket className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No tiers configured.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t._id} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <button
                      onClick={() => handleDeleteTier(t._id)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                    <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      t.type === 'vip'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : t.type === 'paid'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                    }`}>
                      {t.type}
                    </span>

                    <h4 className="font-bold text-base text-foreground mt-2">{t.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description || 'No description provided.'}</p>
                    
                    <div className="flex justify-between items-baseline border-t border-border/60 pt-3 mt-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Sales: </span>
                        <span className="text-sm font-bold text-foreground font-mono">{t.soldCount}</span>
                        <span className="text-xs text-muted-foreground"> / {t.capacity === -1 ? '∞' : t.capacity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-foreground font-mono">
                          {t.price === 0 ? 'FREE' : `₹${t.price.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Transactions log table */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="h-5 w-5 text-primary" /> Order History
              </h3>

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Fetching ledger logs...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
                    <Receipt className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-xs font-semibold">No transactions recorded for this event.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <th className="px-5 py-3.5">Order Info</th>
                          <th className="px-5 py-3.5">Buyer</th>
                          <th className="px-5 py-3.5">Items</th>
                          <th className="px-5 py-3.5">Total</th>
                          <th className="px-5 py-3.5">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map((ord) => (
                          <tr key={ord._id} className="hover:bg-secondary/40 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs">
                              <p className="font-semibold text-foreground">{ord.orderNumber}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-foreground">{ord.buyer.name}</p>
                              <span className="text-xs text-muted-foreground">{ord.buyer.email}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {ord.items.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium text-foreground">{item.title}</span>
                                  <span className="text-muted-foreground"> (x{item.quantity})</span>
                                </div>
                              ))}
                            </td>
                            <td className="px-5 py-3.5 font-bold font-mono text-foreground">
                              ₹{ord.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : ord.status === 'failed'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {ord.status}
                              </span>
                              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{ord.paymentMethod?.replace('_', ' ')}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW 2: SUPPORT HELPDESK & TICKETS ================= */}
      {activeTab === 'support_helpdesk' && (
        <div className="space-y-6">
          {/* Header Action & Stats Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Helpdesk Status</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/20">
                  <Clock className="h-3 w-3" /> {pendingSupportCount} Open / Pending
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">
                  <CheckCircle className="h-3 w-3" /> {resolvedSupportCount} Resolved
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsRaiseTicketModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all shrink-0"
            >
              <Plus className="h-4.5 w-4.5" /> Raise New Support Ticket
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid gap-3 md:grid-cols-3 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket ID, title..."
                value={supportSearchTerm}
                onChange={(e) => setSupportSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground shrink-0">Status:</label>
              <select
                value={supportStatusFilter}
                onChange={(e) => setSupportStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary capitalize"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground shrink-0">Priority:</label>
              <select
                value={supportPriorityFilter}
                onChange={(e) => setSupportPriorityFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary capitalize"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Support Tickets Table / List */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {loadingSupport ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Fetching support tickets...</p>
              </div>
            ) : filteredSupportTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                <LifeBuoy className="h-10 w-10 text-muted-foreground/40" />
                <h4 className="font-bold text-foreground">No Support Tickets Found</h4>
                <p className="text-xs max-w-sm">You haven't filed any technical or billing support tickets matching the selected filters.</p>
                <button
                  onClick={() => setIsRaiseTicketModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Submit First Ticket
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-5 py-3.5">Ticket ID & Date</th>
                      <th className="px-5 py-3.5">Title & Description</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSupportTickets.map((t) => {
                      const isPending = t.status === 'open' || t.status === 'in_progress';
                      return (
                        <tr key={t._id} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">
                            <span className="font-bold text-primary block">{t.ticketId}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-md">
                            <p className="font-semibold text-foreground line-clamp-1">{t.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                            {t.event && (
                              <span className="inline-block mt-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border">
                                Event: {t.event.title || t.event}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider capitalize">
                              {t.category?.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              t.priority === 'urgent' || t.priority === 'high'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : t.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                            }`}>
                              {t.priority}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                                <Clock className="h-3.5 w-3.5" /> {t.status === 'in_progress' ? 'In Progress' : 'Open'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                                <CheckCircle className="h-3.5 w-3.5" /> {t.status === 'resolved' ? 'Resolved' : 'Closed'}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedTicketDetail(t)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Discussion ({t.responses?.length || 0})
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: RAISE SUPPORT TICKET ================= */}
      {isRaiseTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsRaiseTicketModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Raise Support Ticket</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe the issue or technical assistance required. Our Super Admin team will review and respond directly.
            </p>

            <form onSubmit={handleRaiseSupportTicket} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Ticket Title *</label>
                <input
                  type="text"
                  required
                  value={newSupportTicket.title}
                  onChange={(e) => setNewSupportTicket(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="E.g. WordPress sync webhook timing out"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Category</label>
                  <select
                    value={newSupportTicket.category}
                    onChange={(e) => setNewSupportTicket(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="technical">Technical Bug</option>
                    <option value="billing">Billing & Orders</option>
                    <option value="event_setup">Event Setup</option>
                    <option value="exhibitor_issue">Exhibitor Allocation</option>
                    <option value="other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Priority</label>
                  <select
                    value={newSupportTicket.priority}
                    onChange={(e) => setNewSupportTicket(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Related Event (Optional)</label>
                <select
                  value={newSupportTicket.eventId}
                  onChange={(e) => setNewSupportTicket(prev => ({ ...prev, eventId: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- General Account Ticket --</option>
                  {events.map((evt) => (
                    <option key={evt._id} value={evt._id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Detailed Problem Description *</label>
                <textarea
                  rows={4}
                  required
                  value={newSupportTicket.description}
                  onChange={(e) => setNewSupportTicket(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground text-sm"
                  placeholder="Provide details, steps to reproduce, or specific error messages encountered..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRaiseTicketModalOpen(false)}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={raisingTicket}
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors flex items-center gap-1.5"
                >
                  {raisingTicket ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Support Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TICKET DISCUSSION THREAD & REPLIES ================= */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                  {selectedTicketDetail.ticketId}
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-base line-clamp-1">{selectedTicketDetail.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    Category: <strong className="text-foreground capitalize">{selectedTicketDetail.category?.replace('_', ' ')}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Issue Card */}
              <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> {selectedTicketDetail.reporterName} ({selectedTicketDetail.reporterEmail})
                  </span>
                  <span>{new Date(selectedTicketDetail.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedTicketDetail.description}
                </p>
              </div>

              {/* Discussion Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Conversation History ({selectedTicketDetail.responses?.length || 0})
                </h4>

                {(!selectedTicketDetail.responses || selectedTicketDetail.responses.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic py-2">No responses added yet. Admins will reply shortly.</p>
                ) : (
                  selectedTicketDetail.responses.map((resp, idx) => {
                    const isAdmin = resp.senderRole === 'super_admin';
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 border text-sm space-y-1.5 ${
                          isAdmin
                            ? 'bg-primary/5 border-primary/20 ml-4'
                            : 'bg-secondary/40 border-border mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1">
                            {isAdmin && <Sparkles className="h-3 w-3 text-primary" />}
                            {resp.senderName} <span className="text-[10px] font-semibold text-muted-foreground">({resp.senderRole})</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{resp.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer - Reply Box */}
            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
              {selectedTicketDetail.status === 'resolved' || selectedTicketDetail.status === 'closed' ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-500">
                  <span className="flex items-center gap-2 font-bold">
                    <CheckCircle className="h-4 w-4" /> Ticket Marked Resolved
                  </span>
                  <span className="text-[11px] text-muted-foreground">Resolution Notes: {selectedTicketDetail.resolutionNotes || 'Resolved'}</span>
                </div>
              ) : (
                <form onSubmit={handlePostReply} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your follow-up reply..."
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={postingReply}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {postingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveSupportTicket(selectedTicketDetail._id)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-all shrink-0"
                  >
                    Mark Resolved
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tier Modal */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsTierModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Add Ticket Tier</h3>

            <form onSubmit={handleCreateTier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Tier Name *</label>
                <input
                  type="text"
                  required
                  value={newTier.title}
                  onChange={(e) => setNewTier(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="E.g. Conference Regular Pass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={newTier.description}
                  onChange={(e) => setNewTier(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground"
                  placeholder="Briefly state pass access rights..."
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Tier Type</label>
                  <select
                    value={newTier.type}
                    onChange={(e) => setNewTier(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">Free Pass</option>
                    <option value="paid">Paid Standard</option>
                    <option value="vip">VIP Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Capacity Limit *</label>
                  <input
                    type="number"
                    required
                    value={newTier.capacity}
                    onChange={(e) => setNewTier(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {newTier.type !== 'free' && (
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Price *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTier.price}
                      onChange={(e) => setNewTier(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Currency</label>
                    <select
                      value={newTier.currency}
                      onChange={(e) => setNewTier(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Purchase Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsSimulateModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Simulate Ticket Purchase</h3>

            <form onSubmit={handleSimulateCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Select Ticket Tier *</label>
                <select
                  required
                  value={simulateForm.ticketId}
                  onChange={(e) => setSimulateForm(prev => ({ ...prev, ticketId: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {tickets.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.price === 0 ? 'FREE' : `₹${t.price.toLocaleString()}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={simulateForm.quantity}
                    onChange={(e) => setSimulateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Country</label>
                  <input
                    type="text"
                    value={simulateForm.buyer.country}
                    onChange={(e) => setSimulateForm(prev => ({ ...prev, buyer: { ...prev.buyer, country: e.target.value } }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Buyer Name *</label>
                <input
                  type="text"
                  required
                  value={simulateForm.buyer.name}
                  onChange={(e) => setSimulateForm(prev => ({ ...prev, buyer: { ...prev.buyer, name: e.target.value } }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="E.g. Sarah Connor"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Buyer Email *</label>
                <input
                  type="email"
                  required
                  value={simulateForm.buyer.email}
                  onChange={(e) => setSimulateForm(prev => ({ ...prev, buyer: { ...prev.buyer, email: e.target.value } }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="sarah@skynet.com"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company</label>
                  <input
                    type="text"
                    value={simulateForm.buyer.company}
                    onChange={(e) => setSimulateForm(prev => ({ ...prev, buyer: { ...prev.buyer, company: e.target.value } }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="SkyNet Systems"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Designation</label>
                  <input
                    type="text"
                    value={simulateForm.buyer.designation}
                    onChange={(e) => setSimulateForm(prev => ({ ...prev, buyer: { ...prev.buyer, designation: e.target.value } }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Chief Tech Engineer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors flex items-center gap-1.5"
                >
                  {simulating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Simulate Payment
                    </>
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
