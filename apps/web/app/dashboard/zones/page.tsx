/* eslint-disable @typescript-eslint/no-explicit-any */
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
  CheckCircle,
  X,
  Droplets,
  Thermometer,
  Layers,
  Search,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import ZoneMap from '../../../components/production/ZoneMap';
import CreateZoneModal from '../../../components/production/CreateZoneModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Zone {
  id: string;
  name: string;
  areaSqm: number;
  plantCount?: number;
  lastWatered?: string;
  cropVarieties: string[];
  layout?: { x: number; y: number; w: number; h: number; color?: string };
  isArchived: boolean;
  cropCycles?: any[];
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
  
  // New States for 2.2
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        method: 'DELETE',
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

  const handleBulkUpdate = async () => {
    if (selectedZoneIds.length === 0) return;
    const varieties = prompt('Enter new crop varieties (comma separated):');
    if (!varieties) return;

    setIsBulkUpdating(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/zones/bulk-update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          ids: selectedZoneIds, 
          cropVarieties: varieties.split(',').map(v => v.trim()) 
        })
      });

      if (res.ok) {
        toast.success(`Bulk update successful for ${selectedZoneIds.length} zones`);
        setSelectedZoneIds([]);
        setIsBulkMode(false);
        fetchZones();
      }
    } catch (e) {
      toast.error('Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleZoneSelection = (id: string) => {
    setSelectedZoneIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((zid: string) => zid !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 relative">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Map className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Agronomy Sectors</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Geospatial management of farm blocks and production zones.</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all border ${
              isBulkMode 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {isBulkMode ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            {isBulkMode ? 'Cancel Selection' : 'Bulk Edit'}
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Add Production Zone
          </button>
        </div>
      </header>

      {/* Production Zone Creation Modal */}
      {isCreateModalOpen && (
        <CreateZoneModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          apiBase={API}
          onSuccess={fetchZones}
        />
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {isBulkMode && selectedZoneIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 px-8 py-4 bg-slate-900 border border-white/10 rounded-full shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
              <span className="text-sm font-black text-white">{selectedZoneIds.length} Zones Selected</span>
              <button 
                onClick={() => setSelectedZoneIds([])}
                className="text-[10px] font-black text-slate-500 uppercase hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={handleBulkUpdate}
                 disabled={isBulkUpdating}
                 className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
               >
                  {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Update Crops
               </button>
               <button className="flex items-center gap-2 px-6 py-2 bg-white/5 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Droplets className="w-4 h-4" />
                  Request Watering
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique Crops</p>
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
             CALIBRATING SECTOR MESH...
           </div>
         )}
      </div>

      {/* Main Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {viewMode === 'map' && (
            <motion.div 
              key="map-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
               <ZoneMap 
                zones={zones} 
                onZoneClick={(z) => setSelectedZone(z)} 
                selectedZoneId={selectedZone?.id}
               />
            </motion.div>
          )}

          {viewMode === 'grid' && (
            <motion.div 
              key="grid-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  onClick={() => isBulkMode ? toggleZoneSelection(zone.id) : setSelectedZone(zone)}
                  className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl relative overflow-hidden group cursor-pointer ${
                    isBulkMode && selectedZoneIds.includes(zone.id) 
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20' 
                      : 'border-white/5 hover:border-emerald-500/30'
                  }`}
                >
                  {isBulkMode && (
                    <div className="absolute top-8 right-8 z-20">
                       {selectedZoneIds.includes(zone.id) ? (
                         <CheckSquare className="w-6 h-6 text-emerald-500" />
                       ) : (
                         <Square className="w-6 h-6 text-slate-700" />
                       )}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight italic">{zone.name}</h3>
                      <p className="text-slate-500 text-xs font-black flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all tracking-tighter">
                        <Maximize2 className="w-3.5 h-3.5" />
                        {zone.areaSqm} SQM · {zone.plantCount || 0} PLANTS
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {zone.cropCycles?.[0]?.variety ? (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {zone.cropCycles[0].variety.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Fallow
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${zone.cropCycles?.[0] ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {zone._count?.devices || 0} Sensors Active
                        </span>
                     </div>
                     <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </div>
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
                </div>
              ))}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {isBulkMode && <th className="pl-8 py-6 w-12"></th>}
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sector Manifest</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scale</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Crop</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {zones.map((zone) => (
                    <tr 
                      key={zone.id} 
                      onClick={() => isBulkMode && toggleZoneSelection(zone.id)}
                      className={`hover:bg-white/2 transition-colors group cursor-pointer ${
                        isBulkMode && selectedZoneIds.includes(zone.id) ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {isBulkMode && (
                        <td className="pl-8 py-6">
                           {selectedZoneIds.includes(zone.id) ? (
                             <CheckSquare className="w-4 h-4 text-emerald-500" />
                           ) : (
                             <Square className="w-4 h-4 text-slate-700" />
                           )}
                        </td>
                      )}
                      <td className="px-8 py-6" onClick={() => !isBulkMode && setSelectedZone(zone)}>
                        <p className="text-lg font-black text-white tracking-tight italic uppercase">{zone.name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{zone._count?.devices || 0} IoT Nodes</p>
                      </td>
                      <td className="px-8 py-6 text-slate-300 font-mono font-black text-xs">{zone.areaSqm?.toLocaleString()} M²</td>
                      <td className="px-8 py-6">
                         {zone.cropCycles?.[0]?.variety ? (
                           <span className="text-brand-green font-black text-[11px] uppercase italic">{zone.cropCycles[0].variety.name}</span>
                         ) : (
                           <span className="text-slate-600 font-black text-[11px] uppercase italic">Offline (Fallow)</span>
                         )}
                      </td>
                      <td className="px-8 py-6 text-right space-x-3">
                         <button className="text-slate-500 hover:text-white transition-colors">
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); handleArchive(zone.id, zone.name); }}
                          className="text-slate-500 hover:text-rose-500 transition-colors"
                         >
                           <Archive className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Detail Panel */}
        <AnimatePresence>
          {selectedZone && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedZone(null)}
                className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-[70] shadow-2xl p-10 overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedZone(null)}
                  className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="space-y-12">
                   <header className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedZone.name}</h2>
                      </div>
                      <div className="flex gap-4">
                         <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dimension</p>
                            <p className="text-sm font-black text-white">{selectedZone.areaSqm} M²</p>
                         </div>
                         <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Telemetry Status</p>
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <p className="text-sm font-black text-brand-green uppercase tracking-tighter">Live</p>
                            </div>
                         </div>
                      </div>
                   </header>

                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Genetic Status</h4>
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 border-l-4 border-l-brand-green relative overflow-hidden">
                         <div className="absolute top-0 right-0 -mr-6 -mt-6 p-10 opacity-5">
                            <Sprout className="w-20 h-20 text-brand-green" />
                         </div>
                         {selectedZone.cropCycles?.[0] ? (
                           <div className="space-y-6 relative z-10">
                              <div>
                                 <p className="text-[8px] font-black text-brand-green uppercase tracking-widest mb-1">Active Variety</p>
                                 <p className="text-2xl font-black text-white uppercase italic">{selectedZone.cropCycles[0].variety.name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Plant Density</p>
                                    <p className="text-lg font-black text-white tracking-tighter">{selectedZone.plantCount || 0} Stems</p>
                                 </div>
                                 <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Days to Harvest</p>
                                    <p className="text-lg font-black text-amber-500 tracking-tighter">Est. 14 Days</p>
                                 </div>
                              </div>
                           </div>
                         ) : (
                           <p className="text-sm font-black text-slate-500 uppercase italic tracking-widest">No Active Crop Cycle Found</p>
                         )}
                      </div>
                   </section>

                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Irrigation Health</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <Droplets className="w-5 h-5 text-blue-400 mb-4" />
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Moisture</p>
                            <p className="text-xl font-black text-white">64.8%</p>
                         </div>
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <Thermometer className="w-5 h-5 text-rose-400 mb-4" />
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Irrigated</p>
                            <p className="text-xs font-black text-white uppercase">{selectedZone.lastWatered ? new Date(selectedZone.lastWatered).toLocaleTimeString() : 'N/A'}</p>
                         </div>
                      </div>
                   </section>

                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Compliance & Safety</h4>
                      <div className="bg-black/20 p-6 border border-white/5 rounded-3xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-brand-green" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PHI Status Cleared</p>
                         </div>
                         <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest">View Logs</button>
                      </div>
                   </section>

                   <div className="flex gap-4 pt-8">
                      <button className="flex-1 py-4 bg-brand-green text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-green/90 transition-all shadow-xl shadow-brand-green/20">
                         Modify Cycle
                      </button>
                      <button className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all">
                         Manual Watering
                      </button>
                   </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Search Overlay Placeholder */}
      {!loading && zones.length > 0 && (
        <div className="fixed bottom-12 right-12 z-40 bg-slate-900 border border-white/10 p-4 rounded-3xl shadow-2xl backdrop-blur-3xl hidden md:flex items-center gap-4">
           <Search className="w-5 h-5 text-slate-500" />
           <input 
             type="text" 
             placeholder="JUMP TO SECTOR..." 
             className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 w-32"
           />
        </div>
      )}

      {/* Empty State */}
      {zones.length === 0 && !loading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-slate-500">
           <Map className="w-16 h-16 mb-4 opacity-10" />
           <p className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">No Active Sectors Detected</p>
           <p className="text-sm mb-8 text-center max-w-xs leading-relaxed font-medium">Your farm structure is the digital foundation of Flori-Core Enterprise. Initialize your first production zone to begin telemetry tracking.</p>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
           >
             Deploy First Sector
           </button>
        </div>
      )}
    </div>
  );
}
