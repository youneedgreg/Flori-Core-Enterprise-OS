/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, FileText, AlertCircle, ExternalLink,
  Upload, Trash2, Download, RefreshCw, Search, Filter,
  ChevronRight, FileUp, Bell, X, Users, FlaskConical,
  Clock, Activity, Edit3, CheckCircle2, XCircle, Loader2,
  Calendar, ChevronDown, Beaker, ScrollText,
} from 'lucide-react';
import { toast } from 'sonner';
import { isTokenExpired, logout } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Certification {
  id: string;
  type: string;
  customName?: string;
  issuedBy?: string;
  certNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: string;
  notes?: string;
  daysUntilExpiry: number | null;
  computedStatus: string;
}

interface SprayLog {
  id: string;
  chemicalName: string;
  epaRegNo: string;
  quantity: number;
  unit: string;
  phiDays: number;
  appliedAt: string;
  harvestAllowedAt: string;
  notes?: string;
  zone: { name: string };
  applicator: { email: string };
}

interface LabourLog {
  id: string;
  taskType: string;
  hours: number;
  stemsCut?: number;
  timestamp: string;
  zone: { name: string };
  user: { email: string };
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  actor?: { email: string };
}

interface ComplianceStats {
  activeCerts: number;
  expiringSoon: number;
  expired: number;
  totalCerts: number;
  sprayLogsMonth: number;
  labourHoursMonth: number;
  auditActionsMonth: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CERT_TYPES = [
  { value: 'GLOBAL_GAP', label: 'GlobalG.A.P.' },
  { value: 'FAIRTRADE', label: 'Fairtrade' },
  { value: 'KFC_SILVER', label: 'KFC Silver' },
  { value: 'MPS', label: 'MPS' },
  { value: 'RAINFOREST_ALLIANCE', label: 'Rainforest Alliance' },
  { value: 'OTHER', label: 'Other' },
];

const CERT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:        { label: 'Active',         cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EXPIRING_SOON: { label: 'Expiring Soon',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  EXPIRED:       { label: 'Expired',        cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  PENDING:       { label: 'Pending',        cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700';
const selectCls =
  'w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all appearance-none';

const TABS = [
  { id: 'certifications', label: 'Certifications',  icon: ShieldCheck },
  { id: 'spray',         label: 'Spray Logs',       icon: FlaskConical },
  { id: 'labour',        label: 'Labour Records',   icon: Users },
  { id: 'audit',         label: 'Audit Trail',      icon: ScrollText },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('certifications');
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCert, setEditCert] = useState<Certification | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const getAuthHeader = useCallback((): Record<string, string> | null => {
    const token = document.cookie
      .split('; ')
      .find((r) => r.startsWith('access_token='))
      ?.split('=')[1];
    if (!token || isTokenExpired(token)) { logout(); return null; }
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchStats = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`${API}/compliance/stats`, { headers });
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      toast.error('Failed to load compliance stats');
    } finally {
      setStatsLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => { void fetchStats(); }, [fetchStats, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const KPI_CARDS = [
    {
      label: 'Active Certs',
      value: stats?.activeCerts ?? '—',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Expiring ≤30d',
      value: stats?.expiringSoon ?? '—',
      icon: AlertCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Expired',
      value: stats?.expired ?? '—',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Sprays This Month',
      value: stats?.sprayLogsMonth ?? '—',
      icon: FlaskConical,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Labour Hrs (Month)',
      value: stats?.labourHoursMonth ?? '—',
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Audit Actions (30d)',
      value: stats?.auditActionsMonth ?? '—',
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-0 space-y-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/5 p-7 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <ShieldCheck className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Compliance Vault</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Accreditation · Audit Repository · Traceability
              </p>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest transition-all"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
            {activeTab === 'certifications' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                <Plus className="w-4 h-4" /> Add Certificate
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPI_CARDS.map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-4 flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              {statsLoading ? (
                <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
              ) : (
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 border-b border-white/5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'certifications' && (
          <CertificationsTab
            key={refreshKey}
            apiBase={API}
            getAuthHeader={getAuthHeader}
            onRefresh={refresh}
            onEdit={setEditCert}
          />
        )}
        {activeTab === 'spray' && (
          <SprayLogsTab key={refreshKey} apiBase={API} getAuthHeader={getAuthHeader} />
        )}
        {activeTab === 'labour' && (
          <LabourRecordsTab key={refreshKey} apiBase={API} getAuthHeader={getAuthHeader} />
        )}
        {activeTab === 'audit' && (
          <AuditTrailTab key={refreshKey} apiBase={API} getAuthHeader={getAuthHeader} />
        )}
      </div>

      {/* ── Modals ── */}
      {(showAddModal || editCert) && (
        <CertModal
          cert={editCert ?? undefined}
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onClose={() => { setShowAddModal(false); setEditCert(null); }}
          onSuccess={() => { setShowAddModal(false); setEditCert(null); refresh(); }}
        />
      )}
      {showReportModal && (
        <ReportModal
          apiBase={API}
          getAuthHeader={getAuthHeader}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

// ── Certifications Tab ─────────────────────────────────────────────────────────

function CertificationsTab({
  apiBase,
  getAuthHeader,
  onRefresh,
  onEdit,
}: {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onRefresh: () => void;
  onEdit: (cert: Certification) => void;
}) {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const fetchCerts = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/compliance/certifications`, { headers });
      if (!res.ok) throw new Error();
      setCerts(await res.json());
    } catch {
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader]);

  useEffect(() => { void fetchCerts(); }, [fetchCerts]);

  const deleteCert = async (id: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const res = await fetch(`${apiBase}/compliance/certifications/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error();
      toast.success('Certification deleted');
      void fetchCerts();
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleFileUpload = async (certId: string, file: File) => {
    const headers = getAuthHeader();
    if (!headers) return;
    setUploadingFor(certId);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${apiBase}/compliance/certifications/${certId}/upload`, {
        method: 'POST',
        headers: { Authorization: headers.Authorization },
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast.success('Certificate uploaded');
      void fetchCerts();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  const filtered = certs.filter((c) => {
    const matchSearch =
      !searchTerm ||
      (c.customName ?? c.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.certNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.issuedBy ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.computedStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const alertCerts = certs.filter(
    (c) => c.computedStatus === 'EXPIRED' || c.computedStatus === 'EXPIRING_SOON',
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Main list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certifications…"
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700 w-52"
            />
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PENDING'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  statusFilter === s
                    ? s === 'ALL'
                      ? 'bg-white/10 text-white border-white/20'
                      : CERT_STATUS[s]?.cls ?? 'bg-white/10 text-white border-white/20'
                    : 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All' : CERT_STATUS[s]?.label ?? s}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {filtered.length} cert{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ShieldCheck className="w-14 h-14 text-slate-800" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                {searchTerm || statusFilter !== 'ALL' ? 'No certifications match.' : 'No certifications yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((cert) => {
                const statusInfo = CERT_STATUS[cert.computedStatus];
                return (
                  <div
                    key={cert.id}
                    className={`group relative bg-slate-900/60 border rounded-[2rem] p-6 transition-all duration-300 hover:bg-white/5 ${
                      cert.computedStatus === 'EXPIRED'
                        ? 'border-rose-500/20 shadow-lg shadow-rose-500/5'
                        : cert.computedStatus === 'EXPIRING_SOON'
                          ? 'border-amber-500/20'
                          : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="flex items-center gap-5">
                        <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/5 ${
                          cert.computedStatus === 'EXPIRED' ? 'text-rose-500' :
                          cert.computedStatus === 'EXPIRING_SOON' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            {cert.customName || cert.type.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-2">
                            <span>{cert.certNumber || 'NO CERT #'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>{cert.issuedBy || 'Unspecified Issuer'}</span>
                          </p>
                          {statusInfo && (
                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusInfo.cls}`}>
                              {statusInfo.label}
                              {cert.daysUntilExpiry !== null && cert.computedStatus === 'EXPIRING_SOON' && ` · ${cert.daysUntilExpiry}d`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mb-1">Expiry</p>
                          <p className={`font-black text-sm ${
                            cert.computedStatus === 'EXPIRED' ? 'text-rose-400' :
                            cert.computedStatus === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-white'
                          }`}>
                            {cert.expiryDate
                              ? new Date(cert.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Perpetual'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(cert)}
                            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {cert.fileUrl ? (
                            <a
                              href={cert.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all"
                              title="View file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <label className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all cursor-pointer" title="Upload scan">
                              {uploadingFor === cert.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FileUp className="w-3.5 h-3.5" />
                              )}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(cert.id, e.target.files[0])}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => void deleteCert(cert.id)}
                            className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* progress bar */}
                    <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cert.computedStatus === 'EXPIRED' ? 'w-full bg-rose-500' :
                          cert.computedStatus === 'EXPIRING_SOON' ? 'bg-amber-500 w-3/4' :
                          'w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 flex-shrink-0 border-l border-white/5 overflow-y-auto custom-scrollbar p-6 space-y-5">
        {/* Alerts panel */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden">
          <Bell className="absolute -bottom-3 -right-3 w-20 h-20 text-amber-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-amber-500 font-black tracking-widest text-[10px] uppercase">Compliance Alerts</h3>
            </div>
            <div className="space-y-3">
              {alertCerts.length === 0 ? (
                <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                  All certifications are within valid date ranges.
                </p>
              ) : (
                alertCerts.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className={`w-1 rounded-full flex-shrink-0 ${c.computedStatus === 'EXPIRED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-white font-black text-[10px] uppercase leading-tight">
                        {c.customName || c.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-0.5">
                        {c.computedStatus === 'EXPIRED' ? 'Renewal Overdue' : `Expiring in ${c.daysUntilExpiry}d`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Summary</h3>
          {[
            { label: 'Total', value: certs.length, color: 'text-white' },
            { label: 'Active', value: certs.filter((c) => c.computedStatus === 'ACTIVE').length, color: 'text-emerald-400' },
            { label: 'Expiring Soon', value: certs.filter((c) => c.computedStatus === 'EXPIRING_SOON').length, color: 'text-amber-400' },
            { label: 'Expired', value: certs.filter((c) => c.computedStatus === 'EXPIRED').length, color: 'text-rose-400' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase">{row.label}</span>
              <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Cert types breakdown */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">By Type</h3>
          {CERT_TYPES.map((t) => {
            const count = certs.filter((c) => c.type === t.value).length;
            if (count === 0) return null;
            return (
              <div key={t.value} className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase">{t.label}</span>
                <span className="text-xs font-black text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Spray Logs Tab ─────────────────────────────────────────────────────────────

function SprayLogsTab({
  apiBase,
  getAuthHeader,
}: {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
}) {
  const [logs, setLogs] = useState<SprayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`${apiBase}/compliance/spray-logs?${params}`, { headers });
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error('Failed to load spray logs');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader, dateFrom, dateTo]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.chemicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.applicator.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const now = new Date();
  const phiActive = filtered.filter((l) => new Date(l.harvestAllowedAt) > now).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Chemical, zone, applicator…"
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700 w-52"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <span className="text-slate-600 text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-rose-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-4">
          {phiActive > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{phiActive} PHI active</span>
            </div>
          )}
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{filtered.length} records</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar px-8 py-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FlaskConical className="w-14 h-14 text-slate-800" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No spray logs found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Zone', 'Chemical', 'EPA Reg', 'Qty', 'PHI', 'Harvest Allowed', 'Applicator'].map((h) => (
                  <th key={h} className="pb-3 pr-6 text-[9px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const phiPending = new Date(log.harvestAllowedAt) > now;
                return (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 pr-6 text-xs font-black text-white whitespace-nowrap">
                      {new Date(log.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3 pr-6 text-xs font-black text-cyan-400 whitespace-nowrap">{log.zone.name}</td>
                    <td className="py-3 pr-6 text-xs font-black text-white">{log.chemicalName}</td>
                    <td className="py-3 pr-6 text-[10px] font-black text-slate-500 font-mono">{log.epaRegNo}</td>
                    <td className="py-3 pr-6 text-xs font-black text-white whitespace-nowrap">{log.quantity} {log.unit}</td>
                    <td className="py-3 pr-6">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${phiPending ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                        {log.phiDays}d
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-[10px] font-black whitespace-nowrap">
                      <span className={phiPending ? 'text-amber-400' : 'text-emerald-400'}>
                        {new Date(log.harvestAllowedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </td>
                    <td className="py-3 text-[10px] font-black text-slate-500">{log.applicator.email.split('@')[0]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex-shrink-0 border-t border-white/5 px-8 py-3 flex items-center gap-8">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Total: <span className="text-white">{filtered.length} sprays</span>
          </div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            PHI Active: <span className="text-amber-400">{phiActive}</span>
          </div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Cleared: <span className="text-emerald-400">{filtered.length - phiActive}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Labour Records Tab ─────────────────────────────────────────────────────────

function LabourRecordsTab({
  apiBase,
  getAuthHeader,
}: {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
}) {
  const [logs, setLogs] = useState<LabourLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`${apiBase}/compliance/labour-logs?${params}`, { headers });
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error('Failed to load labour logs');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader, dateFrom, dateTo]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.taskType.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalHours = filtered.reduce((sum, l) => sum + l.hours, 0);
  const totalStems = filtered.reduce((sum, l) => sum + (l.stemsCut ?? 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Worker, zone, task…"
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700 w-52"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <span className="text-slate-600 text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-rose-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="ml-auto text-[10px] font-black text-slate-600 uppercase tracking-widest">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar px-8 py-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-14 h-14 text-slate-800" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No labour records found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Worker', 'Zone', 'Task', 'Hours', 'Stems Cut'].map((h) => (
                  <th key={h} className="pb-3 pr-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-6 text-xs font-black text-white whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-3 pr-6 text-[10px] font-black text-slate-400">{log.user.email.split('@')[0]}</td>
                  <td className="py-3 pr-6 text-xs font-black text-cyan-400">{log.zone.name}</td>
                  <td className="py-3 pr-6 text-[10px] font-black text-slate-300 uppercase">{log.taskType.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-6 text-xs font-black text-emerald-400">{log.hours}h</td>
                  <td className="py-3 text-xs font-black text-white">
                    {log.stemsCut != null ? log.stemsCut.toLocaleString() : <span className="text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex-shrink-0 border-t border-white/5 px-8 py-3 flex items-center gap-8">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Total Hours: <span className="text-emerald-400">{totalHours.toFixed(1)}h</span>
          </div>
          {totalStems > 0 && (
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Total Stems: <span className="text-white">{totalStems.toLocaleString()}</span>
            </div>
          )}
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Records: <span className="text-white">{filtered.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Audit Trail Tab ────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  LOGIN:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PATCH:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function AuditTrailTab({
  apiBase,
  getAuthHeader,
}: {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
}) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`${apiBase}/compliance/audit-logs?${params}`, { headers });
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeader, dateFrom, dateTo]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.actor?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Action, entity, actor…"
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700 w-52"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <span className="text-slate-600 text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-rose-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="ml-auto text-[10px] font-black text-slate-600 uppercase tracking-widest">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto custom-scrollbar px-8 py-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ScrollText className="w-14 h-14 text-slate-800" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No audit events found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID'].map((h) => (
                  <th key={h} className="pb-3 pr-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const actionKey = log.action.split('_')[0];
                const actionCls = ACTION_COLORS[actionKey] ?? 'bg-white/5 text-slate-400 border-white/10';
                return (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-6 text-[10px] font-black text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pr-6 text-[10px] font-black text-slate-400">
                      {log.actor ? log.actor.email.split('@')[0] : <span className="text-slate-700">System</span>}
                    </td>
                    <td className="py-3 pr-6">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${actionCls}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-[10px] font-black text-white uppercase">{log.entityType.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-[9px] font-mono text-slate-600 truncate max-w-[120px]">{log.entityId ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Cert Modal (Add + Edit) ────────────────────────────────────────────────────

function CertModal({
  cert,
  apiBase,
  getAuthHeader,
  onClose,
  onSuccess,
}: {
  cert?: Certification;
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(cert);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type:        cert?.type        ?? 'GLOBAL_GAP',
    customName:  cert?.customName  ?? '',
    issuedBy:    cert?.issuedBy    ?? '',
    certNumber:  cert?.certNumber  ?? '',
    issueDate:   cert?.issueDate   ? cert.issueDate.slice(0, 10) : '',
    expiryDate:  cert?.expiryDate  ? cert.expiryDate.slice(0, 10) : '',
    notes:       cert?.notes       ?? '',
  });

  const set = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const url = isEdit
        ? `${apiBase}/compliance/certifications/${cert!.id}`
        : `${apiBase}/compliance/certifications`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? 'Certification updated' : 'Certification added');
      onSuccess();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} certification`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="w-full max-w-xl bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-2xl">
        <div className="p-7 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
              {isEdit ? `Edit: ${cert?.customName || cert?.type}` : 'Add Certification'}
            </h2>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Compliance Vault</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certification Type</label>
              <select value={formData.type} onChange={(e) => set('type', e.target.value)} className={selectCls}>
                {CERT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-950">{t.label}</option>
                ))}
              </select>
            </div>

            {formData.type === 'OTHER' && (
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Name *</label>
                <input required value={formData.customName} onChange={(e) => set('customName', e.target.value)} placeholder="e.g. ISO 9001" className={inputCls} />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issuer</label>
              <input value={formData.issuedBy} onChange={(e) => set('issuedBy', e.target.value)} placeholder="e.g. KEBS / Bureau Veritas" className={inputCls} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cert Number</label>
              <input value={formData.certNumber} onChange={(e) => set('certNumber', e.target.value)} placeholder="e.g. G-GAP-00123" className={inputCls} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Date</label>
              <input type="date" value={formData.issueDate} onChange={(e) => set('issueDate', e.target.value)} className={inputCls} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</label>
              <input type="date" value={formData.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={inputCls} />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
              <textarea rows={2} value={formData.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes…" className={`${inputCls} resize-none`} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.25)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Save & Protect'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Report Export Modal ────────────────────────────────────────────────────────

function ReportModal({
  apiBase,
  getAuthHeader,
  onClose,
}: {
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  onClose: () => void;
}) {
  const [reportType, setReportType] = useState<'FULL_COMPLIANCE' | 'SPRAY_LOG' | 'LABOUR'>('FULL_COMPLIANCE');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`${apiBase}/compliance/audit-report?${params}`, { headers });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Audit_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
      onClose();
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const REPORT_TYPES = [
    { value: 'FULL_COMPLIANCE', label: 'Full Compliance', icon: ShieldCheck, description: 'Certifications + spray log + labour records' },
    { value: 'SPRAY_LOG',       label: 'Spray History',   icon: FlaskConical, description: 'Chemical application records for auditors' },
    { value: 'LABOUR',          label: 'Labour Audit',    icon: Users,        description: 'Worker hours and tasks by zone' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-2xl">
        <div className="p-7 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Export Audit Report</h2>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">PDF · Stored in audit trail S3</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 space-y-6">
          {/* Report type selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Report Type</label>
            <div className="space-y-2">
              {REPORT_TYPES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReportType(r.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    reportType === r.value
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${reportType === r.value ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <r.icon className={`w-4 h-4 ${reportType === r.value ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase ${reportType === r.value ? 'text-emerald-400' : 'text-white'}`}>{r.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{r.description}</p>
                  </div>
                  {reportType === r.value && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date Range (optional)</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="From"
              />
              <span className="text-slate-600 text-sm">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="To"
              />
            </div>
          </div>

          <button
            onClick={() => void handleGenerate()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.25)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Generate & Download
          </button>
        </div>
      </div>
    </div>
  );
}
