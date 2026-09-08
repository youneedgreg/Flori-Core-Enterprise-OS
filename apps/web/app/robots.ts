import type { MetadataRoute } from 'next';
import { NON_INDEXABLE_PATHS, SITE_URL } from '@/lib/site';

/**
 * Unlike the standalone marketing site, this deployment also serves the signed-in
 * application. Those routes are crawlable but worthless in an index — and a login
 * page ranking for the product name is actively bad — so they are excluded here
 * rather than page by page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No trailing slash: `/login/` would block only paths *below* /login,
      // leaving the page itself crawlable. `/login` covers both.
      disallow: NON_INDEXABLE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
