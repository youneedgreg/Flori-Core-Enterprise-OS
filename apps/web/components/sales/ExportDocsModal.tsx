/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Send, ExternalLink, RefreshCw,
  ShieldCheck, FileCheck, Package, FlagTriangleRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, inputCls } from './SalesUI';

interface ExportDoc {
  id: string;
  type: 'PHYTOSANITARY' | 'EXPORT_PERMIT' | 'CUSTOMS_INVOICE' | 'CERTIFICATE_OF_ORIGIN';
  documentNumber: string | null;
  fileUrl: string;
  status: 'GENERATED' | 'SENT';
  notes: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string | null;
  customer: { name: string; email?: string; country?: string };
}

interface ExportDocsModalProps {
  order: Order;
  apiBase: string;
  getAuthHeader: () => { Authorization: string } | null;
  onClose: () => void;
}

const DOC_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PHYTOSANITARY:         { label: 'Phytosanitary Certificate', icon: ShieldCheck,       color: 'text-emerald-400' },
  EXPORT_PERMIT:         { label: 'Export Permit',             icon: FlagTriangleRight,  color: 'text-amber-400'   },
  CUSTOMS_INVOICE:       { label: 'Customs Invoice / Packing', icon: Package,            color: 'text-blue-400'    },
  CERTIFICATE_OF_ORIGIN: { label: 'Certificate of Origin',     icon: FileCheck,          color: 'text-violet-400'  },
};

const ALL_TYPES = Object.keys(DOC_META) as (keyof typeof DOC_META)[];

export function ExportDocsModal({ order, apiBase, getAuthHeader, onClose }: ExportDocsModalProps) {
  const [docs, setDocs] = useState<ExportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState(order.customer.email || '');
  const [showEmailInput, setShowEmailInput] = useState<string | null>(null);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);

  const fetchDocs = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const res = await fetch(`${apiBase}/export-docs/order/${order.id}`, { headers });
      if (!res.ok) throw new Error();
      setDocs(await res.json());
    } catch {
      toast.error('Failed to load export documents');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader, order.id]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function generateDoc(type: string) {
    const headers = getAuthHeader();
    if (!headers) return;
    setGenerating(type);
    setShowGenerateMenu(false);
    try {
      const res = await fetch(`${apiBase}/export-docs/order/${order.id}/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to generate');
      toast.success(`${DOC_META[type].label} generated`);
      fetchDocs();
    } catch (e: any) {
      toast.error(e.message ?? 'Generation failed');
    } finally {
      setGenerating(null);
    }
  }

  async function sendDoc(docId: string) {
    const headers = getAuthHeader();
    if (!headers) return;
    if (!emailTarget) { toast.error('Enter an email address first'); return; }
    setEmailing(docId);
    try {
      const res = await fetch(`${apiBase}/export-docs/${docId}/email`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTarget }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to send');
      toast.success('Document emailed successfully');
      setShowEmailInput(null);
      fetchDocs();
    } catch (e: any) {
      toast.error(e.message ?? 'Email failed');
    } finally {
      setEmailing(null);
    }
  }

  const presentTypes = new Set<string>(docs.map(d => d.type));
  const missingTypes = ALL_TYPES.filter(t => !presentTypes.has(t as string));

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <PremiumModal
      title="Export Documentation"
      subtitle={`${order.orderNumber || order.id.slice(0, 8).toUpperCase()} · ${order.customer.name}`}
      onClose={onClose}
      accentColor="amber"
    >
      <div className="flex flex-col space-y-6">
        {/* Email Target Input */}
        <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/10">
          <div className="flex-1">
            <input
              type="email"
              value={emailTarget}
              onChange={e => setEmailTarget(e.target.value)}
              placeholder="Freight forwarder / buyer email"
              className={`${inputCls('amber')}`}
            />
          </div>
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest min-w-[80px]">Dispatch To</span>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-amber-500/50 animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No documents generated yet</p>
              <p className="text-slate-700 text-[10px] mt-2 font-bold uppercase tracking-widest italic">Global compliance stack empty</p>
            </div>
          ) : (
            docs.map(doc => {
              const meta = DOC_META[doc.type];
              const Icon = meta?.icon ?? FileText;
              return (
                <div key={doc.id} className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 flex items-center justify-between gap-4 group/doc hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-2xl bg-white/5 flex-shrink-0 ${meta?.color} border border-white/5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-xs uppercase tracking-wider">{meta?.label}</p>
                      <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{doc.documentNumber || 'PENDING ID'} · {formatDate(doc.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          doc.status === 'SENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {showEmailInput === doc.id ? (
                      <button
                        disabled={emailing === doc.id}
                        onClick={() => sendDoc(doc.id)}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-40"
                      >
                        {emailing === doc.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {emailing === doc.id ? 'Sending…' : 'Secure Send'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowEmailInput(doc.id)}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 text-slate-400 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Dispatch
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="relative">
            <button
              disabled={missingTypes.length === 0}
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)] disabled:opacity-40"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {generating ? `Compiling…` : 'Issue Compliance Doc'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showGenerateMenu ? 'rotate-180' : ''}`} />
            </button>
            {showGenerateMenu && (
              <div className="absolute bottom-full mb-3 left-0 bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl w-80 z-20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Document Protocol</span>
                </div>
                {missingTypes.map(type => {
                  const meta = DOC_META[type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => generateDoc(type)}
                      className="flex items-center gap-4 w-full px-6 py-4 text-left hover:bg-white/5 transition-all group"
                    >
                      <div className={`p-2 rounded-xl bg-white/5 ${meta.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-white text-[11px] font-black uppercase tracking-wider block">{meta.label}</span>
                        <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">ISO Compliance Protocol</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {missingTypes.length === 0 && !loading && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Compliance Stack Fully Executed</span>
            </div>
          )}
        </div>
      </div>
    </PremiumModal>
  );
}
