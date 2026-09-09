import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

/** Counted, not typed — the copy said "seventeen" while the data held sixteen. */
const MODULE_COUNT = HOME_DOMAINS.reduce((n, d) => n + d.modules.length, 0);

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
        <section className="relative overflow-hidden border-b border-white/[0.07]">
          {/* The flower carried over from the original landing page. Decorative,
              so it is marked aria-hidden and carries an empty alt. */}
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            <Image
              src="/hero-bg.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-[0.55]"
            />
            <div className="absolute inset-0 bg-[#060d0a]/45" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent_0%,#060d0a_78%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#060d0a]" />
          </div>

          <Container className="relative z-10 grid gap-14 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-32">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-green">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                </span>
                For commercial high-altitude flower farms
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                The operating system for commercial flower farms.
              </h1>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-slate-300">
                One system of record from stem counting on the harvest floor to
                payroll disbursement and certificate expiry — so every department,
                every sensor and every shipment reconciles against the same numbers.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-brand-green px-7 py-3.5 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-95"
                >
                  Check it out — live demo
                </Link>
                <Link
                  href="/book-a-demo"
                  className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-brand-green/40 hover:text-brand-green"
                >
                  Book a walkthrough
                </Link>
              </div>
              <p className="mt-6 text-[13px] text-slate-400">
                A fully seeded farm, one click per role. No sign-up, nothing to install.
              </p>
            </div>

            <div className="fc-reveal">
              <Panel
                label="What a week without a system of record costs"
                chip={<span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />}
              >
                {STAKES.map((s) => (
                  <div
                    key={s.when}
                    className="flex gap-4 border-b border-white/[0.07] px-5 py-4 last:border-b-0"
                  >
                    <span className={`shrink-0 text-sm font-bold ${s.tone}`}>
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
            </div>
          </Container>
        </section>

        {/* ── Failure modes ────────────────────────────────────────────── */}
        <Section>
          <Container className="py-14 sm:py-20">
            <div className="fc-reveal max-w-[60ch]">
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
            <div className="fc-reveal-group mt-11 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {FAILURE_MODES.map((f, i) => (
                <Card key={f.title}>
                  <span className="text-sm font-bold text-brand-green">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-white">
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
          <Container className="py-14 sm:py-20">
            <div className="fc-reveal grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] lg:gap-12">
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

            {/* Every module at a glance, before the detail below. Built from the
                same HOME_DOMAINS data as the blocks, so the list cannot fall out
                of step with what is described further down. */}
            <div className="fc-reveal mt-10 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-7 sm:p-9">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h3 className="text-lg font-bold text-white">
                  Deploy the modules you need. Leave the rest.
                </h3>
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-green">
                  {MODULE_COUNT} modules · 5 domains
                </span>
              </div>
              <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-slate-400">
                Every deployment is configured to the farm. Turn on the pack house
                and cold chain without payroll, or run compliance and stores while
                production stays on paper for a season — modules can be added later
                without a migration, because they were always one database.
              </p>

              <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {HOME_DOMAINS.map((domain) => (
                  <div key={domain.id}>
                    <a
                      href={`#${domain.id}`}
                      className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-green transition-colors hover:text-emerald-300"
                    >
                      {domain.title}
                    </a>
                    <ul className="mt-3 space-y-2">
                      {domain.modules.map((m) => (
                        <li key={m.name} className="flex gap-2.5 text-sm text-slate-300">
                          <span
                            className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-green/60"
                            aria-hidden="true"
                          />
                          {m.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <nav aria-label="Module domains" className="mt-10 flex flex-wrap gap-2">
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
          <Container className="fc-reveal-group grid gap-12 py-20 lg:grid-cols-[1fr_0.85fr]">
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
          <Container className="fc-reveal-group grid gap-12 py-20 lg:grid-cols-2">
            <div>
              <Eyebrow>Security &amp; access</Eyebrow>
              <H2 className="text-2xl sm:text-3xl">
                Each farm&apos;s data is its own. Each role sees only its work.
              </H2>
              <div className="mt-7 grid gap-3">
                {HOME_SECURITY.map((s) => (
                  <Card key={s.title} className="p-5">
                    <h3 className="text-base font-bold text-white">
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
              <div className="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)]">
                {RBAC.map((r) => (
                  <Fragment key={r.role}>
                    <div className="border-white/[0.07] px-5 pb-1 pt-3.5 text-[13px] font-bold text-white sm:border-b sm:py-3.5">
                      {r.role}
                    </div>
                    <div className="border-b border-white/[0.07] px-5 pb-3.5 pt-0 text-[13px] leading-relaxed text-slate-400 sm:pt-3.5">
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
          <Container className="py-14 sm:py-20">
            <div className="fc-reveal max-w-[62ch]">
              <Eyebrow>Built for Kenyan flower farming</Eyebrow>
              <H2>Not a generic ERP with a flower skin.</H2>
              <Lede>
                The specifics that decide whether a system survives contact with a
                Naivasha farm week.
              </Lede>
            </div>
            <div className="fc-reveal-group mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {KENYA_CARDS.map((c) => (
                <Card key={c.title}>
                  <h3 className="text-base font-bold text-white">
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
          <Container className="fc-reveal-group grid gap-12 py-20 lg:grid-cols-[1fr_0.8fr]">
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
