'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Search, Mail, Phone, ChevronRight,
  ShieldCheck, Activity, Edit3, Filter, X, Globe, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CreateCustomerModal } from './CreateCustomerModal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  country?: string;
  address?: string;
  type: string;
  segment: string;
  creditLimit?: number;
  commissionRate?: number;
  paymentTerms?: string;
  notes?: string;
  _count: { orders: number; contactLogs: number; leads: number };
}

interface CustomerListProps {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onRefresh?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  RETAILER:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXPORTER:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  AUCTION_HOUSE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DIRECT_BUYER:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  RETAILER:      'Retailer',
  EXPORTER:      'Exporter',
  AUCTION_HOUSE: 'Auction House',
  DIRECT_BUYER:  'Direct Buyer',
};

const SEG_LABELS: Record<string, string> = {
  LOCAL_RETAIL: 'Local Retail',
  EXPORT:       'Export',
  SPOT_MARKET:  'Spot Market',
};

export function CustomerList({ apiBase, getAuthHeader, onRefresh }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/customers`, { headers });
      if (!res.ok) throw new Error('Failed to fetch customers');
      setCustomers(await res.json());
    } catch {
      toast.error('Could not load Customers');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader]);

  useEffect(() => { void fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contactPerson ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.country ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchSeg = segmentFilter === 'ALL' || c.segment === segmentFilter;
    return matchSearch && matchType && matchSeg;
  });

  const hasActiveFilters = typeFilter !== 'ALL' || segmentFilter !== 'ALL';

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
              placeholder="Search customers, email, country…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase border transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] flex items-center justify-center font-black">
                {(typeFilter !== 'ALL' ? 1 : 0) + (segmentFilter !== 'ALL' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Type</p>
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'RETAILER', 'EXPORTER', 'AUCTION_HOUSE', 'DIRECT_BUYER'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      typeFilter === t
                        ? t === 'ALL'
                          ? 'bg-white/10 text-white border-white/20'
                          : TYPE_COLORS[t]
                        : 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'All Types' : TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Segment</p>
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'LOCAL_RETAIL', 'EXPORT', 'SPOT_MARKET'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegmentFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      segmentFilter === s
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                    }`}
                  >
                    {s === 'ALL' ? 'All Segments' : SEG_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setTypeFilter('ALL'); setSegmentFilter('ALL'); }}
                className="flex items-center gap-1.5 text-[10px] font-black text-rose-400 uppercase tracking-widest self-end pb-1 hover:text-rose-300 transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              {searchTerm || hasActiveFilters ? 'No customers match your filters.' : 'No customers yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 hover:bg-white/5 hover:border-white/10 transition-all shadow-xl group relative"
              >
                {/* Edit button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Edit customer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <div
                  className="cursor-pointer"
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight pr-8">{customer.name}</h3>
                      {customer.contactPerson && (
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> {customer.contactPerson}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${TYPE_COLORS[customer.type] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {TYPE_LABELS[customer.type] ?? customer.type}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                          {SEG_LABELS[customer.segment] ?? customer.segment}
                        </span>
                        {customer.country && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase">
                            <Globe className="w-3 h-3" /> {customer.country}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shrink-0 mt-1">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {customer.email && (
                      <div className="flex items-center gap-3 text-slate-400">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-3 text-slate-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-bold">{customer.phone}</span>
                      </div>
                    )}
                    {customer.type === 'AUCTION_HOUSE' && customer.commissionRate != null && (
                      <div className="flex items-center gap-3 text-purple-400">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Commission: {customer.commissionRate}%</span>
                      </div>
                    )}
                    {customer.type !== 'AUCTION_HOUSE' && customer.creditLimit != null && (
                      <div className="flex items-center gap-3 text-amber-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Credit: USD {customer.creditLimit.toLocaleString()}</span>
                      </div>
                    )}
                    {customer.paymentTerms && (
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Terms: <span className="text-slate-500">{customer.paymentTerms}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                    <div className="text-center p-2 bg-white/5 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Orders</p>
                      <p className="text-sm font-black text-white">{customer._count.orders}</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Logs</p>
                      <p className="text-sm font-black text-white">{customer._count.contactLogs}</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Leads</p>
                      <p className="text-sm font-black text-white">{customer._count.leads}</p>
                    </div>
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

      {editingCustomer && (
        <CreateCustomerModal
          isOpen
          onClose={() => setEditingCustomer(null)}
          apiBase={apiBase}
          getAuthHeader={getAuthHeader}
          editCustomer={editingCustomer}
          onSuccess={() => {
            setEditingCustomer(null);
            void fetchCustomers();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
