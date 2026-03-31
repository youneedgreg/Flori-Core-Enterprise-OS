/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  LogOut, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  PlusCircle,
  Database,
  Box,
  Cpu,
  Receipt,
  History,
  Trash2,
  Edit3,
  ChevronRight,
  Download,
  CheckSquare,
  Square,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

interface ModelConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const MODELS: ModelConfig[] = [
  { id: 'tenant', name: 'Tenants', icon: Globe, color: 'text-blue-400' },
  { id: 'user', name: 'Users', icon: Users, color: 'text-emerald-400' },
  { id: 'role', name: 'Roles', icon: ShieldCheck, color: 'text-indigo-400' },
  { id: 'iotdevice', name: 'IoT Devices', icon: Cpu, color: 'text-amber-400' },
  { id: 'order', name: 'Orders', icon: Box, color: 'text-rose-400' },
  { id: 'payrollrecord', name: 'Payroll', icon: Receipt, color: 'text-teal-400' },
  { id: 'auditlog', name: 'Audit Logs', icon: History, color: 'text-slate-400' },
];

export default function FloriCoreDashboard() {
  const router = useRouter();
  
  // State
  const [activeModel, setActiveModel] = useState<string>('user');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For Users, we still include relations for better display
      const include = activeModel === 'user' ? JSON.stringify({ tenant: true, role: true }) : undefined;
      const url = `http://localhost:3001/super-admin/${activeModel}${include ? `?include=${include}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${activeModel} data`);
      const result = await response.json();
      const extracted = Array.isArray(result) ? result : (result?.data || []);
      setData(extracted);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Data Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const response = await fetch(`http://localhost:3001/super-admin/${activeModel}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      setData(data.filter(item => item.id !== id));
      toast.success('Record successfully purged from node');
    } catch (err: any) {
      toast.error(`Purge Failed: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingRecord.id ? 'PATCH' : 'POST';
      const url = `http://localhost:3001/super-admin/${activeModel}${editingRecord.id ? `/${editingRecord.id}` : ''}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord),
      });

      if (!response.ok) throw new Error('Save failed');
      
      setIsEditorOpen(false);
      fetchData();
      toast.success(editingRecord.id ? 'Core data stream updated' : 'New record injected to cluster');
    } catch (err: any) {
      toast.error(`Commit Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const exportData = () => {
    const exportItems = data.filter(item => selectedIds.has(item.id));
    const content = JSON.stringify(exportItems, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${activeModel}-${new Date().toISOString()}.json`;
    a.click();
  };

  // Helpers
  const filteredData = Array.isArray(data) 
    ? data.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  const activeConfig = MODELS.find(m => m.id === activeModel) || MODELS[0];

  // Dynamic Columns
  const getColumns = () => {
    if (!Array.isArray(data) || data.length === 0) return [];
    // Priority keys first, then others, exclude objects
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || Array.isArray(data[0][k]));
    const priority = ['id', 'email', 'name', 'slug', 'status', 'type'];
    return [...new Set([...priority.filter(p => keys.includes(p)), ...keys])];
  };

  if (loading && (!Array.isArray(data) || data.length === 0)) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-white space-y-6">
        <div className="relative">
          <div className="w-16 h-16 bg-brand-green/20 rounded-2xl flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border-4 border-brand-green rounded-sm rotate-45 animate-spin-slow" />
          </div>
          <div className="absolute inset-0 bg-brand-green/20 blur-xl rounded-full" />
        </div>
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">Synchronizing Data Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-slate-300 flex overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-brand-dark/50 backdrop-blur-3xl shrink-0">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-5 h-5 border-[3px] border-brand-dark rounded-sm rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-white leading-none">Flori-Core</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">Super Admin</span>
            </div>
          </div>
          
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">System Entities</div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-8">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setActiveModel(model.id);
                setSelectedIds(new Set());
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                activeModel === model.id 
                ? 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <model.icon className={`w-5 h-5 ${activeModel === model.id ? 'text-brand-green' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span className="text-sm font-bold tracking-tight">{model.name}</span>
              </div>
              {activeModel === model.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => {
              document.cookie = 'access_token=; Max-Age=0; path=/';
              router.push('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-brand-dark/20 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-white/5 ${activeConfig.color}`}>
              <activeConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">{activeConfig.name}</h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                <Database className="w-3 h-3" />
                Resource Explorer / {activeModel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Node Active</span>
            </div>
            
            <button 
              onClick={() => {
                setEditingRecord({});
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-brand-dark font-black text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Create Record
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-brand-dark/40 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-green transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${activeConfig.name.toLowerCase()}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none w-full transition-all"
              />
            </div>
            <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">{selectedIds.size} Selected</span>
                <button 
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON Export
                </button>
                <button 
                  onClick={() => alert(`Bulk delete for ${selectedIds.size} records initiated.`)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition-all font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Bulk Delete
                </button>
                <div className="h-6 w-px bg-white/10 mx-2" />
              </div>
            )}
            <button 
              onClick={fetchData}
              className={`p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all ${loading ? 'animate-spin' : ''}`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- Data Table --- */}
        <div className="flex-1 overflow-auto bg-brand-dark/20 relative">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Protocol Failure</h2>
              <p className="text-slate-500 max-w-sm mb-8 font-medium italic">{error}</p>
              <button 
                onClick={fetchData}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl transition-all font-bold"
              >
                Reconnect to Node
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Search Yielded Null</h2>
              <p className="text-slate-500 mb-8 font-medium">No records matching your query were found in this directory.</p>
              <button onClick={() => setSearchQuery('')} className="text-brand-green font-black text-sm hover:underline">Clear Search Filter</button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-brand-dark/80 backdrop-blur-md shadow-sm">
                <tr className="border-b border-white/5">
                  <th className="py-5 px-8 w-12">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                      {selectedIds.size === filteredData.length ? <CheckSquare className="w-5 h-5 text-brand-green" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  {getColumns().map(col => (
                    <th key={col} className="py-5 px-4 text-[10px] tracking-[0.2em] text-slate-500 uppercase font-black whitespace-nowrap">
                      {col.replace('Id', ' Rel')}
                    </th>
                  ))}
                  <th className="py-5 px-8 text-right text-[10px] tracking-[0.2em] text-slate-500 uppercase font-black">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((item) => (
                  <tr key={item.id} className={`group hover:bg-white/2 transition-colors ${selectedIds.has(item.id) ? 'bg-brand-green/5' : ''}`}>
                    <td className="py-4 px-8">
                      <button onClick={() => toggleSelect(item.id)} className="text-slate-600 group-hover:text-slate-400 transition-colors">
                        {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-brand-green" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    {getColumns().map(col => {
                      const val = item[col];
                      const isId = col.toLowerCase().includes('id');
                      const isTime = col.toLowerCase().includes('date') || col.toLowerCase().includes('at');
                      
                      return (
                        <td key={col} className="py-4 px-4 whitespace-nowrap">
                          {isId ? (
                            <button 
                              onClick={() => {
                                const targetModel = col.replace('Id', '').toLowerCase();
                                if (MODELS.some(m => m.id === targetModel)) {
                                  setActiveModel(targetModel);
                                  setSearchQuery(val);
                                }
                              }}
                              className="text-xs font-mono font-bold text-brand-green/60 hover:text-brand-green transition-colors flex items-center gap-1 group/link"
                            >
                              {String(val).slice(0, 8)}...
                              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </button>
                          ) : isTime ? (
                            <span className="text-xs text-slate-500 font-bold">
                              {new Date(val).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className={`text-sm tracking-tight ${col === 'email' || col === 'name' ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
                              {String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => {
                            setEditingRecord({ ...item });
                            setIsEditorOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <footer className="h-12 border-t border-white/5 bg-brand-dark/60 flex items-center justify-between px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-6">
            <span>Directory Size: {Array.isArray(data) ? data.length : 0} Records</span>
            <span>Selection: {selectedIds.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 border border-brand-green/20 rounded-md text-brand-green ring-4 ring-brand-green/5">Node Operational</span>
          </div>
        </footer>
      </main>

      {/* --- Editor Modal --- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in transition-all">
          <div className="glass w-full max-w-xl rounded-[2.5rem] p-10 border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <header className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {editingRecord.id ? 'Modify Data Stream' : 'Initial Record Injection'}
                  </h3>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                    System Entity / {activeModel}
                  </p>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </header>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {getColumns().filter(c => c !== 'id' && !c.includes('At')).map(col => (
                    <div key={col} className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{col.replace('Id', ' Relation')}</label>
                      <input 
                        type="text"
                        placeholder={`Enter ${col}...`}
                        value={editingRecord[col] || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, [col]: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-slate-700"
                        required={col !== 'slug'}
                      />
                    </div>
                  ))}
                  {getColumns().length === 0 && (
                    <p className="text-slate-500 italic py-8 text-center">Schema initialization required for automated forms.</p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-sm rounded-2xl transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-3 py-4 bg-brand-green text-brand-dark font-black text-sm rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingRecord.id ? 'Commit Changes' : 'Execute Creation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin {
          animation: spin-slow 1s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>
    </div>
  );
}

