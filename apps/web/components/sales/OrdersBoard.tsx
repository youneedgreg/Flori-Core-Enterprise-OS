/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrderModal } from './CreateOrderModal';
import { logout, isTokenExpired } from '../../lib/auth';

interface OrderItem {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string | null;
  type: 'STANDING_ORDER' | 'SPOT_ORDER' | 'EXPORT_CONTRACT';
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PICKING' | 'DISPATCHED' | 'DELIVERED' | 'INVOICED';
  totalAmount: number;
  currency: string;
  deliveryDate: string | null;
  createdAt: string;
  isTemplate: boolean;
  notes: string | null;
  templateFrequency: string | null;
  customer: { name: string; country: string; email?: string };
  _count?: { packedBoxes: number };
  items: OrderItem[];
}

interface OrdersBoardProps {
  apiBase: string;
  getAuthHeader: () => { Authorization: string } | null;
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  CONFIRMED:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IN_PICKING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DISPATCHED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  DELIVERED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  INVOICED:   'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  STANDING_ORDER:  'Standing',
  SPOT_ORDER:      'Spot',
  EXPORT_CONTRACT: 'Export',
};

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  DRAFT:      { label: 'Confirm Order',    next: 'CONFIRMED' },
  CONFIRMED:  { label: 'Start Picking',    next: 'IN_PICKING' },
  IN_PICKING: { label: 'Mark Dispatched',  next: 'DISPATCHED' },
  DISPATCHED: { label: 'Mark Delivered',   next: 'DELIVERED' },
  DELIVERED:  { label: 'Invoice',          next: 'INVOICED' },
};

const ALL_STATUSES = ['DRAFT', 'CONFIRMED', 'IN_PICKING', 'DISPATCHED', 'DELIVERED', 'INVOICED'];

export function OrdersBoard({ apiBase, getAuthHeader, onRefresh }: OrdersBoardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const endpoint = showTemplates
        ? `${apiBase}/sales/orders/templates`
        : `${apiBase}/sales/orders${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader, statusFilter, showTemplates]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  async function advanceStatus(order: Order) {
    const transition = NEXT_STATUS[order.status];
    if (!transition) return;
    const headers = getAuthHeader();
    if (!headers) return;

    setAdvancing(order.id);
    try {
      const res = await fetch(`${apiBase}/sales/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: transition.next }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }
      toast.success(`Order ${order.orderNumber ?? order.id.slice(0, 6)} → ${transition.next.replace('_', ' ')}`);
      fetchOrders();
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update status');
    } finally {
      setAdvancing(null);
    }
  }

  async function generateFromTemplate(templateId: string) {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const res = await fetch(`${apiBase}/sales/orders/templates/${templateId}/generate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to generate order');
      toast.success('Draft order generated from template');
      setShowTemplates(false);
      fetchOrders();
      onRefresh?.();
    } catch {
      toast.error('Failed to generate order from template');
    }
  }

  function formatDeliveryDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function itemsSummary(items: OrderItem[]) {
    const totalBoxes = items.reduce((acc, i) => acc + i.quantity, 0);
    return `${items.length} variet${items.length === 1 ? 'y' : 'ies'} · ${totalBoxes} boxes`;
  }

  const displayRows = orders;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-6 border-b border-white/5 flex flex-wrap items-center gap-3">
        {/* Status filter pills */}
        {!showTemplates && (
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', ...ALL_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  statusFilter === s
                    ? s === 'ALL'
                      ? 'bg-white/10 text-white border-white/20'
                      : STATUS_COLORS[s]
                    : 'bg-transparent text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10'
                }`}
              >
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => { setShowTemplates(!showTemplates); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              showTemplates
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showTemplates ? 'View Orders' : 'Templates'}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : displayRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              {showTemplates ? 'No templates yet' : 'No orders found'}
            </p>
            {!showTemplates && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-emerald-400 text-xs font-black uppercase tracking-widest hover:underline"
              >
                + Create your first order
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Order #', 'Customer', 'Type', 'Items', 'Delivery Date', 'Status', ''].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {/* Order # */}
                  <td className="px-6 py-4 font-black">
                    {order.orderNumber ? (
                      <span className="text-white text-xs">{order.orderNumber}</span>
                    ) : order.isTemplate ? (
                      <span className="text-violet-400 text-xs">TEMPLATE</span>
                    ) : (
                      <span className="text-slate-600 text-xs">DRAFT-{order.id.slice(0, 6).toUpperCase()}</span>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <p className="text-white text-xs font-bold">{order.customer.name}</p>
                    <p className="text-slate-500 text-[10px]">{order.customer.country}</p>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {TYPE_LABELS[order.type] ?? order.type}
                      {order.templateFrequency && (
                        <span className="ml-1 text-violet-400">· {order.templateFrequency}</span>
                      )}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {itemsSummary(order.items as OrderItem[])}
                  </td>

                  {/* Delivery Date */}
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {formatDeliveryDate(order.deliveryDate)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {!order.isTemplate && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {order.isTemplate ? (
                      <button
                        onClick={() => generateFromTemplate(order.id)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
                      >
                        Generate Order
                      </button>
                    ) : NEXT_STATUS[order.status] ? (
                      <button
                        disabled={advancing === order.id}
                        onClick={() => advanceStatus(order)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                      >
                        {advancing === order.id ? '...' : NEXT_STATUS[order.status].label}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600 uppercase tracking-widest font-black">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          apiBase={apiBase}
          getAuthHeader={getAuthHeader}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrders();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
