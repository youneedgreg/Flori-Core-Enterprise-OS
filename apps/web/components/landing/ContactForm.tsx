'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would hook into standard API routes or external form providers.
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', message: '' });
    }, 4000);
  };

  return (
    <section id="demo" className="py-32 bg-brand-dark">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="bg-white/5 p-10 md:p-16 rounded-4xl relative overflow-hidden border border-white/5">
          {/* Subtle gradient behind form */}
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-white tracking-tight">Ready to <span className="text-brand-green">Modernize?</span></h2>
              <p className="text-slate-400 mb-10 leading-relaxed font-light text-lg">
                Connect with our experts and discover how Flori-Core OS can streamline your farm-to-customer pipeline, reducing wastage and amplifying profit.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl text-emerald-500 shadow-lg shadow-emerald-500/5">
                    📧
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Email Us</h4>
                    <p className="text-sm text-slate-500">sales@flori-core.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center text-2xl text-brand-green shadow-lg shadow-emerald-500/5">
                    🌍
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Global Reach</h4>
                    <p className="text-sm text-slate-500">Local support across 15+ countries.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all text-white placeholder:text-slate-600"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Work Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all text-white placeholder:text-slate-600"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Company / Farm Name"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all text-white placeholder:text-slate-600"
                />
                <textarea
                  rows={4}
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all resize-none text-white placeholder:text-slate-600"
                />
                
                <button
                  type="submit"
                  disabled={submitted}
                  className="w-full px-10 py-5 rounded-2xl bg-brand-green hover:bg-emerald-400 text-brand-dark font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                  {submitted ? 'Message Sent! ✓' : 'Request Demo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
