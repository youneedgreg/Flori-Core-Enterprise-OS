'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Globe, DollarSign, Loader2, Save } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SUPPORTED_CURRENCIES = ['USD', 'KES', 'EUR', 'GBP'];

export default function FinancialSettingsPage() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      if (!token) return;

      const res = await fetch(`${API}/financials/settings/currency`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.baseCurrency) {
        setBaseCurrency(data.baseCurrency);
      }
    } catch (e) {
      toast.error('Failed to load currency settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      
      const res = await fetch(`${API}/financials/settings/currency`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ currency: baseCurrency })
      });

      if (!res.ok) throw new Error('Failed to update');
      toast.success('Global Base Currency updated successfully!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 max-w-2xl relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Financial Settings</h1>
        <p className="text-slate-400 mt-2">Manage your global ledger configuration and multi-currency exchange parameters.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
         <div className="flex items-center gap-4 mb-6">
           <div className="p-3 bg-emerald-500/20 rounded-xl">
             <Globe className="w-6 h-6 text-emerald-400" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-white tracking-tight">Global Base Currency</h2>
             <p className="text-sm text-slate-500">All ledger journals are normalized against this standard.</p>
           </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {SUPPORTED_CURRENCIES.map(c => (
              <button 
                key={c}
                onClick={() => setBaseCurrency(c)}
                className={`py-4 px-6 rounded-2xl font-black tracking-widest transition-all ${
                  baseCurrency === c 
                    ? 'bg-emerald-500 text-brand-dark shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c}
              </button>
           ))}
         </div>
         
         <div className="mt-6 flex justify-end">
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-white text-brand-dark rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
         </div>
      </div>
    </div>
  );
}
