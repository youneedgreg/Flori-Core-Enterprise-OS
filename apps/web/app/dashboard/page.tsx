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

    // Basic JWT decoding for the UI
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true, href: '/dashboard' },
    { icon: Map, label: 'Farm Zones', href: '/dashboard/zones' },
    { icon: Users, label: 'Team', href: '/dashboard/team' },
    { icon: Package, label: 'Logistics', href: '/dashboard/logistics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col p-6 hidden lg:flex">
        <div className="text-2xl font-black tracking-tighter text-white inline-flex items-center gap-1 mb-10">
          <span className="text-emerald-500">Flori-</span>Core
        </div>

        <nav className="flex-1 space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                item.active 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button 
          onClick={() => {
            document.cookie = 'access_token=; Max-Age=0; path=/';
            router.push('/login');
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto p-8 lg:p-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                Good morning, <span className="text-emerald-500 font-extrabold">{user.email.split('@')[0]}</span>
              </h1>
              <p className="text-slate-400 font-medium">Here&apos;s what&apos;s happening at your farm today.</p>
            </div>

            <div className="flex items-center gap-4 mb-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all w-64 backdrop-blur-md"
                />
              </div>
            </div>
          </header>

          <QuickActions />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            {(stats?.kpis || []).map((kpi) => (
              <KPICard key={kpi.id} {...kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Recent Activity & Shortcuts */}
            <div className="lg:col-span-8 space-y-8">
              <div className="glass p-8 rounded-3xl border border-slate-800 shadow-xl min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-emerald-500" />
                    Recent Activity
                  </h3>
                  <button className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors">View All</button>
                </div>

                <div className="space-y-6">
                  {(stats?.recentActivity || []).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 group cursor-default">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm group-hover:text-white transition-colors">{activity.message}</p>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drill-down shortcuts area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="p-8 rounded-3xl bg-[linear-gradient(to_br,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer group hover:bg-white/2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="text-blue-400 font-bold text-lg mb-2">Cold Chain Metrics</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Monitor real-time temperature telemetry across all active transport vehicles.</p>
                 </div>
                 <div className="p-8 rounded-3xl bg-[linear-gradient(to_br,_var(--tw-gradient-stops))] from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer group hover:bg-white/2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                      <Users className="w-6 h-6 text-amber-400" />
                    </div>
                    <h4 className="text-amber-400 font-bold text-lg mb-2">Personnel & Payroll</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">View upcoming worker shifts, attendance logs and pending payroll disbursements.</p>
                 </div>
              </div>
            </div>

            {/* Notification Feed */}
            <div className="lg:col-span-4 sticky top-8">
              <NotificationFeed tenantId={user.tenantId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
