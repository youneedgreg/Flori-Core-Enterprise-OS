/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Building2, 
  Package, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  Trophy,
  ChevronRight,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface StoreItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
}

interface RFQPortalProps {
  api: string;
  headers: any;
  vendors: Vendor[];
  onClose: () => void;
  onRefresh: () => void;
}

export function RFQPortal({ api, headers, vendors, onClose, onRefresh }: RFQPortalProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'compare'>('list');
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);

  // Create Form State
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    notes: '',
    expiryDate: '',
    vendorIds: [] as string[],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, rfqsRes] = await Promise.all([
          fetch(`${api}/stores/items`, { headers }),
          fetch(`${api}/procurement/rfqs`, { headers }),
        ]);
        if (itemsRes.ok) setItems(await itemsRes.json());
        if (rfqsRes.ok) setRfqs(await rfqsRes.json());
      } catch (err) {
        console.error('Failed to fetch RFQ data', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [api, headers]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vendorIds.length === 0) {
      toast.error('Select at least one vendor');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${api}/procurement/rfqs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ itemId: formData.itemId, quantity: Number(formData.quantity), notes: formData.notes }],
          notes: formData.notes,
          expiryDate: formData.expiryDate || undefined,
          vendorIds: formData.vendorIds,
        }),
      });
      if (!res.ok) throw new Error('Failed to create RFQ');
      toast.success('RFQ sent to selected vendors');
      setView('list');
      onRefresh();
      // Re-fetch RFQs
      const rfqsRes = await fetch(`${api}/procurement/rfqs`, { headers });
      if (rfqsRes.ok) setRfqs(await rfqsRes.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptResponse = async (rfqId: string, responseId: string) => {
    if (!confirm('Accept this quote? This will close the RFQ and generate a Purchase Order.')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${api}/procurement/rfqs/${rfqId}/responses/${responseId}/accept`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to accept quote');
      toast.success('Quote accepted! PO has been generated.');
      setView('list');
      onRefresh();
      // Re-fetch RFQs
      const rfqsRes = await fetch(`${api}/procurement/rfqs`, { headers });
      if (rfqsRes.ok) setRfqs(await rfqsRes.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-brand-dark/95 backdrop-blur-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3 leading-none">
              Multi-Quote <span className="text-emerald-400">Response</span> Management
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">Strategic Sourcing · RFQ Decision Portal</p>
          </div>
          <div className="flex items-center gap-4">
            {view === 'list' && (
              <button 
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> New RFQ
              </button>
            )}
            {(view === 'create' || view === 'compare') && (
              <button 
                onClick={() => setView('list')}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Back to List
              </button>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          
          {view === 'list' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : rfqs.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Send className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No active Request for Quotes (RFQs)</p>
                  <button onClick={() => setView('create')} className="mt-6 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300">
                    Create Strategic RFQ →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rfqs.map((rfq) => {
                    const rfqItems = rfq.items as any[];
                    const itemName = items.find(i => i.id === rfqItems[0]?.itemId)?.name ?? 'Unknown Item';
                    const activeResponses = rfq.responses.filter((r: any) => r.unitPrice > 0).length;
                    const rfqTotalResponses = rfq.responses.length;
                    
                    return (
                      <div 
                        key={rfq.id}
                        className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${rfq.status === 'CLOSED' ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{itemName}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Status: <span className={rfq.status === 'CLOSED' ? 'text-slate-400' : 'text-emerald-400'}>{rfq.status}</span>
                              </p>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Responses: <span className="text-slate-300">{activeResponses} / {rfqTotalResponses}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedRfq(rfq); setView('compare'); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-500 transition-all"
                        >
                          {rfq.status === 'CLOSED' ? 'View Result' : 'Review Quotes'} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'create' && (
            <form onSubmit={handleCreateRfq} className="max-w-2xl mx-auto space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Required *</label>
                  <select 
                    required
                    value={formData.itemId}
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="" className="bg-slate-900 italic">Select source item...</option>
                    {items.map(item => <option key={item.id} value={item.id} className="bg-slate-900">{item.name} ({item.sku})</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity Required *</label>
                  <input 
                    type="number" 
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invite Vendors (Select multi) *</label>
                <div className="grid grid-cols-3 gap-3">
                  {vendors.filter(v => v.isActive).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        const ids = formData.vendorIds.includes(v.id) 
                          ? formData.vendorIds.filter(id => id !== v.id)
                          : [...formData.vendorIds, v.id];
                        setFormData({ ...formData, vendorIds: ids });
                      }}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-left truncate ${
                        formData.vendorIds.includes(v.id) 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_-5px_#10b98133]' 
                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 mb-2 ${formData.vendorIds.includes(v.id) ? 'text-emerald-400' : 'text-slate-600'}`} />
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-600 uppercase italic mt-4">
                    Vendors will receive an email notice to submit their quotes via the supplier link.
                  </p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-[0.3em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-emerald-500/10"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Dispatch Multi-Quote Request</>}
              </button>
            </form>
          )}

          {view === 'compare' && selectedRfq && (
            <div className="space-y-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Quote Comparison Matrix</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Item: <span className="text-emerald-400">{items.find(i => i.id === (selectedRfq.items as any[])[0]?.itemId)?.name}</span></p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Requirement</p>
                  <p className="text-xs font-black text-white">{(selectedRfq.items as any[])[0]?.quantity} Units</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedRfq.responses.map((resp: any) => {
                  const isSubmitted = resp.unitPrice > 0;
                  const isAccepted = resp.status === 'ACCEPTED';
                  const isBestPrice = isSubmitted && resp.unitPrice === Math.min(...selectedRfq.responses.filter((r: any) => r.unitPrice > 0).map((r: any) => r.unitPrice));

                  return (
                    <div 
                      key={resp.id}
                      className={`p-8 rounded-[2rem] border transition-all relative overflow-hidden ${
                        isAccepted 
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_40px_-10px_#10b98133]' 
                          : isSubmitted ? 'bg-white/5 border-white/10' : 'bg-white/2 border-dashed border-white/5 opacity-60'
                      }`}
                    >
                      {isBestPrice && !isAccepted && (
                        <div className="absolute top-0 right-0 p-3 bg-emerald-500 rounded-bl-2xl">
                          <TrendingDown className="w-4 h-4 text-slate-950" />
                        </div>
                      )}
                      {isAccepted && (
                        <div className="absolute top-0 right-0 p-3 bg-emerald-500 rounded-bl-2xl">
                          <Trophy className="w-4 h-4 text-slate-950" />
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tight leading-tight">{resp.vendor.name}</p>
                      </div>

                      {isSubmitted ? (
                        <div className="space-y-6">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Quote</p>
                            <p className="text-2xl font-black text-white">KES {resp.unitPrice.toLocaleString()} <span className="text-[10px] text-slate-400">/ unit</span></p>
                            <p className="text-sm font-black text-emerald-400 mt-1">Total: KES {resp.totalAmount.toLocaleString()}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Time: <span className="text-white">{resp.deliveryDays ?? '—'} Days</span></p>
                            </div>
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={resp.notes ?? 'No notes'}>Notes: <span className="text-white italic">{resp.notes ?? 'Standard'}</span></p>
                            </div>
                          </div>

                          {selectedRfq.status !== 'CLOSED' && (
                            <button 
                              onClick={() => handleAcceptResponse(selectedRfq.id, resp.id)}
                              disabled={isSubmitting}
                              className="w-full mt-4 py-3 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
                            >
                              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Award Contract'}
                            </button>
                          )}
                          {isAccepted && (
                            <div className="w-full mt-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                              Contract Awarded
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-4 h-4 text-slate-700" />
                          </div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Awaiting Quote Submission...</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
