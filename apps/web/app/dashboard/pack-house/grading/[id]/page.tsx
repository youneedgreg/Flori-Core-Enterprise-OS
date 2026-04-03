'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ArrowLeft,
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Ruler
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const DEFECT_OPTIONS = [
  'Botrytis',
  'Thrips Damage',
  'Bent Neck',
  'Mealybug',
  'Powdery Mildew',
  'Petal Spotting',
  'Other'
];

interface Batch {
  id: string;
  batchNumber: string;
  variety: { 
    name: string;
    targetStemLength?: number;
  };
}

export default function GradingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    stemLength: 0,
    bloomStage: '3', // 1-5
    headDiameter: 0,
    defects: [] as string[],
    notes: '',
    customDefect: ''
  });

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/pack-house/batches/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBatch(data);
        setFormData(prev => ({ ...prev, stemLength: data.variety.targetStemLength || 60 }));
      }
    } catch {
      toast.error('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  const predictedGrade = useMemo(() => {
    if (!batch) return 'C';
    const target = batch.variety.targetStemLength || 0;
    const length = formData.stemLength;
    const defects = formData.defects;
    
    const hasCritical = defects.some(d => ['Botrytis', 'Thrips Damage', 'Bent Neck', 'Mealybug', 'Powdery Mildew'].includes(d));
    if (hasCritical) return 'REJECT';

    if (length >= target - 5 && defects.length === 0) return 'A';
    if (length >= target - 10 && defects.length <= 2) return 'B';
    return 'C';
  }, [formData, batch]);

  const toggleDefect = (defect: string) => {
    setFormData(prev => ({
      ...prev,
      defects: prev.defects.includes(defect) 
        ? prev.defects.filter(d => d !== defect) 
        : [...prev.defects, defect]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const finalDefects = [...formData.defects];
      if (formData.defects.includes('Other') && formData.customDefect) {
        finalDefects.push(`OTHER: ${formData.customDefect}`);
      }

      const res = await fetch(`${API}/pack-house/grading/${id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          defects: finalDefects
        })
      });

      if (res.ok) {
        toast.success(`QC Completed. Assigned Grade: ${predictedGrade}`);
        router.push('/dashboard/pack-house');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to submit QC');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !batch) return (
    <div className="py-40 flex flex-col items-center justify-center gap-4 text-brand-green">
      <Loader2 className="w-12 h-12 animate-spin" />
      <span className="text-[11px] font-black uppercase tracking-[0.4em]">Calibrating Sensors...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/pack-house" className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic">Quality Control Grading</h1>
          <p className="text-slate-500 font-medium tracking-tight">Batch: {batch.batchNumber} · Variety: {batch.variety.name}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <form id="qc-form" onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 shadow-2xl space-y-10">
            {/* Stem Metrics */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Physical Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stem Length (cm)</label>
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-green transition-all"
                    value={formData.stemLength}
                    onChange={(e) => setFormData({ ...formData, stemLength: parseFloat(e.target.value) })}
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase ml-1">Target: {batch.variety.targetStemLength}cm</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Head Diameter (mm)</label>
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-green transition-all"
                    placeholder="e.g. 45"
                    value={formData.headDiameter}
                    onChange={(e) => setFormData({ ...formData, headDiameter: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bloom Stage (1-5)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="5" step="0.5"
                    className="flex-1 accent-brand-green"
                    value={formData.bloomStage}
                    onChange={(e) => setFormData({ ...formData, bloomStage: e.target.value })}
                  />
                  <span className="w-12 h-12 bg-brand-green/20 border border-brand-green/30 rounded-xl flex items-center justify-center text-brand-green font-black text-lg">
                    {formData.bloomStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Defects Checklist */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Defects Checklist
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DEFECT_OPTIONS.map(defect => (
                  <button
                    key={defect}
                    type="button"
                    onClick={() => toggleDefect(defect)}
                    className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all text-left flex items-center justify-between ${
                      formData.defects.includes(defect)
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                    }`}
                  >
                    {defect}
                    {formData.defects.includes(defect) && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                ))}
              </div>
              {formData.defects.includes('Other') && (
                <input 
                  type="text"
                  placeholder="SPECIFY OTHER DEFECT..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-green transition-all text-xs"
                  value={formData.customDefect}
                  onChange={(e) => setFormData({ ...formData, customDefect: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2 pt-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Additional Notes</label>
               <textarea 
                 rows={3}
                 className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-brand-green transition-all"
                 placeholder="Batch observations..."
                 value={formData.notes}
                 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
               />
            </div>
          </form>
        </div>

        {/* Prediction Column */}
        <div className="space-y-8">
           <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 sticky top-8 space-y-8">
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Predicted Assigned Grade</p>
                 <div className={`text-7xl font-black italic tracking-tighter ${
                   predictedGrade === 'REJECT' ? 'text-rose-500' : 'text-brand-green'
                 }`}>
                   {predictedGrade}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2">Grading Breakdown</h4>
                    <ul className="space-y-2">
                       <li className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Length vs Target</span>
                          <span className={formData.stemLength >= (batch.variety.targetStemLength || 0) - 5 ? 'text-brand-green' : 'text-slate-200'}>
                            {formData.stemLength}cm / {batch.variety.targetStemLength}cm
                          </span>
                       </li>
                       <li className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Defects Count</span>
                          <span className={formData.defects.length === 0 ? 'text-brand-green' : 'text-amber-500'}>
                            {formData.defects.length} detected
                          </span>
                       </li>
                    </ul>
                 </div>

                 {predictedGrade === 'REJECT' && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                       <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                       <p className="text-[10px] font-bold text-rose-400 leading-tight">
                         CRITICAL DEFECT DETECTED. THIS BATCH WILL BE ROUTED TO THE DISPOSAL/RE-PURPOSE WORKFLOW.
                       </p>
                    </div>
                 )}
              </div>

              <button 
                form="qc-form"
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ClipboardCheck className="w-5 h-5" />
                )}
                CONFIRM GRADING
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
