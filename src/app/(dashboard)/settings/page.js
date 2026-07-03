'use client';

/**
 * @file page.js (Organizer Settings)
 * @description Settings configuration panel for event organizers (10times Branding, profile parameters, API key retrieval, and password security).
 */

import React, { useState } from 'react';
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
  ShieldCheck,
  Upload,
  Share2
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); // profile, security, api
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Organization Form State (Matching 10times PDF Specs)
  const [orgForm, setOrgForm] = useState({
    name: user?.organization?.name || 'Global Tech Events Ltd.',
    description: 'Premier B2B conference & trade show organizing company based in India with global corporate partnerships.',
    website: 'https://globaltechevents.com',
    email: 'info@globaltechevents.com',
    phone: '+91 98765 43210',
    address: '12, Connaught Place, New Delhi 110001',
    gstNumber: '07AAAAA1111A1Z1',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&q=80',
    socialLinkedIn: 'https://linkedin.com/company/globaltechevents',
    socialFacebook: 'https://facebook.com/globaltechevents',
    socialInstagram: 'https://instagram.com/globaltechevents',
    socialX: 'https://x.com/globaltechevents'
  });

  // Password / Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleOrgSubmit = (e) => {
    e.preventDefault();
    setSaveSuccess('Organizer profile settings saved successfully!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setSaveSuccess('Security credentials updated successfully!');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText('vxp_live_589b21fa7c1e30a7d90d9841');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings & Organizer Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure branding parameters, manage security, and retrieve WordPress API keys.
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
          
          {/* Tab 1: Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleOrgSubmit} className="space-y-6">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> 10times Organizer Brand Profile
              </h3>

              {/* Logo Upload Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Organization Brand Logo</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl border border-border bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                    {orgForm.logoUrl ? (
                      <img src={orgForm.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Building className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload Brand Logo
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
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">GST / Tax Identification Code</label>
                  <input
                    type="text"
                    value={orgForm.gstNumber}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, gstNumber: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company Overview</label>
                <textarea
                  rows={3}
                  value={orgForm.description}
                  onChange={(e) => setOrgForm(prev => ({ ...prev, description: e.target.value }))}
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
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="border border-border/80 rounded-2xl p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Share2 className="h-4 w-4 text-primary" /> Social Links & Handles
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
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-2"
              >
                <Save className="h-4 w-4" /> Save Organizer Profile
              </button>
            </form>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <h3 className="text-base font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <Shield className="h-5 w-5 text-primary" /> Security Policies
              </h3>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Active Account Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Administrator'}
                    className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-10 pr-4 text-xs text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Login Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'organizer@visitexpo.in'}
                    className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-10 pr-4 text-xs text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="border-t border-border/80 pt-4 mt-2 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Update Account Password</h4>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Current Password</label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">New Password</label>
                    <input
                      type="password"
                      required
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-4"
              >
                <Save className="h-4.5 w-4.5" /> Change Password
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
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How to connect WordPress plugin?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Install the **VisitExpo Form Connector** plugin on your WordPress website. Copy the secret API key below and paste it into the plugin configuration page. This will automatically sync forms data to your Lead and Visitor CRM.
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

              {/* Mock webhook details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Incoming Webhook Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value="http://localhost:5000/api/orders/checkout"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                />
              </div>

              <div className="border-t border-border/80 pt-4 mt-4 text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>External WordPress registration integration is active</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
