'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Kanban, ChevronRight, AlertCircle, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  value?: number;
  status: string;
  notes?: string;
  assignedTo?: { email: string };
  createdAt: string;
}

interface LeadsPipelineProps {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onRefresh: () => void;
}

const COLUMNS = [
  { id: 'PROSPECT', label: 'Prospects', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'CONTRACT', label: 'Contract Sent', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'ACTIVE', label: 'Converted (Active)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'LOST', label: 'Lost', color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

export function LeadsPipeline({ apiBase, getAuthHeader, onRefresh }: LeadsPipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchLeads = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/leads`, { headers });
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      toast.error('Could not load Leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    
    // Optimistic UI
    const prevLeads = [...leads];
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const res = await fetch(`${apiBase}/sales/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Lead moved to ${newStatus}`);
      onRefresh(); // Refresh parent stats
    } catch (err) {
      toast.error('Failed to update lead status');
      setLeads(prevLeads); // Revert
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-x-auto p-8 gap-6 custom-scrollbar">
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);
        const colTotal = colLeads.reduce((acc, l) => acc + (l.value || 0), 0);

        return (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col pt-2">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.bg} border border-${col.color.split('-')[1]}-500/30 flex items-center justify-center`}>
                     <div className={`w-1 h-1 rounded-full ${col.bg.replace('/10', '')}`} />
                  </div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.label}</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500">{colLeads.length}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className={`h-full ${col.bg.replace('/10', '')} opacity-50`} style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] font-black text-slate-400 mt-2 text-right">
                USD {(colTotal / 1000).toFixed(1)}k
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-10">
              {colLeads.map(lead => (
                <div key={lead.id} className="bg-slate-900/80 border border-white/5 rounded-[1.5rem] p-5 hover:border-white/10 transition-colors shadow-xl group">
                  <div className="flex justify-between items-start mb-3">
                     <div>
                       <h4 className="text-sm font-black text-white">{lead.name}</h4>
                       {lead.value ? <p className="text-[10px] font-black text-emerald-400 mt-1">USD {lead.value.toLocaleString()}</p> : null}
                     </div>
                     
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {COLUMNS.map((c) => {
                          if (c.id === lead.status) return null;
                          return (
                            <button
                               key={c.id}
                               onClick={() => void updateLeadStatus(lead.id, c.id)}
                               className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                               title={`Move to ${c.label}`}
                            >
                               {c.id === 'LOST' ? <AlertCircle className="w-3 h-3 text-rose-400" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          );
                        })}
                     </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                     {lead.email && (
                       <div className="flex items-center gap-2 text-slate-400">
                         <Mail className="w-3 h-3" />
                         <span className="text-[10px] font-black">{lead.email}</span>
                       </div>
                     )}
                     {lead.phone && (
                       <div className="flex items-center gap-2 text-slate-400">
                         <Phone className="w-3 h-3" />
                         <span className="text-[10px] font-black">{lead.phone}</span>
                       </div>
                     )}
                  </div>
                  
                  {lead.notes && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-slate-500 italic line-clamp-2">{lead.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
                     <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                     {lead.assignedTo && <span>{lead.assignedTo.email.split('@')[0]}</span>}
                  </div>
                </div>
              ))}
              
              {colLeads.length === 0 && (
                <div className="h-32 border-2 border-dashed border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-500 gap-2">
                   <Kanban className="w-5 h-5 opacity-50" />
                   <span className="text-[10px] font-black uppercase tracking-widest">No Leads</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
