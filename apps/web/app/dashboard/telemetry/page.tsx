'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  Settings, 
  Radio, 
  TrendingUp,
  Loader2,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { 
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
        const latest: { deviceId: string; deviceName: string; type: string; zone: string; latestValue: number; unit: string }[] = await res.json();
        const initialStates: Record<string, DeviceState> = {};
        
        latest.forEach((d) => {
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
    return () => { 
      if (socket) {
        socket.disconnect(); 
      }
    };
  }, [init, socket]);

  const deviceList = useMemo(() => Object.values(devices), [devices]);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-green/10 border border-brand-green/20 animate-pulse">
              <Activity className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Telemetry</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Live time-series data from your production zones and cold chain logistics. Monitoring 24/7 reliability.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
            socket?.connected ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-brand-green animate-ping' : 'bg-rose-500'}`} />
            {socket?.connected ? 'Live Stream Active' : 'Connecting to Core...'}
          </div>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading ? (
         <div className="py-20 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-brand-green mx-auto mb-6" />
           <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase animate-pulse">Synchronizing with Sensors...</p>
         </div>
      ) : deviceList.length === 0 ? (
         <div className="bg-white/5 backdrop-blur-3xl p-20 rounded-[2.5rem] border border-white/5 text-center shadow-2xl">
           <Radio className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-20" />
           <h3 className="text-xl font-black text-white mb-2">No Active Telemetry Detected</h3>
           <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">Please ensure your IoT devices are registered in their respective Farm Zones.</p>
           <Link href="/dashboard/zones" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
              Setup Zones
           </Link>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {deviceList.map((device) => (
            <div key={device.id} className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-brand-green/20 transition-all">
              {/* Device Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{device.zone}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">{device.type}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{device.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-white group-hover:text-brand-green transition-colors tracking-tighter">
                    {device.currentValue.toFixed(1)}<span className="text-slate-500 text-xl ml-1 font-bold">{device.unit}</span>
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-black text-brand-green uppercase tracking-widest">
                    <TrendingUp className="w-3 h-3" />
                    STABLE
                  </div>
                </div>
              </div>

              {/* Main Insight Chart */}
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={device.history}>
                    <defs>
                      <linearGradient id={`grad-${device.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={device.type === 'TEMPERATURE' ? '#3b82f6' : '#10b981'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={device.type === 'TEMPERATURE' ? '#3b82f6' : '#10b981'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
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
                        backgroundColor: '#050505', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'black',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
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
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-[10px] font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                     <Zap className="w-3 h-3 text-brand-green" />
                     REALTIME
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">P95 Variance</p>
                   <p className="text-[10px] font-black text-white uppercase tracking-wider">±0.2{device.unit}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Sync</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">JUST NOW</p>
                 </div>
              </div>

              {/* Subtle Glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-green/5 blur-3xl rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
