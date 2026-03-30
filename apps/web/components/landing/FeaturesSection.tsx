/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, Cell
} from 'recharts';
import { 
  Zap, Thermometer, Briefcase, Globe, Users, 
  TrendingUp, ShieldCheck, PieChart, X
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  desc: string;
  details: string[];
  icon: any;
  visualType: string;
  stats: { label: string; value: string; color: string };
  data?: any[];
}

const coreFeatures: Feature[] = [
  {
    id: "module-production",
    title: "Precision Production",
    desc: "Map farm blocks interactively, track crop cycles, and manage smart soil IoT telemetry. Log chemical sprays and verify PHI compliance.",
    details: [
      "Digital Farm Mapping: Interactive GIS-based planning for all farm blocks and irrigation zones.",
      "Smart Soil Telemetry: Real-time moisture, pH, and nutrient monitoring through distributed IoT sensors.",
      "Compliance Vault: Automated spray logging with intelligent Pre-Harvest Interval (PHI) verification.",
      "Crop Cycle Analytics: Predictive harvesting windows based on historical performance and weather data."
    ],
    icon: Zap,
    visualType: "line-area",
    stats: { label: "Yield projection", value: "+12.5%", color: "text-emerald-400" },
    data: [
      { name: 'Jan', value: 20 },
      { name: 'Feb', value: 35 },
      { name: 'Mar', value: 25 },
      { name: 'Apr', value: 45 },
      { name: 'May', value: 38 },
      { name: 'Jun', value: 55 },
    ]
  },
  {
    id: "module-cold-chain",
    title: "IoT Cold Chain",
    desc: "Temperature monitoring trends, real-time alert bands to preserve shelf life across global logistics networks.",
    details: [
      "Multi-Zone Monitoring: High-precision temperature and humidity sensors for cold rooms and packhouses.",
      "Logistics Telemetry: Live transit monitoring with GPS cross-referencing and departure/arrival alerting.",
      "Shelf-Life Preservation: Automated warning bands for temperature deviations to preserve product quality.",
      "Integrated Dispatch: Smooth coordination between the packhouse and international shippers."
    ],
    icon: Thermometer,
    visualType: "line-temp",
    stats: { label: "Temperature status", value: "Optimal", color: "text-emerald-400" },
    data: [
      { name: 'Jan', value: -15 },
      { name: 'Feb', value: 0 },
      { name: 'Mar', value: -5 },
      { name: 'Apr', value: 10 },
      { name: 'May', value: 5 },
      { name: 'Jun', value: 25 },
    ]
  },
  {
    id: "module-stores",
    title: "Intelligent Stores",
    desc: "AI-driven inventory minimum thresholds with automated purchase request generation and seamless vendor invoice matching.",
    details: [
      "Dynamic Inventory Thresholds: AI-calculated minimum stocks based on seasonal demand data.",
      "Automated Purchase Requests: Generate orders automatically when stock levels hit critical points.",
      "Vendor Matching Engine: Sync invoices with digital delivery notes for 100% financial accuracy.",
      "QR/RFID Stocktakes: Perform rapid inventory audits using integrated mobile scanner support."
    ],
    icon: ShieldCheck,
    visualType: "bar-inventory",
    stats: { label: "In Stock Rate", value: "94.2%", color: "text-emerald-400" },
    data: [
      { name: 'S', value: 12 },
      { name: 'M', value: 22 },
      { name: 'T', value: 31 },
      { name: 'W', value: 40 },
      { name: 'T', value: 18 },
      { name: 'F', value: 24 },
      { name: 'S', value: 26 },
    ]
  },
  {
    id: "module-commerce",
    title: "Global Commerce",
    desc: "Integrated CRM, seamless standing contract generation, and compliance document vault to master international exports.",
    details: [
      "Executive CRM: A specialized customer relationship engine for high-volume flower traders.",
      "Smart Export Contracts: Auto-generate legally compliant trade documents for EU and US markets.",
      "Compliance Document Vault: Secure repository for phytosanitary certificates and clearing documents.",
      "Financial Settlement Integration: Track bank transfers and link them to individual shipments."
    ],
    icon: Globe,
    visualType: "geo-map",
    stats: { label: "Shipment Progress", value: "70%", color: "text-emerald-400" },
  },
  {
    id: "module-payroll",
    title: "Enterprise Payroll",
    desc: "Automated payment processes and efficiency metrics for thousands of seasonal and permanent agricultural laborers.",
    details: [
      "High-Volume Disbursements: Handle thousands of pay slips with automated bulk MPESA or bank transfers.",
      "Efficiency Auditing: Correlate field performance with individual payouts to reward productivity.",
      "Statutory Compliance: Automated KRA, NSSF, and NHIF calculations for easy regulatory filing.",
      "Advance Management: Track and reconcile staff salary advances through a secure internal ledger."
    ],
    icon: Briefcase,
    visualType: "bar-payroll",
    stats: { label: "Efficiency", value: "100%", color: "text-emerald-400" },
    data: [
      { name: 'S', value: 12 },
      { name: 'M', value: 22 },
      { name: 'T', value: 31 },
      { name: 'W', value: 40 },
      { name: 'T', value: 18 },
      { name: 'F', value: 24 },
      { name: 'S', value: 26 },
    ]
  },
  {
    id: "module-talent",
    title: "HR & Talent",
    desc: "Manage digital employee files, orchestrate shift scheduling, and track performance KPIs across all operational teams.",
    details: [
      "Digital Employee Records: Maintain detailed CVs, contracts, and training history for all staff.",
      "Shift Orchestration: Manage complex shift rotations across diverse labor gangs and departments.",
      "KPI Driven Performance: Track attendance, quality metrics, and safety records in one unified dashboard.",
      "Training & Certification: Automated alerts for expiring certifications and mandatory training sessions."
    ],
    icon: Users,
    visualType: "stats-performance",
    stats: { label: "Shift Completion", value: "98.5%", color: "text-emerald-400" },
  }
];

