/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NotificationFeed from '../../components/dashboard/NotificationFeed';
import { 
  Users, 
  Package, 
  Search, 
  Clock, 
  TrendingUp,
  Droplets,
  Sprout,
  DollarSign,
  Zap,
  Activity,
  ShoppingCart,
  Banknote,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { logout, decodeJWT, isTokenExpired } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ActivityLog {
  id: number;
  type: string;
  message: string;
  time: string;
}

export default function GoldAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Mock live data for the dense dashboard layout
  const [liveStats] = useState({
    activeCycles: 42,
    dailyStems: 125000,
    activeStaff: 318,
    pendingOrders: 14,
    revenueMonth: 4200000,
    telemetryStatus: 'STABLE',
    activities: [
      { id: 1, type: 'PRODUCTION', message: 'Cycle ROS-04 (Athena) marked as HARVESTING', time: '2m ago' },
      { id: 2, type: 'SALES', message: 'New order #ORD-899 received from FloraHolland', time: '15m ago' },
      { id: 3, type: 'HR', message: 'Shift A attendance finalised (142/150 present)', time: '1h ago' },
      { id: 4, type: 'TELEMETRY', message: 'Zone 3 humidity dropped to 62%', time: '2h ago' },
      { id: 5, type: 'PROCUREMENT', message: 'PO #PO-102 approved for fertilizer delivery', time: '3h ago' },
    ]
  });

  useEffect(() => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token || isTokenExpired(token)) {
      logout();
      return;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload) throw new Error('Invalid token');
      setUser(payload);
      setLoading(false);
    } catch {
      logout();
    }
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-40 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green border-b-2"></div>
        <p className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em] animate-pulse">Initialising Flori-Core OS...</p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const MODULES = [
    { id: 'production', name: 'Production', icon: Sprout, desc: 'Crop cycles & forecasting', link: '/dashboard/production', color: 'emerald' },
    { id: 'inventory', name: 'Inventory Hub', icon: Package, desc: 'ATP, Packhouse & Storage', link: '/dashboard/inventory', color: 'blue' },
    { id: 'sales', name: 'Sales & Orders', icon: ShoppingCart, desc: 'CRM & Fulfillment pipeline', link: '/dashboard/sales', color: 'cyan' },
    { id: 'team', name: 'Farm Workforce', icon: Users, desc: 'HR, Attendance & Shifts', link: '/dashboard/team', color: 'purple' },
    { id: 'procurement', name: 'Procurement', icon: Banknote, desc: 'Vendors, PRs & POs', link: '/dashboard/procurement', color: 'amber' },
    { id: 'telemetry', name: 'IoT Telemetry', icon: Activity, desc: 'Real-time sensors & probes', link: '/dashboard/telemetry', color: 'rose' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-brand-green/10 border border-brand-green/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
               <Zap className="w-5 h-5 text-brand-green" />
             </div>
             <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
               {getGreeting()}, <span className="text-brand-green">{user.email.split('@')[0]}</span>
             </h1>
          </div>
          <p className="text-slate-500 font-black tracking-widest text-[10px] uppercase">Enterprise Command Center · Flori-Core OS v1.2.4</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-green transition-colors" />
            <input 
              type="text" 
              placeholder="GLOBAL SEARCH (⌘K)" 
              className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-[10px] uppercase tracking-widest focus:outline-none focus:border-brand-green/50 transition-all w-64 backdrop-blur-md text-white font-black placeholder:text-slate-600"
            />
          </div>
        </div>
      </header>

      {/* ── TOP KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl">
           <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
             <Sprout className="w-16 h-16 text-emerald-500" />
           </div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Production Output
           </p>
           <h4 className="text-3xl font-black text-white mb-1 tracking-tighter">{liveStats.dailyStems.toLocaleString()}</h4>
           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Stems / Day Projected</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl">
           <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
             <ShoppingCart className="w-16 h-16 text-blue-500" />
           </div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Pipeline & Sales
           </p>
           <h4 className="text-3xl font-black text-white mb-1 tracking-tighter">{liveStats.pendingOrders}</h4>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pending Dispatches</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-xl">
           <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
             <Banknote className="w-16 h-16 text-amber-500" />
           </div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Financial Flow
           </p>
           <h4 className="text-3xl font-black text-white mb-1 tracking-tighter"><span className="text-lg">KES</span> {(liveStats.revenueMonth / 1000).toFixed(0)}k</h4>
           <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Revenue (MTD)</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-xl">
           <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
             <Users className="w-16 h-16 text-purple-500" />
           </div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Active Workforce
           </p>
           <h4 className="text-3xl font-black text-white mb-1 tracking-tighter">{liveStats.activeStaff}</h4>
           <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Clocked In Today</p>
        </div>
      </div>

      {/* ── MAIN LAYOUT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Main Matrix & Activity) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Actions Bar */}
          <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar">
            {[
              { label: 'Start Crop Cycle', icon: Sprout, link: '/dashboard/production' },
              { label: 'Receive GRN', icon: Package, link: '/dashboard/procurement' },
              { label: 'New Sale Order', icon: ShoppingCart, link: '/dashboard/sales' },
              { label: 'Log Audit/Spray', icon: Droplets, link: '/dashboard/compliance' },
            ].map(action => (
              <button 
                key={action.label}
                onClick={() => router.push(action.link)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-brand-green/40 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
              >
                <action.icon className="w-4 h-4 text-brand-green" />
                {action.label}
              </button>
            ))}
          </div>

          {/* Module Navigation Matrix */}
          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="p-8 border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Module Navigation Matrix</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-x divide-y divide-white/5 relative z-10">
               {MODULES.map((mod, i) => (
                 <div 
                   key={mod.id}
                   onClick={() => router.push(mod.link)}
                   className={`p-8 hover:bg-white/[0.02] cursor-pointer transition-colors group ${i < 3 ? 'border-t-0' : 'border-t border-white/5'}`}
                 >
                   <div className={`w-12 h-12 rounded-2xl bg-${mod.color}-500/10 flex items-center justify-center border border-${mod.color}-500/20 mb-5 group-hover:scale-110 transition-transform`}>
                     <mod.icon className={`w-6 h-6 text-${mod.color}-400`} />
                   </div>
                   <h4 className={`text-sm font-black text-white uppercase tracking-widest mb-1 group-hover:text-${mod.color}-400 transition-colors`}>{mod.name}</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{mod.desc}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
                <Clock className="w-5 h-5 text-brand-green" />
                Global Audit Stream
              </h3>
              <button 
                onClick={() => router.push('/dashboard/audit-logs')}
                className="text-[10px] font-black text-brand-green hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                View Full Audit <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-5">
              {liveStats.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-150 transition-all flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-300 text-xs font-black leading-relaxed group-hover:text-white transition-colors">{activity.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-black text-brand-green uppercase tracking-widest">{activity.type}</span>
                      <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Right Column (Live Feed & Telemetry Overview) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Telemetry Snapshot */}
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full" />
            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest mb-6">
              <Activity className="w-4 h-4 text-rose-500" />
              Telemetry Pulse
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cold Room 1</p>
                  <p className="text-white font-black text-lg">2.4°C</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Stable
                  </span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Zone B Moisture</p>
                  <p className="text-white font-black text-lg">68%</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Warning
                  </span>
                </div>
              </div>

              <button 
                onClick={() => router.push('/dashboard/telemetry')}
                className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Launch IoT Console
              </button>
            </div>
          </div>

          <div className="h-[500px]">
             <NotificationFeed tenantId={user.tenantId} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
