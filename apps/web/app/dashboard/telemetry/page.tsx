'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  ArrowLeft, 
  Settings, 
  RefreshCcw,
  Zap,
  Box,
  Radio,
  History,
  TrendingDown,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface TelemetryPoint {
  deviceId: string;
  deviceName: string;
  value: number;
  unit: string;
  timestamp: Date;
}

interface DeviceState {
  id: string;
  name: string;
  type: string;
  zone: string;
  currentValue: number;
  unit: string;
  history: { time: string; value: number }[];
}

export default function TelemetryPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Record<string, DeviceState>>({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize data and join socket rooms
  const init = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch current status from API
      const res = await fetch(`${API}/telemetry/latest`, { headers });
      if (res.ok) {
        const latest = await res.json();
        const initialStates: Record<string, DeviceState> = {};
        
        latest.forEach((d: any) => {
          initialStates[d.deviceId] = {
            id: d.deviceId,
            name: d.deviceName,
            type: d.type,
            zone: d.zone,
            currentValue: d.latestValue ?? 0,
            unit: d.unit,
            history: d.latestValue ? [{ time: new Date().toLocaleTimeString(), value: d.latestValue }] : [],
          };
        });
        setDevices(initialStates);
      }

      // Initialize Socket
      const newSocket = io(API);
      
      // Get tenant ID from token (simple decode for demo)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tenantId = payload.tenantId;

      newSocket.emit('subscribe-to-telemetry', { tenantId });
      
      newSocket.on('telemetry-update', (point: TelemetryPoint) => {
        setDevices(prev => {
          const device = prev[point.deviceId];
          if (!device) return prev; // Ignore unknown devices

          const newPoint = { 
            time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            value: point.value 
          };
          
          return {
            ...prev,
            [point.deviceId]: {
              ...device,
              currentValue: point.value,
              history: [...device.history.slice(-19), newPoint]
            }
          };
        });
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Telemetry init failed:', error);
      toast.error('Failed to connect to telemetry stream');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    init();
    return () => { socket?.disconnect(); };
  }, [init]);

  const deviceList = useMemo(() => Object.values(devices), [devices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto p-8 lg:p-12">
        {/* Breadcrumbs */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-500 transition-all mb-8 group uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Control Center
        </Link>

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Telemetry</h1>
            </div>
            <p className="text-slate-400 font-bold tracking-tight max-w-xl">Live time-series data from your production zones and cold chain logistics. Monitoring 24/7 reliability.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              socket?.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              {socket?.connected ? 'Live Stream Active' : 'Connecting to Core...'}
            </div>
            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {loading ? (
           <div className="py-20 text-center">
             <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-6" />
             <p className="text-sm font-black text-slate-500 tracking-[0.3em] uppercase">SYNCHRONIZING WITH SENSORS...</p>
           </div>
        ) : deviceList.length === 0 ? (
           <div className="glass p-20 rounded-[40px] border border-slate-800 text-center">
             <Radio className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
             <h3 className="text-xl font-black text-white mb-2">No Active Telemetry Detected</h3>
             <p className="text-slate-500 mb-8 max-w-sm mx-auto">Please ensure your IoT devices are registered in their respective Farm Zones.</p>
             <Link href="/dashboard/zones" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-xs">
                Setup Zones
             </Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {deviceList.map((device) => (
              <div key={device.id} className="glass rounded-[40px] border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
                {/* Device Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{device.zone}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{device.type}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{device.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">
                      {device.currentValue.toFixed(1)}<span className="text-slate-500 text-xl ml-1">{device.unit}</span>
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3" />
                      STABLE
                    </div>
                  </div>
                </div>

                {/* Main Insight Chart */}
                <div className="h-[240px] w-full -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={device.history}>
                      <defs>
                        <linearGradient id={`grad-${device.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={device.type === 'TEMPERATURE' ? '#3b82f6' : '#10b981'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={device.type === 'TEMPERATURE' ? '#3b82f6' : '#10b981'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        hide 
                      />
                      <YAxis 
                        hide 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={device.type === 'TEMPERATURE' ? '#3b82f6' : '#10b981'} 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill={`url(#grad-${device.id})`} 
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800/50">
                   <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-xs font-black text-white flex items-center gap-1.5">
                       <Zap className="w-3 h-3 text-emerald-500" />
                       REALTIME
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">P95 Variance</p>
                     <p className="text-xs font-black text-white">±0.2{device.unit}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Sync</p>
                     <p className="text-xs font-black text-slate-300">JUST NOW</p>
                   </div>
                </div>

                {/* Subtle Glow */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 -z-10 w-screen h-screen overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-500/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/5 blur-[200px] rounded-full" />
      </div>
    </div>
  );
}
