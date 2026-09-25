'use client';

/**
 * @file AuthContext.js
 * @description React context to maintain logged-in user profile, roles, and auth states.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Set axios default withCredentials at module level
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

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
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExhibitorView, setIsExhibitorViewState] = useState(false);
  const [hasExhibitorProfile, setHasExhibitorProfile] = useState(false);

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

  // Sync initial view mode when user session loads
  useEffect(() => {
    if (user) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('visitexpo_view_mode');
        if (saved === 'exhibitor') {
          setIsExhibitorViewState(true);
          return;
        }
        if (saved === 'organizer') {
          setIsExhibitorViewState(false);
          return;
        }
      }
      // Default: exhibitor role starts in exhibitor view; organizer starts in organizer view
      setIsExhibitorViewState(user.role === 'exhibitor');
    }
  }, [user?.role]);

  const checkExhibitorProfile = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/exhibitors/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setHasExhibitorProfile(true);
      } else {
        setHasExhibitorProfile(false);
      }
    } catch (err) {
      setHasExhibitorProfile(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      checkExhibitorProfile(accessToken);
    } else {
      setHasExhibitorProfile(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_refresh_token') : null;
        // Try to fetch new access token using HttpOnly refresh cookie or stored fallback token
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken || undefined
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
      } catch (error) {
        // If refresh fails with 401/403, clear stale stored auth
        if (error.response?.status === 401 || error.response?.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('visitexpo_refresh_token');
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

    // Axios Interceptor to auto-refresh expired access tokens seamlessly on 401
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url.includes('/auth/refresh') &&
          !originalRequest.url.includes('/auth/login')
        ) {
          originalRequest._retry = true;
          try {
            const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_refresh_token') : null;
            const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken: storedRefreshToken || undefined
            });
            if (refreshRes.data && refreshRes.data.accessToken) {
              const newToken = refreshRes.data.accessToken;
              setAccessToken(newToken);
              if (refreshRes.data.refreshToken && typeof window !== 'undefined') {
                localStorage.setItem('visitexpo_refresh_token', refreshRes.data.refreshToken);
              }
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshErr) {
            console.warn('Auto refresh failed, clearing session.');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('visitexpo_refresh_token');
              localStorage.removeItem('visitexpo_user');
            }
            setUser(null);
            setAccessToken(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

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

  const signup = async (name, email, password, orgName, role = 'organizer') => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        organizationName: orgName,
        role
      });
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_user', JSON.stringify(res.data.user));
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
    setLoading(true);
    try {
      if (accessToken) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
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
        localStorage.removeItem('visitexpo_refresh_token');
      }
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      login,
      signup,
      loginWithGoogle,
      logout,
      updateUser: (updatedUser) => setUser(updatedUser),
      isExhibitorView,
      setIsExhibitorView,
      toggleDashboardView,
      hasExhibitorProfile
    }}>
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
