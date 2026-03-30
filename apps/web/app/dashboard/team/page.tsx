'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  ArrowLeft, 
  Loader2,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Role {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  email: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
}

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', roleId: '' });
  const [isInviting, setIsInviting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [membersRes, rolesRes] = await Promise.all([
        fetch(`${API}/team`, { headers }),
        fetch(`${API}/team/roles`, { headers })
      ]);

      if (membersRes.ok && rolesRes.ok) {
        setMembers(await membersRes.json());
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setInviteData(prev => ({ ...prev, roleId: rolesData[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email || !inviteData.roleId) return;

    setIsInviting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/team/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(inviteData)
      });

      if (res.ok) {
        toast.success(`Invitation sent to ${inviteData.email}`);
        setShowInviteModal(false);
        setInviteData({ email: '', roleId: roles[0]?.id || '' });
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send invite');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the team?`)) return;

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Member removed');
        fetchData();
      } else {
        throw new Error('Failed to remove');
      }
    } catch (e) {
      toast.error('Could not remove member');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-8 lg:p-12">
        {/* Breadcrumbs */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase">Workforce</h1>
            </div>
            <p className="text-slate-400 font-medium tracking-tight">Manage your farm operators, logistics experts and administrators.</p>
          </div>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <UserPlus className="w-5 h-5" />
            Invite New Member
          </button>
        </header>

        {/* Members List */}
        <div className="glass rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Assigned Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-500 animate-pulse tracking-widest">LOADING WORKFORCE...</p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-slate-500 font-bold">No team members found.</p>
                  </td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 font-black text-emerald-500 group-hover:border-emerald-500/30 transition-colors uppercase">
                        {member.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{member.email}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-700">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      {member.role.name.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Active
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleRemove(member.id, member.email)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 transition-all">
          <div className="glass w-full max-w-md p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-emerald-500" />
              Invite Member
            </h2>
            
            <form onSubmit={handleInvite} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="teammate@example.com"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Assign Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select 
                    value={inviteData.roleId}
                    onChange={(e) => setInviteData({ ...inviteData, roleId: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white appearance-none uppercase font-bold tracking-wider"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm border border-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Send Invite
                </button>
              </div>
            </form>

            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
          </div>
        </div>
      )}

      {/* Decorative Glows */}
      <div className="fixed top-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none opacity-50" />
      <div className="fixed bottom-0 right-0 -z-10 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none opacity-50" />
    </div>
  );
}
