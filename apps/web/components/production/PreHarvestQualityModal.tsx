/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Sprout, Ruler, Calendar, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';
import { decodeJWT } from '../../lib/auth';

const BUD_STAGES = [
  { value: 'VEGETATIVE',        label: 'Vegetative — No bud' },
  { value: 'BUD_INITIATION',    label: 'Bud Initiation' },
  { value: 'BUD_DEVELOPMENT',   label: 'Bud Development' },
  { value: 'READY_FOR_HARVEST', label: 'Ready for Harvest' },
];

const STEM_STRENGTH_LEVELS = [
  { value: 'WEAK',   label: 'Weak' },
  { value: 'FAIR',   label: 'Fair' },
  { value: 'STRONG', label: 'Strong' },
];

const COLOR_DEV_LEVELS = [
  { value: 'NOT_DEVELOPED', label: 'Not Developed' },
  { value: 'PARTIAL',       label: 'Partial' },
  { value: 'FULL',          label: 'Full' },
  { value: 'OVER',          label: 'Over-developed' },
];

interface PreHarvestQualityModalProps {
  cycleId: string;
  cycleName: string;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function PreHarvestQualityModal({ cycleId, cycleName, onClose, apiBase, onSuccess }: PreHarvestQualityModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [budStage, setBudStage] = useState('BUD_DEVELOPMENT');
  const [budSizeMm, setBudSizeMm] = useState('');
  const [stemLengthCm, setStemLengthCm] = useState('');
  const [stemStrength, setStemStrength] = useState('STRONG');
  const [colorDev, setColorDev] = useState('FULL');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }
    const userId = decodeJWT(token)?.sub;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/farm-operations/pre-harvest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropCycleId: cycleId,
          date,
          budStage,
          budSizeMm: budSizeMm ? parseFloat(budSizeMm) : undefined,
          stemLengthCm: stemLengthCm ? parseFloat(stemLengthCm) : undefined,
          stemStrength,
          colorDev,
          inspectorId: userId,
        }),
      });
      if (!res.ok) throw new Error('Failed to save quality log');
      toast.success('Pre-harvest quality log saved');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Log Pre-Harvest Quality"
      subtitle={`Quality inspection for ${cycleName}`}
      onClose={onClose}
      accentColor="amber"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Inspection Date *" accentColor="amber">
            <div className="relative">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls('amber')} required />
              <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <FormField label="Bud Stage *" accentColor="amber">
            <div className="relative">
              <select value={budStage} onChange={(e) => setBudStage(e.target.value)} className={selectCls('amber')}>
                {BUD_STAGES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
              <Sprout className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40 pointer-events-none" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Bud Size (mm)" accentColor="amber">
              <input
                type="number" step="0.1" min="0"
                value={budSizeMm}
                onChange={(e) => setBudSizeMm(e.target.value)}
                placeholder="e.g. 18"
                className={inputCls('amber')}
              />
            </FormField>

            <FormField label="Stem Length (cm)" accentColor="amber">
              <div className="relative">
                <input
                  type="number" step="0.5" min="0"
                  value={stemLengthCm}
                  onChange={(e) => setStemLengthCm(e.target.value)}
                  placeholder="e.g. 58"
                  className={inputCls('amber')}
                />
                <Ruler className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>

            <FormField label="Stem Strength" accentColor="amber">
              <select value={stemStrength} onChange={(e) => setStemStrength(e.target.value)} className={selectCls('amber')}>
                {STEM_STRENGTH_LEVELS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Colour Development" accentColor="amber">
              <div className="relative">
                <select value={colorDev} onChange={(e) => setColorDev(e.target.value)} className={selectCls('amber')}>
                  {COLOR_DEV_LEVELS.map((c) => (
                    <option key={c.value} value={c.value} className="bg-slate-900">{c.label}</option>
                  ))}
                </select>
                <Palette className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40 pointer-events-none" />
              </div>
            </FormField>
          </div>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Save Quality Log" accentColor="amber" />
        </div>
      </form>
    </PremiumModal>
  );
}
