/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Sprout, Calendar, MapPin, Loader2, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

interface Variety {
  id: string;
  name: string;
  bloomTime: number;
}

interface Zone {
  id: string;
  name: string;
}

interface StartCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  varieties: Variety[];
  zones: Zone[];
  onSuccess: () => void;
  onCreateVariety: () => void;
}

export default function StartCycleModal({ 
  isOpen, 
  onClose, 
  apiBase, 
  varieties, 
  zones, 
  onSuccess,
  onCreateVariety 
}: StartCycleModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [varietyId, setVarietyId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('PLANTED');

  if (!isOpen) return null;

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!varietyId) {
      toast.error('Please select a variety');
      return;
    }
    if (!zoneId) {
      toast.error('Please select a greenhouse zone');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/crop-cycles`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          varietyId,
          zoneId,
          startDate,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to start crop cycle');
      }

      toast.success(`Crop cycle started successfully`);
      onSuccess();
      onClose();
      // Reset form
      setVarietyId('');
      setZoneId('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setStatus('PLANTED');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to start cycle');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Start New Crop Cycle"
      subtitle="Initialize a new production lifecycle for your variety."
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Flower Variety *">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <select
                  value={varietyId}
                  onChange={(e) => setVarietyId(e.target.value)}
                  className={selectCls('emerald')}
                  required
                >
                  <option value="" className="bg-slate-900">Select Variety...</option>
                  {varieties.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900">{v.name}</option>
                  ))}
                </select>
                <Sprout className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={onCreateVariety}
                className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all group"
                title="Add New Variety"
              >
                <Plus className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </FormField>

          <FormField label="Greenhouse Zone *">
            <div className="relative">
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className={selectCls('emerald')}
                required
              >
                <option value="" className="bg-slate-900">Select Zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id} className="bg-slate-900">{z.name}</option>
                ))}
              </select>
              <MapPin className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 pointer-events-none" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Planting Date *">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls('emerald')}
                  required
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>

            <FormField label="Initial Status *">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectCls('emerald')}
              >
                <option value="PLANNED" className="bg-slate-900">PLANNED</option>
                <option value="PLANTED" className="bg-slate-900">PLANTED</option>
                <option value="GROWING" className="bg-slate-900">GROWING</option>
              </select>
            </FormField>
          </div>
        </div>

        <div className="pt-4">
          <SubmitBtn 
            loading={submitting} 
            label="Initiate Crop Lifecycle" 
            accentColor="emerald" 
          />
        </div>
      </form>
    </PremiumModal>
  );
}
