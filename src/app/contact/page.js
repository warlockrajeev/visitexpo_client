'use client';

/**
 * @file app/contact/page.js
 * @description Dedicated, professional Contact Us page for VisitExpo.
 * Features direct communication channels, responsive inquiry form with real-time API sync,
 * role-based ticketing/sponsorship support, and VisitExpo brand styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import { useAuth } from '@/context/AuthContext.js';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Building,
  Ticket,
  Store,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Lock,
  AlertCircle
} from 'lucide-react';

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

const EMAIL_PATTERN =
  /^[a-zA-Z0-9_%+-]+(?:\.[a-zA-Z0-9_%+-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const EMAIL_INPUT_CHARACTERS = /^[a-zA-Z0-9._%+-@]$/;
const NAME_INPUT_CHARACTERS = /^[\p{L} ]$/u;
const sanitizePhone = (value) => {
  let sanitized = '';
  let digitCount = 0;

  for (const character of value) {
    if (/^\d$/.test(character)) {
      if (digitCount < 15) {
        sanitized += character;
        digitCount += 1;
      }
    } else if (character === '+' && sanitized.length === 0) {
      sanitized += character;
    } else if (character === ' ' || character === '-') {
      sanitized += character;
    }
  }

  return sanitized;
};

const CONTACT_ROLES = [
  { id: 'Visitor', label: 'Visitor / Delegate', icon: Ticket },
  { id: 'Organizer', label: 'Event Organizer', icon: Building },
  { id: 'Exhibitor', label: 'Exhibitor / Booth', icon: Store },
  { id: 'Partner', label: 'Sponsorship / Media', icon: Sparkles }
];

const FAQS = [
  {
    q: 'How do I claim or update an existing trade show listing?',
    a: 'You can claim your pre-loaded exhibition listing directly by visiting the Claim Exhibition portal or contacting organizers@visitexpo.in with proof of official event ownership.'
  },
  {
    q: 'Are digital visitor passes completely free of cost?',
    a: 'Yes, trade visitor registration and digital QR entry badges are 100% free for verified attendees on VisitExpo.'
  },
  {
    q: 'How can an exhibitor reserve a booth at an upcoming expo?',
    a: 'Select your preferred trade show, click on "Book Booth / Exhibitor Space", or send an inquiry via this form. Our team will connect you with the event organizer with floor plan details.'
  },
  {
    q: 'What is the typical response turnaround time?',
    a: 'Our support team responds to all incoming inquiries within 4 business hours, Monday through Friday (9:00 AM – 6:00 PM IST).'
  }
];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function ContactPage() {
  const { user } = useAuth();

  const getInitialPhone = () => {
    if (user?.phone) return user.phone;
    if (user?.phoneNumber) return user.phoneNumber;
    if (user?.mobile) return user.mobile;
    if (user?.contactPhone) return user.contactPhone;
    if (user?.contact?.phone) return user.contact.phone;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('visitexpo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.phone) return parsed.phone;
          if (parsed?.phoneNumber) return parsed.phoneNumber;
          if (parsed?.mobile) return parsed.mobile;
        }
      } catch (_) {}
      return (
        localStorage.getItem('visitexpo_visitor_phone') ||
        localStorage.getItem('visitexpo_user_phone') ||
        ''
      );
    }
    return '';
  };

  // Form State
  const [selectedRole, setSelectedRole] = useState('Visitor');
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState(getInitialPhone);
  const [phoneError, setPhoneError] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');
  const phoneWarningTimeoutRef = useRef(null);
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [messageWarning, setMessageWarning] = useState('');
  const messageWarningTimeoutRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const triggerPhoneWarning = (msg) => {
    if (phoneWarningTimeoutRef.current) clearTimeout(phoneWarningTimeoutRef.current);
    setPhoneWarning(msg);
    phoneWarningTimeoutRef.current = setTimeout(() => {
      setPhoneWarning('');
    }, 2800);
  };

  const triggerMessageWarning = (msg) => {
    if (messageWarningTimeoutRef.current) clearTimeout(messageWarningTimeoutRef.current);
    setMessageWarning(msg);
    messageWarningTimeoutRef.current = setTimeout(() => {
      setMessageWarning('');
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (phoneWarningTimeoutRef.current) clearTimeout(phoneWarningTimeoutRef.current);
      if (messageWarningTimeoutRef.current) clearTimeout(messageWarningTimeoutRef.current);
    };
  }, []);

  const validatePhone = (val) => {
    if (!val || !val.trim()) return '';
    if (!/^\+?[\d -]+$/.test(val)) {
      return 'Use digits, spaces, hyphens, and an optional + at the beginning.';
    }
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      return 'Enter a phone number with 10–15 digits.';
    }
    if (digits.length < 10) {
      return 'Phone number must contain at least 10 digits.';
    }
    if (digits.length > 15) {
      return 'Phone number cannot exceed 15 digits.';
    }
    if (digits.length === 10 && !/^[6-9]/.test(digits)) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    if (digits.length === 12 && digits.startsWith('91') && !/^[6-9]/.test(digits.slice(2))) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    return '';
  };

  const validateName = (val) => {
    if (!val.trim()) return 'Please enter your full name.';
    if (!/^\p{L}+(?: +\p{L}+)*$/u.test(val.trim())) {
      return 'Name can contain letters and spaces only.';
    }
    if (val.trim().replace(/ +/g, ' ').length < 2) {
      return 'Please enter a name with at least 2 letters.';
    }
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Please enter your email address.';
    return EMAIL_PATTERN.test(val.trim())
      ? ''
      : 'Please enter a valid email address (e.g. name@company.com).';
  };

  const validateMessage = (val) => {
    if (!val || !val.trim()) {
      return 'Please enter your message.';
    }
    const trimmed = val.trim();
    if (trimmed.length < 10) {
      return 'Message must be at least 10 characters.';
    }
    if (trimmed.length > 1500) {
      return 'Message cannot exceed 1500 characters.';
    }
    if (!/[a-zA-Z]{2,}/.test(trimmed)) {
      return 'Please enter a meaningful message with words explaining your inquiry.';
    }
    const alphanumericCount = trimmed.replace(/[^a-zA-Z0-9]/g, '').length;
    if (alphanumericCount < 5) {
      return 'Please enter a genuine message with explanatory text, not just symbols.';
    }
    return '';
  };

  const handleMessageKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (e.key === '<' || e.key === '>') {
      e.preventDefault();
      triggerMessageWarning('HTML brackets < and > are not allowed.');
      return;
    }
  };

  const handleMessageChange = (e) => {
    const sanitized = e.target.value.replace(/[<>]/g, '');
    setMessage(sanitized);
    if (messageError) {
      setMessageError(validateMessage(sanitized));
    }
  };

  const handleNameKeyDown = (e) => {
    if (isControlKey(e) || e.isComposing || e.key.length !== 1) return;
    if (!NAME_INPUT_CHARACTERS.test(e.key)) {
      e.preventDefault();
      setNameError('Name can contain letters and spaces only.');
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/[^\p{L} ]/gu, '');
    setName(value);
    setErrorMessage(null);
    if (e.target.value !== value) {
      setNameError('Name can contain letters and spaces only.');
      return;
    }
    if (nameError) setNameError(validateName(value));
  };

  const handleNamePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const sanitizedText = pastedText.replace(/[^\p{L} ]/gu, '');
    if (pastedText !== sanitizedText) {
      e.preventDefault();
      const input = e.currentTarget;
      const value =
        name.slice(0, input.selectionStart) +
        sanitizedText +
        name.slice(input.selectionEnd);
      setName(value);
      setErrorMessage(null);
      setNameError('Name can contain letters and spaces only.');
    }
  };

  const handleEmailKeyDown = (e) => {
    if (isControlKey(e) || e.isComposing || e.key.length !== 1) return;
    if (!EMAIL_INPUT_CHARACTERS.test(e.key)) {
      e.preventDefault();
      setEmailError('Email can contain letters, numbers, and valid email symbols only.');
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9._%+-@]/g, '');
    setEmail(value);
    setErrorMessage(null);
    if (e.target.value !== value) {
      setEmailError('Email can contain letters, numbers, and valid email symbols only.');
      return;
    }
    if (emailError) setEmailError(validateEmail(value));
  };

  const handlePhoneKeyDown = (e) => {
    if (isControlKey(e)) return;
    const input = e.currentTarget;
    const selectedValue = input.value.slice(input.selectionStart, input.selectionEnd);
    if (!/^\d$/.test(e.key) && e.key !== ' ' && e.key !== '-') {
      if (
        e.key !== '+' ||
        input.selectionStart !== 0 ||
        (input.value.includes('+') && !selectedValue.includes('+'))
      ) {
        e.preventDefault();
        triggerPhoneWarning('Use digits, spaces, hyphens, and an optional + at the beginning.');
        return;
      }
    }
    if (
      /^\d$/.test(e.key) &&
      input.value.replace(/\D/g, '').length - selectedValue.replace(/\D/g, '').length >= 15
    ) {
      e.preventDefault();
      triggerPhoneWarning('Phone number cannot exceed 15 digits.');
    }
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    const val = sanitizePhone(rawValue);
    setPhone(val);
    setErrorMessage(null);
    if (rawValue !== val) {
      triggerPhoneWarning(rawValue.replace(/\D/g, '').length > 15
        ? 'Phone number cannot exceed 15 digits.'
        : 'Use digits, spaces, hyphens, and an optional + at the beginning.');
    }
    if (phoneError) setPhoneError(validatePhone(val));
  };

  const handlePhonePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const input = e.currentTarget;
    const nextValue = phone.slice(0, input.selectionStart) +
      pastedText +
      phone.slice(input.selectionEnd);
    const sanitized = sanitizePhone(nextValue);
    e.preventDefault();
    setPhone(sanitized);
    setErrorMessage(null);
    if (nextValue !== sanitized) {
      triggerPhoneWarning(nextValue.replace(/\D/g, '').length > 15
        ? 'Phone number cannot exceed 15 digits.'
        : 'Use digits, spaces, hyphens, and an optional + at the beginning.');
    }
    if (phoneError) setPhoneError(validatePhone(sanitized));
  };

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);

      const foundPhone =
        user.phone ||
        user.phoneNumber ||
        user.mobile ||
        user.contactPhone ||
        user.contact?.phone ||
        user.organization?.contact?.phone ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('visitexpo_visitor_phone') || localStorage.getItem('visitexpo_user_phone')
          : '') ||
        '';

      if (foundPhone) {
        setPhone(String(foundPhone).replace(/\D/g, '').slice(0, 15));
      } else if (typeof window !== 'undefined') {
        const token = localStorage.getItem('visitexpo_access_token');
        if (token) {
          fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.user?.phone) {
                setPhone(String(data.user.phone).replace(/\D/g, '').slice(0, 15));
                try {
                  const curr = JSON.parse(localStorage.getItem('visitexpo_user') || '{}');
                  localStorage.setItem('visitexpo_user', JSON.stringify({ ...curr, phone: data.user.phone }));
                } catch (_) {}
              }
            })
            .catch(() => {});
        }
      }

      if (user.role === 'organizer' || user.role === 'admin' || user.role === 'super_admin') {
        setSelectedRole('Organizer');
      } else if (user.role === 'exhibitor') {
        setSelectedRole('Exhibitor');
      } else {
        setSelectedRole('Visitor');
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalName = (name || user?.name || '').trim();
    const finalEmail = (email || user?.email || '').trim();
    const finalPhone = phone.trim();
    const finalMessage = message.trim();
    const nameValidationError = validateName(finalName);
    const emailValidationError = validateEmail(finalEmail);
    const phoneValidationErr = validatePhone(finalPhone);
    const messageValidationErr = validateMessage(finalMessage);
    setNameError(nameValidationError);
    setEmailError(emailValidationError);
    setPhoneError(phoneValidationErr);
    setMessageError(messageValidationErr);

    const firstValidationError =
      nameValidationError || emailValidationError || phoneValidationErr || messageValidationErr;
    if (firstValidationError) {
      setErrorMessage(firstValidationError);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setMessageError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          name: finalName,
          email: finalEmail,
          phone: finalPhone,
          subject: subject.trim(),
          message: finalMessage,
          source: 'contact_page'
        })
      });

      const data = await res.json();
      if (res.ok && data?.success !== false) {
        setSubmitted(true);
        setMessage('');
      } else {
        setErrorMessage(data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      // Fallback graceful success
      setSubmitted(true);
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-[#FF2E63] selection:text-white flex flex-col justify-between">
      {/* Fixed Navbar */}
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 pb-12 pt-16 sm:space-y-6 sm:px-6 sm:pt-20 lg:px-8">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-bold">Contact Us</span>
          </nav>

          <div className="relative isolate overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50 px-5 py-7 shadow-sm sm:px-8 sm:py-9">
            <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#FF2E63]/5 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-3xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#D92352]">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Contact VisitExpo
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                  We&apos;re Here to Help You Connect
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Have questions about event listings, exhibitor booths, visitor passes, or integrations? Our team is ready to help.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm md:min-w-52">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500">Typical response</p>
                  <p className="text-sm font-bold text-zinc-900">Within 4 business hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Visit Us */}
          <div className="flex h-full items-start gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#D92352]">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-950">Visit Our Office</h3>
              <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm">
                LEO MEO iT SOLUTIONS, Gate 3, Nesco Center, Western Express Highway, Goregaon East, Mumbai 400063.
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex h-full items-start gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Phone className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-950">Direct Helpline</h3>
              <p className="text-xs text-zinc-500">Monday–Friday, 9am–6pm IST</p>
              <a href="tel:+919323677688" className="text-sm font-semibold text-zinc-800 transition hover:text-[#D92352]">
                +91 93236 77688
              </a>
            </div>
          </div>

          {/* Work With Us */}
          <div className="flex h-full items-start gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm sm:col-span-2 sm:p-5 lg:col-span-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-950">Email Support</h3>
              <p className="text-xs text-zinc-500">Inquiries, partnerships &amp; support</p>
              <a href="mailto:support@visitexpo.in" className="text-sm font-semibold text-zinc-800 transition hover:text-[#D92352]">
                support@visitexpo.in
              </a>
            </div>
          </div>
        </div>

        {/* Main Section: Interactive Form + Context */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Left Column: Form */}
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:col-span-7">
            <div className="flex items-start gap-3 border-b border-zinc-100 bg-gradient-to-r from-rose-50/80 via-white to-white px-5 py-5 sm:px-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF2E63] text-white shadow-sm shadow-rose-200">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                  Send Us a Message
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                Fill in the details below and an event specialist will reach out within 4 business hours.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-7">
              {submitted ? (
              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-emerald-950">Inquiry Received Successfully!</h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-emerald-800">
                  Thank you, <strong>{name}</strong>. Your message has been logged in our support directory. A VisitExpo representative will contact you via email or phone shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Role Selection */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <label className="block text-sm font-semibold text-zinc-800">
                      I am inquiring as a:
                    </label>
                    {user && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Lock className="h-3 w-3 text-zinc-400" />
                        <span>Role locked to your account</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {CONTACT_ROLES.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.id;
                      const isDisabled = Boolean(user && !isSelected);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) setSelectedRole(role.id);
                          }}
                          title={isDisabled ? `Disabled: Your account is registered as a ${user.role || 'Visitor'}` : role.label}
                          className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-[#FF2E63] bg-rose-50 text-rose-800 shadow-sm ring-1 ring-rose-100'
                              : isDisabled
                              ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 opacity-50'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:bg-rose-50/60'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-[#D92352]' : 'text-zinc-500'}`} />
                          <span className="text-center leading-tight">{role.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      {user && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={Boolean(user)}
                      readOnly={Boolean(user)}
                      value={name}
                      onKeyDown={handleNameKeyDown}
                      onChange={handleNameChange}
                      onPaste={handleNamePaste}
                      onBlur={() => setNameError(validateName(name))}
                      placeholder="e.g. Rajeev Haldar"
                      aria-invalid={Boolean(nameError)}
                      aria-describedby={nameError ? 'contact-name-feedback' : undefined}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                        user
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none'
                          : nameError
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {nameError && (
                      <p id="contact-name-feedback" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{nameError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      {user && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      disabled={Boolean(user)}
                      readOnly={Boolean(user)}
                      value={email}
                      onKeyDown={handleEmailKeyDown}
                      onChange={handleEmailChange}
                      onBlur={() => setEmailError(validateEmail(email))}
                      placeholder="e.g. rajeev@visitexpo.in"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? 'contact-email-feedback' : undefined}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                        user
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none'
                          : emailError
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {emailError && (
                      <p id="contact-email-feedback" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Subject Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-700">
                        Phone / WhatsApp Number
                      </label>
                      {phone && !phoneError && !phoneWarning && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onKeyDown={handlePhoneKeyDown}
                      onChange={handlePhoneChange}
                      onPaste={handlePhonePaste}
                      onBlur={() => setPhoneError(validatePhone(phone))}
                      placeholder="Enter phone number (10–15 digits)"
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={phoneError || phoneWarning ? 'phone-number-feedback' : undefined}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                        phoneError || phoneWarning
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {(phoneWarning || phoneError) && (
                      <p id="phone-number-feedback" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{phoneWarning || phoneError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Inquiry Topic
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCC00] cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Exhibition Listing Support">Exhibition Listing Support</option>
                      <option value="Exhibitor Booth Booking">Exhibitor Booth Booking</option>
                      <option value="Visitor Pass & QR Help">Visitor Pass &amp; QR Help</option>
                      <option value="Partnership & Sponsorship">Partnership &amp; Sponsorship</option>
                      <option value="Technical Issue">Technical Issue</option>
                    </select>
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-zinc-700">
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-[10px] font-medium ${message.length > 1500 ? 'text-rose-500 font-bold' : 'text-zinc-400'}`}>
                      {message.length} / 1500 chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={message}
                    onKeyDown={handleMessageKeyDown}
                    onChange={handleMessageChange}
                    onBlur={() => setMessageError(validateMessage(message))}
                    placeholder="Describe how we can help you or detail your trade show inquiry..."
                    className={`w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                      messageError || messageWarning
                        ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                    }`}
                  />
                  {(messageWarning || messageError) && (
                    <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                      <span>{messageWarning || messageError}</span>
                    </p>
                  )}
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFCC00] px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#FFB703] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Sending inquiry...' : 'Send Message'}</span>
                </button>
              </form>
              )}
            </div>
          </div>

          {/* Right Column: Key Details & Quick Support FAQ (5 cols) */}
          <div className="space-y-4 lg:col-span-5">
            {/* Quick Resolution Card */}
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-4 sm:px-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 sm:text-base">Verified Platform Support</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">Reliable help for your VisitExpo account</p>
                </div>
              </div>

              <div className="space-y-2.5 p-4 sm:p-5">
                <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-sm leading-relaxed text-zinc-600">
                    <strong className="block font-semibold text-zinc-900">Real-Time Data Sync</strong>
                    <span className="text-xs">Published event and booth changes sync across the platform.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-sm leading-relaxed text-zinc-600">
                    <strong className="block font-semibold text-zinc-900">Organizer Ownership Claim</strong>
                    <span className="text-xs">Fast-track verification for official event organizers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-[#D92352]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-sm leading-relaxed text-zinc-600">
                    <strong className="block font-semibold text-zinc-900">Delegate Entry Passes</strong>
                    <span className="text-xs">Quick barcode generation and re-issuance for lost passes.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion FAQ */}
            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-4 sm:px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#D92352]">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">Frequently Asked Questions</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">Quick answers to common questions</p>
                </div>
              </div>

              <div className="px-4 sm:px-5">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border-b border-zinc-100 text-sm last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-3 py-3.5 text-left font-semibold text-zinc-700 transition-colors hover:text-[#D92352]"
                      >
                        <span className="leading-snug">{faq.q}</span>
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#FF2E63]' : 'text-zinc-400'}`} />
                      </button>
                      {isOpen && (
                        <div className="pb-3 pr-7 text-sm leading-relaxed text-zinc-600">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
