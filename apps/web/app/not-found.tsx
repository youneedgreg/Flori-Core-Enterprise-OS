'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated Icon Container */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <Search className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        {/* 404 Header */}
        <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter leading-none mb-4 selection:bg-emerald-500/30">
          <span className="text-gradient drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">404</span>
        </h1>

        {/* Message Container */}
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Lost in the <span className="text-emerald-400">Greenhouse?</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">
            The page you are looking for has been moved, deleted, or never existed in our Flori-Core system. 
            Don&apos;t worry, your dashboard is just a click away.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 px-10 py-4 rounded-full bg-emerald-500 text-[#0b0f19] font-bold transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 group"
          >
            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            Return Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-10 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white font-bold transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>
      </div>

      {/* Footer / Brand */}
      <div className="relative z-10 py-10 text-center">
        <div className="text-sm font-bold tracking-widest uppercase text-slate-600 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Flori-Core Enterprise OS
        </div>
      </div>
    </div>
  );
}
