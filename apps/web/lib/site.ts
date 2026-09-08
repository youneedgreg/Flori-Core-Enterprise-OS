/**
 * Single source of truth for the site origin, navigation and shared SEO copy.
 *
 * Set NEXT_PUBLIC_SITE_URL in the Vercel project to the real production origin.
 * Failing that this falls back to Vercel's own production URL, and finally to a
 * placeholder — canonicals and the sitemap are absolute, so an unset origin
 * silently publishes the wrong ones.
 */
const FALLBACK_ORIGIN = 'https://flori-core.example';

function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;
  return FALLBACK_ORIGIN;
}

export const SITE_URL = resolveOrigin();
export const IS_PLACEHOLDER_ORIGIN = SITE_URL === FALLBACK_ORIGIN;

export const SITE_NAME = 'Flori-Core';
export const SITE_TAGLINE = 'The operating system for commercial flower farms.';
export const LOCALE = 'en_KE';

export const absolute = (path: string) =>
  new URL(path, `${SITE_URL}/`).toString();

/** Stable JSON-LD node ids, so every page references one entity rather than a copy. */
export const ID = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  software: `${SITE_URL}/#software`,
} as const;

export type NavItem = { href: string; label: string };

export const NAV: NavItem[] = [
  { href: '/platform', label: 'Platform' },
  { href: '/compliance-security', label: 'Compliance & Security' },
  { href: '/faq', label: 'FAQ' },
  { href: '/book-a-demo', label: 'Contact' },
];

export const FOOTER_LINKS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/platform', label: 'Platform' },
  { href: '/compliance-security', label: 'Compliance & Security' },
  { href: '/faq', label: 'FAQ' },
  { href: '/book-a-demo', label: 'Contact / Book a demo' },
  { href: '/privacy', label: 'Privacy notice' },
  { href: '/terms', label: 'Terms' },
];

/**
 * Routes that exist for signed-in users, not for search engines. Listed once
 * here and consumed by robots.ts — a marketing page added later is indexed by
 * default, which is the safer way round for a site whose purpose is to be found.
 */
export const NON_INDEXABLE_PATHS = [
  '/dashboard',
  '/login',
  '/signup',
  '/onboarding',
  '/change-password',
  '/driver',
  '/flori-core-dashboard',
  '/api',
];

export const CERTIFICATION_DISCLAIMER =
  'Flori-Core helps farms maintain and evidence their own certifications. It does not issue or guarantee certification and is not affiliated with any certification body.';
