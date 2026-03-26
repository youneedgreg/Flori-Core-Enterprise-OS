'use client';

import React from 'react';

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
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white">Connect IoT Devices</h2>
      <p className="text-slate-400 mb-2">Register your soil and environmental sensors. <span className="text-emerald-400 font-medium">Optional</span> — you can add devices later.</p>

      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {devices.map((device, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeDevice(i)}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={device.type}
                onChange={(e) => updateDevice(i, 'type', e.target.value)}
                className="px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {deviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={device.zoneId}
                onChange={(e) => updateDevice(i, 'zoneId', e.target.value)}
                className="px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <input
              placeholder="MAC Address (e.g. AA:BB:CC:DD:EE:FF) *"
              value={device.macAddress}
              onChange={(e) => updateDevice(i, 'macAddress', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 font-mono text-sm"
            />
            <input
              placeholder={`MQTT Topic (e.g. farm/{tenantId}/zone/{zoneId}/sensor)`}
              value={device.mqttTopic}
              onChange={(e) => updateDevice(i, 'mqttTopic', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 font-mono text-sm"
            />
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">No devices registered — click below to add one or skip.</p>
      )}

      <button
        type="button"
        onClick={addDevice}
        className="mt-4 w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm font-medium"
      >
        + Add IoT Device
      </button>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-70"
        >
          {loading ? 'Setting up…' : '🚀 Launch Dashboard'}
        </button>
      </div>
    </div>
  );
}
