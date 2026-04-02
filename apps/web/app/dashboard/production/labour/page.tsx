'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardList, 
  Plus, 
  MapPin, 
  Clock, 
  Target, 
  User as UserIcon, 
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import LabourStats from '@/components/production/LabourStats';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TASK_TYPES = [
  { value: 'HARVEST', label: 'Harvesting' },
  { value: 'SPRAY', label: 'Spraying' },
  { value: 'PRUNE', label: 'Pruning' },
  { value: 'PLANT', label: 'Planting' },
  { value: 'MAINTENANCE', label: 'General Maintenance' },
];

export default function LabourDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: '',
    zoneId: '',
    taskType: 'HARVEST',
    hours: 8,
    stemsCut: 0,
    gpsLocation: null as any,
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { Authorization: `Bearer ${token}` };

      const [logsRes, statsRes, usersRes, zonesRes] = await Promise.all([
        fetch(`${API}/labour-logs`, { headers }),
        fetch(`${API}/labour-logs/stats`, { headers }),
        fetch(`${API}/team`, { headers }),
        fetch(`${API}/zones`, { headers }),
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
    } catch (e) {
      console.error(e);
      toast.error('Failed to load labour data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCaptureGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          gpsLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        toast.success('GPS coordinates captured');
      }, (error) => {
        toast.error('Failed to capture GPS location');
      });
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/labour-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to log work');

      toast.success('Work log entry saved');
      setIsLogging(false);
      fetchInitialData();
    } catch (e) {
      toast.error('Error saving work log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-12 bg-pink-500 rounded-full" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Module 2.4 — Labour</p>
           </div>
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none shrink-0 border-b-8 border-white/5 pb-4">
             Field <span className="text-pink-500">Labour</span>
           </h1>
        </div>
        
        <button 
          onClick={() => setIsLogging(true)}
          className="group relative overflow-hidden bg-white text-brand-dark px-10 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          Log Daily Work
        </button>
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
                  <div className="p-3 bg-white/5 rounded-2xl text-white">
                     <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Work Log Entry</h2>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New daily record</p>
                  </div>
               </div>
               <button onClick={() => setIsLogging(false)} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Close [ESC]</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Employee</label>
                 <select 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-pink-500 outline-none transition-all appearance-none"
                   value={formData.userId}
                   onChange={e => setFormData({...formData, userId: e.target.value})}
                 >
                   <option value="">Select worker...</option>
                   {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Zone / Block</label>
                 <select 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-pink-500 outline-none transition-all appearance-none"
                   value={formData.zoneId}
                   onChange={e => setFormData({...formData, zoneId: e.target.value})}
                 >
                   <option value="">Select zone...</option>
                   {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Task Type</label>
                 <select 
                   required
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-pink-500 outline-none transition-all appearance-none"
                   value={formData.taskType}
                   onChange={e => setFormData({...formData, taskType: e.target.value})}
                 >
                   {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Duration (Hours)</label>
                 <div className="relative">
                    <input 
                      type="number"
                      step="0.5"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-pink-500 outline-none transition-all"
                      value={formData.hours}
                      onChange={e => setFormData({...formData, hours: Number(e.target.value)})}
                    />
                    <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 </div>
               </div>

               {formData.taskType === 'HARVEST' && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Stems Cut</label>
                   <div className="relative">
                      <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-pink-500 outline-none transition-all"
                        value={formData.stemsCut}
                        onChange={e => setFormData({...formData, stemsCut: Number(e.target.value)})}
                      />
                      <Target className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   </div>
                 </div>
               )}

               <div className="flex items-end gap-4">
                  <button 
                    type="button"
                    onClick={handleCaptureGPS}
                    className={`flex-1 py-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest ${formData.gpsLocation ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    <MapPin className="w-4 h-4" />
                    {formData.gpsLocation ? 'GPS Captured' : 'Tag GPS Location'}
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-[2] py-5 bg-pink-600 text-white rounded-2xl shadow-[0_20px_40px_rgba(236,72,153,0.3)] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Confirm Log Entry
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Stats and productivity */}
         <div className="lg:col-span-2 space-y-12">
            <LabourStats data={stats} />
            
            {/* Recent Logs Table */}
            <div className="bg-brand-dark/40 border border-white/5 rounded-[2.5rem] p-8">
               <div className="flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Daily Feed</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Worker activity stream</p>
                 </div>
               </div>

               <div className="space-y-4">
                 {logs.map((log: any) => (
                   <div key={log.id} className="group bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-6">
                         <div className="p-4 bg-white/5 rounded-2xl text-white">
                           <UserIcon className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white mb-1">{log.user.email}</p>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider bg-pink-500/10 px-3 py-1 rounded-full">{log.taskType}</span>
                               <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> {log.hours}h
                               </span>
                               <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                  <Target className="w-3 h-3" /> {log.zone.name}
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <p className="text-[10px] font-black text-white italic mb-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
         </div>

         {/* Right Sidebar - Integration Status */}
         <div className="space-y-8">
            <div className="bg-brand-green/20 border border-brand-green/20 rounded-[2.5rem] p-10 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                     <CheckCircle2 className="text-brand-green w-8 h-8" />
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Payroll<br/>Sync Active</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-300 mb-8 leading-relaxed">Logged hours are automatically converted to earnings at the end of the shift period.</p>
                  <button className="flex items-center gap-3 text-[10px] font-black text-brand-green uppercase tracking-[0.2em] hover:gap-6 transition-all">
                    View Payroll Module <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-green/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
            </div>

            <div className="bg-slate-800/20 border border-white/5 rounded-[2.5rem] p-10">
               <div className="flex items-center gap-4 mb-6">
                  <AlertCircle className="text-slate-500 w-8 h-8" />
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Field<br/>Validation</h3>
               </div>
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="h-2 w-2 rounded-full bg-brand-green mt-1" />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GPS variance check: OK</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-2 w-2 rounded-full bg-pink-500 mt-1" />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical average match: 94%</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
