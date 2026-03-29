"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  createdAt: string;
  tenant: {
    name: string;
    slug: string;
  };
  role: {
    name: string;
  };
}

export default function FloriCoreDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Safe check for browser environment
    if (typeof document === 'undefined') return;

    // Check if the user used the backdoor credentials by looking for the explicit cookie 
    if (!document.cookie.includes('access_token=superadmin_floricore_dev')) {
      router.push('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/flori-core-users', {
          headers: {
            'x-superadmin-password': '12password',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch system users');
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        Loading Flori-Core Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="text-3xl font-black tracking-tighter text-white inline-flex items-center gap-2 mb-2">
              <span className="text-emerald-500">Flori-</span>Core 
              <span className="text-slate-500 font-medium text-lg ml-2">Super Admin</span>
            </div>
            <p className="text-slate-400 mt-1">Global view of all tenants and users</p>
          </div>
          
          <button 
            onClick={() => {
              document.cookie = 'access_token=; Max-Age=0; path=/';
              router.push('/login');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
          >
            Sign Out
          </button>
        </header>

        <div className="glass p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">System Users ({users.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-sm tracking-wide text-slate-400">
                  <th className="pb-4 pr-6 font-medium">Email</th>
                  <th className="pb-4 pr-6 font-medium">Tenant</th>
                  <th className="pb-4 pr-6 font-medium">Role</th>
                  <th className="pb-4 pr-6 font-medium">Created At</th>
                  <th className="pb-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/2 transition-colors">
                    <td className="py-4 pr-6 border-b border-slate-800">
                      <div className="text-slate-200 font-medium">{user.email}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{user.id}</div>
                    </td>
                    <td className="py-4 pr-6 border-b border-slate-800">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {user.tenant?.name || 'No Tenant'}
                      </span>
                    </td>
                    <td className="py-4 pr-6 border-b border-slate-800">
                      <span className="text-slate-300 capitalize text-sm">
                        {user.role?.name.replace('_', ' ') || 'None'}
                      </span>
                    </td>
                    <td className="py-4 pr-6 border-b border-slate-800 text-slate-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 border-b border-slate-800 text-right">
                      <button className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No users found in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
