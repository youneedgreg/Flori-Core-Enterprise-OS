import { Fragment } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { graph, software, webPage } from '@/lib/schema';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { AuditTrail } from '@/components/marketing/AuditTrail';
import { DomainBlock } from '@/components/marketing/DomainBlock';
import { JsonLd } from '@/components/marketing/JsonLd';
import { DemoForm } from '@/components/marketing/DemoForm';
import {
  Section,
  Container,
  Eyebrow,
  H2,
  Lede,
  Card,
  Panel,
} from '@/components/marketing/primitives';
import {
  FAILURE_MODES,
  HOME_AUDIT,
  HOME_COMPLIANCE_BULLETS,
  HOME_DISCLAIMER,
  HOME_DOMAINS,
  HOME_SECURITY,
  KENYA_CARDS,
  RBAC,
  STAKES,
} from '@/lib/marketing-content';

const DESCRIPTION =
  'One system of record for commercial flower farms: production, pack house, cold chain, inventory, payroll and audit-ready compliance in a single database.';

export const metadata: Metadata = pageMetadata({
  // The root layout's title template applies to child segments only, and this
  // page shares the root segment — so the brand is spelled out here, or the
  // home page ships the one title on the site with no brand in it.
  title: 'Flower Farm Management Software — Flori-Core Enterprise OS',
  socialTitle: 'Flower Farm Management Software — Flori-Core Enterprise OS',
  description: DESCRIPTION,
  path: '/',
});

