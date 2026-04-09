/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, X, Plus, Send, ExternalLink, RefreshCw,
  ShieldCheck, FileCheck, Package, FlagTriangleRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-wider">Export Documentation</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {order.orderNumber || order.id.slice(0, 8).toUpperCase()} · {order.customer.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Target Input */}
        <div className="px-6 pt-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="email"
              value={emailTarget}
              onChange={e => setEmailTarget(e.target.value)}
              placeholder="Freight forwarder / buyer email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Email target</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No documents generated yet</p>
              <p className="text-slate-700 text-xs mt-1">Use the button below to generate compliance documents.</p>
            </div>
          ) : (
            docs.map(doc => {
              const meta = DOC_META[doc.type];
              const Icon = meta?.icon ?? FileText;
              return (
                <div key={doc.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl bg-white/5 flex-shrink-0 ${meta?.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-xs uppercase tracking-wider">{meta?.label}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{doc.documentNumber} · {formatDate(doc.createdAt)}</p>
                      <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        doc.status === 'SENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>{doc.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {showEmailInput === doc.id ? (
                      <button
                        disabled={emailing === doc.id}
                        onClick={() => sendDoc(doc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                      >
                        {emailing === doc.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        {emailing === doc.id ? 'Sending…' : 'Confirm Send'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowEmailInput(doc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 text-[10px] font-black uppercase tracking-wider hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Send className="w-3 h-3" /> Email
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <div className="relative">
            <button
              disabled={missingTypes.length === 0}
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-40 disabled:hover:scale-100"
            >
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {generating ? `Generating…` : 'Generate Document'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showGenerateMenu && missingTypes.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl w-64 z-10">
                {missingTypes.map(type => {
                  const meta = DOC_META[type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => generateDoc(type)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-all"
                    >
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className="text-white text-xs font-bold">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {missingTypes.length === 0 && (
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> All documents generated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
