'use client';

import React from 'react';
import { Search, Filter, Download, X } from 'lucide-react';

interface LogFilterBarProps {
  onFilterChange: (filters: any) => void;
  onExport: () => void;
  filters: any;
}

export default function LogFilterBar({ onFilterChange, onExport, filters }: LogFilterBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({ actorId: '', action: '', entityType: '', startDate: '', endDate: '' });
  };

  return (
    <div className="glass p-8 rounded-3xl border border-slate-800 shadow-xl mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        {/* Entity Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Module</label>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors pointer-events-none" />
            <select 
              name="entityType"
              value={filters.entityType}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Modules</option>
              <option value="FarmProfile">Farm Profile</option>
              <option value="Zone">Zones</option>
              <option value="Team">Team Invites</option>
              <option value="IoTDevice">IoT Devices</option>
            </select>
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Action</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors pointer-events-none" />
            <select 
               name="action"
               value={filters.action}
               onChange={handleChange}
               className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="POST">Created (POST)</option>
              <option value="PATCH">Updated (PATCH)</option>
              <option value="DELETE">Deleted (DELETE)</option>
            </select>
          </div>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">From</label>
          <input 
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">To</label>
           <input 
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/50">
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-all bg-white/2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
        >
          <X className="w-4 h-4" />
          Clear All Filters
        </button>
        
        <button 
          onClick={onExport}
          className="flex items-center gap-3 px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </button>
      </div>
    </div>
  );
}
