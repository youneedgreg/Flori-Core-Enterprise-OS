'use client';

import React from 'react';

interface Zone { name: string; areaSqm: string; cropVarieties: string }
interface Props {
  zones: Zone[];
  onChange: (zones: Zone[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Zones({ zones, onChange, onNext, onBack }: Props) {
  const addZone = () => onChange([...zones, { name: '', areaSqm: '', cropVarieties: '' }]);
  const removeZone = (i: number) => onChange(zones.filter((_, idx) => idx !== i));
  const updateZone = (i: number, field: keyof Zone, value: string) => {
    const updated = [...zones];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white">Greenhouse & Zone Setup</h2>
      <p className="text-slate-400 mb-8">Define your blocks, greenhouses, or growing zones.</p>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {zones.map((zone, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeZone(i)}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
            <input
              required
              placeholder="Zone Name (e.g. Block A, Greenhouse 3) *"
              value={zone.name}
              onChange={(e) => updateZone(i, 'name', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Area (m²)"
                type="number"
                value={zone.areaSqm}
                onChange={(e) => updateZone(i, 'areaSqm', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500"
              />
              <input
                placeholder="Crop varieties (comma-separated)"
                value={zone.cropVarieties}
                onChange={(e) => updateZone(i, 'cropVarieties', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addZone}
        className="mt-4 w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm font-medium"
      >
        + Add Another Zone
      </button>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={zones.length === 0 || zones.some((z) => !z.name)}
          className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
