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
  Package,
  Search,
  Receipt,
  CreditCard,
  BadgeCheck,
  AlertCircle,
  DollarSign,
  History,
  Filter,
  UserPlus,
  Ban,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import { VendorDetailModal } from '../../../components/procurement/VendorDetailModal';
import { RFQPortal } from '../../../components/procurement/RFQPortal';
import { GoodsReceiptModal } from '../../../components/procurement/GoodsReceiptModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StoreItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  currentStock?: number;
  reorderPoint?: number;
}

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
  itemId: string;
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
  vendor: { name: string; email: string; contactPerson?: string; phone?: string };
  items: POItem[];
  purchaseRequest?: { id: string; generatedBy: string } | null;
}

interface GRNItem {
  id: string;
  itemId: string;
  quantityReceived: number;
  unitPriceReceived: number;
  totalPriceReceived: number;
  item: { name: string; sku: string; unit: string };
}

interface GRN {
  id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  notes?: string;
  discrepancyNotes?: string;
  createdAt: string;
  vendor: { name: string };
  purchaseOrder: { poNumber: string };
  items: GRNItem[];
}

interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  vendor: { name: string; email: string };
  po?: { poNumber: string } | null;
  grn?: { grnNumber: string } | null;
}

// ── Status helpers ──────────────────────────────────────────────────────────────

