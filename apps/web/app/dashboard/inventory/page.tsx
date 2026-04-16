'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Plus,
  Search,
  Loader2,
  Boxes,
  TrendingDown,
  AlertCircle,
  History,
  Recycle,
  Layers,
  X,
  ChevronRight,
  BarChart3,
  Filter,
  Edit2,
  CheckCircle2,
  Clock,
  Truck,
  Archive,
  Skull,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Barcode,
  Leaf,
  FlaskConical,
  Info,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Summary {
  packedBoxesInStock: number;
  allocatedBoxes: number;
  wastedBoxes: number;
  wastageThisMonthCost: number;
  wastageThisMonthStems: number;
  rawStemsInStock: number;
}

interface ATPItem {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  physicalStock: number;
  committed: number;
  allocated: number;
  atp: number;
}

interface PackedBox {
  id: string;
  boxId: string;
  varietyId: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  totalStems: number;
  status: string;
  packDate: string;
  destination?: string;
  labelUrl?: string;
  variety: { name: string };
  batch?: { batchNumber: string };
  order?: { orderNumber?: string; customer: { name: string } };
}

interface FlowerInventory {
  id: string;
  varietyId: string;
  grade: string;
  quantity: number;
  updatedAt: string;
  variety: { name: string; defaultCostPerStem?: number };
}

interface WastageLog {
  id: string;
  grade: string;
  quantity: number;
  reason: string;
  costImpact?: number;
  notes?: string;
  createdAt: string;
  variety: { name: string };
}

interface Variety {
  id: string;
  name: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const BOX_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PACKED:           { label: 'Packed',          color: 'blue',    icon: Package },
  IN_COLD_STORAGE:  { label: 'Cold Storage',     color: 'cyan',    icon: Archive },
  ALLOCATED:        { label: 'Allocated',         color: 'amber',   icon: ArrowUpDown },
  SHIPPED:          { label: 'Shipped',           color: 'emerald', icon: Truck },
  DELIVERED:        { label: 'Delivered',         color: 'green',   icon: CheckCircle2 },
  WASTED:           { label: 'Wasted',            color: 'rose',    icon: Skull },
};

const WASTAGE_REASON_CFG: Record<string, { label: string; color: string }> = {
  TEMPERATURE_DAMAGE: { label: 'Temp Damage',     color: 'orange' },
  DISEASE:            { label: 'Disease',          color: 'purple' },
  PEST_DAMAGE:        { label: 'Pest Damage',      color: 'yellow' },
  PHYSICAL_DAMAGE:    { label: 'Physical Damage',  color: 'rose'   },
  EXPIRED:            { label: 'Expired',          color: 'slate'  },
  GRADING_REJECT:     { label: 'Grading Reject',   color: 'amber'  },
  OTHER:              { label: 'Other',             color: 'slate'  },
};

const GRADE_COLOR: Record<string, string> = {
  A: 'emerald', B: 'blue', C: 'amber', REJECT: 'rose',
};

// ── Auth helper ───────────────────────────────────────────────────────────────

