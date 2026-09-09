/**
 * Screenshots of the running demo, keyed by the domain they belong to.
 *
 * Kept beside the domain ids in marketing-content.ts so /platform can pair each
 * section with the screen it describes without the pages hardcoding filenames.
 */
export type Screen = { src: string; alt: string; caption: string };

export const DOMAIN_SCREENS: Record<string, Screen> = {
  grow: {
    src: '/screens/production.webp',
    alt: 'Flori-Core production module showing a propagation timeline across greenhouses',
    caption:
      'Nine active crop cycles across eight varieties, with a propagation timeline per greenhouse and projected stem yield.',
  },
  measure: {
    src: '/screens/telemetry.webp',
    alt: 'Flori-Core telemetry module showing live soil moisture and temperature readings per greenhouse',
    caption:
      'Soil moisture and air temperature per greenhouse, streamed over MQTT and held as time-series alongside the business records.',
  },
  move: {
    src: '/screens/pack-house.webp',
    alt: 'Flori-Core pack house module showing batch intake, QC grading queue and stock levels',
    caption:
      'Batch intake through QC grading to cold store — 32 batches awaiting grading, 108 ready to pack, 633,324 stems in inventory.',
  },
  sell: {
    src: '/screens/sales.webp',
    alt: 'Flori-Core sales and CRM module showing a lead pipeline board',
    caption:
      'Lead pipeline from prospect to contract, with customers, orders and invoices against the same records.',
  },
  run: {
    src: '/screens/financials.webp',
    alt: 'Flori-Core financials module showing accounts receivable and invoice ageing',
    caption:
      'Receivables ageing by bucket, with invoice status and reminders tracked per customer.',
  },
};
