'use client';

/**
 * @file page.js
 * @description Location Market Feasibility & Event Presence Intelligence Hub.
 * Empowers organizers to analyze location trade interest, competitor events present,
 * and comprehensive Go/No-Go feasibility reports before launching an exhibition.
 * 
 * Rules:
 * - Starter & Enterprise Plans: Included 100% (Free of extra cost)
 * - Free Organizer Plan: Unlock complete reports for ₹4,999 (one-time validation pass)
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  MapPin,
  Search,
  Building,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Lock,
  Unlock,
  CreditCard,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  BarChart3,
  Layers,
  Check,
  X,
  Loader2,
  RefreshCw,
  Compass,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const POPULAR_CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Indore',
  'Surat',
  'Kochi',
  'Goa'
];

const POPULAR_CATEGORIES = [
  'All Sectors',
  'Technology & AI',
  'Manufacturing',
  'Automotive & EV',
  'Textile & Fashion',
  'Food Tech',
  'Healthcare & Pharma',
  'Construction & Infra',
  'Renewable Energy',
  'Consumer Goods & Retail'
];

export default function LocationFeasibilityPage() {
  const { user, accessToken, updateUser } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [customCityInput, setCustomCityInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment / Unlock Modal state for Free users
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const printRef = useRef(null);

  // Plan detection
  const isSuperAdmin = user?.role === 'super_admin';
  const rawPlan = (user?.plan || 'free').toLowerCase();
  const isFreePlan = !isSuperAdmin && (rawPlan === 'free' || !rawPlan);
  const isStarterPlan = !isSuperAdmin && rawPlan === 'starter';
  const isEnterprisePlan = isSuperAdmin || rawPlan === 'enterprise' || rawPlan === 'growth';

  // Has this user unlocked location research?
  const isIncludedInPlan = isStarterPlan || isEnterprisePlan || isSuperAdmin;
  const hasUserPaidUnlock = !!user?.hasUnlockedLocationResearch;
  const isFullAccess = isIncludedInPlan || hasUserPaidUnlock || !!report?.accessControl?.isFullAccess;

  // Fetch Feasibility & Event Presence Report
  const fetchFeasibilityReport = async (city, category) => {
    setLoading(true);
    setError(null);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const catParam = category && category !== 'All Sectors' ? category : '';
      const res = await axios.get(`${API_URL}/events/market-feasibility`, {
        params: { city, category: catParam },
        headers
      });

      if (res.data?.success && res.data.data) {
        setReport(res.data.data);
      } else {
        setError('Could not retrieve market feasibility data.');
      }
    } catch (err) {
      console.error('Error fetching market feasibility:', err);
      setError(err.response?.data?.message || 'Failed to connect to location intelligence server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeasibilityReport(selectedCity, selectedCategory);
  }, [selectedCity, selectedCategory, accessToken]);

  // Handle City search submit
  const handleCitySearch = (e) => {
    e.preventDefault();
    if (customCityInput.trim()) {
      setSelectedCity(customCityInput.trim());
      setCustomCityInput('');
    }
  };

  // Handle ₹4,999 Unlock for Free Users
  const handleConfirmUnlock = async () => {
    setUnlocking(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const txnId = `TXN_LOC_${Date.now()}_${Math.floor(Math.random() * 90000 + 10000)}`;

      const res = await axios.post(
        `${API_URL}/plans/unlock-location-research`,
        {
          location: selectedCity,
          transactionId: txnId,
          paymentMethod
        },
        { headers }
      );

      if (res.data?.success) {
        // Update user auth context
        if (updateUser) {
          updateUser({
            ...user,
            hasUnlockedLocationResearch: true
          });
        }

        setShowUnlockModal(false);

        await Swal.fire({
          icon: 'success',
          title: 'Intelligence Unlocked!',
          text: `Payment of ₹4,999 successful (Ref: ${txnId}). You now have full access to all location market interest, competitor events, and Go/No-Go reports!`,
          confirmButtonColor: '#FFCC00',
          confirmButtonText: 'View Complete Report'
        });

        // Re-fetch with full access
        fetchFeasibilityReport(selectedCity, selectedCategory);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Unlock Failed',
        text: err.response?.data?.message || 'Payment processing failed. Please try again.'
      });
    } finally {
      setUnlocking(false);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" ref={printRef}>
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Compass className="h-4 w-4" />
            <span>Market Validation &amp; Event Feasibility Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Location Feasibility &amp; Event Presence Explorer
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Evaluate visitor interest, inspect existing competitor exhibitions present in any location, and access comprehensive Go/No-Go decision reports before launching your next expo.
          </p>
        </div>

        {/* Plan Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {isIncludedInPlan ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                {isSuperAdmin
                  ? 'Super Admin Privileges (Full Access)'
                  : isEnterprisePlan
                  ? 'Included in Enterprise Plan (Unlimited)'
                  : 'Included in Starter Plan (Full Access)'}
              </span>
            </div>
          ) : hasUserPaidUnlock ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-foreground text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Validation Pass Active (₹4,999 Paid)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <Lock className="h-3.5 w-3.5" />
                <span>Free Plan (Preview Mode)</span>
              </div>
              <button
                onClick={() => setShowUnlockModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFCC00] to-amber-500 text-black text-xs font-extrabold hover:brightness-105 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Unlock for ₹4,999</span>
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Location & Sector Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Custom City Search Input */}
          <form onSubmit={handleCitySearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search any city (e.g. Pune, Jaipur, Dubai)..."
                value={customCityInput}
                onChange={(e) => setCustomCityInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
              Analyze City
            </button>
          </form>

          {/* Sector / Category Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Industry Sector:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {POPULAR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Metro City Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mr-1 shrink-0">
            Top Exhibition Hubs:
          </span>
          {POPULAR_CITIES.map((city) => {
            const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-black shadow-sm font-extrabold scale-105'
                    : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-card border border-border rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Analyzing {selectedCity} location demand, registered delegate volume, and competitor events...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Analysis Error</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchFeasibilityReport(selectedCity, selectedCategory)}
            className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-xl"
          >
            Retry Analysis
          </button>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Feasibility Verdict Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Score Gauge & Verdict */}
              <div className="flex items-start sm:items-center gap-5">
                {/* Visual Score Ring */}
                <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-secondary/80 border border-border/80 shadow-inner shrink-0">
                  <div className="text-center">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground">
                      {report.summary.feasibilityScore}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block -mt-1">
                      / 100 Score
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${report.summary.verdictBadge}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {report.summary.verdict}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Location: <strong className="text-foreground">{report.location}</strong> · Sector: <strong className="text-foreground">{report.category}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    {report.summary.recommendationHeadline}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {report.summary.decisionRationale}
                  </p>
                </div>
              </div>

              {/* Right Summary Quick KPI Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 min-w-[280px] shrink-0 border-t lg:border-t-0 lg:border-l border-border/70 pt-4 lg:pt-0 lg:pl-6">
                <div className="p-3 rounded-xl bg-background/80 border border-border/60">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Events Present
                  </span>
                  <span className="text-xl font-extrabold font-mono text-foreground">
                    {report.summary.totalEventsPresent}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {report.summary.upcomingEventsCount} upcoming scheduled
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border/60">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Trade Audience Interest
                  </span>
                  <span className="text-xl font-extrabold font-mono text-primary">
                    {report.summary.audienceInterestVolume.toLocaleString()}+
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Registered delegates &amp; buyers
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border/60 col-span-2 sm:col-span-1 lg:col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Competition Density
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {report.summary.competitionDensity}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Market viability index
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Strategic Projections Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Optimal Launch Season</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                {report.summary.optimalLaunchWindow}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Maximum corporate budget approvals &amp; peak buyer procurement.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                <Users className="h-4 w-4 text-emerald-500" />
                <span>Projected Visitor Footfall</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                {report.summary.projectedFootfallRange}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Based on historical turnout at {report.location} B2B/B2C exhibitions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                <Building className="h-4 w-4 text-indigo-500" />
                <span>Exhibitor Stall Capacity</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                {report.summary.projectedExhibitorCapacity}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Target commercial booth allocation capacity for positive unit economics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                <DollarSign className="h-4 w-4 text-amber-500" />
                <span>Recommended Ticketing</span>
              </div>
              <div className="text-xs font-bold text-foreground leading-snug">
                {report.summary.recommendedTicketStrategy}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dual pass strategy to maximize delegate volume while monetizing VIP passes.
              </p>
            </div>
          </div>

          {/* Detailed Reports Section (with Free Plan Paywall Overlay if locked) */}
          <div className="relative">
            {/* Free User Paywall Overlay */}
            {!isFullAccess && (
              <div className="absolute inset-0 z-20 backdrop-blur-md bg-background/80 rounded-3xl border-2 border-primary/40 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                <div className="max-w-lg space-y-5 p-6 rounded-2xl bg-card/95 border border-border shadow-xl">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                    <Lock className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Market Intelligence Gate
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground">
                      Unlock Complete Feasibility &amp; Event Presence Report
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Free organizers can unlock all deep location interest analytics, the full competitor exhibition schedule, registered buyer demographics, and SWOT decision reports for any location for <strong>₹4,999</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/50 border border-border text-left space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Full list &amp; details of all existing events present in {selectedCity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Registered trade buyer demand index &amp; corporate procurement intent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Complete Go/No-Go SWOT framework &amp; premier venue availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Export &amp; print executive pitch deck PDF report</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFCC00] to-amber-500 text-black text-xs font-black hover:brightness-105 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pay ₹4,999 &amp; Unlock This Report</span>
                    </button>

                    <Link
                      href="/pricing"
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border flex items-center justify-center gap-2"
                    >
                      <span>Upgrade Plan (Included Free)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Starter and Enterprise subscribers get unlimited location feasibility reports included free of cost.
                  </p>
                </div>
              </div>
            )}

            {/* Deep Report Pillars (Visible or Blurred based on isFullAccess) */}
            <div className={`space-y-6 ${!isFullAccess ? 'filter blur-sm select-none pointer-events-none' : ''}`}>
              {/* Row 1: Locations Interest & Demographics + Category Demand */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pillar 1: Location Interest Analytics */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-extrabold text-foreground">
                        Location Buyer Demand &amp; Trade Interest
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                      {report.location} Territory
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Buyer Demand Index
                      </span>
                      <span className="text-xl font-extrabold font-mono text-emerald-500">
                        {report.metrics.buyerDemandIndex}%
                      </span>
                      <span className="text-[10px] text-muted-foreground block">Strong buying interest</span>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Regional Trade Pool
                      </span>
                      <span className="text-xl font-extrabold font-mono text-foreground">
                        {report.metrics.registeredBuyersInRegion.toLocaleString()}+
                      </span>
                      <span className="text-[10px] text-muted-foreground block">Verified trade contacts</span>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Corporate Intent
                      </span>
                      <span className="text-sm font-extrabold text-primary">
                        {report.metrics.corporateProcurementIntent}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">High purchase intent</span>
                    </div>
                  </div>

                  {/* Top Demanded Sectors Breakdown */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Top Industry Sectors in Demand in {report.location}:
                    </span>
                    <div className="space-y-2.5">
                      {(report.metrics.topCategoriesInLocation || []).map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-foreground">{cat.name}</span>
                            <span className="text-muted-foreground font-mono">
                              {cat.count} expos ({cat.sharePct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(15, cat.sharePct))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Premier Venues & Competition Saturation */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-indigo-500" />
                      <h3 className="text-base font-extrabold text-foreground">
                        Exhibition Venues &amp; Infrastructure
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                      Venue Readiness: {report.metrics.venueAvailabilityScore}%
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Access to specialized exhibition centres and convention halls with logistical connectivity for machinery, freight, and attendee transit in {report.location}.
                  </p>

                  <div className="space-y-3">
                    {(report.venues || []).map((venue, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-secondary/40 border border-border/70 hover:border-primary/50 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <h4 className="text-xs font-bold text-foreground">{venue.name}</h4>
                          </div>
                          <p className="text-[11px] text-muted-foreground pl-5">{venue.type}</p>
                        </div>
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground shrink-0">
                          {venue.capacity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
                    <strong className="text-foreground block">Logistics Recommendation:</strong>
                    <span>
                      For industrial &amp; heavy trade shows, secure ground-floor hall permits at least 180 days prior to launch to guarantee floor-loading compliance.
                    </span>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Events Present (Live Competitor Listing in this Location) */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      <h3 className="text-base font-extrabold text-foreground">
                        Exhibitions Present in {report.location} ({report.summary.totalEventsPresent})
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Existing, scheduled and past trade fairs present in this location from the VisitExpo directory.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-muted-foreground">
                    Showing top active events
                  </span>
                </div>

                {report.eventsPresent && report.eventsPresent.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {report.eventsPresent.map((evt, idx) => {
                      const startDateStr = evt.startDate
                        ? new Date(evt.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Dates TBA';

                      return (
                        <div
                          key={evt.id || idx}
                          className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/50 transition-all space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground font-mono">
                                #{idx + 1}
                              </span>
                              {evt.isClaimed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <ShieldCheck className="h-3 w-3" />
                                  Claimed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  Unclaimed
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-foreground line-clamp-2" title={evt.title}>
                              {evt.title}
                            </h4>

                            <div className="text-[11px] text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                <span className="truncate">{evt.venue || report.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                <span>{startDateStr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground truncate max-w-[130px]">
                              {(evt.categories && evt.categories[0]) || 'Trade Show'}
                            </span>
                            <Link
                              href={`/events/claim?search=${encodeURIComponent(evt.title)}`}
                              className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-secondary/30 rounded-xl space-y-2">
                    <Sparkles className="h-8 w-8 text-primary mx-auto" />
                    <h4 className="text-sm font-bold text-foreground">Zero Direct Competitors Found!</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      No competing exhibitions are currently scheduled in {report.location} under this sector. This indicates an open market opportunity for early movers!
                    </p>
                  </div>
                )}
              </div>

              {/* Pillar 4: Go/No-Go Decision Matrix (SWOT Analysis) */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-extrabold text-foreground">
                    Go / No-Go Strategic Decision Framework (SWOT)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Market Strengths
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {(report.swotAnalysis?.strengths || []).map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      Operational Weaknesses &amp; Bottlenecks
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {(report.swotAnalysis?.weaknesses || []).map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Growth &amp; Monetization Opportunities
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {(report.swotAnalysis?.opportunities || []).map((o, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      Competitive Threats &amp; Risks
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {(report.swotAnalysis?.threats || []).map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ₹4,999 Unlock / Payment Modal for Free Users */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Close button */}
            <button
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-2 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <Compass className="h-8 w-8" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Proposed Event Validation Pass
              </span>
              <h2 className="text-2xl font-black text-foreground">
                Unlock Complete Feasibility Intelligence
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gain instant, permanent access to all location market metrics, competitor listings, buyer turnout projections, and SWOT reports for <strong>{selectedCity}</strong> and nationwide hubs.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">
                  One-Time Market Validation Fee
                </span>
                <span className="text-2xl font-black font-mono text-foreground">
                  ₹4,999
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Includes all reports &amp; competitor data
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Instant Access
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase block">
                Select Payment Method:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <Zap className="h-4 w-4 text-primary" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <Building className="h-4 w-4 text-primary" />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleConfirmUnlock}
                disabled={unlocking}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFCC00] to-amber-500 text-black text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:brightness-105"
              >
                {unlocking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Processing Payment of ₹4,999...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-black" />
                    <span>Confirm &amp; Pay ₹4,999 to Unlock</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground underline"
                >
                  Or upgrade to Starter/Enterprise to include this free
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
