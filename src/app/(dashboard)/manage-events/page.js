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
import { validateEventImage } from '../../../utils/imageValidation.js';
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
  Eye,
  Ticket,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

import { renderRichText, RichTextEditor, SPONSOR_TIER_GROUPS, PRESET_SPONSOR_TIERS, CATEGORY_SUBSECTORS } from '../events/wizard/page.js';

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
    banner: '',
    venue: '',
    city: '',
    country: 'India',
    startDate: '',
    endDate: '',
    timings: '09:00 AM - 06:00 PM',
    categories: '',
    status: 'draft',
    orgName: '',
    orgEmail: '',
    orgPhone: '',
    orgWebsite: '',
    orgDesc: '',
    orgLogo: '',
    schedules: [],
    sponsorsList: [],
    faqsList: [],
    contactShortcode: '',
    isFreeEvent: true,
    paidTicketPrice: '499',
    seo: {
      metaTitle: '',
      metaDescription: ''
    }
  });

  const bannerFileInputRef = React.useRef(null);
  const [bannerValidation, setBannerValidation] = useState(null);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  const [newSponsor, setNewSponsor] = useState({ name: '', link: '', logo: '', tier: 'Platinum Sponsor' });
  const [isCustomSponsorTier, setIsCustomSponsorTier] = useState(false);
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [isSponsorUploading, setIsSponsorUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newSchedule, setNewSchedule] = useState({ name: '', date: '' });

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateEventImage(file, 'banner');
    setBannerValidation(validation);

    if (!validation.isValid) {
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
      return;
    }

    setIsBannerUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setEventForm(prev => ({ ...prev, banner: res.data.url }));
        if (res.data.width && res.data.height) {
          setBannerValidation(prev => ({
            ...prev,
            dimensions: {
              width: res.data.width,
              height: res.data.height,
              aspectRatio: prev?.dimensions?.aspectRatio || `${res.data.width}:${res.data.height}`
            }
          }));
        }
      }
    } catch (err) {
      console.error('Event banner upload error:', err);
      alert(err.response?.data?.error || 'Failed to upload event banner.');
    } finally {
      setIsBannerUploading(false);
    }
  };

  const handleOrgLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateEventImage(file, 'logo');
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setEventForm(prev => ({ ...prev, orgLogo: res.data.url }));
      }
    } catch (err) {
      console.error('Org logo upload error:', err);
      alert('Failed to upload logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSponsorLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateEventImage(file, 'logo');
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsSponsorUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setNewSponsor(prev => ({ ...prev, logo: res.data.url }));
      }
    } catch (err) {
      console.error('Sponsor logo upload error:', err);
      alert('Failed to upload sponsor logo.');
    } finally {
      setIsSponsorUploading(false);
    }
  };

  const addSponsor = () => {
    if (!newSponsor.name) return alert('Sponsor name is required');
    const finalTier = newSponsor.tier?.trim() || 'Platinum Sponsor';
    setEventForm(prev => ({
      ...prev,
      sponsorsList: [...(prev.sponsorsList || []), { ...newSponsor, tier: finalTier }]
    }));
    setNewSponsor({ name: '', link: '', logo: '', tier: 'Platinum Sponsor' });
    setIsCustomSponsorTier(false);
  };

  const removeSponsor = (index) => {
    setEventForm(prev => ({
      ...prev,
      sponsorsList: (prev.sponsorsList || []).filter((_, idx) => idx !== index)
    }));
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return alert('Question and Answer are required');
    setEventForm(prev => ({
      ...prev,
      faqsList: [...(prev.faqsList || []), { ...newFaq }]
    }));
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (index) => {
    setEventForm(prev => ({
      ...prev,
      faqsList: (prev.faqsList || []).filter((_, idx) => idx !== index)
    }));
  };

  const addSchedule = () => {
    if (!newSchedule.name || !newSchedule.date) return alert('Day/Name and Date are required');
    setEventForm(prev => ({
      ...prev,
      schedules: [...(prev.schedules || []), { ...newSchedule }]
    }));
    setNewSchedule({ name: '', date: '' });
  };

  const removeSchedule = (index) => {
    setEventForm(prev => ({
      ...prev,
      schedules: (prev.schedules || []).filter((_, idx) => idx !== index)
    }));
  };

  // Fetch events owned/claimed by logged in organizer
  const [localDraft, setLocalDraft] = useState(null);

  // Fetch events owned/claimed by logged in organizer (including drafts)
  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/events?limit=100&all=true`, { headers });
      
      if (res.data && res.data.success) {
        const allDocs = res.data.data?.docs || [];

        // Filter to only include events created by or belonging to the logged in user
        const myEvents = allDocs.filter(evt => {
          if (!user) return false;

          const userId = String(user._id || user.id || '');
          const userEmail = (user.email || '').toLowerCase().trim();
          const userOrgId = String(user.organization?._id || user.organization || '');

          const evtOrgId = String(evt.organizer?._id || evt.organizer || '');
          const evtClaimedBy = String(evt.claimedBy?._id || evt.claimedBy || '');
          const evtCreatedBy = String(evt.createdBy?._id || evt.createdBy || evt.user?._id || evt.user || '');
          const evtOrgEmail = (evt.orgEmail || '').toLowerCase().trim();

          return (
            (userId && evtClaimedBy === userId) ||
            (userId && evtCreatedBy === userId) ||
            (userOrgId && evtOrgId === userOrgId) ||
            (userEmail && evtOrgEmail === userEmail)
          );
        });

        setEvents(myEvents);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
      setError('Could not load events. Make sure server is running and database connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('visitexpo_wizard_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.title || parsed.description)) {
            setLocalDraft(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Error loading local draft', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Time picker helpers for Daily Timings
  const parse12hTo24h = (time12h) => {
    if (!time12h) return '';
    const match = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';
    let [_, hStr, mStr, ampm] = match;
    let h = parseInt(hStr, 10);
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${mStr}`;
  };

  const format24hTo12h = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return '';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
  };

  const getTimingParts = (timingsStr) => {
    if (!timingsStr) return { start: '09:00', end: '18:00' };
    const parts = timingsStr.split(/\s*-\s*/);
    const start = parse12hTo24h(parts[0]) || (parts[0] && parts[0].includes(':') ? parts[0] : '09:00');
    const end = parse12hTo24h(parts[1]) || (parts[1] && parts[1].includes(':') ? parts[1] : '18:00');
    return { start, end };
  };

  const handleTimingChange = (newStart24, newEnd24) => {
    const formattedStart = format24hTo12h(newStart24) || '09:00 AM';
    const formattedEnd = format24hTo12h(newEnd24) || '06:00 PM';
    setEventForm(prev => ({
      ...prev,
      timings: `${formattedStart} - ${formattedEnd}`
    }));
  };

  // Open modal in create mode
  const openCreateModal = () => {
    setEditMode(false);
    setCurrentEventId(null);
    setIsCustomIndustry(false);
    setBannerValidation(null);
    setEventForm({
      title: '',
      slug: '',
      description: '',
      banner: '',
      venue: '',
      city: '',
      country: 'India',
      startDate: '',
      endDate: '',
      timings: '09:00 AM - 06:00 PM',
      category: 'Technology & AI',
      industry: 'Information Technology',
      status: 'draft',
      orgName: '',
      orgEmail: '',
      orgPhone: '',
      orgWebsite: '',
      orgDesc: '',
      orgLogo: '',
      schedules: [],
      sponsorsList: [],
      faqsList: [],
      contactShortcode: '',
      isFreeEvent: true,
      paidTicketPrice: '499',
      seo: { metaTitle: '', metaDescription: '' }
    });
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const openEditModal = async (event) => {
    setEditMode(true);
    setCurrentEventId(event._id);
    setBannerValidation(null);
    
    // Format dates for input tags (YYYY-MM-DD)
    const fmtStartDate = event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '';
    const fmtEndDate = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '';

    let initialCat = 'Technology & AI';
    let initialSub = 'Information Technology';

    if (Array.isArray(event.categories) && event.categories.length > 0) {
      if (CATEGORY_SUBSECTORS[event.categories[0]]) {
        initialCat = event.categories[0];
        initialSub = event.categories[1] || CATEGORY_SUBSECTORS[initialCat]?.[0] || '';
      } else {
        const foundCat = Object.keys(CATEGORY_SUBSECTORS).find(cat =>
          CATEGORY_SUBSECTORS[cat].includes(event.categories[0])
        );
        if (foundCat) {
          initialCat = foundCat;
          initialSub = event.categories[0];
        } else {
          initialCat = 'Technology & AI';
          initialSub = event.categories[0];
        }
      }
    }

    setIsCustomIndustry(false);

    setEventForm({
      title: event.title,
      slug: event.slug,
      description: event.description,
      banner: event.banner || '',
      venue: event.venue,
      city: event.city,
      country: event.country || 'India',
      startDate: fmtStartDate,
      endDate: fmtEndDate,
      timings: event.timings || '09:00 AM - 06:00 PM',
      category: initialCat,
      industry: initialSub,
      status: event.status || 'draft',
      orgName: event.orgName || '',
      orgEmail: event.orgEmail || '',
      orgPhone: event.orgPhone || '',
      orgWebsite: event.orgWebsite || '',
      orgDesc: event.orgDesc || '',
      orgLogo: event.orgLogo || '',
      schedules: event.schedules || [],
      sponsorsList: event.sponsorsList || [],
      faqsList: event.faqsList || [],
      contactShortcode: event.contactShortcode || '',
      isFreeEvent: true,
      paidTicketPrice: '499',
      seo: {
        metaTitle: event.seo?.metaTitle || '',
        metaDescription: event.seo?.metaDescription || ''
      }
    });

    // Load existing ticket tier for this event to pre-fill ticketing fields
    try {
      const ticketRes = await axios.get(`${API_URL}/tickets`, {
        params: { eventId: event._id },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      if (ticketRes.data?.success && ticketRes.data.data?.length > 0) {
        const defaultTier = ticketRes.data.data[0];
        setEventForm(prev => ({
          ...prev,
          isFreeEvent: defaultTier.type === 'free',
          paidTicketPrice: String(defaultTier.price || 0)
        }));
      }
    } catch (ticketErr) {
      console.warn('Could not load existing ticket tiers:', ticketErr);
    }

    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!eventForm.title || !eventForm.description || !eventForm.venue || !eventForm.startDate || !eventForm.endDate) {
      alert('Please fill out all required fields');
      return;
    }

    // Process categories selection to array
    const categoriesArray = [eventForm.category, eventForm.industry].filter(Boolean);

    const payload = {
      ...eventForm,
      categories: categoriesArray,
      isFreeEvent: eventForm.isFreeEvent,
      paidTicketPrice: eventForm.isFreeEvent ? 0 : (eventForm.paidTicketPrice || 0)
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
            <Sparkles className="h-4 w-4" /> Start Visitexpo Wizard
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
          ].map((tab) => {
            const count = tab.id === 'all'
              ? events.length
              : events.filter(e => e.status === tab.id).length;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
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

      {/* Unsaved local wizard draft banner */}
      {localDraft && (statusFilter === 'all' || statusFilter === 'draft') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Unsaved Wizard Draft Detected</p>
              <p className="text-sm font-bold text-foreground">{localDraft.title || 'Untitled Expo Event'}</p>
            </div>
          </div>
          <Link
            href="/events/wizard"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors whitespace-nowrap"
          >
            Resume In Wizard <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

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
                        href={`https://visitexpo.in/event/${evt.slug}`}
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

              {/* Event Main Banner / Cover Image Upload Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Event Banner Cover (Recommended: 1920 × 1080 px | Min: 1200 × 630 px)
                  </label>
                  {bannerValidation?.dimensions && eventForm.banner && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      bannerValidation.qualityScore === 'optimal'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {bannerValidation.dimensions.width} × {bannerValidation.dimensions.height} px
                    </span>
                  )}
                </div>

                {bannerValidation?.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Image Resolution Rejected: </strong>
                      {bannerValidation.error}
                    </div>
                  </div>
                )}

                {bannerValidation?.warning && eventForm.banner && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Quality Recommendation: </strong>
                      {bannerValidation.warning}
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="relative rounded-xl border-2 border-dashed border-border p-4 bg-muted/10 text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    onChange={handleBannerUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {isBannerUploading ? (
                    <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" /> Uploading event banner to Cloudinary...
                    </div>
                  ) : eventForm.banner ? (
                    <div className="relative h-36 w-full rounded-lg overflow-hidden shadow-sm group">
                      <img src={eventForm.banner} alt="Event Banner Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg border border-white/20">
                          Change Banner Image
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventForm(prev => ({ ...prev, banner: '' }));
                            setBannerValidation(null);
                          }}
                          className="text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 px-3 py-1.5 rounded-lg border border-white/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 py-3">
                      <Upload className="mx-auto h-7 w-7 text-muted-foreground/60" />
                      <p className="text-xs font-semibold text-foreground">Click to upload event banner cover image</p>
                      <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP (Min 1200×630px, Rec 1920×1080px up to 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Event Description *</label>
                <RichTextEditor
                  value={eventForm.description}
                  onChange={(val) => setEventForm(prev => ({ ...prev, description: val }))}
                  placeholder="Provide a comprehensive explanation of this expo event."
                  rows={5}
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
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={getTimingParts(eventForm.timings).start}
                      onChange={(e) => {
                        const { end } = getTimingParts(eventForm.timings);
                        handleTimingChange(e.target.value, end);
                      }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={getTimingParts(eventForm.timings).end}
                      onChange={(e) => {
                        const { start } = getTimingParts(eventForm.timings);
                        handleTimingChange(start, e.target.value);
                      }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Primary Category *</label>
                  <select
                    name="category"
                    value={eventForm.category || 'Technology & AI'}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const subList = CATEGORY_SUBSECTORS[newCat] || [];
                      setEventForm(prev => ({
                        ...prev,
                        category: newCat,
                        industry: subList[0] || ''
                      }));
                      setIsCustomIndustry(false);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    {Object.keys(CATEGORY_SUBSECTORS).map(catKey => (
                      <option key={catKey} value={catKey}>
                        {catKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Industry Sub-Sector</label>
                  {(() => {
                    const currentSubSectors = CATEGORY_SUBSECTORS[eventForm.category] || [];
                    const isPreset = currentSubSectors.includes(eventForm.industry);
                    const selectValue = isCustomIndustry
                      ? 'CUSTOM'
                      : isPreset
                      ? eventForm.industry
                      : eventForm.industry
                      ? 'CUSTOM'
                      : currentSubSectors[0] || '';

                    return (
                      <div className="space-y-1.5">
                        <select
                          value={selectValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomIndustry(true);
                              setEventForm(prev => ({ ...prev, industry: '' }));
                            } else {
                              setIsCustomIndustry(false);
                              setEventForm(prev => ({ ...prev, industry: val }));
                            }
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          {currentSubSectors.map(sub => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value="CUSTOM">+ Custom Sub-Sector...</option>
                        </select>

                        {(isCustomIndustry || (!isPreset && eventForm.industry !== '' && eventForm.industry !== undefined)) && (
                          <input
                            type="text"
                            name="industry"
                            value={eventForm.industry || ''}
                            onChange={(e) => setEventForm(prev => ({ ...prev, industry: e.target.value }))}
                            placeholder="Type custom sub-sector..."
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
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

              {/* Organizer Profile Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  Organizer Profile
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Name</label>
                    <input
                      type="text"
                      name="orgName"
                      value={eventForm.orgName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Email</label>
                    <input
                      type="email"
                      name="orgEmail"
                      value={eventForm.orgEmail}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Phone</label>
                    <input
                      type="text"
                      name="orgPhone"
                      value={eventForm.orgPhone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Website</label>
                    <input
                      type="url"
                      name="orgWebsite"
                      value={eventForm.orgWebsite}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase">Organizer Logo</label>
                    <div className="relative border border-dashed border-border rounded-lg p-1.5 text-center bg-background hover:border-primary transition-colors cursor-pointer flex items-center justify-center h-[32px]">
                      <input
                        type="file"
                        onChange={handleOrgLogoUpload}
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : eventForm.orgLogo ? (
                        <img src={eventForm.orgLogo} alt="Org Logo" className="max-h-6 object-contain" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Click to upload</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Description</label>
                  <textarea
                    name="orgDesc"
                    value={eventForm.orgDesc}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedules Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Event Schedule Days
                </h4>
                <div className="grid gap-3 sm:grid-cols-3 items-end bg-card p-3 rounded-lg border border-border">
                  <input
                    type="text"
                    value={newSchedule.name}
                    onChange={e => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Day / Session Name"
                    className="rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={e => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addSchedule}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs h-[30px]"
                  >
                    Add Day
                  </button>
                </div>
                {eventForm.schedules && eventForm.schedules.length > 0 && (
                  <div className="space-y-1.5">
                    {eventForm.schedules.map((sch, idx) => {
                      const displayDate = sch.date && /^\d{4}-\d{2}-\d{2}$/.test(sch.date)
                        ? new Date(sch.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : sch.date;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs">
                          <div>
                            <strong>{sch.name}</strong>: {displayDate}
                          </div>
                          <button type="button" onClick={() => removeSchedule(idx)} className="text-red-500 hover:text-red-700 font-semibold px-2">
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sponsors Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Official Sponsors &amp; Partners
                </h4>
                <div className="grid gap-3 sm:grid-cols-4 items-end bg-card p-3 rounded-lg border border-border">
                  <input
                    type="text"
                    value={newSponsor.name}
                    onChange={e => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sponsor Name"
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={newSponsor.link}
                    onChange={e => setNewSponsor(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="Link"
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                  />
                  <div className="flex flex-col gap-1">
                    <select
                      value={
                        isCustomSponsorTier
                          ? 'CUSTOM'
                          : PRESET_SPONSOR_TIERS.includes(newSponsor.tier)
                          ? newSponsor.tier
                          : newSponsor.tier
                          ? 'CUSTOM'
                          : 'Platinum Sponsor'
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setIsCustomSponsorTier(true);
                          setNewSponsor(prev => ({ ...prev, tier: '' }));
                        } else {
                          setIsCustomSponsorTier(false);
                          setNewSponsor(prev => ({ ...prev, tier: val }));
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      {SPONSOR_TIER_GROUPS.map(group => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="Custom">
                        <option value="CUSTOM">+ Custom Tier / Label...</option>
                      </optgroup>
                    </select>
                    {(isCustomSponsorTier || (!PRESET_SPONSOR_TIERS.includes(newSponsor.tier) && newSponsor.tier !== '')) && (
                      <input
                        type="text"
                        value={newSponsor.tier}
                        onChange={e => setNewSponsor(prev => ({ ...prev, tier: e.target.value }))}
                        placeholder="Custom label..."
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative border border-dashed border-border rounded-lg p-1 text-center bg-background hover:border-primary transition-colors cursor-pointer flex-1 h-[28px] flex items-center justify-center">
                      <input
                        type="file"
                        onChange={handleSponsorLogoUpload}
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {isSponsorUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : newSponsor.logo ? (
                        <img src={newSponsor.logo} alt="Sponsor Logo Preview" className="max-h-5 object-contain" />
                      ) : (
                        <span className="text-[9px] text-muted-foreground">Logo</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addSponsor}
                      className="px-2 py-1 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs h-[28px]"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {eventForm.sponsorsList && eventForm.sponsorsList.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {eventForm.sponsorsList.map((sp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs">
                        <div className="flex items-center gap-2">
                          {sp.logo && <img src={sp.logo} alt="" className="h-6 w-6 object-contain rounded bg-muted" />}
                          <div>
                            <p className="font-bold">{sp.name}</p>
                            <p className="text-[9px] text-primary">{sp.tier}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeSponsor(idx)} className="text-red-500 hover:text-red-700 font-semibold px-2">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FAQs Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Frequently Asked Questions (FAQ)
                </h4>
                <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={e => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="FAQ Question"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none"
                  />
                  <textarea
                    value={newFaq.answer}
                    onChange={e => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="FAQ Answer"
                    rows={1}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                  >
                    Add FAQ
                  </button>
                </div>
                {eventForm.faqsList && eventForm.faqsList.length > 0 && (
                  <div className="space-y-1.5">
                    {eventForm.faqsList.map((faq, idx) => (
                      <div key={idx} className="p-2 rounded-lg border border-border bg-card text-xs">
                        <div className="flex justify-between items-center">
                          <strong>Q: {faq.question}</strong>
                          <button type="button" onClick={() => removeFaq(idx)} className="text-red-500 hover:text-red-700 font-semibold px-2">
                            Remove
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-0.5">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Shortcode Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Contact Form Shortcode
                </h4>
                <input
                  type="text"
                  name="contactShortcode"
                  value={eventForm.contactShortcode}
                  onChange={handleInputChange}
                  placeholder='e.g. [contact-form-7 id="1275" title="Contact Event"]'
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              {/* Ticketing Configuration Sub-section */}
              <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Ticket className="h-4 w-4 text-primary" /> Ticketing & Registration
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    onClick={() => setEventForm(prev => ({ ...prev, isFreeEvent: true }))}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all text-center ${
                      eventForm.isFreeEvent
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${eventForm.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                        {eventForm.isFreeEvent && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">Free Registration</span>
                    </div>
                  </div>
                  <div
                    onClick={() => setEventForm(prev => ({ ...prev, isFreeEvent: false }))}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all text-center ${
                      !eventForm.isFreeEvent
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${!eventForm.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                        {!eventForm.isFreeEvent && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">Paid Ticket</span>
                    </div>
                  </div>
                </div>
                {!eventForm.isFreeEvent && (
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Ticket Price (INR ₹)</label>
                    <input
                      type="number"
                      name="paidTicketPrice"
                      value={eventForm.paidTicketPrice}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                )}
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
