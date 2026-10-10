'use client';

/**
 * @file page.js (Attendee & Buyer Leads Hub)
 * @description Advanced Lead CRM & Buyer Intelligence Hub for VisitExpo event organizers.
 * Inspired by enterprise expo dashboards with VisitExpo brand aesthetic, custom terminology,
 * multi-select batch workflows, embed widgets, badge generation, and slide-over CRM controls.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import SearchableSelect from '../../../components/SearchableSelect.js';
import { showSweetAlert, showSweetConfirm, showSweetSuccess, showSweetError, showSweetWarning, showSweetInfo } from '../../../utils/sweetalert.js';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  Calendar,
  Ticket,
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  Table,
  FileUp,
  Code,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  Users,
  Building2,
  SlidersHorizontal,
  Send,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  Copy,
  CheckCircle2,
  Flame,
  Printer,
  FileText,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Lock,
  Zap,
  Crown,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  Bell,
  Globe
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function LeadsCRMPage() {
  const { user, accessToken } = useAuth();
  const accessTokenRef = React.useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Plan Tier State (free, starter, enterprise)
  const [userPlan, setUserPlan] = useState('free');
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMyPlan = async () => {
      try {
        const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_token') : null);
        if (!token) {
          if (user?.plan) setUserPlan(user.plan.toLowerCase());
          setIsPlanLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/plans/my-plan`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted && res.data?.success && res.data.plan) {
          setUserPlan(res.data.plan.toLowerCase());
        } else if (user?.plan) {
          setUserPlan(user.plan.toLowerCase());
        }
      } catch (err) {
        if (user?.plan) setUserPlan(user.plan.toLowerCase());
      } finally {
        if (isMounted) setIsPlanLoading(false);
      }
    };
    fetchMyPlan();
    return () => {
      isMounted = false;
    };
  }, [user, accessToken]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isFreePlan = !isSuperAdmin && (userPlan === 'free' || !userPlan);
  const isStarterPlan = !isSuperAdmin && userPlan === 'starter';
  const isEnterprisePlan = isSuperAdmin || userPlan === 'enterprise' || userPlan === 'growth';

  // Primary Data State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab State: 'all' | 'high_intent' | 'verified_delegates' | 'stall_inquiries'
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filter State (Basic for Starter, Advanced Multi-Filter for Enterprise)
  const [searchField, setSearchField] = useState('all'); // 'all' | 'name' | 'email' | 'company' | 'phone' | 'designation'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'event_click' | 'interested' | 'follower' | 'inquiry' | ...
  const [dateFilter, setDateFilter] = useState('');
  const [intentScoreFilter, setIntentScoreFilter] = useState('all'); // 'all' | 'hot' (>=70) | 'warm' (40-69) | 'cold' (<40)

  // Selection state for batch operations
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  // Slide-over CRM Drawer state
  const [drawerLead, setDrawerLead] = useState(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [newActivityContent, setNewActivityContent] = useState('');
  const [newActivityType, setNewActivityType] = useState('note');
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Modals state
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);

  // Form states for modals
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Bulk Sheet Import state
  const [sheetUploadTab, setSheetUploadTab] = useState('upload'); // 'upload' | 'paste'
  const [uploadedSheetFile, setUploadedSheetFile] = useState(null);
  const [parsedSheetLeads, setParsedSheetLeads] = useState([]);
  const [skippedSheetRowsCount, setSkippedSheetRowsCount] = useState(0);
  const [bulkParseError, setBulkParseError] = useState('');
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState(null);
  const sheetFileInputRef = React.useRef(null);

  // Add / Edit Lead form state
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    country: 'India',
    source: 'website',
    status: 'new',
    leadScore: 65,
    notes: '',
    eventId: ''
  });
  const [leadFormErrors, setLeadFormErrors] = useState({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // 1. Fetch Events (Organizers see only their own and claimed expo editions) with instant sessionStorage caching
  useEffect(() => {
    const userId = user?._id || user?.id || 'anonymous';
    const cacheKey = `visitexpo_leads_events_${userId}`;

    try {
      if (typeof window !== 'undefined' && user) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
            setSelectedEventId(prev => {
              if (prev && (prev === 'all' || parsed.some(e => e._id === prev))) return prev;
              return parsed[0]._id;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not read cached leads events:', e);
    }

    const fetchEvents = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const orgId = user?.organization?._id || user?.organization;
        const isSuperAdmin = user?.role === 'super_admin';

        const ids = [orgId, userId].filter(Boolean).map(String);
        const eventsUrl = isSuperAdmin
          ? `${API_URL}/events?limit=200&all=true`
          : `${API_URL}/events?limit=200&all=true&organizerId=${ids.join(',')}`;

        const res = await axios.get(eventsUrl, { headers });
        if (res.data && res.data.success && res.data.data?.docs) {
          let eventList = res.data.data.docs;

          if (!isSuperAdmin) {
            const userEmail = (user?.email || '').toLowerCase().trim();
            eventList = eventList.filter(evt => {
              const evtOrgId = String(evt.organizer?._id || evt.organizer || '');
              const evtClaimedBy = String(evt.claimedBy?._id || evt.claimedBy || '');
              const evtOrgEmail = (evt.organizerEmail || evt.orgEmail || '').toLowerCase().trim();

              const isOrgMatch = orgId && evtOrgId && evtOrgId === String(orgId);
              const isUserMatch = userId && evtOrgId && evtOrgId === String(userId);
              const isClaimedMatch = userId && evtClaimedBy && (evtClaimedBy === String(userId) || evtClaimedBy === String(orgId));
              const isEmailMatch = userEmail && evtOrgEmail && evtOrgEmail === userEmail;

              return isOrgMatch || isUserMatch || isClaimedMatch || isEmailMatch;
            });
          }

          // Sort newest created first
          eventList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setEvents(eventList);
          if (eventList.length > 0) {
            setSelectedEventId(prev => {
              if (prev && (prev === 'all' || eventList.some(e => e._id === prev))) return prev;
              return eventList[0]._id;
            });
          } else {
            setSelectedEventId('');
            setLeads([]);
            setLoading(false);
          }

          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(eventList));
            }
          } catch (e) {
            console.warn('Could not cache leads events:', e);
          }
        } else {
          setEvents([]);
          setSelectedEventId('');
          setLeads([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load events', err);
        if (events.length === 0) {
          setError('Could not connect to API server. Ensure backend is running.');
          setLoading(false);
        }
      }
    };
    if (user) {
      fetchEvents();
    }
  }, [user, accessToken]);

  // 2. Fetch Leads for Active Event
  const fetchLeads = React.useCallback(async () => {
    if (!selectedEventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = accessTokenRef.current;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = { limit: 300 };
      if (selectedEventId !== 'all') {
        params.eventId = selectedEventId;
      }
      const res = await axios.get(`${API_URL}/leads`, {
        params,
        headers
      });
      if (res.data && res.data.success) {
        setLeads(res.data.data.docs || []);
        setSelectedLeadIds(new Set());
      }
    } catch (err) {
      console.error('Failed to load leads', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Error fetching CRM leads.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  const hasAccessToken = Boolean(accessToken);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch leads only when the active event changes or authentication first becomes available.
    fetchLeads();
  }, [fetchLeads, hasAccessToken]);

  // Active selected event object
  const currentEvent = useMemo(() => {
    if (!selectedEventId || selectedEventId === 'all') return events[0] || null;
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filter leads based on Tab, Search, Status, Source, and Date
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      // 1. Tab Intent Filter
      if (activeTab === 'high_intent') {
        // High-Intent: Score >= 70 OR status qualified/won
        const isHigh = (item.leadScore || 0) >= 70 || item.status === 'qualified' || item.status === 'won';
        if (!isHigh) return false;
      } else if (activeTab === 'event_clicks') {
        if (item.source !== 'event_click') return false;
      } else if (activeTab === 'verified_delegates') {
        // Verified delegates: Score 40-69 OR interested/follower/visitor_pass
        const isDelegate =
          item.source === 'interested' ||
          item.source === 'follower' ||
          item.source === 'visitor_pass' ||
          ((item.leadScore || 0) >= 40 && (item.leadScore || 0) < 70) ||
          item.status === 'contacted' ||
          item.status === 'proposal';
        if (!isDelegate) return false;
      } else if (activeTab === 'stall_inquiries') {
        // Stall/Exhibitor inquiries or Walk-in/Campaign new leads
        const isStall =
          item.source === 'inquiry' ||
          item.source === 'walk_in' ||
          item.source === 'campaign' ||
          item.status === 'new' ||
          (item.company && item.company.toLowerCase().includes('ltd'));
        if (!isStall) return false;
      }

      // 2. Source Filter (Enterprise exclusive)
      if (isEnterprisePlan && sourceFilter !== 'all' && item.source !== sourceFilter) {
        return false;
      }

      // 3. Status Filter (Basic supports 'new' and 'contacted'; Enterprise supports all)
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        if (isEnterprisePlan && searchField === 'name') {
          if (!item.name?.toLowerCase().includes(query)) return false;
        } else if (isEnterprisePlan && searchField === 'email') {
          if (!item.email?.toLowerCase().includes(query)) return false;
        } else if (isEnterprisePlan && searchField === 'company') {
          if (!item.company?.toLowerCase().includes(query)) return false;
        } else if (isEnterprisePlan && searchField === 'phone') {
          if (!item.phone?.toLowerCase().includes(query)) return false;
        } else if (isEnterprisePlan && searchField === 'designation') {
          if (!item.designation?.toLowerCase().includes(query)) return false;
        } else {
          // 'all' / Basic search across all core contact fields
          const matchAll =
            item.name?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.company?.toLowerCase().includes(query) ||
            item.phone?.toLowerCase().includes(query) ||
            item.designation?.toLowerCase().includes(query) ||
            item.country?.toLowerCase().includes(query);
          if (!matchAll) return false;
        }
      }

      // 5. Date Filter (Enterprise exclusive)
      if (isEnterprisePlan && dateFilter) {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        if (itemDate !== dateFilter) return false;
      }

      // 6. Intent Score Filter (Enterprise exclusive)
      if (isEnterprisePlan && intentScoreFilter !== 'all') {
        const score = item.leadScore || 0;
        if (intentScoreFilter === 'hot' && score < 70) return false;
        if (intentScoreFilter === 'warm' && (score < 40 || score >= 70)) return false;
        if (intentScoreFilter === 'cold' && score >= 40) return false;
      }

      return true;
    });
  }, [leads, activeTab, sourceFilter, statusFilter, searchTerm, searchField, dateFilter, intentScoreFilter, isEnterprisePlan]);

  // Tab counts for badges
  const tabCounts = useMemo(() => {
    const high = leads.filter(
      (l) => (l.leadScore || 0) >= 70 || l.status === 'qualified' || l.status === 'won'
    ).length;
    const clicks = leads.filter((l) => l.source === 'event_click').length;
    const delegates = leads.filter(
      (l) =>
        l.source === 'interested' ||
        l.source === 'follower' ||
        l.source === 'visitor_pass' ||
        ((l.leadScore || 0) >= 40 && (l.leadScore || 0) < 70) ||
        l.status === 'contacted' ||
        l.status === 'proposal'
    ).length;
    const stall = leads.filter(
      (l) =>
        l.source === 'inquiry' ||
        l.source === 'walk_in' ||
        l.source === 'campaign' ||
        l.status === 'new' ||
        (l.company && l.company.toLowerCase().includes('ltd'))
    ).length;
    return { high, clicks, delegates, stall, all: leads.length };
  }, [leads]);

  // Checkbox multi-select helpers
  const isAllSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.has(l._id));
  const isSomeSelected = filteredLeads.some((l) => selectedLeadIds.has(l._id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds(new Set());
    } else {
      const nextSet = new Set();
      filteredLeads.forEach((l) => nextSet.add(l._id));
      setSelectedLeadIds(nextSet);
    }
  };

  const toggleSelectLead = (id) => {
    const nextSet = new Set(selectedLeadIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setSelectedLeadIds(nextSet);
  };

  // Show Upgrade modal when Starter users click advanced filters
  const showAdvancedFilterUpgradeModal = (featureName = 'Advanced Multi-Filter') => {
    showSweetAlert({
      title: 'Enterprise Plan Exclusive',
      text: `${featureName} is available exclusively on the Enterprise Plan. Starter Plan includes basic search & standard status filters. Upgrade to Enterprise to unlock multi-dimensional filters, 10+ acquisition sources, buyer intent score tiers, and exact date ranges.`,
      icon: 'info',
      confirmButtonText: 'Upgrade to Enterprise',
      showCancelButton: true,
      cancelButtonText: 'Continue on Starter'
    }).then((res) => {
      if (res?.isConfirmed) {
        window.location.href = '/pricing';
      }
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchField('all');
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFilter('');
    setIntentScoreFilter('all');
    setActiveTab('all');
    setSelectedLeadIds(new Set());
  };

  // Update Lead Status or fields
  const handleUpdateLead = async (leadId, fields) => {
    try {
      const res = await axios.put(`${API_URL}/leads/${leadId}`, fields, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setLeads((prev) => prev.map((l) => (l._id === leadId ? res.data.lead : l)));
        if (drawerLead && drawerLead._id === leadId) {
          setDrawerLead(res.data.lead);
        }
      }
    } catch (err) {
      console.error('Error updating lead status', err);
      showSweetError('Failed to update lead');
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId, e) => {
    if (e) e.stopPropagation();
    const confirmed = await showSweetConfirm({
      title: 'Remove Lead Record?',
      text: 'Are you sure you want to remove this lead record? This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      isDanger: true
    });
    if (!confirmed) return;
    try {
      const res = await axios.delete(`${API_URL}/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        setSelectedLeadIds((prev) => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
        if (drawerLead && drawerLead._id === leadId) {
          setDrawerLead(null);
        }
        showSweetSuccess('Lead deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting lead', err);
      showSweetError('Failed to delete lead');
    }
  };

  const handleDeleteSelectedLeads = async () => {
    const leadIds = Array.from(selectedLeadIds);
    if (!leadIds.length || isDeletingSelected) return;

    const confirmed = await showSweetConfirm({
      title: `Delete ${leadIds.length} selected lead${leadIds.length === 1 ? '' : 's'}?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Delete Selected',
      cancelButtonText: 'Cancel',
      isDanger: true
    });
    if (!confirmed) return;

    setIsDeletingSelected(true);
    try {
      const results = await Promise.allSettled(
        leadIds.map((leadId) =>
          axios.delete(`${API_URL}/leads/${leadId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        )
      );
      const deletedIds = new Set(
        leadIds.filter((_, index) =>
          results[index].status === 'fulfilled' && results[index].value.data?.success
        )
      );

      if (!deletedIds.size) {
        showSweetError('No selected leads could be deleted. Please try again.');
        return;
      }

      setLeads((prev) => prev.filter((lead) => !deletedIds.has(lead._id)));
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((leadId) => next.delete(leadId));
        return next;
      });
      setDrawerLead((prev) => (prev && deletedIds.has(prev._id) ? null : prev));

      const failedCount = leadIds.length - deletedIds.size;
      if (failedCount) {
        showSweetError(`${deletedIds.size} lead${deletedIds.size === 1 ? '' : 's'} deleted; ${failedCount} could not be deleted.`);
      } else {
        showSweetSuccess(`${deletedIds.size} lead${deletedIds.size === 1 ? '' : 's'} deleted successfully.`);
      }
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // Add Activity Note to Drawer Lead
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityContent.trim() || !drawerLead) return;
    try {
      const res = await axios.post(
        `${API_URL}/leads/${drawerLead._id}/activity`,
        { type: newActivityType, content: newActivityContent.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setLeads((prev) => prev.map((l) => (l._id === drawerLead._id ? res.data.lead : l)));
        setDrawerLead(res.data.lead);
        setNewActivityContent('');
      }
    } catch (err) {
      console.error('Error adding activity', err);
      showSweetError('Failed to record activity log');
    }
  };

  // Add Follow-up Task to Drawer Lead
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpDate || !drawerLead) {
      showSweetWarning('Please fill out follow-up task title and target date');
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/leads/${drawerLead._id}/followup`,
        { title: followUpTitle.trim(), dateTime: followUpDate, notes: followUpNotes.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setLeads((prev) => prev.map((l) => (l._id === drawerLead._id ? res.data.lead : l)));
        setDrawerLead(res.data.lead);
        setFollowUpTitle('');
        setFollowUpDate('');
        setFollowUpNotes('');
      }
    } catch (err) {
      console.error('Error scheduling follow-up', err);
      showSweetError('Failed to schedule follow-up');
    }
  };

  // Helper to trigger browser download of CSV text with UTF-8 BOM
  const triggerCsvDownload = (csvText, fileName) => {
    try {
      const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (e) {
      console.error('Trigger CSV download error:', e);
      return false;
    }
  };

  // Helper to download example template sheet (Excel .xlsx or CSV)
  const handleDownloadTemplate = (format = 'xlsx') => {
    const sampleData = [
      {
        'Full Name': 'Rahul Kapoor',
        'Work Email': 'rahul.kapoor@tatamotors.com',
        'Phone Number': '+91 98765 43210',
        'Company': 'Tata Motors Ltd',
        'Designation': 'Procurement Director',
        'Country': 'India',
        'Stage': 'new',
        'Intent Score': 85,
        'Notes': 'Interested in commercial EV and Hall 3 exhibitors'
      },
      {
        'Full Name': 'Priya Sharma',
        'Work Email': 'priya.sharma@apexglobal.in',
        'Phone Number': '+91 98110 54321',
        'Company': 'Apex Global Logistics',
        'Designation': 'VP Operations',
        'Country': 'India',
        'Stage': 'qualified',
        'Intent Score': 75,
        'Notes': 'Stall booking inquiry and vendor sourcing'
      },
      {
        'Full Name': 'David Miller',
        'Work Email': 'david.miller@omnisource.com',
        'Phone Number': '+1 415 555 2671',
        'Company': 'OmniSource International',
        'Designation': 'Chief Sourcing Officer',
        'Country': 'United States',
        'Stage': 'contacted',
        'Intent Score': 90,
        'Notes': 'VIP buyer delegation from North America'
      },
      {
        'Full Name': 'Ananya Sen',
        'Work Email': 'ananya.sen@ecotech.co.in',
        'Phone Number': '+91 98450 11223',
        'Company': 'EcoTech Renewable Devices',
        'Designation': 'Head of Sourcing',
        'Country': 'India',
        'Stage': 'proposal',
        'Intent Score': 80,
        'Notes': 'Looking for solar components'
      }
    ];

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
      let downloaded = false;
      try {
        XLSX.writeFile(wb, 'VisitExpo_Leads_Template.csv', { bookType: 'csv' });
        downloaded = true;
      } catch (err) {
        console.warn('XLSX.writeFile failed, using fallback:', err);
      }
      if (!downloaded) {
        const csvText = XLSX.utils.sheet_to_csv(ws);
        triggerCsvDownload(csvText, 'VisitExpo_Leads_Template.csv');
      }
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      ws['!cols'] = [
        { wch: 20 },
        { wch: 30 },
        { wch: 18 },
        { wch: 28 },
        { wch: 24 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 45 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
      XLSX.writeFile(wb, 'VisitExpo_Leads_Template.xlsx');
    }
  };

  // Export CSV of filtered, selected, or available leads with intelligent fallback
  // Business Rule: ONLY Enterprise Plan organizers can export lead reports
  const handleExportCsv = () => {
    if (!isEnterprisePlan) {
      showSweetAlert({
        title: 'Enterprise Feature: Lead Report Export',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6;">
            <p style="margin-bottom: 10px; color: inherit;">
              Exporting lead reports is exclusively available for <strong>Enterprise Plan</strong> organizers.
            </p>
            <div style="padding: 12px; border-radius: 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: inherit; font-size: 12px;">
              <strong>Current Plan:</strong> ${userPlan === 'starter' ? 'Organizer Starter' : 'Free Organizer'}<br/>
              Upgrade to <strong>Organizer Enterprise</strong> to unlock unlimited CSV &amp; Excel lead downloads, full contact details, and automated exports.
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Upgrade to Enterprise Plan',
        cancelButtonText: 'Maybe Later',
        confirmButtonColor: '#FFCC00',
        cancelButtonColor: '#3f3f46'
      }).then((result) => {
        if (result?.isConfirmed) {
          window.location.href = '/pricing';
        }
      });
      return;
    }
    try {
      // 1. Determine list of leads to export
      let listToExport = [];
      let exportContext = '';

      if (selectedLeadIds.size > 0) {
        listToExport = leads.filter((l) => selectedLeadIds.has(l._id));
        exportContext = `${listToExport.length} selected lead${listToExport.length === 1 ? '' : 's'}`;
      } else if (filteredLeads.length > 0) {
        listToExport = filteredLeads;
        exportContext = `${listToExport.length} lead${listToExport.length === 1 ? '' : 's'}`;
      } else if (leads.length > 0) {
        listToExport = leads;
        exportContext = `all ${listToExport.length} lead${listToExport.length === 1 ? '' : 's'}`;
      }

      // 2. If no leads are recorded in this active edition, download standard template so a file is ALWAYS exported
      if (listToExport.length === 0) {
        handleDownloadTemplate('csv');
        showSweetInfo(
          'No buyer leads found for the active edition yet. Downloaded standard VisitExpo Leads CSV template with example records instead.',
          'Export CSV'
        );
        return;
      }

      // 3. Prepare structured export rows with safe type conversions
      const exportRows = listToExport.map((l) => ({
        'Date': l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        'Full Name': String(l.name || '').trim(),
        'Work Email': String(l.email || '').trim(),
        'Phone Number': String(l.phone || '').trim(),
        'Company': String(l.company || 'Individual Attendee').trim(),
        'Designation': String(l.designation || 'Trade Visitor').trim(),
        'Country': String(l.country || 'India').trim(),
        'Intent Score': Number(l.leadScore) || 0,
        'Pipeline Stage': String(l.status || 'new').trim(),
        'Lead Source': String(l.source || 'website').trim(),
        'Notes': String(l.notes || '').trim()
      }));

      // 4. Build filename based on current event name and current date
      const cleanEventName = currentEvent?.title
        ? currentEvent.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
        : 'VisitExpo';
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${cleanEventName}_Buyer_Leads_${dateStr}.csv`;

      // 5. Construct SheetJS workbook
      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 28 },
        { wch: 18 },
        { wch: 26 },
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 35 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Buyer Leads');

      // 6. Trigger download (XLSX.writeFile with fallback)
      let downloaded = false;
      try {
        XLSX.writeFile(wb, fileName, { bookType: 'csv' });
        downloaded = true;
      } catch (xlsxErr) {
        console.warn('XLSX.writeFile fallback triggered:', xlsxErr);
      }

      if (!downloaded) {
        const csvText = XLSX.utils.sheet_to_csv(ws);
        triggerCsvDownload(csvText, fileName);
      }

      showSweetSuccess(`Successfully exported ${exportContext} to ${fileName}!`);
    } catch (err) {
      console.error('Error in handleExportCsv:', err);
      showSweetError('Failed to generate CSV export. Please try again.');
    }
  };

  // Handle Embed Widget Copy
  const getEmbedCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://visitexpo.in';
    const targetId = selectedEventId || 'all';
    return `<iframe\n  src="${origin}/embed/lead-form/${targetId}"\n  width="100%"\n  height="540"\n  style="border:none;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.08);"\n  title="VisitExpo Attendee Registration"\n></iframe>`;
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  // Handle Broadcast Submission
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;

    setBroadcastSending(true);
    // Simulate sending broadcast email/SMS campaign
    setTimeout(() => {
      setBroadcastSending(false);
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setShowBroadcastModal(false);
        setBroadcastSubject('');
        setBroadcastMessage('');
      }, 1800);
    }, 1200);
  };

  // Handle Spreadsheet File Selection (.xlsx, .xls, .csv)
  const handleSheetFileSelect = (file) => {
    if (!file) return;
    setBulkParseError('');
    setUploadedSheetFile(file);
    setParsedSheetLeads([]);
    setSkippedSheetRowsCount(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setBulkParseError('No worksheet found in the uploaded file.');
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setBulkParseError('The uploaded sheet is empty. Please ensure it has column headers and data rows.');
          return;
        }

        const validLeads = [];
        let skipped = 0;

        rawRows.forEach((row) => {
          // Normalize column headers to lowercase alphanumeric
          const normalizedRow = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedRow[cleanKey] = String(row[key] ?? '').trim();
          });

          const getVal = (...keys) => {
            for (const k of keys) {
              const cleaned = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normalizedRow[cleaned] !== undefined && normalizedRow[cleaned] !== '') {
                return normalizedRow[cleaned];
              }
            }
            return '';
          };

          const name = getVal('fullname', 'name', 'attendeename', 'buyername', 'leadname', 'delegate');
          const email = getVal('workemail', 'email', 'emailaddress', 'buyeremail', 'mail');
          let phone = getVal('phonenumber', 'phone', 'mobile', 'mobilenumber', 'contact', 'contactnumber');
          const company = getVal('company', 'organization', 'org', 'companyname', 'employer');
          const designation = getVal('designation', 'role', 'jobtitle', 'title', 'position');
          const country = getVal('country', 'location', 'region') || 'India';
          const stage = getVal('stage', 'status', 'pipelinestage') || 'new';
          const rawScore = getVal('intentscore', 'score', 'leadscore');
          const notes = getVal('notes', 'remarks', 'comments', 'requirements');

          // Strip any letters from phone
          if (phone) {
            phone = phone.replace(/[a-zA-Z]/g, '').trim();
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (name && email && emailRegex.test(email)) {
            validLeads.push({
              name,
              email: email.toLowerCase(),
              phone: phone || '',
              company: company || '',
              designation: designation || 'Trade Delegate',
              country,
              status: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].includes(stage.toLowerCase())
                ? stage.toLowerCase()
                : 'new',
              leadScore: rawScore ? Math.min(100, Math.max(0, parseInt(rawScore) || 50)) : 65,
              notes,
              source: 'bulk_upload'
            });
          } else {
            skipped++;
          }
        });

        if (validLeads.length === 0) {
          setBulkParseError('Could not find any valid leads with both Name and a valid Email. Please verify the sheet headers.');
        } else {
          setParsedSheetLeads(validLeads);
          setSkippedSheetRowsCount(skipped);
        }
      } catch (err) {
        console.error('Sheet parsing error:', err);
        setBulkParseError('Failed to parse spreadsheet file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      }
    };
    reader.onerror = () => {
      setBulkParseError('Failed to read the file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Reset Bulk Sheet state
  const resetBulkSheetState = () => {
    setUploadedSheetFile(null);
    setParsedSheetLeads([]);
    setSkippedSheetRowsCount(0);
    setBulkParseError('');
    setBulkCsvText('');
    setBulkImportResult(null);
    if (sheetFileInputRef.current) {
      sheetFileInputRef.current.value = '';
    }
  };

  // Handle Bulk Import Submission
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    const targetEventId = selectedEventId && selectedEventId !== 'all' ? selectedEventId : (events[0]?._id || '');
    if (!targetEventId) {
      showSweetWarning('Please select or create an active expo edition first.');
      return;
    }

    let leadsToImport = [];

    if (sheetUploadTab === 'upload') {
      if (parsedSheetLeads.length === 0) {
        showSweetWarning('Please upload a spreadsheet with valid lead records first.');
        return;
      }
      leadsToImport = parsedSheetLeads;
    } else {
      // Pasted CSV Text fallback
      if (!bulkCsvText.trim()) return;
      const lines = bulkCsvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('email') && line.toLowerCase().includes('name')) {
          return;
        }
        const parts = line.includes(',') ? line.split(',') : line.split('\t');
        if (parts.length >= 2) {
          const email = parts[1]?.trim() || '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (parts[0]?.trim() && emailRegex.test(email)) {
            leadsToImport.push({
              name: parts[0]?.trim() || 'Attendee',
              email: email.toLowerCase(),
              phone: (parts[2]?.trim() || '').replace(/[a-zA-Z]/g, ''),
              company: parts[3]?.trim() || '',
              designation: parts[4]?.trim() || 'Delegate',
              country: 'India',
              leadScore: Math.floor(Math.random() * 40) + 50,
              status: 'new',
              source: 'bulk_upload'
            });
          }
        }
      });
    }

    if (leadsToImport.length === 0) {
      showSweetWarning('Could not parse any valid leads with name and email.');
      return;
    }

    setBulkImporting(true);
    setBulkImportResult(null);

    try {
      const res = await axios.post(
        `${API_URL}/leads/bulk`,
        { eventId: targetEventId, leads: leadsToImport },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setBulkImportResult({ count: res.data.count || leadsToImport.length });
        fetchLeads();
        setTimeout(() => {
          setShowBulkImportModal(false);
          resetBulkSheetState();
        }, 1800);
      }
    } catch (err) {
      console.error('Bulk import error', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Bulk import failed. Please check your data format.';
      showSweetError(serverMsg);
    } finally {
      setBulkImporting(false);
    }
  };

  // Quick Load Demo Sample Leads (for Paste tab)
  const handleLoadSampleLeads = () => {
    const sample = `Aarav Mehta, aarav.mehta@techinfra.com, +91 98201 12345, TechInfra Solutions, Procurement Director
Priya Sharma, priya.s@apexglobal.in, +91 98110 54321, Apex Global Logistics, VP Operations
Rajesh Verma, r.verma@indiatrade.org, +91 97170 98765, India Trade Council, Senior Delegate
Sneha Patel, sneha@ecotechdevices.com, +91 99044 11223, EcoTech Devices, Chief Commercial Officer
Vikram Malhotra, vikram@zenithexpo.in, +91 98450 67890, Zenith Industrial Corp, Managing Director`;
    setBulkCsvText(sample);
  };

  // Validate Lead Form
  const validateLeadForm = (data) => {
    const errors = {};

    // 1. Name validation
    if (!data.name || !data.name.trim()) {
      errors.name = 'Full Name is required.';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Full Name must be at least 2 characters.';
    } else if (/^[0-9]+$/.test(data.name.trim())) {
      errors.name = 'Full Name cannot consist solely of numbers.';
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !data.email.trim()) {
      errors.email = 'Work Email is required.';
    } else if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid work email address (e.g. name@company.com).';
    }

    // 3. Phone validation - Strictly disallow alphabets
    if (data.phone) {
      const phoneTrim = data.phone.trim();
      if (/[a-zA-Z]/.test(phoneTrim)) {
        errors.phone = 'Phone number cannot contain alphabets. Only digits and valid phone symbols (+, -, space) are allowed.';
      } else {
        const digitsOnly = phoneTrim.replace(/\D/g, '');
        if (digitsOnly.length > 0 && digitsOnly.length < 7) {
          errors.phone = 'Phone number is too short (min 7 digits).';
        } else if (digitsOnly.length > 15) {
          errors.phone = 'Phone number cannot exceed 15 digits.';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Sanitized Phone Number Input Handler - Automatically strips alphabets on the fly
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    // Strip alphabets and non-phone characters immediately so letters cannot be typed
    const allowedChars = rawVal.replace(/[a-zA-Z]/g, '').replace(/[^0-9+\s\-()]/g, '');
    let digitCount = 0;
    const sanitizedVal = allowedChars.replace(/\d/g, (digit) => {
      digitCount += 1;
      return digitCount <= 15 ? digit : '';
    });
    setLeadForm(prev => ({ ...prev, phone: sanitizedVal }));
    if (leadFormErrors.phone) {
      setLeadFormErrors(prev => ({ ...prev, phone: null }));
    }
  };

  // Open modal in Add mode
  const openAddLeadModal = () => {
    setIsEditMode(false);
    setCurrentLeadId(null);
    const defaultEvtId = selectedEventId && selectedEventId !== 'all' ? selectedEventId : (events[0]?._id || '');
    setLeadForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      designation: '',
      country: 'India',
      source: 'website',
      status: 'new',
      leadScore: 65,
      notes: '',
      eventId: defaultEvtId
    });
    setLeadFormErrors({});
    setShowLeadModal(true);
  };

  // Open modal in Edit mode
  const openEditLeadModal = (lead) => {
    setIsEditMode(true);
    setCurrentLeadId(lead._id);
    setLeadForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      designation: lead.designation || '',
      country: lead.country || 'India',
      source: lead.source || 'website',
      status: lead.status || 'new',
      leadScore: lead.leadScore !== undefined ? lead.leadScore : 65,
      notes: lead.notes || '',
      eventId: lead.event?._id || lead.event || ''
    });
    setLeadFormErrors({});
    setShowLeadModal(true);
  };

  // Handle Manual Lead Creation or Update
  const handleSaveLead = async (e) => {
    e.preventDefault();

    const targetEventId = leadForm.eventId || (selectedEventId && selectedEventId !== 'all' ? selectedEventId : events[0]?._id);

    if (!targetEventId && !isEditMode) {
      showSweetWarning('Please create or select an expo edition before adding leads.');
      return;
    }

    const { isValid, errors } = validateLeadForm(leadForm);
    if (!isValid) {
      setLeadFormErrors(errors);
      showSweetWarning('Please fix the validation errors in the form.');
      return;
    }

    setIsSubmittingLead(true);
    try {
      if (isEditMode && currentLeadId) {
        // Edit existing lead
        const res = await axios.put(
          `${API_URL}/leads/${currentLeadId}`,
          {
            name: leadForm.name.trim(),
            email: leadForm.email.toLowerCase().trim(),
            phone: leadForm.phone.trim(),
            company: leadForm.company.trim(),
            designation: leadForm.designation.trim(),
            country: leadForm.country.trim() || 'India',
            status: leadForm.status,
            leadScore: Number(leadForm.leadScore) || 50,
            notes: leadForm.notes.trim()
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (res.data && res.data.success) {
          const updated = res.data.lead;
          setLeads(prev => prev.map(l => (l._id === currentLeadId ? updated : l)));
          if (drawerLead && drawerLead._id === currentLeadId) {
            setDrawerLead(updated);
          }
          setShowLeadModal(false);
          showSweetSuccess('Lead details updated successfully!');
        }
      } else {
        // Create new lead
        const res = await axios.post(
          `${API_URL}/leads`,
          {
            ...leadForm,
            name: leadForm.name.trim(),
            email: leadForm.email.toLowerCase().trim(),
            phone: leadForm.phone.trim(),
            company: leadForm.company.trim(),
            designation: leadForm.designation.trim(),
            eventId: targetEventId
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.data && res.data.success) {
          const newLead = res.data.lead;
          setLeads(prev => [newLead, ...prev]);
          // Automatically switch to 'all' tab and reset filters so the newly added lead is immediately visible!
          setActiveTab('all');
          setStatusFilter('all');
          setSearchTerm('');
          setDateFilter('');
          setShowLeadModal(false);
          showSweetSuccess('Buyer lead added successfully!');
        }
      }
    } catch (err) {
      console.error('Error saving lead', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save lead.';
      showSweetError(serverMsg);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Format Helper for Dates (e.g. 14 Sep '26)
  const formatExpoDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = String(d.getFullYear()).slice(-2);
    return `${day} ${month} '${year}`;
  };

  // Color generator for avatar initials
  const getAvatarColor = (name) => {
    const colors = [
      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
    ];
    let sum = 0;
    for (let i = 0; i < (name || '').length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // Filter active state for dynamic Reset button styling and contextual feedback
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    (isEnterprisePlan && searchField !== 'all') ||
    statusFilter !== 'all' ||
    (isEnterprisePlan && sourceFilter !== 'all') ||
    (isEnterprisePlan && dateFilter) ||
    (isEnterprisePlan && intentScoreFilter !== 'all') ||
    activeTab !== 'all'
  );

  // Badge generator for lead sources
  const renderSourceBadge = (source) => {
    switch (source) {
      case 'event_click':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20" title="Visitor clicked and explored your event page">
            <Eye className="h-2.5 w-2.5 text-cyan-500" /> Event Click
          </span>
        );
      case 'interested':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20" title="Visitor clicked Interested on your event">
            <ThumbsUp className="h-2.5 w-2.5 text-pink-500" /> Interested
          </span>
        );
      case 'follower':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20" title="Visitor followed your event">
            <Bell className="h-2.5 w-2.5 text-violet-500" /> Follower
          </span>
        );
      case 'inquiry':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" title="Submitted direct inquiry / stall booking">
            <MessageSquare className="h-2.5 w-2.5 text-emerald-500" /> Direct Inquiry
          </span>
        );
      case 'ticket_checkout':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" title="Purchased or booked ticket">
            <Ticket className="h-2.5 w-2.5 text-amber-500" /> Ticket Checkout
          </span>
        );
      case 'visitor_pass':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20" title="Registered for visitor pass badge">
            <QrCode className="h-2.5 w-2.5 text-indigo-500" /> Visitor Pass
          </span>
        );
      case 'walk_in':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20" title="Registered on-site at venue">
            <Building2 className="h-2.5 w-2.5 text-orange-500" /> Walk-In
          </span>
        );
      case 'bulk_upload':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border border-zinc-500/20" title="Imported via spreadsheet">
            <FileSpreadsheet className="h-2.5 w-2.5" /> CSV Import
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border capitalize">
            <Globe className="h-2.5 w-2.5 text-muted-foreground" /> {source || 'Website'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 relative">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              Attendee & Buyer Leads Hub
            </h1>
            {isFreePlan ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="h-3 w-3" /> Free Plan · 3 Leads Preview
              </span>
            ) : isStarterPlan ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Starter Plan · Normal Level
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Crown className="h-3 w-3 text-indigo-500" /> Enterprise Plan · Advance Intelligence Level
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized buyer intelligence, delegate registrations, and high-intent inquiry management
          </p>
        </div>

        {/* Top Right Action Buttons (Styled with VisitExpo theme) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Embed Widget Button */}
          <button
            onClick={() => setShowEmbedModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
          >
            <Code className="h-3.5 w-3.5 text-amber-500" />
            &lt;/&gt; Embed Widget
          </button>

          {/* Live Preview Button */}
          <button
            onClick={() => {
              if (currentEvent) {
                window.open(`/expo/${currentEvent.slug || currentEvent._id}`, '_blank');
              } else {
                window.open('/expos', '_blank');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live Preview
          </button>

          {/* Add Manual Lead Button */}
          <button
            onClick={openAddLeadModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-all shadow-sm cursor-pointer btn-press active:scale-95 select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Helper function to render colorful, distinct source badges */}
      {(() => null)()}
      <div className="flex flex-col gap-3 border-b border-border/80 pb-3">
        {/* Left: Categorized Intent Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* Tab 1: All Inquiries (Basic & Advanced) */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              activeTab === 'all'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Inquiries</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all'
                  ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.all}
            </span>
          </button>

          {/* Tab 2: High-Intent Buyers */}
          <button
            onClick={() => {
              if (isEnterprisePlan) {
                setActiveTab('high_intent');
              } else {
                showAdvancedFilterUpgradeModal('High-Intent Buyer Scoring Filter');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              activeTab === 'high_intent'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-emerald-500" />
            <span>High-Intent Buyers</span>
            {!isEnterprisePlan && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Crown className="h-2.5 w-2.5 text-amber-500" />
                Enterprise
              </span>
            )}
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'high_intent'
                  ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.high}
            </span>
          </button>

          {/* Tab 3: Event Clicks & Views */}
          <button
            onClick={() => {
              if (isEnterprisePlan) {
                setActiveTab('event_clicks');
              } else {
                showAdvancedFilterUpgradeModal('Event Clicks & Traffic Source Analytics Filter');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              activeTab === 'event_clicks'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-cyan-500" />
            <span>Event Clicks &amp; Views</span>
            {!isEnterprisePlan && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Crown className="h-2.5 w-2.5 text-amber-500" />
                Enterprise
              </span>
            )}
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'event_clicks'
                  ? 'bg-cyan-500/25 text-cyan-700 dark:text-cyan-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.clicks || 0}
            </span>
          </button>

          {/* Tab 4: Verified Delegates */}
          <button
            onClick={() => {
              if (isEnterprisePlan) {
                setActiveTab('verified_delegates');
              } else {
                showAdvancedFilterUpgradeModal('Verified Delegate Classification Filter');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              activeTab === 'verified_delegates'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-sky-500" />
            <span>Verified Delegates</span>
            {!isEnterprisePlan && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Crown className="h-2.5 w-2.5 text-amber-500" />
                Enterprise
              </span>
            )}
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'verified_delegates'
                  ? 'bg-sky-500/25 text-sky-600 dark:text-sky-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.delegates}
            </span>
          </button>

          {/* Tab 5: Stall Inquiries */}
          <button
            onClick={() => {
              if (isEnterprisePlan) {
                setActiveTab('stall_inquiries');
              } else {
                showAdvancedFilterUpgradeModal('Stall & Exhibitor Inquiries Filter');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              activeTab === 'stall_inquiries'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-rose-500" />
            <span>Stall Inquiries</span>
            {!isEnterprisePlan ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Crown className="h-2.5 w-2.5 text-amber-500" />
                Enterprise
              </span>
            ) : (
              <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-rose-500 text-white leading-tight">
                New
              </span>
            )}
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'stall_inquiries'
                  ? 'bg-rose-500/25 text-rose-600 dark:text-rose-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.stall}
            </span>
          </button>
        </div>

        {/* Right: Batch Action Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {selectedLeadIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelectedLeads}
              disabled={isDeletingSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeletingSelected ? 'Deleting...' : `Delete Selected (${selectedLeadIds.size})`}</span>
            </button>
          )}
          <button
            onClick={() => setShowBadgeModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none shrink-0"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Digital Badges</span>
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Broadcast Update</span>
          </button>

          <button
            onClick={() => setShowBulkImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            id="btn-export-csv"
            onClick={(e) => {
              e.preventDefault();
              handleExportCsv();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
              isEnterprisePlan
                ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={
              isEnterprisePlan
                ? 'Export leads to CSV spreadsheet'
                : 'Lead Report Export is exclusive to Enterprise Plan (Click to upgrade)'
            }
          >
            {isEnterprisePlan ? (
              <Download className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            )}
            <span>Export CSV</span>
            {!isEnterprisePlan && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 ml-0.5">
                Enterprise
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR (Basic for Starter Plan, Advanced Multi-Filter for Enterprise Plan) */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-2.5">
        {/* Tier Indicator Header */}
        {isEnterprisePlan ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold shadow-2xs">
                <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                Enterprise Advanced Multi-Filter Suite
              </span>
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                Field targeting • 10+ sources • Pipeline stages • Date picker • Intent score tiers
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Zap className="h-3 w-3" /> Real-time Lead Scoring Active
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-foreground border border-border text-xs font-semibold shadow-2xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                Basic Search &amp; Filters (Starter Plan)
              </span>
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                Unified buyer search across name, email &amp; company • Standard status filter
              </span>
            </div>
            <button
              type="button"
              onClick={() => showAdvancedFilterUpgradeModal('Enterprise Multi-Filter Suite')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/35 transition-all cursor-pointer btn-press active:scale-95 shrink-0"
              title="Upgrade to unlock field-targeted search, 10+ sources, date filters & intent score tiers"
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>Unlock Advanced Multi-Filter</span>
              <ArrowRight className="h-3 w-3 ml-0.5" />
            </button>
          </div>
        )}

        {/* Controls Layout */}
        {isEnterprisePlan ? (
          /* ENTERPRISE PLAN ADVANCED CONTROLS */
          <div className="space-y-2.5">
            <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-2.5">
              {/* Field-targeted search combo */}
              <div className="flex items-center flex-1 min-w-0 w-full 2xl:max-w-md">
                <div className="relative shrink-0">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="appearance-none bg-muted/60 hover:bg-muted/80 text-foreground text-xs font-semibold pl-3 pr-7 py-2 rounded-l-lg border border-r-0 border-border focus:outline-none cursor-pointer h-9 transition-colors"
                  >
                    <option value="all">Search All Fields</option>
                    <option value="name">Buyer Name</option>
                    <option value="email">Work Email</option>
                    <option value="company">Organization</option>
                    <option value="phone">Phone Number</option>
                    <option value="designation">Designation / Role</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
                </div>

                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      searchField === 'name'
                        ? 'Search by buyer name...'
                        : searchField === 'email'
                        ? 'Search by work email...'
                        : searchField === 'company'
                        ? 'Search by organization name...'
                        : searchField === 'phone'
                        ? 'Search by phone number...'
                        : searchField === 'designation'
                        ? 'Search by designation or role...'
                        : 'Search by name, email, company, phone...'
                    }
                    className="w-full bg-background text-foreground text-xs h-9 py-2 pl-3 pr-8 rounded-r-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer rounded transition-colors"
                      title="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Filters dropdowns & reset */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full 2xl:w-auto shrink-0 flex-wrap">
                {/* Event Edition Selector */}
                <div className="w-full sm:w-[200px] md:w-[230px] shrink-0">
                  <SearchableSelect
                    options={[
                      ...(events.length > 1 ? [{ value: 'all', label: 'All My Expo Editions' }] : []),
                      ...events.map((evt) => ({
                        value: evt._id,
                        label: evt.title
                      }))
                    ]}
                    value={selectedEventId}
                    onChange={(val) => setSelectedEventId(val)}
                    placeholder={events.length === 0 ? 'No Active Editions' : 'Select Edition...'}
                    searchPlaceholder="Search editions..."
                    className="h-9 py-1 text-xs font-medium"
                  />
                </div>

                {/* Source Dropdown */}
                <div className="relative w-full sm:w-[135px] shrink-0">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full h-9 appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="all">All Sources</option>
                    <option value="event_click">Event Clicks & Views</option>
                    <option value="interested">Marked Interested</option>
                    <option value="follower">Followed Expo</option>
                    <option value="inquiry">Direct Inquiries</option>
                    <option value="ticket_checkout">Ticket Checkout</option>
                    <option value="visitor_pass">Visitor Pass Badges</option>
                    <option value="walk_in">On-site Walk-In</option>
                    <option value="bulk_upload">CSV / Bulk Import</option>
                    <option value="website">Website Form</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* Status Dropdown */}
                <div className="relative w-full sm:w-[125px] shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New Inflow</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal Sent</option>
                    <option value="won">Deal Won</option>
                    <option value="lost">Closed Lost</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* Date Filter */}
                <div className="relative w-full sm:w-[130px] shrink-0">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark] cursor-pointer"
                    title="Filter by Registration Date"
                  />
                </div>

                {/* Intent Score Tier Dropdown */}
                <div className="relative w-full sm:w-[140px] shrink-0">
                  <select
                    value={intentScoreFilter}
                    onChange={(e) => setIntentScoreFilter(e.target.value)}
                    className="w-full h-9 appearance-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="all">All Scores</option>
                    <option value="hot">🔥 Hot (70+)</option>
                    <option value="warm">⚡ Warm (40-69)</option>
                    <option value="cold">❄️ Cold (&lt;40)</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2 top-3 pointer-events-none" />
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleResetFilters}
                  className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
                    hasActiveFilters
                      ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/60'
                  }`}
                  title="Reset all filters and search"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                  {hasActiveFilters && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Presets Pills (Enterprise) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => setIntentScoreFilter(intentScoreFilter === 'hot' ? 'all' : 'hot')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  intentScoreFilter === 'hot'
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border border-border/70'
                }`}
              >
                <Flame className="h-3 w-3 text-amber-500" />
                <span>🔥 Hot Buyers (70+)</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  statusFilter === 'new'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border border-border/70'
                }`}
              >
                <Mail className="h-3 w-3 text-blue-500" />
                <span>📩 Uncontacted (New)</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'qualified' ? 'all' : 'qualified')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  statusFilter === 'qualified'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border border-border/70'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-purple-500" />
                <span>⚡ Qualified Leads</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter(sourceFilter === 'inquiry' ? 'all' : 'inquiry')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  sourceFilter === 'inquiry'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border border-border/70'
                }`}
              >
                <Building2 className="h-3 w-3 text-rose-500" />
                <span>🏢 Stall Inquiries</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter(sourceFilter === 'event_click' ? 'all' : 'event_click')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  sourceFilter === 'event_click'
                    ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border border-border/70'
                }`}
              >
                <Eye className="h-3 w-3 text-cyan-500" />
                <span>👁️ Event Clicks</span>
              </button>
            </div>
          </div>
        ) : (
          /* STARTER PLAN BASIC CONTROLS */
          <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-2.5">
            {/* Unified Basic Search bar */}
            <div className="flex items-center flex-1 min-w-0 w-full 2xl:max-w-md">
              <button
                type="button"
                onClick={() => showAdvancedFilterUpgradeModal('Targeted Field Search')}
                className="appearance-none bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-2 rounded-l-lg border border-r-0 border-border cursor-pointer h-9 transition-colors flex items-center gap-1.5 shrink-0"
                title="Targeted search by specific field (e.g. Email only, Organization only) is an Enterprise feature"
              >
                <span>Search All</span>
                <Lock className="h-3 w-3 text-amber-500" />
              </button>

              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search attendee name, email, company, or phone..."
                  className="w-full bg-background text-foreground text-xs h-9 py-2 pl-3 pr-8 rounded-r-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer rounded transition-colors"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Filters dropdowns and reset */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full 2xl:w-auto shrink-0 flex-wrap">
              {/* Event Edition Selector */}
              <div className="w-full sm:w-[220px] md:w-[260px] shrink-0">
                <SearchableSelect
                  options={[
                    ...(events.length > 1 ? [{ value: 'all', label: 'All My Expo Editions' }] : []),
                    ...events.map((evt) => ({
                      value: evt._id,
                      label: evt.title
                    }))
                  ]}
                  value={selectedEventId}
                  onChange={(val) => setSelectedEventId(val)}
                  placeholder={events.length === 0 ? 'No Active Editions' : 'Select Edition...'}
                  searchPlaceholder="Search editions..."
                  className="h-9 py-1 text-xs font-medium"
                />
              </div>

              {/* Status Dropdown (Basic) */}
              <div className="relative w-full sm:w-[130px] shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="new">New Inflow</option>
                  <option value="contacted">Contacted</option>
                </select>
                <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Locked Sources Button */}
              <button
                type="button"
                onClick={() => showAdvancedFilterUpgradeModal('Acquisition Sources Filter')}
                className="w-full sm:w-[125px] h-9 inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-amber-500/40 bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground font-medium transition-all cursor-pointer group shrink-0"
                title="Filter by 10+ acquisition sources (Passes, Clicks, Forms, etc.) is exclusive to Enterprise Plan"
              >
                <span className="truncate">All Sources</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500/25">
                  <Crown className="h-2.5 w-2.5 text-amber-500" /> Enterprise
                </span>
              </button>

              {/* Locked Date Picker Button */}
              <button
                type="button"
                onClick={() => showAdvancedFilterUpgradeModal('Date Range Filter')}
                className="w-full sm:w-[105px] h-9 inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-amber-500/40 bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground font-medium transition-all cursor-pointer group shrink-0"
                title="Filter by exact registration date is exclusive to Enterprise Plan"
              >
                <span className="truncate flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" /> Date
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500/25">
                  <Lock className="h-2.5 w-2.5 text-amber-500" />
                </span>
              </button>

              {/* Locked Intent Score Button */}
              <button
                type="button"
                onClick={() => showAdvancedFilterUpgradeModal('Buyer Intent Score Tiers')}
                className="w-full sm:w-[120px] h-9 inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-amber-500/40 bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground font-medium transition-all cursor-pointer group shrink-0"
                title="Filter by AI buyer intent score (Hot 70+, Warm 40-69) is exclusive to Enterprise Plan"
              >
                <span className="truncate flex items-center gap-1">
                  <Flame className="h-3 w-3 text-muted-foreground" /> Intent
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500/25">
                  <Crown className="h-2.5 w-2.5 text-amber-500" />
                </span>
              </button>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer btn-press active:scale-95 select-none shrink-0 ${
                  hasActiveFilters
                    ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/60'
                }`}
                title="Reset basic search and status"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CONTEXT / SUMMARY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground px-1 gap-2">
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">
            Verified buyers, business attendees, and delegates registered for your expo editions:
          </span>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {selectedLeadIds.size > 0 && (
            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {selectedLeadIds.size} of {filteredLeads.length} selected
            </span>
          )}
          <span>
            Showing <strong className="text-foreground">{filteredLeads.length}</strong> records
          </span>
        </div>
      </div>

      {/* 5. DATA TABLE & EMPTY STATE */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading attendee registrations...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          /* Premium Enterprise Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Visual Icon Container */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/5">
                {hasActiveFilters ? (
                  <Filter className="h-7 w-7 text-amber-500" />
                ) : (
                  <Users className="h-7 w-7 text-amber-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow-xs">
                {hasActiveFilters ? (
                  <Search className="h-2.5 w-2.5 text-muted-foreground" />
                ) : (
                  <Plus className="h-2.5 w-2.5 text-amber-500" />
                )}
              </div>
            </div>

            <h3 className="text-base font-bold text-foreground mb-1">
              {events.length === 0
                ? 'No Expo Editions Found'
                : hasActiveFilters
                ? 'No Leads Matching Criteria'
                : 'No Buyer Leads Captured Yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
              {events.length === 0
                ? 'You have not created any expo editions yet. Create your first expo event to start capturing buyer leads.'
                : hasActiveFilters
                ? 'No attendee records match your active search keyword or filter settings. Try adjusting your search query or reset filters.'
                : 'Your expo edition has not received any leads yet. Share your event preview page or embed the registration widget to start capturing verified attendee leads.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {events.length === 0 ? (
                <a
                  href="/events/wizard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Expo Edition
                </a>
              ) : hasActiveFilters ? (
                <>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset All Filters
                  </button>
                  <button
                    onClick={openAddLeadModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold text-xs transition-all cursor-pointer btn-press active:scale-95 select-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lead Manually
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={openAddLeadModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lead Manually
                  </button>
                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer btn-press active:scale-95 select-none"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Import Leads
                  </button>
                  <button
                    onClick={() => {
                      if (currentEvent) {
                        window.open(`/expo/${currentEvent.slug || currentEvent._id}`, '_blank');
                      } else {
                        window.open('/expos', '_blank');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold text-xs transition-all cursor-pointer btn-press active:scale-95 select-none"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview Expo Page
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Multi-Select Leads Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered leads"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 min-w-[100px]">Date</th>
                  <th className="px-4 py-3 min-w-[200px]">Buyer Contact</th>
                  <th className="px-4 py-3 min-w-[180px]">Organization & Title</th>
                  <th className="px-4 py-3 min-w-[160px]">Buyer Intent & Score</th>
                  <th className="px-4 py-3 min-w-[150px]">Pipeline Stage</th>
                  <th className="px-4 py-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((item, index) => {
                  const isSelected = selectedLeadIds.has(item._id);
                  const isBlurred = isFreePlan && index >= 3;

                  return (
                    <tr
                      key={item._id}
                      onClick={() => {
                        if (isBlurred) {
                          showSweetWarning('Free plan displays 3 preview leads. Upgrade to Starter or Enterprise to unlock full buyer contacts & CRM intelligence.');
                          return;
                        }
                        setDrawerLead(item);
                      }}
                      className={`transition-colors group ${
                        isSelected ? 'bg-primary/5' : ''
                      } ${
                        isBlurred
                          ? 'filter blur-[4.5px] opacity-40 select-none cursor-not-allowed'
                          : 'hover:bg-muted/40 cursor-pointer'
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          disabled={isBlurred}
                          aria-label={`Select ${item.name || 'lead'}`}
                          checked={isSelected && !isBlurred}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => !isBlurred && toggleSelectLead(item._id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Date column */}
                      <td className="px-4 py-3.5 text-muted-foreground font-medium whitespace-nowrap">
                        {formatExpoDate(item.createdAt)}
                      </td>

                      {/* Buyer Contact column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${getAvatarColor(
                              item.name
                            )}`}
                          >
                            {item.name ? item.name.substring(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {isBlurred ? `${item.name?.split(' ')[0] || 'Buyer'} ••••••` : item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="truncate">
                                {isBlurred ? (item.email ? item.email.substring(0, 2) + '••••@••••.com' : '••••@••••.com') : item.email}
                              </span>
                              {item.country && (
                                <span className="bg-secondary px-1.5 py-0.2 rounded text-[10px] uppercase font-mono">
                                  {item.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Organization & Title column */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground truncate">
                          {isBlurred ? (item.company ? `${item.company.substring(0, 4)}•••• Inc.` : 'Protected Org') : (item.company || 'Individual Attendee')}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.designation || 'Trade Delegate'}
                        </p>
                        {isEnterprisePlan && !isBlurred && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Crown className="h-2.5 w-2.5" /> High Authority Decision Maker
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">Est. ₹50L+</span>
                          </div>
                        )}
                      </td>

                      {/* Buyer Intent & Score */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] gap-1 flex-wrap">
                            <span
                              className={`font-mono font-bold flex items-center gap-1 ${
                                (item.leadScore || 0) >= 70
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : (item.leadScore || 0) >= 40
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              <TrendingUp className="h-3 w-3" />
                              {item.leadScore || 0}% Score
                            </span>
                            <div className="flex items-center gap-1">
                              {renderSourceBadge(item.source)}
                              {isEnterprisePlan && (item.leadScore || 0) >= 70 && !isBlurred && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                                  <Flame className="h-2.5 w-2.5 text-amber-500" /> Hot
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (item.leadScore || 0) >= 70
                                  ? 'bg-emerald-500'
                                  : (item.leadScore || 0) >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-zinc-400'
                              }`}
                              style={{ width: `${Math.min(100, item.leadScore || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Pipeline Stage column */}
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          disabled={isBlurred}
                          value={item.status || 'new'}
                          onChange={(e) => handleUpdateLead(item._id, { status: e.target.value })}
                          className={`appearance-none rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none transition-colors disabled:cursor-not-allowed ${
                            item.status === 'won'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : item.status === 'qualified'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : item.status === 'contacted'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : item.status === 'proposal'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : item.status === 'lost'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-secondary text-foreground border-border'
                          }`}
                        >
                          <option value="new">New Inflow</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="won">Deal Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>

                      {/* Actions column */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Enterprise Quick WhatsApp Direct */}
                          {isEnterprisePlan && !isBlurred && item.phone && (
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition-all cursor-pointer btn-press active:scale-90"
                              title="1-Click WhatsApp Direct"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {/* Quick Call */}
                          {item.phone && !isBlurred && (
                            <a
                              href={`tel:${item.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer btn-press active:scale-90"
                              title="Call Lead"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {/* Quick Email */}
                          {!isBlurred && (
                            <a
                              href={`mailto:${item.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer btn-press active:scale-90"
                              title="Send Email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {/* View CRM Drawer */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isBlurred) {
                                showSweetWarning('Upgrade to Starter or Enterprise plan to unlock and view this lead in detail.');
                                return;
                              }
                              setDrawerLead(item);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer btn-press active:scale-90"
                            title="Open CRM Intelligence"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {/* Edit Lead Details */}
                          {!isBlurred && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLeadModal(item);
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer btn-press active:scale-90"
                              title="Edit Lead Details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {/* Delete Lead */}
                          {!isBlurred && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteLead(item._id, e);
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer btn-press active:scale-90"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Free Plan Upgrade Box */}
            {isFreePlan && filteredLeads.length > 3 && (
              <div className="p-6 m-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-background to-amber-500/10 border border-amber-500/30 text-center space-y-3 shadow-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Lock className="h-3.5 w-3.5" /> Free Plan Limit: 3 / {filteredLeads.length} Leads Unlocked
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Upgrade to Starter or Enterprise to Unlock All {filteredLeads.length} Buyer Leads
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                  Free plan organizers can view only 3 preview leads with remaining entries blurred.
                  Upgrade to <strong>Starter Plan</strong> to view in normal level or <strong>Enterprise Plan</strong> to view in advance level with AI buying intelligence &amp; unlimited downloads.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="h-4 w-4" /> Upgrade to Starter or Enterprise
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
                  >
                    Compare Plans <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. SLIDE-OVER CRM INTELLIGENCE DRAWER */}
      {drawerLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerLead(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-card border-l border-border h-full overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col z-10">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base border shrink-0 ${getAvatarColor(
                    drawerLead.name
                  )}`}
                >
                  {drawerLead.name ? drawerLead.name.substring(0, 2).toUpperCase() : 'NA'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {drawerLead.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {drawerLead.designation || 'Visitor'} at{' '}
                    <strong className="text-foreground">{drawerLead.company || 'Direct Attendee'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditLeadModal(drawerLead)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer btn-press active:scale-90 select-none"
                  title="Edit Lead Details"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDrawerLead(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer btn-press active:scale-90 select-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-3 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-foreground truncate">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{drawerLead.email}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground truncate">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{drawerLead.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 flex-wrap">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{drawerLead.country || 'India'}</span>
                <span>•</span>
                <span>Lead Source:</span>
                {renderSourceBadge(drawerLead.source)}
              </div>
            </div>

            {/* Stage & Score Quick Editors */}
            <div className="grid grid-cols-2 gap-3 bg-muted/10 p-3 rounded-xl border border-border">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={drawerLead.status || 'new'}
                  onChange={(e) => handleUpdateLead(drawerLead._id, { status: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="new">New Inflow</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="won">Deal Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Intent Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={drawerLead.leadScore || 0}
                  onChange={(e) =>
                    handleUpdateLead(drawerLead._id, { leadScore: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            {/* Organizer Internal Notes */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Internal Organizer Notes
              </label>
              <textarea
                rows={3}
                value={drawerLead.notes || ''}
                onChange={(e) => handleUpdateLead(drawerLead._id, { notes: e.target.value })}
                placeholder="Log internal comments, procurement interests, or booth requirement notes..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
              />
            </div>

            {/* Activity History & Follow Ups tabs / layout */}
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" /> Activity History ({drawerLead.activityTimeline?.length || 0})
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-xl p-3 bg-muted/10">
                  {drawerLead.activityTimeline?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No activities logged yet.</p>
                  ) : (
                    drawerLead.activityTimeline.map((act, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-lg p-2.5 text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="font-bold uppercase text-primary">{act.type}</span>
                          <span>{new Date(act.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-foreground">{act.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Log new activity */}
                <form onSubmit={handleAddActivity} className="flex gap-2">
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="email">Email</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Log activity update..."
                    value={newActivityContent}
                    onChange={(e) => setNewActivityContent(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
                  >
                    Log
                  </button>
                </form>
              </div>

              {/* Scheduled Follow-ups */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" /> Follow-up Tasks ({drawerLead.followUps?.length || 0})
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-xl p-3 bg-muted/10">
                  {drawerLead.followUps?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No scheduled follow-up tasks.</p>
                  ) : (
                    drawerLead.followUps.map((fl, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-lg p-2.5 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{fl.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {new Date(fl.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fl.isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {fl.isCompleted ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddFollowUp} className="space-y-2 border border-border p-3 rounded-xl bg-card">
                  <input
                    type="text"
                    required
                    placeholder="Task name (e.g. Follow-up regarding Stall B-12)"
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark]"
                    />
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold text-xs rounded-lg transition-all cursor-pointer btn-press active:scale-95 select-none"
                  >
                    Schedule Follow-up
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: EMBED WIDGET */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Embed Registration Widget</h3>
                  <p className="text-xs text-muted-foreground">
                    Embed the VisitExpo buyer registration form onto your own official website or partner pages.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-press active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase">HTML iFrame Code Snippet</label>
              <div className="relative">
                <pre className="bg-zinc-950 text-zinc-200 text-xs p-3.5 rounded-xl overflow-x-auto font-mono border border-zinc-800">
                  {getEmbedCode()}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer btn-press active:scale-95 select-none"
                >
                  {copiedEmbed ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedEmbed ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                All visitor responses submitted through this widget will automatically synchronize directly into this CRM hub in real-time.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 transition-all cursor-pointer btn-press active:scale-95 select-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: BROADCAST UPDATE */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Broadcast Buyer Update</h3>
                  <p className="text-xs text-muted-foreground">
                    Sending announcement to{' '}
                    <strong className="text-primary">
                      {selectedLeadIds.size > 0 ? `${selectedLeadIds.size} selected leads` : `all ${filteredLeads.length} filtered leads`}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-press active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-foreground">Broadcast Dispatched Successfully!</h4>
                <p className="text-xs text-muted-foreground">Your email announcements have been queued for transmission.</p>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exclusive Buyer Invitations & Exhibition Floor Guide"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Dear Attendee, we are pleased to confirm your VIP pass access for the upcoming expo edition..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    Supports template tags: <code>&#123;name&#125;</code>, <code>&#123;event_name&#125;</code>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBroadcastModal(false)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer btn-press active:scale-95 select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={broadcastSending}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none"
                    >
                      {broadcastSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Send Broadcast
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. MODAL: BULK SHEET & LEAD IMPORT */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Bulk Import Buyer Leads (Excel / CSV)</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload your attendee, buyer, or trade visitor sheet (.xlsx, .xls, .csv) with instant validation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  resetBulkSheetState();
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-press active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bulkImportResult ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-foreground">Import Completed Successfully!</h4>
                <p className="text-xs text-muted-foreground">
                  Successfully imported <strong className="text-foreground">{bulkImportResult.count}</strong> buyer leads into the active expo edition.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Example Sheet / Template Download Card */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <FileDown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Need the format? Download Example Sheet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Use our ready-to-use template with predefined headers (Full Name, Work Email, Phone Number, Company, Designation, Country, Stage, Intent Score, Notes).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-all shadow-xs cursor-pointer btn-press active:scale-95 select-none"
                        title="Download sample Excel spreadsheet template"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer btn-press active:scale-95 select-none"
                        title="Download sample CSV template"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CSV (.csv)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Switcher: Upload Sheet File vs Paste CSV Text */}
                <div className="flex rounded-lg border border-border p-1 bg-muted/20 text-xs">
                  <button
                    type="button"
                    onClick={() => setSheetUploadTab('upload')}
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none ${
                      sheetUploadTab === 'upload'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Upload Spreadsheet File (.xlsx, .xls, .csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetUploadTab('paste')}
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none ${
                      sheetUploadTab === 'paste'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Table className="h-3.5 w-3.5" />
                    Paste Raw Text
                  </button>
                </div>

                <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                  {sheetUploadTab === 'upload' ? (
                    <div className="space-y-3">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={sheetFileInputRef}
                        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                        onChange={(e) => handleSheetFileSelect(e.target.files?.[0])}
                        className="hidden"
                      />

                      {!uploadedSheetFile ? (
                        <div
                          onClick={() => sheetFileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-teal-500 rounded-2xl p-6 text-center bg-muted/10 cursor-pointer transition-all space-y-2 group btn-press active:scale-[0.99] select-none"
                        >
                          <div className="h-10 w-10 mx-auto rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Click to browse or drag & drop spreadsheet</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) sheets
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                <FileSpreadsheet className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground truncate max-w-xs">{uploadedSheetFile.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(uploadedSheetFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                resetBulkSheetState();
                                sheetFileInputRef.current?.click();
                              }}
                              className="text-xs font-semibold text-primary hover:underline cursor-pointer btn-press active:scale-95 select-none transition-transform inline-block"
                            >
                              Choose Different File
                            </button>
                          </div>

                          {/* Stats summary */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              {parsedSheetLeads.length} valid leads ready to import
                            </span>
                            {skippedSheetRowsCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                                <AlertCircle className="h-3 w-3" />
                                {skippedSheetRowsCount} rows skipped (missing name or email)
                              </span>
                            )}
                          </div>

                          {/* Parsed Leads Preview Table */}
                          {parsedSheetLeads.length > 0 && (
                            <div className="rounded-lg border border-border overflow-hidden">
                              <div className="bg-muted/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                                <span>Preview of Parsed Leads (showing first {Math.min(5, parsedSheetLeads.length)})</span>
                                <span>Total: {parsedSheetLeads.length}</span>
                              </div>
                              <div className="overflow-x-auto max-h-36 divide-y divide-border text-xs">
                                {parsedSheetLeads.slice(0, 5).map((l, idx) => (
                                  <div key={idx} className="px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-muted/10">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground truncate text-xs">{l.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{l.email}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-[11px] text-foreground truncate">{l.company || '—'}</p>
                                      <p className="text-[10px] text-muted-foreground font-mono">{l.phone || 'No phone'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {parsedSheetLeads.length > 5 && (
                                <div className="bg-muted/20 px-3 py-1 text-[10px] text-muted-foreground text-center border-t border-border">
                                  + {parsedSheetLeads.length - 5} more leads will be imported
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {bulkParseError && (
                        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{bulkParseError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase">
                          Paste CSV / Tab-Separated Data
                        </label>
                        <button
                          type="button"
                          onClick={handleLoadSampleLeads}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer btn-press active:scale-95 select-none transition-transform inline-block"
                        >
                          Load Sample Leads
                        </button>
                      </div>

                      <textarea
                        rows={6}
                        required
                        value={bulkCsvText}
                        onChange={(e) => setBulkCsvText(e.target.value)}
                        placeholder="Aarav Mehta, aarav@techinfra.com, +91 98201 12345, TechInfra Solutions, Procurement Director
Priya Sharma, priya@apexglobal.in, +91 98110 54321, Apex Global, VP Operations"
                        className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Target Event: <strong className="text-foreground">{currentEvent?.title || 'Selected Edition'}</strong>
                  </p>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkImportModal(false);
                        resetBulkSheetState();
                      }}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer btn-press active:scale-95 select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkImporting || (sheetUploadTab === 'upload' ? parsedSheetLeads.length === 0 : !bulkCsvText.trim())}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-press active:scale-95 select-none"
                    >
                      {bulkImporting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <Upload className="h-3.5 w-3.5" />
                      {sheetUploadTab === 'upload' && parsedSheetLeads.length > 0
                        ? `Import ${parsedSheetLeads.length} Leads`
                        : 'Import Leads'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. MODAL: DIGITAL BADGES GENERATION */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Digital Expo Entry Badges</h3>
                  <p className="text-xs text-muted-foreground">
                    Instant printable and mobile e-badges for verified attendees.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-press active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Badge Preview Card */}
            <div className="border border-border rounded-2xl p-5 bg-gradient-to-br from-amber-500/10 via-card to-rose-500/10 shadow-sm relative overflow-hidden space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                    Official Delegate Pass
                  </span>
                  <h4 className="text-lg font-black text-foreground mt-0.5">
                    {drawerLead ? drawerLead.name : filteredLeads[0]?.name || 'Rahul Sharma'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {drawerLead ? drawerLead.designation : filteredLeads[0]?.designation || 'Chief Buyer'}
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {drawerLead ? drawerLead.company : filteredLeads[0]?.company || 'Acme Global Ventures'}
                  </p>
                </div>

                {/* QR Code Graphic */}
                <div className="bg-white p-2 rounded-xl border shadow-xs shrink-0">
                  <QrCode className="h-16 w-16 text-zinc-950" />
                </div>
              </div>

              <div className="border-t border-border/80 pt-3 flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Edition: <strong className="text-foreground">{currentEvent?.title || 'VisitExpo Global Trade'}</strong></span>
                <span className="font-mono bg-primary/20 text-primary-foreground font-bold px-2 py-0.5 rounded">
                  VIP-BUYER
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Generating badges for{' '}
                <strong className="text-foreground">
                  {selectedLeadIds.size > 0 ? `${selectedLeadIds.size} selected` : `all ${filteredLeads.length} leads`}
                </strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all flex items-center gap-1.5 cursor-pointer btn-press active:scale-95 select-none"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Passes
                </button>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer btn-press active:scale-95 select-none"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: ADD SINGLE MANUAL LEAD */}
      {/* 8. ADD / EDIT BUYER LEAD MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {isEditMode ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isEditMode ? 'Edit Buyer Lead Details' : 'Add Buyer Lead Manually'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isEditMode
                      ? 'Update contact details, qualification stage, or notes for this buyer.'
                      : 'Record a walk-in, trade inquiry, or directly contacted buyer.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLeadModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-press active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3">
              {events.length > 1 && !isEditMode && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Expo Edition *
                  </label>
                  <select
                    value={leadForm.eventId || (selectedEventId !== 'all' ? selectedEventId : events[0]?._id)}
                    onChange={(e) => setLeadForm({ ...leadForm, eventId: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                  >
                    {events.map((evt) => (
                      <option key={evt._id} value={evt._id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Kapoor"
                    value={leadForm.name}
                    onChange={(e) => {
                      setLeadForm({ ...leadForm, name: e.target.value });
                      if (leadFormErrors.name) setLeadFormErrors(prev => ({ ...prev, name: null }));
                    }}
                    className={`w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none transition-colors ${
                      leadFormErrors.name
                        ? 'border-destructive ring-1 ring-destructive focus:ring-destructive'
                        : 'border-border focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {leadFormErrors.name && (
                    <p className="mt-1 text-[11px] font-semibold text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {leadFormErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@company.com"
                    value={leadForm.email}
                    onChange={(e) => {
                      setLeadForm({ ...leadForm, email: e.target.value });
                      if (leadFormErrors.email) setLeadFormErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none transition-colors ${
                      leadFormErrors.email
                        ? 'border-destructive ring-1 ring-destructive focus:ring-destructive'
                        : 'border-border focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {leadFormErrors.email && (
                    <p className="mt-1 text-[11px] font-semibold text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {leadFormErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    inputMode="tel"
                    maxLength={24}
                    placeholder="+91 98765 43210"
                    value={leadForm.phone}
                    onChange={handlePhoneChange}
                    className={`w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none transition-colors font-mono ${
                      leadFormErrors.phone
                        ? 'border-destructive ring-1 ring-destructive focus:ring-destructive'
                        : 'border-border focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {leadFormErrors.phone ? (
                    <p className="mt-1 text-[11px] font-semibold text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {leadFormErrors.phone}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Up to 15 digits; +, -, spaces, and parentheses allowed. No letters.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Company / Org
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kapoor Enterprises"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sourcing Manager"
                    value={leadForm.designation}
                    onChange={(e) => setLeadForm({ ...leadForm, designation: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="event_click">Event Click & View</option>
                    <option value="interested">Marked Interested</option>
                    <option value="follower">Followed Expo</option>
                    <option value="inquiry">Stall & Direct Inquiry</option>
                    <option value="ticket_checkout">Ticket Checkout</option>
                    <option value="visitor_pass">Visitor Pass Badge</option>
                    <option value="walk_in">On-site Walk-In</option>
                    <option value="bulk_upload">CSV / Bulk Upload</option>
                    <option value="website">Website Form</option>
                    <option value="campaign">Marketing Campaign</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Stage
                  </label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="new">New Inflow</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Deal Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Intent Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={leadForm.leadScore}
                    onChange={(e) => setLeadForm({ ...leadForm, leadScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Inquiry requirements or stall preference..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer btn-press active:scale-95 select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-press active:scale-95 select-none"
                >
                  {isSubmittingLead && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isEditMode ? 'Update Lead' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
