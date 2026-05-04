/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export function PrepareLotModal({ isOpen, onClose, apiBase, getAuthHeader, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clockNumber: '',
    varietyId: '',
    grade: 'A',
    bunchSize: 10,
    totalBunches: 0,
    expectedPrice: ''
  });

  useEffect(() => {
    if (isOpen) {
      const headers = getAuthHeader();
      if (headers) {
        fetch(`${apiBase}/production/varieties`, { headers })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setVarieties(data);
            } else {
              setVarieties([]);
              toast.error(data.message || 'Failed to load varieties');
            }
          })
          .catch(() => toast.error('Failed to load varieties'));
      }
    }
  }, [isOpen, apiBase, getAuthHeader]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.varietyId) {
      toast.error('Please select a variety');
      return;
    }
    const headers = getAuthHeader();
    if (!headers) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/auction/lots`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bunchSize: Number(formData.bunchSize),
          totalBunches: Number(formData.totalBunches),
          expectedPrice: formData.expectedPrice ? Number(formData.expectedPrice) : undefined
        })
      });
      if (!res.ok) throw new Error();
      toast.success('Auction lot prepared');
      onSuccess();
    } catch {
      toast.error('Failed to prepare lot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Prepare Auction Lot</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Number</label>
            <input
              required
              value={formData.clockNumber}
              onChange={e => setFormData({ ...formData, clockNumber: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g. C-1029"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variety</label>
            <select
              required
              value={formData.varietyId}
              onChange={e => setFormData({ ...formData, varietyId: e.target.value })}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Select Variety...</option>
              {Array.isArray(varieties) && varieties.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</label>
              <select
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bunch Size</label>
              <input
                type="number"
                min="1"
                required
                value={formData.bunchSize}
                onChange={e => setFormData({ ...formData, bunchSize: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bunches</label>
              <input
                type="number"
                min="1"
                required
                value={formData.totalBunches}
                onChange={e => setFormData({ ...formData, totalBunches: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Price / Stem (Optional)</label>
              <input
                type="number"
                step="0.01"
                value={formData.expectedPrice}
                onChange={e => setFormData({ ...formData, expectedPrice: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Prepare Lot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
