import React from 'react';

/**
 * Layout primitives for the marketing pages.
 *
 * These exist so the page files read as structure rather than as walls of
 * utility classes — the section backgrounds and container width in particular
 * were repeated on every page of the site this was ported from.
 */

type SectionTone = 'default' | 'panel' | 'tinted-top' | 'tinted-bottom' | 'hero';

const TONES: Record<SectionTone, string> = {
  default: '',
  panel: 'bg-[#04120d]',
  'tinted-top':
    'bg-[linear-gradient(180deg,rgba(16,185,129,0.05),transparent_30%)]',
  'tinted-bottom':
    'bg-[linear-gradient(180deg,transparent,rgba(16,185,129,0.045))]',
  hero: 'bg-[radial-gradient(120%_80%_at_15%_0%,rgba(16,185,129,0.13),transparent_60%)]',
};

export function Section({
  tone = 'default',
  id,
  className = '',
  children,
}: {
  tone?: SectionTone;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`border-b border-white/[0.07] ${TONES[tone]} ${className}`}
    >
      {children}
    </section>
  );
}

export function Container({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto max-w-[1240px] px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-green">
      {children}
    </span>
  );
}

export function H2({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={`mt-4 font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lede({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`mt-5 text-base leading-relaxed text-slate-400 ${className}`}>
      {children}
    </p>
  );
}

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.09] bg-white/[0.03] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Panel({
  label,
  chip,
  foot,
  children,
}: {
  label?: string;
  chip?: React.ReactNode;
  foot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.03]">
      {(label || chip) && (
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
          {label && (
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {label}
            </span>
          )}
          {chip}
        </div>
      )}
      {children}
      {foot && (
        <div className="border-t border-white/[0.07] px-5 py-3 text-[11px] leading-relaxed text-slate-600">
          {foot}
        </div>
      )}
    </div>
  );
}
