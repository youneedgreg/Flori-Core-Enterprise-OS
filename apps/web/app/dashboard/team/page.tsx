/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  BadgeAlert,
  IdCard,
  Phone,
  History,
  Briefcase,
  ExternalLink,
  Upload,
  Calendar,
  Contact2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  nationalId: string | null;
  taxPin: string | null;
  nssfNumber: string | null;
  nhifNumber: string | null;
  contractUrl: string | null;
  workPermitExpiry: string | null;
  healthCertExpiry: string | null;
  isActive: boolean;
  joinedAt: string;
  documents: any[];
  emergencyContacts: any[];
  employmentHistory: any[];
}

interface Role {
  id: string;
  name: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ 
    email: '', 
    roleId: '',
    firstName: '',
    lastName: '',
    jobTitle: ''
  });
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [empRes, rolesRes, alertsRes] = await Promise.all([
        fetch(`${API}/hr/employees`, { headers }),
        fetch(`${API}/team/roles`, { headers }),
        fetch(`${API}/hr/alerts/expiring-docs?days=30`, { headers })
      ]);

      if (empRes.status === 401) {
        logout();
        return;
      }

      if (empRes.ok) setEmployees(await empRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setExpiringCount(alerts.length);
      }
    } catch (error) {
      console.error('Failed to fetch HR data:', error);
      toast.error('Failed to load workforce data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenProfile = async (id: string) => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/hr/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedEmployee(await res.json());
        setShowProfileModal(true);
      }
    } catch (e) {
      toast.error('Failed to load employee profile');
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      
      const res = await fetch(`${API}/onboarding/invite-team`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify([inviteData])
      });

      if (res.ok) {
        toast.success('Member onboarded and invitation sent');
        setShowInviteModal(false);
        setInviteData({ email: '', roleId: '', firstName: '', lastName: '', jobTitle: '' });
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Onboarding failed');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsUpdating(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/hr/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(selectedEmployee)
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        fetchData();
        setShowProfileModal(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmployee) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('documentNumber', 'AUTO-' + Date.now());
    formData.append('expiryDate', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()); // Default 1 year

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/hr/employees/${selectedEmployee.id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast.success('Document uploaded');
        handleOpenProfile(selectedEmployee.id); // Refresh profile
      } else {
        throw new Error('Upload failed');
      }
    } catch (e) {
      toast.error('Could not upload document');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-green/10 rounded-2xl border border-brand-green/20">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workforce Size</p>
          </div>
          <p className="text-4xl font-black text-white">{employees.length}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              <BadgeAlert className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiring Docs</p>
          </div>
          <p className="text-4xl font-black text-white">{expiringCount}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg tenure</p>
          </div>
          <p className="text-4xl font-black text-white">2.4y</p>
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-4">
            HR Hub
            <Badge variant="outline" className="text-brand-green border-brand-green/30 px-3 font-black">ACTIVE</Badge>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Full lifecycle management for your talent and statutory compliance.</p>
        </div>

        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Onboard Employee
        </button>
      </header>

      {/* Members List */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Employee</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dept / Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Statutory Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 animate-pulse tracking-widest uppercase">LOADING RECORDS...</p>
                </td>
              </tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-white/2 transition-colors group cursor-pointer" onClick={() => handleOpenProfile(emp.id)}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 font-black text-brand-green group-hover:border-brand-green/30 transition-colors uppercase">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white group-hover:text-brand-green transition-colors">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Ref: {emp.employeeNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-wider">{emp.department || 'GENERAL'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.jobTitle || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className={`text-[9px] font-black ${emp.nationalId ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500'}`}>
                      KRA {emp.taxPin ? '✓' : '✗'}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] font-black bg-blue-500/10 text-blue-400 border-blue-500/20">
                      NSSF {emp.nssfNumber ? '✓' : '✗'}
                    </Badge>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Digital File Modal */}
      {showProfileModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 backdrop-blur-xl bg-brand-dark/40 overflow-y-auto">
          <div className="bg-brand-dark/95 border border-white/10 w-full max-w-5xl rounded-[3rem] shadow-2xl relative flex flex-col min-h-[80vh] animate-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <header className="p-8 border-b border-white/5 flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 rounded-3xl bg-brand-green flex items-center justify-center shadow-2xl">
                  <p className="text-3xl font-black text-brand-dark">{selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}</p>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mt-1">{selectedEmployee.jobTitle} • {selectedEmployee.employeeNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </header>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
                  <TabsTrigger value="profile" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><IdCard className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
                  <TabsTrigger value="employment" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><History className="w-4 h-4 mr-2" /> History</TabsTrigger>
                  <TabsTrigger value="documents" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><FileText className="w-4 h-4 mr-2" /> Documents</TabsTrigger>
                  <TabsTrigger value="emergency" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><Phone className="w-4 h-4 mr-2" /> Emergency</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in duration-300">
                  <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Personal Identification
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">National ID</label>
                          <input 
                            value={selectedEmployee.nationalId || ''} 
                            onChange={(e) => setSelectedEmployee({...selectedEmployee, nationalId: e.target.value})}
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KRA PIN</label>
                            <input 
                              value={selectedEmployee.taxPin || ''}
                              onChange={(e) => setSelectedEmployee({...selectedEmployee, taxPin: e.target.value})}
                              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NSSF Number</label>
                            <input 
                              value={selectedEmployee.nssfNumber || ''}
                              onChange={(e) => setSelectedEmployee({...selectedEmployee, nssfNumber: e.target.value})}
                              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                        <Contact2 className="w-4 h-4" /> Contact & Bank
                      </h3>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NHIF Number</label>
                        <input 
                          value={selectedEmployee.nhifNumber || ''}
                          onChange={(e) => setSelectedEmployee({...selectedEmployee, nhifNumber: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">M-Pesa Phone</label>
                        <input 
                          defaultValue={selectedEmployee.phone || ''}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-8">
                       <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="w-full py-5 bg-brand-green text-brand-dark rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-400 transition-all flex justify-center items-center gap-3"
                       >
                         {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                         Save Digital Profile
                       </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="employment" className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Joined Farm</p>
                      <p className="text-lg font-black text-white">{new Date(selectedEmployee.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Work Permit</p>
                      <p className={`text-lg font-black ${selectedEmployee.workPermitExpiry ? 'text-white' : 'text-slate-600'}`}>
                        {selectedEmployee.workPermitExpiry ? new Date(selectedEmployee.workPermitExpiry).toLocaleDateString() : 'NOT FILED'}
                      </p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-lg font-black text-brand-green uppercase tracking-widest">PERMANENT</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <History className="w-4 h-4 text-brand-green" /> Career Timeline
                    </h3>
                    <div className="relative border-l-2 border-white/10 pl-8 space-y-12 py-4 ml-3">
                      {selectedEmployee.employmentHistory.length > 0 ? selectedEmployee.employmentHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-brand-green border-4 border-brand-dark shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(h.startDate).getFullYear()} - {h.endDate ? new Date(h.endDate).getFullYear() : 'Present'}</p>
                          <h4 className="text-lg font-black text-white leading-tight">{h.jobTitle}</h4>
                          <p className="text-sm font-bold text-slate-400 mt-1">{h.companyName}</p>
                          <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-xl">{h.responsibilities}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center bg-white/2 rounded-3xl border border-dashed border-white/10">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No history recorded for this employee.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contract Box */}
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="p-4 bg-blue-500/20 rounded-2xl">
                          <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">Employment Contract</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">PDF DOCUMENT • S3 STORAGE</p>
                        </div>
                      </div>
                      <label className="cursor-pointer p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'CONTRACT')} />
                      </label>
                    </div>

                    {/* Work Permit Box */}
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="p-4 bg-emerald-500/20 rounded-2xl">
                          <BadgeAlert className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">Work Permit / Health Cert</p>
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {selectedEmployee.workPermitExpiry ? `Expires ${new Date(selectedEmployee.workPermitExpiry).toLocaleDateString()}` : 'EXPIRY UNKNOWN'}
                          </p>
                        </div>
                      </div>
                      <label className="cursor-pointer p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'WORK_PERMIT')} />
                      </label>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
                    <div className="p-6 bg-white/5 border-b border-white/5">
                       <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                         <Mail className="w-4 h-4" /> RECENT UPLOADS & AUDIT TRAIL
                       </h4>
                    </div>
                    <div className="px-8 py-4 divide-y divide-white/5">
                      {selectedEmployee.documents.map((doc, i) => (
                        <div key={i} className="py-4 flex items-center justify-between">
                          <div className="flex gap-4 items-center">
                             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-brand-green uppercase tracking-tighter">PDF</div>
                             <div>
                               <p className="text-xs font-bold text-white uppercase tracking-wider">{doc.type.replace(/_/g, ' ')}</p>
                               <p className="text-[9px] font-black text-slate-600 uppercase mt-0.5">Reference: {doc.documentNumber}</p>
                             </div>
                          </div>
                          <Link href={doc.fileUrl} target="_blank" className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white" rel="noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="emergency" className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedEmployee.emergencyContacts.length > 0 ? selectedEmployee.emergencyContacts.map((contact, i) => (
                      <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6">
                           <Badge variant="outline" className="text-brand-green border-brand-green/20 font-black uppercase text-[9px]">{contact.relationship}</Badge>
                        </div>
                        <div className="flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand-green transition-all duration-500">
                            <Phone className="w-6 h-6 text-slate-400 group-hover:text-brand-dark" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white">{contact.name}</h4>
                             <p className="text-brand-green font-bold text-sm mt-1">{contact.phone}</p>
                             {contact.email && <p className="text-slate-500 font-bold text-xs mt-0.5">{contact.email}</p>}
                          </div>
                        </div>
                        {/* Interactive glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )) : (
                      <div className="md:col-span-2 p-12 text-center bg-white/2 rounded-[2rem] border border-dashed border-white/10">
                        <Contact2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No emergency contacts filed for this member.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <footer className="p-8 border-t border-white/5 bg-white/2 rounded-b-[3rem] flex justify-between items-center">
               <div className="flex gap-4">
                 <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-dark bg-slate-800" />)}
                 </div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                    Shared with Compliance & Mgmt
                 </p>
               </div>
               <button onClick={() => setShowProfileModal(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all">
                 Close file
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* Invite Modal (Existing) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/60">
          <div className="bg-brand-dark/80 backdrop-blur-3xl w-full max-w-md p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 tracking-tight">
              <UserPlus className="w-6 h-6 text-brand-green" />
              Onboard Member
            </h2>
            
            <form onSubmit={handleOnboard} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">First Name</label>
                  <input 
                    type="text" 
                    required 
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData({...inviteData, firstName: e.target.value})}
                    placeholder="Jane" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData({...inviteData, lastName: e.target.value})}
                    placeholder="Doe" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="email" 
                    required 
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder="teammate@example.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Assigned Role</label>
                  <select 
                    required
                    value={inviteData.roleId}
                    onChange={(e) => setInviteData({...inviteData, roleId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white appearance-none uppercase font-black tracking-wider cursor-pointer"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Job Title</label>
                  <input 
                    type="text" 
                    value={inviteData.jobTitle}
                    onChange={(e) => setInviteData({...inviteData, jobTitle: e.target.value})}
                    placeholder="Operations Lead" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white font-bold" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isInviting}
                  className="flex-1 py-4 bg-brand-green text-slate-950 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Start Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