const PR_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  APPROVED:  { label: 'Approved',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  CONVERTED: { label: 'Converted', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const PO_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT:              { label: 'Draft',              cls: 'bg-white/5 text-slate-400 border-white/10' },
  SENT:               { label: 'Sent',               cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  ACKNOWLEDGED:       { label: 'Acknowledged',       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  PARTIALLY_RECEIVED: { label: 'Partial Receipt',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  RECEIVED:           { label: 'Received',           cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CANCELLED:          { label: 'Cancelled',          cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const GRN_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:      { label: 'Pending',      cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  PARTIAL:      { label: 'Partial',      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COMPLETE:     { label: 'Complete',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  RECONCILED:   { label: 'Reconciled',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DISCREPANCY:  { label: 'Discrepancy',  cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const INV_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending Payment', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  PAID:      { label: 'Paid',            cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DISPUTED:  { label: 'Disputed',        cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  ARCHIVED:  { label: 'Archived',        cls: 'bg-white/5 text-slate-500 border-white/10' },
};

const PO_STATUSES = ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;

type Tab = 'purchase-requests' | 'purchase-orders' | 'vendors' | 'grn-history' | 'invoices';

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('purchase-requests');

  // Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & search
  const [prSearch, setPrSearch] = useState('');
  const [prStatusFilter, setPrStatusFilter] = useState('ALL');
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [vendorSearch, setVendorSearch] = useState('');
  const [showInactiveVendors, setShowInactiveVendors] = useState(false);
  const [grnSearch, setGrnSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Expanded rows
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [expandedGrn, setExpandedGrn] = useState<string | null>(null);

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<PurchaseRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<PurchaseRequest | null>(null);
  const [showManualPrModal, setShowManualPrModal] = useState(false);
  const [showRFQPortal, setShowRFQPortal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnInitialPo, setGrnInitialPo] = useState<PurchaseOrder | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState<VendorInvoice | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState<VendorInvoice | null>(null);

  // Forms
  const [vendorForm, setVendorForm] = useState({
    name: '', email: '', contactPerson: '', phone: '',
    address: '', paymentTerms: '', taxPin: '', notes: '', website: '',
  });
  const [approveForm, setApproveForm] = useState({
    approvedQty: '', vendorId: '', expectedDelivery: '', notes: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [manualPrForm, setManualPrForm] = useState({
    itemId: '', vendorId: '', suggestedQty: '', notes: '',
  });
  const [payForm, setPayForm] = useState({
    amount: '', method: 'BANK_TRANSFER', reference: '', notes: '',
  });
  const [disputeReason, setDisputeReason] = useState('');

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
      const [vRes, prRes, poRes, grnRes, invRes, itemsRes] = await Promise.all([
        fetch(`${API}/procurement/vendors`, { headers }),
        fetch(`${API}/procurement/purchase-requests`, { headers }),
        fetch(`${API}/procurement/purchase-orders`, { headers }),
        fetch(`${API}/procurement/grns`, { headers }),
        fetch(`${API}/procurement/invoices`, { headers }),
        fetch(`${API}/stores/items`, { headers }),
      ]);
      if (vRes.ok) setVendors(await vRes.json());
      if (prRes.ok) setPrs(await prRes.json());
      if (poRes.ok) setPos(await poRes.json());
      if (grnRes.ok) setGrns(await grnRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (itemsRes.ok) setStoreItems(await itemsRes.json());
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Vendor CRUD ──────────────────────────────────────────────────────────────

  const openNewVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', email: '', contactPerson: '', phone: '', address: '', paymentTerms: '', taxPin: '', notes: '', website: '' });
    setShowVendorModal(true);
  };

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name, email: v.email, contactPerson: v.contactPerson ?? '',
      phone: v.phone ?? '', address: v.address ?? '',
      paymentTerms: v.paymentTerms ?? '', taxPin: v.taxPin ?? '',
      notes: v.notes ?? '', website: v.website ?? '',
    });
    setShowVendorModal(true);
  };

  const saveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const url = editingVendor ? `${API}/procurement/vendors/${editingVendor.id}` : `${API}/procurement/vendors`;
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
    if (!confirm('Deactivate this vendor? They will no longer receive new POs.')) return;
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/vendors/${id}`, { method: 'DELETE', headers });
    if (res.ok) { toast.success('Vendor deactivated'); void fetchAll(); }
    else toast.error('Failed to deactivate vendor');
  };

  const reactivateVendor = async (id: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/vendors/${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    if (res.ok) { toast.success('Vendor reactivated'); void fetchAll(); }
    else toast.error('Failed to reactivate vendor');
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

  const submitManualPr = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/procurement/purchase-requests`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: manualPrForm.itemId,
          vendorId: manualPrForm.vendorId || undefined,
          suggestedQty: Number(manualPrForm.suggestedQty),
          notes: manualPrForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success('Manual purchase request created');
      setShowManualPrModal(false);
      setManualPrForm({ itemId: '', vendorId: '', suggestedQty: '', notes: '' });
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── PO Actions ───────────────────────────────────────────────────────────────

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

  // ── Invoice Actions ───────────────────────────────────────────────────────────

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayInvoiceModal) return;
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/procurement/invoices/${showPayInvoiceModal.id}/pay`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payForm.amount),
          method: payForm.method,
          reference: payForm.reference || undefined,
          notes: payForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success('Invoice marked as paid');
      setShowPayInvoiceModal(null);
      setPayForm({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDisputeModal) return;
    const headers = getAuthHeader();
    if (!headers) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/procurement/invoices/${showDisputeModal.id}/dispute`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      toast.success('Invoice disputed and flagged for review');
      setShowDisputeModal(null);
      setDisputeReason('');
      void fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Scan ─────────────────────────────────────────────────────────────────────

  const triggerScan = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/scan/trigger`, { method: 'POST', headers });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Scan complete — ${data.created ?? data.c ?? 0} PRs created, ${data.skipped ?? data.s ?? 0} already pending`);
      void fetchAll();
    } else {
      toast.error('Scan failed');
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────

  const pendingPrCount = prs.filter((p) => p.status === 'PENDING').length;
  const activePoCount = pos.filter((p) => !['RECEIVED', 'CANCELLED'].includes(p.status)).length;
  const pendingInvoiceCount = invoices.filter((i) => i.status === 'PENDING').length;
  const discrepancyGrnCount = grns.filter((g) => g.status === 'DISCREPANCY').length;
  const totalPoValue = pos
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  // ── Filtered data ─────────────────────────────────────────────────────────────

  const filteredPrs = prs
    .filter((pr) => prStatusFilter === 'ALL' || pr.status === prStatusFilter)
    .filter((pr) => !prSearch ||
      pr.item.name.toLowerCase().includes(prSearch.toLowerCase()) ||
      pr.item.sku.toLowerCase().includes(prSearch.toLowerCase()) ||
      (pr.vendor?.name ?? '').toLowerCase().includes(prSearch.toLowerCase())
    );

  const filteredPos = pos
    .filter((po) => poStatusFilter === 'ALL' || po.status === poStatusFilter)
    .filter((po) => !poSearch ||
      po.poNumber.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.vendor.name.toLowerCase().includes(poSearch.toLowerCase())
    );

  const filteredVendors = vendors
    .filter((v) => showInactiveVendors || v.isActive)
    .filter((v) => !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.contactPerson ?? '').toLowerCase().includes(vendorSearch.toLowerCase())
    );

  const filteredGrns = grns.filter((g) =>
    !grnSearch ||
    g.grnNumber.toLowerCase().includes(grnSearch.toLowerCase()) ||
    g.vendor.name.toLowerCase().includes(grnSearch.toLowerCase()) ||
    g.purchaseOrder.poNumber.toLowerCase().includes(grnSearch.toLowerCase())
  );

  const filteredInvoices = invoices.filter((i) =>
    !invoiceSearch ||
    i.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.vendor.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    (i.po?.poNumber ?? '').toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const tabs: { key: Tab; label: string; count?: number; badge?: string }[] = [
    { key: 'purchase-requests', label: 'Purchase Requests', count: pendingPrCount },
    { key: 'purchase-orders', label: 'Purchase Orders', count: activePoCount },
    { key: 'vendors', label: 'Vendors' },
    { key: 'grn-history', label: 'GRN History', count: discrepancyGrnCount > 0 ? discrepancyGrnCount : undefined, badge: discrepancyGrnCount > 0 ? 'rose' : undefined },
    { key: 'invoices', label: 'Invoices', count: pendingInvoiceCount },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">

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
          <p className="text-slate-500 font-medium tracking-tight flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hourly low-stock scan active
            </span>
            <span className="text-slate-700">·</span>
            <span>purchase request approvals</span>
            <span className="text-slate-700">·</span>
            <span>vendor PO dispatch</span>
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
            onClick={() => { setShowManualPrModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-slate-950 transition-all"
          >
            <Plus className="w-4 h-4" /> Manual PR
          </button>
          <button
            onClick={() => { setGrnInitialPo(null); setShowGrnModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-950 transition-all"
          >
            <Package className="w-4 h-4" /> Receive Goods
          </button>
          <button
            onClick={() => setShowRFQPortal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-slate-950 transition-all"
          >
            <Send className="w-4 h-4" /> RFQ Portal
          </button>
        </div>
      </header>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {[
          {
            label: 'Pending Approvals', value: pendingPrCount, icon: AlertTriangle,
            color: pendingPrCount > 0 ? 'text-amber-400' : 'text-slate-400',
            bg: pendingPrCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5',
          },
          {
            label: 'Active POs', value: activePoCount, icon: Truck,
            color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20',
          },
          {
            label: 'Active Vendors', value: vendors.filter((v) => v.isActive).length, icon: Building2,
            color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
          },
          {
            label: 'Pending Invoices', value: pendingInvoiceCount, icon: Receipt,
            color: pendingInvoiceCount > 0 ? 'text-rose-400' : 'text-slate-400',
            bg: pendingInvoiceCount > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5',
          },
          {
            label: 'Total PO Value', value: `KES ${(totalPoValue / 1000).toFixed(0)}k`, icon: TrendingUp,
            color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center border shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{s.label}</p>
              <p className="text-xl font-black text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === t.key ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                activeTab === t.key
                  ? 'bg-slate-950/30 text-slate-950'
                  : t.badge === 'rose' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PURCHASE REQUESTS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'purchase-requests' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              {['ALL', 'PENDING', 'APPROVED', 'CONVERTED', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    prStatusFilter === s
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'All' : (PR_STATUS[s]?.label ?? s)}
                  {s === 'PENDING' && pendingPrCount > 0 && prStatusFilter !== 'PENDING' && (
                    <span className="ml-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] inline-flex items-center justify-center">{pendingPrCount}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={prSearch}
                onChange={(e) => setPrSearch(e.target.value)}
                placeholder="Search item, SKU or vendor…"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item / SKU</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Stock Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qty</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vendor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Est. Value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={7} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
                ) : filteredPrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-4">
                        {prSearch || prStatusFilter !== 'ALL' ? 'No requests match your filters.' : 'No purchase requests yet. Run a scan or create a manual PR.'}
                      </p>
                      {!prSearch && prStatusFilter === 'ALL' && (
                        <div className="flex justify-center gap-3">
                          <button onClick={() => void triggerScan()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all">
                            <Zap className="w-3.5 h-3.5" /> Run Scan
                          </button>
                          <button onClick={() => setShowManualPrModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-slate-950 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Manual PR
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : filteredPrs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{pr.item.name}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">{pr.item.sku}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {pr.generatedBy === 'AUTO' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                            <Zap className="w-2.5 h-2.5" /> AUTO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                            MANUAL
                          </span>
                        )}
                        <span className="text-[9px] font-black text-slate-600 uppercase">{pr.item.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-black text-rose-400">{pr.currentStock} {pr.item.unit} current</p>
                      <p className="text-[10px] font-black text-slate-500 mt-0.5">reorder @ {pr.reorderPoint} {pr.item.unit}</p>
                      <div className="mt-2 w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${Math.min(100, (pr.currentStock / Math.max(pr.reorderPoint, 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-white">{pr.suggestedQty} {pr.item.unit}</p>
                      {pr.approvedQty != null && pr.approvedQty !== pr.suggestedQty && (
                        <p className="text-[10px] font-black text-emerald-400 mt-0.5">approved: {pr.approvedQty}</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {pr.vendor ? (
                        <p className="text-xs font-black text-slate-300 uppercase">{pr.vendor.name}</p>
                      ) : (
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">Unassigned</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {pr.estimatedTotal != null && pr.estimatedTotal > 0 ? (
                        <p className="text-xs font-black text-emerald-400">KES {pr.estimatedTotal.toLocaleString()}</p>
                      ) : (
                        <p className="text-[10px] font-black text-slate-600">—</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${PR_STATUS[pr.status]?.cls ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                        {PR_STATUS[pr.status]?.label ?? pr.status}
                      </span>
                      {pr.purchaseOrder && (
                        <p className="text-[9px] font-black text-blue-400 mt-1">→ {pr.purchaseOrder.poNumber}</p>
                      )}
                      {pr.rejectionReason && (
                        <p className="text-[9px] font-black text-rose-400 mt-1 truncate max-w-[120px]" title={pr.rejectionReason}>{pr.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PURCHASE ORDERS                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'DRAFT', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setPoStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    poStatusFilter === s
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'All' : (PO_STATUS[s]?.label ?? s)}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                placeholder="Search PO number or vendor…"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : filteredPos.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <Truck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                {poSearch || poStatusFilter !== 'ALL' ? 'No POs match your filters.' : 'No purchase orders yet. Approve a purchase request to create one.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPos.map((po) => (
                <div key={po.id} className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                  {/* PO Row */}
                  <div
                    className="px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedPo(expandedPo === po.id ? null : po.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-black text-white uppercase tracking-widest">{po.poNumber}</p>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${PO_STATUS[po.status]?.cls ?? ''}`}>
                          {PO_STATUS[po.status]?.label ?? po.status}
                        </span>
                        {po.vendorEmailSentAt && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                            <Send className="w-3 h-3" /> Emailed
                          </span>
                        )}
                        {po.purchaseRequest?.generatedBy === 'AUTO' && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">
                            <Zap className="w-2.5 h-2.5" /> Auto-generated
                          </span>
                        )}
                      </div>
                      <div className="flex gap-6 mt-2 flex-wrap">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Vendor: <span className="text-slate-300">{po.vendor.name}</span>
                        </p>
                        {po.vendor.contactPerson && (
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Contact: <span className="text-slate-400">{po.vendor.contactPerson}</span>
                          </p>
                        )}
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Total: <span className="text-emerald-400 font-black">KES {po.totalAmount.toLocaleString()}</span>
                        </p>
                        {po.expectedDelivery && (
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            ETA: <span className="text-slate-300">{new Date(po.expectedDelivery).toLocaleDateString()}</span>
                          </p>
                        )}
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {po.items.length} line item{po.items.length !== 1 ? 's' : ''}
                        </p>
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
                          <option key={s} value={s}>{PO_STATUS[s]?.label ?? s}</option>
                        ))}
                      </select>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedPo === po.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedPo === po.id && (
                    <div className="border-t border-white/5 px-8 pb-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vendor Email</p>
                          <p className="text-[11px] font-black text-slate-300">{po.vendor.email}</p>
                        </div>
                        {po.vendor.phone && (
                          <div className="bg-white/5 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                            <p className="text-[11px] font-black text-slate-300">{po.vendor.phone}</p>
                          </div>
                        )}
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Created</p>
                          <p className="text-[11px] font-black text-slate-300">{new Date(po.createdAt).toLocaleDateString()}</p>
                        </div>
                        {po.vendorEmailSentAt && (
                          <div className="bg-white/5 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Email Sent</p>
                            <p className="text-[11px] font-black text-cyan-400">{new Date(po.vendorEmailSentAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      <table className="w-full text-left border-collapse">
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
                        <tfoot>
                          <tr className="border-t border-white/10">
                            <td colSpan={4} className="py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest pr-4">Order Total</td>
                            <td className="py-3 text-right text-sm font-black text-emerald-400">KES {po.totalAmount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>

                      {po.notes && (
                        <p className="mt-4 text-[10px] font-black text-slate-600 uppercase italic">Note: {po.notes}</p>
                      )}

                      {!['RECEIVED', 'CANCELLED'].includes(po.status) && (
                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => { setGrnInitialPo(po); setShowGrnModal(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all"
                          >
                            <Package className="w-4 h-4" /> Process GRN for this PO
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VENDORS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendors…"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setShowInactiveVendors((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors ${showInactiveVendors ? 'bg-emerald-500' : 'bg-white/10'} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showInactiveVendors ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Show inactive</span>
              </label>
            </div>
            <button
              onClick={openNewVendor}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : filteredVendors.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                {vendorSearch ? 'No vendors match your search.' : 'No vendors yet. Add your first supplier.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredVendors.map((v) => (
                <div
                  key={v.id}
                  className={`bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 shadow-xl transition-all ${!v.isActive ? 'opacity-50' : 'hover:border-white/10'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${v.isActive ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/5 border-white/10'}`}>
                        <Building2 className={`w-5 h-5 ${v.isActive ? 'text-purple-400' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{v.name}</p>
                        {v.contactPerson && (
                          <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{v.contactPerson}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {v.isActive ? (
                        <>
                          <button onClick={() => openEditVendor(v)} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => void deactivateVendor(v.id)} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => void reactivateVendor(v.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all"
                        >
                          <UserPlus className="w-3 h-3" /> Reactivate
                        </button>
                      )}
                    </div>
                  </div>

                  {v.isActive && (
                    <button
                      onClick={() => setSelectedVendorForDetail(v)}
                      className="w-full mb-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Strategic Profile & Performance
                    </button>
                  )}

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{v.email}</p>
                    {v.phone && <p className="text-[10px] font-black text-slate-500 uppercase">{v.phone}</p>}
                    {v.paymentTerms && (
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Terms: <span className="text-slate-400">{v.paymentTerms}</span>
                      </p>
                    )}
                    {v.taxPin && (
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        KRA PIN: <span className="text-slate-400">{v.taxPin}</span>
                      </p>
                    )}
                    {v.website && (
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Web: <span className="text-emerald-400">{v.website.replace(/^https?:\/\//, '')}</span>
                      </p>
                    )}
                  </div>

                  {v.certifications && v.certifications.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {v.certifications.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

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
                      <div className="ml-auto flex items-center">
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* GRN HISTORY                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'grn-history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={grnSearch}
                onChange={(e) => setGrnSearch(e.target.value)}
                placeholder="Search GRN, vendor or PO…"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
              />
            </div>
            <button
              onClick={() => { setGrnInitialPo(null); setShowGrnModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-950 transition-all"
            >
              <Package className="w-4 h-4" /> New GRN
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : filteredGrns.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                {grnSearch ? 'No GRNs match your search.' : 'No goods receipts yet. Process a GRN when goods arrive.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrns.map((grn) => (
                <div key={grn.id} className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                  <div
                    className="px-8 py-6 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedGrn(expandedGrn === grn.id ? null : grn.id)}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                      grn.status === 'DISCREPANCY' ? 'bg-rose-500/10 border-rose-500/20' :
                      ['RECONCILED', 'COMPLETE'].includes(grn.status) ? 'bg-emerald-500/10 border-emerald-500/20' :
                      'bg-white/5 border-white/10'
                    }`}>
                      {grn.status === 'DISCREPANCY' ? (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      ) : ['RECONCILED', 'COMPLETE'].includes(grn.status) ? (
                        <BadgeCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-black text-white uppercase tracking-widest">{grn.grnNumber}</p>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${GRN_STATUS[grn.status]?.cls ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {GRN_STATUS[grn.status]?.label ?? grn.status}
                        </span>
                      </div>
                      <div className="flex gap-6 mt-1.5 flex-wrap">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Vendor: <span className="text-slate-300">{grn.vendor.name}</span>
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          PO: <span className="text-slate-300">{grn.purchaseOrder.poNumber}</span>
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Received: <span className="text-slate-300">{new Date(grn.receivedDate).toLocaleDateString()}</span>
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {grn.items.length} item{grn.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {grn.discrepancyNotes && (
                        <p className="mt-1 text-[10px] font-black text-rose-400 italic truncate max-w-md">{grn.discrepancyNotes}</p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${expandedGrn === grn.id ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedGrn === grn.id && (
                    <div className="border-t border-white/5 px-8 pb-6">
                      <table className="w-full mt-4 text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item</th>
                            <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SKU</th>
                            <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qty Received</th>
                            <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Price</th>
                            <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {grn.items.map((gi) => (
                            <tr key={gi.id}>
                              <td className="py-3 text-xs font-black text-white uppercase tracking-tight">{gi.item.name}</td>
                              <td className="py-3 text-[10px] font-black text-slate-500 uppercase">{gi.item.sku}</td>
                              <td className="py-3 text-right text-xs font-black text-slate-300">{gi.quantityReceived} {gi.item.unit}</td>
                              <td className="py-3 text-right text-xs font-black text-slate-300">KES {gi.unitPriceReceived.toFixed(2)}</td>
                              <td className="py-3 text-right text-xs font-black text-emerald-400">KES {gi.totalPriceReceived.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10">
                            <td colSpan={4} className="py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest pr-4">Total Received</td>
                            <td className="py-3 text-right text-sm font-black text-emerald-400">
                              KES {grn.items.reduce((s, i) => s + i.totalPriceReceived, 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      {grn.notes && (
                        <p className="mt-3 text-[10px] font-black text-slate-600 uppercase italic">Notes: {grn.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* INVOICES & PAYMENTS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Search invoice, vendor or PO…"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
              />
            </div>
            {pendingInvoiceCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{pendingInvoiceCount} pending payment</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-16 text-center">
              <Receipt className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2">
                {invoiceSearch ? 'No invoices match your search.' : 'No vendor invoices yet.'}
              </p>
              <p className="text-slate-600 font-black text-[10px] uppercase tracking-widest">Invoices are auto-generated when goods are received via GRN.</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Invoice</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vendor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PO / GRN</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-white uppercase tracking-widest">{inv.invoiceNumber}</p>
                        {inv.dueDate && (
                          <p className={`text-[10px] font-black uppercase mt-0.5 ${new Date(inv.dueDate) < new Date() && inv.status === 'PENDING' ? 'text-rose-400' : 'text-slate-500'}`}>
                            Due {new Date(inv.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-white uppercase">{inv.vendor.name}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{inv.vendor.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        {inv.po && <p className="text-[10px] font-black text-blue-400 uppercase">{inv.po.poNumber}</p>}
                        {inv.grn && <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{inv.grn.grnNumber}</p>}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-sm font-black text-white">KES {inv.totalAmount.toLocaleString()}</p>
                        {inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount && (
                          <p className="text-[10px] font-black text-amber-400 mt-0.5">Paid: KES {inv.paidAmount.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest ${INV_STATUS[inv.status]?.cls ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {INV_STATUS[inv.status]?.label ?? inv.status}
                        </span>
                        {inv.rejectionReason && (
                          <p className="text-[9px] font-black text-rose-400 mt-1 truncate max-w-[120px]" title={inv.rejectionReason}>{inv.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase mt-0.5">{inv.currency}</p>
                      </td>
                      <td className="px-8 py-5">
                        {inv.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setPayForm({ amount: String(inv.totalAmount), method: 'BANK_TRANSFER', reference: '', notes: '' }); setShowPayInvoiceModal(inv); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay
                            </button>
                            <button
                              onClick={() => { setDisputeReason(''); setShowDisputeModal(inv); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> Dispute
                            </button>
                          </div>
                        )}
                        {inv.status === 'PAID' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase">
                            <BadgeCheck className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Approve PR                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-lg p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
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
              <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{showApproveModal.item.sku} · {showApproveModal.item.category}</p>
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
                    type="number" step="0.01" required
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
                  Vendor {!showApproveModal.vendor ? '— required' : '— override optional'}
                </label>
                <select
                  value={approveForm.vendorId}
                  onChange={(e) => setApproveForm((f) => ({ ...f, vendorId: e.target.value }))}
                  required={!showApproveModal.vendor}
                  className={inputCls}
                >
                  <option value="">{showApproveModal.vendor ? `Keep: ${showApproveModal.vendor.name}` : 'Select vendor…'}</option>
                  {vendors.filter((v) => v.isActive).map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes for PO</label>
                <textarea
                  rows={2}
                  value={approveForm.notes}
                  onChange={(e) => setApproveForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputCls + ' resize-none'}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowApproveModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve & Create PO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Reject PR                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                Reject <span className="text-rose-400">Request</span>
              </h2>
              <button onClick={() => setShowRejectModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Item</p>
            <p className="text-sm font-black text-white uppercase mb-2">{showRejectModal.item.name}</p>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">
              This item will re-trigger on the next hourly scan if still below threshold.
            </p>
            <form onSubmit={(e) => void submitRejection(e)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason *</label>
                <textarea
                  required rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Budget hold, sourcing from existing stock…"
                  className={inputCls + ' resize-none placeholder:text-slate-700'}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowRejectModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Confirm Rejection</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Manual PR                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showManualPrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-lg p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic">
                  Manual <span className="text-blue-400">Purchase Request</span>
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Create a PR outside of the automated scan
                </p>
              </div>
              <button onClick={() => setShowManualPrModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitManualPr(e)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item *</label>
                <select
                  required
                  value={manualPrForm.itemId}
                  onChange={(e) => setManualPrForm((f) => ({ ...f, itemId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select store item…</option>
                  {storeItems.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} — {i.sku} ({i.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity *</label>
                  <input
                    type="number" step="0.01" required
                    value={manualPrForm.suggestedQty}
                    onChange={(e) => setManualPrForm((f) => ({ ...f, suggestedQty: e.target.value }))}
                    placeholder="0"
                    className={inputCls + ' placeholder:text-slate-700'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferred Vendor</label>
                  <select
                    value={manualPrForm.vendorId}
                    onChange={(e) => setManualPrForm((f) => ({ ...f, vendorId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Assign at approval…</option>
                    {vendors.filter((v) => v.isActive).map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes / Reason</label>
                <textarea
                  rows={2}
                  value={manualPrForm.notes}
                  onChange={(e) => setManualPrForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Urgent restock for upcoming harvest…"
                  className={inputCls + ' resize-none placeholder:text-slate-700'}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowManualPrModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Create Manual PR</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Vendor Form                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  <input required value={vendorForm.name}
                    onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address *</label>
                  <input required type="email" value={vendorForm.email}
                    onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Person</label>
                  <input value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm((f) => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                  <input value={vendorForm.phone}
                    onChange={(e) => setVendorForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Terms</label>
                  <input placeholder="e.g. Net 30, COD" value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm((f) => ({ ...f, paymentTerms: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KRA PIN</label>
                  <input value={vendorForm.taxPin}
                    onChange={(e) => setVendorForm((f) => ({ ...f, taxPin: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website</label>
                  <input placeholder="https://…" value={vendorForm.website}
                    onChange={(e) => setVendorForm((f) => ({ ...f, website: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                  <input value={vendorForm.address}
                    onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
                  <textarea rows={2} value={vendorForm.notes}
                    onChange={(e) => setVendorForm((f) => ({ ...f, notes: e.target.value }))}
                    className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowVendorModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Pay Invoice                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showPayInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                Pay <span className="text-emerald-400">Invoice</span>
              </h2>
              <button onClick={() => setShowPayInvoiceModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice</p>
              <p className="text-sm font-black text-white uppercase">{showPayInvoiceModal.invoiceNumber}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{showPayInvoiceModal.vendor.name}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Due</p>
                  <p className="text-xl font-black text-white">KES {showPayInvoiceModal.totalAmount.toLocaleString()}</p>
                </div>
                {showPayInvoiceModal.po && (
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PO</p>
                    <p className="text-sm font-black text-blue-400">{showPayInvoiceModal.po.poNumber}</p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={(e) => void submitPayment(e)} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount (KES) *</label>
                  <input
                    type="number" step="0.01" required
                    value={payForm.amount}
                    onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Method *</label>
                  <select
                    value={payForm.method}
                    onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="CHECK">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Reference</label>
                <input
                  value={payForm.reference}
                  onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Transaction ID / Cheque No."
                  className={inputCls + ' placeholder:text-slate-700'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
                <textarea rows={2} value={payForm.notes}
                  onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowPayInvoiceModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" /> Confirm Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Dispute Invoice                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 backdrop-blur-3xl w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">
                Dispute <span className="text-rose-400">Invoice</span>
              </h2>
              <button onClick={() => setShowDisputeModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Invoice</p>
            <p className="text-sm font-black text-white uppercase mb-1">{showDisputeModal.invoiceNumber}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-6">{showDisputeModal.vendor.name} · KES {showDisputeModal.totalAmount.toLocaleString()}</p>
            <form onSubmit={(e) => void submitDispute(e)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason *</label>
                <textarea
                  required rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Price discrepancy vs GRN, incorrect items billed…"
                  className={inputCls + ' resize-none placeholder:text-slate-700'}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowDisputeModal(null)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><AlertCircle className="w-4 h-4" /> Raise Dispute</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Strategic modals ──────────────────────────────────────────────────── */}

      {showRFQPortal && (
        <RFQPortal
          api={API}
          headers={getAuthHeader()!}
          vendors={vendors}
          onClose={() => setShowRFQPortal(false)}
          onRefresh={fetchAll}
        />
      )}

      {showGrnModal && (
        <GoodsReceiptModal
          onClose={() => { setShowGrnModal(false); setGrnInitialPo(null); }}
          onSuccess={() => { setShowGrnModal(false); setGrnInitialPo(null); void fetchAll(); }}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          initialPo={grnInitialPo}
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
