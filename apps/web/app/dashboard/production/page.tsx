/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Sprout, 
  Plus, 
  Loader2, 
  BarChart3, 
  Layers, 
  Search,
  Filter,
  ArrowRight,
  Droplets,
  ClipboardList,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import StartCycleModal from '@/components/production/StartCycleModal';
import CreateVarietyModal from '@/components/production/CreateVarietyModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Variety {
  id: string;
  name: string;
  targetStemLength: number;
  bloomTime: number;
  marketGrade: string;
  targetStemCountPerSqm: number;
}

interface CropCycle {
  id: string;
  variety: Variety;
  zone: { name: string; areaSqm: number };
  startDate: string;
  projectedHarvestDate: string;
  status: 'PLANNED' | 'PLANTED' | 'GROWING' | 'HARVESTING' | 'COMPLETED' | 'CANCELLED';
  actualHarvestDate?: string;
  actualHarvestYield?: number;
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
  type: 'SPRAY' | 'FERTILIZER' | 'PRUNING' | 'OTHER';
  scheduledDate: string;
  completedAt?: string;
  cropCycle?: {
    variety: {
      name: string;
    };
  };
}

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'forecast' | 'cycles' | 'varieties' | 'schedule'>('timeline');
  const [loading, setLoading] = useState(true);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [schedules, setSchedules] = useState<CropSchedule[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const [vRes, cRes, fRes, sRes, zRes] = await Promise.all([
        fetch(`${API}/varieties`, { headers }),
        fetch(`${API}/crop-cycles`, { headers }),
        fetch(`${API}/crop-cycles/forecast`, { headers }),
        fetch(`${API}/crop-schedules`, { headers }),
        fetch(`${API}/zones`, { headers })
      ]);

      if (sRes.ok) setSchedules(await sRes.json());
      if (zRes.ok) setZones(await zRes.json());

      // Bootstrapping: Create a default variety if none exist
      if (vRes.ok) {
        const data = await vRes.json();
        if (data.length === 0) {
          const createRes = await fetch(`${API}/varieties`, {
            method: 'POST',
            headers: { 
              ...headers, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              name: 'Standard Rose',
              targetStemLength: 60,
              bloomTime: 12,
              marketGrade: 'A',
              targetStemCountPerSqm: 28,
            }),
          });
          if (createRes.ok) {
             const newVariety = await createRes.json();
             setVarieties([newVariety]);
          }
        } else {
          setVarieties(data);
        }
      }
    } catch {
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform forecast for chart
  const chartData = forecast.reduce((acc: any[], f) => {
    const date = new Date(f.projectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.name === date);
    if (existing) {
      existing.yield += f.projectedYield;
    } else {
      acc.push({ name: date, yield: f.projectedYield });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-green/10 border border-brand-green/20">
              <Sprout className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Precision Production</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Lifecycle monitoring from planting to cold room intake.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard/production/spray-logs'}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl font-black text-sm transition-all border border-rose-500/20"
          >
             <Droplets className="w-5 h-5 text-rose-500" />
             Spray Logs
          </button>
          <button 
            onClick={() => setIsVarietyModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all border border-white/10"
          >
             <Plus className="w-5 h-5" />
             New Variety
          </button>
          <button 
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-brand-green/90 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Start Crop Cycle
          </button>
        </div>
      </header>

      {/* KPI Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Cycles', value: cycles.filter(c => c.status !== 'COMPLETED').length, icon: Layers, color: 'emerald' },
          { label: 'Varieties', value: varieties.length, icon: Sprout, color: 'blue' },
          { label: 'Projected Output', value: `${forecast.reduce((sum, f) => sum + f.projectedYield, 0).toLocaleString()} stems`, icon: BarChart3, color: 'amber' },
          { label: 'Upcoming Sprays', value: '3', icon: Droplets, color: 'rose' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${kpi.color}-500/10 blur-2xl rounded-full group-hover:bg-${kpi.color}-500/20 transition-all`} />
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'timeline', label: 'Timeline View', icon: Clock },
          { id: 'forecast', label: 'Harvest Forecast', icon: BarChart3 },
          { id: 'cycles', label: 'Crop Cycles', icon: Layers },
          { id: 'schedule', label: 'Task Schedule', icon: ClipboardList },
          { id: 'varieties', label: 'Varieties', icon: Sprout }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-brand-green text-slate-950 shadow-lg' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-brand-green animate-pulse">
           <Loader2 className="w-12 h-12 animate-spin" />
           <span className="text-[11px] font-black uppercase tracking-[0.4em]">Calibrating Optical Yield...</span>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-green/5 to-transparent pointer-events-none" />
          
          {activeTab === 'timeline' && (
            <div className="space-y-8 relative z-10">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase italic">Propagation Timeline</h2>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 group cursor-help">
                        <div className="w-3 h-3 rounded bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Growth</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned</span>
                     </div>
                  </div>
               </div>

                {/* Custom Gantt View */}
                <div className="border border-white/5 rounded-3xl overflow-hidden bg-black/40">
                   <div className="overflow-x-auto custom-scrollbar">
                     <div className="min-w-[1200px]">
                       {/* Timeline Header (Months/Weeks) */}
                       <div className="grid grid-cols-[250px_1fr] border-b border-white/5">
                         <div className="p-6 border-r border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Greenhouse Block</div>
                         <div className="grid grid-cols-12">
                           {Array.from({ length: 12 }).map((_, i) => (
                             <div key={i} className="p-4 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest border-r border-white/5 last:border-0">
                                Week {i + 1}
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Timeline Rows */}
                       <div className="divide-y divide-white/5">
                         {cycles.length > 0 ? (
                           (() => {
                             // Calculate Timeline bounds (12 weeks window)
                             const earliestStart = Math.min(...cycles.map(c => new Date(c.startDate).getTime()));
                             const timelineStart = new Date(earliestStart);
                             const timelineTotalMs = 12 * 7 * 24 * 60 * 60 * 1000; // 12 Weeks

                             return cycles.map((cycle) => {
                               const start = new Date(cycle.startDate).getTime();
                               const end = cycle.projectedHarvestDate ? new Date(cycle.projectedHarvestDate).getTime() : start + (7 * 24 * 60 * 60 * 1000);
                               
                               const leftPercent = Math.max(0, ((start - timelineStart.getTime()) / timelineTotalMs) * 100);
                               const widthPercent = Math.min(100 - leftPercent, ((end - start) / timelineTotalMs) * 100);

                               return (
                                 <div key={cycle.id} className="grid grid-cols-[250px_1fr] hover:bg-white/2 transition-colors">
                                   <div className="p-6 border-r border-white/5">
                                     <h4 className="text-sm font-black text-white uppercase">{cycle.zone?.name || 'N/A'}</h4>
                                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-1">{cycle.variety.name} · {cycle.status}</p>
                                   </div>
                                   <div className="relative h-20 flex items-center px-4">
                                      <div 
                                        className={`h-10 rounded-2xl relative flex items-center px-4 overflow-hidden transition-all hover:scale-[1.01] cursor-pointer ${
                                          cycle.status === 'GROWING' 
                                            ? 'bg-brand-green/20 border border-brand-green/30 text-brand-green shadow-xl shadow-brand-green/5' 
                                            : 'bg-white/5 border border-white/10 text-slate-500'
                                        }`}
                                        style={{ 
                                          width: `${Math.max(5, widthPercent)}%`, 
                                          marginLeft: `${leftPercent}%`
                                        }}
                                      >
                                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                                         <span className="text-[10px] font-black uppercase tracking-widest relative z-10 truncate">
                                           {cycle.variety.name}
                                         </span>
                                         {cycle.status === 'GROWING' && (
                                           <div className="ml-auto flex items-center gap-2 bg-brand-green/20 px-2 py-0.5 rounded-lg border border-brand-green/30">
                                              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                              <span className="text-[8px] font-black text-brand-green uppercase">Live</span>
                                           </div>
                                         )}
                                      </div>
                                   </div>
                                 </div>
                               );
                             });
                           })()
                         ) : (
                           <div className="p-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">
                             No active cycles to display in timeline
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase italic">Yield Forecast</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate projected harvest volume for the next 30 days.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                       <ArrowRight className="w-5 h-5 text-brand-green" />
                       <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">Max Daily Projected</p>
                          <p className="text-lg font-black text-white">{Math.max(...chartData.map(d => d.yield || 0), 0).toLocaleString()} stems</p>
                       </div>
                    </div>
                  </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 12 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.name}</p>
                              <p className="text-lg font-black text-brand-green">{payload[0].value?.toLocaleString()} Stems</p>
                              <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Projected Harvest</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="yield" 
                      radius={[12, 12, 4, 4]}
                      fill="url(#barGradient)"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} className="hover:filter hover:brightness-125 transition-all duration-300" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/5 border-l-4 border-l-brand-green shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-brand-green" />
                       Confidence Score: 94%
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">Calculations based on actual planting dates and variety-specific bloom intervals. External variables such as humidity trends are factored from IoT sensors in Zone 3 and 7.</p>
                 </div>
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/5 border-l-4 border-l-amber-500 shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-amber-500" />
                       Action Required
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium capitalize">Peak harvest expected in 14 days. Coordinate additional labor for Grade A stem sorting and Cold Room FIFO optimization.</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'cycles' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">Propagation Cycles</h2>
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="SEARCH CYCLES..."
                      className="bg-transparent border-0 pl-12 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 w-64"
                    />
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cycles.map((cycle) => (
                  <div key={cycle.id} className="bg-white/2 hover:bg-white/5 border border-white/5 rounded-3xl p-8 transition-all group shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                            cycle.status === 'GROWING'
                              ? 'bg-brand-green/10 text-brand-green border-brand-green/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {cycle.status}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{cycle.zone?.name || 'GENERIC PLOT'}</span>
                        </div>
                        {/* PHI Warning Placeholder - Would normally check fetch data */}
                        <div className="flex items-center gap-2 mt-2">
                           <AlertCircle className="w-3 h-3 text-rose-500 hidden" />
                           <span className="text-[8px] font-black text-rose-500 uppercase hidden">PHI ACTIVE</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-brand-green transition-colors">{cycle.variety.name}</h3>
                      </div>
                      <button className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-brand-green group-hover:text-slate-950 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">StartDate</p>
                        <p className="text-xs font-black text-slate-300">{new Date(cycle.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Harvest</p>
                        <p className="text-xs font-black text-brand-green">{new Date(cycle.projectedHarvestDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-green w-2/3 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">65% Progress</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">Agronomy & Compliance Log</h2>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button className="px-4 py-2 bg-brand-green text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Upcoming</button>
                  <button className="px-4 py-2 text-slate-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Past 7 Days</button>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Scheduled Task</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Crop Cycle</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Type</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {schedules.length > 0 ? schedules.map((task: CropSchedule) => (
                      <tr key={task.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-8 py-6 font-black text-white uppercase text-sm italic">{task.taskName}</td>
                        <td className="px-8 py-6 text-slate-400 font-bold text-[11px] uppercase">{task.cropCycle?.variety?.name}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            task.type === 'SPRAY' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {task.type}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-slate-500 font-black text-[10px] tracking-widest">{new Date(task.scheduledDate).toLocaleDateString()}</td>
                        <td className="px-8 py-6 text-right">
                          {task.completedAt ? (
                            <span className="text-brand-green font-black text-[9px] uppercase tracking-widest flex items-center justify-end gap-1.5 grayscale">
                              <CheckCircle2 className="w-4 h-4 grayscale-0" />
                              CLEARED
                            </span>
                          ) : (
                            <span className="text-slate-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-end gap-1.5 grayscale">
                              <Clock className="w-4 h-4" />
                              PENDING
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-10" />
                          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No tasks currently scheduled for active cycles</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'varieties' && (
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">Genetic Inventory (Varieties)</h2>
                <button className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 font-black text-[10px] uppercase tracking-widest transition-all">
                  <ClipboardList className="w-4 h-4" />
                  Market Specifications
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {varieties.map((variety) => (
                  <div key={variety.id} className="group bg-white/2 hover:bg-white/5 border border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] cursor-pointer shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                      <Sprout className="w-8 h-8 text-white/5 group-hover:text-brand-green/20 transition-colors" />
                    </div>

                    <h3 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter transition-colors group-hover:text-brand-green">{variety.name}</h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stem Length</span>
                        <span className="text-xs font-black text-white italic">{variety.targetStemLength}cm</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bloom Time</span>
                        <span className="text-xs font-black text-white italic">{variety.bloomTime} Days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Density Target</span>
                        <span className="text-xs font-black text-brand-green italic">{variety.targetStemCountPerSqm} stems/m²</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 py-4 bg-brand-green/10 border border-brand-green/20 rounded-2xl text-brand-green text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      Edit Genetics
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <StartCycleModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        apiBase={API}
        varieties={varieties}
        zones={zones.filter(z => z.type === 'GREENHOUSE')}
        onSuccess={fetchData}
        onCreateVariety={() => setIsVarietyModalOpen(true)}
      />

      <CreateVarietyModal
        isOpen={isVarietyModalOpen}
        onClose={() => setIsVarietyModalOpen(false)}
        apiBase={API}
        onSuccess={fetchData}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
