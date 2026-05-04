/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2, CheckCircle2,
  MapPin, UserCheck, Clock,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { return document.cookie.match(/access_token=([^;]+)/)?.[1] ?? ''; }

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
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-white/5"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}

interface Props {
  schedules: any[];
  courses: any[];
  onRefresh: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  COMPLETED: 'bg-brand-green/20 border-brand-green/30 text-brand-green',
  CANCELLED: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
};

export default function TrainingCalendarTab({ schedules, courses, onRefresh }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ courseId: '', scheduledDate: '', department: '', trainer: '', location: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [year, month]);

  const schedulesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    schedules.forEach((s: any) => {
      const d = new Date(s.scheduledDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [schedules, year, month]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/hr/training/schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowSchedule(false);
      setForm({ courseId: '', scheduledDate: '', department: '', trainer: '', location: '' });
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Upcoming sessions list
  const upcoming = schedules
    .filter((s: any) => new Date(s.scheduledDate) >= new Date() && s.status !== 'CANCELLED')
    .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-lg font-black text-white">{MONTHS[month]} {year}</h3>
          <button onClick={() => navigate(1)} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg">
          <Plus className="w-4 h-4" /> Schedule Training
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map(d => (
              <div key={d} className="px-2 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const events = day ? schedulesByDate[day.toString()] ?? [] : [];
              return (
                <div key={i} className={`min-h-[100px] border-b border-r border-white/5 p-2 ${day ? 'hover:bg-white/[0.02] transition-all' : 'bg-white/[0.01]'}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-black inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                        isToday(day) ? 'bg-brand-green text-brand-dark' : 'text-slate-400'
                      }`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {events.map((ev: any) => (
                          <div key={ev.id} className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest truncate ${statusColors[ev.status] ?? statusColors.SCHEDULED}`}>
                            {ev.course?.name ?? 'Training'}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sidebar */}
        <div className="w-72 shrink-0 space-y-4 hidden xl:block">
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming Sessions</p>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-6 text-center">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No upcoming sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {upcoming.map((s: any) => (
                  <div key={s.id} className="p-4 space-y-2">
                    <p className="text-xs font-black text-white">{s.course?.name ?? 'Training'}</p>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(s.scheduledDate).toLocaleDateString()}
                    </div>
                    {s.department && (
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <UserCheck className="w-3 h-3" />
                        {s.department}
                      </div>
                    )}
                    {s.location && (
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {s.location}
                      </div>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${statusColors[s.status] ?? statusColors.SCHEDULED}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Training Modal */}
      {showSchedule && (
        <Modal title="Schedule Training" subtitle="Department-wide training session" onClose={() => setShowSchedule(false)}>
          <form onSubmit={handleSchedule} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Course</label>
              <select required value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                <option value="">Select course</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Scheduled Date</label>
              <input type="date" required value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Department</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Production"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Trainer</label>
                <input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} placeholder="Trainer name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Hall, Block A"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowSchedule(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
