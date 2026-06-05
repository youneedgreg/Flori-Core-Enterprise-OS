'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Save, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard.view', label: 'View Dashboard', category: 'Dashboard' },
  { id: 'production.manage', label: 'Manage Production', category: 'Production' },
  { id: 'inventory.manage', label: 'Manage Inventory', category: 'Inventory' },
  { id: 'procurement.manage', label: 'Manage Procurement', category: 'Procurement' },
  { id: 'sales.manage', label: 'Manage Sales', category: 'Sales' },
  { id: 'financials.view', label: 'View Financials', category: 'Financials' },
  { id: 'financials.manage', label: 'Manage Financials', category: 'Financials' },
  { id: 'hr.manage', label: 'Manage HR & Team', category: 'Team' },
  { id: 'settings.manage', label: 'Manage Settings', category: 'Settings' },
];

interface RbacManagerProps {
  onRolesUpdated?: () => void;
}

export default function RbacManager({ onRolesUpdated }: RbacManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const res = await fetch(`${API}/auth/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setRoles(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to fetch roles');
      }
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    
    if (!editingRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const isNew = !editingRole.id;
      const url = isNew ? `${API}/auth/roles` : `${API}/auth/roles/${editingRole.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editingRole)
      });

      if (res.ok) {
        toast.success(isNew ? 'Role created successfully' : 'Role updated successfully');
        setEditingRole(null);
        fetchRoles();
        if (onRolesUpdated) onRolesUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to save role');
      }
    } catch (err) {
      toast.error('Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/auth/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Role deleted successfully');
        fetchRoles();
        if (onRolesUpdated) onRolesUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to delete role');
      }
    } catch (err) {
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (permId: string) => {
    if (!editingRole) return;
    setEditingRole(prev => {
      if (!prev) return prev;
      const permissions = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  // Group permissions by category
  const groupedPerms = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <div className="space-y-8">
      {/* List Roles */}
      {!editingRole ? (
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
              <Shield className="w-6 h-6 text-brand-green" />
              Role-Based Access Control
            </h3>
            <button 
              onClick={() => setEditingRole({ id: '', name: '', description: '', permissions: [] })}
              className="flex items-center gap-2 px-5 py-3 bg-brand-green text-slate-950 hover:bg-emerald-400 transition-all rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Create Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-brand-green/30 group transition-all relative overflow-hidden">
                {role.isSystem && (
                  <div className="absolute top-0 right-0 p-4">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                )}
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1 group-hover:text-brand-green transition-colors">{role.name.replace('_', ' ')}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6 line-clamp-2">{role.description}</p>
                
                <div className="space-y-2 mb-8">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Access Grants ({role.permissions.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 4).map(p => {
                      const label = AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p;
                      return (
                        <span key={p} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-black text-slate-400 uppercase tracking-wider truncate max-w-full">
                          {label}
                        </span>
                      );
                    })}
                    {role.permissions.length > 4 && (
                      <span className="px-2 py-1 rounded bg-brand-green/10 border border-brand-green/20 text-[8px] font-black text-brand-green uppercase tracking-wider">
                        +{role.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingRole(role)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-brand-green/20 text-slate-400 hover:text-brand-green flex items-center justify-center transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!role.isSystem && (
                    <button 
                      onClick={() => handleDeleteRole(role)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Edit Role Form */
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-brand-green/20 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
            <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
              {editingRole.id ? 'Edit Custom Role' : 'New Custom Role'}
            </h3>
            <button 
              onClick={() => setEditingRole(null)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveRole} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Role Identity</label>
                <input
                  value={editingRole.name}
                  onChange={e => setEditingRole({ ...editingRole, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  disabled={editingRole.isSystem}
                  placeholder="e.g. PACKHOUSE_MANAGER"
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black uppercase tracking-widest focus:outline-none focus:border-brand-green/50 disabled:opacity-50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Role Description</label>
                <input
                  value={editingRole.description}
                  onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                  disabled={editingRole.isSystem}
                  placeholder="Brief description of this role's responsibilities..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium focus:outline-none focus:border-brand-green/50 disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Access Grants Matrix
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-3xl bg-slate-950/50 border border-white/5">
                {Object.entries(groupedPerms).map(([category, perms]) => (
                  <div key={category} className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">{category}</h4>
                    <div className="space-y-2">
                      {perms.map(perm => {
                        const isGranted = editingRole.permissions.includes(perm.id);
                        return (
                          <label 
                            key={perm.id} 
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isGranted 
                                ? 'bg-brand-green/10 border-brand-green/30' 
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                            } ${editingRole.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isGranted ? 'text-brand-green' : 'text-slate-400'}`}>
                              {perm.label}
                            </span>
                            {isGranted ? (
                              <CheckCircle2 className="w-4 h-4 text-brand-green" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-600" />
                            )}
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isGranted}
                              disabled={editingRole.isSystem}
                              onChange={() => togglePermission(perm.id)} 
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5">
              <button
                type="submit"
                disabled={isSubmitting || editingRole.isSystem}
                className="flex items-center gap-2 px-8 py-4 bg-brand-green hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-brand-green text-slate-950 rounded-2xl font-black text-[10px] transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingRole.id ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
