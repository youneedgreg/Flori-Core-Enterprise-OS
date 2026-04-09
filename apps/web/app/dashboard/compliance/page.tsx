/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Plus, FileText, Calendar, AlertCircle, 
  ExternalLink, Upload, Trash2, Download, RefreshCw,
  Search, Filter, ChevronRight, FileUp, Bell, X, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { decodeJWT, logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Certification {
  id: string;
  type: string;
  customName?: string;
  issuedBy?: string;
  certNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING';
  daysUntilExpiry: number | null;
  computedStatus: string;
}

const CERT_TYPES = [
  { value: 'GLOBAL_GAP', label: 'GlobalG.A.P.' },
  { value: 'FAIRTRADE', label: 'Fairtrade' },
  { value: 'KFC_SILVER', label: 'KFC Silver' },
  { value: 'MPS', label: 'MPS' },
  { value: 'RAINFOREST_ALLIANCE', label: 'Rainforest Alliance' },
  { value: 'OTHER', label: 'Other' },
];

export default function CompliancePage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const getAuthHeader = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchCerts = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const res = await fetch(`${API}/compliance/certifications`, { headers });
      if (!res.ok) throw new Error();
      setCerts(await res.json());
    } catch {
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const handleGenerateReport = async (type: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    setGeneratingReport(true);
    try {
      const res = await fetch(`${API}/compliance/audit-report?type=${type}`, { headers });
      if (!res.ok) throw new Error();
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Audit_Report_${type}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Report generated successfully');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleFileUpload = async (certId: string, file: File) => {
    const headers = getAuthHeader();
    if (!headers) return;
    
    setUploadingFor(certId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/compliance/certifications/${certId}/upload`, {
        method: 'POST',
        headers: { Authorization: headers.Authorization }, 
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast.success('Certificate uploaded successfully');
      fetchCerts();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  const deleteCert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification record?')) return;
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const res = await fetch(`${API}/compliance/certifications/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error();
      toast.success('Deleted');
      fetchCerts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <ShieldCheck className="w-32 h-32 text-emerald-500" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Compliance Vault</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <span className="w-12 h-[1px] bg-slate-800" /> Accreditation & Audit Repository
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button 
            disabled={generatingReport}
            onClick={() => handleGenerateReport('FULL_COMPLIANCE')}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest transition-all glass-effect disabled:opacity-50"
          >
            {generatingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Audit Report
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Certificate
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Accreditations</h3>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {certs.filter(c => c.computedStatus === 'ACTIVE').length} Active
            </span>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-[2rem] border border-white/5">
                <RefreshCw className="w-10 h-10 text-emerald-500/50 animate-spin" />
                <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Hydrating Repository...</p>
             </div>
          ) : certs.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-white/5">
              <ShieldCheck className="w-16 h-16 text-slate-800 mx-auto mb-6" />
              <p className="text-slate-500 font-black text-xs uppercase tracking-widest italic">No certifications found.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-6 text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:text-emerald-400 transition-colors"
              >
                Get Started →
              </button>
            </div>
          ) : (
            certs.map((cert) => (
              <div 
                key={cert.id}
                className={`group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-[2rem] p-6 lg:p-8 transition-all duration-500 ${
                  cert.computedStatus === 'EXPIRED' ? 'border-rose-500/20 shadow-lg shadow-rose-500/5' : 
                  cert.computedStatus === 'EXPIRING_SOON' ? 'border-amber-500/20' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors group-hover:bg-white/10 ${
                      cert.computedStatus === 'EXPIRED' ? 'text-rose-500' :
                      cert.computedStatus === 'EXPIRING_SOON' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight uppercase italic">
                        {cert.customName || cert.type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        {cert.certNumber || 'NO CERTI NUMBER'} <span className="w-1 h-1 rounded-full bg-slate-800" /> {cert.issuedBy || 'UNSPECIFIED ISSUER'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Expires</p>
                      <p className={`font-black tracking-tighter ${
                        cert.computedStatus === 'EXPIRED' ? 'text-rose-500' :
                        cert.computedStatus === 'EXPIRING_SOON' ? 'text-amber-500 outline-none ring-1 ring-amber-500/20 px-2 rounded-lg' :
                        'text-white'
                      }`}>
                        {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'PERPETUAL'}
                      </p>
                      {cert.daysUntilExpiry !== null && cert.computedStatus !== 'EXPIRED' && (
                         <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                            {cert.daysUntilExpiry} days left
                         </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {cert.fileUrl ? (
                        <a 
                          href={cert.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(cert.id, e.target.files[0])}
                            disabled={uploadingFor === cert.id}
                          />
                          <button 
                            className={`p-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-emerald-500 rounded-xl transition-all ${uploadingFor === cert.id ? 'animate-pulse' : ''}`}
                            title="Upload Certificate Scan"
                          >
                            <FileUp className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => deleteCert(cert.id)}
                        className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-0 left-8 right-8 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      cert.computedStatus === 'EXPIRED' ? 'w-full bg-rose-500' :
                      cert.computedStatus === 'EXPIRING_SOON' ? 'w-[75%] bg-amber-500' :
                      'w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    }`} 
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Alerts & Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 via-brand-dark/5 to-transparent p-8 rounded-[2rem] border border-amber-500/20 relative overflow-hidden group">
            <Bell className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-amber-500 font-black tracking-widest text-[10px] uppercase">Compliance Alerts</h3>
              </div>
              
              <div className="space-y-4">
                {certs.filter(c => c.computedStatus === 'EXPIRED' || c.computedStatus === 'EXPIRING_SOON').length === 0 ? (
                  <p className="text-slate-500 text-xs font-bold leading-relaxed">
                    No urgent actions required. All certifications are within valid date ranges.
                  </p>
                ) : (
                  certs.filter(c => c.computedStatus === 'EXPIRED' || c.computedStatus === 'EXPIRING_SOON').map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${c.computedStatus === 'EXPIRED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="text-white font-black text-[10px] uppercase italic leading-none mb-1">
                          {c.customName || c.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">
                          {c.computedStatus === 'EXPIRED' ? 'RENEWAL OVERDUE' : `EXPIRING IN ${c.daysUntilExpiry} DAYS`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
            <h3 className="text-white font-black tracking-widest text-[10px] uppercase mb-4">Export Records</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleGenerateReport('SPRAY_LOG')}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Spray History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-all" />
              </button>
              <button 
                onClick={() => handleGenerateReport('LABOUR')}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Labour Audit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
              * Reports generated are stored in the audit trail S3 bucket for regulatory traceability.
            </p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCertModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchCerts(); }} 
          getAuthHeader={getAuthHeader}
        />
      )}
    </div>
  );
}

function AddCertModal({ onClose, onSuccess, getAuthHeader }: { onClose: () => void, onSuccess: () => void, getAuthHeader: () => any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'GLOBAL_GAP',
    customName: '',
    issuedBy: '',
    certNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/compliance/certifications`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success('Certification added');
      onSuccess();
    } catch {
      toast.error('Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-xl">
      <div className="w-full max-w-xl bg-brand-dark border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">New Certification</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certification Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
              >
                {CERT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-brand-dark text-white">{t.label}</option>)}
              </select>
            </div>

            {formData.type === 'OTHER' && (
               <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Name</label>
                <input 
                  type="text"
                  required
                  value={formData.customName}
                  onChange={e => setFormData({ ...formData, customName: e.target.value })}
                  placeholder="e.g. ISO 9001"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issuer</label>
              <input 
                type="text"
                value={formData.issuedBy}
                onChange={e => setFormData({ ...formData, issuedBy: e.target.value })}
                placeholder="e.g. KEBS / Bureau Veritas"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cert Number</label>
              <input 
                type="text"
                value={formData.certNumber}
                onChange={e => setFormData({ ...formData, certNumber: e.target.value })}
                placeholder="e.g. G-GAP-00123"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Date</label>
              <input 
                type="date"
                value={formData.issueDate}
                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</label>
              <input 
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Save & Protect
          </button>
        </form>
      </div>
    </div>
  );
}
