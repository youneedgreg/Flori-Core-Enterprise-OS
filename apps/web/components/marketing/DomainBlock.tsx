import type { Domain } from '@/lib/marketing-content';

/** A domain label beside a grid of module cards. */
export function DomainBlock({ domain, first }: { domain: Domain; first?: boolean }) {
  return (
    <div
      id={domain.id}
      className={`grid scroll-mt-24 gap-8 border-t border-white/[0.08] pt-11 lg:grid-cols-[190px_1fr] lg:gap-12 ${
 first ? 'mt-9' : 'mt-11'
 }`}
    >
      <div>
        <h3 className="text-xl font-bold tracking-tight text-white">
          {domain.title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          {domain.blurb}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {domain.modules.map((m) => (
          <div
            key={m.name}
            className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-6 transition-colors hover:border-brand-green/25"
          >
            <h4 className="text-base font-bold text-white">{m.name}</h4>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
