'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Loader2, MessageSquare, Briefcase, Send, Users } from 'lucide-react';
import { toast } from 'sonner';

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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
      <div className="bg-slate-900 border border-white/10 w-full max-w-6xl h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row">
        
        {/* Left pane: Profile */}
        <div className="w-full md:w-[380px] bg-slate-950 border-r border-white/5 flex flex-col">
          <header className="p-8 border-b border-white/5 relative">
            <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors md:hidden">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
               <Briefcase className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">{customer.name as string}</h2>
            <div className="flex flex-wrap gap-2 mt-4">
               <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                 {(customer.type as string).replace('_', ' ')}
               </span>
               <span className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                 {(customer.segment as string).replace('_', ' ')}
               </span>
            </div>
          </header>

          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
             <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Details</h3>
               {Boolean(customer.email) && (
                 <div className="flex items-center gap-4 text-slate-300">
                   <div className="p-2 bg-white/5 rounded-lg"><Mail className="w-4 h-4 text-slate-400" /></div>
                   <span className="text-xs font-bold">{customer.email as string}</span>
                 </div>
               )}
               {Boolean(customer.phone) && (
                 <div className="flex items-center gap-4 text-slate-300">
                   <div className="p-2 bg-white/5 rounded-lg"><Phone className="w-4 h-4 text-slate-400" /></div>
                   <span className="text-xs font-bold">{customer.phone as string}</span>
                 </div>
               )}
               {Boolean(customer.address) && (
                 <div className="flex items-center gap-4 text-slate-300">
                   <div className="p-2 bg-white/5 rounded-lg"><MapPin className="w-4 h-4 text-slate-400" /></div>
                   <span className="text-xs font-bold">{customer.address as string}</span>
                 </div>
               )}
             </div>

             <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Account Info</h3>
                {customer.creditLimit !== null && (
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Limit</span>
                     <span className="text-sm font-black text-white">USD {customer.creditLimit as number}</span>
                   </div>
                )}
                {customer.commissionRate !== null && (
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</span>
                     <span className="text-sm font-black text-purple-400">{customer.commissionRate as number}%</span>
                   </div>
                )}
                {Boolean(customer.paymentTerms) && (
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</span>
                     <span className="text-xs font-black text-white">{customer.paymentTerms as string}</span>
                   </div>
                )}
             </div>
             
             {Boolean(customer.notes) && (
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Notes</h3>
                  <p className="text-xs text-slate-400 italic leading-relaxed">{customer.notes as string}</p>
                </div>
             )}
          </div>
        </div>

        {/* Right pane: Timeline */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors hidden md:block z-10">
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-8 pb-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl z-0">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Interaction Setup
            </h3>
          </div>

          <div className="p-8 border-b border-white/5 bg-slate-950/50">
             <form onSubmit={(e) => void handleAddLog(e)} className="space-y-4">
               <div className="flex gap-4">
                 <select 
                   value={newLog.type}
                   onChange={e => setNewLog({...newLog, type: e.target.value})}
                   className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-emerald-500/50 appearance-none"
                 >
                   <option value="NOTE">Quick Note</option>
                   <option value="CALL">Phone Call</option>
                   <option value="MEETING">Meeting</option>
                   <option value="EMAIL">Email Log</option>
                 </select>
                 <input 
                   placeholder="Subject (Optional)..."
                   value={newLog.subject}
                   onChange={e => setNewLog({...newLog, subject: e.target.value})}
                   className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-emerald-500/50"
                 />
               </div>
               <div className="relative">
                 <textarea 
                   rows={3}
                   required
                   placeholder="Write notes..."
                   value={newLog.notes}
                   onChange={e => setNewLog({...newLog, notes: e.target.value})}
                   className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 pr-16 text-sm text-white outline-none focus:border-emerald-500/50 resize-none font-medium"
                 />
                 <button 
                   type="submit"
                   disabled={submittingLog || !newLog.notes.trim()}
                   className="absolute right-3 bottom-3 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 disabled:opacity-50 hover:bg-emerald-400 transition-colors shadow-lg"
                 >
                   {submittingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                 </button>
               </div>
             </form>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
            {timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
                <MessageSquare className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Interaction History</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-white/5">
                {timeline.map((item) => {
                  const isAuto = item.source === 'AUTOMATED';
                  return (
                    <div key={item.id as string} className="relative flex gap-6 pl-12 group">
                      <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-slate-900 flex items-center justify-center
                        ${isAuto ? 'bg-indigo-500 text-white' : 
                          item.type === 'CALL' ? 'bg-amber-500 text-slate-900' :
                          item.type === 'MEETING' ? 'bg-purple-500 text-white' :
                          item.type === 'EMAIL' ? 'bg-cyan-500 text-slate-900' :
                          'bg-emerald-500 text-slate-900'}
                      `}>
                        {isAuto ? <Mail className="w-4 h-4" /> :
                         item.type === 'CALL' ? <Phone className="w-4 h-4" /> :
                         item.type === 'MEETING' ? <Users className="w-4 h-4" /> :
                         item.type === 'EMAIL' ? <Mail className="w-4 h-4" /> :
                         <MessageSquare className="w-4 h-4" />
                        }
                      </div>
                      
                      <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-white/5 group-hover:border-white/10 transition-colors shadow-lg hover:shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isAuto ? 'Automated Message' : item.type as string}
                              </span>
                              {isAuto && (
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md text-[8px] font-black uppercase border border-indigo-500/20">System</span>
                              )}
                            </div>
                            {Boolean(item.subject) && <h4 className="text-sm font-black text-white">{item.subject as string}</h4>}
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-white/5">
                            {new Date(item.date as string).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mt-2">{item.body as string}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 pt-3 border-t border-white/5">
                          Logged By: {item.user as string}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
