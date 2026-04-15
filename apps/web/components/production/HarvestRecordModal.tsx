/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Sprout, Calendar, Weight, XCircle, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, SubmitBtn } from '../sales/SalesUI';
import { decodeJWT } from '../../lib/auth';

interface HarvestRecordModalProps {
  cycleId: string;
  cycleName: string;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function HarvestRecordModal({ cycleId, cycleName, onClose, apiBase, onSuccess }: HarvestRecordModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [quantityStems, setQuantityStems] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [rejectedStems, setRejectedStems] = useState('');
  const [notes, setNotes] = useState('');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantityStems || parseInt(quantityStems) < 0) { toast.error('Quantity (stems) is required'); return; }

    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }
    const userId = decodeJWT(token)?.sub;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/farm-operations/harvest-records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropCycleId: cycleId,
          date,
          quantityStems: parseInt(quantityStems),
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          rejectedStems: rejectedStems ? parseInt(rejectedStems) : undefined,
          notes: notes || undefined,
          supervisorId: userId,
        }),
      });
      if (!res.ok) throw new Error('Failed to save harvest record');
      toast.success(`Harvest record logged for ${cycleName}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Log Harvest Record"
      subtitle={`Recording harvest data for ${cycleName}`}
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Harvest Date *">
            <div className="relative">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls('emerald')} required />
              <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Quantity (Stems) *">
              <div className="relative">
                <input
                  type="number" min="0"
                  value={quantityStems}
                  onChange={(e) => setQuantityStems(e.target.value)}
                  placeholder="e.g. 1200"
                  className={inputCls('emerald')}
                  required
                />
                <Sprout className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40" />
              </div>
            </FormField>

            <FormField label="Total Weight (kg)">
              <div className="relative">
                <input
                  type="number" step="0.01" min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 45.0"
                  className={inputCls('emerald')}
                />
                <Weight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>

          <FormField label="Rejected Stems (Quality Failures)">
            <div className="relative">
              <input
                type="number" min="0"
                value={rejectedStems}
                onChange={(e) => setRejectedStems(e.target.value)}
                placeholder="0"
                className={inputCls('emerald')}
              />
              <XCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/40" />
            </div>
          </FormField>

          {/* Acceptance rate preview */}
          {quantityStems && rejectedStems && parseInt(quantityStems) > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Acceptance Rate</span>
                <span className="text-sm font-black text-emerald-400">
                  {Math.max(0, Math.round(((parseInt(quantityStems) - parseInt(rejectedStems)) / parseInt(quantityStems)) * 100))}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, ((parseInt(quantityStems) - parseInt(rejectedStems)) / parseInt(quantityStems)) * 100))}%` }}
                />
              </div>
            </div>
          )}

          <FormField label="Notes">
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations about quality, grade distribution, or batch notes..."
                rows={3}
                className={`${inputCls('emerald')} resize-none`}
              />
              <StickyNote className="absolute right-5 top-4 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Save Harvest Record" accentColor="emerald" />
        </div>
      </form>
    </PremiumModal>
  );
}
