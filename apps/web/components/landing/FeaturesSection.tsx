import React from 'react';

const coreFeatures = [
  {
    title: "Precision Production",
    desc: "Map farm blocks interactively, track crop cycles, and manage smart soil IoT telemetry. Log chemical sprays and verify PHI compliance automatically.",
    icon: "🌱"
  },
  {
    title: "Pack House & Cold Chain",
    desc: "End-to-end QR code intake, real-time QC grading, and active cold room telemetry with alert bands to preserve shelf life.",
    icon: "❄️"
  },
  {
    title: "Intelligent Stores",
    desc: "AI-driven inventory minimum thresholds with automated purchase request generation and seamless vendor invoice matching.",
    icon: "📦"
  },
  {
    title: "Global Commerce",
    desc: "Integrated CRM, seamless standing contract generation, and compliance document vault to master international flower exports.",
    icon: "🌍"
  },
  {
    title: "Unified Financials",
    desc: "A bespoke double-entry ledger linking production logs seamlessly to payroll, calculating actual profitability per variety.",
    icon: "📊"
  },
  {
    title: "HR & Talent",
    desc: "Manage digital employee files, orchestrate shift scheduling, and track performance KPIs across all operational teams.",
    icon: "👥"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Master Your Entire Value Chain</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Flori-Core replaces fragmented spreadsheets with a powerful, single source of truth across all farm departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreFeatures.map((feature, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl glass hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
            >
              <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform origin-left">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
