/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  Truck, MapPin, Navigation, User, Check, PlayCircle,
  Globe, Calendar, Loader2, X, Plus, Package,
  Clock, CheckCircle2, AlertTriangle, Eye,
  Thermometer, ChevronRight, ChevronDown,
  Filter, Search, RefreshCw, Route, Car,
  BadgeDollarSign, UploadCloud, Shield, Zap,
  ArrowRight, History, Phone, Mail,
  ThermometerSnowflake, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import ProofOfDeliveryModal from '../../../components/logistics/ProofOfDeliveryModal';

const API  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MBTK = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// ─── Dynamic import for Map (SSR-safe) ────────────────────────────────────────
const MapGL = dynamic(() => import('react-map-gl/mapbox').then((m) => m.default), { ssr: false });
const MarkerGL = dynamic(() => import('react-map-gl/mapbox').then((m) => m.Marker), { ssr: false });
const PopupGL = dynamic(() => import('react-map-gl/mapbox').then((m) => m.Popup), { ssr: false });
const NavControl = dynamic(() => import('react-map-gl/mapbox').then((m) => m.NavigationControl), { ssr: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToken() { return document.cookie.match(/access_token=([^;]+)/)?.[1] ?? ''; }
function authHdr(): HeadersInit { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }; }
async function apiFetch(url: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { ...authHdr(), ...(opts.headers as any) } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Request failed'); }
  return r.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Customer { id: string; name: string; country?: string; address?: string; phone?: string; }
interface Order { id: string; orderNumber?: string; type: string; status: string; customer: Customer; totalAmount: number; currency: string; createdAt: string; shipmentDate?: string; }
interface Driver { id: string; email: string; firstName?: string; lastName?: string; role: { name: string }; }
interface Vehicle { id: string; plateNumber: string; makeModel?: string; type: string; capacity?: number; refrigerated: boolean; status: string; }
interface DeliveryStop { id: string; sequenceIndex: number; status: string; expectedArrival?: string; actualArrival?: string; podSignatureUrl?: string; podPhotoUrl?: string; vehicleTempAtDelivery?: number; notes?: string; order: Order; }
interface DeliveryRoute { id: string; date: string; status: string; startMileage?: number; endMileage?: number; driver: Driver; vehicle: Vehicle; deliveryStops: DeliveryStop[]; }

const ORDER_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:      { label: 'Draft',      cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  IN_PICKING: { label: 'Picking',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DISPATCHED: { label: 'Dispatched', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  DELIVERED:  { label: 'Delivered',  cls: 'bg-brand-green/10 text-brand-green border-brand-green/20' },
  INVOICED:   { label: 'Invoiced',   cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};
const ROUTE_STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:     { label: 'Pending',     cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      dot: 'bg-blue-400 animate-pulse' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-brand-green/10 text-brand-green border-brand-green/20', dot: 'bg-brand-green' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',      dot: 'bg-rose-400' },
};
const STOP_STATUS_CFG: Record<string, { cls: string; icon: any }> = {
  PENDING:   { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock },
  EN_ROUTE:  { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: Navigation },
  DELIVERED: { cls: 'bg-brand-green/10 text-brand-green border-brand-green/20', icon: CheckCircle2 },
  FAILED:    { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    icon: AlertTriangle },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/5 relative overflow-hidden group`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all`} />
      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-10 h-10 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-white leading-tight">{value}</p>
          {sub && <p className="text-[9px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; cls: string }> }) {
  const cfg = map[status] ?? { label: status, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children, size = 'default' }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'default' | 'lg' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const widthCls = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className={`relative bg-brand-dark/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full ${widthCls} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-linear-to-r from-transparent via-brand-green/40 to-transparent" />
        <div className="flex items-center justify-between p-7 border-b border-white/5">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-7">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LogisticsPage() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes,   setRoutes]   = useState<DeliveryRoute[]>([]);
  const [drivers,  setDrivers]  = useState<Driver[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Map state
  const [viewState, setViewState] = useState({ longitude: 37.0, latitude: -1.0, zoom: 6.5 });
  const [driverDots, setDriverDots] = useState<Record<string, { lat: number; lng: number; heading?: number }>>({});
  const [activeStopPopup, setActiveStopPopup] = useState<any>(null);

  // Route builder
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [buildDriverId,   setBuildDriverId]   = useState('');
  const [buildVehicleId,  setBuildVehicleId]  = useState('');
  const [buildDate,       setBuildDate]       = useState(new Date().toISOString().split('T')[0]);
  const [isDispatching,   setIsDispatching]   = useState(false);

  // Panels & modals
  const [activeRouteId,   setActiveRouteId]   = useState<string | null>(null);
  const [routeDetail,     setRouteDetail]     = useState<DeliveryRoute | null>(null);
  const [routeDetailLoading, setRouteDetailLoading] = useState(false);
  const [showAddVehicle,  setShowAddVehicle]  = useState(false);
  const [showPod,         setShowPod]         = useState(false);
  const [podStop,         setPodStop]         = useState<DeliveryStop | null>(null);
  const [expandedRoutes,  setExpandedRoutes]  = useState<Set<string>>(new Set());
  const [orderSearch,     setOrderSearch]     = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Add vehicle form
  const [vForm, setVForm] = useState({ plateNumber: '', makeModel: '', type: 'VAN', capacity: '', refrigerated: true });
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  // Socket for live driver locations
  const socketRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) { logout(); return; }
      const [o, v, r, d] = await Promise.all([
        apiFetch('/logistics/orders'),
        apiFetch('/logistics/vehicles'),
        apiFetch('/logistics/routes'),
        apiFetch('/logistics/drivers'),
      ]);
      setOrders(o);
      setVehicles(v);
      setRoutes(r);
      setDrivers(d);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket for live driver locations
  useEffect(() => {
    let socket: any;
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const token = getToken();
        socket = io(`${API}/logistics`, { path: '/socket.io', transports: ['websocket'], auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => {
          // Join tenant room by decoding JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          socket.emit('join_tenant', { tenantId: payload.tenantId });
        });
        socket.on('driver_location_broadcast', (data: any) => {
          setDriverDots((prev) => ({ ...prev, [data.driverId]: { lat: data.lat, lng: data.lng, heading: data.heading } }));
        });
      } catch { /* socket.io-client may not be needed */ }
    };
    initSocket();
    return () => { socket?.disconnect(); };
  }, []);

  const openRouteDetail = async (id: string) => {
    setActiveRouteId(id);
    setRouteDetailLoading(true);
    try {
      const data = await apiFetch(`/logistics/routes/${id}`);
      setRouteDetail(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setRouteDetailLoading(false); }
  };

  const handleDispatch = async () => {
    if (!buildDriverId) return toast.error('Select a driver');
    if (!buildVehicleId) return toast.error('Select a vehicle');
    if (!selectedOrderIds.length) return toast.error('Select at least one order');
    setIsDispatching(true);
    try {
      await apiFetch('/logistics/routes', {
        method: 'POST',
        body: JSON.stringify({ driverId: buildDriverId, vehicleId: buildVehicleId, date: buildDate, stopOrderIds: selectedOrderIds }),
      });
      toast.success('Route dispatched!');
      setSelectedOrderIds([]); setBuildDriverId(''); setBuildVehicleId('');
      setBuildDate(new Date().toISOString().split('T')[0]);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setIsDispatching(false); }
  };

  const handleRouteStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/logistics/routes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success(`Route marked as ${status.replace('_', ' ')}`);
      fetchData();
      if (activeRouteId === id) openRouteDetail(id);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStopStatus = async (stopId: string, status: string) => {
    try {
      await apiFetch(`/logistics/stops/${stopId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Stop updated');
      if (activeRouteId) openRouteDetail(activeRouteId);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiFetch(`/logistics/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Order status updated');
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVehicle(true);
    try {
      await apiFetch('/logistics/vehicles', {
        method: 'POST',
        body: JSON.stringify({ ...vForm, capacity: vForm.capacity ? parseFloat(vForm.capacity) : null }),
      });
      toast.success('Vehicle registered');
      setShowAddVehicle(false);
      setVForm({ plateNumber: '', makeModel: '', type: 'VAN', capacity: '', refrigerated: true });
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setIsSavingVehicle(false); }
  };

  const handleVehicleStatus = async (v: Vehicle) => {
    try {
      await apiFetch(`/logistics/vehicles/${v.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' }),
      });
      toast.success('Vehicle status updated');
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  // KPI derivations
  const inTransitCount  = routes.filter((r) => r.status === 'IN_PROGRESS').length;
  const deliveredToday  = routes.filter((r) => {
    const today = new Date().toDateString();
    return r.status === 'COMPLETED' && new Date(r.date).toDateString() === today;
  }).length;
  const activeVehicles  = vehicles.filter((v) => v.status === 'ACTIVE').length;
  const pendingOrders   = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PICKING').length;

  // Filtered orders
  const filteredOrders = useMemo(() => orders.filter((o) => {
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return o.customer?.name?.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
    }
    return true;
  }), [orders, orderSearch, orderStatusFilter]);

  // Map markers: stops from the active route
  const activeRouteStops: Array<{ lat: number; lng: number; stop: DeliveryStop }> = [];
  // (real geocoding would be needed; map markers shown only when coordinates exist)

  const dispatchReadyOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'IN_PICKING');

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Route}    label="Active Routes"    value={inTransitCount}  color="blue"   sub={`${routes.length} total`} />
        <KpiCard icon={Truck}    label="Delivered Today"  value={deliveredToday}  color="emerald" />
        <KpiCard icon={Package}  label="Pending Dispatch" value={pendingOrders}   color="amber"  sub="Ready to route" />
        <KpiCard icon={Car}      label="Active Vehicles"  value={activeVehicles}  color="purple" sub={`${vehicles.length} fleet`} />
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-4">
            Fleet & Dispatch
            <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[9px] rounded-lg font-black tracking-widest border border-brand-green/20 flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> LIVE
            </span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Global routing, last-mile telemetry & proof of delivery.</p>
        </div>
        <button
          onClick={() => setShowAddVehicle(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </header>

      {/* Main tabs */}
      <Tabs defaultValue="dispatch" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-auto flex gap-1">
          {[
            { value: 'dispatch', icon: Navigation, label: 'Live Dispatch' },
            { value: 'routes',   icon: Route,       label: 'All Routes' },
            { value: 'orders',   icon: Package,     label: 'Order Queue' },
            { value: 'fleet',    icon: Truck,       label: 'Fleet' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-xl px-5 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark flex items-center gap-2"
            >
              <Icon className="w-4 h-4" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab 1: Live Dispatch ──────────────────────────────────────────── */}
        <TabsContent value="dispatch" className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[70vh]">

            {/* Left: Route Builder */}
            <div className="lg:col-span-3 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-white/2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-green" /> Route Builder
                </h3>
              </div>

              <div className="p-5 space-y-4 border-b border-white/5">
                {/* Driver */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Driver</label>
                  <select
                    value={buildDriverId}
                    onChange={(e) => setBuildDriverId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/40 appearance-none cursor-pointer"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : d.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</label>
                  <select
                    value={buildVehicleId}
                    onChange={(e) => setBuildVehicleId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/40 appearance-none cursor-pointer"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.filter((v) => v.status === 'ACTIVE').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.type}{v.refrigerated ? ' ❄' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Route Date</label>
                  <input
                    type="date"
                    value={buildDate}
                    onChange={(e) => setBuildDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/40"
                  />
                </div>

                <button
                  onClick={handleDispatch}
                  disabled={isDispatching || !selectedOrderIds.length || !buildVehicleId || !buildDriverId}
                  className="w-full py-3.5 bg-brand-green hover:bg-emerald-400 disabled:opacity-40 text-brand-dark font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDispatching
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <PlayCircle className="w-4 h-4" />}
                  Dispatch ({selectedOrderIds.length} stops)
                </button>
              </div>

              {/* Selectable unassigned orders */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Ready to Route ({dispatchReadyOrders.length})
                </p>
                {dispatchReadyOrders.length === 0 && !loading ? (
                  <div className="py-8 text-center">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No orders ready for dispatch.</p>
                  </div>
                ) : (
                  dispatchReadyOrders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrderIds((p) => p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id])}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                        selectedOrderIds.includes(o.id)
                          ? 'bg-brand-green/10 border-brand-green/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                          : 'bg-white/3 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white uppercase">
                            #{(o.orderNumber ?? o.id).slice(0, 8)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" /> {o.customer?.name}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedOrderIds.includes(o.id) ? 'bg-brand-green border-brand-green' : 'border-slate-600'}`}>
                          {selectedOrderIds.includes(o.id) && <Check className="w-3 h-3 text-brand-dark" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge status={o.status} map={ORDER_STATUS_CFG} />
                        <span className="text-[9px] font-black text-slate-500">{o.currency} {o.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center: Map + Active Routes */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Map */}
              <div className="flex-1 min-h-[380px] bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden relative">
                {!MBTK ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/90 backdrop-blur-sm text-center p-10">
                    <MapPin className="w-14 h-14 text-brand-green/20 mb-4" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Map Engine Offline</h3>
                    <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                      Add <code className="bg-black/40 px-2 py-0.5 rounded text-brand-green text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your environment to enable live map telemetry.
                    </p>
                  </div>
                ) : (
                  <MapGL
                    {...viewState}
                    onMove={(evt: any) => setViewState(evt.viewState)}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MBTK}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                  >
                    <NavControl position="bottom-right" />
                    <div className="absolute bottom-1 right-1 text-[9px] text-white/20 pointer-events-none select-none">© Mapbox © OpenStreetMap</div>

                    {/* Live driver dots */}
                    {Object.entries(driverDots).map(([driverId, pos]) => (
                      <MarkerGL key={driverId} longitude={pos.lng} latitude={pos.lat}>
                        <div className="relative">
                          <div className="w-4 h-4 bg-brand-green rounded-full border-2 border-white shadow-lg shadow-brand-green/40" />
                          <div className="absolute inset-0 rounded-full bg-brand-green/40 animate-ping" />
                        </div>
                      </MarkerGL>
                    ))}

                    {/* Stop popup */}
                    {activeStopPopup && (
                      <PopupGL
                        longitude={activeStopPopup.lng}
                        latitude={activeStopPopup.lat}
                        onClose={() => setActiveStopPopup(null)}
                        closeButton={false}
                      >
                        <div className="p-2 bg-brand-dark rounded-xl text-xs text-white font-bold">
                          {activeStopPopup.customer}
                        </div>
                      </PopupGL>
                    )}
                  </MapGL>
                )}

                {/* Map legend */}
                {MBTK && (
                  <div className="absolute top-4 left-4 bg-brand-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-brand-green rounded-full" />
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Live Driver</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Delivery Stop</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Active routes panel */}
              <div className="h-56 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2 shrink-0">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-green" /> Active Fleet
                  </h3>
                  <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {routes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600">
                      <Truck className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No active routes.</p>
                    </div>
                  ) : routes.map((r) => {
                    const cfg = ROUTE_STATUS_CFG[r.status] ?? ROUTE_STATUS_CFG.PENDING;
                    return (
                      <div
                        key={r.id}
                        onClick={() => openRouteDetail(r.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${activeRouteId === r.id ? 'bg-brand-green/5 border-brand-green/30' : 'bg-white/3 border-white/5 hover:border-white/15'}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${r.status === 'IN_PROGRESS' ? 'bg-brand-green/10 border border-brand-green/20' : 'bg-white/5 border border-white/5'}`}>
                          <Truck className={`w-4 h-4 ${r.status === 'IN_PROGRESS' ? 'text-brand-green' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white">{r.vehicle?.plateNumber}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5 truncate">
                            {r.driver?.firstName ?? r.driver?.email} • {r.deliveryStops?.length ?? 0} stops
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase ${cfg.cls}`}>{cfg.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Route Detail Panel */}
            <div className={`lg:col-span-3 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden transition-all duration-300 ${activeRouteId ? 'opacity-100' : 'opacity-40'}`}>
              {!activeRouteId ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-600 p-8 text-center">
                  <Route className="w-10 h-10 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Select a route from Active Fleet to view its manifest.</p>
                </div>
              ) : routeDetailLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                </div>
              ) : routeDetail ? (
                <>
                  <div className="p-5 border-b border-white/5 bg-white/2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{routeDetail.vehicle?.plateNumber}</h3>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                          {routeDetail.driver?.firstName ?? routeDetail.driver?.email} • {new Date(routeDetail.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => { setActiveRouteId(null); setRouteDetail(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <StatusBadge status={routeDetail.status} map={Object.fromEntries(Object.entries(ROUTE_STATUS_CFG).map(([k, v]) => [k, { label: v.label, cls: v.cls }]))} />
                      {routeDetail.status === 'PENDING' && (
                        <button
                          onClick={() => handleRouteStatus(routeDetail.id, 'IN_PROGRESS')}
                          className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center gap-1"
                        >
                          <PlayCircle className="w-3 h-3" /> Start
                        </button>
                      )}
                      {routeDetail.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleRouteStatus(routeDetail.id, 'COMPLETED')}
                          className="px-3 py-1 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-green/20 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Stop Manifest ({routeDetail.deliveryStops?.length ?? 0} stops)
                    </p>
                    {routeDetail.deliveryStops?.map((stop, idx) => {
                      const scfg = STOP_STATUS_CFG[stop.status] ?? STOP_STATUS_CFG.PENDING;
                      return (
                        <div key={stop.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                          {/* Stop header */}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-lg bg-brand-dark flex items-center justify-center border border-white/10 shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate">{stop.order?.customer?.name}</p>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5">#{(stop.order?.orderNumber ?? stop.order?.id ?? '').slice(0, 8)}</p>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase ${scfg.cls}`}>
                                {stop.status}
                              </span>
                            </div>

                            {/* Stop details */}
                            <div className="mt-3 space-y-1.5 pl-9">
                              <p className="text-[9px] text-slate-500 font-bold">
                                {stop.order?.currency} {stop.order?.totalAmount?.toLocaleString()}
                              </p>
                              {stop.vehicleTempAtDelivery != null && (
                                <p className="text-[9px] text-cyan-400 font-bold flex items-center gap-1">
                                  <ThermometerSnowflake className="w-3 h-3" /> {stop.vehicleTempAtDelivery}°C at delivery
                                </p>
                              )}
                              {stop.podSignatureUrl && (
                                <p className="text-[9px] text-brand-green font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> PoD signed
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stop actions */}
                          {stop.status !== 'DELIVERED' && stop.status !== 'FAILED' && (
                            <div className="flex border-t border-white/5">
                              {stop.status === 'PENDING' && (
                                <button
                                  onClick={() => handleStopStatus(stop.id, 'EN_ROUTE')}
                                  className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-1"
                                >
                                  <Navigation className="w-3 h-3" /> En Route
                                </button>
                              )}
                              <button
                                onClick={() => { setPodStop(stop); setShowPod(true); }}
                                className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest text-brand-green hover:bg-brand-green/10 transition-all border-l border-white/5 flex items-center justify-center gap-1"
                              >
                                <UploadCloud className="w-3 h-3" /> PoD
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: All Routes ─────────────────────────────────────────────── */}
        <TabsContent value="routes" className="animate-in fade-in duration-300">
          <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-brand-green" /> Route History
              </h3>
              <button onClick={fetchData} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-500 animate-pulse uppercase tracking-widest">Loading routes...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="py-20 text-center">
                <Route className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No routes created yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {routes.map((r) => {
                  const cfg = ROUTE_STATUS_CFG[r.status] ?? ROUTE_STATUS_CFG.PENDING;
                  const isExpanded = expandedRoutes.has(r.id);
                  const completedStops = r.deliveryStops?.filter((s) => s.status === 'DELIVERED').length ?? 0;
                  const totalStops = r.deliveryStops?.length ?? 0;
                  return (
                    <div key={r.id}>
                      <div
                        className="flex items-center gap-5 px-7 py-5 hover:bg-white/2 cursor-pointer transition-all group"
                        onClick={() => setExpandedRoutes((p) => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${r.status === 'IN_PROGRESS' ? 'bg-brand-green/10 border-brand-green/20' : 'bg-white/5 border-white/5'}`}>
                          <Truck className={`w-5 h-5 ${r.status === 'IN_PROGRESS' ? 'text-brand-green' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-sm font-black text-white">{r.vehicle?.plateNumber}</p>
                            <StatusBadge status={r.status} map={Object.fromEntries(Object.entries(ROUTE_STATUS_CFG).map(([k, v]) => [k, { label: v.label, cls: v.cls }]))} />
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            {r.driver?.firstName ? `${r.driver.firstName} ${r.driver.lastName ?? ''}` : r.driver?.email} •{' '}
                            {new Date(r.date).toLocaleDateString()} • {completedStops}/{totalStops} stops done
                          </p>
                        </div>
                        {/* Progress bar */}
                        <div className="w-24 hidden md:block">
                          <div className="flex justify-between mb-1">
                            <span className="text-[8px] font-black text-slate-600 uppercase">{completedStops}/{totalStops}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-green rounded-full transition-all"
                              style={{ width: totalStops ? `${(completedStops / totalStops) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                        {/* Status actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {r.status === 'PENDING' && (
                            <button onClick={() => handleRouteStatus(r.id, 'IN_PROGRESS')} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500/20 transition-all">Start</button>
                          )}
                          {r.status === 'IN_PROGRESS' && (
                            <button onClick={() => handleRouteStatus(r.id, 'COMPLETED')} className="px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-xl text-[9px] font-black uppercase hover:bg-brand-green/20 transition-all">Complete</button>
                          )}
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                      </div>

                      {/* Expanded stops */}
                      {isExpanded && (
                        <div className="px-7 pb-5 bg-white/2 space-y-2">
                          {(r.deliveryStops ?? []).map((stop, idx) => {
                            const scfg = STOP_STATUS_CFG[stop.status] ?? STOP_STATUS_CFG.PENDING;
                            return (
                              <div key={stop.id} className="flex items-center gap-4 p-4 bg-white/3 rounded-2xl border border-white/5">
                                <div className="w-6 h-6 rounded-lg bg-brand-dark flex items-center justify-center border border-white/10 shrink-0">
                                  <span className="text-[9px] font-black text-slate-400">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-white">{stop.order?.customer?.name}</p>
                                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">#{(stop.order?.orderNumber ?? stop.order?.id ?? '').slice(0, 8)} • {stop.order?.currency} {stop.order?.totalAmount?.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {stop.vehicleTempAtDelivery != null && (
                                    <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-0.5">
                                      <ThermometerSnowflake className="w-3 h-3" />{stop.vehicleTempAtDelivery}°C
                                    </span>
                                  )}
                                  {stop.podSignatureUrl && <CheckCircle2 className="w-4 h-4 text-brand-green" />}
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase ${scfg.cls}`}>{stop.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Order Queue ────────────────────────────────────────────── */}
        <TabsContent value="orders" className="animate-in fade-in duration-300">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by customer or order #..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-green/30 transition-colors"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-400 uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.entries(ORDER_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {(orderSearch || orderStatusFilter) && (
              <button onClick={() => { setOrderSearch(''); setOrderStatusFilter(''); }} className="px-4 py-3.5 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-2xl text-xs font-black uppercase border border-white/5 transition-all flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Order</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Customer</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Shipment</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={7} className="px-7 py-16 text-center">
                      <Loader2 className="w-7 h-7 animate-spin text-brand-green mx-auto mb-3" />
                      <p className="text-[9px] font-black text-slate-500 uppercase">Loading orders...</p>
                    </td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={7} className="px-7 py-16 text-center">
                      <Package className="w-9 h-9 text-slate-700 mx-auto mb-2" />
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No orders found.</p>
                    </td></tr>
                  ) : filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-7 py-5">
                        <p className="text-xs font-black text-white group-hover:text-brand-green transition-colors uppercase">
                          #{(o.orderNumber ?? o.id).slice(0, 8)}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-7 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase ${o.type === 'EXPORT_CONTRACT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-brand-green/10 text-brand-green border-brand-green/20'}`}>
                          {o.type === 'EXPORT_CONTRACT' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {o.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-7 py-5">
                        <p className="text-sm font-black text-white">{o.customer?.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">{o.customer?.country ?? '—'}</p>
                      </td>
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-1.5">
                          <BadgeDollarSign className="w-4 h-4 text-brand-green" />
                          <span className="text-xs font-black text-white">{o.currency} {o.totalAmount?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <p className="text-xs font-bold text-slate-400">
                          {o.shipmentDate ? new Date(o.shipmentDate).toLocaleDateString() : '—'}
                        </p>
                      </td>
                      <td className="px-7 py-5">
                        <StatusBadge status={o.status} map={ORDER_STATUS_CFG} />
                      </td>
                      <td className="px-7 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {o.status === 'DRAFT' && (
                            <button onClick={() => handleOrderStatus(o.id, 'CONFIRMED')} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500/20 transition-all">Confirm</button>
                          )}
                          {o.status === 'CONFIRMED' && (
                            <button onClick={() => handleOrderStatus(o.id, 'IN_PICKING')} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500/20 transition-all">Pick</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Fleet ──────────────────────────────────────────────────── */}
        <TabsContent value="fleet" className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vehicles.length} vehicles registered</p>
            <button onClick={() => setShowAddVehicle(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg">
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-3" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5">
              <Truck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No vehicles registered.</p>
              <button onClick={() => setShowAddVehicle(true)} className="mt-5 flex items-center gap-2 px-5 py-3 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-2xl font-black text-xs uppercase mx-auto hover:bg-brand-green/20 transition-all">
                <Plus className="w-4 h-4" /> Add First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {vehicles.map((v) => (
                <div key={v.id} className={`bg-white/5 rounded-[2rem] border p-6 space-y-5 transition-all group hover:border-brand-green/20 ${v.status === 'ACTIVE' ? 'border-white/5' : 'border-rose-500/20 bg-rose-500/3'}`}>
                  {/* Vehicle header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${v.status === 'ACTIVE' ? 'bg-brand-green/10 border-brand-green/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                        {v.refrigerated
                          ? <ThermometerSnowflake className={`w-6 h-6 ${v.status === 'ACTIVE' ? 'text-cyan-400' : 'text-rose-400'}`} />
                          : <Truck className={`w-6 h-6 ${v.status === 'ACTIVE' ? 'text-brand-green' : 'text-rose-400'}`} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{v.plateNumber}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{v.makeModel ?? v.type}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${v.status === 'ACTIVE' ? 'bg-brand-green/10 border-brand-green/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'ACTIVE' ? 'bg-brand-green' : 'bg-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${v.status === 'ACTIVE' ? 'text-brand-green' : 'text-rose-400'}`}>{v.status}</span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Type</p>
                      <p className="text-xs font-black text-white mt-0.5">{v.type}</p>
                    </div>
                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Capacity</p>
                      <p className="text-xs font-black text-white mt-0.5">{v.capacity ? `${v.capacity}t` : '—'}</p>
                    </div>
                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Cold Chain</p>
                      <p className={`text-xs font-black mt-0.5 ${v.refrigerated ? 'text-cyan-400' : 'text-slate-500'}`}>{v.refrigerated ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleVehicleStatus(v)}
                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${
                      v.status === 'ACTIVE'
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                        : 'bg-brand-green/5 border-brand-green/20 text-brand-green hover:bg-brand-green/10'
                    }`}
                  >
                    {v.status === 'ACTIVE' ? 'Send to Maintenance' : 'Return to Active'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Vehicle Modal ─────────────────────────────────────────────────── */}
      {showAddVehicle && (
        <Modal title="Register Vehicle" subtitle="Add to fleet" onClose={() => setShowAddVehicle(false)} size="sm">
          <form onSubmit={handleAddVehicle} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plate Number *</label>
                <input required value={vForm.plateNumber} onChange={(e) => setVForm({ ...vForm, plateNumber: e.target.value })}
                  placeholder="KAA 123A"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors uppercase" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Make / Model</label>
                <input value={vForm.makeModel} onChange={(e) => setVForm({ ...vForm, makeModel: e.target.value })}
                  placeholder="Toyota Hiace"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</label>
                <select value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black text-white uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                  {['VAN', 'TRUCK', 'REFRIGERATED_TRUCK', 'MOTORBIKE', 'PICKUP'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Capacity (tonnes)</label>
                <input type="number" step="0.1" value={vForm.capacity} onChange={(e) => setVForm({ ...vForm, capacity: e.target.value })}
                  placeholder="e.g. 2.5"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cold Chain</label>
                <select value={vForm.refrigerated ? 'yes' : 'no'} onChange={(e) => setVForm({ ...vForm, refrigerated: e.target.value === 'yes' })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                  <option value="yes">Refrigerated</option>
                  <option value="no">Standard</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Refrigerated vehicles support cold chain temperature logging at each delivery stop via the PoD system.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowAddVehicle(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={isSavingVehicle} className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isSavingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Register
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── PoD Modal ─────────────────────────────────────────────────────────── */}
      {showPod && podStop && (
        <ProofOfDeliveryModal
          stopId={podStop.id}
          orderId={podStop.order?.id ?? ''}
          onClose={() => { setShowPod(false); setPodStop(null); }}
          onSuccess={() => {
            setShowPod(false);
            setPodStop(null);
            if (activeRouteId) openRouteDetail(activeRouteId);
            fetchData();
            toast.success('Stop completed — order delivered & invoiced.');
          }}
        />
      )}
    </div>
  );
}
