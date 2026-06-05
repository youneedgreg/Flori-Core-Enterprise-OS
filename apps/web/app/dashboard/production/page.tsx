/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Plus,
  Loader2,
  BarChart3,
  Layers,
  Search,
  ArrowRight,
  Droplets,
  ClipboardList,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Activity,
  FileText,
  ExternalLink,
  Microscope,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import StartCycleModal from '@/components/production/StartCycleModal';
import CreateVarietyModal from '@/components/production/CreateVarietyModal';
import EditVarietyModal from '@/components/production/EditVarietyModal';
import UpdateCycleModal from '@/components/production/UpdateCycleModal';
import HarvestRecordModal from '@/components/production/HarvestRecordModal';
import CropPerformanceModal from '@/components/production/CropPerformanceModal';
import PreHarvestQualityModal from '@/components/production/PreHarvestQualityModal';
import AddTaskModal from '@/components/production/AddTaskModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Status meta ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; barColor: string }> = {
  PLANNED:    { label: 'Planned',    color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   barColor: '#64748b' },
  PLANTED:    { label: 'Planted',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    barColor: '#3b82f6' },
  GROWING:    { label: 'Growing',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', barColor: '#10b981' },
  HARVESTING: { label: 'Harvesting', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   barColor: '#f59e0b' },
  COMPLETED:  { label: 'Completed',  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  barColor: '#a855f7' },
  CANCELLED:  { label: 'Cancelled',  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    barColor: '#f43f5e' },
};

