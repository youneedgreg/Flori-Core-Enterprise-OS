/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KPICard from '../../components/dashboard/KPICard';
import NotificationFeed from '../../components/dashboard/NotificationFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import { LayoutDashboard, Users, Map, Package, Settings, LogOut, Search, Clock } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface KPI {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  color: any;
}

interface Activity {
  id: number;
  type: string;
  message: string;
  time: string;
}

interface DashboardStats {
  kpis: KPI[];
  recentActivity: Activity[];
}

export default function GoldAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      
      fetch(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard stats');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white">
            Good morning, <span className="text-brand-green">{user.email.split('@')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Here&apos;s what&apos;s happening at your farm today.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-green transition-colors" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-green/30 focus:ring-4 focus:ring-brand-green/5 transition-all w-64 backdrop-blur-md text-white font-bold placeholder:text-slate-600"
            />
          </div>
        </div>
      </header>

      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {(stats?.kpis || []).map((kpi) => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Recent Activity & Shortcuts */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full transition-all group-hover:bg-brand-green/10" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Clock className="w-6 h-6 text-brand-green" />
                Recent Activity
              </h3>
              <button className="text-xs font-black text-brand-green hover:text-emerald-400 transition-colors uppercase tracking-widest">View All</button>
            </div>

            <div className="space-y-6 relative z-10">
              {(stats?.recentActivity || []).map((activity) => (
                <div key={activity.id} className="flex items-center gap-5 group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-150 transition-all" />
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">{activity.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono font-black">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-brand-green/5 to-transparent border border-white/5 hover:border-brand-green/30 transition-all cursor-pointer group hover:bg-white/[0.03]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:border-brand-green/20 transition-all">
                  <Package className="w-6 h-6 text-brand-green" />
                </div>
                <h4 className="text-white font-black text-xl mb-2 tracking-tight group-hover:text-brand-green transition-colors">Cold Chain Hub</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Active telemetry from vehicle nodes and cold room storage sectors.</p>
             </div>
             <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-emerald-500/5 to-transparent border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-white/[0.03]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:border-emerald-500/20 transition-all">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-white font-black text-xl mb-2 tracking-tight group-hover:text-emerald-400 transition-colors">Farm Workforce</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Shift assignment logs, attendance tracking and automated payroll.</p>
             </div>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <NotificationFeed tenantId={user.tenantId} />
        </div>
      </div>
    </div>
  );
}

