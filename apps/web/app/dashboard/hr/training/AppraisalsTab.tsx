/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Star, User, Users, Eye, ChevronDown, ChevronUp,
  Plus, X, Loader2, CheckCircle2, MessageSquare, Target,
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

function ScoreBar({ label, score, max = 10 }: { label: string; score: number | null; max?: number }) {
  const pct = score != null ? (score / max) * 100 : 0;
  const color = pct >= 70 ? 'bg-brand-green' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-black text-white">{score != null ? score.toFixed(1) : '—'}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface Props {
  appraisals: any[];
  employees: any[];
  onRefresh: () => void;
}

export default function AppraisalsTab({ appraisals, employees, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ employeeId: '', period: '' });
  const [reviewForm, setReviewForm] = useState({ type: 'SELF' as 'SELF' | 'PEER' | 'SUPERVISOR', scores: { productivity: 5, quality: 5, teamwork: 5, initiative: 5, overall: 5 }, comments: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/hr/appraisals/${createForm.employeeId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: createForm.period }),
      });
      setShowCreate(false);
      setCreateForm({ employeeId: '', period: '' });
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReview) return;
    setSaving(true);
    try {
      await fetch(`${API}/hr/appraisals/${showReview.id}/review`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      setShowReview(null);
      setReviewForm({ type: 'SELF', scores: { productivity: 5, quality: 5, teamwork: 5, initiative: 5, overall: 5 }, comments: '' });
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      COMPLETED: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    };
    return map[s] ?? map.DRAFT;
  };

  const currentPeriod = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">360° Performance Reviews</p>
          <p className="text-[9px] text-slate-600 mt-0.5">Self (10%) · Peer (30%) · Supervisor (60%)</p>
        </div>
        <button onClick={() => { setCreateForm({ ...createForm, period: currentPeriod }); setShowCreate(true); }}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg">
          <Plus className="w-4 h-4" /> New Appraisal
        </button>
      </div>

      {/* Appraisals List */}
      <div className="space-y-3">
        {appraisals.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-12 text-center">
            <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No appraisals yet</p>
            <p className="text-[9px] text-slate-700 mt-1">Create a new appraisal to start the 360° review process</p>
          </div>
        ) : appraisals.map((a: any) => (
          <div key={a.id} className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10">
            {/* Row header */}
            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              className="w-full flex items-center justify-between p-6 text-left group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-brand-green transition-colors">
                    {a.employee?.firstName} {a.employee?.lastName}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                    {a.employee?.department || a.employee?.jobTitle || '—'} · Period: {a.period}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.finalScore != null && (
                  <div className="text-right mr-2">
                    <p className="text-lg font-black text-brand-green">{a.finalScore.toFixed(1)}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Final</p>
                  </div>
                )}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${statusBadge(a.status)}`}>
                  {a.status.replace(/_/g, ' ')}
                </span>
                {expanded === a.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === a.id && (
              <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreBar label="Self Score" score={a.selfScore} />
                  <ScoreBar label="Peer Score" score={a.peerScore} />
                  <ScoreBar label="Supervisor Score" score={a.supervisorScore} />
                  <ScoreBar label="KPI Score" score={a.kpiScore} />
                </div>

                {/* Reviews */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reviews ({a.reviews?.length ?? 0})</p>
                  {(a.reviews ?? []).length === 0 ? (
                    <p className="text-[9px] text-slate-600 py-2">No reviews submitted yet</p>
                  ) : (a.reviews ?? []).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        r.type === 'SELF' ? 'bg-blue-500/10 border-blue-500/20' :
                        r.type === 'PEER' ? 'bg-purple-500/10 border-purple-500/20' :
                        'bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {r.type === 'SELF' ? <User className="w-3.5 h-3.5 text-blue-400" /> :
                         r.type === 'PEER' ? <Users className="w-3.5 h-3.5 text-purple-400" /> :
                         <Eye className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase">{r.type} Review</p>
                        {r.comments && <p className="text-[9px] text-slate-500 mt-0.5 truncate">{r.comments}</p>}
                      </div>
                      <span className="text-sm font-black text-brand-green">{(r.scores as any)?.overall ?? '—'}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setShowReview(a); setReviewForm({ type: 'SELF', scores: { productivity: 5, quality: 5, teamwork: 5, initiative: 5, overall: 5 }, comments: '' }); }}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Submit Review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Appraisal Modal */}
      {showCreate && (
        <Modal title="New Appraisal" subtitle="Start a 360° performance review" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Employee</label>
              <select required value={createForm.employeeId} onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer">
                <option value="">Select employee</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Period (YYYY-MM)</label>
              <input type="month" required value={createForm.period} onChange={e => setCreateForm({ ...createForm, period: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30" />
            </div>
            <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-brand-green" />
                <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">KPI Auto-Link</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                KPI scores will be automatically calculated from farm productivity data (stems/hr, rejection rate, attendance) for the selected period.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit Review Modal */}
      {showReview && (
        <Modal title="Submit Review" subtitle={`${showReview.employee?.firstName} ${showReview.employee?.lastName} — ${showReview.period}`} onClose={() => setShowReview(null)}>
          <form onSubmit={handleSubmitReview} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Review Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['SELF', 'PEER', 'SUPERVISOR'] as const).map(t => (
                  <button type="button" key={t} onClick={() => setReviewForm({ ...reviewForm, type: t })}
                    className={`py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all ${
                      reviewForm.type === t ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            {(['productivity', 'quality', 'teamwork', 'initiative', 'overall'] as const).map(field => (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{field}</label>
                  <span className="text-xs font-black text-brand-green">{reviewForm.scores[field]}/10</span>
                </div>
                <input type="range" min="1" max="10" value={reviewForm.scores[field]}
                  onChange={e => setReviewForm({ ...reviewForm, scores: { ...reviewForm.scores, [field]: parseInt(e.target.value) } })}
                  className="w-full accent-brand-green" />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Comments</label>
              <textarea value={reviewForm.comments} onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })} rows={3} placeholder="Optional feedback..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 resize-none" />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowReview(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit Review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
