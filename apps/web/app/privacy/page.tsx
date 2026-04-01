'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '../../components/landing/Footer';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "April 1, 2026";

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col pt-32 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-green/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/2" />

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
              <Shield className="w-4 h-4 text-brand-green" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security & Trust</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6">
              Privacy <span className="text-brand-green">Policy</span>
            </h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-2xl">
              We take the security of your agricultural data seriously. This document outlines how we collect, protect, and manage your information within the Flori-Core ecosystem.
            </p>
            <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
              Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Content Sections */}
          <div className="grid gap-12">
            
            {/* Section 1 */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">1. Data Collection</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                Flori-Core Enterprise OS collects data necessary to provide precision farming and cold chain services. This includes:
              </p>
              <ul className="grid gap-4 text-slate-400 font-light list-disc pl-6">
                <li><strong className="text-slate-200">Account Information:</strong> Name, professional email, and role within your organization.</li>
                <li><strong className="text-slate-200">Operational Data:</strong> Farm block coordinates, crop varieties, and production schedules.</li>
                <li><strong className="text-slate-200">IoT Telemetry:</strong> Temperature, humidity, and location data from integrated sensors.</li>
                <li><strong className="text-slate-200">Payment Data:</strong> Secure billing information processed via our enterprise payment partners.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">2. Information Security</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                Security is at the core of our infrastructure. We implement industry-leading protocols to protect your enterprise data:
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="text-white font-bold mb-2">End-to-End Encryption</h3>
                  <p className="text-slate-500 text-sm">All telemetry data transmit via AES-256 encrypted channels from sensor to dashboard.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="text-white font-bold mb-2">Data Sovereignty</h3>
                  <p className="text-slate-500 text-sm">Organisations maintain full ownership of their data. We do not sell farm metrics to third parties.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">3. Data Retention</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                We retain your operational data as long as your account is active or as needed to provide you services. Upon request, we can purge your operational history from our active databases, subject to legal compliance requirements for financial and logistics records.
              </p>
            </section>

            {/* Section 4 */}
            <section className="bg-white/3 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">4. Compliance & GDPR</h2>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                Flori-Core complies with Global Data Protection Regulations (GDPR) and regional agricultural data privacy standards. Users have the right to access, export, or delete their personal data at any time through the Enterprise Control Panel.
              </p>
            </section>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-slate-500 text-sm mb-6">Have questions regarding your data privacy?</p>
              <Link 
                href="/#contact" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-green text-brand-dark font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
              >
                Contact Data Protection Officer
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
