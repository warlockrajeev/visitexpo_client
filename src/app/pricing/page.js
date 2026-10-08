'use client';

/**
 * @file pricing/page.js
 * @description Official VisitExpo Organizer Pricing Plans, Comparison Matrix, and Growth Top-ups.
 * Clean, modern white theme matching VisitExpo design system:
 * Pure white canvas, dark text (zinc-900), subtle borders (zinc-200),
 * VisitExpo signature yellow (#FFCC00), and crisp interactive elements.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import { useAuth } from '../../context/AuthContext.js';
import { isCorporateEmail } from '../../utils/emailValidator.js';
import {
  Check,
  X,
  CreditCard,
  Zap,
  ShieldCheck,
  Building,
  Target,
  Ticket,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Award,
  Globe,
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Share2,
  Flame,
  BadgeCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function PricingPage() {
  const { user, updateUser } = useAuth();

  // Billing Cycle Switcher: 'quarterly' or 'yearly'
  const [billingCycle, setBillingCycle] = useState('yearly');

  // Work email domain checker state
  const [emailCheckInput, setEmailCheckInput] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState(null);

  // My current plan & Free plan activation state
  const [myPlan, setMyPlan] = useState(null);
  const [publicFreePlan, setPublicFreePlan] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Selected growth service filter
  const [growthCategory, setGrowthCategory] = useState('all');

  // Modal State for Plan Inquiries & Upgrades
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState({
    id: 'starter',
    name: 'Organizer Starter',
    cycle: 'yearly'
  });
  const [selectedGrowthService, setSelectedGrowthService] = useState(null);

  // Form State
  const [formName, setFormName] = useState(user?.name || '');
  const [formOrg, setFormOrg] = useState(user?.organization?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');
  const [formCity, setFormCity] = useState('');
  const [formEventType, setFormEventType] = useState('Trade Show / B2B');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Fetch active plans and user plan status on load
  useEffect(() => {
    axios
      .get(`${API_URL}/plans`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const free = res.data.data.find((p) => p.planId === 'free');
          if (free) setPublicFreePlan(free);
        }
      })
      .catch(() => {});

    if (user) {
      axios
        .get(`${API_URL}/plans/my-plan`)
        .then((res) => {
          if (res.data?.success) {
            setMyPlan(res.data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const generalEmailPrice = myPlan?.generalEmailPrice ?? publicFreePlan?.pricing?.generalEmailPrice ?? 1499;
  const isGeneralFree = Number(generalEmailPrice) === 0;

  const isUserCorporate =
    myPlan?.isCorporate ?? (user?.emailType === 'corporate' || isCorporateEmail(user?.email));
  const isUserPlanActive = myPlan?.isPlanActive ?? (user?.isPlanActive && user?.isVerified);

  // Handle Free Organizer General Email Activation payment (₹1,499)
  const handleActivateGeneralPlan = async () => {
    if (!user) {
      window.location.href = '/login?role=organizer&signup=true';
      return;
    }
    setIsProcessingPayment(true);
    try {
      const res = await axios.post(`${API_URL}/plans/activate-free-plan`, {
        transactionId: isGeneralFree ? `FREE_PROMO_${Date.now()}` : `TXN_PAGE_${Date.now()}`
      });
      if (res.data?.success) {
        if (updateUser && res.data.user) {
          updateUser(res.data.user);
        }
        setIsPayModalOpen(false);
        await Swal.fire({
          icon: 'success',
          title: 'Plan Activated Successfully!',
          text: res.data.message || (isGeneralFree 
            ? 'Your Free Organizer Plan has been activated with ₹0 charge. Your organizer dashboard is fully unlocked.' 
            : 'Your Free Organizer Plan is now active. Your organizer dashboard is fully unlocked.'),
          confirmButtonColor: '#FFCC00',
          confirmButtonText: 'Go to Dashboard'
        });
        window.location.href = '/dashboard';
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Activation Failed',
        text: err.response?.data?.message || 'Could not complete plan activation. Please try again.'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle corporate email validation checker
  const handleCheckEmail = (e) => {
    e.preventDefault();
    if (!emailCheckInput.trim()) {
      setEmailCheckResult(null);
      return;
    }
    const email = emailCheckInput.trim().toLowerCase();
    const domain = email.split('@')[1];
    if (!domain || !email.includes('.')) {
      setEmailCheckResult({ valid: false, message: 'Please enter a valid email address.' });
      return;
    }

    const freeProviders = [
      'gmail.com',
      'yahoo.com',
      'yahoo.co.in',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'rediffmail.com',
      'zoho.com',
      'aol.com',
      'proton.me',
      'protonmail.com'
    ];

    if (freeProviders.includes(domain)) {
      if (isGeneralFree) {
        setEmailCheckResult({
          isCorporate: false,
          domain,
          message: `Personal email detected (@${domain}). Special Platform Offer: No charge (₹0 FREE)! You can register and activate your organizer account without any fee.`
        });
      } else {
        setEmailCheckResult({
          isCorporate: false,
          domain,
          message: `Personal email detected. Registration fee is ₹${generalEmailPrice.toLocaleString()} one-time. Use your corporate work domain (@yourcompany.com) for 100% FREE registration!`
        });
      }
    } else {
      setEmailCheckResult({
        isCorporate: true,
        domain,
        message: `Corporate domain (@${domain}) verified! You qualify for 100% FREE Organizer Registration (₹0).`
      });
    }
  };

  // Open modal with specific plan
  const handleSelectPlan = (planId, planName, serviceName = null) => {
    setSelectedPlanForModal({
      id: planId,
      name: planName,
      cycle: billingCycle
    });
    setSelectedGrowthService(serviceName);
    if (!formName && user?.name) setFormName(user.name);
    if (!formEmail && user?.email) setFormEmail(user.email);
    if (!formPhone && user?.phone) setFormPhone(user.phone);
    if (!formOrg && user?.organization?.name) setFormOrg(user.organization.name);
    setIsModalOpen(true);
  };

  // Submit Inquiry Form
  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Please enter your Name, Email, and Phone number.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        planId: selectedPlanForModal.id,
        planName: selectedPlanForModal.name,
        billingCycle: selectedPlanForModal.cycle,
        organizerName: formName,
        organizationName: formOrg || 'Individual Organizer',
        email: formEmail,
        phone: formPhone,
        city: formCity,
        eventType: formEventType,
        selectedGrowthServices: selectedGrowthService ? [selectedGrowthService] : [],
        message: formMessage
      };

      const res = await axios.post(`${API_URL}/plans/inquire`, payload);

      if (res.data?.success) {
        setIsModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Inquiry Received!',
          html: `<p class="text-sm text-zinc-700">Thank you, <strong>${formName}</strong>. Our exhibition partnership desk has received your request for <strong>${selectedPlanForModal.name}</strong>.</p><p class="text-xs text-zinc-500 mt-2">A dedicated organizer manager will reach out within 4 business hours.</p>`,
          confirmButtonColor: '#FFCC00',
          confirmButtonText: '<span style="color: #000; font-weight: bold;">Great, Thank You</span>'
        });
        setFormMessage('');
      }
    } catch (err) {
      console.error('Inquiry submission error', err);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.response?.data?.message || 'Could not submit your inquiry. Please call +91 93236 77688.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 13 Official Growth Services
  const GROWTH_SERVICES = [
    {
      id: 'google_listing',
      name: 'Google Listing',
      category: 'digital',
      pricing: 'Paid separately / Custom',
      desc: 'Local schema & Google Knowledge Panel integration to dominate city event searches.',
      icon: Globe
    },
    {
      id: 'paid_lead_gen_smo',
      name: 'Paid Lead Generation / SMO',
      category: 'digital',
      pricing: 'Point-wise / Campaign',
      desc: 'Targeted B2B buyer and exhibitor lead capture across LinkedIn, Instagram & Meta ads.',
      icon: Target
    },
    {
      id: 'seo_digital_marketing',
      name: 'SEO / Digital Marketing',
      category: 'digital',
      pricing: 'Point-wise price uses',
      desc: 'High-authority search engine optimization targeting high-intent industry keywords.',
      icon: TrendingUp
    },
    {
      id: 'ai_promotion',
      name: 'AI Promotion',
      category: 'digital',
      pricing: 'Point-wise price uses',
      desc: 'Algorithmic buyer-seller matchmaking and smart AI attendee recommendations.',
      icon: Zap
    },
    {
      id: 'sms_promotion',
      name: 'SMS Promotion',
      category: 'outreach',
      pricing: 'Point-wise price uses',
      desc: 'DLT-compliant targeted SMS blasts sent directly to curated trade buyers in your hub.',
      icon: Phone
    },
    {
      id: 'whatsapp_broadcast',
      name: 'WhatsApp Broadcast Promotion',
      category: 'outreach',
      pricing: 'Point-wise price uses',
      desc: 'Official WhatsApp Business API broadcasts with rich media, PDF brochures & RSVP buttons.',
      icon: MessageSquare
    },
    {
      id: 'email_promotion',
      name: 'Email Promotion',
      category: 'outreach',
      pricing: 'Point-wise price uses',
      desc: 'Dedicated HTML newsletters delivered to segmented VisitExpo trade subscribers.',
      icon: Mail
    },
    {
      id: 'ivr_promotion',
      name: 'IVR Promotion',
      category: 'outreach',
      pricing: 'Point-wise price uses',
      desc: 'Automated interactive voice calling with personalized audio invites and 1-key confirmation.',
      icon: Radio
    },
    {
      id: 'push_notifications',
      name: 'VisitExpo Push Notifications',
      category: 'platform',
      pricing: 'Starting from ₹1,000',
      desc: 'Instant mobile & web push notifications delivered to active registered trade visitors.',
      icon: Zap
    },
    {
      id: 'website_banner_popup',
      name: 'Website Banner / Popup',
      category: 'platform',
      pricing: 'Point-wise / Weekly',
      desc: 'Prime homepage hero placements and high-conversion category exit banners.',
      icon: Layers
    },
    {
      id: 'side_expo_display_search',
      name: 'Side Expo Display in Search',
      category: 'platform',
      pricing: 'Point-wise / Fortnightly',
      desc: 'Always-in-view sidebar banner displayed when delegates search events in your category.',
      icon: Search
    },
    {
      id: 'top_expo_display',
      name: 'Top Expo Display',
      category: 'platform',
      pricing: 'Point-wise / Weekly',
      desc: '#1 pinned featured position on city and sector search directories with glowing badge.',
      icon: Award
    },
    {
      id: 'member_external_audience',
      name: 'Member + External Audience Promotion',
      category: 'syndicated',
      pricing: 'Paid separately; targeting rules tailored',
      desc: 'Syndicated promotion combining VisitExpo buyers with external audited trade councils.',
      icon: Users
    }
  ];

  const filteredGrowthServices =
    growthCategory === 'all'
      ? GROWTH_SERVICES
      : GROWTH_SERVICES.filter((s) => s.category === growthCategory);

  // Comparison Matrix Rows
  const COMPARISON_ROWS = [
    {
      group: 'Lead Intelligence & CRM',
      items: [
        {
          label: 'Detailed Lead Access',
          free: 'Masked (Counts & volume visible)',
          freeStatus: 'limited',
          starter: 'Full Unlocked',
          starterStatus: 'ok',
          enterprise: 'Full + Advanced',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Lead CRM',
          free: 'Basic operational counters',
          freeStatus: 'limited',
          starter: 'Basic operational CRM',
          starterStatus: 'ok',
          enterprise: 'Advanced CRM + Developer API',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Lead Export (CSV / Excel)',
          free: 'Not Available',
          freeStatus: 'no',
          starter: 'Not Available',
          starterStatus: 'no',
          enterprise: 'Unlimited Export',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Lead Search & Filtering',
          free: 'Basic',
          freeStatus: 'limited',
          starter: 'Ok',
          starterStatus: 'ok',
          enterprise: 'Advanced Multi-Filter',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Visitor / Exhibitor / Vendor Leads',
          free: 'Masked',
          freeStatus: 'limited',
          starter: 'Unlocked',
          starterStatus: 'ok',
          enterprise: 'Full + Analytics',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Venue / Designer / Organizer Leads',
          free: 'Masked',
          freeStatus: 'limited',
          starter: 'Unlocked',
          starterStatus: 'ok',
          enterprise: 'Full + Analytics + Search Database',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Ticket Platform & Expo Mgmt Leads',
          free: 'Masked',
          freeStatus: 'limited',
          starter: 'Unlocked',
          starterStatus: 'ok',
          enterprise: 'Full + Analytics',
          enterpriseStatus: 'adv'
        }
      ]
    },
    {
      group: 'Ticketing & Commerce',
      items: [
        {
          label: 'Ticket Creation & Listings',
          free: 'Min 1 to 10 demand activation',
          freeStatus: 'ok',
          starter: 'Unlocked (All tiers)',
          starterStatus: 'ok',
          enterprise: 'Unlocked (Unlimited tiers)',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Ticket Demand Test Model',
          free: '1 / 10 nominal token request model',
          freeStatus: 'ok',
          starter: 'Included',
          starterStatus: 'ok',
          enterprise: 'Included',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Full Paid Ticket Selling',
          free: 'Not included (Paid plan unlocked)',
          freeStatus: 'no',
          starter: 'Unlocked',
          starterStatus: 'ok',
          enterprise: 'Advanced / Private Gateway Integration',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Payment Gateway Integration',
          free: 'Not included',
          freeStatus: 'no',
          starter: 'Ok (Direct integrated)',
          starterStatus: 'ok',
          enterprise: 'Ok (Multi-Gateway + Custom Merchant ID)',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Ticket Sales Analytics',
          free: 'Demand stats only',
          freeStatus: 'limited',
          starter: 'Basic Analytics',
          starterStatus: 'ok',
          enterprise: 'Advanced Real-time Analytics',
          enterpriseStatus: 'adv'
        }
      ]
    },
    {
      group: 'Operations, Claiming & Validation',
      items: [
        {
          label: 'Registration Fee',
          free: isGeneralFree
            ? '100% Free (Corporate & General Email)'
            : `Free for corporate / ₹${generalEmailPrice.toLocaleString()} general`,
          freeStatus: 'ok',
          starter: 'Included in subscription',
          starterStatus: 'ok',
          enterprise: 'Included in subscription',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Expo Claiming',
          free: 'Any number (Verification per expo, 3/day)',
          freeStatus: 'ok',
          starter: 'Any number (3/day)',
          starterStatus: 'ok',
          enterprise: 'Any number (VIP fast-track)',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Event Creation & Publishing',
          free: 'New, upcoming & prospective B2B/B2C',
          freeStatus: 'ok',
          starter: 'Unlimited',
          starterStatus: 'ok',
          enterprise: 'Unlimited',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Event Ownership Rule',
          free: 'Permitted on claimed/created expos only',
          freeStatus: 'ok',
          starter: 'Permitted on claimed/created expos only',
          starterStatus: 'ok',
          enterprise: 'Permitted on claimed/created expos only',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Exhibitor Management Hub',
          free: 'Basic listing',
          freeStatus: 'limited',
          starter: 'Basic Hub',
          starterStatus: 'ok',
          enterprise: 'Advance Portal & Space Allocation',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Proposed Expo Validation Campaign',
          free: '₹4,999 per proposed event',
          freeStatus: 'paid',
          starter: 'Limited allowance included',
          starterStatus: 'ok',
          enterprise: 'Multiple Events Included',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Interest & Demand Analysis',
          free: 'Basic volume & inquiry counts',
          freeStatus: 'limited',
          starter: 'Basic B2B/B2C reports',
          starterStatus: 'ok',
          enterprise: 'Detailed category-wise & Advance analysis',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Active Events Capacity',
          free: 'Unlimited',
          freeStatus: 'ok',
          starter: 'Unlimited',
          starterStatus: 'ok',
          enterprise: 'Unlimited',
          enterpriseStatus: 'adv'
        }
      ]
    },
    {
      group: 'Promotion, Search & Support',
      items: [
        {
          label: 'Organic Visit Expo Positioning',
          free: 'Organic search & directory reach',
          freeStatus: 'ok',
          starter: 'Organic + search tags',
          starterStatus: 'ok',
          enterprise: 'Organic + featured boost',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Marketing Campaigns',
          free: 'Growth Plan (Paid separately)',
          freeStatus: 'paid',
          starter: 'Growth Plan (Paid separately)',
          starterStatus: 'paid',
          enterprise: 'Growth Plan (Paid separately)',
          enterpriseStatus: 'paid'
        },
        {
          label: 'Priority Search / Featured Placement',
          free: 'No',
          freeStatus: 'no',
          starter: 'No',
          starterStatus: 'no',
          enterprise: 'Available (#1 Top Display & Side)',
          enterpriseStatus: 'adv'
        },
        {
          label: 'Customer Support SLA',
          free: 'Standard Community & Email',
          freeStatus: 'limited',
          starter: 'Priority Email & Ticket Support',
          starterStatus: 'ok',
          enterprise: 'Faster Priority (Dedicated Account Director)',
          enterpriseStatus: 'adv'
        }
      ]
    }
  ];

  // FAQs
  const PRICING_FAQS = [
    {
      q: 'Why is Free Organizer registration complimentary for corporate email but ₹1,499 for general email?',
      a: 'VisitExpo enforces high trust standards for trade exhibitions. Corporate business emails (@yourcompany.com) are automatically verified against business registries for free. General personal email domains (like Gmail, Yahoo, Hotmail) require a nominal ₹1,499 verification fee to eliminate spam listings and maintain platform credibility.'
    },
    {
      q: 'How does the Ticket Demand Test (1 / 10 token model) work in the Free tier?',
      a: 'Organizers on the Free tier can activate ticket listings with a 1/10 nominal token request model. This allows you to measure real audience demand and ticket purchasing intent without needing a live payment gateway integration. Full ticket monetization with instant bank settlements unlocks on the Starter and Enterprise tiers.'
    },
    {
      q: 'What is masked in the Free Plan and how do I unlock full lead contact details?',
      a: 'Free organizers receive all inquiry alerts and visitor/exhibitor interest counts in real time. However, direct contact parameters (phone numbers, full emails, and designation profiles) are masked. Upgrading to Organizer Starter or Enterprise instantly unlocks unmasked attendee profiles, exhibitor inquiries, and vendor contacts.'
    },
    {
      q: 'What is the Proposed / Prospective Event Research validation for ₹4,999?',
      a: 'Before signing expensive venue leases or marketing contracts, organizers can post a prospective expo idea on VisitExpo. For ₹4,999, we run a targeted B2B/B2C interest campaign across your target industry to measure genuine buyer footfall and exhibitor appetite, delivering a comprehensive demand validation report.'
    },
    {
      q: 'How does the Organizer Growth top-up plan work?',
      a: 'Organizer Growth is an on-demand top-up engine starting from ₹1,000 to unlimited. You purchase marketing points and deploy them across 13 promotional channels—including WhatsApp broadcasts, SMS campaigns, Google search indexing, AI matchmaking, and top-ranking search placements—with zero monthly lock-in.'
    },
    {
      q: 'Can I upgrade from Starter to Enterprise mid-quarter?',
      a: 'Yes! You can upgrade your plan at any time. Any remaining days on your current quarter or annual subscription are prorated and credited directly toward your Enterprise package.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#FFCC00] selection:text-black flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-900 font-bold">Pricing Plans</span>
          </nav>
        </div>

        {/* ========================================================= */}
        {/* HERO SECTION (CLEAN WHITE CANVAS) */}
        {/* ========================================================= */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-4 pb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>VisitExpo Official Organizer Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 max-w-4xl mx-auto leading-[1.15]">
            Predictable, High-ROI Plans Built for Every Stage of Expo Organizing
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            From initial idea validation and token demand testing to multi-city enterprise trade shows. Pay for what you need, unlock actionable leads, and scale when you grow.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 shadow-inner">
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'quarterly'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Quarterly Billing
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#FFCC00] text-black shadow-md font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>Annual Billing</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  billingCycle === 'yearly'
                    ? 'bg-black text-[#FFCC00]'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Save 17%
              </span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4 CORE PRICING CARDS (PURE WHITE WITH CRISP BORDERS) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {/* ---------------- CARD 1: FREE ORGANIZER ---------------- */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Free Forever
                  </span>
                  <Building className="h-5 w-5 text-zinc-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-950">Free Organizer</h3>
                  <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">
                    {isGeneralFree
                      ? 'Free for corporate email · No charge for general email (₹0 Free)'
                      : `Free for corporate email · Paid for general email ₹${generalEmailPrice.toLocaleString()}/-`}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-zinc-700 font-semibold block">Work / Corporate Email:</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Automatic Instant Activation</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600 font-mono">₹0</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs pt-2 border-t border-zinc-200">
                    <div>
                      <span className="text-zinc-700 font-semibold block">General / Personal Email:</span>
                      <span className={`text-[10px] font-medium ${isGeneralFree ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {isGeneralFree ? 'No Charge · Platform Offer' : 'One-Time Verification Fee'}
                      </span>
                    </div>
                    <div>
                      {isGeneralFree ? (
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-xs line-through text-zinc-400 font-mono">₹1,499</span>
                          <span className="text-2xl font-black text-emerald-600 font-mono">₹0</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-zinc-900 font-mono">₹{generalEmailPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 pt-1 leading-tight">
                    {isGeneralFree
                      ? 'Special offer: Zero activation fee for personal domains (@gmail, @yahoo, etc). 100% Free!'
                      : 'One-time activation for personal domains (@gmail, @yahoo, etc). Zero recurring subscription fees.'}
                  </p>
                </div>

                {/* Status Indicator if User Logged In */}
                {user?.role === 'organizer' && (
                  <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    isUserCorporate || isUserPlanActive || isGeneralFree
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {isUserCorporate || isUserPlanActive ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Plan Active: {isUserCorporate ? 'Corporate Domain (₹0 Free)' : isGeneralFree ? 'Personal Email (No Charge ₹0)' : `Personal Email (₹${generalEmailPrice.toLocaleString()} Paid)`}</span>
                      </>
                    ) : isGeneralFree ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Special Offer: No charge for general mail! Click below to activate free.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Payment Pending: Personal email requires ₹{generalEmailPrice.toLocaleString()} activation</span>
                      </>
                    )}
                  </div>
                )}

                {/* Highlights */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Core Capabilities:
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Expo Claiming:</strong> Any number of expos (verification per expo, max 3/day)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Event Creation:</strong> Publish new, upcoming &amp; prospective B2B/B2C expos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Token Demand Test:</strong> 1/10 nominal token request model</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Lead Intelligence:</strong> Visible inquiry counts &amp; volume (masked details)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Organic Positioning:</strong> Directory visibility on VisitExpo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Prospective Validation:</strong> ₹4,999 per proposed event</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2">
                {user?.role === 'organizer' ? (
                  isUserCorporate || isUserPlanActive ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Plan Active · Open Dashboard</span>
                    </Link>
                  ) : isGeneralFree ? (
                    <button
                      onClick={handleActivateGeneralPlan}
                      disabled={isProcessingPayment}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Activating Plan...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          <span>Activate Free Plan (₹0 No Charge)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPayModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pay ₹{generalEmailPrice.toLocaleString()} &amp; Activate Plan</span>
                    </button>
                  )
                ) : user ? (
                  <Link
                    href="/login?role=organizer"
                    className="w-full py-3 rounded-xl border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition-all text-center block"
                  >
                    Switch to Organizer Account
                  </Link>
                ) : (
                  <Link
                    href="/login?role=organizer&signup=true"
                    className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Activate Free Organizer Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <p className="text-[10px] text-center text-zinc-400">
                  {user?.role === 'organizer'
                    ? isUserCorporate
                      ? 'Complimentary lifetime access for corporate domain'
                      : isUserPlanActive
                      ? 'Plan is active'
                      : isGeneralFree
                      ? 'No charge for general mail · Instant 100% Free activation'
                      : `One-time ₹${generalEmailPrice.toLocaleString()} activation fee required for personal email`
                    : isGeneralFree
                    ? '100% Free for all corporate & general email domains'
                    : `Free for corporate email (@company.com) · ₹${generalEmailPrice.toLocaleString()} for personal domains`}
                </p>
              </div>
            </div>

            {/* ---------------- CARD 2: ORGANIZER STARTER ---------------- */}
            <div className="rounded-3xl border-2 border-[#FFCC00] bg-white p-6 sm:p-7 shadow-xl shadow-amber-500/10 relative flex flex-col justify-between space-y-6">
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFCC00] text-black px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                <Flame className="h-3 w-3 fill-black" />
                <span>Most Popular for Active Expos</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                    Validated Operations
                  </span>
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-950">Organizer Starter</h3>
                  <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">
                    Operate validated events and unlock usable lead/ticket functionality
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-950 font-mono">
                      ₹{billingCycle === 'yearly' ? '49,999' : '14,999'}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      /{billingCycle === 'yearly' ? 'Year' : 'Quarter'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {billingCycle === 'yearly'
                      ? 'Save ₹9,997 (Equivalent to ₹4,166 / mo)'
                      : 'Billed every 3 months (₹14,999 / Qtr)'}
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Everything in Free, plus:
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Detailed Lead Access:</strong> Full unmasked contacts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Lead CRM:</strong> Basic operational CRM pipeline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Visitor &amp; Exhibitor Leads:</strong> Fully unlocked</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Paid Ticket Selling:</strong> Unlocked with integrated payment gateway</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Analytics:</strong> Basic ticket sales &amp; visitor conversion stats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Proposed Validation:</strong> Limited allowance included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Support:</strong> Priority Organizer Support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2">
                <button
                  onClick={() => handleSelectPlan('starter', 'Organizer Starter')}
                  className="w-full py-3 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Choose Starter Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <p className="text-[10px] text-center text-zinc-400">
                  Instant activation &amp; payment gateway unlock
                </p>
              </div>
            </div>

            {/* ---------------- CARD 3: ORGANIZER ENTERPRISE ---------------- */}
            <div className="rounded-3xl border border-indigo-200 bg-white p-6 sm:p-7 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Enterprise Scale
                  </span>
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-950">Organizer Enterprise</h3>
                  <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">
                    Large organizers managing multiple expos and enterprise operations
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-950 font-mono">
                      ₹{billingCycle === 'yearly' ? '2,99,999' : '89,999'}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      /{billingCycle === 'yearly' ? 'Year' : 'Quarter'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    {billingCycle === 'yearly'
                      ? 'Save ₹59,997 (Equivalent to ₹24,999 / mo)'
                      : 'Billed every 3 months (₹89,999 / Qtr)'}
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    Everything in Starter, plus:
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Advanced CRM + API:</strong> Full REST API keys for your ERP/CRM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Unlimited Lead Export:</strong> CSV, Excel, webhooks with no caps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Partner Database:</strong> Searchable database of venues &amp; contractors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Private Gateway:</strong> Custom payment gateway integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Proposed Validations:</strong> Multiple events included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Featured Placement:</strong> Pinned priority placement on VisitExpo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Dedicated VIP Support:</strong> Assigned Account Director</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2">
                <button
                  onClick={() => handleSelectPlan('enterprise', 'Organizer Enterprise')}
                  className="w-full py-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Choose Enterprise Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <p className="text-[10px] text-center text-zinc-400">
                  Custom billing &amp; GST tax invoices supported
                </p>
              </div>
            </div>

            {/* ---------------- CARD 4: ORGANIZER GROWTH ---------------- */}
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-7 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    On-Demand Top-Up
                  </span>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-950">Organizer Growth</h3>
                  <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">
                    Top-up plan start from 1k to unlimited · Point wise price uses
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-950 font-mono">From ₹1k</span>
                    <span className="text-xs text-zinc-500 font-medium">to Unlimited</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Pay-as-you-use promotional points
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    13 High-Impact Marketing Channels:
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Google Listing:</strong> Knowledge Panel &amp; rich event indexing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Paid Lead Generation:</strong> SMO &amp; verified B2B buyer campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Direct Outreach:</strong> WhatsApp API &amp; SMS blasts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Smart Promotion:</strong> AI-matchmaking &amp; automated IVR calls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Platform Spotlight:</strong> Push alerts, banners &amp; popups</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Search Spotlight:</strong> #1 Top Expo Display in directory</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2">
                <a
                  href="#growth-catalog"
                  className="w-full py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Explore Growth Services</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <p className="text-[10px] text-center text-zinc-400">
                  Available separately for all tiers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* INTERACTIVE WORK EMAIL VERIFICATION CALCULATOR (WHITE/LIGHT) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mt-16">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-6 sm:p-10 shadow-xs">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Instant Domain Eligibility Checker
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">
                Check If Your Domain Qualifies for 100% Free Organizer Access
              </h2>
              <p className="text-xs text-zinc-600">
                Corporate email domains (@yourcompany.com) are free forever. Personal email domains (@gmail, etc) pay a nominal ₹1,499 one-time registration.
              </p>

              <form onSubmit={handleCheckEmail} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your work email (e.g. name@acmeexpos.com)..."
                  value={emailCheckInput}
                  onChange={(e) => {
                    setEmailCheckInput(e.target.value);
                    if (!e.target.value) setEmailCheckResult(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none focus:border-[#FFCC00] shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-extrabold text-xs transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Verify Eligibility
                </button>
              </form>

              {emailCheckResult && (
                <div
                  className={`mt-4 p-4 rounded-2xl text-xs font-medium text-left flex items-start gap-3 border animate-fade-in ${
                    emailCheckResult.isCorporate
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {emailCheckResult.isCorporate ? (
                    <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">
                      {emailCheckResult.isCorporate ? 'Corporate Domain Verified!' : 'General Personal Domain'}
                    </div>
                    <p className="text-[11px] leading-relaxed">{emailCheckResult.message}</p>
                    {emailCheckResult.isCorporate && (
                      <button
                        onClick={() => handleSelectPlan('free', 'Free Organizer')}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-200/60 px-3 py-1 rounded-lg hover:bg-emerald-200 cursor-pointer"
                      >
                        Proceed to Free Registration &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PROPOSED EXPO VALIDATION SPOTLIGHT (₹4,999) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-16">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  <Compass className="h-3.5 w-3.5 text-amber-600" />
                  Proposed / Prospective Event Research Campaign
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                  Validate Your Next Expo Before Spending Millions on Venue Bookings
                </h2>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Post an expo or event idea and collect verified attendee and exhibitor interest before deciding whether to organize. Available for trade shows, industrial business events, Garba, entertainment conventions, and lifestyle exhibitions.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Price per validation</span>
                    <div className="text-xl font-black text-zinc-950 font-mono mt-0.5">₹4,999</div>
                    <span className="text-[10px] text-emerald-700 font-medium">B2B &amp; B2C validation</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Included Allowance</span>
                    <div className="text-sm font-bold text-zinc-900 mt-1">Included in Starter &amp; Enterprise</div>
                    <span className="text-[10px] text-zinc-500">Limited or Multiple</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Deliverable</span>
                    <div className="text-sm font-bold text-zinc-900 mt-1">Audited Footfall Demand</div>
                    <span className="text-[10px] text-zinc-500">Buyer intent report</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 text-center md:text-right">
                <button
                  onClick={() => handleSelectPlan('proposed_validation', 'Proposed Expo Validation Campaign')}
                  className="px-6 py-3.5 rounded-2xl bg-zinc-950 hover:bg-black text-white font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Book Validation for ₹4,999</span>
                  <ArrowRight className="h-4 w-4 text-[#FFCC00]" />
                </button>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Campaign launched within 24 hours of idea submission
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* COMPREHENSIVE FEATURE COMPARISON MATRIX (WHITE TABLE) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Full Feature Breakdown
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950">
              Compare Free, Starter &amp; Enterprise Side-by-Side
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Detailed breakdown of lead access, CRM tools, ticketing gateways, search ranking, and support SLAs.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 sticky top-0">
                    <th className="px-6 py-4 font-bold text-zinc-900 w-2/5">Capabilities &amp; Features</th>
                    <th className="px-5 py-4 font-bold text-zinc-900 w-1/5 text-center">Free Organizer</th>
                    <th className="px-5 py-4 font-bold text-amber-900 w-1/5 text-center bg-amber-50/50">
                      Starter Plan
                    </th>
                    <th className="px-5 py-4 font-bold text-indigo-900 w-1/5 text-center">
                      Enterprise Plan
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200">
                  {COMPARISON_ROWS.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr className="bg-zinc-100/70 font-bold text-[11px] text-zinc-700 uppercase tracking-wider">
                        <td colSpan={4} className="px-6 py-2.5">
                          {group.group}
                        </td>
                      </tr>

                      {group.items.map((item, iIdx) => (
                        <tr key={iIdx} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="px-6 py-3.5 font-semibold text-zinc-800">
                            {item.label}
                          </td>

                          {/* Free */}
                          <td className="px-5 py-3.5 text-center">
                            {item.freeStatus === 'no' ? (
                              <span className="text-zinc-300 font-bold">—</span>
                            ) : item.freeStatus === 'limited' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                                {item.free}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-700 font-medium">{item.free}</span>
                            )}
                          </td>

                          {/* Starter */}
                          <td className="px-5 py-3.5 text-center bg-amber-50/30">
                            {item.starterStatus === 'no' ? (
                              <span className="text-zinc-300 font-bold">—</span>
                            ) : item.starterStatus === 'paid' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                                {item.starter}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-950 font-bold">
                                <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>{item.starter}</span>
                              </span>
                            )}
                          </td>

                          {/* Enterprise */}
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-bold">
                              <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span>{item.enterprise}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ORGANIZER GROWTH SERVICES CATALOG (13 CHANNELS) */}
        {/* ========================================================= */}
        <section id="growth-catalog" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Organizer Growth Top-Up Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                13 High-Impact Marketing &amp; Footfall Channels
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl">
                Deploy flexible top-up credits starting from ₹1,000 to unlimited. Consume points as used across digital ads, direct messaging, voice broadcasting, and on-site spotlight displays.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200 overflow-x-auto shrink-0">
              {[
                { id: 'all', label: 'All (13)' },
                { id: 'digital', label: 'Digital & Ads' },
                { id: 'outreach', label: 'Direct Outreach' },
                { id: 'platform', label: 'Platform Spotlight' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setGrowthCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    growthCategory === cat.id
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGrowthServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                        {service.pricing}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-zinc-950">{service.name}</h4>
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">Point-wise uses</span>
                    <button
                      onClick={() => handleSelectPlan('growth', 'Organizer Growth', service.name)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-emerald-200"
                    >
                      <span>Book Top-up</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* FREQUENTLY ASKED QUESTIONS (WHITE ACCORDION) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mt-24">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Got Questions?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Frequently Asked Questions About Pricing
            </h2>
          </div>

          <div className="space-y-3">
            {PRICING_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm text-zinc-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-amber-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOTTOM CALL TO ACTION */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
          <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-8 sm:p-12 text-center text-white space-y-5 shadow-xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Accelerate Your Exhibition?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Join thousands of trade fairs, consumer expos, and business conferences connecting directly with buyers on VisitExpo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleSelectPlan('starter', 'Organizer Starter')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#FFCC00] text-black font-extrabold text-xs transition-all shadow-md cursor-pointer hover:bg-[#e6b800]"
              >
                Get Started with Starter (₹14,999/Qtr)
              </button>
              <a
                href="tel:+919323677688"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4 text-[#FFCC00]" />
                <span>Call Organizer Helpline: +91 93236 77688</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* FREE PLAN GENERAL EMAIL ACTIVATION PAYMENT MODAL (₹1,499) */}
      {/* ========================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-fade-in text-zinc-900">
            <div className="flex items-start justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Organizer Account Verification
                </span>
                <h3 className="text-lg font-bold text-zinc-950 mt-0.5">
                  Activate Free Organizer Plan
                </h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
              isGeneralFree
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              {isGeneralFree ? (
                <span>
                  <strong>🎉 Special Platform Promotion:</strong> Verification fee is currently <strong>waived (₹0 Free)</strong> for <span className="font-bold underline">{user?.email || 'your email'}</span>. You can activate your organizer account instantly with zero charge!
                </span>
              ) : (
                <span>
                  <strong>Personal Email Detected:</strong> Your account is registered with <span className="font-bold underline">{user?.email || 'a personal email'}</span>. To unlock your organizer dashboard and prevent unverified listings, a one-time verification fee of <strong>₹{generalEmailPrice.toLocaleString()}</strong> applies.
                </span>
              )}
            </div>

            {/* Bill Summary */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Free Organizer Plan (Lifetime)</span>
                <span className="font-semibold text-emerald-600">Included</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Personal Email Verification Fee</span>
                <span className="font-mono font-bold text-zinc-900">
                  {isGeneralFree ? '₹0.00 (Waived)' : `₹${generalEmailPrice.toLocaleString()}.00`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>GST (18%)</span>
                <span className="font-semibold text-zinc-500">
                  {isGeneralFree ? '₹0.00' : 'Inclusive'}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between items-baseline text-sm font-bold text-zinc-950">
                <span>Total Amount Due</span>
                <span className={`text-xl font-black font-mono ${isGeneralFree ? 'text-emerald-600' : 'text-zinc-950'}`}>
                  ₹{isGeneralFree ? '0' : generalEmailPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-600">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Instant organizer dashboard activation {isGeneralFree ? 'immediately' : 'upon payment'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Publish B2B/B2C expos &amp; claim up to 3 expos per day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{isGeneralFree ? 'Zero hidden fees or surprise renewals' : 'GST tax invoice provided with payment receipt'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleActivateGeneralPlan}
                className="px-6 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>{isGeneralFree ? 'Activating Plan...' : 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-black" />
                    <span>{isGeneralFree ? 'Activate Free (₹0) & Unlock Dashboard' : `Pay ₹${generalEmailPrice.toLocaleString()} & Unlock Dashboard`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INQUIRY / UPGRADE MODAL (WHITE CLEAN MODAL) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in text-zinc-900">
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Organizer Access Desk
                </span>
                <h3 className="text-xl font-bold text-zinc-950 mt-0.5">
                  {selectedPlanForModal.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedGrowthService
                    ? `Request service: ${selectedGrowthService}`
                    : `Selected cycle: ${selectedPlanForModal.cycle === 'yearly' ? 'Annual (Save 17%)' : 'Quarterly'}`}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Organization / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Trade Fairs Pvt Ltd"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Event Type</label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00] font-medium"
                  >
                    <option value="Trade Show / B2B">Trade Show / B2B</option>
                    <option value="Consumer Expo / B2C">Consumer Expo / B2C</option>
                    <option value="Garba / Cultural / Entertainment">Garba / Cultural / Festival</option>
                    <option value="Business Conference">Business Conference</option>
                    <option value="Prospective Event Validation">Prospective Event Validation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Additional Notes / Specific Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your upcoming exhibitions, footfall expectations, or requested top-up channels..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Official invoice with GST input tax credit provided for all paid plans.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
