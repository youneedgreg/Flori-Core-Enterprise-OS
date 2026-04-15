/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  ClipboardCheck, Ruler, Package, XCircle,
  ChevronRight, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const DEFECT_OPTIONS = [
  'Botrytis', 'Thrips Damage', 'Bent Neck', 'Mealybug',
  'Powdery Mildew', 'Petal Spotting', 'Other',
];

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all hover:bg-white/[0.05]";

interface Batch {
  id: string;
  batchNumber: string;
  quantityIntake: number;
  variety: { name: string; targetStemLength?: number; marketGrade?: string };
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
    bloomStage: '3',
    headDiameter: 0,
    defects: [] as string[],
    notes: '',
    customDefect: '',
  });

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/pack-house/batches/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBatch(data);
        setFormData((prev) => ({ ...prev, stemLength: data.variety?.targetStemLength || 60 }));
      }
    } catch { toast.error('Failed to load batch data'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchBatch(); }, [fetchBatch]);

  const predictedGrade = useMemo(() => {
    if (!batch) return 'C';
    const target = batch.variety?.targetStemLength || 0;
    const { stemLength, defects } = formData;
    const hasCritical = defects.some((d) =>
      ['Botrytis', 'Thrips Damage', 'Bent Neck', 'Mealybug', 'Powdery Mildew'].includes(d)
    );
    if (hasCritical) return 'REJECT';
    if (stemLength >= target - 5 && defects.length === 0) return 'A';
    if (stemLength >= target - 10 && defects.length <= 2) return 'B';
    return 'C';
  }, [formData, batch]);

  function toggleDefect(defect: string) {
    setFormData((prev) => ({
      ...prev,
      defects: prev.defects.includes(defect)
        ? prev.defects.filter((d) => d !== defect)
        : [...prev.defects, defect],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, defects: finalDefects }),
      });
      if (res.ok) {
        toast.success(`QC Complete — Grade ${predictedGrade} assigned`);
        router.push('/dashboard/pack-house');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to submit QC');
      }
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  }

  if (loading || !batch) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-emerald-500 animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin" />
        <span className="text-[11px] font-black uppercase tracking-[0.4em]">Loading Batch Data...</span>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-amber-400',
    REJECT: 'text-rose-500',
  };

  const pctOfTarget = batch.variety?.targetStemLength
    ? Math.round((formData.stemLength / batch.variety.targetStemLength) * 100)
    : 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/pack-house')}
          className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic">Quality Control Grading</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight mt-1 flex items-center gap-2 flex-wrap text-sm">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-black">{batch.batchNumber}</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-white font-black">{batch.variety?.name}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span>{batch.quantityIntake?.toLocaleString()} stems intake</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <form id="qc-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Physical Metrics */}
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-xl space-y-8">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Physical Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stem Length (cm)</label>
                    <span className={`text-[10px] font-black uppercase ${pctOfTarget >= 95 ? 'text-emerald-400' : pctOfTarget >= 85 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {pctOfTarget}% of target
                    </span>
                  </div>
                  <input
                    type="number" step="0.5"
                    className={inputCls}
                    value={formData.stemLength}
                    onChange={(e) => setFormData({ ...formData, stemLength: parseFloat(e.target.value) })}
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase ml-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Target: {batch.variety?.targetStemLength ?? '—'}cm
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Head Diameter (mm)</label>
                  <input
                    type="number" placeholder="e.g. 45"
                    className={inputCls}
                    value={formData.headDiameter || ''}
                    onChange={(e) => setFormData({ ...formData, headDiameter: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bloom Stage (1–5)</label>
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-black text-lg">
                    {formData.bloomStage}
                  </div>
                </div>
                <input
                  type="range" min="1" max="5" step="0.5"
                  className="w-full accent-emerald-500"
                  value={formData.bloomStage}
                  onChange={(e) => setFormData({ ...formData, bloomStage: e.target.value })}
                />
                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase px-1">
                  <span>Tight Bud</span><span>Showing Color</span><span>Fully Open</span>
                </div>
              </div>
            </div>

            {/* Defects */}
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Defects Checklist
                </h3>
                {formData.defects.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {formData.defects.length} defect{formData.defects.length !== 1 ? 's' : ''} flagged
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DEFECT_OPTIONS.map((defect) => {
                  const active = formData.defects.includes(defect);
                  const isCritical = ['Botrytis', 'Thrips Damage', 'Bent Neck', 'Mealybug', 'Powdery Mildew'].includes(defect);
                  return (
                    <button
                      key={defect}
                      type="button"
                      onClick={() => toggleDefect(defect)}
                      className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-between gap-2 ${
                        active
                          ? isCritical
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      <span>{defect}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {formData.defects.includes('Other') && (
                <input
                  type="text" placeholder="Specify other defect..."
                  className={inputCls}
                  value={formData.customDefect}
                  onChange={(e) => setFormData({ ...formData, customDefect: e.target.value })}
                />
              )}
            </div>

            {/* Notes */}
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Additional Notes</label>
              <textarea
                rows={3} placeholder="Batch observations, field conditions, handling notes..."
                className={inputCls}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </form>
        </div>

        {/* ── Grade Prediction Panel ── */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 sticky top-8 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Predicted Grade</p>
              <div className={`text-8xl font-black italic tracking-tighter leading-none ${gradeColors[predictedGrade] ?? 'text-white'}`}>
                {predictedGrade}
              </div>
              {predictedGrade !== 'REJECT' && (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {predictedGrade === 'A' ? 'Premium — Export Quality' : predictedGrade === 'B' ? 'Standard — Local Market' : 'Bulk — Value Grade'}
                </p>
              )}
            </div>

            <div className="bg-black/30 rounded-2xl border border-white/5 p-5 space-y-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Grading Breakdown</p>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Stem vs Target</span>
                <span className={pctOfTarget >= 95 ? 'text-emerald-400' : pctOfTarget >= 85 ? 'text-amber-400' : 'text-rose-400'}>
                  {formData.stemLength}cm / {batch.variety?.targetStemLength ?? '—'}cm
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pctOfTarget >= 95 ? 'bg-emerald-500' : pctOfTarget >= 85 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, pctOfTarget)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold pt-2 border-t border-white/5">
                <span className="text-slate-400">Defects</span>
                <span className={formData.defects.length === 0 ? 'text-emerald-400' : formData.defects.length <= 2 ? 'text-amber-400' : 'text-rose-400'}>
                  {formData.defects.length} detected
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Bloom Stage</span>
                <span className="text-white">{formData.bloomStage} / 5</span>
              </div>
            </div>

            {predictedGrade === 'REJECT' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-400 leading-relaxed uppercase">
                  Critical defect detected. Batch will be routed to disposal or repurpose workflow.
                </p>
              </div>
            )}

            <button
              form="qc-form"
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-3 group"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ClipboardCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              {submitting ? 'Submitting...' : 'Confirm Grading'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard/pack-house')}
              className="w-full py-3 border border-white/10 rounded-2xl text-slate-400 font-bold text-sm hover:bg-white/5 transition-all"
            >
              ← Back to Pack House
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
