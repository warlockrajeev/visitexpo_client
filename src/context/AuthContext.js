'use client';

/**
 * @file AuthContext.js
 * @description React context to maintain logged-in user profile, roles, and auth states.
 * Includes concurrency-safe token refresh mutex queue, automatic Bearer request interceptors,
 * and multi-tab session synchronization to prevent premature logouts on tab shifts.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { showSweetConfirm } from '../utils/sweetalert.js';

// Set axios default withCredentials at module level
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

// Module-level token & mutex state to coordinate across all concurrent API calls
let activeAccessToken = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_access_token') : null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach Axios Interceptors once at module level (guarded against Fast Refresh duplicate attachment)
if (typeof window !== 'undefined' && !window.__visitexpo_interceptors_attached) {
  window.__visitexpo_interceptors_attached = true;

  // 1. Request Interceptor: Automatically attach Bearer token to all outbound Axios calls if missing
  axios.interceptors.request.use(
    (config) => {
      if (!config.headers) {
        config.headers = {};
      }
      if (!config.headers['Authorization'] && !config.headers.authorization) {
        const token =
          activeAccessToken ||
          (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_access_token') : null);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: Mutex-locked concurrency-safe auto-refresh queue on 401
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response &&
        error.response.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/signup')
      ) {
        if (isRefreshing) {
          // In-flight refresh is already running: queue this request until it resolves
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              originalRequest._retry = true;
              return axios(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const storedRefreshToken =
            typeof window !== 'undefined' ? localStorage.getItem('visitexpo_refresh_token') : null;

          if (!storedRefreshToken) {
            throw new Error('No refresh token available in storage');
          }

          const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken
          });

          if (refreshRes.data && refreshRes.data.accessToken) {
            const newToken = refreshRes.data.accessToken;
            activeAccessToken = newToken;

            if (typeof window !== 'undefined') {
              localStorage.setItem('visitexpo_access_token', newToken);
              if (refreshRes.data.refreshToken) {
                localStorage.setItem('visitexpo_refresh_token', refreshRes.data.refreshToken);
              }
              window.dispatchEvent(new CustomEvent('visitexpo_token_refreshed', { detail: newToken }));
            }

            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            throw new Error('Invalid refresh response payload');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);

          // ONLY clear session if server rejected with 401/403 or token is completely absent
          // Never clear session on transient network disconnects or 5xx errors
          if (
            refreshErr.response?.status === 401 ||
            refreshErr.response?.status === 403 ||
            refreshErr.message === 'No refresh token available in storage'
          ) {
            console.warn('Session expired or revoked. Logging out.', refreshErr.message);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('visitexpo_refresh_token');
              localStorage.removeItem('visitexpo_access_token');
              localStorage.removeItem('visitexpo_user');
              localStorage.removeItem('visitexpo_view_mode');
              window.dispatchEvent(new CustomEvent('visitexpo_session_cleared'));
            }
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [accessToken, setAccessTokenState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('visitexpo_access_token') || null;
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [isExhibitorView, setIsExhibitorViewState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('visitexpo_view_mode');
      if (saved === 'exhibitor') return true;
      if (saved === 'organizer') return false;
      try {
        const savedUser = localStorage.getItem('visitexpo_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          return parsed.role === 'exhibitor';
        }
      } catch (_) {}
    }
    return false;
  });
  const [hasExhibitorProfile, setHasExhibitorProfile] = useState(false);

  // Synchronize access token across state, module variable, and localStorage
  const setAccessToken = useCallback((token) => {
    activeAccessToken = token;
    setAccessTokenState(token);
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('visitexpo_access_token', token);
      } else {
        localStorage.removeItem('visitexpo_access_token');
      }
    }
  }, []);

  // Synchronized view switcher that updates state & localStorage
  const setIsExhibitorView = (val) => {
    setIsExhibitorViewState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_view_mode', val ? 'exhibitor' : 'organizer');
    }
  };

  const toggleDashboardView = () => {
    const nextVal = !isExhibitorView;
    setIsExhibitorView(nextVal);
    return nextVal;
  };

  // Sync view mode when user role changes
  useEffect(() => {
    if (user) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('visitexpo_view_mode');
        if (saved === 'exhibitor' || saved === 'organizer') {
          return;
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExhibitorViewState(user.role === 'exhibitor');
    }
  }, [user]);

  useEffect(() => {
    let isCancelled = false;
    if (accessToken) {
      axios
        .get(`${API_URL}/exhibitors/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then((res) => {
          if (!isCancelled) {
            setHasExhibitorProfile(Boolean(res.data?.success && res.data.data?.length > 0));
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setHasExhibitorProfile(false);
          }
        });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasExhibitorProfile(false);
    }
    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  // Listen to multi-tab storage events and in-window interceptor events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === 'visitexpo_access_token') {
        setAccessTokenState(e.newValue || null);
        activeAccessToken = e.newValue || null;
      }
      if (e.key === 'visitexpo_user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (_) {}
        } else {
          setUser(null);
        }
      }
    };

    const handleTokenRefreshed = (e) => {
      if (e.detail) {
        setAccessTokenState(e.detail);
        activeAccessToken = e.detail;
      }
    };

    const handleSessionCleared = () => {
      setUser(null);
      setAccessTokenState(null);
      activeAccessToken = null;
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visitexpo_token_refreshed', handleTokenRefreshed);
    window.addEventListener('visitexpo_session_cleared', handleSessionCleared);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visitexpo_token_refreshed', handleTokenRefreshed);
      window.removeEventListener('visitexpo_session_cleared', handleSessionCleared);
    };
  }, []);

  // Initial Auth Hydration
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken =
          typeof window !== 'undefined' ? localStorage.getItem('visitexpo_access_token') : null;
        const storedRefreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('visitexpo_refresh_token') : null;

        // If no credentials exist in storage, user is a guest
        if (!storedAccessToken && !storedRefreshToken) {
          setLoading(false);
          return;
        }

        // 1. If we already have a stored access token, test validity with /auth/me
        if (storedAccessToken) {
          try {
            const userRes = await axios.get(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${storedAccessToken}` }
            });
            if (userRes.data?.user) {
              setUser(userRes.data.user);
              setAccessToken(storedAccessToken);
              if (typeof window !== 'undefined') {
                localStorage.setItem('visitexpo_user', JSON.stringify(userRes.data.user));
              }
              setLoading(false);
              return;
            }
          } catch (meErr) {
            // If /auth/me returned 401, accessToken is expired; fall through to refresh
            if (meErr.response && meErr.response.status !== 401 && meErr.response.status !== 403) {
              // Network error or 5xx: preserve existing session, do not log out
              setLoading(false);
              return;
            }
          }
        }

        // 2. Fetch new access token using refresh token
        if (storedRefreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken
          });

          if (res.data && res.data.accessToken) {
            const token = res.data.accessToken;
            setAccessToken(token);
            if (res.data.refreshToken && typeof window !== 'undefined') {
              localStorage.setItem('visitexpo_refresh_token', res.data.refreshToken);
            }

            // Get user details
            const userRes = await axios.get(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            setUser(userRes.data.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('visitexpo_user', JSON.stringify(userRes.data.user));
            }
          }
        }
      } catch (error) {
        // If refresh fails with 401/403, clear stale stored auth
        if (error.response?.status === 401 || error.response?.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('visitexpo_refresh_token');
            localStorage.removeItem('visitexpo_access_token');
            localStorage.removeItem('visitexpo_user');
          }
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setAccessToken]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        role: role || undefined
      });
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_user', JSON.stringify(res.data.user));
        if (res.data.accessToken) {
          localStorage.setItem('visitexpo_access_token', res.data.accessToken);
        }
        if (res.data.refreshToken) {
          localStorage.setItem('visitexpo_refresh_token', res.data.refreshToken);
        }
      }
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Invalid credentials';
      return { success: false, error: msg, registeredRole: error.response?.data?.registeredRole };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, orgName, role = 'organizer', extraData = {}) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        organizationName: orgName,
        role,
        ...extraData
      });
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_user', JSON.stringify(res.data.user));
        if (res.data.accessToken) {
          localStorage.setItem('visitexpo_access_token', res.data.accessToken);
        }
        if (res.data.refreshToken) {
          localStorage.setItem('visitexpo_refresh_token', res.data.refreshToken);
        }
      }
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed';
      return { success: false, error: msg, registeredRole: error.response?.data?.registeredRole };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googlePayload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/google`, googlePayload);
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_user', JSON.stringify(res.data.user));
        if (res.data.accessToken) {
          localStorage.setItem('visitexpo_access_token', res.data.accessToken);
        }
        if (res.data.refreshToken) {
          localStorage.setItem('visitexpo_refresh_token', res.data.refreshToken);
        }
      }
      return { success: true, user: res.data.user };
    } catch (error) {
      const msg = error.response?.data?.error || 'Google authentication failed';
      return { success: false, error: msg, registeredRole: error.response?.data?.registeredRole };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const confirmed = await showSweetConfirm({
      title: 'Log out?',
      text: 'Are you sure you want to log out?',
      confirmButtonText: 'Log out',
      cancelButtonText: 'Stay signed in',
      isDanger: false
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      if (accessToken) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsExhibitorViewState(false);
      setHasExhibitorProfile(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('visitexpo_view_mode');
        localStorage.removeItem('visitexpo_user');
        localStorage.removeItem('visitexpo_access_token');
        localStorage.removeItem('visitexpo_refresh_token');
      }
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUser: (updatedUser) => {
          setUser(updatedUser);
          if (typeof window !== 'undefined' && updatedUser) {
            try {
              localStorage.setItem('visitexpo_user', JSON.stringify(updatedUser));
            } catch (e) {}
          }
        },
        isExhibitorView,
        setIsExhibitorView,
        toggleDashboardView,
        hasExhibitorProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
