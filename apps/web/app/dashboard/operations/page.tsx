/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Sprout, Plus, Loader2, Droplets, FlaskConical,
  Shovel, Leaf, Microscope, TrendingUp, Eye, Scissors,
  AlertTriangle, CheckCircle2, BarChart3, Calendar,
  MapPin, User, X, Save, DollarSign, ArrowRight,
  ChevronDown, ChevronUp, Edit2, Trash2, ExternalLink,
  Activity, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  const m = document.cookie.match(/access_token=([^;]+)/);
  return m?.[1] ?? '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { ...authHeaders(), ...(opts.headers as any) } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, action, onAction }: { icon: any; message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4 text-slate-600">
      <Icon className="w-14 h-14 opacity-20" />
      <p className="text-[11px] font-black uppercase tracking-[0.3em]">{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> {action}
        </button>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, size = 'default' }: { title: string; onClose: () => void; children: React.ReactNode; size?: 'default' | 'sm' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className={`relative bg-brand-dark/80 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full ${size === 'sm' ? 'max-w-md' : 'max-w-2xl'} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/2">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Operation Entry Portal</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ConfirmModal({ title, message, onConfirm, onClose, loading }: { title: string; message: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-brand-dark/80 border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-base font-black text-white">{title}</p>
            <p className="text-[11px] text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-400 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-emerald-400 transition-colors">{label}</label>
        {error && <span className="text-[9px] font-black text-rose-500 uppercase">{error}</span>}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all hover:bg-white/[0.05]";
const selectCls = "w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all hover:bg-white/[0.05] appearance-none cursor-pointer";

function SubmitBtn({ loading, label = 'Save Record' }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading} className="group relative w-full flex items-center justify-center gap-3 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] mt-6 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      <span className="uppercase tracking-widest">{label}</span>
    </button>
  );
}

function UserSelect({ name, required, users, label }: { name: string; required?: boolean; users: any[]; label?: string }) {
  return (
    <div className="relative">
      <select name={name} required={required} className={selectCls}>
        <option value="" className="bg-slate-900 text-slate-500">{label ?? 'Select Team Member'}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id} className="bg-slate-900 text-white">
            {u.email?.split('@')[0]} ({u.role?.name ?? 'Member'})
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><User className="w-4 h-4" /></div>
    </div>
  );
}

function SeverityBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${colors[value] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>{value}</span>;
}

// ─── ZoneChip / CycleChip ─────────────────────────────────────────────────────

function ZoneChip({ name, onClick }: { name?: string; onClick?: () => void }) {
  if (!name) return <span className="text-slate-600">—</span>;
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-sm font-black text-white ${onClick ? 'cursor-pointer hover:text-emerald-400 transition-colors group' : ''}`}
    >
      {name}
      {onClick && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
    </span>
  );
}

