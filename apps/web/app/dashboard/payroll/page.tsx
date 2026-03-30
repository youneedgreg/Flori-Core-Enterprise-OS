'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Banknote, 
  CreditCard, 
  Users, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Wallet,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  Download,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  const router = useRouter();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({ totalPaid: 0, totalPending: 0, totalStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [recordsRes, summaryRes] = await Promise.all([
        fetch(`${API}/payroll`, { headers }),
        fetch(`${API}/payroll/summary`, { headers })
      ]);

      if (recordsRes.ok && summaryRes.ok) {
        setRecords(await recordsRes.json());
        setSummary(await summaryRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
    } catch (e) {
      toast.error('Could not process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-8 lg:p-12">
        {/* Breadcrumbs */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-500 transition-all mb-8 group uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          General Ledger
        </Link>

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Banknote className="w-6 h-6 text-amber-500" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Payroll</h1>
            </div>
            <p className="text-slate-400 font-bold tracking-tight max-w-xl">Enterprise disbursement station for the Flori-Core workforce. Secured by Bank-Grade encryption.</p>
          </div>

          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">
               <Download className="w-4 h-4" />
               Export Report
             </button>
             <button className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4" />
               Authorize Bulk
             </button>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Total Liabilities</p>
            <h4 className="text-4xl font-black text-white mb-2">KES {summary.totalPending.toLocaleString()}</h4>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-tighter">
              <Clock className="w-3.5 h-3.5" />
              Awaiting Disbursement
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Wallet className="w-16 h-16" />
            </div>
          </div>

          <div className="glass p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Successful Payouts</p>
            <h4 className="text-4xl font-black text-white mb-2">KES {summary.totalPaid.toLocaleString()}</h4>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500 uppercase tracking-tighter">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed This Period
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard className="w-16 h-16" />
            </div>
          </div>

          <div className="glass p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Active Staff</p>
            <h4 className="text-4xl font-black text-white mb-2">{summary.totalStaff}</h4>
            <div className="flex items-center gap-1.5 text-xs font-black text-blue-500 uppercase tracking-tighter">
              <Users className="w-3.5 h-3.5" />
              Registered Workforce
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Main Records Table */}
        <div className="glass rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Employee</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Manifest Period</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Total Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-500 animate-pulse tracking-widest uppercase italic">Decrypting Financial Data...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No payroll records found for this period.</p>
                  </td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 font-black text-emerald-500 uppercase">
                        {record.user.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight">{record.user.email}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{record.user.role.name.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-slate-600" />
                       <p className="text-xs font-black text-white uppercase tracking-wider">{record.period}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-black text-sm text-white">
                    {record.currency} {record.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      record.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
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
                        className="px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] hover:bg-emerald-400 transition-all uppercase tracking-widest shadow-lg flex items-center gap-1.5 ml-auto group"
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
                        Disburse Now
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-emerald-500 opacity-60">
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

      {/* Ambience */}
      <div className="fixed top-0 left-0 -z-10 w-screen h-screen overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-amber-500/5 blur-[200px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}
