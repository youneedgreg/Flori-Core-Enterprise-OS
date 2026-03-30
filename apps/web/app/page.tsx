'use client';

import React from 'react';
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import ContactForm from "../components/landing/ContactForm";
import Footer from "../components/landing/Footer";
import { 
  Zap, Thermometer, ShieldCheck, Globe, Briefcase, Users, ChevronDown 
} from 'lucide-react';

const modules = [
  { id: 'module-production', title: 'Precision Production', icon: Zap },
  { id: 'module-cold-chain', title: 'IoT Cold Chain', icon: Thermometer },
  { id: 'module-stores', title: 'Intelligent Stores', icon: ShieldCheck },
  { id: 'module-commerce', title: 'Global Commerce', icon: Globe },
  { id: 'module-payroll', title: 'Enterprise Payroll', icon: Briefcase },
  { id: 'module-talent', title: 'HR & Talent', icon: Users },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="absolute top-0 w-full z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-5 h-5 border-[3px] border-brand-dark rounded-sm rotate-45" />
            </div>
            Flori-Core
          </div>

          <div className="hidden lg:flex space-x-10 items-center text-sm font-bold text-slate-400">
            <a href="#features" className="text-white border-b-2 border-brand-green pb-1 transition-all">Features</a>
            
            {/* Modules Dropdown */}
            <div className="group relative py-2">
              <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                Modules
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50">
                <div className="bg-brand-dark/95 backdrop-blur-2xl border border-white/10 rounded-4xl p-6 shadow-2xl shadow-black/50 grid grid-cols-2 gap-2">
                  {modules.map((mod) => (
                    <a 
                      key={mod.id} 
                      href={`#${mod.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/item"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-emerald-500/10 transition-colors">
                        <mod.icon className="w-5 h-5 text-slate-400 group-hover/item:text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover/item:text-white transition-colors">
                        {mod.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="hidden sm:block text-sm font-bold text-white hover:text-brand-green transition-colors">Login</a>
            <a href="/signup" className="px-8 py-3 rounded-full bg-brand-green text-brand-dark text-sm font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              Signup
            </a>
          </div>
        </nav>
      </header>

      <main className="grow">
        <HeroSection />
        <FeaturesSection />
        <div id="pricing">
          <PricingSection />
        </div>
        <ContactForm />
      </main>

      <Footer />
    </div>
  );
}

