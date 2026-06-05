/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap, Award, ShieldCheck, Star, BarChart3,
  Calendar, Loader2, BookOpen, Plus, X,
  CheckCircle2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../../lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Badge } from '../../../../components/ui/badge';
import TrainingRecordsTab from './TrainingRecordsTab';
import ComplianceTab from './ComplianceTab';
import AppraisalsTab from './AppraisalsTab';
import KpiDashboardTab from './KpiDashboardTab';
import TrainingCalendarTab from './TrainingCalendarTab';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  return document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';
}
function authHdr(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}
async function apiFetch(url: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${url}`, {
    ...opts,
    headers: { ...authHdr(), ...(opts.headers as any) },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || 'Request failed');
  }
  return r.json();
}

function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-brand-dark/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-linear-to-r from-transparent via-brand-green/40 to-transparent" />
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function KpiCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<'records' | 'compliance' | 'appraisals' | 'kpis' | 'calendar'>('records');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [complianceData, setComplianceData] = useState<any>(null);

  // Add Course modal
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', category: '', description: '', isMandatory: false, validityMonths: '' });
  const [savingCourse, setSavingCourse] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) { logout(); return; }

      const [coursesData, recordsData, schedulesData, employeesData, appraisalsData, complianceRes] = await Promise.all([
        apiFetch('/hr/training/courses'),
        apiFetch('/hr/training/records'),
        apiFetch('/hr/training/schedule'),
        apiFetch('/hr/employees'),
        apiFetch('/hr/appraisals').catch(() => []),
        apiFetch('/hr/training/compliance').catch(() => null),
      ]);

      setCourses(coursesData);
      setRecords(recordsData);
      setSchedules(schedulesData);
      setEmployees(employeesData);
      setAppraisals(appraisalsData);
      setComplianceData(complianceRes);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      await apiFetch('/hr/training/courses', {
        method: 'POST',
        body: JSON.stringify({
          ...courseForm,
          validityMonths: courseForm.validityMonths ? parseInt(courseForm.validityMonths) : null,
        }),
      });
      toast.success('Course created');
      setShowAddCourse(false);
      setCourseForm({ name: '', category: '', description: '', isMandatory: false, validityMonths: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingCourse(false);
    }
  };

  // KPI summary
  const totalRecords = records.length;
  const activeAppraisals = appraisals.filter((a: any) => a.status === 'IN_PROGRESS').length;
  const scheduledTrainings = schedules.filter((s: any) => s.status === 'SCHEDULED').length;
  const compliancePct = complianceData?.summary
    ? Math.round((complianceData.summary.fullyCompliant / Math.max(complianceData.summary.totalEmployees, 1)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-green mx-auto" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Training Hub...</p>
        </div>
      </div>
    );
  }

  const CATEGORIES = [
    { value: 'CHEMICAL_HANDLING', label: 'Chemical Handling' },
    { value: 'FIRST_AID', label: 'First Aid' },
    { value: 'FIRE_SAFETY', label: 'Fire Safety' },
    { value: 'GENERAL', label: 'General' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'MANAGEMENT', label: 'Management' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={BookOpen} label="Training Records" value={totalRecords} color="emerald" sub={`${courses.length} courses`} />
        <KpiCard icon={ShieldCheck} label="Compliance Rate" value={`${compliancePct}%`} color="blue" sub={`${complianceData?.summary?.fullyCompliant ?? 0} fully compliant`} />
        <KpiCard icon={Star} label="Active Appraisals" value={activeAppraisals} color="amber" sub={`${appraisals.length} total`} />
        <KpiCard icon={Calendar} label="Scheduled Training" value={scheduledTrainings} color="purple" sub="Upcoming sessions" />
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-4">
            Training & Appraisals
            <Badge variant="outline" className="text-brand-green border-brand-green/30 px-3 font-black">HR MODULE</Badge>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Manage training records, compliance certifications, performance reviews, and KPIs.
          </p>
        </div>
        <button onClick={() => setShowAddCourse(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-lg">
          <Plus className="w-5 h-5" /> New Course
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit flex-wrap overflow-x-auto scrollbar-hide">
        {[
          { value: 'records', icon: Award, label: 'Training Records' },
          { value: 'compliance', icon: ShieldCheck, label: 'Compliance' },
          { value: 'appraisals', icon: Star, label: '360° Appraisals' },
          { value: 'kpis', icon: BarChart3, label: 'KPI Dashboard' },
          { value: 'calendar', icon: Calendar, label: 'Calendar' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as any)}
            className={`rounded-xl px-5 py-3 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === value
                ? 'bg-brand-green text-slate-950 shadow-lg'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'records' && (
          <div className="animate-in fade-in duration-300">
            <TrainingRecordsTab records={records} courses={courses} employees={employees} onRefresh={fetchData} />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="animate-in fade-in duration-300">
            <ComplianceTab complianceData={complianceData} />
          </div>
        )}

        {activeTab === 'appraisals' && (
          <div className="animate-in fade-in duration-300">
            <AppraisalsTab appraisals={appraisals} employees={employees} onRefresh={fetchData} />
          </div>
        )}

        {activeTab === 'kpis' && (
          <div className="animate-in fade-in duration-300">
            <KpiDashboardTab employees={employees} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-300">
            <TrainingCalendarTab schedules={schedules} courses={courses} onRefresh={fetchData} />
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <Modal title="New Training Course" subtitle="Add a course to the catalog" onClose={() => setShowAddCourse(false)}>
          <form onSubmit={handleAddCourse} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Course Name</label>
              <input required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="e.g. Chemical Safety Level 1"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                <select required value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Validity (months)</label>
                <input type="number" min="1" value={courseForm.validityMonths} onChange={e => setCourseForm({ ...courseForm, validityMonths: e.target.value })} placeholder="e.g. 12"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Description</label>
              <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} placeholder="Course description..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 resize-none" />
            </div>
            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
              <input type="checkbox" checked={courseForm.isMandatory} onChange={e => setCourseForm({ ...courseForm, isMandatory: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-green" />
              <div>
                <p className="text-xs font-black text-white">Mandatory Course</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Mark as required for compliance tracking</p>
              </div>
            </label>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowAddCourse(false)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={savingCourse}
                className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {savingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Create Course
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
