/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">
              {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {step === 1 ? 'Order Details' : 'Line Items'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-5">
          {step === 1 ? (
            <>
              {/* Customer */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.country ? `(${c.country})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Order Type */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Order Type *</label>
                <div className="flex gap-3 flex-wrap">
                  {ORDER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setOrderType(t.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        orderType === t.value
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Date + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {['USD', 'EUR', 'GBP', 'KES'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Total Amount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any order notes..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Template toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <p className="text-xs font-black text-white">Save as Template</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Reuse this order as a recurring contract template</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTemplate(!isTemplate)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isTemplate ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isTemplate ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {isTemplate && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Frequency</label>
                  <div className="flex gap-3">
                    {TEMPLATE_FREQUENCIES.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setTemplateFrequency(f.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                          templateFrequency === f.value
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Line Items */}
              <div className="space-y-4">
                {items.map((item, index) => {
                  const grades = gradesForVariety(item.varietyId);
                  const atp = atpForItem(item);
                  const atpStatus = !atp ? null : atp.atp === 0 ? 'none' : atp.atp < item.quantity ? 'low' : 'ok';

                  return (
                    <div key={index} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item {index + 1}</span>
                        {items.length > 1 && (
                          <button
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                            className="text-slate-600 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Variety</label>
                          <select
                            value={item.varietyId}
                            onChange={(e) => handleVarietyChange(index, e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          >
                            <option value="">Select variety...</option>
                            {varieties.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Grade</label>
                          <select
                            value={item.grade}
                            onChange={(e) => handleGradeChange(index, e.target.value)}
                            disabled={!item.varietyId}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-40"
                          >
                            <option value="">Select grade...</option>
                            {grades.map((g) => (
                              <option key={`${g.grade}-${g.bunchSize}-${g.bunchesPerBox}`} value={g.grade}>
                                Grade {g.grade} · {g.bunchSize}s/{g.bunchesPerBox}/box
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Quantity (boxes)</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <div>
                          {atp && (
                            <p className={`text-[10px] font-black uppercase tracking-widest ${
                              atpStatus === 'ok' ? 'text-emerald-400' :
                              atpStatus === 'low' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              Available: {atp.atp} boxes
                            </p>
                          )}
                          {item.bunchSize > 0 && (
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {item.bunchSize} stems/bunch · {item.bunchesPerBox} bunches/box
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all text-xs font-black uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between shrink-0">
          <button
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => {
                if (!customerId) { toast.error('Select a customer'); return; }
                setStep(2);
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Next →
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? 'Creating...' : isTemplate ? 'Save Template' : 'Create Draft'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
