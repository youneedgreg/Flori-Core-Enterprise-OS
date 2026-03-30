'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Loader2, 
  Globe, 
  MapPin, 
  BadgeDollarSign,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  XCircle,
  Clock as ClockIcon,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Customer {
  id: string;
  name: string;
  country: string;
}

interface Order {
  id: string;
  type: 'EXPORT' | 'LOCAL';
  status: 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  customer: {
    name: string;
    country: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  PACKING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function LogisticsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: 'EXPORT',
    customerId: '',
    totalAmount: '',
    currency: 'USD',
    items: [{ sku: '', quantity: 1, price: 0 }]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [ordersRes, customersRes] = await Promise.all([
        fetch(`${API}/logistics/orders`, { headers }),
        fetch(`${API}/logistics/customers`, { headers })
      ]);

      if (ordersRes.ok && customersRes.ok) {
        setOrders(await ordersRes.json());
        const customersData = await customersRes.json();
        setCustomers(customersData);
        if (customersData.length > 0) {
          setNewOrder(prev => ({ ...prev, customerId: customersData[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch logistics data:', error);
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerId || !newOrder.totalAmount) return;

    setIsSubmitting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/logistics/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newOrder,
          totalAmount: parseFloat(newOrder.totalAmount)
        })
      });

      if (res.ok) {
        toast.success(`Order created successfully`);
        setShowOrderModal(false);
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create order');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/logistics/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success('Order status updated');
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-8 lg:p-12">
        {/* Breadcrumbs */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Truck className="w-6 h-6 text-amber-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase">Logistics & Exports</h1>
            </div>
            <p className="text-slate-400 font-medium tracking-tight">Track global flower shipments, manage inventory distribution, and monitor delivery status.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowOrderModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <ShoppingBag className="w-5 h-5" />
              Create Order
            </button>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
           <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
             <input 
              type="text" 
              placeholder="Search orders, customers, or countries..." 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-white backdrop-blur-md"
             />
           </div>
           <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
             <Filter className="w-4 h-4" />
             Status Filter
           </button>
        </div>

        {/* Orders Table */}
        <div className="glass rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Order Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-500 animate-pulse tracking-widest uppercase">Syncing shipment data...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Package className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No orders found in this cycle.</p>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/2 transition-colors group cursor-default">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      Created {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                      order.type === 'EXPORT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {order.type === 'EXPORT' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {order.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-white tracking-tight">{order.customer.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.customer.country}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5">
                      <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-black text-white">{order.currency} {order.totalAmount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <select 
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        value={order.status}
                        className="bg-slate-900/50 border border-slate-800 rounded-lg px-2 py-1 text-[9px] font-black text-slate-400 hover:text-white transition-all uppercase focus:outline-none"
                       >
                         <option value="PENDING">PENDING</option>
                         <option value="PACKING">PACKING</option>
                         <option value="SHIPPED">SHIPPED</option>
                         <option value="DELIVERED">DELIVERED</option>
                         <option value="CANCELLED">CANCELLED</option>
                       </select>
                       <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                         <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Creation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 overflow-y-auto">
          <div className="glass w-full max-w-xl p-10 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 my-auto">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
              <ShoppingBag className="w-8 h-8 text-emerald-500" />
              Manifest New Order
            </h2>
            
            <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Order Classification</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, type: 'EXPORT' })}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border ${
                      newOrder.type === 'EXPORT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-slate-900/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    GLOBAL EXPORT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, type: 'LOCAL' })}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border ${
                      newOrder.type === 'LOCAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    LOCAL DISTRIBUTION
                  </button>
                </div>
              </div>

              <div className="space-y-2 col-span-full md:col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Select Customer</label>
                <select 
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white uppercase font-bold tracking-wider"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                  ))}
                  {customers.length === 0 && <option>No customers found</option>}
                </select>
              </div>

              <div className="space-y-2 col-span-full md:col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Financial Manifest (Total)</label>
                <div className="relative">
                  <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newOrder.totalAmount}
                    onChange={(e) => setNewOrder({ ...newOrder, totalAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 col-span-full">
                <button 
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm border border-slate-800 transition-all"
                >
                  Discard Draft
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || customers.length === 0}
                  className="flex-2 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group px-12"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  Confirm Logistics Manifest
                </button>
              </div>
            </form>

            <div className="absolute top-0 left-0 -ml-8 -mt-8 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />
          </div>
        </div>
      )}

      {/* Decorative Glows */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-amber-500/5 blur-[200px] rounded-full pointer-events-none opacity-40" />
      <div className="fixed bottom-0 left-0 -z-10 w-[800px] h-[800px] bg-emerald-500/5 blur-[200px] rounded-full pointer-events-none opacity-40" />
    </div>
  );
}
