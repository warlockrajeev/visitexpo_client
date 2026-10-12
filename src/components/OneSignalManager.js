'use client';

/**
 * @file OneSignalManager.js
 * @description OneSignal Web SDK (v16) background manager.
 * Push notifications are strictly enabled for organizers on the Growth plan.
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.js';
import { initOneSignal, enablePushSubscription, getOneSignal } from '../utils/oneSignal.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OneSignalManager() {
  const { user } = useAuth();
  const [canReceivePush, setCanReceivePush] = useState(
    Boolean(user?.role === 'organizer' && (user?.hasGrowthPlan || (user?.plan || '').toLowerCase() === 'growth'))
  );

  useEffect(() => {
    if (!user || user.role !== 'organizer') {
      setCanReceivePush(false);
      return;
    }

    if (user.hasGrowthPlan || (user?.plan || '').toLowerCase() === 'growth') {
      setCanReceivePush(true);
      return;
    }

    // Verify backend status in case growth add-on was activated in database or subscription
    let active = true;
    axios.get(`${API_URL}/notifications/status`)
      .then((res) => {
        if (active && res.data?.success && res.data?.data?.canReceivePush) {
          setCanReceivePush(true);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!canReceivePush || !user) return;

    let mounted = true;

    initOneSignal(user).then((OneSignal) => {
      if (!OneSignal || !mounted) return;

      // Listen for subscription state change
      if (OneSignal.User?.PushSubscription?.addEventListener) {
        OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          const currentOptIn = event?.current?.optedIn ?? false;
          window.dispatchEvent(
            new CustomEvent('visitexpo_push_status_change', {
              detail: { optedIn: currentOptIn }
            })
          );
        });
      }

      // Listen for notification permission change
      if (OneSignal.Notifications?.addEventListener) {
        OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
          window.dispatchEvent(
            new CustomEvent('visitexpo_push_status_change', {
              detail: { permission: permission ? 'granted' : 'denied' }
            })
          );
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [canReceivePush, user]);

  // Listener for requests to enable push triggered from anywhere
  useEffect(() => {
    const handleRequestPush = async () => {
      if (!canReceivePush) return;
      await enablePushSubscription(user);
    };

    window.addEventListener('visitexpo_request_push_permission', handleRequestPush);
    return () => {
      window.removeEventListener('visitexpo_request_push_permission', handleRequestPush);
    };
  }, [canReceivePush, user]);

  return null;
}
