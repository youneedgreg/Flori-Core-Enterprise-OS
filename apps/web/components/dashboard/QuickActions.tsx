import React from 'react';
import { PlusCircle, FileCheck, AlertCircle, TrendingUp } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { id: 'new-order', label: 'New Order', icon: PlusCircle, color: 'emerald' },
    { id: 'approve-po', label: 'Approve PO', icon: FileCheck, color: 'blue' },
    { id: 'view-alerts', label: 'View Alerts', icon: AlertCircle, color: 'rose' },
    { id: 'reports', label: 'Reports', icon: TrendingUp, color: 'amber' },
  ];

  return (
    <div className="flex items-center gap-4 py-6 overflow-x-auto no-scrollbar">
      {actions.map((action) => (
        <button
          key={action.id}
          className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 group transition-all duration-300 backdrop-blur-sm"
        >
          <action.icon className={`w-5 h-5 text-${action.color}-500 group-hover:scale-110 transition-transform`} />
          <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
