/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { MapPin, Sprout, Maximize2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

const ZONE_TYPES = [
  { value: 'GREENHOUSE', label: 'Greenhouse block' },
  { value: 'COLD_ROOM', label: 'Cold Storage' },
  { value: 'PACKING_AREA', label: 'Pack House' },
  { value: 'OFFICE', label: 'Administrative Office' },
  { value: 'WAREHOUSE', label: 'General Warehouse' },
  { value: 'STORE', label: 'Input/Equipment Store' },
];

export default function CreateZoneModal({ isOpen, onClose, apiBase, onSuccess }: CreateZoneModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('GREENHOUSE');
  const [areaSqm, setAreaSqm] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [cropVarieties, setCropVarieties] = useState('');

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Zone name is required');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/zones`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name,
          type,
          areaSqm: areaSqm ? parseFloat(areaSqm) : undefined,
          plantCount: plantCount ? parseFloat(plantCount) : undefined,
          cropVarieties: cropVarieties ? cropVarieties.split(',').map(v => v.trim()).filter(v => v) : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create production zone');
      }

      toast.success(`Production zone "${name}" deployed successfully`);
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setType('GREENHOUSE');
      setAreaSqm('');
      setPlantCount('');
      setCropVarieties('');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create zone');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Deploy Production Sector"
      subtitle="Initialize a new geospatial sector for telemetry and crop tracking."
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Sector Manifest (Name) *">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Greenhouse Block A-12"
                className={inputCls('emerald')}
                required
              />
              <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
            </div>
          </FormField>

          <FormField label="Sector Type *">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={selectCls('emerald')}
            >
              {ZONE_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Scale (Total M²)">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  placeholder="0.00"
                  className={inputCls('emerald')}
                />
                <Maximize2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
            <FormField label="Capacity (Est. Plants)">
              <div className="relative">
                <input
                  type="number"
                  value={plantCount}
                  onChange={(e) => setPlantCount(e.target.value)}
                  placeholder="0"
                  className={inputCls('emerald')}
                />
                <Sprout className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>

          <FormField label="Initial Crop Genetic Config">
            <div className="space-y-2">
              <input
                type="text"
                value={cropVarieties}
                onChange={(e) => setCropVarieties(e.target.value)}
                placeholder="e.g., Ever Red, Rhodos, Moonwalk (comma separated)"
                className={inputCls('emerald')}
              />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Separate multiple varieties with commas
              </p>
            </div>
          </FormField>
        </div>

        <div className="pt-4">
          <SubmitBtn 
            loading={submitting} 
            label="Deploy Sector Manifest" 
            accentColor="emerald" 
          />
        </div>
      </form>
    </PremiumModal>
  );
}
