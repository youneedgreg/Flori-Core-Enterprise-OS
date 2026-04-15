/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Sprout, Ruler, Clock, BarChart2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, SubmitBtn } from '../sales/SalesUI';

interface Variety {
  id: string;
  name: string;
  targetStemLength?: number;
  bloomTime?: number;
  marketGrade?: string;
  targetStemCountPerSqm?: number;
  defaultCostPerStem?: number;
}

interface EditVarietyModalProps {
  variety: Variety;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function EditVarietyModal({ variety, onClose, apiBase, onSuccess }: EditVarietyModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(variety.name);
  const [targetStemLength, setTargetStemLength] = useState(variety.targetStemLength?.toString() ?? '60');
  // bloomTime stored in DB as days, show as weeks
  const [bloomTimeWeeks, setBloomTimeWeeks] = useState(
    variety.bloomTime ? Math.round(variety.bloomTime / 7).toString() : '12'
  );
  const [marketGrade, setMarketGrade] = useState(variety.marketGrade ?? 'A');
  const [targetStemCountPerSqm, setTargetStemCountPerSqm] = useState(
    variety.targetStemCountPerSqm?.toString() ?? '28'
  );
  const [defaultCostPerStem, setDefaultCostPerStem] = useState(
    variety.defaultCostPerStem?.toString() ?? ''
  );

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Variety name is required'); return; }
    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/varieties/${variety.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          targetStemLength: targetStemLength ? parseFloat(targetStemLength) : undefined,
          bloomTime: bloomTimeWeeks ? parseInt(bloomTimeWeeks) * 7 : undefined,
          marketGrade,
          targetStemCountPerSqm: targetStemCountPerSqm ? parseFloat(targetStemCountPerSqm) : undefined,
          defaultCostPerStem: defaultCostPerStem ? parseFloat(defaultCostPerStem) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`${name} updated successfully`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update variety');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Edit Variety"
      subtitle={`Updating genetic parameters for ${variety.name}`}
      onClose={onClose}
      accentColor="indigo"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Variety Name *" accentColor="indigo">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Red Naomi"
                className={inputCls('indigo')}
                required
              />
              <Sprout className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Target Stem Length (cm)" accentColor="indigo">
              <div className="relative">
                <input
                  type="number" step="0.5" min="0"
                  value={targetStemLength}
                  onChange={(e) => setTargetStemLength(e.target.value)}
                  className={inputCls('indigo')}
                />
                <Ruler className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>

            <FormField label="Bloom Time (Weeks)" accentColor="indigo">
              <div className="relative">
                <input
                  type="number" min="1" max="52"
                  value={bloomTimeWeeks}
                  onChange={(e) => setBloomTimeWeeks(e.target.value)}
                  className={inputCls('indigo')}
                />
                <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>

            <FormField label="Market Grade" accentColor="indigo">
              <select
                value={marketGrade}
                onChange={(e) => setMarketGrade(e.target.value)}
                className={inputCls('indigo')}
              >
                <option value="A" className="bg-slate-900">Grade A — Premium</option>
                <option value="B" className="bg-slate-900">Grade B — Standard</option>
                <option value="C" className="bg-slate-900">Grade C — Budget</option>
              </select>
            </FormField>

            <FormField label="Target Stems / m²" accentColor="indigo">
              <div className="relative">
                <input
                  type="number" step="0.5" min="0"
                  value={targetStemCountPerSqm}
                  onChange={(e) => setTargetStemCountPerSqm(e.target.value)}
                  className={inputCls('indigo')}
                />
                <BarChart2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>

          <FormField label="Default Cost per Stem (KES)" accentColor="indigo">
            <div className="relative">
              <input
                type="number" step="0.01" min="0"
                value={defaultCostPerStem}
                onChange={(e) => setDefaultCostPerStem(e.target.value)}
                placeholder="e.g. 12.50"
                className={inputCls('indigo')}
              />
              <DollarSign className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Save Variety" accentColor="indigo" />
        </div>
      </form>
    </PremiumModal>
  );
}
