import React, { useRef } from 'react';
import { Country, City } from 'country-state-city';
import { ChevronDown, Building2, Mail, Phone, MapPin, Award, Upload } from 'lucide-react';

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

  const countries = React.useMemo(() => Country.getAllCountries(), []);

  const initialParse = React.useMemo(() => {
    if (!data.location) return { code: '', city: '' };
    if (data.location.includes(', ')) {
      const [cityStr, countryStr] = data.location.split(', ');
      const foundCountry = countries.find(c => c.name === countryStr);
      return { code: foundCountry?.isoCode || '', city: cityStr };
    }
    const foundCountry = countries.find(c => c.name === data.location);
    return { code: foundCountry?.isoCode || '', city: '' };
  }, [data.location, countries]);

  const [countryCode, setCountryCode] = React.useState(initialParse.code);
  const [cityName, setCityName] = React.useState(initialParse.city);

  const cities = React.useMemo(() => (countryCode ? City.getCitiesOfCountry(countryCode) ?? [] : []), [countryCode]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCountryCode(code);
    setCityName('');
    const countryName = Country.getCountryByCode(code)?.name || '';
    onChange({ ...data, location: countryName });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setCityName(city);
    const countryName = Country.getCountryByCode(countryCode)?.name || '';
    onChange({ ...data, location: `${city}, ${countryName}` });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Farm Profile</h2>
        <p className="text-slate-500 font-medium">Define your operational identity and global certifications.</p>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div className="flex items-center gap-8 p-6 rounded-3xl bg-white/5 border border-white/10 group transition-all hover:bg-white/[0.08]">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-dark/50 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-brand-green/50 transition-all">
              {data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logoUrl} alt="Farm Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-500" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 translate-x-2 translate-y-2 w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center text-brand-dark shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all z-20"
            >
              <Upload className="w-4.5 h-4.5 stroke-[3px]" />
            </button>
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">Brand Identity</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-[240px]">Upload your farm&apos;s official mark for workspace personalization.</p>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors" />
            <input
              required
              placeholder="Official Farm Name *"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors z-10" />
              <select
                value={countryCode}
                onChange={handleCountryChange}
                className="w-full pl-14 pr-10 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold appearance-none cursor-pointer transition-all"
              >
                <option value="" disabled className="bg-brand-dark">Select Country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode} className="bg-brand-dark text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors z-10" />
              <select
                value={cityName}
                onChange={handleCityChange}
                disabled={!countryCode || cities.length === 0}
                className="w-full pl-14 pr-10 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold appearance-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <option value="" disabled className="bg-brand-dark">Select City</option>
                {cities.map((city, idx) => (
                  <option key={`${city.name}-${idx}`} value={city.name} className="bg-brand-dark text-white">
                    {city.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="relative group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors" />
            <input
              placeholder="GPS Coordinates (e.g. -0.3, 36.9)"
              value={data.gpsCoordinates}
              onChange={(e) => onChange({ ...data, gpsCoordinates: e.target.value })}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors" />
              <input
                placeholder="Contact Email"
                type="email"
                value={data.contactEmail}
                onChange={(e) => onChange({ ...data, contactEmail: e.target.value })}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all"
              />
            </div>
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-green transition-colors" />
              <input
                placeholder="Contact Phone"
                type="tel"
                value={data.contactPhone}
                onChange={(e) => onChange({ ...data, contactPhone: e.target.value })}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 mb-4 ml-1">
              <Award className="w-4 h-4 text-brand-green" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Certifications</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {certOptions.map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleCert(cert)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                    data.certifications.includes(cert)
                      ? 'bg-brand-green/10 border-brand-green/30 text-brand-green shadow-lg shadow-emerald-500/5'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.name}
        className="w-full py-5 rounded-2xl bg-brand-green text-brand-dark font-black tracking-tight hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] mt-4"
      >
        Establish Node Architecture →
      </button>
    </div>
  );
}
