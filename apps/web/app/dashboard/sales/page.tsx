'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, CheckCircle2,
  Building2, UserPlus, ShoppingBag
} from 'lucide-react';

// Components
import { LeadsPipeline } from '../../../components/sales/LeadsPipeline';
import { CustomerList } from '../../../components/sales/CustomerList';
import { OrdersBoard } from '../../../components/sales/OrdersBoard';
import { CreateCustomerModal } from '../../../components/sales/CreateCustomerModal';
import { CreateLeadModal } from '../../../components/sales/CreateLeadModal';
import { decodeJWT, logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'CUSTOMERS' | 'ORDERS'>('PIPELINE');
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    activeLeads: 0,
    totalCustomers: 0,
    pipelineValue: 0,
    conversionRate: '0%',
    activeOrders: 0,
  });

  const getAuthHeader = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  async function fetchStats() {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const [leadsRes, custRes, ordersRes] = await Promise.all([
        fetch(`${API}/sales/leads`, { headers }),
        fetch(`${API}/sales/customers`, { headers }),
        fetch(`${API}/sales/orders?status=CONFIRMED`, { headers }),
      ]);
      const leads = await leadsRes.json();
      const customers = await custRes.json();
      const orders = await ordersRes.json();

      setStats({
        activeLeads: leads.length,
        totalCustomers: customers.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pipelineValue: leads.reduce((acc: number, l: any) => acc + (l.value || 0), 0),
        conversionRate: '12%', // Placeholder for now
        activeOrders: Array.isArray(orders) ? orders.length : 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Sales Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            CRM & <span className="text-emerald-400">Pipeline</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest leading-loose">
            Manage your global customer relationships and sales flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(['PIPELINE', 'CUSTOMERS', 'ORDERS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab === 'PIPELINE' ? 'Pipeline' : tab === 'CUSTOMERS' ? 'Customers' : 'Orders'}
            </button>
          ))}
          {activeTab !== 'ORDERS' && (
            <button 
              onClick={() => activeTab === 'PIPELINE' ? setShowLeadModal(true) : setShowCustomerModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4" /> New {activeTab === 'PIPELINE' ? 'Lead' : 'Customer'}
            </button>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'Active Leads', value: stats.activeLeads, icon: UserPlus, color: 'text-cyan-400' },
          { label: 'Total Customers', value: stats.totalCustomers, icon: Building2, color: 'text-emerald-400' },
          { label: 'Pipeline Value', value: `USD ${(stats.pipelineValue / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Conversion Rate', value: stats.conversionRate, icon: CheckCircle2, color: 'text-indigo-400' },
          { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingBag, color: 'text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <p className={`text-3xl font-black italic tracking-tighter uppercase ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden min-h-[600px] flex flex-col">
        {activeTab === 'PIPELINE' && (
          <LeadsPipeline key={`pipeline-${refreshKey}`} apiBase={API} getAuthHeader={getAuthHeader} onRefresh={handleSuccess} />
        )}
        {activeTab === 'CUSTOMERS' && (
          <CustomerList key={`customers-${refreshKey}`} apiBase={API} getAuthHeader={getAuthHeader} />
        )}
        {activeTab === 'ORDERS' && (
          <OrdersBoard apiBase={API} getAuthHeader={getAuthHeader} onRefresh={handleSuccess} />
        )}
      </div>

      <CreateCustomerModal 
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        apiBase={API}
        getAuthHeader={getAuthHeader}
        onSuccess={handleSuccess}
      />

      <CreateLeadModal 
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        apiBase={API}
        getAuthHeader={getAuthHeader}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
