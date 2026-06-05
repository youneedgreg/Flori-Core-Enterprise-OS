/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map,
  Plus,
  Edit2,
  Loader2,
  MapPin,
  Maximize2,
  Sprout,
  LayoutGrid,
  List as ListIcon,
  Archive,
  CheckCircle,
  X,
  Droplets,
  Thermometer,
  Layers,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Cpu,
  ExternalLink,
  Bug,
  FlaskConical,
  Calendar,
  Activity,
  ChevronRight,
  Microscope,
  ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import ZoneMap from '../../../components/production/ZoneMap';
import CreateZoneModal from '../../../components/production/CreateZoneModal';
import EditZoneModal from '../../../components/production/EditZoneModal';
import IrrigationLogModal from '../../../components/production/IrrigationLogModal';
import FieldReportModal from '../../../components/production/FieldReportModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Type Labels & Colours ────────────────────────────────────────────────────
const ZONE_TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  GREENHOUSE:   { label: 'Greenhouse',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  COLD_ROOM:    { label: 'Cold Room',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  PACKING_AREA: { label: 'Pack House',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  OFFICE:       { label: 'Office',      color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20'   },
  WAREHOUSE:    { label: 'Warehouse',   color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20'  },
  STORE:        { label: 'Store',       color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
};

const CYCLE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:    { label: 'Planned',    color: 'text-slate-400',   bg: 'bg-slate-500/20'   },
  PLANTED:    { label: 'Planted',    color: 'text-blue-400',    bg: 'bg-blue-500/20'    },
  GROWING:    { label: 'Growing',    color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  HARVESTING: { label: 'Harvesting', color: 'text-amber-400',   bg: 'bg-amber-500/20'   },
  COMPLETED:  { label: 'Completed',  color: 'text-purple-400',  bg: 'bg-purple-500/20'  },
  CANCELLED:  { label: 'Cancelled',  color: 'text-rose-400',    bg: 'bg-rose-500/20'    },
};

function daysToHarvest(projectedDate?: string | null): number | null {
  if (!projectedDate) return null;
  const diff = Math.ceil((new Date(projectedDate).getTime() - Date.now()) / 86_400_000);
  return diff;
}

function fmtDate(d?: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface CropCycle {
  id: string;
  status: string;
  startDate: string;
  projectedHarvestDate?: string;
  actualHarvestDate?: string;
  actualHarvestYield?: number;
  variety?: { id: string; name: string };
}

interface IoTDevice {
  id: string;
  type: string;
  macAddress: string;
  status: string;
  mqttTopic: string;
}

interface Zone {
  id: string;
  name: string;
  type: string;
  areaSqm?: number;
  plantCount?: number;
  lastWatered?: string;
  cropVarieties: string[];
  isArchived: boolean;
  createdAt?: string;
  minTemp?: number;
  maxTemp?: number;
  minHumidity?: number;
  maxHumidity?: number;
  cropCycles?: CropCycle[];
  devices?: IoTDevice[];
  _count?: { devices: number };
}

interface IrrigationLog {
  id: string;
  date: string;
  method: string;
  durationMinutes?: number;
  volumeLiters?: number;
  fertigationUsed: boolean;
  fertilizerType?: string;
  npkLevels?: string;
  zone?: { name: string };
}

interface ScoutingReport {
  id: string;
  date: string;
  severity: string;
  pestDiseaseName?: string;
  observations: string;
  actionTaken?: string;
}

interface SprayLog {
  id: string;
  appliedAt?: string;
  chemicalName: string;
  quantity: number;
  unit: string;
  phiDays: number;
  notes?: string;
}

interface SoilTest {
  id: string;
  testDate: string;
  pHLevel?: number;
  ecLevel?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilType?: string;
  notes?: string;
}

type DetailTab = 'overview' | 'cycles' | 'irrigation' | 'reports' | 'sensors';
type ReportType = 'scouting' | 'soil_test';

// ─── Component ────────────────────────────────────────────────────────────────
export default function ZonesPage() {
  const router = useRouter();

  // List state
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [stats, setStats] = useState({ activeZones: 0, totalArea: 0, uniqueCrops: 0 });
  const [isSavingDefault, setIsSavingDefault] = useState(false);

  // Bulk
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Detail panel
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [detailZone, setDetailZone] = useState<Zone | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [detailLoading, setDetailLoading] = useState(false);
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLog[]>([]);
  const [scoutingReports, setScoutingReports] = useState<ScoutingReport[]>([]);
  const [sprayLogs, setSprayLogs] = useState<SprayLog[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIrrigationModalOpen, setIsIrrigationModalOpen] = useState(false);
  const [isFieldReportModalOpen, setIsFieldReportModalOpen] = useState(false);
  const [fieldReportDefaultType, setFieldReportDefaultType] = useState<ReportType>('scouting');

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getToken = useCallback(() => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '', []);
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${getToken()}` }), [getToken]);

  // ─── Fetch list ─────────────────────────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) { logout(); return; }
      const h = { Authorization: `Bearer ${token}` };

      const [zonesRes, statsRes, settingsRes] = await Promise.all([
        fetch(`${API}/zones`, { headers: h }),
        fetch(`${API}/zones/stats`, { headers: h }),
        fetch(`${API}/tenants/settings`, { headers: h }),
      ]);

      if ([zonesRes, statsRes, settingsRes].some((r) => r.status === 401)) { logout(); return; }
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.defaultZoneView) setViewMode(s.defaultZoneView);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // ─── Fetch zone detail ───────────────────────────────────────────────────────
  const fetchZoneDetail = useCallback(async (zone: Zone) => {
    setSelectedZone(zone);
    setDetailTab('overview');
    setDetailLoading(true);
    setIrrigationLogs([]);
    setScoutingReports([]);
    setSprayLogs([]);
    setSoilTests([]);

    try {
      const h = authHeaders();
      const [zoneRes, irrigRes, scoutRes, sprayRes, soilRes] = await Promise.all([
        fetch(`${API}/zones/${zone.id}`, { headers: h }),
        fetch(`${API}/farm-operations/irrigation-logs?zoneId=${zone.id}`, { headers: h }),
        fetch(`${API}/farm-operations/scouting-reports?zoneId=${zone.id}`, { headers: h }),
        fetch(`${API}/spray-logs?zoneId=${zone.id}`, { headers: h }),
        fetch(`${API}/farm-operations/soil-tests?zoneId=${zone.id}`, { headers: h }),
      ]);

      if (zoneRes.ok) setDetailZone(await zoneRes.json());
      if (irrigRes.ok) setIrrigationLogs(await irrigRes.json());
      if (scoutRes.ok) setScoutingReports(await scoutRes.json());
      if (sprayRes.ok) setSprayLogs(await sprayRes.json());
      if (soilRes.ok) setSoilTests(await soilRes.json());
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }, [authHeaders]);

  const closeDetail = useCallback(() => {
    setSelectedZone(null);
    setDetailZone(null);
  }, []);

  // ─── Refresh detail after modal submit ──────────────────────────────────────
  const refreshDetail = useCallback(() => {
    if (selectedZone) fetchZoneDetail(selectedZone);
    fetchZones();
  }, [selectedZone, fetchZoneDetail, fetchZones]);

  // ─── Archive ────────────────────────────────────────────────────────────────
  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? Historical data is preserved but the zone will be hidden from active view.`)) return;
    try {
      const res = await fetch(`${API}/zones/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success(`Zone "${name}" archived`);
        if (selectedZone?.id === id) closeDetail();
        fetchZones();
      } else throw new Error();
    } catch {
      toast.error('Could not archive zone');
    }
  };

  // ─── Default view ───────────────────────────────────────────────────────────
  const setDefaultView = async () => {
    setIsSavingDefault(true);
    try {
      const res = await fetch(`${API}/tenants/settings`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultZoneView: viewMode }),
      });
      if (res.ok) toast.success(`${viewMode.toUpperCase()} set as default view`);
    } catch {
      toast.error('Failed to save default view');
    } finally {
      setIsSavingDefault(false);
    }
  };

  // ─── Bulk update ────────────────────────────────────────────────────────────
  const handleBulkUpdate = async () => {
    if (selectedZoneIds.length === 0) return;
    const varieties = prompt('Enter new crop varieties (comma-separated):');
    if (!varieties) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch(`${API}/zones/bulk-update`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedZoneIds, cropVarieties: varieties.split(',').map((v) => v.trim()) }),
      });
      if (res.ok) {
        toast.success(`Updated ${selectedZoneIds.length} zones`);
        setSelectedZoneIds([]);
        setIsBulkMode(false);
        fetchZones();
      }
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleZoneSelection = (id: string) =>
    setSelectedZoneIds((prev) => (prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]));

  // ─── Filtered zones ──────────────────────────────────────────────────────────
  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.type.toLowerCase().includes(q) ||
        (ZONE_TYPE_META[z.type]?.label.toLowerCase().includes(q)) ||
        z.cropVarieties.some((v) => v.toLowerCase().includes(q))
    );
  }, [zones, search]);

  // ─── Active zone for panel (full detail if loaded, else summary) ─────────────
  const panelZone = detailZone ?? selectedZone;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 relative">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Map className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Agronomy Sectors</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Geospatial management of farm blocks and production zones.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setIsBulkMode(!isBulkMode); setSelectedZoneIds([]); }}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-black text-sm transition-all border ${
              isBulkMode
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {isBulkMode ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {isBulkMode ? 'Cancel' : 'Bulk Edit'}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Add Zone
          </button>
        </div>
      </header>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, type, or crop variety..."
          className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: MapPin, label: 'Active Zones', value: stats.activeZones.toString(), color: 'blue' },
          { icon: Maximize2, label: 'Total Area', value: `${stats.totalArea.toLocaleString()} sqm`, color: 'emerald' },
          { icon: Sprout, label: 'Unique Crops', value: stats.uniqueCrops.toString(), color: 'amber' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
              <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── View Controls ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['grid', 'list', 'map'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {mode === 'grid' && <LayoutGrid className="w-4 h-4" />}
                {mode === 'list' && <ListIcon className="w-4 h-4" />}
                {mode === 'map' && <Map className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <button
            onClick={setDefaultView}
            disabled={isSavingDefault}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isSavingDefault ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Set Default
          </button>
          {search && (
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {filteredZones.length} of {zones.length} zones
            </span>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] animate-pulse tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            SYNCING SECTOR MESH...
          </div>
        )}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {/* MAP VIEW */}
          {viewMode === 'map' && (
            <motion.div key="map" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <ZoneMap
                zones={filteredZones as any[]}
                onZoneClick={(z: any) => fetchZoneDetail(z as Zone)}
                selectedZoneId={selectedZone?.id}
              />
            </motion.div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredZones.map((zone) => {
                const meta = ZONE_TYPE_META[zone.type] ?? ZONE_TYPE_META.GREENHOUSE;
                const activeCycle = zone.cropCycles?.[0];
                const selected = isBulkMode && selectedZoneIds.includes(zone.id);
                return (
                  <div
                    key={zone.id}
                    onClick={() => isBulkMode ? toggleZoneSelection(zone.id) : fetchZoneDetail(zone)}
                    className={`bg-white/5 backdrop-blur-3xl p-7 rounded-[2rem] border transition-all duration-300 shadow-xl relative overflow-hidden group cursor-pointer ${
                      selected ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    {isBulkMode && (
                      <div className="absolute top-7 right-7 z-20">
                        {selected ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-700" />}
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="flex items-start justify-between mb-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${meta.bg} ${meta.color} ${meta.border} border`}>
                        {meta.label}
                      </span>
                      {!isBulkMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedZone(zone); setDetailZone(zone); setIsEditModalOpen(true); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 mb-5">
                      <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight italic">
                        {zone.name}
                      </h3>
                      <p className="text-slate-500 text-[11px] font-black flex items-center gap-1.5 tracking-tighter">
                        <Maximize2 className="w-3 h-3" />
                        {zone.areaSqm?.toLocaleString() ?? '—'} M² · {zone.plantCount?.toLocaleString() ?? '—'} Plants
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {activeCycle?.variety ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {activeCycle.variety.name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Fallow
                        </span>
                      )}
                      {activeCycle && CYCLE_STATUS_META[activeCycle.status] && (
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${CYCLE_STATUS_META[activeCycle.status].bg} ${CYCLE_STATUS_META[activeCycle.status].color}`}>
                          {CYCLE_STATUS_META[activeCycle.status].label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${activeCycle ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {zone._count?.devices ?? 0} Sensors
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </div>
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {isBulkMode && <th className="pl-8 py-5 w-10" />}
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Zone</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Area</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Crop</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sensors</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredZones.map((zone) => {
                    const meta = ZONE_TYPE_META[zone.type] ?? ZONE_TYPE_META.GREENHOUSE;
                    const activeCycle = zone.cropCycles?.[0];
                    return (
                      <tr
                        key={zone.id}
                        onClick={() => isBulkMode ? toggleZoneSelection(zone.id) : fetchZoneDetail(zone)}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                          isBulkMode && selectedZoneIds.includes(zone.id) ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        {isBulkMode && (
                          <td className="pl-8 py-5">
                            {selectedZoneIds.includes(zone.id)
                              ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                              : <Square className="w-4 h-4 text-slate-700" />}
                          </td>
                        )}
                        <td className="px-8 py-5">
                          <p className="text-base font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight italic uppercase">{zone.name}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{zone.areaSqm?.toLocaleString()} M²</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${meta.bg} ${meta.color} border ${meta.border}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-slate-300 font-mono font-black text-xs">{zone.areaSqm?.toLocaleString() ?? '—'} M²</td>
                        <td className="px-8 py-5">
                          {activeCycle?.variety ? (
                            <span className="text-emerald-400 font-black text-[11px] uppercase italic">{activeCycle.variety.name}</span>
                          ) : (
                            <span className="text-slate-600 font-black text-[11px] uppercase italic">Fallow</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${(zone._count?.devices ?? 0) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                            <span className="text-[10px] font-black text-slate-500">{zone._count?.devices ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); fetchZoneDetail(zone).then(() => setIsEditModalOpen(true)); }}
                              className="text-slate-500 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleArchive(zone.id, zone.name); }}
                              className="text-slate-500 hover:text-rose-500 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredZones.length === 0 && (
                <div className="py-16 text-center text-slate-500 text-sm font-black uppercase tracking-widest">No zones match your search</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Detail Panel ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedZone && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeDetail}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-900 border-l border-white/10 z-[70] shadow-2xl overflow-y-auto flex flex-col"
              >
                {/* Panel Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {panelZone && ZONE_TYPE_META[panelZone.type] && (
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${ZONE_TYPE_META[panelZone.type].bg} ${ZONE_TYPE_META[panelZone.type].color} border ${ZONE_TYPE_META[panelZone.type].border}`}>
                            {ZONE_TYPE_META[panelZone.type].label}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter truncate">
                        {selectedZone.name}
                      </h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {selectedZone.areaSqm?.toLocaleString()} M² · {selectedZone.plantCount?.toLocaleString() ?? '—'} Plants
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={closeDetail}
                        className="p-2.5 bg-white/5 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition-all border border-white/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tab Nav */}
                  <div className="flex gap-1 mt-5 bg-white/5 p-1 rounded-xl">
                    {([
                      { key: 'overview', icon: MapPin, label: 'Overview' },
                      { key: 'cycles', icon: Sprout, label: 'Crops' },
                      { key: 'irrigation', icon: Droplets, label: 'Irrigation' },
                      { key: 'reports', icon: ClipboardList, label: 'Reports' },
                      { key: 'sensors', icon: Cpu, label: 'Sensors' },
                    ] as const).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setDetailTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          detailTab === key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 p-8 space-y-8">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Loading zone data...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
                      {detailTab === 'overview' && panelZone && (
                        <div className="space-y-6">
                          {/* Quick facts */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Area</p>
                              <p className="text-lg font-black text-white">{panelZone.areaSqm?.toLocaleString() ?? '—'} M²</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Plant Capacity</p>
                              <p className="text-lg font-black text-white">{panelZone.plantCount?.toLocaleString() ?? '—'}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Watered</p>
                              <p className="text-sm font-black text-white">{panelZone.lastWatered ? fmtDate(panelZone.lastWatered) : 'Not recorded'}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Created</p>
                              <p className="text-sm font-black text-white">{fmtDate(panelZone.createdAt)}</p>
                            </div>
                          </div>

                          {/* Environmental thresholds */}
                          <div className="bg-white/5 rounded-2xl border border-white/5 p-5 space-y-4">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Environmental Thresholds</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3">
                                <Thermometer className="w-4 h-4 text-blue-400" />
                                <div>
                                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Temp Range</p>
                                  <p className="text-sm font-black text-white">{panelZone.minTemp ?? 0}° – {panelZone.maxTemp ?? 40}°C</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Droplets className="w-4 h-4 text-sky-400" />
                                <div>
                                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Humidity Range</p>
                                  <p className="text-sm font-black text-white">{panelZone.minHumidity ?? 0}% – {panelZone.maxHumidity ?? 100}%</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Compliance status */}
                          <div className="bg-black/20 p-5 border border-white/5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PHI Status</p>
                            </div>
                            <button
                              onClick={() => router.push('/dashboard/compliance')}
                              className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                              View Logs <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => router.push('/dashboard/production')}
                              className="flex-1 py-3.5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                              <Sprout className="w-3.5 h-3.5" />
                              Manage Cycles
                            </button>
                            <button
                              onClick={() => setIsIrrigationModalOpen(true)}
                              className="flex-1 py-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Droplets className="w-3.5 h-3.5" />
                              Log Watering
                            </button>
                          </div>
                          <button
                            onClick={() => { setFieldReportDefaultType('scouting'); setIsFieldReportModalOpen(true); }}
                            className="w-full py-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Bug className="w-3.5 h-3.5" />
                            Log Scouting Report
                          </button>
                        </div>
                      )}

                      {/* ── CROP CYCLES TAB ───────────────────────────────────── */}
                      {detailTab === 'cycles' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Crop Cycles</p>
                            <button
                              onClick={() => router.push('/dashboard/production')}
                              className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                            >
                              Open in Production <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          {panelZone?.cropCycles && panelZone.cropCycles.length > 0 ? (
                            <div className="space-y-3">
                              {panelZone.cropCycles.map((cycle) => {
                                const days = daysToHarvest(cycle.projectedHarvestDate);
                                const statusMeta = CYCLE_STATUS_META[cycle.status] ?? CYCLE_STATUS_META.PLANNED;
                                return (
                                  <div key={cycle.id} className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="text-sm font-black text-white uppercase italic">
                                          {cycle.variety?.name ?? 'Unknown Variety'}
                                        </p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                                          Started {fmtDate(cycle.startDate)}
                                        </p>
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusMeta.bg} ${statusMeta.color}`}>
                                        {statusMeta.label}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Projected Harvest</p>
                                        <p className="text-xs font-black text-white">{fmtDate(cycle.projectedHarvestDate)}</p>
                                      </div>
                                      {days !== null && (
                                        <div>
                                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">
                                            {days >= 0 ? 'Days to Harvest' : 'Days Overdue'}
                                          </p>
                                          <p className={`text-xs font-black ${days >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                            {Math.abs(days)} days
                                          </p>
                                        </div>
                                      )}
                                      {cycle.actualHarvestYield && (
                                        <div>
                                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Actual Yield</p>
                                          <p className="text-xs font-black text-white">{cycle.actualHarvestYield.toLocaleString()} stems</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <EmptyTabState icon={Sprout} message="No crop cycles recorded for this zone." action={{ label: 'Start a Cycle', onClick: () => router.push('/dashboard/production') }} />
                          )}

                          <button
                            onClick={() => router.push('/dashboard/production')}
                            className="w-full py-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Sprout className="w-3.5 h-3.5" />
                            Start / Manage Cycles in Production
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* ── IRRIGATION TAB ────────────────────────────────────── */}
                      {detailTab === 'irrigation' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Irrigation History</p>
                            <button
                              onClick={() => router.push('/dashboard/operations')}
                              className="flex items-center gap-1.5 text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                            >
                              All Operations <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Stats */}
                          {irrigationLogs.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                                <p className="text-lg font-black text-white">{irrigationLogs.length}</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Events</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                                <p className="text-lg font-black text-white">
                                  {irrigationLogs.reduce((s, l) => s + (l.volumeLiters ?? 0), 0).toLocaleString()}
                                </p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Litres</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                                <p className="text-lg font-black text-white">
                                  {irrigationLogs.filter((l) => l.fertigationUsed).length}
                                </p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fertigations</p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            {irrigationLogs.slice(0, 10).map((log) => (
                              <div key={log.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-xs font-black text-white">{fmtDate(log.date)}</span>
                                  </div>
                                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                    {log.method}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {log.durationMinutes && (
                                    <p className="text-[9px] text-slate-400"><span className="text-slate-500">Duration:</span> {log.durationMinutes} min</p>
                                  )}
                                  {log.volumeLiters && (
                                    <p className="text-[9px] text-slate-400"><span className="text-slate-500">Volume:</span> {log.volumeLiters} L</p>
                                  )}
                                  {log.fertigationUsed && (
                                    <p className="text-[9px] text-emerald-400 col-span-2">
                                      <FlaskConical className="w-3 h-3 inline mr-1" />
                                      Fertigation: {log.fertilizerType ?? 'Applied'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                            {irrigationLogs.length === 0 && (
                              <EmptyTabState icon={Droplets} message="No irrigation events recorded." />
                            )}
                            {irrigationLogs.length > 10 && (
                              <button
                                onClick={() => router.push('/dashboard/operations')}
                                className="w-full text-center text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest py-3 transition-colors"
                              >
                                View all {irrigationLogs.length} events in Operations →
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => setIsIrrigationModalOpen(true)}
                            className="w-full py-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Droplets className="w-3.5 h-3.5" />
                            Log Irrigation Event
                          </button>
                        </div>
                      )}

                      {/* ── REPORTS TAB ───────────────────────────────────────── */}
                      {detailTab === 'reports' && (
                        <div className="space-y-8">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Field Reports</p>
                            <button
                              onClick={() => router.push('/dashboard/operations')}
                              className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest transition-colors"
                            >
                              Farm Operations <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Scouting Reports */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bug className="w-3.5 h-3.5 text-amber-400" />
                                <p className="text-[9px] font-black text-white uppercase tracking-wider">Scouting Reports ({scoutingReports.length})</p>
                              </div>
                              <button
                                onClick={() => { setFieldReportDefaultType('scouting'); setIsFieldReportModalOpen(true); }}
                                className="text-[8px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest transition-colors"
                              >
                                + Log Report
                              </button>
                            </div>
                            {scoutingReports.slice(0, 5).map((r) => (
                              <div key={r.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-black text-white">{fmtDate(r.date)}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    r.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' :
                                    r.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                    r.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                                  }`}>
                                    {r.severity}
                                  </span>
                                </div>
                                {r.pestDiseaseName && <p className="text-[9px] font-black text-amber-400 mb-1">{r.pestDiseaseName}</p>}
                                <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-2">{r.observations}</p>
                                {r.actionTaken && <p className="text-[9px] text-emerald-400 mt-1"><span className="text-slate-500">Action:</span> {r.actionTaken}</p>}
                              </div>
                            ))}
                            {scoutingReports.length === 0 && (
                              <div className="bg-white/5 rounded-2xl p-5 border border-dashed border-white/10 text-center">
                                <Bug className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No scouting reports</p>
                              </div>
                            )}
                          </div>

                          {/* Spray Logs */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-purple-400" />
                                <p className="text-[9px] font-black text-white uppercase tracking-wider">Spray Logs ({sprayLogs.length})</p>
                              </div>
                              <button
                                onClick={() => router.push('/dashboard/operations')}
                                className="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors flex items-center gap-1"
                              >
                                Log Spray <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            {sprayLogs.slice(0, 5).map((s) => (
                              <div key={s.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="text-xs font-black text-white">{s.chemicalName}</span>
                                  <span className="text-[8px] font-black text-slate-400">{fmtDate(s.appliedAt)}</span>
                                </div>
                                <div className="flex gap-3">
                                  <p className="text-[9px] text-slate-400"><span className="text-slate-500">Qty:</span> {s.quantity} {s.unit}</p>
                                  <p className="text-[9px] text-amber-400"><span className="text-slate-500">PHI:</span> {s.phiDays} days</p>
                                </div>
                              </div>
                            ))}
                            {sprayLogs.length === 0 && (
                              <div className="bg-white/5 rounded-2xl p-5 border border-dashed border-white/10 text-center">
                                <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No spray records</p>
                              </div>
                            )}
                          </div>

                          {/* Soil Tests */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Microscope className="w-3.5 h-3.5 text-teal-400" />
                                <p className="text-[9px] font-black text-white uppercase tracking-wider">Soil Tests ({soilTests.length})</p>
                              </div>
                              <button
                                onClick={() => { setFieldReportDefaultType('soil_test'); setIsFieldReportModalOpen(true); }}
                                className="text-[8px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest transition-colors"
                              >
                                + Log Test
                              </button>
                            </div>
                            {soilTests.slice(0, 5).map((t) => (
                              <div key={t.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-black text-white">{fmtDate(t.testDate)}</span>
                                  {t.soilType && <span className="text-[8px] font-black text-teal-400">{t.soilType}</span>}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {t.pHLevel != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">pH:</span> {t.pHLevel}</p>}
                                  {t.ecLevel != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">EC:</span> {t.ecLevel}</p>}
                                  {t.nitrogen != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">N:</span> {t.nitrogen}</p>}
                                  {t.phosphorus != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">P:</span> {t.phosphorus}</p>}
                                  {t.potassium != null && <p className="text-[9px] text-slate-400"><span className="text-slate-500">K:</span> {t.potassium}</p>}
                                </div>
                              </div>
                            ))}
                            {soilTests.length === 0 && (
                              <div className="bg-white/5 rounded-2xl p-5 border border-dashed border-white/10 text-center">
                                <Microscope className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No soil tests on record</p>
                              </div>
                            )}
                          </div>

                          {/* Historical data entry CTA */}
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Log Historical Data</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">Enter past field observations, scouting events, or soil test results with a custom date.</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setFieldReportDefaultType('scouting'); setIsFieldReportModalOpen(true); }}
                                className="flex-1 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Bug className="w-3 h-3" /> Scouting
                              </button>
                              <button
                                onClick={() => { setFieldReportDefaultType('soil_test'); setIsFieldReportModalOpen(true); }}
                                className="flex-1 py-2.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Microscope className="w-3 h-3" /> Soil Test
                              </button>
                              <button
                                onClick={() => setIsIrrigationModalOpen(true)}
                                className="flex-1 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Droplets className="w-3 h-3" /> Irrigation
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── SENSORS TAB ───────────────────────────────────────── */}
                      {detailTab === 'sensors' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                              IoT Sensors ({panelZone?.devices?.length ?? selectedZone._count?.devices ?? 0})
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Telemetry Active</span>
                            </div>
                          </div>

                          {panelZone?.devices && panelZone.devices.length > 0 ? (
                            <div className="space-y-3">
                              {panelZone.devices.map((device) => (
                                <div key={device.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Cpu className="w-4 h-4 text-emerald-400" />
                                      <span className="text-xs font-black text-white uppercase">{device.type}</span>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      device.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                                    }`}>
                                      {device.status}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-mono">{device.macAddress}</p>
                                  <p className="text-[9px] text-slate-600 font-mono mt-0.5">{device.mqttTopic}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyTabState
                              icon={Cpu}
                              message={`No IoT sensors linked to ${selectedZone.name} yet.`}
                            />
                          )}

                          {/* Sensor count from summary if detail not loaded */}
                          {!panelZone?.devices && (selectedZone._count?.devices ?? 0) > 0 && (
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-center">
                              <p className="text-2xl font-black text-white mb-1">{selectedZone._count?.devices}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sensors Connected</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Panel Footer — Archive */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-8 py-4">
                  <button
                    onClick={() => handleArchive(selectedZone.id, selectedZone.name)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-black text-slate-600 hover:text-rose-400 uppercase tracking-widest transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Zone
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bulk Action Bar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isBulkMode && selectedZoneIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-8 py-4 bg-slate-900 border border-white/10 rounded-full shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
              <span className="text-sm font-black text-white">{selectedZoneIds.length} Selected</span>
              <button onClick={() => setSelectedZoneIds([])} className="text-[9px] font-black text-slate-500 uppercase hover:text-white tracking-widest">Clear</button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {isBulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                Update Crops
              </button>
              <button
                onClick={() => {
                  if (selectedZoneIds.length === 1) {
                    const z = zones.find((z) => z.id === selectedZoneIds[0]);
                    if (z) fetchZoneDetail(z).then(() => setIsIrrigationModalOpen(true));
                  } else {
                    toast.info('Select one zone at a time to log irrigation');
                  }
                }}
                className="flex items-center gap-2 px-5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all"
              >
                <Droplets className="w-3.5 h-3.5" />
                Log Watering
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {filteredZones.length === 0 && !loading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2rem] text-slate-500">
          {search ? (
            <>
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-black text-white mb-2 uppercase italic tracking-tighter">No Zones Found</p>
              <p className="text-sm mb-6 text-center max-w-xs leading-relaxed font-medium">No zones match &quot;{search}&quot;</p>
              <button onClick={() => setSearch('')} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all">
                Clear Search
              </button>
            </>
          ) : (
            <>
              <Map className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">No Active Sectors Detected</p>
              <p className="text-sm mb-8 text-center max-w-xs leading-relaxed font-medium">Your farm structure is the digital foundation of Flori-Core Enterprise. Initialize your first production zone to begin telemetry tracking.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
              >
                Deploy First Sector
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <CreateZoneModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          apiBase={API}
          onSuccess={fetchZones}
        />
      )}

      {isEditModalOpen && (panelZone ?? selectedZone) && (
        <EditZoneModal
          zone={panelZone ?? selectedZone!}
          onClose={() => setIsEditModalOpen(false)}
          apiBase={API}
          onSuccess={() => { refreshDetail(); setIsEditModalOpen(false); }}
        />
      )}

      {isIrrigationModalOpen && selectedZone && (
        <IrrigationLogModal
          zoneId={selectedZone.id}
          zoneName={selectedZone.name}
          onClose={() => setIsIrrigationModalOpen(false)}
          apiBase={API}
          onSuccess={refreshDetail}
        />
      )}

      {isFieldReportModalOpen && selectedZone && (
        <FieldReportModal
          zoneId={selectedZone.id}
          zoneName={selectedZone.name}
          defaultType={fieldReportDefaultType}
          onClose={() => setIsFieldReportModalOpen(false)}
          apiBase={API}
          onSuccess={refreshDetail}
        />
      )}
    </div>
  );
}

// ─── Helper Sub-component ─────────────────────────────────────────────────────
function EmptyTabState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-8 border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
      <Icon className="w-8 h-8 text-slate-700" />
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed max-w-xs">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 flex items-center gap-1.5 text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
        >
          {action.label} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
