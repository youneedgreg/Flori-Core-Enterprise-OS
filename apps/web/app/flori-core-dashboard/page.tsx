/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, LogOut, ShieldCheck, Globe, Activity, Search,
  Filter, MoreVertical, ExternalLink, PlusCircle, Database,
  Box, Cpu, Receipt, History, Trash2, Edit3, ChevronRight,
  Download, CheckSquare, Square, X, Save, AlertCircle,
  BarChart2, FileText, Settings, Layers, Code, CheckCircle, XCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// --- Types ---
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ModelConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  group: string;
}

const KNOWN_MODELS: Record<string, Omit<ModelConfig, 'id'>> = {
  tenant:          { name: 'Tenants',        icon: Globe,       color: 'text-blue-400',    group: 'System' },
  user:            { name: 'Users',          icon: Users,       color: 'text-emerald-400', group: 'System' },
  role:            { name: 'Roles',          icon: ShieldCheck, color: 'text-indigo-400',  group: 'System' },
  iotDevice:       { name: 'IoT Devices',    icon: Cpu,         color: 'text-amber-400',   group: 'IoT' },
  zone:            { name: 'Zones',          icon: Globe,       color: 'text-cyan-400',    group: 'Production' },
  cropCycle:       { name: 'Crop Cycles',    icon: Activity,    color: 'text-green-400',   group: 'Production' },
  variety:         { name: 'Varieties',      icon: Database,    color: 'text-lime-400',    group: 'Production' },
  order:           { name: 'Orders',         icon: Box,         color: 'text-rose-400',    group: 'Sales' },
  customer:        { name: 'Customers',      icon: Users,       color: 'text-pink-400',    group: 'Sales' },
  vehicle:         { name: 'Vehicles',       icon: Box,         color: 'text-orange-400',  group: 'Logistics' },
  deliveryRoute:   { name: 'Routes',         icon: Globe,       color: 'text-sky-400',     group: 'Logistics' },
  payrollRecord:   { name: 'Payroll',        icon: Receipt,     color: 'text-teal-400',    group: 'Finance' },
  auditLog:        { name: 'Audit Logs',     icon: History,     color: 'text-slate-400',   group: 'Audit' },
  storeItem:       { name: 'Store Items',    icon: Box,         color: 'text-amber-400',   group: 'Inventory' },
  vendor:          { name: 'Vendors',        icon: Globe,       color: 'text-violet-400',  group: 'Procurement' },
};

const GROUP_ORDER = ['System', 'Production', 'Sales', 'Logistics', 'Finance', 'Inventory', 'Procurement', 'IoT', 'Audit', 'Other'];

