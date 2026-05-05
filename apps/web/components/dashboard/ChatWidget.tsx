/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, MoreVertical, Loader2, Bot, User as UserIcon, RefreshCw } from 'lucide-react';
import { getChatSessions, getSessionMessages, createChatSession, sendChatMessage, ChatSession, ChatMessage } from '../../lib/api/chat';
import { toast } from 'sonner';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions when widget opens
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions();
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const loadSessions = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getChatSessions();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        await loadSessionMessages(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat sessions', err);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsHistoryOpen(false);
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createChatSession('New Conversation');
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Failed to create session', err);
      toast.error('Failed to create new conversation');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message optimistically
    const optimisticUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticUserMsg]);
    setIsTyping(true);

    let activeSessionId = currentSessionId;
    
    try {
      if (!activeSessionId) {
        const newSession = await createChatSession(userMsg.slice(0, 30));
        setSessions([newSession, ...sessions]);
        activeSessionId = newSession.id;
        setCurrentSessionId(activeSessionId);
      }

      const responseMsg = await sendChatMessage(activeSessionId, userMsg);
      setMessages(prev => [...prev, responseMsg]);
    } catch (err: any) {
      console.error('Failed to send message', err);
      const errorMessage = err.message || 'Failed to send message';
      toast.error(errorMessage);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isOpen 
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 rotate-90 scale-90' 
              : 'bg-brand-green text-slate-950 hover:bg-emerald-400 hover:scale-105 hover:shadow-emerald-500/30'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Chat Panel */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-96 h-[600px] max-h-[calc(100vh-120px)] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Flori Assistant</h3>
              <p className="text-xs text-slate-400">Powered by Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNewChat}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="New Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Panel (Slide-over) */}
        {isHistoryOpen && (
          <div className="absolute inset-0 top-16 bg-slate-950/95 backdrop-blur-xl z-20 flex flex-col p-4 animate-in slide-in-from-right-full duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white">Conversation History</h4>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {isLoadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                No past conversations
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadSessionMessages(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      currentSessionId === s.id ? 'bg-brand-green/10 border border-brand-green/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="text-sm text-slate-200 truncate">{s.title || 'Conversation'}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 && !isTyping && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Bot className="w-8 h-8 text-brand-green" />
              </div>
              <p className="text-sm">Hi! I&apos;m your AI assistant. I can help you analyze data, explain features, or manage your operations.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-slate-300' : 'bg-brand-green/20 text-brand-green'}`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-green text-slate-950 rounded-tr-none' 
                  : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-1.5 w-16">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex-shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <button type="button" className="absolute left-3 text-slate-400 hover:text-white transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/50 transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-1.5 bg-brand-green text-slate-950 rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
