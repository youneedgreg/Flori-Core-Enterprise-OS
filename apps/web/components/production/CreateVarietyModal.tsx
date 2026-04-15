/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Sprout, Save, Ruler, Clock, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, SubmitBtn } from '../sales/SalesUI';

interface CreateVarietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  onSuccess: () => void;
}

export default function CreateVarietyModal({ 
  isOpen, 
  onClose, 
  apiBase, 
  onSuccess 
}: CreateVarietyModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    targetStemLength: 60,
    bloomTime: 12, // in weeks
    marketGrade: 'A',
    targetStemCountPerSqm: 28,
  });

  if (!isOpen) return null;

  const getAuthHeader = () => {
    const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
    const token = tokenMatch?.[1];
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a variety name');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/varieties`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...formData,
          targetStemLength: Number(formData.targetStemLength),
          bloomTime: Number(formData.bloomTime) * 7, // Convert weeks to days
          targetStemCountPerSqm: Number(formData.targetStemCountPerSqm),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create variety');
      }

      toast.success(`${formData.name} added to genetic inventory`);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        targetStemLength: 60,
        bloomTime: 12,
        marketGrade: 'A',
        targetStemCountPerSqm: 28,
      });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create variety');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title="Add New Flower Variety"
      subtitle="Define genetic parameters for a new rose variety."
      onClose={onClose}
      accentColor="indigo"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField label="Variety Name *">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Red Naomi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls('indigo')}
                required
              />
              <Sprout className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Target Length (cm)">
              <div className="relative">
                <input
                  type="number"
                  value={formData.targetStemLength}
                  onChange={(e) => setFormData({ ...formData, targetStemLength: Number(e.target.value) })}
                  className={inputCls('indigo')}
                />
                <Ruler className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>

            <FormField label="Bloom Time (Weeks)">
              <div className="relative">
                <input
                  type="number"
                  value={formData.bloomTime}
                  onChange={(e) => setFormData({ ...formData, bloomTime: Number(e.target.value) })}
                  className={inputCls('indigo')}
                />
                <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <FormField label="Market Grade">
              <select
                value={formData.marketGrade}
                onChange={(e) => setFormData({ ...formData, marketGrade: e.target.value })}
                className={inputCls('indigo')}
              >
                <option value="A" className="bg-slate-900">Grade A</option>
                <option value="B" className="bg-slate-900">Grade B</option>
                <option value="C" className="bg-slate-900">Grade C</option>
              </select>
            </FormField>

            <FormField label="Target Stems / m²">
              <div className="relative">
                <input
                  type="number"
                  value={formData.targetStemCountPerSqm}
                  onChange={(e) => setFormData({ ...formData, targetStemCountPerSqm: Number(e.target.value) })}
                  className={inputCls('indigo')}
                />
                <BarChart className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50" />
              </div>
            </FormField>
          </div>
        </div>

        <div className="pt-4">
          <SubmitBtn 
            loading={submitting} 
            label="Save Variety" 
            accentColor="indigo" 
          />
        </div>
      </form>
    </PremiumModal>
  );
}
