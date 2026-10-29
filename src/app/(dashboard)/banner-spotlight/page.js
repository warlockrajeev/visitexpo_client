'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Award,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Loader2,
  Trash2,
  Eye,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  Building,
  RefreshCw,
  X,
  HelpCircle,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function BannerSpotlightPage() {
  const { user, accessToken } = useAuth();

  // Entitlement & state
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasGrowthPlan, setHasGrowthPlan] = useState(false);
  const [userPlan, setUserPlan] = useState('free');

  // Requests & events
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Modal & form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [formData, setFormData] = useState({
    headline: '',
    subheadline: '',
    bannerImage: '',
    ctaText: 'Explore Exhibition',
    ctaLink: '',
    badgeText: 'Growth Spotlight',
    requestedDays: 14
  });

  // Preview tab in modal
  const [modalTab, setModalTab] = useState('form'); // 'form' | 'preview'

  // Fetch entitlement
  useEffect(() => {
    let isMounted = true;
    const checkGrowthAccess = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.get(`${API_URL}/campaigns/growth-access`, { headers });
        if (isMounted && res.data?.success) {
          setHasGrowthPlan(Boolean(res.data.hasGrowthPlan));
          setUserPlan(res.data.plan || user?.plan || 'free');
        }
      } catch (err) {
        // Fallback to local user object
        if (isMounted) {
          const isGrowth = user?.hasGrowthPlan === true || String(user?.plan).toLowerCase() === 'growth';
          setHasGrowthPlan(isGrowth);
          setUserPlan(user?.plan || 'free');
        }
      } finally {
        if (isMounted) setCheckingAccess(false);
      }
    };

    if (user) {
      checkGrowthAccess();
    }
  }, [user, accessToken]);

  // Fetch organizer's banner requests
  const fetchMyRequests = async () => {
    if (!accessToken) return;
    setLoadingRequests(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.get(`${API_URL}/banners/my-requests`, { headers });
      if (res.data?.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.warn('Could not fetch banner requests:', err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch organizer's published events
  const fetchMyEvents = async () => {
    if (!accessToken) return;
    setLoadingEvents(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      // Try organizer events endpoint
      const res = await axios.get(`${API_URL}/events?limit=100`, { headers });
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Filter events owned by this organizer (or all if admin)
        const myEvts = res.data.data.filter(
          e => String(e.organizer?._id || e.organizer) === String(user?._id) || user?.role === 'super_admin'
        );
        setEvents(myEvts.length > 0 ? myEvts : res.data.data);
      }
    } catch (err) {
      console.warn('Could not load events:', err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (user && hasGrowthPlan) {
      fetchMyRequests();
      fetchMyEvents();
    }
  }, [user, hasGrowthPlan, accessToken]);

  // Handle event selection in modal
  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    const evt = events.find(e => String(e._id) === String(eventId));
    if (evt) {
      setFormData(prev => ({
        ...prev,
        headline: evt.title || '',
        subheadline: evt.description ? evt.description.substring(0, 180) : 'Join top exhibitors and trade professionals at this premier exhibition.',
        bannerImage: evt.bannerImage || evt.featuredImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
        ctaLink: `/events?highlight=${evt.slug || evt._id}`,
        ctaText: 'Explore Exhibition'
      }));
    }
  };

  // Submit request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      Swal.fire({ icon: 'warning', title: 'Event Required', text: 'Please select an exhibition to feature.' });
      return;
    }
    if (!formData.headline || !formData.bannerImage) {
      Swal.fire({ icon: 'warning', title: 'Missing Details', text: 'Please provide a headline and banner image.' });
      return;
    }

    setSubmitting(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(
        `${API_URL}/banners/request`,
        {
          eventId: selectedEventId,
          ...formData
        },
        { headers }
      );

      if (res.data?.success) {
        setIsModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Spotlight Request Submitted!',
          text: 'Your request is in the admin curation queue. Once approved, your exhibition will rotate live on the landing page hero slider.',
          confirmButtonColor: '#4f46e5'
        });
        fetchMyRequests();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.response?.data?.message || err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel/Withdraw request
  const handleCancelRequest = async (id, eventTitle) => {
    const result = await Swal.fire({
      title: 'Withdraw Request?',
      text: `Are you sure you want to cancel the banner spotlight request for "${eventTitle}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Withdraw',
      cancelButtonText: 'Keep Request',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await axios.delete(`${API_URL}/banners/request/${id}`, { headers });
        if (res.data?.success) {
          Swal.fire({ icon: 'success', title: 'Cancelled', text: 'Banner request cancelled successfully.' });
          fetchMyRequests();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message });
      }
    }
  };

  const selectedEvent = events.find(e => String(e._id) === String(selectedEventId));

  // Loading state
  if (checkingAccess) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // =========================================================================
  // GROWTH PLAN PAYWALL / FEATURE GATE (For Non-Growth Organizers)
  // =========================================================================
  if (!hasGrowthPlan) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5 pb-28 lg:mr-16 lg:w-[calc(100%-4rem)]">
        {/* Breadcrumb Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Growth Plan Feature</span>
            <span>&bull;</span>
            <span className="text-amber-700 dark:text-amber-400 font-extrabold">Exclusive Placement</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            Landing Page Banner Spotlight
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Put your exhibition in front of visitors with a featured placement on the VisitExpo homepage.
          </p>
        </div>

        {/* Feature Showcase Card */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Award className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-amber-800 dark:text-amber-300 border border-primary/20">
                <Lock className="h-3 w-3" />
                Growth Plan Exclusive Feature
              </span>
              <h2 className="max-w-3xl text-lg font-black leading-tight tracking-tight text-foreground sm:text-xl">
                Get Top Placement on VisitExpo&apos;s Homepage Hero Carousel
              </h2>
            </div>
          </div>

          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            As a Growth Plan Organizer, you can submit requests to showcase your flagship exhibition directly on the
            <strong> VisitExpo Homepage Hero Banner Slider</strong>. Thousands of verified trade visitors, international buyers, and media professionals browse the hero slider daily.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex h-full flex-col items-start gap-2 rounded-xl border border-border bg-secondary/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                10x
              </div>
              <h3 className="text-xs font-bold text-foreground">Maximum Visibility</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Positioned in the prime spot above all other expos on the main homepage.
              </p>
            </div>

            <div className="flex h-full flex-col items-start gap-2 rounded-xl border border-border bg-secondary/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-foreground">Verified Spotlight Badge</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Custom badge and priority verification build trust and accelerate badge registrations.
              </p>
            </div>

            <div className="flex h-full flex-col items-start gap-2 rounded-xl border border-border bg-secondary/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-foreground">Direct CTA Conversion</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Direct buttons to your ticket booking, exhibitor inquiry, and official event desk.
              </p>
            </div>
          </div>

          {/* Upgrade CTA Button */}
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 text-xs shadow-sm hover:shadow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Upgrade to Growth Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <span className="text-xs text-muted-foreground sm:ml-1">
              Current Plan: <strong className="text-foreground capitalize">{userPlan}</strong> &bull; Instant activation
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE GROWTH PLAN ORGANIZER DASHBOARD
  // =========================================================================
  const activeCount = requests.filter(r => r.status === 'approved' && r.isActive).length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-5 pb-28 lg:mr-16 lg:w-[calc(100%-4rem)]">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="h-3 w-3" />
              Growth Plan VIP
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Landing Page Hero Slider
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            Banner Spotlight Manager
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Request premier promotional placement on the VisitExpo Homepage Carousel. Once reviewed and approved by our curation team, your event rotates live to thousands of attendees.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => {
              fetchMyRequests();
              fetchMyEvents();
            }}
            className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (events.length === 0) {
                Swal.fire({
                  icon: 'info',
                  title: 'No Exhibitions Found',
                  text: 'You need at least one published exhibition to request a banner spotlight.',
                  confirmButtonColor: '#4f46e5'
                });
                return;
              }
              // Set initial default event
              if (!selectedEventId && events[0]) {
                handleSelectEvent(events[0]._id);
              }
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-indigo-500/20 sm:px-5 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Request Banner Spotlight</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Live Banners</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          <div className="text-[11px] text-muted-foreground">Rotating on Homepage</div>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Under Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-muted-foreground">Awaiting Admin Approval</div>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Requests</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-foreground">{requests.length}</div>
          <div className="text-[11px] text-muted-foreground">Lifetime Submissions</div>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Growth Tier</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm font-black text-amber-400 uppercase tracking-wider">Active Plan</div>
          <div className="text-[11px] text-muted-foreground">Unlimited Moderations</div>
        </div>
      </div>

      {/* Requests Table & History */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h2 className="text-base font-bold text-foreground">
            My Banner Spotlight Submissions
          </h2>
          <span className="text-xs text-muted-foreground">
            {requests.length} total records
          </span>
        </div>

        {loadingRequests ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading your spotlight requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="space-y-3 p-6 text-center sm:p-8">
            <div className="h-16 w-16 rounded-full bg-secondary text-muted-foreground mx-auto flex items-center justify-center">
              <Award className="h-7 w-7 opacity-50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">No Banner Requests Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Promote your exhibition right on the landing page hero carousel. Click below to submit your first banner spotlight.
              </p>
            </div>
            <button
              onClick={() => {
                if (!selectedEventId && events[0]) handleSelectEvent(events[0]._id);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold px-4 py-2 text-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Request</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((r) => {
              const statusBadge = {
                approved: {
                  label: 'Live on Homepage',
                  bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  icon: CheckCircle2
                },
                pending: {
                  label: 'Pending Admin Review',
                  bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  icon: Clock
                },
                rejected: {
                  label: 'Rejected / Needs Changes',
                  bg: 'bg-red-500/10 text-red-400 border-red-500/20',
                  icon: XCircle
                },
                paused: {
                  label: 'Paused',
                  bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                  icon: AlertCircle
                }
              }[r.status] || {
                label: r.status,
                bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                icon: AlertCircle
              };

              const StatusIcon = statusBadge.icon;

              return (
                <div key={r._id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/20 sm:p-5 md:flex-row md:items-center md:justify-between">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <img
                      src={r.bannerImage || r.event?.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300'}
                      alt={r.headline}
                      className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-xl border border-border shrink-0 shadow-xs"
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusBadge.label}</span>
                        </span>

                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {r.badgeText || 'Spotlight'}
                        </span>

                        {r.requestedDays && (
                          <span className="text-[10px] text-muted-foreground">
                            &bull; {r.requestedDays} Days Duration
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-foreground">
                        {r.headline}
                      </h3>

                      <p className="max-w-2xl whitespace-normal break-words text-xs leading-relaxed text-muted-foreground">
                        {r.subheadline}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                        <span>Exhibition: <strong className="text-foreground">{r.event?.title || 'Unknown Event'}</strong></span>
                        {r.event?.city && <span>&bull; 📍 {r.event.city}</span>}
                        <span>&bull; Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Admin Feedback note if rejected */}
                      {r.adminNotes && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <strong>Admin Note:</strong> {r.adminNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {r.status === 'approved' && (
                      <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Live</span>
                      </Link>
                    )}

                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(r._id, r.event?.title || r.headline)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Withdraw</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* REQUEST SUBMISSION MODAL                                            */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Growth Plan Promotion
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    &bull; Landing Page Hero Carousel
                  </span>
                </div>
                <h2 className="text-lg font-black text-foreground">
                  Request Landing Page Banner Spotlight
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="px-5 pt-3 border-b border-border flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalTab('form')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'form'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                1. Configure Banner
              </button>
              <button
                type="button"
                onClick={() => setModalTab('preview')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'preview'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                2. Live Landing Page Preview
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {modalTab === 'form' ? (
                <form id="bannerForm" onSubmit={handleSubmitRequest} className="space-y-4">
                  {/* Event Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Select Exhibition to Spotlight *
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => handleSelectEvent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    >
                      <option value="">-- Choose an Event --</option>
                      {events.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.title} {e.city ? `(${e.city})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Only verified exhibitions can be spotlighted on the homepage.
                    </p>
                  </div>

                  {/* Headline */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Banner Headline *
                    </label>
                    <input
                      type="text"
                      maxLength={140}
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="e.g. India International AI & Manufacturing Expo 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                  </div>

                  {/* Subheadline / Pitch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Subheadline / Hook (Max 240 chars) *
                    </label>
                    <textarea
                      rows={2}
                      maxLength={240}
                      value={formData.subheadline}
                      onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                      placeholder="Describe what makes this exhibition special, key exhibitors, or exclusive product launches..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                  </div>

                  {/* Banner Image URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      High-Resolution Banner Image URL (16:9 recommended) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.bannerImage}
                        onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                        placeholder="https://images.unsplash.com/... or Cloudinary image URL"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Grid: Badge Text, CTA Text & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={formData.badgeText}
                        onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                        placeholder="e.g. Growth Spotlight"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        placeholder="Explore Exhibition"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Requested Duration
                      </label>
                      <select
                        value={formData.requestedDays}
                        onChange={(e) => setFormData({ ...formData, requestedDays: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        <option value={7}>7 Days (1 Week)</option>
                        <option value={14}>14 Days (2 Weeks)</option>
                        <option value={30}>30 Days (1 Month)</option>
                      </select>
                    </div>
                  </div>

                  {/* CTA Destination Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      CTA Destination URL (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder={`e.g. /event/${selectedEvent?.slug || 'my-event'} or https://myexpo.com`}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </form>
              ) : (
                /* LIVE PREVIEW TAB */
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground text-xs">
                    Live simulation of how your banner looks on the Landing Page Hero Slider:
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 relative shadow-2xl">
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                      <img
                        src={formData.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600'}
                        alt="Preview Banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-transparent" />

                      <div className="absolute inset-0 flex flex-col justify-end p-5 z-10 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-zinc-950">
                            {formData.badgeText || 'Growth Spotlight'}
                          </span>
                          {selectedEvent?.city && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                              📍 {selectedEvent.city}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {formData.headline || 'Your Headline Will Appear Here'}
                        </h3>

                        <p className="text-xs text-zinc-300 line-clamp-2 max-w-lg">
                          {formData.subheadline || 'Your subheadline will describe the exhibition highlights to attendees.'}
                        </p>

                        <div className="pt-2 flex items-center gap-3">
                          <span className="px-5 py-2 rounded-xl bg-amber-400 text-zinc-950 font-bold text-xs shadow-md">
                            {formData.ctaText || 'Explore Exhibition'} &rarr;
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            Presented by {user?.company || user?.name || 'Verified Organizer'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {modalTab === 'form' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab('preview')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                  >
                    Next: Preview &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('form')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                  >
                    &larr; Back to Form
                  </button>
                )}

                <button
                  type="submit"
                  form="bannerForm"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Award className="h-3.5 w-3.5" />
                      <span>Submit for Admin Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
