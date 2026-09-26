'use client';

/**
 * @file wizard/page.js
 * @description 10times-Style Multi-Step Event & Organizer Onboarding Wizard.
 * Features 8 step workflow:
 * 1. Action Choice (Create vs Claim)
 * 2. Basic Details (with AI Description Generator)
 * 3. Date & Venue (with interactive map preview)
 * 4. Organizer Profile Setup
 * 5. Banner & Media Upload (1920x1080 cover, photo gallery, brochure, promo video)
 * 6. Ticketing & Registration Form configuration
 * 7. Preview & Pre-Publish SEO Checker (with real-time SEO score gauge)
 * 8. Submission & Admin Moderation Status
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext.js';
import axios from 'axios';
import { validateEventImage } from '../../../../utils/imageValidation.js';
import SearchableSelect from '../../../../components/SearchableSelect.js';
import { showSweetAlert, showSweetConfirm, showSweetWarning, showSweetError } from '../../../../utils/sweetalert.js';
import {
  Calendar,
  MapPin,
  Building,
  Upload,
  Ticket,
  Eye,
  CheckCircle2,
  Plus,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  ShieldCheck,
  Search,
  FileText,
  Video,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  ExternalLink,
  Zap,
  Check,
  Lock,
  Layers,
  Star,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Eraser,
  Loader2,
  Trash2,
  ScrollText,
  Compass,
  AlertCircle,
  ChevronDown,
  X,
  FileEdit,
  Strikethrough,
  Highlighter,
  Minus,
  Type,
  Palette,
  Sparkles
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', flag: '🇨🇳' }
];

export const getCurrencySymbol = (code) => {
  const c = CURRENCY_OPTIONS.find(item => item.code === code);
  return c ? c.symbol : (code || '₹');
};

export const COUNTRY_DIAL_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' }
];

export const COMMON_COUNTRIES = [
  'India',
  'United States',
  'United Arab Emirates',
  'United Kingdom',
  'Germany',
  'Singapore',
  'France',
  'Japan',
  'China',
  'Australia',
  'Canada',
  'Saudi Arabia',
  'Italy',
  'Spain',
  'Netherlands',
  'Switzerland',
  'South Korea',
  'Brazil',
  'South Africa',
  'Malaysia',
  'Indonesia',
  'Thailand',
  'Vietnam',
  'Turkey',
  'Qatar',
  'Oman',
  'Kuwait',
  'Bahrain'
];

export const parsePhoneWithCountryCode = (phoneStr = '') => {
  const trimmed = (phoneStr || '').trim();
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return { code: match[1], number: match[2] };
  }
  return { code: '+91', number: trimmed.replace(/^\+/, '') };
};

export const SPONSOR_TIER_GROUPS = [
  {
    label: 'Major Tiers',
    options: [
      'Title Sponsor',
      'Presenting Sponsor',
      'Powered By Sponsor',
      'Diamond Sponsor',
      'Platinum Sponsor',
      'Gold Sponsor',
      'Silver Sponsor',
      'Bronze Sponsor',
      'Co-Sponsor',
      'Lead Sponsor'
    ]
  },
  {
    label: 'Partners & Domain',
    options: [
      'Official Partner',
      'Strategic Partner',
      'Technology Partner',
      'Media Partner',
      'Knowledge Partner',
      'Content Partner',
      'Ecosystem Partner',
      'Association Partner',
      'Innovation Partner',
      'Community Partner',
      'Industry Partner',
      'Sustainability Partner'
    ]
  },
  {
    label: 'Experience & Event Roles',
    options: [
      'Registration Partner',
      'Badge & Lanyard Partner',
      'VIP Lounge Partner',
      'Networking Partner',
      'After-Party Partner',
      'Gala Dinner Partner',
      'Hospitality Partner',
      'Beverage Partner',
      'Gift & Goodie Bag Partner',
      'Travel Partner',
      'Supporting Partner',
      'Exhibitor'
    ]
  }
];

export const PRESET_SPONSOR_TIERS = SPONSOR_TIER_GROUPS.flatMap(g => g.options);

export const CATEGORY_SUBSECTORS = {
  'Technology & AI': [
    'Information Technology',
    'Artificial Intelligence & ML',
    'Cybersecurity & Cloud Computing',
    'Data Analytics & Big Data',
    'Robotics & Automation',
    'Telecommunications & 5G',
    'Fintech & Digital Banking',
    'Web3, Blockchain & Crypto',
    'Consumer Electronics & Smart Devices',
    'E-commerce & Retail Tech',
    'Semiconductor & Microelectronics',
    'EdTech & E-Learning'
  ],
  'Industrial Manufacturing': [
    'Machinery & Heavy Equipment',
    'Industrial Automation & Control',
    'Metal, Steel & Metallurgy',
    'Chemical & Process Engineering',
    'Plastics, Polymers & Rubber',
    'Packaging & Printing',
    'Tooling, Moulding & Dies',
    'Electrical & Power Electronics',
    'Hydraulics, Pneumatics & Valves',
    'Textile Machinery & Apparel Tech',
    'Safety, Fire & Defense Engineering'
  ],
  'Healthcare & Pharma': [
    'Pharmaceuticals & API',
    'Medical Devices & Diagnostics',
    'Hospital Equipment & Infrastructure',
    'Biotechnology & Life Sciences',
    'Digital Health & Telemedicine',
    'Dental & Oral Healthcare',
    'Surgical & Laboratory Instruments',
    'Wellness, Fitness & Nutrition',
    'Ayush, Herbal & Alternative Medicine'
  ],
  'Renewable Energy & ESG': [
    'Solar Energy & Photovoltaics',
    'Wind & Bio Energy',
    'EV & Battery Storage Technology',
    'Smart Grid & Energy Efficiency',
    'Waste Management & Recycling',
    'Water & Wastewater Treatment',
    'Environmental & Climate Tech',
    'Green Building & Sustainable Materials'
  ],
  'Agriculture & Food Tech': [
    'Agri-Machinery & Implements',
    'Agritech & Precision Farming',
    'Fertilizer, Seeds & Crop Protection',
    'Food Processing & Packaging',
    'Dairy, Poultry & Aquaculture',
    'Organic & Sustainable Produce',
    'Cold Chain & Logistics',
    'Beverages & Food Ingredients'
  ],
  'Consumer Goods & Retail': [
    'FMCG & Personal Care',
    'Apparel, Fashion & Lifestyle',
    'Home Decor, Furniture & Kitchenware',
    'Gems & Jewellery',
    'Retail Tech & POS Solutions',
    'Toys, Baby & Kids Products',
    'Sports, Outdoor & Leisure',
    'Cosmetics & Beauty Expo'
  ],
  'Automotive & Transport': [
    'Electric Vehicles & Hybrid Systems',
    'Auto Components & Spare Parts',
    'Commercial Vehicles & Logistics',
    'Aviation, Aerospace & Defense',
    'Rail, Fleet & Infrastructure',
    'Marine & Maritime Expo'
  ],
  'Real Estate, Building & Construction': [
    'Construction Machinery & Building Materials',
    'Architecture, Interiors & Design',
    'Real Estate & Property Development',
    'HVAC & Refrigeration',
    'Plumbing, Sanitation & Tiles',
    'Smart Home & Lighting Systems'
  ],
  'Services, Finance & Education': [
    'BFSI & Investment Services',
    'Franchise & Business Opportunities',
    'Higher Education & Study Abroad',
    'Supply Chain, Logistics & Warehousing',
    'Media, Advertising & MarTech',
    'Travel, Tourism & Hospitality'
  ]
};



// Convert Markdown or Plain Text to HTML
export function markdownToHtml(content) {
  if (!content) return '';
  if (/<(p|h[1-6]|div|ul|ol|li|blockquote|table|hr|b|i|u|s|strong|em)[^>]*>/i.test(content)) {
    return content;
  }
  const lines = content.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  const inline = (s) => s
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(.*?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  for (let line of lines) {
    const t = line.trim();
    if (!t) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      continue;
    }
    if (t.startsWith('# ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h1>${inline(t.slice(2))}</h1>`;
    } else if (t.startsWith('## ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h2>${inline(t.slice(3))}</h2>`;
    } else if (t.startsWith('### ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h3>${inline(t.slice(4))}</h3>`;
    } else if (t.startsWith('> ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<blockquote>${inline(t.slice(2))}</blockquote>`;
    } else if (t.startsWith('• ') || t.startsWith('- ') || t.startsWith('* ')) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${inline(t.replace(/^[•\-*]\s+/, ''))}</li>`;
    } else if (/^\d+\.\s+/.test(t)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${inline(t.replace(/^\d+\.\s+/, ''))}</li>`;
    } else {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<p>${inline(t)}</p>`;
    }
  }
  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';
  return html || '<p></p>';
}

export function getCleanText(htmlOrText) {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getWordCount(htmlOrText) {
  const clean = getCleanText(htmlOrText);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

// Render Rich Text Markdown/HTML content into styled React elements
export function renderRichText(content) {
  if (!content || typeof content !== 'string') return null;

  // If content contains HTML tags, render it with rich wysiwyg styles
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div
        className="wysiwyg-editor prose dark:prose-invert max-w-none text-foreground text-sm space-y-1"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback markdown parsing for legacy markdown strings
  const lines = content.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let isNumbered = false;

  const formatInline = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium">$1</a>')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*{2,}/g, '')
      .trim();
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (isNumbered) {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal list-inside space-y-1 my-2 pl-2 text-foreground">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc list-inside space-y-1 my-2 pl-2 text-foreground">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^#{1,6}$/.test(trimmed)) return;

    if (trimmed.startsWith('# ')) {
      flushList(idx);
      elements.push(<h1 key={idx} className="text-xl font-extrabold tracking-tight text-foreground my-3 border-b border-border pb-1" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^#\s*/, '')) }} />);
    } else if (trimmed.startsWith('## ')) {
      flushList(idx);
      elements.push(<h2 key={idx} className="text-lg font-bold text-foreground my-2.5" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^##\s*/, '')) }} />);
    } else if (trimmed.startsWith('### ')) {
      flushList(idx);
      elements.push(<h3 key={idx} className="text-base font-bold text-foreground my-2 text-primary" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^###\s*/, '')) }} />);
    } else if (trimmed.startsWith('> ')) {
      flushList(idx);
      elements.push(<blockquote key={idx} className="border-l-4 border-primary pl-4 py-1 italic text-muted-foreground my-2 bg-muted/20 rounded-r" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />);
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || isNumbered) {
        flushList(idx);
        inList = true;
        isNumbered = false;
      }
      listItems.push(trimmed.replace(/^[•\-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || !isNumbered) {
        flushList(idx);
        inList = true;
        isNumbered = true;
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else {
      flushList(idx);
      if (trimmed === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(<p key={idx} className="text-sm text-foreground leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
      }
    }
  });

  flushList('end');
  return elements;
}

// In-Place Visual WYSIWYG Rich Text Editor Component (No separate preview section)
export function RichTextEditor({
  name = '',
  value = '',
  onChange,
  placeholder = 'Describe your event highlights, target visitor profiles, exhibitor benefits, and key conference themes...',
  minHeight = '240px'
}) {
  const [mode, setMode] = useState('visual'); // 'visual' | 'html'
  const [internalHtml, setInternalHtml] = useState(() => markdownToHtml(value || ''));
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedFont, setSelectedFont] = useState('inherit');
  const [selectedSize, setSelectedSize] = useState('3');
  const [selectedBlock, setSelectedBlock] = useState('p');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false
  });

  const editorRef = React.useRef(null);
  const isTypingRef = React.useRef(false);

  // Sync external value updates (e.g. from AI assistant or reset)
  useEffect(() => {
    const formatted = markdownToHtml(value || '');
    if (!isTypingRef.current) {
      setInternalHtml(formatted);
      if (editorRef.current && editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
      }
    }
  }, [value]);

  // Initial load into contentEditable
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = markdownToHtml(value || '');
    }
  }, []);

  const checkActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough')
      });
    } catch (e) {}
  };

  const executeCommand = (cmd, val = null) => {
    if (mode !== 'visual') return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {}
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setInternalHtml(html);
      onChange?.(html);
      checkActiveFormats();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isTypingRef.current = true;
    const currentHtml = editorRef.current.innerHTML;
    setInternalHtml(currentHtml);
    onChange?.(currentHtml);
    checkActiveFormats();
    setTimeout(() => {
      isTypingRef.current = false;
    }, 150);
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    if (newMode === 'html') {
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        setInternalHtml(currentHtml);
        onChange?.(currentHtml);
      }
      setMode('html');
    } else {
      setMode('visual');
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = internalHtml;
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter link URL (e.g. https://visitexpo.in):', 'https://');
    if (url && url.trim()) {
      executeCommand('createLink', url.trim());
    }
  };

  const handleInsertDivider = () => {
    executeCommand('insertHorizontalRule');
  };

  const handleClearFormat = () => {
    executeCommand('removeFormat');
    executeCommand('formatBlock', '<p>');
    setSelectedBlock('p');
    setSelectedFont('inherit');
    setSelectedSize('3');
  };

  const TEXT_COLORS = [
    { label: 'Default', color: 'inherit' },
    { label: 'Charcoal', color: '#0f172a' },
    { label: 'Muted Gray', color: '#64748b' },
    { label: 'Indigo Brand', color: '#4f46e5' },
    { label: 'Blue Accent', color: '#2563eb' },
    { label: 'Emerald', color: '#059669' },
    { label: 'Rose Pink', color: '#e11d48' },
    { label: 'Amber Gold', color: '#d97706' },
    { label: 'Purple', color: '#9333ea' }
  ];

  const HIGHLIGHT_COLORS = [
    { label: 'None', color: 'transparent' },
    { label: 'Yellow', color: '#fef08a' },
    { label: 'Mint', color: '#bbf7d0' },
    { label: 'Sky Blue', color: '#bfdbfe' },
    { label: 'Pink', color: '#fbcfe8' },
    { label: 'Orange', color: '#fed7aa' }
  ];

  const cleanText = getCleanText(internalHtml);
  const wordCount = getWordCount(internalHtml);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Top Header Bar matching Website Color Theme */}
      <div className="bg-muted/40 dark:bg-muted/20 border-b border-border px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 select-none">
        {/* Editor Mode Tabs */}
        <div className="inline-flex items-center gap-1 bg-background dark:bg-card p-1 rounded-xl border border-border/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handleModeSwitch('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'visual'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Visual Editor</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('html')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'html'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>&lt;/&gt; HTML</span>
          </button>
        </div>

        {/* Word Counter on the Right */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background dark:bg-card border border-border/80 text-xs text-muted-foreground font-medium shadow-2xs">
          <span className="font-bold text-foreground font-mono">{wordCount}</span>
          <span className="text-muted-foreground/80">/ 2500 words</span>
        </div>
      </div>

      {/* Formatting Toolbar (Only in Visual Mode) */}
      {mode === 'visual' && (
        <div className="bg-muted/40 border-b border-border px-3 py-2 flex flex-wrap items-center gap-1.5 text-xs text-foreground">
          {/* Font Family Selector */}
          <div className="relative">
            <select
              value={selectedFont}
              onChange={(e) => {
                setSelectedFont(e.target.value);
                executeCommand('fontName', e.target.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              title="Font Family"
            >
              <option value="inherit">A Font (Default)</option>
              <option value="Outfit, sans-serif">Outfit</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="relative">
            <select
              value={selectedSize}
              onChange={(e) => {
                setSelectedSize(e.target.value);
                executeCommand('fontSize', e.target.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              title="Font Size"
            >
              <option value="1">↕ 12px - Small</option>
              <option value="2">↕ 14px - Compact</option>
              <option value="3">↕ 16px - Regular</option>
              <option value="4">↕ 18px - Medium</option>
              <option value="5">↕ 24px - Large</option>
              <option value="6">↕ 30px - Title</option>
            </select>
          </div>

          {/* Block Format Selector */}
          <div className="relative">
            <select
              value={selectedBlock}
              onChange={(e) => {
                const tag = e.target.value;
                setSelectedBlock(tag);
                if (tag === 'p') {
                  executeCommand('formatBlock', '<p>');
                } else if (['h1', 'h2', 'h3'].includes(tag)) {
                  executeCommand('formatBlock', `<${tag}>`);
                } else if (tag === 'blockquote') {
                  executeCommand('formatBlock', '<blockquote>');
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              title="Block Format"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote Block</option>
            </select>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Inline Styles: B, I, U, S */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('bold');
              }}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                activeFormats.bold
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('italic');
              }}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg italic font-serif text-sm transition-colors ${
                activeFormats.italic
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('underline');
              }}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg underline text-sm transition-colors ${
                activeFormats.underline
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('strikeThrough');
              }}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg line-through text-sm transition-colors ${
                activeFormats.strike
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
              title="Strikethrough"
            >
              S
            </button>
          </div>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowColorPicker((prev) => !prev);
                setShowHighlightPicker(false);
              }}
              className="h-8 px-2 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground font-bold text-xs gap-1 border border-transparent hover:border-border transition-colors"
              title="Text Color"
            >
              <span className="flex flex-col items-center leading-none">
                <span className="font-bold text-xs">A</span>
                <span className="h-0.5 w-3 bg-primary rounded-full mt-0.5" />
              </span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>
            {showColorPicker && (
              <div
                className="absolute top-full left-0 mt-1 z-30 p-2.5 rounded-xl bg-popover border border-border shadow-xl grid grid-cols-3 gap-1.5 w-44"
                onMouseDown={(e) => e.preventDefault()}
              >
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('foreColor', c.color);
                      setShowColorPicker(false);
                    }}
                    className="h-6 w-full rounded-md border border-border flex items-center justify-center text-[10px] font-medium transition-transform hover:scale-105"
                    style={{
                      backgroundColor: c.color === 'inherit' ? 'transparent' : c.color,
                      color: c.color === 'inherit' || c.color === '#fef08a' ? '#000' : '#fff'
                    }}
                    title={c.label}
                  >
                    {c.color === 'inherit' ? 'Default' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightPicker((prev) => !prev);
                setShowColorPicker(false);
              }}
              className="h-8 px-2 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground text-xs gap-1 border border-transparent hover:border-border transition-colors"
              title="Highlight Background"
            >
              <Highlighter className="h-3.5 w-3.5" />
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>
            {showHighlightPicker && (
              <div
                className="absolute top-full left-0 mt-1 z-30 p-2.5 rounded-xl bg-popover border border-border shadow-xl grid grid-cols-3 gap-1.5 w-40"
                onMouseDown={(e) => e.preventDefault()}
              >
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('hiliteColor', c.color);
                      setShowHighlightPicker(false);
                    }}
                    className="h-6 rounded-md border border-border text-[10px] font-bold text-foreground flex items-center justify-center transition-transform hover:scale-105"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  >
                    {c.color === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* List and Tools */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertUnorderedList');
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
              title="Bulleted List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertOrderedList');
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleInsertLink();
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
              title="Insert Link"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('formatBlock', '<blockquote>');
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
              title="Quote Callout"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleInsertDivider();
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
              title="Horizontal Divider"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClearFormat();
              }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
              title="Clear Formatting"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Surface: Single in-place visual canvas with NO separate preview section */}
      <div className="relative flex-1 bg-background">
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyUp={checkActiveFormats}
            onMouseUp={checkActiveFormats}
            data-placeholder={placeholder}
            className="wysiwyg-editor min-h-[260px] p-5 text-sm text-foreground bg-background focus:outline-none leading-relaxed transition-all cursor-text overflow-y-auto"
            style={{ minHeight }}
          />
        ) : (
          <textarea
            name={name}
            value={internalHtml}
            onChange={(e) => {
              const val = e.target.value;
              setInternalHtml(val);
              onChange?.(val);
            }}
            placeholder="<p>Enter HTML here...</p>"
            className="w-full min-h-[260px] p-5 font-mono text-xs text-foreground bg-background focus:outline-none resize-y leading-relaxed border-none"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="flex flex-wrap justify-between items-center px-4 py-2.5 bg-muted/20 border-t border-border text-xs text-muted-foreground gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          In-Place Visual Editor 
        </span>
        <div>
          {cleanText.length >= 30 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5" /> Ready ({cleanText.length} characters • {wordCount} words)
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> {cleanText.length} / 30 minimum characters required
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1, title: 'Welcome & Path', icon: Layers },
  { id: 2, title: 'Basic Details', icon: FileText },
  { id: 3, title: 'Date & Venue', icon: Calendar },
  { id: 4, title: 'Organizer Profile', icon: Building },
  { id: 5, title: 'Media Upload', icon: ImageIcon },
  { id: 6, title: 'Ticketing & Form', icon: Ticket },
  { id: 7, title: 'Preview & SEO', icon: Eye },
  { id: 8, title: 'Submit & Moderation', icon: CheckCircle2 }
];

export const getInitialFormData = (user = null) => ({
  title: '',
  slug: '',
  category: 'Technology & AI',
  industry: 'Information Technology',
  description: '',
  startDate: '',
  endDate: '',
  timings: '09:00 AM - 06:00 PM',
  venueName: '',
  city: '',
  state: 'Delhi NCR',
  country: 'India',
  address: '',
  // Organizer Profile
  orgName: user?.organization?.name || 'Global Tech Events Ltd',
  orgEmail: user?.email || 'organizer@visitexpo.in',
  orgPhone: '+91 98765 43210',
  orgWebsite: 'https://globaltechevents.com',
  orgGst: '07AAAAA1111A1Z1',
  orgLogo: '',
  orgDesc: '',
  socialFacebook: '',
  socialLinkedIn: '',
  socialInstagram: '',
  socialX: '',
  // Media
  bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  gallery: [],
  brochurePdf: '',
  promoVideoUrl: '',
  sponsorsList: [],
  // Schedule
  schedules: [{ name: 'Event Day', date: '' }],
  // FAQs
  faqsList: [],
  // Contact
  contactShortcode: '',
  // Ticketing & Form
  isFreeEvent: true,
  paidTicketPrice: '499',
  currency: 'INR',
  formFields: ['name', 'email', 'phone', 'company', 'designation'],
  // SEO
  metaTitle: '',
  metaDescription: ''
});

export default function EventWizardPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const fileInputRef = React.useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [formMode, setFormMode] = useState('wizard'); // 'wizard' | 'scrollable'
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [allCategoriesList, setAllCategoriesList] = useState(() => Object.keys(CATEGORY_SUBSECTORS));
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // Dynamically load any custom categories created across the platform
  useEffect(() => {
    let isMounted = true;
    const fetchPlatformCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.categories) && isMounted) {
            const names = json.data.categories.map((c) => c.name).filter(Boolean);
            setAllCategoriesList((prev) => Array.from(new Set([...prev, ...names])));
          }
        }
      } catch (err) {
        // Silently preserve presets
      }
    };
    fetchPlatformCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form Validation Errors State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Image Dimension Validation State
  const [bannerValidation, setBannerValidation] = useState(null);
  const [orgLogoValidation, setOrgLogoValidation] = useState(null);
  const [sponsorLogoValidation, setSponsorLogoValidation] = useState(null);

  // Form State initialized fresh every time
  const [formData, setFormData] = useState(() => getInitialFormData(user));

  // Real-time Duplicate Event Detection state
  const [duplicateCheck, setDuplicateCheck] = useState({
    checking: false,
    isDuplicate: false,
    existingEvent: null,
    similarEvents: []
  });

  // Core duplicate verification function (can be called debounced or immediately)
  const performDuplicateCheck = async (rawTitle) => {
    const clean = (rawTitle || '').trim();
    if (!clean || clean.length < 3) {
      const reset = {
        checking: false,
        isDuplicate: false,
        existingEvent: null,
        similarEvents: []
      };
      setDuplicateCheck(reset);
      return reset;
    }

    setDuplicateCheck(prev => ({ ...prev, checking: true }));

    try {
      const res = await axios.get(`${API_URL}/events/check-duplicate?title=${encodeURIComponent(clean)}`);
      if (res.data && res.data.success) {
        const result = {
          checking: false,
          isDuplicate: !!res.data.isDuplicate,
          existingEvent: res.data.existingEvent || null,
          similarEvents: res.data.similarEvents || []
        };
        setDuplicateCheck(result);
        return result;
      }
    } catch (err) {
      console.warn('Duplicate event check error:', err);
    }
    const fallback = { checking: false, isDuplicate: false, existingEvent: null, similarEvents: [] };
    setDuplicateCheck(fallback);
    return fallback;
  };

  // Real-time Debounced Duplicate Event Detection while typing title
  useEffect(() => {
    const rawTitle = formData.title?.trim();
    if (!rawTitle || rawTitle.length < 3) {
      setDuplicateCheck({
        checking: false,
        isDuplicate: false,
        existingEvent: null,
        similarEvents: []
      });
      return;
    }

    setDuplicateCheck(prev => ({ ...prev, checking: true }));

    const timer = setTimeout(() => {
      performDuplicateCheck(rawTitle);
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.title]);

  // Re-verify duplicate when landing on Step 7 (Preview & Pre-Publish)
  useEffect(() => {
    if (currentStep === 7 && formData.title?.trim()) {
      performDuplicateCheck(formData.title);
    }
  }, [currentStep]);

  // Ensure clean fresh form on mount and purge any legacy draft from storage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('visitexpo_wizard_draft');

        // Restore chosen form mode (wizard vs scrollable)
        const savedMode = localStorage.getItem('visitexpo_create_event_mode');
        if (savedMode === 'wizard' || savedMode === 'scrollable') {
          setFormMode(savedMode);
        }
      }
    } catch (e) {
      console.error('Error initializing form mode', e);
    }
  }, []);

  const handleResetForm = () => {
    setFormData(getInitialFormData(user));
    setCurrentStep(1);
    setErrors({});
    setTouched({});
    setDuplicateCheck({
      checking: false,
      isDuplicate: false,
      existingEvent: null,
      similarEvents: []
    });
    setSubmitError('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('visitexpo_wizard_draft');
    }
  };

  const handleModeChange = (newMode) => {
    setFormMode(newMode);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_create_event_mode', newMode);
      }
    } catch (e) {
      console.error('Error saving formMode preference', e);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Field-level Validation Rule Engine
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case 'title': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Event Name / Title is required.';
        if (trimmed.length < 3) return 'Event title must be at least 3 characters.';
        if (trimmed.length > 150) return 'Event title cannot exceed 150 characters.';
        return '';
      }
      case 'slug': {
        const trimmed = (value || '').trim().toLowerCase();
        if (!trimmed) return 'Public URL slug is required.';
        if (
          /^(https?|ftp):\/\//i.test(trimmed) ||
          /^www\./i.test(trimmed) ||
          trimmed.includes('://') ||
          trimmed.includes('/') ||
          /\.(com|in|org|net|co|io|ai|biz|info|me|app|dev|xyz|gov|edu)(\/|$|\?|#)/i.test(trimmed)
        ) {
          return 'URLs and website links (e.g. https://google.in) are not allowed in the slug. Please enter only slug keywords (e.g. tech-expo-2026).';
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
          return 'Slug can only contain lowercase letters, numbers, and single hyphens (e.g. tech-expo-2026).';
        }
        return '';
      }
      case 'category': {
        if (!(value || '').trim()) return 'Please select or enter a primary category.';
        return '';
      }
      case 'industry': {
        if (isCustomIndustry && !(value || '').trim()) {
          return 'Please enter your custom industry sub-sector.';
        }
        return '';
      }
      case 'description': {
        const textOnly = getCleanText(value);
        if (!textOnly) return 'Event description is required.';
        if (textOnly.length < 30) {
          return `Description must be at least 30 characters (currently ${textOnly.length}).`;
        }
        return '';
      }
      case 'startDate': {
        if (!value) return 'Start date is required.';
        return '';
      }
      case 'endDate': {
        if (!value) return 'End date is required.';
        if (allData.startDate && new Date(value) < new Date(allData.startDate)) {
          return 'End date cannot be earlier than start date.';
        }
        return '';
      }
      case 'venueName': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Venue Name / Hall Number is required.';
        if (trimmed.length < 3) return 'Venue name must be at least 3 characters.';
        return '';
      }
      case 'city': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'City is required.';
        if (/\d/.test(trimmed)) {
          return 'City name cannot contain numbers. Please enter a valid city name (e.g. New Delhi, Mumbai, Berlin).';
        }
        if (!/^[a-zA-Z\s.'\-\/,()]+$/.test(trimmed) || !/[a-zA-Z]/.test(trimmed)) {
          return 'City must contain a valid alphabetic name.';
        }
        if (trimmed.length < 2) {
          return 'City name must be at least 2 characters.';
        }
        return '';
      }
      case 'country': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Country is required.';
        if (/\d/.test(trimmed)) {
          return 'Country name cannot contain numbers. Please enter a valid country name (e.g. India, United States, Germany).';
        }
        if (!/^[a-zA-Z\s.'\-\/,()]+$/.test(trimmed) || !/[a-zA-Z]/.test(trimmed)) {
          return 'Country must contain a valid alphabetic name.';
        }
        if (trimmed.length < 2) {
          return 'Country name must be at least 2 characters.';
        }
        return '';
      }
      case 'orgName': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Organizer Name is required.';
        if (trimmed.length < 2) return 'Organizer name must be at least 2 characters.';
        return '';
      }
      case 'orgEmail': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Contact Email is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return 'Please enter a valid email address (e.g. contact@domain.com).';
        return '';
      }
      case 'orgPhone': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Mobile number is required.';
        if (!/^\+\d{1,4}/.test(trimmed)) {
          return 'Mobile number must include a country code starting with + (e.g. +91, +1, +44).';
        }
        const { code, number } = parsePhoneWithCountryCode(trimmed);
        const numberDigits = number.replace(/\D/g, '');

        if (code === '+91') {
          if (!numberDigits) {
            return 'Mobile number is required.';
          }
          if (!/^[789]/.test(numberDigits)) {
            return 'Indian mobile number must start with 9, 8, or 7.';
          }
          if (numberDigits.length !== 10) {
            return 'Indian mobile number must be exactly 10 digits.';
          }
          return '';
        }

        const totalDigits = trimmed.replace(/\D/g, '');
        if (totalDigits.length < 7) {
          return 'Please enter a valid mobile number with at least 7 digits.';
        }
        if (totalDigits.length > 15) {
          return 'Mobile number cannot exceed 15 digits.';
        }
        return '';
      }
      case 'orgWebsite': {
        const trimmed = (value || '').trim();
        if (trimmed && !/^https?:\/\/.+/i.test(trimmed)) {
          return 'Website must be a valid URL starting with http:// or https://';
        }
        return '';
      }
      case 'bannerUrl': {
        if (!(value || '').trim()) {
          return 'Event Main Banner Cover is required. Please upload or choose a banner image.';
        }
        return '';
      }
      case 'paidTicketPrice': {
        if (!allData.isFreeEvent) {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) {
            return `Ticket price must be a valid amount greater than 0 (${allData.currency || 'INR'}).`;
          }
        }
        return '';
      }
      default:
        return '';
    }
  };

  // Step-level Validation Helper
  const validateStep = (step, data = formData) => {
    const stepErrors = {};
    if (step === 2) {
      const titleErr = validateField('title', data.title, data);
      if (titleErr) stepErrors.title = titleErr;
      const slugErr = validateField('slug', data.slug, data);
      if (slugErr) stepErrors.slug = slugErr;
      const catErr = validateField('category', data.category, data);
      if (catErr) stepErrors.category = catErr;
      const indErr = validateField('industry', data.industry, data);
      if (indErr) stepErrors.industry = indErr;
      const descErr = validateField('description', data.description, data);
      if (descErr) stepErrors.description = descErr;
    } else if (step === 3) {
      const sDateErr = validateField('startDate', data.startDate, data);
      if (sDateErr) stepErrors.startDate = sDateErr;
      const eDateErr = validateField('endDate', data.endDate, data);
      if (eDateErr) stepErrors.endDate = eDateErr;
      const venueErr = validateField('venueName', data.venueName, data);
      if (venueErr) stepErrors.venueName = venueErr;
      const cityErr = validateField('city', data.city, data);
      if (cityErr) stepErrors.city = cityErr;
      const countryErr = validateField('country', data.country, data);
      if (countryErr) stepErrors.country = countryErr;
    } else if (step === 4) {
      const orgNameErr = validateField('orgName', data.orgName, data);
      if (orgNameErr) stepErrors.orgName = orgNameErr;
      const orgEmailErr = validateField('orgEmail', data.orgEmail, data);
      if (orgEmailErr) stepErrors.orgEmail = orgEmailErr;
      const orgPhoneErr = validateField('orgPhone', data.orgPhone, data);
      if (orgPhoneErr) stepErrors.orgPhone = orgPhoneErr;
      const orgWebErr = validateField('orgWebsite', data.orgWebsite, data);
      if (orgWebErr) stepErrors.orgWebsite = orgWebErr;
    } else if (step === 5) {
      const bannerErr = validateField('bannerUrl', data.bannerUrl, data);
      if (bannerErr) stepErrors.bannerUrl = bannerErr;
      if (bannerValidation && !bannerValidation.isValid) {
        stepErrors.bannerUrl = bannerValidation.error || 'Banner image dimensions are invalid.';
      }
    } else if (step === 6) {
      const priceErr = validateField('paidTicketPrice', data.paidTicketPrice, data);
      if (priceErr) stepErrors.paidTicketPrice = priceErr;
    }
    return stepErrors;
  };

  // Full-form Validation for Submission
  const validateAll = (data = formData) => {
    let allErrors = {};
    let firstInvalidStep = null;
    let firstInvalidField = null;

    for (let s = 2; s <= 6; s++) {
      const stepErrs = validateStep(s, data);
      if (Object.keys(stepErrs).length > 0) {
        if (!firstInvalidStep) {
          firstInvalidStep = s;
          firstInvalidField = Object.keys(stepErrs)[0];
        }
        allErrors = { ...allErrors, ...stepErrs };
      }
    }

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors,
      firstInvalidStep,
      firstInvalidField
    };
  };

  // Handle Category & Sub-Sector Changes
  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    if (selectedCat === 'CUSTOM') {
      setIsCustomCategory(true);
      setFormData((prev) => ({
        ...prev,
        category: '',
        industry: ''
      }));
      setIsCustomIndustry(true);
    } else {
      setIsCustomCategory(false);
      const subList = CATEGORY_SUBSECTORS[selectedCat] || [];
      const defaultSub = subList[0] || '';
      setFormData((prev) => ({
        ...prev,
        category: selectedCat,
        industry: defaultSub
      }));
      setIsCustomIndustry(false);
    }
    if (errors.category) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    }
  };

  const handleSubSectorChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomIndustry(true);
      setFormData(prev => ({ ...prev, industry: '' }));
    } else {
      setIsCustomIndustry(false);
      setFormData(prev => ({ ...prev, industry: val }));
      if (errors.industry) {
        setErrors(prev => {
          const next = { ...prev };
          delete next.industry;
          return next;
        });
      }
    }
  };

  // Handle slug change with URL blocking and auto-cleaning
  const handleSlugChange = (e) => {
    let rawVal = e.target.value;

    // Detect and strip pasted URLs or domain links like https://google.in or https://10times.com/catch-fire-conference
    if (/^https?:\/\//i.test(rawVal) || /^www\./i.test(rawVal) || rawVal.includes('://')) {
      try {
        const urlStr = rawVal.startsWith('http') ? rawVal : `https://${rawVal}`;
        const parsed = new URL(urlStr);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          rawVal = pathSegments[pathSegments.length - 1];
        } else {
          rawVal = '';
        }
      } catch {
        rawVal = rawVal.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      }
    } else if (/^[a-zA-Z0-9.-]+\.(com|in|org|net|co|io|ai)(\/.*)?$/i.test(rawVal)) {
      try {
        const parsed = new URL(`https://${rawVal}`);
        const segments = parsed.pathname.split('/').filter(Boolean);
        rawVal = segments.length > 0 ? segments[segments.length - 1] : '';
      } catch {
        rawVal = '';
      }
    }

    // Clean characters: lowercase, replace spaces/slashes/underscores with hyphens, remove forbidden characters
    let cleanSlug = rawVal
      .toLowerCase()
      .replace(/[\s_\/\\]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    if (cleanSlug.startsWith('-')) cleanSlug = cleanSlug.replace(/^-+/, '');

    setFormData(prev => ({ ...prev, slug: cleanSlug }));

    // Instant validation feedback
    const err = validateField('slug', cleanSlug, { ...formData, slug: cleanSlug });
    setErrors(prev => {
      const next = { ...prev };
      if (err) {
        next.slug = err;
      } else {
        delete next.slug;
      }
      return next;
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (errors[name]) {
      const err = validateField(name, val, { ...formData, [name]: val });
      if (!err) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      } else {
        setErrors(prev => ({ ...prev, [name]: err }));
      }
    }
  };

  // Handle blur validation to give instant field-level feedback
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value, formData);
    if (err) {
      setErrors(prev => ({ ...prev, [name]: err }));
    } else if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Toggle Step 6 Registration Form Required Fields
  const toggleFormField = (fieldId) => {
    if (['name', 'email', 'phone'].includes(fieldId)) return;
    setFormData(prev => {
      const current = prev.formFields || ['name', 'email', 'phone', 'company', 'designation'];
      const exists = current.includes(fieldId);
      const updated = exists
        ? current.filter(id => id !== fieldId)
        : [...current, fieldId];
      return { ...prev, formFields: updated };
    });
  };

  // Generate Slug & trigger instant duplicate check on blur
  const handleTitleBlur = async () => {
    const titleErr = validateField('title', formData.title, formData);
    if (titleErr) {
      setErrors(prev => ({ ...prev, title: titleErr }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }

    if (formData.title && formData.title.trim().length >= 3) {
      await performDuplicateCheck(formData.title);
    }
    if (!formData.slug && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
      if (errors.slug) {
        setErrors(prev => {
          const next = { ...prev };
          delete next.slug;
          return next;
        });
      }
    }
    // Auto-fill Meta Title if empty
    if (!formData.metaTitle && formData.title) {
      setFormData(prev => ({ ...prev, metaTitle: `${formData.title} | VisitExpo` }));
    }
  };

  // Time picker helpers for Daily Visitor Timings
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
    setFormData(prev => ({
      ...prev,
      timings: `${formattedStart} - ${formattedEnd}`
    }));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image dimensions client-side before starting network upload
    const validation = await validateEventImage(file, 'banner');
    setBannerValidation(validation);

    if (!validation.isValid) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setErrors(prev => ({ ...prev, bannerUrl: validation.error || 'Banner image dimensions are invalid. Image was not uploaded.' }));
      return;
    }

    // Clear any previous banner error before uploading valid image
    setErrors(prev => {
      const next = { ...prev };
      delete next.bannerUrl;
      return next;
    });

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        setFormData(prev => ({ ...prev, bannerUrl: res.data.url }));
        setErrors(prev => {
          const next = { ...prev };
          delete next.bannerUrl;
          return next;
        });
        // Enrich dimensions if returned from API
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
      console.error('Banner upload error:', err);
      alert(err.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const [newSponsor, setNewSponsor] = useState({ name: '', link: '', logo: '', tier: 'Platinum Sponsor' });
  const [isCustomSponsorTier, setIsCustomSponsorTier] = useState(false);
  const [isSponsorUploading, setIsSponsorUploading] = useState(false);

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newSchedule, setNewSchedule] = useState({ name: '', date: '' });

  const handleOrgLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateEventImage(file, 'logo');
    setOrgLogoValidation(validation);
    if (!validation.isValid) {
      if (e.target) e.target.value = '';
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
        setFormData(prev => ({ ...prev, orgLogo: res.data.url }));
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
    setSponsorLogoValidation(validation);
    if (!validation.isValid) {
      if (e.target) e.target.value = '';
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
    if (!newSponsor.name) return showSweetWarning('Sponsor name is required');
    const finalTier = newSponsor.tier?.trim() || 'Platinum Sponsor';
    setFormData(prev => ({
      ...prev,
      sponsorsList: [...prev.sponsorsList, { ...newSponsor, tier: finalTier }]
    }));
    setNewSponsor({ name: '', link: '', logo: '', tier: 'Platinum Sponsor' });
    setIsCustomSponsorTier(false);
  };

  const removeSponsor = (index) => {
    setFormData(prev => ({
      ...prev,
      sponsorsList: prev.sponsorsList.filter((_, idx) => idx !== index)
    }));
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return showSweetWarning('Question and Answer are required');
    setFormData(prev => ({
      ...prev,
      faqsList: [...prev.faqsList, { ...newFaq }]
    }));
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqsList: prev.faqsList.filter((_, idx) => idx !== index)
    }));
  };

  const addSchedule = () => {
    const trimmedName = (newSchedule.name || '').trim();
    if (!trimmedName) {
      return showSweetWarning('Day / Session Name is required.', 'Schedule Validation');
    }
    if (/^\d+$/.test(trimmedName)) {
      return showSweetWarning(
        'Day / Session Name cannot contain only numbers. Please enter a descriptive title (e.g., "Day 1", "Session 1 - Keynote").',
        'Invalid Day / Session Name'
      );
    }
    if (trimmedName.length < 2) {
      return showSweetWarning('Day / Session Name must be at least 2 characters long.', 'Schedule Validation');
    }
    if (trimmedName.length > 80) {
      return showSweetWarning('Day / Session Name cannot exceed 80 characters.', 'Schedule Validation');
    }
    if (!newSchedule.date) {
      return showSweetWarning('Please select a valid date for this schedule entry.', 'Schedule Date Required');
    }
    const isDup = (formData.schedules || []).some(
      s => s.name?.toLowerCase().trim() === trimmedName.toLowerCase() && s.date === newSchedule.date
    );
    if (isDup) {
      return showSweetWarning('A schedule entry with this exact name and date already exists.', 'Duplicate Schedule Entry');
    }

    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { name: trimmedName, date: newSchedule.date }]
    }));
    setNewSchedule({ name: '', date: '' });
  };

  const removeSchedule = (index) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, idx) => idx !== index)
    }));
  };

  // AI Description Generator
  const generateAiDescription = async () => {
    if (!formData.title) {
      showSweetWarning("Please enter the Event Title first so AI Assist can generate a relevant description.");
      return;
    }

    setIsAiGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured in the environment.');
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

      const prompt = `You are a professional B2B copywriter for the international trade show and exhibition platform VisitExpo.
Given the following event details:
- Title: "${formData.title}"
- Category: "${formData.category || ''}"
- Industry: "${formData.industry || ''}"
- City: "${formData.city || ''}"
- Venue: "${formData.venueName || ''}"

Generate a compelling, professional B2B description for this event.
IMPORTANT FORMATTING RULES:
1. Do NOT include the event title as a heading (# Title) at the start; the title is already displayed in the hero banner.
2. Structure the description into clear, well-spaced paragraphs with clean section headings (e.g. ## About the Expo, ## Key Expo Highlights, ## Who Should Attend, ## Venue & Networking).
3. Use bullet points (• ) for key highlights, exhibitor benefits, or conference tracks.
4. Use clean bold text (**key term**) sparingly for emphasis. Do not leave trailing or dangling asterisks or unclosed markdown symbols.
5. Provide a short SEO meta description (under 150 characters).

Return the result strictly as a JSON object with the following keys:
{
  "description": "The detailed B2B description",
  "metaDescription": "The short SEO meta description (under 150 characters)"
}
Do not return any markdown code block wrapper around the JSON object. Just return raw JSON.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const resData = await response.json();
      const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('No content returned from Gemini');
      }

      // Parse JSON from response
      let cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleaned);

      setFormData(prev => ({
        ...prev,
        description: aiData.description || '',
        metaDescription: aiData.metaDescription || ''
      }));
    } catch (err) {
      console.error('AI generation failed:', err);
      // Fallback code in case of API issues
      const title = formData.title || 'Tech & Trade Expo 2026';
      const cat = formData.category || 'Technology';
      const city = formData.city || 'New Delhi';
      const aiText = `${title} is the premier international B2B gathering for **${cat}** pioneers, industry leaders, and enterprise buyers in ${city}.\n\n## Key Expo Highlights\n• **150+ Interactive Exhibitor Stalls**: Explore cutting-edge product launches and live tech demos.\n• **C-Suite Keynotes & Panels**: Gain actionable strategic insights from 40+ global keynote speakers.\n• **High-Impact Networking Lounges**: Connect with pre-qualified buyers and strategic venture partners.\n\n## Who Should Attend\nDelegates, procurement directors, technology vendors, and enterprise investors looking to accelerate commercial growth and discover new supplier networks.\n\n> "Join over 5,000+ registered delegates driving the future of global trade and industrial transformation in ${city}."`;

      setFormData(prev => ({
        ...prev,
        description: aiText,
        metaDescription: `Join ${title} in ${city}. The premier B2B ${cat} expo featuring live demos, networking, and industry keynotes.`
      }));
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Calculate Pre-submission SEO Score (0-100)
  const calculateSeoScore = () => {
    let score = 30;
    if (formData.title) score += 15;
    if (formData.description && getCleanText(formData.description).length > 50) score += 20;
    if (formData.category) score += 10;
    if (formData.bannerUrl) score += 15;
    if (formData.metaDescription && formData.metaDescription.length >= 50) score += 10;
    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore();

  // Navigation handlers
  const nextStep = async () => {
    if (isValidatingStep || submitting) return;
    setIsValidatingStep(true);

    try {
      // Validate current step before advancing
      if (currentStep >= 2 && currentStep <= 6) {
        const stepErrors = validateStep(currentStep, formData);

        if (currentStep === 2) {
          const check = await performDuplicateCheck(formData.title);
          if (check.isDuplicate) {
            setSubmitError(`Cannot proceed: An event titled "${check.existingEvent?.title || formData.title}" already exists on VisitExpo. Duplicate events cannot be created. Please modify your title or claim the existing listing.`);
            setErrors(prev => ({ ...prev, title: 'An event with this title already exists on VisitExpo.' }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsValidatingStep(false);
            return;
          }
        }

        if (Object.keys(stepErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...stepErrors }));
          setSubmitError('Please complete all required fields highlighted in red before proceeding.');
          const firstField = Object.keys(stepErrors)[0];
          const el = document.querySelector(`[name="${firstField}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setIsValidatingStep(false);
          return;
        }
      }

      // Auto-commit pending sponsor inputs if filled
      if (currentStep === 5 && newSponsor.name && newSponsor.name.trim()) {
        const finalTier = newSponsor.tier?.trim() || 'Platinum Sponsor';
        setFormData(prev => ({
          ...prev,
          sponsorsList: [...(prev.sponsorsList || []), { ...newSponsor, tier: finalTier }]
        }));
        setNewSponsor({ name: '', link: '', logo: '', tier: 'Platinum Sponsor' });
        setIsCustomSponsorTier(false);
      }

      // Brief tactile loading transition (350ms) to give the user clear feedback that the form is verified and advancing
      await new Promise(resolve => setTimeout(resolve, 350));

      if (currentStep < STEPS.length) {
        setSubmitError('');
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsValidatingStep(false);
    }
  };

  const prevStep = async () => {
    if (currentStep > 1 && !isNavigatingBack && !isValidatingStep) {
      setIsNavigatingBack(true);
      setSubmitError('');
      await new Promise(resolve => setTimeout(resolve, 150));
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsNavigatingBack(false);
    }
  };

  // Form Submission
  const handleSubmitEvent = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Comprehensive Validation across all sections
      const validation = validateAll(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setSubmitting(false);
        setSubmitError('Validation Failed: Please fill in all required fields marked in red before submitting.');

        if (formMode === 'wizard' && validation.firstInvalidStep) {
          setCurrentStep(validation.firstInvalidStep);
        }

        setTimeout(() => {
          const firstEl = document.querySelector(`[name="${validation.firstInvalidField}"]`);
          if (firstEl) {
            firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstEl.focus();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
        return;
      }

      // 2. Safeguard duplicate check before final submission
      const check = await performDuplicateCheck(formData.title);
      if (check.isDuplicate) {
        setSubmitError(`Submission Blocked: An event titled "${check.existingEvent?.title || formData.title}" is already present on VisitExpo. Duplicate events cannot be submitted.`);
        setErrors(prev => ({ ...prev, title: 'An event with this title already exists.' }));
        setSubmitting(false);
        if (formMode === 'wizard') setCurrentStep(2);
        return;
      }

      // Auto-commit any pending sponsor input if filled
      let finalSponsorsList = Array.isArray(formData.sponsorsList) ? [...formData.sponsorsList] : [];
      if (newSponsor.name && newSponsor.name.trim()) {
        const finalTier = newSponsor.tier?.trim() || 'Platinum Sponsor';
        finalSponsorsList.push({ ...newSponsor, tier: finalTier });
      }

      const categoriesArray = [formData.category, formData.industry].filter(Boolean);
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        banner: formData.bannerUrl,
        venue: formData.venueName.trim(),
        city: formData.city.trim(),
        country: formData.country || 'India',
        startDate: formData.startDate,
        endDate: formData.endDate,
        timings: formData.timings,
        category: formData.category.trim(),
        industry: formData.industry?.trim() || '',
        categories: categoriesArray,
        status: 'draft',
        orgName: formData.orgName.trim(),
        orgEmail: formData.orgEmail.trim(),
        orgPhone: formData.orgPhone.trim(),
        orgWebsite: formData.orgWebsite?.trim() || '',
        orgDesc: formData.orgDesc || '',
        orgLogo: formData.orgLogo || '',
        schedules: formData.schedules,
        sponsorsList: finalSponsorsList,
        faqsList: formData.faqsList,
        contactShortcode: formData.contactShortcode,
        // Ticketing data — server auto-creates a Ticket tier from this
        isFreeEvent: formData.isFreeEvent,
        paidTicketPrice: formData.isFreeEvent ? 0 : (parseFloat(formData.paidTicketPrice) || 0),
        currency: formData.currency || 'INR',
        seo: {
          metaTitle: formData.metaTitle || `${formData.title} | VisitExpo`,
          metaDescription: formData.metaDescription || ''
        }
      };

      if (!accessToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.post(`${API_URL}/events`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Clear draft on successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem('visitexpo_wizard_draft');
      }

      setIsSubmitted(true);
      setCurrentStep(8);
    } catch (err) {
      console.error('Submission error:', err);
      if (err.response?.status === 409) {
        const existing = err.response.data?.existingEvent;
        setSubmitError(err.response.data?.error || 'A duplicate event with this title already exists.');
        if (existing) {
          setDuplicateCheck({
            checking: false,
            isDuplicate: true,
            existingEvent: existing,
            similarEvents: []
          });
          setCurrentStep(2); // Take user directly to Step 2 to resolve duplicate
        }
        return;
      }
      const errMsg = err.response?.data?.error || err.message || 'Failed to submit event';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

    // Renderers for individual form steps (shared between Wizard and Scrollable modes)
  const renderStep1 = () => (
    <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-bold text-foreground">Welcome to VisitExpo Event Onboarding</h3>
              <p className="text-sm text-muted-foreground">
                Get your event listed on India's premier B2B expo platform in minutes. Choose how you would like to begin:
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-4">
              {/* Option A: Create New Event */}
              <div
                onClick={nextStep}
                className="btn-press group relative rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-transparent p-6 hover:border-primary active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md select-none"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
                    {isValidatingStep ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Create New Event
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Start fresh with our step-by-step 10times wizard. Add event dates, venue location, organizer profile, media galleries, ticketing, and pre-publish SEO score check.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary">
                  <span>{isValidatingStep ? 'Starting Event Wizard...' : 'Start Event Wizard'}</span>
                  {isValidatingStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option B: Claim Existing Event */}
              <div
                onClick={() => router.push('/events/claim')}
                className="btn-press group relative rounded-2xl border-2 border-border bg-card p-6 hover:border-foreground/40 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md select-none"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground font-bold border border-border">
                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                    Existing Listing
                  </span>
                </div>
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Claim Existing Event
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Is your event already listed in our directory? Claim ownership by submitting your official business email, website, and proof of organization.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>Search & Claim Ownership</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
  );

  const renderStep2Content = ({ isScrollable = false } = {}) => (
    <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> {isScrollable ? "1. Basic Event Information" : "Step 2: Basic Event Information"}
                </h3>
                <p className="text-xs text-muted-foreground">Provide core identity and taxonomy for your expo.</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className={duplicateCheck.isDuplicate ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center justify-between">
                  <span>Event Name / Title *</span>
                  {duplicateCheck.checking && (
                    <span className="text-[10px] text-primary flex items-center gap-1 font-normal lowercase">
                      <Loader2 className="h-3 w-3 animate-spin" /> checking availability...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={handleTitleBlur}
                    placeholder="E.g. India International Tech & AI Summit 2026"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.title || duplicateCheck.isDuplicate
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {duplicateCheck.isDuplicate ? (
                    <div className="absolute right-3 top-2.5 text-rose-500" title="Duplicate event title detected">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  ) : errors.title ? (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.title}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>

                {/* Inline Validation Error */}
                {errors.title && !duplicateCheck.isDuplicate && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.title}</span>
                  </p>
                )}

                {/* Instant Inline Error Banner Under Input */}
                {duplicateCheck.isDuplicate && (
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl font-medium animate-in fade-in-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Event Already Present:</strong> An event titled "<strong>{duplicateCheck.existingEvent?.title || formData.title}</strong>" is already registered. Duplicate events cannot be created.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, title: '', slug: '' }))}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline bg-rose-500/15 hover:bg-rose-500/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <Eraser className="h-3 w-3" /> Clear Name
                    </button>
                  </div>
                )}

                {/* SHOW EXISTING DUPLICATE EVENT */}
                {duplicateCheck.isDuplicate && duplicateCheck.existingEvent && (
                  <div className="mt-3 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30 shrink-0">
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Existing Event Already Present on VisitExpo
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            This event already exists in our system. You cannot create a duplicate listing.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {duplicateCheck.existingEvent.status || 'Active Listing'}
                      </span>
                    </div>

                    {/* Existing Event Details Box */}
                    <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-foreground">
                          {duplicateCheck.existingEvent.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {duplicateCheck.existingEvent.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-primary" /> {duplicateCheck.existingEvent.venue}, {duplicateCheck.existingEvent.city}
                            </span>
                          )}
                          {duplicateCheck.existingEvent.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" /> {new Date(duplicateCheck.existingEvent.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {duplicateCheck.existingEvent.orgName && (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Building className="h-3 w-3 text-amber-500" /> {duplicateCheck.existingEvent.orgName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://visitexpo.in/event/${duplicateCheck.existingEvent.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" /> View Event
                        </a>
                        <Link
                          href={`/events/claim?search=${encodeURIComponent(duplicateCheck.existingEvent.title)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" /> Claim Listing
                        </Link>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      💡 If you are the official organizer of this event, click <strong>Claim Listing</strong> to manage it. Otherwise, modify your title (e.g. add the edition or year) to make it unique.
                    </p>
                  </div>
                )}

                {/* SHOW SIMILAR EVENTS IF ANY */}
                {!duplicateCheck.isDuplicate && duplicateCheck.similarEvents?.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="text-[11px] font-medium text-foreground/70">Similar existing events:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {duplicateCheck.similarEvents.map(sim => (
                        <span
                          key={sim._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border text-[11px] text-muted-foreground"
                        >
                          <Calendar className="h-2.5 w-2.5 text-primary" /> {sim.title} {sim.city ? `(${sim.city})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Public URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2.5 rounded-l-lg border border-r-0 border-border text-xs text-muted-foreground font-mono">
                    visitexpo.in/events/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    onBlur={handleBlur}
                    placeholder="india-tech-ai-summit-2026"
                    className={`w-full rounded-r-lg border bg-background px-3.5 py-2.5 text-sm text-foreground font-mono focus:outline-none transition-all ${
                      errors.slug
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.slug}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Primary Category *
                </label>
                {(() => {
                  const isPresetCat = allCategoriesList.includes(formData.category);
                  const selectCatValue = isCustomCategory
                    ? 'CUSTOM'
                    : isPresetCat
                    ? formData.category
                    : formData.category
                    ? 'CUSTOM'
                    : allCategoriesList[0] || 'Technology & AI';

                  return (
                    <div className="space-y-2">
                      <SearchableSelect
                        id="wizard-category-select"
                        options={allCategoriesList}
                        value={selectCatValue}
                        onChange={(val) => handleCategoryChange({ target: { value: val } })}
                        placeholder="Select Primary Category..."
                        searchPlaceholder="Search categories..."
                        allowCustom={true}
                        customOptionLabel="+ Custom Category..."
                        error={errors.category}
                      />

                      {(isCustomCategory || (!isPresetCat && formData.category !== '')) && (
                        <input
                          type="text"
                          name="customCategory"
                          value={formData.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({ ...prev, category: val }));
                            if (errors.category && val.trim()) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.category;
                                return next;
                              });
                            }
                          }}
                          placeholder="Enter custom category name (e.g. Robotics & Automation)..."
                          className={`w-full rounded-lg border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none transition-all ${
                            errors.category
                              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                              : 'border-border focus:ring-2 focus:ring-primary'
                          }`}
                          autoFocus
                        />
                      )}

                      {errors.category && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{errors.category}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Industry Sub-Sector
                </label>
                {(() => {
                  const currentSubSectors = CATEGORY_SUBSECTORS[formData.category] || [];
                  const isPreset = currentSubSectors.includes(formData.industry);
                  const selectValue = isCustomIndustry
                    ? 'CUSTOM'
                    : isPreset
                    ? formData.industry
                    : formData.industry
                    ? 'CUSTOM'
                    : currentSubSectors[0] || '';

                  return (
                    <div className="space-y-2">
                      <SearchableSelect
                        id="wizard-subsector-select"
                        options={currentSubSectors}
                        value={selectValue}
                        onChange={(val) => handleSubSectorChange({ target: { value: val } })}
                        placeholder="Select Industry Sub-Sector..."
                        searchPlaceholder="Search sub-sectors..."
                        allowCustom={true}
                        customOptionLabel="+ Custom Sub-Sector..."
                        error={errors.industry}
                      />

                      {(isCustomIndustry || (!isPreset && formData.industry !== '')) && (
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={e => {
                            setFormData(prev => ({ ...prev, industry: e.target.value }));
                            if (errors.industry && e.target.value.trim()) {
                              setErrors(prev => {
                                const next = { ...prev };
                                delete next.industry;
                                return next;
                              });
                            }
                          }}
                          placeholder="Enter custom industry sub-sector..."
                          className={`w-full rounded-lg border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none transition-all ${
                            errors.industry
                              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                              : 'border-border focus:ring-2 focus:ring-primary'
                          }`}
                          autoFocus
                        />
                      )}

                      {errors.industry && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{errors.industry}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Describe Event Highlights & Overview * (50 characters - 2500 words)
                </label>
              </div>
              <div className={errors.description ? 'ring-2 ring-rose-500/40 rounded-xl overflow-hidden' : ''}>
                <RichTextEditor
                  name="description"
                  value={formData.description}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, description: val }));
                    const cleanLen = getCleanText(val).length;
                    if (errors.description && cleanLen >= 30) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }
                  }}
                  placeholder="Describe your event highlights, target visitor profiles, exhibitor benefits, and key conference themes..."
                  minHeight="260px"
                />
              </div>
              {errors.description && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>
          </div>
  );

  const renderStep3Content = ({ isScrollable = false } = {}) => (
    <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> {isScrollable ? "2. Dates, Timings & Venue Location" : "Step 3: Dates, Timings & Venue Location"}
              </h3>
              <p className="text-xs text-muted-foreground">Specify event schedule and exact hall address.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => {
                    handleChange(e);
                    if (formData.endDate && e.target.value && new Date(formData.endDate) >= new Date(e.target.value)) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.endDate;
                        return next;
                      });
                    }
                  }}
                  onBlur={handleBlur}
                  className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all dark:[color-scheme:dark] ${
                    errors.startDate
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                      : 'border-border focus:ring-2 focus:ring-primary'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.startDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all dark:[color-scheme:dark] ${
                    errors.endDate
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                      : 'border-border focus:ring-2 focus:ring-primary'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.endDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Daily Visitor Timings
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={getTimingParts(formData.timings).start}
                    onChange={(e) => {
                      const { end } = getTimingParts(formData.timings);
                      handleTimingChange(e.target.value, end);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:[color-scheme:dark]"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={getTimingParts(formData.timings).end}
                    onChange={(e) => {
                      const { start } = getTimingParts(formData.timings);
                      handleTimingChange(start, e.target.value);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Venue Name / Hall Number *
                </label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="E.g. Pragati Maidan Exhibition Complex (Hall 7-10)"
                  className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                    errors.venueName
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500'
                      : 'border-border focus:ring-2 focus:ring-primary'
                  }`}
                />
                {errors.venueName && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.venueName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  City *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. New Delhi, Mumbai, Berlin"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.city
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {errors.city && (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.city}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {errors.city && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.city}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Mathura Road, Connaught Place, New Delhi 110001"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Country *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="country"
                    list="country-suggestions"
                    value={formData.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. India or United States"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.country
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  <datalist id="country-suggestions">
                    {COMMON_COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {errors.country && (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.country}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {errors.country && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.country}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Map Suggestion Widget */}
            <div className="border border-border/80 rounded-2xl p-4 bg-muted/20 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Automatic Venue Map Integration</h4>
                    <p className="text-[11px] text-muted-foreground">
                      VisitExpo automatically embeds Google Maps directions for visitors to {formData.venueName || 'your venue'}.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                  Map Active
                </span>
              </div>

              {/* Live Google Map Preview Iframe */}
              {[formData.venueName, formData.address, formData.city].some(Boolean) ? (
                <div className="w-full h-64 rounded-xl overflow-hidden border border-border bg-card shadow-inner">
                  <iframe
                    title="Venue Google Map Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      [formData.venueName, formData.address, formData.city].filter(Boolean).join(', ')
                    )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border rounded-xl bg-card/50 text-center text-muted-foreground text-xs">
                  <MapPin className="h-6 w-6 text-muted-foreground/40 mb-2" />
                  <span>Enter a venue name, street address, or city to see the map preview.</span>
                </div>
              )}
            </div>
          </div>
  );

  const renderStep4Content = ({ isScrollable = false } = {}) => {
    const phoneParts = parsePhoneWithCountryCode(formData.orgPhone);
    const selectedCountry = COUNTRY_DIAL_CODES.find(c => c.code === phoneParts.code) || COUNTRY_DIAL_CODES[0];
    return (
      <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> {isScrollable ? "3. Organizer Profile Setup" : "Step 4: Organizer Profile Setup"}
              </h3>
              <p className="text-xs text-muted-foreground">Build trust with corporate attendees & exhibitors.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Organization / Business Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. Global Tech Conferences Pvt Ltd"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.orgName
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {errors.orgName && (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.orgName}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {errors.orgName && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.orgName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  GST / Corporate Identification ID (Optional)
                </label>
                <input
                  type="text"
                  name="orgGst"
                  value={formData.orgGst}
                  onChange={handleChange}
                  placeholder="07AAAAA1111A1Z1"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Official Website
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="orgWebsite"
                    value={formData.orgWebsite}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="https://globaltechevents.com"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.orgWebsite
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {errors.orgWebsite && (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.orgWebsite}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {errors.orgWebsite && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.orgWebsite}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Contact Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="orgEmail"
                    value={formData.orgEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="organizer@visitexpo.in"
                    className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all ${
                      errors.orgEmail
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                        : 'border-border focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {errors.orgEmail && (
                    <div className="absolute right-3 top-2.5 text-rose-500" title={errors.orgEmail}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {errors.orgEmail && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.orgEmail}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className={`flex items-center rounded-lg border bg-background transition-all h-[42px] ${
                    errors.orgPhone
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5'
                      : 'border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'
                  }`}>
                    {/* Country Dial Code Searchable Dropdown */}
                    <div className="relative w-[85px] shrink-0 h-full border-r border-border">
                      <SearchableSelect
                        options={COUNTRY_DIAL_CODES.map((item) => ({
                          value: item.code,
                          label: `${item.flag} ${item.code} (${item.country})`,
                          subtext: item.country,
                          flag: item.flag
                        }))}
                        value={phoneParts.code}
                        onChange={(newCode) => {
                          const newFull = `${newCode} ${phoneParts.number}`.trim();
                          setFormData(prev => ({ ...prev, orgPhone: newFull }));
                          if (errors.orgPhone) {
                            const err = validateField('orgPhone', newFull, { ...formData, orgPhone: newFull });
                            if (!err) {
                              setErrors(prev => {
                                const next = { ...prev };
                                delete next.orgPhone;
                                return next;
                              });
                            } else {
                              setErrors(prev => ({ ...prev, orgPhone: err }));
                            }
                          }
                        }}
                        searchPlaceholder="Search country or code..."
                        dropdownClassName="w-72"
                        renderTrigger={({ isOpen }) => (
                          <div className="w-[85px] shrink-0 h-[40px] bg-muted/40 hover:bg-muted/70 rounded-l-lg transition-colors flex items-center justify-between px-2.5 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span className="text-sm shrink-0 leading-none">{selectedCountry?.flag || '🌐'}</span>
                              <span className="tabular-nums tracking-tight">{phoneParts.code}</span>
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                          </div>
                        )}
                      />
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      name="orgPhone"
                      value={phoneParts.number}
                      onChange={(e) => {
                        const raw = e.target.value;
                        let newNum = raw;
                        if (phoneParts.code === '+91') {
                          // Allow digits, spaces, and hyphens; restrict digits to max 10
                          newNum = raw.replace(/[^\d\s-]/g, '');
                          const digitsOnly = newNum.replace(/\D/g, '');
                          if (digitsOnly.length > 10) {
                            return;
                          }
                        }
                        const newFull = `${phoneParts.code} ${newNum}`.trim();
                        setFormData(prev => ({ ...prev, orgPhone: newFull }));
                        if (errors.orgPhone) {
                          const err = validateField('orgPhone', newFull, { ...formData, orgPhone: newFull });
                          if (!err) {
                            setErrors(prev => {
                              const next = { ...prev };
                              delete next.orgPhone;
                              return next;
                            });
                          } else {
                            setErrors(prev => ({ ...prev, orgPhone: err }));
                          }
                        }
                      }}
                      onBlur={() => {
                        const err = validateField('orgPhone', formData.orgPhone, formData);
                        if (err) {
                          setErrors(prev => ({ ...prev, orgPhone: err }));
                        } else if (errors.orgPhone) {
                          setErrors(prev => {
                            const next = { ...prev };
                            delete next.orgPhone;
                            return next;
                          });
                        }
                      }}
                      placeholder={phoneParts.code === '+91' ? '98765 43210 (10 digits)' : '98765 43210'}
                      maxLength={phoneParts.code === '+91' ? 14 : 20}
                      className="flex-1 min-w-0 h-full bg-transparent px-3 py-2 text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                    />

                    {errors.orgPhone && (
                      <div className="flex items-center pr-3 text-rose-500 shrink-0" title={errors.orgPhone}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
                {errors.orgPhone && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.orgPhone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Organizer Logo & Description */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Organizer Logo (Min 100×100 px)
                  </label>
                  {formData.orgLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, orgLogo: '' }));
                        setOrgLogoValidation(null);
                      }}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Remove Logo
                    </button>
                  )}
                </div>
                {orgLogoValidation?.error && (
                  <p className="text-[11px] font-semibold text-red-500 my-1">{orgLogoValidation.error}</p>
                )}
                {formData.orgLogo ? (
                  <div className="relative border border-border rounded-xl p-3 bg-card flex flex-col items-center justify-center min-h-[110px] space-y-2 shadow-xs">
                    <div className="relative h-16 w-full flex items-center justify-center bg-muted/30 rounded-lg p-1.5 border border-border/50">
                      <img src={formData.orgLogo} alt="Org Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, orgLogo: '' }));
                          setOrgLogoValidation(null);
                        }}
                        title="Delete Organizer Logo"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-transform hover:scale-105 cursor-pointer z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <label className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-bold text-foreground cursor-pointer transition-colors border border-border flex items-center gap-1">
                        <Upload className="h-3 w-3 text-muted-foreground" /> Change
                        <input
                          type="file"
                          onChange={handleOrgLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, orgLogo: '' }));
                          setOrgLogoValidation(null);
                        }}
                        className="px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-border rounded-xl p-4 text-center bg-background hover:border-primary transition-colors cursor-pointer min-h-[110px] flex flex-col items-center justify-center">
                    <input
                      type="file"
                      onChange={handleOrgLogoUpload}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground/70 mb-1" />
                    <div className="text-[11px] font-semibold text-muted-foreground">Click or drag logo here</div>
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">PNG, JPG, WebP up to 5MB</div>
                  </div>
                )}
              </div>
              
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Organizer About / Description
                </label>
                <textarea
                  name="orgDesc"
                  value={formData.orgDesc}
                  onChange={handleChange}
                  placeholder="A brief bio of the organizing body..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
            </div>

            {/* Social Links Sub-section */}
            <div className="border border-border/80 rounded-2xl p-4 bg-muted/10 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Social Links</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="url"
                  name="socialLinkedIn"
                  value={formData.socialLinkedIn}
                  onChange={handleChange}
                  placeholder="LinkedIn Company Page URL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                />
                <input
                  type="url"
                  name="socialFacebook"
                  value={formData.socialFacebook}
                  onChange={handleChange}
                  placeholder="Facebook Page URL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
    );
  };

  const renderStep5Content = ({ isScrollable = false } = {}) => (
    <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> {isScrollable ? "4. Media Upload & Promotional Assets" : "Step 5: Media Upload & Promotional Assets"}
              </h3>
              <p className="text-xs text-muted-foreground">Upload 1920x1080 banner, gallery photos, brochure PDF & promo video.</p>
            </div>

            {/* Main Cover Banner Upload Zone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Event Main Banner Cover (Recommended: 1920 × 1080 px | Min: 1200 × 630 px) *
                </label>
                {bannerValidation?.dimensions && formData.bannerUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    {bannerValidation.dimensions.width} × {bannerValidation.dimensions.height} px ({bannerValidation.dimensions.aspectRatio})
                  </span>
                )}
              </div>

              {errors.bannerUrl && !bannerValidation?.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in-50">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Cover Banner Required: </strong>
                    {errors.bannerUrl}
                  </div>
                </div>
              )}

              {bannerValidation?.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Image Resolution Rejected: </strong>
                    {bannerValidation.error}
                  </div>
                </div>
              )}

              <div 
                onClick={triggerFileInput}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                  errors.bannerUrl
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5 hover:border-rose-600'
                    : 'border-border bg-muted/10 hover:border-primary'
                }`}
              >
                <input
                  type="file"
                  name="bannerUrl"
                  ref={fileInputRef}
                  onChange={handleBannerUpload}
                  accept="image/*"
                  className="hidden"
                />
                {isUploading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> Uploading image to Cloudinary...
                  </div>
                ) : formData.bannerUrl ? (
                  <div className="relative h-44 w-full rounded-xl overflow-hidden shadow-md">
                    <img src={formData.bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg border border-white/20">
                        Change Banner Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-foreground">Drag and drop event banner image here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP (Min 1200×630px, Rec 1920×1080px up to 10MB)</p>
                  </div>
                )}
              </div>
              {errors.bannerUrl && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.bannerUrl}</span>
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Brochure PDF Link
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="url"
                    name="brochurePdf"
                    value={formData.brochurePdf}
                    onChange={handleChange}
                    placeholder="https://example.com/expo-brochure.pdf"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Promo Video URL (YouTube / Vimeo)
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="url"
                    name="promoVideoUrl"
                    value={formData.promoVideoUrl}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=promo_id"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Repeatable Sponsor Logos Section */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Official Co-Sponsors &amp; Tech Partners</h4>
                <p className="text-xs text-muted-foreground">Add sponsors, co-sponsors, and media partners for the event banner logos.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-4 items-end bg-card p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Sponsor Name</label>
                  <input
                    type="text"
                    value={newSponsor.name}
                    onChange={e => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Google Cloud"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Website Link</label>
                  <input
                    type="url"
                    value={newSponsor.link}
                    onChange={e => setNewSponsor(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Tier / Label</label>
                  <SearchableSelect
                    options={PRESET_SPONSOR_TIERS}
                    value={
                      isCustomSponsorTier
                        ? 'CUSTOM'
                        : PRESET_SPONSOR_TIERS.includes(newSponsor.tier)
                        ? newSponsor.tier
                        : newSponsor.tier
                        ? 'CUSTOM'
                        : 'Platinum Sponsor'
                    }
                    onChange={(val) => {
                      if (val === 'CUSTOM') {
                        setIsCustomSponsorTier(true);
                        setNewSponsor(prev => ({ ...prev, tier: '' }));
                      } else {
                        setIsCustomSponsorTier(false);
                        setNewSponsor(prev => ({ ...prev, tier: val }));
                      }
                    }}
                    placeholder="Select Sponsor Tier..."
                    searchPlaceholder="Search sponsor tier..."
                    allowCustom={true}
                    customOptionLabel="+ Custom Tier / Label..."
                    className="py-1.5 px-2.5 text-xs h-[34px]"
                  />
                  {(isCustomSponsorTier || (!PRESET_SPONSOR_TIERS.includes(newSponsor.tier) && newSponsor.tier !== '')) && (
                    <input
                      type="text"
                      value={newSponsor.tier}
                      onChange={e => setNewSponsor(prev => ({ ...prev, tier: e.target.value }))}
                      placeholder="Type custom tier label..."
                      className="w-full mt-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  )}
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <div className="relative border border-dashed border-border rounded-lg p-1.5 text-center bg-background hover:border-primary transition-colors cursor-pointer flex-1 h-[32px] flex items-center justify-center">
                    <input
                      type="file"
                      onChange={handleSponsorLogoUpload}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {isSponsorUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : newSponsor.logo ? (
                      <img src={newSponsor.logo} alt="Sponsor Logo Preview" className="max-h-6 object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">Upload Logo</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addSponsor}
                    className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs h-[32px]"
                  >
                    Add
                  </button>
                </div>
                {sponsorLogoValidation?.error && (
                  <p className="text-[11px] font-semibold text-red-500 mt-1">{sponsorLogoValidation.error}</p>
                )}
              </div>

              {/* Sponsor Grid Display */}
              {formData.sponsorsList && formData.sponsorsList.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  {formData.sponsorsList.map((sp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-3">
                        {sp.logo ? (
                          <img src={sp.logo} alt={sp.name} className="h-8 w-8 object-contain rounded bg-muted p-1" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">LOGO</div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">{sp.name}</p>
                          <p className="text-[10px] text-primary font-semibold">{sp.tier}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSponsor(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
  );

  const renderStep6Content = ({ isScrollable = false } = {}) => (
    <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" /> {isScrollable ? "5. Ticketing & Visitor Registration Setup" : "Step 6: Ticketing & Visitor Registration Setup"}
              </h3>
              <p className="text-xs text-muted-foreground">Configure registration rules and visitor data collection fields.</p>
            </div>

            {/* Free vs Paid Toggle */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                onClick={() => {
                  setFormData(prev => ({ ...prev, isFreeEvent: true }));
                  if (errors.paidTicketPrice) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.paidTicketPrice;
                      return next;
                    });
                  }
                }}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  formData.isFreeEvent
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Free Visitor Registration</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                    {formData.isFreeEvent && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Complimentary pass for trade visitors and corporate delegates. Increases attendee throughput.
                </p>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...prev, isFreeEvent: false }))}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  !formData.isFreeEvent
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Paid Ticket Entry</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${!formData.isFreeEvent ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                    {!formData.isFreeEvent && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Charge for VIP tickets or conference passes. Connected directly with payment gateway.
                </p>
              </div>
            </div>

            {!formData.isFreeEvent && (() => {
              const currentCurrency = CURRENCY_OPTIONS.find(c => c.code === (formData.currency || 'INR')) || CURRENCY_OPTIONS[0];
              return (
                <div className="grid gap-4 sm:grid-cols-2 bg-card p-4 rounded-xl border border-border">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Currency *
                    </label>
                    <SearchableSelect
                      options={CURRENCY_OPTIONS.map(c => ({
                        value: c.code,
                        label: `${c.flag} ${c.code} (${c.symbol}) - ${c.name}`,
                        subtext: `${c.name} ${c.symbol}`,
                        flag: c.flag
                      }))}
                      value={formData.currency || 'INR'}
                      onChange={(val) => {
                        setFormData(prev => ({ ...prev, currency: val }));
                      }}
                      placeholder="Select currency..."
                      searchPlaceholder="Search currency (e.g. USD, EUR, INR)..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Ticket Price per Attendee ({currentCurrency.code} {currentCurrency.symbol}) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="bg-muted px-3.5 py-2.5 rounded-l-lg border border-r-0 border-border text-xs text-muted-foreground font-bold shrink-0">
                        {currentCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        name="paidTicketPrice"
                        min="1"
                        step="any"
                        value={formData.paidTicketPrice}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full rounded-r-lg border bg-background px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none transition-all ${
                          errors.paidTicketPrice
                            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 focus:ring-rose-500 pr-10'
                            : 'border-border focus:ring-2 focus:ring-primary'
                        }`}
                      />
                      {errors.paidTicketPrice && (
                        <div className="absolute right-3 top-2.5 text-rose-500" title={errors.paidTicketPrice}>
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    {errors.paidTicketPrice && (
                      <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in-50">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.paidTicketPrice}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Form Fields Selector */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Registration Form Required Fields
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  Click optional fields to toggle collection
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'name', label: 'Full Name', fixed: true },
                  { id: 'email', label: 'Email Address', fixed: true },
                  { id: 'phone', label: 'Mobile Number', fixed: true },
                  { id: 'company', label: 'Company / Org' },
                  { id: 'designation', label: 'Designation' },
                  { id: 'industry', label: 'Industry Sector' },
                  { id: 'city', label: 'City' }
                ].map((field) => {
                  const isChecked = (formData.formFields || ['name', 'email', 'phone', 'company', 'designation']).includes(field.id);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleFormField(field.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      )}
                      {field.label}
                      {field.fixed && (
                        <span className="text-[10px] opacity-75 font-medium ml-0.5">(Required)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Schedules / Date agenda section */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Event Schedule Dates</h4>
                <p className="text-xs text-muted-foreground">Add specific event days or session timelines (e.g. "Event Day" or "Day 1", Date: "13 Nov 2026").</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 items-end bg-card p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Day / Session Label</label>
                  <input
                    type="text"
                    value={newSchedule.name}
                    onChange={e => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Day 1: Main Panel"
                    className={`w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none transition-all ${
                      newSchedule.name && /^\d+$/.test(newSchedule.name.trim())
                        ? 'border-destructive ring-1 ring-destructive/40'
                        : 'border-border focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {newSchedule.name && /^\d+$/.test(newSchedule.name.trim()) && (
                    <p className="text-[10px] text-destructive font-medium flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Cannot be numbers only
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Date Value</label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={e => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark]"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs h-[32px]"
                >
                  Add Day
                </button>
              </div>

              {formData.schedules && formData.schedules.length > 0 && (
                <div className="space-y-2">
                  {formData.schedules.map((sch, idx) => {
                    const displayDate = sch.date && /^\d{4}-\d{2}-\d{2}$/.test(sch.date)
                      ? new Date(sch.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : sch.date;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                        <div className="text-xs">
                          <strong className="text-foreground">{sch.name}</strong>: <span className="text-muted-foreground">{displayDate}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSchedule(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Event FAQ Section */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Frequently Asked Questions (FAQ)</h4>
                <p className="text-xs text-muted-foreground">Add standard FAQs that will display on your event web page.</p>
              </div>

              <div className="space-y-3 bg-card p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Question</label>
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={e => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="e.g. Where can I collect my entry pass?"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Answer</label>
                  <textarea
                    value={newFaq.answer}
                    onChange={e => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Enter details..."
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addFaq}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                >
                  Add FAQ
                </button>
              </div>

              {formData.faqsList && formData.faqsList.length > 0 && (
                <div className="space-y-2">
                  {formData.faqsList.map((faq, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-card space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-foreground">Q: {faq.question}</strong>
                        <button
                          type="button"
                          onClick={() => removeFaq(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-2"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-muted-foreground">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Contact shortcode */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">Contact Form Shortcode</h4>
                <p className="text-xs text-muted-foreground">Paste your Contact Form 7 shortcode generated on WordPress.</p>
              </div>
              <input
                type="text"
                name="contactShortcode"
                value={formData.contactShortcode}
                onChange={handleChange}
                placeholder='e.g. [contact-form-7 id="1275" title="Contact Event"]'
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none"
              />
            </div>
          </div>
  );

  const renderStep7Content = ({ isScrollable = false } = {}) => (
    <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> {isScrollable ? "6. Event Preview & Pre-Publish SEO Analysis" : "Step 7: Event Preview & Pre-Publish SEO Analysis"}
                </h3>
                <p className="text-xs text-muted-foreground">Verify public details and search engine optimization grade.</p>
              </div>
              
              {/* SEO Score Badge */}
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 px-4 py-2">
                <Star className="h-5 w-5 text-emerald-500 fill-emerald-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">SEO Score Grade</span>
                  <p className="text-lg font-extrabold text-emerald-500 leading-none">{seoScore} / 100</p>
                </div>
              </div>
            </div>

            {/* High-priority duplicate warning banner in Step 7 */}
            {duplicateCheck.isDuplicate && duplicateCheck.existingEvent && (
              <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-5 space-y-3 shadow-md animate-in fade-in-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        Duplicate Event Detected — Submission Blocked
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        An event titled <strong className="text-foreground font-bold">"{duplicateCheck.existingEvent.title}"</strong> is already registered in VisitExpo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => isScrollable ? scrollToSection('section-basic') : setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow transition-colors shrink-0 cursor-pointer"
                  >
                    {isScrollable ? '↑ Edit Title in Section 1' : '← Edit Title in Step 2'}
                  </button>
                </div>

                {/* Existing event card details */}
                <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="space-y-1">
                    <span className="font-extrabold text-foreground text-sm block">{duplicateCheck.existingEvent.title}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                      {duplicateCheck.existingEvent.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" /> {duplicateCheck.existingEvent.venue}, {duplicateCheck.existingEvent.city}
                        </span>
                      )}
                      {duplicateCheck.existingEvent.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" /> {new Date(duplicateCheck.existingEvent.startDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {duplicateCheck.existingEvent.source === 'wordpress' ? 'Live Directory Listing' : 'Platform Event'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://visitexpo.in/event/${duplicateCheck.existingEvent.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" /> View Event
                    </a>
                    <Link
                      href={`/events/claim?search=${encodeURIComponent(duplicateCheck.existingEvent.title)}`}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="h-3 w-3" /> Claim Listing
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  💡 Duplicate events cannot be published. If you are the official organizer of this event, please click <strong>Claim Listing</strong>. Otherwise, click <strong>Edit Title in Step 2</strong> to give your event a distinctive name.
                </p>
              </div>
            )}

                        {/* SEO Meta Customization */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Google & Search Engine Snippet
                </h4>
                <span className="text-[11px] text-muted-foreground">Used for SEO indexing</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    placeholder={`${formData.title || "Event Name"} | VisitExpo`}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    placeholder="Brief description for Google search results..."
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Live Preview Card */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Live Public Listing Card Preview</h4>
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                  <div className="h-44 bg-muted relative">
                    {formData.bannerUrl ? (
                      <img src={formData.bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        Banner Preview
                      </div>
                    )}
                    {duplicateCheck.isDuplicate ? (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Duplicate Name — Blocked
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                        Pending Review
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Calendar className="h-4 w-4" />
                      <span>{formData.startDate || '2026-10-15'} to {formData.endDate || '2026-10-17'} ({formData.timings})</span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground leading-snug">
                      {formData.title || 'Untitled Expo Event 2026'}
                    </h2>

                    <div className="text-xs text-muted-foreground leading-relaxed max-h-48 overflow-y-auto space-y-1 my-2">
                      {formData.description ? renderRichText(formData.description) : 'Comprehensive event description will be rendered here.'}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{formData.venueName || 'Pragati Maidan'}, {formData.city || 'New Delhi'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-Publish Checklist */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Pre-Submission Quality Checklist</h4>
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  {[
                    { label: 'Event Title Unique (Not Duplicate)', pass: !duplicateCheck.isDuplicate, isCritical: true },
                    { label: 'Event Banner Uploaded', pass: !!formData.bannerUrl },
                    { label: 'Start & End Dates Set', pass: !!formData.startDate && !!formData.endDate },
                    { label: 'Venue Location Confirmed', pass: !!formData.venueName && !!formData.city && !/\d/.test(formData.city) && !!formData.country && !/\d/.test(formData.country) },
                    { label: 'Organizer Profile Complete', pass: !!formData.orgName && !!formData.orgEmail && !validateField('orgPhone', formData.orgPhone, formData) && !errors.orgPhone },
                    { label: 'Visitor Form Configured', pass: true },
                    { label: 'SEO Title & Description', pass: !!formData.metaTitle }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/60 last:border-0">
                      <span className="text-foreground">{item.label}</span>
                      {item.isCritical && !item.pass ? (
                        <span className="flex items-center gap-1 text-rose-600 font-bold">
                          <AlertTriangle className="h-4 w-4" /> Blocked (Duplicate)
                        </span>
                      ) : item.pass ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <CheckCircle2 className="h-4 w-4" /> Pass
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <AlertTriangle className="h-4 w-4" /> Optional
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
  );

  const renderStep8 = () => (
    <div className="text-center max-w-xl mx-auto space-y-6 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto ring-8 ring-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" /> Moderation Workflow Active
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                Event Submitted for Admin Approval!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for onboarding your event with VisitExpo. Your listing <strong className="text-foreground">{formData.title || 'Tech Expo'}</strong> is currently under review by our moderation team.
              </p>
            </div>

            {/* Moderation Details Card */}
            <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                Moderation Status SLA
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Estimated Approval Time:</span>
                  <p className="font-bold text-foreground">Within 24 Hours</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Moderator:</span>
                  <p className="font-bold text-foreground">VisitExpo Admin Desk</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/events"
                onClick={handleResetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Go to Organizer Dashboard
              </Link>
              <button
                onClick={() => {
                  handleResetForm();
                  setIsSubmitted(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
              >
                Onboard Another Event
              </button>
            </div>
          </div>
  );

  const sectionChecklist = [
    {
      id: 'basic',
      anchor: 'section-basic',
      label: '1. Basic Info',
      icon: FileText,
      isComplete: Boolean(
        formData.title?.trim().length >= 3 &&
        getCleanText(formData.description).length >= 30 &&
        !errors.title &&
        !errors.description &&
        !duplicateCheck.isDuplicate
      )
    },
    {
      id: 'venue',
      anchor: 'section-venue',
      label: '2. Dates & Venue',
      icon: Calendar,
      isComplete: Boolean(
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) >= new Date(formData.startDate) &&
        formData.venueName?.trim().length >= 3 &&
        formData.city?.trim() &&
        !/\d/.test(formData.city?.trim()) &&
        formData.country?.trim() &&
        !/\d/.test(formData.country?.trim()) &&
        !errors.startDate &&
        !errors.endDate &&
        !errors.venueName &&
        !errors.city &&
        !errors.country
      )
    },
    {
      id: 'organizer',
      anchor: 'section-organizer',
      label: '3. Organizer Profile',
      icon: Building,
      isComplete: Boolean(
        formData.orgName?.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.orgEmail?.trim() || '') &&
        !validateField('orgPhone', formData.orgPhone, formData) &&
        !errors.orgName &&
        !errors.orgEmail &&
        !errors.orgPhone
      )
    },
    {
      id: 'media',
      anchor: 'section-media',
      label: '4. Media & Assets',
      icon: ImageIcon,
      isComplete: Boolean(formData.bannerUrl?.trim() && (!bannerValidation || bannerValidation.isValid))
    },
    {
      id: 'tickets',
      anchor: 'section-tickets',
      label: '5. Tickets & Form',
      icon: Ticket,
      isComplete: Boolean(formData.isFreeEvent || (parseFloat(formData.paidTicketPrice) > 0 && !errors.paidTicketPrice))
    },
    {
      id: 'seo',
      anchor: 'section-seo',
      label: '6. SEO & Review',
      icon: Eye,
      isComplete: Boolean(!duplicateCheck.isDuplicate && (formData.metaTitle?.trim() || formData.title?.trim()))
    }
  ];

  const completedSectionsCount = sectionChecklist.filter(s => s.isComplete).length;

  return (
    <div className={`space-y-6 ${formMode === 'scrollable' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto pb-12`}>
      {/* Top Banner: Progress Stepper & Mode Switcher Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Event & Organizer Onboarding
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formMode === 'wizard' ? (
                <>Step {currentStep} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[currentStep - 1]?.title}</span></>
              ) : (
                <>All-in-One Form • Fill all sections continuously on a single scrollable page</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Form Mode Switcher Toggle */}
            <div className="inline-flex items-center p-1 bg-muted/60 dark:bg-muted/40 border border-border rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => handleModeChange('wizard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formMode === 'wizard'
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Navigate one step at a time with guided stepper"
              >
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Step-by-Step Wizard</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('scrollable')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formMode === 'scrollable'
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="View and edit all sections on a single continuous page"
              >
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                <span>All-in-One Form</span>
              </button>
            </div>

            {(formData.title || currentStep > 1) && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showSweetConfirm({
                    title: 'Clear Event Form?',
                    text: 'Are you sure you want to clear all fields and start fresh? All unsaved inputs will be cleared.',
                    icon: 'warning',
                    confirmButtonText: 'Yes, Clear Form',
                    cancelButtonText: 'Cancel',
                    isDanger: true
                  });
                  if (confirmed) {
                    handleResetForm();
                  }
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-border hover:border-rose-500/30 bg-muted/20 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Clear all fields and start fresh"
              >
                Clear Form
              </button>
            )}
          </div>
        </div>

        {/* WIZARD MODE: Stepper Bar */}
        {formMode === 'wizard' && (
          <div className="relative overflow-x-auto py-2">
            <div className="flex items-center justify-between min-w-[700px]">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id || isSubmitted;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      className={`btn-press flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md'
                          : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                    </button>
                    <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCROLLABLE MODE: Sticky Quick Jump Anchor Bar */}
        {formMode === 'scrollable' && !isSubmitted && currentStep !== 8 && (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-muted-foreground shrink-0 text-[11px] uppercase tracking-wider">
              <span>Quick Jump:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {sectionChecklist.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.anchor)}
                  className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary active:scale-95 text-foreground text-xs font-semibold border border-border shrink-0 transition-all cursor-pointer hover:border-primary/40"
                >
                  <sec.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{sec.label}</span>
                  {sec.isComplete && <Check className="h-3 w-3 text-emerald-500 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      
      {/* RENDER CONTENT BASED ON SELECTED MODE */}
      {formMode === 'wizard' ? (
        /* WIZARD MODE: Single step container + bottom stepper nav */
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2Content({ isScrollable: false })}
          {currentStep === 3 && renderStep3Content({ isScrollable: false })}
          {currentStep === 4 && renderStep4Content({ isScrollable: false })}
          {currentStep === 5 && renderStep5Content({ isScrollable: false })}
          {currentStep === 6 && renderStep6Content({ isScrollable: false })}
          {currentStep === 7 && renderStep7Content({ isScrollable: false })}
          {currentStep === 8 && renderStep8()}

          {/* Bottom Stepper Navigation Control Buttons */}
        {currentStep < 8 && (
          <div className="flex flex-col gap-4 pt-8 border-t border-border mt-8">
            {submitError && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center justify-between">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError('')} className="font-bold">×</button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1 || isNavigatingBack || isValidatingStep}
                className={`btn-press inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-0 cursor-default pointer-events-none'
                    : 'border border-border bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {isNavigatingBack ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" /> Previous Step
                  </>
                )}
              </button>

              {currentStep === 7 ? (
                duplicateCheck.isDuplicate ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn-press inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow transition-all cursor-pointer"
                    >
                      ← Return to Step 2 to Edit Title
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-xl bg-destructive/60 cursor-not-allowed px-5 py-2.5 text-xs font-bold text-destructive-foreground shadow transition-all"
                      title="An event with this title already exists"
                    >
                      <AlertTriangle className="h-4 w-4" /> Duplicate Event — Cannot Submit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitEvent}
                    disabled={submitting}
                    className="btn-press inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Event for Moderation...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Event for Moderation</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )
              ) : currentStep === 2 && duplicateCheck.isDuplicate ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl bg-destructive/70 cursor-not-allowed px-6 py-2.5 text-xs font-bold text-destructive-foreground shadow transition-all"
                  title="An event with this name already exists"
                >
                  <AlertTriangle className="h-4 w-4" /> Duplicate Event Name <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isValidatingStep}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all cursor-pointer disabled:opacity-85"
                >
                  {isValidatingStep ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                      <span>Form Verified • Proceeding to Next Step...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Next Step</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      ) : (
        /* SCROLLABLE MODE: All sections continuous stack + Sticky Sidebar */
        isSubmitted || currentStep === 8 ? (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {renderStep8()}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: All Continuous Section Cards */}
            <div className="lg:col-span-8 space-y-8">
              {/* Quick Claim Info Notice */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Is this event already listed on VisitExpo? <Link href="/events/claim" className="font-bold text-primary hover:underline">Claim official ownership here</Link> instead of creating a duplicate.
                  </p>
                </div>
              </div>

              {/* SECTION 1: Basic Information */}
              <div id="section-basic" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep2Content({ isScrollable: true })}
              </div>

              {/* SECTION 2: Dates, Timings & Venue */}
              <div id="section-venue" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep3Content({ isScrollable: true })}
              </div>

              {/* SECTION 3: Organizer Profile */}
              <div id="section-organizer" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep4Content({ isScrollable: true })}
              </div>

              {/* SECTION 4: Media Upload & Assets */}
              <div id="section-media" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep5Content({ isScrollable: true })}
              </div>

              {/* SECTION 5: Ticketing & Registration */}
              <div id="section-tickets" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep6Content({ isScrollable: true })}
              </div>

              {/* SECTION 6: Preview & Pre-Publish SEO Checker */}
              <div id="section-seo" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                {renderStep7Content({ isScrollable: true })}
              </div>
            </div>

            {/* Right Column: Sticky Sidebar (Publish Action, Checklist, SEO Gauge) */}
            <div className="lg:col-span-4 sticky top-6 space-y-6">
              {/* Publish Action Box */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Publish & Status
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    New Event
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold flex items-start justify-between gap-2">
                    <span>{submitError}</span>
                    <button onClick={() => setSubmitError('')} className="font-bold text-sm shrink-0">×</button>
                  </div>
                )}

                {duplicateCheck.isDuplicate ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> Duplicate Event Name
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        An event with this name already exists. Please rename your event in Section 1 or claim it.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive/70 cursor-not-allowed px-4 py-3 text-xs font-bold text-destructive-foreground shadow"
                    >
                      <AlertTriangle className="h-4 w-4" /> Duplicate — Cannot Submit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitEvent}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Event...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Event for Moderation</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Form Checklist Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Section Checklist
                  </h4>
                  <span className="text-xs font-extrabold text-primary">
                    {completedSectionsCount} / 6 Ready
                  </span>
                </div>

                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: ((completedSectionsCount / 6) * 100) + '%' }}
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  {sectionChecklist.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.anchor)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/60 text-xs transition-colors text-left group cursor-pointer"
                    >
                      <span className="text-foreground group-hover:text-primary font-medium flex items-center gap-2">
                        <sec.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        {sec.label}
                      </span>
                      {sec.isComplete ? (
                        <span className="flex items-center text-emerald-500 font-bold text-[11px]">
                          <Check className="h-3.5 w-3.5 mr-0.5" /> Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-normal">
                          Incomplete
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEO Score Meter Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" /> SEO Optimization
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-500">
                    {seoScore} / 100
                  </span>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={'h-full transition-all duration-300 ' + (
                      seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                    style={{ width: seoScore + '%' }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {seoScore >= 80
                    ? 'Listing quality is excellent! Meets requirements for directory indexing and SEO visibility.'
                    : 'Add complete description, 1920x1080 banner cover, and SEO tags to improve ranking.'}
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