const TASK_TYPE_META: Record<string, { color: string; bg: string; border: string }> = {
  SPRAY:      { color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  FERTILIZER: { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  PRUNING:    { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  OTHER:      { color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20'  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Variety {
  id: string;
  name: string;
  targetStemLength?: number;
  bloomTime?: number;
  marketGrade?: string;
  targetStemCountPerSqm?: number;
  defaultCostPerStem?: number;
}

interface CropCycle {
  id: string;
  variety: Variety;
  zone?: { id: string; name: string; areaSqm?: number };
  startDate: string;
  projectedHarvestDate?: string;
  actualHarvestDate?: string;
  actualHarvestYield?: number;
  status: string;
}

interface ForecastData {
  cycleId: string;
  variety: string;
  zone: string;
  projectedDate: string;
  projectedYield: number;
}

interface CropSchedule {
  id: string;
  taskName: string;
  type: string;
  scheduledDate: string;
  completedAt?: string;
  notes?: string;
  cropCycle?: { id: string; variety: { name: string }; zone?: { name: string } };
}

interface HarvestRecord {
  id: string;
  date: string;
  quantityStems: number;
  weightKg?: number;
  rejectedStems?: number;
  notes?: string;
}

interface PerformanceLog {
  id: string;
  date: string;
  growthRate?: string;
  healthScore?: number;
  budFormation: boolean;
  observations?: string;
}

interface PreHarvestLog {
  id: string;
  date: string;
  budStage?: string;
  budSizeMm?: number;
  stemLengthCm?: number;
  stemStrength?: string;
  colorDev?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cycleProgress(cycle: CropCycle): number {
  if (!cycle.projectedHarvestDate) return 0;
  const start = new Date(cycle.startDate).getTime();
  const end = new Date(cycle.projectedHarvestDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysTo(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(d?: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const router = useRouter();

  // Data
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [schedules, setSchedules] = useState<CropSchedule[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [activeTab, setActiveTab] = useState<'timeline' | 'forecast' | 'cycles' | 'schedule' | 'varieties'>('timeline');
  const [cycleSearch, setCycleSearch] = useState('');
  const [cycleStatusFilter, setCycleStatusFilter] = useState('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'upcoming' | 'past7'>('upcoming');

  // Cycle detail panel
  const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null);
  const [cycleDetailTab, setCycleDetailTab] = useState<'overview' | 'schedule' | 'records'>('overview');
  const [cycleDetailLoading, setCycleDetailLoading] = useState(false);
  const [cycleHarvestRecords, setCycleHarvestRecords] = useState<HarvestRecord[]>([]);
  const [cyclePerformanceLogs, setCyclePerformanceLogs] = useState<PerformanceLog[]>([]);
  const [cyclePreHarvestLogs, setCyclePreHarvestLogs] = useState<PreHarvestLog[]>([]);
  const [cycleSchedules, setCycleSchedules] = useState<CropSchedule[]>([]);

  // Modals
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variety | null>(null);
  const [isUpdateCycleOpen, setIsUpdateCycleOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isPreHarvestModalOpen, setIsPreHarvestModalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskCycleId, setAddTaskCycleId] = useState<string | undefined>();
  const [addTaskCycleName, setAddTaskCycleName] = useState<string | undefined>();

  // ─── Auth helpers ────────────────────────────────────────────────────────
  const getToken = useCallback(() => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '', []);
  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${getToken()}` }),
    [getToken],
  );

  // ─── Fetch data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) { logout(); return; }
      const h = { Authorization: `Bearer ${token}` };

      const [vRes, cRes, fRes, sRes, zRes] = await Promise.all([
        fetch(`${API}/varieties`, { headers: h }),
        fetch(`${API}/crop-cycles`, { headers: h }),
        fetch(`${API}/crop-cycles/forecast`, { headers: h }),
        fetch(`${API}/crop-schedules`, { headers: h }),
        fetch(`${API}/zones`, { headers: h }),
      ]);

      if ([vRes, cRes, fRes, sRes, zRes].some((r) => r.status === 401)) { logout(); return; }

      if (cRes.ok) setCycles(await cRes.json());
      if (fRes.ok) setForecast(await fRes.json());
      if (sRes.ok) setSchedules(await sRes.json());
      if (zRes.ok) setZones(await zRes.json());

      if (vRes.ok) {
        const data = await vRes.json();
        if (data.length === 0) {
          const cr = await fetch(`${API}/varieties`, {
            method: 'POST',
            headers: { ...h, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Standard Rose', targetStemLength: 60, bloomTime: 84, marketGrade: 'A', targetStemCountPerSqm: 28 }),
          });
          if (cr.ok) setVarieties([await cr.json()]);
        } else {
          setVarieties(data);
        }
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Fetch cycle detail ──────────────────────────────────────────────────
  const fetchCycleDetail = useCallback(
    async (cycle: CropCycle) => {
      setSelectedCycle(cycle);
      setCycleDetailTab('overview');
      setCycleDetailLoading(true);
      setCycleHarvestRecords([]);
      setCyclePerformanceLogs([]);
      setCyclePreHarvestLogs([]);
      setCycleSchedules([]);

      try {
        const h = authHeaders();
        const [hrRes, perfRes, phRes, schRes] = await Promise.all([
          fetch(`${API}/farm-operations/harvest-records?cropCycleId=${cycle.id}`, { headers: h }),
          fetch(`${API}/farm-operations/crop-performance?cropCycleId=${cycle.id}`, { headers: h }),
          fetch(`${API}/farm-operations/pre-harvest?cropCycleId=${cycle.id}`, { headers: h }),
          fetch(`${API}/crop-schedules?cropCycleId=${cycle.id}`, { headers: h }),
        ]);
        if (hrRes.ok) setCycleHarvestRecords(await hrRes.json());
        if (perfRes.ok) setCyclePerformanceLogs(await perfRes.json());
        if (phRes.ok) setCyclePreHarvestLogs(await phRes.json());
        if (schRes.ok) setCycleSchedules(await schRes.json());
      } catch (e: unknown) {
        toast.error((e as Error).message);
      } finally {
        setCycleDetailLoading(false);
      }
    },
    [authHeaders],
  );

  const refreshCycleDetail = useCallback(() => {
    if (selectedCycle) fetchCycleDetail(selectedCycle);
    fetchData();
  }, [selectedCycle, fetchCycleDetail, fetchData]);

  // ─── Mark task complete ──────────────────────────────────────────────────
  const markTaskComplete = useCallback(
    async (taskId: string) => {
      const token = getToken();
      const res = await fetch(`${API}/crop-schedules/${taskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        toast.success('Task marked as complete');
        fetchData();
        if (selectedCycle) fetchCycleDetail(selectedCycle);
      } else {
        toast.error('Failed to update task');
      }
    },
    [getToken, fetchData, selectedCycle, fetchCycleDetail],
  );

  // ─── Delete cycle ────────────────────────────────────────────────────────
  const deleteCycle = useCallback(
    async (cycle: CropCycle) => {
      if (!confirm(`Delete cycle for "${cycle.variety.name}"? This cannot be undone.`)) return;
      const res = await fetch(`${API}/crop-cycles/${cycle.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success('Cycle deleted');
        if (selectedCycle?.id === cycle.id) setSelectedCycle(null);
        fetchData();
      } else {
        toast.error('Failed to delete cycle');
      }
    },
    [authHeaders, selectedCycle, fetchData],
  );

  const deleteVariety = useCallback(
    async (variety: Variety) => {
      const activeCount = cycles.filter(
        (c) => c.variety.id === variety.id && !['COMPLETED', 'CANCELLED'].includes(c.status),
      ).length;

      if (activeCount > 0) {
        toast.error(`Cannot delete "${variety.name}" while it has ${activeCount} active crop cycles.`);
        return;
      }

      if (!confirm(`Delete variety "${variety.name}"? This will remove all records associated with it.`)) return;

      const res = await fetch(`${API}/varieties/${variety.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.ok) {
        toast.success('Variety deleted');
        fetchData();
      } else {
        toast.error('Failed to delete variety. It may be linked to historical records.');
      }
    },
    [authHeaders, fetchData, cycles],
  );

  // ─── Computed values ─────────────────────────────────────────────────────
  const activeCycles = useMemo(() => cycles.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status)), [cycles]);

  const upcomingSprayCount = useMemo(
    () => schedules.filter((s) => s.type === 'SPRAY' && !s.completedAt && new Date(s.scheduledDate) >= new Date()).length,
    [schedules],
  );

  const totalProjectedStems = useMemo(() => forecast.reduce((s, f) => s + f.projectedYield, 0), [forecast]);

  const chartData = useMemo(() =>
    forecast
      .reduce((acc: any[], f) => {
        const date = new Date(f.projectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const ex = acc.find((d) => d.name === date);
        if (ex) ex.yield += f.projectedYield;
        else acc.push({ name: date, yield: f.projectedYield });
        return acc;
      }, [])
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()),
    [forecast],
  );

  const filteredCycles = useMemo(() => {
    let list = cycles;
    if (cycleSearch) {
      const q = cycleSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.variety.name.toLowerCase().includes(q) ||
          c.zone?.name.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q),
      );
    }
    if (cycleStatusFilter !== 'ALL') list = list.filter((c) => c.status === cycleStatusFilter);
    return list;
  }, [cycles, cycleSearch, cycleStatusFilter]);

  const filteredSchedules = useMemo(() => {
    const now = new Date();
    if (scheduleFilter === 'past7') {
      const cutoff = new Date(now.getTime() - 7 * 86_400_000);
      return schedules.filter((s) => {
        const d = new Date(s.scheduledDate);
        return d >= cutoff && d <= now;
      });
    }
    return schedules.filter((s) => !s.completedAt || new Date(s.scheduledDate) >= now);
  }, [schedules, scheduleFilter]);

  const nextHarvestCycle = useMemo(
    () =>
      forecast
        .sort((a, b) => new Date(a.projectedDate).getTime() - new Date(b.projectedDate).getTime())
        .find((f) => new Date(f.projectedDate) > new Date()),
    [forecast],
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 relative">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Sprout className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Precision Production</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Lifecycle monitoring from planting to cold room intake.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/operations')}
            className="flex items-center gap-2 px-5 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl font-black text-sm transition-all border border-rose-500/20"
          >
            <Droplets className="w-4 h-4" />
            Spray Logs
          </button>
          <button
            onClick={() => setIsVarietyModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all border border-white/10"
          >
            <Plus className="w-4 h-4" />
            New Variety
          </button>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Start Cycle
          </button>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Active Cycles', value: activeCycles.length.toString(), icon: Layers, color: 'emerald' },
          { label: 'Varieties', value: varieties.length.toString(), icon: Sprout, color: 'blue' },
          { label: 'Projected Output', value: `${totalProjectedStems.toLocaleString()} stems`, icon: BarChart3, color: 'amber' },
          { label: 'Upcoming Sprays', value: upcomingSprayCount.toString(), icon: Droplets, color: upcomingSprayCount > 0 ? 'rose' : 'slate' },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group ${kpi.label === 'Upcoming Sprays' && upcomingSprayCount > 0 ? 'border-rose-500/20' : ''}`}>
            <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${kpi.color}-500/10 blur-2xl rounded-full`} />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-500/10 flex items-center justify-center border border-${kpi.color}-500/20`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-400`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <p className="text-xl font-black text-white">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'forecast', label: 'Forecast', icon: BarChart3 },
          { id: 'cycles', label: 'Crop Cycles', icon: Layers },
          { id: 'schedule', label: 'Schedule', icon: ClipboardList },
          { id: 'varieties', label: 'Varieties', icon: Sprout },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-emerald-500 animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Calibrating Optical Yield...</span>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

          {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
          {activeTab === 'timeline' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">Propagation Timeline</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-amber-500/50 border border-amber-500/50" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Harvesting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-blue-500/30 border border-blue-500/50" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/5 rounded-3xl overflow-hidden bg-black/40">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    {/* Header */}
                    <div className="grid grid-cols-[220px_1fr] border-b border-white/5">
                      <div className="p-5 border-r border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Zone / Cycle</div>
                      <div className="grid grid-cols-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="p-3 text-center text-[8px] font-black text-slate-600 uppercase tracking-widest border-r border-white/5 last:border-0">
                            Wk {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {cycles.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status)).length > 0 ? (
                      (() => {
                        const activeCycleList = cycles.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status));
                        const earliest = Math.min(...activeCycleList.map((c) => new Date(c.startDate).getTime()));
                        const tlStart = new Date(Math.min(earliest, Date.now() - 14 * 86_400_000));
                        const tlMs = 12 * 7 * 86_400_000;
                        return (
                          <div className="divide-y divide-white/5">
                            {activeCycleList.map((cycle) => {
                              const start = new Date(cycle.startDate).getTime();
                              const end = cycle.projectedHarvestDate
                                ? new Date(cycle.projectedHarvestDate).getTime()
                                : start + 7 * 86_400_000;
                              const left = Math.max(0, ((start - tlStart.getTime()) / tlMs) * 100);
                              const width = Math.min(100 - left, ((end - start) / tlMs) * 100);
                              const sm = STATUS_META[cycle.status] ?? STATUS_META.PLANNED;
                              return (
                                <div
                                  key={cycle.id}
                                  className="grid grid-cols-[220px_1fr] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                  onClick={() => fetchCycleDetail(cycle)}
                                >
                                  <div className="p-5 border-r border-white/5">
                                    <p className="text-xs font-black text-white uppercase truncate">{cycle.zone?.name ?? 'No Zone'}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mt-0.5">{cycle.variety.name}</p>
                                    <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${sm.bg} ${sm.color} border ${sm.border}`}>
                                      {sm.label}
                                    </span>
                                  </div>
                                  <div className="relative h-16 flex items-center px-3">
                                    <div
                                      className="h-8 rounded-xl relative flex items-center px-3 overflow-hidden transition-all hover:scale-[1.01] group"
                                      style={{
                                        width: `${Math.max(4, width)}%`,
                                        marginLeft: `${left}%`,
                                        backgroundColor: `${sm.barColor}22`,
                                        borderWidth: 1,
                                        borderColor: `${sm.barColor}44`,
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                                      <span className="text-[8px] font-black uppercase tracking-widest relative z-10 truncate" style={{ color: sm.barColor }}>
                                        {cycle.variety.name}
                                      </span>
                                      {cycle.status === 'GROWING' && (
                                        <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">
                        No active cycles to display
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Today marker note */}
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">
                Timeline window: 12 weeks · Click a row to open cycle detail
              </p>
            </div>
          )}

          {/* ── FORECAST ─────────────────────────────────────────────────────── */}
          {activeTab === 'forecast' && (
            <div className="space-y-10 relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase italic">Yield Forecast</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Aggregate projected harvest volume based on active cycles.
                  </p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Total Projected</p>
                    <p className="text-lg font-black text-white">{totalProjectedStems.toLocaleString()} stems</p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.name}</p>
                                <p className="text-lg font-black text-emerald-400">{payload[0].value?.toLocaleString()} Stems</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="yield" radius={[8, 8, 2, 2]} fill="url(#barGradient)">
                        {chartData.map((_, i) => <Cell key={i} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-600 font-black text-[10px] uppercase tracking-widest">
                  No active cycles with projected harvest dates
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 border-l-4 border-l-emerald-500 shadow-xl">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Forecast Basis
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Projections based on actual planting dates and variety-specific bloom intervals ({forecast.length} active cycle{forecast.length !== 1 ? 's' : ''}).
                    Yield = zone area × target stems per m².
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 border-l-4 border-l-amber-500 shadow-xl">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    {nextHarvestCycle ? 'Next Harvest Window' : 'No Upcoming Harvests'}
                  </h4>
                  {nextHarvestCycle ? (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <span className="text-white font-black">{nextHarvestCycle.variety}</span>
                      {nextHarvestCycle.zone ? ` in ${nextHarvestCycle.zone}` : ''} — projected{' '}
                      <span className="text-amber-400 font-black">{fmtDate(nextHarvestCycle.projectedDate)}</span>
                      {' '}({nextHarvestCycle.projectedYield.toLocaleString()} stems).
                      Coordinate cold room and packing resources in advance.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">Start crop cycles to generate harvest forecasts.</p>
                  )}
                </div>
              </div>

              {/* Per-cycle breakdown */}
              {forecast.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Cycle Breakdown</p>
                  <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    {forecast.map((f) => (
                      <div key={f.cycleId} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02]">
                        <div>
                          <p className="text-xs font-black text-white uppercase">{f.variety}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{f.zone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">{f.projectedYield.toLocaleString()} stems</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase">{fmtDate(f.projectedDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CROP CYCLES ───────────────────────────────────────────────────── */}
          {activeTab === 'cycles' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-black text-white uppercase italic">Propagation Cycles</h2>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={cycleSearch}
                      onChange={(e) => setCycleSearch(e.target.value)}
                      placeholder="Search cycles..."
                      className="bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-emerald-500/40 rounded-xl w-48 transition-all"
                    />
                    {cycleSearch && (
                      <button onClick={() => setCycleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Status filter */}
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select
                      value={cycleStatusFilter}
                      onChange={(e) => setCycleStatusFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-emerald-500/40 rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-slate-900">All Status</option>
                      {Object.entries(STATUS_META).map(([k, v]) => (
                        <option key={k} value={k} className="bg-slate-900">{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredCycles.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">
                  {cycleSearch || cycleStatusFilter !== 'ALL' ? 'No cycles match your filters' : 'No cycles yet — start your first one!'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredCycles.map((cycle) => {
                    const sm = STATUS_META[cycle.status] ?? STATUS_META.PLANNED;
                    const progress = cycleProgress(cycle);
                    const days = daysTo(cycle.projectedHarvestDate);
                    return (
                      <div
                        key={cycle.id}
                        className="bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-3xl p-7 transition-all group shadow-lg cursor-pointer"
                        onClick={() => fetchCycleDetail(cycle)}
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${sm.bg} ${sm.color} ${sm.border}`}>
                                {sm.label}
                              </span>
                              {cycle.zone && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); router.push('/dashboard/zones'); }}
                                  className="flex items-center gap-1 text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                                >
                                  <MapPin className="w-3 h-3" />
                                  {cycle.zone.name}
                                </button>
                              )}
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                              {cycle.variety.name}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchCycleDetail(cycle); }}
                            className="p-2.5 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-500 transition-all"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Started</p>
                            <p className="text-[10px] font-black text-slate-300">{fmtDate(cycle.startDate)}</p>
                          </div>
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Harvest</p>
                            <p className="text-[10px] font-black text-emerald-400">{fmtDate(cycle.projectedHarvestDate)}</p>
                          </div>
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                              {days !== null && days < 0 ? 'Overdue' : 'Days Left'}
                            </p>
                            <p className={`text-[10px] font-black ${days !== null && days < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                              {days !== null ? `${Math.abs(days)}d` : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${progress}%`, backgroundColor: sm.barColor }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-10 text-right shrink-0">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE ─────────────────────────────────────────────────────── */}
          {activeTab === 'schedule' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-black text-white uppercase italic">Agronomy & Compliance Log</h2>
                <div className="flex items-center gap-3">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setScheduleFilter('upcoming')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scheduleFilter === 'upcoming' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setScheduleFilter('past7')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scheduleFilter === 'past7' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}
                    >
                      Past 7 Days
                    </button>
                  </div>
                  <button
                    onClick={() => { setAddTaskCycleId(undefined); setAddTaskCycleName(undefined); setIsAddTaskOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Task</th>
                      <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cycle</th>
                      <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Type</th>
                      <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules.map((task) => {
                        const tm = TASK_TYPE_META[task.type] ?? TASK_TYPE_META.OTHER;
                        const isOverdue = !task.completedAt && new Date(task.scheduledDate) < new Date();
                        return (
                          <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-7 py-5">
                              <p className="font-black text-white uppercase text-sm italic">{task.taskName}</p>
                              {task.notes && <p className="text-[9px] text-slate-500 mt-0.5">{task.notes}</p>}
                            </td>
                            <td className="px-7 py-5">
                              <p className="text-slate-400 font-black text-[10px] uppercase">{task.cropCycle?.variety?.name ?? '—'}</p>
                              {task.cropCycle?.zone && <p className="text-[9px] text-slate-600 uppercase">{task.cropCycle.zone.name}</p>}
                            </td>
                            <td className="px-7 py-5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${tm.bg} ${tm.color} ${tm.border}`}>
                                {task.type}
                              </span>
                            </td>
                            <td className="px-7 py-5">
                              <p className={`font-black text-[10px] tracking-widest ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                                {fmtDate(task.scheduledDate)}
                              </p>
                              {isOverdue && <p className="text-[8px] text-rose-400 font-black uppercase">Overdue</p>}
                            </td>
                            <td className="px-7 py-5 text-right">
                              {task.completedAt ? (
                                <span className="text-emerald-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-end gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Done
                                </span>
                              ) : (
                                <button
                                  onClick={() => markTaskComplete(task.id)}
                                  className="flex items-center justify-end gap-1.5 text-[9px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors group"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="hidden group-hover:inline">Mark Done</span>
                                  <span className="group-hover:hidden">Pending</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-7 py-16 text-center">
                          <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">
                            {scheduleFilter === 'past7' ? 'No tasks in the past 7 days' : 'No upcoming tasks scheduled'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VARIETIES ─────────────────────────────────────────────────────── */}
          {activeTab === 'varieties' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">Genetic Inventory</h2>
                <button
                  onClick={() => setIsVarietyModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variety
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {varieties.map((variety) => {
                  const activeCycleCount = cycles.filter(
                    (c) => c.variety.id === variety.id && !['COMPLETED', 'CANCELLED'].includes(c.status),
                  ).length;
                  return (
                    <div
                      key={variety.id}
                      className="group bg-white/[0.02] hover:bg-white/5 border border-white/10 rounded-[2rem] p-7 transition-all shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-7 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sprout className="w-10 h-10 text-emerald-400" />
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">
                            {variety.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {variety.marketGrade && (
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                variety.marketGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                                variety.marketGrade === 'B' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                Grade {variety.marketGrade}
                              </span>
                            )}
                            {activeCycleCount > 0 && (
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                {activeCycleCount} Active
                              </span>
                            )}
                          </div>
                        </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingVariety(variety)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteVariety(variety)}
                          className="p-2 bg-white/5 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Stem Length</span>
                          <span className="text-xs font-black text-white">{variety.targetStemLength ?? '—'} cm</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bloom Time</span>
                          <span className="text-xs font-black text-white">{variety.bloomTime ?? '—'} days</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Density Target</span>
                          <span className="text-xs font-black text-emerald-400">{variety.targetStemCountPerSqm ?? '—'} stems/m²</span>
                        </div>
                        {variety.defaultCostPerStem != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cost / Stem</span>
                            <span className="text-xs font-black text-amber-400">KES {variety.defaultCostPerStem.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setEditingVariety(variety)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500/20"
                      >
                        Edit Genetics
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Cycle Detail Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCycle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCycle(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-900 border-l border-white/10 z-[70] shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const sm = STATUS_META[selectedCycle.status] ?? STATUS_META.PLANNED;
                        return (
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${sm.bg} ${sm.color} border ${sm.border}`}>
                            {sm.label}
                          </span>
                        );
                      })()}
                      {selectedCycle.zone && (
                        <button
                          onClick={() => router.push('/dashboard/zones')}
                          className="flex items-center gap-1 text-[8px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                        >
                          <MapPin className="w-3 h-3" />
                          {selectedCycle.zone.name}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter truncate">
                      {selectedCycle.variety.name}
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Started {fmtDate(selectedCycle.startDate)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsUpdateCycleOpen(true)}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition-all border border-emerald-500/20"
                      title="Update Status"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { deleteCycle(selectedCycle); }}
                      className="p-2.5 bg-white/5 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition-all border border-white/5"
                      title="Delete Cycle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedCycle(null)}
                      className="p-2.5 bg-white/5 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition-all border border-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {[
                    { key: 'overview', icon: Sprout, label: 'Overview' },
                    { key: 'schedule', icon: ClipboardList, label: 'Schedule' },
                    { key: 'records', icon: FileText, label: 'Records' },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setCycleDetailTab(key as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        cycleDetailTab === key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 p-8 space-y-6">
                {cycleDetailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-emerald-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── OVERVIEW ──────────────────────────────────────────── */}
                    {cycleDetailTab === 'overview' && (
                      <div className="space-y-5">
                        {/* Progress */}
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cycle Progress</p>
                            <span className="text-sm font-black text-white">{cycleProgress(selectedCycle)}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${cycleProgress(selectedCycle)}%`,
                                backgroundColor: STATUS_META[selectedCycle.status]?.barColor ?? '#10b981',
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {[
                              { label: 'Start Date', value: fmtDate(selectedCycle.startDate) },
                              { label: 'Proj. Harvest', value: fmtDate(selectedCycle.projectedHarvestDate), accent: true },
                              { label: daysTo(selectedCycle.projectedHarvestDate) !== null && daysTo(selectedCycle.projectedHarvestDate)! < 0 ? 'Days Overdue' : 'Days Remaining',
                                value: daysTo(selectedCycle.projectedHarvestDate) !== null ? `${Math.abs(daysTo(selectedCycle.projectedHarvestDate)!)} days` : '—',
                                warn: daysTo(selectedCycle.projectedHarvestDate) !== null && daysTo(selectedCycle.projectedHarvestDate)! < 0 },
                              { label: 'Est. Yield',
                                value: selectedCycle.zone?.areaSqm && selectedCycle.variety.targetStemCountPerSqm
                                  ? `${(selectedCycle.zone.areaSqm * selectedCycle.variety.targetStemCountPerSqm).toLocaleString()} stems`
                                  : '—' },
                            ].map(({ label, value, accent, warn }) => (
                              <div key={label} className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                                <p className={`text-xs font-black ${warn ? 'text-rose-400' : accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Variety specs */}
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Variety Specifications</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {[
                              { label: 'Stem Length', value: selectedCycle.variety.targetStemLength ? `${selectedCycle.variety.targetStemLength} cm` : '—' },
                              { label: 'Bloom Time', value: selectedCycle.variety.bloomTime ? `${selectedCycle.variety.bloomTime} days` : '—' },
                              { label: 'Market Grade', value: selectedCycle.variety.marketGrade ?? '—' },
                              { label: 'Stems / m²', value: selectedCycle.variety.targetStemCountPerSqm?.toString() ?? '—' },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                                <p className="font-black text-white">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Completed data */}
                        {selectedCycle.status === 'COMPLETED' && selectedCycle.actualHarvestDate && (
                          <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 space-y-3">
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">Harvest Completion</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Actual Harvest Date</p>
                                <p className="text-xs font-black text-white">{fmtDate(selectedCycle.actualHarvestDate)}</p>
                              </div>
                              {selectedCycle.actualHarvestYield != null && (
                                <div>
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Actual Yield</p>
                                  <p className="text-xs font-black text-purple-400">{selectedCycle.actualHarvestYield.toLocaleString()} stems</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Quick actions */}
                        <button
                          onClick={() => setIsUpdateCycleOpen(true)}
                          className="w-full py-3.5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Update Cycle Status
                        </button>
                      </div>
                    )}

                    {/* ── SCHEDULE ──────────────────────────────────────────── */}
                    {cycleDetailTab === 'schedule' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Tasks ({cycleSchedules.length})
                          </p>
                          <button
                            onClick={() => {
                              setAddTaskCycleId(selectedCycle.id);
                              setAddTaskCycleName(selectedCycle.variety.name);
                              setIsAddTaskOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add Task
                          </button>
                        </div>

                        {cycleSchedules.length > 0 ? (
                          <div className="space-y-2">
                            {cycleSchedules.map((task) => {
                              const tm = TASK_TYPE_META[task.type] ?? TASK_TYPE_META.OTHER;
                              const isOverdue = !task.completedAt && new Date(task.scheduledDate) < new Date();
                              return (
                                <div key={task.id} className={`bg-white/5 rounded-2xl p-4 border ${isOverdue ? 'border-rose-500/20' : 'border-white/5'}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-black text-white uppercase">{task.taskName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${tm.bg} ${tm.color} border ${tm.border}`}>
                                          {task.type}
                                        </span>
                                        <span className={`text-[8px] font-black ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                                          {fmtDate(task.scheduledDate)}
                                          {isOverdue && ' · OVERDUE'}
                                        </span>
                                      </div>
                                    </div>
                                    {!task.completedAt ? (
                                      <button
                                        onClick={() => markTaskComplete(task.id)}
                                        className="shrink-0 p-1.5 bg-white/5 hover:bg-emerald-500/10 rounded-xl text-slate-500 hover:text-emerald-400 transition-all"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <CheckCircle2 className="shrink-0 w-4 h-4 text-emerald-500" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white/5 rounded-2xl p-8 border border-dashed border-white/10 text-center">
                            <ClipboardList className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No tasks scheduled for this cycle</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── RECORDS ───────────────────────────────────────────── */}
                    {cycleDetailTab === 'records' && (
                      <div className="space-y-8">
                        {/* Historical data CTA */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Log Historical Data</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Record past events with a custom date — harvest batches, growth checks, or quality inspections.
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setIsHarvestModalOpen(true)}
                              className="py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex flex-col items-center gap-1"
                            >
                              <Sprout className="w-3.5 h-3.5" />
                              Harvest
                            </button>
                            <button
                              onClick={() => setIsPerformanceModalOpen(true)}
                              className="py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex flex-col items-center gap-1"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Performance
                            </button>
                            <button
                              onClick={() => setIsPreHarvestModalOpen(true)}
                              className="py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-amber-500/20 transition-all flex flex-col items-center gap-1"
                            >
                              <Microscope className="w-3.5 h-3.5" />
                              Quality
                            </button>
                          </div>
                        </div>

                        {/* Harvest Records */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                              Harvest Records ({cycleHarvestRecords.length})
                            </p>
                            <button onClick={() => setIsHarvestModalOpen(true)} className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest">
                              + Log
                            </button>
                          </div>
                          {cycleHarvestRecords.length > 0 ? (
                            <>
                              {/* Summary */}
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {[
                                  { label: 'Total Stems', value: cycleHarvestRecords.reduce((s, r) => s + r.quantityStems, 0).toLocaleString() },
                                  { label: 'Total Weight', value: `${cycleHarvestRecords.reduce((s, r) => s + (r.weightKg ?? 0), 0).toFixed(1)} kg` },
                                  { label: 'Rejected', value: cycleHarvestRecords.reduce((s, r) => s + (r.rejectedStems ?? 0), 0).toLocaleString() },
                                ].map(({ label, value }) => (
                                  <div key={label} className="bg-white/5 rounded-xl p-2 border border-white/5 text-center">
                                    <p className="text-sm font-black text-white">{value}</p>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                                  </div>
                                ))}
                              </div>
                              {cycleHarvestRecords.slice(0, 5).map((r) => (
                                <div key={r.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-black text-white">{fmtDate(r.date)}</p>
                                    <p className="text-[10px] font-black text-emerald-400">{r.quantityStems.toLocaleString()} stems</p>
                                  </div>
                                  <div className="flex gap-4">
                                    {r.weightKg && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Wt:</span> {r.weightKg} kg</p>}
                                    {r.rejectedStems != null && <p className="text-[9px] text-rose-400"><span className="text-slate-500">Rej:</span> {r.rejectedStems}</p>}
                                  </div>
                                  {r.notes && <p className="text-[9px] text-slate-500 mt-1 italic">{r.notes}</p>}
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="bg-white/5 rounded-2xl p-6 border border-dashed border-white/10 text-center">
                              <Sprout className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No harvest records yet</p>
                            </div>
                          )}
                        </div>

                        {/* Performance Logs */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-blue-400" />
                              Performance Logs ({cyclePerformanceLogs.length})
                            </p>
                            <button onClick={() => setIsPerformanceModalOpen(true)} className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                              + Log
                            </button>
                          </div>
                          {cyclePerformanceLogs.slice(0, 4).map((p) => (
                            <div key={p.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-black text-white">{fmtDate(p.date)}</p>
                                <div className="flex items-center gap-2">
                                  {p.healthScore != null && (
                                    <span className={`text-[9px] font-black ${p.healthScore >= 80 ? 'text-emerald-400' : p.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                      ♥ {p.healthScore}
                                    </span>
                                  )}
                                  {p.budFormation && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Bud ✓</span>}
                                </div>
                              </div>
                              {p.growthRate && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Rate:</span> {p.growthRate}</p>}
                              {p.observations && <p className="text-[9px] text-slate-400 mt-1 italic">{p.observations}</p>}
                            </div>
                          ))}
                          {cyclePerformanceLogs.length === 0 && (
                            <div className="bg-white/5 rounded-2xl p-5 border border-dashed border-white/10 text-center">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No performance logs</p>
                            </div>
                          )}
                        </div>

                        {/* Pre-Harvest Quality */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Microscope className="w-3.5 h-3.5 text-amber-400" />
                              Quality Checks ({cyclePreHarvestLogs.length})
                            </p>
                            <button onClick={() => setIsPreHarvestModalOpen(true)} className="text-[8px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest">
                              + Log
                            </button>
                          </div>
                          {cyclePreHarvestLogs.slice(0, 3).map((q) => (
                            <div key={q.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-black text-white">{fmtDate(q.date)}</p>
                                {q.budStage && <span className="text-[8px] font-black text-amber-400 uppercase">{q.budStage.replace(/_/g, ' ')}</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {q.stemLengthCm != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Stem:</span> {q.stemLengthCm} cm</p>}
                                {q.budSizeMm != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Bud:</span> {q.budSizeMm} mm</p>}
                                {q.stemStrength && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Strength:</span> {q.stemStrength}</p>}
                                {q.colorDev && <p className="text-[9px] text-slate-400"><span className="text-slate-500">Colour:</span> {q.colorDev.replace(/_/g, ' ')}</p>}
                              </div>
                            </div>
                          ))}
                          {cyclePreHarvestLogs.length === 0 && (
                            <div className="bg-white/5 rounded-2xl p-5 border border-dashed border-white/10 text-center">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No quality checks logged</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <StartCycleModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        apiBase={API}
        varieties={varieties as any[]}
        zones={zones.filter((z) => z.type === 'GREENHOUSE') as any[]}
        onSuccess={fetchData}
        onCreateVariety={() => { setIsStartModalOpen(false); setIsVarietyModalOpen(true); }}
      />

      <CreateVarietyModal
        isOpen={isVarietyModalOpen}
        onClose={() => setIsVarietyModalOpen(false)}
        apiBase={API}
        onSuccess={fetchData}
      />

      {editingVariety && (
        <EditVarietyModal
          variety={editingVariety}
          onClose={() => setEditingVariety(null)}
          apiBase={API}
          onSuccess={() => { fetchData(); setEditingVariety(null); }}
        />
      )}

      {isUpdateCycleOpen && selectedCycle && (
        <UpdateCycleModal
          cycle={selectedCycle}
          onClose={() => setIsUpdateCycleOpen(false)}
          apiBase={API}
          onSuccess={() => {
            refreshCycleDetail();
            setIsUpdateCycleOpen(false);
          }}
        />
      )}

      {isHarvestModalOpen && selectedCycle && (
        <HarvestRecordModal
          cycleId={selectedCycle.id}
          cycleName={selectedCycle.variety.name}
          onClose={() => setIsHarvestModalOpen(false)}
          apiBase={API}
          onSuccess={refreshCycleDetail}
        />
      )}

      {isPerformanceModalOpen && selectedCycle && (
        <CropPerformanceModal
          cycleId={selectedCycle.id}
          cycleName={selectedCycle.variety.name}
          onClose={() => setIsPerformanceModalOpen(false)}
          apiBase={API}
          onSuccess={refreshCycleDetail}
        />
      )}

      {isPreHarvestModalOpen && selectedCycle && (
        <PreHarvestQualityModal
          cycleId={selectedCycle.id}
          cycleName={selectedCycle.variety.name}
          onClose={() => setIsPreHarvestModalOpen(false)}
          apiBase={API}
          onSuccess={refreshCycleDetail}
        />
      )}

      {isAddTaskOpen && (
        <AddTaskModal
          cycleId={addTaskCycleId}
          cycleName={addTaskCycleName}
          cycles={cycles.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status))}
          onClose={() => setIsAddTaskOpen(false)}
          apiBase={API}
          onSuccess={() => {
            fetchData();
            if (selectedCycle) fetchCycleDetail(selectedCycle);
            setIsAddTaskOpen(false);
          }}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