function getAuthHeader() {
  const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
  const token = tokenMatch?.[1];
  if (!token || isTokenExpired(token)) { logout(); return null; }
  return { Authorization: `Bearer ${token}` };
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 shrink-0`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-600 font-bold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Wastage Modal ─────────────────────────────────────────────────────────────

function WastageModal({
  varieties,
  onClose,
  onSuccess,
}: {
  varieties: Variety[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    varietyId: '',
    grade: 'A',
    quantity: '',
    reason: 'PHYSICAL_DAMAGE',
    notes: '',
    costPerStem: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.varietyId || !form.quantity) return;
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/wastage`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity),
          costPerStem: form.costPerStem ? parseFloat(form.costPerStem) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Wastage recorded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not record wastage');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-lg rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Recycle className="w-4 h-4 text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
              Record <span className="text-rose-500">Wastage</span>
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Variety *</label>
            <select
              value={form.varietyId}
              onChange={(e) => setForm({ ...form, varietyId: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40"
            >
              <option value="">Select variety…</option>
              {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grade *</label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40"
              >
                {['A', 'B', 'C', 'REJECT'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stems *</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason *</label>
            <select
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40"
            >
              {Object.entries(WASTAGE_REASON_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cost per Stem Override (optional)</label>
            <input
              type="number"
              step="0.01"
              value={form.costPerStem}
              onChange={(e) => setForm({ ...form, costPerStem: e.target.value })}
              placeholder="Uses variety default if blank"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Optional context…"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-rose-500/40 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Recycle className="w-4 h-4" /> Log Wastage</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Adjust Stock Modal ────────────────────────────────────────────────────────

function AdjustStockModal({
  item,
  onClose,
  onSuccess,
}: {
  item: FlowerInventory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/flower-inventory/${item.id}/adjust`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(quantity) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Stock updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const gc = GRADE_COLOR[item.grade] ?? 'slate';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-[#0e1117] w-full max-w-md rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Adjust <span className="text-emerald-400">Stock</span></h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">{item.variety.name} · Grade {item.grade}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="bg-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${gc}-500/10 border border-${gc}-500/20 flex items-center justify-center`}>
              <Leaf className={`w-5 h-5 text-${gc}-400`} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">Current Stock</p>
              <p className="text-2xl font-black text-white">{item.quantity.toLocaleString()} <span className="text-sm text-slate-500">stems</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Quantity (stems)</label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white font-black focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          {parseInt(quantity) !== item.quantity && (
            <div className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wide ${
              parseInt(quantity) > item.quantity ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {parseInt(quantity) > item.quantity ? '▲' : '▼'} {Math.abs(parseInt(quantity) - item.quantity)} stems {parseInt(quantity) > item.quantity ? 'increase' : 'decrease'}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Box Detail Panel ──────────────────────────────────────────────────────────

function BoxDetailPanel({
  atpRow,
  boxes,
  onClose,
}: {
  atpRow: ATPItem;
  boxes: PackedBox[];
  onClose: () => void;
}) {
  const matching = boxes.filter(
    (b) =>
      b.varietyId === atpRow.varietyId &&
      b.grade === atpRow.grade &&
      b.bunchSize === atpRow.bunchSize &&
      b.bunchesPerBox === atpRow.bunchesPerBox,
  );

  return (
    <div className="w-[420px] shrink-0 bg-[#0d1117] border-l border-white/5 flex flex-col h-full">
      <div className="px-7 py-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Box Detail</p>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{atpRow.varietyName}</h3>
          <p className="text-xs text-slate-500 font-bold">Grade {atpRow.grade} · {atpRow.bunchesPerBox}×{atpRow.bunchSize}stems</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        {[
          { label: 'Physical', value: atpRow.physicalStock, color: 'blue' },
          { label: 'Committed', value: atpRow.committed, color: 'amber' },
          { label: 'ATP', value: atpRow.atp, color: atpRow.atp > 0 ? 'emerald' : 'rose' },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{s.label}</p>
            <p className={`text-xl font-black text-${s.color}-400`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {matching.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No boxes found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {matching.map((box) => {
              const cfg = BOX_STATUS_CFG[box.status] ?? { label: box.status, color: 'slate', icon: Package };
              const Ico = cfg.icon;
              return (
                <div key={box.id} className="px-7 py-4 hover:bg-white/2 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white uppercase tracking-tight font-mono">{box.boxId}</p>
                      {box.batch && <p className="text-[10px] text-slate-600 font-bold mt-0.5">Batch: {box.batch.batchNumber}</p>}
                      {box.order && <p className="text-[10px] text-amber-500/70 font-bold mt-0.5">→ {box.order.customer.name}</p>}
                      <p className="text-[10px] text-slate-600 font-bold">{new Date(box.packDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${cfg.color}-500/10 border border-${cfg.color}-500/20 text-${cfg.color}-400 text-[9px] font-black uppercase tracking-widest whitespace-nowrap`}>
                      <Ico className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  type Tab = 'atp' | 'boxes' | 'raw' | 'wastage';
  const [activeTab, setActiveTab] = useState<Tab>('atp');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [atpData, setAtpData] = useState<ATPItem[]>([]);
  const [boxes, setBoxes] = useState<PackedBox[]>([]);
  const [flowerInv, setFlowerInv] = useState<FlowerInventory[]>([]);
  const [wastageLogs, setWastageLogs] = useState<WastageLog[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [boxStatusFilter, setBoxStatusFilter] = useState('ALL');

  const [selectedATPRow, setSelectedATPRow] = useState<ATPItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<FlowerInventory | null>(null);
  const [showWastageModal, setShowWastageModal] = useState(false);

  const getHeaders = () => getAuthHeader();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      if (!headers) return;

      const [summRes, atpRes, boxRes, flowerRes, wastageRes, varRes] = await Promise.all([
        fetch(`${API}/inventory/summary`, { headers }),
        fetch(`${API}/inventory/atp`, { headers }),
        fetch(`${API}/inventory/boxes`, { headers }),
        fetch(`${API}/inventory/flower-inventory`, { headers }),
        fetch(`${API}/inventory/wastage`, { headers }),
        fetch(`${API}/varieties`, { headers }),
      ]);

      if (summRes.ok) setSummary(await summRes.json());
      if (atpRes.ok) setAtpData(await atpRes.json());
      if (boxRes.ok) setBoxes(await boxRes.json());
      if (flowerRes.ok) setFlowerInv(await flowerRes.json());
      if (wastageRes.ok) setWastageLogs(await wastageRes.json());
      if (varRes.ok) setVarieties(await varRes.json());
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredATP = useMemo(() =>
    atpData.filter((item) => {
      const matchSearch = !search || item.varietyName.toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === 'ALL' || item.grade === gradeFilter;
      return matchSearch && matchGrade;
    }), [atpData, search, gradeFilter]);

  const filteredBoxes = useMemo(() =>
    boxes.filter((box) => {
      const matchSearch = !search ||
        box.boxId.toLowerCase().includes(search.toLowerCase()) ||
        box.variety.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = boxStatusFilter === 'ALL' || box.status === boxStatusFilter;
      const matchGrade = gradeFilter === 'ALL' || box.grade === gradeFilter;
      return matchSearch && matchStatus && matchGrade;
    }), [boxes, search, boxStatusFilter, gradeFilter]);

  const filteredFlower = useMemo(() =>
    flowerInv.filter((item) => {
      const matchSearch = !search || item.variety.name.toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === 'ALL' || item.grade === gradeFilter;
      return matchSearch && matchGrade;
    }), [flowerInv, search, gradeFilter]);

  const filteredWastage = useMemo(() =>
    wastageLogs.filter((log) => {
      const matchSearch = !search || log.variety.name.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    }), [wastageLogs, search]);

  const totalWastageCost = wastageLogs.reduce((s, l) => s + (l.costImpact ?? 0), 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'atp',    label: 'ATP / Finished Goods', color: 'blue'   },
    { id: 'boxes',  label: 'Packed Boxes',          color: 'cyan'   },
    { id: 'raw',    label: 'Raw Stems',             color: 'emerald'},
    { id: 'wastage',label: 'Wastage Log',           color: 'rose'   },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-24">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Boxes className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Inventory <span className="text-blue-400">Hub</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            Real-time ATP, packed box tracking, raw stems, and wastage analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {activeTab === 'wastage' && (
            <button
              onClick={() => setShowWastageModal(true)}
              className="h-10 px-5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Record Wastage
            </button>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <KpiCard icon={Boxes}       label="Boxes in Stock"       value={summary?.packedBoxesInStock ?? '—'} sub="PACKED + Cold Storage"             color="blue"    />
        <KpiCard icon={ArrowUpDown} label="Allocated to Orders"  value={summary?.allocatedBoxes ?? '—'}    sub="Committed for dispatch"             color="amber"   />
        <KpiCard icon={Leaf}        label="Raw Stems in Stock"   value={(summary?.rawStemsInStock ?? 0).toLocaleString()} sub="Across all varieties & grades"  color="emerald" />
        <KpiCard icon={TrendingDown} label="Wastage Cost (MTD)"  value={`$${(summary?.wastageThisMonthCost ?? 0).toFixed(2)}`} sub={`${summary?.wastageThisMonthStems ?? 0} stems lost`} color="rose" />
      </div>

      {/* Tabs + Search/Filter Row */}
      <div className="space-y-4">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearch(''); setGradeFilter('ALL'); setBoxStatusFilter('ALL'); setSelectedATPRow(null); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === t.id ? `bg-${t.color}-500 ${t.color === 'blue' || t.color === 'cyan' ? 'text-slate-950' : t.color === 'emerald' ? 'text-slate-950' : 'text-white'} shadow-lg` : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-10 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 w-56"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none"
          >
            <option value="ALL">All Grades</option>
            {['A', 'B', 'C', 'REJECT'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          {activeTab === 'boxes' && (
            <select
              value={boxStatusFilter}
              onChange={(e) => setBoxStatusFilter(e.target.value)}
              className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              {Object.entries(BOX_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-auto">
            {activeTab === 'atp' && `${filteredATP.length} variants`}
            {activeTab === 'boxes' && `${filteredBoxes.length} boxes`}
            {activeTab === 'raw' && `${filteredFlower.length} records`}
            {activeTab === 'wastage' && `${filteredWastage.length} logs`}
          </span>
        </div>
      </div>

      {/* ── ATP Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'atp' && (
        <div className="flex gap-6 min-h-0">
          <div className="flex-1 min-w-0">
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {['Variety & Grade', 'Box Configuration', 'Physical Stock', 'Committed', 'ATP'].map((h) => (
                      <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : filteredATP.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No finished goods in stock.</td></tr>
                  ) : filteredATP.map((item, idx) => {
                    const gc = GRADE_COLOR[item.grade] ?? 'slate';
                    const utilPct = item.physicalStock > 0 ? Math.min(100, ((item.committed - item.allocated) / item.physicalStock) * 100) : 0;
                    const isSelected = selectedATPRow?.varietyId === item.varietyId && selectedATPRow?.grade === item.grade && selectedATPRow?.bunchSize === item.bunchSize;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedATPRow(isSelected ? null : item)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-500/5 border-l-2 border-blue-500/40' : 'hover:bg-white/2'}`}
                      >
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-white uppercase">{item.varietyName}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md bg-${gc}-500/10 text-${gc}-400 text-[9px] font-black tracking-widest border border-${gc}-500/20`}>
                            GRADE {item.grade}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-400 font-bold uppercase">
                          {item.bunchesPerBox} bunches × {item.bunchSize} stems
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-white">{item.physicalStock}</p>
                          <div className="mt-1.5 h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/60 rounded-full transition-all" style={{ width: `${utilPct}%` }} />
                          </div>
                          <p className="text-[9px] text-slate-600 font-bold mt-0.5">{utilPct.toFixed(0)}% committed</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-amber-400/70">{item.committed}</td>
                        <td className="px-8 py-5">
                          <span className={`text-xl font-black ${item.atp <= 0 ? 'text-rose-500' : 'text-blue-400'}`}>
                            {item.atp}
                          </span>
                          <span className="text-[9px] text-slate-600 font-black uppercase ml-1">boxes</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedATPRow && (
            <BoxDetailPanel atpRow={selectedATPRow} boxes={boxes} onClose={() => setSelectedATPRow(null)} />
          )}
        </div>
      )}

      {/* ── Packed Boxes Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'boxes' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Box ID', 'Variety & Grade', 'Spec', 'Status', 'Date', 'Order / Batch'].map((h) => (
                  <th key={h} className="px-7 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" /></td></tr>
              ) : filteredBoxes.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No boxes found.</td></tr>
              ) : filteredBoxes.map((box) => {
                const cfg = BOX_STATUS_CFG[box.status] ?? { label: box.status, color: 'slate', icon: Package };
                const Ico = cfg.icon;
                const gc = GRADE_COLOR[box.grade] ?? 'slate';
                return (
                  <tr key={box.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-7 py-4">
                      <p className="text-xs font-black text-white font-mono tracking-tight">{box.boxId}</p>
                    </td>
                    <td className="px-7 py-4">
                      <p className="text-xs font-black text-white uppercase">{box.variety.name}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded bg-${gc}-500/10 text-${gc}-400 text-[9px] font-black`}>Grade {box.grade}</span>
                    </td>
                    <td className="px-7 py-4 text-[10px] text-slate-500 font-bold uppercase">
                      {box.bunchesPerBox}×{box.bunchSize}st · {box.totalStems} total
                    </td>
                    <td className="px-7 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${cfg.color}-500/10 border border-${cfg.color}-500/20 text-${cfg.color}-400 text-[9px] font-black uppercase tracking-widest`}>
                        <Ico className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-7 py-4 text-[10px] text-slate-500 font-bold">
                      {new Date(box.packDate).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-4 text-[10px] font-bold">
                      {box.order ? (
                        <span className="text-amber-400">{box.order.customer.name}{box.order.orderNumber ? ` · #${box.order.orderNumber}` : ''}</span>
                      ) : box.batch ? (
                        <span className="text-slate-500">Batch {box.batch.batchNumber}</span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Raw Stems Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'raw' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" /> Raw Stem Inventory
            </h3>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              Click <Edit2 className="w-3 h-3 inline" /> to adjust
            </p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Variety', 'Grade', 'Stems in Stock', 'Cost / Stem', 'Total Value', 'Last Updated', ''].map((h) => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : filteredFlower.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No raw inventory records.</td></tr>
              ) : filteredFlower.map((item) => {
                const gc = GRADE_COLOR[item.grade] ?? 'slate';
                const cost = item.variety.defaultCostPerStem ?? 0;
                const totalValue = item.quantity * cost;
                return (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-white uppercase">{item.variety.name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-block px-2.5 py-1 rounded-lg bg-${gc}-500/10 border border-${gc}-500/20 text-${gc}-400 text-[10px] font-black uppercase tracking-widest`}>
                        Grade {item.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className={`text-xl font-black ${item.quantity < 100 ? 'text-rose-400' : item.quantity < 500 ? 'text-amber-400' : 'text-white'}`}>
                        {item.quantity.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                        {item.quantity < 100 ? '⚠ Low stock' : item.quantity < 500 ? '⚡ Medium' : '✓ Sufficient'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-slate-400">
                      {cost > 0 ? `$${cost.toFixed(3)}` : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-400">
                      {totalValue > 0 ? `$${totalValue.toFixed(2)}` : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-8 py-5 text-[10px] text-slate-600 font-bold">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/20 flex items-center justify-center transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Wastage Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'wastage' && (
        <div className="space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
              wastageLogs.reduce<Record<string, number>>((acc, log) => {
                acc[log.reason] = (acc[log.reason] ?? 0) + log.quantity;
                return acc;
              }, {})
            ).slice(0, 4).map(([reason, qty]) => {
              const cfg = WASTAGE_REASON_CFG[reason] ?? { label: reason, color: 'slate' };
              return (
                <div key={reason} className={`bg-${cfg.color}-500/5 border border-${cfg.color}-500/15 rounded-2xl p-4 flex items-center gap-3`}>
                  <div className={`w-8 h-8 rounded-xl bg-${cfg.color}-500/10 flex items-center justify-center`}>
                    <Recycle className={`w-4 h-4 text-${cfg.color}-400`} />
                  </div>
                  <div>
                    <p className={`text-[9px] font-black text-${cfg.color}-400/70 uppercase tracking-widest`}>{cfg.label}</p>
                    <p className="text-lg font-black text-white">{qty.toLocaleString()} <span className="text-[10px] text-slate-600">stems</span></p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-rose-400" /> Wastage History
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Total cost impact: <span className="text-rose-400">${totalWastageCost.toFixed(2)}</span>
                </span>
                <button
                  onClick={() => setShowWastageModal(true)}
                  className="h-8 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3 h-3" /> Log
                </button>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  {['Variety & Grade', 'Reason', 'Stems Lost', 'Cost Impact', 'Notes', 'Date'].map((h) => (
                    <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" /></td></tr>
                ) : filteredWastage.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">No wastage recorded.</td></tr>
                ) : filteredWastage.map((log) => {
                  const gc = GRADE_COLOR[log.grade] ?? 'slate';
                  const rc = WASTAGE_REASON_CFG[log.reason] ?? { label: log.reason, color: 'slate' };
                  return (
                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-white uppercase">{log.variety.name}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded bg-${gc}-500/10 text-${gc}-400 text-[9px] font-black`}>Grade {log.grade}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg bg-${rc.color}-500/10 border border-${rc.color}-500/15 text-${rc.color}-400 text-[9px] font-black uppercase tracking-widest`}>
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-rose-400">-{log.quantity.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-600 font-bold mt-0.5">stems</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-rose-400/70">
                        {log.costImpact != null ? `$${log.costImpact.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-8 py-5 text-xs text-slate-500 max-w-[180px] truncate">
                        {log.notes || <span className="text-slate-700">—</span>}
                      </td>
                      <td className="px-8 py-5 text-[10px] text-slate-600 font-bold">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showWastageModal && (
        <WastageModal
          varieties={varieties}
          onClose={() => setShowWastageModal(false)}
          onSuccess={fetchAll}
        />
      )}

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
}
