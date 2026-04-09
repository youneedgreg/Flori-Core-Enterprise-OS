/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, CreditCard, Receipt, Plus,
  Search, Filter, CheckCircle, Loader2,
  X, Landmark, Phone, Calendar, ArrowRight,
  TrendingUp, Wallet, Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Tab = 'overview' | 'employees' | 'runs';

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [employees, setEmployees] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Run State
  const [showNewRun, setShowNewRun] = useState(false);
  const [newRun, setNewRun] = useState({ year: CURRENT_YEAR, month: new Date().getMonth() + 1, notes: '' });
  const [creatingRun, setCreatingRun] = useState(false);

  // New Employee State
  const [showNewEmployee, setShowNewEmployee] = useState(false);
  const [newEmp, setNewEmp] = useState({
    firstName: '', lastName: '', employeeNumber: '',
    basicSalary: 0, mpesaPhone: '', department: '', jobTitle: ''
  });
  const [creatingEmp, setCreatingEmp] = useState(false);

  const getHeaders = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    const token = match?.[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = getHeaders();
    if (!headers) return;

    try {
      const [empRes, runsRes] = await Promise.all([
        fetch(`${API}/financials/payroll/employees`, { headers }),
        fetch(`${API}/financials/payroll/runs`, { headers }),
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (runsRes.ok) setRuns(await runsRes.json());
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRun(true);
    const headers = getHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API}/financials/payroll/runs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newRun),
      });

      if (res.ok) {
        toast.success('Payroll run created');
        setShowNewRun(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create run');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCreatingRun(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEmp(true);
    const headers = getHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API}/financials/payroll/employees`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newEmp),
      });

      if (res.ok) {
        toast.success('Employee added');
        setShowNewEmployee(false);
        fetchData();
      } else {
        toast.error('Failed to add employee');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCreatingEmp(false);
    }
  };

  const handleProcessRun = async (runId: string) => {
    const headers = getHeaders();
    if (!headers) return;

    toast.promise(
      fetch(`${API}/financials/payroll/runs/${runId}/process`, {
        method: 'POST',
        headers,
      }).then(async res => {
        if (!res.ok) throw new Error('Process failed');
        fetchData();
      }),
      {
        loading: 'Processing payroll...',
        success: 'Payroll processed successfully',
        error: 'Failed to process payroll',
      }
    );
  };

  const handleApproveRun = async (runId: string) => {
    const headers = getHeaders();
    if (!headers) return;

    toast.promise(
      fetch(`${API}/financials/payroll/runs/${runId}/approve`, {
        method: 'PATCH',
        headers,
      }).then(async res => {
        if (!res.ok) throw new Error('Approval failed');
        fetchData();
      }),
      {
        loading: 'Approving payroll...',
        success: 'Payroll approved & ledger updated',
        error: 'Failed to approve payroll',
      }
    );
  };

  const handleDisburseMpesa = async (runId: string) => {
    const headers = getHeaders();
    if (!headers) return;

    toast.promise(
      fetch(`${API}/financials/payroll/runs/${runId}/disburse/mpesa`, {
        method: 'POST',
        headers,
      }).then(async res => {
        if (!res.ok) throw new Error('Disbursement failed');
        fetchData();
      }),
      {
        loading: 'Initiating M-Pesa disbursement...',
        success: 'Bulk disbursement started',
        error: 'Disbursement failed',
      }
    );
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-brand-dark">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Payroll Engine <span className="text-emerald-500 text-sm align-top leading-none">v1.0 (Skeleton)</span>
          </h1>
          <p className="text-slate-400 mt-1">Manage employees, process monthly payroll, and initiate disbursements.</p>
        </div>
        <div className="flex gap-3">
          {tab === 'employees' && (
            <button
              onClick={() => setShowNewEmployee(true)}
              className="px-6 py-2.5 bg-emerald-500 text-brand-dark rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
          {tab === 'runs' && (
            <button
              onClick={() => setShowNewRun(true)}
              className="px-6 py-2.5 bg-emerald-500 text-brand-dark rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" /> Create Run
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'runs', label: 'Payroll Runs', icon: Receipt },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              tab === t.id ? 'bg-emerald-500 text-brand-dark shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-emerald-500/50 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Employees</p>
                  <p className="text-3xl font-black text-white">{employees.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-blue-500/50 transition-all">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Runs</p>
                  <p className="text-3xl font-black text-white">{runs.filter(r => r.status !== 'DISBURSED').length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-amber-500/50 transition-all">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Banknote className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Last Run Net Pay</p>
                  <p className="text-3xl font-black text-white">
                    {runs.length > 0 ? `KES ${(runs[0].totalNet || 0).toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {runs.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 italic text-sm">No payroll runs recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {runs.slice(0, 5).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${r.status === 'DISBURSED' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                              <Receipt className={`w-5 h-5 ${r.status === 'DISBURSED' ? 'text-emerald-400' : 'text-blue-400'}`} />
                            </div>
                            <div>
                              <p className="text-white font-bold">{r.runNumber}</p>
                              <p className="text-xs text-slate-500 uppercase font-black tracking-wider">{MONTHS[r.month - 1]} {r.year}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-black">KES {(r.totalNet || 0).toLocaleString()}</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              r.status === 'DISBURSED' ? 'text-emerald-400 bg-emerald-500/10' :
                              r.status === 'APPROVED' ? 'text-amber-400 bg-amber-500/10' :
                              'text-blue-400 bg-blue-500/10'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {tab === 'employees' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="p-6 border-b border-white/10 flex gap-4 bg-black/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search employees by name, number or department..."
                    className="w-full bg-brand-dark/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button className="px-4 bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID #</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Position</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Basic Pay</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employees.map(e => (
                      <tr key={e.id} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm uppercase">
                              {e.firstName[0]}{e.lastName[0]}
                            </div>
                            <div>
                              <p className="text-white font-bold group-hover:text-emerald-400 transition-colors uppercase italic">{e.firstName} {e.lastName}</p>
                              <p className="text-xs text-slate-500">{e.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-slate-400">{e.employeeNumber}</td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-white/5 rounded-lg text-xs text-slate-300 font-bold uppercase tracking-wider">
                            {e.department || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-400 italic">{e.jobTitle || 'Staff'}</td>
                        <td className="px-6 py-5 font-black text-white">KES {(e.basicSalary || 0).toLocaleString()}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {e.mpesaPhone ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <Phone className="w-3 h-3" /> M-Pesa
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                                <Landmark className="w-3 h-3" /> Bank
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">No employees found.</td>
                      </tr>
                    ) }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Runs Tab */}
          {tab === 'runs' && (
            <div className="grid grid-cols-1 gap-6">
              {runs.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    r.status === 'DISBURSED' ? 'bg-emerald-500' :
                    r.status === 'APPROVED' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`} />
                  
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black ${
                        r.status === 'DISBURSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        <span className="text-[10px] uppercase opacity-60 font-black tracking-widest">{MONTHS[r.month - 1]?.slice(0, 3)}</span>
                        <span className="text-xl tracking-tighter">{r.year}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{r.runNumber}</h3>
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest scale-90 ${
                            r.status === 'DISBURSED' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                            r.status === 'APPROVED' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                            r.status === 'PROCESSING' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' :
                            'text-slate-400 bg-white/5 border border-white/10'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1 font-medium">{r.notes || 'Monthly payroll cycle'}</p>
                      </div>
                    </div>

                    <div className="flex gap-16">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Gross</p>
                        <p className="text-xl font-black text-white">KES {(r.totalGross || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Deductions</p>
                        <p className="text-xl font-black text-rose-400">KES {(r.totalDeductions || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Net Payable</p>
                        <p className="text-xl font-black text-emerald-400 underline decoration-emerald-500/30 underline-offset-4">KES {(r.totalNet || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      {r.status === 'DRAFT' && (
                        <button
                          onClick={() => handleProcessRun(r.id)}
                          className="px-6 py-2.5 bg-blue-500 text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center gap-2 active:scale-95"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Process
                        </button>
                      )}
                      
                      {r.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleApproveRun(r.id)}
                          className="px-6 py-2.5 bg-amber-500 text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}

                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleDisburseMpesa(r.id)}
                          className="px-6 py-2.5 bg-emerald-500 text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                          <Phone className="w-3.5 h-3.5" /> Disburse M-Pesa
                        </button>
                      )}

                      {(r.status === 'APPROVED' || r.status === 'DISBURSED') && (
                        <button className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:text-emerald-400 hover:bg-white/10 transition-all active:scale-95">
                          <CreditCard className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {runs.length === 0 && (
                <div className="py-20 text-center bg-white/5 border border-white/10 rounded-[3rem] border-dashed">
                  <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No payroll history found.</p>
                  <p className="text-slate-600 text-xs mt-1 italic">Click &apos;Create Run&apos; to start a new period.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Run Modal */}
      {showNewRun && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md" onClick={() => setShowNewRun(false)} />
          <div className="relative w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initialize Payroll</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Start a new payment period</p>
              </div>
              <button onClick={() => setShowNewRun(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRun} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Year</label>
                  <select
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 transition-all italic font-bold"
                    value={newRun.year}
                    onChange={e => setNewRun({ ...newRun, year: parseInt(e.target.value) })}
                  >
                    {[CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Month</label>
                  <select
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 transition-all italic font-bold"
                    value={newRun.month}
                    onChange={e => setNewRun({ ...newRun, month: parseInt(e.target.value) })}
                  >
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Internal Notes</label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500 transition-all min-h-[120px] placeholder:text-slate-700"
                  placeholder="e.g., April 2026 performance-based bonuses included..."
                  value={newRun.notes}
                  onChange={e => setNewRun({ ...newRun, notes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={creatingRun}
                className="w-full py-5 bg-emerald-500 text-brand-dark rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
              >
                {creatingRun ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Initialize Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Employee Modal */}
      {showNewEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md" onClick={() => setShowNewEmployee(false)} />
          <div className="relative w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter underline decoration-emerald-500/50 underline-offset-8">Add New Staff</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-3">Register employee for payroll</p>
              </div>
              <button onClick={() => setShowNewEmployee(false)} className="text-slate-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">First Name</label>
                  <input
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-bold placeholder:font-normal placeholder:text-slate-700 uppercase"
                    placeholder="Wanjiku"
                    value={newEmp.firstName}
                    onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Last Name</label>
                  <input
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-bold placeholder:font-normal placeholder:text-slate-700 uppercase"
                    placeholder="Mũtene"
                    value={newEmp.lastName}
                    onChange={e => setNewEmp({ ...newEmp, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Employee #</label>
                  <input
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-mono italic"
                    placeholder="EMP001"
                    value={newEmp.employeeNumber}
                    onChange={e => setNewEmp({ ...newEmp, employeeNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Monthly Basic (KES)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-black text-emerald-400"
                    value={newEmp.basicSalary}
                    onChange={e => setNewEmp({ ...newEmp, basicSalary: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">M-Pesa Phone (optional)</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="254712345678"
                    value={newEmp.mpesaPhone}
                    onChange={e => setNewEmp({ ...newEmp, mpesaPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Department</label>
                  <select
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all"
                    value={newEmp.department}
                    onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="PRODUCTION">Production / Picking</option>
                    <option value="PACK_HOUSE">Pack House</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="ADMIN">Administration</option>
                  </select>
                </div>
              </div>
              <div className="col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={creatingEmp}
                  className="w-full py-4 bg-emerald-500 text-brand-dark rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                >
                  {creatingEmp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
