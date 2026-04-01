'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RegisterTenantSchema } from '@flori/shared';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Building, AtSign, Lock, ArrowRight, ShieldCheck, 
  Globe, Briefcase 
} from 'lucide-react';

export default function SignupPage() {
  const [farmName, setFarmName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      RegisterTenantSchema.parse({ farmName, adminEmail, adminPassword });
      
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ farmName, adminEmail, adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; samesite=lax`;
      
      if (data.isOnboarded) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/onboarding';
      }
    } catch (err) {
      console.error("Signup Error:", err);
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
        toast.error(err.issues[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('An unexpected error occurred.');
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-lg relative z-10">
        
        {/* Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <div className="w-6 h-6 border-[3px] border-brand-dark rounded-sm rotate-45" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">Flori-Core</span>
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Enterprise Onboarding</h1>
          <p className="text-slate-500 font-light">Register your farm block and join the global network.</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/3 backdrop-blur-3xl p-10 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
          
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-brand-green/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-6">
              {/* Farm Name Field */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 mb-2 block px-1">
                  Farm / Enterprise Name
                </label>
                <div className="relative group/input">
                  <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-brand-green transition-colors" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Green Valley Farms Ltd."
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/40 transition-all outline-none text-white placeholder:text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 mb-2 block px-1">
                  Root Administrator Email
                </label>
                <div className="relative group/input">
                  <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-brand-green transition-colors" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@farm.com"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/40 transition-all outline-none text-white placeholder:text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 mb-2 block px-1">
                  Secure Password
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-brand-green transition-colors" strokeWidth={1.5} />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/40 transition-all outline-none text-white placeholder:text-slate-700 font-medium"
                    required
                  />
                </div>
                <p className="mt-2 px-1 text-[10px] text-slate-600 font-bold uppercase tracking-wider">Security: Minimum 8 characters</p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl bg-brand-green hover:bg-emerald-400 text-brand-dark font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group/btn"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Network
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Link */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">
              By initializing, you agree to our <br/>
              <Link href="/terms" className="text-slate-400 hover:text-brand-green transition-colors">Terms of Service</Link> and <Link href="/privacy" className="text-slate-400 hover:text-brand-green transition-colors">Privacy Policy</Link>
            </p>
            <div className="h-px w-12 bg-white/10" />
            <p className="text-sm text-slate-500 font-medium text-center">
              Already standardized on Flori-Core?{' '}
              <br className="sm:hidden" />
              <Link href="/login" className="text-white hover:text-brand-green font-bold transition-all ml-1">
                Enter Dashboard
              </Link>
            </p>
          </div>

          {/* Background decoration in card */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-green/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        {/* Branding Footer */}
        <div className="mt-12 flex items-center justify-center gap-8 border-t border-white/5 pt-8 opacity-40">
           <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global Standards</span>
           </div>
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Ready</span>
           </div>
           <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Scalable Infra</span>
           </div>
        </div>
      </div>
    </div>
  );
}
