import type { Metadata } from 'next';
import { LOCALE, SITE_NAME } from './site';

export const OG_IMAGE_ALT =
  'Flori-Core Enterprise OS — the operating system for commercial flower farms.';

const OG_IMAGE = {
  url: '/opengraph-image.png',
  width: 1200,
  height: 630,
  alt: OG_IMAGE_ALT,
  type: 'image/png',
};

/**
 * Builds a complete Metadata object for a page.
 *
 * Next.js shallow-merges `openGraph`: a page that declares its own drops every
 * key the root layout set, including the file-convention og:image. Routing every
 * page through this helper is what stops one page quietly losing its social card
 * because it wanted a different title.
 */
export function pageMetadata(opts: {
  /** Used for <title>; the layout template appends the site name. */
  title: string;
  /** Full title for og:title and twitter:title, where no template applies. */
  socialTitle: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const { title, socialTitle, description, path, index = true } = opts;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: LOCALE,
      url: path,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
