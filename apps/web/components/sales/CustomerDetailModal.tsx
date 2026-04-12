'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Loader2, MessageSquare, Briefcase, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, selectCls, inputCls } from './SalesUI';

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
}

export function CustomerDetailModal({ customerId, onClose, apiBase, getAuthHeader }: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLog, setNewLog] = useState({ type: 'NOTE', subject: '', notes: '' });
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const [custRes, timelineRes] = await Promise.all([
        fetch(`${apiBase}/sales/customers/${customerId}`, { headers }),
        fetch(`${apiBase}/sales/customers/${customerId}/timeline`, { headers })
      ]);
      if (!custRes.ok || !timelineRes.ok) throw new Error('API Error');
      setCustomer(await custRes.json());
      setTimeline(await timelineRes.json());
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setSubmittingLog(true);
    try {
      const res = await fetch(`${apiBase}/sales/contact-logs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          ...newLog
        })
      });
      if (!res.ok) throw new Error('Failed to add log');
      toast.success('Log added');
      setNewLog({ type: 'NOTE', subject: '', notes: '' });
      await fetchData(); // Refresh timeline
    } catch {
      toast.error('Error adding log');
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading || !customer) {
    return (
      <PremiumModal 
        title="Loading Profile..." 
        onClose={onClose}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Retrieving Intelligence</p>
        </div>
      </PremiumModal>
    );
  }

  return (
    <PremiumModal
      title={customer.name as string}
      subtitle={`CRM Intelligence · Account #${(customer.id as string).slice(0, 8).toUpperCase()}`}
      onClose={onClose}
      maxWidth="max-w-6xl"
      noPadding
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left pane: Profile */}
        <div className="w-full md:w-[380px] bg-slate-950/40 border-r border-white/5 flex flex-col">
          <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar h-full">
             <div className="flex items-center gap-4 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-8 h-8 text-emerald-400" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Organization</p>
                 <h4 className="text-xl font-black text-white mt-1 uppercase italic tracking-tighter">Profile</h4>
               </div>
             </div>

             <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {(customer.type as string).replace('_', ' ')}
                </span>
                <span className="px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {(customer.segment as string).replace('_', ' ')}
                </span>
             </div>

             <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Contact Matrix</h3>
                <div className="space-y-2">
                  {Boolean(customer.email) && (
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="p-2 bg-white/5 rounded-lg"><Mail className="w-4 h-4 text-slate-400" /></div>
                      <span className="text-xs font-bold text-slate-300">{customer.email as string}</span>
                    </div>
                  )}
                  {Boolean(customer.phone) && (
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="p-2 bg-white/5 rounded-lg"><Phone className="w-4 h-4 text-slate-400" /></div>
                      <span className="text-xs font-bold text-slate-300">{customer.phone as string}</span>
                    </div>
                  )}
                  {Boolean(customer.address) && (
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="p-2 bg-white/5 rounded-lg"><MapPin className="w-4 h-4 text-slate-400" /></div>
                      <span className="text-xs font-bold text-slate-300 leading-relaxed">{customer.address as string}</span>
                    </div>
                  )}
                </div>
             </div>

             <div className="space-y-4 pt-8 border-t border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Financial Protocol</h3>
                <div className="grid grid-cols-1 gap-3">
                  {customer.creditLimit !== null && (
                     <div className="flex flex-col gap-1 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Credit Limit</span>
                       <span className="text-lg font-black text-white italic tracking-tighter">USD {(customer.creditLimit as number).toLocaleString()}</span>
                     </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {customer.commissionRate !== null && (
                       <div className="flex flex-col gap-1 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comm. Rate</span>
                         <span className="text-lg font-black text-emerald-400 italic tracking-tighter">{customer.commissionRate as number}%</span>
                       </div>
                    )}
                    {Boolean(customer.paymentTerms) && (
                       <div className="flex flex-col gap-1 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                         <span className="text-xs font-black text-white uppercase tracking-widest">{customer.paymentTerms as string}</span>
                       </div>
                    )}
                  </div>
                </div>
             </div>
             
             {Boolean(customer.notes) && (
                <div className="pt-8 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Strategic Insight</h3>
                  <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <p className="text-xs text-slate-400 italic leading-relaxed">{customer.notes as string}</p>
                  </div>
                </div>
             )}
          </div>
        </div>

        {/* Right pane: Timeline */}
        <div className="flex-1 flex flex-col bg-slate-900/20 overflow-hidden relative">
          <div className="p-8 pb-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Engagement Timeline
            </h3>
          </div>
 
          <div className="p-10 border-b border-white/5 bg-slate-950/20">
             <form onSubmit={(e) => void handleAddLog(e)} className="space-y-6">
               <div className="flex gap-4">
                 <select 
                   value={newLog.type}
                   onChange={e => setNewLog({...newLog, type: e.target.value})}
                   className={`${selectCls()} w-48`}
                 >
                   <option value="NOTE" className="bg-slate-950">Quick Note</option>
                   <option value="CALL" className="bg-slate-950">Phone Call</option>
                   <option value="MEETING" className="bg-slate-950">Meeting</option>
                   <option value="EMAIL" className="bg-slate-950">Email Log</option>
                 </select>
                 <input 
                   placeholder="Subject (Optional)..."
                   value={newLog.subject}
                   onChange={e => setNewLog({...newLog, subject: e.target.value})}
                   className={`${inputCls()} flex-1`}
                 />
               </div>
               <div className="relative group/field">
                 <textarea 
                   rows={3}
                   required
                   placeholder="Describe interaction outcomes..."
                   value={newLog.notes}
                   onChange={e => setNewLog({...newLog, notes: e.target.value})}
                   className={`${inputCls()} p-6 pr-20 rounded-[2rem] resize-none font-medium leading-relaxed bg-white/[0.04]`}
                 />
                 <button 
                   type="submit"
                   disabled={submittingLog || !newLog.notes.trim()}
                   className="absolute right-4 bottom-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 disabled:opacity-50 hover:bg-emerald-400 transition-all shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                 >
                   {submittingLog ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 </button>
               </div>
             </form>
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
            {timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-20 space-y-6">
                <MessageSquare className="w-20 h-20" />
                <p className="text-xs font-black uppercase tracking-[0.4em]">Historical Void</p>
              </div>
            ) : (
              <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-[21px] before:w-[2px] before:bg-white/5">
                {timeline.map((item) => {
                  const isAuto = item.source === 'AUTOMATED';
                  return (
                    <div key={item.id as string} className="relative flex gap-8 pl-14 group/log">
                      <div className={`absolute left-0 w-11 h-11 rounded-2xl border border-white/10 flex items-center justify-center shadow-xl z-10 transition-transform group-hover/log:scale-110
                        ${isAuto ? 'bg-indigo-500/10 text-indigo-400' : 
                          item.type === 'CALL' ? 'bg-amber-500/10 text-amber-400' :
                          item.type === 'MEETING' ? 'bg-purple-500/10 text-purple-400' :
                          item.type === 'EMAIL' ? 'bg-cyan-500/10 text-cyan-400' :
                          'bg-emerald-500/10 text-emerald-400'}
                      `}>
                        {isAuto ? <Mail className="w-5 h-5" /> :
                         item.type === 'CALL' ? <Phone className="w-5 h-5" /> :
                         item.type === 'MEETING' ? <Users className="w-5 h-5" /> :
                         item.type === 'EMAIL' ? <Mail className="w-5 h-5" /> :
                         <MessageSquare className="w-5 h-5" />
                        }
                      </div>
                      
                      <div className="flex-1 bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5 group-hover/log:bg-white/[0.04] group-hover/log:border-white/10 transition-all shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {isAuto ? 'Event Protocol' : item.type as string}
                              </span>
                              {isAuto && (
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[8px] font-black uppercase border border-indigo-500/20">Automated</span>
                              )}
                            </div>
                            {Boolean(item.subject) && <h4 className="text-base font-black text-white italic tracking-tight">{item.subject as string}</h4>}
                          </div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 p-2.5 rounded-xl border border-white/5">
                            {new Date(item.date as string).toLocaleString().toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{item.body as string}</p>
                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-emerald-500" />
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             Operator: {item.user as string}
                           </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PremiumModal>
  );
}
