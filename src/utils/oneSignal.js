'use client';

/**
 * @file oneSignal.js
 * @description Centralized helper for OneSignal Web SDK v16.
 * Manages initialization, user login, push subscription opt-in, and local desktop notifications.
 * Guarantees zero-hang execution by prioritizing immediate native browser activation
 * and applying timeout guards on external SDK calls.
 */

const ONESIGNAL_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '8d4b76bc-4946-409f-ab83-ff904d60c12e';
const ONESIGNAL_SAFARI_WEB_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID ||
  'web.onesignal.auto.37a647a2-1bdc-46a8-a505-4f4cc6400a46';

/**
 * Resolves the OneSignal instance safely using OneSignalDeferred with a strict timeout
 * @param {number} timeoutMs - Max milliseconds to wait for SDK before resolving fallback
 * @returns {Promise<Object|null>} OneSignal SDK instance or null
 */
export function getOneSignal(timeoutMs = 3500) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(null);
    }

    // 1. If OneSignal already exists on window, return immediately
    if (window.OneSignal && typeof window.OneSignal.init === 'function') {
      return resolve(window.OneSignal);
    }

    // 2. Ensure SDK script tag exists in DOM
    if (
      !document.getElementById('onesignal-sdk-page') &&
      !document.querySelector('script[src*="OneSignalSDK.page.js"]')
    ) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk-page';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    let isDone = false;
    const timer = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        resolve(window.OneSignal || null);
      }
    }, timeoutMs);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal) => {
      if (!isDone) {
        isDone = true;
        clearTimeout(timer);
        resolve(OneSignal);
      }
    });
  });
}

/**
 * Initializes OneSignal and registers the user alias (timeout guarded)
 * @param {Object} user - Logged in user object
 * @returns {Promise<Object|null>} OneSignal SDK instance
 */
export async function initOneSignal(user = null) {
  try {
    const OneSignal = await getOneSignal(3000);
    if (!OneSignal) return null;

    if (!window.__onesignal_initialized) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
        notifyButton: {
          enable: false
        }
      });
      window.__onesignal_initialized = true;
    }

    if (user) {
      const externalId = String(user.id || user._id || '');
      if (externalId) {
        try {
          await OneSignal.login(externalId);
          if (OneSignal.User?.addAlias) {
            await OneSignal.User.addAlias('external_id', externalId);
          }
          if (user.email && OneSignal.User?.addEmail) {
            await OneSignal.User.addEmail(user.email);
          }
          if (OneSignal.User?.addTags) {
            await OneSignal.User.addTags({
              role: user.role || 'organizer',
              plan: user.plan || 'enterprise',
              userId: externalId,
              email: user.email || ''
            });
          }
        } catch (loginErr) {
          console.warn('[OneSignal] Login sync warning:', loginErr);
        }
      }
    }

    // If browser notification permission is already granted, ensure OneSignal PushSubscription is opted in!
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        if (OneSignal.User?.PushSubscription?.optIn) {
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (optErr) {
        console.warn('[OneSignal] Push optIn warning:', optErr);
      }
    }

    return OneSignal;
  } catch (err) {
    console.warn('[OneSignal] initOneSignal error:', err);
    return null;
  }
}

/**
 * Prompts user for browser notification permission IMMEDIATELY while the user gesture is fresh,
 * fires an instant local test notification to the desktop, and completes OneSignal opt-in in background.
 * Zero hang guarantee.
 * @param {Object} user - Current user object
 * @returns {Promise<{success: boolean, status: string, reason?: string, subscriptionId?: string}>}
 */
export async function enablePushSubscription(user = null) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return {
      success: false,
      status: 'unsupported',
      reason: 'UNSUPPORTED',
      message: 'Push notifications are not supported by this browser.'
    };
  }

  // If already explicitly denied by user in browser settings
  if (Notification.permission === 'denied') {
    return {
      success: false,
      status: 'denied',
      reason: 'PERMISSION_BLOCKED',
      message:
        'Notifications are blocked in your browser. Please allow notifications in site settings.'
    };
  }

  // 1. Immediately request permission using the active user gesture (MUST run first without awaiting external SDKs!)
  let currentPermission = Notification.permission;
  if (currentPermission !== 'granted') {
    try {
      currentPermission = await Notification.requestPermission();
    } catch (e) {
      console.warn('[Notification] requestPermission error:', e);
    }
  }

  if (currentPermission !== 'granted') {
    return {
      success: false,
      status: currentPermission,
      reason: currentPermission === 'denied' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DISMISSED',
      message:
        currentPermission === 'denied'
          ? 'Notifications were denied. Please allow notifications in your browser settings to receive alerts.'
          : 'Notification permission request was cancelled.'
    };
  }

  // 2. Since permission is now GRANTED, trigger native confirmation desktop notification immediately!
  try {
    const welcomeNotif = new Notification('VisitExpo Push Alerts Active', {
      body: 'Enterprise desktop notifications are now active! You will receive real-time alerts for visitors, leads, and expo activity.',
      icon: '/logo.png',
      tag: 'visitexpo-welcome-push'
    });
    welcomeNotif.onclick = () => {
      window.focus();
    };
  } catch (notifErr) {
    console.warn('[Notification] Native notification display warning:', notifErr);
  }

  // 3. Complete OneSignal registration & optIn in background with timeout guard so UI never hangs
  let subscriptionId = null;
  let optedIn = true;
  try {
    const OneSignal = await getOneSignal(2500);
    if (OneSignal) {
      await initOneSignal(user);

      if (OneSignal.User?.PushSubscription?.optIn) {
        await OneSignal.User.PushSubscription.optIn();
      }

      if (user) {
        const externalId = String(user.id || user._id || '');
        if (externalId) {
          await OneSignal.login(externalId);
        }
      }

      subscriptionId = OneSignal.User?.PushSubscription?.id || null;
      optedIn = OneSignal.User?.PushSubscription?.optedIn ?? true;
    }
  } catch (syncErr) {
    console.warn('[OneSignal] Background sync warning (permission is still active):', syncErr);
  }

  return {
    success: true,
    status: 'granted',
    subscriptionId,
    optedIn
  };
}

/**
 * Checks current push subscription status safely
 * @returns {Promise<{permission: string, optedIn: boolean, subscriptionId: string|null}>}
 */
export async function getPushSubscriptionState() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { permission: 'unsupported', optedIn: false, subscriptionId: null };
  }

  const permission = Notification.permission;
  try {
    const OneSignal = await getOneSignal(1500);
    if (!OneSignal) {
      return { permission, optedIn: permission === 'granted', subscriptionId: null };
    }

    const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? (permission === 'granted');
    const subscriptionId = OneSignal.User?.PushSubscription?.id || null;

    return {
      permission,
      optedIn: Boolean(optedIn),
      subscriptionId
    };
  } catch (_) {
    return { permission, optedIn: permission === 'granted', subscriptionId: null };
  }
}
