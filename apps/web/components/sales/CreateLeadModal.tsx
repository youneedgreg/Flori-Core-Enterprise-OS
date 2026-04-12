/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, TrendingUp, FileText, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
      <div 
        className="bg-slate-900 border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <UserPlus className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Lead Acquisition</span>
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Initiate New <span className="text-indigo-400">Prospect</span>
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
          <form id="create-lead-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prospective Client / Lead Name *</label>
                  <div className="relative group">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      required
                      placeholder="e.g. Acme Retail Group"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="email"
                        placeholder="prospect@email.com"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        placeholder="+1..."
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Est. Deal Value (USD)</label>
                    <div className="relative group">
                      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                        value={formData.value}
                        onChange={e => setFormData({...formData, value: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign To</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <select 
                        disabled={fetchingMembers}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                        value={formData.assignedToId}
                        onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Discovery Notes</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
                    <textarea 
                      rows={4}
                      placeholder="Enter discovery call notes or LinkedIn source context..."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] pl-12 pr-8 py-6 text-sm font-medium text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all resize-none"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
            </div>
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
             form="create-lead-form"
             type="submit"
             disabled={loading}
             className="px-10 py-4 bg-indigo-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
             Register Prospect
           </button>
        </div>
      </div>
    </div>
  );
}
