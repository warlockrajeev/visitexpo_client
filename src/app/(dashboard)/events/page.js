'use client';

/**
 * @file page.js (Events Management)
 * @description Event Lifecycle screen allowing organizers to list, create, edit, publish, and delete events.
 * Features 10times Onboarding Wizard launcher and moderation status tracking.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Calendar,
  MapPin,
  Clock,
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Info,
  ShieldCheck,
  Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EventsPage() {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, draft, published, completed, cancelled

  // Modal State for creation/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  // Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    slug: '',
    description: '',
    venue: '',
    city: '',
    country: 'India',
    startDate: '',
    endDate: '',
    timings: '09:00 AM - 06:00 PM',
    categories: '',
    status: 'draft',
    seo: {
      metaTitle: '',
      metaDescription: ''
    }
  });

  // Fetch events owned/claimed by logged in organizer
  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/events?limit=100`, { headers });
      
      if (res.data && res.data.success) {
        const allDocs = res.data.data?.docs || [];
        // Filter events owned or claimed by logged in organizer (or show created events)
        const myEvents = allDocs.filter(evt => {
          if (!user) return true;
          const userOrg = user.organization?._id || user.organization;
          const evtOrg = evt.organizer?._id || evt.organizer;
          const claimedBy = evt.claimedBy?._id || evt.claimedBy;

          return (
            (evtOrg && String(evtOrg) === String(userOrg)) ||
            (claimedBy && String(claimedBy) === String(user.id)) ||
            evt.isClaimed === true
          );
        });

        setEvents(myEvents.length > 0 ? myEvents : allDocs.filter(e => e.isClaimed));
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
      setError('Could not load events. Make sure server is running and database connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, accessToken]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate mock slug if empty
  const handleTitleBlur = () => {
    if (!eventForm.slug && eventForm.title) {
      const mockSlug = eventForm.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
      setEventForm(prev => ({ ...prev, slug: mockSlug }));
    }
  };

  // Open modal in create mode
  const openCreateModal = () => {
    setEditMode(false);
    setCurrentEventId(null);
    setEventForm({
      title: '',
      slug: '',
      description: '',
      venue: '',
      city: '',
      country: 'India',
      startDate: '',
      endDate: '',
      timings: '09:00 AM - 06:00 PM',
      categories: '',
      status: 'draft',
      seo: { metaTitle: '', metaDescription: '' }
    });
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const openEditModal = (event) => {
    setEditMode(true);
    setCurrentEventId(event._id);
    
    // Format dates for input tags (YYYY-MM-DD)
    const fmtStartDate = event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '';
    const fmtEndDate = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '';

    setEventForm({
      title: event.title,
      slug: event.slug,
      description: event.description,
      venue: event.venue,
      city: event.city,
      country: event.country || 'India',
      startDate: fmtStartDate,
      endDate: fmtEndDate,
      timings: event.timings || '09:00 AM - 06:00 PM',
      categories: event.categories?.join(', ') || '',
      status: event.status || 'draft',
      seo: {
        metaTitle: event.seo?.metaTitle || '',
        metaDescription: event.seo?.metaDescription || ''
      }
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!eventForm.title || !eventForm.description || !eventForm.venue || !eventForm.startDate || !eventForm.endDate) {
      alert('Please fill out all required fields');
      return;
    }

    // Process categories string to array
    const categoriesArray = eventForm.categories
      ? eventForm.categories.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const payload = {
      ...eventForm,
      categories: categoriesArray
    };

    try {
      if (editMode) {
        // Edit Endpoint
        const res = await axios.put(`${API_URL}/events/${currentEventId}`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data && res.data.success) {
          setEvents(prev => prev.map(evt => (evt._id === currentEventId ? res.data.event : evt)));
        }
      } else {
        // Create Endpoint
        const res = await axios.post(`${API_URL}/events`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data && res.data.success) {
          setEvents(prev => [res.data.event, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving event', err);
      alert(err.response?.data?.error || 'Failed to save event details');
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also affect tickets and registries.')) return;
    try {
      const res = await axios.delete(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setEvents(prev => prev.filter(evt => evt._id !== id));
      }
    } catch (err) {
      console.error('Error deleting event', err);
      alert('Error deleting event.');
    }
  };

  // Change Event Status Directly
  const updateEventStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `${API_URL}/events/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setEvents(prev => prev.map(evt => (evt._id === id ? { ...evt, status: res.data.event.status } : evt)));
      }
    } catch (err) {
      console.error('Error updating status', err);
      alert('Could not update status.');
    }
  };

  // Filters
  const filteredEvents = events.filter(evt => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && evt.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Control Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Event Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule, edit, publish, and track moderation approval for your expo events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/events/wizard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <Sparkles className="h-4 w-4" /> Start 10times Wizard
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" /> Quick Modal Add
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === tab.id
                  ? 'bg-secondary text-foreground shadow-sm border border-border'
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
            placeholder="Search events by title or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Render Loader, Errors, or Event Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading event lists...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h3 className="font-semibold text-foreground">Error Connecting</h3>
          <p className="text-sm max-w-md">{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3 bg-card rounded-2xl border border-border">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-bold text-foreground">No Events Registered</h3>
          <p className="text-xs max-w-sm">No scheduled events were found under the current filters.</p>
          <Link
            href="/events/wizard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all mt-2"
          >
            <Sparkles className="h-4 w-4" /> Launch Onboarding Wizard
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt) => {
            const startStr = new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const endStr = new Date(evt.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <div key={evt._id} className="flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                {/* Banner Header */}
                <div className="h-32 bg-muted relative">
                  {evt.banner ? (
                    <img src={evt.banner} alt={evt.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-sm ${
                    evt.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : evt.status === 'draft'
                      ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                      : evt.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {evt.status.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-1">{evt.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{evt.description}</p>
                  </div>

                  <div className="space-y-1.5 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{startStr} - {endStr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{evt.timings || '09:00 AM - 06:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{evt.venue}, {evt.city}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  {evt.categories && evt.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {evt.categories.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <Tag className="h-2 w-2" /> {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
                    {/* Status toggles */}
                    <div className="flex items-center gap-1">
                      {evt.status === 'draft' ? (
                        <button
                          onClick={() => updateEventStatus(evt._id, 'published')}
                          className="text-xs text-emerald-500 hover:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-semibold"
                        >
                          Publish
                        </button>
                      ) : evt.status === 'published' ? (
                        <button
                          onClick={() => updateEventStatus(evt._id, 'completed')}
                          className="text-xs text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 font-semibold"
                        >
                          Mark Completed
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(evt)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt._id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <a
                        href={`https://visitexpo.in/events/${evt.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-md transition-colors"
                        title="View Public Link"
                      >
                        <ExternalLink className="h-4.5 w-4.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">{editMode ? 'Edit Event Details' : 'Create Event'}</h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={eventForm.title}
                    onChange={handleInputChange}
                    onBlur={handleTitleBlur}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g. Global Tech Expo 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">URL Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    required
                    value={eventForm.slug}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="global-tech-expo-2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Event Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Provide a comprehensive explanation of this expo event."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Venue Hall/Address *</label>
                  <input
                    type="text"
                    name="venue"
                    required
                    value={eventForm.venue}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g. Hall 5, Pragati Maidan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={eventForm.city}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="New Delhi"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={eventForm.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={eventForm.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Daily Timings</label>
                  <input
                    type="text"
                    name="timings"
                    value={eventForm.timings}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="09:00 AM - 06:00 PM"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Categories (comma-separated)</label>
                  <input
                    type="text"
                    name="categories"
                    value={eventForm.categories}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="AI, SaaS, Security"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Lifecycle Status</label>
                  <select
                    name="status"
                    value={eventForm.status}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* SEO Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="h-4 w-4 text-primary" /> SEO Meta Options (For public directory listing)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Meta Title</label>
                    <input
                      type="text"
                      value={eventForm.seo.metaTitle}
                      onChange={(e) => setEventForm(prev => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Title for search engines"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Meta Description</label>
                    <input
                      type="text"
                      value={eventForm.seo.metaDescription}
                      onChange={(e) => setEventForm(prev => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Snippet description..."
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
