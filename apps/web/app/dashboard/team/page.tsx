/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, UserPlus, Mail, Shield, Trash2, Loader2,
  CheckCircle2, AlertTriangle, Lock, KeyRound,
  X, Copy, RefreshCw, Activity,
  Search, ShieldCheck,
  UserCheck, UserX, Edit2,
  ClipboardList, History, Phone, BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import RbacManager from '../../../components/settings/RbacManager';

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
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Request failed'); }
  return r.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleId: string;
  role: Role;
  actorAuditLogs?: AuditEntry[];
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  timestamp: string;
}

interface InviteForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    gold_admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    farm_manager: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    supervisor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    operator: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  const cls = map[role] ?? 'bg-white/5 text-slate-400 border-white/10';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children, size = 'default' }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; size?: 'default' | 'sm';
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className={`relative bg-brand-dark/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full ${size === 'sm' ? 'max-w-md' : 'max-w-xl'} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300`}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Panels & modals
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  // Password reset result
  const [newTempPassword, setNewTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Forms
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '', firstName: '', lastName: '', phone: '', roleId: ''
  });
  const [isInviting, setIsInviting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inline editing
  const [editForm, setEditForm] = useState<Partial<TeamMember> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) { logout(); return; }

      const [membersData, rolesData] = await Promise.all([
        apiFetch('/team'),
        apiFetch('/team/roles'),
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openMember = async (id: string) => {
    setPanelLoading(true);
    try {
      const data = await apiFetch(`/team/${id}`);
      setSelectedMember(data);
      setEditForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone, roleId: data.roleId, isActive: data.isActive });
    } catch (e: any) {
      toast.error('Failed to load member profile');
    } finally {
      setPanelLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await apiFetch('/team/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteForm({ email: '', firstName: '', lastName: '', phone: '', roleId: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setIsResetting(true);
    try {
      const data = await apiFetch(`/team/${resetTarget.id}/reset-password`, { method: 'POST' });
      setNewTempPassword(data.tempPassword);
      fetchData();
      if (selectedMember?.id === resetTarget.id) openMember(resetTarget.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/team/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Member removed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      if (selectedMember?.id === deleteTarget.id) setSelectedMember(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedMember || !editForm) return;
    setIsSaving(true);
    try {
      await apiFetch(`/team/${selectedMember.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      toast.success('Profile updated');
      openMember(selectedMember.id);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      await apiFetch(`/team/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      toast.success(member.isActive ? 'Member deactivated' : 'Member reactivated');
      fetchData();
      if (selectedMember?.id === member.id) openMember(member.id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered list
  const filtered = members.filter((m) => {
    const name = `${m.firstName ?? ''} ${m.lastName ?? ''} ${m.email}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (filterRole && m.role?.name !== filterRole) return false;
    if (filterStatus === 'active' && !m.isActive) return false;
    if (filterStatus === 'inactive' && m.isActive) return false;
    if (filterStatus === 'password_reset' && !m.mustChangePassword) return false;
    return true;
  });

  // KPI counts
  const activeCount = members.filter((m) => m.isActive).length;
  const pendingPasswordCount = members.filter((m) => m.mustChangePassword).length;
  const rolesInUse = new Set(members.map((m) => m.role?.name)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Members" value={members.length} color="emerald" />
        <KpiCard icon={UserCheck} label="Active" value={activeCount} color="blue" sub={`${members.length - activeCount} inactive`} />
        <KpiCard icon={KeyRound} label="Pending Reset" value={pendingPasswordCount} color="amber" sub="Temp password" />
        <KpiCard icon={Shield} label="Roles in Use" value={rolesInUse} color="purple" />
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-4">
            Team Access
            <Badge variant="outline" className="text-brand-green border-brand-green/30 px-3 font-black">SYSTEM USERS</Badge>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Manage who has dashboard access, their roles, and security credentials.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </header>

      <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('members')}
          className={`rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'bg-brand-green text-slate-950 shadow-lg'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Members Directory
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-brand-green text-slate-950 shadow-lg'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-green/30 transition-colors"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-400 uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              {roles.map((r) => <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-400 uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="password_reset">Pending Password Reset</option>
            </select>
            {(search || filterRole || filterStatus) && (
              <button
                onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
                className="px-4 py-3.5 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Main layout: table + slide panel */}
          <div className="flex gap-6 items-start">

        {/* Members Table */}
        <div className={`bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 ${selectedMember ? 'flex-[1.5]' : 'flex-1'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Security</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Login</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-500 animate-pulse tracking-widest uppercase">Loading team...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No members found</p>
                  </td>
                </tr>
              ) : filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => openMember(m.id)}
                  className={`hover:bg-white/2 transition-all group cursor-pointer ${selectedMember?.id === m.id ? 'bg-brand-green/5 border-l-2 border-brand-green' : ''}`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-xs uppercase transition-all ${m.isActive ? 'bg-brand-green/10 border-brand-green/20 text-brand-green group-hover:border-brand-green/40' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                        {(m.firstName?.[0] ?? m.email[0]).toUpperCase()}
                        {(m.lastName?.[0] ?? '').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white group-hover:text-brand-green transition-colors">
                          {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <RoleBadge role={m.role?.name ?? 'unknown'} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {m.mustChangePassword ? (
                        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500 font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> TEMP PW
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] border-brand-green/40 text-brand-green font-black flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> SECURE
                        </Badge>
                      )}
                      {!m.isActive && (
                        <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-500 font-black">
                          INACTIVE
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-400">
                      {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : '—'}
                    </p>
                    {m.lastLoginAt && (
                      <p className="text-[9px] text-slate-600 font-bold mt-0.5">
                        {new Date(m.lastLoginAt).toLocaleTimeString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setResetTarget(m); setShowResetModal(true); setNewTempPassword(''); }}
                        title="Reset Password"
                        className="p-2 rounded-xl hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-all"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(m); }}
                        title={m.isActive ? 'Deactivate' : 'Reactivate'}
                        className={`p-2 rounded-xl transition-all ${m.isActive ? 'hover:bg-rose-500/10 text-slate-500 hover:text-rose-400' : 'hover:bg-brand-green/10 text-slate-500 hover:text-brand-green'}`}
                      >
                        {m.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); setShowDeleteModal(true); }}
                        title="Remove Member"
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedMember && (
          <div className="flex-1 min-w-[360px] max-w-[420px] bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden animate-in slide-in-from-right-6 duration-400 flex flex-col">
            {panelLoading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
              </div>
            ) : (
              <>
                {/* Panel header */}
                <div className="p-6 border-b border-white/5 bg-white/2 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg uppercase border-2 ${selectedMember.isActive ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      {(selectedMember.firstName?.[0] ?? selectedMember.email[0]).toUpperCase()}
                      {(selectedMember.lastName?.[0] ?? '').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">
                        {selectedMember.firstName && selectedMember.lastName
                          ? `${selectedMember.firstName} ${selectedMember.lastName}`
                          : selectedMember.email}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">{selectedMember.email}</p>
                      <div className="mt-1.5">
                        <RoleBadge role={selectedMember.role?.name ?? 'unknown'} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedMember.isActive ? 'bg-brand-green animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedMember.mustChangePassword && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Password Reset Required</span>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex-1 overflow-y-auto">
                  <Tabs defaultValue="profile" className="h-full">
                    <div className="px-4 pt-4">
                      <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-auto flex gap-1 w-full">
                        {[
                          { value: 'profile', icon: Edit2, label: 'Profile' },
                          { value: 'access', icon: Shield, label: 'Access' },
                          { value: 'security', icon: Lock, label: 'Security' },
                          { value: 'activity', icon: Activity, label: 'Activity' },
                        ].map(({ value, icon: Icon, label }) => (
                          <TabsTrigger
                            key={value}
                            value={value}
                            className="flex-1 rounded-xl px-2 py-2.5 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-brand-green data-[state=active]:text-brand-dark flex items-center justify-center gap-1"
                          >
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{label}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="p-6 space-y-5 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                          <input
                            value={editForm?.firstName ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                            placeholder="First name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                          <input
                            value={editForm?.lastName ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border border-white/5 rounded-xl">
                          <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-400">{selectedMember.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                          <input
                            value={editForm?.phone ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                            placeholder="+254..."
                          />
                        </div>
                      </div>

                      <div className="pt-2 grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Member Since</p>
                          <p className="text-xs font-black text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Login</p>
                          <p className="text-xs font-black text-white">
                            {selectedMember.lastLoginAt ? new Date(selectedMember.lastLoginAt).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-3.5 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Save Profile
                      </button>
                    </TabsContent>

                    {/* Access / Role Tab */}
                    <TabsContent value="access" className="p-6 space-y-5 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                        <select
                          value={editForm?.roleId ?? selectedMember.roleId}
                          onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-xs font-black text-white uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer transition-colors"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>

                      {/* Permissions list */}
                      {(() => {
                        const currentRole = roles.find((r) => r.id === (editForm?.roleId ?? selectedMember.roleId));
                        const perms: string[] = Array.isArray(currentRole?.permissions) ? currentRole.permissions as string[] : [];
                        return perms.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Permissions ({perms.length})</p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {perms.map((p: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/3 rounded-xl border border-white/5">
                                  <BadgeCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{p.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-6 bg-white/3 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No specific permissions configured for this role.</p>
                          </div>
                        );
                      })()}

                      {/* Account Status */}
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Status</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {selectedMember.isActive ? 'Active — Can access dashboard' : 'Inactive — Access blocked'}
                          </span>
                          <button
                            onClick={() => handleToggleActive(selectedMember)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedMember.isActive
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-brand-green/10 text-brand-green border-brand-green/20 hover:bg-brand-green/20'
                            }`}
                          >
                            {selectedMember.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-3.5 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Save Role & Access
                      </button>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="p-6 space-y-5 animate-in fade-in duration-300">
                      {/* Password status card */}
                      <div className={`p-5 rounded-2xl border flex items-start gap-4 ${selectedMember.mustChangePassword
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-brand-green/5 border-brand-green/20'
                      }`}>
                        {selectedMember.mustChangePassword ? (
                          <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-6 h-6 text-brand-green mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${selectedMember.mustChangePassword ? 'text-amber-500' : 'text-brand-green'}`}>
                            {selectedMember.mustChangePassword ? 'Temporary Password Active' : 'Password Secure'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {selectedMember.mustChangePassword
                              ? 'This member has not yet changed their temporary password. They will be prompted on next login.'
                              : 'This member has set their own password. Credentials are secure.'}
                          </p>
                        </div>
                      </div>

                      {/* Login history */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Login History</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Last Login</p>
                            <p className="text-xs font-black text-white">
                              {selectedMember.lastLoginAt ? new Date(selectedMember.lastLoginAt).toLocaleDateString() : 'Never'}
                            </p>
                            {selectedMember.lastLoginAt && (
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                {new Date(selectedMember.lastLoginAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Account Created</p>
                            <p className="text-xs font-black text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Reset password action */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <KeyRound className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-xs font-black text-white">Reset Password</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Generates a new temporary password and sends it via email.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setResetTarget(selectedMember); setShowResetModal(true); setNewTempPassword(''); }}
                          className="w-full py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" /> Reset Password
                        </button>
                      </div>

                      {/* Remove member */}
                      <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-3">
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-5 h-5 text-rose-500" />
                          <div>
                            <p className="text-xs font-black text-white">Remove Member</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Permanently removes this member from the workspace.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setDeleteTarget(selectedMember); setShowDeleteModal(true); }}
                          className="w-full py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Remove from Workspace
                        </button>
                      </div>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="p-6 space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Recent Actions</p>
                        {selectedMember.actorAuditLogs && selectedMember.actorAuditLogs.length > 0 ? (
                          <div className="space-y-2">
                            {selectedMember.actorAuditLogs.map((log) => (
                              <div key={log.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center border border-brand-green/20 shrink-0">
                                  <ClipboardList className="w-3.5 h-3.5 text-brand-green" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-white uppercase truncate">{log.action}</p>
                                  <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase">{log.entityType}</p>
                                </div>
                                <p className="text-[9px] font-bold text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-10 text-center bg-white/2 rounded-2xl border border-dashed border-white/10">
                            <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No activity recorded yet.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
)}

      {activeTab === 'roles' && (
        <div className="animate-in fade-in duration-300">
          <RbacManager onRolesUpdated={fetchData} />
        </div>
      )}

      {/* ── Invite Modal ────────────────────────────────────────────── */}
      {showInviteModal && (
        <Modal title="Invite Member" subtitle="New system user invitation" onClose={() => setShowInviteModal(false)}>
          <form onSubmit={handleInvite} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">First Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder="Jane"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
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
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="member@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Role</label>
                <select
                  required
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black text-white uppercase focus:outline-none focus:border-brand-green/30 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="+254..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-green/30 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Security info */}
            <div className="flex items-start gap-3 p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl">
              <Lock className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Secure Invite</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  A temporary password will be auto-generated and emailed to the member. They will be required to change it on first login.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="flex-1 py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ─────────────────────────────────────── */}
      {showResetModal && resetTarget && (
        <Modal
          title="Reset Password"
          subtitle={resetTarget.email}
          onClose={() => { setShowResetModal(false); setNewTempPassword(''); }}
          size="sm"
        >
          <div className="space-y-6">
            {!newTempPassword ? (
              <>
                <div className="flex items-start gap-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Confirm Reset</p>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      A new temporary password will be generated and emailed to{' '}
                      <span className="text-white font-bold">{resetTarget.firstName ?? resetTarget.email}</span>.
                      Their current password will be invalidated immediately.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowResetModal(false); setNewTempPassword(''); }}
                    className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="flex-1 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Reset Now
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-brand-green/5 border border-brand-green/20 rounded-2xl space-y-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
                  <div>
                    <p className="text-sm font-black text-white">Password Reset Successfully</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Email sent to {resetTarget.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Temporary Password</p>
                  <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <code className="flex-1 font-mono text-sm font-bold text-brand-green tracking-widest">{newTempPassword}</code>
                    <button
                      onClick={() => copyToClipboard(newTempPassword)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-brand-green" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-600 uppercase font-bold pl-1">Store securely — this is shown only once.</p>
                </div>

                <button
                  onClick={() => { setShowResetModal(false); setNewTempPassword(''); }}
                  className="w-full py-4 bg-brand-green hover:bg-emerald-400 text-brand-dark rounded-2xl font-black text-sm transition-all"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      {showDeleteModal && deleteTarget && (
        <Modal
          title="Remove Member"
          subtitle="This action is permanent"
          onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
          size="sm"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
              <Trash2 className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Irreversible Action</p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  <span className="text-white font-bold">
                    {deleteTarget.firstName && deleteTarget.lastName
                      ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
                      : deleteTarget.email}
                  </span>{' '}
                  will lose all access to this workspace immediately. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove Member
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
