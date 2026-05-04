import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Tag, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function AuctionBoard({ apiBase, getAuthHeader, onRefresh }: any) {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLots = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/auction/lots`, { headers });
      if (res.ok) {
        setLots(await res.json());
      }
    } catch {
      toast.error('Failed to load auction lots');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots, onRefresh]); // re-fetch when onRefresh triggers (or passed key changes)

  const filteredLots = lots.filter(lot => 
    lot.clockNumber.toLowerCase().includes(search.toLowerCase()) || 
    lot.variety?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clock number or variety..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Tag className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              No auction lots found. Prepare a new lot to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
            {filteredLots.map(lot => (
              <div key={lot.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">{lot.variety?.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      Clock #{lot.clockNumber}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${lot.status === 'PREPARED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                    {lot.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-black/20 rounded-xl p-3">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Quantity</p>
                    <p className="text-xs font-black text-white">{lot.totalStems} stems</p>
                    <p className="text-[9px] text-slate-400">{lot.totalBunches} bunches × {lot.bunchSize}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Grade</p>
                    <p className="text-xs font-black text-white">{lot.grade}</p>
                  </div>
                  {lot.status === 'AUCTIONED' && lot.actualPrice && (
                    <>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Price</p>
                        <p className="text-xs font-black text-emerald-400">${lot.actualPrice} /stem</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-xs font-black text-white">${(lot.actualPrice * lot.totalStems).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>

                {lot.status === 'AUCTIONED' && lot.order && (
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                      Invoiced: {lot.order.invoice?.invoiceNumber}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
