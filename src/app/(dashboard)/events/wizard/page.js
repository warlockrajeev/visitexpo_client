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
import {
  Sparkles,
  Calendar,
  MapPin,
  Building,
  Upload,
  Ticket,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
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
  Edit3,
  Eraser,
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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



// Render Rich Text Markdown/HTML content into styled React elements
export function renderRichText(content) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];

  let inList = false;
  let listItems = [];
  let isNumbered = false;

  const formatInline = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium">$1</a>');
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

    if (trimmed.startsWith('# ')) {
      flushList(idx);
      elements.push(<h1 key={idx} className="text-xl font-extrabold tracking-tight text-foreground my-3 border-b border-border pb-1" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />);
    } else if (trimmed.startsWith('## ')) {
      flushList(idx);
      elements.push(<h2 key={idx} className="text-lg font-bold text-foreground my-2.5" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(3)) }} />);
    } else if (trimmed.startsWith('### ')) {
      flushList(idx);
      elements.push(<h3 key={idx} className="text-base font-bold text-foreground my-2 text-primary" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(4)) }} />);
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

// Interactive Rich Text Editor Component
export function RichTextEditor({
  value = '',
  onChange,
  onAiAssist,
  isAiGenerating = false,
  placeholder = 'Describe the main highlights, key themes, delegate profile, and exhibitor benefits...',
  rows = 6,
  minHeight = '180px'
}) {
  const [activeTab, setActiveTab] = React.useState('write'); // 'write' or 'preview'
  const textareaRef = React.useRef(null);

  const applyFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || '';
    const selected = text.substring(start, end);

    let prefix = '';
    let suffix = '';
    let replacement = '';

    switch (type) {
      case 'h1':
        prefix = '# ';
        replacement = prefix + (selected || 'Main Heading');
        break;
      case 'h2':
        prefix = '## ';
        replacement = prefix + (selected || 'Subheading');
        break;
      case 'h3':
        prefix = '### ';
        replacement = prefix + (selected || 'Section Title');
        break;
      case 'bold':
        prefix = '**';
        suffix = '**';
        replacement = prefix + (selected || 'bold text') + suffix;
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        replacement = prefix + (selected || 'italic text') + suffix;
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        replacement = prefix + (selected || 'underlined text') + suffix;
        break;
      case 'bullet':
        prefix = '• ';
        replacement = selected ? selected.split('\n').map(l => `• ${l}`).join('\n') : '• Bullet list item';
        break;
      case 'number':
        prefix = '1. ';
        replacement = selected ? selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n') : '1. Numbered list item';
        break;
      case 'quote':
        prefix = '> ';
        replacement = prefix + (selected || 'Blockquote text');
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        replacement = prefix + (selected || 'code') + suffix;
        break;
      case 'link':
        const url = window.prompt('Enter URL link (e.g. https://visitexpo.in):', 'https://');
        if (!url) return;
        replacement = `[${selected || 'Link Title'}](${url})`;
        break;
      case 'clear':
        replacement = selected.replace(/[\*#>`•]/g, '').replace(/<\/?u>/g, '');
        break;
      default:
        return;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
      }
    }, 10);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'write' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" /> Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Rich Preview
          </button>
        </div>

      </div>

      {/* Formatting Toolbar (Only shown in 'write' mode) */}
      {activeTab === 'write' && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-border/70 bg-card text-xs overflow-x-auto">
          {/* Headings */}
          <div className="flex items-center border-r border-border pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => applyFormat('h1')}
              title="Heading 1 (#)"
              className="px-2 py-1 rounded hover:bg-secondary text-foreground font-extrabold text-xs"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => applyFormat('h2')}
              title="Heading 2 (##)"
              className="px-2 py-1 rounded hover:bg-secondary text-foreground font-bold text-xs"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => applyFormat('h3')}
              title="Heading 3 (###)"
              className="px-2 py-1 rounded hover:bg-secondary text-foreground font-semibold text-xs"
            >
              H3
            </button>
          </div>

          {/* Inline Styles */}
          <div className="flex items-center border-r border-border pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              title="Bold (**text**)"
              className="p-1.5 rounded hover:bg-secondary text-foreground font-bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              title="Italic (*text*)"
              className="p-1.5 rounded hover:bg-secondary text-foreground italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              title="Underline (<u>text</u>)"
              className="p-1.5 rounded hover:bg-secondary text-foreground underline"
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center border-r border-border pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => applyFormat('bullet')}
              title="Bulleted List (• item)"
              className="p-1.5 rounded hover:bg-secondary text-foreground"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('number')}
              title="Numbered List (1. item)"
              className="p-1.5 rounded hover:bg-secondary text-foreground"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Special Elements */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => applyFormat('quote')}
              title="Blockquote (> text)"
              className="p-1.5 rounded hover:bg-secondary text-foreground"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('code')}
              title="Inline Code (`code`)"
              className="p-1.5 rounded hover:bg-secondary text-foreground"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('link')}
              title="Hyperlink [title](url)"
              className="p-1.5 rounded hover:bg-secondary text-foreground"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('clear')}
              title="Remove formatting"
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive ml-1"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Editor Pane */}
      {activeTab === 'write' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-background p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed border-none resize-y"
            style={{ minHeight }}
          />
          <div className="flex justify-between items-center px-3 py-1.5 bg-muted/20 border-t border-border/50 text-[10px] text-muted-foreground">
            <span>Supports Rich Formatting (H1, H2, Bold, Lists, Links, Quotes)</span>
            <span>{value.length} characters</span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-background min-h-[180px] overflow-y-auto space-y-2 border-t border-border">
          {!value || !value.trim() ? (
            <p className="text-xs text-muted-foreground italic">No description content entered yet. Switch to Editor mode to write.</p>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-foreground text-sm">
              {renderRichText(value)}
            </div>
          )}
        </div>
      )}
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

