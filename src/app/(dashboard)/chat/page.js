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
import { showSweetSuccess, showSweetError, showSweetConfirm } from '../../../utils/sweetalert.js';
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
  ArchiveRestore,
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
  Briefcase,
  Trash2,
  Copy,
  MailCheck,
  RotateCcw,
  Lock,
  Crown,
  Zap,
  ArrowRight,
  Star,
  FileSpreadsheet,
  Bot,
  Tag,
  Plus,
  BookOpen,
  Info,
  FileText,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OrganizerChatPage() {
  const { user, accessToken, isExhibitorView } = useAuth();
  const router = useRouter();

  // Plan verification: Live Chat is exclusive to Starter & Enterprise plans
  const [userPlan, setUserPlan] = useState((user?.plan || 'free').toLowerCase());
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`${API_URL}/subscriptions/my-plan`, { withCredentials: true });
        if (res.data?.success && res.data.plan) {
          setUserPlan((res.data.plan.plan || 'free').toLowerCase());
        }
      } catch (_) {}
    };
    fetchPlan();
  }, [user, accessToken]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isFreePlan = !isSuperAdmin && (userPlan === 'free' || !userPlan);
  const isEnterprisePlan = isSuperAdmin || userPlan === 'enterprise' || userPlan === 'growth';
  const isStarterPlan = !isFreePlan && !isEnterprisePlan;
  const [showPreviewConsole, setShowPreviewConsole] = useState(false);

  // Enterprise Exclusive Chat States
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showLeadDossier, setShowLeadDossier] = useState(false);
  const [showCustomCannedModal, setShowCustomCannedModal] = useState(false);
  const [customReplies, setCustomReplies] = useState([
    '🏢 VIP Lounge and registration helpdesk is situated right next to Hall A Entrance.',
    '📋 Please find our official exhibition brochure, schedule, and floor plan link here.',
    '🤝 Our chief commercial director will reach out to discuss your custom booth requirement.',
    '🎟️ Fast-track VIP entry credentials have been dispatched to your registered email address.'
  ]);
  const [newCannedText, setNewCannedText] = useState('');
  const [internalNotes, setInternalNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');
  const [conversationTags, setConversationTags] = useState({});
  const [showEnterpriseLockModal, setShowEnterpriseLockModal] = useState(null);

  // Load custom replies, internal notes and tags from localStorage
  useEffect(() => {
    try {
      const savedReplies = localStorage.getItem('vx_custom_canned_replies');
      if (savedReplies) {
        const parsed = JSON.parse(savedReplies);
        if (Array.isArray(parsed) && parsed.length > 0) setCustomReplies(parsed);
      }
      const savedNotes = localStorage.getItem('vx_chat_internal_notes');
      if (savedNotes) setInternalNotes(JSON.parse(savedNotes));
      const savedTags = localStorage.getItem('vx_chat_conversation_tags');
      if (savedTags) setConversationTags(JSON.parse(savedTags));
    } catch (_) {}
  }, []);

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
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'visitor', 'exhibitor', 'unread', 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Message Input State
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Metrics State
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadConversations: 0,
    visitorCount: 0,
    exhibitorCount: 0,
    archivedCount: 0
  });

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const activeConversationRef = useRef(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Sync current note when active conversation changes
  useEffect(() => {
    if (activeConversation?._id) {
      setCurrentNote(internalNotes[activeConversation._id] || '');
    } else {
      setCurrentNote('');
    }
  }, [activeConversation?._id, internalNotes]);

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
      } else if (filterRole === 'archived') {
        params.status = 'archived';
      } else if (filterRole !== 'all') {
        params.role = filterRole;
      }
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      const res = await axios.get(`${API_URL}/chat/conversations`, {
        params,
        withCredentials: true
      });

      if (res.data?.success && Array.isArray(res.data.conversations)) {
        setConversations(res.data.conversations);

        // Keep active conversation updated if one is open
        const currentActive = activeConversationRef.current;
        if (currentActive) {
          const updatedActive = res.data.conversations.find((c) => c._id === currentActive._id);
          if (updatedActive && updatedActive.lastMessageAt !== currentActive.lastMessageAt) {
            setActiveConversation({
              ...currentActive,
              ...updatedActive,
              messages: currentActive.messages || []
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Debounce search so typing does not trigger a request for every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Load settings once; the conversation list refreshes independently.
  useEffect(() => {
    fetchSettingsAndStats();
  }, []);

  // Poll summaries only while the chat tab is visible.
  useEffect(() => {
    fetchConversations();
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchConversations(true);
    }, 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [filterRole, debouncedSearchQuery]);

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
    if (isFreePlan) {
      showSweetConfirm(
        'Upgrade Required for Live Chat',
        'Live Chat Desk is an exclusive feature for Starter and Enterprise plan organizers. Please upgrade your plan to activate live chat with attendees.',
        'Upgrade Plan',
        'Maybe Later'
      ).then((res) => {
        if (res.isConfirmed) {
          router.push('/pricing');
        }
      });
      return;
    }

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
      const payload = {
        isChatEnabled,
        chatStatus
      };
      if (isEnterprisePlan) {
        payload.chatWelcomeMessage = welcomeMessage;
        payload.chatAutoReply = chatAutoReply;
      }

      const res = await axios.patch(
        `${API_URL}/chat/settings`,
        payload,
        { withCredentials: true }
      );

      if (res.data?.success) {
        showSweetSuccess(
          'Settings Saved',
          isEnterprisePlan
            ? 'Your chat greeting and preferences have been updated.'
            : 'Your live chat availability status has been updated.'
        );
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
    if (isFreePlan) {
      showSweetConfirm(
        'Upgrade Required',
        'Replying to attendees via Live Chat is an exclusive feature for Starter and Enterprise plans. Upgrade your plan to unlock messaging.',
        'Upgrade Plan',
        'Cancel'
      ).then((res) => {
        if (res.isConfirmed) {
          router.push('/pricing');
        }
      });
      return;
    }

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

  // Archive or Unarchive Conversation
  const handleToggleArchive = async (convToToggle = null) => {
    const conv = convToToggle || activeConversation;
    if (!conv?._id) return;

    const isArchived = conv.status === 'archived';
    const newStatus = isArchived ? 'active' : 'archived';

    try {
      const res = await axios.patch(
        `${API_URL}/chat/conversations/${conv._id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (res.data?.success) {
        showSweetSuccess(
          isArchived ? 'Conversation Unarchived' : 'Conversation Archived',
          isArchived
            ? 'Thread has been restored back to your active inbox.'
            : 'Thread has been moved to your archived inquiries.'
        );

        // Update active conversation in place
        if (activeConversation?._id === conv._id) {
          setActiveConversation((prev) => (prev ? { ...prev, status: newStatus } : null));
        }

        // Update in list
        setConversations((prev) =>
          prev.map((c) => (c._id === conv._id ? { ...c, status: newStatus } : c))
        );

        fetchConversations(true);
        fetchSettingsAndStats();
      }
    } catch (err) {
      showSweetError('Error', err.response?.data?.message || 'Could not update archive status.');
    }
  };

  // Toggle Read / Unread status for conversation
  const handleToggleReadStatus = async (convTarget = null, forceRead = null) => {
    const conv = convTarget || activeConversation;
    if (!conv?._id) return;

    const currentIsRead = conv.unreadByOrganizer === 0;
    const newIsRead = forceRead !== null ? forceRead : !currentIsRead;

    try {
      const res = await axios.patch(
        `${API_URL}/chat/conversations/${conv._id}/read`,
        { isRead: newIsRead },
        { withCredentials: true }
      );

      if (res.data?.success) {
        // Optimistically update conversations
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conv._id ? { ...c, unreadByOrganizer: newIsRead ? 0 : 1 } : c
          )
        );

        if (activeConversation?._id === conv._id) {
          setActiveConversation((prev) => ({
            ...prev,
            unreadByOrganizer: newIsRead ? 0 : 1
          }));
        }

        fetchSettingsAndStats();
      }
    } catch (err) {
      console.error('Error toggling read status:', err);
      showSweetError('Error', 'Could not update read status.');
    }
  };

  // Mark all organizer conversations as read
  const handleMarkAllRead = async () => {
    if (stats.unreadConversations === 0 || isMarkingAllRead) return;

    setIsMarkingAllRead(true);
    try {
      const res = await axios.patch(
        `${API_URL}/chat/conversations/mark-all-read`,
        {},
        { withCredentials: true }
      );

      if (res.data?.success) {
        showSweetSuccess('All Marked Read', 'All attendee conversations marked as read.');
        setConversations((prev) => prev.map((c) => ({ ...c, unreadByOrganizer: 0 })));
        if (activeConversation) {
          setActiveConversation((prev) => ({ ...prev, unreadByOrganizer: 0 }));
        }
        fetchSettingsAndStats();
      }
    } catch (err) {
      showSweetError('Error', 'Could not mark all conversations as read.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convToDelete = null) => {
    const conv = convToDelete || activeConversation;
    if (!conv?._id) return;

    const confirmed = await showSweetConfirm(
      'Delete Conversation?',
      `Are you sure you want to permanently delete the inquiry with ${conv.participantName || 'this attendee'}? This cannot be undone.`,
      { confirmButtonText: 'Yes, Delete', isDanger: true }
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_URL}/chat/conversations/${conv._id}`, {
        withCredentials: true
      });

      if (res.data?.success) {
        showSweetSuccess('Conversation Deleted', 'Thread removed successfully.');
        if (activeConversation?._id === conv._id) {
          setActiveConversation(null);
        }
        setConversations((prev) => prev.filter((c) => c._id !== conv._id));
        fetchConversations(true);
        fetchSettingsAndStats();
      }
    } catch (err) {
      showSweetError('Error', err.response?.data?.message || 'Could not delete conversation.');
    }
  };

  // Delete individual message from active conversation
  const handleDeleteMessage = async (msgId) => {
    if (!activeConversation?._id || !msgId) return;

    const confirmed = await showSweetConfirm(
      'Delete Message?',
      'Are you sure you want to delete this message for everyone?',
      { confirmButtonText: 'Delete', isDanger: true }
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(
        `${API_URL}/chat/conversations/${activeConversation._id}/messages/${msgId}`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setActiveConversation((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => String(m._id) !== String(msgId)),
          lastMessage: res.data.conversation?.lastMessage || prev.lastMessage
        }));
        fetchConversations(true);
      }
    } catch (err) {
      showSweetError('Error', 'Could not delete message.');
    }
  };

  // Copy message text to clipboard
  const handleCopyMessage = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
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

  // Calculate Buyer Intent Score for Attendee Dossier
  const calculateIntentScore = (conv) => {
    if (!conv) return { score: 70, level: 'Warm Prospect', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', bar: 'bg-amber-500' };
    let score = 65;
    if (conv.participantRole === 'exhibitor') score += 15;
    if (conv.participantPhone) score += 10;
    if (conv.participantCompany) score += 5;
    if (conv.participantDesignation) score += 5;
    if (conv.messages && conv.messages.length >= 3) score += 10;
    if (score > 98) score = 98;

    if (score >= 85) {
      return { score, level: 'High-Intent Buyer', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', bar: 'bg-emerald-500' };
    } else if (score >= 70) {
      return { score, level: 'Warm Delegate', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', bar: 'bg-amber-500' };
    }
    return { score, level: 'General Inquiry', color: 'text-sky-500 bg-sky-500/10 border-sky-500/30', bar: 'bg-sky-500' };
  };

  // Enterprise Feature: AI Co-Pilot & Smart Suggestions
  const handleOpenAiCopilot = () => {
    if (!isEnterprisePlan) {
      setShowEnterpriseLockModal({
        feature: 'AI Chat Co-Pilot & Smart Suggestions',
        description:
          'AI-powered contextual reply generation, attendee intent analysis, and 1-click smart replies are exclusive to Enterprise Plan organizers. Upgrade from Starter to Enterprise to activate AI Co-Pilot.'
      });
      return;
    }

    if (!activeConversation) {
      showSweetError('No Conversation Selected', 'Please select an attendee or exhibitor conversation thread to run AI Co-Pilot.');
      return;
    }

    setIsGeneratingAi(true);
    setShowAiModal(true);

    setTimeout(() => {
      const name = activeConversation.participantName || 'Attendee';
      const role = activeConversation.participantRole || 'visitor';
      const eventName = activeConversation.eventTitle || 'the exhibition';
      const company = activeConversation.participantCompany || 'your company';

      if (role === 'exhibitor') {
        setAiSuggestions([
          {
            tag: 'Booth Booking & Commercials',
            tone: 'High-Conversion Sales',
            text: `Hello ${name}! Thank you for reaching out regarding ${eventName}. We have high-visibility corner booths available in Hall A and Hall B with direct visitor footfall. Shall I share the exhibitor floor plan and rate card with you?`
          },
          {
            tag: 'Sponsorship & VIP Branding',
            tone: 'VIP Executive',
            text: `Hi ${name}, in addition to standard stalls for ${company}, we also offer title sponsorship packages including entrance branding and directory spotlight placements. Let me know if you would like our partnership prospectus!`
          },
          {
            tag: 'Setup & Logistics Guidance',
            tone: 'Operations Support',
            text: `Hello ${name}, exhibitor move-in starts 48 hours prior to the expo inauguration. Please let our desk know what stall dimensions you require so we can place an official hold for ${company}.`
          }
        ]);
      } else {
        setAiSuggestions([
          {
            tag: 'VIP Fast-Track Pass',
            tone: 'VIP Welcoming',
            text: `Hello ${name}! Welcome to ${eventName}. We are delighted to have you join us. I can arrange complimentary VIP fast-track badges for you and your colleagues from ${company} right away!`
          },
          {
            tag: 'Conference Schedule & Keynotes',
            tone: 'Informative',
            text: `Hi ${name}, our expo hours are 10:00 AM to 6:00 PM daily. Keynote panels, B2B buyer matchmaking, and innovation spotlights take place in the Grand Convention Hall. Are you looking for any specific industry tracks?`
          },
          {
            tag: 'Exhibitor Matchmaking',
            tone: 'Business Matchmaking',
            text: `Hello ${name}, over 200+ global brands and suppliers are exhibiting at ${eventName}. If you are looking for specific suppliers or products, let me know and I will guide you directly to the relevant hall and stall numbers!`
          }
        ]);
      }
      setIsGeneratingAi(false);
    }, 500);
  };

  // Enterprise Feature: 1-Click Export All Chat Leads (.xlsx)
  const handleExportAllChatLeads = () => {
    if (!isEnterprisePlan) {
      setShowEnterpriseLockModal({
        feature: '1-Click Chat Leads Excel Export (.xlsx)',
        description:
          'Full-scale .xlsx export of all attendee chat records, verified buyer contacts, and conversation transcripts is an Enterprise Plan feature. Upgrade from Starter to unlock uncapped lead downloads.'
      });
      return;
    }

    if (!conversations || conversations.length === 0) {
      showSweetError('No Inquiries to Export', 'There are currently no active conversation leads to export.');
      return;
    }

    const exportRows = conversations.map((c, i) => {
      const tags = (conversationTags[c._id] || []).join(', ');
      const note = internalNotes[c._id] || '';
      return {
        'SL No': i + 1,
        'Attendee Name': c.participantName || 'N/A',
        'Role': (c.participantRole || 'visitor').toUpperCase(),
        'Email Address': c.participantEmail || 'N/A',
        'Phone Number': c.participantPhone || 'N/A',
        'Company / Org': c.participantCompany || 'N/A',
        'Designation': c.participantDesignation || 'N/A',
        'Associated Expo': c.eventTitle || 'General',
        'Total Messages': c.messages ? c.messages.length : 1,
        'Unread By Organizer': c.unreadByOrganizer || 0,
        'Last Message Snippet': c.lastMessage || '',
        'Last Active': c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : 'N/A',
        'Status': c.status || 'active',
        'Priority Tags': tags || 'Standard',
        'Internal CRM Notes': note || 'None'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Inquiries');
    const fileName = `VisitExpo_Enterprise_Chat_Leads_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showSweetSuccess('Export Complete!', `Downloaded ${conversations.length} chat leads in Excel (.xlsx) format.`);
  };

  // Enterprise Feature: 1-Click Export Single Conversation Transcript (.xlsx)
  const handleExportConversationTranscript = () => {
    if (!isEnterprisePlan) {
      setShowEnterpriseLockModal({
        feature: 'Conversation Transcript Export (.xlsx)',
        description:
          'Audit-grade message transcripts with delivery receipts and timestamps are exclusive to Enterprise Plan organizers.'
      });
      return;
    }

    if (!activeConversation || !activeConversation.messages || activeConversation.messages.length === 0) {
      showSweetError('No Messages Found', 'This conversation has no message history to export.');
      return;
    }

    const transcriptRows = activeConversation.messages.map((m, idx) => ({
      'Message #': idx + 1,
      'Sender Role': m.senderRole,
      'Sender Name': m.senderName,
      'Message Text': m.text,
      'Timestamp': m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A',
      'Read Status': m.read ? 'Read' : 'Delivered'
    }));

    const worksheet = XLSX.utils.json_to_sheet(transcriptRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Transcript');
    const safeName = (activeConversation.participantName || 'attendee').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Transcript_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showSweetSuccess('Transcript Exported', `Transcript for ${activeConversation.participantName} downloaded successfully.`);
  };

  // Enterprise Feature: Custom Canned Responses Manager
  const handleAddCustomCanned = (e) => {
    e.preventDefault();
    if (!newCannedText.trim()) return;
    const updated = [...customReplies, newCannedText.trim()];
    setCustomReplies(updated);
    setNewCannedText('');
    try {
      localStorage.setItem('vx_custom_canned_replies', JSON.stringify(updated));
    } catch (_) {}
    showSweetSuccess('Template Added', 'Your custom response template has been saved to your library.');
  };

  const handleDeleteCustomCanned = (indexToDelete) => {
    const updated = customReplies.filter((_, idx) => idx !== indexToDelete);
    setCustomReplies(updated);
    try {
      localStorage.setItem('vx_custom_canned_replies', JSON.stringify(updated));
    } catch (_) {}
  };

  // Enterprise Feature: Internal Notes & Tags
  const handleSaveInternalNote = () => {
    if (!activeConversation?._id) return;
    const updated = { ...internalNotes, [activeConversation._id]: currentNote };
    setInternalNotes(updated);
    try {
      localStorage.setItem('vx_chat_internal_notes', JSON.stringify(updated));
    } catch (_) {}
    showSweetSuccess('Note Saved', 'Internal note updated for this attendee.');
  };

  const handleToggleTag = (tag) => {
    if (!activeConversation?._id) return;
    const currentTags = conversationTags[activeConversation._id] || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    const updated = { ...conversationTags, [activeConversation._id]: updatedTags };
    setConversationTags(updated);
    try {
      localStorage.setItem('vx_chat_conversation_tags', JSON.stringify(updated));
    } catch (_) {}
  };

  if (isFreePlan && !showPreviewConsole) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start space-y-8 max-w-5xl mx-auto">
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-2xl pt-2 sm:pt-4">
          <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-primary/20 to-amber-500/5 border border-amber-500/30 shadow-lg mb-2 ring-8 ring-amber-500/5">
            <MessageSquare className="h-10 w-10 text-primary" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1.5 rounded-full shadow-md">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <Lock className="h-3.5 w-3.5" />
              <span>Free Organizer Plan · Feature Locked</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            Upgrade to Starter or Enterprise Plan for Live Chat
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Live Chat Desk is an exclusive feature for <strong>Starter</strong> and <strong>Enterprise</strong> plan organizers. Connect directly in real-time with verified trade visitors, registered delegates, and prospective exhibitors to close booth sales and address inquiries instantly.
          </p>
        </div>

        {/* Side-by-Side Upgrade Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Starter Plan Card */}
          <div className="relative bg-card border-2 border-primary/50 hover:border-primary rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6 transition-all hover:shadow-xl">
            <div className="absolute -top-3.5 left-6 bg-primary text-black px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Star className="h-3 w-3 fill-black" />
              <span>Most Popular · Operational Tier</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-foreground">
                  Organizer Starter Plan
                </h2>
                <p className="text-xs text-muted-foreground">
                  Operate validated events, unlock unmasked attendee leads, ticketing &amp; Live Chat Desk.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/70 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-foreground">₹14,999</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ Quarter</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  or <strong>₹49,999 / Year</strong> (Save ₹9,997 annually)
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  What&apos;s Included:
                </span>
                <ul className="space-y-2 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>1-on-1 Live Chat Desk:</strong> Real-time manual messaging with attendees (Auto-welcome greetings reserved for Enterprise)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Real-Time Alerts:</strong> Sound &amp; desktop notifications on new attendee inquiries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Full Unmasked Leads:</strong> Visitor, exhibitor, vendor &amp; partner contact details unlocked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Standard Quick Replies:</strong> 5 built-in canned responses &amp; notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Paid Ticket Selling:</strong> Monetize delegate passes with payment gateway</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Operational Lead CRM:</strong> Pipeline tracking &amp; follow-up stages</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-border/70 space-y-2">
              <Link
                href="/pricing"
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                <span>Upgrade to Starter Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-[10px] text-muted-foreground text-center block">
                Instant activation · Immediate Live Chat access
              </span>
            </div>
          </div>

          {/* Enterprise Plan Card */}
          <div className="relative bg-card border-2 border-indigo-500/50 hover:border-indigo-500 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6 transition-all hover:shadow-xl">
            <div className="absolute -top-3.5 left-6 bg-indigo-600 text-white px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Crown className="h-3 w-3 fill-white" />
              <span>Enterprise Scale · Advance Level</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-foreground">
                  Organizer Enterprise Plan
                </h2>
                <p className="text-xs text-muted-foreground">
                  Advance Live Chat Suite, AI Co-Pilot, lead dossier, custom templates &amp; VIP priority support.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/70 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-foreground">₹89,999</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ Quarter</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  or <strong>₹2,99,999 / Year</strong> (Save ₹59,997 annually)
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  What&apos;s Included:
                </span>
                <ul className="space-y-2 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>Automated Welcome Message:</strong> Instant custom greeting auto-dispatched to new visitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>AI Chat Co-Pilot:</strong> Automated smart reply generation &amp; intent analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>Live Lead Intelligence Dossier:</strong> Unmasked contacts, buyer intent score &amp; notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>Custom Canned Templates:</strong> Save unlimited organizer snippet libraries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>1-Click Excel Lead Export:</strong> Download all attendee chats &amp; transcripts (.xlsx)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>Advance Exhibitor Management:</strong> Unrestricted rosters, hall allocation &amp; stall VIP badging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span><strong>Dedicated VIP Concierge:</strong> Sub-15 minute response SLA &amp; directory spotlight ranking</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-border/70 space-y-2">
              <Link
                href="/pricing"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade to Enterprise Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-[10px] text-muted-foreground text-center block">
                Enterprise scale · VIP Onboarding &amp; SLA
              </span>
            </div>
          </div>
        </div>

        {/* Live Chat Value Feature Grid */}
        <div className="w-full bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-base font-extrabold text-foreground">
              Why Organizers Rely on Live Chat Desk
            </h3>
            <p className="text-xs text-muted-foreground">
              Convert high-intent delegates and booth inquiries while their attention is peaked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Instant Attendee Engagement</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Answer attendee questions regarding entry passes, speaker schedules, and venue parking in seconds.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Convert Exhibitor Stalls</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Directly chat with brand sponsors and booth decision-makers browsing your expo on the national directory.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">24/7 Automated Greeting</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Configure personalized welcome messages and automated inquiry responses even during offline hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Integrated Lead CRM</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every conversation is automatically archived, categorized, and linked to your attendee lead registry.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions: Demo preview link & compare plans */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold text-muted-foreground pt-1 pb-6">
          <button
            type="button"
            onClick={() => setShowPreviewConsole(true)}
            className="hover:text-foreground underline transition-colors cursor-pointer"
          >
            Preview Live Chat Interface Demo &rarr;
          </button>
          <span>•</span>
          <Link
            href="/pricing"
            className="text-primary hover:underline font-bold"
          >
            Compare All Features &amp; Pricing Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground overflow-hidden">
      {/* Free Plan Preview Notice Bar */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
            <Lock className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Free Organizer Preview Mode — Live Chat sending &amp; messaging is disabled. Upgrade to Starter or Enterprise to activate Live Chat.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPreviewConsole(false)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              View Upgrade Plans
            </button>
            <Link
              href="/pricing"
              className="px-3 py-1 rounded-lg bg-primary text-black font-extrabold text-[11px] hover:bg-primary/90 transition-all shadow-sm"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      )}

      {/* Top Bar Header & Controls */}
      <div className="shrink-0 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title & Live Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Live Chat Desk
                </h1>
                {isEnterprisePlan ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-black px-2.5 py-0.5 rounded-full shadow-xs">
                    <Crown className="h-3 w-3 fill-black" /> Enterprise Suite · Advance Level
                  </span>
                ) : isStarterPlan ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    <Zap className="h-3 w-3" /> Starter Plan · Normal Level
                  </span>
                ) : null}
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-end sm:self-auto shrink-0">
            {/* Export All Chat Leads (.xlsx) Button */}
            <button
              type="button"
              onClick={handleExportAllChatLeads}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEnterprisePlan
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border'
              }`}
              title={isEnterprisePlan ? 'Export all attendee chat leads to Excel (.xlsx)' : 'Export Leads (.xlsx) - Enterprise Exclusive'}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">Export Leads (.xlsx)</span>
              {!isEnterprisePlan && <Crown className="h-3 w-3 text-amber-500 ml-0.5" />}
            </button>

            {/* Quick Toggle Button */}
            <button
              type="button"
              onClick={handleToggleChatEnable}
              disabled={isSavingSettings}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
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
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold transition-all cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => {
                fetchConversations();
                fetchSettingsAndStats();
              }}
              title="Refresh messages"
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick KPI Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 mt-2.5 border-t border-border/50">
          <button
            type="button"
            onClick={() => setFilterRole('all')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left ${
              filterRole === 'all'
                ? 'bg-primary/15 border-primary/40'
                : 'bg-secondary/50 border-border/40 hover:bg-secondary'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Active:</span>
            <span className="text-xs font-bold text-foreground">{stats.totalConversations}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('visitor')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left ${
              filterRole === 'visitor'
                ? 'bg-sky-500/15 border-sky-500/40'
                : 'bg-secondary/50 border-border/40 hover:bg-secondary'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Visitors:</span>
            <span className="text-xs font-bold text-foreground">{stats.visitorCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('exhibitor')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left ${
              filterRole === 'exhibitor'
                ? 'bg-purple-500/15 border-purple-500/40'
                : 'bg-secondary/50 border-border/40 hover:bg-secondary'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Exhibitors:</span>
            <span className="text-xs font-bold text-foreground">{stats.exhibitorCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('unread')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left ${
              filterRole === 'unread'
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-secondary/50 border-border/40 hover:bg-secondary'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
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
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('archived')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left col-span-2 sm:col-span-1 ${
              filterRole === 'archived'
                ? 'bg-zinc-500/20 border-zinc-500/40'
                : 'bg-secondary/50 border-border/40 hover:bg-secondary'
            }`}
          >
            <Archive className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Archived:</span>
            <span className="text-xs font-bold text-foreground">{stats.archivedCount || 0}</span>
          </button>
        </div>
      </div>

      {/* Main Split Chat Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Conversation List */}
        {/* ============================================================ */}
        <div
          className={`w-full md:w-80 lg:w-96 md:min-w-[320px] lg:min-w-[360px] md:max-w-[400px] shrink-0 flex flex-col border-r border-border bg-card/60 overflow-hidden ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box & Role Filter */}
          <div className="p-3 border-b border-border shrink-0 bg-card/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendee, company, expo..."
                className="w-full pl-9 pr-8 py-2 bg-secondary/60 hover:bg-secondary/90 focus:bg-background border border-border rounded-xl text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-5 gap-1 mt-2.5 p-1 bg-secondary/50 rounded-xl border border-border/50">
              {[
                { id: 'all', label: 'All' },
                { id: 'visitor', label: 'Visitors' },
                { id: 'exhibitor', label: 'Exhibitors' },
                { id: 'unread', label: 'Unread' },
                { id: 'archived', label: 'Archived' }
              ].map((tab) => {
                const isActive = filterRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterRole(tab.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold text-center transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-zinc-950 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.id === 'unread' && stats.unreadConversations > 0 && (
                      <span
                        className={`h-3.5 min-w-[0.9rem] px-1 rounded-full text-[8.5px] font-black flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-zinc-950 text-white' : 'bg-amber-500 text-zinc-950'
                        }`}
                      >
                        {stats.unreadConversations}
                      </span>
                    )}
                    {tab.id === 'archived' && (stats.archivedCount > 0) && (
                      <span
                        className={`h-3.5 min-w-[0.9rem] px-1 rounded-full text-[8.5px] font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-zinc-950 text-white'
                            : 'bg-secondary text-muted-foreground border border-border/50'
                        }`}
                      >
                        {stats.archivedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Mark All Read Action Bar */}
          {stats.unreadConversations > 0 && filterRole !== 'archived' && (
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-amber-500/10 border-b border-border text-[11px] shrink-0">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {stats.unreadConversations} unread {stats.unreadConversations === 1 ? 'inquiry' : 'inquiries'}
              </span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                title="Mark all conversations as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            </div>
          )}

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
                <h4 className="text-sm font-bold text-foreground">
                  {filterRole === 'archived' ? 'No archived conversations' : 'No conversations yet'}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {filterRole === 'archived'
                    ? 'Inquiries you archive will appear here for reference and can be unarchived anytime.'
                    : isChatEnabled
                    ? 'When visitors or exhibitors message you on your exhibition pages, their inquiries will appear here.'
                    : 'Turn your live chat on above to allow attendees and exhibitors to reach your team.'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?._id === conv._id;
                const isExhibitor = conv.participantRole === 'exhibitor';
                const hasUnread = conv.unreadByOrganizer > 0;
                const isArchived = conv.status === 'archived';

                return (
                  <div
                    key={conv._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectConversation(conv)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectConversation(conv);
                    }}
                    className={`group w-full text-left p-3.5 transition-all flex items-start gap-3 relative cursor-pointer border-l-4 select-none ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-secondary/40 border-transparent'
                    }`}
                  >
                    {/* User Avatar with Role Ring */}
                    <div className="relative shrink-0">
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
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-xs ${
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
                        <span className="text-[10px] text-muted-foreground shrink-0">
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
                        {isArchived && (
                          <span className="text-[9px] font-bold text-zinc-400 bg-secondary px-1.5 py-0.2 rounded border border-border ml-auto shrink-0 inline-flex items-center gap-0.5">
                            <Archive className="h-2.5 w-2.5" /> Archived
                          </span>
                        )}
                      </div>

                      {/* Event Title Pill */}
                      {conv.eventTitle && (
                        <div className="inline-block max-w-full truncate bg-secondary/80 text-[10px] font-medium text-foreground px-1.5 py-0.5 rounded border border-border/50 mb-1">
                          {conv.eventTitle}
                        </div>
                      )}

                      {/* Message Snippet & Quick Hover Actions */}
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            hasUnread
                              ? 'font-bold text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {conv.lastMessage || 'Started conversation'}
                        </p>

                        {/* Quick Card Actions on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReadStatus(conv);
                            }}
                            title={hasUnread ? 'Mark as read' : 'Mark as unread'}
                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {hasUnread ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleArchive(conv);
                            }}
                            title={isArchived ? 'Unarchive' : 'Archive'}
                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {isArchived ? (
                              <ArchiveRestore className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv);
                            }}
                            title="Delete thread"
                            className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread Counter Badge */}
                    {hasUnread && (
                      <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary text-zinc-950 text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                        {conv.unreadByOrganizer}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Active Chat Thread */}
        {/* ============================================================ */}
        <div
          className={`flex-1 min-w-0 flex bg-background h-full overflow-hidden ${
            activeConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                {/* Thread Header */}
              <div className="shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
                {/* Back button for mobile */}
                <button
                  type="button"
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 shrink-0 cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>

                {/* Participant Identity */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {activeConversation.participantName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          activeConversation.participantRole === 'exhibitor'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                        }`}
                      >
                        {activeConversation.participantRole}
                      </span>
                      {activeConversation.status === 'archived' && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {activeConversation.participantEmail && (
                        <span className="flex items-center gap-1 min-w-0">
                          <Mail className="h-3 w-3 shrink-0" />
                          <a
                            href={`mailto:${activeConversation.participantEmail}`}
                            className="hover:underline hover:text-primary truncate"
                          >
                            {activeConversation.participantEmail}
                          </a>
                        </span>
                      )}
                      {activeConversation.participantPhone && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Phone className="h-3 w-3 shrink-0" />
                          <a
                            href={`tel:${activeConversation.participantPhone}`}
                            className="hover:underline hover:text-primary"
                          >
                            {activeConversation.participantPhone}
                          </a>
                        </span>
                      )}
                      {activeConversation.participantCompany && (
                        <span className="flex items-center gap-1 truncate">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span className="truncate">{activeConversation.participantCompany}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Attendee Lead Dossier Drawer Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowLeadDossier((prev) => !prev)}
                    title={isEnterprisePlan ? 'Toggle Attendee Lead Intelligence Dossier' : 'Lead Dossier - Enterprise Feature'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                      showLeadDossier
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                        : isEnterprisePlan
                        ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border'
                    }`}
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span>Lead Dossier</span>
                    {!isEnterprisePlan && <Lock className="h-3 w-3 text-amber-500 ml-0.5" />}
                  </button>

                  {/* 1-Click Export Transcript (.xlsx) */}
                  <button
                    type="button"
                    onClick={handleExportConversationTranscript}
                    title={isEnterprisePlan ? 'Export Conversation Transcript (.xlsx)' : 'Export Transcript - Enterprise Exclusive'}
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isEnterprisePlan
                        ? 'bg-secondary hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-500 border-border hover:border-emerald-500/30'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="hidden lg:inline">Transcript</span>
                  </button>

                  {/* Linked Event Pill */}
                  {activeConversation.eventSlug && (
                    <Link
                      href={`/expo/${activeConversation.eventSlug}`}
                      target="_blank"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors"
                    >
                      <span>View Expo</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  )}

                  {/* Mark as Read / Mark as Unread Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleReadStatus()}
                    title={activeConversation.unreadByOrganizer > 0 ? 'Mark thread as read' : 'Mark thread as unread'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      activeConversation.unreadByOrganizer > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                    }`}
                  >
                    {activeConversation.unreadByOrganizer > 0 ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Mark Read</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Mark Unread</span>
                      </>
                    )}
                  </button>

                  {/* Archive or Unarchive Button */}
                  {activeConversation.status === 'archived' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleArchive()}
                      title="Restore back to Active Inbox"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      <span>Unarchive</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleArchive()}
                      title="Move conversation to Archive"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">Archive</span>
                    </button>
                  )}

                  {/* Delete Conversation Action */}
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation()}
                    title="Delete entire conversation permanently"
                    className="p-2 rounded-xl bg-secondary hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border border-border hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Archived Warning Banner with Quick Unarchive */}
                {activeConversation.status === 'archived' && (
                  <div className="max-w-lg mx-auto bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3 text-xs text-zinc-300 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Archive className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="truncate">This thread is currently archived.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive()}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      <span>Unarchive Now</span>
                    </button>
                  </div>
                )}

                {/* Event Context Header Card */}
                {activeConversation.eventTitle && (
                  <div className="max-w-md mx-auto text-center bg-card/80 border border-border rounded-xl p-2.5 shadow-2xs">
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
                        className={`group flex flex-col ${isOrg ? 'items-end' : 'items-start'} relative`}
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
                          {/* Read receipts for organizer messages */}
                          {isOrg && (
                            <span
                              className="inline-flex items-center ml-0.5"
                              title={msg.read ? 'Delivered & Read by attendee' : 'Sent'}
                            >
                              {msg.read ? (
                                <CheckCheck className="h-3 w-3 text-sky-500" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground/60" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Bubble Container with Quick Actions */}
                        <div className="relative group/bubble flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%]">
                          {/* Quick Message Actions for Organizer Messages (Left side) */}
                          {isOrg && (
                            <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 text-muted-foreground shrink-0 order-first">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.text, idx)}
                                className="p-1 rounded-md hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                                title="Copy message text"
                              >
                                {copiedMsgId === idx ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              {msg._id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="p-1 rounded-md hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Bubble Text */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm w-full ${
                              isOrg
                                ? 'bg-primary text-zinc-950 font-medium rounded-tr-xs'
                                : 'bg-card border border-border text-foreground rounded-tl-xs shadow-2xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>

                          {/* Quick Message Actions for Attendee Messages (Right side) */}
                          {!isOrg && (
                            <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 text-muted-foreground shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.text, idx)}
                                className="p-1 rounded-md hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                                title="Copy message text"
                              >
                                {copiedMsgId === idx ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
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
              <div className="shrink-0 px-4 py-2 bg-card/60 border-t border-border/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {/* AI Co-Pilot Smart Reply Button */}
                <button
                  type="button"
                  onClick={handleOpenAiCopilot}
                  className="shrink-0 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
                  title="Generate smart contextual AI replies"
                >
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                  <span>AI Smart Reply</span>
                  {isEnterprisePlan ? (
                    <span className="text-[9px] bg-black/40 text-yellow-200 px-1.5 py-0.2 rounded-full uppercase font-black tracking-wider">
                      AI
                    </span>
                  ) : (
                    <Crown className="h-3 w-3 text-yellow-300" />
                  )}
                </button>

                {/* Custom Templates Manager (Enterprise) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isEnterprisePlan) {
                      setShowEnterpriseLockModal({
                        feature: 'Custom Canned Response Templates Library',
                        description:
                          'Save unlimited custom organizer templates and canned replies with Enterprise Plan. Starter plan includes 5 fixed presets.'
                      });
                      return;
                    }
                    setShowCustomCannedModal(true);
                  }}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all flex items-center gap-1 cursor-pointer font-bold"
                  title="Manage custom canned response templates"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  <span>Templates</span>
                  {!isEnterprisePlan && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                </button>

                <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                  Quick:
                </span>
                {/* Standard + Custom Canned Chips */}
                {[...quickReplies, ...(isEnterprisePlan ? customReplies : [])].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="shrink-0 text-[11px] px-3 py-1 rounded-full bg-secondary/80 hover:bg-primary hover:text-zinc-950 border border-border text-muted-foreground transition-all truncate max-w-[220px] cursor-pointer font-medium"
                    title={`Send: "${chip}"`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="shrink-0 p-3 sm:p-4 bg-card border-t border-border">
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
                    className="flex-1 bg-secondary/70 hover:bg-secondary focus:bg-background border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                    disabled={isSending}
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="flex items-center justify-center h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-zinc-950 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/20 shrink-0 gap-1.5 cursor-pointer"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-zinc-950" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-zinc-950" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Enterprise Attendee Lead Dossier Drawer */}
            {showLeadDossier && (
              <div className="w-80 lg:w-96 shrink-0 border-l border-border bg-card flex flex-col h-full overflow-y-auto z-10 shadow-lg">
                {/* Dossier Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Attendee Lead Dossier</h4>
                      <p className="text-[10px] text-muted-foreground">Verified profile &amp; CRM intelligence</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLeadDossier(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                    title="Close Dossier"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* If not Enterprise Plan: Locked Feature Preview */}
                {!isEnterprisePlan ? (
                  <div className="p-5 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 ring-4 ring-amber-500/5">
                      <Lock className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Enterprise Feature
                      </span>
                      <h4 className="text-sm font-bold text-foreground">Lead Dossier Locked</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Buyer Intent Scoring, unmasked phone/email cards, private CRM notes, and priority tagging are exclusive to the Enterprise Plan.
                      </p>
                    </div>
                    <Link
                      href="/pricing"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade to Enterprise</span>
                    </Link>
                  </div>
                ) : (
                  /* Enterprise Unlocked Dossier Content */
                  <div className="p-4 space-y-4 text-xs">
                    {/* 1. Attendee Identity Card */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                            activeConversation.participantRole === 'exhibitor'
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                              : 'bg-gradient-to-br from-sky-500 to-blue-600'
                          }`}
                        >
                          {activeConversation.participantName
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {activeConversation.participantName}
                          </h4>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                              activeConversation.participantRole === 'exhibitor'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {activeConversation.participantRole === 'exhibitor' ? 'Exhibitor Prospect' : 'Verified Delegate'}
                          </span>
                        </div>
                      </div>

                      {activeConversation.eventTitle && (
                        <div className="p-2 rounded-lg bg-background/60 border border-border/60 text-[11px]">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">Associated Expo</span>
                          <span className="font-semibold text-foreground truncate block">{activeConversation.eventTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Buyer Intent Score Card */}
                    {(() => {
                      const intent = calculateIntentScore(activeConversation);
                      return (
                        <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Buyer Intent Score
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${intent.color}`}>
                              {intent.level}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-muted-foreground">Conversion Probability</span>
                              <span className="font-bold text-foreground">{intent.score}%</span>
                            </div>
                            <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                              <div className={`h-full ${intent.bar} transition-all duration-500`} style={{ width: `${intent.score}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Unmasked Contact Channels */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2.5">
                      <span className="font-bold text-foreground block">Direct Contact Channels</span>
                      
                      {activeConversation.participantPhone ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Phone Number</span>
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border">
                            <span className="font-mono text-xs font-semibold text-foreground select-all">
                              {activeConversation.participantPhone}
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${activeConversation.participantPhone}`}
                                className="px-2 py-1 rounded bg-secondary hover:bg-muted text-[10px] font-bold text-foreground"
                                title="Call Attendee"
                              >
                                Call
                              </a>
                              <a
                                href={`https://wa.me/${activeConversation.participantPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold"
                                title="WhatsApp Chat"
                              >
                                WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic block">No phone number recorded.</span>
                      )}

                      {activeConversation.participantEmail && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Email Address</span>
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border">
                            <span className="font-mono text-xs font-semibold text-foreground select-all truncate">
                              {activeConversation.participantEmail}
                            </span>
                            <a
                              href={`mailto:${activeConversation.participantEmail}`}
                              className="px-2 py-1 rounded bg-secondary hover:bg-muted text-[10px] font-bold text-foreground shrink-0"
                              title="Send Email"
                            >
                              Email
                            </a>
                          </div>
                        </div>
                      )}

                      {(activeConversation.participantCompany || activeConversation.participantDesignation) && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Organization &amp; Title</span>
                          <div className="p-2 rounded-lg bg-background border border-border text-foreground font-semibold">
                            {activeConversation.participantDesignation && <span>{activeConversation.participantDesignation}</span>}
                            {activeConversation.participantCompany && (
                              <span className="block text-muted-foreground text-[11px]">{activeConversation.participantCompany}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Priority Tags */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-indigo-400" /> Priority Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Hot Buyer', 'VIP Stalls', 'Keynote Attendee', 'Follow-up Required'].map((t) => {
                          const isSelected = (conversationTags[activeConversation._id] || []).includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleToggleTag(t)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-black border-primary'
                                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {isSelected ? `✓ ${t}` : `+ ${t}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Internal Organizer CRM Notes */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" /> Internal Organizer Notes
                        </span>
                        <span className="text-[10px] text-muted-foreground">Private</span>
                      </div>
                      <textarea
                        rows={3}
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        placeholder="Type internal notes regarding this attendee inquiry (e.g. quote given, requested corner stall)..."
                        className="w-full p-2.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleSaveInternalNote}
                        className="w-full py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-black text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Save Internal Note
                      </button>
                    </div>

                    {/* 6. Export Transcript (.xlsx) */}
                    <button
                      type="button"
                      onClick={handleExportConversationTranscript}
                      className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export Chat Transcript (.xlsx)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
                  type="button"
                  onClick={handleToggleChatEnable}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isChatEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-primary hover:bg-primary/90 text-zinc-950 shadow-primary/20'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  <span>{isChatEnabled ? 'Live Chat is Active' : 'Enable Live Chat Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold cursor-pointer"
                >
                  {isEnterprisePlan ? 'Configure Welcome Message' : 'Live Chat Availability'}
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
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
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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

              {/* Automated Welcome Message - ENTERPRISE ONLY */}
              {isEnterprisePlan ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Custom Welcome Greeting Message
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Crown className="h-2.5 w-2.5" />
                        Enterprise Active
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Type the message attendees see immediately upon opening chat..."
                      className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      This greeting is automatically dispatched to visitors &amp; exhibitors as soon as a new chat thread is initiated.
                    </p>
                  </div>

                  {/* Auto Reply Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Instant Welcome Auto-Reply</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Automatically dispatch the greeting message when a new conversation starts.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={chatAutoReply}
                      onChange={(e) => setChatAutoReply(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5" />
                      Automated Welcome Message — Enterprise Only
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        router.push('/pricing');
                      }}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Upgrade &rarr;
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Automated welcome greetings and instant bot auto-replies are exclusive to the <strong className="text-foreground">Enterprise Plan</strong>. On the Starter Plan, you can manually chat 1-on-1 with attendees in real-time.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-primary/20 cursor-pointer"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Enterprise AI Co-Pilot & Smart Suggestions */}
      {/* ============================================================ */}
      {showAiModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAiModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl bg-card border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5 text-foreground max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-500 border border-amber-500/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">AI Chat Co-Pilot &amp; Smart Suggestions</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full">
                      Enterprise Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contextual response recommendations tailored for {activeConversation?.participantName || 'attendee'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Suggestions Stream */}
            {isGeneratingAi ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-bold text-foreground">Generating Smart Contextual Replies...</span>
                <span className="text-[11px] text-muted-foreground">Analyzing attendee role, inquiry history, and exhibition details</span>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Select a tailored response:
                </span>
                {aiSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 hover:border-amber-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{item.tone}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{item.text}</p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => {
                          setMessageText(item.text);
                          setShowAiModal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
                      >
                        Insert into Input
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendMessage(item.text);
                          setShowAiModal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-black text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Directly</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                Tip: You can edit any generated response in the composer before sending.
              </span>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Enterprise Custom Canned Templates */}
      {/* ============================================================ */}
      {showCustomCannedModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomCannedModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Custom Canned Templates</h3>
                  <p className="text-xs text-muted-foreground">Manage your organizer quick-reply snippets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomCannedModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Add New Template Form */}
            <form onSubmit={handleAddCustomCanned} className="space-y-2">
              <label className="text-xs font-bold text-foreground">Add New Quick-Reply Template</label>
              <textarea
                rows={2}
                value={newCannedText}
                onChange={(e) => setNewCannedText(e.target.value)}
                placeholder="E.g. VIP parking passes can be claimed at Gate 3 with your registration confirmation..."
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newCannedText.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                + Add to Templates
              </button>
            </form>

            {/* Templates List */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-bold text-foreground block">Saved Custom Presets ({customReplies.length})</span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {customReplies.map((reply, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-secondary/40 border border-border/70 flex items-start justify-between gap-2">
                    <p className="text-xs text-foreground/90 leading-relaxed">{reply}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCanned(idx)}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="Delete template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-border">
              <button
                type="button"
                onClick={() => setShowCustomCannedModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Enterprise Feature Lock Intercept */}
      {/* ============================================================ */}
      {showEnterpriseLockModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEnterpriseLockModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-card border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center text-foreground">
            <div className="mx-auto inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-amber-500/15 text-amber-500 border border-amber-500/30 ring-8 ring-amber-500/5 shadow-md">
              <Crown className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                Enterprise Feature Exclusive
              </span>
              <h3 className="text-lg font-black text-foreground">{showEnterpriseLockModal.feature}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{showEnterpriseLockModal.description}</p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/pricing"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade to Enterprise Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowEnterpriseLockModal(null)}
                className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
