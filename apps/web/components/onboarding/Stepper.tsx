import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="flex items-start justify-between mb-16 w-full max-w-2xl mx-auto px-4 group/stepper">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-4 relative">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 shadow-2xl relative z-10 ${
                i < currentStep
                  ? 'bg-brand-green text-brand-dark shadow-emerald-500/20 scale-90'
                  : i === currentStep
                  ? 'bg-brand-green/20 text-brand-green ring-2 ring-brand-green shadow-emerald-500/10'
                  : 'bg-white/5 text-slate-600 border border-white/5'
              }`}
            >
              {i < currentStep ? (
                <Check className="w-8 h-8 stroke-[3px]" />
              ) : (
                <span className={i === currentStep ? 'animate-pulse' : ''}>{i + 1}</span>
              )}
            </div>
            
            <div className="flex flex-col items-center text-center">
              <span className={`text-[9px] uppercase tracking-[0.3em] font-black transition-all duration-300 whitespace-pre-line max-w-[80px] leading-relaxed ${
                i === currentStep ? 'text-brand-green translate-y-0 opacity-100' : i < currentStep ? 'text-slate-400 opacity-80' : 'text-slate-600 opacity-60'
              }`}>
                {label}
              </span>
            </div>
          </div>
          
          {i < steps.length - 1 && (
            <div className="flex-1 px-2 pt-7">
              <div className="h-0.5 w-full relative overflow-hidden bg-white/5 rounded-full shadow-inner">
                <div 
                  className="absolute inset-0 bg-brand-green transition-all duration-1000 ease-in-out"
                  style={{ transform: `translateX(${i < currentStep ? '0%' : '-100%'})` }}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
