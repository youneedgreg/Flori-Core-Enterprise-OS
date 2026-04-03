/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Wind, 
  Thermometer, 
  Droplets, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ColdRoom {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  devices: any[];
}

export default function ColdRoomDashboard() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<ColdRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/cold-room/zones`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        if (data.length > 0 && !selectedRoom) setSelectedRoom(data[0].id);
      }
    } catch {
      toast.error('Failed to load cold room data');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  const fetchTelemetry = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/cold-room/telemetry/${selectedRoom}`, { headers });
      if (res.ok) {
        setTelemetry(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch telemetry', e);
    }
  }, [selectedRoom]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const currentRoom = rooms.find(r => r.id === selectedRoom);
  const latestReadings = currentRoom?.devices?.[0]?.readings?.[0] || {};
  
  const temp = latestReadings.value || 0; // Assuming the first device provides temp/hum
  const isTempAlert = currentRoom && (temp < (currentRoom.minTemp || 0) || temp > (currentRoom.maxTemp || 40));

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Wind className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Cold Chain Telemetry</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Real-time climate monitoring and stock auditing.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/dashboard/cold-room/inventory" className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all border border-white/5">
             Stock Audit
          </Link>
          <Link href="/dashboard/pack-house" className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            Move Stock
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-blue-400">
           <Loader2 className="w-12 h-12 animate-spin" />
           <span className="text-[11px] font-black uppercase tracking-[0.4em]">Syncing Cold Rooms...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {rooms.length === 0 && (
               <div className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-white/5 px-6 py-4 rounded-xl border border-white/5">
                 No cold rooms configured. Set zone type to &apos;COLD_ROOM&apos; in settings.
               </div>
            )}
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                  selectedRoom === room.id 
                    ? 'bg-blue-500 text-white border-blue-400 shadow-lg' 
                    : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border transition-all ${isTempAlert ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'border-white/5 shadow-2xl'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temperature</h3>
                  <div className={`p-2 rounded-lg ${isTempAlert ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'}`}>
                    <Thermometer className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-6">
                  <span className={`text-7xl font-black tracking-tighter ${isTempAlert ? 'text-rose-500' : 'text-white'}`}>
                    {temp.toFixed(1)}
                  </span>
                  <span className="text-2xl font-black text-slate-600 mb-2 italic uppercase">°C</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Target Band</span>
                    <span className="text-white">{currentRoom?.minTemp}°C - {currentRoom?.maxTemp}°C</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500/20" style={{ width: '20%' }} />
                    <div className="h-full bg-blue-500" style={{ width: '60%' }} />
                    <div className="h-full bg-rose-500/20" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rel. Humidity</h3>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Droplets className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-7xl font-black tracking-tighter text-white">
                    {latestReadings.sensorType === 'HUMIDITY' ? latestReadings.value : (latestReadings.sensorType === 'TEMPERATURE' ? 92 : '--')}
                  </span>
                  <span className="text-2xl font-black text-slate-600 mb-2 italic uppercase">%</span>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase italic">24h Climate Trend</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High-resolution 5-min tracking</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperature</span>
                    </div>
                  </div>
               </div>

               <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="bucket" 
                      tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="#475569"
                      fontSize={10}
                      fontWeight={900}
                    />
                    <YAxis stroke="#475569" fontSize={10} fontWeight={900} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}
                      itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorTemp)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
               </div>

               {isTempAlert && (
                 <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-4 animate-pulse">
                    <div className="p-3 bg-rose-500 rounded-2xl">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Critical Breach Detected!</h4>
                      <p className="text-xs font-bold text-rose-400">Current temperature ({temp}°C) is above maximum threshold ({currentRoom?.maxTemp}°C). SMS Sent to QC Lead.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
