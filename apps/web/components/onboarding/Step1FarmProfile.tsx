'use client';

import React, { useRef } from 'react';

interface Props {
  data: { name: string; location: string; gpsCoordinates: string; certifications: string[]; contactEmail: string; contactPhone: string; logoUrl: string };
  onChange: (d: Props['data']) => void;
  onNext: () => void;
}

const certOptions = ['GlobalG.A.P.', 'Fairtrade', 'Rainforest Alliance', 'MPS', 'KFC Silver', 'USDA Organic'];

export default function Step1FarmProfile({ data, onChange, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCert = (cert: string) => {
    const updated = data.certifications.includes(cert)
      ? data.certifications.filter((c) => c !== cert)
      : [...data.certifications, cert];
    onChange({ ...data, certifications: updated });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white">Farm Profile</h2>
      <p className="text-slate-400 mb-8">Tell us about your operation so we can tailor your workspace.</p>

      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center relative group">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logoUrl} alt="Farm Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-slate-500">🏢</span>
            )}
            <div 
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-xs font-semibold text-white">Upload</span>
            </div>
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Farm Logo</h3>
            <p className="text-sm text-slate-400 mb-3">Upload your farm&apos;s logo (PGN, JPG) to personalize your workspace.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {data.logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleLogoChange}
            />
          </div>
        </div>

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
