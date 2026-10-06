'use client';

/**
 * @file page.js (Settings & Profile)
 * @description Settings configuration panel dynamically customized by role:
 *  - Visitors: Attendee Profile (Name, Email, WhatsApp/Phone, City, Company, Designation) & Account Security
 *  - Organizers: Branding parameters, GST, Profile, and Security
 *  - Exhibitors: Booth profile, Company parameters, and Security
 *  Features:
 *  - Comprehensive form validation (email, phone, GST, URL)
 *  - Mobile number change detection with mandatory OTP verification via 2Factor.in
 *  - Google Auth user password setup (no current password required, allows dual sign-in)
 *  - Standard user password change (requires current password)
 *  - Eye button toggle for viewing/hiding passwords
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import { validateEventImage } from '../../../utils/imageValidation.js';
import { showSweetError } from '../../../utils/sweetalert.js';
import {
  Settings,
  Building,
  Shield,
  Globe,
  Mail,
  User,
  Phone,
  MapPin,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Share2,
  Loader2,
  Trash2,
  Briefcase,
  Ticket,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  MessageSquare,
  Calendar,
  Bell,
  Clock,
  Smartphone,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function SettingsPage() {
  const { user, accessToken, updateUser, isExhibitorView } = useAuth();
  const fileInputRef = useRef(null);
  const [logoValidation, setLogoValidation] = useState(null);

  const isVisitor = user?.role === 'visitor';
  const isExhibitor = isExhibitorView;

  const [activeTab, setActiveTab] = useState('profile'); // profile, security
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Live Chat Settings State
  const [chatSettings, setChatSettings] = useState({
    isChatEnabled: false,
    chatStatus: 'offline',
    chatWelcomeMessage: 'Hello! Welcome to our exhibition desk. How can we assist you today?',
    chatAutoReply: true
  });
  const [savingChat, setSavingChat] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'visitor') {
      axios
        .get(`${API_URL}/chat/settings`, { withCredentials: true })
        .then((res) => {
          if (res.data?.success && res.data.settings) {
            setChatSettings({
              isChatEnabled: !!res.data.settings.isChatEnabled,
              chatStatus: res.data.settings.chatStatus || 'offline',
              chatWelcomeMessage: res.data.settings.chatWelcomeMessage || '',
              chatAutoReply: res.data.settings.chatAutoReply !== false
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSaveChatSettings = async () => {
    setSavingChat(true);
    try {
      await axios.patch(`${API_URL}/chat/settings`, chatSettings, { withCredentials: true });
      setSaveSuccess('Live Chat settings updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update live chat settings.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingChat(false);
    }
  };

  // Calendar Sync & Reminder Preferences State
  const [calendarSettings, setCalendarSettings] = useState({
    autoSync: true,
    preferredProvider: 'google',
    googleConnected: false,
    googleEmail: '',
    outlookConnected: false,
    outlookEmail: '',
    reminderTimes: ['24h', '1h', '15m'],
    channels: { email: true, push: true, sms: false },
    timezone: 'Asia/Kolkata'
  });
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [calendarSaveSuccess, setCalendarSaveSuccess] = useState('');

  // Fetch Calendar Preferences
  useEffect(() => {
    const fetchCalendarPreferences = async () => {
      setLoadingCalendar(true);
      try {
        const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/calendar/preferences`, {
          headers,
          withCredentials: true
        });
        if (res.data?.success && res.data.preferences) {
          setCalendarSettings((prev) => ({
            ...prev,
            ...res.data.preferences,
            channels: {
              ...prev.channels,
              ...(res.data.preferences.channels || {})
            }
          }));
        }
      } catch (err) {
        console.error('Error fetching calendar preferences:', err);
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchCalendarPreferences();
  }, [accessToken, user]);

  // Save Calendar & Reminder Preferences with visible confirmation
  const handleSaveCalendarSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingCalendar(true);
    setCalendarSaveSuccess('');
    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(`${API_URL}/calendar/preferences`, calendarSettings, {
        headers,
        withCredentials: true
      });
      if (res.data?.success) {
        setCalendarSaveSuccess('✓ Reminder preferences saved successfully! New registrations will follow this schedule.');
        setSaveSuccess('Calendar sync & reminder preferences saved successfully!');
        setTimeout(() => setCalendarSaveSuccess(''), 6000);
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to save calendar preferences.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingCalendar(false);
    }
  };

  // Toggle/Connect Provider Account
  const handleToggleCalendarAccount = async (provider) => {
    const isConnected = provider === 'google' ? calendarSettings.googleConnected : calendarSettings.outlookConnected;
    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (isConnected) {
        // Disconnect
        const res = await axios.post(`${API_URL}/calendar/disconnect/${provider}`, {}, { headers, withCredentials: true });
        if (res.data?.success) {
          setCalendarSettings((prev) => ({
            ...prev,
            ...(provider === 'google' ? { googleConnected: false, googleEmail: '' } : { outlookConnected: false, outlookEmail: '' })
          }));
          setCalendarSaveSuccess(`✓ ${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} disconnected.`);
          setTimeout(() => setCalendarSaveSuccess(''), 4000);
        }
      } else {
        // Connect
        const accountEmail = user?.email || (provider === 'google' ? 'user@gmail.com' : 'user@outlook.com');
        const res = await axios.post(`${API_URL}/calendar/connect/${provider}`, { accountEmail }, { headers, withCredentials: true });
        if (res.data?.success) {
          setCalendarSettings((prev) => ({
            ...prev,
            ...(provider === 'google' ? { googleConnected: true, googleEmail: accountEmail } : { outlookConnected: true, outlookEmail: accountEmail })
          }));
          setCalendarSaveSuccess(`✓ ${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} connected successfully!`);
          setTimeout(() => setCalendarSaveSuccess(''), 4000);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || `Failed to update ${provider} connection.`);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Visitor Profile State
  const [visitorForm, setVisitorForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    designation: user?.designation || '',
    city: user?.city || ''
  });

  // Visitor Phone OTP States
  const [initialVisitorPhone, setInitialVisitorPhone] = useState('');
  const [visitorOtpSessionId, setVisitorOtpSessionId] = useState('');
  const [visitorOtpCode, setVisitorOtpCode] = useState('');
  const [visitorOtpSent, setVisitorOtpSent] = useState(false);
  const [visitorOtpSending, setVisitorOtpSending] = useState(false);
  const [visitorOtpVerifying, setVisitorOtpVerifying] = useState(false);
  const [visitorOtpTimer, setVisitorOtpTimer] = useState(0);
  const [visitorPhoneVerified, setVisitorPhoneVerified] = useState(true);
  const [visitorPhoneVerificationToken, setVisitorPhoneVerificationToken] = useState('');

  // User General Profile State (for organizers/exhibitors security tab)
  const [userProfileForm, setUserProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Organization Form State (for organizers/exhibitors)
  const [orgForm, setOrgForm] = useState({
    name: user?.organization?.name || '',
    description: user?.organization?.description || '',
    website: user?.organization?.website || '',
    email: user?.organization?.contact?.email || user?.email || '',
    phone: user?.organization?.contact?.phone || user?.phone || '',
    address: typeof user?.organization?.address === 'string' ? user?.organization?.address : user?.organization?.address?.street || '',
    gstNumber: user?.organization?.gst || '',
    logoUrl: user?.organization?.logo || '',
    socialLinkedIn: user?.organization?.social?.linkedIn || '',
    socialFacebook: user?.organization?.social?.facebook || '',
    socialInstagram: user?.organization?.social?.instagram || '',
    socialX: user?.organization?.social?.x || ''
  });

  // Org Phone OTP States
  const [initialOrgPhone, setInitialOrgPhone] = useState('');
  const [orgOtpSessionId, setOrgOtpSessionId] = useState('');
  const [orgOtpCode, setOrgOtpCode] = useState('');
  const [orgOtpSent, setOrgOtpSent] = useState(false);
  const [orgOtpSending, setOrgOtpSending] = useState(false);
  const [orgOtpVerifying, setOrgOtpVerifying] = useState(false);
  const [orgOtpTimer, setOrgOtpTimer] = useState(0);
  const [orgPhoneVerified, setOrgPhoneVerified] = useState(true);
  const [orgPhoneVerificationToken, setOrgPhoneVerificationToken] = useState('');
  const [orgPhoneError, setOrgPhoneError] = useState('');
  const [visitorPhoneError, setVisitorPhoneError] = useState('');

  // Password / Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Clean phone number helper (extract last 10 digits)
  const cleanDigits = (val) => String(val || '').replace(/\D/g, '').slice(-10);

  // Validation Helpers
  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const isValidGst = (gst) => {
    if (!gst) return true;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    return gstRegex.test(gst.trim());
  };

  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      new URL(formatted);
      return true;
    } catch {
      return false;
    }
  };

  // Google User Check (without custom password)
  const isGoogleWithoutPassword = user?.authProvider === 'google' && !user?.hasCustomPassword;

  // OTP Timers
  useEffect(() => {
    let interval = null;
    if (orgOtpTimer > 0) {
      interval = setInterval(() => setOrgOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [orgOtpTimer]);

  useEffect(() => {
    let interval = null;
    if (visitorOtpTimer > 0) {
      interval = setInterval(() => setVisitorOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [visitorOtpTimer]);

  // Keep tabs sanitized
  useEffect(() => {
    if (activeTab === 'api') {
      setActiveTab('profile');
    }
  }, [activeTab]);

  // Sync state when user context is updated or loaded
  useEffect(() => {
    if (user) {
      const userPhone = user.phone || '';
      const orgContactPhone = user.organization?.contact?.phone || user.phone || '';

      setVisitorForm({
        name: user.name || '',
        email: user.email || '',
        phone: userPhone,
        company: user.company || '',
        designation: user.designation || '',
        city: user.city || ''
      });
      setInitialVisitorPhone(userPhone);
      setVisitorPhoneVerified(true);
      setVisitorOtpSent(false);
      setVisitorOtpCode('');
      setVisitorPhoneVerificationToken('');

      setUserProfileForm({
        name: user.name || '',
        email: user.email || ''
      });

      if (user.organization) {
        setOrgForm({
          name: user.organization.name || '',
          description: user.organization.description || '',
          website: user.organization.website || '',
          email: user.organization.contact?.email || user.email || '',
          phone: orgContactPhone,
          address: typeof user.organization.address === 'string' ? user.organization.address : user.organization.address?.street || '',
          gstNumber: user.organization.gst || '',
          logoUrl: user.organization.logo || '',
          socialLinkedIn: user.organization.social?.linkedIn || '',
          socialFacebook: user.organization.social?.facebook || '',
          socialInstagram: user.organization.social?.instagram || '',
          socialX: user.organization.social?.x || ''
        });
        setInitialOrgPhone(orgContactPhone);
        setOrgPhoneVerified(true);
        setOrgOtpSent(false);
        setOrgOtpCode('');
        setOrgPhoneVerificationToken('');
      }
    }
  }, [user]);

  useEffect(() => {
    if (errorMessage) {
      showSweetError(errorMessage, 'Please review your details');
    }
  }, [errorMessage]);

  // Phone Change Handlers
  const handleOrgPhoneChange = (val) => {
    let digitCount = 0;
    const sanitizedPhone = val
      .replace(/[^0-9+\s\-()]/g, '')
      .split('')
      .filter((character) => {
        if (/\d/.test(character)) {
          digitCount += 1;
          return digitCount <= 15;
        }
        return true;
      })
      .join('');
    setOrgForm((prev) => ({ ...prev, phone: sanitizedPhone }));
    const digits = cleanDigits(sanitizedPhone);
    const initialDigits = cleanDigits(initialOrgPhone);
    const isInvalidPhone = sanitizedPhone.trim() && (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits));
    setOrgPhoneError(isInvalidPhone ? 'Enter a valid 10-digit Indian mobile number.' : '');
    if (digits === initialDigits) {
      setOrgPhoneVerified(true);
      setOrgOtpSent(false);
      setOrgOtpCode('');
    } else {
      setOrgPhoneVerified(false);
    }
  };

  const handleVisitorPhoneChange = (val) => {
    setVisitorForm((prev) => ({ ...prev, phone: val }));
    const digits = cleanDigits(val);
    const initialDigits = cleanDigits(initialVisitorPhone);
    const isInvalidPhone = val.trim() && (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits));
    setVisitorPhoneError(isInvalidPhone ? 'Enter a valid 10-digit Indian mobile number.' : '');
    if (digits === initialDigits) {
      setVisitorPhoneVerified(true);
      setVisitorOtpSent(false);
      setVisitorOtpCode('');
    } else {
      setVisitorPhoneVerified(false);
    }
  };

  // Dispatch OTP for Organizer Phone
  const handleSendOrgOtp = async () => {
    const digits = cleanDigits(orgForm.phone);
    if (!digits || digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setOrgOtpSending(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/otp/send`, { phone: digits });
      if (res.data && res.data.success) {
        setOrgOtpSessionId(res.data.sessionId);
        setOrgOtpSent(true);
        setOrgOtpTimer(30);
        setSaveSuccess(`OTP code sent successfully to +91 ${digits}`);
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setErrorMessage(res.data?.error || 'Failed to dispatch OTP.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch OTP. Please check mobile number.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setOrgOtpSending(false);
    }
  };

  // Verify OTP for Organizer Phone
  const handleVerifyOrgOtp = async () => {
    const digits = cleanDigits(orgForm.phone);
    if (!orgOtpCode || orgOtpCode.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code received on your mobile.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setOrgOtpVerifying(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/otp/verify`, {
        sessionId: orgOtpSessionId,
        otp: orgOtpCode.trim(),
        phone: digits
      });
      if (res.data && res.data.success) {
        setOrgPhoneVerified(true);
        setOrgPhoneVerificationToken(res.data.verificationToken);
        setSaveSuccess('Mobile number verified successfully via OTP!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setErrorMessage(res.data?.error || 'OTP verification failed. Please check the code.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Invalid or expired OTP code.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setOrgOtpVerifying(false);
    }
  };

  // Dispatch OTP for Visitor Phone
  const handleSendVisitorOtp = async () => {
    const digits = cleanDigits(visitorForm.phone);
    if (!digits || digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setVisitorOtpSending(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/otp/send`, { phone: digits });
      if (res.data && res.data.success) {
        setVisitorOtpSessionId(res.data.sessionId);
        setVisitorOtpSent(true);
        setVisitorOtpTimer(30);
        setSaveSuccess(`OTP code sent successfully to +91 ${digits}`);
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setErrorMessage(res.data?.error || 'Failed to dispatch OTP.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch OTP. Please check mobile number.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setVisitorOtpSending(false);
    }
  };

  // Verify OTP for Visitor Phone
  const handleVerifyVisitorOtp = async () => {
    const digits = cleanDigits(visitorForm.phone);
    if (!visitorOtpCode || visitorOtpCode.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code received on your mobile.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setVisitorOtpVerifying(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/otp/verify`, {
        sessionId: visitorOtpSessionId,
        otp: visitorOtpCode.trim(),
        phone: digits
      });
      if (res.data && res.data.success) {
        setVisitorPhoneVerified(true);
        setVisitorPhoneVerificationToken(res.data.verificationToken);
        setSaveSuccess('Mobile number verified successfully via OTP!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setErrorMessage(res.data?.error || 'OTP verification failed. Please check the code.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Invalid or expired OTP code.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setVisitorOtpVerifying(false);
    }
  };

  // Handle Visitor Profile Submit
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess('');
    setErrorMessage('');

    // Validations
    if (!visitorForm.name || visitorForm.name.trim().length < 2) {
      setErrorMessage('Full Name is required (minimum 2 characters).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingProfile(false);
      return;
    }

    if (!visitorForm.email || !isValidEmail(visitorForm.email)) {
      setErrorMessage('Please provide a valid email address.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingProfile(false);
      return;
    }

    const cleanVisitorDigits = cleanDigits(visitorForm.phone);
    if (visitorForm.phone && (cleanVisitorDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanVisitorDigits))) {
      setVisitorPhoneError('Enter a valid 10-digit Indian mobile number.');
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingProfile(false);
      return;
    }
    setVisitorPhoneError('');

    const initialVisDigits = cleanDigits(initialVisitorPhone);
    const isVisitorPhoneChanged = cleanVisitorDigits && cleanVisitorDigits !== initialVisDigits;
    if (isVisitorPhoneChanged && !visitorPhoneVerified) {
      setErrorMessage('You modified your mobile number. Please verify it via OTP before saving.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingProfile(false);
      return;
    }

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/auth/profile`,
        {
          name: visitorForm.name.trim(),
          email: visitorForm.email.trim(),
          phone: cleanVisitorDigits || visitorForm.phone,
          company: visitorForm.company,
          designation: visitorForm.designation,
          city: visitorForm.city,
          ...(isVisitorPhoneChanged ? { phoneVerificationToken: visitorPhoneVerificationToken } : {})
        },
        { headers }
      );

      if (res.data && res.data.success) {
        if (res.data.user && updateUser) {
          updateUser(res.data.user);
        }
        setInitialVisitorPhone(cleanVisitorDigits || visitorForm.phone);
        setVisitorPhoneVerified(true);
        setVisitorOtpSent(false);
        setVisitorOtpCode('');
        setVisitorPhoneVerificationToken('');
        setSaveSuccess('Attendee profile details updated and saved successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Save visitor profile error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save attendee profile.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Logo Upload (Organizer)
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateEventImage(file, 'logo');
    setLogoValidation(validation);

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setIsUploadingLogo(true);
    setSaveSuccess('');
    setErrorMessage('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      };
      const res = await axios.post(`${API_URL}/upload`, uploadData, { headers });
      if (res.data && res.data.success) {
        setOrgForm((prev) => ({ ...prev, logoUrl: res.data.url }));
        setSaveSuccess('Logo uploaded! Click "Save Profile" to persist changes.');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to upload logo.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Organizer Profile Form
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    setSaveSuccess('');
    setErrorMessage('');

    // Validations
    if (!orgForm.name || orgForm.name.trim().length < 2) {
      setErrorMessage('Organization / Brand Name is required (minimum 2 characters).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

    if (orgForm.email && !isValidEmail(orgForm.email)) {
      setErrorMessage('Please enter a valid business email address.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

    const cleanPhoneDigits = cleanDigits(orgForm.phone);
    if (orgForm.phone && (cleanPhoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhoneDigits))) {
      setOrgPhoneError('Enter a valid 10-digit Indian mobile number.');
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }
    setOrgPhoneError('');

    const initialDigits = cleanDigits(initialOrgPhone);
    const isPhoneChanged = cleanPhoneDigits && cleanPhoneDigits !== initialDigits;
    if (isPhoneChanged && !orgPhoneVerified) {
      setErrorMessage('You modified your contact phone number. Please verify it via OTP before saving.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

    if (orgForm.gstNumber && !isValidGst(orgForm.gstNumber)) {
      setErrorMessage('Invalid GST format. Must be a valid 15-character GSTIN (e.g. 07AAAAA1111A1Z1).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

    if (orgForm.website && !isValidUrl(orgForm.website)) {
      setErrorMessage('Please enter a valid website URL (e.g. https://example.com).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/auth/organization`,
        {
          name: orgForm.name.trim(),
          description: orgForm.description,
          website: orgForm.website,
          email: orgForm.email,
          phone: cleanPhoneDigits || orgForm.phone,
          address: orgForm.address,
          gst: orgForm.gstNumber ? orgForm.gstNumber.trim().toUpperCase() : '',
          logo: orgForm.logoUrl,
          socialLinkedIn: orgForm.socialLinkedIn,
          socialFacebook: orgForm.socialFacebook,
          socialInstagram: orgForm.socialInstagram,
          socialX: orgForm.socialX,
          ...(isPhoneChanged ? { phoneVerificationToken: orgPhoneVerificationToken } : {})
        },
        { headers }
      );

      if (res.data && res.data.success) {
        if (res.data.user && updateUser) {
          updateUser(res.data.user);
        }
        setInitialOrgPhone(cleanPhoneDigits || orgForm.phone);
        setOrgPhoneVerified(true);
        setOrgOtpSent(false);
        setOrgOtpCode('');
        setOrgPhoneVerificationToken('');
        setSaveSuccess('Organizer profile details updated and saved successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Save organization profile error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save organizer profile.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingOrg(false);
    }
  };

  // Submit Security & Access Form
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSavingSecurity(true);
    setSaveSuccess('');
    setErrorMessage('');

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // 1. If name or email changed (for organizer/exhibitor view)
      if (!isVisitor && (userProfileForm.name !== user?.name || userProfileForm.email !== user?.email)) {
        if (!userProfileForm.name || userProfileForm.name.trim().length < 2) {
          setErrorMessage('Active Account Name is required (minimum 2 characters).');
          setTimeout(() => setErrorMessage(''), 4000);
          setSavingSecurity(false);
          return;
        }
        if (!userProfileForm.email || !isValidEmail(userProfileForm.email)) {
          setErrorMessage('Please provide a valid login email address.');
          setTimeout(() => setErrorMessage(''), 4000);
          setSavingSecurity(false);
          return;
        }

        const profileRes = await axios.put(
          `${API_URL}/auth/profile`,
          {
            name: userProfileForm.name.trim(),
            email: userProfileForm.email.trim()
          },
          { headers }
        );
        if (profileRes.data?.user && updateUser) {
          updateUser(profileRes.data.user);
        }
      }

      // 2. Update Password Logic
      if (isGoogleWithoutPassword) {
        // Google auth user without custom password: only require new password
        if (securityForm.newPassword || securityForm.confirmPassword) {
          if (!securityForm.newPassword || securityForm.newPassword.length < 6) {
            setErrorMessage('New password must be at least 6 characters long.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }
          if (securityForm.newPassword !== securityForm.confirmPassword) {
            setErrorMessage('New password and confirmation password do not match.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }

          const res = await axios.put(
            `${API_URL}/auth/change-password`,
            { newPassword: securityForm.newPassword },
            { headers }
          );

          if (res.data?.user && updateUser) {
            updateUser(res.data.user);
          } else if (updateUser) {
            updateUser({ ...user, hasCustomPassword: true });
          }

          setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setSaveSuccess(
            res.data.message || 'Password set successfully! You can now log in with your email & password or Google.'
          );
          setTimeout(() => setSaveSuccess(''), 5000);
          setSavingSecurity(false);
          return;
        }
      } else {
        // Standard user or Google user who already created a password: require current password
        if (securityForm.currentPassword || securityForm.newPassword || securityForm.confirmPassword) {
          if (!securityForm.currentPassword) {
            setErrorMessage('Current password is required to authorize password change.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }
          if (!securityForm.newPassword || securityForm.newPassword.length < 6) {
            setErrorMessage('New password must be at least 6 characters long.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }
          if (securityForm.newPassword !== securityForm.confirmPassword) {
            setErrorMessage('New password and confirmation password do not match.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }
          if (securityForm.currentPassword === securityForm.newPassword) {
            setErrorMessage('New password cannot be the same as your current password.');
            setTimeout(() => setErrorMessage(''), 4000);
            setSavingSecurity(false);
            return;
          }

          const res = await axios.put(
            `${API_URL}/auth/change-password`,
            {
              currentPassword: securityForm.currentPassword,
              newPassword: securityForm.newPassword
            },
            { headers }
          );

          if (res.data?.user && updateUser) {
            updateUser(res.data.user);
          }

          setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setSaveSuccess(res.data.message || 'Security credentials updated successfully!');
          setTimeout(() => setSaveSuccess(''), 4000);
          setSavingSecurity(false);
          return;
        }
      }

      setSaveSuccess('Security profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error('Update security error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to update security credentials.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingSecurity(false);
    }
  };

  // Tab definitions based on user role
  const tabs = isVisitor
    ? [
        { id: 'profile', label: 'Attendee Profile', icon: User },
        { id: 'calendar', label: 'Calendar Sync & Reminders', icon: Calendar },
        { id: 'security', label: 'Security & Password', icon: Shield }
      ]
    : isExhibitor
    ? [
        { id: 'profile', label: 'Exhibitor Profile', icon: Building },
        { id: 'calendar', label: 'Calendar Sync & Reminders', icon: Calendar },
        { id: 'security', label: 'Security & Access', icon: Shield }
      ]
    : [
        { id: 'profile', label: 'Organizer Profile', icon: Building },
        { id: 'calendar', label: 'Calendar Sync & Reminders', icon: Calendar },
        { id: 'security', label: 'Security & Access', icon: Shield }
      ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {isVisitor
              ? 'Attendee Profile & Settings'
              : isExhibitor
              ? 'Exhibitor Profile & Settings'
              : 'Settings & Organizer Profile'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isVisitor
              ? 'Manage your personal attendee details, contact info for passes, and account security.'
              : isExhibitor
              ? 'Manage your exhibitor booth details, contact information, and security credentials.'
              : 'Configure branding parameters, company information, and update security credentials.'}
          </p>
        </div>

        {isVisitor ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary w-fit">
            <Ticket className="h-4 w-4" /> Verified Visitor / Attendee
          </div>
        ) : isExhibitor ? (
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-500 w-fit">
            <Building className="h-4 w-4" /> Verified Exhibitor
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-500 w-fit">
            <ShieldCheck className="h-4 w-4" /> Verified Organizer
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Side: Tabs buttons */}
        <div className="w-full md:w-64 bg-card border border-border rounded-2xl p-3 space-y-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Side: Tab Workspace panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          
          {/* VISITOR: Tab 1 Attendee Profile Form */}
          {activeTab === 'profile' && isVisitor && (
            <form onSubmit={handleVisitorSubmit} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Attendee Profile &amp; Pass Information
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                  Shown on event entry badges &amp; tickets
                </span>
              </div>

              {/* Attendee Identity Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-sm">
                  {(visitorForm.name || user?.name || 'V').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      {visitorForm.name || user?.name || 'Attendee'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Visitor Pass Holder
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {visitorForm.email || user?.email}
                  </p>
                  {visitorForm.company && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" /> {visitorForm.company}
                      {visitorForm.designation && ` • ${visitorForm.designation}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={visitorForm.name}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rajeev Haldar"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={visitorForm.email}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Phone / WhatsApp Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={visitorForm.phone}
                      onChange={(e) => handleVisitorPhoneChange(e.target.value)}
                      placeholder="+91 98765 43210"
                      aria-invalid={Boolean(visitorPhoneError)}
                      className={`w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 ${
                        visitorPhoneError ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-primary'
                      }`}
                    />
                  </div>
                  {visitorPhoneError && <p className="mt-1 text-[11px] font-semibold text-destructive">{visitorPhoneError}</p>}

                  {/* Visitor Phone Change OTP Verification Box */}
                  {cleanDigits(visitorForm.phone) !== cleanDigits(initialVisitorPhone) && (
                    <div className="mt-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Number Changed — Verify via OTP</span>
                        </div>
                        {visitorPhoneVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Unverified
                          </span>
                        )}
                      </div>

                      {!visitorPhoneVerified && (
                        <div className="space-y-2 pt-1">
                          {!visitorOtpSent ? (
                            <button
                              type="button"
                              onClick={handleSendVisitorOtp}
                              disabled={visitorOtpSending || cleanDigits(visitorForm.phone).length !== 10}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              {visitorOtpSending ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending OTP...
                                </>
                              ) : (
                                <>
                                  <Phone className="h-3.5 w-3.5" /> Send Verification OTP
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={visitorOtpCode}
                                onChange={(e) => setVisitorOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit OTP"
                                className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyVisitorOtp}
                                disabled={visitorOtpVerifying || visitorOtpCode.length < 4}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {visitorOtpVerifying ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> Verify Code
                                  </>
                                )}
                              </button>
                              {visitorOtpTimer > 0 ? (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  Resend in {visitorOtpTimer}s
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendVisitorOtp}
                                  disabled={visitorOtpSending}
                                  className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">City / Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={visitorForm.city}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. New Delhi, Mumbai, Bangalore"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Professional / Business Info for B2B Passes */}
              <div className="space-y-3 p-4 border border-border rounded-2xl bg-muted/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Professional Information (Optional - Used for B2B Expos &amp; Badges)
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Organization / Employer</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={visitorForm.company}
                        onChange={(e) => setVisitorForm((prev) => ({ ...prev, company: e.target.value }))}
                        placeholder="Company or Business Name"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Job Title / Designation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={visitorForm.designation}
                        onChange={(e) => setVisitorForm((prev) => ({ ...prev, designation: e.target.value }))}
                        placeholder="e.g. Procurement Lead, Buyer, Architect"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile || (cleanDigits(visitorForm.phone) !== cleanDigits(initialVisitorPhone) && !visitorPhoneVerified)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Attendee Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ORGANIZER / EXHIBITOR: Tab 1 Profile Form */}
          {activeTab === 'profile' && !isVisitor && (
            <form onSubmit={handleOrgSubmit} className="space-y-6">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> {isExhibitor ? 'Exhibitor Company Profile' : 'Organizer Brand Profile'}
              </h3>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {/* Logo Upload & URL Box */}
              <div className="space-y-3 p-4 border border-border rounded-2xl bg-muted/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-muted-foreground uppercase">
                    Brand Logo (Min: 100 × 100 px | Rec: 400 × 400 px)
                  </label>
                  {logoValidation?.dimensions && orgForm.logoUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      {logoValidation.dimensions.width} × {logoValidation.dimensions.height} px
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center shadow-sm relative">
                    {isUploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : orgForm.logoUrl ? (
                      <img src={orgForm.logoUrl} alt="Organization Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-2 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload Logo File
                      </button>

                      {orgForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrgForm((prev) => ({ ...prev, logoUrl: '' }));
                            setLogoValidation(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={orgForm.logoUrl}
                        onChange={(e) => setOrgForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png (or click Upload above)"
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Organization / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Global Tech Events Ltd"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">GST / Tax Identification Code</label>
                  <input
                    type="text"
                    value={orgForm.gstNumber}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    maxLength={15}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">15-digit GSTIN (e.g. 07AAAAA1111A1Z1)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Overview / Description</label>
                <textarea
                  rows={3}
                  value={orgForm.description}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a brief overview of your organization..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Official Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={orgForm.website}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Public Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={orgForm.email}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@company.com"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={orgForm.phone}
                      onChange={(e) => handleOrgPhoneChange(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Organizer Phone Change OTP Verification Box */}
                  {cleanDigits(orgForm.phone) !== cleanDigits(initialOrgPhone) && (
                    <div className="mt-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Number Changed — Verify via OTP</span>
                        </div>
                        {orgPhoneVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Unverified
                          </span>
                        )}
                      </div>

                      {!orgPhoneVerified && (
                        <div className="space-y-2 pt-1">
                          {!orgOtpSent ? (
                            <button
                              type="button"
                              onClick={handleSendOrgOtp}
                              disabled={orgOtpSending || cleanDigits(orgForm.phone).length !== 10}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              {orgOtpSending ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending OTP...
                                </>
                              ) : (
                                <>
                                  <Phone className="h-3.5 w-3.5" /> Send Verification OTP
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={orgOtpCode}
                                onChange={(e) => setOrgOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit OTP"
                                className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOrgOtp}
                                disabled={orgOtpVerifying || orgOtpCode.length < 4}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {orgOtpVerifying ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> Verify Code
                                  </>
                                )}
                              </button>
                              {orgOtpTimer > 0 ? (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  Resend in {orgOtpTimer}s
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendOrgOtp}
                                  disabled={orgOtpSending}
                                  className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">HQ Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={orgForm.address}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="City, Country or Street Address"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="border border-border/80 rounded-2xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Share2 className="h-4 w-4 text-primary" /> Social Links &amp; Handles
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="url"
                    value={orgForm.socialLinkedIn}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, socialLinkedIn: e.target.value }))}
                    placeholder="LinkedIn URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialFacebook}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, socialFacebook: e.target.value }))}
                    placeholder="Facebook URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialInstagram}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, socialInstagram: e.target.value }))}
                    placeholder="Instagram URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialX}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, socialX: e.target.value }))}
                    placeholder="X / Twitter URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* LIVE CHAT DESK PREFERENCES */}
              {!isExhibitor && (
                <div className="space-y-4 p-5 border border-primary/20 bg-primary/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Attendee & Exhibitor Live Chat Desk
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Allow visitors and prospective exhibitors to chat directly with your team on your expo pages.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chatSettings.isChatEnabled}
                        onChange={(e) =>
                          setChatSettings((prev) => ({
                            ...prev,
                            isChatEnabled: e.target.checked,
                            chatStatus: e.target.checked ? 'online' : 'offline'
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>

                  {chatSettings.isChatEnabled && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                          Custom Welcome Greeting Message
                        </label>
                        <textarea
                          rows={2}
                          value={chatSettings.chatWelcomeMessage}
                          onChange={(e) =>
                            setChatSettings((prev) => ({ ...prev, chatWelcomeMessage: e.target.value }))
                          }
                          placeholder="Type your greeting message..."
                          className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          Send greeting automatically on first message
                        </span>
                        <input
                          type="checkbox"
                          checked={chatSettings.chatAutoReply}
                          onChange={(e) =>
                            setChatSettings((prev) => ({ ...prev, chatAutoReply: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-border text-primary"
                        />
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSaveChatSettings}
                          disabled={savingChat}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                        >
                          {savingChat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Update Live Chat Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={savingOrg || (cleanDigits(orgForm.phone) !== cleanDigits(initialOrgPhone) && !orgPhoneVerified)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {savingOrg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save {isExhibitor ? 'Exhibitor Profile' : 'Organizer Profile'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab: Calendar Sync & Automated Reminders */}
          {activeTab === 'calendar' && (
            <form onSubmit={handleSaveCalendarSettings} className="space-y-6">
              <div className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Calendar Sync &amp; Automated Reminders
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sync registered trade exhibitions, session schedules, and digital QR passes to Google Calendar or Outlook with automated reminders.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingCalendar}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingCalendar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Preferences...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Preferences
                    </>
                  )}
                </button>
              </div>

              {/* VISIBLE SAVE CONFIRMATION BANNER (ACCEPTANCE CRITERIA) */}
              {calendarSaveSuccess && (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 transition-all shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-extrabold text-emerald-600">{calendarSaveSuccess}</div>
                    <div className="text-[11px] text-emerald-600/80 font-medium">
                      All new event registrations, digital badge downloads, and speaker sessions will automatically use these reminder rules.
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1: Automatic Sync Toggle & Primary Provider */}
              <div className="p-5 rounded-2xl bg-secondary/30 border border-border/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      Automatic Calendar Sync
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Automatically add confirmed trade exhibitions, attendee badges, and conference keynotes to your calendar upon registration.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={calendarSettings.autoSync}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, autoSync: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="block text-xs font-bold text-foreground mb-2">Primary Calendar Provider</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'google', label: 'Google Calendar', desc: 'Sync with Gmail & Android devices' },
                      { id: 'outlook', label: 'Outlook / Office 365', desc: 'Sync with Outlook & Windows devices' },
                      { id: 'ics', label: 'Apple Calendar / iCal (.ics)', desc: 'Standard universal calendar format' }
                    ].map((prov) => (
                      <div
                        key={prov.id}
                        onClick={() => setCalendarSettings({ ...calendarSettings, preferredProvider: prov.id })}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          calendarSettings.preferredProvider === prov.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                            : 'border-border bg-card hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-foreground">{prov.label}</span>
                          {calendarSettings.preferredProvider === prov.id && (
                            <Check className="h-4 w-4 text-primary font-bold" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{prov.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Connected Provider Accounts */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Connected Calendar Accounts
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Calendar Card */}
                  <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Google Calendar
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {calendarSettings.googleConnected
                            ? `Connected: ${calendarSettings.googleEmail || user?.email}`
                            : 'Syncs with Google Calendar web & mobile app'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        calendarSettings.googleConnected
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {calendarSettings.googleConnected ? 'Connected' : 'Available'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCalendarAccount('google')}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        calendarSettings.googleConnected
                          ? 'border border-destructive/30 text-destructive hover:bg-destructive/10'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs'
                      }`}
                    >
                      {calendarSettings.googleConnected ? 'Disconnect Google Account' : 'Connect Google Calendar'}
                    </button>
                  </div>

                  {/* Outlook Calendar Card */}
                  <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          Microsoft Outlook / 365
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {calendarSettings.outlookConnected
                            ? `Connected: ${calendarSettings.outlookEmail || user?.email}`
                            : 'Syncs with Microsoft Graph & Outlook Live'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        calendarSettings.outlookConnected
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {calendarSettings.outlookConnected ? 'Connected' : 'Available'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCalendarAccount('outlook')}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        calendarSettings.outlookConnected
                          ? 'border border-destructive/30 text-destructive hover:bg-destructive/10'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs'
                      }`}
                    >
                      {calendarSettings.outlookConnected ? 'Disconnect Outlook Account' : 'Connect Microsoft Outlook'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Scheduled Reminder Timelines (Acceptance Criteria) */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Scheduled Reminder Timelines
                </div>
                <p className="text-xs text-muted-foreground">
                  Select when you want to receive automatic reminder notifications prior to the exhibition start date:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: '24h', label: '24 Hours Before (1 Day)', desc: 'Ideal for venue travel preparation and printing badge QR codes.' },
                    { id: '2h', label: '2 Hours Before', desc: 'Alert for arrival, parking, and security clearance.' },
                    { id: '1h', label: '1 Hour Before', desc: 'Door opening alert and keynote stage notifications.' },
                    { id: '15m', label: '15 Minutes Before', desc: 'Final live alert before scheduled keynotes and seminars start.' }
                  ].map((rem) => {
                    const isChecked = (calendarSettings.reminderTimes || []).includes(rem.id);
                    return (
                      <label
                        key={rem.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border bg-secondary/10 hover:bg-secondary/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = calendarSettings.reminderTimes || [];
                            const updated = e.target.checked
                              ? [...current, rem.id]
                              : current.filter((t) => t !== rem.id);
                            setCalendarSettings({ ...calendarSettings, reminderTimes: updated });
                          }}
                          className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-extrabold text-foreground">{rem.label}</div>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">{rem.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Delivery Channels & Timezone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notification Delivery Channels */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    Delivery Channels
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/60 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">Email Notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={calendarSettings.channels?.email !== false}
                        onChange={(e) =>
                          setCalendarSettings({
                            ...calendarSettings,
                            channels: { ...calendarSettings.channels, email: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/60 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">Browser &amp; In-App Push Alerts</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={calendarSettings.channels?.push !== false}
                        onChange={(e) =>
                          setCalendarSettings({
                            ...calendarSettings,
                            channels: { ...calendarSettings.channels, push: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/60 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">SMS / WhatsApp Reminders</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!calendarSettings.channels?.sms}
                        onChange={(e) =>
                          setCalendarSettings({
                            ...calendarSettings,
                            channels: { ...calendarSettings.channels, sms: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                    </label>
                  </div>
                </div>

                {/* Target Timezone */}
                <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Preferred Timezone
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All calendar alerts and event start dates will be synchronized with this timezone:
                  </p>

                  <select
                    value={calendarSettings.timezone || 'Asia/Kolkata'}
                    onChange={(e) => setCalendarSettings({ ...calendarSettings, timezone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Asia/Kolkata">India Standard Time (IST - Asia/Kolkata)</option>
                    <option value="Asia/Dubai">Gulf Standard Time (GST - Asia/Dubai)</option>
                    <option value="Europe/London">Greenwich Mean Time / BST (Europe/London)</option>
                    <option value="America/New_York">Eastern Time (EST - America/New_York)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST - America/Los_Angeles)</option>
                    <option value="Asia/Singapore">Singapore Time (SGT - Asia/Singapore)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST - Asia/Tokyo)</option>
                    <option value="Europe/Berlin">Central European Time (CET - Europe/Berlin)</option>
                  </select>

                  <div className="text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/50">
                    💡 <span className="font-semibold text-foreground">Tip:</span> Calendar invites automatically adjust to local daylight saving time when opened on mobile devices.
                  </div>
                </div>
              </div>

              {/* Bottom Actions with Visible Save Confirmation */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Changes take effect immediately for upcoming event registrations.
                </span>

                <button
                  type="submit"
                  disabled={savingCalendar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingCalendar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Preferences...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Calendar &amp; Reminder Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-5">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <Shield className="h-5 w-5 text-primary" /> Security &amp; Password Credentials
              </h3>

              {!isVisitor && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Active Account Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={userProfileForm.name}
                        onChange={(e) => setUserProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Login Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={userProfileForm.email}
                        onChange={(e) => setUserProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-border/80 pt-4 mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-primary" /> {isGoogleWithoutPassword ? 'Set Account Password' : 'Update Account Password'}
                  </h4>
                </div>

                {/* Google Auth Notice Banner */}
                {isGoogleWithoutPassword && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <KeyRound className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-600 dark:text-amber-400">Google Account Detected</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You signed in using Google authentication. No current password is set.
                        Create a password below to allow sign-in using both Google and standard email &amp; password.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Current Password Field (Only shown for non-Google users or Google users who already set a custom password) */}
                {!isGoogleWithoutPassword && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password to authorize change"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-3.5 pr-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all cursor-pointer p-1 active:scale-90"
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                      {isGoogleWithoutPassword ? 'New Password *' : 'New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={securityForm.newPassword}
                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Min. 6 characters"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-3.5 pr-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all cursor-pointer p-1 active:scale-90"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                      {isGoogleWithoutPassword ? 'Confirm Password *' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={securityForm.confirmPassword}
                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-3.5 pr-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all cursor-pointer p-1 active:scale-90"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSecurity}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-4 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {savingSecurity ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Security Settings...
                  </>
                ) : isGoogleWithoutPassword ? (
                  <>
                    <KeyRound className="h-4 w-4" /> Set Account Password
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Security Credentials
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
