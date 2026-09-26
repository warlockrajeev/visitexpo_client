'use client';

/**
 * @file sweetalert.js
 * @description Theme-aware SweetAlert2 utility for VisitExpo platform.
 * Replaces native browser alerts and confirmations with branded, animated modals.
 */

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Helper to determine current theme from document class
 */
const isDarkMode = () => {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
};

/**
 * Creates base themed SweetAlert config
 */
const getThemeConfig = () => {
  const dark = isDarkMode();
  return {
    background: dark ? '#18181b' : '#ffffff',
    color: dark ? '#f4f4f5' : '#18181b',
    backdrop: 'rgba(0, 0, 0, 0.65)',
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: dark ? '#27272a' : '#e4e4e7',
    customClass: {
      popup: 'visitexpo-swal-popup',
      title: 'visitexpo-swal-title',
      htmlContainer: 'visitexpo-swal-text',
      confirmButton: 'visitexpo-swal-confirm-btn',
      cancelButton: 'visitexpo-swal-cancel-btn',
      actions: 'visitexpo-swal-actions'
    },
    buttonsStyling: false,
    showClass: {
      popup: 'swal2-show'
    },
    hideClass: {
      popup: '' // Closes immediately without waiting for CSS animationend events
    }
  };
};

/**
 * Display a sweet alert dialog
 * @param {string|object} messageOrOptions 
 * @param {'info'|'success'|'warning'|'error'|'question'} type 
 * @param {string} title 
 * @returns {Promise}
 */
export const showSweetAlert = (messageOrOptions, type = 'info', title = '') => {
  if (typeof window === 'undefined') return Promise.resolve();

  let text = '';
  let html = undefined;
  let icon = type;
  let customTitle = title;
  let confirmText = 'OK';
  let extraOptions = {};

  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    text = messageOrOptions.text || messageOrOptions.message || '';
    html = messageOrOptions.html;
    icon = messageOrOptions.icon || type;
    customTitle = messageOrOptions.title || customTitle;
    confirmText = messageOrOptions.confirmButtonText || confirmText;

    // Forward any extra SweetAlert2 options (showConfirmButton, showCloseButton, etc.)
    const { text: _t, message: _m, html: _h, icon: _i, title: _tt, confirmButtonText: _c, ...rest } = messageOrOptions;
    extraOptions = rest;
  } else {
    const rawStr = String(messageOrOptions || '');
    if (/<[a-z][\s\S]*>/i.test(rawStr)) {
      html = rawStr;
    } else {
      text = rawStr;
    }
  }

  if (!customTitle) {
    switch (icon) {
      case 'success':
        customTitle = 'Success';
        break;
      case 'error':
        customTitle = 'Error';
        break;
      case 'warning':
        customTitle = 'Attention';
        break;
      default:
        customTitle = 'Notice';
    }
  }

  const baseConfig = getThemeConfig();

  return Swal.fire({
    ...baseConfig,
    title: customTitle,
    ...(html ? { html } : { text }),
    icon,
    confirmButtonText: confirmText,
    ...extraOptions
  });
};

/**
 * Display an interactive sweet confirmation dialog
 * @param {string|object} titleOrOptions 
 * @param {string} text 
 * @param {object} customConfig
 * @returns {Promise<boolean>} Resolves to true if user confirmed, false otherwise
 */
export const showSweetConfirm = async (titleOrOptions, text = '', customConfig = {}) => {
  if (typeof window === 'undefined') return false;

  let title = 'Are you sure?';
  let message = text;
  let icon = 'warning';
  let confirmButtonText = 'Yes, Proceed';
  let cancelButtonText = 'Cancel';
  let isDanger = true;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || title;
    message = titleOrOptions.text || titleOrOptions.message || message;
    icon = titleOrOptions.icon || icon;
    confirmButtonText = titleOrOptions.confirmButtonText || confirmButtonText;
    cancelButtonText = titleOrOptions.cancelButtonText || cancelButtonText;
    isDanger = titleOrOptions.isDanger !== undefined ? titleOrOptions.isDanger : true;
  } else if (titleOrOptions) {
    title = titleOrOptions;
  }

  const baseConfig = getThemeConfig();

  const result = await Swal.fire({
    ...baseConfig,
    title,
    text: message,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: isDanger ? 'visitexpo-swal-confirm-danger-btn' : 'visitexpo-swal-confirm-btn'
    },
    ...customConfig
  });

  return Boolean(result.isConfirmed);
};

export const showSweetSuccess = (message, title = 'Success') => {
  return showSweetAlert(message, 'success', title);
};

export const showSweetError = (message, title = 'Error') => {
  return showSweetAlert(message, 'error', title);
};

export const showSweetWarning = (message, title = 'Attention') => {
  return showSweetAlert(message, 'warning', title);
};

export const showSweetInfo = (message, title = 'Notice') => {
  return showSweetAlert(message, 'info', title);
};

/**
 * Initializes global browser interceptors so that any legacy window.alert
 * renders as a SweetAlert instead of native browser popup.
 */
export const initSweetAlertInterceptors = () => {
  if (typeof window === 'undefined') return;

  // Intercept window.alert
  window.alert = (message) => {
    showSweetAlert(String(message ?? ''));
  };
};

export default Swal;
