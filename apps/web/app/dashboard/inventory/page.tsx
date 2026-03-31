'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Loader2, 
  BadgeDollarSign,
  Barcode,
  Boxes,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unitPrice: number;
  currency: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    stock: 0,
    unitPrice: 0,
    currency: 'USD'
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const res = await fetch(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newProduct)
      });

      if (res.ok) {
        toast.success(`Product "${newProduct.name}" added to inventory`);
        setShowModal(false);
        setNewProduct({ name: '', sku: '', stock: 0, unitPrice: 0, currency: 'USD' });
        fetchProducts();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (err) {
      toast.error('Could not add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from inventory?`)) return;
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Product removed');
        fetchProducts();
      }
    } catch (e) {
      toast.error('Failed to remove product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Flower Inventory</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Manage stock levels, SKUs, and pricing for automated order fulfillment.</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-500/10 uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Add To Inventory
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Boxes className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total SKU Count</p>
            <p className="text-2xl font-black text-white">{products.length}</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Stock Alerts</p>
            <p className="text-2xl font-black text-white">{products.filter(p => p.stock < 50).length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Product Name & SKU</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Stock</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Price</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Sync</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">Inventory is empty. Add your first flower variety above.</td>
              </tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-white/2 transition-colors group">
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-white uppercase tracking-tight">{product.name}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-1.5 mt-1">
                    <Barcode className="w-3 h-3 text-slate-600" />
                    {product.sku}
                  </p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${product.stock < 10 ? 'text-rose-500' : 'text-slate-300'}`}>{product.stock.toLocaleString()} units</span>
                    {product.stock < 10 && <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-black text-blue-400">{product.currency} {product.unitPrice.toFixed(2)}</span>
                </td>
                <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right space-x-3">
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60">
          <div className="bg-brand-dark/80 backdrop-blur-3xl w-full max-w-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 tracking-tight">
              <Plus className="w-8 h-8 text-blue-500" />
              Add Inventory Item
            </h2>
            
            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Product Name (Variety)</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Red Rose Supreme"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-white font-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">SKU Code</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="FLR-RS-001"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-white font-black uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-white font-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Unit Price</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-white font-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Currency</label>
                  <select 
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-white font-black uppercase"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (Sh)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] border border-white/10 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-[10px] transition-all shadow-xl shadow-blue-500/20 px-12 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
