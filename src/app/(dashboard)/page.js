'use client';

/**
 * @file page.js
 * @description Organizer Dashboard Hub matching 10times PDF specifications.
 * Features 10times KPIs (Total Events, Registrations, Live Events, Sales Leads, Followers),
 * Onboarding Quick Action Bar, Active Draft Resume Banner, and Event Moderation Status Tracker.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Download,
  Eye,
  Activity,
  Layers,
  Heart
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext.js';

// Mock datasets for analytics widgets
const checkinTrendData = [
  { time: '09:00', checkins: 45 },
  { time: '10:00', checkins: 120 },
  { time: '11:00', checkins: 280 },
  { time: '12:00', checkins: 190 },
  { time: '13:00', checkins: 85 },
  { time: '14:00', checkins: 140 },
  { time: '15:00', checkins: 95 },
  { time: '16:00', checkins: 30 }
];

const leadSourceData = [
  { name: 'Website', value: 480, color: 'var(--color-primary)' },
  { name: 'Campaigns', value: 320, color: '#f59e0b' },
  { name: 'Referral', value: 150, color: '#10b981' },
  { name: 'Walk-in', value: 80, color: '#ec4899' }
];

const recentVisitors = [
  { id: 1, name: 'Ananya Sharma', email: 'ananya@techcorp.com', company: 'TechCorp', time: '10 mins ago', status: 'checked_in' },
  { id: 2, name: 'Rajesh Patel', email: 'rajesh@patelsolutions.in', company: 'Patel Solutions', time: '15 mins ago', status: 'checked_in' },
  { id: 3, name: 'Vikram Singh', email: 'vikram@fintech.org', company: 'FinTech Org', time: '1 hour ago', status: 'checked_in' },
  { id: 4, name: 'Priya Das', email: 'priya@creativeweb.in', company: 'Creative Web', time: '2 hours ago', status: 'not_checked_in' }
];

export default function OrganizerDashboard() {
  const { user } = useAuth();
  
  // 10times Style KPIs from PDF 1 & PDF 2
  const kpis = [
    { title: 'Total Events', value: '12', change: '4 Published, 2 Pending', icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Total Registrations', value: '3,420', change: '+18.4% this month', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Live Events', value: '8', change: 'Active in 4 cities', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Event Leads', value: '980', change: '+14.2% qualified leads', icon: Target, color: 'text-pink-500', bg: 'bg-pink-500/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Onboarding Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Welcome back, {user?.name || 'Organizer'}!
              </h2>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                10times Verified
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your expo listings, onboard new events, and monitor real-time attendee registrations.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/events/wizard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              <Sparkles className="h-4 w-4" /> Create New Event (Wizard)
            </Link>
            <Link
              href="/events/claim"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-amber-500" /> Claim Event
            </Link>
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors"
            >
              <Download className="h-4 w-4" /> Export Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Active Onboarding Draft Resume Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md flex-shrink-0 mt-0.5">
              <Clock className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Unfinished Onboarding Draft
              </span>
              <h3 className="text-sm font-bold text-foreground">
                India International Tech & AI Summit 2026
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Step 5 of 8 completed (Media & Banner Upload). Draft autosaved 10 mins ago.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-32 bg-muted rounded-full h-2 overflow-hidden border border-border hidden sm:block">
              <div className="bg-primary h-full rounded-full" style={{ width: '62%' }} />
            </div>
            <Link
              href="/events/wizard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all whitespace-nowrap"
            >
              Resume Wizard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 10times KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">{kpi.title}</span>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">{kpi.value}</span>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Check-ins area chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Real-Time Visitor Check-In Analytics</h3>
              <p className="text-xs text-muted-foreground">Hourly attendee check-in velocity across live halls</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" /> High Peak Traffic
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={checkinTrendData}>
                <defs>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="checkins" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCheckins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead sources pie chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground">Visitor Channel Mix</h3>
            <p className="text-xs text-muted-foreground">Original registration sources</p>
          </div>
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">1,030</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Leads</span>
            </div>
          </div>
          {/* Legend list */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {leadSourceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Grid Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">Recent Visitor Registrations</h3>
            <p className="text-xs text-muted-foreground">Real-time registry logs connected to WordPress form submitter</p>
          </div>
          <Link
            href="/visitors"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View Full Visitor CRM <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Name & Email</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Registered At</th>
                <th className="px-6 py-4">Check-in Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{visitor.name}</p>
                    <span className="text-[11px] text-muted-foreground">{visitor.email}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">{visitor.company}</td>
                  <td className="px-6 py-4 text-muted-foreground">{visitor.time}</td>
                  <td className="px-6 py-4">
                    {visitor.status === 'checked_in' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-500">
                        <CheckCircle className="h-3 w-3" /> Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-500">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
