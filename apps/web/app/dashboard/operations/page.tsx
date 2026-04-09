/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Sprout, Plus, Loader2, Droplets, FlaskConical,
  Shovel, Leaf, Microscope, TrendingUp, Eye, Scissors,
  AlertTriangle, CheckCircle2, BarChart3, Calendar,
  MapPin, User, X, Save, DollarSign,
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

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
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
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4 text-slate-600">
      <Icon className="w-14 h-14 opacity-20" />
      <p className="text-[11px] font-black uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all";
const selectCls = "w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all";

function SubmitBtn({ loading, label = 'Save Record' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] mt-4"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      {label}
    </button>
  );
}

function UserSelect({ name, required, users, label }: { name: string; required?: boolean; users: any[]; label?: string }) {
  return (
    <select name={name} required={required} className={selectCls}>
      <option value="">{label ?? 'Select Team Member'}</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.email} ({u.role?.name ?? 'Member'})</option>
      ))}
    </select>
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

// ─── Tab: Soil Tests ─────────────────────────────────────────────────────────

function SoilTestsTab({ zones }: { zones: any[] }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

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
      await apiFetch('/farm-operations/soil-tests', { method: 'POST', body: JSON.stringify(body) });
      toast.success('Soil test saved');
      setShowForm(false);
      e.currentTarget?.reset();
      await load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Soil Test Results</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Test
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={FlaskConical} message="No soil tests recorded yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((t) => (
            <div key={t.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" />{t.zone?.name ?? 'No Zone'}
                </span>
                <span className="text-[10px] font-black text-slate-500">{new Date(t.testDate).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'pH', value: t.pHLevel ?? '—', color: !t.pHLevel ? 'slate' : t.pHLevel < 6 ? 'rose' : t.pHLevel > 7.5 ? 'amber' : 'emerald' },
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

      {showForm && (
        <Modal title="Log Soil Test" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Test Date *">
                <input type="date" name="testDate" required className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
              </FormField>
              <FormField label="Zone">
                <select name="zoneId" className={selectCls}>
                  <option value="">All Farm</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="pH Level"><input type="number" name="pHLevel" step="0.1" placeholder="6.5" className={inputCls} /></FormField>
              <FormField label="EC (dS/m)"><input type="number" name="ecLevel" step="0.01" placeholder="1.2" className={inputCls} /></FormField>
              <FormField label="Soil Type"><input type="text" name="soilType" placeholder="Loam" className={inputCls} /></FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Nitrogen (mg/kg)"><input type="number" name="nitrogen" step="0.1" className={inputCls} /></FormField>
              <FormField label="Phosphorus (mg/kg)"><input type="number" name="phosphorus" step="0.1" className={inputCls} /></FormField>
              <FormField label="Potassium (mg/kg)"><input type="number" name="potassium" step="0.1" className={inputCls} /></FormField>
            </div>
            <FormField label="Structure"><input type="text" name="structure" placeholder="e.g. Sandy loam, well-drained" className={inputCls} /></FormField>
            <FormField label="Notes"><textarea name="notes" placeholder="Additional observations..." rows={3} className={inputCls} /></FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Land Preparation ───────────────────────────────────────────────────

function LandPrepTab({ zones, users }: { zones: any[]; users: any[] }) {
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
        <EmptyState icon={Shovel} message="No land preparation activities logged" />
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
                    <td className="px-6 py-5 text-sm font-black text-white">{r.zone?.name ?? '—'}</td>
                    <td className="px-6 py-5 text-[11px] font-black text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-[11px] text-slate-400 max-w-xs">
                      {r.details && <p>{r.details}</p>}
                      {r.amendmentsUsed && <p className="text-amber-400/70 mt-0.5">+ {r.amendmentsUsed}</p>}
                    </td>
                    <td className="px-6 py-5 text-[11px] text-slate-400">{r.performedBy?.email ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Land Prep Activity" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Activity Type *">
                <select name="activityType" required className={selectCls}>
                  <option value="PLOWING">Plowing</option>
                  <option value="HARROWING">Harrowing</option>
                  <option value="BED_FORMATION">Bed Formation</option>
                  <option value="AMENDMENT">Soil Amendment</option>
                </select>
              </FormField>
              <FormField label="Zone *">
                <select name="zoneId" required className={selectCls}>
                  <option value="">Select Zone</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Date *">
              <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
            </FormField>
            <FormField label="Details (bed size, spacing, etc.)">
              <textarea name="details" rows={2} placeholder="Beds raised 20cm, 1.2m wide, 0.5m walkways..." className={inputCls} />
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

function CropBudgetsTab({ cycles }: { cycles: any[] }) {
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
        <EmptyState icon={DollarSign} message="No crop budgets created yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((b) => (
            <div key={b.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-5 hover:border-emerald-500/20 transition-all">
              <div>
                <p className="text-lg font-black text-white">{b.cropCycle?.variety?.name ?? 'Unknown Variety'}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {new Date(b.cropCycle?.startDate).toLocaleDateString()}
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
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Crop Cycle *">
              <select name="cropCycleId" required className={selectCls}>
                <option value="">Select Crop Cycle</option>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'} ({new Date(c.startDate).toLocaleDateString()})</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Workers Required">
                <input type="number" name="laborWorkersReq" placeholder="12" className={inputCls} />
              </FormField>
              <FormField label="Labour Cost Est. ($)">
                <input type="number" name="estimatedLaborCost" step="0.01" placeholder="5000" className={inputCls} />
              </FormField>
              <FormField label="Input Cost Est. ($)">
                <input type="number" name="estimatedInputCost" step="0.01" placeholder="8000" className={inputCls} />
              </FormField>
              <FormField label="Utilities Est. ($)">
                <input type="number" name="estimatedUtilitiesCost" step="0.01" placeholder="1200" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Total Budget ($)">
              <input type="number" name="totalBudget" step="0.01" placeholder="14200" className={inputCls} />
            </FormField>
            <FormField label="Notes">
              <textarea name="notes" rows={2} placeholder="Budget assumptions or procurement notes..." className={inputCls} />
            </FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Planting Records ────────────────────────────────────────────────────

function PlantingRecordsTab({ cycles }: { cycles: any[] }) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Planting Records</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Leaf} message="No planting records yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => (
            <div key={r.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-white">{r.cropCycle?.variety?.name ?? 'Unknown'}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">{r.cropCycle?.zone?.name ?? '—'}</p>
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
              {r.supplier && (
                <p className="text-[11px] text-slate-400 font-medium truncate">Supplier: {r.supplier}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Planting Record" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Crop Cycle *">
              <select name="cropCycleId" required className={selectCls}>
                <option value="">Select Crop Cycle</option>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'} ({new Date(c.startDate).toLocaleDateString()})</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Planting Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Total Plants *">
                <input type="number" name="totalPlants" required placeholder="5000" min={1} className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Density (plants/m²)">
                <input type="number" name="density" step="0.1" placeholder="6.5" className={inputCls} />
              </FormField>
              <FormField label="Spacing">
                <input type="text" name="spacing" placeholder="20cm x 20cm" className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Supplier">
                <input type="text" name="supplier" placeholder="Floriculture Kenya Ltd" className={inputCls} />
              </FormField>
              <FormField label="Lot / Batch No.">
                <input type="text" name="lotNumber" placeholder="LOT-2026-001" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Notes"><textarea name="notes" rows={2} className={inputCls} placeholder="Any additional observations..." /></FormField>
            <SubmitBtn loading={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Irrigation & Fertigation ───────────────────────────────────────────

function IrrigationTab({ zones, users }: { zones: any[]; users: any[] }) {
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
        <EmptyState icon={Droplets} message="No irrigation events logged" />
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
                    <td className="px-6 py-4 text-sm font-black text-white">{r.zone?.name ?? '—'}</td>
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
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Zone *">
                <select name="zoneId" required className={selectCls}>
                  <option value="">Select Zone</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </FormField>
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Method *">
                <select name="method" required className={selectCls}>
                  <option value="DRIP">Drip</option>
                  <option value="SPRINKLER">Sprinkler</option>
                  <option value="MANUAL">Manual</option>
                </select>
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
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setIsFertigation(!isFertigation)}
                className={`relative w-10 h-5 rounded-full transition-all ${isFertigation ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isFertigation ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-sm font-black text-white">Fertigation (fertilizer added to water)</span>
            </div>
            {isFertigation && (
              <div className="grid grid-cols-2 gap-4">
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

function ScoutingTab({ zones, cycles, users }: { zones: any[]; cycles: any[]; users: any[] }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const highSeverity = data.filter((r) => r.severity === 'HIGH').length;
  const medSeverity = data.filter((r) => r.severity === 'MEDIUM').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Pest & Disease Scouting</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> File Report
        </button>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <KpiCard icon={AlertTriangle} label="High Severity" value={highSeverity} color="rose" />
          <KpiCard icon={AlertTriangle} label="Medium Severity" value={medSeverity} color="amber" />
          <KpiCard icon={CheckCircle2} label="Total Reports" value={data.length} color="emerald" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Microscope} message="No scouting reports filed" />
      ) : (
        <div className="space-y-4">
          {data.map((r) => (
            <div key={r.id} className={`bg-black/30 border rounded-3xl p-6 transition-all ${r.severity === 'HIGH' ? 'border-rose-500/20 hover:border-rose-500/40' : r.severity === 'MEDIUM' ? 'border-amber-500/20' : 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <SeverityBadge value={r.severity} />
                    <span className="text-sm font-black text-white">{r.pestDiseaseName ?? 'General Scouting'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.zone?.name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.inspector?.email?.split('@')[0] ?? '—'}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{r.observations}</p>
              {r.actionTaken && (
                <div className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Action Taken</p>
                  <p className="text-sm text-slate-300">{r.actionTaken}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="File Scouting Report" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Zone *">
                <select name="zoneId" required className={selectCls}>
                  <option value="">Select Zone</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </FormField>
              <FormField label="Crop Cycle (optional)">
                <select name="cropCycleId" className={selectCls}>
                  <option value="">Not Specified</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Inspector *">
                <UserSelect name="inspectorId" required users={users} label="Select Inspector" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Pest / Disease Name">
                <input type="text" name="pestDiseaseName" placeholder="Gray Mold (Botrytis)" className={inputCls} />
              </FormField>
              <FormField label="Severity *">
                <select name="severity" required className={selectCls}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
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
    </div>
  );
}

// ─── Tab: Crop Performance ────────────────────────────────────────────────────

function CropPerformanceTab({ cycles, users }: { cycles: any[]; users: any[] }) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Crop Performance Logs</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Observation
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={TrendingUp} message="No performance logs recorded" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => {
            const clr = growthColors[r.growthRate as string] ?? 'slate';
            return (
              <div key={r.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">{r.cropCycle?.variety?.name ?? '—'}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase">{r.cropCycle?.zone?.name ?? '—'}</p>
                  </div>
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
                <p className="text-[9px] font-black text-slate-600 uppercase">
                  By: {r.recordedBy?.email?.split('@')[0] ?? '—'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Log Crop Performance" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Crop Cycle *">
              <select name="cropCycleId" required className={selectCls}>
                <option value="">Select Crop Cycle</option>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Recorded By *">
                <UserSelect name="recordedById" required users={users} label="Select Staff Member" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Growth Rate">
                <select name="growthRate" className={selectCls}>
                  <option value="">Not Recorded</option>
                  <option value="SLOW">Slow</option>
                  <option value="NORMAL">Normal</option>
                  <option value="FAST">Fast</option>
                </select>
              </FormField>
              <FormField label="Health Score (1—10)">
                <input type="number" name="healthScore" min={1} max={10} placeholder="8" className={inputCls} />
              </FormField>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <input type="checkbox" id="budFormation" name="budFormation" className="rounded accent-emerald-500 w-4 h-4" />
              <label htmlFor="budFormation" className="text-sm font-black text-white cursor-pointer">Bud Formation Observed</label>
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

function PreHarvestTab({ cycles, users }: { cycles: any[]; users: any[] }) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Pre-Harvest Quality Checks</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Check
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Eye} message="No pre-harvest quality logs yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((r) => (
            <div key={r.id} className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-amber-500/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white">{r.cropCycle?.variety?.name ?? '—'}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">{r.cropCycle?.zone?.name ?? '—'} · {new Date(r.date).toLocaleDateString()}</p>
                </div>
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
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Crop Cycle *">
              <select name="cropCycleId" required className={selectCls}>
                <option value="">Select Crop Cycle</option>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Inspector *">
                <UserSelect name="inspectorId" required users={users} label="Select Inspector" />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Bud Stage">
                <select name="budStage" className={selectCls}>
                  <option value="">—</option>
                  <option value="PEA_SIZE">Pea Size</option>
                  <option value="SHOWING_COLOR">Showing Color</option>
                  <option value="OPENING">Opening</option>
                </select>
              </FormField>
              <FormField label="Bud Size (mm)">
                <input type="number" name="budSizeMm" step="0.1" placeholder="25" className={inputCls} />
              </FormField>
              <FormField label="Stem Length (cm)">
                <input type="number" name="stemLengthCm" step="0.5" placeholder="65" className={inputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

function HarvestRecordsTab({ cycles, users }: { cycles: any[]; users: any[] }) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase italic">Harvest Records</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-all">
          <Plus className="w-4 h-4" /> Log Harvest
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-6">
          <KpiCard icon={Scissors} label="Total Harvests" value={summary.count} color="emerald" />
          <KpiCard icon={BarChart3} label="Total Stems" value={summary.totalStems?.toLocaleString() ?? 0} color="blue" />
          <KpiCard icon={BarChart3} label="Total Weight" value={`${(summary.totalWeightKg ?? 0).toFixed(1)} kg`} color="amber" />
          <KpiCard icon={AlertTriangle} label="Total Rejected" value={summary.totalRejected?.toLocaleString() ?? 0} color="rose" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Scissors} message="No harvest records yet" />
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
                    <p className="text-sm font-black text-white">{r.cropCycle?.variety?.name ?? '—'}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase">{r.cropCycle?.zone?.name ?? '—'}</p>
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
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Crop Cycle *">
              <select name="cropCycleId" required className={selectCls}>
                <option value="">Select Crop Cycle</option>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.variety?.name} — {c.zone?.name ?? '?'}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Harvest Date *">
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </FormField>
              <FormField label="Supervisor *">
                <UserSelect name="supervisorId" required users={users} label="Select Supervisor" />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
            <FormField label="Notes"><textarea name="notes" rows={2} placeholder="Any harvest observations..." className={inputCls} /></FormField>
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
  const [tab, setTab] = useState<TabId>('soil');
  const [zones, setZones] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [z, c, u] = await Promise.all([
          apiFetch('/zones'),
          apiFetch('/crop-cycles'),
          apiFetch('/team'),
        ]);
        setZones(z);
        setCycles(c);
        setUsers(u);
      } catch { toast.error('Failed to load farm data'); }
      setLoading(false);
    }
    init();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {cycles.filter((c) => c.status === 'GROWING').length} Active Cycles
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
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
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {tab === 'soil' && <SoilTestsTab zones={zones} />}
            {tab === 'land-prep' && <LandPrepTab zones={zones} users={users} />}
            {tab === 'budget' && <CropBudgetsTab cycles={cycles} />}
            {tab === 'planting' && <PlantingRecordsTab cycles={cycles} />}
            {tab === 'irrigation' && <IrrigationTab zones={zones} users={users} />}
            {tab === 'scouting' && <ScoutingTab zones={zones} cycles={cycles} users={users} />}
            {tab === 'performance' && <CropPerformanceTab cycles={cycles} users={users} />}
            {tab === 'pre-harvest' && <PreHarvestTab cycles={cycles} users={users} />}
            {tab === 'harvest' && <HarvestRecordsTab cycles={cycles} users={users} />}
          </div>
        </div>
      )}
    </div>
  );
}
