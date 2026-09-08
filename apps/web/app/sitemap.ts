import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const LAST_MODIFIED = new Date('2026-09-08');

/**
 * Marketing routes only. The application's own pages are excluded here and in
 * robots.ts — a sitemap is a statement about what is worth indexing, and a
 * sign-in form is not.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string;
    changeFrequency: 'monthly' | 'yearly';
    priority: number;
  }[] = [
    { path: '/', changeFrequency: 'monthly', priority: 1 },
    { path: '/platform', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/compliance-security', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/book-a-demo', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ];

  return routes.map((r) => ({
    // Root canonical is emitted without a trailing slash; keep the sitemap identical.
    url: r.path === '/' ? SITE_URL : `${SITE_URL}${r.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
