/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, FileCheck, Clock, CheckCircle, XCircle,
  Download, Send, Loader2, Plus, X, AlertTriangle, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  invoiceDate: string;
  dueDate?: string;
  scheduledPayAt?: string;
  vendor: { id: string; name: string; email: string };
  po?: { poNumber: string; totalAmount: number };
  grn?: { grnNumber: string; status: string };
  payments: { id: string; amount: number; method: string; paidAt: string }[];
}

export default function APPage() {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewModal, setShowNewModal] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matchLoading, setMatchLoading] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // New invoice form
  const [form, setForm] = useState({ vendorId: '', invoiceNumber: '', totalAmount: '', currency: 'USD', invoiceDate: '', dueDate: '', poId: '', grnId: '', notes: '' });
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    const token = match?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const h = getHeaders();
      if (!h) return;
      const url = `${API}/financials/ap/invoices${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, { headers: h });
      setInvoices(await res.json());
    } catch { toast.error('Failed to load vendor invoices'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  const fetchVendors = useCallback(async () => {
    try {
      const h = getHeaders();
      if (!h) return;
      const res = await fetch(`${API}/procurement/vendors`, { headers: h });
      setVendors(await res.json());
    } catch { /* not critical */ }
  }, []);

  useEffect(() => { fetchInvoices(); fetchVendors(); }, [fetchInvoices, fetchVendors]);

  const handleAction = async (id: string, action: 'approve' | 'reject', extra?: any) => {
    const h = getHeaders();
    if (!h) return;
    const res = await fetch(`${API}/financials/ap/invoices/${id}/${action}`, {
      method: 'PATCH',
      headers: h,
      body: action === 'reject' ? JSON.stringify({ reason: extra ?? 'Rejected by approver' }) : undefined,
    });
    if (res.ok) { toast.success(`Invoice ${action}d`); fetchInvoices(); }
    else toast.error(`Failed to ${action}`);
  };

  const handleThreeWayMatch = async (id: string) => {
    setMatchLoading(id);
    try {
      const h = getHeaders();
      if (!h) return;
      const res = await fetch(`${API}/financials/ap/invoices/${id}/three-way-match`, { headers: h });
      setMatchResult(await res.json());
    } catch { toast.error('Match check failed'); }
    finally { setMatchLoading(''); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const h = getHeaders();
      if (!h) return;
      const res = await fetch(`${API}/financials/ap/invoices`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ ...form, totalAmount: parseFloat(form.totalAmount) }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      toast.success('Vendor invoice created!');
      setShowNewModal(false);
      fetchInvoices();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleExport = async (format: 'CSV' | 'MT101') => {
    if (selected.size === 0) { toast.info('Select invoices to export'); return; }
    setExportLoading(true);
    try {
      const h = getHeaders();
      if (!h) return;
      const res = await fetch(`${API}/financials/ap/export`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ vendorInvoiceIds: [...selected], format }),
      });
      const data = await res.json();
      // Trigger file download
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_run_${Date.now()}.${format === 'CSV' ? 'csv' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.invoiceCount} payments as ${format}`);
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'APPROVED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'SCHEDULED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'REJECTED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  const fmt = (n: number, c = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Accounts Payable
          </h1>
          <p className="text-slate-400 mt-1">Vendor invoice management with 3-way match, approval workflow, and bank export.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleExport('CSV')}
            disabled={exportLoading || selected.size === 0}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV Export
          </button>
          <button
            onClick={() => handleExport('MT101')}
            disabled={exportLoading || selected.size === 0}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" /> SWIFT MT101
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 bg-emerald-500 text-brand-dark rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'PENDING', 'APPROVED', 'SCHEDULED', 'PAID', 'REJECTED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-white text-brand-dark border-white' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mb-4 px-5 py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
          <FileCheck className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-bold">{selected.size} invoices selected for payment export</span>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="py-4 px-5 w-10"></th>
                {['Invoice #', 'Vendor', 'PO / GRN', 'Total', 'Outstanding', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${selected.has(inv.id) ? 'bg-purple-500/5' : ''}`}>
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                  </td>
                  <td className="py-4 px-4 font-mono text-sm text-white font-bold">{inv.invoiceNumber}</td>
                  <td className="py-4 px-4 text-slate-300">{inv.vendor?.name}</td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {inv.po && <div>PO: {inv.po.poNumber}</div>}
                    {inv.grn && <div>GRN: {inv.grn.grnNumber}</div>}
                    {!inv.po && !inv.grn && <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-4 px-4 text-white font-bold">{fmt(inv.totalAmount, inv.currency)}</td>
                  <td className="py-4 px-4 text-slate-400">{fmt(inv.totalAmount - inv.paidAmount, inv.currency)}</td>
                  <td className="py-4 px-4 text-slate-400 text-sm">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      {inv.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction(inv.id, 'approve')} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors" title="Approve">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction(inv.id, 'reject')} className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors" title="Reject">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {(inv.po || inv.grn) && (
                        <button
                          onClick={() => handleThreeWayMatch(inv.id)}
                          className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="3-Way Match"
                          disabled={matchLoading === inv.id}
                        >
                          {matchLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    No vendor invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3-Way Match Result Panel */}
      {matchResult && (
        <div className={`mt-6 p-6 rounded-3xl border ${matchResult.matched ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {matchResult.matched
                ? <CheckCircle className="w-6 h-6 text-emerald-500" />
                : <AlertTriangle className="w-6 h-6 text-rose-500" />}
              <div>
                <p className={`font-black text-sm uppercase tracking-wider ${matchResult.matched ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {matchResult.matched ? '3-Way Match Passed ✓' : '3-Way Match Failed ✗'}
                </p>
                <p className="text-slate-400 text-sm mt-1">{matchResult.message ?? matchResult.reason}</p>
              </div>
            </div>
            <button onClick={() => setMatchResult(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* New Vendor Invoice Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-brand-dark border border-white/10 rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase italic">New Vendor Invoice</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Vendor</label>
                <select required value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                  className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500">
                  <option value="">Select vendor…</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              {[
                { key: 'invoiceNumber', label: 'Vendor Invoice #', type: 'text', placeholder: 'e.g. VND-2026-001' },
                { key: 'totalAmount', label: 'Total Amount', type: 'number', placeholder: '0.00' },
                { key: 'invoiceDate', label: 'Invoice Date', type: 'date', placeholder: '' },
                { key: 'dueDate', label: 'Due Date', type: 'date', placeholder: '' },
                { key: 'poId', label: 'Purchase Order ID (optional)', type: 'text', placeholder: 'PO uuid for 3-way match' },
                { key: 'grnId', label: 'GRN ID (optional)', type: 'text', placeholder: 'GRN uuid for 3-way match' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    required={['invoiceNumber', 'totalAmount', 'invoiceDate'].includes(f.key)}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-brand-dark font-black tracking-widest uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Create Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
