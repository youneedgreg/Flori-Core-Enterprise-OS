/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Plus, CheckCircle2, Building2, UserPlus,
  ShoppingBag, Loader2, RefreshCw, Receipt, X, Search,
  FileText, BadgeCheck, AlertTriangle, DollarSign, Send,
  ChevronDown, Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import { LeadsPipeline } from '../../../components/sales/LeadsPipeline';
import { CustomerList } from '../../../components/sales/CustomerList';
import { OrdersBoard } from '../../../components/sales/OrdersBoard';
import { CreateCustomerModal } from '../../../components/sales/CreateCustomerModal';
import { CreateLeadModal } from '../../../components/sales/CreateLeadModal';
import { CreateOrderModal } from '../../../components/sales/CreateOrderModal';
import { AuctionBoard } from '../../../components/sales/AuctionBoard';
import { PrepareLotModal } from '../../../components/sales/PrepareLotModal';
import { ImportAuctionResultsModal } from '../../../components/sales/ImportAuctionResultsModal';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SalesStats {
  activeLeads: number;
  totalCustomers: number;
  pipelineValue: number;
  conversionRate: string;
  activeOrders: number;
  totalRevenue: number;
}

interface SalesInvoice {
  id: string;
  invoiceNumber?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  issuedAt: string;
  dueDate?: string;
  createdAt: string;
  order: {
    orderNumber: string | null;
    type: string;
    currency: string;
    customer: { name: string; country: string };
  } | null;
}

// ── Status helpers ──────────────────────────────────────────────────────────────

