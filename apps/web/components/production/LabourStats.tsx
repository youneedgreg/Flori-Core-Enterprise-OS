/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Users, Target } from 'lucide-react';

interface LabourStatsProps {
  data: any[];
}

export default function LabourStats({ data }: LabourStatsProps) {
  const totalStems = data.reduce((acc, curr) => acc + curr.stemsCut, 0);
  const avgPerWorker = data.length > 0 ? (totalStems / data.length).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-brand-green/20 rounded-2xl text-brand-green">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Stems</p>
            <h3 className="text-2xl font-black text-white italic tracking-tighter">{totalStems.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-pink-500/20 rounded-2xl text-pink-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workers Tracked</p>
            <h3 className="text-2xl font-black text-white italic tracking-tighter">{new Set(data.map(d => d.worker)).size}</h3>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Stems / Worker / Day</p>
            <h3 className="text-2xl font-black text-white italic tracking-tighter">{avgPerWorker}</h3>
          </div>
        </div>
      </div>

      <div className="bg-brand-dark/40 border border-white/5 p-8 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Productivity Chart</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stems cut per worker</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="worker" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(val) => val.split('@')[0]}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
              />
              <Bar dataKey="stemsCut" radius={[10, 10, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index % 2 === 0 ? '#10b981' : '#ec4899'} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
