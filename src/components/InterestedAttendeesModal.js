'use client';

/**
 * @file InterestedAttendeesModal.js
 * @description Modal showing verified interested people, attendees, and follower networking system for an exhibition.
 * Includes live search, category filters, interactive attendee following, and B2B matchmaking.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  UserPlus,
  UserCheck,
  Building,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Lock,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function InterestedAttendeesModal({
  isOpen,
  onClose,
  event,
  attendees = [],
  followedAttendeeIds = new Set(),
  onToggleFollowAttendee,
  isUserInterested = false,
  currentUser = null,
  onTriggerGated,
  onConnectAttendee
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'Trade Buyer' | 'Exhibitor & Brand' | 'VIP Delegate' | 'following'

  if (!isOpen) return null;

  // Filtered Attendees list
  const filteredList = attendees.filter((att) => {
    // Type Filter
    if (selectedType === 'following') {
      if (!followedAttendeeIds.has(att.id)) return false;
    } else if (selectedType !== 'all') {
      if (att.type !== selectedType) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        att.name.toLowerCase().includes(q) ||
        att.company.toLowerCase().includes(q) ||
        att.designation.toLowerCase().includes(q) ||
        att.city.toLowerCase().includes(q) ||
        att.country.toLowerCase().includes(q) ||
        att.objective.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const totalFollowedCount = followedAttendeeIds.size;
  const followersTotal = (event?.followersCount || 1058) + (isUserInterested ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFCC00]/25 text-amber-950 border border-amber-300 flex items-center gap-1">
                <Users className="h-3 w-3 text-amber-900" />
                Live Network ({followersTotal.toLocaleString()})
              </span>
              <span className="text-xs text-zinc-500 font-semibold hidden sm:inline">
                Verified Exhibition Attendees
              </span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
              Interested People &amp; Followers
            </h2>
            <p className="text-xs text-zinc-500 max-w-lg">
              Connect with trade buyers, exhibitors, and delegates attending <strong className="text-zinc-800">{event?.title}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH & FILTER CONTROLS                                                  */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 bg-white border-b border-zinc-100 space-y-3">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, company, job designation, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
            {[
              { id: 'all', label: `All Attendees (${attendees.length})` },
              { id: 'Trade Buyer', label: 'Trade Buyers' },
              { id: 'Exhibitor & Brand', label: 'Exhibitors & Brands' },
              { id: 'VIP Delegate', label: 'VIP Delegates' },
              { id: 'following', label: `Following (${totalFollowedCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-zinc-900 text-white font-bold shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ATTENDEES LIST SCROLLABLE BODY                                            */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-zinc-100">
          
          {/* Current User Attendance Confirmation Banner */}
          {isUserInterested && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser?.name?.charAt(0) || 'You'}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-900 flex items-center gap-1">
                    <span>You are registered as Interested!</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your profile is visible to participating exhibitors and trade delegation partners.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                Confirmed
              </span>
            </div>
          )}

          {/* Empty Search State */}
          {filteredList.length === 0 && (
            <div className="text-center py-12 space-y-2 text-zinc-500">
              <Users className="h-8 w-8 mx-auto text-zinc-300" />
              <div className="text-xs font-bold text-zinc-800">No attendees match your search.</div>
              <p className="text-[11px]">Try modifying the filter or clearing the search bar.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
                className="text-xs font-bold text-[#FF2E63] hover:underline pt-1 cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Attendee Profile Cards */}
          {filteredList.map((att) => {
            const isFollowing = followedAttendeeIds.has(att.id);

            return (
              <div
                key={att.id}
                className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Avatar */}
                  <div className="relative h-11 w-11 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                    <img src={att.avatar} alt={att.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                        {att.name}
                      </span>
                      {att.verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" title="Verified Trade Profile" />
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        att.type === 'Trade Buyer'
                          ? 'bg-amber-100 text-amber-900'
                          : att.type === 'VIP Delegate'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {att.type}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-zinc-700 truncate">
                      {att.designation}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-zinc-400" />
                        <span className="truncate max-w-xs">{att.company}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#FF2E63]" />
                        <span>{att.city}, {att.country}</span>
                      </span>
                    </div>

                    {/* Sourcing Objective */}
                    <div className="text-[11px] text-zinc-600 italic pt-0.5">
                      "{att.objective}"
                    </div>
                  </div>
                </div>

                {/* Right: Follow & Connect Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => onToggleFollowAttendee(att)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isFollowing
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>+ Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onConnectAttendee(att)}
                    className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                    title="Send connection note"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER & 10TIMES GATED DISCOVERY CALLOUT                                  */}
        {/* ========================================================================= */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 text-[11px] text-center sm:text-left">
            <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              Showing verified preview attendees. Unlock full attendee telephone &amp; meeting scheduler with your free pass.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
