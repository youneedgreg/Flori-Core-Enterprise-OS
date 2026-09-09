import { Fragment } from 'react';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CtaBand } from '@/components/marketing/CtaBand';
import { AuditTrail } from '@/components/marketing/AuditTrail';
import { JsonLd } from '@/components/marketing/JsonLd';
import {
  Section,
  Container,
  Eyebrow,
  H2,
  Panel,
} from '@/components/marketing/primitives';
import { breadcrumbs, graph, webPage } from '@/lib/schema';
import {
  COMPLIANCE_AUDIT,
  COMPLIANCE_RECORDS,
  COMPLIANCE_SECURITY,
  LONG_DISCLAIMER,
  RBAC,
} from '@/lib/marketing-content';

const DESCRIPTION =
  'Certificate registry, spray and chemical logs, an append-only audit trail, per-farm data isolation and role-based access — the detail procurement committees ask for.';

export const metadata: Metadata = pageMetadata({
  title: 'Compliance & Security — Audit-Ready Farm Records',
  socialTitle: 'Compliance & Security — Flori-Core Enterprise OS',
  description: DESCRIPTION,
  path: '/compliance-security',
});

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-[#060d0a]">
      <JsonLd
        data={graph([
          webPage({
            path: '/compliance-security',
            name: 'Compliance & Security — Flori-Core Enterprise OS',
            description:
              'The record an auditor asks for, kept as the work happens.',
          }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Compliance & Security', path: '/compliance-security' },
          ]),
        ])}
      />
      <SiteHeader active="/compliance-security" />

      <main>
        <Section tone="hero">
          <Container className="py-20">
            <Eyebrow>Compliance &amp; Security</Eyebrow>
            <h1 className="mt-4 max-w-[26ch] font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              The record an auditor asks for, kept as the work happens.
            </h1>
            <p className="mt-6 max-w-[64ch] text-base leading-relaxed text-slate-400">
              Certificates, spray logs and chemical usage are captured at the point
              of work by the person doing it — then held in an append-only trail
              that shows who changed what, when, and from where.
            </p>
            <p className="mt-6 max-w-[80ch] text-[13.5px] leading-relaxed text-slate-600">
              {LONG_DISCLAIMER}
            </p>
          </Container>
        </Section>

        <Section>
          <Container className="py-16">
            <h2 className="max-w-[32ch] font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Three records that decide an audit.
            </h2>
            <div className="fc-reveal-group mt-9 grid gap-4 md:grid-cols-3">
              {COMPLIANCE_RECORDS.map((r) => (
                <div
                  key={r.title}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-7"
                >
                  <h3 className="font-display text-lg font-bold text-white">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {r.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <Section tone="panel">
          <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <Eyebrow>Audit trail</Eyebrow>
              <H2 className="text-2xl sm:text-3xl">
                Immutable, attributable, expandable to the field.
              </H2>
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                Entries are append-only: nothing can be edited or deleted after the
                fact, and corrections are written as new entries. Each row expands
                to the field-level diff — the old value, the new value, the user,
                the timestamp and the source.
              </p>
              <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate-400">
                <p>
                  <strong className="font-bold text-white">Who.</strong> Named user
                  and role, or the system rule that fired.
                </p>
                <p>
                  <strong className="font-bold text-white">What.</strong> The exact
                  fields that changed, before and after.
                </p>
                <p>
                  <strong className="font-bold text-white">
                    When and from where.
                  </strong>{' '}
                  Timestamp in EAT, source address and client.
                </p>
              </div>
            </div>
            <AuditTrail entries={COMPLIANCE_AUDIT} defaultOpen={0} />
          </Container>
        </Section>

        <Section>
          <Container className="py-16">
            <Eyebrow>Security</Eyebrow>
            <H2 className="max-w-[34ch] text-2xl sm:text-3xl">
              Each farm&apos;s data is its own. Each role sees only its work.
            </H2>

            <div className="fc-reveal-group mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {COMPLIANCE_SECURITY.map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-7"
                >
                  <h3 className="font-display text-lg font-bold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9">
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
            </div>
          </Container>
        </Section>

        <CtaBand
          heading="Send this to your procurement committee."
          body="We'll answer security, hosting and access questions in writing ahead of the demo."
        />
      </main>

      <SiteFooter />
    </div>
  );
}
