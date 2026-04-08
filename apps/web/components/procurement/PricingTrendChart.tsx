'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface PricingPoint {
  date: string;
  price: number;
}

interface PricingTrendChartProps {
  data: PricingPoint[];
  itemName: string;
}

export function PricingTrendChart({ data, itemName }: PricingTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No pricing history available for this item</p>
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    price: Number(d.price.toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Trend: {itemName}</h4>
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Last 12 Months</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              fontSize={10} 
              fontFamily="monospace"
              stroke="#64748b" 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              fontSize={10} 
              fontFamily="monospace"
              stroke="#64748b" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `KES ${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
              itemStyle={{ color: '#10b981', fontWeight: '900' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
