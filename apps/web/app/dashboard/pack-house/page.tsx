/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Loader2, ArrowRight, ClipboardCheck,
  TrendingUp, XCircle, CheckCircle2, AlertTriangle, Search,
  Scissors, Boxes, QrCode, BarChart3, Thermometer,
  Truck, X, Save, Scan, Star, ExternalLink,
  Activity, ChevronRight, Layers, Filter,
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

// ─── Shared ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, sub, onClick }: { icon: any; label: string; value: string | number; color: string; sub?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-white/10' : ''} transition-all`}
    >
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
        <button onClick={onAction} className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> {action}
        </button>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-brand-dark/80 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/2">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pack House Entry Portal</p>
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-emerald-400 transition-colors block px-1">{label}</label>
      <div className="relative">{children}</div>
    </div>
  );
}

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all hover:bg-white/[0.05]";
const selectCls = "w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all appearance-none cursor-pointer";

function SubmitBtn({ loading, label = 'Save' }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading} className="group relative w-full flex items-center justify-center gap-3 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] mt-6 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      <span className="uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    QC_PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    GRADED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PACKED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    DISPATCHED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${map[status] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ count, onView }: { count: number; onView: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-3xl px-8 py-5 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-300">{count} Batch{count > 1 ? 'es' : ''} Awaiting QC Grading</p>
          <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Grading must be completed before packing</p>
        </div>
      </div>
      <button
        onClick={onView}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shrink-0"
      >
        Grade Now <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ batches, router }: { batches: any[]; router: ReturnType<typeof useRouter> }) {
  const recent = batches.slice(0, 20);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Recent Batches</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            {batches.length} total batch{batches.length !== 1 ? 'es' : ''} · {batches.filter(b => b.status === 'QC_PENDING').length} pending grading
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/operations')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
        >
          <Scissors className="w-3.5 h-3.5" /> View Harvests <ExternalLink className="w-3 h-3 opacity-50" />
        </button>
      </div>

      {recent.length === 0 ? (
        <EmptyState icon={Package} message="No batches yet — run an intake to start" />
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {['Batch ID', 'Variety', 'Intake Qty', 'Status', 'Date', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.map((batch) => (
                <tr key={batch.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-5 font-black text-white text-sm tracking-tighter">{batch.batchNumber}</td>
                  <td className="px-6 py-5 text-slate-300 font-bold text-xs uppercase">{batch.variety?.name ?? '—'}</td>
                  <td className="px-6 py-5 text-slate-400 font-bold text-xs">{batch.quantityIntake?.toLocaleString()} stems</td>
                  <td className="px-6 py-5"><StatusBadge status={batch.status} /></td>
                  <td className="px-6 py-5 text-[11px] font-black text-slate-500">{new Date(batch.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    {batch.status === 'QC_PENDING' && (
                      <button
                        onClick={() => router.push(`/dashboard/pack-house/grading/${batch.id}`)}
                        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-[10px] font-black uppercase tracking-widest"
                      >
                        Grade <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {batch.status === 'GRADED' && (
                      <span className="text-[10px] font-black text-blue-400 uppercase">Ready to Pack</span>
                    )}
                    {batch.status === 'REJECTED' && (
                      <span className="text-[10px] font-black text-rose-400 uppercase">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Intake ──────────────────────────────────────────────────────────────

function IntakeTab({ cycles, onIntakeComplete }: { cycles: any[]; onIntakeComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ cropCycleId: '', quantity: '' as any, notes: '', temperature: '' });
  const [lastBatch, setLastBatch] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.cropCycleId || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { cropCycleId: formData.cropCycleId, quantity: Number(formData.quantity) };
      if (formData.notes) body.notes = formData.notes;
      const result = await apiFetch('/pack-house/intake', { method: 'POST', body: JSON.stringify(body) });
      setLastBatch(result);
      toast.success(`Batch ${result?.batchNumber ?? ''} logged successfully`);
      setFormData({ cropCycleId: '', quantity: '', notes: '', temperature: '' });
      onIntakeComplete();
    } catch { toast.error('Failed to record intake'); } finally { setSubmitting(false); }
  }

  const activeCycles = cycles.filter(c => ['GROWING', 'HARVESTING', 'PLANTED'].includes(c.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Flower Intake</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Record batch arrival from the field · QR scan simulation</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
          <Scan className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{activeCycles.length} Active Cycles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-black/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Scan className="w-32 h-32 text-emerald-500" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <FormField label="Crop Cycle (QR Scan Simulation) *">
                <div className="relative">
                  <select
                    className={selectCls}
                    value={formData.cropCycleId}
                    onChange={(e) => setFormData({ ...formData, cropCycleId: e.target.value })}
                    required
                  >
                    <option value="">— Select Active Cycle —</option>
                    {activeCycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.variety?.name} — {c.zone?.name ?? 'GENERIC'} ({new Date(c.startDate).toLocaleDateString()}) · {c.status}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Scan className="w-4 h-4" /></div>
                </div>
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Intake Quantity (Stems) *">
                  <input
                    type="number" min={1} placeholder="e.g. 2500" required
                    className={inputCls}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </FormField>
                <FormField label="Arrival Temperature (°C)">
                  <div className="relative">
                    <input
                      type="number" step="0.1" placeholder="e.g. 8.5"
                      className={inputCls}
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Thermometer className="w-4 h-4" /></div>
                  </div>
                </FormField>
              </div>
              <FormField label="Notes / Batch Observations">
                <textarea
                  placeholder="Field conditions, handling notes, etc..."
                  rows={3} className={inputCls}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FormField>
              <SubmitBtn loading={submitting} label="Record Intake" />
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {lastBatch && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Batch Logged!</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Now pending QC</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-500">Batch ID</span>
                  <span className="text-white">{lastBatch.batchNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-500">Status</span>
                  <span className="text-amber-400">QC Pending</span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-3">
              <Package className="w-4 h-4" /> Pack House Protocol
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px] font-medium leading-relaxed">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />Tag all batches with generated Batch ID immediately after intake</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />Transfer to pre-cooling zone within 15 minutes</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />Record arrival temperature — flag if above 12°C</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: QC Grading ─────────────────────────────────────────────────────────

function GradingTab({ batches, router }: { batches: any[]; router: ReturnType<typeof useRouter> }) {
  const pending = batches.filter((b) => b.status === 'QC_PENDING');
  const graded = batches.filter((b) => b.status === 'GRADED');
  const rejected = batches.filter((b) => b.status === 'REJECTED');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">QC Grading Queue</h2>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${pending.length > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {pending.length > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {pending.length} Pending
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <KpiCard icon={ClipboardCheck} label="Awaiting QC" value={pending.length} color="amber" />
        <KpiCard icon={Star} label="Graded (Ready)" value={graded.length} color="blue" />
        <KpiCard icon={XCircle} label="Rejected" value={rejected.length} color="rose" />
      </div>

      {pending.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending QC — Click to begin grading</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((batch) => (
              <div
                key={batch.id}
                className="bg-black/30 border border-amber-500/20 rounded-3xl p-6 space-y-4 hover:border-amber-500/40 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/pack-house/grading/${batch.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-black text-white">{batch.batchNumber}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{batch.variety?.name ?? '—'}</p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Intake Qty</p>
                    <p className="text-sm font-black text-white mt-1">{batch.quantityIntake?.toLocaleString()} stems</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Received</p>
                    <p className="text-sm font-black text-white mt-1">{new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest group-hover:bg-amber-400 transition-all">
                  <ClipboardCheck className="w-4 h-4" /> Begin QC Grading
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} message="All batches have been graded" />
      )}

      {graded.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graded & Ready to Pack</p>
          <div className="bg-black/30 border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  {['Batch', 'Variety', 'Qty', 'Grade', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {graded.map((batch) => (
                  <tr key={batch.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-black text-white text-sm">{batch.batchNumber}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs uppercase font-bold">{batch.variety?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-400">{batch.quantityIntake?.toLocaleString()} stems</td>
                    <td className="px-6 py-4">
                      {batch.qcLogs?.[0]?.assignedGrade ? (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${batch.qcLogs[0].assignedGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : batch.qcLogs[0].assignedGrade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          GRADE {batch.qcLogs[0].assignedGrade}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">{new Date(batch.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Inventory ───────────────────────────────────────────────────────────

function InventoryTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setInventory(await apiFetch('/pack-house/inventory')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return inventory.filter((i) => {
      const matchName = !search || i.variety?.name?.toLowerCase().includes(search.toLowerCase());
      const matchGrade = !gradeFilter || i.grade === gradeFilter;
      return matchName && matchGrade;
    });
  }, [inventory, search, gradeFilter]);

  const totalStems = inventory.reduce((s, i) => s + i.quantity, 0);
  const gradeA = inventory.filter((i) => i.grade === 'A').reduce((s, i) => s + i.quantity, 0);
  const lowStock = inventory.filter((i) => i.quantity < 500).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Flower Inventory (ATP)</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Available-to-Promise stock by variety and grade</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/sales')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all"
        >
          <Truck className="w-3.5 h-3.5" /> Sales <ExternalLink className="w-3 h-3 opacity-50" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <KpiCard icon={Boxes} label="Total Graded Stems" value={totalStems.toLocaleString()} color="emerald" />
        <KpiCard icon={Star} label="Grade A Stock" value={gradeA.toLocaleString()} color="blue" />
        <KpiCard icon={AlertTriangle} label="Low Stock Alerts" value={lowStock} color="amber" sub="< 500 stems" />
      </div>

      <div className="bg-black/30 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" placeholder="Search variety..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} pl-12`}
            />
          </div>
          <div className="relative w-40">
            <select
              className={selectCls}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Filter className="w-3.5 h-3.5" /></div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Boxes} message="No inventory matches your filters" />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['Variety', 'Grade', 'Stock Level', 'Last Updated'].map((h) => (
                  <th key={h} className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-5 font-black text-white text-sm uppercase italic">{item.variety?.name ?? '—'}</td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${item.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      GRADE {item.grade}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-white font-black text-base tracking-tighter">{item.quantity.toLocaleString()} stems</p>
                    <div className="w-48 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${item.quantity < 500 ? 'bg-amber-500' : item.quantity < 2000 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (item.quantity / 5000) * 100)}%` }}
                      />
                    </div>
                    {item.quantity < 500 && <p className="text-[9px] font-black text-amber-400 uppercase mt-1">Low Stock</p>}
                  </td>
                  <td className="px-4 py-5 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Packing Station ─────────────────────────────────────────────────────

function PackingTab({ batches, router }: { batches: any[]; router: ReturnType<typeof useRouter> }) {
  const gradedBatches = batches.filter((b) => b.status === 'GRADED');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [bunchSize, setBunchSize] = useState(10);
  const [bunchesPerBox, setBunchesPerBox] = useState(20);
  const [grade, setGrade] = useState('A');
  const [isPacking, setIsPacking] = useState(false);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [lastBoxId, setLastBoxId] = useState<string | null>(null);

  const totalStems = bunchSize * bunchesPerBox;
  const selectedBatch = gradedBatches.find((b) => b.id === selectedBatchId);

  async function handlePack() {
    if (!selectedBatchId) { toast.error('Select a batch first'); return; }
    if (totalStems <= 0) { toast.error('Configure valid bunch size and bunches per box'); return; }
    setIsPacking(true);
    setLastLabel(null);
    try {
      const box = await apiFetch('/packing/pack', {
        method: 'POST',
        body: JSON.stringify({ batchId: selectedBatchId, varietyId: selectedBatch?.varietyId, grade, bunchSize, bunchesPerBox }),
      });
      setLastBoxId(box.boxId);
      if (box.labelUrl) setLastLabel(box.labelUrl);
      toast.success(`Box ${box.boxId ?? ''} packed & label generated`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to pack box');
    } finally { setIsPacking(false); }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">Packing Station</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configure box sizes · Generate tracking labels · Move to dispatch</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/logistics')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-all"
        >
          <Truck className="w-3.5 h-3.5" /> Logistics <ExternalLink className="w-3 h-3 opacity-50" />
        </button>
      </div>

      {gradedBatches.length === 0 ? (
        <EmptyState icon={Package} message="No graded batches available to pack — complete QC grading first" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Config */}
          <div className="lg:col-span-7 space-y-6">
            {/* Batch selection */}
            <div className="bg-black/30 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Batch Selection</h3>
              </div>
              <FormField label="Select Graded Batch *">
                <div className="relative">
                  <select className={selectCls} value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
                    <option value="">— Choose a batch —</option>
                    {gradedBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNumber} — {b.variety?.name ?? '?'} ({b.quantityIntake?.toLocaleString()} stems)</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Package className="w-4 h-4" /></div>
                </div>
              </FormField>
              {selectedBatch && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Variety</p>
                    <p className="text-sm font-black text-white mt-1">{selectedBatch.variety?.name}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Intake</p>
                    <p className="text-sm font-black text-emerald-400 mt-1">{selectedBatch.quantityIntake?.toLocaleString()} stems</p>
                  </div>
                </div>
              )}
              <FormField label="Grade Being Packed">
                <div className="relative">
                  <select className={selectCls} value={grade} onChange={(e) => setGrade(e.target.value)}>
                    <option value="A">Grade A — Premium</option>
                    <option value="B">Grade B — Standard</option>
                    <option value="C">Grade C — Bulk</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Star className="w-4 h-4" /></div>
                </div>
              </FormField>
            </div>

            {/* Box configuration */}
            <div className="bg-black/30 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Box Configuration</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Bunch Size (Stems)">
                  <input type="number" min={1} className={inputCls} value={bunchSize} onChange={(e) => setBunchSize(Number(e.target.value) || 0)} />
                </FormField>
                <FormField label="Bunches per Box">
                  <input type="number" min={1} className={inputCls} value={bunchesPerBox} onChange={(e) => setBunchesPerBox(Number(e.target.value) || 0)} />
                </FormField>
              </div>
              <div className="border-t border-white/5 pt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Stems per Box</p>
                  <p className="text-xs text-slate-600 mt-0.5">Auto-calculated</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-emerald-400">{totalStems}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase bg-white/5 border border-white/5 px-2 py-1 rounded-lg">Stems</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-linear-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full -mr-12 -mt-12 pointer-events-none" />
              <h3 className="text-xl font-black text-white relative z-10">Finalize Packing</h3>
              <p className="text-slate-300 font-medium text-sm leading-relaxed relative z-10">
                Confirming this action logs packed items into finished goods inventory and generates a unique tracking QR label.
              </p>
              <button
                onClick={handlePack}
                disabled={isPacking || !selectedBatchId || totalStems <= 0}
                className="relative z-10 w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-3 group"
              >
                {isPacking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                {isPacking ? 'Processing...' : 'Pack & Generate Label'}
              </button>
            </div>

            {(lastLabel || lastBoxId) && (
              <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/30">
                    <QrCode className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-white">Label Ready!</p>
                    {lastBoxId && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Box: {lastBoxId}</p>}
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">Attach label to physical unit immediately after printing.</p>
                  </div>
                  {lastLabel && (
                    <a href={lastLabel} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 border border-white/10 rounded-2xl text-white font-bold text-sm text-center hover:bg-white/10 transition-all">
                      View Label PDF
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">After Packing</h4>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/cold-room')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-blue-500/20 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Cold Room Check</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
                <button
                  onClick={() => router.push('/dashboard/logistics')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-purple-500/20 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Schedule Dispatch</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'intake' | 'grading' | 'inventory' | 'packing';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'intake', label: 'Intake', icon: Scan },
  { id: 'grading', label: 'QC Grading', icon: ClipboardCheck },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'packing', label: 'Packing', icon: Package },
];

export default function PackHousePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('overview');
  const [batches, setBatches] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, inv, c] = await Promise.all([
        apiFetch('/pack-house/batches'),
        apiFetch('/pack-house/inventory'),
        apiFetch('/crop-cycles'),
      ]);
      setBatches(b);
      setInventory(inv);
      setCycles(c);
    } catch (e: unknown) { toast.error((e as Error).message); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendingQC = batches.filter((b) => b.status === 'QC_PENDING').length;
  const gradedCount = batches.filter((b) => b.status === 'GRADED').length;
  const totalStock = inventory.reduce((s, i) => s + i.quantity, 0);
  const todayIntake = batches.filter((b) => new Date(b.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Pack House & Cold Chain</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Post-harvest intake · QC grading · packing · dispatch readiness</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push('/dashboard/operations')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
            <Scissors className="w-3.5 h-3.5" /> Operations <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <button onClick={() => router.push('/dashboard/cold-room')} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all">
            <Thermometer className="w-3.5 h-3.5" /> Cold Room <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <button onClick={() => router.push('/dashboard/logistics')} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-all">
            <Truck className="w-3.5 h-3.5" /> Logistics <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </header>

      {/* QC Alert Banner */}
      {!loading && (
        <AlertBanner count={pendingQC} onView={() => setTab('grading')} />
      )}

      {/* KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={Activity} label="Today's Intake" value={todayIntake} color="emerald" sub="batches received" onClick={() => setTab('intake')} />
          <KpiCard icon={ClipboardCheck} label="Pending QC" value={pendingQC} color="amber" sub="awaiting grading" onClick={() => setTab('grading')} />
          <KpiCard icon={Package} label="Ready to Pack" value={gradedCount} color="blue" sub="graded batches" onClick={() => setTab('packing')} />
          <KpiCard icon={TrendingUp} label="Total Stock" value={totalStock.toLocaleString()} color="purple" sub="stems in inventory" onClick={() => setTab('inventory')} />
        </div>
      )}

      {/* Tab Navigation */}
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
            {t.id === 'grading' && pendingQC > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">{pendingQC}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 text-emerald-500 animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Loading Pack House Data...</span>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {tab === 'overview' && <OverviewTab batches={batches} router={router} />}
            {tab === 'intake' && <IntakeTab cycles={cycles} onIntakeComplete={fetchData} />}
            {tab === 'grading' && <GradingTab batches={batches} router={router} />}
            {tab === 'inventory' && <InventoryTab router={router} />}
            {tab === 'packing' && <PackingTab batches={batches} router={router} />}
          </div>
        </div>
      )}
    </div>
  );
}