const LogisticsMap = () => (
  <div className="relative w-full h-40 mt-6 bg-white/5 rounded-2xl border border-white/5 p-4 overflow-hidden group">
    <svg viewBox="0 0 400 200" className="w-full h-full opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
      <path d="M50,100 Q150,50 250,100 T350,100" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_10s_linear_infinite]" />
      <circle cx="50" cy="100" r="4" fill="#10b981" className="animate-ping" />
      <circle cx="50" cy="100" r="4" fill="#10b981" />
      <circle cx="350" cy="100" r="4" fill="#10b981" />
      {/* World Map Background (Conceptual) */}
      <path d="M20,60 L40,40 L80,50 L120,40 L160,60 L200,50 L240,70 L280,60 L320,80 L360,70 L380,90 L340,110 L300,100 L260,120 L220,110 L180,130 L140,120 L100,140 L60,130 L30,150 Z" fill="#ffffff" opacity="0.1" />
    </svg>
    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-brand-dark/50 backdrop-blur-md p-2 rounded-xl border border-white/5">
       <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Progress statuses</span>
       <span className="text-[10px] text-emerald-400 font-bold">70%</span>
    </div>
    <div className="absolute bottom-2 left-6 right-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
       <div className="h-full bg-emerald-500 rounded-full w-[70%]" />
    </div>
  </div>
);

export default function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <section id="features" className="py-32 bg-brand-dark relative overflow-hidden">
      {/* Anchor for Modules link */}
      <div id="modules" className="absolute top-0 left-0" />
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] tracking-[0.2em] font-black uppercase text-emerald-400 mb-6 border border-emerald-500/20">
            Enterprise Grade
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-tighter">
            Industrial <span className="text-brand-green">Pillars</span>
          </h2>
          <p className="text-xl text-slate-400 font-light leading-relaxed">
            Engineered to handle every facet of the floral supply chain with executive-level clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
          {coreFeatures.map((feature, i) => (
            <div 
              key={i} 
              id={feature.id}
              onClick={() => setSelectedFeature(feature)}
              className="group relative p-10 rounded-[2.5rem] bg-white/3 backdrop-blur-3xl transition-all duration-700 hover:-translate-y-3 border border-white/7 hover:border-emerald-500/30 hover:bg-white/6 overflow-hidden cursor-pointer"
            >
              {/* Card Title & Icon */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2 max-w-[85%] group-hover:text-slate-400 transition-colors">
                    {feature.desc}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <feature.icon className="w-7 h-7 text-white/40 group-hover:text-emerald-400" strokeWidth={1.5} />
                </div>
              </div>

              {/* Visualization Area */}
              <div className="min-h-[160px] flex items-center justify-center py-4 bg-black/20 rounded-3xl border-white/3 relative">
                {feature.visualType === 'line-area' && (
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={feature.data}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill={`url(#grad-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {feature.visualType === 'line-temp' && (
                  <div className="w-full relative px-4">
                     <div className="absolute top-2 right-4 bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[10px] text-white/50 backdrop-blur-md z-20">18.0 - 25°C</div>
                     <ResponsiveContainer width="100%" height={140}>
                       <LineChart data={feature.data}>
                         <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', stroke: 'none' }} activeDot={{ r: 6, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }} />
                       </LineChart>
                     </ResponsiveContainer>
                  </div>
                )}

                {feature.visualType.includes('bar') && (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={feature.data}>
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {(feature.data || []).map((_entry, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : 'rgba(255,255,255,0.15)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {feature.visualType === 'geo-map' && <LogisticsMap />}

                {feature.visualType === 'stats-performance' && (
                  <div className="w-full grid grid-cols-2 gap-4 px-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <PieChart className="w-5 h-5 text-blue-400 mb-2" />
                       <div className="text-xl font-bold text-white">83%</div>
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Attendance</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                       <div className="text-xl font-bold text-white">100%</div>
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Payouts</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Metrics Area */}
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-none mb-1">{feature.stats.label}</div>
                    <div className={`text-sm font-bold ${feature.stats.color}`}>{feature.stats.value}</div>
                  </div>
                </div>

                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 group-hover:bg-emerald-500/20 transition-all">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Status
                </div>
              </div>

              {/* Glowing hover accent */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelectedFeature(null)}
        >
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xl animate-in fade-in duration-300" />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedFeature(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Left Side: Icon & Title */}
              <div className="p-8 md:p-12 md:w-5/12 bg-emerald-500/5 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-white/5">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <selectedFeature.icon className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black text-white leading-tight mb-4">
                  {selectedFeature.title}
                </h3>
                <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  {selectedFeature.stats.label}: {selectedFeature.stats.value}
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="p-8 md:p-12 md:w-7/12">
                <p className="text-slate-400 font-medium leading-relaxed mb-10">
                  {selectedFeature.desc}
                </p>
                
                <div className="space-y-6">
                  {selectedFeature.details.map((detail: string, idx: number) => {
                    const [title, content] = detail.split(': ');
                    return (
                      <div key={idx} className="group/item flex gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 group-hover/item:scale-150 transition-transform" />
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1.5">{title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed group-hover/item:text-slate-400 transition-colors">
                            {content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-12 flex items-center gap-4">
                   <button 
                     onClick={() => setSelectedFeature(null)}
                     className="flex-1 px-6 py-3 rounded-2xl bg-emerald-500 text-brand-dark font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95"
                   >
                     Acknowledge
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

