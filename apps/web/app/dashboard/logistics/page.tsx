/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Truck, 
  Search, 
  Filter, 
  Loader2, 
  Globe, 
  MapPin, 
  BadgeDollarSign,
  Calendar,
  MoreVertical,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: 'EXPORT' as 'EXPORT' | 'LOCAL',
    customerId: '',
    currency: 'USD',
    items: [{ productId: '', sku: '', name: '', quantity: 1, price: 0 }]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch(`${API}/logistics/orders`, { headers }),
        fetch(`${API}/logistics/customers`, { headers }),
        fetch(`${API}/products`, { headers })
      ]);

      if (ordersRes.status === 401 || customersRes.status === 401) {
        logout();
        return;
      }

      if (ordersRes.ok && customersRes.ok) {
        setOrders(await ordersRes.json());
        const customersData = await customersRes.json();
        setCustomers(customersData);
        if (customersData.length > 0 && !newOrder.customerId) {
          setNewOrder(prev => ({ ...prev, customerId: customersData[0].id }));
        }
      }

      if (productsRes.ok) {
        setProducts(await productsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch logistics data:', error);
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  }, [newOrder.customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAmount = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerId || totalAmount === 0) return;

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
          totalAmount: totalAmount
        })
      });

      if (res.ok) {
        toast.success(`Order manifest confirmed`);
        setShowOrderModal(false);
        setNewOrder({
          type: 'EXPORT',
          customerId: customers[0]?.id || '',
          currency: 'USD',
          items: [{ productId: '', sku: '', name: '', quantity: 1, price: 0 }]
        });
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create order');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      toast.error(message);
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
        toast.success('Order status updated. Inventory adjusted if Delivered.');
        fetchData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status');
    }
  };

  const addLineItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productId: '', sku: '', name: '', quantity: 1, price: 0 }]
    });
  };

  const updateLineItem = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItems = [...newOrder.items];
    newItems[index] = {
      productId,
      sku: product.sku,
      name: product.name,
      quantity: newItems[index].quantity,
      price: product.unitPrice
    };
    setNewOrder({ ...newOrder, items: newItems, currency: product.currency });
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...newOrder.items];
    newItems[index].quantity = quantity;
    setNewOrder({ ...newOrder, items: newItems });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Truck className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Logistics & Exports</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Track global flower shipments, manage inventory distribution, and monitor delivery status.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowOrderModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] uppercase tracking-widest"
          >
            <ShoppingBag className="w-5 h-5" />
            Create Order
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-brand-green transition-colors" />
           <input 
            type="text" 
            placeholder="Search orders, customers, or countries..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-brand-green/30 focus:ring-4 focus:ring-brand-green/5 transition-all text-white font-bold placeholder:text-slate-600"
           />
         </div>
         <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">
           <Filter className="w-4 h-4 font-black" />
           Status Filter
         </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Order Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Customer</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Amount</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 animate-pulse tracking-widest uppercase">Syncing shipment data...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <Package className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No orders found in this cycle.</p>
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/2 transition-colors group cursor-default">
                <td className="px-8 py-6">
                  <p className="text-xs font-black text-white group-hover:text-brand-green transition-colors uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    Created {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    order.type === 'EXPORT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-brand-green border-brand-green/20'
                  }`}>
                    {order.type === 'EXPORT' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {order.type}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-white tracking-tight">{order.customer.name}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{order.customer.country}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-1.5">
                    <BadgeDollarSign className="w-4 h-4 text-brand-green" />
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
                      className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[9px] font-black text-slate-500 hover:text-white transition-all uppercase focus:outline-none cursor-pointer"
                     >
                       <option value="PENDING" className="bg-brand-dark">PENDING</option>
                       <option value="PACKING" className="bg-brand-dark">PACKING</option>
                       <option value="SHIPPED" className="bg-brand-dark">SHIPPED</option>
                       <option value="DELIVERED" className="bg-brand-dark">DELIVERED</option>
                       <option value="CANCELLED" className="bg-brand-dark">CANCELLED</option>
                     </select>
                     <button className="p-2 rounded-lg hover:bg-white/5 text-slate-600 hover:text-white transition-colors">
                       <MoreVertical className="w-4 h-4" />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Creation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60 overflow-y-auto">
          <div className="bg-brand-dark/80 backdrop-blur-3xl w-full max-w-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 my-8">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 tracking-tight">
              <ShoppingBag className="w-8 h-8 text-brand-green" />
              Manifest New Order
            </h2>
            
            <form onSubmit={handleCreateOrder} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Classification</label>
                  <div className="flex gap-2">
                    {['EXPORT', 'LOCAL'].map((t) => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, type: t as any })}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] transition-all border uppercase tracking-widest ${
                          newOrder.type === t ? 'bg-brand-green/10 text-brand-green border-brand-green/30' : 'bg-white/5 text-slate-600 border-white/5'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Currency</label>
                  <select 
                    value={newOrder.currency}
                    onChange={(e) => setNewOrder({ ...newOrder, currency: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-green/30 transition-all text-white uppercase font-black tracking-widest"
                  >
                    <option value="USD" className="bg-brand-dark">USD ($)</option>
                    <option value="KES" className="bg-brand-dark">KES (Sh)</option>
                    <option value="EUR" className="bg-brand-dark">EUR (€)</option>
                    <option value="GBP" className="bg-brand-dark">GBP (£)</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Customer</label>
                  <select 
                    value={newOrder.customerId}
                    onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-green/30 transition-all text-white uppercase font-black tracking-widest"
                  >
                    <option value="" className="bg-brand-dark">Select Recipient...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-brand-dark">{c.name} ({c.country})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Line Items (Inventory Linked)</label>
                  <button 
                    type="button" 
                    onClick={addLineItem}
                    className="text-[9px] font-black text-brand-green uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    + Add Product
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newOrder.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6">
                        <select 
                          value={item.productId}
                          onChange={(e) => updateLineItem(idx, e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-black uppercase focus:outline-none"
                        >
                          <option value="" className="bg-brand-dark">Select SKU...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} className="bg-brand-dark">{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateQuantity(idx, val === '' ? 0 : parseInt(val));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-black focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-[10px] font-black text-slate-500">{newOrder.currency} {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Manifest Value</p>
                  <p className="text-2xl font-black text-white">{newOrder.currency} {totalAmount.toLocaleString()}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] border border-white/10 transition-all uppercase tracking-widest"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newOrder.customerId || totalAmount === 0}
                    className="px-8 py-4 bg-brand-green hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl font-black text-[10px] transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 group uppercase tracking-widest"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    Confirm Manifest
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
