'use client';

import React from 'react';
import { Truck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '../../lib/auth';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <nav className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-3xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-emerald-500/20 rounded-xl">
             <Truck className="w-6 h-6 text-emerald-500" />
           </div>
           <div>
             <h1 className="text-xl font-black italic uppercase tracking-tighter loading-none">Pilot</h1>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Drive Operations</p>
           </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all font-black"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      <main className="p-4 md:p-6 pb-24">
        {children}
      </main>
    </div>
  );
}
