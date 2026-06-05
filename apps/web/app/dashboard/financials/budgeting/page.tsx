/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, TrendingUp, TrendingDown, BarChart3, Layers,
  Plus, CheckCircle, Loader2, X, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DEPT_COLOR: Record<string,string> = {
  PRODUCTION:'emerald', PACK_HOUSE:'blue', LOGISTICS:'purple', ADMIN:'amber', SALES:'rose',
};

type Tab = 'variance' | 'pl' | 'orders' | 'varieties' | 'budgets';

export default function BudgetingPage() {
  const [tab, setTab] = useState<Tab>('pl');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState<number | undefined>(undefined);

  const [pl, setPL] = useState<any>(null);
  const [variance, setVariance] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [costCentres, setCostCentres] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    costCentreId: '', name: '', year: CURRENT_YEAR, month: '', currency: 'USD', notes: '',
    lines: [{ accountCode: '', description: '', budgetedAmt: '' }],
  });
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    const token = match?.[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const periodParams = `year=${year}${month ? `&month=${month}` : ''}`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const h = getHeaders();
    if (!h) return;
    try {
      const [plRes, varRes, ordRes, vartyRes, budRes, ccRes] = await Promise.all([
        fetch(`${API}/financials/budgeting/pl/departmental?${periodParams}`, { headers: h }),
        fetch(`${API}/financials/budgeting/variance?${periodParams}`, { headers: h }),
        fetch(`${API}/financials/budgeting/profitability/orders`, { headers: h }),
        fetch(`${API}/financials/budgeting/profitability/varieties`, { headers: h }),
        fetch(`${API}/financials/budgeting/budgets?year=${year}`, { headers: h }),
        fetch(`${API}/financials/budgeting/cost-centres`, { headers: h }),
      ]);
      setPL(await plRes.json());
      setVariance(await varRes.json());
      setOrders(await ordRes.json());
      setVarieties(await vartyRes.json());
      setBudgets(await budRes.json());
      setCostCentres(await ccRes.json());
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const h = getHeaders(); if (!h) return;
      const res = await fetch(`${API}/financials/budgeting/budgets`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          ...newBudget,
          year: newBudget.year,
          month: newBudget.month ? parseInt(newBudget.month) : undefined,
          lines: newBudget.lines.map(l => ({ ...l, budgetedAmt: parseFloat(l.budgetedAmt) })),
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('Budget created!');
      setShowNewBudget(false);
      fetchAll();
    } catch { toast.error('Failed to create budget'); }
    finally { setSaving(false); }
  };

  const handleApproveBudget = async (id: string) => {
    const h = getHeaders(); if (!h) return;
    const res = await fetch(`${API}/financials/budgeting/budgets/${id}/approve`, { method: 'PATCH', headers: h });
    if (res.ok) { toast.success('Budget approved!'); fetchAll(); }
    else toast.error('Approval failed');
  };

  const fmt = (n: number, c = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);

  const varianceColor = (pct: number) =>
    Math.abs(pct) < 5 ? 'text-emerald-400' : pct > 0 ? 'text-rose-400' : 'text-amber-400';

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'pl', label: 'P&L', icon: TrendingUp },
    { id: 'variance', label: 'Variance', icon: BarChart3 },
    { id: 'orders', label: 'Order Profitability', icon: DollarSign },
    { id: 'varieties', label: 'By Variety', icon: Layers },
    { id: 'budgets', label: 'Budgets', icon: Target },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Budgeting & Cost Centres
          </h1>
          <p className="text-slate-400 mt-1">Variance analysis, departmental P&L, and profitability tracking.</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-3 items-center">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500">
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month ?? ''} onChange={e => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500">
            <option value="">Full Year</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          {tab === 'budgets' && (
            <button onClick={() => setShowNewBudget(true)}
              className="px-5 py-2 bg-emerald-500 text-brand-dark rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-colors">
              <Plus className="w-4 h-4" /> New Budget
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1 bg-white/5 rounded-2xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
              tab === t.id ? 'bg-emerald-500 text-brand-dark' : 'text-slate-400 hover:text-white'
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {/* ── P&L Tab ──────────────────────────────────────────────────────── */}
          {tab === 'pl' && pl && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: fmt(pl.summary?.totalRevenue ?? 0), color: 'emerald', icon: TrendingUp },
                  { label: 'Total Expenses', value: fmt(pl.summary?.totalExpenses ?? 0), color: 'rose', icon: TrendingDown },
                  { label: 'Gross Profit', value: fmt(pl.summary?.grossProfit ?? 0), color: 'blue', icon: DollarSign },
                  { label: 'Gross Margin', value: `${pl.summary?.grossMarginPct ?? 0}%`, color: 'purple', icon: Target },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                    <div className={`w-9 h-9 rounded-xl bg-${kpi.color}-500/20 flex items-center justify-center mb-3`}>
                      <kpi.icon className={`w-4 h-4 text-${kpi.color}-400`} />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <p className="text-xl font-black text-white">{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Departmental breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(pl.departments ?? []).map((dept: any) => {
                  const color = DEPT_COLOR[dept.department] ?? 'slate';
                  return (
                    <div key={dept.department} className={`bg-white/5 border border-white/10 rounded-3xl p-5`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-xs font-black text-${color}-400 uppercase tracking-widest`}>
                          {dept.department.replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-black ${dept.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(dept.netProfit)}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex justify-between"><span>Revenue</span><span className="text-emerald-400 font-bold">{fmt(dept.revenue)}</span></div>
                        <div className="flex justify-between"><span>Expenses</span><span className="text-rose-400 font-bold">{fmt(dept.expenses)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Variance Tab ─────────────────────────────────────────────────── */}
          {tab === 'variance' && variance && (
            <div className="space-y-6">
              <div className="flex gap-8 mb-2">
                {[
                  { label: 'Total Budgeted', val: fmt(variance.summary?.totalBudgeted ?? 0) },
                  { label: 'Total Actual', val: fmt(variance.summary?.totalActual ?? 0) },
                  { label: 'Total Variance', val: fmt(variance.summary?.totalVariance ?? 0), highlight: true },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className={`text-xl font-black mt-1 ${s.highlight && (variance.summary?.totalVariance < 0) ? 'text-rose-400' : 'text-white'}`}>{s.val}</p>
                  </div>
                ))}
              </div>
              {(variance.rows ?? []).length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-slate-500">
                  No budgets found for this period. Create a budget first.
                </div>
              ) : (variance.rows ?? []).map((row: any) => (
                <div key={row.budgetId} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20">
                    <div>
                      <p className="font-black text-white">{row.budgetName}</p>
                      <p className="text-xs text-slate-500">{row.costCentre} · {row.year}{row.month ? `-${String(row.month).padStart(2,'0')}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Variance</p>
                      <p className={`font-black text-lg ${row.totalVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{fmt(row.totalVariance)}</p>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Account', 'Description', 'Budgeted', 'Actual', 'Variance', 'Status'].map(h => (
                          <th key={h} className="py-3 px-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {row.lines.map((line: any) => (
                        <tr key={line.accountCode} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-3 px-5 font-mono text-xs text-slate-400">{line.accountCode}</td>
                          <td className="py-3 px-5 text-slate-300 text-sm">{line.description}</td>
                          <td className="py-3 px-5 text-white font-bold">{fmt(line.budgeted)}</td>
                          <td className="py-3 px-5 font-bold">{fmt(line.actual)}</td>
                          <td className={`py-3 px-5 font-black ${varianceColor(line.variancePct)}`}>{fmt(line.variance)}</td>
                          <td className="py-3 px-5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              line.status === 'ON_TRACK' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                              line.status === 'OVER' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                              'text-amber-400 border-amber-500/20 bg-amber-500/10'
                            }`}>{line.status.replace('_',' ')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ── Order Profitability ───────────────────────────────────────────── */}
          {tab === 'orders' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    {['Order #', 'Customer', 'Revenue', 'Est. COGS', 'Gross Profit', 'Margin %', 'Status'].map(h => (
                      <th key={h} className="py-4 px-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.orderId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-mono text-sm text-white font-bold">{o.orderNumber ?? '—'}</td>
                      <td className="py-4 px-5 text-slate-300">{o.customer}</td>
                      <td className="py-4 px-5 font-bold text-white">{fmt(o.revenue, o.currency)}</td>
                      <td className="py-4 px-5 text-rose-400 font-bold">{fmt(o.estimatedCOGS, o.currency)}</td>
                      <td className="py-4 px-5 font-bold text-emerald-400">{fmt(o.grossProfit, o.currency)}</td>
                      <td className="py-4 px-5">
                        <div className={`font-black text-sm ${o.grossMarginPct > 25 ? 'text-emerald-400' : o.grossMarginPct > 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {o.grossMarginPct}%
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-400 font-bold uppercase">{o.status}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="py-14 text-center text-slate-500">No delivered orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Variety Profitability ─────────────────────────────────────────── */}
          {tab === 'varieties' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {varieties.map(v => (
                <div key={v.variety} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <p className="font-black text-white text-lg mb-4">{v.variety}</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Total Stems', v.totalStems.toLocaleString()],
                      ['Total Weight', `${v.totalWeightKg.toFixed(1)} kg`],
                      ['Crop Budget', fmt(v.totalCropBudget)],
                      ['Cost / Stem', fmt(v.costPerStem)],
                      ['Harvest Records', v.records],
                    ].map(([k, val]) => (
                      <div key={k as string} className="flex justify-between">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-white font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {varieties.length === 0 && (
                <div className="col-span-3 py-14 text-center text-slate-500">No harvest data available yet</div>
              )}
            </div>
          )}

          {/* ── Budgets Tab ───────────────────────────────────────────────────── */}
          {tab === 'budgets' && (
            <div className="space-y-4">
              {budgets.map(b => (
                <div key={b.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-white">{b.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {b.costCentre?.name} · {b.year}{b.month ? `-${String(b.month).padStart(2,'0')}` : ''}
                        {' · '}{b.currency}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        b.status === 'APPROVED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        b.status === 'LOCKED' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                        'text-slate-400 border-white/10 bg-white/5'
                      }`}>{b.status}</span>
                      {b.status === 'DRAFT' && (
                        <button onClick={() => handleApproveBudget(b.id)}
                          className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span className="font-bold text-white">{b.lines?.length ?? 0}</span> line items ·{' '}
                    Total: <span className="font-bold text-emerald-400">
                      {fmt(b.lines?.reduce((s: number, l: any) => s + l.budgetedAmt, 0) ?? 0, b.currency)}
                    </span>
                  </div>
                </div>
              ))}
              {budgets.length === 0 && (
                <div className="py-14 text-center text-slate-500 bg-white/5 border border-white/10 rounded-3xl">
                  <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  No budgets for {year}. Create one above.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── New Budget Modal ───────────────────────────────────────────────── */}
      {showNewBudget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-brand-dark border border-white/10 rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase italic">New Budget</h2>
              <button onClick={() => setShowNewBudget(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Name</label>
                  <input required value={newBudget.name} onChange={e => setNewBudget(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Production Q1 2026"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Cost Centre</label>
                  <select required value={newBudget.costCentreId} onChange={e => setNewBudget(p => ({ ...p, costCentreId: e.target.value }))}
                    className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500">
                    <option value="">Select…</option>
                    {costCentres.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Year</label>
                  <input type="number" required value={newBudget.year} onChange={e => setNewBudget(p => ({ ...p, year: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Month (optional)</label>
                  <select value={newBudget.month} onChange={e => setNewBudget(p => ({ ...p, month: e.target.value }))}
                    className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500">
                    <option value="">Annual</option>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Budget Lines</label>
                  <button type="button" onClick={() => setNewBudget(p => ({ ...p, lines: [...p.lines, { accountCode: '', description: '', budgetedAmt: '' }] }))}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>
                {newBudget.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                    <input placeholder="Account Code" value={line.accountCode}
                      onChange={e => { const ls = [...newBudget.lines]; ls[idx].accountCode = e.target.value; setNewBudget(p => ({ ...p, lines: ls })); }}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                    <input placeholder="Description" value={line.description}
                      onChange={e => { const ls = [...newBudget.lines]; ls[idx].description = e.target.value; setNewBudget(p => ({ ...p, lines: ls })); }}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                    <input type="number" placeholder="Amount" value={line.budgetedAmt}
                      onChange={e => { const ls = [...newBudget.lines]; ls[idx].budgetedAmt = e.target.value; setNewBudget(p => ({ ...p, lines: ls })); }}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-brand-dark font-black tracking-widest uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Create Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
