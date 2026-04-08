/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Award, 
  Globe, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';
import { PricingTrendChart } from './PricingTrendChart';

interface PerformanceData {
  otdScore: number;
  totalOrders: number;
  qualityComplaints: number;
  history: any[];
}

interface VendorDetailModalProps {
  vendor: any;
  onClose: () => void;
  api: string;
  headers: any;
}

export function VendorDetailModal({ vendor, onClose, api, headers }: VendorDetailModalProps) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [pricingTrend, setPricingTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemForTrend, setSelectedItemForTrend] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const perfRes = await fetch(`${api}/procurement/vendors/${vendor.id}/performance`, { headers });
        if (perfRes.ok) setPerformance(await perfRes.json());

        // Default to first store item if available for trend
        if (vendor.storeItems?.length > 0) {
          const itemId = vendor.storeItems[0].id;
          setSelectedItemForTrend(itemId);
          const trendRes = await fetch(`${api}/procurement/vendors/${vendor.id}/pricing-trend?itemId=${itemId}`, { headers });
          if (trendRes.ok) setPricingTrend(await trendRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch vendor data', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [vendor.id, api, headers, vendor.storeItems]);

  const bank = vendor.bankDetails as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="bg-brand-dark/95 backdrop-blur-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Left Column: Basic Info & Bank */}
          <div className="md:w-1/3 space-y-8">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic leading-none">{vendor.name}</h2>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-2">{vendor.contactPerson ?? 'No contact person'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-black uppercase">{vendor.email}</span>
              </div>
              {vendor.phone && (
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-black uppercase">{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-3 text-emerald-400">
                  <Globe className="w-4 h-4" />
                  <a href={vendor.website} target="_blank" rel="noreferrer" className="text-xs font-black uppercase hover:underline">{vendor.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-3 text-slate-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-black uppercase">{vendor.address}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Bank Details</h3>
              </div>
              {bank ? (
                <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bank Name</p>
                  <p className="text-xs font-black text-white uppercase">{bank.bankName ?? '—'}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Account Number</p>
                  <p className="text-xs font-black text-white tracking-widest">{bank.accountNo ?? '—'}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Branch</p>
                      <p className="text-xs font-black text-white uppercase">{bank.branch ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SWIFT</p>
                      <p className="text-xs font-black text-white uppercase">{bank.swiftCode ?? '—'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-600 uppercase italic">No bank details provided</p>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Certifications</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {vendor.certifications && vendor.certifications.length > 0 ? (
                  vendor.certifications.map((c: string) => (
                    <span key={c} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest">
                      {c}
                    </span>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-slate-600 uppercase italic">No certifications logged</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Performance & Trends */}
          <div className="flex-1 space-y-10">
            {/* Performance Scorecards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">On-Time Delivery</p>
                </div>
                <p className="text-3xl font-black text-white">{performance ? `${Math.round(performance.otdScore)}%` : '—'}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Complaints</p>
                </div>
                <p className="text-3xl font-black text-white">{performance ? performance.qualityComplaints : '—'}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Orders</p>
                </div>
                <p className="text-3xl font-black text-white">{performance ? performance.totalOrders : '—'}</p>
              </div>
            </div>

            {/* Pricing Trend Chart */}
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <PricingTrendChart 
                data={pricingTrend} 
                itemName={vendor.storeItems?.find((i: any) => i.id === selectedItemForTrend)?.name ?? 'Selected Item'} 
              />
              
              {vendor.storeItems?.length > 1 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Compare Other Items</p>
                  <div className="flex flex-wrap gap-2">
                    {vendor.storeItems.map((item: any) => (
                      <button 
                        key={item.id}
                        onClick={() => setSelectedItemForTrend(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          selectedItemForTrend === item.id 
                            ? 'bg-emerald-500 text-slate-950 shadow-lg' 
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reliability Insights */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Vendor Insights
              </h3>
              <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                    Vendor maintains a {performance ? Math.round(performance.otdScore) : 'high'}% on-time delivery rate, ensuring critical supply chain continuity for farm inputs.
                  </p>
               </div>
               <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 flex items-start gap-4">
                  <TrendingUp className="w-5 h-5 text-blue-400 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                    Price consistency across the last {performance?.totalOrders ?? 5} POs indicates stable contract pricing with minimal market volatility exposure.
                  </p>
               </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
