'use client';

/**
 * @file page.js (Ticketing & Orders)
 * @description Ticketing system manager, sales stats logs, and transaction orders grid.
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
  HelpCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TicketingPage() {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // New Ticket Form State
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

  // 1. Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events`);
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
  }, []);

  // 2. Fetch Tickets & Orders
  const fetchData = async () => {
    if (!selectedEventId || !accessToken) return;
    setLoading(true);
    setError('');
    try {
      // Fetch Tiers
      const ticketRes = await axios.get(`${API_URL}/tickets`, {
        params: { eventId: selectedEventId },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (ticketRes.data && ticketRes.data.success) {
        setTickets(ticketRes.data.data || []);
        if (ticketRes.data.data.length > 0) {
          setSimulateForm(prev => ({ ...prev, ticketId: ticketRes.data.data[0]._id }));
        }
      }

      // Fetch Orders
      const orderRes = await axios.get(`${API_URL}/orders`, {
        params: { eventId: selectedEventId, limit: 20 },
        headers: { Authorization: `Bearer ${accessToken}` }
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

  // 3. Handle Create Ticket Tier
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

  // 4. Handle Simulate checkout
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
        
        // Reload data
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

  const totalTicketsSold = tickets.reduce((sum, t) => sum + (t.soldCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Events Dropdown */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" /> Ticketing & Sales Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define registration pricing tiers, review order logs, and process simulated checkout purchases.
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
          <div className="flex gap-2 mt-4 sm:mt-0">
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
                {/* Delete cross */}
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

      {/* Ticket Tier Modal */}
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

              {/* Action buttons */}
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

              {/* Action buttons */}
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
