'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Map, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  MapPin, 
  Maximize2, 
  Sprout,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Zone {
  id: string;
  name: string;
  areaSqm: number;
  cropVarieties: string[];
  _count?: {
    devices: number;
  };
}

export default function ZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({ activeZones: 0, totalArea: 0, uniqueCrops: 0 });

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [zonesRes, statsRes] = await Promise.all([
        fetch(`${API}/zones`, { headers }),
        fetch(`${API}/zones/stats`, { headers })
      ]);

      if (zonesRes.ok && statsRes.ok) {
        setZones(await zonesRes.json());
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      toast.error('Failed to load farm zones');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this zone? All associated sensor data references will be detached.')) return;

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/zones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Zone removed successfully');
        fetchZones();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (e) {
      toast.error('Could not delete zone');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Map className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Farm Zones</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Manage your production sectors, sectors and crop varieties.</p>
        </div>

        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Plus className="w-5 h-5" />
          Add Production Zone
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Zones</p>
            <p className="text-2xl font-black text-white">{stats.activeZones}</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Maximize2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Area</p>
            <p className="text-2xl font-black text-white">{stats.totalArea.toLocaleString()} sqm</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Sprout className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Crop Varieties</p>
            <p className="text-2xl font-black text-white">{stats.uniqueCrops}</p>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
         <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
           <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <LayoutGrid className="w-5 h-5" />
           </button>
           <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <ListIcon className="w-5 h-5" />
           </button>
         </div>

         {loading && (
           <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] animate-pulse tracking-widest">
             <Loader2 className="w-4 h-4 animate-spin" />
             SYNCING PATCHES...
           </div>
         )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all duration-500 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{zone.name}</h3>
                  <p className="text-slate-500 text-xs font-black flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all tracking-tighter">
                    <Maximize2 className="w-3.5 h-3.5" />
                    {zone.areaSqm} SQM
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all border border-white/5">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(zone.id)}
                    className="p-2.5 rounded-2xl bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white transition-all border border-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {zone.cropVarieties.map((crop, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {crop}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {zone._count?.devices || 0} Sensors Active
                    </span>
                 </div>
                 <button className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
                   Open Plot View
                 </button>
              </div>

              {/* Decorative Pattern */}
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
            </div>
          ))}
          
          {/* Empty State / Add Card */}
          {zones.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-slate-500">
               <Map className="w-16 h-16 mb-4 opacity-10" />
               <p className="text-xl font-black text-white mb-2">No Zones Configured</p>
               <p className="text-sm mb-8 text-center max-w-xs leading-relaxed font-medium">Your farm structure is the digital foundation of Flori-Core. Add your first zone to begin tracking harvest and IoT data.</p>
               <button className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
                 Initialize First Zone
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Zone Area Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Surface Area</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Crops</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-lg font-black text-white tracking-tight">{zone.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{zone._count?.devices || 0} attached IoT devices</p>
                  </td>
                  <td className="px-8 py-6 text-slate-300 font-mono font-black text-xs">{zone.areaSqm.toLocaleString()} M²</td>
                  <td className="px-8 py-6">
                     <div className="flex gap-2">
                       {zone.cropVarieties.slice(0, 3).map((crop, i) => (
                         <span key={i} className="px-2.4 py-1 bg-white/5 text-slate-400 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                           {crop}
                         </span>
                       ))}
                       {zone.cropVarieties.length > 3 && (
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">+{zone.cropVarieties.length - 3} MORE</span>
                       )}
                     </div>
                  </td>
                  <td className="px-8 py-6 text-right space-x-3">
                     <button className="text-slate-500 hover:text-white transition-colors">
                       <Edit2 className="w-4 h-4" />
                     </button>
                     <button 
                      onClick={() => handleDelete(zone.id)}
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
      )}
    </div>
  );
}