export default function FloriCoreDashboard() {
  const router = useRouter();
  
  // State
  const [activeModel, setActiveModel] = useState<string>('user');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Confirmation Modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch models list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/super-admin/metadata/models`);
        if (res.ok) {
          const keys: string[] = await res.json();
          const configs: ModelConfig[] = keys.map(k => {
            const known = KNOWN_MODELS[k];
            return known
              ? { id: k, ...known }
              : { id: k, name: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(), icon: Database, color: 'text-slate-400', group: 'Other' };
          });
          setModels(configs);
        } else {
          setModels(Object.keys(KNOWN_MODELS).map(k => ({ id: k, ...KNOWN_MODELS[k] })));
        }
      } catch { 
        setModels(Object.keys(KNOWN_MODELS).map(k => ({ id: k, ...KNOWN_MODELS[k] })));
      }
    })();
  }, []);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const includes: Record<string, string> = {
        user: JSON.stringify({ tenant: true, role: true }),
        order: JSON.stringify({ customer: true }),
        cropCycle: JSON.stringify({ variety: true, zone: true }),
        deliveryRoute: JSON.stringify({ driver: true, vehicle: true }),
      };
      const include = includes[activeModel];
      const url = `${API}/super-admin/${activeModel}${include ? `?include=${include}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${activeModel} data`);
      const result = await response.json();
      const extracted = Array.isArray(result) ? result : (result?.data || []);
      setData(extracted);
      setTotalRecords(result?.meta?.total ?? extracted.length);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message);
      toast.error(`Data Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeModel]);

  useEffect(() => {
    if (models.length > 0) {
      fetchData();
    }
  }, [fetchData, models]);

  // Actions
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API}/super-admin/${activeModel}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setData(data.filter(item => item.id !== id));
      setConfirmDeleteId(null);
      toast.success('Record successfully purged');
    } catch (err: any) {
      toast.error(`Purge Failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id =>
        fetch(`${API}/super-admin/${activeModel}/${id}`, { method: 'DELETE' })
      ));
      toast.success(`${ids.length} records purged`);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Bulk purge failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Parse JSON if needed
      let payload = { ...editingRecord };
      if (payload._rawJson !== undefined) {
        try {
          const parsed = JSON.parse(payload._rawJson);
          payload = { ...parsed };
          if (editingRecord.id) payload.id = editingRecord.id;
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      }

      const method = editingRecord.id ? 'PATCH' : 'POST';
      const url = `${API}/super-admin/${activeModel}${editingRecord.id ? `/${editingRecord.id}` : ''}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Save failed');
      }
      
      setIsEditorOpen(false);
      fetchData();
      toast.success(editingRecord.id ? 'Record updated' : 'Record created');
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
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `export-${activeModel}-${new Date().toISOString()}.json`;
    a.click();
  };

  // Helpers
  const filteredData = Array.isArray(data) 
    ? data.filter(item => 
        Object.values(item).some(val => {
          if (val && typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(searchQuery.toLowerCase());
          return String(val).toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : [];

  const activeConfig = models.find(m => m.id === activeModel) || { id: activeModel, name: activeModel, icon: Database, color: 'text-slate-400', group: 'Other' };
  const groupedModels = GROUP_ORDER.map(g => ({ group: g, items: models.filter(m => m.group === g) })).filter(g => g.items.length > 0);

  // Dynamic Columns
  const getColumns = () => {
    if (!Array.isArray(data) || data.length === 0) return [];
    // Priority keys first, then others. Allow objects for relation rendering.
    const keys = Object.keys(data[0]);
    const priority = ['id', 'email', 'name', 'title', 'slug', 'status', 'type', 'isActive'];
    return [...new Set([...priority.filter(p => keys.includes(p)), ...keys])];
  };

  const columns = getColumns();
  
  const renderCell = (col: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-600">-</span>;
    if (typeof val === 'boolean') {
      return val ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />;
    }
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-slate-400">Array({val.length})</span>;
      }
      const label = val.name || val.title || val.slug || val.email || val.id || 'Object';
      return <span className="px-2 py-1 rounded-md bg-brand-green/10 border border-brand-green/20 text-xs text-brand-green font-medium">{String(label)}</span>;
    }
    const isId = col.toLowerCase().includes('id');
    const isTime = col.toLowerCase().includes('date') || col.toLowerCase().includes('at');
    
    if (isId && typeof val === 'string' && val.length > 20) {
      return (
        <button 
          onClick={() => {
            const targetModel = col.replace('Id', '').toLowerCase();
            if (models.some(m => m.id === targetModel)) {
              setActiveModel(targetModel);
              setSearchQuery(val);
            }
          }}
          className="text-xs font-mono font-bold text-brand-green/60 hover:text-brand-green transition-colors flex items-center gap-1 group/link"
        >
          {val.slice(0, 8)}...
          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </button>
      );
    }
    if (isTime) {
      return <span className="text-xs text-slate-500 font-bold">{new Date(val).toLocaleString()}</span>;
    }
    
    return (
      <span className={`text-sm tracking-tight ${col === 'email' || col === 'name' ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
        {String(val)}
      </span>
    );
  };

  if (loading && (!Array.isArray(data) || data.length === 0) && models.length === 0) {
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
      <aside className="w-72 border-r border-white/5 flex flex-col bg-slate-950/80 backdrop-blur-3xl shrink-0 z-20">
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
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-8 custom-scrollbar">
          {groupedModels.map(group => (
            <div key={group.group}>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-4">{group.group}</div>
              <div className="space-y-1">
                {group.items.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setActiveModel(model.id);
                      setSelectedIds(new Set());
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${
                      activeModel === model.id 
                      ? 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/20 shadow-inner' 
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
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-950/50">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-xl shrink-0 z-10">
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
                setEditingRecord(columns.length === 0 ? { _rawJson: "{\n  \n}" } : {});
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-brand-dark font-black text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Create Record
            </button>
          </div>
        </header>

        {/* KPI Stats Row */}
        <div className="px-8 py-4 border-b border-white/5 bg-slate-900/50 flex gap-6 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
            <div className="p-2 bg-brand-green/10 rounded-lg">
              <Layers className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Records</p>
              <p className="text-lg font-black text-white">{totalRecords}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Filtered</p>
              <p className="text-lg font-black text-white">{filteredData.length}</p>
            </div>
          </div>
          {columns.includes('isActive') || columns.includes('status') ? (
            <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active / Online</p>
                <p className="text-lg font-black text-white">
                  {filteredData.filter(d => d.isActive === true || d.status === 'ACTIVE' || d.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-green transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${activeConfig.name.toLowerCase()}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none w-full transition-all text-white placeholder:text-slate-600"
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
                  Export
                </button>
                <button 
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition-all font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge
                </button>
                <div className="h-6 w-px bg-white/10 mx-2" />
              </div>
            )}
            <button 
              onClick={fetchData}
              className={`p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-white/10 ${loading ? 'animate-spin' : ''}`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- Data Table --- */}
        <div className="flex-1 overflow-auto bg-slate-900/20 relative custom-scrollbar">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Protocol Failure</h2>
              <p className="text-slate-500 max-w-sm mb-8 font-medium">{error}</p>
              <button 
                onClick={fetchData}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl transition-all font-bold"
              >
                Reconnect to Node
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                {searchQuery ? <Search className="w-10 h-10 text-slate-600" /> : <Database className="w-10 h-10 text-slate-600" />}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{searchQuery ? 'Search Yielded Null' : 'Empty Directory'}</h2>
              <p className="text-slate-500 mb-8 font-medium max-w-md">
                {searchQuery ? 'No records matching your query were found in this directory.' : `The ${activeModel} directory contains no records. Inject initial data to populate.`}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-brand-green font-black text-sm hover:underline">Clear Search Filter</button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md shadow-sm">
                <tr className="border-b border-white/10">
                  <th className="py-4 px-6 w-12">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                      {selectedIds.size === filteredData.length ? <CheckSquare className="w-5 h-5 text-brand-green" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  {columns.map(col => (
                    <th key={col} className="py-4 px-4 text-[10px] tracking-[0.15em] text-slate-400 uppercase font-black whitespace-nowrap">
                      {col.replace('Id', ' Rel')}
                    </th>
                  ))}
                  <th className="py-4 px-6 text-right text-[10px] tracking-[0.15em] text-slate-400 uppercase font-black">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((item) => (
                  <tr key={item.id} className={`group hover:bg-white/5 transition-colors ${selectedIds.has(item.id) ? 'bg-brand-green/5' : ''}`}>
                    <td className="py-3 px-6">
                      <button onClick={() => toggleSelect(item.id)} className="text-slate-600 group-hover:text-slate-400 transition-colors">
                        {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-brand-green" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    {columns.map(col => (
                      <td key={col} className="py-3 px-4 whitespace-nowrap">
                        {renderCell(col, item[col])}
                      </td>
                    ))}
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => {
                            setEditingRecord({ ...item });
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 hover:bg-brand-green/20 text-slate-500 hover:text-brand-green rounded-md transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-md transition-colors"
                          title="Purge Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingRecord({ _rawJson: JSON.stringify(item, null, 2), ...item });
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 hover:bg-white/10 text-slate-500 hover:text-white rounded-md transition-colors"
                          title="View JSON"
                        >
                          <Code className="w-4 h-4" />
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
        <footer className="h-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-lg flex items-center justify-between px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-6">
            <span>Directory Size: {Array.isArray(data) ? data.length : 0} Records</span>
            <span>Selection: {selectedIds.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 border border-brand-green/20 rounded-md text-brand-green shadow-[0_0_10px_rgba(16,185,129,0.1)]">Node Operational</span>
          </div>
        </footer>

        {/* --- Slide-in Editor Panel --- */}
        {isEditorOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setIsEditorOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-950 border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {editingRecord.id ? <Settings className="w-5 h-5 text-brand-green" /> : <PlusCircle className="w-5 h-5 text-brand-green" />}
                    {editingRecord.id ? 'Modify Data Stream' : 'Initial Record Injection'}
                  </h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    System Entity / {activeModel}
                  </p>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />
                
                <form id="editor-form" onSubmit={handleSave} className="space-y-6 relative z-10">
                  {editingRecord._rawJson !== undefined ? (
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span>Raw JSON Payload</span>
                        <Code className="w-4 h-4 text-slate-500" />
                      </label>
                      <textarea 
                        value={editingRecord._rawJson}
                        onChange={(e) => setEditingRecord({ ...editingRecord, _rawJson: e.target.value })}
                        className="w-full h-[500px] bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm font-mono text-emerald-400 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all custom-scrollbar"
                        spellCheck={false}
                      />
                      <p className="text-xs text-slate-500 italic mt-2">Invalid JSON will be rejected by the server.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {columns.filter(c => c !== 'id' && !c.includes('At')).map(col => {
                        const isObject = typeof editingRecord[col] === 'object' && editingRecord[col] !== null;
                        return (
                          <div key={col} className={`space-y-2 ${isObject ? 'col-span-1 md:col-span-2' : ''}`}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{col.replace('Id', ' Relation')}</label>
                            {isObject ? (
                              <textarea
                                value={JSON.stringify(editingRecord[col], null, 2)}
                                readOnly
                                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-slate-400 opacity-70 custom-scrollbar"
                                rows={4}
                              />
                            ) : typeof editingRecord[col] === 'boolean' ? (
                              <select
                                value={String(editingRecord[col])}
                                onChange={(e) => setEditingRecord({ ...editingRecord, [col]: e.target.value === 'true' })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-brand-green/30 outline-none transition-all text-white"
                              >
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </select>
                            ) : (
                              <input 
                                type="text"
                                placeholder={`Enter ${col}...`}
                                value={editingRecord[col] || ''}
                                onChange={(e) => setEditingRecord({ ...editingRecord, [col]: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-brand-green/30 outline-none transition-all text-white placeholder:text-slate-600"
                                required={col !== 'slug'}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </form>
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-900/80 flex items-center gap-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  form="editor-form"
                  disabled={isSaving}
                  className="flex-[2] py-3.5 bg-brand-green text-brand-dark font-black text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingRecord.id ? 'Commit Changes' : 'Execute Creation'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- Confirmation Modals --- */}
        {(confirmDeleteId || showBulkDeleteConfirm) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Confirm Data Purge</h3>
                <p className="text-slate-400 text-sm mb-8">
                  {showBulkDeleteConfirm 
                    ? `Are you sure you want to permanently delete ${selectedIds.size} records from ${activeModel}? This action cannot be undone.`
                    : `Are you sure you want to permanently delete this record from ${activeModel}? This action cannot be undone.`}
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => { setConfirmDeleteId(null); setShowBulkDeleteConfirm(false); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={showBulkDeleteConfirm ? handleBulkDelete : () => handleDelete(confirmDeleteId!)}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 text-sm flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Activity className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Confirm Purge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Toaster theme="dark" position="top-right" />

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
          width: 6px;
          height: 6px;
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

