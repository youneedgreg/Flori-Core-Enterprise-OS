/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Activity, Calendar, Heart, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';
import { decodeJWT } from '../../lib/auth';

const GROWTH_RATES = ['SLOW', 'BELOW_AVERAGE', 'AVERAGE', 'ABOVE_AVERAGE', 'FAST'];

interface CropPerformanceModalProps {
  cycleId: string;
  cycleName: string;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function CropPerformanceModal({ cycleId, cycleName, onClose, apiBase, onSuccess }: CropPerformanceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [growthRate, setGrowthRate] = useState('AVERAGE');
  const [healthScore, setHealthScore] = useState('');
  const [budFormation, setBudFormation] = useState(false);
  const [observations, setObservations] = useState('');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }
    const userId = decodeJWT(token)?.sub;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/farm-operations/crop-performance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropCycleId: cycleId,
          date,
          growthRate,
          healthScore: healthScore ? parseInt(healthScore) : undefined,
          budFormation,
          observations: observations || undefined,
          recordedById: userId,
        }),
      });
      if (!res.ok) throw new Error('Failed to save performance log');
      toast.success('Crop performance logged');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save log');
    } finally {
      setSubmitting(false);
    }
  }

  const healthNum = healthScore ? parseInt(healthScore) : null;
  const healthColor = healthNum == null ? '' : healthNum >= 80 ? 'text-emerald-400' : healthNum >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <PremiumModal
      title="Log Crop Performance"
      subtitle={`Growth and health observation for ${cycleName}`}
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Observation Date *">
            <div className="relative">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls('emerald')} required />
              <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Growth Rate">
              <select value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} className={selectCls('emerald')}>
                {GROWTH_RATES.map((r) => (
                  <option key={r} value={r} className="bg-slate-900">{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Health Score (0–100)">
              <div className="relative">
                <input
                  type="number" min="0" max="100"
                  value={healthScore}
                  onChange={(e) => setHealthScore(e.target.value)}
                  placeholder="e.g. 85"
                  className={inputCls('emerald')}
                />
                <Heart className={`absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 ${healthColor || 'text-slate-500/50'}`} />
              </div>
            </FormField>
          </div>

          {/* Health score bar */}
          {healthNum !== null && (
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${healthNum >= 80 ? 'bg-emerald-500' : healthNum >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, healthNum)}%` }}
              />
            </div>
          )}

          {/* Bud Formation Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Bud Formation Observed</span>
            </div>
            <button
              type="button"
              onClick={() => setBudFormation(!budFormation)}
              className={`w-12 h-6 rounded-full transition-all relative ${budFormation ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${budFormation ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <FormField label="Observations">
            <div className="relative">
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Describe crop condition, notable growth patterns, concerns, environmental factors..."
                rows={3}
                className={`${inputCls('emerald')} resize-none`}
              />
              <StickyNote className="absolute right-5 top-4 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Save Performance Log" accentColor="emerald" />
        </div>
      </form>
    </PremiumModal>
  );
}
