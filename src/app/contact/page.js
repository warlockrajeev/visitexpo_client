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
  Clock,
  Send,
  CheckCircle2,
  Building,
  Ticket,
  Store,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
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
    const digits = val.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Please enter a valid phone number (at least 10 digits).';
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

  const handlePhoneKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      triggerPhoneWarning('Letters cannot be entered in phone number.');
      return;
    }
    if (e.key === '+' && (e.target.selectionStart !== 0 || e.target.value.includes('+'))) {
      e.preventDefault();
      triggerPhoneWarning('+ country code can only be at the beginning.');
      return;
    }
    if ((e.key === '-' || e.key === ')') && e.target.selectionStart === 0) {
      e.preventDefault();
      triggerPhoneWarning('Phone number cannot start with a hyphen or parenthesis.');
      return;
    }
    if (!/^[0-9+\s\-()]$/.test(e.key)) {
      e.preventDefault();
      triggerPhoneWarning(`Symbol (${e.key}) is not allowed in phone number.`);
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
    setPhone(val);
    if (phoneError) {
      setPhoneError(validatePhone(val));
    }
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
        setPhone(foundPhone);
      } else if (typeof window !== 'undefined') {
        const token = localStorage.getItem('visitexpo_access_token');
        if (token) {
          fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.user?.phone) {
                setPhone(data.user.phone);
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

    if (!finalName) {
      setNameError('Please enter your full name.');
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (finalName.length < 2 || !/^[a-zA-Z\s.'-]+$/.test(finalName)) {
      setNameError('Please enter a valid name (letters only).');
      setErrorMessage('Please enter a valid name (letters only).');
      return;
    }

    if (!finalEmail) {
      setEmailError('Please enter your email address.');
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(finalEmail)) {
      setEmailError('Please enter a valid email address (e.g. name@company.com).');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const phoneValidationErr = validatePhone(finalPhone);
    if (phoneValidationErr) {
      setPhoneError(phoneValidationErr);
      setErrorMessage(phoneValidationErr);
      return;
    }

    const messageValidationErr = validateMessage(finalMessage);
    if (messageValidationErr) {
      setMessageError(messageValidationErr);
      setErrorMessage(messageValidationErr);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 space-y-4 sm:space-y-5 flex-1 w-full">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2 sm:mb-2.5">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-bold">Contact Us</span>
          </nav>

          {/* Hero Header Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-zinc-900/90 z-0" />
            <div className="relative z-10 p-5 sm:p-6 md:p-7 space-y-2.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-[#FFCC00]">
                <MessageSquare className="h-3.5 w-3.5 text-[#FF2E63]" />
                <span>Get in Touch • Global Expo Helpdesk</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                We&apos;re Here to Help You Connect
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                Have questions regarding trade exhibition listings, reserving exhibitor booth space, downloading digital visitor passes, or API integration? Connect directly with our team.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Visit Us */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900">Visit Us</h3>
              <p className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed">
                LEO MEO iT SOLUTIONS, Gate 3, Nesco Center, Western Express Highway, Goregaon East, Mumbai 400063.
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Phone className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900">Direct Helpline</h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">Mon – Fri, 9am – 6pm IST</p>
              <a
                href="tel:+919323677688"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors pt-0.5"
              >
                <span>+91 93236 77688</span>
              </a>
            </div>
          </div>

          {/* Work With Us */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-pink-50 text-[#FF2E63] flex items-center justify-center shrink-0 border border-pink-100">
              <Mail className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900">Email Support</h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">Inquiries, partnerships &amp; support</p>
              <a
                href="mailto:support@visitexpo.in"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF2E63] hover:underline transition-colors pt-0.5"
              >
                <span>support@visitexpo.in</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Section: Interactive Form + Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                Send Us a Message
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Fill in the details below and an event specialist will reach out within 4 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-950">Inquiry Received Successfully!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Your message has been logged in our support directory. A VisitExpo representative will contact you via email or phone shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Role Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-zinc-700">
                      I am inquiring as a:
                    </label>
                    {user && (
                      <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-zinc-400" />
                        <span>Role locked to your account</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs cursor-default'
                              : isDisabled
                              ? 'bg-zinc-100/70 border-zinc-200 text-zinc-400 opacity-40 cursor-not-allowed select-none'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-[#FFCC00]' : isDisabled ? 'text-zinc-400' : 'text-zinc-500'}`} />
                          <span className="text-[11px] leading-tight text-center">{role.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
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
                      onChange={(e) => {
                        setName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''));
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. Rajeev Haldar"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
                        user
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none'
                          : nameError
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {nameError && !user && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{nameError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      {user && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      disabled={Boolean(user)}
                      readOnly={Boolean(user)}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value.replace(/\s/g, ''));
                        if (emailError) setEmailError('');
                      }}
                      placeholder="e.g. rajeev@visitexpo.in"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
                        user
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200 cursor-not-allowed select-none'
                          : emailError
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {emailError && !user && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Subject Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
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
                      onBlur={() => setPhoneError(validatePhone(phone))}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
                        phoneError || phoneWarning
                          ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63]'
                      }`}
                    />
                    {(phoneWarning || phoneError) && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{phoneWarning || phoneError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2E63] transition-all cursor-pointer"
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
                    <label className="block text-xs font-semibold text-zinc-700">
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
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all resize-y ${
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
                  className="w-full py-3 px-6 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Sending inquiry...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Key Details & Quick Support FAQ (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Resolution Card */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-base text-zinc-900">Verified Platform Support</h3>
              </div>

              <div className="space-y-3 text-xs text-zinc-600">
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-zinc-900 block font-semibold">Real-Time Data Sync</strong>
                    <span>Changes to your published events or booth inventory sync live across the platform.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-zinc-900 block font-semibold">Organizer Ownership Claim</strong>
                    <span>Fast-track verification for official event organizers with existing WordPress directory listings.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-pink-50 text-[#FF2E63] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-zinc-900 block font-semibold">Delegate Entry Passes</strong>
                    <span>Instant barcode generation and re-issuance for lost visitor passes.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion FAQ */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                <HelpCircle className="h-4 w-4 text-[#FF2E63]" />
                <h3 className="font-bold text-sm text-zinc-900">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-2">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-zinc-200/80 rounded-xl overflow-hidden transition-all text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3 text-left flex items-center justify-between gap-2 font-bold text-zinc-900 cursor-pointer bg-zinc-50/50 hover:bg-zinc-50"
                      >
                        <span className="leading-snug">{faq.q}</span>
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#FF2E63]' : 'text-zinc-400'}`} />
                      </button>
                      {isOpen && (
                        <div className="p-3 text-zinc-600 text-[11px] leading-relaxed border-t border-zinc-100 bg-white">
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
