/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Building2, User, Mail, Phone, MapPin, CreditCard, FileText } from 'lucide-react';
import { Country } from 'country-state-city';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from './SalesUI';

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

  return (
    <PremiumModal
      title="Onboard New Customer"
      subtitle="CRM Intelligence Hub"
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <form id="create-customer-form" onSubmit={handleSubmit} className="space-y-10">
        
        {/* Essential Profile */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Essential Profile</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Company Name *">
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  required
                  placeholder="e.g. Global Exports Ltd"
                  className={`${inputCls()} pl-12`}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </FormField>

            <FormField label="Primary Contact Person">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  placeholder="e.g. John Smith"
                  className={`${inputCls()} pl-12`}
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
            </FormField>

            <FormField label="Email Address">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="email"
                  placeholder="billing@customer.com"
                  className={`${inputCls()} pl-12`}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </FormField>

            <FormField label="Phone Number">
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  placeholder="+254..."
                  className={`${inputCls()} pl-12`}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </FormField>
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
            <FormField label="Customer Type">
              <select 
                className={selectCls()}
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-950">{t.label}</option>)}
              </select>
            </FormField>

            <FormField label="Market Segment">
              <select 
                className={selectCls()}
                value={formData.segment}
                onChange={e => setFormData({...formData, segment: e.target.value})}
              >
                {CUSTOMER_SEGMENTS.map(s => <option key={s.value} value={s.value} className="bg-slate-950">{s.label}</option>)}
              </select>
            </FormField>

            <FormField label="Country">
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <select 
                  className={`${selectCls()} pl-12`}
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                >
                  {countries.map(c => <option key={c.isoCode} value={c.name} className="bg-slate-950">{c.name}</option>)}
                </select>
              </div>
            </FormField>
          </div>

          <FormField label="Physical Address">
            <div className="relative group">
              <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
              <textarea 
                rows={2}
                placeholder="Enter full physical address..."
                className={`${inputCls()} pl-12 resize-none`}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </FormField>
        </section>

        {/* Financials */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Financial Configuration</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormField label="Credit Limit (USD)">
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="number"
                  placeholder="0.00"
                  className={`${inputCls()} pl-12`}
                  value={formData.creditLimit}
                  onChange={e => setFormData({...formData, creditLimit: e.target.value})}
                />
              </div>
            </FormField>

            <FormField label="Comm. Rate (%)">
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="number"
                  placeholder="0.0"
                  disabled={formData.type !== 'AUCTION_HOUSE'}
                  className={`${inputCls()} pl-12 disabled:opacity-20`}
                  value={formData.commissionRate}
                  onChange={e => setFormData({...formData, commissionRate: e.target.value})}
                />
              </div>
            </FormField>

            <FormField label="Payment Terms">
              <input 
                placeholder="e.g. Net-30"
                className={inputCls()}
                value={formData.paymentTerms}
                onChange={e => setFormData({...formData, paymentTerms: e.target.value})}
              />
            </FormField>
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
            className={`${inputCls()} rounded-[2rem] p-8 resize-none`}
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
          />
        </section>

        <SubmitBtn loading={loading} label="Complete Onboarding" />
      </form>
    </PremiumModal>
  );
}
