'use client';

import React from 'react';
import { Globe, Users, Briefcase, AtSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-white/5 pt-24 pb-12 text-left">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
          
          {/* Logo & Description */}
          <div className="lg:col-span-4 text-left">
            <div className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2 mb-8 justify-start">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-brand-dark rounded-sm rotate-45" />
              </div>
              Flori-Core
            </div>
            <p className="text-slate-400 font-light leading-relaxed max-w-sm">
              The world&apos;s leading enterprise operating system for the global floral commerce industry. 
              From farm to vase, we provide the digital infrastructure.
            </p>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-2 text-left">
            <h4 className="text-white font-bold mb-8 tracking-tight">Product</h4>
            <ul className="space-y-4 text-slate-400 text-sm font-light">
              <li><a href="#features" className="hover:text-brand-green transition-colors">Features</a></li>
              <li><a href="#modules" className="hover:text-brand-green transition-colors">Modules</a></li>
              <li><a href="#contact" className="hover:text-brand-green transition-colors">Contact</a></li>
              <li><a href="#pricing" className="hover:text-brand-green transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2 text-left">
            <h4 className="text-white font-bold mb-8 tracking-tight">Company</h4>
            <ul className="space-y-4 text-slate-400 text-sm font-light">
              <li><Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-green transition-colors">Terms of Service</Link></li>
              <li><Link href="#contact" className="hover:text-brand-green transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Smaller Contact (Replacing Subscribe) */}
          <div className="lg:col-span-4 text-left">
            <h4 className="text-white font-bold mb-4 tracking-tight">Join the Network</h4>
            <p className="text-slate-500 text-[10px] mb-6 uppercase tracking-[0.2em] font-black">Quick Contact</p>
            <div className="relative group max-w-sm">
              <input 
                type="email" 
                placeholder="Work email address" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition-all font-light"
              />
              <button className="absolute right-2 top-2 bottom-2 px-4 bg-brand-green rounded-xl flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 active:scale-95">
                <ArrowRight className="w-5 h-5 text-brand-dark" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] text-slate-600 font-light tracking-widest uppercase">
            &copy; {new Date().getFullYear()} Flori-Core Enterprise OS. Global Floriculture Standard.
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-slate-500 hover:text-brand-green transition-colors">
              <Globe className="w-5 h-5 hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="text-slate-500 hover:text-brand-green transition-colors">
              <Users className="w-5 h-5 hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="text-slate-500 hover:text-brand-green transition-colors">
              <Briefcase className="w-5 h-5 hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="text-slate-500 hover:text-brand-green transition-colors">
              <AtSign className="w-5 h-5 hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
