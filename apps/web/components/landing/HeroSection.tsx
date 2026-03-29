import React from 'react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-r from-emerald-400 to-blue-500 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-8 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Next-Generation Farm Operating System
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Cultivate Success with <br className="hidden md:block" />
          <span className="text-gradient">Flori-Core Enterprise</span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
          The all-in-one platform for precision agriculture, advanced cold chain logistics, and global sales. Built for scale, engineered for yield.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1">
            Book a Demo
          </a>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full glass hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold transition-all border border-slate-200 dark:border-slate-700">
            Explore Features
          </a>
        </div>
      </div>
    </section>
  );
}
