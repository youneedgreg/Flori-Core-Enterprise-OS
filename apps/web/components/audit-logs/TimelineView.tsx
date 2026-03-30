'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  beforeState?: any;
  afterState?: any;
  actor?: {
    email: string;
  };
}

const actionStyles: Record<string, { icon: any; color: string; bg: string }> = {
  POST: { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  PATCH: { icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  DELETE: { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  DEFAULT: { icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

export default function TimelineView({ logs }: { logs: AuditLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No system actions recorded yet</p>
        <p className="text-sm">Change some settings to see them appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
      {logs.map((log) => {
        const style = actionStyles[log.action] || actionStyles.DEFAULT;
        const isExpanded = expandedId === log.id;

        return (
          <div key={log.id} className="relative flex items-start group">
            {/* Timeline Icon */}
            <div className={`absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 ${style.bg} z-10 transition-transform group-hover:scale-110`}>
              <style.icon className={`w-5 h-5 ${style.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 ml-16">
              <div className="glass p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${style.bg} ${style.color} border border-white/5`}>
                      {log.action}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {log.entityType} <span className="text-slate-500 font-medium">#{log.entityId?.slice(0, 8)}</span>
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5 bg-white/2 px-2 py-1 rounded-lg">
                      <User className="w-3 h-3" />
                      {log.actor?.email || 'System'}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/2 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    User modified <span className="text-slate-200 font-bold">{log.entityType}</span> record via <span className="text-slate-200 font-mono">{log.action}</span> request.
                  </p>
                  
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/20"
                  >
                    {isExpanded ? 'Hide Diffs' : 'View Diffs'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isExpanded && log.afterState && (
                  <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs overflow-x-auto space-y-2">
                    <div className="flex items-center gap-2 mb-2 text-emerald-500/50">
                      <FileText className="w-3 h-3" />
                      New State Data
                    </div>
                    <pre className="text-emerald-400/90 leading-relaxed">
                      {JSON.stringify(log.afterState, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
