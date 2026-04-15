/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Bug, FlaskConical, Microscope } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';
import { decodeJWT } from '../../lib/auth';

type ReportType = 'scouting' | 'soil_test';

const SEVERITY_LEVELS = [
  { value: 'LOW', label: 'Low — Minor presence, monitoring only' },
  { value: 'MEDIUM', label: 'Medium — Moderate presence, action advised' },
  { value: 'HIGH', label: 'High — Significant infestation, action required' },
  { value: 'CRITICAL', label: 'Critical — Severe, immediate intervention' },
];

const SOIL_TYPES = ['Sandy Loam', 'Clay Loam', 'Loam', 'Silty Loam', 'Sandy Clay', 'Clay', 'Silt'];

interface FieldReportModalProps {
  zoneId: string;
  zoneName: string;
  defaultType?: ReportType;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function FieldReportModal({
  zoneId,
  zoneName,
  defaultType = 'scouting',
  onClose,
  apiBase,
  onSuccess,
}: FieldReportModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(defaultType);
  const today = new Date().toISOString().split('T')[0];

  // Scouting fields
  const [scoutDate, setScoutDate] = useState(today);
  const [pestName, setPestName] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [observations, setObservations] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  // Soil test fields
  const [testDate, setTestDate] = useState(today);
  const [phLevel, setPhLevel] = useState('');
  const [ecLevel, setEcLevel] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [soilType, setSoilType] = useState('');
  const [soilNotes, setSoilNotes] = useState('');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const userId = decodeJWT(token)?.sub;

    setSubmitting(true);
    try {
      if (reportType === 'scouting') {
        if (!observations.trim()) { toast.error('Observations are required'); setSubmitting(false); return; }
        const res = await fetch(`${apiBase}/farm-operations/scouting-reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            zoneId,
            date: scoutDate,
            pestDiseaseName: pestName || undefined,
            severity,
            observations,
            actionTaken: actionTaken || undefined,
            inspectorId: userId,
          }),
        });
        if (!res.ok) throw new Error('Failed to save scouting report');
        toast.success(`Scouting report logged for ${zoneName}`);
      } else {
        const res = await fetch(`${apiBase}/farm-operations/soil-tests`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            zoneId,
            testDate,
            pHLevel: phLevel ? parseFloat(phLevel) : undefined,
            ecLevel: ecLevel ? parseFloat(ecLevel) : undefined,
            nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
            phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
            potassium: potassium ? parseFloat(potassium) : undefined,
            soilType: soilType || undefined,
            notes: soilNotes || undefined,
          }),
        });
        if (!res.ok) throw new Error('Failed to save soil test');
        toast.success(`Soil test logged for ${zoneName}`);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Log Field Report"
      subtitle={`Recording field observation data for ${zoneName}`}
      onClose={onClose}
      accentColor="amber"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Report Type Toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => setReportType('scouting')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              reportType === 'scouting' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            Scouting Report
          </button>
          <button
            type="button"
            onClick={() => setReportType('soil_test')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              reportType === 'soil_test' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            Soil Test
          </button>
        </div>

        {reportType === 'scouting' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Date *" accentColor="amber">
                <input
                  type="date"
                  value={scoutDate}
                  onChange={(e) => setScoutDate(e.target.value)}
                  className={inputCls('amber')}
                  required
                />
              </FormField>
              <FormField label="Severity *" accentColor="amber">
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectCls('amber')}>
                  {SEVERITY_LEVELS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Pest / Disease Name" accentColor="amber">
              <div className="relative">
                <input
                  type="text"
                  value={pestName}
                  onChange={(e) => setPestName(e.target.value)}
                  placeholder="e.g. Botrytis, Aphids, Powdery Mildew"
                  className={inputCls('amber')}
                />
                <Bug className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40" />
              </div>
            </FormField>

            <FormField label="Observations *" accentColor="amber">
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Describe what was observed — location, spread, affected plants, symptoms..."
                rows={3}
                className={`${inputCls('amber')} resize-none`}
                required
              />
            </FormField>

            <FormField label="Action Taken" accentColor="amber">
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Any immediate actions taken or recommended treatment..."
                rows={2}
                className={`${inputCls('amber')} resize-none`}
              />
            </FormField>
          </div>
        ) : (
          <div className="space-y-6">
            <FormField label="Test Date *" accentColor="amber">
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className={inputCls('amber')}
                required
              />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="pH Level" accentColor="amber">
                <input
                  type="number" step="0.01" min="0" max="14"
                  value={phLevel}
                  onChange={(e) => setPhLevel(e.target.value)}
                  placeholder="6.5"
                  className={inputCls('amber')}
                />
              </FormField>
              <FormField label="EC Level (dS/m)" accentColor="amber">
                <input
                  type="number" step="0.01" min="0"
                  value={ecLevel}
                  onChange={(e) => setEcLevel(e.target.value)}
                  placeholder="1.2"
                  className={inputCls('amber')}
                />
              </FormField>
              <FormField label="Soil Type" accentColor="amber">
                <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className={selectCls('amber')}>
                  <option value="" className="bg-slate-900">Select...</option>
                  {SOIL_TYPES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">{s}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">NPK Levels (mg/kg)</p>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Nitrogen (N)" accentColor="amber">
                  <div className="relative">
                    <input type="number" step="0.1" min="0" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} placeholder="0" className={inputCls('amber')} />
                    <FlaskConical className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                  </div>
                </FormField>
                <FormField label="Phosphorus (P)" accentColor="amber">
                  <input type="number" step="0.1" min="0" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} placeholder="0" className={inputCls('amber')} />
                </FormField>
                <FormField label="Potassium (K)" accentColor="amber">
                  <input type="number" step="0.1" min="0" value={potassium} onChange={(e) => setPotassium(e.target.value)} placeholder="0" className={inputCls('amber')} />
                </FormField>
              </div>
            </div>

            <FormField label="Notes" accentColor="amber">
              <textarea
                value={soilNotes}
                onChange={(e) => setSoilNotes(e.target.value)}
                placeholder="Additional observations about soil structure, colour, moisture..."
                rows={2}
                className={`${inputCls('amber')} resize-none`}
              />
            </FormField>
          </div>
        )}

        <div className="pt-4">
          <SubmitBtn
            loading={submitting}
            label={reportType === 'scouting' ? 'Submit Scouting Report' : 'Save Soil Test'}
            accentColor="amber"
          />
        </div>
      </form>
    </PremiumModal>
  );
}
