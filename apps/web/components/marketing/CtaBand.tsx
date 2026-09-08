import Link from 'next/link';
import React from 'react';

export function CtaBand({
  heading,
  body,
  children,
}: {
  heading: string;
  body: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.07] bg-[#04120d]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h2 className="max-w-[28ch] font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-slate-400">
            {body}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {children ?? (
            <Link
              href="/book-a-demo"
              className="rounded-full bg-brand-green px-7 py-3 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
            >
              Book a demo
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
