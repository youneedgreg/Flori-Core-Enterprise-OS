/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, MoreVertical, Loader2, Bot, User as UserIcon, RefreshCw } from 'lucide-react';
import { getChatSessions, getSessionMessages, createChatSession, sendChatMessage, executeChatAction, ChatSession, ChatMessage, ChatAttachment } from '../../lib/api/chat';
import { toast } from 'sonner';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max 5MB.`);
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments(prev => [...prev, {
          type: file.type,
          name: file.name,
          data: base64,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isTyping) return;

    const userMsg = input.trim();
    const currentAttachments = [...attachments];
    
    setInput('');
    setAttachments([]);
    
    // Add user message optimistically
    const optimisticUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      attachments: currentAttachments,
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

      const responseMsg = await sendChatMessage(activeSessionId, userMsg, currentAttachments);
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

  const handleExecuteAction = async (msgId: string, actionType: string, payload: any) => {
    if (!currentSessionId || actionInProgress) return;
    setActionInProgress(true);
    try {
      const result = await executeChatAction(currentSessionId, actionType, payload);
      toast.success(result.message || 'Action executed successfully');
      
      // Add a system confirmation message
      const systemMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Action completed: ${result.message || 'Success'}`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemMsg]);
    } catch (err: any) {
      console.error('Action failed', err);
      toast.error(err.message || 'Failed to execute action');
    } finally {
      setActionInProgress(false);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === 'system') {
      return <div className="text-emerald-400 font-medium">{msg.content}</div>;
    }

    // Check if the assistant message contains an action preview
    if (msg.role === 'assistant' && msg.content.includes('<action-preview>')) {
      const parts = msg.content.split(/<action-preview>|<\/action-preview>/);
      const textContent = parts[0].trim();
      let actionData = null;
      try {
        if (parts[1]) actionData = JSON.parse(parts[1]);
      } catch (e) {
        console.error('Failed to parse action preview', e);
      }

      return (
        <div className="space-y-3 w-full">
          {textContent && <div>{textContent}</div>}
          {actionData && (
            <div className="bg-slate-900 border border-brand-green/30 rounded-xl p-4 mt-2 w-full">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-green" />
                Action Required: {actionData.type}
              </h4>
              <div className="bg-black/20 rounded p-2 text-xs font-mono text-slate-300 overflow-x-auto mb-3 max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(actionData.payload, null, 2)}</pre>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExecuteAction(msg.id, actionData.type, actionData.payload)}
                  disabled={actionInProgress}
                  className="flex-1 bg-brand-green text-slate-950 text-xs font-bold py-2 rounded hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {actionInProgress ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          )}
          {parts[2] && <div className="mt-2">{parts[2].trim()}</div>}
        </div>
      );
    }

    return <div>{msg.content}</div>;
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
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-green text-slate-950 rounded-tr-none' 
                  : msg.role === 'system'
                    ? 'bg-slate-800/50 text-slate-300 border border-slate-700/50 w-full rounded-2xl'
                    : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className={`text-xs rounded p-1 flex items-center gap-1 ${msg.role === 'user' ? 'bg-black/10' : 'bg-black/20'}`}>
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {renderMessageContent(msg)}
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
        <div className="p-4 bg-white/5 border-t border-white/10 flex-shrink-0 flex flex-col gap-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {attachments.map((att, i) => (
                <div key={i} className="bg-slate-800 text-xs text-slate-300 rounded-md py-1 px-2 flex items-center gap-2 border border-slate-700">
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,.csv"
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 text-slate-400 hover:text-white transition-colors"
            >
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
              disabled={(!input.trim() && attachments.length === 0) || isTyping}
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
