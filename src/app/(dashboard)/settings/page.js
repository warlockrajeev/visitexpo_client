'use client';

/**
 * @file page.js (Organizer Settings)
 * @description Settings configuration panel for event organizers (Branding, profile parameters, API key retrieval, and password/account security).
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Settings,
  Building,
  Shield,
  Key,
  Globe,
  Mail,
  User,
  Phone,
  MapPin,
  Clipboard,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Share2,
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SettingsPage() {
  const { user, accessToken } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile'); // profile, security, api
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // User Profile State
  const [userProfileForm, setUserProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Organization Form State
  const [orgForm, setOrgForm] = useState({
    name: user?.organization?.name || '',
    description: user?.organization?.description || '',
    website: user?.organization?.website || '',
    email: user?.organization?.contact?.email || user?.email || '',
    phone: user?.organization?.contact?.phone || '',
    address: typeof user?.organization?.address === 'string' ? user?.organization?.address : user?.organization?.address?.street || '',
    gstNumber: user?.organization?.gst || '',
    logoUrl: user?.organization?.logo || '',
    socialLinkedIn: user?.organization?.social?.linkedIn || '',
    socialFacebook: user?.organization?.social?.facebook || '',
    socialInstagram: user?.organization?.social?.instagram || '',
    socialX: user?.organization?.social?.x || ''
  });

  // Password / Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Sync state when user context is updated or loaded
  useEffect(() => {
    if (user) {
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
          phone: user.organization.contact?.phone || '',
          address: typeof user.organization.address === 'string' ? user.organization.address : user.organization.address?.street || '',
          gstNumber: user.organization.gst || '',
          logoUrl: user.organization.logo || '',
          socialLinkedIn: user.organization.social?.linkedIn || '',
          socialFacebook: user.organization.social?.facebook || '',
          socialInstagram: user.organization.social?.instagram || '',
          socialX: user.organization.social?.x || ''
        });
      }
    }
  }, [user]);

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setSaveSuccess('');
    setErrorMessage('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setOrgForm(prev => ({ ...prev, logoUrl: res.data.url }));
        setSaveSuccess('Logo uploaded! Click "Save Organizer Profile" to persist changes.');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to upload logo.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Submit Organizer Profile Form
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    setSaveSuccess('');
    setErrorMessage('');

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/auth/organization`,
        {
          name: orgForm.name,
          description: orgForm.description,
          website: orgForm.website,
          email: orgForm.email,
          phone: orgForm.phone,
          address: orgForm.address,
          gst: orgForm.gstNumber,
          logo: orgForm.logoUrl,
          socialLinkedIn: orgForm.socialLinkedIn,
          socialFacebook: orgForm.socialFacebook,
          socialInstagram: orgForm.socialInstagram,
          socialX: orgForm.socialX
        },
        { headers }
      );

      if (res.data && res.data.success) {
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

  // Submit Security & Access Form (User Name/Email & Password)
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSavingSecurity(true);
    setSaveSuccess('');
    setErrorMessage('');

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // 1. Update Profile (Name / Email)
      if (userProfileForm.name !== user?.name || userProfileForm.email !== user?.email) {
        await axios.put(
          `${API_URL}/auth/profile`,
          {
            name: userProfileForm.name,
            email: userProfileForm.email
          },
          { headers }
        );
      }

      // 2. Update Password if provided
      if (securityForm.currentPassword || securityForm.newPassword) {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
          setErrorMessage('New passwords do not match');
          setSavingSecurity(false);
          return;
        }
        await axios.put(
          `${API_URL}/auth/change-password`,
          {
            currentPassword: securityForm.currentPassword,
            newPassword: securityForm.newPassword
          },
          { headers }
        );
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      setSaveSuccess('Security credentials and account profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error('Update security error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to update security credentials.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setSavingSecurity(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText('vxp_live_589b21fa7c1e30a7d90d9841');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings &amp; Organizer Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure branding parameters, update security credentials, and retrieve VisitExpo API keys.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-500 w-fit">
          <ShieldCheck className="h-4 w-4" /> Verified 10times Organizer
        </div>
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
          {[
            { id: 'profile', label: 'Organizer Profile', icon: Building },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'api', label: 'Developer Webhooks', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
          
          {/* Tab 1: Organizer Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleOrgSubmit} className="space-y-6">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Organizer Brand Profile
              </h3>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {/* Logo Upload Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Organization Brand Logo</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl border border-border bg-muted overflow-hidden flex items-center justify-center shadow-sm relative">
                    {isUploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : orgForm.logoUrl ? (
                      <img src={orgForm.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground transition-colors disabled:opacity-50"
                    >
                      {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload Brand Logo
                    </button>
                    <p className="text-[10px] text-muted-foreground">Square PNG/JPG, recommended 400x400 px.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Global Tech Events Ltd"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">GST / Tax Identification Code</label>
                  <input
                    type="text"
                    value={orgForm.gstNumber}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company Overview / Description</label>
                <textarea
                  rows={3}
                  value={orgForm.description}
                  onChange={(e) => setOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a brief overview of your trade show organization..."
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
                      onChange={(e) => setOrgForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://..."
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
                      onChange={(e) => setOrgForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="organizer@company.com"
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
                      onChange={(e) => setOrgForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">HQ Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={orgForm.address}
                      onChange={(e) => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
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
                    onChange={(e) => setOrgForm(prev => ({ ...prev, socialLinkedIn: e.target.value }))}
                    placeholder="LinkedIn URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialFacebook}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, socialFacebook: e.target.value }))}
                    placeholder="Facebook URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialInstagram}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, socialInstagram: e.target.value }))}
                    placeholder="Instagram URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="url"
                    value={orgForm.socialX}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, socialX: e.target.value }))}
                    placeholder="X / Twitter URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingOrg}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-2 disabled:opacity-50"
              >
                {savingOrg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Organizer Profile
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <Shield className="h-5 w-5 text-primary" /> Security &amp; Access Credentials
              </h3>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Active Account Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={userProfileForm.name}
                    onChange={(e) => setUserProfileForm(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setUserProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="border-t border-border/80 pt-4 mt-2 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Update Account Password (Optional)</h4>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Current Password</label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Leave empty if not changing password"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">New Password</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Confirm New Password</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSecurity}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-4 disabled:opacity-50"
              >
                {savingSecurity ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Security Settings...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Security &amp; Access Details
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 3: API & Webhooks */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <Key className="h-5 w-5 text-primary" /> Webhook Integration
              </h3>

              <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How to connect VisitExpo Form Connector?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Install the **VisitExpo Form Connector** or copy the API integration script onto your website. Copy the secret API key below and paste it into the plugin configuration page. This will automatically sync forms data to your Lead and Visitor CRM.
                </p>
              </div>

              {/* API key widget */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Live API Secret Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="vxp_live_589b21fa7c1e30a7d90d9841"
                    className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                  />
                  <button
                    onClick={copyApiKey}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary hover:bg-secondary/85 px-4 text-xs font-bold text-foreground transition-all shadow-sm"
                  >
                    {copiedKey ? <Check className="h-4.5 w-4.5 text-emerald-500" /> : <Clipboard className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Webhook details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Incoming Webhook Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value="https://visitexpo-server.onrender.com/api/orders/checkout"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                />
              </div>

              <div className="border-t border-border/80 pt-4 mt-4 text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>External form registration integration is active</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
