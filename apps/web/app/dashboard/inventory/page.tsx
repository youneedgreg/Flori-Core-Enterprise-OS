'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Barcode,
  Boxes,
  TrendingDown,
  AlertCircle,
  History,
  Recycle,
  Layers,
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

interface ATPItem {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  physicalStock: number;
  committed: number;
  allocated: number;
  atp: number;
}

interface WastageLog {
  id: string;
  varietyId: string;
  varietyName?: string;
  variety: { name: string };
  grade: string;
  quantity: number;
  reason: string;
  costImpact: number;
  createdAt: string;
  notes?: string;
}

interface Variety {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'raw' | 'finished' | 'wastage'>('finished');
  const [products, setProducts] = useState<Product[]>([]);
  const [atpData, setAtpData] = useState<ATPItem[]>([]);
  const [wastageLogs, setWastageLogs] = useState<WastageLog[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    stock: 0,
    unitPrice: 0,
    currency: 'USD',
  });

  const [wastageForm, setWastageForm] = useState({
    varietyId: '',
    grade: 'A',
    quantity: 0,
    reason: 'PHYSICAL_DAMAGE',
    notes: '',
  });

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchRawProducts = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/products`, { headers });
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      toast.error('Failed to load raw inventory');
    }
  }, []);

  const fetchATPData = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/atp`, { headers });
      if (res.ok) setAtpData(await res.json());
    } catch (error) {
      toast.error('Failed to load ATP data');
    }
  }, []);

  const fetchWastageLogs = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/wastage`, { headers });
      if (res.ok) setWastageLogs(await res.json());
    } catch (error) {
      toast.error('Failed to load wastage logs');
    }
  }, []);

  const fetchVarieties = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/varieties`, { headers });
      if (res.ok) setVarieties(await res.json());
    } catch (error) {
      // Varieties might be empty
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'raw') await fetchRawProducts();
    else if (activeTab === 'finished') await fetchATPData();
    else if (activeTab === 'wastage') {
      await fetchWastageLogs();
      await fetchVarieties();
    }
    setLoading(false);
  }, [activeTab, fetchRawProducts, fetchATPData, fetchWastageLogs, fetchVarieties]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (res.ok) {
        toast.success(`Product "${newProduct.name}" added`);
        setShowModal(false);
        setNewProduct({ name: '', sku: '', stock: 0, unitPrice: 0, currency: 'USD' });
        fetchRawProducts();
      }
    } catch (err) {
      toast.error('Could not add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/wastage`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(wastageForm),
      });

      if (res.ok) {
        toast.success('Wastage recorded successfully');
        setShowWastageModal(false);
        setWastageForm({ varietyId: '', grade: 'A', quantity: 0, reason: 'PHYSICAL_DAMAGE', notes: '' });
        fetchWastageLogs();
      }
    } catch (err) {
      toast.error('Could not record wastage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Boxes className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Inventory <span className="text-blue-500">Hub</span></h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Real-time Finished Goods (ATP), Wastage, and Raw Material monitoring.</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('finished')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finished' ? 'bg-blue-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Finished Goods (ATP)
          </button>
          <button
            onClick={() => setActiveTab('wastage')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'wastage' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Wastage
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'raw' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Raw Materials
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Box Variants</p>
            <p className="text-2xl font-black text-white">{atpData.length}</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <TrendingDown className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Wastage (Units)</p>
            <p className="text-2xl font-black text-white">{wastageLogs.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
          </div>
        </div>
      </div>

      {activeTab === 'finished' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Variety & Grade</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Box Configuration</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Physical Stock</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Committed</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ATP (Available)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : atpData.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">No box inventory found.</td></tr>
                ) : atpData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/2 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-white uppercase">{item.varietyName}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-widest">GRADE {item.grade}</span>
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-300 font-bold uppercase">
                      {item.bunchesPerBox} Bunches × {item.bunchSize} Stems
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-400">{item.physicalStock} Boxes</td>
                    <td className="px-8 py-6 text-sm font-black text-rose-400/60">{item.committed} Boxes</td>
                    <td className="px-8 py-6">
                      <div className={`text-xl font-black ${item.atp <= 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                        {item.atp} <span className="text-[10px] uppercase tracking-tighter">Units</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'wastage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-500" />
                  Wastage History
                </h3>
              </div>
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" /></td></tr>
                  ) : wastageLogs.length === 0 ? (
                    <tr><td className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">No wastage recorded.</td></tr>
                  ) : wastageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/2">
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-white uppercase">{log.variety.name} (Grade {log.grade})</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{new Date(log.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 font-black uppercase">{log.reason.replace('_', ' ')}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-black text-rose-500">-{log.quantity} stems</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase mt-0.5">Impact: ${log.costImpact.toFixed(2)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="lg:col-span-4">
            <div className="bg-linear-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-rose-500/20 shadow-2xl sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <Recycle className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight italic">Record <span className="text-rose-500">Wastage</span></h3>
              </div>
              
              <form onSubmit={handleRecordWastage} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Variety</label>
                  <select 
                    value={wastageForm.varietyId}
                    onChange={(e) => setWastageForm({ ...wastageForm, varietyId: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-rose-500/30 text-white font-bold"
                    required
                  >
                    <option value="">Select Variety</option>
                    {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grade</label>
                    <select 
                      value={wastageForm.grade}
                      onChange={(e) => setWastageForm({ ...wastageForm, grade: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-rose-500/30 text-white font-bold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="REJECT">REJECT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stems</label>
                    <input 
                      type="number"
                      value={wastageForm.quantity || ''}
                      onChange={(e) => setWastageForm({ ...wastageForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-rose-500/30 text-white font-bold"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason</label>
                  <select 
                    value={wastageForm.reason}
                    onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-rose-500/30 text-white font-bold font-black italic"
                  >
                    <option value="TEMPERATURE_DAMAGE">Temperature Damage</option>
                    <option value="DISEASE">Disease</option>
                    <option value="PEST_DAMAGE">Pest Damage</option>
                    <option value="PHYSICAL_DAMAGE">Physical Damage</option>
                    <option value="EXPIRED">Expired / Old</option>
                    <option value="GRADING_REJECT">Grading Reject</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Recycle className="w-4 h-4" /> Log Wastage</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Inventory SKUs</h3>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
            >
              Add SKU
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Product Name & SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Stock</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">Inventory is empty.</td></tr>
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
                    <span className={`text-sm font-black ${product.stock < 10 ? 'text-rose-500' : 'text-slate-300'}`}>{product.stock.toLocaleString()} units</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-emerald-400">{product.currency} {product.unitPrice.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add SKU Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60">
          <div className="bg-brand-dark/80 backdrop-blur-3xl w-full max-w-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 tracking-tight uppercase italic">
              Register <span className="text-emerald-500">SKU</span>
            </h2>
            
            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500/30 text-white font-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">SKU Code</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500/30 text-white font-black uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Stock</label>
                  <input 
                    type="number" 
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500/30 text-white font-black"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] px-12 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
