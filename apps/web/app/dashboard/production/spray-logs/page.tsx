/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  MapPin, 
  Clock, 
  AlertCircle,
  Activity,
  FileDown,
  ShieldCheck,
  Calendar,
  FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const UNITS = ['L', 'Kg', 'ml', 'g'];

export default function SprayLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  
  const [formData, setFormData] = useState({
    zoneId: '',
    chemicalName: '',
    epaRegNo: '',
    quantity: 0,
    unit: 'L',
    phiDays: 0,
    applicatorId: '',
    appliedAt: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const [logsRes, zonesRes, usersRes] = await Promise.all([
        fetch(`${API}/spray-logs`, { headers }),
        fetch(`${API}/zones`, { headers }),
        fetch(`${API}/team`, { headers }),
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/spray-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to log spray');

      toast.success('Chemical application logged');
      setIsLogging(false);
      fetchInitialData();
    } catch (e) {
      toast.error('Error saving spray log');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      
      const res = await fetch(`${API}/spray-logs/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spray_compliance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('GlobalG.A.P. Export Generated');
    } catch (e) {
      toast.error('Failed to generate export');
    }
  };

  const isPhiActive = (harvestAllowedAt: string) => {
     return new Date(harvestAllowedAt) > new Date();
  };

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-12 bg-rose-500 rounded-full" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Module 2.5 — Compliance</p>
           </div>
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none shrink-0 border-b-8 border-white/5 pb-4">
             Spray <span className="text-rose-500">Log</span>
           </h1>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="group relative overflow-hidden bg-white/5 text-white px-8 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all hover:bg-white/10 border border-white/10"
          >
            <FileDown className="w-5 h-5 text-rose-500" />
            GlobalG.A.P. Export
          </button>
          <button 
            onClick={() => setIsLogging(true)}
            className="group relative overflow-hidden bg-white text-brand-dark px-10 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            Log Chemical Application
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isLogging && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-brand-dark/90 border-2 border-white/10 backdrop-blur-3xl p-8 rounded-[3rem] shadow-2xl relative z-10"
          >
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                     <FlaskConical className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">New Spray Record</h2>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GlobalG.A.P. Compliance Data</p>
                  </div>
               </div>
               <button onClick={() => setIsLogging(false)} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Close [ESC]</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Zone / Block</label>
                 <select 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all appearance-none"
                   value={formData.zoneId}
                   onChange={e => setFormData({...formData, zoneId: e.target.value})}
                 >
                   <option value="">Select zone...</option>
                   {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Chemical Name</label>
                 <input 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                   value={formData.chemicalName}
                   onChange={e => setFormData({...formData, chemicalName: e.target.value})}
                   placeholder="e.g. Copper Oxychloride"
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">EPA Reg No.</label>
                 <input 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                   value={formData.epaRegNo}
                   onChange={e => setFormData({...formData, epaRegNo: e.target.value})}
                   placeholder="000-000-00"
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity</label>
                 <div className="flex gap-2">
                    <input 
                      type="number"
                      required
                      className="flex-[2] bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                    <select 
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all appearance-none"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value as any})}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">PHI (Days)</label>
                 <div className="relative">
                    <input 
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                      value={formData.phiDays}
                      onChange={e => setFormData({...formData, phiDays: Number(e.target.value)})}
                    />
                    <ShieldCheck className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Applicator</label>
                 <select 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all appearance-none"
                   value={formData.applicatorId}
                   onChange={e => setFormData({...formData, applicatorId: e.target.value})}
                 >
                   <option value="">Select applicator...</option>
                   {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Application Date</label>
                 <div className="relative">
                    <input 
                      type="date"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                      value={formData.appliedAt}
                      onChange={e => setFormData({...formData, appliedAt: e.target.value})}
                    />
                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 </div>
               </div>

               <div className="lg:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Notes</label>
                 <input 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-500 outline-none transition-all"
                   value={formData.notes}
                   onChange={e => setFormData({...formData, notes: e.target.value})}
                   placeholder="e.g. Tank mix with wetter, afternoon application"
                 />
               </div>

               <div className="flex items-end">
                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-rose-600 text-white rounded-2xl shadow-[0_20px_40px_rgba(225,29,72,0.3)] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Confirm Spray Log
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compliance Stream */}
      <div className="bg-brand-dark/40 border border-white/5 rounded-[2.5rem] p-8 mt-12">
         <div className="flex items-center justify-between mb-8">
           <div>
             <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Compliance Stream</h2>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time PHI tracking per block</p>
           </div>
         </div>

         <div className="space-y-4">
           {logs.map((log: any) => (
             <div key={log.id} className="group bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.07] transition-all gap-6">
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-2xl border ${isPhiActive(log.harvestAllowedAt) ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-brand-green/10 border-brand-green/20 text-brand-green'}`}>
                     <AlertCircle className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-black text-white">{log.chemicalName}</p>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">EPA: {log.epaRegNo}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isPhiActive(log.harvestAllowedAt) ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-brand-green/10 text-brand-green border border-brand-green/10'}`}>
                           {isPhiActive(log.harvestAllowedAt) ? `PHI ACTIVE: ${log.phiDays}D` : 'PHI EXPIRED'}
                         </span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> {log.zone.name}
                         </span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {log.quantity}{log.unit}
                         </span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-10">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Harvest Allowed At</p>
                      <p className={`text-sm font-black italic ${isPhiActive(log.harvestAllowedAt) ? 'text-amber-500' : 'text-brand-green'}`}>
                        {new Date(log.harvestAllowedAt).toLocaleDateString()}
                      </p>
                   </div>

                   <div className="text-right">
                      <p className="text-[10px] font-black text-white italic mb-1">{new Date(log.appliedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">By {log.applicator.email.split('@')[0]}</p>
                   </div>
                </div>
             </div>
           ))}
           {logs.length === 0 && (
             <div className="py-20 text-center opacity-30">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">No chemical applications recorded</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
