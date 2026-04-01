/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  MousePointer2, 
  Info, 
  Thermometer, 
  Droplets, 
  Activity,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  areaSqm: number;
  plantCount?: number;
  lastWatered?: string;
  cropVarieties: string[];
  isArchived: boolean;
  layout?: { x: number; y: number; w: number; h: number; color?: string };
  cropCycles?: any[];
}

interface ZoneMapProps {
  zones: Zone[];
  onZoneClick: (zone: Zone) => void;
  selectedZoneId?: string;
}

export default function ZoneMap({ zones, onZoneClick, selectedZoneId }: ZoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'status' | 'harvest' | 'moisture'>('status');

  // Simple grid calculation for zones without explicit layout coordinates
  const cols = 5;
  const gap = 12;
  const rectWidth = 160;
  const rectHeight = 100;

  const getZoneColor = (zone: Zone) => {
    const activeCycle = zone.cropCycles?.[0];
    if (!activeCycle) return 'fill-slate-800/40 stroke-slate-700';
    
    switch (viewMode) {
      case 'harvest':
        // Mock logic for days to harvest
        const diff = Math.random() * 30; 
        if (diff < 7) return 'fill-emerald-500/30 stroke-emerald-500';
        if (diff < 14) return 'fill-emerald-400/20 stroke-emerald-400';
        return 'fill-emerald-300/10 stroke-emerald-300/50';
      case 'moisture':
        const moisture = Math.random() * 100;
        if (moisture > 70) return 'fill-blue-500/30 stroke-blue-500';
        if (moisture > 40) return 'fill-blue-400/20 stroke-blue-400';
        return 'fill-rose-500/30 stroke-rose-500';
      default:
        return activeCycle.status === 'GROWING' 
          ? 'fill-brand-green/10 stroke-brand-green shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
          : 'fill-blue-500/10 stroke-blue-500';
    }
  };

  return (
    <div className="relative w-full bg-brand-dark/40 rounded-[2.5rem] border border-white/5 p-8 min-h-[600px] overflow-hidden group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Control Overlay */}
      <div className="absolute top-8 left-8 z-20 flex gap-4">
        <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
          {[
            { id: 'status', label: 'Cycle Status', icon: Activity },
            { id: 'harvest', label: 'Harvest Readiness', icon: Calendar },
            { id: 'moisture', label: 'IoT Moisture', icon: Droplets }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === mode.id 
                  ? 'bg-brand-green text-slate-950 shadow-lg' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <mode.icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-8 right-8 z-20 flex gap-3 text-slate-500">
         <button className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:text-white transition-colors">
            <Maximize2 className="w-5 h-5" />
         </button>
         <button className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:text-white transition-colors">
            <Search className="w-5 h-5" />
         </button>
      </div>

      {/* SVG Canvas */}
      <motion.svg 
        viewBox={`0 0 ${cols * (rectWidth + gap) + gap} 600`}
        className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence>
          {zones.map((zone, i) => {
            const x = (i % cols) * (rectWidth + gap) + gap;
            const y = Math.floor(i / cols) * (rectHeight + gap) + 80;
            const activeCycle = zone.cropCycles?.[0];
            const isSelected = selectedZoneId === zone.id;
            const isHovered = hoveredZone === zone.id;

            return (
              <motion.g
                key={zone.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onZoneClick(zone)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={rectWidth}
                  height={rectHeight}
                  rx={20}
                  className={`transition-all duration-500 ${getZoneColor(zone)} ${
                    isSelected ? 'stroke-[3px] stroke-white' : 'stroke-[1.5px]'
                  }`}
                />
                
                {/* Text Labels */}
                <text x={x + 16} y={y + 35} className="fill-white text-[12px] font-black uppercase tracking-tighter italic">
                  {zone.name}
                </text>
                <text x={x + 16} y={y + 55} className="fill-slate-500 text-[9px] font-bold uppercase tracking-widest">
                  {activeCycle?.variety?.name || 'FALLOW'}
                </text>

                {/* Micro Indicators */}
                {activeCycle && (
                  <circle cx={x + rectWidth - 25} cy={y + 28} r={4} className="fill-brand-green animate-pulse" />
                )}

                {/* Interaction Glow */}
                {(isHovered || isSelected) && (
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={rectWidth + 8}
                    height={rectHeight + 8}
                    rx={24}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.1}
                    strokeWidth={1}
                  />
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </motion.svg>

      {/* Legend / Status Overlay */}
      <div className="absolute bottom-8 left-8 z-20 flex gap-6 px-6 py-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fallow</span>
        </div>
      </div>

      {/* Floating Tooltip Mock */}
      <AnimatePresence>
        {hoveredZone && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 right-8 z-30 w-64 bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-none"
          >
             <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded text-[8px] font-black uppercase">Block Pulse</span>
                <Thermometer className="w-4 h-4 text-slate-500" />
             </div>
             <p className="text-sm font-black text-white uppercase italic mb-1">{zones.find(z => z.id === hoveredZone)?.name}</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Real-time Telemetry Active</p>
             
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black text-slate-600 uppercase">Moisture</span>
                   <span className="text-[10px] font-black text-brand-green">68.2%</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full">
                   <div className="bg-brand-green h-full w-[68%]" />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
