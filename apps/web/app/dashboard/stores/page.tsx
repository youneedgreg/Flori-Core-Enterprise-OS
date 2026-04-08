'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Zone {
  id: string;
  name: string;
  type: string;
}

interface StoreItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  description?: string;
  minStockLevel: number;
  reorderPoint: number;
  unitCost: number;
  totalStock: number;
  belowMin: boolean;
  stock: { zoneId: string; quantity: number; zone: Zone }[];
}

interface StoreMovement {
  id: string;
  type: 'GRN' | 'ISSUE' | 'RETURN' | 'WRITE_OFF';
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  item: { name: string; unit: string };
  zone: { name: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'FERTILISER', 'PESTICIDE', 'SEED', 'PACKAGING', 'PPE', 'SPARE_PART', 'OTHER',
] as const;

const MOVEMENT_TYPES = [
  { value: 'GRN', label: 'GRN — Goods Received', icon: ArrowDownToLine, color: 'text-emerald-400' },
  { value: 'ISSUE', label: 'Issue to Zone', icon: ArrowUpFromLine, color: 'text-amber-400' },
  { value: 'RETURN', label: 'Return from Zone', icon: RotateCcw, color: 'text-blue-400' },
  { value: 'WRITE_OFF', label: 'Write-Off', icon: Trash2, color: 'text-rose-400' },
] as const;

const movementBadge = (type: string) => {
  switch (type) {
    case 'GRN': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'ISSUE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'RETURN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'WRITE_OFF': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default: return 'bg-white/5 text-slate-400 border-white/10';
  }
};

const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    FERTILISER: 'bg-lime-500/10 text-lime-400',
    PESTICIDE: 'bg-orange-500/10 text-orange-400',
    SEED: 'bg-green-500/10 text-green-400',
    PACKAGING: 'bg-cyan-500/10 text-cyan-400',
    PPE: 'bg-purple-500/10 text-purple-400',
    SPARE_PART: 'bg-yellow-500/10 text-yellow-400',
    OTHER: 'bg-white/5 text-slate-400',
  };
  return map[cat] ?? 'bg-white/5 text-slate-400';
};

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'items' | 'movements' | 'alerts';

