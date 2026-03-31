'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Shield, 
  Save, 
  Loader2, 
  AlertCircle,
  Database,
  Key,
  Globe,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import Step1FarmProfile from '../../../components/onboarding/Step1FarmProfile';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Tab = 'farm' | 'account' | 'system';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('farm');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; tenantId: string } | null>(null);
  const [farmData, setFarmData] = useState({
    name: '',
    location: '',
    gpsCoordinates: '',
    certifications: [] as string[],
    contactEmail: '',
    contactPhone: '',
    logoUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
        const token = tokenMatch?.[1];

        if (!token) return;

        // Decode token
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.email, role: payload.role, tenantId: payload.tenantId });

        const headers = { Authorization: `Bearer ${token}` };
        
        const farmRes = await fetch(`${API}/onboarding/farm-profile`, { headers });
        if (farmRes.ok) {
          const data = await farmRes.json();
          if (data) {
            setFarmData({
              name: data.name || '',
              location: data.location || '',
              gpsCoordinates: data.gpsCoordinates || '',
              certifications: data.certifications || [],
              contactEmail: data.contactEmail || '',
              contactPhone: data.contactPhone || '',
              logoUrl: data.logoUrl || ''
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveFarm = async () => {
    setSaving(true);
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      const res = await fetch(`${API}/onboarding/farm-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(farmData)
      });

      if (res.ok) {
        toast.success('Farm profile updated successfully');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  const tabItems = [
    { id: 'farm', label: 'Farm Identity', icon: Building2 },
    { id: 'account', label: 'User Account', icon: User },
    { id: 'system', label: 'System Context', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">Settings</h1>
          <p className="text-slate-500 font-medium tracking-tight">Configure your workspace backbone and node authority.</p>
        </div>

        {activeTab === 'farm' && (
          <button 
            onClick={handleSaveFarm}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-green hover:bg-emerald-400 disabled:opacity-50 text-brand-dark rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Commit Changes
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${
              activeTab === tab.id 
                ? 'bg-brand-green/10 text-brand-green shadow-lg shadow-emerald-500/5' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Farm Identity Tab */}
        {activeTab === 'farm' && (
          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl">
               <Step1FarmProfile 
                data={farmData} 
                onChange={setFarmData} 
                onNext={handleSaveFarm} 
               />
               
               {/* Custom Footer for the Step1FarmProfile since it has its own button */}
               <style jsx global>{`
                 /* Hide the onboarding specific button in settings */
                 button:has(span:contains("Establish Node Architecture")) {
                   display: none;
                 }
               `}</style>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <Shield className="w-6 h-6 text-brand-green" />
                Security Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Authority Email</label>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-bold">
                        {user?.email}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Assigned Context</label>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-brand-green font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                        {user?.role.replace('_', ' ')}
                      </div>
                   </div>
                </div>

                <div className="p-8 rounded-3xl bg-brand-green/5 border border-brand-green/10">
                   <h4 className="text-brand-green font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Key className="w-4 h-4" />
                     Password Protocol
                   </h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Rotate your access credentials to maintain node security across all interfaces.</p>
                   <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 transition-all">
                     Initiate Rotation
                   </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
               <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                 <Bell className="w-6 h-6 text-brand-green" />
                 Alert Preferences
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'System Critical Faults', desc: 'Real-time telemetry breaches and hardware failures.' },
                    { label: 'Operational Syncs', desc: 'Batch completion and logistics handovers.' },
                    { label: 'Authority Changes', desc: 'RBAC updates and tenant-level configurations.' }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                       <div>
                          <p className="text-sm font-black text-white tracking-tight">{pref.label}</p>
                          <p className="text-xs text-slate-500 font-medium">{pref.desc}</p>
                       </div>
                       <div className="w-12 h-6 rounded-full bg-brand-green/20 border border-brand-green/30 relative flex items-center px-1">
                          <div className="w-4 h-4 rounded-full bg-brand-green shadow-lg shadow-emerald-500/50 translate-x-6" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 group hover:border-brand-green/20 transition-all">
                   <Globe className="w-8 h-8 text-brand-green mb-6" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Infrastructure</p>
                   <p className="text-white font-black text-lg tracking-tighter uppercase">AWS Ireland (eu-west-1)</p>
                </div>
                <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 group hover:border-brand-green/20 transition-all">
                   <Database className="w-8 h-8 text-brand-green mb-6" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Context ID</p>
                   <p className="text-white font-mono text-xs truncate uppercase">{user?.tenantId}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 group hover:border-brand-green/20 transition-all">
                   <Shield className="w-8 h-8 text-brand-green mb-6" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Core Version</p>
                   <p className="text-white font-black text-lg tracking-tighter uppercase">v1.2.4-STABLE</p>
                </div>
             </div>

             <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl text-center flex flex-col items-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-brand-green/10 flex items-center justify-center mb-6 animate-pulse border border-brand-green/20">
                  <AlertCircle className="w-10 h-10 text-brand-green" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Diagnostic Logs</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">System diagnostics and heartbeat monitors are currently restricted to terminal access during the node stability phase.</p>
                <div className="flex gap-4">
                   <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 transition-all">
                     Request Stack Trace
                   </button>
                   <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-brand-green rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-brand-green/20 transition-all">
                     Verify Connectivity
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
