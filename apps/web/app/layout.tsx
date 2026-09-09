import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LOCALE, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { OG_IMAGE_ALT } from "@/lib/seo";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Required for `alternates.canonical` and openGraph.url to resolve to absolute
  // URLs. Without it Next emits relative canonicals, which search engines ignore.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} Enterprise OS — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "One system of record for commercial flower farms: production, pack house, cold chain, inventory, payroll and audit-ready compliance in a single database.",
  applicationName: `${SITE_NAME} Enterprise OS`,
  // Page-level metadata comes from lib/seo.ts. Defaults here cover the
  // application routes, which do not call that helper.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: LOCALE,
    url: "/",
    title: `${SITE_NAME} Enterprise OS`,
    description: SITE_TAGLINE,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} Enterprise OS`,
    description: SITE_TAGLINE,
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("scroll-smooth", "antialiased", "dark", inter.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-500/30">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
