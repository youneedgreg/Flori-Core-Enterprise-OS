/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Paperclip, Loader2, Bot, User as UserIcon, RefreshCw, Sparkles, HelpCircle, ShieldAlert, Search, Download, Table as TableIcon } from 'lucide-react';
import { getChatSessions, getSessionMessages, createChatSession, sendChatMessage, executeChatAction, ChatSession, ChatMessage, ChatAttachment } from '../../lib/api/chat';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SUGGESTION_CHIPS = [
  { icon: '📝', label: 'Create a PR for 50 bags of fertiliser', category: 'action' },
  { icon: '📅', label: 'Schedule training for Production team next Monday', category: 'action' },
  { icon: '🏖️', label: 'Apply for 3 days leave starting Friday', category: 'action' },
  { icon: '🪲', label: 'Log a pest report for Zone A - aphids', category: 'action' },
  { icon: '🔔', label: 'Notify all drivers about tomorrow dispatch', category: 'action' },
  { icon: '🏠', label: 'How do I add a new cold room?', category: 'howto' },
];

/**
 * Renders a markdown-like string into React elements.
 * Supports: **bold**, [links](/path), `code`, ordered/unordered lists, and line breaks.
 */
function renderMarkdown(text: string, router: any): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ol' | 'ul' | 'table' | null = null;
  let listCounter = 0;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">{listItems}</ol>);
      } else if (listType === 'ul') {
        elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2">{listItems}</ul>);
      } else if (listType === 'table') {
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-3 border border-white/10 rounded-lg">
            <table className="w-full text-sm">
              <tbody>{listItems}</tbody>
            </table>
          </div>
        );
      }
      listItems = [];
      listType = null;
      listCounter = 0;
    }
  };

  const parseInline = (line: string, key: string): React.ReactNode => {
    // Split by markdown patterns: ![alt](url), **bold**, [text](url), `code`
    const parts: React.ReactNode[] = [];
    const regex = /(!\[([^\]]*)\]\(([^)]+)\))|(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[1]) {
        // ![alt](url)
        parts.push(
          <div key={`img-${key}-${match.index}`} className="my-2 rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <img src={match[3]} alt={match[2]} className="w-full h-auto object-cover max-h-48" />
          </div>
        );
      } else if (match[4]) {
        // **bold**
        parts.push(<strong key={`b-${key}-${match.index}`} className="font-bold text-white">{match[5]}</strong>);
      } else if (match[6]) {
        // [text](url)
        const linkText = match[7];
        const url = match[8];
        if (url.startsWith('/dashboard')) {
          parts.push(
            <button
              key={`l-${key}-${match.index}`}
              onClick={() => router.push(url)}
              className="text-brand-green hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors cursor-pointer"
            >
              {linkText}
            </button>
          );
        } else {
          parts.push(
            <a key={`a-${key}-${match.index}`} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-emerald-300 underline underline-offset-2">{linkText}</a>
          );
        }
      } else if (match[9]) {
        // `code`
        parts.push(<code key={`c-${key}-${match.index}`} className="bg-black/30 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">{match[10]}</code>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Numbered list: "1. text" or "1) text"
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listCounter++;
      listItems.push(<li key={`li-${i}`}>{parseInline(olMatch[2], `li-${i}`)}</li>);
      continue;
    }

    // Bullet list: "- text" or "* text"
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(<li key={`li-${i}`}>{parseInline(ulMatch[1], `li-${i}`)}</li>);
      continue;
    }

    // Table parsing
    if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === '')).map(c => c.trim());
      if (trimmed.includes('---')) continue; // skip divider
      
      const isHeader = listType !== 'table';
      
      if (listType !== 'table') {
        flushList();
        listType = 'table';
        listItems = [];
      }
      
      const trKey = `tr-${i}`;
      listItems.push(
        <tr key={trKey} className="border-b border-white/10 last:border-0">
          {cells.map((cell, idx) => {
            const CellTag = isHeader ? 'th' : 'td';
            return (
              <CellTag key={`${trKey}-${idx}`} className={`p-2 text-left ${isHeader ? 'font-bold text-white bg-white/5' : 'text-slate-300'}`}>
                {parseInline(cell, `${trKey}-${idx}`)}
              </CellTag>
            );
          })}
        </tr>
      );
      continue;
    }

    // Chart tag: <chart type="bar" data='[...]' xKey="..." yKey="..." />
    const chartMatch = trimmed.match(/<chart\s+type="([^"]+)"\s+data='([^']+)'\s+xKey="([^"]+)"\s+yKey="([^"]+)"\s*\/>/);
    if (chartMatch) {
      flushList();
      try {
        const [_, type, dataStr, xKey, yKey] = chartMatch;
        const data = JSON.parse(dataStr);
        elements.push(
          <div key={`chart-${i}`} className="my-4 h-64 w-full bg-slate-900/50 p-4 rounded-xl border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Bar dataKey={yKey} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        );
      } catch (e) {
        console.error("Failed to parse chart", e);
      }
      continue;
    }

    // CSV tag: <csv filename="..." data='...' />
    const csvMatch = trimmed.match(/<csv\s+filename="([^"]+)"\s+data='([^']+)'\s*\/>/);
    if (csvMatch) {
      flushList();
      const [_, filename, dataStr] = csvMatch;
      const handleDownload = () => {
        const blob = new Blob([dataStr.replace(/\\n/g, '\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };
      elements.push(
        <div key={`csv-${i}`} className="my-2 p-3 bg-slate-900 border border-brand-green/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-brand-green" />
            <span className="text-sm text-slate-200">{filename}</span>
          </div>
          <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-slate-950 px-3 py-1.5 rounded-lg transition-colors font-medium">
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>
      );
      continue;
    }

    flushList();

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Heading-like: ### or ##
    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={`h4-${i}`} className="font-bold text-white text-xs uppercase tracking-wider mt-3 mb-1">{parseInline(trimmed.slice(4), `h4-${i}`)}</h4>);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={`h3-${i}`} className="font-bold text-white text-sm mt-3 mb-1">{parseInline(trimmed.slice(3), `h3-${i}`)}</h3>);
      continue;
    }

    // Normal paragraph
    elements.push(<p key={`p-${i}`} className="leading-relaxed">{parseInline(trimmed, `p-${i}`)}</p>);
  }

  flushList();
  return elements;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions when widget opens
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Welcome flow trigger
  useEffect(() => {
    if (isOpen && !hasWelcomed && sessions.length === 0 && !isLoadingHistory) {
      handleWelcome();
      setHasWelcomed(true);
    }
  }, [isOpen, sessions.length, isLoadingHistory]);

  const handleWelcome = async () => {
    setIsTyping(true);
    try {
      const newSession = await createChatSession('Welcome to Flori-Core');
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      
      const responseMsg = await sendChatMessage(newSession.id, "Hello! I'm new here, please introduce yourself and show me around based on my role.", [], pathname);
      setMessages([responseMsg]);
    } catch (err) {
      console.error('Welcome flow failed', err);
    } finally {
      setIsTyping(false);
    }
  };

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

      const responseMsg = await sendChatMessage(activeSessionId, userMsg, currentAttachments, pathname);
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

  const handleSuggestionClick = (label: string) => {
    setInput(label);
    // Auto-send the suggestion
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      setInput('');
      // Trigger send with the suggestion text
      const sendSuggestion = async () => {
        const optimisticUserMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: label,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticUserMsg]);
        setIsTyping(true);
        let activeSessionId = currentSessionId;
        try {
          if (!activeSessionId) {
            const newSession = await createChatSession(label.slice(0, 30));
            setSessions(prev => [newSession, ...prev]);
            activeSessionId = newSession.id;
            setCurrentSessionId(activeSessionId);
          }
          const responseMsg = await sendChatMessage(activeSessionId, label);
          setMessages(prev => [...prev, responseMsg]);
        } catch (err: any) {
          toast.error(err.message || 'Failed to send message');
          setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
        } finally {
          setIsTyping(false);
        }
      };
      sendSuggestion();
    }, 0);
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
          {textContent && <div className="space-y-1">{renderMarkdown(textContent, router)}</div>}
          {actionData && (
            <div className="bg-slate-900 border border-brand-green/30 rounded-xl p-4 mt-2 w-full shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-brand-green ${actionInProgress ? 'animate-spin' : ''}`} />
                  Confirm Quick Action
                </h4>
                <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {actionData.type.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 bg-black/30 rounded-lg p-3 border border-white/5">
                {Object.entries(actionData.payload).map(([key, value]: [string, any]) => {
                  if (key === 'items' && Array.isArray(value)) {
                    return (
                      <div key={key} className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{key}</span>
                        <div className="pl-2 border-l border-white/10 space-y-1">
                          {value.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-slate-300">
                              • {item.quantity} x {item.sku || item.name || 'Item'}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">{key}</span>
                      <span className="text-xs text-slate-200">{String(value)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleExecuteAction(msg.id, actionData.type, actionData.payload)}
                  disabled={actionInProgress}
                  className="flex-1 bg-brand-green text-slate-950 text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
                >
                  {actionInProgress ? 'Processing...' : 'Confirm & Execute'}
                </button>
              </div>
            </div>
          )}
          {parts[2] && <div className="mt-2 space-y-1">{renderMarkdown(parts[2].trim(), router)}</div>}
        </div>
      );
    }

    // For assistant messages, render with markdown support (deep links, bold, lists)
    if (msg.role === 'assistant') {
      return <div className="space-y-1">{renderMarkdown(msg.content, router)}</div>;
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
              <p className="text-xs text-slate-400">Task me anything</p>
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
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-green/20 to-emerald-500/10 flex items-center justify-center border border-brand-green/20">
                <Sparkles className="w-8 h-8 text-brand-green" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">Flori Assistant</h3>
                <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
                  I can navigate the system, explain modules, diagnose errors, check your permissions, and import data from photos.
                </p>
              </div>
              <div className="w-full space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Try asking</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSuggestionClick(chip.label)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-brand-green/5 hover:border-brand-green/20 transition-all duration-200 group flex items-center gap-2"
                    >
                      <span className="text-sm">{chip.icon}</span>
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
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
