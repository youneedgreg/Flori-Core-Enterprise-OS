'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Kanban, ChevronRight, AlertCircle,
  Mail, Phone, Search, DollarSign, Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateLeadModal } from './CreateLeadModal';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  value?: number;
  status: string;
  notes?: string;
  assignedTo?: { email: string };
  customer?: { name: string } | null;
  createdAt: string;
}

interface LeadsPipelineProps {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onRefresh: () => void;
}

const COLUMNS = [
  { id: 'PROSPECT',    label: 'Prospects',         color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    bar: 'bg-cyan-500' },
  { id: 'NEGOTIATION', label: 'Negotiation',        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'bg-amber-500' },
  { id: 'CONTRACT',    label: 'Contract Sent',      color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  bar: 'bg-purple-500' },
  { id: 'ACTIVE',      label: 'Active (Converted)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  { id: 'LOST',        label: 'Lost',              color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    bar: 'bg-rose-500' },
];

export function LeadsPipeline({ apiBase, getAuthHeader, onRefresh }: LeadsPipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/leads`, { headers });
      if (!res.ok) throw new Error('Failed to fetch leads');
      setLeads(await res.json());
    } catch {
      toast.error('Could not load Leads');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader]);

  useEffect(() => { void fetchLeads(); }, [fetchLeads]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    const prevLeads = [...leads];
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      const res = await fetch(`${apiBase}/sales/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      const col = COLUMNS.find((c) => c.id === newStatus);
      toast.success(`Lead → ${col?.label ?? newStatus}`);
      onRefresh();
    } catch {
      toast.error('Failed to update lead status');
      setLeads(prevLeads);
    }
  };

  const filtered = leads.filter(
    (l) =>
      !searchTerm ||
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPipeline = leads
    .filter((l) => !['ACTIVE', 'LOST'].includes(l.status))
    .reduce((sum, l) => sum + (l.value ?? 0), 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pipeline toolbar */}
      <div className="px-8 py-5 border-b border-white/5 flex items-center gap-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads…"
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700 w-56"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Pipeline:</span>
          <span className="text-sm font-black text-emerald-400">USD {(totalPipeline / 1000).toFixed(1)}k</span>
        </div>
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          {leads.length} lead{leads.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex overflow-x-auto p-8 gap-5 custom-scrollbar">
        {COLUMNS.map((col) => {
          const colLeads = filtered.filter((l) => l.status === col.id);
          const colValue = colLeads.reduce((acc, l) => acc + (l.value ?? 0), 0);

          return (
            <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.bar} opacity-80`} />
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${col.color}`}>
                      {col.label}
                    </h3>
                  </div>
                  <span className={`w-6 h-6 rounded-lg ${col.bg} border ${col.border} flex items-center justify-center text-[10px] font-black ${col.color}`}>
                    {colLeads.length}
                  </span>
                </div>
                <div className="h-0.5 w-full rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${col.bar} opacity-60`} style={{ width: '100%' }} />
                </div>
                {colValue > 0 && (
                  <p className={`text-[10px] font-black mt-1.5 text-right ${col.color} opacity-70`}>
                    USD {(colValue / 1000).toFixed(1)}k
                  </p>
                )}
              </div>

              {/* Lead cards */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pb-8">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-slate-900/80 border border-white/5 rounded-[1.5rem] p-5 hover:border-white/10 transition-colors shadow-xl group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{lead.name}</h4>
                        {lead.value ? (
                          <p className="text-[11px] font-black text-emerald-400 mt-0.5">
                            USD {lead.value.toLocaleString()}
                          </p>
                        ) : null}
                        {lead.customer && (
                          <p className="text-[9px] font-black text-blue-400 uppercase mt-0.5">
                            → {lead.customer.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {COLUMNS.map((c) => {
                          if (c.id === lead.status) return null;
                          return (
                            <button
                              key={c.id}
                              onClick={() => void updateLeadStatus(lead.id, c.id)}
                              className={`w-6 h-6 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center transition-all hover:scale-110`}
                              title={`Move to ${c.label}`}
                            >
                              {c.id === 'LOST' ? (
                                <AlertCircle className={`w-3 h-3 ${c.color}`} />
                              ) : (
                                <ChevronRight className={`w-3 h-3 ${c.color}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="text-[10px] font-black truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="text-[10px] font-black">{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    {lead.notes && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-slate-600 italic line-clamp-2">{lead.notes}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-700">
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      {lead.assignedTo && (
                        <span className="text-slate-500">{lead.assignedTo.email.split('@')[0]}</span>
                      )}
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="h-24 border border-dashed border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-700 gap-2">
                    <Kanban className="w-4 h-4 opacity-40" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showEditModal && (
        <CreateLeadModal
          isOpen
          onClose={() => setShowEditModal(null)}
          apiBase={apiBase}
          getAuthHeader={getAuthHeader}
          onSuccess={() => { setShowEditModal(null); void fetchLeads(); onRefresh(); }}
        />
      )}
    </div>
  );
}
