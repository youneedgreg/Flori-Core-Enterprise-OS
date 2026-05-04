/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, AlertTriangle,
  Beaker, HeartPulse, Flame, Users,
} from 'lucide-react';

const categoryIcons: Record<string, any> = {
  CHEMICAL_HANDLING: Beaker,
  FIRST_AID: HeartPulse,
  FIRE_SAFETY: Flame,
};

const categoryColors: Record<string, string> = {
  CHEMICAL_HANDLING: 'purple',
  FIRST_AID: 'rose',
  FIRE_SAFETY: 'amber',
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  COMPLIANT: { label: 'Compliant', color: 'brand-green', icon: ShieldCheck },
  EXPIRING_SOON: { label: 'Expiring', color: 'amber-400', icon: AlertTriangle },
  EXPIRED: { label: 'Expired', color: 'rose-400', icon: ShieldX },
  NOT_TRAINED: { label: 'Not Trained', color: 'slate-500', icon: ShieldAlert },
};

interface Props {
  complianceData: any;
}

export default function ComplianceTab({ complianceData }: Props) {
  const summary = complianceData?.summary;
  const matrix = complianceData?.matrix ?? [];
  const courses = complianceData?.courses ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: summary?.totalEmployees ?? 0, color: 'blue', icon: Users },
          { label: 'Fully Compliant', value: summary?.fullyCompliant ?? 0, color: 'emerald', icon: ShieldCheck },
          { label: 'Partially Compliant', value: summary?.partiallyCompliant ?? 0, color: 'amber', icon: AlertTriangle },
          { label: 'Non-Compliant', value: summary?.nonCompliant ?? 0, color: 'rose', icon: ShieldX },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${kpi.color}-500/10 blur-2xl rounded-full group-hover:bg-${kpi.color}-500/20 transition-all`} />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-500/10 flex items-center justify-center border border-${kpi.color}-500/20`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-400`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <p className="text-xl font-black text-white">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Category Cards */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map((course: any) => {
            const color = categoryColors[course.category] ?? 'slate';
            const Icon = categoryIcons[course.category] ?? ShieldCheck;
            const courseEntries = matrix.map((m: any) =>
              m.courseStatuses.find((cs: any) => cs.courseId === course.id)
            ).filter(Boolean);
            const compliant = courseEntries.filter((e: any) => e.status === 'COMPLIANT').length;
            const pct = courseEntries.length > 0 ? Math.round((compliant / courseEntries.length) * 100) : 0;

            return (
              <div key={course.id} className={`bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-${color}-500/10 blur-3xl rounded-full`} />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
                      <Icon className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{course.name}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{course.category.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Rate</span>
                      <span className={`text-sm font-black ${pct >= 80 ? 'text-brand-green' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-brand-green' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold">{compliant} of {courseEntries.length} employees trained</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employee Compliance Matrix */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Employee Compliance Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky left-0 bg-brand-dark/80 backdrop-blur-xl z-10">Employee</th>
                {courses.map((c: any) => (
                  <th key={c.id} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center whitespace-nowrap">{c.name}</th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrix.length === 0 ? (
                <tr><td colSpan={courses.length + 2} className="px-6 py-16 text-center">
                  <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No compliance data available</p>
                  <p className="text-[9px] text-slate-700 mt-1">Add compliance training courses (Chemical Handling, First Aid, Fire Safety) to begin tracking</p>
                </td></tr>
              ) : matrix.map((row: any) => (
                <tr key={row.employee.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="px-6 py-4 sticky left-0 bg-brand-dark/80 backdrop-blur-xl z-10">
                    <p className="text-sm font-black text-white">{row.employee.firstName} {row.employee.lastName}</p>
                    <p className="text-[9px] text-slate-600 font-bold mt-0.5">{row.employee.department || row.employee.jobTitle || '—'}</p>
                  </td>
                  {row.courseStatuses.map((cs: any) => {
                    const cfg = statusConfig[cs.status];
                    const Icon = cfg.icon;
                    return (
                      <td key={cs.courseId} className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className={`w-4 h-4 text-${cfg.color}`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest text-${cfg.color}`}>{cfg.label}</span>
                          {cs.completionDate && (
                            <span className="text-[8px] text-slate-600">{new Date(cs.completionDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                      row.overallStatus === 'FULLY_COMPLIANT' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                      row.overallStatus === 'NON_COMPLIANT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {row.compliantCount}/{row.totalRequired}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
