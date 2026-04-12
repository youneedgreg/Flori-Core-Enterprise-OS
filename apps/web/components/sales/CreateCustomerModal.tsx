/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Building2, CreditCard, FileText, Loader2 } from 'lucide-react';
import { Country } from 'country-state-city';
import { toast } from 'sonner';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onSuccess: () => void;
}

const CUSTOMER_TYPES = [
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'EXPORTER', label: 'Exporter' },
  { value: 'AUCTION_HOUSE', label: 'Auction House' },
  { value: 'DIRECT_BUYER', label: 'Direct Buyer' },
];

const CUSTOMER_SEGMENTS = [
  { value: 'LOCAL_RETAIL', label: 'Local Retail' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'SPOT_MARKET', label: 'Spot Market' },
];

export function CreateCustomerModal({ isOpen, onClose, apiBase, getAuthHeader, onSuccess }: CreateCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const countries = Country.getAllCountries();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    country: 'Kenya',
    type: 'RETAILER',
    segment: 'LOCAL_RETAIL',
    creditLimit: '',
    commissionRate: '',
    paymentTerms: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
      };

      const res = await fetch(`${apiBase}/sales/customers`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create customer');
      }

      toast.success('Customer created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
      <div 
        className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">CRM Intelligence</span>
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Onboard New <span className="text-emerald-400">Customer</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-900/50">
          <form id="create-customer-form" onSubmit={handleSubmit} className="space-y-10">
            
            {/* Essential Profile */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Essential Profile</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      required
                      placeholder="e.g. Global Exports Ltd"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Contact Person</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      placeholder="e.g. John Smith"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                      value={formData.contactPerson}
                      onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="email"
                      placeholder="billing@customer.com"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      placeholder="+254..."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Classification */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Classification & Geodata</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Type</label>
                  <select 
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Segment</label>
                  <select 
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    value={formData.segment}
                    onChange={e => setFormData({...formData, segment: e.target.value})}
                  >
                    {CUSTOMER_SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <select 
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                    >
                      {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  <textarea 
                    rows={2}
                    placeholder="Enter full physical address..."
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all resize-none"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Financials */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Financial Configuration</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Limit (USD)</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                      value={formData.creditLimit}
                      onChange={e => setFormData({...formData, creditLimit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comm. Rate (%)</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="number"
                      placeholder="0.0"
                      disabled={formData.type !== 'AUCTION_HOUSE'}
                      className="w-full bg-slate-950/50 border border-white/10 shadow-inner rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      value={formData.commissionRate}
                      onChange={e => setFormData({...formData, commissionRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Terms</label>
                  <input 
                    placeholder="e.g. Net-30"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                    value={formData.paymentTerms}
                    onChange={e => setFormData({...formData, paymentTerms: e.target.value})}
                  />
                </div>
              </div>
            </section>

             {/* Internal Notes */}
             <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Strategic Notes</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <textarea 
                rows={3}
                placeholder="Internal strategic notes regarding this customer..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] p-8 text-sm font-medium text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 flex items-center justify-between shrink-0 bg-slate-950/50 backdrop-blur-xl">
           <button 
             onClick={onClose}
             className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
           >
             Dismiss
           </button>
           <button 
             form="create-customer-form"
             type="submit"
             disabled={loading}
             className="px-10 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
             Complete Onboarding
           </button>
        </div>
      </div>
    </div>
  );
}
