/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  Building2,
  ClipboardList,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Send,
  RefreshCw,
  ChevronDown,
  Truck,
  FileText,
  Edit3,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import { VendorDetailModal } from '../../../components/procurement/VendorDetailModal';
import { RFQPortal } from '../../../components/procurement/RFQPortal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  taxPin?: string;
  notes?: string;
  isActive: boolean;
  website?: string;
  certifications?: string[];
  storeItems: any[];
  bankDetails: any;
  _count?: { purchaseOrders: number; storeItems: number };
}

interface PurchaseRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  generatedBy: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  approvedQty?: number;
  lastUnitPrice?: number;
  estimatedTotal?: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  item: { id: string; name: string; sku: string; unit: string; category: string };
  vendor?: { id: string; name: string; email: string } | null;
  purchaseOrder?: { id: string; poNumber: string; status: string } | null;
}

interface POItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item: { name: string; sku: string; unit: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  expectedDelivery?: string;
  vendorEmailSentAt?: string;
  notes?: string;
  createdAt: string;
  vendor: { name: string; email: string; contactPerson?: string };
  items: POItem[];
  purchaseRequest?: { id: string; generatedBy: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const prStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':   return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'CONVERTED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'REJECTED':  return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default:          return 'bg-white/5 text-slate-400 border-white/10';
  }
};

const poStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':               return 'bg-white/5 text-slate-400 border-white/10';
    case 'SENT':                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'ACKNOWLEDGED':        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'PARTIALLY_RECEIVED':  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'RECEIVED':            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'CANCELLED':           return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default:                    return 'bg-white/5 text-slate-400 border-white/10';
  }
};

const PO_STATUSES = ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;

