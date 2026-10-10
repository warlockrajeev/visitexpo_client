'use client';

/**
 * @file page.js (Organizers & Expos Directory)
 * @description Dedicated directory for Visitors and Exhibitors to browse all organizers and their exhibitions.
 * Allows searching by organizer name, expo title, city, or sector.
 * Enables visitors and exhibitors to chat directly with any organizer who has enabled Live Chat!
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building,
  Calendar,
  Search,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Filter,
  CheckCircle2,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  Send,
  X,
  Minimize2,
  Loader2,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OrganizersDirectoryPage() {
  const { user } = useAuth();

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'chat_online', or category name
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Load More Events State per Organizer
  const [expandedEventsMap, setExpandedEventsMap] = useState({});

  const toggleExpandEvents = (orgId) => {
    setExpandedEventsMap((prev) => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };

  // Interactive Live Chat Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeChatOrganizer, setActiveChatOrganizer] = useState(null);
  const [activeChatEvent, setActiveChatEvent] = useState(null);
  const [chatConversation, setChatConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Participant Form in Modal
  const [participantRole, setParticipantRole] = useState(
    user?.role === 'exhibitor' ? 'exhibitor' : 'visitor'
  );
  const [participantName, setParticipantName] = useState(user?.name || '');
  const [participantEmail, setParticipantEmail] = useState(user?.email || '');
  const [participantPhone, setParticipantPhone] = useState(user?.phone || '');
  const [participantCompany, setParticipantCompany] = useState(user?.company || '');
  const [initialChatMessage, setInitialChatMessage] = useState('');

  // Guest Session Id
  const [sessionId, setSessionId] = useState('');

  const chatEndRef = React.useRef(null);
  const chatPollRef = React.useRef(null);

  // Initialize guest session ID and prefill user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = localStorage.getItem('visitexpo_guest_chat_session');
      if (!stored) {
        stored = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('visitexpo_guest_chat_session', stored);
      }
      setSessionId(stored);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (!participantName) setParticipantName(user.name || '');
      if (!participantEmail) setParticipantEmail(user.email || '');
      if (!participantPhone) setParticipantPhone(user.phone || '');
      if (!participantCompany) setParticipantCompany(user.company || '');
      if (user.role === 'exhibitor') setParticipantRole('exhibitor');
    }
  }, [user]);

  // Fetch Organizers & Expos from Backend Directory with instant sessionStorage caching
  const fetchDirectory = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/organizers-directory`, {
        withCredentials: true
      });
      if (res.data?.success && Array.isArray(res.data.organizers)) {
        setOrganizers(res.data.organizers);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_organizers_dir_cache', JSON.stringify(res.data.organizers));
          }
        } catch (e) {
          console.warn('Could not cache organizers directory:', e);
        }
      } else {
        if (organizers.length === 0) setError('Could not load organizers directory.');
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
      if (organizers.length === 0) setError('Unable to load directory data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Instant hydration from sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_organizers_dir_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrganizers(parsed);
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read organizers cache:', e);
    }

    fetchDirectory();
  }, []);

  // Filter & Search computation
  const filteredOrganizers = useMemo(() => {
    let list = [...organizers];

    // Filter by Chat Online
    if (selectedFilter === 'chat_online') {
      list = list.filter((o) => o.isChatEnabled);
    }

    // Filter by Sector / Category if selected
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((o) =>
        Array.isArray(o.events) &&
        o.events.some((e) => (e.category || '').toLowerCase().includes(catLower))
      );
    }

    // Search Query across organizer name, scope, expo title, city
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const matchOrg =
          (o.name && o.name.toLowerCase().includes(q)) ||
          (o.shortName && o.shortName.toLowerCase().includes(q)) ||
          (o.scope && o.scope.toLowerCase().includes(q)) ||
          (o.badge && o.badge.toLowerCase().includes(q));

        const matchEvent =
          Array.isArray(o.events) &&
          o.events.some(
            (e) =>
              (e.title && e.title.toLowerCase().includes(q)) ||
              (e.city && e.city.toLowerCase().includes(q)) ||
              (e.venue && e.venue.toLowerCase().includes(q)) ||
              (e.category && e.category.toLowerCase().includes(q))
          );

        return matchOrg || matchEvent;
      });
    }

    return list;
  }, [organizers, selectedFilter, selectedCategory, searchQuery]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedCategory, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizers.length / itemsPerPage));

  const paginatedOrganizers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrganizers.slice(start, start + itemsPerPage);
  }, [filteredOrganizers, currentPage, itemsPerPage]);

  // Distinct categories from all events
  const categoriesList = useMemo(() => {
    const set = new Set();
    organizers.forEach((o) => {
      if (Array.isArray(o.events)) {
        o.events.forEach((e) => {
          if (e.category && e.category.trim()) {
            set.add(e.category.trim());
          }
        });
      }
    });
    return Array.from(set).slice(0, 8);
  }, [organizers]);

  // Overall Statistics
  const totalExposCount = useMemo(() => {
    return organizers.reduce((sum, o) => sum + (Array.isArray(o.events) ? o.events.length : 0), 0);
  }, [organizers]);

  const liveChatOnlineCount = useMemo(() => {
    return organizers.filter((o) => o.isChatEnabled).length;
  }, [organizers]);

  // Open Chat with specific organizer & optional event
  const handleOpenChat = async (org, evt = null) => {
    if (!org.isChatEnabled) {
      alert(`${org.name} currently has Live Chat offline. You can browse their expos or visit their website.`);
      return;
    }

    setActiveChatOrganizer(org);
    setActiveChatEvent(evt);
    setChatConversation(null);
    setChatMessages([]);
    setChatModalOpen(true);

    // Check for existing conversation with this organizer
    try {
      const queryParams = new URLSearchParams();
      if (user?.email) queryParams.set('email', user.email);
      else if (participantEmail) queryParams.set('email', participantEmail);
      if (sessionId) queryParams.set('sessionId', sessionId);

      const res = await axios.get(
        `${API_URL}/chat/participant/conversations?${queryParams.toString()}`,
        { withCredentials: true }
      );

      if (res.data?.success && Array.isArray(res.data.conversations)) {
        const matched = res.data.conversations.find((c) => {
          const orgMatch =
            String(c.organizer?._id || c.organizer) === String(org.organizerId || org.id);
          const evtMatch = evt
            ? String(c.event?._id || c.event) === String(evt.id) || c.eventSlug === evt.slug
            : true;
          return orgMatch && evtMatch;
        });

        if (matched) {
          setChatConversation(matched);
          setChatMessages(matched.messages || []);
        }
      }
    } catch (err) {
      console.warn('Could not check existing conversation:', err);
    }
  };

  // Start new conversation inside modal
  const handleStartChatInModal = async (e) => {
    e.preventDefault();
    if (!participantName.trim() || !participantEmail.trim()) return;

    setIsStartingChat(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversations`,
        {
          organizerId: activeChatOrganizer?.organizerId || activeChatOrganizer?.id,
          eventId: activeChatEvent?.id || null,
          eventSlug: activeChatEvent?.slug || '',
          eventTitle: activeChatEvent?.title || '',
          participantRole,
          participantName: participantName.trim(),
          participantEmail: participantEmail.trim(),
          participantPhone: participantPhone.trim(),
          participantCompany: participantCompany.trim(),
          message: initialChatMessage.trim() || `Hello ${activeChatOrganizer?.name}, I am reaching out regarding your exhibitions.`,
          sessionId
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.conversation) {
        setChatConversation(res.data.conversation);
        setChatMessages(res.data.conversation.messages || []);
        setInitialChatMessage('');
      }
    } catch (err) {
      console.error('Error starting chat in modal:', err);
      alert(err.response?.data?.message || 'Could not start conversation.');
    } finally {
      setIsStartingChat(false);
    }
  };

  // Send message in existing thread
  const handleSendMessageInModal = async (e) => {
    e.preventDefault();
    const text = chatInputText.trim();
    if (!text || !chatConversation?._id || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversations/${chatConversation._id}/messages`,
        {
          text,
          senderRole: participantRole,
          senderName: participantName || user?.name || 'Attendee',
          sessionId
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.message) {
        setChatMessages((prev) => [...prev, res.data.message]);
        setChatInputText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Polling for live chat updates in modal
  useEffect(() => {
    if (!chatModalOpen || !chatConversation?._id) return;

    const poll = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/chat/conversations/${chatConversation._id}?role=participant`,
          { withCredentials: true }
        );
        if (res.data?.success && res.data.conversation) {
          setChatMessages(res.data.conversation.messages || []);
        }
      } catch (_) {}
    };

    chatPollRef.current = setInterval(poll, 3500);
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [chatModalOpen, chatConversation?._id]);

  // Scroll to bottom
  useEffect(() => {
    if (chatEndRef.current && chatModalOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatModalOpen]);

  return (
    <div className="min-h-full bg-background text-foreground pb-16">
      {/* Top Banner & Header */}
      <div className="bg-card border-b border-border px-4 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-primary/10 text-primary border border-primary/20">
                  <Building className="h-3.5 w-3.5" />
                  B2B Trade Fair Organizers
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Chat Enabled
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-2">
                Exhibition Organizers &amp; Live Expos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Connect directly with certified trade fair organizers. When an organizer has enabled live chat, you can inquire about booth pricing, visitor passes, schedules, and exhibitor packages in real-time.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-secondary/60 border border-border rounded-2xl p-3 text-center min-w-[90px]">
                <div className="text-lg font-black text-foreground">{organizers.length}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Organizers</div>
              </div>
              <div className="bg-secondary/60 border border-border rounded-2xl p-3 text-center min-w-[90px]">
                <div className="text-lg font-black text-foreground">{totalExposCount}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Live Expos</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center min-w-[100px]">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  {liveChatOnlineCount}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Chat Online</div>
              </div>
            </div>
          </div>

          {/* Search Bar & Quick Filters */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by organizer (e.g. Informa, IES), expo title (e.g. Auto Expo), or city..."
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/70 border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Chat Online Only Toggle */}
              <button
                onClick={() =>
                  setSelectedFilter(selectedFilter === 'chat_online' ? 'all' : 'chat_online')
                }
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                  selectedFilter === 'chat_online'
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    selectedFilter === 'chat_online' ? 'bg-white' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span>Live Chat Online Only ({liveChatOnlineCount})</span>
              </button>
            </div>

            {/* Sector / Category Pills */}
            {categoriesList.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[11px] font-bold text-muted-foreground mr-1 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Sectors:
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  All Sectors
                </button>
                {categoriesList.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? 'all' : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">Loading organizers directory &amp; expos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl max-w-md mx-auto space-y-3">
            <p className="text-sm font-bold text-red-500">{error}</p>
            <button
              onClick={fetchDirectory}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredOrganizers.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-card border border-border rounded-2xl max-w-lg mx-auto p-8">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Building className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No matching organizers found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find organizers matching &quot;{searchQuery}&quot; with the selected filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-muted-foreground px-1">
              <span>
                Showing {filteredOrganizers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredOrganizers.length)} of {filteredOrganizers.length} event organizers
              </span>
              <div className="flex items-center gap-3">
                {selectedFilter === 'chat_online' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Showing only organizers with active live chat
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-secondary border border-border text-foreground rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List of Organizers */}
            <div className="grid grid-cols-1 gap-6">
              {paginatedOrganizers.map((org, orgIdx) => {
                const allEvents = Array.isArray(org.events) ? org.events : [];
                const hasExpos = allEvents.length > 0;
                const isOnline = org.isChatEnabled;
                const orgUniqueKey = org.id || org.organizerId || org.name;
                const isExpanded = !!expandedEventsMap[orgUniqueKey];
                const visibleEvents = isExpanded ? allEvents : allEvents.slice(0, 6);
                const remainingCount = allEvents.length - 6;

                return (
                  <div
                    key={`${org.id || org.organizerId || 'org'}-${orgIdx}`}
                    className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30"
                  >
                    {/* Organizer Card Header */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-card via-card to-secondary/30 border-b border-border/70 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Avatar & Details */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Organizer Logo / Monogram */}
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-border bg-background p-2 shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                              {(org.shortName || org.name).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            {org.badge && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                {org.badge}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                              Verified Organizer
                            </span>

                            {/* Live Chat Status Pill */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isOnline
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                                }`}
                              />
                              {isOnline ? 'Live Chat Online' : 'Chat Offline'}
                            </span>
                          </div>

                          {/* Organizer Name */}
                          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                            {org.name}
                          </h2>

                          {/* Bio / Scope */}
                          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed line-clamp-2">
                            {org.scope || 'Leading national and international trade fair organizer.'}
                          </p>

                          {/* Contact & Links */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                            {org.website && (
                              <a
                                href={org.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-primary font-semibold transition-colors"
                              >
                                <Globe className="h-3.5 w-3.5" />
                                <span>Official Website</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                              </a>
                            )}
                            {org.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{org.email}</span>
                              </span>
                            )}
                            {org.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{org.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Direct Chat CTA - Only shown when organizer has Live Chat online/enabled */}
                      {isOnline && (
                        <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenChat(org)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:scale-102 active:scale-98 cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Chat with Organizer</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Exhibitions Section */}
                    <div className="p-5 sm:p-6 bg-card/60">
                      <div className="flex items-center justify-between mb-3.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Organized Exhibitions ({org.events?.length || 0})
                        </h4>
                        {hasExpos && (
                          <span className="text-[11px] text-muted-foreground">
                            Click any expo to view tickets, floor plans &amp; details
                          </span>
                        )}
                      </div>

                      {hasExpos ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {visibleEvents.map((evt, idx) => (
                              <div
                                key={`${evt.id || evt.slug || 'evt'}-${idx}`}
                                className="group p-3.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-secondary/30 transition-all flex flex-col justify-between space-y-3"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start gap-3">
                                    {evt.image && (
                                      <img
                                        src={evt.image}
                                        alt={evt.title}
                                        className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div className="min-w-0">
                                      <Link
                                        href={`/expo/${evt.slug}`}
                                        className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 block leading-snug"
                                      >
                                        {evt.title}
                                      </Link>
                                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3 shrink-0 text-primary" />
                                        <span className="truncate">{evt.dates || 'Upcoming 2026'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0 text-[#FF2E63]" />
                                    <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                                  </div>
                                </div>

                                {/* Card Actions: View Expo & Chat about this Expo */}
                                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                                  <Link
                                    href={`/expo/${evt.slug}`}
                                    className="text-[11px] font-bold text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                                  >
                                    <span>View Details</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </Link>

                                  {isOnline && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenChat(org, evt)}
                                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1 transition-all cursor-pointer"
                                      title={`Chat with ${org.name} about ${evt.title}`}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      <span>Chat About Expo</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {allEvents.length > 6 && (
                            <div className="pt-3.5 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => toggleExpandEvents(orgUniqueKey)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-xs transition-all cursor-pointer hover:border-primary/40 active:scale-98"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 text-primary" />
                                    <span>Show Less ({allEvents.length} Expos)</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 text-primary" />
                                    <span>Load More Expos (+{remainingCount} more)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 bg-secondary/30 rounded-xl border border-dashed border-border/70 text-muted-foreground text-xs">
                          No public trade shows currently listed under this organizer profile.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-8">
                <span className="text-xs text-muted-foreground font-semibold">
                  Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({filteredOrganizers.length} total organizers)
                </span>

                <div className="flex items-center gap-1.5">
                  {/* First Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-all cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, currentPage - 2);
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start < maxVisible - 1) {
                        start = Math.max(1, end - maxVisible + 1);
                      }

                      if (start > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => {
                              setCurrentPage(1);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            1
                          </button>
                        );
                        if (start > 2) {
                          pages.push(
                            <span key="dots-start" className="px-1 text-xs text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentPage(i);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === i
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-1 ring-primary/30'
                                : 'border border-border bg-card hover:bg-secondary text-foreground'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (end < totalPages) {
                        if (end < totalPages - 1) {
                          pages.push(
                            <span key="dots-end" className="px-1 text-xs text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => {
                              setCurrentPage(totalPages);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-all cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE LIVE CHAT MODAL FOR VISITORS & EXHIBITORS                    */}
      {/* ========================================================================= */}
      {chatModalOpen && activeChatOrganizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg h-[620px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {activeChatOrganizer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate max-w-[220px]">
                      {activeChatOrganizer.name}
                    </h3>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-white/80 truncate">
                    {activeChatEvent ? `Regarding: ${activeChatEvent.title}` : 'Official Exhibition Desk'} • Active Now
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setChatModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {!chatConversation ? (
                /* Step 1: Start Conversation Form */
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Greeting Box */}
                  <div className="bg-secondary/70 border border-border rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Message from {activeChatOrganizer.name}:</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {activeChatOrganizer.chatWelcomeMessage ||
                        `Welcome to ${activeChatOrganizer.name}'s exhibition desk. Leave your message below to connect directly with our team.`}
                    </p>
                  </div>

                  <form onSubmit={handleStartChatInModal} className="space-y-3.5">
                    {/* Role Selector: Visitor vs Exhibitor */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        I am contacting as:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setParticipantRole('visitor')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            participantRole === 'visitor'
                              ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20'
                              : 'bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Visitor / Attendee</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setParticipantRole('exhibitor')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            participantRole === 'exhibitor'
                              ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20'
                              : 'bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          <Building className="h-3.5 w-3.5" />
                          <span>Exhibitor / Booth</span>
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        placeholder="e.g. Alex Henderson"
                        className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Your Email Address *</label>
                      <input
                        type="email"
                        required
                        value={participantEmail}
                        onChange={(e) => setParticipantEmail(e.target.value)}
                        placeholder="e.g. alex@company.com"
                        className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Phone & Company Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Mobile / WhatsApp</label>
                        <input
                          type="tel"
                          value={participantPhone}
                          onChange={(e) => setParticipantPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">
                          Company {participantRole === 'exhibitor' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={participantRole === 'exhibitor'}
                          value={participantCompany}
                          onChange={(e) => setParticipantCompany(e.target.value)}
                          placeholder="e.g. Alpha Tech"
                          className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Message to Organizer */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">
                        Your Inquiry Message *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={initialChatMessage}
                        onChange={(e) => setInitialChatMessage(e.target.value)}
                        placeholder={
                          participantRole === 'exhibitor'
                            ? `Inquiring about stall registration and booth space for ${activeChatEvent?.title || 'upcoming exhibitions'}...`
                            : `Hello, I would like information regarding badges, timings, and attendee access...`
                        }
                        className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isStartingChat}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      {isStartingChat ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Start Live Chat with Organizer</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Step 2: Active Real-time Chat Thread */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg, idx) => {
                      const isOrg = msg.senderRole === 'organizer';

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isOrg ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1 mb-1 px-1">
                            <span className="text-[10px] font-bold text-foreground">
                              {isOrg ? activeChatOrganizer.name : 'You'}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {msg.timestamp
                                ? new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                              isOrg
                                ? 'bg-secondary border border-border text-foreground rounded-tl-xs'
                                : 'bg-primary text-primary-foreground rounded-tr-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendMessageInModal}
                    className="p-3 bg-card border-t border-border flex items-center gap-2 flex-shrink-0"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder={`Message ${activeChatOrganizer.name}...`}
                      className="flex-1 bg-secondary/60 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isSendingMessage}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || isSendingMessage}
                      className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
