import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save } from 'lucide-react';

export function PremiumModal({ 
  title, 
  subtitle = 'Sales Engine Portal', 
  onClose, 
  children,
  maxWidth = 'max-w-2xl',
  accentColor = 'emerald',
  noPadding = false
}: { 
  title: string; 
  subtitle?: string;
  onClose: () => void; 
  children: React.ReactNode;
  maxWidth?: string;
  accentColor?: 'emerald' | 'indigo' | 'amber' | 'purple';
  noPadding?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const accentGlow = {
    emerald: 'via-emerald-500/50',
    indigo: 'via-indigo-500/50',
    amber: 'via-amber-500/50',
    purple: 'via-purple-500/50'
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Premium Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className={`relative bg-brand-dark/80 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300`}>
        {/* Glow Effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent ${accentGlow[accentColor]} to-transparent`} />
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/2">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-hidden flex flex-col ${noPadding ? '' : 'p-8'}`}>
          {noPadding ? children : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function FormField({ 
  label, 
  children, 
  error,
  accentColor = 'emerald'
}: { 
  label: string; 
  children: React.ReactNode; 
  error?: string;
  accentColor?: 'emerald' | 'indigo' | 'amber' | 'purple';
}) {
  const accentText = {
    emerald: 'group-focus-within:text-emerald-400',
    indigo: 'group-focus-within:text-indigo-400',
    amber: 'group-focus-within:text-amber-400',
    purple: 'group-focus-within:text-purple-400'
  };

  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center px-1">
        <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest ${accentText[accentColor]} transition-colors`}>
          {label}
        </label>
        {error && <span className="text-[9px] font-black text-rose-500 uppercase">{error}</span>}
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export const inputCls = (accentColor: 'emerald' | 'indigo' | 'amber' | 'purple' = 'emerald') => {
  const accentRing = {
    emerald: 'focus:ring-emerald-500/20 focus:border-emerald-500/40',
    indigo: 'focus:ring-indigo-500/20 focus:border-indigo-500/40',
    amber: 'focus:ring-amber-500/20 focus:border-amber-500/40',
    purple: 'focus:ring-purple-500/20 focus:border-purple-500/40'
  };
  return `w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 ${accentRing[accentColor]} transition-all hover:bg-white/[0.05]`;
};

export const selectCls = (accentColor: 'emerald' | 'indigo' | 'amber' | 'purple' = 'emerald') => {
  const accentRing = {
    emerald: 'focus:ring-emerald-500/20 focus:border-emerald-500/40',
    indigo: 'focus:ring-indigo-500/20 focus:border-indigo-500/40',
    amber: 'focus:ring-amber-500/20 focus:border-amber-500/40',
    purple: 'focus:ring-purple-500/20 focus:border-purple-500/40'
  };
  return `w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 ${accentRing[accentColor]} transition-all hover:bg-white/[0.05] appearance-none cursor-pointer`;
};

export function SubmitBtn({ 
  loading, 
  label = 'Save Record',
  accentColor = 'emerald'
}: { 
  loading: boolean; 
  label?: string;
  accentColor?: 'emerald' | 'indigo' | 'amber' | 'purple';
}) {
  const accentBg = {
    emerald: 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]',
    indigo: 'bg-indigo-500 hover:bg-indigo-400 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)]',
    amber: 'bg-amber-500 hover:bg-amber-400 shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)]',
    purple: 'bg-purple-500 hover:bg-purple-400 shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)]'
  };

  return (
    <button
      type="submit"
      disabled={loading}
      className={`group relative w-full flex items-center justify-center gap-3 py-5 ${accentBg[accentColor]} disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition-all mt-6 overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      <span className="uppercase tracking-widest">{label}</span>
    </button>
  );
}
