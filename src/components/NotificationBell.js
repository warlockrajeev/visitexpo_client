'use client';

/**
 * @file NotificationBell.js
 * @description Header Notification center for Organizer Dashboard.
 * Integrates OneSignal Web Push controls for Enterprise plan organizers.
 * Strictly adheres to design rules (No sparkle icons). Fully opaque & high-contrast UI.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Bell,
  Users,
  Target,
  Bookmark,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  Zap,
  ArrowRight,
  ShieldCheck,
  Radio,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { enablePushSubscription, getPushSubscriptionState } from '../utils/oneSignal.js';
import Swal from 'sweetalert2';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearingAll, setClearingAll] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [permission, setPermission] = useState('default');
  const dropdownRef = useRef(null);
  const seenNotifIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);

  const isOrganizer = user?.role === 'organizer';
  const rawPlan = (user?.plan || 'free').toLowerCase();
  const [hasGrowthPlan, setHasGrowthPlan] = useState(
    Boolean(user?.hasGrowthPlan || rawPlan === 'growth')
  );
  const canTakeGrowth = rawPlan === 'starter' || rawPlan === 'enterprise' || rawPlan === 'growth';

  // Fetch status and Growth plan eligibility
  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/status`);
      if (res.data?.success) {
        setHasGrowthPlan(Boolean(res.data.data.hasGrowthPlan || res.data.data.canReceivePush));
      }
    } catch (_) {
      setHasGrowthPlan(Boolean(user?.hasGrowthPlan || rawPlan === 'growth'));
    }
  }, [user, rawPlan]);

  // Fetch notifications and trigger desktop alerts for new incoming events
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/notifications?limit=15`);
      if (res.data?.success) {
        const fetched = res.data.data.notifications || [];
        setNotifications(fetched);
        setUnreadCount(res.data.data.unreadCount || 0);

        if (!initialFetchDoneRef.current) {
          // On initial load, record existing notification IDs without spamming alerts
          fetched.forEach((n) => seenNotifIdsRef.current.add(String(n._id || n.id)));
          initialFetchDoneRef.current = true;
        } else {
          // Identify brand new unread notifications that just arrived
          const freshNotifs = fetched.filter(
            (n) => !n.isRead && !seenNotifIdsRef.current.has(String(n._id || n.id))
          );

          if (freshNotifs.length > 0) {
            freshNotifs.forEach((n) => {
              seenNotifIdsRef.current.add(String(n._id || n.id));

              // If browser notification permission is granted, fire native desktop alert!
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                  const alert = new Notification(n.title || 'VisitExpo Organizer Alert', {
                    body: n.message || 'New attendee activity on your exhibition.',
                    icon: '/logo.png',
                    tag: `visitexpo-${n._id || n.id}`,
                    requireInteraction: false
                  });
                  alert.onclick = () => {
                    window.focus();
                    if (n.metadata?.url) {
                      window.location.href = n.metadata.url;
                    }
                  };
                } catch (notifErr) {
                  console.warn('[NotificationBell] Native desktop alert warning:', notifErr);
                }
              }
            });
          }
        }
      }
    } catch (err) {
      // Quiet fail if offline
    }
  }, [user]);

  // Initial and periodic fetch (5s interval for fast responsive alerts)
  useEffect(() => {
    fetchStatus();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchStatus]);

  // Cross-tab real-time notification sync via BroadcastChannel & Storage Event
  useEffect(() => {
    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('visitexpo_notification_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'ACTIVITY_UPDATE') {
            fetchNotifications();
          }
        };
      } catch (_) {}
    }

    const handleStorage = (e) => {
      if (e.key === 'visitexpo_last_engagement_trigger') {
        fetchNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchNotifications]);

  // Detect browser notification permission and OneSignal subscription state
  const syncPermissionState = useCallback(async () => {
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
      try {
        const state = await getPushSubscriptionState();
        if (state.permission) {
          setPermission(state.permission);
        }
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    syncPermissionState();
  }, [isOpen, syncPermissionState]);

  // Listen for global push status updates
  useEffect(() => {
    const handlePushStatus = (e) => {
      if (e.detail?.permission) {
        setPermission(e.detail.permission);
      }
    };
    window.addEventListener('visitexpo_push_status_change', handlePushStatus);
    return () => window.removeEventListener('visitexpo_push_status_change', handlePushStatus);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request browser push permission & activate OneSignal
  const handleEnablePush = async () => {
    setEnablingPush(true);
    const safetyTimer = setTimeout(() => {
      setEnablingPush(false);
    }, 4500);

    try {
      const res = await enablePushSubscription(user);
      if (res.success) {
        setPermission('granted');
        Swal.fire({
          icon: 'success',
          title: 'Push Notifications Active!',
          text: 'Growth plan desktop notifications are now active. You will receive instant desktop alerts when visitors register or leads arrive.',
          confirmButtonColor: '#FF2E63',
          confirmButtonText: 'Great!'
        });
      } else {
        if (res.status) {
          setPermission(res.status);
        }
        if (res.reason === 'PERMISSION_BLOCKED') {
          const originHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
          Swal.fire({
            icon: 'warning',
            title: 'Notifications Blocked in Browser',
            html: `
              <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #4b5563;">
                <p style="margin-bottom: 8px;">Your browser has blocked push notifications for <strong>${originHost}</strong>.</p>
                <p style="font-weight: 700; margin-bottom: 6px; color: #111827;">To unblock and enable alerts:</p>
                <ol style="margin-left: 20px; margin-bottom: 12px; font-weight: 500;">
                  <li style="margin-bottom: 4px;">Click the <strong>Settings / Tune icon</strong> (or padlock) to the left of the address bar.</li>
                  <li style="margin-bottom: 4px;">Find <strong>Notifications</strong> and change it to <strong>Allow</strong>.</li>
                  <li>Refresh this dashboard page.</li>
                </ol>
              </div>
            `,
            confirmButtonColor: '#FF2E63',
            confirmButtonText: 'Understood'
          });
        } else if (res.reason === 'PERMISSION_DISMISSED') {
          Swal.fire({
            icon: 'info',
            title: 'Permission Dismissed',
            text: 'You dismissed the notification prompt. Please click "Enable Browser Push" again and select "Allow" to receive instant alerts.',
            confirmButtonColor: '#FF2E63',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Could Not Enable Push',
            text: res.message || 'An error occurred while enabling push notifications. Please check your browser settings.',
            confirmButtonColor: '#FF2E63'
          });
        }
      }
    } catch (err) {
      console.error('[NotificationBell] enablePush error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to request notification permission.',
        confirmButtonColor: '#FF2E63'
      });
    } finally {
      clearTimeout(safetyTimer);
      setEnablingPush(false);
    }
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    if (notifications.length === 0) return;
    const confirm = await Swal.fire({
      title: 'Clear all alerts?',
      text: 'This will remove all notifications from your notification center.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF2E63',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel'
    });

    if (!confirm.isConfirmed) return;

    setClearingAll(true);
    try {
      await axios.delete(`${API_URL}/notifications/clear-all`);
      setNotifications([]);
      setUnreadCount(0);
      seenNotifIdsRef.current.clear();
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setClearingAll(false);
    }
  };

  // Delete single notification
  const handleDeleteOne = async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const target = notifications.find((n) => n._id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.warn('Failed to delete notification:', err);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await axios.patch(`${API_URL}/notifications/read-all`);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Mark all read error:', err);
    }
  };

  // Mark single notification as read
  const handleMarkOneRead = async (id) => {
    try {
      await axios.patch(`${API_URL}/notifications/${id}/read`);
      setNotifications((prev) => (prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  // Helper for notification icons (Strictly NO Sparkle icons)
  const getNotificationIcon = (metadata) => {
    const type = metadata?.eventType || metadata?.type;
    switch (type) {
      case 'visitor':
        return <Users className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'lead':
        return <Target className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      case 'follower':
        return <Bookmark className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
      case 'interested':
        return <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  // Format relative time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer btn-press active:scale-95"
        title="Web Push Notifications & Activity Alerts"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup: 100% Solid background to eliminate bleed-through */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16161a] shadow-2xl z-50 overflow-hidden flex flex-col text-foreground animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Push Alerts &amp; Activity
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && <span className="text-zinc-300 dark:text-zinc-700 text-xs">•</span>}
                  <button
                    onClick={handleClearNotifications}
                    disabled={clearingAll}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                    title="Clear all alerts"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear all</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Growth Plan Status Banner */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
            {hasGrowthPlan ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>Growth Web Push Active</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Growth Plan
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Real-time push notifications are active via your Organizer Growth Engine. You will receive instant desktop &amp; mobile alerts when visitors register, leads arrive, or attendees follow your expos.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {permission === 'granted' ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Desktop Push Active</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnablePush}
                      disabled={enablingPush}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
                    >
                      {enablingPush ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enabling...
                        </>
                      ) : (
                        <>
                          <Radio className="h-3.5 w-3.5" /> Enable Browser Push
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Radio className="h-3.5 w-3.5" />
                    <span>Real-Time Web Push Alerts</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Growth Plan Add-on
                  </span>
                </div>
                {canTakeGrowth ? (
                  <>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      Web push alerts are exclusively powered by the <strong>Growth Plan</strong> add-on. Since you have an active <strong>{user?.plan ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan` : 'Organizer Plan'}</strong>, you can activate the Growth Plan to receive instant desktop alerts when visitors register, leads arrive, or attendees follow your expos.
                    </p>
                    <Link
                      href="/pricing#growth-catalog"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-sm transition-all cursor-pointer mt-1 active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5" /> Add Growth Plan &amp; Web Push
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      Web push alerts are powered by the <strong>Growth Plan</strong> add-on, available exclusively to organizers on the <strong>Starter</strong> or <strong>Enterprise</strong> plan. Organizers on the Free Plan cannot purchase Growth top-ups directly.
                    </p>
                    <Link
                      href="/pricing"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-sm transition-all cursor-pointer mt-1 active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5" /> Upgrade to Starter or Enterprise
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#16161a]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mx-auto">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No alerts yet</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  When visitors register, leads arrive, or attendees show interest in your events, real-time alerts will appear right here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleMarkOneRead(item._id)}
                  className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 relative ${
                    !item.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0 mt-0.5">
                    {getNotificationIcon(item.metadata)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.metadata?.eventTitle && (
                      <span className="inline-block text-[10px] font-semibold text-primary mt-0.5">
                        Expo: {item.metadata.eventTitle}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOne(item._id);
                      }}
                      className="opacity-40 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer"
                      title="Clear notification"
                      aria-label="Clear notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View Link */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <Link
              href="/visitors"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Registered Visitors &amp; Leads</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
