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
  KeyRound
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

  // Phone Change Handlers
  const handleOrgPhoneChange = (val) => {
    setOrgForm((prev) => ({ ...prev, phone: val }));
    const digits = cleanDigits(val);
    const initialDigits = cleanDigits(initialOrgPhone);
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
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingProfile(false);
      return;
    }

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
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setTimeout(() => setErrorMessage(''), 4000);
      setSavingOrg(false);
      return;
    }

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
        { id: 'security', label: 'Security & Password', icon: Shield }
      ]
    : isExhibitor
    ? [
        { id: 'profile', label: 'Exhibitor Profile', icon: Building },
        { id: 'security', label: 'Security & Access', icon: Shield }
      ]
    : [
        { id: 'profile', label: 'Organizer Profile', icon: Building },
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

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs font-bold text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
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
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

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
