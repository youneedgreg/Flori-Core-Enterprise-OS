import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { DemoForm } from '@/components/marketing/DemoForm';
import { JsonLd } from '@/components/marketing/JsonLd';
import { Container, Eyebrow } from '@/components/marketing/primitives';
import { breadcrumbs, graph, webPage } from '@/lib/schema';
import { CONTACT_NOTES } from '@/lib/marketing-content';

const DESCRIPTION =
  'See Flori-Core run against your own operation. Tell us hectares, headcount and the departments that matter, and we walk the modules your farm actually uses.';

export const metadata: Metadata = pageMetadata({
  title: 'Book a Demo — Flower Farm Software',
  socialTitle: 'Book a Demo — Flori-Core Flower Farm Software',
  description: DESCRIPTION,
  path: '/book-a-demo',
});

export default function BookADemoPage() {
  return (
    <div className="min-h-screen bg-[#060d0a]">
      <JsonLd
        data={graph([
          webPage({
            path: '/book-a-demo',
            name: 'Book a demo — Flori-Core Enterprise OS',
            description: 'A walkthrough against your farm, not a slide deck.',
            type: 'ContactPage',
          }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Book a demo', path: '/book-a-demo' },
          ]),
        ])}
      />
      <SiteHeader active="/book-a-demo" />

      <main className="bg-[radial-gradient(120%_80%_at_15%_0%,rgba(16,185,129,0.13),transparent_60%)]">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_0.8fr] lg:py-24">
          <div>
            <Eyebrow>Book a demo</Eyebrow>
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
              A walkthrough against your farm, not a slide deck.
            </h1>
            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-slate-400">
              Tell us the shape of the operation and we&apos;ll run the demo on the
              departments that matter to you — pack house and cold chain, payroll
              and casual labour, or the compliance registry.
            </p>

            <div className="mt-8 flex flex-col gap-5 border-t border-white/[0.08] pt-7">
              {CONTACT_NOTES.map((n) => (
                <div key={n.title}>
                  <h2 className="font-display text-base font-bold text-white">
                    {n.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {n.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <DemoForm variant="full" />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
