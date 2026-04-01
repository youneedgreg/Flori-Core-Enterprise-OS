/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Zap, 
  Activity, 
  Plus, 
  Bell, 
  Settings2, 
  AlertTriangle,
  Pause,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import RuleBuilderModal from '@/components/production/RuleBuilderModal';
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

interface TelemetryUpdate {
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export default function IotDashboard() {
  const [readings, setReadings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const [readingsRes, alertsRes, rulesRes] = await Promise.all([
        fetch(`${API}/telemetry/latest`, { headers }),
        fetch(`${API}/alerts`, { headers }),
        fetch(`${API}/automation-rules`, { headers })
      ]);

      if (readingsRes.ok) setReadings(await readingsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRules = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/automation-rules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRules(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    const newSocket = io(API);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // In a real app we'd decode token for tenantId
      newSocket.emit('subscribe-to-telemetry', { tenantId: 'default-tenant' });
    });

    newSocket.on('telemetry-update', (update: TelemetryUpdate) => {
      setReadings(prev => {
        const index = prev.findIndex(r => r.deviceId === update.deviceId && r.sensorType === update.sensorType);
        if (index > -1) {
          const next = [...prev];
          next[index] = { ...next[index], latestValue: update.value, timestamp: update.timestamp };
          return next;
        }
        return [...prev, { ...update, latestValue: update.value }];
      });
    });

    return () => {
      newSocket.close();
    };
  }, [fetchInitialData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-dark gap-4">
        <RefreshCw className="w-12 h-12 text-brand-green animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing IoT Core</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            <Zap className="w-10 h-10 text-brand-green fill-brand-green/20" />
            Smart IoT Pulse
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            Real-time Soil & Environment Telemetry
            <span className={`flex items-center gap-1 text-[10px] ${socket ? 'text-brand-green' : 'text-slate-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${socket ? 'bg-brand-green animate-pulse' : 'bg-slate-600'}`} />
              {socket ? 'LIVE CONNECTED' : 'DISCONNECTED'}
            </span>
          </p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-xs hover:text-white transition-all">
             <Filter className="w-4 h-4" />
             Filter Blocks
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-brand-green text-slate-950 rounded-2xl font-black uppercase text-xs shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:scale-105 transition-all">
             <Plus className="w-4 h-4" />
             Add Device
           </button>
        </div>
      </div>

      {/* Grid of Sensortile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { type: 'MOISTURE', label: 'Soil Moisture', value: 42.5, unit: '%', color: 'blue', icon: Droplets },
          { type: 'TEMPERATURE', label: 'Ambient Temp', value: 24.2, unit: '°C', color: 'orange', icon: Thermometer },
          { type: 'EC', label: 'EC Level', value: 1.8, unit: 'mS/cm', color: 'emerald', icon: Activity },
          { type: 'PH', label: 'Soil pH', value: 6.5, unit: 'pH', color: 'purple', icon: Zap }
        ].map((sensor) => {
          const reading = readings.find(r => r.sensorType === sensor.type);
          const liveValue = reading ? (reading.latestValue ?? reading.value) : sensor.value;
          
          return (
          <motion.div 
            key={sensor.type}
            whileHover={{ y: -5 }}
            className="bg-brand-dark/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] overflow-hidden relative group"
          >
             <div className={`absolute top-0 right-0 w-32 h-32 bg-${sensor.color}-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
             
             <div className="flex justify-between items-start mb-6">
                <div className={`p-4 bg-${sensor.color}-500/10 rounded-2xl`}>
                   <sensor.icon className={`w-6 h-6 text-${sensor.color}-500`} />
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Status</span>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${reading ? 'bg-brand-green animate-pulse' : 'bg-slate-600'}`} />
                      <span className={`text-[10px] font-black uppercase ${reading ? 'text-brand-green' : 'text-slate-600'}`}>
                        {reading ? 'Online' : 'Offline'}
                      </span>
                   </div>
                </div>
             </div>

             <h3 className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">{sensor.label}</h3>
             <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-white italic">{liveValue}</span>
                <span className="text-lg font-black text-slate-700 uppercase italic mb-1">{sensor.unit}</span>
             </div>

             <div className="h-16 w-full opacity-30">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                     { v: 40 }, { v: 45 }, { v: 42 }, { v: 48 }, { v: 44 }, { v: Number(liveValue) }
                   ]}>
                     <Area type="monotone" dataKey="v" stroke={`#${sensor.color === 'blue' ? '3b82f6' : '10b981'}`} fill={`#${sensor.color === 'blue' ? '3b82f6' : '10b981'}`} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </motion.div>
        )})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Graph */}
        <div className="lg:col-span-2 bg-brand-dark/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Live Telemetry Stream</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aggregate sensor performance across all zones</p>
              </div>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                 <button className="px-4 py-1.5 bg-brand-green text-slate-950 text-[10px] font-black uppercase rounded-lg">1 Hour</button>
                 <button className="px-4 py-1.5 text-slate-500 text-[10px] font-black uppercase rounded-lg">6 Hours</button>
              </div>
           </div>
           
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { time: '10:00', moisture: 42, temp: 24, ec: 1.5 },
                  { time: '10:05', moisture: 43, temp: 24.2, ec: 1.6 },
                  { time: '10:10', moisture: 41, temp: 24.5, ec: 1.6 },
                  { time: '10:15', moisture: 45, temp: 24.1, ec: 1.7 },
                  { time: '10:20', moisture: 44, temp: 23.9, ec: 1.8 },
                  { time: '10:25', moisture: 42, temp: 24.0, ec: 1.8 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Line type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={4} dot={false} animationDuration={300} />
                  <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={4} dot={false} animationDuration={300} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Rule Builder / Active Rules */}
        <div className="bg-brand-dark/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Automation Rules</h2>
              <button className="p-2 bg-brand-green/20 text-brand-green rounded-xl border border-brand-green/30">
                 <Settings2 className="w-5 h-5" />
              </button>
           </div>

            <div className="space-y-4 flex-1">
               {(rules.length > 0 ? rules : [
                 { name: 'Low Moisture Pump', condition: 'Moisture < 35%', action: 'Irrigate Block A', sensor: 'Droplets' },
                 { name: 'Excessive Heat Alert', condition: 'Temp > 32°C', action: 'Notify Supervisor', sensor: 'Thermometer' },
                 { name: 'PH Neutralizer', condition: 'pH < 5.8', action: 'Inject Lime Slurry', sensor: 'Zap' }
               ]).map((rule, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.07] transition-all group">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-brand-green/10 rounded-lg">
                            <Activity className="w-4 h-4 text-brand-green" />
                         </div>
                         <p className="text-sm font-black text-white uppercase italic">{rule.name}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 hover:text-brand-green"><Pause className="w-4 h-4" /></button>
                         <button className="p-1.5 hover:text-rose-500"><Plus className="w-4 h-4 rotate-45" /></button>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div>
                         <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Trigger</span>
                         <span className="text-[10px] font-bold text-white uppercase">{rule.condition}</span>
                      </div>
                      <div className="flex-1">
                         <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Action</span>
                         <span className="text-[10px] font-bold text-brand-green uppercase">{rule.action}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <button 
             onClick={() => setIsRuleModalOpen(true)}
             className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
           >
              <Plus className="w-4 h-4" />
              Define New Automation
           </button>
        </div>
      </div>

      <RuleBuilderModal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)} 
        onRuleCreated={refreshRules} 
      />

      {/* Active Alerts Feed */}
      <div className="bg-brand-dark/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
               <Bell className="w-6 h-6 text-rose-500 animate-bounce" />
               Threshold Breach events
            </h2>
            <button className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Clear All</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(alerts.length > 0 ? alerts : [
               { zone: 'Block A-1', msg: 'Moisture dropped below 30% threshold', time: '2m ago', severity: 'CRITICAL' },
               { zone: 'Block C-4', msg: 'EC Level exceeding variety target', time: '15m ago', severity: 'HIGH' },
               { zone: 'Nursery', msg: 'Temperature spike detected (34.2°C)', time: '1h ago', severity: 'MEDIUM' }
            ]).map((alert, i) => (
              <div key={i} className={`p-6 border rounded-[2rem] flex items-start gap-4 ${
                alert.severity === 'CRITICAL' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/5 border-white/5'
              }`}>
                 <div className={`p-3 rounded-2xl ${
                   alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : 'bg-orange-500/20 text-orange-500'
                 }`}>
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-[10px] font-black text-slate-500 uppercase">{alert.zone}</span>
                       <span className="text-[9px] font-bold text-slate-600 uppercase">{alert.time}</span>
                    </div>
                    <p className="text-xs font-black text-white uppercase leading-relaxed mb-3">{alert.msg}</p>
                    <button className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                      alert.severity === 'CRITICAL' ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-white/10 text-slate-400 hover:bg-white hover:text-black'
                    } transition-all`}>
                       Dismiss Incident
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
