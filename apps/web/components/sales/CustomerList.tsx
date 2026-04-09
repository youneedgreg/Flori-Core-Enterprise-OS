'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Filter, Mail, Phone, ChevronRight, ShieldCheck, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerDetailModal } from './CustomerDetailModal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: string;
  segment: string;
  creditLimit?: number;
  commissionRate?: number;
  _count: { orders: number; contactLogs: number; leads: number };
}

interface CustomerListProps {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
}

export function CustomerList({ apiBase, getAuthHeader }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCustomers = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/customers`, { headers });
      if (!res.ok) throw new Error('Failed to fetch customers');
      setCustomers(await res.json());
    } catch (err) {
      toast.error('Could not load Customers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-8 border-b border-white/5 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="SEARCH CUSTOMERS..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors flex items-center gap-2">
           <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(customer => (
              <div 
                key={customer.id} 
                onClick={() => setSelectedCustomerId(customer.id)}
                className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                         {customer.type.replace('_', ' ')}
                       </span>
                       <span className="px-2 py-1 bg-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                         {customer.segment.replace('_', ' ')}
                       </span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {customer.email && (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-bold">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-bold">{customer.phone}</span>
                    </div>
                  )}
                  {customer.type === 'AUCTION_HOUSE' && customer.commissionRate !== null && (
                    <div className="flex items-center gap-3 text-purple-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-bold">Commission: {customer.commissionRate}%</span>
                    </div>
                  )}
                  {customer.type !== 'AUCTION_HOUSE' && customer.creditLimit !== null && (
                    <div className="flex items-center gap-3 text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-bold">Credit Limit: USD {customer.creditLimit}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                  <div className="text-center p-2 bg-white/5 rounded-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Orders</p>
                    <p className="text-sm font-black text-white">{customer._count.orders}</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interactions</p>
                    <p className="text-sm font-black text-white">{customer._count.contactLogs}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomerId && (
        <CustomerDetailModal 
          customerId={selectedCustomerId} 
          onClose={() => setSelectedCustomerId(null)} 
          apiBase={apiBase} 
          getAuthHeader={getAuthHeader} 
        />
      )}
    </div>
  );
}
