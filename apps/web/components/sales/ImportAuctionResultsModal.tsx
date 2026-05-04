import React, { useState } from 'react';
import { X, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export function ImportAuctionResultsModal({ isOpen, onClose, apiBase, getAuthHeader, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      toast.error('Please enter results data');
      return;
    }

    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];
    for (const line of lines) {
      const parts = line.split(/[,\t ]+/);
      if (parts.length >= 2) {
        const clockNumber = parts[0];
        const actualPricePerStem = parseFloat(parts[1]);
        if (!isNaN(actualPricePerStem)) {
          results.push({ clockNumber, actualPricePerStem });
        }
      }
    }

    if (results.length === 0) {
      toast.error('Could not parse any valid results. Format: ClockNumber, Price');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sales/auction/import`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Import failed');
      }
      toast.success('Auction results imported successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Import Results</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Paste CSV Data (Clock Number, Price)
            </label>
            <textarea
              required
              rows={8}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="C-1029, 0.45&#10;C-1030, 0.50&#10;C-1031, 0.48"
            />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Supports comma, tab, or space separated values.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Import Results
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
