'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCreated: () => void;
}

const SENSOR_TYPES = [
  { value: 'MOISTURE', label: 'Soil Moisture (%)' },
  { value: 'TEMPERATURE', label: 'Ambient Temp (°C)' },
  { value: 'EC', label: 'Electrical Conductivity (mS/cm)' },
  { value: 'PH', label: 'Soil pH' },
];

const OPERATORS = [
  { value: 'LT', label: 'Less Than (<)' },
  { value: 'GT', label: 'Greater Than (>)' },
  { value: 'EQ', label: 'Exactly Equal (=)' },
];

const ACTIONS = [
  { value: 'NOTIFY', label: 'Send Alert Notification' },
  { value: 'IRRIGATE_ON', label: 'Activate Irrigation Valve' },
];

export default function RuleBuilderModal({ isOpen, onClose, onRuleCreated }: RuleBuilderModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sensorType: 'MOISTURE',
    operator: 'LT',
    threshold: 30,
    action: 'NOTIFY',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/automation-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create rule');

      toast.success('Automation rule created successfully');
      onRuleCreated();
      onClose();
    } catch (err) {
      toast.error('Error creating automation rule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-brand-dark/90 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-brand-green/20 rounded-2xl text-brand-green">
                  <Activity className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">New Automation</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Define conditional triggers</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Rule Name</label>
              <input 
                required
                type="text"
                placeholder="e.g. Low Moisture Warning"
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-green outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Sensor Type</label>
                 <select 
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-green outline-none transition-all appearance-none"
                   value={formData.sensorType}
                   onChange={(e) => setFormData({...formData, sensorType: e.target.value})}
                 >
                   {SENSOR_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Condition</label>
                 <select 
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-green outline-none transition-all appearance-none"
                   value={formData.operator}
                   onChange={(e) => setFormData({...formData, operator: e.target.value})}
                 >
                   {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                 </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Threshold Value</label>
                 <input 
                   required
                   type="number"
                   step="0.1"
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-green outline-none transition-all"
                   value={formData.threshold}
                   onChange={(e) => setFormData({...formData, threshold: Number(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Resulting Action</label>
                 <select 
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-green outline-none transition-all appearance-none"
                   value={formData.action}
                   onChange={(e) => setFormData({...formData, action: e.target.value})}
                 >
                   {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                 </select>
               </div>
            </div>

            <div className="bg-brand-green/5 border border-brand-green/10 p-4 rounded-2xl flex gap-4">
              <AlertCircle className="w-5 h-5 text-brand-green shrink-0" />
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                When the <span className="text-white italic">{SENSOR_TYPES.find(s => s.value === formData.sensorType)?.label}</span> is 
                <span className="text-white italic"> {OPERATORS.find(o => o.value === formData.operator)?.label} </span> 
                than <span className="text-brand-green font-black">{formData.threshold}</span>, 
                the system will <span className="text-white italic underline font-black">{ACTIONS.find(a => a.value === formData.action)?.label}</span>.
              </p>
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={loading}
                type="submit"
                className="flex-2 py-4 bg-brand-green text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Rule
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
