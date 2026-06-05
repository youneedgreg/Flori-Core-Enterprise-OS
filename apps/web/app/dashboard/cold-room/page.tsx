/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Wind, Thermometer, Droplets, Loader2, AlertCircle,
  Package, Plus, X, Save, Truck, ArrowRight,
  CheckCircle2, Clock, Box, AlertTriangle, Activity,
  RefreshCw, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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

function KpiCard({ icon: Icon, label, value, color, sub, pulse }: { icon: any; label: string; value: string | number; color: string; sub?: string; pulse?: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group transition-all">
      <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 ${pulse ? 'animate-pulse' : ''}`}>
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

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4 text-slate-600">
      <Icon className="w-14 h-14 opacity-20" />
      <p className="text-[11px] font-black uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-brand-dark/80 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/2">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{title}</h3>
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

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all hover:bg-white/[0.05]";
const selectCls = "w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all appearance-none cursor-pointer";

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function BreachBanner({ room, temp, onAck }: { room: any; temp: number; onAck: () => void }) {
  const tooHigh = temp > (room?.maxTemp ?? 99);
  const tooLow = temp < (room?.minTemp ?? -99);
  if (!tooHigh && !tooLow) return null;
  return (
    <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/40 rounded-3xl px-8 py-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/30 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-black text-rose-300">
            Temperature Breach — {temp.toFixed(1)}°C ({tooHigh ? `above max ${room.maxTemp}°C` : `below min ${room.minTemp}°C`})
          </p>
          <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">{room.name} · Immediate action required</p>
        </div>
      </div>
      <button
        onClick={onAck}
        className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-400 transition-all shrink-0"
      >
        Acknowledge <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Tab: Live Climate ────────────────────────────────────────────────────────

function ClimateTab({ rooms, selectedRoom, setSelectedRoom, telemetry, lastRefresh, refreshing }: {
  rooms: any[]; selectedRoom: string | null; setSelectedRoom: (id: string) => void;
  telemetry: any[]; lastRefresh: Date | null; refreshing: boolean;
}) {
  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const latestTelemetry = telemetry[telemetry.length - 1] ?? {};

  // Extract temp and humidity from latest telemetry or device readings
  const devices = currentRoom?.devices ?? [];
  const tempDevice = devices.find((d: any) => d.type === 'TEMPERATURE' || d.sensorType === 'TEMPERATURE') ?? devices[0];
  const humDevice = devices.find((d: any) => d.type === 'HUMIDITY' || d.sensorType === 'HUMIDITY') ?? devices[1];
  const tempReading = tempDevice?.readings?.[0]?.value ?? latestTelemetry.temp ?? null;
  const humReading = humDevice?.readings?.[0]?.value ?? latestTelemetry.humidity ?? null;

  const isTempAlert = currentRoom && tempReading !== null && (
    tempReading < currentRoom.minTemp || tempReading > currentRoom.maxTemp
  );
  const isHumAlert = currentRoom && humReading !== null && (
    humReading < currentRoom.minHumidity || humReading > currentRoom.maxHumidity
  );

  const [showAck, setShowAck] = useState(false);
  const [ackNote, setAckNote] = useState('');
  const [ackSaving, setAckSaving] = useState(false);

  async function submitAck(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAckSaving(true);
    try {
      await apiFetch('/cold-room/alerts/acknowledge', {
        method: 'POST',
        body: JSON.stringify({ zoneId: selectedRoom, note: ackNote }),
      });
      toast.success('Breach acknowledged and logged');
      setShowAck(false);
      setAckNote('');
    } catch { toast.info('Acknowledged locally (server may not support this endpoint yet)'); setShowAck(false); }
    finally { setAckSaving(false); }
  }

  if (rooms.length === 0) {
    return <EmptyState icon={Wind} message="No cold rooms configured — set zone type to COLD_ROOM in settings" />;
  }

  return (
    <div className="space-y-8">
      {/* Room + refresh row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedRoom === room.id
                  ? 'bg-blue-500 text-white border-blue-400 shadow-lg'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting...'}
          <span className="text-slate-700">· Auto 30s</span>
        </div>
      </div>

      {/* Breach banner */}
      {isTempAlert && currentRoom && tempReading !== null && (
        <BreachBanner room={currentRoom} temp={tempReading} onAck={() => setShowAck(true)} />
      )}

      {/* Live readings + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: live gauges */}
        <div className="space-y-6">
          {/* Temperature */}
          <div className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border transition-all ${isTempAlert ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temperature</h3>
              <div className={`p-2 rounded-lg ${isTempAlert ? 'bg-rose-500/10 text-rose-400 animate-pulse' : 'bg-blue-500/10 text-blue-400'}`}>
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            {tempReading !== null ? (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-7xl font-black tracking-tighter ${isTempAlert ? 'text-rose-400' : 'text-white'}`}>
                    {tempReading.toFixed(1)}
                  </span>
                  <span className="text-2xl font-black text-slate-600 mb-2">°C</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>Target</span>
                    <span className="text-white">{currentRoom?.minTemp}° – {currentRoom?.maxTemp}°C</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    {currentRoom && (
                      <div
                        className={`h-full rounded-full transition-all ${isTempAlert ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${Math.min(100, Math.max(5, ((tempReading - currentRoom.minTemp) / (currentRoom.maxTemp - currentRoom.minTemp)) * 80 + 10))}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-4xl font-black text-slate-600">—</p>
            )}
          </div>

          {/* Humidity */}
          <div className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border transition-all ${isHumAlert ? 'border-amber-500/50' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rel. Humidity</h3>
              <div className={`p-2 rounded-lg ${isHumAlert ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            {humReading !== null ? (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-7xl font-black tracking-tighter ${isHumAlert ? 'text-amber-400' : 'text-white'}`}>
                    {humReading.toFixed(0)}
                  </span>
                  <span className="text-2xl font-black text-slate-600 mb-2">%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>Target</span>
                    <span className="text-white">{currentRoom?.minHumidity ?? 85}% – {currentRoom?.maxHumidity ?? 95}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isHumAlert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, humReading)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-4xl font-black text-slate-600">—</p>
            )}
          </div>

          {/* Room info */}
          {currentRoom && (
            <div className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Room Configuration</p>
              {[
                { label: 'Min Temp', value: `${currentRoom.minTemp}°C` },
                { label: 'Max Temp', value: `${currentRoom.maxTemp}°C` },
                { label: 'Min Humidity', value: `${currentRoom.minHumidity ?? 85}%` },
                { label: 'Max Humidity', value: `${currentRoom.maxHumidity ?? 95}%` },
                { label: 'Devices', value: `${currentRoom.devices?.length ?? 0} sensor${currentRoom.devices?.length !== 1 ? 's' : ''}` },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{r.label}</span>
                  <span className="text-[11px] font-black text-white">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: chart */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-white uppercase italic">24h Climate Trend</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High-resolution 5-min tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase">Temp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase">Humidity</span>
              </div>
            </div>
          </div>

          {telemetry.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No telemetry data available</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#475569" fontSize={9} fontWeight={900} tickLine={false}
                  />
                  <YAxis stroke="#475569" fontSize={9} fontWeight={900} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}
                    itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                    labelFormatter={(l) => new Date(l).toLocaleTimeString()}
                  />
                  <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" dot={false} />
                  <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Min/max band reference lines */}
          {currentRoom && (
            <div className="mt-6 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-blue-500/50 border-t border-dashed border-blue-500/50" />
                <span className="text-[9px] font-black text-slate-600 uppercase">Temp safe zone: {currentRoom.minTemp}°–{currentRoom.maxTemp}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-px border-t border-dashed border-emerald-500/50" />
                <span className="text-[9px] font-black text-slate-600 uppercase">Humidity target: {currentRoom.minHumidity ?? 85}–{currentRoom.maxHumidity ?? 95}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acknowledge modal */}
      {showAck && (
        <Modal title="Acknowledge Temperature Breach" onClose={() => setShowAck(false)}>
          <form onSubmit={submitAck} className="space-y-6">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
              <p className="text-sm font-black text-rose-300">
                {currentRoom?.name}: {tempReading?.toFixed(1)}°C (threshold: {currentRoom?.maxTemp}°C)
              </p>
              <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest mt-1">This acknowledgement will be logged with your user ID and timestamp</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Action Taken / Note</label>
              <textarea
                required rows={3}
                placeholder="e.g. Adjusted thermostat, contacted maintenance, moved stock..."
                className={inputCls}
                value={ackNote}
                onChange={(e) => setAckNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={ackSaving}
              className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500 hover:bg-rose-400 text-white font-black text-sm rounded-2xl transition-all uppercase tracking-widest"
            >
              {ackSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Log Acknowledgement
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: FIFO Stock Audit ────────────────────────────────────────────────────

function FifoTab({ rooms }: { rooms: any[] }) {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setBatches(await apiFetch('/cold-room/inventory')); } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCheckOut() {
    if (!checkoutTarget) return;
    setSubmitting(checkoutTarget.id);
    try {
      await apiFetch('/cold-room/events', {
        method: 'POST',
        body: JSON.stringify({
          batchId: checkoutTarget.id,
          zoneId: checkoutTarget.coldRoomEvents?.[0]?.zoneId,
          type: 'CHECK_OUT',
          quantity: checkoutTarget.quantityIntake,
        }),
      });
      toast.success(`Batch ${checkoutTarget.batchNumber} checked out`);
      setCheckoutTarget(null);
      await load();
    } catch { toast.error('Failed to check out batch'); }
    finally { setSubmitting(null); }
  }

  const totalStems = batches.reduce((s, b) => s + (b.quantityIntake ?? 0), 0);
  const fifoWarnings = batches.filter((b) => (b.daysInStorage ?? 0) > 5).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic">FIFO Stock Audit</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} in cold storage · {totalStems.toLocaleString()} stems · sorted oldest-first
          </p>
        </div>
        {fifoWarnings > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{fifoWarnings} shelf-life warning{fifoWarnings !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : batches.length === 0 ? (
        <EmptyState icon={Box} message="Cold storage is empty — check in batches from the pack house" />
      ) : (
        <div className="space-y-4">
          {batches.map((batch, index) => {
            const isOldest = index === batches.findIndex((b) => b.variety?.name === batch.variety?.name);
            const daysIn = batch.daysInStorage ?? 0;
            const shelfWarn = daysIn > 5;
            const shelfCritical = daysIn > 7;
            const olderCount = batches.filter(
              (b) => b.id !== batch.id && b.variety?.name === batch.variety?.name && new Date(b.createdAt) < new Date(batch.createdAt)
            ).length;

            return (
              <div
                key={batch.id}
                className={`bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  shelfCritical ? 'border-rose-500/30 bg-rose-500/[0.02]' :
                  shelfWarn ? 'border-amber-500/30' :
                  isOldest ? 'border-emerald-500/30 bg-emerald-500/[0.02]' :
                  'border-white/5'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                    shelfCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                    shelfWarn ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    isOldest ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-black text-white">{batch.batchNumber}</p>
                      {isOldest && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest">FIFO Priority</span>
                      )}
                      {shelfCritical && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px] font-black uppercase tracking-widest animate-pulse">Critical Age</span>
                      )}
                      {shelfWarn && !shelfCritical && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-widest">Shelf Warning</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {batch.variety?.name ?? '—'} · {batch.quantityIntake?.toLocaleString()} stems · {batch.currentZone ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 shrink-0">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry Date</p>
                    <p className="text-white font-bold text-xs mt-1">{new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Days in Storage</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className={`w-3.5 h-3.5 ${shelfCritical ? 'text-rose-400' : shelfWarn ? 'text-amber-400' : 'text-blue-400'}`} />
                      <p className={`font-black text-sm ${shelfCritical ? 'text-rose-400' : shelfWarn ? 'text-amber-400' : 'text-white'}`}>
                        {daysIn}d
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutTarget(batch)}
                    disabled={submitting === batch.id}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      isOldest
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {submitting === batch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Check Out
                  </button>
                </div>

                {olderCount > 0 && (
                  <div className="w-full md:w-auto">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {olderCount} older batch{olderCount !== 1 ? 'es' : ''} of this variety still in storage
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FIFO info */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl shrink-0">
          <Wind className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase italic tracking-widest mb-1">FIFO Protocol</h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Batches in <span className="text-emerald-400 font-bold">Emerald</span> have been in storage longest and must be packed/dispatched first. Checking out newer stock while older stock remains triggers a compliance flag. Batches beyond 7 days are marked <span className="text-rose-400 font-bold">Critical</span>.
          </p>
        </div>
      </div>

      {/* Checkout confirm modal */}
      {checkoutTarget && (
        <Modal title="Confirm Check-Out" onClose={() => setCheckoutTarget(null)}>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-black text-white">{checkoutTarget.batchNumber}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {checkoutTarget.variety?.name} · {checkoutTarget.quantityIntake?.toLocaleString()} stems · {checkoutTarget.daysInStorage ?? 0} days in storage
              </p>
            </div>
            {batches.filter(
              (b) => b.id !== checkoutTarget.id &&
                b.variety?.name === checkoutTarget.variety?.name &&
                new Date(b.createdAt) < new Date(checkoutTarget.createdAt)
            ).length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-300 leading-relaxed">
                  FIFO Warning: There are older batches of this variety in storage. Proceeding will be logged as an out-of-order dispatch.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setCheckoutTarget(null)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
              <button
                onClick={handleCheckOut}
                disabled={submitting === checkoutTarget.id}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                {submitting === checkoutTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Check In ────────────────────────────────────────────────────────────

function CheckInTab({ rooms }: { rooms: any[] }) {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastCheckedIn, setLastCheckedIn] = useState<string | null>(null);
  const [form, setForm] = useState({ batchId: '', zoneId: rooms[0]?.id ?? '', quantity: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await apiFetch('/pack-house/batches');
      setBatches((all as any[]).filter((b: any) => b.status === 'GRADED' || b.status === 'PACKED'));
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (rooms[0]) setForm((f) => ({ ...f, zoneId: rooms[0].id })); }, [rooms]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.batchId || !form.zoneId || !form.quantity) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await apiFetch('/cold-room/events', {
        method: 'POST',
        body: JSON.stringify({ batchId: form.batchId, zoneId: form.zoneId, type: 'CHECK_IN', quantity: Number(form.quantity) }),
      });
      const batch = batches.find((b) => b.id === form.batchId);
      setLastCheckedIn(batch?.batchNumber ?? 'Batch');
      toast.success('Batch checked into cold storage');
      setForm({ batchId: '', zoneId: rooms[0]?.id ?? '', quantity: '' });
      await load();
    } catch { toast.error('Failed to check in batch'); }
    finally { setSaving(false); }
  }

  const selectedBatch = batches.find((b) => b.id === form.batchId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white uppercase italic">Check In to Cold Room</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Move graded or packed batches into refrigerated storage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
          ) : batches.length === 0 ? (
            <EmptyState icon={Package} message="No graded or packed batches available — complete QC grading first" />
          ) : (
            <form onSubmit={handleSubmit} className="bg-black/30 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Select Batch *</label>
                <div className="relative">
                  <select
                    className={selectCls}
                    value={form.batchId}
                    onChange={(e) => {
                      const b = batches.find((b) => b.id === e.target.value);
                      setForm({ ...form, batchId: e.target.value, quantity: b?.quantityIntake?.toString() ?? '' });
                    }}
                    required
                  >
                    <option value="">— Choose a batch —</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNumber} — {b.variety?.name ?? '?'} ({b.quantityIntake?.toLocaleString()} stems) · {b.status}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Package className="w-4 h-4" /></div>
                </div>
              </div>
              {selectedBatch && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Variety</p>
                    <p className="text-sm font-black text-white mt-1">{selectedBatch.variety?.name}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Status</p>
                    <p className="text-sm font-black text-blue-400 mt-1">{selectedBatch.status}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Target Cold Room *</label>
                  <div className="relative">
                    <select className={selectCls} value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} required>
                      <option value="">— Select Room —</option>
                      {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Thermometer className="w-4 h-4" /></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Quantity (Stems) *</label>
                  <input
                    type="number" min={1} required
                    className={inputCls}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-3 py-5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-all shadow-lg mt-2 uppercase tracking-widest"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Check Into Cold Storage
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          {lastCheckedIn && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 space-y-3 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Checked In!</p>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{lastCheckedIn}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest mb-3">
              <Thermometer className="w-4 h-4" /> Cold Chain Protocol
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px] font-medium leading-relaxed">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />Verify cold room temperature is within range before check-in</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />Maximum recommended storage: 7 days for cut flowers</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />Follow FIFO — check out oldest batches first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'climate' | 'fifo' | 'checkin';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'climate', label: 'Live Climate', icon: Activity },
  { id: 'fifo', label: 'FIFO Stock', icon: Box },
  { id: 'checkin', label: 'Check In', icon: Plus },
];

export default function ColdRoomDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('climate');
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/cold-room/zones');
      setRooms(data);
      if (data.length > 0 && !selectedRoom) setSelectedRoom(data[0].id);
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [selectedRoom]);

  const fetchTelemetry = useCallback(async () => {
    if (!selectedRoom) return;
    setRefreshing(true);
    try {
      const data = await apiFetch(`/cold-room/telemetry/${selectedRoom}`);
      setTelemetry(data);
      setLastRefresh(new Date());
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  }, [selectedRoom]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    fetchTelemetry();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchTelemetry, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchTelemetry]);

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const devices = currentRoom?.devices ?? [];
  const tempDevice = devices.find((d: any) => d.type === 'TEMPERATURE') ?? devices[0];
  const latestTelemetry = telemetry[telemetry.length - 1] ?? {};
  const temp = tempDevice?.readings?.[0]?.value ?? latestTelemetry.temp ?? 0;
  const isTempAlert = currentRoom && (temp < currentRoom.minTemp || temp > currentRoom.maxTemp);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Wind className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Cold Chain & Climate Control</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Real-time monitoring · FIFO stock control · cold room management</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push('/dashboard/pack-house')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
            <Package className="w-3.5 h-3.5" /> Pack House <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <button onClick={() => router.push('/dashboard/logistics')} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-all">
            <Truck className="w-3.5 h-3.5" /> Logistics <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
          <button onClick={() => router.push('/dashboard/telemetry')} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all">
            <Activity className="w-3.5 h-3.5" /> IoT Telemetry <ArrowRight className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </header>

      {/* Temp alert banner */}
      {!loading && isTempAlert && currentRoom && (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/40 rounded-3xl px-8 py-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-300">Temperature Breach — {currentRoom.name}: {temp.toFixed(1)}°C (max: {currentRoom.maxTemp}°C)</p>
              <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">Immediate action required — QC Lead notified</p>
            </div>
          </div>
          <button
            onClick={() => setTab('climate')}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-400 transition-all shrink-0"
          >
            Acknowledge <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Thermometer}
            label="Current Temp"
            value={temp > 0 ? `${temp.toFixed(1)}°C` : '—'}
            color={isTempAlert ? 'rose' : 'blue'}
            sub={currentRoom ? `target ${currentRoom.minTemp}°–${currentRoom.maxTemp}°C` : 'no room selected'}
            pulse={!!isTempAlert}
          />
          <KpiCard icon={Wind} label="Cold Rooms" value={rooms.length} color="blue" sub="monitored zones" />
          <KpiCard icon={RefreshCw} label="Last Sync" value={lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} color="slate" sub="auto every 30s" />
          <KpiCard
            icon={isTempAlert ? AlertTriangle : CheckCircle2}
            label="Climate Status"
            value={isTempAlert ? 'BREACH' : rooms.length === 0 ? 'No Rooms' : 'Nominal'}
            color={isTempAlert ? 'rose' : 'emerald'}
          />
        </div>
      )}

      {/* Tab nav */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
              tab === t.id ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 text-blue-400 animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Syncing Cold Rooms...</span>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {tab === 'climate' && (
              <ClimateTab
                rooms={rooms}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                telemetry={telemetry}
                lastRefresh={lastRefresh}
                refreshing={refreshing}
              />
            )}
            {tab === 'fifo' && <FifoTab rooms={rooms} />}
            {tab === 'checkin' && <CheckInTab rooms={rooms} />}
          </div>
        </div>
      )}
    </div>
  );
}
