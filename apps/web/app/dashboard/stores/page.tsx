'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  Boxes,
  ClipboardList,
  X,
  MapPin,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Building2,
  ShoppingCart,
  FileText,
  Truck,
  DollarSign,
  BarChart3,
  Phone,
  Mail,
  Globe,
  Check,
  Clock,
  Ban,
  SendHorizonal,
  PackageCheck,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Zone { id: string; name: string; type: string; }

interface StoreItem {
  id: string; name: string; sku: string; category: string; unit: string;
  description?: string; minStockLevel: number; reorderPoint: number;
  maxStockLevel: number; unitCost: number; totalStock: number;
  belowMin: boolean; belowReorder: boolean;
  preferredVendorId?: string;
  preferredVendor?: { name: string };
  stock: { id: string; zoneId: string; quantity: number; zone: Zone }[];
}

interface StoreMovement {
  id: string; type: string; quantity: number; reference?: string;
  notes?: string; createdAt: string;
  item: { name: string; unit: string; sku: string };
  zone: { name: string };
}

interface Vendor {
  id: string; name: string; email: string; contactPerson?: string;
  phone?: string; address?: string; paymentTerms?: string;
  website?: string; isActive: boolean;
}

interface PurchaseRequest {
  id: string; status: string; currentStock: number; reorderPoint: number;
  suggestedQty: number; approvedQty?: number; lastUnitPrice?: number;
  estimatedTotal?: number; notes?: string; rejectionReason?: string;
  createdAt: string;
  item: { name: string; sku: string; unit: string };
  vendor?: { name: string };
}

interface PurchaseOrder {
  id: string; poNumber: string; status: string; totalAmount: number;
  expectedDelivery?: string; createdAt: string;
  vendor: { name: string; email: string };
  items: { id: string; description: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES = ['FERTILISER', 'PESTICIDE', 'SEED', 'PACKAGING', 'PPE', 'SPARE_PART', 'OTHER'] as const;

const CATEGORY_CFG: Record<string, { color: string; label: string }> = {
  FERTILISER: { color: 'lime',   label: 'Fertiliser' },
  PESTICIDE:  { color: 'orange', label: 'Pesticide'  },
  SEED:       { color: 'green',  label: 'Seed'       },
  PACKAGING:  { color: 'cyan',   label: 'Packaging'  },
  PPE:        { color: 'purple', label: 'PPE'        },
  SPARE_PART: { color: 'yellow', label: 'Spare Part' },
  OTHER:      { color: 'slate',  label: 'Other'      },
};

const MOVEMENT_CFG: Record<string, { label: string; color: string; icon: React.ElementType; sign: string }> = {
  GRN:       { label: 'GRN',        color: 'emerald', icon: ArrowDownToLine, sign: '+' },
  ISSUE:     { label: 'Issue',      color: 'amber',   icon: ArrowUpFromLine,  sign: '-' },
  RETURN:    { label: 'Return',     color: 'blue',    icon: RotateCcw,        sign: '+' },
  WRITE_OFF: { label: 'Write-Off',  color: 'rose',    icon: Trash2,           sign: '-' },
};

const PR_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   color: 'amber',   icon: Clock        },
  APPROVED:  { label: 'Approved',  color: 'emerald', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'rose',    icon: XCircle      },
  CONVERTED: { label: 'Converted', color: 'blue',    icon: PackageCheck },
};

const PO_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT:              { label: 'Draft',              color: 'slate',   icon: FileText      },
  SENT:               { label: 'Sent',               color: 'blue',    icon: SendHorizonal },
  ACKNOWLEDGED:       { label: 'Acknowledged',       color: 'cyan',    icon: Check         },
  PARTIALLY_RECEIVED: { label: 'Part. Received',     color: 'amber',   icon: Truck         },
  RECEIVED:           { label: 'Received',           color: 'emerald', icon: PackageCheck  },
  CANCELLED:          { label: 'Cancelled',          color: 'rose',    icon: Ban           },
};

function getAuthHeader() {
  const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
  const token = tokenMatch?.[1];
  if (!token || isTokenExpired(token)) { logout(); return null; }
  return { Authorization: `Bearer ${token}` };
}

