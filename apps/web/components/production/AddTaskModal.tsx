/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ClipboardList, Calendar, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from '../sales/SalesUI';

const SCHEDULE_TYPES = [
  { value: 'SPRAY',      label: 'Spray Application',   color: 'text-rose-400' },
  { value: 'FERTILIZER', label: 'Fertilizer / Fertigation', color: 'text-blue-400' },
  { value: 'PRUNING',    label: 'Pruning / Pinching',   color: 'text-amber-400' },
  { value: 'OTHER',      label: 'Other Task',           color: 'text-slate-400' },
];

interface CycleOption {
  id: string;
  variety: { name: string };
  zone?: { name: string };
}

interface AddTaskModalProps {
  cycleId?: string;        // Pre-selected if called from cycle detail
  cycleName?: string;
  cycles?: CycleOption[];  // Available cycles for selection if cycleId not set
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function AddTaskModal({ cycleId, cycleName, cycles = [], onClose, apiBase, onSuccess }: AddTaskModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [selectedCycleId, setSelectedCycleId] = useState(cycleId ?? '');
  const [taskName, setTaskName] = useState('');
  const [type, setType] = useState('SPRAY');
  const [scheduledDate, setScheduledDate] = useState(tomorrow);
  const [notes, setNotes] = useState('');

  const getToken = () => document.cookie.match(/access_token=([^;]+)/)?.[1] ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveCycleId = cycleId ?? selectedCycleId;
    if (!effectiveCycleId) { toast.error('Please select a crop cycle'); return; }
    if (!taskName.trim()) { toast.error('Task name is required'); return; }

    const token = getToken();
    if (!token) { toast.error('Session expired.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/crop-schedules`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropCycleId: effectiveCycleId,
          taskName: taskName.trim(),
          type,
          scheduledDate,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      toast.success(`Task "${taskName}" scheduled`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Schedule Task"
      subtitle={cycleName ? `Adding task for ${cycleName}` : 'Schedule an agronomy or compliance task'}
      onClose={onClose}
      accentColor="indigo"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Cycle selector if not pre-selected */}
          {!cycleId && (
            <FormField label="Crop Cycle *" accentColor="indigo">
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className={selectCls('indigo')}
                required
              >
                <option value="" className="bg-slate-900">Select a cycle...</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.variety.name}{c.zone ? ` · ${c.zone.name}` : ''}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Task Name *" accentColor="indigo">
            <div className="relative">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Apply Fungicide, Pinch Suckers, NPK Top-dress"
                className={inputCls('indigo')}
                required
              />
              <ClipboardList className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Task Type *" accentColor="indigo">
              <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls('indigo')}>
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Scheduled Date *" accentColor="indigo">
              <div className="relative">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={inputCls('indigo')}
                  required
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>

          <FormField label="Notes" accentColor="indigo">
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Chemical name, dosage, special instructions..."
                rows={2}
                className={`${inputCls('indigo')} resize-none`}
              />
              <StickyNote className="absolute right-5 top-4 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>
        </div>

        <div className="pt-4">
          <SubmitBtn loading={submitting} label="Schedule Task" accentColor="indigo" />
        </div>
      </form>
    </PremiumModal>
  );
}
