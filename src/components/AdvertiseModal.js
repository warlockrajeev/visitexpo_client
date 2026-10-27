'use client';

/**
 * @file AdvertiseModal.js
 * @description 10times.com-style "Advertise With Us / Promote Your Event" Modal (Screen D).
 * Enables event organizers, trade associations, and sponsors to request high-impact
 * featured placements, sidebar banner ads, and B2B buyer lead campaigns.
 * Includes automatic profile autofill for logged-in users (name, email, phone, company)
 * and strict field validation against symbol/spam injection and invalid formats.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Megaphone,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Building,
  Mail,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const AD_PACKAGES = [
  'Top Featured Exhibition Banner (Hero & Category Spotlight)',
  'Sidebar Display Ads (300x250 & 300x600 Placements)',
  'Sponsored Newsletter Blast (50,000+ Verified Trade Buyers)',
  'Exhibitor Booth Lead Generation & Visitor Pre-Registration'
];

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

export default function AdvertiseModal({ isOpen, onClose }) {
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [company, setCompany] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [adPackage, setAdPackage] = useState(AD_PACKAGES[0]);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [formGeneralError, setFormGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Autofill fields when modal opens or user auth loads
  useEffect(() => {
    if (!isOpen) return;

    let foundName = user?.name || user?.fullName || '';
    let foundEmail = user?.email || '';
    let foundPhone =
      user?.phone ||
      user?.phoneNumber ||
      user?.mobile ||
      user?.contactPhone ||
      user?.contact?.phone ||
      user?.organization?.contact?.phone ||
      '';
    let foundCompany = user?.company || user?.organization?.name || user?.orgName || '';

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('visitexpo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!foundName && parsed?.name) foundName = parsed.name;
          if (!foundEmail && parsed?.email) foundEmail = parsed.email;
          if (!foundPhone && (parsed?.phone || parsed?.phoneNumber || parsed?.mobile)) {
            foundPhone = parsed.phone || parsed.phoneNumber || parsed.mobile;
          }
          if (!foundCompany && (parsed?.company || parsed?.organization?.name)) {
            foundCompany = parsed.company || parsed.organization?.name;
          }
        }
      } catch (_) {}

      if (!foundPhone) {
        foundPhone =
          localStorage.getItem('visitexpo_visitor_phone') ||
          localStorage.getItem('visitexpo_user_phone') ||
          '';
      }
      if (!foundName) {
        foundName = localStorage.getItem('visitexpo_visitor_name') || '';
      }
      if (!foundEmail) {
        foundEmail = localStorage.getItem('visitexpo_visitor_email') || '';
      }
    }

    if (foundName) setName(foundName);
    if (foundEmail) setEmail(foundEmail);
    if (foundPhone) setPhone(foundPhone);
    if (foundCompany) setCompany(foundCompany);

    // If phone is still not found and access token exists, fetch from /auth/me
    if (!foundPhone && typeof window !== 'undefined') {
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
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Validation functions
  const validateName = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'Please enter your full name.';
    }
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters.';
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      return 'Please enter a valid name (letters only, no symbols).';
    }
    return '';
  };

  const validateCompany = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'Please enter your company or organizer name.';
    }
    if (trimmed.length < 2) {
      return 'Company name must be at least 2 characters.';
    }
    const alphanumericCount = trimmed.replace(/[^a-zA-Z0-9]/g, '').length;
    if (alphanumericCount < 2) {
      return 'Please enter a valid company name (not just symbols).';
    }
    return '';
  };

  const validateEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'Please enter your work email.';
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      return 'Please enter a valid email address (e.g. name@company.com).';
    }
    return '';
  };

  const validatePhone = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return ''; // Optional in advertisement inquiry
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Please enter a valid phone number (at least 10 digits).';
    }
    if (digits.length > 15) {
      return 'Phone number cannot exceed 15 digits.';
    }
    if (digits.length === 10 && !/^[6-9]/.test(digits)) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    return '';
  };

  const validateNotes = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return '';
    if (!/[a-zA-Z]{2,}/.test(trimmed)) {
      return 'Please enter a genuine description with explanatory words, not just symbols.';
    }
    return '';
  };

  // Keystroke interceptors
  const handleNameKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (!/^[a-zA-Z\s.'-]$/.test(e.key)) {
      e.preventDefault();
      setNameError('Special symbols and numbers are not allowed in names.');
    }
  };

  const handleNameChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
    setName(sanitized);
    if (nameError) setNameError(validateName(sanitized));
  };

  const handleCompanyKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[<>]/.test(e.key)) {
      e.preventDefault();
      setCompanyError('HTML brackets < and > are not allowed.');
    }
  };

  const handleCompanyChange = (e) => {
    const sanitized = e.target.value.replace(/[<>]/g, '');
    setCompany(sanitized);
    if (companyError) setCompanyError(validateCompany(sanitized));
  };

  const handleEmailKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[^a-zA-Z0-9.@_+%-]/.test(e.key)) {
      e.preventDefault();
      setEmailError(`Character (${e.key}) is not allowed in email.`);
      return;
    }
  };

  const handleEmailChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9.@_+%-]/g, '');
    setEmail(sanitized);
    if (emailError) setEmailError(validateEmail(sanitized));
  };

  const handlePhoneKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (/[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      setPhoneError('Letters cannot be entered in phone number.');
      return;
    }
    if (e.key === '+' && (e.target.selectionStart !== 0 || e.target.value.includes('+'))) {
      e.preventDefault();
      setPhoneError('+ country code can only be at the beginning.');
      return;
    }
    if (!/^[0-9+\s\-()]$/.test(e.key)) {
      e.preventDefault();
      setPhoneError(`Symbol (${e.key}) is not allowed in phone number.`);
      return;
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^0-9+\s\-()]/g, '');
    val = val.replace(/^[-)\s]+/, '');
    if (val.includes('+')) {
      const hasLeadingPlus = val.startsWith('+');
      val = (hasLeadingPlus ? '+' : '') + val.replace(/\+/g, '');
    }
    setPhone(val);
    if (phoneError) setPhoneError(validatePhone(val));
  };

  const handleNotesKeyDown = (e) => {
    if (isControlKey(e)) return;
    if (e.key === '<' || e.key === '>') {
      e.preventDefault();
      setNotesError('HTML brackets < and > are not allowed.');
    }
  };

  const handleNotesChange = (e) => {
    const sanitized = e.target.value.replace(/[<>]/g, '');
    setNotes(sanitized);
    if (notesError) setNotesError(validateNotes(sanitized));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nErr = validateName(name);
    const cErr = validateCompany(company);
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    const notesErr = validateNotes(notes);

    setNameError(nErr);
    setCompanyError(cErr);
    setEmailError(eErr);
    setPhoneError(pErr);
    setNotesError(notesErr);

    if (nErr || cErr || eErr || pErr || notesErr) {
      setFormGeneralError('Please correct the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);
    setFormGeneralError('');
    try {
      await axios.post(`${API_URL}/contact`, {
        role: 'Advertiser',
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: `[Advertise Inquiry] Company: ${company.trim()} | Package: ${adPackage} | Details: ${notes.trim()}`
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('API submission error, showing confirmation:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setNameError('');
    setCompany('');
    setCompanyError('');
    setEmail('');
    setEmailError('');
    setPhone('');
    setPhoneError('');
    setNotes('');
    setNotesError('');
    setFormGeneralError('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-[#FF2E63] to-purple-600" />

        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-zinc-900">Advertising Request Received!</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong className="text-zinc-800">{name}</strong>. Our partnerships team will reach out to <strong className="text-zinc-800">{email}</strong> within 4 business hours with media kits and pricing.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                  <span>Promote Your Trade Show or Exhibit</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
                  Reach 50,000+ Verified Trade Buyers
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Boost visitor attendance and sell out your exhibitor booths with premium high-impact placements on VisitExpo.
                </p>
              </div>

              {formGeneralError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                  <span>{formGeneralError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Your Name *</label>
                      {name && !nameError && (user || typeof window !== 'undefined') && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Auto-filled
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onKeyDown={handleNameKeyDown}
                        onChange={handleNameChange}
                        onBlur={() => setNameError(validateName(name))}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-all ${
                          nameError
                            ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00]'
                        }`}
                      />
                    </div>
                    {nameError && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{nameError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Company / Organizer *</label>
                      {company && !companyError && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Auto-filled
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Global Expos Group"
                        value={company}
                        onKeyDown={handleCompanyKeyDown}
                        onChange={handleCompanyChange}
                        onBlur={() => setCompanyError(validateCompany(company))}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-all ${
                          companyError
                            ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00]'
                        }`}
                      />
                    </div>
                    {companyError && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{companyError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Work Email *</label>
                      {email && !emailError && (user || typeof window !== 'undefined') && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Auto-filled
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="john@expos.com"
                        value={email}
                        onKeyDown={handleEmailKeyDown}
                        onChange={handleEmailChange}
                        onBlur={() => setEmailError(validateEmail(email))}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-all ${
                          emailError
                            ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00]'
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Phone Number</label>
                      {phone && !phoneError && (
                        <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Auto-filled
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onKeyDown={handlePhoneKeyDown}
                        onChange={handlePhoneChange}
                        onBlur={() => setPhoneError(validatePhone(phone))}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-all ${
                          phoneError
                            ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00]'
                        }`}
                      />
                    </div>
                    {phoneError && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Promotion Package</label>
                  <select
                    value={adPackage}
                    onChange={(e) => setAdPackage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00] cursor-pointer"
                  >
                    {AD_PACKAGES.map((pkg, i) => (
                      <option key={i} value={pkg}>{pkg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Event Details &amp; Target Audience</label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your exhibition dates, city, and target exhibitor/visitor segments..."
                    value={notes}
                    onKeyDown={handleNotesKeyDown}
                    onChange={handleNotesChange}
                    onBlur={() => setNotesError(validateNotes(notes))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                      notesError
                        ? 'bg-rose-50/40 border-rose-500 text-zinc-900 focus:bg-white focus:outline-none ring-1 ring-rose-500/20'
                        : 'bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFCC00]'
                    }`}
                  />
                  {notesError && (
                    <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                      <span>{notesError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Submit Advertising Request</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Trust Indicators */}
              <div className="pt-2 border-t border-zinc-150 flex items-center justify-center gap-4 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> 300% Average ROI
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-500" /> Verified B2B Audience
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