type Tab = 'purchase-requests' | 'purchase-orders' | 'vendors';

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('purchase-requests');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<PurchaseRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<PurchaseRequest | null>(null);
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [showRFQPortal, setShowRFQPortal] = useState(false);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);

  // Forms
  const [vendorForm, setVendorForm] = useState({
    name: '', email: '', contactPerson: '', phone: '',
    address: '', paymentTerms: '', taxPin: '', notes: '',
  });
  const [approveForm, setApproveForm] = useState({
    approvedQty: '', vendorId: '', expectedDelivery: '', notes: '',
  });
  const [rejectReason, setRejectReason] = useState('');

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors';

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchAll = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const [vRes, prRes, poRes] = await Promise.all([
        fetch(`${API}/procurement/vendors`, { headers }),
        fetch(`${API}/procurement/purchase-requests`, { headers }),
        fetch(`${API}/procurement/purchase-orders`, { headers }),
      ]);
      if (vRes.ok) setVendors(await vRes.json());
      if (prRes.ok) setPrs(await prRes.json());
      if (poRes.ok) setPos(await poRes.json());
    } catch {
      toast.error('Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Vendor CRUD ──────────────────────────────────────────────────────────────

  const openNewVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', email: '', contactPerson: '', phone: '', address: '', paymentTerms: '', taxPin: '', notes: '' });
    setShowVendorModal(true);
  };

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name, email: v.email, contactPerson: v.contactPerson ?? '',
      phone: v.phone ?? '', address: v.address ?? '',
      paymentTerms: v.paymentTerms ?? '', taxPin: v.taxPin ?? '', notes: v.notes ?? '',
    });
    setShowVendorModal(true);
  };

  const saveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const url = editingVendor
        ? `${API}/procurement/vendors/${editingVendor.id}`
        : `${API}/procurement/vendors`;
      const res = await fetch(url, {
        method: editingVendor ? 'PATCH' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success(editingVendor ? 'Vendor updated' : 'Vendor created');
      setShowVendorModal(false);
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateVendor = async (id: string) => {
    if (!confirm('Deactivate this vendor?')) return;
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/vendors/${id}`, { method: 'DELETE', headers });
    if (res.ok) { toast.success('Vendor deactivated'); void fetchAll(); }
    else toast.error('Failed to deactivate vendor');
  };

  // ── PR Actions ───────────────────────────────────────────────────────────────

  const openApprove = (pr: PurchaseRequest) => {
    setApproveForm({ approvedQty: String(pr.suggestedQty), vendorId: pr.vendor?.id ?? '', expectedDelivery: '', notes: '' });
    setShowApproveModal(pr);
  };

  const submitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApproveModal) return;
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        notes: approveForm.notes || undefined,
        expectedDelivery: approveForm.expectedDelivery || undefined,
      };
      if (approveForm.approvedQty) body.approvedQty = Number(approveForm.approvedQty);
      if (approveForm.vendorId) body.vendorId = approveForm.vendorId;
      const res = await fetch(`${API}/procurement/purchase-requests/${showApproveModal.id}/approve`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success('PR approved — Purchase Order created and emailed to vendor');
      setShowApproveModal(null);
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/procurement/purchase-requests/${showRejectModal.id}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success('Purchase request rejected');
      setShowRejectModal(null);
      setRejectReason('');
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePoStatus = async (poId: string, status: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/purchase-orders/${poId}/status`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success('Status updated'); void fetchAll(); }
    else toast.error('Failed to update status');
  };

  const triggerScan = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/scan/trigger`, { method: 'POST', headers });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Scan complete — ${data.created} PRs created, ${data.skipped} already pending`);
      void fetchAll();
    } else {
      toast.error('Scan failed');
    }
  };

  const pendingCount = prs.filter((p) => p.status === 'PENDING').length;
  const activePoCount = pos.filter((p) => !['RECEIVED', 'CANCELLED'].includes(p.status)).length;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'purchase-requests', label: 'Purchase Requests', count: pendingCount },
    { key: 'purchase-orders', label: 'Purchase Orders', count: activePoCount },
    { key: 'vendors', label: 'Vendors' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Auto-<span className="text-emerald-400">Procurement</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            Hourly low-stock scan · purchase request approvals · vendor PO dispatch
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => void triggerScan()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
          >
            <Zap className="w-4 h-4" /> Run Scan Now
          </button>
          <button
            onClick={() => void fetchAll()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowRFQPortal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg"
          >
            <Send className="w-4 h-4" /> Strategic RFQ Portal
          </button>
        </div>
      </header>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Approvals', value: pendingCount, icon: AlertTriangle, color: pendingCount > 0 ? 'text-amber-400' : 'text-slate-400', bg: pendingCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5' },
          { label: 'Active POs', value: activePoCount, icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Active Vendors', value: vendors.filter((v) => v.isActive).length, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Total PRs', value: prs.length, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center border`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
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

      {/* ── Purchase Requests ────────────────────────────────────────────────── */}
      {activeTab === 'purchase-requests' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item / SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Stock Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Suggested Qty</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vendor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Est. Value</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : prs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No purchase requests yet. Run a scan to detect low-stock items.</p>
                  </td>
                </tr>
              ) : prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-white uppercase tracking-tight">{pr.item.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">{pr.item.sku}</p>
                    {pr.generatedBy === 'AUTO' && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                        <Zap className="w-2.5 h-2.5" /> AUTO
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-rose-400">{pr.currentStock} {pr.item.unit} current</p>
                    <p className="text-[10px] font-black text-slate-500 mt-0.5">reorder @ {pr.reorderPoint} {pr.item.unit}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-white">{pr.suggestedQty} {pr.item.unit}</p>
                    {pr.approvedQty != null && pr.approvedQty !== pr.suggestedQty && (
                      <p className="text-[10px] font-black text-emerald-400 mt-0.5">approved: {pr.approvedQty}</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {pr.vendor ? (
                      <p className="text-xs font-black text-slate-300 uppercase">{pr.vendor.name}</p>
                    ) : (
                      <p className="text-[10px] font-black text-slate-600 uppercase">— unassigned</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {pr.estimatedTotal != null && pr.estimatedTotal > 0 ? (
                      <p className="text-xs font-black text-emerald-400">KES {pr.estimatedTotal.toLocaleString()}</p>
                    ) : (
                      <p className="text-[10px] font-black text-slate-600">—</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${prStatusBadge(pr.status)}`}>
                      {pr.status}
                    </span>
                    {pr.purchaseOrder && (
                      <p className="text-[9px] font-black text-blue-400 mt-1">→ {pr.purchaseOrder.poNumber}</p>
                    )}
                    {pr.rejectionReason && (
                      <p className="text-[9px] font-black text-rose-400 mt-1 truncate max-w-[120px]" title={pr.rejectionReason}>{pr.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {pr.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApprove(pr)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => { setShowRejectModal(pr); setRejectReason(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Purchase Orders ──────────────────────────────────────────────────── */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : pos.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <Truck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No purchase orders yet. Approve a purchase request to create one.</p>
            </div>
          ) : pos.map((po) => (
            <div key={po.id} className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
              {/* PO Row */}
              <div
                className="px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                onClick={() => setExpandedPo(expandedPo === po.id ? null : po.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-black text-white uppercase tracking-widest">{po.poNumber}</p>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${poStatusBadge(po.status)}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                    {po.vendorEmailSentAt && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                        <Send className="w-3 h-3" /> Emailed
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 mt-2 flex-wrap">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Vendor: <span className="text-slate-300">{po.vendor.name}</span>
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Total: <span className="text-emerald-400">KES {po.totalAmount.toLocaleString()}</span>
                    </p>
                    {po.expectedDelivery && (
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Delivery: <span className="text-slate-300">{new Date(po.expectedDelivery).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={po.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { void updatePoStatus(po.id, e.target.value); }}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[10px] font-black text-slate-300 uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    {PO_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedPo === po.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded line items */}
              {expandedPo === po.id && (
                <div className="border-t border-white/5 px-8 pb-6">
                  <table className="w-full mt-4 text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SKU</th>
                        <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qty</th>
                        <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Price</th>
                        <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {po.items.map((li) => (
                        <tr key={li.id}>
                          <td className="py-3 text-xs font-black text-white uppercase tracking-tight">{li.item.name}</td>
                          <td className="py-3 text-[10px] font-black text-slate-500 uppercase">{li.item.sku}</td>
                          <td className="py-3 text-right text-xs font-black text-slate-300">{li.quantity} {li.item.unit}</td>
                          <td className="py-3 text-right text-xs font-black text-slate-300">KES {li.unitPrice.toFixed(2)}</td>
                          <td className="py-3 text-right text-xs font-black text-emerald-400">KES {li.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {po.notes && <p className="mt-3 text-[10px] font-black text-slate-600 uppercase italic">{po.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Vendors ──────────────────────────────────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={openNewVendor}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : vendors.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No vendors yet. Add your first supplier to enable auto-PO dispatch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  className={`bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 shadow-xl transition-all ${!v.isActive ? 'opacity-40' : 'hover:border-white/10'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{v.name}</p>
                        {v.contactPerson && (
                          <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{v.contactPerson}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEditVendor(v)}
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {v.isActive && (
                        <button
                          onClick={() => void deactivateVendor(v.id)}
                          className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedVendorForDetail(v)}
                    className="w-full mb-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    Strategic Profile View
                  </button>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{v.email}</p>
                    {v.phone && <p className="text-[10px] font-black text-slate-500 uppercase">{v.phone}</p>}
                    {v.paymentTerms && (
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Terms: <span className="text-slate-400">{v.paymentTerms}</span>
                      </p>
                    )}
                    {v.taxPin && (
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        KRA: <span className="text-slate-400">{v.taxPin}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">POs</p>
                      <p className="text-lg font-black text-white">{v._count?.purchaseOrders ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items</p>
                      <p className="text-lg font-black text-white">{v._count?.storeItems ?? 0}</p>
                    </div>
                    {!v.isActive && (
                      <div className="ml-auto">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Inactive</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Approve PR ─────────────────────────────────────────────────── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-brand-dark/90 backdrop-blur-3xl w-full max-w-lg p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                Approve <span className="text-emerald-400">Request</span>
              </h2>
              <button onClick={() => setShowApproveModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <p className="text-sm font-black text-white uppercase tracking-tight">{showApproveModal.item.name}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{showApproveModal.item.sku}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Stock</p>
                  <p className="text-lg font-black text-rose-400">{showApproveModal.currentStock} <span className="text-xs">{showApproveModal.item.unit}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reorder At</p>
                  <p className="text-lg font-black text-slate-400">{showApproveModal.reorderPoint} <span className="text-xs">{showApproveModal.item.unit}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suggested</p>
                  <p className="text-lg font-black text-emerald-400">{showApproveModal.suggestedQty} <span className="text-xs">{showApproveModal.item.unit}</span></p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => void submitApproval(e)} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Approved Qty ({showApproveModal.item.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={approveForm.approvedQty}
                    onChange={(e) => setApproveForm((f) => ({ ...f, approvedQty: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected Delivery</label>
                  <input
                    type="date"
                    value={approveForm.expectedDelivery}
                    onChange={(e) => setApproveForm((f) => ({ ...f, expectedDelivery: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Vendor {!showApproveModal.vendor ? '— required (no preferred vendor set)' : '— override optional'}
                </label>
                <select
                  value={approveForm.vendorId}
                  onChange={(e) => setApproveForm((f) => ({ ...f, vendorId: e.target.value }))}
                  required={!showApproveModal.vendor}
                  className={inputCls}
                >
                  <option value="">
                    {showApproveModal.vendor ? `Keep: ${showApproveModal.vendor.name}` : 'Select vendor…'}
                  </option>
                  {vendors.filter((v) => v.isActive).map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes for PO (optional)</label>
                <textarea
                  rows={2}
                  value={approveForm.notes}
                  onChange={(e) => setApproveForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve & Create PO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reject PR ──────────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-brand-dark/90 backdrop-blur-3xl w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                Reject <span className="text-rose-400">Request</span>
              </h2>
              <button onClick={() => setShowRejectModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Item</p>
            <p className="text-sm font-black text-white uppercase mb-6">{showRejectModal.item.name}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              Note: this item will re-trigger on the next hourly scan if still below threshold.
            </p>

            <form onSubmit={(e) => void submitRejection(e)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Budget hold, sourcing from existing stock…"
                  className={inputCls + ' resize-none placeholder:text-slate-700'}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Confirm Rejection</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Vendor Form ────────────────────────────────────────────────── */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-brand-dark/90 backdrop-blur-3xl w-full max-w-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                {editingVendor ? 'Edit' : 'Add'} <span className="text-purple-400">Vendor</span>
              </h2>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void saveVendor(e)} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name *</label>
                  <input
                    required
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Person</label>
                  <input
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                  <input
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Terms</label>
                  <input
                    placeholder="e.g. Net 30, COD"
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KRA PIN</label>
                  <input
                    value={vendorForm.taxPin}
                    onChange={(e) => setVendorForm((f) => ({ ...f, taxPin: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                  <input
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
                  <textarea
                    rows={2}
                    value={vendorForm.notes}
                    onChange={(e) => setVendorForm((f) => ({ ...f, notes: e.target.value }))}
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Strategic Component Modals ────────────────────────────────────────── */}
      
      {showRFQPortal && (
        <RFQPortal 
          api={API} 
          headers={getAuthHeader()!} 
          vendors={vendors}
          onClose={() => setShowRFQPortal(false)}
          onRefresh={fetchAll}
        />
      )}

      {selectedVendorForDetail && (
        <VendorDetailModal
          vendor={selectedVendorForDetail}
          onClose={() => setSelectedVendorForDetail(null)}
          api={API}
          headers={getAuthHeader()!}
        />
      )}
    </div>
  );
}