// ── Add Item Modal ────────────────────────────────────────────────────────────

function AddItemModal({ currency, vendors, onClose, onSuccess }: {
  currency: string; vendors: Vendor[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: '', sku: '', category: 'OTHER', unit: 'units', description: '',
    minStockLevel: '', reorderPoint: '', maxStockLevel: '', unitCost: '',
    preferredVendorId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/stores/items`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sku: form.sku.toUpperCase(),
          minStockLevel: parseFloat(form.minStockLevel) || 0,
          reorderPoint: parseFloat(form.reorderPoint) || 0,
          maxStockLevel: parseFloat(form.maxStockLevel) || 0,
          unitCost: parseFloat(form.unitCost) || 0,
          preferredVendorId: form.preferredVendorId || undefined,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(`"${form.name}" added to catalogue`);
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message ?? 'Could not add item'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500/40';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Add <span className="text-amber-400">Item</span></h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Item Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SKU *</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} className={inp + ' uppercase'} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CFG[c]?.label ?? c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit of Measure</label>
              <input value={form.unit} placeholder="kg, litres, pcs, boxes…" onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit Cost ({currency})</label>
              <input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Stock Level</label>
              <input type="number" min="0" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reorder Point</label>
              <input type="number" min="0" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Stock Level <span className="text-slate-700 normal-case">(0 = auto 2×)</span></label>
              <input type="number" min="0" value={form.maxStockLevel} onChange={(e) => setForm({ ...form, maxStockLevel: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Vendor</label>
              <select value={form.preferredVendorId} onChange={(e) => setForm({ ...form, preferredVendorId: e.target.value })} className={inp}>
                <option value="">None</option>
                {vendors.filter((v) => v.isActive).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp + ' resize-none'} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Movement Modal ────────────────────────────────────────────────────────────

function MovementModal({ items, zones, onClose, onSuccess, prefillItemId }: {
  items: StoreItem[]; zones: Zone[];
  onClose: () => void; onSuccess: () => void;
  prefillItemId?: string;
}) {
  const [form, setForm] = useState({
    itemId: prefillItemId ?? '', zoneId: '', type: 'GRN',
    quantity: '', reference: '', notes: '', toZoneId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemId || !form.zoneId || !form.quantity) return;
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/stores/movements`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: form.itemId, zoneId: form.zoneId, type: form.type,
          quantity: parseFloat(form.quantity),
          reference: form.reference || undefined, notes: form.notes || undefined,
          toZoneId: form.type === 'ISSUE' && form.toZoneId ? form.toZoneId : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Movement recorded');
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message ?? 'Could not record movement'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500/40';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-lg rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Record <span className="text-slate-300">Movement</span></h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-8 pt-6">
          {Object.entries(MOVEMENT_CFG).map(([key, cfg]) => {
            const Ico = cfg.icon;
            return (
              <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  form.type === key ? `border-${cfg.color}-500/40 bg-${cfg.color}-500/10 text-${cfg.color}-400` : 'border-white/5 text-slate-600 hover:text-slate-400'
                }`}>
                <Ico className="w-4 h-4" /> {cfg.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Item *</label>
            <select required value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} className={inp}>
              <option value="">Select item…</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              {form.type === 'ISSUE' ? 'Source Zone (debited from)' : 'Zone'} *
            </label>
            <select required value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} className={inp}>
              <option value="">Select zone…</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type.replace('_', ' ')})</option>)}
            </select>
          </div>
          {form.type === 'ISSUE' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Zone (issued to)</label>
              <select value={form.toZoneId} onChange={(e) => setForm({ ...form, toZoneId: e.target.value })} className={inp}>
                <option value="">Select zone…</option>
                {zones.filter((z) => z.id !== form.zoneId).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity *</label>
              <input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reference</label>
              <input value={form.reference} placeholder="GRN-001, PO-234…" onChange={(e) => setForm({ ...form, reference: e.target.value })} className={inp} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Add Vendor Modal ──────────────────────────────────────────────────────────

function AddVendorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', contactPerson: '', phone: '', address: '', paymentTerms: '', website: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/procurement/vendors`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paymentTerms: form.paymentTerms || undefined, website: form.website || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(`Vendor "${form.name}" added`);
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message ?? 'Could not add vendor'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500/40';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-lg rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Add <span className="text-blue-400">Vendor</span></h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Terms</label>
              <input placeholder="NET 30, COD…" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Website</label>
              <input type="url" value={form.website} placeholder="https://…" onChange={(e) => setForm({ ...form, website: e.target.value })} className={inp} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Create PR Modal ───────────────────────────────────────────────────────────

function CreatePRModal({ items, vendors, onClose, onSuccess }: {
  items: StoreItem[]; vendors: Vendor[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ itemId: '', vendorId: '', suggestedQty: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const selectedItem = items.find((i) => i.id === form.itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/procurement/purchase-requests`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: form.itemId,
          vendorId: form.vendorId || undefined,
          suggestedQty: parseFloat(form.suggestedQty),
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Purchase Request created');
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message ?? 'Could not create PR'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500/40';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-md rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Create <span className="text-emerald-400">PR</span></h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Item *</label>
            <select required value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} className={inp}>
              <option value="">Select item…</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku}) — stock: {i.totalStock} {i.unit}</option>)}
            </select>
          </div>

          {selectedItem && (
            <div className="bg-white/5 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center text-[10px]">
              <div><p className="text-slate-600 font-black uppercase">Current</p><p className="text-white font-black text-lg">{selectedItem.totalStock}</p></div>
              <div><p className="text-slate-600 font-black uppercase">Reorder</p><p className="text-amber-400 font-black text-lg">{selectedItem.reorderPoint}</p></div>
              <div><p className="text-slate-600 font-black uppercase">Min</p><p className="text-rose-400 font-black text-lg">{selectedItem.minStockLevel}</p></div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Suggested Qty *</label>
            <input required type="number" min="0.01" step="0.01" value={form.suggestedQty} onChange={(e) => setForm({ ...form, suggestedQty: e.target.value })} className={inp} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor</label>
            <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className={inp}>
              <option value="">Use item default / any</option>
              {vendors.filter((v) => v.isActive).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit PR'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Item Detail Panel ─────────────────────────────────────────────────────────

function ItemDetailPanel({ item, movements, currency, onClose, onMovement, onEdit }: {
  item: StoreItem; movements: StoreMovement[]; currency: string;
  onClose: () => void; onMovement: () => void;
  onEdit: (field: string, value: string | number) => void;
}) {
  const itemMovements = movements.filter((m) => m.item.sku === item.sku).slice(0, 15);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    minStockLevel: String(item.minStockLevel),
    reorderPoint: String(item.reorderPoint),
    maxStockLevel: String(item.maxStockLevel),
    unitCost: String(item.unitCost),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/stores/items/${item.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minStockLevel: parseFloat(editForm.minStockLevel) || 0,
          reorderPoint: parseFloat(editForm.reorderPoint) || 0,
          maxStockLevel: parseFloat(editForm.maxStockLevel) || 0,
          unitCost: parseFloat(editForm.unitCost) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Item updated');
      setEditMode(false);
      onEdit('refresh', 0);
    } catch (err: any) { toast.error(err.message ?? 'Could not update item'); }
    finally { setSaving(false); }
  };

  const catCfg = CATEGORY_CFG[item.category] ?? { color: 'slate', label: item.category };
  const totalValue = item.totalStock * item.unitCost;

  return (
    <div className="w-[400px] shrink-0 bg-[#0d1117] border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-7 py-6 border-b border-white/5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Item Detail</p>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-tight">{item.name}</h3>
          <p className="text-xs text-slate-500 font-black mt-0.5">{item.sku}</p>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-md bg-${catCfg.color}-500/10 border border-${catCfg.color}-500/20 text-${catCfg.color}-400 text-[9px] font-black uppercase tracking-widest`}>
            {catCfg.label}
          </span>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all shrink-0">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stock summary */}
        <div className="grid grid-cols-2 divide-x divide-y divide-white/5 border-b border-white/5">
          {[
            { label: 'Total Stock', value: `${item.totalStock} ${item.unit}`, color: item.belowMin ? 'rose' : 'white' },
            { label: 'Total Value', value: `${currency} ${totalValue.toFixed(2)}`, color: 'emerald' },
            { label: 'Min Level', value: `${item.minStockLevel} ${item.unit}`, color: 'slate' },
            { label: 'Reorder Point', value: `${item.reorderPoint} ${item.unit}`, color: 'amber' },
          ].map((s) => (
            <div key={s.label} className="p-4">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{s.label}</p>
              <p className={`text-sm font-black text-${s.color}-${s.color === 'white' ? '100' : '400'} mt-0.5`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Stock by zone */}
        {item.stock.length > 0 && (
          <div className="border-b border-white/5">
            <p className="px-7 py-3 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">Stock by Zone</p>
            {item.stock.map((s) => (
              <div key={s.id} className="px-7 py-3 flex items-center justify-between hover:bg-white/2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-600" />
                  <span className="text-xs font-bold text-slate-300">{s.zone.name}</span>
                  <span className="text-[9px] text-slate-600 uppercase">{s.zone.type.replace('_', ' ')}</span>
                </div>
                <span className={`text-sm font-black ${s.quantity < item.minStockLevel ? 'text-rose-400' : 'text-white'}`}>{s.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Edit thresholds */}
        <div className="border-b border-white/5 p-7 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Thresholds & Pricing</p>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="h-7 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 transition-all">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="h-7 px-3 bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="h-7 px-3 bg-amber-500 rounded-lg text-[9px] font-black text-slate-950 uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            )}
          </div>

          {editMode ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Min Level', key: 'minStockLevel' },
                { label: 'Reorder Pt', key: 'reorderPoint' },
                { label: 'Max Level', key: 'maxStockLevel' },
                { label: 'Unit Cost', key: 'unitCost' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-0.5">{label}</label>
                  <input type="number" min="0" step="0.01"
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                { label: 'Unit Cost', value: `${currency} ${item.unitCost.toFixed(2)}` },
                { label: 'Max Level', value: `${item.maxStockLevel} ${item.unit}` },
              ].map((r) => (
                <div key={r.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-slate-600 font-black uppercase">{r.label}</p>
                  <p className="text-white font-black mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick movement button */}
        <div className="p-7 border-b border-white/5">
          <button
            onClick={onMovement}
            className="w-full h-10 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Record Movement for this Item
          </button>
        </div>

        {/* Recent movements */}
        <div>
          <p className="px-7 py-3 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">Recent Movements</p>
          {itemMovements.length === 0 ? (
            <p className="px-7 py-6 text-[10px] font-black text-slate-700 uppercase tracking-widest">No movements yet</p>
          ) : itemMovements.map((m) => {
            const mc = MOVEMENT_CFG[m.type] ?? { color: 'slate', sign: '?', label: m.type };
            return (
              <div key={m.id} className="px-7 py-3 flex items-center justify-between hover:bg-white/2 border-b border-white/5">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{mc.label} · {m.zone.name}</p>
                  <p className="text-[9px] text-slate-700 font-bold">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-black text-${mc.color}-400`}>{mc.sign}{m.quantity} {m.item.unit}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'items' | 'movements' | 'procurement' | 'vendors' | 'alerts';

export default function StoresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [items, setItems] = useState<StoreItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [movements, setMovements] = useState<StoreMovement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [currency, setCurrency] = useState('KES');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');
  const [prStatusFilter, setPrStatusFilter] = useState('ALL');

  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [movementPrefillId, setMovementPrefillId] = useState<string | undefined>();

  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showCreatePR, setShowCreatePR] = useState(false);

  const getHeaders = () => getAuthHeader();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      if (!headers) return;
      const [itemRes, zoneRes, movRes, vendRes, prRes, poRes, curRes] = await Promise.all([
        fetch(`${API}/stores/items`, { headers }),
        fetch(`${API}/zones`, { headers }),
        fetch(`${API}/stores/movements`, { headers }),
        fetch(`${API}/procurement/vendors`, { headers }),
        fetch(`${API}/procurement/purchase-requests`, { headers }),
        fetch(`${API}/procurement/purchase-orders`, { headers }),
        fetch(`${API}/stores/currency`, { headers }),
      ]);
      if (itemRes.ok) setItems(await itemRes.json());
      if (zoneRes.ok) setZones(await zoneRes.json());
      if (movRes.ok) setMovements(await movRes.json());
      if (vendRes.ok) setVendors(await vendRes.json());
      if (prRes.ok) setPrs(await prRes.json());
      if (poRes.ok) setPos(await poRes.json());
      if (curRes.ok) { const d = await curRes.json(); setCurrency(d.currency ?? 'KES'); }
    } catch { toast.error('Failed to load store data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const alerts = useMemo(() => items.filter((i) => i.belowMin), [items]);
  const pendingPRs = useMemo(() => prs.filter((p) => p.status === 'PENDING'), [prs]);

  const filteredItems = useMemo(() => items.filter((i) => {
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const mc = categoryFilter === 'ALL' || i.category === categoryFilter;
    return ms && mc;
  }), [items, search, categoryFilter]);

  const filteredMovements = useMemo(() => movements.filter((m) => {
    const ms = !search || m.item.name.toLowerCase().includes(search.toLowerCase()) || (m.reference ?? '').toLowerCase().includes(search.toLowerCase());
    const mt = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;
    return ms && mt;
  }), [movements, search, movementTypeFilter]);

  const filteredPRs = useMemo(() => prs.filter((p) => {
    const ms = !search || p.item.name.toLowerCase().includes(search.toLowerCase());
    const ms2 = prStatusFilter === 'ALL' || p.status === prStatusFilter;
    return ms && ms2;
  }), [prs, search, prStatusFilter]);

  const totalStockValue = useMemo(() => items.reduce((s, i) => s + i.totalStock * i.unitCost, 0), [items]);

  const handleApprovePR = async (pr: PurchaseRequest) => {
    try {
      const headers = getHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/procurement/purchase-requests/${pr.id}/approve`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedQty: pr.suggestedQty }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('PR approved — PO created');
      fetchAll();
    } catch (err: any) { toast.error(err.message ?? 'Could not approve PR'); }
  };

  const handleRejectPR = async (pr: PurchaseRequest) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      const headers = getHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/procurement/purchase-requests/${pr.id}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('PR rejected');
      fetchAll();
    } catch (err: any) { toast.error(err.message ?? 'Could not reject PR'); }
  };

  const handleUpdatePOStatus = async (po: PurchaseOrder, status: string) => {
    try {
      const headers = getHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/procurement/purchase-orders/${po.id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(`PO ${po.poNumber} → ${status}`);
      fetchAll();
    } catch (err: any) { toast.error(err.message ?? 'Could not update PO'); }
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'items',       label: 'Item Catalogue'  },
    { key: 'movements',   label: 'Movement Log'    },
    { key: 'procurement', label: 'Procurement', badge: pendingPRs.length },
    { key: 'vendors',     label: 'Vendors'          },
    { key: 'alerts',      label: 'Low Stock',  badge: alerts.length     },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-24">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Boxes className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Stores &amp; <span className="text-amber-400">Procurement</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            Item catalogue, stock levels, GRN/issue tracking, vendor management, and PO workflow. Currency: <span className="text-amber-400 font-black">{currency}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={fetchAll} className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {activeTab === 'items' && (
            <button onClick={() => setShowAddItem(true)} className="h-10 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          )}
          {activeTab === 'movements' && (
            <button onClick={() => { setMovementPrefillId(undefined); setShowMovement(true); }} className="h-10 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Plus className="w-3.5 h-3.5" /> Record Movement
            </button>
          )}
          {activeTab === 'vendors' && (
            <button onClick={() => setShowAddVendor(true)} className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Vendor
            </button>
          )}
          {(activeTab === 'procurement' || activeTab === 'alerts') && (
            <button onClick={() => setShowCreatePR(true)} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Plus className="w-3.5 h-3.5" /> Create PR
            </button>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { icon: Package,     label: 'Total Items',       value: items.length,                                           color: 'amber'   },
          { icon: DollarSign,  label: `Stock Value`,       value: `${currency} ${totalStockValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'emerald' },
          { icon: ShoppingCart,label: 'Pending PRs',       value: pendingPRs.length,                                      color: pendingPRs.length > 0 ? 'blue' : 'slate' },
          { icon: AlertTriangle,label:'Low Stock Alerts',  value: alerts.length,                                          color: alerts.length > 0 ? 'rose' : 'slate'    },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${s.color}-500/10 border border-${s.color}-500/20 flex items-center justify-center shrink-0`}>
              <s.icon className={`w-6 h-6 text-${s.color}-400`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-white truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="space-y-4">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); setSelectedItem(null); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === t.key ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
              }`}>
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${activeTab === t.key ? 'bg-slate-950/30 text-slate-950' : 'bg-rose-500 text-white'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="pl-10 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 w-56" />
          </div>
          {activeTab === 'items' && (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none">
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CFG[c]?.label ?? c}</option>)}
            </select>
          )}
          {activeTab === 'movements' && (
            <select value={movementTypeFilter} onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none">
              <option value="ALL">All Types</option>
              {Object.entries(MOVEMENT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {activeTab === 'procurement' && (
            <select value={prStatusFilter} onChange={(e) => setPrStatusFilter(e.target.value)}
              className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none">
              <option value="ALL">All Statuses</option>
              {Object.entries(PR_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Item Catalogue ─────────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  {['Item / SKU', 'Category', 'Total Stock', 'Stock Health', 'Unit Cost', 'Total Value'].map((h) => (
                    <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" /></td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No items found.</td></tr>
                ) : filteredItems.map((item) => {
                  const catCfg = CATEGORY_CFG[item.category] ?? { color: 'slate', label: item.category };
                  const stockPct = item.maxStockLevel > 0 ? Math.min(100, (item.totalStock / item.maxStockLevel) * 100) : null;
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <tr key={item.id} onClick={() => setSelectedItem(isSelected ? null : item)}
                      className={`transition-colors cursor-pointer ${isSelected ? 'bg-amber-500/5 border-l-2 border-amber-500/40' : 'hover:bg-white/2'}`}>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-white uppercase">{item.name}</p>
                        <p className="text-[10px] text-slate-600 font-black uppercase mt-0.5">{item.sku}</p>
                        {item.preferredVendor && <p className="text-[9px] text-blue-400/60 font-bold mt-0.5">{item.preferredVendor.name}</p>}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest bg-${catCfg.color}-500/10 text-${catCfg.color}-400 border border-${catCfg.color}-500/20`}>
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className={`text-sm font-black ${item.belowMin ? 'text-rose-400' : item.belowReorder ? 'text-amber-400' : 'text-white'}`}>
                          {item.totalStock} <span className="text-xs text-slate-500">{item.unit}</span>
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          {stockPct !== null && (
                            <div className={`h-full rounded-full ${item.belowMin ? 'bg-rose-500' : item.belowReorder ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stockPct}%` }} />
                          )}
                        </div>
                        <p className="text-[9px] font-black mt-1 uppercase tracking-widest">
                          {item.belowMin ? <span className="text-rose-500">⚠ Below Min</span> :
                           item.belowReorder ? <span className="text-amber-400">↻ Reorder</span> :
                           <span className="text-emerald-500">✓ OK</span>}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-slate-400">{currency} {item.unitCost.toFixed(2)}</td>
                      <td className="px-8 py-5 text-xs font-black text-emerald-400">{currency} {(item.totalStock * item.unitCost).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedItem && (
            <ItemDetailPanel
              item={selectedItem} movements={movements} currency={currency}
              onClose={() => setSelectedItem(null)}
              onMovement={() => { setMovementPrefillId(selectedItem.id); setShowMovement(true); }}
              onEdit={() => fetchAll()}
            />
          )}
        </div>
      )}

      {/* ── Movement Log ──────────────────────────────────────────────────── */}
      {activeTab === 'movements' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Type', 'Item', 'Zone', 'Quantity', 'Reference', 'Notes', 'Date'].map((h) => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" /></td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No movements found.</td></tr>
              ) : filteredMovements.map((m) => {
                const mc = MOVEMENT_CFG[m.type] ?? { label: m.type, color: 'slate', icon: Package, sign: '?' };
                const Ico = mc.icon;
                return (
                  <tr key={m.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${mc.color}-500/10 border border-${mc.color}-500/20 text-${mc.color}-400 text-[9px] font-black uppercase tracking-widest`}>
                        <Ico className="w-3 h-3" /> {mc.label}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-white uppercase">{m.item.name}</p>
                      <p className="text-[10px] text-slate-600 font-black">{m.item.sku}</p>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{m.zone.name}</td>
                    <td className="px-8 py-5">
                      <span className={`text-sm font-black text-${mc.color}-400`}>{mc.sign}{m.quantity} {m.item.unit}</span>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-500">{m.reference ?? '—'}</td>
                    <td className="px-8 py-5 text-[10px] text-slate-600 max-w-[160px] truncate">{m.notes ?? '—'}</td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-600">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Procurement ───────────────────────────────────────────────────── */}
      {activeTab === 'procurement' && (
        <div className="space-y-8">
          {/* Purchase Requests */}
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" /> Purchase Requests
            </h3>
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {['Item', 'Status', 'Current Stock', 'Suggested Qty', 'Vendor', 'Est. Total', 'Date', ''].map((h) => (
                      <th key={h} className="px-7 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={8} className="px-8 py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
                  ) : filteredPRs.length === 0 ? (
                    <tr><td colSpan={8} className="px-8 py-16 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No purchase requests.</td></tr>
                  ) : filteredPRs.map((pr) => {
                    const sc = PR_STATUS_CFG[pr.status] ?? { label: pr.status, color: 'slate', icon: Clock };
                    const Ico = sc.icon;
                    return (
                      <tr key={pr.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-7 py-4">
                          <p className="text-xs font-black text-white uppercase">{pr.item.name}</p>
                          <p className="text-[9px] text-slate-600 font-black">{pr.item.sku}</p>
                        </td>
                        <td className="px-7 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${sc.color}-500/10 border border-${sc.color}-500/20 text-${sc.color}-400 text-[9px] font-black uppercase tracking-widest`}>
                            <Ico className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-xs font-black text-rose-400">{pr.currentStock} {pr.item.unit}</td>
                        <td className="px-7 py-4 text-xs font-black text-white">{pr.approvedQty ?? pr.suggestedQty} {pr.item.unit}</td>
                        <td className="px-7 py-4 text-xs font-bold text-slate-400">{pr.vendor?.name ?? '—'}</td>
                        <td className="px-7 py-4 text-xs font-black text-emerald-400">
                          {pr.estimatedTotal != null ? `${currency} ${pr.estimatedTotal.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-7 py-4 text-[10px] text-slate-600 font-bold">{new Date(pr.createdAt).toLocaleDateString()}</td>
                        <td className="px-7 py-4">
                          {pr.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprovePR(pr)}
                                className="h-7 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest transition-all">
                                Approve
                              </button>
                              <button onClick={() => handleRejectPR(pr)}
                                className="h-7 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-400 uppercase tracking-widest transition-all">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase Orders */}
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Purchase Orders
            </h3>
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {['PO Number', 'Vendor', 'Status', 'Total', 'Expected Delivery', 'Date', ''].map((h) => (
                      <th key={h} className="px-7 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={7} className="px-8 py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : pos.length === 0 ? (
                    <tr><td colSpan={7} className="px-8 py-16 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No purchase orders.</td></tr>
                  ) : pos.map((po) => {
                    const sc = PO_STATUS_CFG[po.status] ?? { label: po.status, color: 'slate', icon: FileText };
                    const Ico = sc.icon;
                    const nextStatuses: Record<string, string> = {
                      DRAFT: 'SENT', SENT: 'ACKNOWLEDGED', ACKNOWLEDGED: 'PARTIALLY_RECEIVED',
                      PARTIALLY_RECEIVED: 'RECEIVED',
                    };
                    const nextStatus = nextStatuses[po.status];
                    return (
                      <tr key={po.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-7 py-4 font-mono text-xs font-black text-white">{po.poNumber}</td>
                        <td className="px-7 py-4">
                          <p className="text-xs font-black text-white">{po.vendor.name}</p>
                          <p className="text-[9px] text-slate-600">{po.vendor.email}</p>
                        </td>
                        <td className="px-7 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${sc.color}-500/10 border border-${sc.color}-500/20 text-${sc.color}-400 text-[9px] font-black uppercase tracking-widest`}>
                            <Ico className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-sm font-black text-emerald-400">{currency} {po.totalAmount.toFixed(2)}</td>
                        <td className="px-7 py-4 text-[10px] font-bold text-slate-400">
                          {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-7 py-4 text-[10px] text-slate-600 font-bold">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="px-7 py-4">
                          {nextStatus && (
                            <button onClick={() => handleUpdatePOStatus(po, nextStatus)}
                              className="h-7 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all whitespace-nowrap">
                              → {PO_STATUS_CFG[nextStatus]?.label}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Vendors ───────────────────────────────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
          ) : vendors.length === 0 ? (
            <div className="col-span-3 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No vendors yet.</div>
          ) : vendors.filter((v) => !search || v.name.toLowerCase().includes(search.toLowerCase())).map((v) => (
            <div key={v.id} className={`bg-white/5 rounded-[2rem] border border-white/5 p-6 flex flex-col gap-4 hover:bg-white/[0.07] transition-all ${!v.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase leading-tight">{v.name}</p>
                    {v.contactPerson && <p className="text-[10px] text-slate-500 font-bold mt-0.5">{v.contactPerson}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${v.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                  {v.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-[10px] font-bold">
                {v.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {v.email}
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {v.phone}
                  </div>
                )}
                {v.website && (
                  <div className="flex items-center gap-2 text-blue-400/70">
                    <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {v.website}
                  </div>
                )}
                {v.paymentTerms && (
                  <div className="flex items-center gap-2 text-amber-400/70">
                    <DollarSign className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {v.paymentTerms}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Low Stock Alerts ──────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
          ) : alerts.length === 0 ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">All items above minimum stock levels.</p>
            </div>
          ) : alerts.map((item) => {
            const shortfall = item.minStockLevel - item.totalStock;
            const pct = item.minStockLevel > 0 ? Math.max(0, Math.min(100, (item.totalStock / item.minStockLevel) * 100)) : 0;
            const catCfg = CATEGORY_CFG[item.category] ?? { color: 'slate', label: item.category };
            return (
              <div key={item.id} className="bg-rose-500/5 border border-rose-500/15 rounded-3xl p-6 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white uppercase">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase">{item.sku}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black bg-${catCfg.color}-500/10 text-${catCfg.color}-400`}>{catCfg.label}</span>
                    </div>
                    <div className="mt-2 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] text-rose-400/60 font-bold mt-0.5">{pct.toFixed(0)}% of minimum</p>
                  </div>
                </div>

                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Current</p>
                    <p className="text-xl font-black text-rose-400">{item.totalStock} <span className="text-xs">{item.unit}</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Required</p>
                    <p className="text-xl font-black text-slate-400">{item.minStockLevel} <span className="text-xs">{item.unit}</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Shortfall</p>
                    <p className="text-xl font-black text-rose-500">{shortfall.toFixed(1)} <span className="text-xs">{item.unit}</span></p>
                  </div>
                </div>

                <button onClick={() => setShowCreatePR(true)}
                  className="h-9 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 transition-all whitespace-nowrap">
                  <ShoppingCart className="w-3.5 h-3.5" /> Create PR
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showAddItem && <AddItemModal currency={currency} vendors={vendors} onClose={() => setShowAddItem(false)} onSuccess={fetchAll} />}
      {showMovement && (
        <MovementModal items={items} zones={zones}
          onClose={() => { setShowMovement(false); setMovementPrefillId(undefined); }}
          onSuccess={fetchAll} prefillItemId={movementPrefillId}
        />
      )}
      {showAddVendor && <AddVendorModal onClose={() => setShowAddVendor(false)} onSuccess={fetchAll} />}
      {showCreatePR && <CreatePRModal items={items} vendors={vendors} onClose={() => setShowCreatePR(false)} onSuccess={fetchAll} />}
    </div>
  );
}
