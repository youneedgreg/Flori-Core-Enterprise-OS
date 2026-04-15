/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { MapPin, Sprout, Maximize2, Thermometer, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

const ZONE_TYPES = [
  { value: 'GREENHOUSE', label: 'Greenhouse Block' },
  { value: 'COLD_ROOM', label: 'Cold Storage' },
  { value: 'PACKING_AREA', label: 'Pack House' },
  { value: 'OFFICE', label: 'Administrative Office' },
  { value: 'WAREHOUSE', label: 'General Warehouse' },
  { value: 'STORE', label: 'Input/Equipment Store' },
];

interface Zone {
  id: string;
  name: string;
  type?: string;
  areaSqm?: number;
  plantCount?: number;
  minTemp?: number;
  maxTemp?: number;
  minHumidity?: number;
  maxHumidity?: number;
}

interface EditZoneModalProps {
  zone: Zone;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function EditZoneModal({ zone, onClose, apiBase, onSuccess }: EditZoneModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(zone.name);
  const [type, setType] = useState(zone.type || 'GREENHOUSE');
  const [areaSqm, setAreaSqm] = useState(zone.areaSqm?.toString() || '');
  const [plantCount, setPlantCount] = useState(zone.plantCount?.toString() || '');
  const [minTemp, setMinTemp] = useState(zone.minTemp?.toString() ?? '0');
  const [maxTemp, setMaxTemp] = useState(zone.maxTemp?.toString() ?? '40');
  const [minHumidity, setMinHumidity] = useState(zone.minHumidity?.toString() ?? '0');
  const [maxHumidity, setMaxHumidity] = useState(zone.maxHumidity?.toString() ?? '100');

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Zone name is required'); return; }
    const headers = getAuthHeader();
    if (!headers) { toast.error('Session expired. Please log in again.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/zones/${zone.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          areaSqm: areaSqm ? parseFloat(areaSqm) : undefined,
          plantCount: plantCount ? parseFloat(plantCount) : undefined,
          minTemp: minTemp !== '' ? parseFloat(minTemp) : undefined,
          maxTemp: maxTemp !== '' ? parseFloat(maxTemp) : undefined,
          minHumidity: minHumidity !== '' ? parseFloat(minHumidity) : undefined,
          maxHumidity: maxHumidity !== '' ? parseFloat(maxHumidity) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Update failed');
      }

      toast.success(`Zone "${name}" updated successfully`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update zone');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Edit Zone"
      subtitle="Update sector configuration, capacity, and environmental thresholds."
      onClose={onClose}
      accentColor="emerald"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Sector Name *">
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
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls('emerald')}>
              {ZONE_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Total Area (M²)">
              <div className="relative">
                <input
                  type="number" step="0.01"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  placeholder="0.00"
                  className={inputCls('emerald')}
                />
                <Maximize2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
            <FormField label="Plant Capacity">
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

          {/* Environmental Thresholds */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Environmental Thresholds</p>
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Min Temp (°C)">
                <div className="relative">
                  <input
                    type="number" step="0.1"
                    value={minTemp}
                    onChange={(e) => setMinTemp(e.target.value)}
                    className={inputCls('emerald')}
                  />
                  <Thermometer className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
                </div>
              </FormField>
              <FormField label="Max Temp (°C)">
                <div className="relative">
                  <input
                    type="number" step="0.1"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(e.target.value)}
                    className={inputCls('emerald')}
                  />
                  <Thermometer className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/50" />
                </div>
              </FormField>
              <FormField label="Min Humidity (%)">
                <div className="relative">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={minHumidity}
                    onChange={(e) => setMinHumidity(e.target.value)}
                    className={inputCls('emerald')}
                  />
                  <Droplets className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
                </div>
              </FormField>
              <FormField label="Max Humidity (%)">
                <div className="relative">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={maxHumidity}
                    onChange={(e) => setMaxHumidity(e.target.value)}
                    className={inputCls('emerald')}
                  />
                  <Droplets className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                </div>
              </FormField>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Save Changes" accentColor="emerald" />
        </div>
      </form>
    </PremiumModal>
  );
}
