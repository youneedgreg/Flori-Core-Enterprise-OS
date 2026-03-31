'use client';

import React from 'react';
import { Cpu, MapPin, Activity, Trash2, Plus, ArrowLeft, Zap, Satellite, ChevronDown } from 'lucide-react';

interface Device { type: string; macAddress: string; mqttTopic: string; zoneId: string }
interface Zone { id: string; name: string }
interface Props {
  devices: Device[];
  zones: Zone[];
  onChange: (devices: Device[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

const deviceTypes = ['MOISTURE', 'TEMPERATURE', 'EC_LEVEL', 'PH', 'HUMIDITY', 'LIGHT'];

export default function Step4IoT({ devices, zones, onChange, onSubmit, onBack, loading }: Props) {
  const addDevice = () => onChange([...devices, { type: deviceTypes[0], macAddress: '', mqttTopic: '', zoneId: zones[0]?.id ?? '' }]);
  const removeDevice = (i: number) => onChange(devices.filter((_, idx) => idx !== i));
  const updateDevice = (i: number, field: keyof Device, value: string) => {
    const updated = [...devices];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">IoT Provisioning</h2>
        <p className="text-slate-500 font-medium">Link hardware sensors to your digital zones for real-time telemetry.</p>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {devices.map((device, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 relative group transition-all hover:bg-white/[0.08]">
            <button
              type="button"
              onClick={() => removeDevice(i)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group/input">
                <Cpu className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors z-10" />
                <select
                  value={device.type}
                  onChange={(e) => updateDevice(i, 'type', e.target.value)}
                  className="w-full pl-14 pr-10 py-4 rounded-2xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold appearance-none cursor-pointer transition-all"
                >
                  {deviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>

              <div className="relative group/input">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors z-10" />
                <select
                  value={device.zoneId}
                  onChange={(e) => updateDevice(i, 'zoneId', e.target.value)}
                  className="w-full pl-14 pr-10 py-4 rounded-2xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold appearance-none cursor-pointer transition-all"
                >
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="relative group/input">
              <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
              <input
                placeholder="Hardware Address (MAC) *"
                value={device.macAddress}
                onChange={(e) => updateDevice(i, 'macAddress', e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all font-mono text-sm"
              />
            </div>

            <div className="relative group/input">
              <Satellite className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
              <input
                placeholder="MQTT Telemetry Topic"
                value={device.mqttTopic}
                onChange={(e) => updateDevice(i, 'mqttTopic', e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-brand-dark/50 border border-white/5 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all font-mono text-xs"
              />
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
            <Cpu className="w-12 h-12 text-slate-500 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No Devices Registered</p>
            <p className="text-slate-500 text-xs mt-1 text-center max-w-[240px]">Optional — you can add hardware nodes from the dashboard at any time.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={addDevice}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-slate-500 hover:border-brand-green/30 hover:text-brand-green hover:bg-brand-green/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Provision New Hardware Node
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
          onClick={onSubmit}
          disabled={loading}
          className="flex-[2] py-5 rounded-2xl bg-brand-green text-brand-dark font-black tracking-tight hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Activity className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Initialize OS Architecture
              <Zap className="w-5 h-5 fill-brand-dark" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