export default function EventWizardPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const fileInputRef = React.useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [lastAutosaved, setLastAutosaved] = useState('Just now');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
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
    formFields: ['name', 'email', 'phone', 'company', 'designation'],
    // SEO
    metaTitle: '',
    metaDescription: ''
  });

  const saveDraftToStorage = (dataToSave = formData, stepToSave = currentStep) => {
    try {
      if (typeof window !== 'undefined') {
        const payload = {
          formData: dataToSave,
          currentStep: stepToSave > 1 ? stepToSave : 2,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('visitexpo_wizard_draft', JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Save draft error', e);
    }
  };

  const handleManualSaveDraft = () => {
    setIsSaving(true);
    saveDraftToStorage(formData, currentStep);
    setTimeout(() => {
      setIsSaving(false);
      setLastAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  // Restore saved draft on mount if available
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('visitexpo_wizard_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          const loadedData = parsed.formData || (parsed.title || parsed.description || parsed.venueName ? parsed : null);
          const loadedStep = parsed.currentStep || (loadedData?.title || loadedData?.venueName ? 2 : 1);

          if (loadedData && (loadedData.title || loadedData.description || loadedData.venueName)) {
            setFormData(prev => ({ ...prev, ...loadedData }));
            setCurrentStep(loadedStep > 1 ? loadedStep : 2);
            setLastAutosaved(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Loaded Draft');
          }
        }
      }
    } catch (e) {
      console.error('Error restoring saved draft', e);
    }
  }, []);

  // Autosave interval every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true);
      saveDraftToStorage(formData, currentStep);
      setTimeout(() => {
        setIsSaving(false);
        setLastAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }, 800);
    }, 25000);
    return () => clearInterval(interval);
  }, [formData, currentStep]);

  // Handle Category & Sub-Sector Changes
  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    const subList = CATEGORY_SUBSECTORS[selectedCat] || [];
    const defaultSub = subList[0] || '';
    setFormData(prev => ({
      ...prev,
      category: selectedCat,
      industry: defaultSub
    }));
    setIsCustomIndustry(false);
  };

  const handleSubSectorChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomIndustry(true);
      setFormData(prev => ({ ...prev, industry: '' }));
    } else {
      setIsCustomIndustry(false);
      setFormData(prev => ({ ...prev, industry: val }));
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Generate Slug
  const handleTitleBlur = () => {
    if (!formData.slug && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
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
    if (!newFaq.question || !newFaq.answer) return alert('Question and Answer are required');
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
    if (!newSchedule.name || !newSchedule.date) return alert('Day/Name and Date are required');
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { ...newSchedule }]
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
      alert("Please enter the Event Title first so AI Assist can generate a relevant description.");
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

Generate a compelling, professional B2B description for this event using rich markdown formatting (# Heading 1, ## Heading 2, **bold text**, • bullet points, > quote). It should be informative, highlighting who should attend (delegates, speakers, sponsors, exhibitors), key themes, and value proposition. Also generate a short SEO meta description (under 160 characters).
Return the result strictly as a JSON object with the following keys:
{
  "description": "The detailed rich markdown formatted B2B description",
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
      const aiText = `# ${title}\n\n${title} is the premier international B2B gathering for **${cat}** pioneers, industry leaders, and enterprise buyers.\n\n## Key Expo Highlights\n• **150+ Interactive Exhibitor Stalls**: Explore cutting-edge product launches and live tech demos.\n• **C-Suite Keynotes & Panels**: Gain actionable strategic insights from 40+ global keynote speakers.\n• **High-Impact Networking Lounges**: Connect with pre-qualified buyers and strategic venture partners.\n\n> "Join over 5,000+ registered delegates driving the future of global trade and industrial transformation in ${city}."`;

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
    if (formData.description && formData.description.length > 50) score += 20;
    if (formData.bannerUrl) score += 15;
    if (formData.venueName && formData.city) score += 10;
    if (formData.metaTitle && formData.metaDescription) score += 10;
    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore();

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form Submission
  const handleSubmitEvent = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const categoriesArray = [formData.category, formData.industry].filter(Boolean);
      const payload = {
        title: formData.title || 'Untitled Expo Event',
        slug: formData.slug || `expo-event-${Date.now()}`,
        description: formData.description || 'Description provided during onboarding.',
        banner: formData.bannerUrl,
        venue: formData.venueName || 'Main Exhibition Hall',
        city: formData.city || 'New Delhi',
        country: formData.country,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate || new Date(Date.now() + 86400000 * 2).toISOString(),
        timings: formData.timings,
        categories: categoriesArray,
        status: 'draft',
        orgName: formData.orgName,
        orgEmail: formData.orgEmail,
        orgPhone: formData.orgPhone,
        orgWebsite: formData.orgWebsite,
        orgDesc: formData.orgDesc,
        orgLogo: formData.orgLogo,
        schedules: formData.schedules,
        sponsorsList: formData.sponsorsList,
        faqsList: formData.faqsList,
        contactShortcode: formData.contactShortcode,
        // Ticketing data — server auto-creates a Ticket tier from this
        isFreeEvent: formData.isFreeEvent,
        paidTicketPrice: formData.isFreeEvent ? 0 : (formData.paidTicketPrice || 0),
        seo: {
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription
        }
      };

      if (!accessToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.post(`${API_URL}/events`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setIsSubmitted(true);
      setCurrentStep(8);
    } catch (err) {
      console.error('Submission error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to submit event';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner: Progress Stepper & Autosave Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            {/* <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-1">
              <Sparkles className="h-3.5 w-3.5" /> 10times Style Onboarding Wizard
            </span> */}
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Event & Organizer Onboarding
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {currentStep} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[currentStep - 1].title}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(formData.title || currentStep > 1) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to discard this draft and start fresh?')) {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('visitexpo_wizard_draft');
                    }
                    window.location.href = '/events/wizard';
                  }
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-red-500 px-2.5 py-1.5 rounded-lg border border-border hover:border-red-500/30 bg-muted/20 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Discard draft and start fresh"
              >
                Discard Draft
              </button>
            )}

            {/* Autosave / Save Draft Button */}
            <button
              type="button"
              onClick={handleManualSaveDraft}
              disabled={isSaving}
              title="Click to save draft now"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted active:scale-95 px-3 py-1.5 rounded-lg border border-border transition-all cursor-pointer hover:border-primary/50 shadow-2xs"
            >
              <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin text-primary' : 'text-emerald-500'}`} />
              <span>{isSaving ? 'Saving Draft...' : `Autosaved at ${lastAutosaved}`}</span>
            </button>
          </div>
        </div>

        {/* Stepper Bar */}
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
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
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
      </div>

      {/* STEP CONTENT PANELS */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        
        {/* STEP 1: WELCOME & ACTION CHOICE */}
        {currentStep === 1 && (
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
                className="group relative rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-transparent p-6 hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
                    <Sparkles className="h-6 w-6" />
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
                  <span>Start Event Wizard</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option B: Claim Existing Event */}
              <div
                onClick={() => router.push('/events/claim')}
                className="group relative rounded-2xl border-2 border-border bg-card p-6 hover:border-foreground/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
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
        )}

        {/* STEP 2: BASIC DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Step 2: Basic Event Information
                </h3>
                <p className="text-xs text-muted-foreground">Provide core identity and taxonomy for your expo.</p>
              </div>
              {/* <button
                type="button"
                onClick={generateAiDescription}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
              >
                <Sparkles className={`h-4 w-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                {isAiGenerating ? 'Generating AI Description...' : 'AI Assist: Generate Description'}
              </button> */}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Event Name / Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleTitleBlur}
                  placeholder="E.g. India International Tech & AI Summit 2026"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                    onChange={handleChange}
                    placeholder="india-tech-ai-summit-2026"
                    className="w-full rounded-r-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Primary Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.keys(CATEGORY_SUBSECTORS).map(catKey => (
                    <option key={catKey} value={catKey}>
                      {catKey}
                    </option>
                  ))}
                </select>
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
                      <select
                        value={selectValue}
                        onChange={handleSubSectorChange}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {currentSubSectors.map(sub => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="CUSTOM">+ Custom Sub-Sector...</option>
                      </select>

                      {(isCustomIndustry || (!isPreset && formData.industry !== '')) && (
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Enter custom industry sub-sector..."
                          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Event Description *
                </label>
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                placeholder="Describe the main highlights, target visitor profiles, exhibitor benefits, and key conference themes..."
                rows={6}
              />
            </div>
          </div>
        )}

        {/* STEP 3: DATE & VENUE */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Step 3: Dates, Timings & Venue Location
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
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={getTimingParts(formData.timings).end}
                    onChange={(e) => {
                      const { start } = getTimingParts(formData.timings);
                      handleTimingChange(start, e.target.value);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="E.g. Pragati Maidan Exhibition Complex (Hall 7-10)"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
        )}

        {/* STEP 4: ORGANIZER PROFILE SETUP */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Step 4: Organizer Profile Setup
              </h3>
              <p className="text-xs text-muted-foreground">Build trust with corporate attendees & exhibitors.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Organization / Business Name *
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  name="orgWebsite"
                  value={formData.orgWebsite}
                  onChange={handleChange}
                  placeholder="https://globaltechevents.com"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="orgEmail"
                  value={formData.orgEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Hotline Phone *
                </label>
                <input
                  type="text"
                  name="orgPhone"
                  value={formData.orgPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Organizer Logo & Description */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-1 space-y-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Organizer Logo (.png)
                </label>
                <div className="relative border border-dashed border-border rounded-xl p-4 text-center bg-background hover:border-primary transition-colors cursor-pointer min-h-[110px] flex items-center justify-center">
                  <input
                    type="file"
                    onChange={handleOrgLogoUpload}
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {formData.orgLogo ? (
                    <img src={formData.orgLogo} alt="Org Logo" className="mx-auto max-h-16 object-contain" />
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Click to upload logo</div>
                  )}
                </div>
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
        )}

        {/* STEP 5: MEDIA UPLOAD */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Step 5: Media Upload & Promotional Assets
              </h3>
              <p className="text-xs text-muted-foreground">Upload 1920x1080 banner, gallery photos, brochure PDF & promo video.</p>
            </div>

            {/* Main Cover Banner Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase">
                Event Main Banner Cover (Recommended: 1920 x 1080 px) *
              </label>
              <div 
                onClick={triggerFileInput}
                className="relative rounded-2xl border-2 border-dashed border-border p-6 bg-muted/10 text-center hover:border-primary transition-colors cursor-pointer"
              >
                <input
                  type="file"
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
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
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
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
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
        )}

        {/* STEP 6: TICKETING & REGISTRATION FORM */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" /> Step 6: Ticketing & Visitor Registration Setup
              </h3>
              <p className="text-xs text-muted-foreground">Configure registration rules and visitor data collection fields.</p>
            </div>

            {/* Free vs Paid Toggle */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                onClick={() => setFormData(prev => ({ ...prev, isFreeEvent: true }))}
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

            {!formData.isFreeEvent && (
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Ticket Price per Attendee (INR ₹)
                </label>
                <input
                  type="number"
                  name="paidTicketPrice"
                  value={formData.paidTicketPrice}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Form Fields selector */}
            <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Registration Form Required Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Full Name', 'Email Address', 'Mobile Number', 'Company / Org', 'Designation', 'Industry Sector', 'City'].map((field, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {field}
                  </span>
                ))}
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
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Date Value</label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={e => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
        )}

        {/* STEP 7: PREVIEW & SEO CHECK */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Step 7: Event Preview & Pre-Publish SEO Analysis
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
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                      Pending Review
                    </span>
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
                    { label: 'Event Banner Uploaded', pass: !!formData.bannerUrl },
                    { label: 'Start & End Dates Set', pass: !!formData.startDate && !!formData.endDate },
                    { label: 'Venue Location Confirmed', pass: !!formData.venueName && !!formData.city },
                    { label: 'Organizer Profile Complete', pass: !!formData.orgName && !!formData.orgEmail },
                    { label: 'Visitor Form Configured', pass: true },
                    { label: 'SEO Title & Description', pass: !!formData.metaTitle }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/60 last:border-0">
                      <span className="text-foreground">{item.label}</span>
                      {item.pass ? (
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
        )}

        {/* STEP 8: SUBMIT & MODERATION WORKFLOW */}
        {currentStep === 8 && (
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Go to Organizer Dashboard
              </Link>
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-all"
              >
                Onboard Another Event
              </button>
            </div>
          </div>
        )}

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
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'opacity-0 cursor-default'
                    : 'border border-border bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <ArrowLeft className="h-4 w-4" /> Previous Step
              </button>

              {currentStep === 7 ? (
                <button
                  onClick={handleSubmitEvent}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Event for Moderation'} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all"
                >
                  Continue to Next Step <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
