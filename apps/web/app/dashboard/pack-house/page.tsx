'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Loader2, 
  ArrowRight,
  ClipboardCheck,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Batch {
  id: string;
  batchNumber: string;
  variety: { name: string };
  quantityIntake: number;
  status: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  grade: string;
  variety: { name: string };
}

export default function PackHousePage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const [bRes, iRes] = await Promise.all([
        fetch(`${API}/pack-house/batches`, { headers }),
        fetch(`${API}/pack-house/inventory`, { headers })
      ]);

      if (bRes.ok) setBatches(await bRes.json());
      if (iRes.ok) setInventory(await iRes.json());
    } catch {
      toast.error('Failed to load pack house data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    { label: 'Pending Grading', value: batches.filter(b => b.status === 'QC_PENDING').length, icon: ClipboardCheck, color: 'emerald' },
    { label: 'Today\'s Intake', value: batches.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length, icon: Package, color: 'blue' },
    { label: 'Total Stock', value: inventory.reduce((sum, i) => sum + i.quantity, 0).toLocaleString(), icon: TrendingUp, color: 'emerald' },
    { label: 'Rejected', value: batches.filter(b => b.status === 'REJECTED').length, icon: XCircle, color: 'rose' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-green/10 border border-brand-green/20">
              <Package className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Pack House & Cold Chain</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Post-harvest intake, QC grading, and inventory management.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/dashboard/pack-house/inventory" className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all border border-white/5">
             Inventory
          </Link>
          <Link href="/dashboard/pack-house/intake" className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-brand-green/90 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Plus className="w-5 h-5" />
            New Intake
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((kpi, i) => (
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

      <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden shadow-2xl">
        <h2 className="text-2xl font-black text-white uppercase italic mb-8">Recent Batches</h2>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-brand-green">
             <Loader2 className="w-12 h-12 animate-spin" />
             <span className="text-[11px] font-black uppercase tracking-[0.4em]">Analyzing Batches...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Batch ID</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Variety</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-6 font-black text-white text-sm tracking-tighter">{batch.batchNumber}</td>
                    <td className="px-4 py-6 text-slate-400 font-bold text-xs uppercase">{batch.variety.name}</td>
                    <td className="px-4 py-6 text-slate-400 font-bold text-xs">{batch.quantityIntake} stems</td>
                    <td className="px-4 py-6">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        batch.status === 'QC_PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        batch.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-brand-green/10 text-brand-green border-brand-green/20'
                      }`}>
                        {batch.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-right">
                      {batch.status === 'QC_PENDING' && (
                        <Link href={`/dashboard/pack-house/grading/${batch.id}`} className="inline-flex items-center gap-2 text-brand-green hover:text-white transition-colors">
                          <span className="text-[10px] font-black uppercase tracking-widest">Grade Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 font-black uppercase text-xs tracking-widest opacity-20">
                      No batches found. Run an intake to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
