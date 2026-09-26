'use client';

/**
 * @file page.js (Attendee & Buyer Leads Hub)
 * @description Advanced Lead CRM & Buyer Intelligence Hub for VisitExpo event organizers.
 * Inspired by enterprise expo dashboards with VisitExpo brand aesthetic, custom terminology,
 * multi-select batch workflows, embed widgets, badge generation, and slide-over CRM controls.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import SearchableSelect from '../../../components/SearchableSelect.js';
import { showSweetAlert, showSweetConfirm, showSweetSuccess, showSweetError, showSweetWarning } from '../../../utils/sweetalert.js';
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
  Sparkles,
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
  MoreHorizontal
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function LeadsCRMPage() {
  const { user, accessToken } = useAuth();

  // Primary Data State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab State: 'high_intent' | 'verified_delegates' | 'stall_inquiries' | 'all'
  const [activeTab, setActiveTab] = useState('high_intent');

  // Search & Filter State
  const [searchField, setSearchField] = useState('all'); // 'all' | 'name' | 'email' | 'company' | 'phone'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
  const [dateFilter, setDateFilter] = useState('');

  // Selection state for batch operations
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  // Slide-over CRM Drawer state
  const [drawerLead, setDrawerLead] = useState(null);
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
    notes: ''
  });
  const [leadFormErrors, setLeadFormErrors] = useState({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

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
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load events', err);
        setError('Could not connect to API server. Ensure backend is running.');
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user, accessToken]);

  // 2. Fetch Leads for Active Event
  const fetchLeads = async () => {
    if (!selectedEventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/leads`, {
        params: { eventId: selectedEventId, limit: 300 },
        headers
      });
      if (res.data && res.data.success) {
        setLeads(res.data.data.docs || []);
        setSelectedLeadIds(new Set());
      }
    } catch (err) {
      console.error('Failed to load leads', err);
      setError('Error fetching CRM leads. Ensure database is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedEventId, accessToken]);

  // Active selected event object
  const currentEvent = useMemo(() => {
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filter leads based on Tab, Search, Status, and Date
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      // 1. Tab Intent Filter
      if (activeTab === 'high_intent') {
        // High-Intent: Score >= 70 OR status qualified/won
        const isHigh = (item.leadScore || 0) >= 70 || item.status === 'qualified' || item.status === 'won';
        if (!isHigh) return false;
      } else if (activeTab === 'verified_delegates') {
        // Verified delegates: Score 40-69 OR contacted/proposal
        const isDelegate =
          ((item.leadScore || 0) >= 40 && (item.leadScore || 0) < 70) ||
          item.status === 'contacted' ||
          item.status === 'proposal';
        if (!isDelegate) return false;
      } else if (activeTab === 'stall_inquiries') {
        // Stall/Exhibitor inquiries or Walk-in/Campaign new leads
        const isStall =
          item.source === 'walk_in' ||
          item.source === 'campaign' ||
          item.status === 'new' ||
          (item.company && item.company.toLowerCase().includes('ltd'));
        if (!isStall) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 3. Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        if (searchField === 'name') {
          if (!item.name?.toLowerCase().includes(query)) return false;
        } else if (searchField === 'email') {
          if (!item.email?.toLowerCase().includes(query)) return false;
        } else if (searchField === 'company') {
          if (!item.company?.toLowerCase().includes(query)) return false;
        } else if (searchField === 'phone') {
          if (!item.phone?.toLowerCase().includes(query)) return false;
        } else {
          // 'all' fields
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

      // 4. Date Filter
      if (dateFilter) {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        if (itemDate !== dateFilter) return false;
      }

      return true;
    });
  }, [leads, activeTab, statusFilter, searchTerm, searchField, dateFilter]);

  // Tab counts for badges
  const tabCounts = useMemo(() => {
    const high = leads.filter(
      (l) => (l.leadScore || 0) >= 70 || l.status === 'qualified' || l.status === 'won'
    ).length;
    const delegates = leads.filter(
      (l) =>
        ((l.leadScore || 0) >= 40 && (l.leadScore || 0) < 70) ||
        l.status === 'contacted' ||
        l.status === 'proposal'
    ).length;
    const stall = leads.filter(
      (l) =>
        l.source === 'walk_in' ||
        l.source === 'campaign' ||
        l.status === 'new' ||
        (l.company && l.company.toLowerCase().includes('ltd'))
    ).length;
    return { high, delegates, stall, all: leads.length };
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

  // Reset all filters
  const handleResetFilters = () => {
    setSearchField('all');
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
    setActiveTab('high_intent');
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
      }
    } catch (err) {
      console.error('Error deleting lead', err);
      showSweetError('Failed to delete lead');
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

  // Export CSV of filtered or selected leads
  const handleExportCsv = () => {
    const listToExport =
      selectedLeadIds.size > 0
        ? leads.filter((l) => selectedLeadIds.has(l._id))
        : filteredLeads;

    if (listToExport.length === 0) {
      showSweetWarning('No leads available to export.', 'Export CSV');
      return;
    }

    const headers = ['Date', 'Name', 'Email', 'Phone', 'Company', 'Designation', 'Country', 'Score', 'Status', 'Source'];
    const rows = listToExport.map((l) => [
      new Date(l.createdAt).toLocaleDateString(),
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.designation || '').replace(/"/g, '""')}"`,
      `"${(l.country || 'India').replace(/"/g, '""')}"`,
      l.leadScore || 0,
      l.status || 'new',
      l.source || 'website'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VisitExpo_Buyer_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const headers = Object.keys(sampleData[0]).join(',');
      const rows = sampleData.map(row =>
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VisitExpo_Leads_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
    if (!selectedEventId) {
      showSweetWarning('Please select an active expo edition first.');
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
        { eventId: selectedEventId, leads: leadsToImport },
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
    const sanitizedVal = rawVal.replace(/[a-zA-Z]/g, '').replace(/[^0-9+\s\-()]/g, '');
    setLeadForm(prev => ({ ...prev, phone: sanitizedVal }));
    if (leadFormErrors.phone) {
      setLeadFormErrors(prev => ({ ...prev, phone: null }));
    }
  };

  // Open modal in Add mode
  const openAddLeadModal = () => {
    setIsEditMode(false);
    setCurrentLeadId(null);
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
      notes: ''
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
      notes: lead.notes || ''
    });
    setLeadFormErrors({});
    setShowLeadModal(true);
  };

  // Handle Manual Lead Creation or Update
  const handleSaveLead = async (e) => {
    e.preventDefault();

    if (!selectedEventId && !isEditMode) {
      showSweetWarning('Please select an expo edition before adding leads.');
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
            eventId: selectedEventId
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.data && res.data.success) {
          setLeads(prev => [res.data.lead, ...prev]);
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

  return (
    <div className="space-y-6 pb-16 relative">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Attendee & Buyer Leads Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized buyer intelligence, delegate registrations, and high-intent inquiry management
          </p>
        </div>

        {/* Top Right Action Buttons (Styled with VisitExpo theme) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Embed Widget Button */}
          <button
            onClick={() => setShowEmbedModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors shadow-xs"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live Preview
          </button>

          {/* Add Manual Lead Button */}
          <button
            onClick={openAddLeadModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER: INTENT TABS & BATCH ACTION TOOLS ROW */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/80 pb-3">
        {/* Left: Categorized Intent Navigation Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar text-sm">
          {/* Tab 1: High-Intent Buyers */}
          <button
            onClick={() => setActiveTab('high_intent')}
            className={`relative pb-3 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'high_intent'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-emerald-500" />
            High-Intent Buyers
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {tabCounts.high}
            </span>
            {activeTab === 'high_intent' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          {/* Tab 2: Verified Delegates */}
          <button
            onClick={() => setActiveTab('verified_delegates')}
            className={`relative pb-3 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'verified_delegates'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-amber-500" />
            Verified Delegates
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {tabCounts.delegates}
            </span>
            {activeTab === 'verified_delegates' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          {/* Tab 3: Stall Inquiries with "New" Tag */}
          <button
            onClick={() => setActiveTab('stall_inquiries')}
            className={`relative pb-3 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stall_inquiries'
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-rose-500" />
            Stall Inquiries
            <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-rose-500 text-white leading-tight">
              New
            </span>
            {activeTab === 'stall_inquiries' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* Tab 4: All Inquiries */}
          <button
            onClick={() => setActiveTab('all')}
            className={`relative pb-3 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Inquiries
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-bold">
              {tabCounts.all}
            </span>
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        </div>

        {/* Right: Batch Action Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Digital Badges */}
          <button
            onClick={() => setShowBadgeModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-xs"
          >
            <QrCode className="h-3.5 w-3.5" />
            Digital Badges
          </button>

          {/* Broadcast Message */}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            Broadcast Update
          </button>

          {/* Bulk Import */}
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Bulk Import
          </button>

          {/* Export CSV List */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          {/* Search by dropdown + Search input combo */}
          <div className="flex items-center flex-1 min-w-[280px]">
            <div className="relative">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="appearance-none bg-muted/60 hover:bg-muted/80 text-foreground text-xs font-semibold pl-3 pr-7 py-2 rounded-l-lg border border-r-0 border-border focus:outline-none cursor-pointer"
              >
                <option value="all">Search All</option>
                <option value="name">Buyer Name</option>
                <option value="email">Work Email</option>
                <option value="company">Organization</option>
                <option value="phone">Phone Number</option>
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search term..."
                className="w-full bg-background text-foreground text-xs py-2 pl-3 pr-9 rounded-r-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              />
              <button
                type="button"
                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filters label and dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground px-1 hidden xl:inline-block">
              Filters:
            </span>

            {/* Event Edition Selector */}
            <div className="min-w-[200px] sm:min-w-[240px]">
              <SearchableSelect
                options={events.map((evt) => ({
                  value: evt._id,
                  label: evt.title
                }))}
                value={selectedEventId}
                onChange={(val) => setSelectedEventId(val)}
                placeholder={events.length === 0 ? 'No Active Editions' : 'Select Edition...'}
                searchPlaceholder="Search editions..."
                className="py-1.5 text-xs font-medium"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
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
            <div className="relative min-w-[135px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark]"
                title="Filter by Registration Date"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTEXT / SUMMARY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground px-1 gap-2">
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Verified buyers, business attendees, and delegates registered for your expo editions:
        </p>
        <div className="flex items-center gap-3">
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
          /* High-Fidelity Custom Empty State (Inspired by 10times design) */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {/* Custom SVG Illustration */}
            <div className="relative mb-5">
              <svg
                width="140"
                height="110"
                viewBox="0 0 140 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
              >
                {/* Folder Backing */}
                <path
                  d="M10 24C10 18.4772 14.4772 14 20 14H50L62 26H120C125.523 26 130 30.4772 130 36V90C130 95.5228 125.523 100 120 100H20C14.4772 100 10 95.5228 10 90V24Z"
                  fill="currentColor"
                  className="text-amber-500/20 dark:text-amber-400/10"
                />
                {/* Folder Front Flap */}
                <path
                  d="M10 40H130V90C130 95.5228 125.523 100 120 100H20C14.4772 100 10 95.5228 10 90V40Z"
                  fill="currentColor"
                  className="text-amber-500/30 dark:text-amber-400/20"
                />
                {/* Cute Sad Face on Folder */}
                <circle cx="55" cy="65" r="3.5" fill="#0284C7" />
                <circle cx="85" cy="65" r="3.5" fill="#0284C7" />
                <path
                  d="M62 82C66 77 74 77 78 82"
                  stroke="#0284C7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Speech Bubble with Cross/Empty Motif */}
                <g transform="translate(85, 2)">
                  <rect width="40" height="28" rx="8" fill="#0284C7" />
                  <path d="M12 28L8 35L20 28H12Z" fill="#0284C7" />
                  {/* Cross icon inside bubble */}
                  <path
                    d="M16 10L24 18M24 10L16 18"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>

            <h3 className="text-base font-extrabold tracking-wide uppercase text-foreground mb-1">
              NO DATA FOUND!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mb-6">
              Your event is not receiving leads yet. Publish or promote your expo event page to start capturing verified buyer registrations.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (currentEvent) {
                    window.open(`/expo/${currentEvent.slug || currentEvent._id}`, '_blank');
                  } else {
                    window.open('/expos', '_blank');
                  }
                }}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                PREVIEW EXPO PAGE
              </button>

              <button
                onClick={() => setShowBulkImportModal(true)}
                className="px-4 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors"
              >
                Import Demo Leads
              </button>
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
                {filteredLeads.map((item) => {
                  const isSelected = selectedLeadIds.has(item._id);

                  return (
                    <tr
                      key={item._id}
                      onClick={() => setDrawerLead(item)}
                      className={`hover:bg-muted/40 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox column */}
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectLead(item._id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
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
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="truncate">{item.email}</span>
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
                          {item.company || 'Individual Attendee'}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.designation || 'Trade Delegate'}
                        </p>
                      </td>

                      {/* Buyer Intent & Score */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
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
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {item.source || 'website'}
                            </span>
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
                          value={item.status || 'new'}
                          onChange={(e) => handleUpdateLead(item._id, { status: e.target.value })}
                          className={`appearance-none rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none transition-colors ${
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
                          {/* Quick Call */}
                          {item.phone && (
                            <a
                              href={`tel:${item.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Call Lead"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {/* Quick Email */}
                          <a
                            href={`mailto:${item.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                          {/* View CRM Drawer */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerLead(item);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Open CRM Intelligence"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {/* Edit Lead Details */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditLeadModal(item);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            title="Edit Lead Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete Lead */}
                          <button
                            onClick={(e) => handleDeleteLead(item._id, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Edit Lead Details"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDrawerLead(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{drawerLead.country || 'India'} | Lead Source: <strong className="text-foreground capitalize">{drawerLead.source || 'Website'}</strong></span>
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
                    className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
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
                    className="w-full py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold text-xs rounded-lg transition-colors"
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
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
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-sm transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
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
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={broadcastSending}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-colors shadow-xs"
                        title="Download sample Excel spreadsheet template"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
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
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
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
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
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
                          className="border-2 border-dashed border-border hover:border-teal-500 rounded-2xl p-6 text-center bg-muted/10 cursor-pointer transition-colors space-y-2 group"
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
                              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
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
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
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
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkImporting || (sheetUploadTab === 'upload' ? parsedSheetLeads.length === 0 : !bulkCsvText.trim())}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
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
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Passes
                </button>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    inputMode="tel"
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
                      Digits and symbols (+, -, space) only. No letters.
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

              <div className="grid grid-cols-3 gap-3">
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
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
