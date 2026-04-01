'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '../../components/landing/Footer';
import { FileText, Scale, Gavel, Globe, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TermsAndConditions() {
  const lastUpdated = "April 1, 2026";

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col pt-32 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-green/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2" />

      {/* Navigation / Header */}
      <nav className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-white flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <div className="w-5 h-5 border-[3px] border-brand-dark rounded-sm rotate-45" />
            </div>
            Flori-Core
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="grow relative z-10 px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Scale className="w-4 h-4 text-brand-green" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legal Framework</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6">
              Terms of <span className="text-brand-green">Service</span>
            </h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-2xl">
              By accessing the Flori-Core Enterprise OS, you agree to these terms. We aim to provide a transparent and secure legal framework for your business operations.
            </p>
            <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
              Effective Date: {lastUpdated}
            </div>
          </div>

          {/* Content Sections */}
          <div className="grid gap-12">
            
            {/* Section 1: Agreement */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">1. Acceptance of Terms</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                By creating an account, accessing, or using the Flori-Core Platform, you agree to be bound by these Terms of Service. If you are using the Services on behalf of an organization, you agree to these Terms for that organization and representing that you have the authority to act on their behalf.
              </p>
            </section>

            {/* Section 2: Account Responsibilities */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">2. Use of Services</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                Flori-Core provides enterprise-grade infrastructure for farm management and logistics. You agree use the platform only for lawful business purposes.
              </p>
              <div className="grid gap-4 mt-4">
                {[
                  "Maintain account security and report unauthorised access immediately.",
                  "Provide accurate and up-to-date information for your operational data.",
                  "Comply with international exports and imports regulations related to floriculture.",
                  "Do not attempt to reverse-engineer or disrupt the Service's infrastructure."
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5 font-light">
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <span className="text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Intellectual Property */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">3. Property Rights</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-white font-bold">Our Property</h3>
                  <p className="text-slate-500 font-light text-sm leading-relaxed">
                    The Flori-Core OS software, dashboard designs, and logic are the intellectual property of Flori-Core. We grant you a limited license to access for your operations.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-white font-bold">Your Property</h3>
                  <p className="text-slate-500 font-light text-sm leading-relaxed">
                    All data uploaded to the platform, including farm metrics, crop data, and employee information, remains the sole property of you and your organization.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Limitation of Liability */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">4. Liability</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLORI-CORE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING BUT NOT LIMITED TO CROP LOSS, DATA LOSS, OR LOST PROFITS, RESULTING FROM THE USE OR INABILITY TO USE THE SERVICES.
              </p>
            </section>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-slate-500 text-sm mb-6 font-medium">Looking for a custom enterprise service agreement?</p>
              <Link 
                href="/#contact" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-green text-brand-dark font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
              >
                Contact Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
