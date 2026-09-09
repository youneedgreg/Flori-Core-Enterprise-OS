import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CtaBand } from '@/components/marketing/CtaBand';
import { JsonLd } from '@/components/marketing/JsonLd';
import { Section, Container, Eyebrow } from '@/components/marketing/primitives';
import { breadcrumbs, graph, webPage } from '@/lib/schema';
import { FAQ } from '@/lib/marketing-content';
import { ID, SITE_URL } from '@/lib/site';

const DESCRIPTION =
  'Deployment, per-farm data isolation, NSSF/NHIF/PAYE payroll, cold chain alerts, the audit trail and pricing — the questions farm directors and procurement ask.';

export const metadata: Metadata = pageMetadata({
  title: 'FAQ — Flower Farm Software Questions Answered',
  socialTitle: 'Flori-Core FAQ — Flower Farm Software Questions Answered',
  description: DESCRIPTION,
  path: '/faq',
});

/** Answer text here is identical to what renders below, as Google requires. */
const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/faq#faqpage`,
  url: `${SITE_URL}/faq`,
  name: 'Frequently asked questions — Flori-Core Enterprise OS',
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.software },
  inLanguage: 'en-KE',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#060d0a]">
      <JsonLd
        data={graph([
          faqPage,
          webPage({
            path: '/faq',
            name: 'FAQ — Flori-Core Enterprise OS',
            description: 'The questions farms actually ask.',
          }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ])}
      />
      <SiteHeader active="/faq" />

      <main>
        <Section tone="hero">
          <Container className="py-20">
            <Eyebrow>Frequently asked</Eyebrow>
            <h1 className="mt-4 max-w-[24ch] font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              The questions farms actually ask.
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-slate-400">
              Deployment, data isolation, statutory payroll, the cold chain and what
              an auditor will find. If your procurement committee has a question that
              is not here,{' '}
              <Link href="/book-a-demo" className="font-bold text-brand-green hover:text-emerald-300">
                ask it in the enquiry
              </Link>{' '}
              and we will answer in writing before the demo.
            </p>
          </Container>
        </Section>

        <Section>
          <Container className="py-16">
            <div className="fc-reveal-group grid gap-4 lg:grid-cols-2">
              {FAQ.map((item) => (
                <article
                  key={item.q}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-7"
                >
                  <h2 className="font-display text-lg font-bold leading-snug text-white">
                    {item.q}
                  </h2>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-slate-400">
                    {item.a}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </Section>

        <CtaBand
          heading="Still deciding? See it run against your own operation."
          body={
            <>
              We walk the modules that matter to your farm and answer
              procurement&apos;s questions in writing. The{' '}
              <Link href="/compliance-security" className="font-bold text-brand-green hover:text-emerald-300">
                compliance and security detail
              </Link>{' '}
              is the page committees usually read first.
            </>
          }
        />
      </main>

      <SiteFooter />
    </div>
  );
}
