'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TimelineView from '../../../components/audit-logs/TimelineView';
import LogFilterBar from '../../../components/audit-logs/LogFilterBar';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actorId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params = new URLSearchParams(filters as any).toString();
      const response = await fetch(`${API}/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    if (logs.length === 0) return;

    // Simple CSV generation
    const headers = ['ID', 'Action', 'Entity', 'Actor', 'Timestamp', 'Data'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = logs.map((log: any) => [
      log.id,
      log.action,
      log.entityType,
      log.actor?.email || 'System',
      new Date(log.timestamp).toISOString(),
      JSON.stringify(log.afterState).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `floricore_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-green/10 border border-brand-green/20">
              <ShieldCheck className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">System Audit Trail</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Compliance-grade logs of every administrative action.</p>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-brand-green font-black text-[10px] animate-pulse tracking-widest uppercase">
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating Timeline...
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-2 shadow-xl">
        <LogFilterBar 
          filters={filters} 
          onFilterChange={setFilters} 
          onExport={handleExport} 
        />
      </div>

      {/* Timeline */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden transition-all">
         {loading && logs.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
              <Loader2 className="w-12 h-12 animate-spin text-brand-green mb-4" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Initialising Audit Stream...</p>
           </div>
         ) : (
           <TimelineView logs={logs} />
         )}
         
         <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-brand-green/5 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
