'use client';

/**
 * @file page.js (Organizer Live Chat Desk)
 * @description Dedicated Live Chat console for Organizers to communicate in real-time with Visitors and Exhibitors.
 * Supports:
 * - Instant Live Chat ON/OFF toggle
 * - Custom Welcome Greeting & Auto-reply setup
 * - Categorized inbox (All / Visitors / Exhibitors / Unread)
 * - Real-time polling for new messages & unread counter
 * - Quick canned replies for rapid attendee support
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import { showSweetSuccess, showSweetError } from '../../../utils/sweetalert.js';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Users,
  Building,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Calendar,
  Settings,
  Sparkles,
  RefreshCw,
  Archive,
  ChevronRight,
  ShieldCheck,
  Power,
  Sliders,
  X,
  ExternalLink,
  Check,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OrganizerChatPage() {
  const { user, accessToken, isExhibitorView } = useAuth();
  const router = useRouter();

  // Redirect visitors and exhibitors to Organizers directory & live chat
  useEffect(() => {
    if (user && (user.role === 'visitor' || user.role === 'exhibitor' || isExhibitorView)) {
      router.replace('/organizers');
    }
  }, [user, isExhibitorView, router]);

  // Settings State
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [chatStatus, setChatStatus] = useState('offline');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! Welcome to our exhibition desk. How can we assist you today?');
  const [chatAutoReply, setChatAutoReply] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filter & Search
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'visitor', 'exhibitor', 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  // Message Input State
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Metrics State
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadConversations: 0,
    visitorCount: 0,
    exhibitorCount: 0
  });

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Quick reply snippets
  const quickReplies = [
    '👋 Welcome to our exhibition desk! How can we assist you today?',
    '📍 We are located in Main Hall, Booth A-14. Feel free to stop by!',
    '🎫 You can register for your complimentary visitor pass directly on the expo page.',
    '📞 Please share your WhatsApp / phone number so our team can contact you.',
    '🤝 We have premium booth spaces still available for exhibitors. Would you like a floor plan?'
  ];

  // 1. Fetch initial chat settings & stats
  const fetchSettingsAndStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/settings`, { withCredentials: true });
      if (res.data?.success) {
        setIsChatEnabled(!!res.data.settings.isChatEnabled);
        setChatStatus(res.data.settings.chatStatus || 'offline');
        setWelcomeMessage(res.data.settings.chatWelcomeMessage || '');
        setChatAutoReply(res.data.settings.chatAutoReply !== false);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Could not load chat settings:', err);
    }
  };

  // 2. Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const params = {};
      if (filterRole === 'unread') {
        params.unreadOnly = 'true';
      } else if (filterRole !== 'all') {
        params.role = filterRole;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await axios.get(`${API_URL}/chat/conversations`, {
        params,
        withCredentials: true
      });

      if (res.data?.success && Array.isArray(res.data.conversations)) {
        setConversations(res.data.conversations);

        // Keep active conversation updated if one is open
        if (activeConversation) {
          const updatedActive = res.data.conversations.find((c) => c._id === activeConversation._id);
          if (updatedActive && updatedActive.messages?.length !== activeConversation.messages?.length) {
            setActiveConversation(updatedActive);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSettingsAndStats();
    fetchConversations();
  }, [filterRole, searchQuery]);

  // Polling for live updates every 4 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchConversations(true);
      fetchSettingsAndStats();
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [filterRole, searchQuery, activeConversation?._id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);

  // Select a conversation & mark as read
  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_URL}/chat/conversations/${conv._id}`, {
        params: { role: 'organizer' },
        withCredentials: true
      });
      if (res.data?.success && res.data.conversation) {
        setActiveConversation(res.data.conversation);
        // Optimistically update unread in conversation list
        setConversations((prev) =>
          prev.map((c) => (c._id === conv._id ? { ...c, unreadByOrganizer: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Error opening conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Toggle Live Chat On/Off
  const handleToggleChatEnable = async () => {
    setIsSavingSettings(true);
    try {
      const newEnabled = !isChatEnabled;
      const newStatus = newEnabled ? 'online' : 'offline';
      const res = await axios.patch(
        `${API_URL}/chat/settings`,
        {
          isChatEnabled: newEnabled,
          chatStatus: newStatus
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setIsChatEnabled(newEnabled);
        setChatStatus(newStatus);
        showSweetSuccess(
          newEnabled ? 'Live Chat Enabled!' : 'Live Chat Paused',
          newEnabled
            ? 'Visitors and exhibitors can now chat with you directly on your exhibition pages.'
            : 'Live chat is currently paused. Visitors will be prompted to leave standard inquiries.'
        );
      }
    } catch (err) {
      showSweetError('Error', err.response?.data?.message || 'Could not update live chat status.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Settings Modal
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await axios.patch(
        `${API_URL}/chat/settings`,
        {
          isChatEnabled,
          chatStatus,
          chatWelcomeMessage: welcomeMessage,
          chatAutoReply
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        showSweetSuccess('Settings Saved', 'Your chat greeting and preferences have been updated.');
        setShowSettingsModal(false);
      }
    } catch (err) {
      showSweetError('Error', err.response?.data?.message || 'Could not save chat settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || messageText).trim();
    if (!content || !activeConversation?._id || isSending) return;

    setIsSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversations/${activeConversation._id}/messages`,
        {
          text: content,
          senderRole: 'organizer',
          senderName: user?.name || 'Organizer'
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.message) {
        const newMsg = res.data.message;
        setActiveConversation((prev) => ({
          ...prev,
          lastMessage: content,
          lastMessageAt: new Date(),
          messages: [...(prev.messages || []), newMsg]
        }));
        setMessageText('');

        // Update in list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: content, lastMessageAt: new Date() }
              : c
          )
        );
      }
    } catch (err) {
      showSweetError('Send Failed', err.response?.data?.message || 'Could not deliver message.');
    } finally {
      setIsSending(false);
    }
  };

  // Archive Conversation
  const handleArchiveConversation = async () => {
    if (!activeConversation) return;
    try {
      const newStatus = activeConversation.status === 'archived' ? 'active' : 'archived';
      await axios.patch(
        `${API_URL}/chat/conversations/${activeConversation._id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      showSweetSuccess('Updated', `Conversation marked as ${newStatus}.`);
      setActiveConversation(null);
      fetchConversations();
    } catch (err) {
      showSweetError('Error', 'Could not update conversation status.');
    }
  };

  // Helper for relative timestamps
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-background text-foreground overflow-hidden">
      {/* Top Bar Header & Controls */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title & Live Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Live Chat Desk
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isChatEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isChatEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                    }`}
                  />
                  {isChatEnabled ? 'Online & Active' : 'Chat Paused'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect in real-time with event attendees and prospective exhibitors
              </p>
            </div>
          </div>

          {/* Quick Controls: Toggle & Settings */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            {/* Quick Toggle Button */}
            <button
              onClick={handleToggleChatEnable}
              disabled={isSavingSettings}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isChatEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
            >
              <Power className={`h-4 w-4 ${isChatEnabled ? 'text-white' : 'text-muted-foreground'}`} />
              <span>{isChatEnabled ? 'Live Online' : 'Turn Chat On'}</span>
            </button>

            {/* Chat Preferences Modal Trigger */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold transition-all"
            >
              <Sliders className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Settings & Greeting</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => {
                fetchConversations();
                fetchSettingsAndStats();
              }}
              title="Refresh messages"
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick KPI Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-border/50">
          <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-muted-foreground">Total Inquiries:</span>
            <span className="text-xs font-bold text-foreground">{stats.totalConversations}</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-1.5">
            <Users className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-xs text-muted-foreground">Visitors:</span>
            <span className="text-xs font-bold text-foreground">{stats.visitorCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-1.5">
            <Building className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs text-muted-foreground">Exhibitors:</span>
            <span className="text-xs font-bold text-foreground">{stats.exhibitorCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                stats.unreadConversations > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs text-muted-foreground">Unread:</span>
            <span
              className={`text-xs font-bold ${
                stats.unreadConversations > 0 ? 'text-amber-500 font-extrabold' : 'text-foreground'
              }`}
            >
              {stats.unreadConversations}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Chat Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Conversation List */}
        {/* ============================================================ */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-card/60 flex-shrink-0 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by attendee, company, event..."
                className="w-full pl-9 pr-3 py-2 bg-secondary/70 border border-border rounded-xl text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'visitor', label: 'Visitors' },
                { id: 'exhibitor', label: 'Exhibitors' },
                { id: 'unread', label: 'Unread' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                    filterRole === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading inquiries...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">No conversations yet</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isChatEnabled
                    ? 'When visitors or exhibitors message you on your exhibition pages, their inquiries will appear here.'
                    : 'Turn your live chat on above to allow attendees and exhibitors to reach your team.'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?._id === conv._id;
                const isExhibitor = conv.participantRole === 'exhibitor';
                const hasUnread = conv.unreadByOrganizer > 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-secondary/40'
                    }`}
                  >
                    {/* User Avatar with Role Ring */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
                          isExhibitor
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20'
                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20'
                        }`}
                      >
                        {conv.participantName
                          ? conv.participantName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'U'}
                      </div>
                      {/* Role indicator pill */}
                      <span
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] text-white ${
                          isExhibitor ? 'bg-purple-600' : 'bg-sky-600'
                        }`}
                        title={isExhibitor ? 'Exhibitor' : 'Visitor'}
                      >
                        {isExhibitor ? 'E' : 'V'}
                      </span>
                    </div>

                    {/* Details & Message Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {conv.participantName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatTimeAgo(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>

                      {/* Company & Role Tag */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate mb-1">
                        <span
                          className={`font-semibold ${
                            isExhibitor ? 'text-purple-500' : 'text-sky-500'
                          }`}
                        >
                          {isExhibitor ? 'Exhibitor' : 'Visitor'}
                        </span>
                        {conv.participantCompany && (
                          <>
                            <span>•</span>
                            <span className="truncate">{conv.participantCompany}</span>
                          </>
                        )}
                      </div>

                      {/* Event Title Pill */}
                      {conv.eventTitle && (
                        <div className="inline-block max-w-full truncate bg-secondary/80 text-[10px] font-medium text-foreground px-1.5 py-0.5 rounded border border-border/50 mb-1">
                          {conv.eventTitle}
                        </div>
                      )}

                      {/* Message Snippet */}
                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? 'font-bold text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {conv.lastMessage || 'Started conversation'}
                      </p>
                    </div>

                    {/* Unread Counter Badge */}
                    {hasUnread && (
                      <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
                        {conv.unreadByOrganizer}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Active Chat Thread */}
        {/* ============================================================ */}
        <div
          className={`flex-1 flex flex-col bg-background h-full ${
            activeConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
                {/* Back button for mobile */}
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>

                {/* Participant Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      activeConversation.participantRole === 'exhibitor'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {activeConversation.participantName
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {activeConversation.participantName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          activeConversation.participantRole === 'exhibitor'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                        }`}
                      >
                        {activeConversation.participantRole}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {activeConversation.participantEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${activeConversation.participantEmail}`}
                            className="hover:underline hover:text-primary truncate"
                          >
                            {activeConversation.participantEmail}
                          </a>
                        </span>
                      )}
                      {activeConversation.participantPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <a
                            href={`tel:${activeConversation.participantPhone}`}
                            className="hover:underline hover:text-primary"
                          >
                            {activeConversation.participantPhone}
                          </a>
                        </span>
                      )}
                      {activeConversation.participantCompany && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          <span>{activeConversation.participantCompany}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Linked Event Pill */}
                  {activeConversation.eventSlug && (
                    <Link
                      href={`/expo/${activeConversation.eventSlug}`}
                      target="_blank"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                    >
                      <span>View Expo</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  )}

                  {/* Archive / Status Action */}
                  <button
                    onClick={handleArchiveConversation}
                    title={
                      activeConversation.status === 'archived'
                        ? 'Unarchive conversation'
                        : 'Archive conversation'
                    }
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Event Context Header Card */}
                {activeConversation.eventTitle && (
                  <div className="max-w-md mx-auto text-center bg-card/60 border border-border rounded-xl p-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Inquiry Related to Exhibition
                    </span>
                    <h4 className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {activeConversation.eventTitle}
                    </h4>
                  </div>
                )}

                {/* Messages List */}
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((msg, idx) => {
                    const isOrg = msg.senderRole === 'organizer';
                    const isSystem = msg.senderRole === 'system';

                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-2">
                          <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isOrg ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-bold text-foreground">
                            {isOrg ? 'You (Organizer)' : msg.senderName || 'Attendee'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isOrg
                              ? 'bg-primary text-primary-foreground rounded-tr-xs'
                              : 'bg-card border border-border text-foreground rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No messages in this conversation yet. Send a reply below.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Canned Chips */}
              <div className="flex-shrink-0 px-4 py-2 bg-card/40 border-t border-border/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Quick:
                </span>
                {quickReplies.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground border border-border text-muted-foreground transition-all truncate max-w-[200px]"
                    title={chip}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-3 sm:p-4 bg-card border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Reply to ${activeConversation.participantName}... (Press Enter to send)`}
                    className="flex-1 bg-secondary/70 border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    disabled={isSending}
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/20">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Select an Attendee or Exhibitor</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Choose a conversation thread from the left sidebar to view attendee inquiries and reply in real time.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleToggleChatEnable}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isChatEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  <span>{isChatEnabled ? 'Live Chat is Active' : 'Enable Live Chat Now'}</span>
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold"
                >
                  Configure Welcome Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: Live Chat Settings & Welcome Greeting */}
      {/* ============================================================ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Live Chat Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure greeting & live availability
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Enable Live Chat on Expos</h4>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, a &quot;Chat with Organizer&quot; launcher appears for all visitors & exhibitors.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChatEnabled}
                    onChange={(e) => {
                      setIsChatEnabled(e.target.checked);
                      setChatStatus(e.target.checked ? 'online' : 'offline');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              {/* Chat Status Radio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Organizer Status Indicator</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChatStatus('online');
                      setIsChatEnabled(true);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      chatStatus === 'online'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-secondary text-muted-foreground'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Online (Active Now)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChatStatus('offline');
                      setIsChatEnabled(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      chatStatus === 'offline'
                        ? 'border-zinc-500 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        : 'border-border bg-secondary text-muted-foreground'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    <span>Offline (Paused)</span>
                  </button>
                </div>
              </div>

              {/* Automated Welcome Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Custom Welcome Greeting Message
                </label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Type the message attendees see immediately upon opening chat..."
                  className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground">
                  This greeting automatically greets visitors & exhibitors as soon as they open the chat drawer.
                </p>
              </div>

              {/* Auto Reply Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Instant Welcome Auto-Reply</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Automatically send the greeting message when a new conversation starts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={chatAutoReply}
                  onChange={(e) => setChatAutoReply(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm shadow-primary/20"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
