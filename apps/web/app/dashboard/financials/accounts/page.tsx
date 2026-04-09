'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BookOpen, Plus, Loader2, Save } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // New account form
  const [showNew, setShowNew] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('ASSET');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      if (!token) return;

      const res = await fetch(`${API}/financials/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      
      const res = await fetch(`${API}/financials/accounts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ code: newCode, name: newName, type: newType })
      });

      if (!res.ok) throw new Error('Failed to create');
      
      toast.success('Account added to Ledger!');
      setShowNew(false);
      setNewCode('');
      setNewName('');
      fetchAccounts();
    } catch (e) {
      toast.error('Failed to create account. Check if code already exists.');
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'LIABILITY': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'EQUITY': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'REVENUE': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'EXPENSE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-white/5 text-white';
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 max-w-5xl relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Chart of Accounts</h1>
          <p className="text-slate-400 mt-2">Manage your ledger segments and financial categories.</p>
        </div>
        <button 
          onClick={() => setShowNew(true)}
          className="px-6 py-3 bg-emerald-500 text-brand-dark rounded-xl font-black tracking-widest uppercase text-xs flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" /> Add Account Segment
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-white font-bold mb-4">Register New Account Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Account Code</label>
              <input required value={newCode} onChange={e => setNewCode(e.target.value)} type="text" placeholder="e.g. 1000" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Account Name</label>
              <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder="e.g. Petty Cash" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Category Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500">
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
             <button type="button" onClick={() => setShowNew(false)} className="px-6 py-2 bg-transparent text-slate-400 hover:text-white font-bold rounded-xl transition-colors">Cancel</button>
             <button type="submit" className="px-6 py-2 bg-emerald-500 text-brand-dark font-bold rounded-xl hover:bg-emerald-400 transition-colors">Save Account</button>
          </div>
        </form>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-black/20">
              <th className="py-4 px-6 text-[10px] font-black tracking-widest uppercase text-slate-500">Code</th>
              <th className="py-4 px-6 text-[10px] font-black tracking-widest uppercase text-slate-500">Name</th>
              <th className="py-4 px-6 text-[10px] font-black tracking-widest uppercase text-slate-500">Type</th>
              <th className="py-4 px-6 text-[10px] font-black tracking-widest uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-6 font-bold text-white"><span className="text-slate-500 mr-1">#</span>{acc.code}</td>
                <td className="py-4 px-6 text-slate-300 font-medium">{acc.name}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${getTypeStyle(acc.type)}`}>
                    {acc.type}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${acc.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-xs text-slate-400 font-bold uppercase">{acc.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
               <tr>
                 <td colSpan={4} className="py-12 text-center text-slate-500">No chart of accounts seeded.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
