/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Wind, 
  ArrowLeft,
  Loader2, 
  Box,
  Clock,
  CheckCircle2
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
  daysInStorage: number;
  currentZone: string;
}

export default function ColdRoomInventory() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/cold-room/inventory`, { headers });
      if (res.ok) {
        setBatches(await res.json());
      }
    } catch {
      toast.error('Failed to load cold room inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleCheckOut = async (batch: Batch) => {
    // FIFO Warning
    const olderBatches = batches.filter(b => 
      b.id !== batch.id && 
      b.variety.name === batch.variety.name && 
      new Date(b.createdAt) < new Date(batch.createdAt)
    );

    if (olderBatches.length > 0) {
      if (!confirm(`FIFO WARNING: There are ${olderBatches.length} older batches of ${batch.variety.name} still in storage. Proceed with checking out this newer batch?`)) {
        return;
      }
    }

    setSubmitting(batch.id);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/cold-room/events`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: batch.id,
          zoneId: (batch as any).coldRoomEvents?.[0]?.zoneId, // Use same zone
          type: 'CHECK_OUT',
          quantity: batch.quantityIntake
        })
      });

      if (res.ok) {
        toast.success(`Batch ${batch.batchNumber} checked out successfully.`);
        fetchInventory();
      } else {
        toast.error('Failed to record check-out');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/cold-room" className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic">FIFO Stock Audit</h1>
          <p className="text-slate-500 font-medium tracking-tight">Active batches in cold storage, priority-sorted floor plan.</p>
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-blue-400">
           <Loader2 className="w-12 h-12 animate-spin" />
           <span className="text-[11px] font-black uppercase tracking-[0.4em]">Auditing Cold Storage...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {batches.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
               <Box className="w-20 h-20 text-slate-500 mb-4" />
               <p className="text-sm font-black uppercase tracking-widest text-slate-500">Cold Storage Empty</p>
            </div>
          )}
          {batches.map((batch, index) => {
             const isOldest = index === batches.findIndex(b => b.variety.name === batch.variety.name);
             const shelfLifeWarning = batch.daysInStorage > 5;

             return (
               <div key={batch.id} className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group ${
                 isOldest ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/5'
               }`}>
                  <div className="flex items-center gap-6">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                        shelfLifeWarning ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                        isOldest ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                     }`}>
                        <Box className="w-7 h-7" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg font-black text-white tracking-tight">{batch.batchNumber}</h3>
                           {isOldest && (
                             <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest">FIFO Priority</span>
                           )}
                           {shelfLifeWarning && (
                             <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-widest">Shelf Life Warning</span>
                           )}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           {batch.variety.name} · {batch.quantityIntake} Stems · Zone: {batch.currentZone}
                        </p>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-12">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry Date</p>
                        <p className="text-white font-bold text-xs">{new Date(batch.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Duration</p>
                        <div className="flex items-center gap-2">
                           <Clock className={`w-3 h-3 ${shelfLifeWarning ? 'text-amber-500' : 'text-blue-400'}`} />
                           <p className={`font-bold text-xs ${shelfLifeWarning ? 'text-amber-500' : 'text-white'}`}>
                             {batch.daysInStorage} Days
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => handleCheckOut(batch)}
                        disabled={submitting === batch.id}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                           isOldest ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                        }`}
                     >
                        {submitting === batch.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle2 className="w-3 h-3" />}
                        Check Out
                     </button>
                  </div>
               </div>
             )
          })}
        </div>
      )}

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
             <Wind className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-2">
             <h4 className="text-sm font-black text-white uppercase italic tracking-widest">FIFO (First-In, First-Out) Protocol</h4>
             <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
               Flower shelf life is critical. Batches highlighted in <span className="text-emerald-500 font-bold italic">Emerald</span> have been in cold storage the longest and MUST be selected first for packing and dispatch. 
               Checking out newer stock while priority items remain will trigger a recorded compliance warning.
             </p>
          </div>
      </div>
    </div>
  );
}