function CycleChip({ variety, zone, onClick }: { variety?: string; zone?: string; onClick?: () => void }) {
  if (!variety) return <span className="text-slate-600">—</span>;
  return (
    <span
      onClick={onClick}
      className={`inline-flex flex-col ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <span className={`text-sm font-black text-white ${onClick ? 'group-hover:text-emerald-400 transition-colors' : ''} inline-flex items-center gap-1`}>
        {variety}
        {onClick && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
      </span>
      {zone && <span className="text-[10px] font-black text-slate-500 uppercase">{zone}</span>}
    </span>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ count, onView }: { count: number; onView: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 rounded-3xl px-8 py-5 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-black text-rose-300">{count} High-Severity Pest & Disease Alert{count > 1 ? 's' : ''} Active</p>
          <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">Immediate field inspection recommended</p>
        </div>
      </div>
      <button
        onClick={onView}
        className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-400 transition-all shrink-0"
      >
        View Reports <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Tab: Soil Tests ─────────────────────────────────────────────────────────

function SoilTestsTab({ zones, router }: { zones: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/soil-tests')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    ['pHLevel', 'ecLevel', 'nitrogen', 'phosphorus', 'potassium'].forEach((k) => {
      if (body[k]) body[k] = Number(body[k]); else delete body[k];
    });
    if (!body.zoneId) delete body.zoneId;
    try {
      if (editItem) {
        await apiFetch(`/farm-operations/soil-tests/${editItem.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Soil test updated');
        setEditItem(null);
      } else {
        await apiFetch('/farm-operations/soil-tests', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Soil test saved');
        setShowForm(false);
      }
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await apiFetch(`/farm-operations/soil-tests/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Soil test deleted');
      setDeleteItem(null);
      await load();
    } catch { toast.error('Failed to delete'); } finally { setDeleting(false); }
  }

  const avgPH = data.length ? (data.filter(t => t.pHLevel).reduce((s, t) => s + t.pHLevel, 0) / data.filter(t => t.pHLevel).length) : null;
  const alertCount = data.filter(t => t.pHLevel && (t.pHLevel < 5.5 || t.pHLevel > 7.5)).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Soil Test Results</h2>
          {avgPH && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Avg pH: {avgPH.toFixed(1)} · {alertCount > 0 ? <span className="text-amber-400">{alertCount} readings out of range</span> : <span className="text-emerald-400">All in range</span>}</p>}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Test
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={FlaskConical} message="No soil tests recorded yet" action="Log First Test" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((t) => (
            <div key={t.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between">
                <span
                  onClick={() => router.push('/dashboard/zones')}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
                >
                  <MapPin className="w-3 h-3" />{t.zone?.name ?? 'No Zone'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500">{new Date(t.testDate).toLocaleDateString()}</span>
                  <button onClick={() => setEditItem(t)} className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDeleteItem(t)} className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'pH', value: t.pHLevel ?? '—', color: !t.pHLevel ? 'slate' : t.pHLevel < 5.5 || t.pHLevel > 7.5 ? 'rose' : t.pHLevel < 6 || t.pHLevel > 7 ? 'amber' : 'emerald' },
                  { label: 'EC', value: t.ecLevel ? `${t.ecLevel}` : '—', color: 'blue' },
                  { label: 'N', value: t.nitrogen ? `${t.nitrogen}` : '—', color: 'emerald' },
                  { label: 'P', value: t.phosphorus ? `${t.phosphorus}` : '—', color: 'amber' },
                  { label: 'K', value: t.potassium ? `${t.potassium}` : '—', color: 'purple' },
                  { label: 'Type', value: t.soilType ?? '—', color: 'slate' },
                ].map((m) => (
                  <div key={m.label} className={`bg-${m.color}-500/5 border border-${m.color}-500/10 rounded-xl p-2 text-center`}>
                    <p className="text-[8px] font-black text-slate-500 uppercase">{m.label}</p>
                    <p className={`text-sm font-black text-${m.color}-400 truncate`}>{m.value}</p>
                  </div>
                ))}
              </div>
              {t.notes && <p className="text-[11px] text-slate-500 font-medium">{t.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {(showForm || editItem) && (
        <Modal title={editItem ? 'Edit Soil Test' : 'Log Soil Test'} onClose={() => { setShowForm(false); setEditItem(null); }}>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Test Date *">
                <input type="date" name="testDate" required className={inputCls} defaultValue={editItem ? editItem.testDate?.slice(0, 10) : new Date().toISOString().slice(0, 10)} />
              </FormField>
              <FormField label="Zone">
                <div className="relative">
                  <select name="zoneId" className={selectCls} defaultValue={editItem?.zoneId ?? ''}>
                    <option value="">All Farm</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><MapPin className="w-4 h-4" /></div>
                </div>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="pH Level"><input type="number" name="pHLevel" step="0.1" placeholder="6.5" className={inputCls} defaultValue={editItem?.pHLevel ?? ''} /></FormField>
              <FormField label="EC (dS/m)"><input type="number" name="ecLevel" step="0.01" placeholder="1.2" className={inputCls} defaultValue={editItem?.ecLevel ?? ''} /></FormField>
              <FormField label="Soil Type"><input type="text" name="soilType" placeholder="Loam" className={inputCls} defaultValue={editItem?.soilType ?? ''} /></FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Nitrogen (mg/kg)"><input type="number" name="nitrogen" step="0.1" className={inputCls} defaultValue={editItem?.nitrogen ?? ''} /></FormField>
              <FormField label="Phosphorus (mg/kg)"><input type="number" name="phosphorus" step="0.1" className={inputCls} defaultValue={editItem?.phosphorus ?? ''} /></FormField>
              <FormField label="Potassium (mg/kg)"><input type="number" name="potassium" step="0.1" className={inputCls} defaultValue={editItem?.potassium ?? ''} /></FormField>
            </div>
            <FormField label="Structure"><input type="text" name="structure" placeholder="e.g. Sandy loam, well-drained" className={inputCls} defaultValue={editItem?.structure ?? ''} /></FormField>
            <FormField label="Notes"><textarea name="notes" placeholder="Additional observations..." rows={3} className={inputCls} defaultValue={editItem?.notes ?? ''} /></FormField>
            <SubmitBtn loading={saving} label={editItem ? 'Update Test' : 'Save Record'} />
          </form>
        </Modal>
      )}

      {deleteItem && (
        <ConfirmModal
          title="Delete Soil Test"
          message={`Remove soil test from ${deleteItem.zone?.name ?? 'All Farm'} on ${new Date(deleteItem.testDate).toLocaleDateString()}?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─── Tab: Land Preparation ───────────────────────────────────────────────────

function LandPrepTab({ zones, users, router }: { zones: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/land-prep')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (!body.performedById) delete body.performedById;
    try {
      await apiFetch('/farm-operations/land-prep', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Land prep activity logged');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const activityColors: Record<string, string> = { PLOWING: 'amber', HARROWING: 'blue', BED_FORMATION: 'emerald', AMENDMENT: 'purple' };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Land Preparation Log</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Shovel} message="No land preparation activities logged" action="Log Activity" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Activity', 'Zone', 'Date', 'Details / Amendments', 'Performed By'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((r) => {
                const clr = activityColors[r.activityType] ?? 'slate';
                return (
                  <tr key={r.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border bg-${clr}-500/10 text-${clr}-400 border-${clr}-500/20`}>
                        {r.activityType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <ZoneChip name={r.zone?.name} onClick={() => router.push('/dashboard/zones')} />
                    </td>
                    <td className="px-6 py-5 text-[11px] font-black text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-[11px] text-slate-400 max-w-xs">
                      {r.details && <p>{r.details}</p>}
                      {r.amendmentsUsed && <p className="text-amber-400/70 mt-0.5">+ {r.amendmentsUsed}</p>}
                    </td>
                    <td className="px-6 py-5 text-[11px] text-slate-400">{r.performedBy?.email?.split('@')[0] ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Land Prep Activity" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Activity Type *">
                <div className="relative">
                  <select name="activityType" required className={selectCls}>
                    <option value="PLOWING" className="bg-slate-900">Plowing</option>
                    <option value="HARROWING" className="bg-slate-900">Harrowing</option>
                    <option value="BED_FORMATION" className="bg-slate-900">Bed Formation</option>
                    <option value="AMENDMENT" className="bg-slate-900">Soil Amendment</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Shovel className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Zone *">
                <div className="relative">
                  <select name="zoneId" required className={selectCls}>
                    <option value="" className="bg-slate-900">Select Zone</option>
                    {zones.map((z) => <option key={z.id} value={z.id} className="bg-slate-900">{z.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><MapPin className="w-4 h-4" /></div>
                </div>
              </FormField>
            </div>
            <FormField label="Date *">
              <div className="relative">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Calendar className="w-4 h-4" /></div>
              </div>
            </FormField>
            <FormField label="Details (bed size, spacing, etc.)">
              <textarea name="details" rows={3} placeholder="Beds raised 20cm, 1.2m wide, 0.5m walkways..." className={inputCls} />
            </FormField>
            <FormField label="Amendments Used">
              <input type="text" name="amendmentsUsed" placeholder="3t/ha compost + 500kg/ha lime" className={inputCls} />
            </FormField>
            <FormField label="Performed By">
              <UserSelect name="performedById" users={users} label="Select Staff Member (optional)" />
            </FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Crop Budget ─────────────────────────────────────────────────────────

function CropBudgetsTab({ cycles, router }: { cycles: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/crop-budgets')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    const cropCycleId = body.cropCycleId;
    delete body.cropCycleId;
    ['laborWorkersReq', 'estimatedLaborCost', 'estimatedInputCost', 'estimatedUtilitiesCost', 'totalBudget'].forEach((k) => {
      if (body[k]) body[k] = Number(body[k]); else delete body[k];
    });
    try {
      await apiFetch(`/farm-operations/crop-budgets/${cropCycleId}/upsert`, { method: 'PUT', body: JSON.stringify(body) });
      toast.success('Crop budget saved');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const totalBudget = data.reduce((s, b) => s + (b.totalBudget ?? 0), 0);
  const totalLabor = data.reduce((s, b) => s + (b.estimatedLaborCost ?? 0), 0);
  const totalInputs = data.reduce((s, b) => s + (b.estimatedInputCost ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Crop Budgets & Planning</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> New Budget
        </button>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <KpiCard icon={DollarSign} label="Total Budgeted" value={`$${totalBudget.toLocaleString()}`} color="emerald" />
          <KpiCard icon={User} label="Total Labour Est." value={`$${totalLabor.toLocaleString()}`} color="blue" />
          <KpiCard icon={BarChart3} label="Total Inputs Est." value={`$${totalInputs.toLocaleString()}`} color="amber" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={DollarSign} message="No crop budgets created yet" action="Create Budget" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((b) => (
            <div key={b.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-5 hover:border-emerald-500/20 transition-all">
              <div>
                <CycleChip
                  variety={b.cropCycle?.variety?.name}
                  zone={b.cropCycle?.zone?.name}
                  onClick={() => router.push('/dashboard/production')}
                />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  {b.cropCycle?.startDate ? new Date(b.cropCycle.startDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Workers Required', value: b.laborWorkersReq ? `${b.laborWorkersReq} workers` : '—', color: 'blue' },
                  { label: 'Labour Cost Est.', value: b.estimatedLaborCost ? `$${b.estimatedLaborCost.toLocaleString()}` : '—', color: 'purple' },
                  { label: 'Input Cost Est.', value: b.estimatedInputCost ? `$${b.estimatedInputCost.toLocaleString()}` : '—', color: 'amber' },
                  { label: 'Utilities Est.', value: b.estimatedUtilitiesCost ? `$${b.estimatedUtilitiesCost.toLocaleString()}` : '—', color: 'slate' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-[11px] font-black text-${item.color}-400`}>{item.value}</span>
                  </div>
                ))}
              </div>
              {b.totalBudget && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Budget</span>
                  <span className="text-xl font-black text-emerald-400">${b.totalBudget.toLocaleString()}</span>
                </div>
              )}
              {b.notes && <p className="text-[11px] text-slate-500">{b.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Create / Update Crop Budget" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <FormField label="Crop Cycle *">
              <div className="relative">
                <select name="cropCycleId" required className={selectCls}>
                  <option value="">Select Crop Cycle</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'} ({new Date(c.startDate).toLocaleDateString()})</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Sprout className="w-4 h-4" /></div>
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Workers Required"><input type="number" name="laborWorkersReq" placeholder="12" className={inputCls} /></FormField>
              <FormField label="Labour Cost Est. ($)"><input type="number" name="estimatedLaborCost" step="0.01" placeholder="5000" className={inputCls} /></FormField>
              <FormField label="Input Cost Est. ($)"><input type="number" name="estimatedInputCost" step="0.01" placeholder="8000" className={inputCls} /></FormField>
              <FormField label="Utilities Est. ($)"><input type="number" name="estimatedUtilitiesCost" step="0.01" placeholder="1200" className={inputCls} /></FormField>
            </div>
            <FormField label="Total Budget ($)">
              <div className="relative">
                <input type="number" name="totalBudget" step="0.01" placeholder="14200" className={inputCls} />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500/50"><DollarSign className="w-4 h-4" /></div>
              </div>
            </FormField>
            <FormField label="Notes"><textarea name="notes" rows={3} placeholder="Budget assumptions or procurement notes..." className={inputCls} /></FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Planting Records ────────────────────────────────────────────────────

function PlantingRecordsTab({ cycles, router }: { cycles: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/planting-records')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    body.totalPlants = Number(body.totalPlants);
    if (body.density) body.density = Number(body.density); else delete body.density;
    const cycleId = body.cropCycleId;
    delete body.cropCycleId;
    try {
      await apiFetch(`/farm-operations/planting-records/${cycleId}/upsert`, { method: 'PUT', body: JSON.stringify(body) });
      toast.success('Planting record saved');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const totalPlants = data.reduce((s, r) => s + (r.totalPlants ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Planting Records</h2>
          {data.length > 0 && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{totalPlants.toLocaleString()} total plants across {data.length} cycle{data.length !== 1 ? 's' : ''}</p>}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Leaf} message="No planting records yet" action="Add Record" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => (
            <div key={r.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <CycleChip variety={r.cropCycle?.variety?.name} zone={r.cropCycle?.zone?.name} onClick={() => router.push('/dashboard/production')} />
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center">
                  <p className="text-xs font-black text-emerald-400">{r.totalPlants.toLocaleString()}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase">Plants</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Planted', value: new Date(r.date).toLocaleDateString() },
                  { label: 'Density', value: r.density ? `${r.density}/m²` : '—' },
                  { label: 'Spacing', value: r.spacing ?? '—' },
                  { label: 'Lot No.', value: r.lotNumber ?? '—' },
                ].map((f) => (
                  <div key={f.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase">{f.label}</p>
                    <p className="text-[11px] font-black text-white mt-1 truncate">{f.value}</p>
                  </div>
                ))}
              </div>
              {r.supplier && <p className="text-[11px] text-slate-400 font-medium truncate">Supplier: {r.supplier}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Planting Record" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <FormField label="Crop Cycle *">
              <div className="relative">
                <select name="cropCycleId" required className={selectCls}>
                  <option value="">Select Crop Cycle</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'} ({new Date(c.startDate).toLocaleDateString()})</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Sprout className="w-4 h-4" /></div>
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Planting Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Total Plants *">
                <input type="number" name="totalPlants" required placeholder="5000" min={1} className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Density (plants/m²)">
                <input type="number" name="density" step="0.1" placeholder="6.5" className={inputCls} />
              </FormField>
              <FormField label="Spacing">
                <input type="text" name="spacing" placeholder="20cm x 20cm" className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Supplier">
                <input type="text" name="supplier" placeholder="Floriculture Kenya Ltd" className={inputCls} />
              </FormField>
              <FormField label="Lot / Batch No.">
                <input type="text" name="lotNumber" placeholder="LOT-2026-001" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Notes"><textarea name="notes" rows={3} className={inputCls} placeholder="Any additional observations..." /></FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Irrigation & Fertigation ───────────────────────────────────────────

function IrrigationTab({ zones, users, router }: { zones: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFertigation, setIsFertigation] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        apiFetch('/farm-operations/irrigation-logs'),
        apiFetch('/farm-operations/irrigation-logs/stats'),
      ]);
      setData(d); setStats(s);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    body.fertigationUsed = isFertigation;
    ['durationMinutes', 'volumeLiters', 'applicationRate'].forEach((k) => {
      if (body[k]) body[k] = Number(body[k]); else delete body[k];
    });
    if (!body.performedById) delete body.performedById;
    if (!body.fertilizerType) delete body.fertilizerType;
    if (!body.npkLevels) delete body.npkLevels;
    try {
      await apiFetch('/farm-operations/irrigation-logs', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Irrigation event logged');
      setShowForm(false);
      setIsFertigation(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const methodColors: Record<string, string> = { DRIP: 'blue', SPRINKLER: 'cyan', MANUAL: 'slate' };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Irrigation & Fertigation Log</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Event
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-6">
          <KpiCard icon={Droplets} label="Total Events" value={stats.count} color="blue" />
          <KpiCard icon={BarChart3} label="Total Volume" value={stats.totalVolumeLiters >= 1000 ? `${(stats.totalVolumeLiters / 1000).toFixed(1)}k L` : `${stats.totalVolumeLiters} L`} color="cyan" />
          <KpiCard icon={FlaskConical} label="Fertigation Events" value={stats.fertigationCount} color="emerald" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Droplets} message="No irrigation events logged" action="Log Event" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Date', 'Zone', 'Method', 'Duration', 'Volume', 'Fertigation', 'NPK', 'By'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((r) => {
                const clr = methodColors[r.method] ?? 'slate';
                return (
                  <tr key={r.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-black text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><ZoneChip name={r.zone?.name} onClick={() => router.push('/dashboard/zones')} /></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border bg-${clr}-500/10 text-${clr}-400 border-${clr}-500/20`}>{r.method}</span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-400">{r.durationMinutes ? `${r.durationMinutes} min` : '—'}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-400">{r.volumeLiters ? `${r.volumeLiters} L` : '—'}</td>
                    <td className="px-6 py-4">
                      {r.fertigationUsed
                        ? <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-black uppercase"><CheckCircle2 className="w-3 h-3" />{r.fertilizerType ?? 'Yes'}</span>
                        : <span className="text-slate-600 text-[9px] font-black uppercase">No</span>}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-amber-400 font-black">{r.npkLevels ?? '—'}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">{r.performedBy?.email?.split('@')[0] ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Irrigation / Fertigation Event" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Zone *">
                <div className="relative">
                  <select name="zoneId" required className={selectCls}>
                    <option value="">Select Zone</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><MapPin className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Method *">
                <div className="relative">
                  <select name="method" required className={selectCls}>
                    <option value="DRIP">Drip</option>
                    <option value="SPRINKLER">Sprinkler</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Droplets className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Duration (min)">
                <input type="number" name="durationMinutes" placeholder="45" className={inputCls} />
              </FormField>
              <FormField label="Volume (L)">
                <input type="number" name="volumeLiters" step="0.1" placeholder="2400" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Performed By">
              <UserSelect name="performedById" users={users} label="Select Staff Member (optional)" />
            </FormField>
            <div
              className="flex items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 group hover:border-emerald-500/20 transition-all cursor-pointer"
              onClick={() => setIsFertigation(!isFertigation)}
            >
              <button
                type="button"
                className={`relative w-12 h-6 rounded-full transition-all ${isFertigation ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isFertigation ? 'left-7' : 'left-1'}`} />
              </button>
              <div>
                <span className="block text-sm font-black text-white">Fertigation Mode</span>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">fertilizer added to water cycle</span>
              </div>
            </div>
            {isFertigation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                <FormField label="Fertilizer Type">
                  <input type="text" name="fertilizerType" placeholder="NPK 20-20-20" className={inputCls} />
                </FormField>
                <FormField label="NPK Levels">
                  <input type="text" name="npkLevels" placeholder="20-20-20" className={inputCls} />
                </FormField>
                <FormField label="Application Rate (L/ha)">
                  <input type="number" name="applicationRate" step="0.1" placeholder="25" className={inputCls} />
                </FormField>
              </div>
            )}
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Scouting Reports ────────────────────────────────────────────────────

function ScoutingTab({ zones, cycles, users, router }: { zones: any[]; cycles: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/scouting-reports')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (!body.cropCycleId) delete body.cropCycleId;
    try {
      await apiFetch('/farm-operations/scouting-reports', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Scouting report filed');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (!body.cropCycleId) delete body.cropCycleId;
    try {
      await apiFetch(`/farm-operations/scouting-reports/${editItem.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast.success('Report updated');
      setEditItem(null);
      await load();
    } catch { toast.error('Failed to update'); } finally { setEditSaving(false); }
  }

  const highSeverity = data.filter((r) => r.severity === 'HIGH').length;
  const medSeverity = data.filter((r) => r.severity === 'MEDIUM').length;
  const resolved = data.filter((r) => r.actionTaken).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Pest & Disease Scouting</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> File Report
        </button>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-4 gap-6">
          <KpiCard icon={AlertTriangle} label="High Severity" value={highSeverity} color="rose" />
          <KpiCard icon={AlertTriangle} label="Medium Severity" value={medSeverity} color="amber" />
          <KpiCard icon={CheckCircle2} label="Action Taken" value={resolved} color="emerald" />
          <KpiCard icon={Microscope} label="Total Reports" value={data.length} color="blue" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Microscope} message="No scouting reports filed" action="File Report" onAction={() => setShowForm(true)} />
      ) : (
        <div className="space-y-4">
          {data.map((r) => {
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className={`bg-black/30 border rounded-3xl transition-all ${r.severity === 'HIGH' ? 'border-rose-500/20 hover:border-rose-500/40' : r.severity === 'MEDIUM' ? 'border-amber-500/20 hover:border-amber-500/30' : 'border-white/5 hover:border-white/10'}`}>
                {/* Card Header — always visible */}
                <div
                  className="flex items-start justify-between p-6 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <SeverityBadge value={r.severity} />
                      <span className="text-sm font-black text-white">{r.pestDiseaseName ?? 'General Scouting'}</span>
                      {r.actionTaken && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Action Logged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase flex-wrap">
                      <span
                        className="flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/zones'); }}
                      >
                        <MapPin className="w-3 h-3" />{r.zone?.name ?? '—'}
                      </span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.inspector?.email?.split('@')[0] ?? '—'}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{r.observations}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditItem(r); }}
                      className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Observations</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{r.observations}</p>
                    </div>
                    {r.cropCycle && (
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Linked Crop Cycle</p>
                        <span
                          onClick={() => router.push('/dashboard/production')}
                          className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors"
                        >
                          <Sprout className="w-3.5 h-3.5" />
                          {r.cropCycle?.variety?.name} — {r.cropCycle?.zone?.name ?? '?'}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </span>
                      </div>
                    )}
                    {r.actionTaken ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Action Taken</p>
                        <p className="text-sm text-slate-300">{r.actionTaken}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">No action recorded — edit to add response</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="File Scouting Report" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Zone *">
                <div className="relative">
                  <select name="zoneId" required className={selectCls}>
                    <option value="">Select Zone</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><MapPin className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Crop Cycle (optional)">
                <div className="relative">
                  <select name="cropCycleId" className={selectCls}>
                    <option value="">Not Specified</option>
                    {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Leaf className="w-4 h-4" /></div>
                </div>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Date *">
                <div className="relative">
                  <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Calendar className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Inspector *">
                <UserSelect name="inspectorId" required users={users} label="Select Inspector" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Pest / Disease Name">
                <input type="text" name="pestDiseaseName" placeholder="Gray Mold (Botrytis)" className={inputCls} />
              </FormField>
              <FormField label="Severity *">
                <div className="relative">
                  <select name="severity" required className={selectCls}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><AlertTriangle className="w-4 h-4" /></div>
                </div>
              </FormField>
            </div>
            <FormField label="Observations *">
              <textarea name="observations" required rows={3} placeholder="Describe what was observed in the field..." className={inputCls} />
            </FormField>
            <FormField label="Action Taken">
              <textarea name="actionTaken" rows={2} placeholder="Applied Amistar 250SC at 1L/ha..." className={inputCls} />
            </FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}

      {editItem && (
        <Modal title="Update Scouting Report" onClose={() => setEditItem(null)}>
          <form onSubmit={submitEdit} className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Updating report for</p>
              <p className="text-sm font-black text-white mt-1">{editItem.pestDiseaseName ?? 'General Scouting'} · {editItem.zone?.name} · {new Date(editItem.date).toLocaleDateString()}</p>
            </div>
            <FormField label="Severity">
              <div className="relative">
                <select name="severity" required className={selectCls} defaultValue={editItem.severity}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><AlertTriangle className="w-4 h-4" /></div>
              </div>
            </FormField>
            <FormField label="Observations *">
              <textarea name="observations" required rows={3} className={inputCls} defaultValue={editItem.observations} />
            </FormField>
            <FormField label="Action Taken">
              <textarea name="actionTaken" rows={3} placeholder="Describe the response action taken..." className={inputCls} defaultValue={editItem.actionTaken ?? ''} />
            </FormField>
            <SubmitBtn loading={editSaving} label="Update Report" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Crop Performance ────────────────────────────────────────────────────

function CropPerformanceTab({ cycles, users, router }: { cycles: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/crop-performance')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (body.healthScore) body.healthScore = Number(body.healthScore); else delete body.healthScore;
    body.budFormation = (e.currentTarget.querySelector('#budFormation') as HTMLInputElement)?.checked ?? false;
    if (!body.growthRate) delete body.growthRate;
    try {
      await apiFetch('/farm-operations/crop-performance', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Performance log saved');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const growthColors: Record<string, string> = { SLOW: 'rose', NORMAL: 'blue', FAST: 'emerald' };
  const avgHealth = data.filter(r => r.healthScore != null).length
    ? (data.filter(r => r.healthScore != null).reduce((s, r) => s + r.healthScore, 0) / data.filter(r => r.healthScore != null).length).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Crop Performance Logs</h2>
          {avgHealth && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Avg health score: {avgHealth}/10 across {data.length} observation{data.length !== 1 ? 's' : ''}</p>}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Observation
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={TrendingUp} message="No performance logs recorded" action="Log Observation" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => {
            const clr = growthColors[r.growthRate as string] ?? 'slate';
            return (
              <div key={r.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <CycleChip variety={r.cropCycle?.variety?.name} zone={r.cropCycle?.zone?.name} onClick={() => router.push('/dashboard/production')} />
                  <span className="text-[10px] font-black text-slate-500">{new Date(r.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {r.growthRate && (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border bg-${clr}-500/10 text-${clr}-400 border-${clr}-500/20`}>
                      {r.growthRate} Growth
                    </span>
                  )}
                  {r.budFormation && (
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                      <Leaf className="w-3 h-3" /> Buds Forming
                    </span>
                  )}
                </div>
                {r.healthScore != null && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Health Score</p>
                      <p className="text-[10px] font-black text-white">{r.healthScore}/10</p>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.healthScore >= 7 ? 'bg-emerald-500' : r.healthScore >= 4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${r.healthScore * 10}%` }}
                      />
                    </div>
                  </div>
                )}
                {r.observations && <p className="text-[11px] text-slate-400 leading-relaxed">{r.observations}</p>}
                <p className="text-[9px] font-black text-slate-600 uppercase">By: {r.recordedBy?.email?.split('@')[0] ?? '—'}</p>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Log Crop Performance" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <FormField label="Crop Cycle *">
              <div className="relative">
                <select name="cropCycleId" required className={selectCls}>
                  <option value="">Select Crop Cycle</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Leaf className="w-4 h-4" /></div>
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Recorded By *">
                <UserSelect name="recordedById" required users={users} label="Select Staff Member" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Growth Rate">
                <div className="relative">
                  <select name="growthRate" className={selectCls}>
                    <option value="">Not Recorded</option>
                    <option value="SLOW">Slow</option>
                    <option value="NORMAL">Normal</option>
                    <option value="FAST">Fast</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><TrendingUp className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Health Score (1—10)">
                <input type="number" name="healthScore" min={1} max={10} placeholder="8" className={inputCls} />
              </FormField>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:border-emerald-500/20 transition-all cursor-pointer">
              <input type="checkbox" id="budFormation" name="budFormation" className="rounded-lg accent-emerald-500 w-5 h-5 cursor-pointer" />
              <label htmlFor="budFormation" className="text-sm font-black text-white cursor-pointer select-none">Bud Formation Observed</label>
            </div>
            <FormField label="Observations">
              <textarea name="observations" rows={3} placeholder="Describe this week's growth progress..." className={inputCls} />
            </FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Pre-Harvest Quality ─────────────────────────────────────────────────

function PreHarvestTab({ cycles, users, router }: { cycles: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch('/farm-operations/pre-harvest')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (body.budSizeMm) body.budSizeMm = Number(body.budSizeMm); else delete body.budSizeMm;
    if (body.stemLengthCm) body.stemLengthCm = Number(body.stemLengthCm); else delete body.stemLengthCm;
    if (!body.budStage) delete body.budStage;
    if (!body.stemStrength) delete body.stemStrength;
    if (!body.colorDev) delete body.colorDev;
    try {
      await apiFetch('/farm-operations/pre-harvest', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Pre-harvest log saved');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const readyToHarvest = data.filter(r => r.budStage === 'SHOWING_COLOR' || r.budStage === 'OPENING').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Pre-Harvest Quality Checks</h2>
          {readyToHarvest > 0 && (
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {readyToHarvest} batch{readyToHarvest !== 1 ? 'es' : ''} approaching harvest readiness
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Check
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Eye} message="No pre-harvest quality logs yet" action="Log Check" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => (
            <div key={r.id} className={`bg-black/30 border rounded-3xl p-6 space-y-4 transition-all ${r.budStage === 'OPENING' ? 'border-emerald-500/30 hover:border-emerald-500/50' : r.budStage === 'SHOWING_COLOR' ? 'border-amber-500/20' : 'border-white/5 hover:border-amber-500/20'}`}>
              <div className="flex items-center justify-between">
                <CycleChip variety={r.cropCycle?.variety?.name} zone={r.cropCycle?.zone?.name} onClick={() => router.push('/dashboard/production')} />
                <span className="text-[10px] font-black text-slate-500">{new Date(r.date).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Bud Stage</p>
                  <p className="text-[10px] font-black text-amber-400 mt-1">{r.budStage?.replace(/_/g, ' ') ?? '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Bud Size</p>
                  <p className="text-[10px] font-black text-white mt-1">{r.budSizeMm ? `${r.budSizeMm}mm` : '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Stem</p>
                  <p className="text-[10px] font-black text-white mt-1">{r.stemLengthCm ? `${r.stemLengthCm}cm` : '—'}</p>
                </div>
              </div>
              {r.stemStrength && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${r.stemStrength === 'STRONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : r.stemStrength === 'WEAK' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {r.stemStrength} Stem
                  </span>
                  {r.colorDev && <span className="text-[10px] font-black text-slate-400">{r.colorDev}</span>}
                </div>
              )}
              <p className="text-[9px] font-black text-slate-600 uppercase">Inspector: {r.inspector?.email?.split('@')[0] ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Log Pre-Harvest Quality Check" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <FormField label="Crop Cycle *">
              <div className="relative">
                <select name="cropCycleId" required className={selectCls}>
                  <option value="">Select Crop Cycle</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Leaf className="w-4 h-4" /></div>
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Inspector *">
                <UserSelect name="inspectorId" required users={users} label="Select Inspector" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Bud Stage">
                <div className="relative">
                  <select name="budStage" className={selectCls}>
                    <option value="">—</option>
                    <option value="PEA_SIZE">Pea Size</option>
                    <option value="SHOWING_COLOR">Showing Color</option>
                    <option value="OPENING">Opening</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Eye className="w-4 h-4" /></div>
                </div>
              </FormField>
              <FormField label="Bud Size (mm)">
                <input type="number" name="budSizeMm" step="0.1" placeholder="25" className={inputCls} />
              </FormField>
              <FormField label="Stem Length (cm)">
                <input type="number" name="stemLengthCm" step="0.5" placeholder="65" className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Stem Strength">
                <select name="stemStrength" className={selectCls}>
                  <option value="">—</option>
                  <option value="WEAK">Weak</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="STRONG">Strong</option>
                </select>
              </FormField>
              <FormField label="Color Development">
                <input type="text" name="colorDev" placeholder="Deep red, uniform" className={inputCls} />
              </FormField>
            </div>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Harvest Records ─────────────────────────────────────────────────────

function HarvestRecordsTab({ cycles, users, router }: { cycles: any[]; users: any[]; router: ReturnType<typeof useRouter> }) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        apiFetch('/farm-operations/harvest-records'),
        apiFetch('/farm-operations/harvest-records/summary'),
      ]);
      setData(d); setSummary(s);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    body.quantityStems = Number(body.quantityStems);
    if (body.weightKg) body.weightKg = Number(body.weightKg); else delete body.weightKg;
    if (body.rejectedStems) body.rejectedStems = Number(body.rejectedStems); else delete body.rejectedStems;
    try {
      await apiFetch('/farm-operations/harvest-records', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Harvest record logged');
      setShowForm(false);
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const rejectionRate = summary && summary.totalStems > 0
    ? ((summary.totalRejected / summary.totalStems) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Harvest Records</h2>
          {rejectionRate && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Rejection rate: <span className={Number(rejectionRate) > 5 ? 'text-rose-400' : 'text-emerald-400'}>{rejectionRate}%</span></p>}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Harvest
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-6">
          <KpiCard icon={Scissors} label="Total Harvests" value={summary.count} color="emerald" />
          <KpiCard icon={BarChart3} label="Total Stems" value={summary.totalStems?.toLocaleString() ?? 0} color="blue" />
          <KpiCard icon={BarChart3} label="Total Weight" value={`${(summary.totalWeightKg ?? 0).toFixed(1)} kg`} color="amber" />
          <KpiCard icon={AlertTriangle} label="Rejected" value={`${summary.totalRejected?.toLocaleString() ?? 0}${rejectionRate ? ` (${rejectionRate}%)` : ''}`} color="rose" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Scissors} message="No harvest records yet" action="Log Harvest" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Variety / Zone', 'Date', 'Stems Cut', 'Weight', 'Rejected', 'Supervisor', 'Notes'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <CycleChip variety={r.cropCycle?.variety?.name} zone={r.cropCycle?.zone?.name} onClick={() => router.push('/dashboard/production')} />
                  </td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-black text-emerald-400">{r.quantityStems.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-400">{r.weightKg ? `${r.weightKg} kg` : '—'}</td>
                  <td className="px-6 py-4">
                    {r.rejectedStems ? <span className="text-rose-400 font-black text-sm">{r.rejectedStems}</span> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-400">{r.supervisor?.email?.split('@')[0] ?? '—'}</td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 max-w-xs truncate">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Harvest Record" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-6">
            <FormField label="Crop Cycle *">
              <div className="relative">
                <select name="cropCycleId" required className={selectCls}>
                  <option value="">Select Crop Cycle</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Leaf className="w-4 h-4" /></div>
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Harvest Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Supervisor *">
                <UserSelect name="supervisorId" required users={users} label="Select Supervisor" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Stems Cut *">
                <input type="number" name="quantityStems" required placeholder="2500" min={1} className={inputCls} />
              </FormField>
              <FormField label="Weight (kg)">
                <input type="number" name="weightKg" step="0.1" placeholder="312.5" className={inputCls} />
              </FormField>
              <FormField label="Rejected Stems">
                <input type="number" name="rejectedStems" placeholder="45" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Notes"><textarea name="notes" rows={3} placeholder="Any harvest observations..." className={inputCls} /></FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'soil' | 'land-prep' | 'budget' | 'planting' | 'irrigation' | 'scouting' | 'performance' | 'pre-harvest' | 'harvest';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'soil', label: 'Soil Tests', icon: FlaskConical },
  { id: 'land-prep', label: 'Land Prep', icon: Shovel },
  { id: 'budget', label: 'Budgets', icon: DollarSign },
  { id: 'planting', label: 'Planting', icon: Sprout },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'scouting', label: 'Scouting', icon: Microscope },
  { id: 'performance', label: 'Crop Growth', icon: TrendingUp },
  { id: 'pre-harvest', label: 'Pre-Harvest', icon: Eye },
  { id: 'harvest', label: 'Harvest', icon: Scissors },
];

export default function OperationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('soil');
  const [zones, setZones] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highAlerts, setHighAlerts] = useState(0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [z, c, u, scouting] = await Promise.all([
          apiFetch('/zones'),
          apiFetch('/crop-cycles'),
          apiFetch('/team'),
          apiFetch('/farm-operations/scouting-reports').catch(() => []),
        ]);
        setZones(z);
        setCycles(c);
        setUsers(u);
        setHighAlerts((scouting as any[]).filter((r: any) => r.severity === 'HIGH').length);
      } catch { toast.error('Failed to load farm data'); }
      setLoading(false);
    }
    init();
  }, []);

  const activeCycles = cycles.filter((c) => c.status === 'GROWING').length;
  const harvestingCycles = cycles.filter((c) => c.status === 'HARVESTING').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Farm Operations</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            End-to-end field management — from soil analysis to final harvest record.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick nav links */}
          <button
            onClick={() => router.push('/dashboard/production')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
          >
            <Sprout className="w-3.5 h-3.5" /> Production <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <button
            onClick={() => router.push('/dashboard/zones')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" /> Zones <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Pest Alert Banner */}
      {!loading && (
        <AlertBanner count={highAlerts} onView={() => setTab('scouting')} />
      )}

      {/* Page-Level KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={Activity} label="Active Cycles" value={activeCycles} color="emerald" sub="currently growing" />
          <KpiCard icon={Scissors} label="Harvesting Now" value={harvestingCycles} color="amber" sub="ready for cut" />
          <KpiCard icon={MapPin} label="Farm Zones" value={zones.length} color="blue" sub="total managed" />
          {highAlerts > 0 ? (
            <div
              onClick={() => setTab('scouting')}
              className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-3xl relative overflow-hidden cursor-pointer hover:border-rose-500/50 transition-all group"
            >
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full group-hover:bg-rose-500/20 transition-all" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Pest Alerts</p>
                  <p className="text-xl font-black text-rose-300">{highAlerts} High</p>
                </div>
              </div>
            </div>
          ) : (
            <KpiCard icon={CheckCircle2} label="Pest Alerts" value="All Clear" color="emerald" sub="no high severity" />
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Card */}
      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 text-emerald-500 animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Loading Farm Data...</span>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {tab === 'soil' && <SoilTestsTab zones={zones} router={router} />}
            {tab === 'land-prep' && <LandPrepTab zones={zones} users={users} router={router} />}
            {tab === 'budget' && <CropBudgetsTab cycles={cycles} router={router} />}
            {tab === 'planting' && <PlantingRecordsTab cycles={cycles} router={router} />}
            {tab === 'irrigation' && <IrrigationTab zones={zones} users={users} router={router} />}
            {tab === 'scouting' && <ScoutingTab zones={zones} cycles={cycles} users={users} router={router} />}
            {tab === 'performance' && <CropPerformanceTab cycles={cycles} users={users} router={router} />}
            {tab === 'pre-harvest' && <PreHarvestTab cycles={cycles} users={users} router={router} />}
            {tab === 'harvest' && <HarvestRecordsTab cycles={cycles} users={users} router={router} />}
          </div>
        </div>
      )}
    </div>
  );
}
