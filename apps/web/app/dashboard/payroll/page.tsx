'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Banknote, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Calendar,
  Download,
  ShieldCheck,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface PayrollRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  period: string;
  paymentDate: string | null;
  createdAt: string;
  user: {
    email: string;
    role: { name: string };
  };
}

interface PayrollSummary {
  totalPaid: number;
  totalPending: number;
  totalStaff: number;
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({ totalPaid: 0, totalPending: 0, totalStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [recordsRes, summaryRes] = await Promise.all([
        fetch(`${API}/payroll`, { headers }),
        fetch(`${API}/payroll/summary`, { headers })
      ]);

      if (recordsRes.status === 401 || summaryRes.status === 401) {
        logout();
        return;
      }

      if (recordsRes.ok && summaryRes.ok) {
        setRecords(await recordsRes.json());
        setSummary(await summaryRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcessPayment = async (id: string) => {
    setIsProcessing(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/payroll/${id}/pay`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Payment disbursed successfully');
        fetchData();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Payment process failed:', err);
      toast.error('Could not process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Banknote className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Payroll</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Enterprise disbursement station for the Flori-Core workforce. Secured by Bank-Grade encryption.</p>
        </div>

        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">
             <Download className="w-4 h-4" />
             Export Report
           </button>
           <button className="flex items-center gap-2 px-8 py-4 bg-brand-green hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-[10px] transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest">
             <ShieldCheck className="w-4 h-4" />
             Authorize Bulk
           </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-brand-green/30 transition-all shadow-xl">
          <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Total Liabilities</p>
          <h4 className="text-4xl font-black text-white mb-2 tracking-tighter">KES {summary.totalPending.toLocaleString()}</h4>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-[0.15em]">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Disbursement
          </div>
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <Wallet className="w-16 h-16" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-brand-green/30 transition-all shadow-xl">
          <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Successful Payouts</p>
          <h4 className="text-4xl font-black text-white mb-2 tracking-tighter">KES {summary.totalPaid.toLocaleString()}</h4>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-green uppercase tracking-[0.15em]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed This Period
          </div>
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <CreditCard className="w-16 h-16" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-brand-green/30 transition-all shadow-xl">
          <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Active Staff</p>
          <h4 className="text-4xl font-black text-white mb-2 tracking-tighter">{summary.totalStaff}</h4>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em]">
            <Users className="w-3.5 h-3.5" />
            Registered Workforce
          </div>
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16" />
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Employee</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Manifest Period</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Total Amount</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] text-right">Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 animate-pulse tracking-widest uppercase italic">Decrypting Financial Data...</p>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No payroll records found for this period.</p>
                </td>
              </tr>
            ) : records.map((record) => (
              <tr key={record.id} className="hover:bg-white/2 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 font-black text-brand-green uppercase">
                      {record.user.email.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{record.user.email}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{record.user.role.name.replace('_', ' ')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-slate-600" />
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">{record.period}</p>
                  </div>
                </td>
                <td className="px-8 py-6 font-black text-sm text-white">
                  {record.currency} {record.amount.toLocaleString()}
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    record.status === 'PAID' ? 'bg-emerald-500/10 text-brand-green border-brand-green/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {record.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {record.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  {record.status === 'PENDING' ? (
                    <button 
                      onClick={() => handleProcessPayment(record.id)}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-white hover:bg-brand-green text-slate-950 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest shadow-lg flex items-center gap-1.5 ml-auto group"
                    >
                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
                      Disburse Now
                    </button>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 text-brand-green opacity-60">
                      <span className="text-[10px] font-black tracking-widest uppercase">Settled on {new Date(record.paymentDate!).toLocaleDateString()}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