const INV_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT:   { label: 'Draft',   cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  SENT:    { label: 'Sent',    cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  PAID:    { label: 'Paid',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  OVERDUE: { label: 'Overdue', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

type Tab = 'pipeline' | 'customers' | 'orders' | 'invoices' | 'auction';

// ── Component ──────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPrepareLotModal, setShowPrepareLotModal] = useState(false);
  const [showImportResultsModal, setShowImportResultsModal] = useState(false);

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchStats = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`${API}/sales/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch {
      toast.error('Failed to load sales stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${API}/sales/invoices`, { headers });
      if (res.ok) setInvoices(await res.json());
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => { void fetchStats(); }, [fetchStats, refreshKey]);
  useEffect(() => { void fetchInvoices(); }, [fetchInvoices, refreshKey]);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  // Detect overdue invoices
  const enrichedInvoices = invoices.map((inv) => ({
    ...inv,
    displayStatus:
      inv.status === 'SENT' && inv.dueDate && new Date(inv.dueDate) < new Date()
        ? 'OVERDUE'
        : inv.status,
  }));

  const filteredInvoices = enrichedInvoices.filter((inv) => {
    const matchStatus = invoiceStatusFilter === 'ALL' || inv.displayStatus === invoiceStatusFilter;
    const matchSearch =
      !invoiceSearch ||
      (inv.invoiceNumber ?? '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.order?.customer?.name ?? '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.order?.orderNumber ?? '').toLowerCase().includes(invoiceSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingInvoiceCount = enrichedInvoices.filter((i) =>
    ['DRAFT', 'SENT', 'OVERDUE'].includes(i.displayStatus)
  ).length;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pipeline',  label: 'Pipeline',  count: stats?.activeLeads },
    { key: 'customers', label: 'Customers' },
    { key: 'orders',    label: 'Orders',    count: stats?.activeOrders },
    { key: 'invoices',  label: 'Invoices',  count: pendingInvoiceCount > 0 ? pendingInvoiceCount : undefined },
    { key: 'auction',   label: 'Auction' },
  ];

  return (
    <div className="space-y-10 pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">
              Sales & <span className="text-emerald-400">CRM</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live pipeline
            </span>
            <span className="text-slate-700">·</span>
            <span>customer relationships</span>
            <span className="text-slate-700">·</span>
            <span>order fulfillment</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => void fetchStats()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {activeTab === 'pipeline' && (
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" /> New Lead
            </button>
          )}
          {activeTab === 'customers' && (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" /> New Customer
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          )}
          {activeTab === 'auction' && (
            <>
              <button
                onClick={() => setShowPrepareLotModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <Plus className="w-4 h-4" /> Prepare Lot
              </button>
              <button
                onClick={() => setShowImportResultsModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Layers className="w-4 h-4" /> Import Results
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingStats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 animate-pulse h-24" />
          ))
        ) : [
          {
            label: 'Active Leads',
            value: stats?.activeLeads ?? 0,
            icon: UserPlus,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
          },
          {
            label: 'Customers',
            value: stats?.totalCustomers ?? 0,
            icon: Building2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Pipeline',
            value: `USD ${(((stats?.pipelineValue ?? 0) / 1000)).toFixed(1)}k`,
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
          {
            label: 'Conversion',
            value: stats?.conversionRate ?? '0%',
            icon: CheckCircle2,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
          },
          {
            label: 'Active Orders',
            value: stats?.activeOrders ?? 0,
            icon: ShoppingBag,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            label: 'Invoiced Revenue',
            value: `USD ${(((stats?.totalRevenue ?? 0) / 1000)).toFixed(1)}k`,
            icon: DollarSign,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all">
            <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center border shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{s.label}</p>
              <p className={`text-lg font-black ${s.color} italic tracking-tighter`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === t.key ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                activeTab === t.key ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500 text-white'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden min-h-[540px] flex flex-col">

        {/* ── Pipeline tab ──────────────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <LeadsPipeline
            key={`pipeline-${refreshKey}`}
            apiBase={API}
            getAuthHeader={getAuthHeader}
            onRefresh={handleSuccess}
          />
        )}

        {/* ── Customers tab ─────────────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <CustomerList
            key={`customers-${refreshKey}`}
            apiBase={API}
            getAuthHeader={getAuthHeader}
            onRefresh={handleSuccess}
          />
        )}

        {/* ── Orders tab ────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <OrdersBoard
            apiBase={API}
            getAuthHeader={getAuthHeader}
            onRefresh={handleSuccess}
          />
        )}

        {/* ── Auction tab ───────────────────────────────────────────────────── */}
        {activeTab === 'auction' && (
          <AuctionBoard
            key={`auction-${refreshKey}`}
            apiBase={API}
            getAuthHeader={getAuthHeader}
            onRefresh={handleSuccess}
          />
        )}

        {/* ── Invoices tab ──────────────────────────────────────────────────── */}
        {activeTab === 'invoices' && (
          <div className="flex flex-col flex-1">
            {/* Invoice toolbar */}
            <div className="px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInvoiceStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      invoiceStatusFilter === s
                        ? s === 'ALL'
                          ? 'bg-white/10 text-white border-white/20'
                          : (INV_STATUS[s]?.cls ?? 'bg-white/10 text-white border-white/20')
                        : 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : (INV_STATUS[s]?.label ?? s)}
                    {s === 'OVERDUE' && enrichedInvoices.filter((i) => i.displayStatus === 'OVERDUE').length > 0 && (
                      <span className="ml-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] inline-flex items-center justify-center font-black">
                        {enrichedInvoices.filter((i) => i.displayStatus === 'OVERDUE').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative sm:ml-auto w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Search invoice, customer…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Invoice table */}
            <div className="flex-1 overflow-auto">
              {loadingInvoices ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Receipt className="w-10 h-10 text-slate-700" />
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {invoiceSearch || invoiceStatusFilter !== 'ALL'
                      ? 'No invoices match your filters.'
                      : 'No invoices yet. Advance orders to INVOICED to generate them.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Invoice #', 'Customer', 'Order', 'Type', 'Amount', 'Status', 'Issued', 'Due'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const isOverdue = inv.displayStatus === 'OVERDUE';
                      return (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-white uppercase">
                              {inv.invoiceNumber ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white">{inv.order?.customer?.name ?? '—'}</p>
                            <p className="text-[10px] text-slate-500">{inv.order?.customer?.country}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-blue-400 uppercase">
                              {inv.order?.orderNumber ?? 'Draft'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {(inv.order?.type ?? '').replace('_', ' ')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-white">
                              {inv.currency} {inv.totalAmount.toLocaleString()}
                            </p>
                            {inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount && (
                              <p className="text-[10px] font-black text-amber-400 mt-0.5">
                                Paid: {inv.currency} {inv.paidAmount.toLocaleString()}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${INV_STATUS[inv.displayStatus]?.cls ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                              {INV_STATUS[inv.displayStatus]?.label ?? inv.displayStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase">
                              {new Date(inv.issuedAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {inv.dueDate ? (
                              <p className={`text-[10px] font-black uppercase ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                                {new Date(inv.dueDate).toLocaleDateString()}
                                {isOverdue && (
                                  <span className="ml-1 text-rose-400">(!)</span>
                                )}
                              </p>
                            ) : (
                              <p className="text-[10px] font-black text-slate-600">—</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Invoice summary footer */}
            {filteredInvoices.length > 0 && (
              <div className="px-8 py-4 border-t border-white/5 flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                <div>
                  <span className="text-slate-500">Total shown:</span>
                  <span className="text-white ml-2">{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span className="text-slate-500">Value:</span>
                  <span className="text-emerald-400 ml-2">
                    USD {filteredInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
                {enrichedInvoices.filter((i) => i.displayStatus === 'OVERDUE').length > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {enrichedInvoices.filter((i) => i.displayStatus === 'OVERDUE').length} overdue
                  </div>
                )}
                {enrichedInvoices.filter((i) => i.displayStatus === 'PAID').length > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {enrichedInvoices.filter((i) => i.displayStatus === 'PAID').length} paid
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showCustomerModal && (
        <CreateCustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowCustomerModal(false); handleSuccess(); }}
        />
      )}
      {showLeadModal && (
        <CreateLeadModal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowLeadModal(false); handleSuccess(); }}
        />
      )}
      {showOrderModal && (
        <CreateOrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowOrderModal(false); handleSuccess(); }}
        />
      )}
      {showPrepareLotModal && (
        <PrepareLotModal
          isOpen={showPrepareLotModal}
          onClose={() => setShowPrepareLotModal(false)}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowPrepareLotModal(false); handleSuccess(); }}
        />
      )}
      {showImportResultsModal && (
        <ImportAuctionResultsModal
          isOpen={showImportResultsModal}
          onClose={() => setShowImportResultsModal(false)}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowImportResultsModal(false); handleSuccess(); }}
        />
      )}
    </div>
  );
}
