'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  HelpCircle,
  Loader2,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function OrganizerSupportWidget() {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [conversation, setConversation] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [faqError, setFaqError] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const faqEntries = faqs.filter((entry) => entry.contentType !== 'guide');
  const guideEntries = faqs.filter((entry) => entry.contentType === 'guide');

  useEffect(() => {
    if (!isOpen || !accessToken) return undefined;

    let active = true;
    const headers = { Authorization: `Bearer ${accessToken}` };

    const loadPanelData = async () => {
      const [conversationResult, faqResult] = await Promise.allSettled([
          axios.get(`${API_URL}/organizer-support/conversation`, { headers }),
          axios.get(`${API_URL}/faqs?category=Organizers&includeGuides=true`)
        ]);

      if (!active) return;
      if (conversationResult.status === 'fulfilled') {
        setConversation(conversationResult.value.data?.conversation || null);
        setError('');
      } else {
        setError(conversationResult.reason.response?.data?.error || 'Could not load support chat. Please try again.');
      }
      if (faqResult.status === 'fulfilled') {
        setFaqs(faqResult.value.data?.data || []);
        setFaqError('');
      } else {
        setFaqError(faqResult.reason.response?.data?.error || 'Could not load FAQs. Please try again.');
      }
      setLoading(false);
    };

    const refreshConversation = async () => {
      try {
        const result = await axios.get(`${API_URL}/organizer-support/conversation`, { headers });
        if (active) setConversation(result.data?.conversation || null);
      } catch (_) {}
    };

    loadPanelData();
    const timer = window.setInterval(refreshConversation, 7000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isOpen, accessToken]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [conversation?.messages?.length, isOpen, activeTab]);

  const handleSend = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !accessToken) return;

    setSending(true);
    setError('');
    try {
      const result = await axios.post(`${API_URL}/organizer-support/conversation/messages`, { text }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setConversation(result.data?.conversation || null);
      setDraft('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'organizer') return null;

  return (
    <>
      {isOpen && (
        <section
          className="fixed bottom-20 right-4 z-[100] flex h-[min(600px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 sm:right-6"
          aria-label="VisitExpo organizer support"
        >
          <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">VisitExpo Support</h2>
                <p className="text-[10px] text-muted-foreground">Organizer help desk</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="grid grid-cols-3 border-b border-border bg-card p-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'faqs'}
              onClick={() => setActiveTab('faqs')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeTab === 'faqs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <HelpCircle className="h-3.5 w-3.5" /> FAQs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'guides'}
              onClick={() => setActiveTab('guides')}
              className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${activeTab === 'guides' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Guides
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-4">
                {!conversation?.messages?.length && !error && (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-bold text-foreground">How can we help?</p>
                    <p className="mt-1 max-w-[250px] text-xs text-muted-foreground">
                      Send a message and the VisitExpo admin team will reply here.
                    </p>
                  </div>
                )}
                {conversation?.messages?.map((message) => {
                  const isOrganizer = message.senderRole === 'organizer';
                  return (
                    <div key={message._id} className={`flex ${isOrganizer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${isOrganizer ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border border-border bg-card text-foreground'}`}>
                        <p className="mb-1 text-[10px] font-bold opacity-75">
                          {isOrganizer ? 'You' : message.senderName || 'VisitExpo Support'}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message.text}</p>
                        <time className="mt-1.5 block text-right text-[9px] opacity-65">
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                        </time>
                      </div>
                    </div>
                  );
                })}
                {loading && !conversation && (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <p className="px-4 pt-2 text-xs text-destructive">{error}</p>}
              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border bg-card p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={4000}
                  rows={2}
                  placeholder="Write a message..."
                  aria-label="Message VisitExpo support"
                  className="max-h-28 min-h-10 flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : activeTab === 'faqs' ? (
            <div className="flex-1 space-y-2 overflow-y-auto bg-muted/10 p-3">
              {faqError && <p className="px-2 py-1 text-xs text-destructive">{faqError}</p>}
              {faqEntries.length > 0 ? faqEntries.map((faq) => (
                <details key={faq._id} className="group rounded-xl border border-border bg-card">
                  <summary className="cursor-pointer list-none px-3.5 py-3 text-xs font-semibold text-foreground marker:hidden">
                    <span className="flex items-start justify-between gap-3">
                      <span>{faq.question}</span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <p className="border-t border-border px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              )) : (
                <p className="py-8 text-center text-xs text-muted-foreground">No organizer FAQs are available right now.</p>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-primary hover:bg-primary/10"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Still need help? Chat with us
              </button>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-3">
              {guideEntries.length > 0 ? guideEntries.map((guide) => (
                <article key={guide._id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="space-y-2 p-3.5">
                    <h3 className="text-xs font-bold text-foreground">{guide.question}</h3>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{guide.answer}</p>
                  </div>
                  {guide.images?.length > 0 && (
                    <div className="space-y-2 border-t border-border bg-background/50 p-2.5">
                      {guide.images.map((image, index) => (
                        <img
                          key={`${guide._id}-image-${index}`}
                          src={image}
                          alt={`${guide.question} step ${index + 1}`}
                          className="max-h-56 w-full rounded-lg border border-border object-contain"
                        />
                      ))}
                    </div>
                  )}
                </article>
              )) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No website guides are available yet.
                </p>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-primary hover:bg-primary/10"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Ask support a question
              </button>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          if (!isOpen) setLoading(true);
          setIsOpen(!isOpen);
        }}
        aria-label={isOpen ? 'Close support chat' : 'Chat with VisitExpo support'}
        aria-expanded={isOpen}
        title="Chat with VisitExpo support"
        className="fixed bottom-5 right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 sm:right-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}