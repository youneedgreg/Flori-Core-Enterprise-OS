/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import {
  TrendingUp, Zap, Target, Clock, BarChart3,
  Loader2, User, ChevronRight,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { return document.cookie.match(/access_token=([^;]+)/)?.[1] ?? ''; }

function GaugeCard({ label, value, max, unit, icon: Icon, color }: {
  label: string; value: number; max: number; unit: string; icon: any; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colorClass = pct >= 70 ? 'text-brand-green' : pct >= 40 ? 'text-amber-400' : 'text-rose-400';
  const barColor = pct >= 70 ? 'bg-brand-green' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-5 relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all`} />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
            <Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-end gap-1">
          <span className={`text-2xl font-black ${colorClass}`}>{value.toFixed(1)}</span>
          <span className="text-[9px] font-black text-slate-600 uppercase mb-1">{unit}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  employees: any[];
}

export default function KpiDashboardTab({ employees }: Props) {
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchKpis = async (empId: string, per: string) => {
    if (!empId || !per) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/hr/kpis/${empId}?period=${per}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.ok) setKpiData(await r.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  const handleEmpChange = (id: string) => {
    setSelectedEmp(id);
    fetchKpis(id, period);
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (selectedEmp) fetchKpis(selectedEmp, p);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Employee</label>
          <select value={selectedEmp} onChange={e => handleEmpChange(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
            <option value="">Select employee</option>
            {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
          </select>
        </div>
        <div className="min-w-[180px] space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Period</label>
          <input type="month" value={period} onChange={e => handlePeriodChange(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
        </div>
      </div>

      {!selectedEmp ? (
        <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-16 text-center">
          <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select an employee</p>
          <p className="text-[9px] text-slate-600 mt-1">Choose an employee and period to view KPIs linked to farm productivity data</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : kpiData ? (
        <div className="space-y-6">
          {/* KPI Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <GaugeCard label="Stems / Hour" value={kpiData.stemsPerHour} max={300} unit="stems/hr" icon={Zap} color="emerald" />
            <GaugeCard label="Rejection Rate" value={kpiData.rejectionRate * 100} max={10} unit="%" icon={Target} color="rose" />
            <GaugeCard label="Attendance" value={kpiData.attendanceScore} max={10} unit="/10" icon={Clock} color="blue" />
            <GaugeCard label="Productivity" value={kpiData.productivityScore} max={10} unit="/10" icon={TrendingUp} color="emerald" />
            <GaugeCard label="Quality" value={kpiData.qualityScore} max={10} unit="/10" icon={Target} color="purple" />
            <GaugeCard label="Overall Score" value={kpiData.overallScore} max={10} unit="/10" icon={BarChart3} color="amber" />
          </div>

          {/* Overall Summary */}
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Performance Summary</p>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">Period: {kpiData.period}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Productivity Weight</p>
                <p className="text-lg font-black text-brand-green">40%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Quality Weight</p>
                <p className="text-lg font-black text-purple-400">40%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Attendance Weight</p>
                <p className="text-lg font-black text-blue-400">20%</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-12 text-center">
          <Target className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No KPI data for this period</p>
        </div>
      )}

      {/* Quick Employee List */}
      {!selectedEmp && employees.length > 0 && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Select</p>
          </div>
          <div className="divide-y divide-white/5">
            {employees.slice(0, 8).map((emp: any) => (
              <button key={emp.id} onClick={() => handleEmpChange(emp.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-brand-green transition-colors">{emp.firstName} {emp.lastName}</p>
                    <p className="text-[9px] text-slate-600">{emp.jobTitle || emp.department || '—'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-green transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
