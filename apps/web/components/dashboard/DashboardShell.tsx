'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Map, Package, Settings, LogOut, Menu, X, Boxes, Sprout, Wind, ShoppingCart, ClipboardList, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { logout, decodeJWT, isTokenExpired } from '../../lib/auth';

interface DashboardShellProps {
  children: React.ReactNode;
  token: string;
}

export default function DashboardShell({ children, token }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      logout();
      return;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload) {
        logout();
        return;
      }
      setUser({ email: payload.email, role: payload.role });
    } catch (err) {
      console.error('Layout init failed:', err);
      logout();
    }
  }, [token, router]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Map, label: 'Farm Zones', href: '/dashboard/zones' },
    { icon: Sprout, label: 'Production', href: '/dashboard/production' },
    { icon: Package, label: 'Pack House', href: '/dashboard/pack-house' },
    { icon: Wind, label: 'Cold Room', href: '/dashboard/cold-room' },
    { icon: Users, label: 'Team', href: '/dashboard/team' },
    { icon: Package, label: 'Logistics', href: '/dashboard/logistics' },
    { icon: Boxes, label: 'Inventory', href: '/dashboard/inventory' },
    { icon: ShoppingCart, label: 'Stores', href: '/dashboard/stores' },
    { icon: ClipboardList, label: 'Procurement', href: '/dashboard/procurement' },
    { icon: TrendingUp, label: 'Sales & CRM', href: '/dashboard/sales' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  const handleSignOut = () => {
    logout();
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-brand-dark text-slate-100 overflow-hidden font-sans">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-brand-dark/50 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 hidden lg:flex relative overflow-hidden">
        {/* Glow behind logo */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-5 h-5 border-3 border-brand-dark rounded-sm rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none">Flori-Core</span>
              <span className="text-[8px] uppercase tracking-[0.3em] font-black text-brand-green mt-1">Enterprise OS</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-brand-green/10 text-brand-green border border-brand-green/20 shadow-lg shadow-emerald-500/5' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto relative z-10 pt-6 border-t border-white/5">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-brand-dark/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-3 border-brand-dark rounded-sm rotate-45" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">Flori-Core</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar bg-brand-dark relative lg:pt-0 pt-16">
        {/* Global Page Glows */}
        <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none opacity-50" />
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none opacity-30" />

        <div className="p-8 lg:p-12 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
