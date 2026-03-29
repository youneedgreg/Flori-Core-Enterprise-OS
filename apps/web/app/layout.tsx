import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flori-Core Enterprise OS | Farm Management & Cold Chain",
  description: "Premium enterprise software for precision farming, cold chain tracking, and global logistics.",
  openGraph: {
    title: "Flori-Core Enterprise OS",
    description: "Farm Management & Cold Chain Software",
    url: "https://flori-core.com",
    siteName: "Flori-Core",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flori-Core Enterprise OS",
    description: "Farm Management & Cold Chain Software",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-500/30">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
