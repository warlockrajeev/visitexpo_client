'use client';

/**
 * @file pricing/page.js
 * @description Official VisitExpo Organizer Pricing Plans, Comparison Matrix, and Growth Top-ups.
 * Clean, modern white theme matching VisitExpo design system:
 * Pure white canvas, dark text (zinc-900), subtle borders (zinc-200),
 * VisitExpo signature yellow (#FFCC00), and crisp interactive elements.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../../components/Navbar.js';
import Footer from '../../components/Footer.js';
import { useAuth } from '../../context/AuthContext.js';
import { isCorporateEmail, PUBLIC_EMAIL_DOMAINS } from '../../utils/emailValidator.js';
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
  BadgeCheck,
  Info,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';
import { calculateAnnualDiscountPercent } from '../../utils/pricing.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

// KeyDown helper to check if key is navigation/control
const isControlKey = (e) => {
  return (
    e.key === 'Backspace' ||
    e.key === 'Tab' ||
    e.key === 'Enter' ||
    e.key === 'Escape' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Delete' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  );
};

export default function PricingPage() {
  const { user, updateUser } = useAuth();

  // Billing Cycle Switcher: 'quarterly' or 'yearly'
  const [billingCycle, setBillingCycle] = useState('yearly');

  // Work email domain checker state
  const [emailCheckInput, setEmailCheckInput] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState(null);
  const [emailCheckError, setEmailCheckError] = useState('');
  const emailCheckTimeoutRef = useRef(null);

  const triggerEmailCheckError = (msg) => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    setEmailCheckError(msg);
    emailCheckTimeoutRef.current = setTimeout(() => {
      setEmailCheckError('');
    }, 2800);
  };

  // My current plan & Free plan activation state
  const [allPlans, setAllPlans] = useState([]);
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

  // Form State & Validation
  const [formName, setFormName] = useState(user?.name || '');
  const [formOrg, setFormOrg] = useState(user?.organization?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');
  const [formCity, setFormCity] = useState('');
  const [formEventType, setFormEventType] = useState('Trade Show / B2B');
  const [formMessage, setFormMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFieldWarning, setModalFieldWarning] = useState('');
  const warningTimeoutRef = useRef(null);

  const triggerModalWarning = (msg) => {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setModalFieldWarning(msg);
    warningTimeoutRef.current = setTimeout(() => {
      setModalFieldWarning('');
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, []);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Fetch active plans and user plan status on load
  useEffect(() => {
    axios
      .get(`${API_URL}/plans`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllPlans(res.data.data);
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
            if (updateUser && res.data.plan && (user.plan !== res.data.plan || !user.isPlanActive)) {
              updateUser({
                ...user,
                plan: res.data.plan,
                isPlanActive: res.data.isPlanActive,
                planStatus: res.data.planStatus
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user, updateUser]);

  // Synchronize authenticated user details into form state
  useEffect(() => {
    if (user) {
      if (user.name) setFormName(user.name);
      if (user.email) setFormEmail(user.email);
      if (user.phone) setFormPhone(user.phone);
      if (user.organization?.name) setFormOrg(user.organization.name);
    }
  }, [user]);

  const freePlan = allPlans.find((p) => p.planId === 'free') || publicFreePlan;
  const starterPlan = allPlans.find((p) => p.planId === 'starter');
  const enterprisePlan = allPlans.find((p) => p.planId === 'enterprise');
  const growthPlan = allPlans.find((p) => p.planId === 'growth');

  const starterQPrice = starterPlan?.pricing?.quarterlyPrice ?? 14999;
  const starterYPrice = starterPlan?.pricing?.yearlyPrice ?? 49999;
  const starterDiscount = calculateAnnualDiscountPercent(starterQPrice, starterYPrice);

  const enterpriseQPrice = enterprisePlan?.pricing?.quarterlyPrice ?? 39999;
  const enterpriseYPrice = enterprisePlan?.pricing?.yearlyPrice ?? 89999;
  const enterpriseDiscount = calculateAnnualDiscountPercent(enterpriseQPrice, enterpriseYPrice);

  const maxDiscount = Math.max(starterDiscount, enterpriseDiscount);

  const activePlanId = ((myPlan?.basePlan || myPlan?.subscription?.plan || myPlan?.plan || user?.basePlan || user?.plan || 'free') === 'growth' ? 'enterprise' : (myPlan?.basePlan || myPlan?.subscription?.plan || myPlan?.plan || user?.basePlan || user?.plan || 'free')).toLowerCase();
  const hasGrowthAddon = Boolean(user?.hasGrowthPlan || myPlan?.hasGrowthPlan);
  const isPlanActive = Boolean(myPlan?.isPlanActive ?? (user?.isPlanActive && user?.isVerified));
  const generalEmailPrice = myPlan?.generalEmailPrice ?? freePlan?.pricing?.generalEmailPrice ?? 1499;
  const isGeneralFree = Number(generalEmailPrice) === 0;

  const isUserCorporate =
    myPlan?.isCorporate ?? (user?.emailType === 'corporate' || isCorporateEmail(user?.email));
  const isUserPlanActive = isPlanActive;

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

  // Work email keystroke blocking
  const handleEmailCheckKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (e.key === ' ') {
      e.preventDefault();
      triggerEmailCheckError('Spaces are not allowed in work email address.');
      return;
    }
    if (!/^[a-zA-Z0-9@._+-]$/.test(e.key)) {
      e.preventDefault();
      triggerEmailCheckError(`Special symbols (${e.key}) are not allowed in email.`);
      return;
    }
  };

  // Work email sanitizer on change
  const handleEmailCheckChange = (e) => {
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/[^a-zA-Z0-9@._+-]/g, '');
    setEmailCheckInput(sanitized);
    if (!sanitized) {
      setEmailCheckResult(null);
      setEmailCheckError('');
    } else if (emailCheckError && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitized)) {
      setEmailCheckError('');
    }
  };

  // Handle corporate email validation checker
  const handleCheckEmail = (e) => {
    e.preventDefault();
    const raw = (emailCheckInput || '').trim();
    if (!raw) {
      setEmailCheckError('Please enter your work email address (e.g. name@acmeexpos.com).');
      setEmailCheckResult(null);
      return;
    }

    const email = raw.toLowerCase();

    // Strict email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailCheckError('Please enter a valid work email address (e.g. name@acmeexpos.com).');
      setEmailCheckResult(null);
      return;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
      setEmailCheckError('Please enter a complete email address with domain.');
      setEmailCheckResult(null);
      return;
    }

    const domain = parts[1].trim();
    // Validate domain structure: letters/numbers/hyphen, dot, TLD
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!domainRegex.test(domain)) {
      setEmailCheckError('Please enter a valid company domain (e.g. acmeexpos.com).');
      setEmailCheckResult(null);
      return;
    }

    // Clear error if valid
    setEmailCheckError('');

    const isPublic = PUBLIC_EMAIL_DOMAINS ? PUBLIC_EMAIL_DOMAINS.has(domain) : !isCorporateEmail(email);

    if (isPublic) {
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
          message: `Personal email detected (@${domain}). Registration fee is ₹${generalEmailPrice.toLocaleString()} one-time. Use your corporate work domain (@yourcompany.com) for 100% FREE registration!`
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
    const rawPlan = (user?.plan || 'free').toLowerCase();

    // Restriction: Growth plan is an add-on available ONLY to Starter or Enterprise organizers
    if (planId === 'growth' || (planName && planName.toLowerCase().includes('growth'))) {
      if (user && rawPlan === 'free') {
        Swal.fire({
          icon: 'warning',
          title: 'Base Plan Upgrade Required',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #4b5563;">
              <p style="margin-bottom: 10px;">The <strong>Organizer Growth Plan</strong> (including Web Push Notifications and all 13 marketing channels) is an exclusive add-on available only to organizers on the <strong>Starter</strong> or <strong>Enterprise</strong> plan.</p>
              <p style="margin-bottom: 10px; font-weight: 600; color: #111827;">Organizers on the Free Plan cannot take or purchase the Growth Plan directly.</p>
              <p style="color: #6b7280; font-size: 12px;">Please upgrade your base organizer plan to Starter or Enterprise to unlock Growth channels.</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: '#FF2E63',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'View Starter & Enterprise Plans',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            const el = document.getElementById('official-plans');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }
          }
        });
        return;
      }
    }

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
    setFormErrors({});
    setFormTouched({});
    setModalFieldWarning('');
    setIsModalOpen(true);
  };

  // Field-level Validator
  const validateField = (field, value) => {
    let error = '';
    const trimmed = (value || '').trim();

    switch (field) {
      case 'name':
        if (!trimmed) {
          error = 'Full Name is required.';
        } else if (trimmed.length < 2) {
          error = 'Full Name must be at least 2 characters.';
        } else if ((trimmed.match(/[a-zA-Z]/g) || []).length < 2) {
          error = 'Full Name must contain at least 2 letters.';
        } else if (!/^[a-zA-Z\s\.\'\-]{2,60}$/.test(trimmed)) {
          error = 'Please enter a valid full name (letters only).';
        }
        break;

      case 'email':
        if (!trimmed) {
          error = 'Email Address is required.';
        } else if (/\s/.test(value || '')) {
          error = 'Email address cannot contain spaces.';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
          error = 'Please enter a valid email address (e.g. name@company.com).';
        }
        break;

      case 'phone': {
        if (!trimmed) {
          error = 'Phone / WhatsApp number is required.';
        } else if (/[a-zA-Z]/.test(value || '')) {
          error = 'Phone number cannot contain letters or alphabets.';
        } else if (/^[-\)]/.test(trimmed)) {
          error = 'Phone number cannot start with a hyphen or parenthesis.';
        } else if (/-{2,}/.test(trimmed)) {
          error = 'Phone number cannot contain consecutive hyphens.';
        } else {
          const digits = trimmed.replace(/\D/g, '');
          if (digits.length < 10) {
            error = 'Phone number must have at least 10 digits.';
          } else if (digits.length > 15) {
            error = 'Phone number cannot exceed 15 digits.';
          } else if (!/^\+?[0-9][0-9\s\-()]{8,18}[0-9]$/.test(trimmed)) {
            error = 'Please enter a valid phone number (e.g. +91 98765 43210).';
          }
        }
        break;
      }

      case 'org':
        if (trimmed) {
          if (trimmed.length < 2) {
            error = 'Organization name must be at least 2 characters.';
          } else if (trimmed.length > 100) {
            error = 'Organization name cannot exceed 100 characters.';
          } else if ((trimmed.match(/[a-zA-Z0-9]/g) || []).length < 2) {
            error = 'Organization name must contain at least 2 letters or numbers.';
          } else if (!/^[a-zA-Z0-9\s&.,'()/-]{2,100}$/.test(trimmed)) {
            error = 'Special symbols like !@#$%^* are not allowed in organization name.';
          }
        }
        break;

      case 'city':
        if (trimmed) {
          if (trimmed.length < 2) {
            error = 'City / Region must be at least 2 characters.';
          } else if (trimmed.length > 60) {
            error = 'City / Region cannot exceed 60 characters.';
          } else if ((trimmed.match(/[a-zA-Z]/g) || []).length < 2) {
            error = 'Please enter a valid city or region (at least 2 letters).';
          } else if (!/^[a-zA-Z\s,.'-]{2,60}$/.test(trimmed)) {
            error = 'Please enter a valid city or region (letters only).';
          }
        }
        break;

      case 'message':
        if (trimmed) {
          if (trimmed.length > 1000) {
            error = 'Additional notes cannot exceed 1000 characters.';
          } else if (/[<>]/.test(trimmed)) {
            error = 'HTML brackets < and > are not allowed in notes.';
          } else if ((trimmed.match(/[a-zA-Z0-9]/g) || []).length < 3) {
            error = 'Please enter meaningful notes (must contain words or numbers).';
          }
        }
        break;

      default:
        break;
    }
    return error;
  };

  // Validate entire form
  const validateAll = () => {
    const errs = {
      name: validateField('name', formName),
      email: validateField('email', formEmail),
      phone: validateField('phone', formPhone),
      org: validateField('org', formOrg),
      city: validateField('city', formCity),
      message: validateField('message', formMessage)
    };
    Object.keys(errs).forEach((key) => {
      if (!errs[key]) delete errs[key];
    });
    return errs;
  };

  // Full Name Handlers
  const handleNameKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning('Numbers are not allowed in Full Name.');
      return;
    }
    if (!/^[a-zA-Z\s\.\'\-]$/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning(`Special symbols (${e.key}) are not allowed in Full Name.`);
      return;
    }
  };

  const handleNameChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s\.\'\-]/g, '');
    setFormName(sanitized);
    if (formTouched.name || formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: validateField('name', sanitized) }));
    }
  };

  // Organization Handlers
  const handleOrgKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (!/^[a-zA-Z0-9\s&.,'()/-]$/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning(`Symbol (${e.key}) is not allowed in Organization name.`);
      return;
    }
  };

  const handleOrgChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s&.,'()/-]/g, '');
    setFormOrg(sanitized);
    if (formTouched.org || formErrors.org) {
      setFormErrors((prev) => ({ ...prev, org: validateField('org', sanitized) }));
    }
  };

  // Email Handlers
  const handleEmailKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (e.key === ' ') {
      e.preventDefault();
      triggerModalWarning('Spaces are not allowed in email address.');
      return;
    }
    if (!/^[a-zA-Z0-9@._+-]$/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning(`Symbol (${e.key}) is not allowed in email address.`);
      return;
    }
  };

  const handleEmailChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9@._+-]/g, '');
    setFormEmail(sanitized);
    if (formTouched.email || formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: validateField('email', sanitized) }));
    }
  };

  // Phone Handlers
  const handlePhoneKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning('Letters cannot be entered in phone number.');
      return;
    }
    if (e.key === '+' && (e.target.selectionStart !== 0 || e.target.value.includes('+'))) {
      e.preventDefault();
      triggerModalWarning('+ country code can only be at the beginning.');
      return;
    }
    if ((e.key === '-' || e.key === ')') && e.target.selectionStart === 0) {
      e.preventDefault();
      triggerModalWarning('Phone number cannot start with a hyphen or parenthesis.');
      return;
    }
    if (!/^[0-9+\s\-()]$/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning(`Symbol (${e.key}) is not allowed in phone number.`);
      return;
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    val = val.replace(/[^0-9+\s\-()]/g, '');
    val = val.replace(/^[-)\s]+/, '');
    if (val.includes('+')) {
      const hasLeadingPlus = val.startsWith('+');
      val = (hasLeadingPlus ? '+' : '') + val.replace(/\+/g, '');
    }
    val = val.replace(/-{2,}/g, '-');
    setFormPhone(val);
    if (formTouched.phone || formErrors.phone) {
      setFormErrors((prev) => ({
        ...prev,
        phone: validateField('phone', val)
      }));
    }
  };

  // City Handlers
  const handleCityKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning('Numbers are not allowed in City / Region.');
      return;
    }
    if (!/^[a-zA-Z\s,.'-]$/.test(e.key)) {
      e.preventDefault();
      triggerModalWarning(`Special symbols (${e.key}) are not allowed in City.`);
      return;
    }
  };

  const handleCityChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s,.'-]/g, '');
    setFormCity(sanitized);
    if (formTouched.city || formErrors.city) {
      setFormErrors((prev) => ({ ...prev, city: validateField('city', sanitized) }));
    }
  };

  // Notes / Message Handlers
  const handleMessageKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (e.key === '<' || e.key === '>') {
      e.preventDefault();
      triggerModalWarning('HTML brackets < and > are not allowed in notes.');
      return;
    }
  };

  const handleMessageChange = (e) => {
    const sanitized = e.target.value.replace(/[<>]/g, '');
    setFormMessage(sanitized);
    if (formTouched.message || formErrors.message) {
      setFormErrors((prev) => ({ ...prev, message: validateField('message', sanitized) }));
    }
  };

  // Submit Inquiry Form with full validation
  const handleSubmitInquiry = async (e) => {
    e.preventDefault();

    // Mark all fields touched
    setFormTouched({
      name: true,
      email: true,
      phone: true,
      org: true,
      city: true,
      message: true
    });

    const errors = validateAll();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors);
      Swal.fire({
        icon: 'warning',
        title: 'Please Check Your Details',
        html: `
          <div style="text-align: left; font-size: 13px; color: #374151;">
            <p style="margin-bottom: 8px; font-weight: 600;">Please resolve the following before submitting:</p>
            <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
              ${errorMessages.map((msg) => `<li>${msg}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonColor: '#FFCC00',
        confirmButtonText: '<span style="color: #000; font-weight: bold;">Review Details</span>'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        planId: selectedPlanForModal.id,
        planName: selectedPlanForModal.name,
        billingCycle: selectedPlanForModal.cycle,
        organizerName: formName.trim(),
        organizationName: formOrg.trim() || 'Individual Organizer',
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        city: formCity.trim(),
        eventType: formEventType,
        selectedGrowthServices: selectedGrowthService ? [selectedGrowthService] : [],
        message: formMessage.trim()
      };

      const res = await axios.post(`${API_URL}/plans/inquire`, payload);

      if (res.data?.success) {
        setIsModalOpen(false);
        setFormErrors({});
        setFormTouched({});
        Swal.fire({
          icon: 'success',
          title: 'Inquiry Received!',
          html: `<p class="text-sm text-zinc-700">Thank you, <strong>${formName.trim()}</strong>. Our exhibition partnership desk has received your request for <strong>${selectedPlanForModal.name}</strong>.</p><p class="text-xs text-zinc-500 mt-2">A dedicated organizer manager will reach out within 4 business hours.</p>`,
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
          starter: 'Basic',
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
          free: 'Not Available',
          freeStatus: 'no',
          starter: 'Normal Level (Directory, Booth & Staff Management)',
          starterStatus: 'ok',
          enterprise: 'Advance Level (Unlimited, VIP Badging, Directory Export & Space Analytics)',
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
          label: 'Marketing Campaigns (Growth Add-on)',
          free: 'Not Available (Requires Starter or Enterprise)',
          freeStatus: 'no',
          starter: 'Growth Plan Add-on (Paid separately)',
          starterStatus: 'paid',
          enterprise: 'Growth Plan Add-on (Paid separately)',
          enterpriseStatus: 'paid'
        },
        {
          label: 'VisitExpo Web Push Notifications',
          free: 'Not Available',
          freeStatus: 'no',
          starter: 'Available via Growth Plan Add-on',
          starterStatus: 'paid',
          enterprise: 'Available via Growth Plan Add-on',
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
              {maxDiscount > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    billingCycle === 'yearly'
                      ? 'bg-black text-[#FFCC00]'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Save {starterDiscount === enterpriseDiscount ? `${maxDiscount}%` : `up to ${maxDiscount}%`}
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4 CORE PRICING CARDS (PURE WHITE WITH CRISP BORDERS) */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Current Active Plan Status Banner for Logged-in Organizers */}
          {user?.role === 'organizer' && (
            <div className="mb-6 p-4 rounded-2xl border bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border-primary/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-[#FFCC00] text-black font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-zinc-600 font-medium">Your Active Plan:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFCC00] text-black uppercase tracking-wider">
                      {myPlan?.planName || (activePlanId === 'starter'
                        ? (starterPlan?.name || 'Organizer Starter')
                        : activePlanId === 'enterprise'
                        ? (enterprisePlan?.name || 'Organizer Enterprise')
                        : (freePlan?.name || 'Free Organizer'))}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Active
                    </span>
                    {hasGrowthAddon && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1">
                        <Zap className="h-3 w-3 text-emerald-600" /> + Growth Add-on Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Signed in as <strong>{user?.email}</strong> •{' '}
                    {activePlanId === 'starter'
                      ? 'Ticket monetization unlocked · Full unmasked leads enabled · Operational CRM active'
                      : activePlanId === 'enterprise'
                      ? 'Enterprise scale unlocked · Unlimited CRM & API exports · Dedicated VIP account director'
                      : 'Free organizer tier active · Upgrade below to unlock full ticketing & unmasked leads.'}
                    {hasGrowthAddon && ' • Growth Top-Up Engine & Web Push active.'}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold transition-all shrink-0 shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {/* ---------------- CARD 1: FREE ORGANIZER ---------------- */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Top Badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                    {freePlan?.badge || 'Get Started'}
                  </span>
                </div>

                {/* Title & Simple Description */}
                <div>
                  <h3 className="text-xl font-bold text-zinc-950">{freePlan?.name || 'Free Organizer'}</h3>
                  <p className="text-xs text-zinc-600 mt-1 min-h-[34px] leading-relaxed">
                    {freePlan?.tagline || freePlan?.description || 'Start listing your events and build your presence on VisitExpo.'}
                  </p>
                </div>

                {/* Illustration Banner */}
                <div className="w-full h-28 rounded-2xl bg-amber-50/40 flex items-center justify-center overflow-hidden border border-amber-200/60 p-2">
                  <svg viewBox="0 0 240 100" className="w-full h-full object-contain">
                    <circle cx="120" cy="50" r="45" fill="#FEF3C7" opacity="0.7" />
                    {/* Calendar */}
                    <rect x="50" y="18" width="70" height="64" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                    <rect x="50" y="18" width="70" height="18" rx="10" fill="#FFCC00" />
                    <rect x="62" y="12" width="4" height="10" rx="2" fill="#334155" />
                    <rect x="83" y="12" width="4" height="10" rx="2" fill="#334155" />
                    <rect x="104" y="12" width="4" height="10" rx="2" fill="#334155" />
                    <circle cx="64" cy="48" r="3" fill="#CBD5E1" />
                    <circle cx="78" cy="48" r="3" fill="#CBD5E1" />
                    <circle cx="92" cy="48" r="3" fill="#CBD5E1" />
                    <circle cx="106" cy="48" r="3.5" fill="#10B981" />
                    <circle cx="64" cy="62" r="3" fill="#CBD5E1" />
                    <circle cx="78" cy="62" r="3" fill="#CBD5E1" />
                    <circle cx="106" cy="62" r="3" fill="#CBD5E1" />
                    <circle cx="64" cy="74" r="3" fill="#CBD5E1" />
                    <circle cx="78" cy="74" r="3.5" fill="#3B82F6" />
                    <circle cx="92" cy="62" r="7" fill="#FFCC00" />
                    <path d="M89 62 L91.5 64.5 L95 60" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Person */}
                    <circle cx="155" cy="32" r="9" fill="#FDBA74" />
                    <path d="M150 25 Q155 20 162 25 Q164 28 160 30" fill="#1E293B" />
                    <path d="M143 50 L149 41 Q155 39 161 41 L167 50 L163 76 L147 76 Z" fill="#1E293B" />
                    <path d="M148 45 L132 55 L130 50 L145 42 Z" fill="#FDBA74" />
                    <circle cx="130" cy="51" r="3.5" fill="#FDBA74" />
                    <path d="M161 45 L174 58 L170 61 L158 48 Z" fill="#FDBA74" />
                    {/* Badge */}
                    <circle cx="185" cy="30" r="12" fill="#10B981" />
                    <path d="M180 30 L183.5 33.5 L190 27" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Price Block */}
                <div className="pt-1">
                  <div className="text-3xl font-black text-zinc-950 font-sans tracking-tight">₹0</div>
                  <div className="text-xs font-semibold text-zinc-700 mt-0.5">Forever</div>
                </div>

                {/* Action CTA Button */}
                <div>
                  {user?.role === 'organizer' ? (
                    activePlanId === 'free' ? (
                      isUserCorporate || isPlanActive ? (
                        <Link
                          href="/dashboard"
                          className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          List Your First Event
                        </Link>
                      ) : isGeneralFree ? (
                        <button
                          onClick={handleActivateGeneralPlan}
                          disabled={isProcessingPayment}
                          className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {isProcessingPayment ? 'Activating Plan...' : 'List Your First Event (₹0 Free)'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsPayModalOpen(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          Pay ₹{generalEmailPrice.toLocaleString()} &amp; Activate
                        </button>
                      )
                    ) : (
                      <Link
                        href="/dashboard"
                        className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition-all text-center block"
                      >
                        Included in Your {activePlanId.toUpperCase()} Plan
                      </Link>
                    )
                  ) : (
                    <Link
                      href="/login?role=organizer&signup=true"
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      List Your First Event
                    </Link>
                  )}
                </div>

                {/* Section 1: Best for you if: */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <p className="font-bold text-xs text-zinc-900">Best for you if:</p>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(freePlan?.bestFor?.length ? freePlan.bestFor : [
                      'You are new to VisitExpo',
                      'Want to list your first event',
                      'Want basic visibility on platform'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Key Inclusions: ⓘ */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-xs text-zinc-900">
                    <span>Key Inclusions:</span>
                    <span title="Core allowances included in the Free Organizer plan tier" className="cursor-pointer">
                      <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(freePlan?.keyInclusions?.length ? freePlan.keyInclusions : [
                      'Free registration (corporate email)',
                      isGeneralFree ? 'Free registration (general email) - No Charge' : `Paid registration for general email (₹${generalEmailPrice.toLocaleString()})`,
                      'Limited event claiming',
                      'Create & publish events'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ---------------- CARD 2: ORGANIZER STARTER ---------------- */}
            <div className="rounded-3xl border-2 border-[#FFCC00] bg-white p-6 sm:p-7 shadow-xl shadow-amber-500/10 ring-4 ring-amber-400/20 relative flex flex-col justify-between space-y-5 transition-all hover:shadow-2xl">
              <div className="space-y-4">
                {/* Top Badge: Most Popular with VisitExpo signature styling */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#FFCC00] text-black border border-amber-300 shadow-xs">
                    {starterPlan?.badge || '👑 Most Popular →'}
                  </span>
                </div>

                {/* Title & Simple Description */}
                <div>
                  <h3 className="text-xl font-bold text-zinc-950">{starterPlan?.name || 'Organizer Starter'}</h3>
                  <p className="text-xs text-zinc-600 mt-1 min-h-[34px] leading-relaxed">
                    {starterPlan?.tagline || starterPlan?.description || 'Get more leads and unlock valuable organizer tools.'}
                  </p>
                </div>

                {/* Illustration Banner */}
                <div className="w-full h-28 rounded-2xl bg-amber-50/50 flex items-center justify-center overflow-hidden border border-amber-200/80 p-2">
                  <svg viewBox="0 0 240 100" className="w-full h-full object-contain">
                    <circle cx="120" cy="50" r="45" fill="#FEF3C7" opacity="0.8" />
                    {/* Analytics Board */}
                    <rect x="130" y="16" width="80" height="56" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                    <rect x="136" y="22" width="68" height="6" rx="3" fill="#F1F5F9" />
                    <rect x="142" y="46" width="8" height="20" rx="3" fill="#93C5FD" />
                    <rect x="156" y="38" width="8" height="28" rx="3" fill="#60A5FA" />
                    <rect x="170" y="42" width="8" height="24" rx="3" fill="#3B82F6" />
                    <rect x="184" y="30" width="8" height="36" rx="3" fill="#FFCC00" />
                    <path d="M142 44 Q160 36 172 40 T190 26" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <circle cx="190" cy="26" r="3.5" fill="#D97706" />
                    {/* Person with laptop */}
                    <rect x="35" y="74" width="85" height="4" rx="2" fill="#CBD5E1" />
                    <circle cx="68" cy="34" r="8" fill="#FDBA74" />
                    <path d="M63 28 Q68 24 74 28 Q75 31 71 33" fill="#1E293B" />
                    <path d="M57 48 Q68 44 79 48 L76 74 L60 74 Z" fill="#2563EB" />
                    {/* Laptop */}
                    <polygon points="68,54 94,54 88,68 62,68" fill="#E2E8F0" />
                    <rect x="68" y="46" width="26" height="18" rx="3" fill="#1E293B" />
                    <rect x="71" y="48" width="20" height="14" rx="2" fill="#FFCC00" />
                    <polygon points="56,70 100,70 96,74 58,74" fill="#94A3B8" />
                    {/* Upward Growth Arrow */}
                    <circle cx="205" cy="24" r="10" fill="#10B981" />
                    <path d="M201 26 L205 21 L209 26 M205 21 L205 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Price Block (Dynamically changes with billingCycle) */}
                <div className="pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-950 font-sans tracking-tight transition-all">
                      ₹{billingCycle === 'yearly'
                        ? Number(starterYPrice).toLocaleString('en-IN')
                        : Number(starterQPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-zinc-600">
                      /{billingCycle === 'yearly' ? 'year' : 'quarter'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-zinc-600 mt-0.5">
                    {billingCycle === 'yearly' ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <span>Billed annually</span>
                        {starterDiscount > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            Save {starterDiscount}%
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Billed quarterly</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {billingCycle === 'yearly' ? (
                      <span className="text-xs font-medium text-zinc-500">
                        Equivalent to ₹{Math.round(starterYPrice / 4).toLocaleString('en-IN')}/quarter
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-zinc-500">
                          ₹{Number(starterYPrice).toLocaleString('en-IN')} billed annually
                        </span>
                        {starterDiscount > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Save {starterDiscount}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div>
                  {user?.role === 'organizer' && activePlanId === 'starter' ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/25 active:scale-[0.99] cursor-pointer"
                    >
                      <span>Plan Active · Open Dashboard</span>
                    </Link>
                  ) : user?.role === 'organizer' && (activePlanId === 'enterprise' || activePlanId === 'growth') ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition-all text-center block"
                    >
                      Included in Your {activePlanId.toUpperCase()} Plan
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan('starter', starterPlan?.name || 'Organizer Starter')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-black text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/25 active:scale-[0.99] cursor-pointer"
                    >
                      <span>Choose Starter Plan ({billingCycle === 'yearly' ? 'Annual' : 'Quarterly'})</span>
                    </button>
                  )}
                </div>

                {/* Section 1: Best for you if: */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <p className="font-bold text-xs text-zinc-900">Best for you if:</p>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(starterPlan?.bestFor?.length ? starterPlan.bestFor : [
                      'You organize one or a few events',
                      'Want genuine leads and contacts',
                      'Need tools to manage your events'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Key Inclusions: ⓘ */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-xs text-zinc-900">
                    <span>Key Inclusions:</span>
                    <span title="Complete suite of lead intelligence and CRM tools unlocked" className="cursor-pointer">
                      <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(starterPlan?.keyInclusions?.length ? starterPlan.keyInclusions : [
                      'Everything in Free plan',
                      'Detailed lead access',
                      'Basic lead management (CRM)',
                      'Advanced event search',
                      'Visitor, exhibitor & vendor leads',
                      'In-dashboard lead CRM & pipeline'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ---------------- CARD 3: ORGANIZER ENTERPRISE ---------------- */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Top Badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {enterprisePlan?.badge || 'For Large Organizers'}
                  </span>
                </div>

                {/* Title & Simple Description */}
                <div>
                  <h3 className="text-xl font-bold text-zinc-950">{enterprisePlan?.name || 'Organizer Enterprise'}</h3>
                  <p className="text-xs text-zinc-600 mt-1 min-h-[34px] leading-relaxed">
                    {enterprisePlan?.tagline || enterprisePlan?.description || 'Advanced tools for multiple expos and enterprise operations.'}
                  </p>
                </div>

                {/* Illustration Banner */}
                <div className="w-full h-28 rounded-2xl bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-200/80 p-2">
                  <svg viewBox="0 0 240 100" className="w-full h-full object-contain">
                    <circle cx="120" cy="50" r="45" fill="#F4F4F5" opacity="0.8" />
                    <ellipse cx="45" cy="74" rx="12" ry="8" fill="#86EFAC" />
                    <ellipse cx="195" cy="74" rx="12" ry="8" fill="#86EFAC" />
                    <ellipse cx="40" cy="76" rx="9" ry="6" fill="#4ADE80" />
                    <ellipse cx="200" cy="76" rx="9" ry="6" fill="#4ADE80" />
                    <rect x="20" y="78" width="200" height="8" rx="4" fill="#E2E8F0" />
                    <rect x="75" y="24" width="90" height="54" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                    <path d="M70 26 Q120 14 170 26 L168 30 Q120 18 72 30 Z" fill="#18181B" />
                    <rect x="96" y="24" width="48" height="12" rx="3" fill="#FFCC00" />
                    <text x="120" y="33" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">EXPO</text>
                    <rect x="82" y="40" width="16" height="24" rx="2" fill="#E2E8F0" />
                    <rect x="102" y="40" width="16" height="24" rx="2" fill="#E2E8F0" />
                    <rect x="122" y="40" width="16" height="24" rx="2" fill="#E2E8F0" />
                    <rect x="142" y="40" width="16" height="24" rx="2" fill="#E2E8F0" />
                    <rect x="106" y="62" width="28" height="16" rx="1" fill="#3B82F6" opacity="0.3" stroke="#2563EB" strokeWidth="1" />
                    <rect x="44" y="38" width="34" height="40" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                    <rect x="48" y="44" width="26" height="12" rx="2" fill="#E2E8F0" />
                    <rect x="48" y="60" width="26" height="14" rx="2" fill="#E2E8F0" />
                    <rect x="162" y="38" width="34" height="40" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                    <rect x="166" y="44" width="26" height="12" rx="2" fill="#E2E8F0" />
                    <rect x="166" y="60" width="26" height="14" rx="2" fill="#E2E8F0" />
                    <line x1="60" y1="26" x2="60" y2="38" stroke="#64748B" strokeWidth="1.5" />
                    <polygon points="60,26 70,29 60,32" fill="#FFCC00" />
                    <line x1="180" y1="26" x2="180" y2="38" stroke="#64748B" strokeWidth="1.5" />
                    <polygon points="180,26 190,29 180,32" fill="#FFCC00" />
                  </svg>
                </div>

                {/* Price Block (Dynamically changes with billingCycle) */}
                <div className="pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-950 font-sans tracking-tight transition-all">
                      ₹{billingCycle === 'yearly'
                        ? Number(enterpriseYPrice).toLocaleString('en-IN')
                        : Number(enterpriseQPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-zinc-600">
                      /{billingCycle === 'yearly' ? 'year' : 'quarter'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-zinc-600 mt-0.5">
                    {billingCycle === 'yearly' ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <span>Billed annually</span>
                        {enterpriseDiscount > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            Save {enterpriseDiscount}%
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Billed quarterly</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {billingCycle === 'yearly' ? (
                      <span className="text-xs font-medium text-zinc-500">
                        Equivalent to ₹{Math.round(enterpriseYPrice / 4).toLocaleString('en-IN')}/quarter
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-zinc-500">
                          ₹{Number(enterpriseYPrice).toLocaleString('en-IN')} billed annually
                        </span>
                        {enterpriseDiscount > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Save {enterpriseDiscount}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div>
                  {user?.role === 'organizer' && activePlanId === 'enterprise' ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Plan Active · Open Dashboard</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan('enterprise', enterprisePlan?.name || 'Organizer Enterprise')}
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Choose {enterprisePlan?.name || 'Enterprise Plan'} ({billingCycle === 'yearly' ? 'Annual' : 'Quarterly'})</span>
                    </button>
                  )}
                </div>

                {/* Section 1: Best for you if: */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <p className="font-bold text-xs text-zinc-900">Best for you if:</p>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(enterprisePlan?.bestFor?.length ? enterprisePlan.bestFor : [
                      'You manage multiple expos',
                      'Need advanced analytics & tools',
                      'Require API and bulk export options'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Key Inclusions: ⓘ */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-xs text-zinc-900">
                    <span>Key Inclusions:</span>
                    <span title="Enterprise scale management, unlimited export & API key integrations" className="cursor-pointer">
                      <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(enterprisePlan?.keyInclusions?.length ? enterprisePlan.keyInclusions : [
                      'Everything in Starter plan',
                      'Advanced CRM & analytics',
                      'Multiple expos management',
                      'Developer API & webhooks',
                      'Unlimited lead report export (CSV & Excel)',
                      'Advanced search & filtering'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ---------------- CARD 4: ORGANIZER GROWTH ---------------- */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Top Badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {growthPlan?.badge || 'Add-on Engine (Starter / Enterprise)'}
                  </span>
                </div>

                {/* Title & Simple Description */}
                <div>
                  <h3 className="text-xl font-bold text-zinc-950">{growthPlan?.name || 'Organizer Growth'}</h3>
                  <p className="text-xs text-zinc-600 mt-1 min-h-[34px] leading-relaxed">
                    {growthPlan?.tagline || growthPlan?.description || 'Boost your event visibility with our promotion services.'}
                  </p>
                </div>

                {/* Illustration Banner */}
                <div className="w-full h-28 rounded-2xl bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-200/80 p-2">
                  <svg viewBox="0 0 240 100" className="w-full h-full object-contain">
                    <circle cx="120" cy="50" r="45" fill="#F4F4F5" opacity="0.8" />
                    {/* Megaphone */}
                    <g transform="translate(25, 12)">
                      <path d="M35 34 L65 18 L65 58 L35 42 Z" fill="#18181B" />
                      <ellipse cx="65" cy="38" rx="5" ry="20" fill="#FFCC00" />
                      <rect x="22" y="32" width="15" height="12" rx="3" fill="#3B82F6" />
                      <ellipse cx="22" cy="38" rx="4" ry="6" fill="#1D4ED8" />
                      <path d="M28 44 L24 64 L34 64 L34 44 Z" fill="#3F3F46" />
                      <path d="M28 50 L20 54 L22 58 L30 54 Z" fill="#71717A" />
                      <path d="M76 28 Q84 38 76 48" stroke="#FFCC00" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M84 22 Q96 38 84 54" stroke="#FFCC00" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </g>
                    {/* Google 'G' */}
                    <g transform="translate(135, 18)">
                      <rect width="20" height="20" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <circle cx="10" cy="10" r="7" fill="#EA4335" />
                      <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                      <polygon points="10,10 16,10 16,12 10,12" fill="#4285F4" />
                    </g>
                    {/* LinkedIn 'in' */}
                    <g transform="translate(162, 14)">
                      <rect width="20" height="20" rx="6" fill="#0A66C2" />
                      <text x="10" y="14" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">in</text>
                    </g>
                    {/* Meta / Instagram */}
                    <g transform="translate(142, 45)">
                      <rect width="22" height="22" rx="7" fill="url(#instaGrad)" />
                      <rect x="5" y="5" width="12" height="12" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="11" cy="11" r="3" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="14.5" cy="7.5" r="0.8" fill="#FFFFFF" />
                    </g>
                    {/* YouTube Play */}
                    <g transform="translate(172, 42)">
                      <rect width="20" height="20" rx="6" fill="#FF0000" />
                      <polygon points="8,7 8,13 14,10" fill="#FFFFFF" />
                    </g>
                    {/* Analytics Growth Icon */}
                    <g transform="translate(196, 26)">
                      <rect width="20" height="20" rx="6" fill="#10B981" />
                      <path d="M5 14 L9 10 L12 13 L16 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                    <defs>
                      <linearGradient id="instaGrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F58529" />
                        <stop offset="50%" stopColor="#DD2A7B" />
                        <stop offset="100%" stopColor="#8134AF" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Price Block */}
                <div className="pt-1">
                  <div className="text-3xl font-black text-zinc-950 font-sans tracking-tight">
                    {growthPlan?.pricing?.billingNote || 'From ₹1,000'}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 mt-0.5">per top-up pack</div>
                </div>

                {/* Action CTA Button */}
                <div>
                  <a
                    href="#growth-catalog"
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {hasGrowthAddon ? 'Manage Growth Top-ups' : 'Explore Promotion Packs'}
                  </a>
                  {hasGrowthAddon && (
                    <div className="mt-1.5 text-center text-[10px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
                      ✓ Active as Add-On to Your {activePlanId.toUpperCase()} Plan
                    </div>
                  )}
                </div>

                {/* Section 1: Best for you if: */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <p className="font-bold text-xs text-zinc-900">Best for you if:</p>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(growthPlan?.bestFor?.length ? growthPlan.bestFor : [
                      'You want more visibility & reach',
                      'Need targeted promotion for events',
                      'Want flexible, pay-as-you-go options'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Key Inclusions: ⓘ */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-xs text-zinc-900">
                    <span>Key Inclusions:</span>
                    <span title="On-demand point-wise marketing across 13 omnichannel digital channels" className="cursor-pointer">
                      <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {(growthPlan?.keyInclusions?.length ? growthPlan.keyInclusions : [
                      'Top-up packs from ₹1,000',
                      'Use across 13 promotion channels',
                      'Flexible point-wise pricing',
                      'Google listing & search visibility',
                      'WhatsApp broadcast & direct SMS'
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
              </div>
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

              <form onSubmit={handleCheckEmail} noValidate className="mt-6 max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your work email (e.g. name@acmeexpos.com)..."
                    value={emailCheckInput}
                    onKeyDown={handleEmailCheckKeyDown}
                    onChange={handleEmailCheckChange}
                    className={`flex-1 px-4 py-3 rounded-xl bg-white border text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none transition-all shadow-2xs ${
                      emailCheckError
                        ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                        : 'border-zinc-300 focus:border-[#FFCC00]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-extrabold text-xs transition-all cursor-pointer shrink-0 shadow-sm hover:scale-[1.02] active:scale-98"
                  >
                    Verify Eligibility
                  </button>
                </div>

                {emailCheckError && (
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{emailCheckError}</span>
                  </div>
                )}
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
                    <th className="px-5 py-4 font-bold text-zinc-900 w-1/5 text-center">{freePlan?.name || 'Free Organizer'}</th>
                    <th className="px-5 py-4 font-bold text-amber-900 w-1/5 text-center bg-amber-50/50">
                      {starterPlan?.name || 'Starter Plan'}
                    </th>
                    <th className="px-5 py-4 font-bold text-indigo-900 w-1/5 text-center">
                      {enterprisePlan?.name || 'Enterprise Plan'}
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
              {user?.role === 'organizer' && (activePlanId === 'starter' || activePlanId === 'enterprise' || activePlanId === 'growth') ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#FFCC00] text-black font-extrabold text-xs transition-all shadow-md cursor-pointer hover:bg-[#e6b800] inline-flex items-center justify-center"
                >
                  Open Organizer Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => handleSelectPlan('starter', 'Organizer Starter')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#FFCC00] text-black font-extrabold text-xs transition-all shadow-md cursor-pointer hover:bg-[#e6b800]"
                >
                  Get Started with Starter (₹14,999/Qtr)
                </button>
              )}
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
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 transition-all duration-200 cursor-pointer hover:rotate-90 active:scale-95 flex items-center justify-center shadow-xs"
                title="Close"
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
                    : `Selected plan pricing: ₹${Number(
                        selectedPlanForModal.cycle === 'yearly'
                          ? (selectedPlanForModal.id === 'enterprise' ? enterpriseYPrice : starterYPrice)
                          : (selectedPlanForModal.id === 'enterprise' ? enterpriseQPrice : starterQPrice)
                      ).toLocaleString('en-IN')} / ${selectedPlanForModal.cycle === 'yearly' ? 'year' : 'quarter'}`}
                </p>

                {/* Interactive Billing Cycle Toggle inside Modal */}
                {!selectedGrowthService && selectedPlanForModal.id !== 'free' && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[11px] font-bold text-zinc-500">Billing Cycle:</span>
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanForModal((prev) => ({ ...prev, cycle: 'quarterly' }));
                          setBillingCycle('quarterly');
                        }}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          selectedPlanForModal.cycle === 'quarterly'
                            ? 'bg-white text-zinc-950 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Quarterly (₹{Number(selectedPlanForModal.id === 'enterprise' ? enterpriseQPrice : starterQPrice).toLocaleString('en-IN')})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanForModal((prev) => ({ ...prev, cycle: 'yearly' }));
                          setBillingCycle('yearly');
                        }}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          selectedPlanForModal.cycle === 'yearly'
                            ? 'bg-[#FFCC00] text-black shadow-xs font-black'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Annual (Save {selectedPlanForModal.id === 'enterprise' ? enterpriseDiscount : starterDiscount}%)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 transition-all duration-200 cursor-pointer hover:rotate-90 active:scale-95 flex items-center justify-center shadow-xs"
                title="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInquiry} noValidate className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-zinc-800 mb-1 flex items-center justify-between">
                    <span>Your Full Name *</span>
                    {Boolean(user?.name) && (
                      <span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-zinc-400" /> Account Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(user?.name)}
                    placeholder="e.g. Rajesh Sharma"
                    value={formName}
                    onKeyDown={handleNameKeyDown}
                    onChange={handleNameChange}
                    onBlur={() => {
                      setFormTouched((prev) => ({ ...prev, name: true }));
                      setFormErrors((prev) => ({ ...prev, name: validateField('name', formName) }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 transition-colors ${
                      Boolean(user?.name)
                        ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none opacity-85'
                        : formErrors.name
                        ? 'bg-zinc-50 border-rose-500 focus:bg-white focus:outline-none focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'bg-zinc-50 border-zinc-300 focus:bg-white focus:outline-none focus:border-[#FFCC00]'
                    }`}
                  />
                  {formErrors.name && !Boolean(user?.name) && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Organization / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Trade Fairs Pvt Ltd"
                    value={formOrg}
                    onKeyDown={handleOrgKeyDown}
                    onChange={handleOrgChange}
                    onBlur={() => {
                      setFormTouched((prev) => ({ ...prev, org: true }));
                      setFormErrors((prev) => ({ ...prev, org: validateField('org', formOrg) }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border text-zinc-900 focus:bg-white focus:outline-none transition-colors ${
                      formErrors.org
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-zinc-300 focus:border-[#FFCC00]'
                    }`}
                  />
                  {formErrors.org && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors.org}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-zinc-800 mb-1 flex items-center justify-between">
                    <span>Email Address *</span>
                    {Boolean(user?.email) && (
                      <span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-zinc-400" /> Account Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(user?.email)}
                    placeholder="name@company.com"
                    value={formEmail}
                    onKeyDown={handleEmailKeyDown}
                    onChange={handleEmailChange}
                    onBlur={() => {
                      setFormTouched((prev) => ({ ...prev, email: true }));
                      setFormErrors((prev) => ({ ...prev, email: validateField('email', formEmail) }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 transition-colors ${
                      Boolean(user?.email)
                        ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none opacity-85'
                        : formErrors.email
                        ? 'bg-zinc-50 border-rose-500 focus:bg-white focus:outline-none focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'bg-zinc-50 border-zinc-300 focus:bg-white focus:outline-none focus:border-[#FFCC00]'
                    }`}
                  />
                  {formErrors.email && !Boolean(user?.email) && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-zinc-800 mb-1 flex items-center justify-between">
                    <span>Phone / WhatsApp *</span>
                    {Boolean(user?.phone) && (
                      <span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-zinc-400" /> Account Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={Boolean(user?.phone)}
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handlePhoneChange}
                    onBlur={() => {
                      setFormTouched((prev) => ({ ...prev, phone: true }));
                      setFormErrors((prev) => ({ ...prev, phone: validateField('phone', formPhone) }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 transition-colors ${
                      Boolean(user?.phone)
                        ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none opacity-85'
                        : formErrors.phone
                        ? 'bg-zinc-50 border-rose-500 focus:bg-white focus:outline-none focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'bg-zinc-50 border-zinc-300 focus:bg-white focus:outline-none focus:border-[#FFCC00]'
                    }`}
                  />
                  {formErrors.phone && !Boolean(user?.phone) && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                    value={formCity}
                    onKeyDown={handleCityKeyDown}
                    onChange={handleCityChange}
                    onBlur={() => {
                      setFormTouched((prev) => ({ ...prev, city: true }));
                      setFormErrors((prev) => ({ ...prev, city: validateField('city', formCity) }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border text-zinc-900 focus:bg-white focus:outline-none transition-colors ${
                      formErrors.city
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-zinc-300 focus:border-[#FFCC00]'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors.city}</span>
                    </p>
                  )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-800">
                    Additional Notes / Specific Requirements
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    {formMessage.length}/1000
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Tell us about your upcoming exhibitions, footfall expectations, or requested top-up channels..."
                  value={formMessage}
                  onKeyDown={handleMessageKeyDown}
                  onChange={handleMessageChange}
                  onBlur={() => {
                    setFormTouched((prev) => ({ ...prev, message: true }));
                    setFormErrors((prev) => ({ ...prev, message: validateField('message', formMessage) }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border text-zinc-900 focus:bg-white focus:outline-none transition-colors ${
                    formErrors.message
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-zinc-300 focus:border-[#FFCC00]'
                  }`}
                />
                {formErrors.message && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{formErrors.message}</span>
                  </p>
                )}
              </div>

              {/* Real-time Field Warning Alert Banner */}
              {modalFieldWarning && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-2 animate-fadeIn transition-all">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{modalFieldWarning}</span>
                </div>
              )}

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
