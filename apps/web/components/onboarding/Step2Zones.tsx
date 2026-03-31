'use client';

import React from 'react';
import { Box, Trash2, Plus, ArrowLeft, ArrowRight, Ruler, Sprout } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Zone Configuration</h2>
        <p className="text-slate-500 font-medium">Map your physical growing infrastructure into digital segments.</p>
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
        {zones.map((zone, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 relative group transition-all hover:bg-white/[0.08]">
            <button
              type="button"
              onClick={() => removeZone(i)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="relative group/input">
              <Box className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
              <input
                required
                placeholder="Zone Designation (e.g. Sector Beta-4) *"
                value={zone.name}
                onChange={(e) => updateZone(i, 'name', e.target.value)}
                className="w-full pl-14 pr-12 py-4 rounded-xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group/input">
                <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
                <input
                  placeholder="Area (m²)"
                  type="number"
                  value={zone.areaSqm}
                  onChange={(e) => updateZone(i, 'areaSqm', e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all font-mono text-sm"
                />
              </div>
              <div className="relative group/input">
                <Sprout className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
                <input
                  placeholder="Varieties (e.g. Roses, Lilies)"
                  value={zone.cropVarieties}
                  onChange={(e) => updateZone(i, 'cropVarieties', e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addZone}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-slate-500 hover:border-brand-green/30 hover:text-brand-green hover:bg-brand-green/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Initialize Additional Zone
      </button>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onBack} 
          className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black tracking-tight transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Abort
        </button>
        <button
          onClick={onNext}
          disabled={zones.length === 0 || zones.some((z) => !z.name)}
          className="flex-[2] py-5 rounded-2xl bg-brand-green text-brand-dark font-black tracking-tight hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Commit Configuration
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
