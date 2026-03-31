'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Map, 
  Plus, 
  Edit2, 
  Loader2, 
  MapPin, 
  Maximize2, 
  Sprout,
  LayoutGrid,
  List as ListIcon,
  Archive,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Zone {
  id: string;
  name: string;
  areaSqm: number;
  cropVarieties: string[];
  layout?: { x: number; y: number; w: number; h: number; color?: string };
  isArchived: boolean;
  _count?: {
    devices: number;
  };
}

export default function ZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [stats, setStats] = useState({ activeZones: 0, totalArea: 0, uniqueCrops: 0 });
  const [isSavingDefault, setIsSavingDefault] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [zonesRes, statsRes, settingsRes] = await Promise.all([
        fetch(`${API}/zones`, { headers }),
        fetch(`${API}/zones/stats`, { headers }),
        fetch(`${API}/tenants/settings`, { headers })
      ]);

      if (zonesRes.status === 401 || statsRes.status === 401 || settingsRes.status === 401) {
        logout();
        return;
      }

      if (zonesRes.ok && statsRes.ok) {
        setZones(await zonesRes.json());
        setStats(await statsRes.json());
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.defaultZoneView) {
          setViewMode(settings.defaultZoneView);
        }
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

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? Historical harvest data will be preserved, but the zone will be hidden from the active farm view.`)) return;

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/zones/${id}`, {
        method: 'DELETE', // Backend now handles this as soft-delete
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`Zone "${name}" archived successfully`);
        fetchZones();
      } else {
        throw new Error('Failed to archive');
      }
    } catch (e) {
      toast.error('Could not archive zone');
    }
  };

  const setDefaultView = async () => {
    setIsSavingDefault(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/tenants/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ defaultZoneView: viewMode })
      });

      if (res.ok) {
        toast.success(`${viewMode.toUpperCase()} set as your default view`);
      }
    } catch (e) {
      toast.error('Failed to save default view');
    } finally {
      setIsSavingDefault(false);
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
         <div className="flex items-center gap-4">
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
             <button 
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Map className="w-5 h-5" />
             </button>
           </div>

           <button 
             onClick={setDefaultView}
             disabled={isSavingDefault}
             className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
           >
             {isSavingDefault ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3" />}
             Set as Default
           </button>
         </div>

         {loading && (
           <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] animate-pulse tracking-widest">
             <Loader2 className="w-4 h-4 animate-spin" />
             SYNCING PATCHES...
           </div>
         )}
      </div>

      {/* Tactical Map View */}
      {viewMode === 'map' && (
        <div className="relative bg-slate-950/50 backdrop-blur-3xl rounded-[3rem] border border-white/5 aspect-[21/9] overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute inset-0 pt-20 p-12">
             <div className="grid grid-cols-12 grid-rows-6 gap-4 h-full">
                {zones.map((zone, i) => {
                  const layout = zone.layout || {
                    x: (i % 4) * 3 + 1,
                    y: Math.floor(i / 4) * 2 + 1,
                    w: 3,
                    h: 2,
                    color: i % 2 === 0 ? 'emerald' : 'blue'
                  };
                  return (
                    <div 
                      key={zone.id}
                      className={`relative bg-${layout.color || 'emerald'}-500/10 border border-${layout.color || 'emerald'}-500/30 rounded-3xl p-6 transition-all hover:scale-[1.02] hover:bg-${layout.color || 'emerald'}-500/20 group/sector cursor-pointer shadow-lg overflow-hidden`}
                      style={{
                        gridColumn: `${layout.x} / span ${layout.w}`,
                        gridRow: `${layout.y} / span ${layout.h}`
                      }}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full bg-${layout.color || 'emerald'}-400 animate-pulse`} />
                          <h4 className="font-black text-white uppercase text-xs tracking-widest">{zone.name}</h4>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">{zone.areaSqm} SQM · {zone._count?.devices || 0} SENSORS</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 -skew-y-12 animate-pulse pointer-events-none" />
                    </div>
                  );
                })}
                <div className="absolute bottom-8 right-8 flex gap-6 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 z-20">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">High Yield</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growth Phase</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full z-30 shadow-2xl backdrop-blur-xl">
             <MapPin className="w-3 h-3 text-emerald-400" />
             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Precision Sector Satellite Active</span>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
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
                    onClick={() => handleArchive(zone.id, zone.name)}
                    className="p-2.5 rounded-2xl bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white transition-all border border-rose-500/10"
                    title="Archive Zone"
                  >
                    <Archive className="w-4 h-4" />
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
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
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
                  <td className="px-8 py-6 text-slate-300 font-mono font-black text-xs">{zone.areaSqm?.toLocaleString()} M²</td>
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
                      onClick={() => handleArchive(zone.id, zone.name)}
                      className="text-slate-500 hover:text-rose-500 transition-colors"
                      title="Archive Zone"
                     >
                       <Archive className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {zones.length === 0 && !loading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-slate-500">
           <Map className="w-16 h-16 mb-4 opacity-10" />
           <p className="text-xl font-black text-white mb-2">No Active Zones</p>
           <p className="text-sm mb-8 text-center max-w-xs leading-relaxed font-medium">Your farm structure is the digital foundation of Flori-Core. Add your first zone or check archived sectors.</p>
           <button className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
             Initialize First Zone
           </button>
        </div>
      )}
    </div>
  );
}