const DOMAIN_LINKS = [
  { href: '#grow', label: 'Grow' },
  { href: '#measure', label: 'Measure' },
  { href: '#move', label: 'Move' },
  { href: '#sell', label: 'Sell & buy' },
  { href: '#run', label: 'Run' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060d0a]">
      <JsonLd
        data={graph([
          software,
          webPage({
            path: '/',
            name: 'Flori-Core Enterprise OS',
            description: 'One system of record for commercial flower farms.',
          }),
        ])}
      />
      <SiteHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Section tone="hero">
          <Container className="grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
                For commercial high-altitude flower farms
              </p>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[54px]">
                The operating system for commercial flower farms.
              </h1>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-slate-400">
                One system of record from stem counting on the harvest floor to
                payroll disbursement and certificate expiry — so every department,
                every sensor and every shipment reconciles against the same numbers.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/book-a-demo"
                  className="rounded-full bg-brand-green px-7 py-3.5 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
                >
                  Book a demo
                </Link>
                <Link
                  href="/platform"
                  className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-brand-green/40 hover:text-brand-green"
                >
                  See the platform
                </Link>
              </div>
              <p className="mt-6 text-[13px] text-slate-600">
                Deployed per farm with multi-tenant data isolation. Request pricing
                on the demo call.
              </p>
            </div>

            <Panel
              label="What a week without a system of record costs"
              chip={<span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />}
            >
              {STAKES.map((s) => (
                <div
                  key={s.when}
                  className="flex gap-4 border-b border-white/[0.07] px-5 py-4 last:border-b-0"
                >
                  <span className={`shrink-0 font-display text-sm font-bold ${s.tone}`}>
                    {s.when}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{s.what}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                      {s.why}
                    </p>
                  </div>
                </div>
              ))}
            </Panel>
          </Container>
        </Section>

        {/* ── Failure modes ────────────────────────────────────────────── */}
        <Section>
          <Container className="py-20">
            <div className="max-w-[60ch]">
              <Eyebrow>The failure modes</Eyebrow>
              <H2>
                Spreadsheets don&apos;t fail loudly. They fail four days before an
                audit.
              </H2>
              <Lede>
                Every one of these is a disconnection between two departments that
                never share a record.
              </Lede>
            </div>
            <div className="mt-11 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {FAILURE_MODES.map((f, i) => (
                <Card key={f.title}>
                  <span className="font-display text-sm font-bold text-brand-green">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    {f.body}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── The system of record ─────────────────────────────────────── */}
        <Section id="system" tone="tinted-top">
          <Container className="py-20">
            <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] lg:gap-12">
              <div>
                <Eyebrow>The system of record</Eyebrow>
                <H2>Seventeen modules, one database, one set of numbers.</H2>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Organised the way a farm is organised — by department, not by
                feature list. A stem graded in the pack house is the same record
                finance invoices and compliance audits.
              </p>
            </div>

            <nav aria-label="Module domains" className="mt-9 flex flex-wrap gap-2">
              {DOMAIN_LINKS.map((d) => (
                <a
                  key={d.href}
                  href={d.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] font-bold text-slate-300 transition-colors hover:border-brand-green/40 hover:text-brand-green"
                >
                  {d.label}
                </a>
              ))}
            </nav>

            {HOME_DOMAINS.map((d, i) => (
              <DomainBlock key={d.id} domain={d} first={i === 0} />
            ))}
          </Container>
        </Section>

        {/* ── Compliance ───────────────────────────────────────────────── */}
        <Section id="compliance" tone="panel">
          <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <Eyebrow>Audit-ready, year-round</Eyebrow>
              <H2>
                Evidence you don&apos;t have to assemble the week before the auditor
                arrives.
              </H2>
              <Lede>
                Certificate records, spray logs and chemical usage are captured as
                work happens, not reconstructed afterwards. Every change is written
                to an immutable audit trail: who changed what, when, and from where
                — expandable to the field-level diff.
              </Lede>

              <div className="mt-8 space-y-4">
                {HOME_COMPLIANCE_BULLETS.map((b) => (
                  <div key={b.lead} className="flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-relaxed text-slate-400">
                      <strong className="font-bold text-white">{b.lead}</strong>{' '}
                      {b.body}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-xs leading-relaxed text-slate-600">
                {HOME_DISCLAIMER}
              </p>
            </div>

            <AuditTrail entries={HOME_AUDIT} defaultOpen={0} />
          </Container>
        </Section>

        {/* ── Security & access ────────────────────────────────────────── */}
        <Section>
          <Container className="grid gap-12 py-20 lg:grid-cols-2">
            <div>
              <Eyebrow>Security &amp; access</Eyebrow>
              <H2 className="text-2xl sm:text-3xl">
                Each farm&apos;s data is its own. Each role sees only its work.
              </H2>
              <div className="mt-7 grid gap-3">
                {HOME_SECURITY.map((s) => (
                  <Card key={s.title} className="p-5">
                    <h3 className="font-display text-base font-bold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                      {s.body}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            <Panel label="Role-based access">
              <div className="grid grid-cols-[150px_minmax(0,1fr)]">
                {RBAC.map((r) => (
                  <Fragment key={r.role}>
                    <div className="border-b border-white/[0.07] px-5 py-3.5 font-display text-[13px] font-bold text-white">
                      {r.role}
                    </div>
                    <div className="border-b border-white/[0.07] px-5 py-3.5 text-[13px] leading-relaxed text-slate-400">
                      {r.scope}
                    </div>
                  </Fragment>
                ))}
              </div>
            </Panel>
          </Container>
        </Section>

        {/* ── Built for Kenya ──────────────────────────────────────────── */}
        <Section tone="tinted-bottom">
          <Container className="py-20">
            <div className="max-w-[62ch]">
              <Eyebrow>Built for Kenyan flower farming</Eyebrow>
              <H2>Not a generic ERP with a flower skin.</H2>
              <Lede>
                The specifics that decide whether a system survives contact with a
                Naivasha farm week.
              </Lede>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {KENYA_CARDS.map((c) => (
                <Card key={c.title}>
                  <h3 className="font-display text-base font-bold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    {c.body}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Demo ─────────────────────────────────────────────────────── */}
        <section id="demo" className="bg-[#04120d]">
          <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <Eyebrow>Book a demo</Eyebrow>
              <H2 className="text-2xl sm:text-3xl">
                A walkthrough against your farm, not a slide deck.
              </H2>
              <Lede className="text-sm">
                Tell us the shape of the operation and we&apos;ll run the demo on the
                departments that matter to you — pack house and cold chain, payroll
                and casual labour, or the compliance registry.
              </Lede>
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                Pricing depends on hectares, headcount and modules deployed.{' '}
                <Link href="/book-a-demo" className="font-bold text-brand-green hover:text-emerald-300">
                  Talk to us
                </Link>{' '}
                and we&apos;ll quote against your scope.
              </p>
            </div>
            <DemoForm variant="compact" />
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
