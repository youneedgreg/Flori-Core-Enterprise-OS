'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, DollarSign, Clock, AlertTriangle, CheckCircle,
  CreditCard, Send, Loader2, TrendingDown, X
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  remindersSent: number;
  order: {
    customer: { id: string; name: string; email?: string; creditLimit?: number };
  };
  payments: Array<{ id: string; amount: number; method: string; paidAt: string }>;
}

interface AgingReport {
  buckets: {
    current: AgingRow[];
    days31to60: AgingRow[];
    days61to90: AgingRow[];
    over90: AgingRow[];
  };
  totals: {
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    grand: number;
  };
}

interface AgingRow {
  id: string;
  invoiceNumber: string;
  customer: string;
  daysOverdue: number;
  totalAmount: number;
  outstanding: number;
  currency: string;
}

type Tab = 'invoices' | 'aging';

export default function ARPage() {
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [processingReminders, setProcessingReminders] = useState(false);

  const getToken = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    const token = match?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return token;
  };

  const authHeaders = () => {
    const token = getToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const url = `${API}/financials/ar/invoices${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, { headers });
      setInvoices(await res.json());
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [statusFilter]);

  const fetchAging = useCallback(async () => {
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/financials/ar/aging`, { headers });
      setAging(await res.json());
    } catch (e: unknown) { toast.error((e as Error).message); }
  }, []);

  useEffect(() => { fetchInvoices(); fetchAging(); }, [fetchInvoices, fetchAging]);

  const handleSend = async (invoice: Invoice) => {
    const headers = authHeaders();
    if (!headers) return;
    const res = await fetch(`${API}/financials/ar/invoices/${invoice.id}/send`, { method: 'PATCH', headers });
    if (res.ok) { toast.success('Invoice marked as Sent!'); fetchInvoices(); }
    else toast.error('Failed to update status');
  };

  const handlePayment = async () => {
    if (!selectedInvoice || !payAmount) return;
    setPayLoading(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/financials/ar/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: parseFloat(payAmount), method: payMethod, reference: payRef }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Payment failed');
      }
      toast.success('Payment recorded!');
      setPaymentModal(false);
      setPayAmount('');
      setPayRef('');
      fetchInvoices();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally { setPayLoading(false); }
  };

  const handleProcessReminders = async () => {
    setProcessingReminders(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/financials/ar/reminders/process`, { method: 'POST', headers });
      const data = await res.json();
      toast.success(`Processed ${data.processed} invoices — ${data.remindersQueued} reminders queued`);
      fetchInvoices();
    } catch { toast.error('Failed to process reminders'); }
    finally { setProcessingReminders(false); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'SENT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'PARTIALLY_PAID': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'OVERDUE': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'DRAFT': return 'text-slate-400 bg-white/5 border-white/10';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const agingTotal = aging?.totals.grand ?? 0;

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Accounts Receivable
          </h1>
          <p className="text-slate-400 mt-1">Track invoices, payments, credit exposure, and overdue aging.</p>
        </div>
        <button
          onClick={handleProcessReminders}
          disabled={processingReminders}
          className="px-5 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
        >
          {processingReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Process Reminders
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Outstanding', value: fmt(agingTotal), icon: DollarSign, color: 'emerald' },
          { label: 'Current (0–30d)', value: fmt(aging?.totals.current ?? 0), icon: Clock, color: 'blue' },
          { label: '31–60 Days', value: fmt(aging?.totals.days31to60 ?? 0), icon: TrendingDown, color: 'amber' },
          { label: '90+ Days', value: fmt(aging?.totals.over90 ?? 0), icon: AlertTriangle, color: 'rose' },
        ].map(card => (
          <div key={card.label} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
            <div className={`w-10 h-10 rounded-xl bg-${card.color}-500/20 flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 text-${card.color}-400`} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-xl font-black text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl w-fit">
        {(['invoices', 'aging'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t ? 'bg-emerald-500 text-brand-dark' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'invoices' ? 'Invoices' : 'Aging Report'}
          </button>
        ))}
      </div>

      {/* ── Invoices Tab ──────────────────────────────────────────────────────── */}
      {tab === 'invoices' && (
        <>
          {/* Status Filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {['', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
                  statusFilter === s ? 'bg-white text-brand-dark border-white' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    {['Invoice #', 'Customer', 'Amount', 'Paid', 'Due Date', 'Status', 'Reminders', ''].map(h => (
                      <th key={h} className="py-4 px-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-mono text-sm text-white font-bold">{inv.invoiceNumber ?? '—'}</td>
                      <td className="py-4 px-5 text-slate-300">{inv.order?.customer?.name ?? '—'}</td>
                      <td className="py-4 px-5 text-white font-bold">{fmt(inv.totalAmount, inv.currency)}</td>
                      <td className="py-4 px-5">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold">{fmt(inv.paidAmount, inv.currency)}</span>
                          {inv.paidAmount < inv.totalAmount && (
                            <span className="text-slate-500"> / {fmt(inv.totalAmount - inv.paidAmount, inv.currency)} left</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-400 text-sm">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor(inv.status)}`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-sm">{inv.remindersSent}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {inv.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSend(inv)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              title="Mark as Sent"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && (
                            <button
                              onClick={() => { setSelectedInvoice(inv); setPaymentModal(true); }}
                              className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Aging Report Tab ────────────────────────────────────────────────────── */}
      {tab === 'aging' && aging && (
        <div className="space-y-6">
          {[
            { label: '0–30 Days (Current)', rows: aging.buckets.current, total: aging.totals.current, color: 'blue' },
            { label: '31–60 Days', rows: aging.buckets.days31to60, total: aging.totals.days31to60, color: 'amber' },
            { label: '61–90 Days', rows: aging.buckets.days61to90, total: aging.totals.days61to90, color: 'orange' },
            { label: '90+ Days (Critical)', rows: aging.buckets.over90, total: aging.totals.over90, color: 'rose' },
          ].map(bucket => (
            <div key={bucket.label} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className={`flex justify-between items-center px-6 py-4 border-b border-white/5 bg-${bucket.color}-500/5`}>
                <h3 className={`font-black text-${bucket.color}-400 uppercase tracking-wider text-sm`}>{bucket.label}</h3>
                <span className={`text-lg font-black text-${bucket.color}-400`}>{fmt(bucket.total)}</span>
              </div>
              {bucket.rows.length === 0 ? (
                <p className="text-slate-500 text-sm p-6">No invoices in this bucket</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Invoice #', 'Customer', 'Days Overdue', 'Outstanding'].map(h => (
                        <th key={h} className="py-3 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bucket.rows.map(row => (
                      <tr key={row.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-3 px-6 font-mono text-sm text-white">{row.invoiceNumber}</td>
                        <td className="py-3 px-6 text-slate-300">{row.customer}</td>
                        <td className="py-3 px-6">
                          <span className={`font-bold ${row.daysOverdue > 90 ? 'text-rose-500' : row.daysOverdue > 60 ? 'text-orange-400' : 'text-amber-400'}`}>
                            {row.daysOverdue}d
                          </span>
                        </td>
                        <td className="py-3 px-6 font-bold text-white">{fmt(row.outstanding, row.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      {paymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-dark border border-white/10 rounded-3xl p-8 relative">
            <button onClick={() => setPaymentModal(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-white uppercase italic mb-1">Record Payment</h2>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">
              {selectedInvoice.invoiceNumber} — Outstanding: {fmt(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={`Max: ${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}`}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                >
                  {['BANK_TRANSFER', 'MPESA', 'CASH', 'CARD'].map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Reference / Cheque #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. TXN-001234"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={payLoading || !payAmount}
              className="mt-6 w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-brand-dark font-black tracking-widest uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
