import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  color: 'emerald' | 'blue' | 'cyan' | 'amber' | 'rose';
}

const colorMap = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
  cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20',
};

export default function KPICard({ label, value, trend, trendDirection, color }: KPICardProps) {
  const Icon = trendDirection === 'up' ? ArrowUpRight : trendDirection === 'down' ? ArrowDownRight : Minus;

  return (
    <div className={`glass p-6 rounded-3xl border ${colorMap[color]} group hover:scale-[1.02] transition-all duration-300`}>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black tracking-tight text-white">{value}</h3>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/5`}>
          <Icon className="w-3 h-3" />
          {trend}
        </div>
      </div>
      
      {/* Dynamic background glow */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${colorMap[color].split(' ')[0]} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
    </div>
  );
}
