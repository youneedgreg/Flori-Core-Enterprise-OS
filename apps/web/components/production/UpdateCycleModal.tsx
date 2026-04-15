/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Calendar, Sprout, X } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

const STATUS_FLOW = [
  { value: 'PLANNED',    label: 'Planned',    color: 'text-slate-400',   bg: 'bg-slate-500/20'   },
  { value: 'PLANTED',    label: 'Planted',    color: 'text-blue-400',    bg: 'bg-blue-500/20'    },
  { value: 'GROWING',    label: 'Growing',    color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { value: 'HARVESTING', label: 'Harvesting', color: 'text-amber-400',   bg: 'bg-amber-500/20'   },
  { value: 'COMPLETED',  label: 'Completed',  color: 'text-purple-400',  bg: 'bg-purple-500/20'  },
  { value: 'CANCELLED',  label: 'Cancelled',  color: 'text-rose-400',    bg: 'bg-rose-500/20'    },
];

interface ActivePhi {
  chemical: string;
  allowedAt: string;
}

interface CycleForUpdate {
  id: string;
  status: string;
  variety: { name: string };
  zone?: { name: string };
}

interface UpdateCycleModalProps {
  cycle: CycleForUpdate;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function UpdateCycleModal({ cycle, onClose, apiBase, onSuccess }: UpdateCycleModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState(cycle.status);
  const [actualHarvestDate, setActualHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualHarvestYield, setActualHarvestYield] = useState('');
  const [phiBlocking, setPhiBlocking] = useState<ActivePhi[]>([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';
  const isCompleting = newStatus === 'COMPLETED';
  const needsPhiOverride = phiBlocking.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }

    setSubmitting(true);
    setPhiBlocking([]);

    try {
      const body: any = { status: newStatus };
      if (isCompleting) {
        if (actualHarvestDate) body.actualHarvestDate = actualHarvestDate;
        if (actualHarvestYield) body.actualHarvestYield = parseInt(actualHarvestYield);
      }
      if (overrideMode && overrideReason) {
        body.overrideReason = overrideReason;
      }

      const res = await fetch(`${apiBase}/crop-cycles/${cycle.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 400) {
        const err = await res.json();
        if (err.activePhis) {
          setPhiBlocking(err.activePhis);
          setSubmitting(false);
          return;
        }
        throw new Error(err.message || 'Update failed');
      }

      if (!res.ok) throw new Error('Update failed');

      toast.success(`Cycle updated to ${newStatus}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update cycle');
    } finally {
      setSubmitting(false);
    }
  }

  const availableStatuses = STATUS_FLOW.filter((s) => s.value !== cycle.status);

  return (
    <PremiumModal
      title="Update Cycle Status"
      subtitle={`${cycle.variety.name}${cycle.zone ? ` · ${cycle.zone.name}` : ''}`}
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
          <Sprout className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Status</span>
          <span className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_FLOW.find((s) => s.value === cycle.status)?.bg ?? 'bg-slate-500/20'} ${STATUS_FLOW.find((s) => s.value === cycle.status)?.color ?? 'text-slate-400'}`}>
            {cycle.status}
          </span>
        </div>

        {/* PHI Warning */}
        {needsPhiOverride && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-black text-rose-400 uppercase tracking-wider">Harvest Blocked — Active PHI</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The following chemicals have active Pre-Harvest Intervals. Harvesting before these dates may violate safety regulations.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {phiBlocking.map((phi, i) => (
                <div key={i} className="flex items-center justify-between bg-black/20 px-4 py-3 rounded-xl">
                  <span className="text-xs font-black text-white">{phi.chemical}</span>
                  <span className="text-[9px] font-black text-rose-400 uppercase">Safe after {new Date(phi.allowedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            {!overrideMode ? (
              <button
                type="button"
                onClick={() => setOverrideMode(true)}
                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Override PHI Restriction (Accept Risk)
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-rose-400 cursor-pointer" onClick={() => setOverrideMode(false)} />
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Override Active — Provide Reason</p>
                </div>
                <FormField label="Override Reason *" accentColor="emerald">
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document the business or safety justification for overriding PHI..."
                    rows={2}
                    className={`${inputCls('emerald')} resize-none`}
                    required
                  />
                </FormField>
              </div>
            )}
          </div>
        )}

        {/* New Status */}
        {!needsPhiOverride || overrideMode ? (
          <div className="space-y-6">
            <FormField label="New Status *">
              <select value={newStatus} onChange={(e) => { setNewStatus(e.target.value); setPhiBlocking([]); }} className={selectCls('emerald')}>
                <option value={cycle.status} className="bg-slate-900">— Keep current ({cycle.status}) —</option>
                {availableStatuses.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
            </FormField>

            {/* Extra fields for COMPLETED */}
            {isCompleting && (
              <div className="space-y-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Harvest Completion Data</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Actual Harvest Date">
                    <div className="relative">
                      <input
                        type="date"
                        value={actualHarvestDate}
                        onChange={(e) => setActualHarvestDate(e.target.value)}
                        className={inputCls('emerald')}
                      />
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
                    </div>
                  </FormField>
                  <FormField label="Actual Yield (Stems)">
                    <input
                      type="number" min="0"
                      value={actualHarvestYield}
                      onChange={(e) => setActualHarvestYield(e.target.value)}
                      placeholder="0"
                      className={inputCls('emerald')}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4">
          <SubmitBtn
            loading={submitting}
            label={needsPhiOverride && !overrideMode ? 'Blocked by PHI' : 'Update Status'}
            accentColor="emerald"
          />
        </div>
      </form>
    </PremiumModal>
  );
}
