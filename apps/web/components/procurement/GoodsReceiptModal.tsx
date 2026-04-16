/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Package, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface POItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  item: { name: string; sku: string; unit: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  vendor: { name: string };
  items: POItem[];
}

interface GoodsReceiptModalProps {
  onClose: () => void;
  onSuccess: () => void;
  apiBase: string;
  getAuthHeader: () => Record<string, string> | null;
  initialPo?: PurchaseOrder | null;
}

export function GoodsReceiptModal({ onClose, onSuccess, apiBase, getAuthHeader, initialPo }: GoodsReceiptModalProps) {
  const [step, setStep] = useState<'SCAN' | 'FORM'>(initialPo ? 'FORM' : 'SCAN');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(initialPo ?? null);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualPoNumber, setManualPoNumber] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/50 transition-colors';

  // Pre-populate received items when initialPo is provided
  useEffect(() => {
    if (initialPo) {
      setReceivedItems(initialPo.items.map(item => ({
        itemId: item.itemId,
        poItemId: item.id,
        name: item.item.name,
        sku: item.item.sku,
        unit: item.item.unit,
        expectedQty: item.quantity,
        expectedPrice: item.unitPrice,
        quantityReceived: item.quantity,
        unitPriceReceived: item.unitPrice,
        notes: ''
      })));
    }
  }, [initialPo]);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  function onScanSuccess(decodedText: string) {
    void fetchPoByNumber(decodedText);
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  const fetchPoByNumber = async (poNumber: string) => {
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);
    try {
      // Find PO by number
      const res = await fetch(`${apiBase}/procurement/purchase-orders?status=SENT`, { headers });
      if (!res.ok) throw new Error('Failed to fetch POs');
      const pos: PurchaseOrder[] = await res.json();
      const po = pos.find(p => p.poNumber === poNumber || p.id === poNumber);
      
      if (po) {
        handlePoSelection(po);
      } else {
        toast.error('Purchase Order not found or not in SENT status');
      }
    } catch (err) {
      toast.error('Failed to resolve PO');
    } finally {
      setLoading(false);
    }
  };

  const handlePoSelection = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setReceivedItems(po.items.map(item => ({
      itemId: item.itemId,
      poItemId: item.id,
      name: item.item.name,
      sku: item.item.sku,
      unit: item.item.unit,
      expectedQty: item.quantity,
      expectedPrice: item.unitPrice,
      quantityReceived: item.quantity,
      unitPriceReceived: item.unitPrice,
      notes: ''
    })));
    setStep('FORM');
    if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
    }
    setScanning(false);
  };

  const submitReceipt = async () => {
    if (!selectedPo) return;
    const headers = getAuthHeader();
    if (!headers) return;
    setLoading(true);

    try {
      const body = {
        items: receivedItems.map(i => ({
          itemId: i.itemId,
          poItemId: i.poItemId,
          quantityReceived: Number(i.quantityReceived),
          unitPriceReceived: Number(i.unitPriceReceived),
          notes: i.notes
        }))
      };

      const res = await fetch(`${apiBase}/procurement/purchase-orders/${selectedPo.id}/receive`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error((await res.json()).message || 'Receipt failed');
      
      const result = await res.json();
      if (result.status === 'DISCREPANCY') {
        toast.warning('Goods received with discrepancies. Flagged for accountant review.');
      } else {
        toast.success(`GRN ${result.grnNumber} created successfully`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col">
        
        <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
              Goods <span className="text-emerald-400">Receipt</span>
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              {step === 'SCAN' ? 'Scan PO Barcode or QR to Begin' : `Processing ${selectedPo?.poNumber}`}
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {step === 'SCAN' && (
            <div className="space-y-8 flex flex-col items-center">
              {!scanning ? (
                <div className="text-center space-y-8 w-full max-w-md">
                   <div className="w-32 h-32 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                     <Camera className="w-12 h-12 text-emerald-500" />
                   </div>
                   <button 
                    onClick={() => setScanning(true)}
                    className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all"
                   >
                     Initialize Scanner
                   </button>
                   
                   <div className="flex items-center gap-4 py-4">
                     <div className="h-px bg-white/5 flex-1" />
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">or Manual Entry</span>
                     <div className="h-px bg-white/5 flex-1" />
                   </div>

                   <div className="flex gap-3">
                     <input 
                       className={inputCls}
                       placeholder="Enter PO Number..."
                       value={manualPoNumber}
                       onChange={(e) => setManualPoNumber(e.target.value)}
                     />
                     <button 
                       onClick={() => void fetchPoByNumber(manualPoNumber)}
                       disabled={!manualPoNumber || loading}
                       className="px-6 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10 disabled:opacity-50 transition-all"
                     >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                     </button>
                   </div>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-4">
                  <div id="reader" className="overflow-hidden rounded-3xl border border-white/20 bg-black shadow-inner" />
                  <button 
                    onClick={() => setScanning(false)}
                    className="w-full py-4 bg-white/5 text-slate-400 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel Scanning
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'FORM' && selectedPo && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vendor</p>
                  <p className="text-lg font-black text-white uppercase">{selectedPo.vendor.name}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Items in PO</p>
                  <p className="text-lg font-black text-white">{selectedPo.items.length}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">PO Status</p>
                  <span className="text-xs font-black text-cyan-400 uppercase">{selectedPo.status}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package className="w-4 h-4" /> Item Reconciliation
                </h3>
                
                <div className="bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PO Expected</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[150px]">Received Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[150px]">Rec. Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {receivedItems.map((item, idx) => {
                        const qtyMatch = Math.abs(item.quantityReceived - item.expectedQty) <= item.expectedQty * 0.01;
                        const priceMatch = Math.abs(item.unitPriceReceived - item.expectedPrice) <= item.expectedPrice * 0.01;
                        const ok = qtyMatch && priceMatch;

                        return (
                          <tr key={idx} className="hover:bg-white/2 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-white">{item.name}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase">{item.sku}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-slate-400">
                                {item.expectedQty} {item.unit} @ KES {item.expectedPrice}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:border-emerald-500/50 outline-none"
                                value={item.quantityReceived}
                                onChange={(e) => {
                                  const newItems = [...receivedItems];
                                  newItems[idx].quantityReceived = Number(e.target.value);
                                  setReceivedItems(newItems);
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:border-emerald-500/50 outline-none"
                                value={item.unitPriceReceived}
                                onChange={(e) => {
                                  const newItems = [...receivedItems];
                                  newItems[idx].unitPriceReceived = Number(e.target.value);
                                  setReceivedItems(newItems);
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              {ok ? (
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">OK</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-amber-500">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Mismatch</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="px-10 py-8 border-t border-white/5 flex gap-4 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={step === 'SCAN' ? () => setStep('FORM') : submitReceipt}
            disabled={loading || (step === 'FORM' && !selectedPo)}
            className="flex-[2] py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              step === 'SCAN' ? 'Skip to Manual Form' : 'Complete Goods Receipt'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
