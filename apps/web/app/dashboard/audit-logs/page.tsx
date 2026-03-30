'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TimelineView from '../../../components/audit-logs/TimelineView';
import LogFilterBar from '../../../components/audit-logs/LogFilterBar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams(filters as any).toString();
      const response = await fetch(`${API}/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto p-8 lg:p-12">
        {/* Breadcrumbs / Back */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">System Audit Trail</h1>
            </div>
            <p className="text-slate-400 font-medium">Compliance-grade logs of every administrative action.</p>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              UPDATING TIMELINE...
            </div>
          )}
        </header>

        {/* Filters */}
        <LogFilterBar 
          filters={filters} 
          onFilterChange={setFilters} 
          onExport={handleExport} 
        />

        {/* Timeline */}
        <div className="mt-10">
           {loading && logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
                <p>Initialising Audit Stream...</p>
             </div>
           ) : (
             <TimelineView logs={logs} />
           )}
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
