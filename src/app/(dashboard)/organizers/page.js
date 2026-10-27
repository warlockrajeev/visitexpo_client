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
  Lock,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Info,
  Tag,
  Award,
  Briefcase
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

/**
 * Organizer metadata enrichment helper:
 * Extracts key sectors, flagship show portfolios, and organization type
 * so every card provides rich, meaningful context to visitors and exhibitors.
 */
function getOrganizerMetaInfo(org) {
  const name = (org.name || '').toLowerCase();
  const shortName = (org.shortName || '').toLowerCase();
  const scope = (org.scope || '').toLowerCase();
  const badge = (org.badge || '').toLowerCase();

  // Flagship show portfolios
  let flagshipShows = [];
  if (name.includes('mex') || shortName.includes('mex')) {
    flagshipShows = ['Gifts World Expo', 'Sign India', 'Consumer Electronics World Expo (CEW)'];
  } else if (name.includes('informa')) {
    flagshipShows = ['Renewable Energy India (REI)', 'SATTE Travel Expo', 'CPhI & PMEC India', 'Food Ingredients'];
  } else if (name.includes('messe frankfurt')) {
    flagshipShows = ['Media Expo', 'Automechanika', 'Techtextil India', 'Light + Intelligent Building'];
  } else if (name.includes('rx global') || name.includes('reed')) {
    flagshipShows = ['India Warehousing Show', 'Fastener Fair', 'MAPIC India'];
  } else if (name.includes('nürnberg') || name.includes('nurnberg')) {
    flagshipShows = ['ACREX India', 'Fensterbau Frontale', 'Broadcast India Show'];
  } else if (name.includes('düsseldorf') || name.includes('dusseldorf')) {
    flagshipShows = ['Medical Fair India', 'Wire & Tube India', 'packtech india'];
  } else if (name.includes('cii') || name.includes('confederation of indian')) {
    flagshipShows = ['Auto Expo (Components)', 'Excon Construction', 'IETF Tech Fair'];
  } else if (name.includes('koelnmesse')) {
    flagshipShows = ['ANUTEC - International FoodTec', 'Interzum', 'India Corr Expo'];
  } else if (name.includes('worldex')) {
    flagshipShows = ['WOFX - World Furniture Expo', 'Intex South Asia'];
  } else if (name.includes('radeecal')) {
    flagshipShows = ['Agritech Bharat', 'Dairy Tech India', 'Agrochemicals Expo'];
  } else if (name.includes('bridal asia')) {
    flagshipShows = ['Bridal Asia (New Delhi)', 'Bridal Asia (Mumbai)'];
  } else if (name.includes('itpo') || name.includes('india trade promotion')) {
    flagshipShows = ['India International Trade Fair (IITF)', 'AAHAR - Int. Food & Hospitality'];
  } else if (name.includes('siam') || name.includes('automobile manufacturers')) {
    flagshipShows = ['Auto Expo – The Motor Show', 'Clean Mobility Summit'];
  } else if (name.includes('ficci')) {
    flagshipShows = ['Wings India (Civil Aviation)', 'Homeland Security Expo', 'FIBAC'];
  } else if (name.includes('triune')) {
    flagshipShows = ['AMTEX (Machine Tools)', 'PLASTASIA (Plastics Tech)'];
  } else if (name.includes('k and d') || name.includes('kd communication')) {
    flagshipShows = ['ENGIMACH (Industrial Engineering)', 'Auto Show Gujarat'];
  } else if (Array.isArray(org.events) && org.events.length > 0) {
    flagshipShows = org.events.slice(0, 3).map((e) => e.title);
  } else if (org.scope) {
    const parts = org.scope
      .split(/,|and|including/i)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter((s) => s.length > 3 && s.length < 40);
    if (parts.length > 0) flagshipShows = parts.slice(0, 3);
  }

  // Key sectors / industry focus
  let sectors = [];
  if (name.includes('mex') || shortName.includes('mex')) {
    sectors = ['Consumer Electronics', 'Corporate Gifting', 'Signage & Advertising', 'Digital Printing'];
  } else if (name.includes('informa')) {
    sectors = ['Renewable Energy', 'Pharma & Biotech', 'Travel & Hospitality', 'Jewellery & Gems'];
  } else if (name.includes('messe frankfurt')) {
    sectors = ['Automotive Aftermarket', 'Technical Textiles', 'Lighting & Automation', 'Safety & Security'];
  } else if (name.includes('cii')) {
    sectors = ['Auto Components', 'Heavy Machinery', 'Infrastructure & Metro', 'Manufacturing Policy'];
  } else if (name.includes('nürnberg') || name.includes('nurnberg')) {
    sectors = ['Building & Architecture', 'Broadcasting & Media', 'HVAC & Refrigeration'];
  } else if (name.includes('düsseldorf') || name.includes('dusseldorf')) {
    sectors = ['Medical Devices & Healthcare', 'Metallurgy & Steel', 'Packaging Technology'];
  } else if (name.includes('koelnmesse')) {
    sectors = ['Food & Beverage Processing', 'Furniture & Interior Design', 'Hardware Tools'];
  } else if (name.includes('worldex')) {
    sectors = ['Furniture & Home Decor', 'Apparel Sourcing & Fabrics', 'International Trade'];
  } else if (name.includes('radeecal')) {
    sectors = ['Agriculture & Irrigation', 'Dairy & Livestock Farming', 'Agrochemicals'];
  } else if (name.includes('bridal asia')) {
    sectors = ['Luxury Fashion & Couture', 'Fine Jewellery', 'Wedding Planning & Lifestyle'];
  } else if (name.includes('itpo')) {
    sectors = ['B2B & B2C Mega Fairs', 'Food & Hospitality', 'International Trade Pavilions'];
  } else if (name.includes('siam')) {
    sectors = ['Automobiles & Supercars', 'Electric Vehicles (EVs)', 'Clean Mobility & Batteries'];
  } else if (name.includes('ficci')) {
    sectors = ['Defense & Homeland Security', 'Civil Aviation & Drones', 'Banking & Fintech'];
  } else if (name.includes('triune') || name.includes('k and d')) {
    sectors = ['Machine Tools & CNC', 'Industrial Automation', 'Plastics & Polymers'];
  } else if (Array.isArray(org.events) && org.events.length > 0) {
    const cats = [...new Set(org.events.map((e) => e.category).filter(Boolean))];
    sectors = cats.slice(0, 4);
  }

  if (sectors.length === 0) {
    if (badge.includes('consumer') || scope.includes('consumer')) sectors.push('Consumer Goods', 'Retail & Trade');
    if (badge.includes('sign') || scope.includes('sign')) sectors.push('Signage & Print Media');
    if (badge.includes('industrial') || scope.includes('industrial')) sectors.push('Industrial Tech', 'Manufacturing');
    if (badge.includes('medical') || scope.includes('medical')) sectors.push('Healthcare & Pharma');
    if (badge.includes('food') || scope.includes('food')) sectors.push('Food & Hospitality');
    if (badge.includes('agri') || scope.includes('agri')) sectors.push('Agriculture & Farming');
  }

  if (sectors.length === 0) {
    sectors = ['B2B Trade Fairs', 'Commercial Expos', 'Industrial Showcases'];
  }

  // Type & Scope Label
  let typeLabel = 'Verified Trade Fair Organizer';
  if (org.type === 'international') {
    typeLabel = 'International Exhibition Group';
  } else if (
    org.type === 'apex' ||
    name.includes('cii') ||
    name.includes('itpo') ||
    name.includes('ficci') ||
    name.includes('siam')
  ) {
    typeLabel = 'Apex Industry Council';
  } else if (org.type === 'national') {
    typeLabel = 'National Trade Fair Organizer';
  }

  // Coverage scope
  const coverage =
    org.type === 'international' ? 'Global & International Showcases' : 'Pan-India & Regional Showcases';

  return {
    flagshipShows,
    sectors,
    typeLabel,
    coverage
  };
}

