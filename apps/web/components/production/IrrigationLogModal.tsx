/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Droplets, Clock, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

const IRRIGATION_METHODS = [
  { value: 'DRIP', label: 'Drip Irrigation' },
  { value: 'OVERHEAD', label: 'Overhead / Sprinkler' },
  { value: 'MANUAL', label: 'Manual (Hand Watering)' },
  { value: 'FLOOD', label: 'Flood Irrigation' },
  { value: 'SUBSURFACE', label: 'Subsurface Drip' },
];

interface IrrigationLogModalProps {
  zoneId: string;
  zoneName: string;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function IrrigationLogModal({ zoneId, zoneName, onClose, apiBase, onSuccess }: IrrigationLogModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [method, setMethod] = useState('DRIP');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [volumeLiters, setVolumeLiters] = useState('');
  const [fertigationUsed, setFertigationUsed] = useState(false);
  const [fertilizerType, setFertilizerType] = useState('');
  const [npkLevels, setNpkLevels] = useState('');
  const [applicationRate, setApplicationRate] = useState('');

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { toast.error('Date is required'); return; }
    const headers = getAuthHeader();
    if (!headers) { toast.error('Session expired. Please log in again.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/farm-operations/irrigation-logs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId,
          date,
          method,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          volumeLiters: volumeLiters ? parseFloat(volumeLiters) : undefined,
          fertigationUsed,
          fertilizerType: fertigationUsed && fertilizerType ? fertilizerType : undefined,
          npkLevels: fertigationUsed && npkLevels ? npkLevels : undefined,
          applicationRate: applicationRate ? parseFloat(applicationRate) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Failed to log irrigation');
      }

      toast.success(`Irrigation logged for ${zoneName}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to log irrigation');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Log Irrigation Event"
      subtitle={`Recording watering data for ${zoneName}`}
      onClose={onClose}
      accentColor="indigo"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Date *" accentColor="indigo">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls('indigo')}
                required
              />
            </FormField>
            <FormField label="Method *" accentColor="indigo">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={selectCls('indigo')}>
                {IRRIGATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Duration (minutes)" accentColor="indigo">
              <div className="relative">
                <input
                  type="number" min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g. 45"
                  className={inputCls('indigo')}
                />
                <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
            <FormField label="Volume (litres)" accentColor="indigo">
              <div className="relative">
                <input
                  type="number" step="0.01" min="0"
                  value={volumeLiters}
                  onChange={(e) => setVolumeLiters(e.target.value)}
                  placeholder="e.g. 200"
                  className={inputCls('indigo')}
                />
                <Droplets className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
              </div>
            </FormField>
          </div>

          {/* Fertigation Toggle */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Fertigation Used</span>
              </div>
              <button
                type="button"
                onClick={() => setFertigationUsed(!fertigationUsed)}
                className={`w-12 h-6 rounded-full transition-all relative ${fertigationUsed ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${fertigationUsed ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {fertigationUsed && (
              <div className="space-y-4 pt-2">
                <FormField label="Fertilizer Type" accentColor="indigo">
                  <input
                    type="text"
                    value={fertilizerType}
                    onChange={(e) => setFertilizerType(e.target.value)}
                    placeholder="e.g. NPK 20-20-20, CAN"
                    className={inputCls('indigo')}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="NPK Levels" accentColor="indigo">
                    <input
                      type="text"
                      value={npkLevels}
                      onChange={(e) => setNpkLevels(e.target.value)}
                      placeholder="e.g. 20-20-20"
                      className={inputCls('indigo')}
                    />
                  </FormField>
                  <FormField label="Application Rate (kg/ha)" accentColor="indigo">
                    <input
                      type="number" step="0.01"
                      value={applicationRate}
                      onChange={(e) => setApplicationRate(e.target.value)}
                      placeholder="0.00"
                      className={inputCls('indigo')}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Log Irrigation Event" accentColor="indigo" />
        </div>
      </form>
    </PremiumModal>
  );
}
