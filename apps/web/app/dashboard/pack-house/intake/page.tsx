'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Package, 
  ArrowLeft,
  Loader2, 
  Scan,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface CropCycle {
  id: string;
  variety: { name: string };
  zone?: { name: string };
  startDate: string;
  status: string;
}

export default function IntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [formData, setFormData] = useState({
    cropCycleId: '',
    quantity: 0
  });

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/crop-cycles`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Only show harvesting or growing cycles
        setCycles(data.filter((c: CropCycle) => c.status === 'GROWING' || c.status === 'HARVESTING' || c.status === 'PLANTED'));
      }
    } catch {
      toast.error('Failed to load crop cycles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropCycleId || formData.quantity <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    setSubmitting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API}/pack-house/intake`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Intake recorded successfully');
        router.push('/dashboard/pack-house');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to record intake');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/pack-house" className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic">Flower Intake</h1>
          <p className="text-slate-500 font-medium tracking-tight">Record batch arrival from the field.</p>
        </div>
      </header>

      <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <Scan className="w-32 h-32 text-brand-green" />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-brand-green">
             <Loader2 className="w-12 h-12 animate-spin" />
             <span className="text-[11px] font-black uppercase tracking-[0.4em]">Loading Cycles...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Crop Cycle (QR Scan Simulation)</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                  value={formData.cropCycleId}
                  onChange={(e) => setFormData({ ...formData, cropCycleId: e.target.value })}
                >
                  <option value="">-- Choose Active Cycle --</option>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.variety.name} - {c.zone?.name || 'GENERIC'} ({new Date(c.startDate).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Intake Quantity (Stems)</label>
                <input 
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-12 py-5 bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                RECORD INTAKE
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-brand-green/5 border border-brand-green/10 rounded-3xl p-8">
         <h4 className="flex items-center gap-2 text-brand-green font-black text-[10px] uppercase tracking-widest mb-2">
           <Package className="w-4 h-4" />
           Pack House Protocol
         </h4>
         <p className="text-slate-400 text-sm font-medium leading-relaxed">
           Ensure all batches are tagged with the generated Batch ID immediately after intake. 
           Unsorted flowers should be transferred to the pre-cooling zone within 15 minutes of recording.
         </p>
      </div>
    </div>
  );
}
