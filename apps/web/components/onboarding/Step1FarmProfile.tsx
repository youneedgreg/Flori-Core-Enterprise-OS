'use client';

import React from 'react';

interface Props {
  data: { name: string; location: string; gpsCoordinates: string; certifications: string[]; contactEmail: string; contactPhone: string };
  onChange: (d: Props['data']) => void;
  onNext: () => void;
}

const certOptions = ['GlobalG.A.P.', 'Fairtrade', 'Rainforest Alliance', 'MPS', 'KFC Silver', 'USDA Organic'];

export default function Step1FarmProfile({ data, onChange, onNext }: Props) {
  const toggleCert = (cert: string) => {
    const updated = data.certifications.includes(cert)
      ? data.certifications.filter((c) => c !== cert)
      : [...data.certifications, cert];
    onChange({ ...data, certifications: updated });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white">Farm Profile</h2>
      <p className="text-slate-400 mb-8">Tell us about your operation so we can tailor your workspace.</p>

      <div className="space-y-4">
        <input
          required
          placeholder="Farm Name *"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 transition-all"
        />
        <input
          placeholder="Location (city, country)"
          value={data.location}
          onChange={(e) => onChange({ ...data, location: e.target.value })}
          className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 transition-all"
        />
        <input
          placeholder="GPS Coordinates (optional, e.g. -0.3°, 36.9°)"
          value={data.gpsCoordinates}
          onChange={(e) => onChange({ ...data, gpsCoordinates: e.target.value })}
          className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 transition-all"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Contact Email"
            type="email"
            value={data.contactEmail}
            onChange={(e) => onChange({ ...data, contactEmail: e.target.value })}
            className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 transition-all"
          />
          <input
            placeholder="Contact Phone"
            type="tel"
            value={data.contactPhone}
            onChange={(e) => onChange({ ...data, contactPhone: e.target.value })}
            className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500 transition-all"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Certifications</p>
          <div className="flex flex-wrap gap-3">
            {certOptions.map((cert) => (
              <button
                key={cert}
                type="button"
                onClick={() => toggleCert(cert)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  data.certifications.includes(cert)
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {cert}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.name}
        className="mt-8 w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
