'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft,
  Loader2, 
  Search,
  Filter,
  Boxes,
  TrendingUp,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface InventoryItem {
  id: string;
  quantity: number;
  grade: string;
  variety: { name: string };
  updatedAt: string;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/pack-house/inventory`, { headers });
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/pack-house" className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic">Flower Inventory</h1>
          <p className="text-slate-500 font-medium tracking-tight">Available-to-Promise (ATP) stock by variety and grade.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
              <Boxes className="w-20 h-20 text-brand-green" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Graded Stems</p>
           <h2 className="text-4xl font-black text-white tracking-tighter">{inventory.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}</h2>
        </div>
        
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
              <TrendingUp className="w-20 h-20 text-blue-500" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Grade (A) Stock</p>
           <h2 className="text-4xl font-black text-brand-green tracking-tighter">
             {inventory.filter(i => i.grade === 'A').reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
           </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
              <History className="w-20 h-20 text-amber-500" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Low Stock Alerts</p>
           <h2 className="text-4xl font-black text-amber-500 tracking-tighter">
             {inventory.filter(i => i.quantity < 500).length}
           </h2>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-white uppercase italic">Stock Breakdown</h2>
           <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="FILTER VARIETY..."
                  className="bg-black/20 border-white/5 border pl-12 pr-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 w-64"
                />
              </div>
              <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
                <Filter className="w-4 h-4" />
              </button>
           </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-brand-green">
             <Loader2 className="w-12 h-12 animate-spin" />
             <span className="text-[11px] font-black uppercase tracking-[0.4em]">Auditing Inventory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Variety Name</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Stock Level</th>
                  <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-6 font-black text-white text-sm uppercase italic">{item.variety.name}</td>
                    <td className="px-4 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                        item.grade === 'A' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                        item.grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        GRADE {item.grade}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                       <p className="text-white font-black text-base tracking-tighter">{item.quantity.toLocaleString()} stems</p>
                       <div className="w-32 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.quantity < 500 ? 'bg-amber-500' : 'bg-brand-green'}`} 
                            style={{ width: `${Math.min(100, item.quantity / 500)}%` }} 
                          />
                       </div>
                    </td>
                    <td className="px-4 py-6 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-500 font-black uppercase text-xs tracking-widest opacity-20">
                      Inventory is empty. Complete QC grading to add stock.
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
