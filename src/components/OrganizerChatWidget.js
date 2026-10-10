'use client';

/**
 * @file OrganizerChatWidget.js
 * @description Floating Live Chat Widget for Visitors and Exhibitors to interact directly with the Event Organizer.
 * Only displays when the Organizer has enabled Live Chat for their exhibition.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.js';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Building,
  User,
  Check,
  CheckCheck,
  Sparkles,
  Phone,
  Mail,
  ChevronDown,
  Minimize2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OrganizerChatWidget({
  eventId,
  eventSlug,
  eventTitle,
  organizerId,
  organizerName,
  orgEmail,
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  onStatusChange
}) {
  const { user } = useAuth();

  // Chat Status & Availability
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [organizerInfo, setOrganizerInfo] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Connect directly with our exhibition desk team. Leave your message below and we will assist you.'
  );

  const handleOpen = () => {
    setInternalIsOpen(true);
    setUnreadCount(0);
    if (controlledOnOpen) {
      controlledOnOpen();
    }
  };

  const handleClose = () => {
    setInternalIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  // Form & Conversation state
  const [conversation, setConversation] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [participantRole, setParticipantRole] = useState(
    user?.role === 'exhibitor' ? 'exhibitor' : 'visitor'
  );
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [initialMessage, setInitialMessage] = useState('');

  // Active chat message stream
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // 1. Initialize or load guest session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedSession = localStorage.getItem('visitexpo_guest_chat_session');
      if (!storedSession) {
        storedSession = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('visitexpo_guest_chat_session', storedSession);
      }
      setSessionId(storedSession);

      const handleOpenTrigger = () => {
        handleOpen();
      };
      window.addEventListener('open-organizer-chat', handleOpenTrigger);
      return () => window.removeEventListener('open-organizer-chat', handleOpenTrigger);
    }
  }, []);

  // Update participant details when user logs in
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
      if (!company) setCompany(user.company || '');
      if (user.role === 'exhibitor') setParticipantRole('exhibitor');
    }
  }, [user]);

  // 2. Query Organizer Live Chat Status from Backend
  useEffect(() => {
    let isMounted = true;
    const checkChatStatus = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (organizerId && typeof organizerId === 'string' && organizerId.trim() && organizerId !== '[object Object]') {
          queryParams.set('organizerId', organizerId.trim());
        }
        if (eventId && typeof eventId === 'string' && eventId.trim() && eventId !== '[object Object]') {
          queryParams.set('eventId', eventId.trim());
        }
        if (eventSlug && typeof eventSlug === 'string' && eventSlug.trim()) {
          queryParams.set('slug', eventSlug.trim());
        }
        if (orgEmail && typeof orgEmail === 'string' && orgEmail.trim()) {
          queryParams.set('orgEmail', orgEmail.trim());
        }

        const res = await axios.get(`${API_URL}/chat/status?${queryParams.toString()}`);
        if (!isMounted) return;
        if (res.data?.success) {
          const enabled = !!res.data.isChatEnabled;
          setIsChatEnabled(enabled);
          if (onStatusChange) onStatusChange(enabled);
          if (res.data.organizer) {
            setOrganizerInfo(res.data.organizer);
          }
          if (res.data.chatWelcomeMessage) {
            setWelcomeMessage(res.data.chatWelcomeMessage);
          }
        } else {
          setIsChatEnabled(false);
          if (onStatusChange) onStatusChange(false);
        }
      } catch (err) {
        console.warn('Could not verify organizer chat status:', err);
        if (!isMounted) return;
        setIsChatEnabled(false);
        if (onStatusChange) onStatusChange(false);
      }
    };

    if (organizerId || eventId || eventSlug || orgEmail) {
      checkChatStatus();
    } else {
      setIsChatEnabled(false);
      if (onStatusChange) onStatusChange(false);
    }

    return () => {
      isMounted = false;
    };
  }, [organizerId, eventId, eventSlug, orgEmail]);

  // 3. Check for existing active conversation in localStorage or participant API
  useEffect(() => {
    const loadExistingConversation = async () => {
      if (!sessionId && !user?.email) return;

      try {
        const queryParams = new URLSearchParams();
        if (user?.email) queryParams.set('email', user.email);
        else if (email) queryParams.set('email', email);
        if (sessionId) queryParams.set('sessionId', sessionId);

        const res = await axios.get(
          `${API_URL}/chat/participant/conversations?${queryParams.toString()}`,
          { withCredentials: true }
        );

        if (res.data?.success && Array.isArray(res.data.conversations)) {
          // Find conversation matching current event or organizer
          const matched = res.data.conversations.find((c) => {
            const orgMatch =
              (organizerInfo?.id && String(c.organizer?._id || c.organizer) === String(organizerInfo.id)) ||
              (organizerId && String(c.organizer?._id || c.organizer) === String(organizerId));
            const eventMatch =
              (eventId && String(c.event?._id || c.event) === String(eventId)) ||
              (eventSlug && c.eventSlug === eventSlug);
            return (orgMatch && eventMatch) || (orgMatch && !c.event);
          });

          if (matched) {
            setConversation(matched);
            setMessages(matched.messages || []);
            setUnreadCount(matched.unreadByParticipant || 0);
          }
        }
      } catch (err) {
        console.warn('Could not load participant chat history:', err);
      }
    };

    if (isChatEnabled) {
      loadExistingConversation();
    }
  }, [isChatEnabled, organizerInfo?.id, eventId, eventSlug, sessionId, user?.email, email]);

  // 4. Polling for live messages when chat window is active
  useEffect(() => {
    if (!isOpen || !conversation?._id) return;

    const pollMessages = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/chat/conversations/${conversation._id}?role=participant`,
          { withCredentials: true }
        );
        if (res.data?.success && res.data.conversation) {
          setMessages(res.data.conversation.messages || []);
          setUnreadCount(0);
        }
      } catch (err) {
        console.warn('Error fetching new messages:', err);
      }
    };

    pollingRef.current = setInterval(pollMessages, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, conversation?._id]);

  // Scroll to bottom on message update
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Start new conversation
  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setStartingChat(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversations`,
        {
          organizerId: organizerInfo?.id || organizerId,
          eventId,
          eventSlug,
          eventTitle,
          participantRole,
          participantName: name.trim(),
          participantEmail: email.trim(),
          participantPhone: phone.trim(),
          participantCompany: company.trim(),
          message: initialMessage.trim(),
          sessionId
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.conversation) {
        setConversation(res.data.conversation);
        setMessages(res.data.conversation.messages || []);
        setInitialMessage('');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert(err.response?.data?.message || 'Could not start chat with organizer.');
    } finally {
      setStartingChat(false);
    }
  };

  // Send message in existing thread
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversation?._id || isSending) return;

    setIsSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/chat/conversations/${conversation._id}/messages`,
        {
          text,
          senderRole: participantRole,
          senderName: name.trim() || user?.name || 'Attendee',
          sessionId
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setInputText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // If organizer has not enabled chat and modal is not opened, don't show the widget launcher
  if (!isChatEnabled && !isOpen) {
    return null;
  }

  const displayName = organizerInfo?.name || organizerName || 'Event Organizer';

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-xs shadow-xl shadow-primary/30 hover:scale-105 transition-all duration-200 group cursor-pointer"
          aria-label="Chat with Organizer"
        >
          {/* Pulsing Online Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Chat with Organizer</span>

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="ml-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[85vh] h-[580px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex-shrink-0 bg-primary text-primary-foreground p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-white/30">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate max-w-[170px]">
                    {displayName}
                  </h3>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-white/80 truncate">
                  {eventTitle || 'Exhibition Official Desk'} • Active Now
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {!conversation ? (
              /* Step 1: Start Chat Form */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Welcome Card */}
                <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Welcome to our Exhibition Desk!</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {welcomeMessage}
                  </p>
                </div>

                <form onSubmit={handleStartChat} className="space-y-3">
                  {/* Role Selector: Visitor vs Exhibitor */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                      I am inquiring as:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setParticipantRole('visitor')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                          participantRole === 'visitor'
                            ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20'
                            : 'bg-secondary border-border text-muted-foreground'
                        }`}
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Visitor / Attendee</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setParticipantRole('exhibitor')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                          participantRole === 'exhibitor'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20'
                            : 'bg-secondary border-border text-muted-foreground'
                        }`}
                      >
                        <Building className="h-3.5 w-3.5" />
                        <span>Exhibitor / Booth</span>
                      </button>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@company.com"
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Phone Input (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">WhatsApp / Mobile (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Company Input (Optional for Visitor, Recommended for Exhibitor) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">
                      Company / Organization {participantRole === 'exhibitor' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      required={participantRole === 'exhibitor'}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Tata Tech / Apex Innovations"
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Initial Message */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Message to Organizer *</label>
                    <textarea
                      rows={2}
                      required
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder={
                        participantRole === 'exhibitor'
                          ? 'I want details about booth availability & pricing...'
                          : 'I would like to inquire about entry registration & passes...'
                      }
                      className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={startingChat}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    {startingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Start Live Chat</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Live Message Stream */
              <>
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {messages.map((msg, idx) => {
                    const isFromOrganizer = msg.senderRole === 'organizer';

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          isFromOrganizer ? 'items-start' : 'items-end'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1 px-1">
                          <span className="text-[10px] font-bold text-foreground">
                            {isFromOrganizer ? displayName : 'You'}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                            isFromOrganizer
                              ? 'bg-secondary/90 border border-border text-foreground rounded-tl-xs'
                              : 'bg-primary text-primary-foreground rounded-tr-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex-shrink-0 p-2.5 bg-card border-t border-border flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message to organizer..."
                    className="flex-1 bg-secondary/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isSending}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
