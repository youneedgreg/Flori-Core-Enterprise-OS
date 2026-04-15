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
  Contact2,
  GraduationCap,
  BarChart3,
  Award,
  CheckCircle,
  FileBadge
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
  employmentType: 'PERMANENT' | 'CONTRACT' | 'CASUAL';
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'SUSPENDED' | 'ON_LEAVE';
  biometricId: string | null;
  isActive: boolean;
  joinedAt: string;
  documents: any[];
  emergencyContacts: any[];
  employmentHistory: any[];
  attendanceLogs: any[];
  leaveRequests: any[];
  shiftAssignments: any[];
  trainingRecords: any[];
  appraisals: any[];
  kpis?: any;
}

interface TrainingCourse {
  id: string;
  name: string;
  category: string;
  isMandatory: boolean;
}

interface Appraisal {
  id: string;
  period: string;
  status: string;
  finalScore: number | null;
  kpiScore: number | null;
  reviews: any[];
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
    jobTitle: '',
    employmentType: 'PERMANENT'
  });
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);
  const [shifts, setShifts] = useState<any[]>([]);
  const [allShiftAssignments, setAllShiftAssignments] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [trainingSchedule, setTrainingSchedule] = useState<any[]>([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    type: 'SELF' as 'SELF' | 'PEER' | 'SUPERVISOR',
    scores: { overall: 5 },
    comments: ''
  });

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
      
      const [empRes, rolesRes, alertsRes, shiftsRes, assignmentsRes] = await Promise.all([
        fetch(`${API}/hr/employees`, { headers }),
        fetch(`${API}/hr/roles`, { headers }),
        fetch(`${API}/hr/alerts/expiring-docs`, { headers }),
        fetch(`${API}/hr/shifts`, { headers }),
        fetch(`${API}/hr/shifts/assignments`, { headers }),
      ]);
      
      if (empRes.ok) setEmployees(await empRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setExpiringCount(alerts.length);
      }
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
      if (assignmentsRes.ok) setAllShiftAssignments(await assignmentsRes.json());

      // Fetch Training Courses
      const coursesRes = await fetch(`${API}/hr/training/courses`, { headers });
      if (coursesRes.ok) setTrainingCourses(await coursesRes.json());

      // Fetch Training Schedule
      const scheduleRes = await fetch(`${API}/hr/training/schedule`, { headers });
      if (scheduleRes.ok) setTrainingSchedule(await scheduleRes.json());
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
        const data = await res.json();
        setSelectedEmployee(data);

        // Fetch KPIs for the current month
        const period = new Date().toISOString().slice(0, 7);
        const kpiRes = await fetch(`${API}/hr/kpis/${id}?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (kpiRes.ok) setKpiData(await kpiRes.json());

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
        setInviteData({ email: '', roleId: '', firstName: '', lastName: '', jobTitle: '', employmentType: 'PERMANENT' });
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

  const handleAddEmergencyContact = () => {
    if (!selectedEmployee) return;
    const newContact = { 
      name: '', 
      relationship: '', 
      phone: '', 
      email: '', 
      isPrimary: selectedEmployee.emergencyContacts.length === 0 
    };
    setSelectedEmployee({
      ...selectedEmployee,
      emergencyContacts: [...selectedEmployee.emergencyContacts, newContact]
    });
  };

  const handleUpdateEmergencyContact = (index: number, field: string, value: any) => {
    if (!selectedEmployee) return;
    const contacts = [...selectedEmployee.emergencyContacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setSelectedEmployee({ ...selectedEmployee, emergencyContacts: contacts });
  };

  const handleRemoveEmergencyContact = (index: number) => {
    if (!selectedEmployee) return;
    const contacts = selectedEmployee.emergencyContacts.filter((_, i) => i !== index);
    setSelectedEmployee({ ...selectedEmployee, emergencyContacts: contacts });
  };

  const handleApplyLeave = async () => {
    if (!selectedEmployee) return;
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API}/hr/leaves`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...leaveForm,
          employeeId: selectedEmployee.id
        })
      });

      if (res.ok) {
        toast.success('Leave application submitted');
        setLeaveForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
        handleOpenProfile(selectedEmployee.id); // Refresh profile
      }
    } catch (error) {
      toast.error('Failed to submit leave application');
    }
  };

  const handleUpdateLeaveStatus = async (requestId: string, status: string) => {
    if (!selectedEmployee) return;
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/hr/leaves/${requestId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Leave ${status.toLowerCase()} successfully`);
        handleOpenProfile(selectedEmployee.id);
      }
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const handleAssignShift = async (employeeId: string, shiftId: string, date: string) => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      const res = await fetch(`${API}/hr/shifts/assign`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId, shiftId, date })
      });

      if (res.ok) {
        toast.success('Shift assigned successfully');
        fetchData(); // Refresh all assignments
      }
    } catch (error) {
      toast.error('Failed to assign shift');
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
                    <Badge variant="outline" className={`text-[9px] font-black ${emp.status === 'ACTIVE' ? 'border-emerald-500/50 text-emerald-500' : 'border-rose-500/50 text-rose-500'}`}>
                      {emp.status}
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
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-xl bg-brand-dark/40 py-8 md:py-16 px-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-brand-dark/95 border border-white/10 w-full max-w-5xl rounded-[3rem] shadow-2xl relative flex flex-col min-h-[80vh] animate-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <header className="p-8 border-b border-white/5 flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 rounded-3xl bg-brand-green flex items-center justify-center shadow-2xl">
                  <p className="text-3xl font-black text-brand-dark">{selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}</p>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mt-1">
                    {selectedEmployee.jobTitle} • {selectedEmployee.employeeNumber}
                    {selectedEmployee.email && <span className="text-brand-green ml-2"> • {selectedEmployee.email}</span>}
                  </p>
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
                  <TabsTrigger value="attendance" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><Clock className="w-4 h-4 mr-2" /> Attendance</TabsTrigger>
                  <TabsTrigger value="leave" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><Briefcase className="w-4 h-4 mr-2" /> Leave</TabsTrigger>
                  <TabsTrigger value="shifts" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><Calendar className="w-4 h-4 mr-2" /> Shifts</TabsTrigger>
                  <TabsTrigger value="training" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><GraduationCap className="w-4 h-4 mr-2" /> Training</TabsTrigger>
                  <TabsTrigger value="appraisals" className="rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark"><BarChart3 className="w-4 h-4 mr-2" /> Performance</TabsTrigger>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SHA Number</label>
                        <input 
                          value={selectedEmployee.nhifNumber || ''}
                          onChange={(e) => setSelectedEmployee({...selectedEmployee, nhifNumber: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                        <input 
                          value={selectedEmployee.email || ''}
                          onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">M-Pesa Phone</label>
                        <input 
                          value={selectedEmployee.phone || ''}
                          onChange={(e) => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Biometric / Integration ID</label>
                        <input 
                          value={selectedEmployee.biometricId || ''}
                          onChange={(e) => setSelectedEmployee({...selectedEmployee, biometricId: e.target.value})}
                          placeholder="e.g. BIO-01 or PIN"
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-brand-green focus:outline-none focus:border-brand-green/30"
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
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employment Basis</p>
                      <select 
                        value={selectedEmployee.employmentType}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, employmentType: e.target.value as any})}
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-brand-green uppercase focus:outline-none focus:border-brand-green/50 appearance-none cursor-pointer"
                      >
                        <option value="PERMANENT">PERMANENT</option>
                        <option value="CONTRACT">CONTRACT</option>
                        <option value="CASUAL">CASUAL</option>
                      </select>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Status</p>
                      <select 
                        value={selectedEmployee.status}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, status: e.target.value as any})}
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-brand-green uppercase focus:outline-none focus:border-brand-green/50 appearance-none cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="TERMINATED">TERMINATED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="px-8 py-4 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-green hover:text-brand-dark transition-all flex items-center gap-2"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Update Employment Info
                    </button>
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
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xs font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                         <Phone className="w-4 h-4" /> Personnel Emergency contacts
                       </h3>
                       <button 
                        type="button"
                        onClick={handleAddEmergencyContact}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all flex items-center gap-2"
                       >
                         <UserPlus className="w-4 h-4" /> Add Contact
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {selectedEmployee.emergencyContacts.length > 0 ? selectedEmployee.emergencyContacts.map((contact, i) => (
                        <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group space-y-6">
                          <button 
                            type="button"
                            onClick={() => handleRemoveEmergencyContact(i)}
                            className="absolute top-6 right-6 p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all z-10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                              <input 
                                value={contact.name}
                                onChange={(e) => handleUpdateEmergencyContact(i, 'name', e.target.value)}
                                placeholder="Contact Name"
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Relationship</label>
                                <input 
                                  value={contact.relationship}
                                  onChange={(e) => handleUpdateEmergencyContact(i, 'relationship', e.target.value)}
                                  placeholder="e.g. Spouse"
                                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                <input 
                                  value={contact.phone}
                                  onChange={(e) => handleUpdateEmergencyContact(i, 'phone', e.target.value)}
                                  placeholder="+254..."
                                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Interactive glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      )) : (
                        <div className="md:col-span-2 p-12 text-center bg-white/2 rounded-[2rem] border border-dashed border-white/10">
                          <Contact2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No emergency contacts filed for this member.</p>
                        </div>
                      )}
                    </div>

                    {selectedEmployee.emergencyContacts.length > 0 && (
                      <div className="pt-4">
                         <button 
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                          className="w-full py-5 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-green hover:text-brand-dark transition-all flex justify-center items-center gap-3"
                         >
                           {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                           Update emergency File
                         </button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="animate-in fade-in duration-300">
                  <div className="space-y-8">
                    {!selectedEmployee.biometricId ? (
                      <div className="p-12 text-center bg-white/2 rounded-[2rem] border border-dashed border-white/10">
                        <BadgeAlert className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-white mb-2">Biometrics Not Linked</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-sm mx-auto leading-loose">
                          This employee is not currently integrated with the physical biometric system. 
                          Assign a Biometric ID in the Profile tab to enable attendance tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {/* Summary Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Status</p>
                              <p className={`text-lg font-black uppercase ${selectedEmployee.attendanceLogs?.[0]?.type === 'CHECK_IN' ? 'text-brand-green' : 'text-slate-500'}`}>
                                {selectedEmployee.attendanceLogs?.[0]?.type === 'CHECK_IN' ? 'DOCKED' : 'AWAY'}
                              </p>
                           </div>
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Event</p>
                              <p className="text-sm font-black text-white">
                                {selectedEmployee.attendanceLogs?.[0] ? new Date(selectedEmployee.attendanceLogs[0].timestamp).toLocaleString() : 'N/A'}
                              </p>
                           </div>
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Logs</p>
                              <p className="text-lg font-black text-white">{selectedEmployee.attendanceLogs?.length || 0}</p>
                           </div>
                        </div>

                        {/* Event List */}
                        <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
                          <div className="p-6 bg-white/5 border-b border-white/5">
                             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                               <History className="w-4 h-4" /> RECENT CLOCK EVENTS
                             </h4>
                          </div>
                          <div className="px-8 py-4 divide-y divide-white/5">
                            {selectedEmployee.attendanceLogs?.length > 0 ? (selectedEmployee.attendanceLogs as any[]).map((log, i) => (
                              <div key={i} className="py-4 flex items-center justify-between">
                                <div className="flex gap-4 items-center">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-[10px] uppercase ${log.type === 'CHECK_IN' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-slate-500/10 border-white/5 text-slate-400'}`}>
                                      {log.type === 'CHECK_IN' ? 'IN' : 'OUT'}
                                   </div>
                                   <div>
                                     <p className="text-xs font-bold text-white">{new Date(log.timestamp).toLocaleDateString()}</p>
                                     <p className="text-[9px] font-black text-slate-500 uppercase mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 font-bold">{log.source || 'SYSTEM'}</Badge>
                                </div>
                              </div>
                            )) : (
                              <div className="py-12 text-center">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No attendance logs found for this period.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="leave" className="animate-in fade-in duration-300">
                  <div className="space-y-8">
                    {/* Management Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].map((type) => (
                        <div key={type} className="bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-brand-green/30 transition-all">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{type.replace('_', ' ')} Balance</p>
                          <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-black text-white">21 <span className="text-[10px] text-slate-500">DAYS</span></h4>
                            <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-brand-dark transition-all">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Application Form */}
                      <div className="lg:col-span-1 space-y-6 bg-white/5 p-8 rounded-[2rem] border border-white/10 self-start">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <Briefcase className="w-4 h-4 text-brand-green" /> New Leave Request
                        </h3>
                        <div className="space-y-4">
                           <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Leave Type</label>
                             <select 
                               value={leaveForm.type}
                               onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                               className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30"
                             >
                               <option value="ANNUAL">ANNUAL LEAVE</option>
                               <option value="SICK">SICK LEAVE</option>
                               <option value="MATERNITY">MATERNITY/PATERNITY</option>
                               <option value="UNPAID">UNPAID LEAVE</option>
                             </select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                <input 
                                  type="date" 
                                  value={leaveForm.startDate}
                                  onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                                  className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                <input 
                                  type="date" 
                                  value={leaveForm.endDate}
                                  onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                                  className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30" 
                                />
                              </div>
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason / Notes</label>
                             <textarea 
                               rows={3} 
                               value={leaveForm.reason}
                               onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                               className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30 resize-none" 
                               placeholder="Explain the reason for leave..." 
                             />
                           </div>
                           <button 
                             onClick={handleApplyLeave}
                             className="w-full py-4 bg-brand-green text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
                           >
                             Submit Application
                           </button>
                        </div>
                      </div>

                      {/* Request History */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
                          <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                               <History className="w-4 h-4" /> LEAVE HISTORY
                             </h4>
                          </div>
                          <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-white/2">
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Duration</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {selectedEmployee.leaveRequests?.length > 0 ? selectedEmployee.leaveRequests.map((req, i) => (
                                  <tr key={i} className="hover:bg-white/2 transition-colors">
                                    <td className="px-6 py-4">
                                      <p className="text-xs font-black text-white">{req.type}</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                      <p className="text-xs font-bold text-slate-300">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge variant="outline" className={`text-[9px] font-black ${req.status === 'APPROVED' ? 'border-brand-green/50 text-brand-green' : req.status === 'PENDING' ? 'border-amber-500/50 text-amber-500' : 'border-rose-500/50 text-rose-500'}`}>
                                        {req.status}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        {req.status === 'PENDING' && (
                                          <>
                                            <button 
                                              onClick={() => handleUpdateLeaveStatus(req.id, 'APPROVED')}
                                              className="p-2 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-brand-dark transition-all"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => handleUpdateLeaveStatus(req.id, 'REJECTED')}
                                              className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No leave requests found.</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shifts" className="animate-in fade-in duration-300">
                  <div className="space-y-8">
                    {/* Header for Shifts */}
                    <div className="flex justify-between items-center bg-white/5 p-8 rounded-[2rem] border border-white/10">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <Calendar className="w-5 h-5 text-brand-green" /> SHIFT ROSTER — WEEKLY VIEW
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Drag and drop shifts to assign team members</p>
                      </div>
                      <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
                          Previous Week
                        </button>
                        <button className="px-6 py-3 bg-brand-green text-brand-dark rounded-xl text-[10px] font-black uppercase hover:brightness-110 transition-all">
                          Add New Shift
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                      <div className="grid grid-cols-8 border-b border-white/10">
                        <div className="p-6 bg-white/2 border-r border-white/5 flex items-center justify-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shift / Date</p>
                        </div>
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                          <div key={day} className="p-6 text-center border-r border-white/5 last:border-r-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{day}</p>
                            <p className="text-xs font-black text-white">Apr 13</p>
                          </div>
                        ))}
                      </div>

                      <div className="divide-y divide-white/5">
                        {(shifts.length > 0 ? shifts : [
                          { id: '1', name: 'MORNING', startTime: '06:00', endTime: '14:00' },
                          { id: '2', name: 'AFTERNOON', startTime: '14:00', endTime: '22:00' },
                          { id: '3', name: 'NIGHT', startTime: '22:00', endTime: '06:00' }
                        ]).map((shift) => (
                          <div key={shift.id} className="grid grid-cols-8">
                            <div className="p-6 bg-white/2 border-r border-white/5 flex flex-col justify-center">
                              <p className="text-xs font-black text-white uppercase">{shift.name}</p>
                              <p className="text-[9px] font-bold text-slate-500 mt-1">{shift.startTime} - {shift.endTime}</p>
                            </div>
                            {[0,1,2,3,4,5,6].map((dayIdx) => (
                              <div key={dayIdx} className="p-2 border-r border-white/5 last:border-r-0 min-h-[120px] bg-brand-dark/20 group hover:bg-white/2 transition-all relative">
                                <div className="space-y-2 h-full">
                                  {/* Filter assignments for this shift and day */}
                                  {allShiftAssignments
                                    .filter(a => a.shiftId === shift.id && new Date(a.date).getDay() === (dayIdx + 1) % 7)
                                    .map((a, i) => (
                                      <div key={i} className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-2xl flex items-center justify-between group/card hover:bg-brand-green transition-all hover:text-brand-dark cursor-grab active:cursor-grabbing">
                                        <div className="overflow-hidden">
                                          <p className="text-[9px] font-black uppercase truncate">{a.employee.firstName} {a.employee.lastName}</p>
                                          <p className="text-[8px] font-bold uppercase opacity-60 truncate">{a.employee.jobTitle}</p>
                                        </div>
                                        <button className="opacity-0 group-hover/card:opacity-100 p-1 hover:bg-brand-dark/20 rounded-md transition-all">
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                  
                                  {/* Empty Slot Drop Indicator */}
                                  <div 
                                    onClick={() => handleAssignShift(selectedEmployee.id, shift.id, `2026-04-${13 + dayIdx}`)}
                                    className="w-full h-full opacity-0 group-hover:opacity-100 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[8px] font-black text-slate-500 uppercase tracking-widest hover:border-brand-green/30 hover:text-brand-green transition-all cursor-pointer"
                                  >
                                    Assign
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="training" className="animate-in fade-in duration-300">
                  <div className="space-y-8">
                    {/* Training Stats & Compliance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 group hover:border-brand-green/30 transition-all">
                        <Award className="w-8 h-8 text-brand-green mb-4" />
                        <h4 className="text-2xl font-black text-white">{selectedEmployee.trainingRecords.length}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Training Certs</p>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 group hover:border-amber-500/30 transition-all">
                        <BadgeAlert className="w-8 h-8 text-amber-500 mb-4" />
                        <h4 className="text-2xl font-black text-white">
                          {trainingCourses.filter(c => c.isMandatory).length - selectedEmployee.trainingRecords.filter(r => r.course.isMandatory).length}
                        </h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Missing Compliance</p>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 group hover:border-blue-500/30 transition-all">
                        <Calendar className="w-8 h-8 text-blue-500 mb-4" />
                        <h4 className="text-2xl font-black text-white">{trainingSchedule.length}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scheduled Sessions</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Records Table */}
                      <div className="lg:col-span-2 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                           <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                             <FileBadge className="w-4 h-4" /> TRAINING HISTORY & CERTIFICATES
                           </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white/2">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">Course</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase text-right">Certificate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {selectedEmployee.trainingRecords.length > 0 ? selectedEmployee.trainingRecords.map((r, i) => (
                                <tr key={i} className="hover:bg-white/2">
                                  <td className="px-6 py-4">
                                    <p className="text-xs font-black text-white uppercase">{r.course.name}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{new Date(r.completionDate).toLocaleDateString()}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge variant="outline" className="text-[9px] border-brand-green/30 text-brand-green uppercase font-black">Valid</Badge>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {r.certificateUrl ? (
                                      <Link href={r.certificateUrl} target="_blank" className="p-2 bg-white/5 rounded-lg inline-block hover:bg-white/10 transition-all">
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </Link>
                                    ) : (
                                      <span className="text-[9px] font-black text-slate-700 uppercase">No File</span>
                                    )}
                                  </td>
                                </tr>
                              )) : (
                                <tr><td colSpan={3} className="py-12 text-center text-[10px] font-black text-slate-600 uppercase">No training records found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Compliance Tracker */}
                      <div className="bg-brand-dark/50 p-8 rounded-[2.5rem] border border-white/10 space-y-6 self-start">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Shield className="w-4 h-4 text-brand-green" /> COMPLIANCE TRACKER
                        </h4>
                        <div className="space-y-4">
                          {trainingCourses.filter(c => c.isMandatory).map((course, i) => {
                            const completed = selectedEmployee.trainingRecords.find(r => r.courseId === course.id);
                            return (
                              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                  <p className="text-[10px] font-black text-white uppercase">{course.name}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase">Periodic Training</p>
                                </div>
                                {completed ? (
                                  <CheckCircle className="w-5 h-5 text-brand-green" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-rose-500/30 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appraisals" className="animate-in fade-in duration-300">
                  <div className="space-y-8">
                    {/* KPI Performance Bar */}
                    {kpiData && (
                      <div className="bg-brand-green/5 p-8 rounded-[2.5rem] border border-brand-green/20">
                         <div className="flex justify-between items-center mb-8">
                            <div>
                               <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                 <BarChart3 className="w-5 h-5 text-brand-green" /> Performance Analytics — {new Date().toLocaleString('default', { month: 'long' })}
                               </h3>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time productivity & quality scoring</p>
                            </div>
                            <div className="text-right">
                               <p className="text-3xl font-black text-brand-green">{kpiData.overallScore.toFixed(1)} / 10</p>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Overall Score</p>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                              { label: 'Productivity', val: kpiData.productivityScore.toFixed(1), sub: `${kpiData.stemsPerHour.toFixed(0)} Stems/hr`, col: 'text-brand-green' },
                              { label: 'Quality', val: kpiData.qualityScore.toFixed(1), sub: `${(kpiData.rejectionRate * 100).toFixed(1)}% Reject Rate`, col: 'text-emerald-500' },
                              { label: 'Attendance', val: kpiData.attendanceScore.toFixed(1), sub: '22 Days Present', col: 'text-blue-500' },
                              { label: 'Growth', val: '8.5', sub: 'Technical Skill', col: 'text-amber-500' }
                            ].map((k, i) => (
                              <div key={i} className="bg-brand-dark/50 p-6 rounded-3xl border border-white/5">
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
                                 <h4 className={`text-2xl font-black ${k.col}`}>{k.val}</h4>
                                 <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">{k.sub}</p>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* 360 Reviews */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                          <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                               <History className="w-4 h-4" /> RECENT APPRAISAL SESSIONS
                             </h4>
                             <button className="px-5 py-2.5 bg-brand-green text-brand-dark text-[9px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">
                               New Appraisal
                             </button>
                          </div>
                          <div className="p-8">
                            {selectedEmployee.appraisals.length > 0 ? selectedEmployee.appraisals.map((a, i) => (
                              <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-4 last:mb-0 flex items-center justify-between">
                                 <div>
                                   <p className="text-xs font-black text-white uppercase tracking-wider">{a.period}</p>
                                   <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Status: {a.status}</p>
                                 </div>
                                 <div className="flex gap-12 items-center">
                                    <div className="text-center">
                                       <p className="text-lg font-black text-white">{a.finalScore || '—'}</p>
                                       <p className="text-[8px] font-black text-slate-600 uppercase">360 Score</p>
                                    </div>
                                    <div className="text-center">
                                       <p className="text-lg font-black text-brand-green">{a.kpiScore || '—'}</p>
                                       <p className="text-[8px] font-black text-slate-600 uppercase">KPI Score</p>
                                    </div>
                                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                      <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </button>
                                 </div>
                              </div>
                            )) : (
                              <div className="py-8 text-center bg-white/2 rounded-3xl border border-dashed border-white/10">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No formal appraisals found.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Training Calendar Mini */}
                      <div className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-blue-400" /> UPCOMING TRAINING
                           </h4>
                           <div className="space-y-4">
                              {trainingSchedule.length > 0 ? trainingSchedule.slice(0, 3).map((s, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                   <p className="text-[10px] font-black text-white uppercase">{s.course.name}</p>
                                   <p className="text-[8px] font-bold text-brand-green uppercase mt-1">
                                     {new Date(s.scheduledDate).toLocaleDateString()} @ {s.location || 'Training Room'}
                                   </p>
                                </div>
                              )) : (
                                <p className="text-[9px] font-black text-slate-600 uppercase">No sessions scheduled.</p>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Employment Basis</label>
                  <select 
                    required
                    value={inviteData.employmentType}
                    onChange={(e) => setInviteData({...inviteData, employmentType: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green/30 text-white appearance-none uppercase font-black tracking-wider cursor-pointer"
                  >
                    <option value="PERMANENT">PERMANENT</option>
                    <option value="CONTRACT">CONTRACT</option>
                    <option value="CASUAL">CASUAL</option>
                  </select>
                </div>
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
