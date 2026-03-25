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
    <section id="demo" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="glass p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
          {/* Subtle gradient behind form */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-bl from-emerald-500 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Ready to Modernize?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Connect with our experts and discover how Flori-Core OS can streamline your farm-to-customer pipeline, reducing wastage and amplifying profit.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                    📧
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Email Us</h4>
                    <p className="text-sm text-slate-500">sales@flori-core.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                    🌍
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Global Reach</h4>
                    <p className="text-sm text-slate-500">Local support across 15+ countries.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Work Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Company / Farm Name"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitted}
                  className="w-full px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