export default function StoresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [items, setItems] = useState<StoreItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [movements, setMovements] = useState<StoreMovement[]>([]);
  const [currency, setCurrency] = useState('KES');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: '', sku: '', category: 'OTHER', unit: 'units',
    description: '', minStockLevel: 0, reorderPoint: 0, maxStockLevel: 0, unitCost: 0,
    preferredVendorId: '',
  });
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [movementForm, setMovementForm] = useState({
    itemId: '', zoneId: '', type: 'GRN', quantity: 0, reference: '', notes: '', toZoneId: '',
  });

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchItems = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/stores/items`, { headers });
    if (res.ok) setItems(await res.json());
  }, []);

  const fetchZones = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/zones`, { headers });
    if (res.ok) setZones(await res.json());
  }, []);

  const fetchMovements = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/stores/movements`, { headers });
    if (res.ok) setMovements(await res.json());
  }, []);

  const fetchCurrency = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/stores/currency`, { headers });
    if (res.ok) {
      const data = await res.json();
      setCurrency(data.currency ?? 'KES');
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    const res = await fetch(`${API}/procurement/vendors`, { headers });
    if (res.ok) setVendors(await res.json());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchItems(), fetchZones(), fetchMovements(), fetchCurrency(), fetchVendors()]);
    } catch {
      toast.error('Failed to load store data');
    } finally {
      setLoading(false);
    }
  }, [fetchItems, fetchZones, fetchMovements, fetchCurrency, fetchVendors]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/stores/items`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm),
      });
      if (res.ok) {
        toast.success(`"${itemForm.name}" added to catalogue`);
        setShowItemModal(false);
        setItemForm({ name: '', sku: '', category: 'OTHER', unit: 'units', description: '', minStockLevel: 0, reorderPoint: 0, maxStockLevel: 0, unitCost: 0, preferredVendorId: '' });
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.message ?? 'Could not add item');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const payload: Record<string, unknown> = {
        itemId: movementForm.itemId,
        zoneId: movementForm.zoneId,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        reference: movementForm.reference || undefined,
        notes: movementForm.notes || undefined,
        toZoneId: movementForm.type === 'ISSUE' && movementForm.toZoneId ? movementForm.toZoneId : undefined,
      };
      const res = await fetch(`${API}/stores/movements`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Movement recorded');
        setShowMovementModal(false);
        setMovementForm({ itemId: '', zoneId: '', type: 'GRN', quantity: 0, reference: '', notes: '', toZoneId: '' });
        refresh();
      } else {
        const err = await res.json();
        toast.error(err.message ?? 'Could not record movement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const alerts = items.filter((i) => i.belowMin);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'items', label: 'Item Catalogue' },
    { key: 'movements', label: 'Movement Log' },
    { key: 'alerts', label: 'Low Stock Alerts', count: alerts.length },
  ];

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-amber-500/30';

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Boxes className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Stores &amp; <span className="text-amber-500">Procurement</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            Item catalogue, zone stock levels, and GRN / issue / write-off log. Currency: <span className="text-amber-400 font-black">{currency}</span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowItemModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <ClipboardList className="w-4 h-4" /> Record Movement
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Items', value: items.length, icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Zone Locations', value: zones.length, icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Movements', value: movements.length, icon: ClipboardList, color: 'text-slate-400', bg: 'bg-white/5 border-white/10' },
          { label: 'Low Stock Alerts', value: alerts.length, icon: AlertTriangle, color: alerts.length > 0 ? 'text-rose-400' : 'text-slate-400', bg: alerts.length > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/10' },
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

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === t.key ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${activeTab === t.key ? 'bg-slate-950/30 text-slate-950' : 'bg-rose-500 text-white'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Item Catalogue ─────────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item / SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Stock</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Min Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Cost</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">No items in catalogue yet.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-white uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">{item.sku}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest ${categoryColor(item.category)}`}>
                      {item.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-sm font-black ${item.belowMin ? 'text-rose-500' : 'text-slate-300'}`}>
                      {item.totalStock.toLocaleString()} {item.unit}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-slate-500">
                    {item.minStockLevel} {item.unit}
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-emerald-400">
                    {currency} {item.unitCost.toFixed(2)}
                  </td>
                  <td className="px-8 py-6">
                    {item.belowMin ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-400 uppercase">
                        <AlertTriangle className="w-3 h-3" /> Below Min
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-500 uppercase">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Movement Log ──────────────────────────────────────────────────── */}
      {activeTab === 'movements' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Zone</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qty</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reference</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" /></td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">No movements recorded yet.</td></tr>
              ) : movements.map((m) => (
                <tr key={m.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${movementBadge(m.type)}`}>
                      {m.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-white uppercase">{m.item.name}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-400">{m.zone.name}</td>
                  <td className="px-8 py-6 text-sm font-black text-slate-300">
                    {['GRN', 'RETURN'].includes(m.type) ? '+' : '-'}{m.quantity} {m.item.unit}
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-slate-500">{m.reference ?? '—'}</td>
                  <td className="px-8 py-6 text-[10px] font-black text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Low Stock Alerts ──────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
          ) : alerts.length === 0 ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-16 text-center">
              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">All items are above minimum stock levels.</p>
            </div>
          ) : alerts.map((item) => (
            <div key={item.id} className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{item.sku} · {item.category.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Stock</p>
                  <p className="text-xl font-black text-rose-400">{item.totalStock} <span className="text-xs">{item.unit}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimum</p>
                  <p className="text-xl font-black text-slate-400">{item.minStockLevel} <span className="text-xs">{item.unit}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shortfall</p>
                  <p className="text-xl font-black text-rose-500">{(item.minStockLevel - item.totalStock).toFixed(1)} <span className="text-xs">{item.unit}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Add Item ───────────────────────────────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60">
          <div className="bg-brand-dark/90 backdrop-blur-3xl w-full max-w-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">Add <span className="text-amber-500">Item</span></h2>
              <button onClick={() => setShowItemModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</label>
                  <input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU</label>
                  <input required value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value.toUpperCase() })} className={inputCls + ' uppercase'} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                  <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit of Measure</label>
                  <input value={itemForm.unit} placeholder="kg, litres, pcs, boxes…" onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min Stock Level</label>
                  <input type="number" min="0" value={itemForm.minStockLevel} onChange={(e) => setItemForm({ ...itemForm, minStockLevel: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reorder Point</label>
                  <input type="number" min="0" value={itemForm.reorderPoint} onChange={(e) => setItemForm({ ...itemForm, reorderPoint: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Stock Level <span className="normal-case text-slate-600">(0 = auto 2×)</span></label>
                  <input type="number" min="0" value={itemForm.maxStockLevel} onChange={(e) => setItemForm({ ...itemForm, maxStockLevel: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Cost ({currency})</label>
                  <input type="number" min="0" step="0.01" value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferred Vendor</label>
                  <select value={itemForm.preferredVendorId} onChange={(e) => setItemForm({ ...itemForm, preferredVendorId: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Record Movement ────────────────────────────────────────── */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60">
          <div className="bg-brand-dark/90 backdrop-blur-3xl w-full max-w-lg p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic">Record <span className="text-slate-300">Movement</span></h2>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Movement type picker */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {MOVEMENT_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: mt.value })}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    movementForm.type === mt.value
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <mt.icon className={`w-4 h-4 ${movementForm.type === mt.value ? mt.color : ''}`} />
                  {mt.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</label>
                <select required value={movementForm.itemId} onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })} className={inputCls}>
                  <option value="">Select item…</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {movementForm.type === 'ISSUE' ? 'Source Zone (stock debited from)' : 'Zone'}
                </label>
                <select required value={movementForm.zoneId} onChange={(e) => setMovementForm({ ...movementForm, zoneId: e.target.value })} className={inputCls}>
                  <option value="">Select zone…</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type.replace('_', ' ')})</option>)}
                </select>
              </div>
              {movementForm.type === 'ISSUE' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Destination Zone (issued to)</label>
                  <select value={movementForm.toZoneId} onChange={(e) => setMovementForm({ ...movementForm, toZoneId: e.target.value })} className={inputCls}>
                    <option value="">Select zone…</option>
                    {zones.filter((z) => z.id !== movementForm.zoneId).map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type.replace('_', ' ')})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                  <input required type="number" min="0.01" step="0.01" value={movementForm.quantity || ''} onChange={(e) => setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference (optional)</label>
                  <input value={movementForm.reference} placeholder="GRN-001, PO-234…" onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes (optional)</label>
                <input value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
