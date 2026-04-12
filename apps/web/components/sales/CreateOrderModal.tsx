/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumModal, FormField, inputCls, selectCls, SubmitBtn } from './SalesUI';

interface ATPItem {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  atp: number;
}

interface Customer {
  id: string;
  name: string;
  country: string;
}

interface LineItem {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  quantity: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  getAuthHeader: () => { Authorization: string } | null;
  onSuccess: () => void;
}

const ORDER_TYPES = [
  { value: 'SPOT_ORDER', label: 'Spot Order' },
  { value: 'EXPORT_CONTRACT', label: 'Export Contract' },
  { value: 'STANDING_ORDER', label: 'Standing Order' },
];

const TEMPLATE_FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

function emptyItem(): LineItem {
  return { varietyId: '', varietyName: '', grade: '', bunchSize: 0, bunchesPerBox: 0, quantity: 1 };
}

export function CreateOrderModal({ isOpen, onClose, apiBase, getAuthHeader, onSuccess }: CreateOrderModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 fields
  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState('SPOT_ORDER');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateFrequency, setTemplateFrequency] = useState('WEEKLY');
  const [totalAmount, setTotalAmount] = useState('');

  // Step 2 fields
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [atpData, setAtpData] = useState<ATPItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const headers = getAuthHeader();
    if (!headers) return;

    Promise.all([
      fetch(`${apiBase}/sales/customers`, { headers }).then((r) => r.json()),
      fetch(`${apiBase}/inventory/atp`, { headers }).then((r) => r.json()),
    ]).then(([c, a]) => {
      setCustomers(Array.isArray(c) ? c : []);
      setAtpData(Array.isArray(a) ? a : []);
    }).catch(() => toast.error('Failed to load form data'));
  }, [isOpen]);

  // Unique varieties from ATP
  const varieties = Array.from(
    new Map(atpData.map((a) => [a.varietyId, { id: a.varietyId, name: a.varietyName }])).values()
  );

  function gradesForVariety(varietyId: string) {
    return atpData.filter((a) => a.varietyId === varietyId);
  }

  function atpForItem(item: LineItem) {
    return atpData.find(
      (a) =>
        a.varietyId === item.varietyId &&
        a.grade === item.grade &&
        a.bunchSize === item.bunchSize &&
        a.bunchesPerBox === item.bunchesPerBox
    );
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleVarietyChange(index: number, varietyId: string) {
    const variety = varieties.find((v) => v.id === varietyId);
    updateItem(index, {
      varietyId,
      varietyName: variety?.name ?? '',
      grade: '',
      bunchSize: 0,
      bunchesPerBox: 0,
    });
  }

  function handleGradeChange(index: number, grade: string) {
    const item = items[index];
    const match = atpData.find((a) => a.varietyId === item.varietyId && a.grade === grade);
    if (match) {
      updateItem(index, {
        grade,
        bunchSize: match.bunchSize,
        bunchesPerBox: match.bunchesPerBox,
      });
    }
  }

  async function handleSubmit() {
    if (!customerId) { toast.error('Select a customer'); return; }
    if (items.some((i) => !i.varietyId || !i.grade || i.quantity < 1)) {
      toast.error('Complete all line items');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/sales/orders`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          type: orderType,
          items,
          totalAmount: parseFloat(totalAmount) || 0,
          currency,
          deliveryDate: deliveryDate || undefined,
          notes: notes || undefined,
          isTemplate,
          templateFrequency: isTemplate ? templateFrequency : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create order');
      }
      toast.success(isTemplate ? 'Order template created' : 'Draft order created');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PremiumModal
      title={isTemplate ? "Configure Order Template" : "Draft New Sales Order"}
      subtitle={step === 1 ? "Step 1: General Details" : "Step 2: Line Items & Inventory"}
      onClose={onClose}
    >
      <div className="space-y-8">
        {step === 1 ? (
          <div className="space-y-6">
            <FormField label="Target Customer *">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={selectCls()}
              >
                <option value="" className="bg-slate-950">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-950">{c.name} {c.country ? `(${c.country})` : ''}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Sales Agreement Type *">
              <div className="flex gap-3 flex-wrap">
                {ORDER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setOrderType(t.value)}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      orderType === t.value
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-6">
              <FormField label="Requested Delivery">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Contract Currency">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={selectCls()}
                >
                  {['USD', 'EUR', 'GBP', 'KES'].map((c) => (
                    <option key={c} value={c} className="bg-slate-950">{c}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label={`Total value (${currency})`}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls()}
              />
            </FormField>

            <FormField label="Strategic Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal order notes..."
                className={`${inputCls()} resize-none`}
              />
            </FormField>

            {/* Template toggle */}
            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/10">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">Recurring Template</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Enable for standing orders</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplate(!isTemplate)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isTemplate ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isTemplate ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {isTemplate && (
              <FormField label="Template Recurrence">
                <div className="flex gap-3">
                  {TEMPLATE_FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTemplateFrequency(f.value)}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        templateFrequency === f.value
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </FormField>
            )}

            <button
              onClick={() => {
                if (!customerId) { toast.error('Select a customer'); return; }
                setStep(2);
              }}
              className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-500 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] uppercase tracking-widest"
            >
              Continue to Line Items
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Line Items */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const grades = gradesForVariety(item.varietyId);
                const atp = atpForItem(item);
                const atpStatus = !atp ? null : atp.atp === 0 ? 'none' : atp.atp < item.quantity ? 'low' : 'ok';

                return (
                  <div key={index} className="p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden group/item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-black">
                           {index + 1}
                         </div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Line Item Specification</span>
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                          className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Plant Variety">
                        <select
                          value={item.varietyId}
                          onChange={(e) => handleVarietyChange(index, e.target.value)}
                          className={selectCls()}
                        >
                          <option value="" className="bg-slate-900">Select variety...</option>
                          {varieties.map((v) => (
                            <option key={v.id} value={v.id} className="bg-slate-900">{v.name}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Grade & Spec">
                        <select
                          value={item.grade}
                          onChange={(e) => handleGradeChange(index, e.target.value)}
                          disabled={!item.varietyId}
                          className={selectCls()}
                        >
                          <option value="" className="bg-slate-900">Select grade...</option>
                          {grades.map((g) => (
                            <option key={`${g.grade}-${g.bunchSize}-${g.bunchesPerBox}`} value={g.grade} className="bg-slate-900">
                              Grade {g.grade} · {g.bunchSize}s/{g.bunchesPerBox}/box
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <FormField label="Quantity (boxes)">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                          className={inputCls()}
                        />
                      </FormField>
                      <div className="pb-4">
                        {atp && (
                          <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                            atpStatus === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                            atpStatus === 'low' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                          }`}>
                            <div className="w-2 h-2 rounded-full animate-pulse bg-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              ATP: {atp.atp} boxes available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-[10px] font-black uppercase tracking-widest group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Agreement Row
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep(1)}
                className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Back to Details
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="relative py-5 rounded-2xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                 <ShoppingBag className="w-4 h-4" />
                 {submitting ? 'Processing...' : isTemplate ? 'Execute Template' : 'Commit Draft'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PremiumModal>
  );
}