export default function OrganizersDirectoryPage() {
  const { user, isExhibitorView } = useAuth();

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'chat_online', or category name
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Handle URL query parameters (e.g. ?filter=chat_online)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get('filter');
      if (filterParam === 'chat_online') {
        setSelectedFilter('chat_online');
      }
    }
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Load More & Pagination State per Organizer for Exhibitions
  const [expandedEventsMap, setExpandedEventsMap] = useState({});
  const [expoPages, setExpoPages] = useState({});

  const toggleExpandEvents = (orgId) => {
    setExpandedEventsMap((prev) => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };

  const setExpoPage = (orgKey, page) => {
    setExpoPages((prev) => ({
      ...prev,
      [orgKey]: page
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
  const [modalFormErrors, setModalFormErrors] = useState({});

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
      if (user.name) setParticipantName(user.name);
      if (user.email) setParticipantEmail(user.email);
      if (user.phone) setParticipantPhone(user.phone);
      if (user.company || user.organization?.name) {
        setParticipantCompany(user.company || user.organization?.name);
      }
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
    return Array.from(set).slice(0, 16);
  }, [organizers]);

  // Overall Statistics
  const totalExposCount = useMemo(() => {
    return organizers.reduce((sum, o) => sum + (Array.isArray(o.events) ? o.events.length : 0), 0);
  }, [organizers]);

  const liveChatOnlineCount = useMemo(() => {
    return organizers.filter((o) => o.isChatEnabled).length;
  }, [organizers]);

  // Open Chat with specific organizer & optional event (supports prefilled role and message)
  const handleOpenChat = async (org, evt = null, initialRole = null, initialMsg = '') => {
    setActiveChatOrganizer(org);
    setActiveChatEvent(evt);
    if (initialRole) {
      setParticipantRole(initialRole);
    } else if (user?.role === 'exhibitor') {
      setParticipantRole('exhibitor');
    }
    setInitialChatMessage(initialMsg || '');
    setChatConversation(null);
    setChatMessages([]);
    setModalFormErrors({});
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

  // Strict field-type validation logic
  const validateChatField = (field, value, role = participantRole) => {
    const val = (value || '').trim();
    switch (field) {
      case 'name': {
        if (!val) return 'Please provide your full name.';
        if (val.length < 2) return 'Full name must be at least 2 characters.';
        // Reject pure symbols or numbers; name must contain valid letters
        const letterCount = (val.match(/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g) || []).length;
        if (letterCount < 2) return 'Please enter a valid name (letters only).';
        const validNameRegex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
        if (!validNameRegex.test(val)) return 'Name should only contain letters and standard punctuation.';
        return null;
      }
      case 'email': {
        if (!val) return 'Please provide your email address.';
        // Strict RFC email standard check
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(val)) return 'Please enter a valid email address (e.g. name@domain.com).';
        return null;
      }
      case 'phone': {
        // Optional for visitors, but if entered it must be a valid telephone number
        if (!val) return null;
        const digits = val.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          return 'Please enter a valid phone number (7 to 15 digits).';
        }
        const phoneRegex = /^(\+?[0-9\s\-()]{7,20})$/;
        if (!phoneRegex.test(val)) {
          return 'Phone number contains invalid characters.';
        }
        return null;
      }
      case 'company': {
        if (role === 'exhibitor') {
          if (!val) return 'Company name is required for exhibitors.';
        }
        if (val) {
          if (val.length < 2) return 'Company name must be at least 2 characters.';
          const alphaNumCount = (val.match(/[a-zA-Z0-9]/g) || []).length;
          if (alphaNumCount < 2) return 'Please enter a valid company name (letters or numbers).';
        }
        return null;
      }
      case 'message': {
        if (!val) return 'Please type a brief message to start the inquiry.';
        if (val.length < 5) return 'Message must be at least 5 characters.';
        const alphaNumCount = (val.match(/[a-zA-Z0-9]/g) || []).length;
        if (alphaNumCount < 3) return 'Please enter a meaningful message with text.';
        return null;
      }
      default:
        return null;
    }
  };

  const handleFieldBlur = (field) => {
    let val = '';
    if (field === 'name') val = participantName;
    else if (field === 'email') val = participantEmail;
    else if (field === 'phone') val = participantPhone;
    else if (field === 'company') val = participantCompany;
    else if (field === 'message') val = initialChatMessage;

    const err = validateChatField(field, val, participantRole);
    setModalFormErrors((prev) => {
      if (err) {
        return { ...prev, [field]: err };
      } else {
        if (!prev[field]) return prev;
        const updated = { ...prev };
        delete updated[field];
        return updated;
      }
    });
  };

  // Start new conversation inside modal
  const handleStartChatInModal = async (e) => {
    e.preventDefault();

    // Comprehensive field type validation on submit
    const nameErr = validateChatField('name', participantName, participantRole);
    const emailErr = validateChatField('email', participantEmail, participantRole);
    const phoneErr = validateChatField('phone', participantPhone, participantRole);
    const companyErr = validateChatField('company', participantCompany, participantRole);
    const messageErr = validateChatField('message', initialChatMessage, participantRole);

    const errors = {};
    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (phoneErr) errors.phone = phoneErr;
    if (companyErr) errors.company = companyErr;
    if (messageErr) errors.message = messageErr;

    if (Object.keys(errors).length > 0) {
      setModalFormErrors(errors);
      return;
    }
    setModalFormErrors({});

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
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href="/organizers"
                onClick={(e) => {
                  setSelectedFilter('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  const el = document.getElementById('organizers-directory-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="group bg-card hover:bg-amber-100/80 dark:hover:bg-amber-950/40 border border-border/80 hover:border-amber-400 rounded-2xl p-3 sm:p-3.5 text-center min-w-[95px] sm:min-w-[105px] shadow-2xs hover:shadow-lg hover:shadow-amber-500/15 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer block"
                title="View all 38 exhibition organizers"
              >
                <Building className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1 transition-transform duration-200 group-hover:scale-115" />
                <div className="text-lg sm:text-xl font-black text-foreground">{organizers.length}</div>
                <div className="text-[10px] font-extrabold text-muted-foreground group-hover:text-amber-800 dark:group-hover:text-amber-300 uppercase tracking-wider transition-colors">Organizers</div>
              </Link>

              <Link
                href="/expos"
                className="group bg-card hover:bg-amber-100/80 dark:hover:bg-amber-950/40 border border-border/80 hover:border-amber-400 rounded-2xl p-3 sm:p-3.5 text-center min-w-[95px] sm:min-w-[105px] shadow-2xs hover:shadow-lg hover:shadow-amber-500/15 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer block"
                title="Browse all 2,522 Live Expos & claim visitor passes"
              >
                <Calendar className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1 transition-transform duration-200 group-hover:scale-115" />
                <div className="text-lg sm:text-xl font-black text-foreground">{totalExposCount}</div>
                <div className="text-[10px] font-extrabold text-muted-foreground group-hover:text-amber-800 dark:group-hover:text-amber-300 uppercase tracking-wider transition-colors">Live Expos</div>
              </Link>

              <Link
                href={user?.role === 'organizer' && !isExhibitorView ? '/chat' : '/organizers?filter=chat_online'}
                onClick={(e) => {
                  if (user?.role === 'organizer' && !isExhibitorView) {
                    return; // Let Link navigate directly to /chat
                  }
                  e.preventDefault();
                  setSelectedFilter(selectedFilter === 'chat_online' ? 'all' : 'chat_online');
                  const el = document.getElementById('organizers-directory-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group border rounded-2xl p-3 sm:p-3.5 text-center min-w-[100px] sm:min-w-[110px] shadow-2xs hover:shadow-lg hover:-translate-y-1 hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer block ${
                  selectedFilter === 'chat_online'
                    ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20'
                }`}
                title={
                  user?.role === 'organizer' && !isExhibitorView
                    ? 'Open Organizer Live Chat Desk'
                    : 'Filter organizers with active live chat'
                }
              >
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  {liveChatOnlineCount}
                </div>
                <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  {user?.role === 'organizer' && !isExhibitorView ? 'Chat Desk' : 'Chat Online'}
                </div>
              </Link>
            </div>
          </div>

          {/* Directory Purpose & Value Guide Banner */}
          <div className="bg-gradient-to-r from-secondary/60 via-card to-amber-500/5 border border-border/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>What is the Organizers &amp; Expos Directory for?</span>
                    <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">• Direct Trade Connection</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 max-w-3xl">
                    <strong className="text-foreground font-semibold">Exhibitors &amp; Brands:</strong> Contact certified organizers directly to reserve booth space, request floor layouts, and negotiate stall packages.{' '}
                    <strong className="text-foreground font-semibold">Visitors &amp; Trade Buyers:</strong> Discover upcoming trade shows in your sector, register for free visitor passes, and inquire with official event desks.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold shrink-0 self-start md:self-center">
                <span className="px-2 py-1 rounded-lg bg-card border border-border/80 text-foreground flex items-center gap-1 shadow-2xs">
                  <Building className="h-3 w-3 text-primary" />
                  Stall Booking
                </span>
                <span className="px-2 py-1 rounded-lg bg-card border border-border/80 text-foreground flex items-center gap-1 shadow-2xs">
                  <Users className="h-3 w-3 text-emerald-500" />
                  Visitor Passes
                </span>
                <span className="px-2 py-1 rounded-lg bg-card border border-border/80 text-foreground flex items-center gap-1 shadow-2xs">
                  <MessageSquare className="h-3 w-3 text-amber-500" />
                  Direct Chat Desk
                </span>
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
                  className="w-full pl-10 pr-9 py-2.5 bg-card hover:bg-secondary/40 focus:bg-card border border-border/80 hover:border-amber-500/60 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs shrink-0 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                  selectedFilter === 'chat_online'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-500/40'
                    : 'bg-card hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40 hover:border-emerald-400 text-foreground hover:text-emerald-800 dark:hover:text-emerald-300 border border-border/80'
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

            {/* Sector / Category Pills with Rich Hover Background */}
            {categoriesList.length > 0 && (
              <div className="p-1.5 sm:p-2 rounded-2xl bg-secondary/50 dark:bg-card/90 border border-border/80 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground shadow-2xs">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-amber-500" /> Sectors:
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 cursor-pointer shadow-2xs ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border border-amber-500 shadow-md ring-2 ring-amber-500/40 hover:from-amber-400 hover:to-yellow-300 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-card hover:bg-amber-400 hover:text-black hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-black text-foreground/80 border border-border/80 hover:shadow-md hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  All Sectors
                </button>
                {categoriesList.map((cat, idx) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border border-amber-500 shadow-md ring-2 ring-amber-500/40 hover:from-amber-400 hover:to-yellow-300 hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-card hover:bg-amber-400 hover:text-black hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-black text-foreground/80 border border-border/80 hover:shadow-md hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && (
                        <span
                          className="h-4 w-4 rounded-full bg-black/20 hover:bg-black/40 text-black text-[10px] inline-flex items-center justify-center font-black"
                          title="Clear sector filter"
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div id="organizers-directory-list" className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 scroll-mt-6">
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
            <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
              {paginatedOrganizers.map((org, orgIdx) => {
                const allEvents = Array.isArray(org.events) ? org.events : [];
                const hasExpos = allEvents.length > 0;
                const isOnline = org.isChatEnabled;
                const orgUniqueKey = org.id || org.organizerId || org.name;
                const isExpanded = !!expandedEventsMap[orgUniqueKey];
                const exposPerPage = 6;
                const totalExpoPages = Math.ceil(allEvents.length / exposPerPage);
                const currentExpoPage = Math.min(
                  Math.max(1, expoPages[orgUniqueKey] || 1),
                  Math.max(1, totalExpoPages)
                );
                const startExpoIdx = (currentExpoPage - 1) * exposPerPage;
                const endExpoIdx = Math.min(startExpoIdx + exposPerPage, allEvents.length);
                const visibleEvents = isExpanded
                  ? allEvents
                  : allEvents.slice(startExpoIdx, endExpoIdx);
                const remainingCount = Math.max(0, allEvents.length - 6);
                const metaInfo = getOrganizerMetaInfo(org);

                const handleExpoPageChange = (targetPage) => {
                  setExpoPage(orgUniqueKey, targetPage);
                  if (isExpanded) {
                    setExpandedEventsMap((prev) => ({
                      ...prev,
                      [orgUniqueKey]: false
                    }));
                  }
                };

                return (
                  <div
                    key={`${org.id || org.organizerId || 'org'}-${orgIdx}`}
                    className="group/org bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 hover:bg-card/95 hover:-translate-y-0.5 relative"
                  >
                    {/* Organizer Card Header */}
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-card via-card to-secondary/30 group-hover/org:to-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors duration-200">
                      {/* Left: Avatar & Details */}
                      <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                        {/* Organizer Logo / Monogram */}
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border border-border/80 bg-background p-1.5 shrink-0 flex items-center justify-center shadow-2xs overflow-hidden group-hover/org:border-primary/50 group-hover/org:scale-105 transition-all duration-200 mt-0.5">
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-base sm:text-lg">
                              {(org.shortName || org.name).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {metaInfo.typeLabel && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-foreground border border-border/70 shadow-2xs">
                                {metaInfo.typeLabel}
                              </span>
                            )}

                            {org.badge && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                {org.badge}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              Verified Organizer
                            </span>

                            {/* Live Chat Status Pill */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
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
                              {isOnline ? 'Chat Online' : 'Chat Offline'}
                            </span>

                            {/* Expos Count Pill */}
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/60">
                              <Calendar className="h-3 w-3 opacity-70 text-amber-500" />
                              {allEvents.length} {allEvents.length === 1 ? 'Expo' : 'Expos'}
                            </span>
                          </div>

                          {/* Organizer Name */}
                          <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                            {org.name}
                          </h2>

                          {/* Bio / Scope */}
                          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed line-clamp-1">
                            {org.scope || 'Leading national and international trade fair organizer.'}
                          </p>

                          {/* Industry Sectors / Focus Chips */}
                          {metaInfo.sectors.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Tag className="h-2.5 w-2.5 text-amber-500" />
                                Sectors:
                              </span>
                              {metaInfo.sectors.map((sec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary/80 border border-border/70 text-foreground/90 hover:border-amber-400/60 transition-colors"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Services Handled & Coverage */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium pt-0.5">
                            <span className="inline-flex items-center gap-1 text-foreground/80">
                              <Building className="h-3 w-3 text-primary opacity-80" />
                              <span>Stall Space &amp; Booth Booking</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-foreground/80">
                              <Users className="h-3 w-3 text-emerald-500 opacity-80" />
                              <span>Visitor Passes &amp; Badges</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-foreground/80">
                              <Clock className="h-3 w-3 text-amber-500 opacity-80" />
                              <span>{metaInfo.coverage}</span>
                            </span>
                          </div>

                          {/* Contact & Links */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
                            {org.website && (
                              <a
                                href={org.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-primary font-semibold transition-colors"
                              >
                                <Globe className="h-3 w-3" />
                                <span>Official Website</span>
                                <ExternalLink className="h-2 w-2 opacity-70" />
                              </a>
                            )}
                            {org.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{org.email}</span>
                              </span>
                            )}
                            {org.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{org.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Direct Chat / Inquiry CTA */}
                      <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenChat(org)}
                          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer ${
                            isOnline
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 font-extrabold'
                              : 'bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 text-foreground font-bold'
                          }`}
                          title={isOnline ? `Chat live with ${org.name}` : `Send an inquiry message to ${org.name}`}
                        >
                          <MessageSquare className={`h-3.5 w-3.5 ${isOnline ? 'text-white' : 'text-primary'}`} />
                          <span>{isOnline ? 'Chat with Organizer' : 'Inquire / Message Desk'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Exhibitions Section OR Upcoming Editions Showcase Panel */}
                    {hasExpos ? (
                      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-muted/15 border-t border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-primary" />
                            Organized Exhibitions ({allEvents.length})
                          </h4>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            Click any expo to view tickets &amp; details
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {visibleEvents.map((evt, idx) => (
                            <div
                              key={`${evt.id || evt.slug || 'evt'}-${idx}`}
                              className="group/evt p-2.5 rounded-xl border border-border/80 bg-card hover:bg-amber-100/70 dark:hover:bg-amber-950/40 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200 flex flex-col justify-between space-y-2 cursor-pointer"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-2.5">
                                  {evt.image && (
                                    <img
                                      src={evt.image}
                                      alt={evt.title}
                                      className="h-9 w-9 rounded-lg object-cover shrink-0 border border-border"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      href={`/expo/${evt.slug}`}
                                      className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 block leading-snug"
                                    >
                                      {evt.title}
                                    </Link>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                      <Clock className="h-2.5 w-2.5 shrink-0 text-primary" />
                                      <span className="truncate">{evt.dates || 'Upcoming 2026'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <MapPin className="h-2.5 w-2.5 shrink-0 text-[#FF2E63]" />
                                  <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                                </div>
                              </div>

                              {/* Card Actions: View Expo & Chat about this Expo */}
                              <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-1.5">
                                <Link
                                  href={`/expo/${evt.slug}`}
                                  className="text-[10px] font-bold text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                                >
                                  <span>View Details</span>
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleOpenChat(org, evt)}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 transition-all cursor-pointer ${
                                    isOnline
                                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                                      : 'text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border-border'
                                  }`}
                                  title={isOnline ? `Chat with ${org.name} about ${evt.title}` : `Inquire with ${org.name} about ${evt.title}`}
                                >
                                  <MessageSquare className="h-2.5 w-2.5" />
                                  <span>{isOnline ? 'Chat About Expo' : 'Inquire'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {allEvents.length > 6 && (
                          <div className="pt-2.5 mt-2 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                            {/* Left: Show All / Show Less Button & Range Summary */}
                            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                              <button
                                type="button"
                                onClick={() => toggleExpandEvents(orgUniqueKey)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-2xs transition-all cursor-pointer hover:border-primary/40 active:scale-98"
                                title={isExpanded ? 'Switch to paginated view (6 expos per page)' : `Show all ${allEvents.length} expos at once`}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3.5 w-3.5 text-primary" />
                                    <span>Show Less ({allEvents.length} Expos)</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                    <span>Show All Expos (+{remainingCount} more)</span>
                                  </>
                                )}
                              </button>

                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {isExpanded
                                  ? `Showing all ${allEvents.length} expos`
                                  : `Page ${currentExpoPage} of ${totalExpoPages} (${startExpoIdx + 1}–${endExpoIdx} of ${allEvents.length})`}
                              </span>
                            </div>

                            {/* Right: Pagination Option (First, Prev, Page Numbers, Next, Last) */}
                            {totalExpoPages > 1 && (
                              <div className="flex items-center gap-1 flex-wrap justify-center">
                                {/* First Page */}
                                <button
                                  type="button"
                                  onClick={() => handleExpoPageChange(1)}
                                  disabled={currentExpoPage === 1 && !isExpanded}
                                  className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:border-primary/40"
                                  title="First Page of Expos"
                                >
                                  <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>

                                {/* Previous Page */}
                                <button
                                  type="button"
                                  onClick={() => handleExpoPageChange(Math.max(1, currentExpoPage - 1))}
                                  disabled={currentExpoPage === 1 && !isExpanded}
                                  className="h-7 px-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold text-foreground transition-all cursor-pointer flex items-center gap-0.5 shadow-2xs hover:border-primary/40"
                                  title="Previous Page of Expos"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Prev</span>
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const pages = [];
                                    const maxVisible = 3;
                                    let start = Math.max(1, currentExpoPage - 1);
                                    let end = Math.min(totalExpoPages, start + maxVisible - 1);
                                    if (end - start < maxVisible - 1) {
                                      start = Math.max(1, end - maxVisible + 1);
                                    }

                                    if (start > 1) {
                                      pages.push(
                                        <button
                                          key={1}
                                          type="button"
                                          onClick={() => handleExpoPageChange(1)}
                                          className={`h-7 min-w-7 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            currentExpoPage === 1 && !isExpanded
                                              ? 'bg-primary text-primary-foreground shadow-xs font-black'
                                              : 'border border-border bg-card hover:bg-secondary text-foreground hover:border-primary/40'
                                          }`}
                                        >
                                          1
                                        </button>
                                      );
                                      if (start > 2) {
                                        pages.push(
                                          <span key="expo-dots-start" className="px-0.5 text-[10px] text-muted-foreground select-none">
                                            ...
                                          </span>
                                        );
                                      }
                                    }

                                    for (let pNum = start; pNum <= end; pNum++) {
                                      pages.push(
                                        <button
                                          key={pNum}
                                          type="button"
                                          onClick={() => handleExpoPageChange(pNum)}
                                          className={`h-7 min-w-7 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            currentExpoPage === pNum && !isExpanded
                                              ? 'bg-primary text-primary-foreground shadow-xs font-black ring-1 ring-primary/40'
                                              : 'border border-border bg-card hover:bg-secondary text-foreground hover:border-primary/40'
                                          }`}
                                        >
                                          {pNum}
                                        </button>
                                      );
                                    }

                                    if (end < totalExpoPages) {
                                      if (end < totalExpoPages - 1) {
                                        pages.push(
                                          <span key="expo-dots-end" className="px-0.5 text-[10px] text-muted-foreground select-none">
                                            ...
                                          </span>
                                        );
                                      }
                                      pages.push(
                                        <button
                                          key={totalExpoPages}
                                          type="button"
                                          onClick={() => handleExpoPageChange(totalExpoPages)}
                                          className={`h-7 min-w-7 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            currentExpoPage === totalExpoPages && !isExpanded
                                              ? 'bg-primary text-primary-foreground shadow-xs font-black'
                                              : 'border border-border bg-card hover:bg-secondary text-foreground hover:border-primary/40'
                                          }`}
                                        >
                                          {totalExpoPages}
                                        </button>
                                      );
                                    }

                                    return pages;
                                  })()}
                                </div>

                                {/* Next Page */}
                                <button
                                  type="button"
                                  onClick={() => handleExpoPageChange(Math.min(totalExpoPages, currentExpoPage + 1))}
                                  disabled={currentExpoPage === totalExpoPages && !isExpanded}
                                  className="h-7 px-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold text-foreground transition-all cursor-pointer flex items-center gap-0.5 shadow-2xs hover:border-primary/40"
                                  title="Next Page of Expos"
                                >
                                  <span className="hidden sm:inline">Next</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>

                                {/* Last Page */}
                                <button
                                  type="button"
                                  onClick={() => handleExpoPageChange(totalExpoPages)}
                                  disabled={currentExpoPage === totalExpoPages && !isExpanded}
                                  className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:border-primary/40"
                                  title="Last Page of Expos"
                                >
                                  <ChevronsRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Upcoming Editions & Space Allocation Showcase Panel (when no public events in database yet) */
                      <div className="px-3.5 sm:px-4 py-3 bg-muted/20 border-t border-border/60">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                <Calendar className="h-3 w-3" />
                                Upcoming 2026–2027 Editions
                              </span>
                              <span className="text-[11px] font-bold text-foreground">
                                Space Allocation &amp; Trade Inquiries Open
                              </span>
                            </div>

                            {/* Flagship Showcases */}
                            {metaInfo.flagshipShows.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] text-muted-foreground font-bold">Flagship Shows:</span>
                                {metaInfo.flagshipShows.map((show, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-background border border-border/80 text-foreground shadow-2xs"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {show}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {org.name} manages premier trade showcases. Booth space bookings, floor layouts, and visitor pass registrations for upcoming editions are actively accepted via their inquiry desk.
                            </p>
                          </div>

                          {/* Quick Direct Actions for Exhibitors & Visitors */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start md:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenChat(
                                  org,
                                  null,
                                  'exhibitor',
                                  `Hello ${org.name}, I would like to inquire about booth space, stall sizes, and pricing for your upcoming exhibitions.`
                                )
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all cursor-pointer hover:scale-102 active:scale-98 shadow-2xs flex items-center gap-1.5"
                              title={`Book stall / booth space with ${org.name}`}
                            >
                              <Building className="h-3.5 w-3.5" />
                              <span>Inquire Stall Space</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenChat(
                                  org,
                                  null,
                                  'visitor',
                                  `Hello ${org.name}, I would like to receive visitor registration information and entry badges for your upcoming exhibitions.`
                                )
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer hover:scale-102 active:scale-98 shadow-2xs flex items-center gap-1.5"
                              title={`Request visitor badges from ${org.name}`}
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Visitor Passes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                <div className="h-10 w-10 rounded-xl bg-black/15 border border-black/10 flex items-center justify-center text-neutral-950 font-black text-sm shrink-0 shadow-2xs">
                  {activeChatOrganizer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-black text-neutral-950 truncate max-w-[220px]">
                      {activeChatOrganizer.name}
                    </h3>
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        activeChatOrganizer.isChatEnabled
                          ? 'bg-emerald-600 animate-pulse'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-neutral-900/85 truncate">
                    {activeChatEvent ? `Regarding: ${activeChatEvent.title}` : 'Official Exhibition Desk'} •{' '}
                    {activeChatOrganizer.isChatEnabled ? 'Active Now' : 'Offline Inquiry Desk'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChatModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 active:bg-black/50 text-neutral-950 flex items-center justify-center border border-black/15 shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Close chat"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
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
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>
                        {activeChatOrganizer.isChatEnabled
                          ? `Message from ${activeChatOrganizer.name}:`
                          : `Inquiry Desk Notice from ${activeChatOrganizer.name}:`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {activeChatOrganizer.chatWelcomeMessage ||
                        (activeChatOrganizer.isChatEnabled
                          ? `Welcome to ${activeChatOrganizer.name}'s exhibition desk. How can we assist you today?`
                          : `Welcome to ${activeChatOrganizer.name}'s exhibition desk. Our live desk is currently away, but you can leave your inquiry message below and our team will get back to you directly.`)}
                    </p>
                  </div>

                  <form noValidate onSubmit={handleStartChatInModal} className="space-y-3.5">
                    {/* Role Selector: Visitor vs Exhibitor */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        I am contacting as:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setParticipantRole('visitor');
                            if (modalFormErrors.company) {
                              setModalFormErrors((prev) => ({ ...prev, company: null }));
                            }
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            participantRole === 'visitor'
                              ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20'
                              : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Visitor / Attendee</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setParticipantRole('exhibitor')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            participantRole === 'exhibitor'
                              ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20'
                              : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Building className="h-3.5 w-3.5" />
                          <span>Exhibitor / Booth</span>
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-foreground">Your Full Name *</label>
                        {Boolean(user?.name) && (
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={Boolean(user?.name)}
                        value={participantName}
                        onBlur={() => handleFieldBlur('name')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParticipantName(val);
                          if (modalFormErrors.name) {
                            const err = validateChatField('name', val, participantRole);
                            setModalFormErrors((prev) => ({ ...prev, name: err }));
                          }
                        }}
                        placeholder="e.g. Alex Henderson"
                        className={`w-full px-3 py-2 bg-secondary/60 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/80 disabled:border-border/60 transition-all ${
                          modalFormErrors.name
                            ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500/20'
                            : 'border-border focus:border-primary/40 focus:ring-primary/20'
                        }`}
                      />
                      {modalFormErrors.name && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{modalFormErrors.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-foreground">Your Email Address *</label>
                        {Boolean(user?.email) && (
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        disabled={Boolean(user?.email)}
                        value={participantEmail}
                        onBlur={() => handleFieldBlur('email')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParticipantEmail(val);
                          if (modalFormErrors.email) {
                            const err = validateChatField('email', val, participantRole);
                            setModalFormErrors((prev) => ({ ...prev, email: err }));
                          }
                        }}
                        placeholder="e.g. alex@company.com"
                        className={`w-full px-3 py-2 bg-secondary/60 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/80 disabled:border-border/60 transition-all ${
                          modalFormErrors.email
                            ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500/20'
                            : 'border-border focus:border-primary/40 focus:ring-primary/20'
                        }`}
                      />
                      {modalFormErrors.email && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{modalFormErrors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Phone & Company Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-foreground">Mobile / WhatsApp</label>
                          {Boolean(user?.phone) && (
                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" /> Auto-filled
                            </span>
                          )}
                        </div>
                        <input
                          type="tel"
                          disabled={Boolean(user?.phone)}
                          value={participantPhone}
                          onBlur={() => handleFieldBlur('phone')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParticipantPhone(val);
                            if (modalFormErrors.phone) {
                              const err = validateChatField('phone', val, participantRole);
                              setModalFormErrors((prev) => ({ ...prev, phone: err }));
                            }
                          }}
                          placeholder="+91 98765 43210"
                          className={`w-full px-3 py-2 bg-secondary/60 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/80 disabled:border-border/60 transition-all ${
                            modalFormErrors.phone
                              ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500/20'
                              : 'border-border focus:border-primary/40 focus:ring-primary/20'
                          }`}
                        />
                        {modalFormErrors.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{modalFormErrors.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-foreground">
                            Company {participantRole === 'exhibitor' ? '*' : '(Optional)'}
                          </label>
                          {Boolean(user?.company || user?.organization?.name) && (
                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" /> Auto-filled
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          disabled={Boolean(user?.company || user?.organization?.name)}
                          value={participantCompany}
                          onBlur={() => handleFieldBlur('company')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParticipantCompany(val);
                            if (modalFormErrors.company) {
                              const err = validateChatField('company', val, participantRole);
                              setModalFormErrors((prev) => ({ ...prev, company: err }));
                            }
                          }}
                          placeholder="e.g. Alpha Tech"
                          className={`w-full px-3 py-2 bg-secondary/60 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/80 disabled:border-border/60 transition-all ${
                            modalFormErrors.company
                              ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500/20'
                              : 'border-border focus:border-primary/40 focus:ring-primary/20'
                          }`}
                        />
                        {modalFormErrors.company && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{modalFormErrors.company}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message to Organizer */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">
                        Your Inquiry Message *
                      </label>
                      <textarea
                        rows={2}
                        value={initialChatMessage}
                        onBlur={() => handleFieldBlur('message')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInitialChatMessage(val);
                          if (modalFormErrors.message) {
                            const err = validateChatField('message', val, participantRole);
                            setModalFormErrors((prev) => ({ ...prev, message: err }));
                          }
                        }}
                        placeholder={
                          participantRole === 'exhibitor'
                            ? `Inquiring about stall registration and booth space for ${activeChatEvent?.title || 'upcoming exhibitions'}...`
                            : `Hello, I would like information regarding badges, timings, and attendee access...`
                        }
                        className={`w-full px-3 py-2 bg-secondary/60 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                          modalFormErrors.message
                            ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500/20'
                            : 'border-border focus:border-primary/40 focus:ring-primary/20'
                        }`}
                      />
                      {modalFormErrors.message && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{modalFormErrors.message}</span>
                        </div>
                      )}
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
                          <span>
                            {activeChatOrganizer.isChatEnabled
                              ? 'Start Live Chat with Organizer'
                              : 'Send Inquiry Message to Organizer'}
                          </span>
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
