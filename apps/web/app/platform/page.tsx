import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CtaBand } from '@/components/marketing/CtaBand';
import { JsonLd } from '@/components/marketing/JsonLd';
import { Section, Container, Eyebrow } from '@/components/marketing/primitives';
import { breadcrumbs, graph, webPage } from '@/lib/schema';
import { PLATFORM_DOMAINS } from '@/lib/marketing-content';

const DESCRIPTION =
  'Seventeen modules across Grow, Measure, Move, Sell & Buy and Run: farm zones, IoT telemetry, pack house, cold room, logistics, sales, payroll and compliance.';

export const metadata: Metadata = pageMetadata({
  title: 'Platform — 17 Modules, One Farm Database',
  socialTitle: 'Platform — 17 Modules, One Farm Database | Flori-Core',
  description: DESCRIPTION,
  path: '/platform',
});

const ANCHORS = [
  { href: '#grow', label: 'Grow' },
  { href: '#measure', label: 'Measure' },
  { href: '#move', label: 'Move' },
  { href: '#sell', label: 'Sell & buy' },
  { href: '#run', label: 'Run' },
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-[#060d0a]">
      <JsonLd
        data={graph([
          webPage({
            path: '/platform',
            name: 'Platform — Flori-Core Enterprise OS',
            description:
              'Seventeen modules grouped into five domains, sharing one database.',
          }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Platform', path: '/platform' },
          ]),
        ])}
      />
      <SiteHeader active="/platform" />

      <main>
        <Section tone="hero">
          <Container className="py-20">
            <Eyebrow>Platform</Eyebrow>
            <h1 className="mt-4 max-w-[24ch] font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Every department on one record.
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-slate-400">
              Seventeen modules grouped into five domains. They share one database,
              so a graded stem, its cold room hours, its invoice and its spray
              history are the same record seen from different desks.
            </p>
            <nav aria-label="Module domains" className="mt-8 flex flex-wrap gap-2">
              {ANCHORS.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] font-bold text-slate-300 transition-colors hover:border-brand-green/40 hover:text-brand-green"
                >
                  {a.label}
                </a>
              ))}
            </nav>
          </Container>
        </Section>

        {PLATFORM_DOMAINS.map((domain, i) => (
          <Section
            key={domain.id}
            id={domain.id}
            tone={i % 2 === 1 ? 'panel' : 'default'}
            className="scroll-mt-20"
          >
            <Container className="py-16">
              <div className="flex flex-wrap items-baseline gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {domain.title}
                </h2>
                <p className="text-[15px] text-slate-400">{domain.blurb}</p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {domain.modules.map((m) => (
                  <div
                    key={m.name}
                    className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-7"
                  >
                    <h3 className="font-display text-lg font-bold text-white">
                      {m.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {m.body}
                      {m.name === 'Compliance' && (
                        <>
                          {' '}
                          <Link
                            href="/compliance-security"
                            className="font-bold text-brand-green hover:text-emerald-300"
                          >
                            See the detail
                          </Link>
                          .
                        </>
                      )}
                    </p>
                    {m.features && (
                      <ul className="mt-4 space-y-1.5">
                        {m.features.map((f) => (
                          <li
                            key={f}
                            className="flex gap-2.5 text-[13px] leading-relaxed text-slate-500"
                          >
                            <span
                              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-green/60"
                              aria-hidden="true"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </Section>
        ))}

        <CtaBand
          heading="See it run against your own operation."
          body="We'll walk the modules that matter to your farm and answer procurement's questions in writing."
        >
          <Link
            href="/book-a-demo"
            className="rounded-full bg-brand-green px-7 py-3 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
          >
            Book a demo
          </Link>
          <Link
            href="/book-a-demo"
            className="rounded-full border border-white/15 px-7 py-3 text-sm font-bold text-white transition-colors hover:border-brand-green/40 hover:text-brand-green"
          >
            Request pricing
          </Link>
        </CtaBand>
      </main>

      <SiteFooter />
    </div>
  );
}
