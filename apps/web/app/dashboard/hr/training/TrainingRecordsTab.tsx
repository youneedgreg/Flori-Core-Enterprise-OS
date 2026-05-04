/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Download, Award, X, Loader2, CheckCircle2,
  Upload, FileText, Calendar, User,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { return document.cookie.match(/access_token=([^;]+)/)?.[1] ?? ''; }
function authHdr(): HeadersInit { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }; }

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

interface Props {
  records: any[];
  courses: any[];
  employees: any[];
  onRefresh: () => void;
}

export default function TrainingRecordsTab({ records, courses, employees, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', courseId: '', provider: '', completionDate: '', score: '', expiryDate: '',
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  const filtered = records.filter((r: any) => {
    const text = `${r.employee?.firstName} ${r.employee?.lastName} ${r.course?.name} ${r.provider}`.toLowerCase();
    return !search || text.includes(search.toLowerCase());
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('employeeId', form.employeeId);
      fd.append('courseId', form.courseId);
      fd.append('provider', form.provider);
      fd.append('completionDate', form.completionDate);
      if (form.score) fd.append('score', form.score);
      if (form.expiryDate) fd.append('expiryDate', form.expiryDate);
      if (certFile) fd.append('file', certFile);

      await fetch(`${API}/hr/training/records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      setShowAddModal(false);
      setForm({ employeeId: '', courseId: '', provider: '', completionDate: '', score: '', expiryDate: '' });
      setCertFile(null);
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-brand-green' : s >= 50 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-green/30 transition-colors" />
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Employee</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Course</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Provider</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Score</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center">
                <Award className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No training records found</p>
              </td></tr>
            ) : filtered.map((r: any) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-all group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-green" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{r.employee?.firstName} {r.employee?.lastName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-slate-300">{r.course?.name}</span>
                  <p className="text-[9px] text-slate-600 font-bold mt-0.5 uppercase">{r.course?.category?.replace(/_/g, ' ')}</p>
                </td>
                <td className="px-6 py-5 text-xs font-bold text-slate-400">{r.provider || '—'}</td>
                <td className="px-6 py-5 text-xs font-bold text-slate-400">{new Date(r.completionDate).toLocaleDateString()}</td>
                <td className="px-6 py-5">
                  {r.score != null ? (
                    <span className={`text-sm font-black ${scoreColor(r.score)}`}>{r.score}%</span>
                  ) : <span className="text-xs text-slate-600">—</span>}
                </td>
                <td className="px-6 py-5">
                  {r.certificateUrl ? (
                    <a href={r.certificateUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all w-fit">
                      <Download className="w-3 h-3" /> View
                    </a>
                  ) : <span className="text-[9px] text-slate-600 font-bold uppercase">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <Modal title="Add Training Record" subtitle="Log completed training" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Employee</label>
              <select required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                <option value="">Select employee</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Course</label>
              <select required value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                <option value="">Select course</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Provider</label>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Training provider"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Score (%)</label>
                <input type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} placeholder="0-100"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Completion Date</label>
                <input type="date" required value={form.completionDate} onChange={e => setForm({ ...form, completionDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Certificate Upload</label>
              <label className="flex items-center justify-center gap-3 p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-brand-green/30 transition-all group">
                {certFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-green" />
                    <span className="text-xs font-bold text-brand-green">{certFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600 group-hover:text-brand-green transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-400 transition-colors">Click to upload certificate</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
