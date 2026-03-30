import React from 'react';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/hero-bg.png" 
          alt="Floriculture background" 
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-brand-dark/40" />
        <div className="absolute inset-0 bg-radial-[at_center_center,transparent_0%,var(--color-brand-dark)_100%]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-[10px] tracking-widest uppercase font-bold text-emerald-400 mb-8 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Next Gen Enterprise OS
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-white">
          Cultivate the Future of <br className="hidden md:block" />
          <span className="text-brand-green">Global Floriculture</span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-12 leading-relaxed font-light">
          A unified enterprise operating system for production, cold chain, and logistics. <br className="hidden sm:block" />
          Scalable architecture for the world&apos;s most delicate supply chain.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a href="/signup" className="w-full sm:w-auto px-10 py-4 rounded-full bg-brand-green hover:bg-emerald-400 text-brand-dark font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            Request Demo
          </a>
          <a href="#features" className="w-full sm:w-auto px-10 py-4 rounded-full glass hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-white/20">
            View Platform
          </a>
        </div>
      </div>
    </section>
  );
}

