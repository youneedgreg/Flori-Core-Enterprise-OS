/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, TrendingUp, FileText, User } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from './SalesUI';

interface Member {
  id: string;
  email: string;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onSuccess: () => void;
}

export function CreateLeadModal({ isOpen, onClose, apiBase, getAuthHeader, onSuccess }: CreateLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    value: '',
    notes: '',
    assignedToId: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setFetchingMembers(true);
    try {
      const res = await fetch(`${apiBase}/team`, { headers });
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        assignedToId: formData.assignedToId || undefined
      };

      const res = await fetch(`${apiBase}/sales/leads`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create lead');
      }

      toast.success('Lead created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumModal
      title="Initiate New Prospect"
      subtitle="Lead Acquisition Portal"
      onClose={onClose}
      accentColor="indigo"
    >
      <form id="create-lead-form" onSubmit={handleSubmit} className="space-y-8">
        
        <div className="space-y-6">
            <FormField label="Prospective Client / Lead Name *" accentColor="indigo">
              <div className="relative group">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  required
                  placeholder="e.g. Acme Retail Group"
                  className={`${inputCls('indigo')} pl-12`}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Email" accentColor="indigo">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="email"
                    placeholder="prospect@email.com"
                    className={`${inputCls('indigo')} pl-12`}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </FormField>
              <FormField label="Phone" accentColor="indigo">
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    placeholder="+1..."
                    className={`${inputCls('indigo')} pl-12`}
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Est. Deal Value (USD)" accentColor="indigo">
                <div className="relative group">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="number"
                    placeholder="0.00"
                    className={`${inputCls('indigo')} pl-12`}
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                  />
                </div>
              </FormField>
              <FormField label="Assign To" accentColor="indigo">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <select 
                    disabled={fetchingMembers}
                    className={`${selectCls('indigo')} pl-12`}
                    value={formData.assignedToId}
                    onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                  >
                    <option value="" className="bg-slate-950">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-950">{m.email}</option>
                    ))}
                  </select>
                </div>
              </FormField>
            </div>

            <FormField label="Initial Discovery Notes" accentColor="indigo">
              <div className="relative group">
                <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
                <textarea 
                  rows={4}
                  placeholder="Enter discovery call notes or LinkedIn source context..."
                  className={`${inputCls('indigo')} pl-12 pr-8 py-6 rounded-[2rem] resize-none`}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </FormField>
        </div>

        <SubmitBtn loading={loading} label="Register Prospect" accentColor="indigo" />
      </form>
    </PremiumModal>
  );
}
