import Link from 'next/link';
import { CERTIFICATION_DISCLAIMER, FOOTER_LINKS, SITE_TAGLINE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#04120d]">
      <div className="mx-auto max-w-[1240px] px-6 py-14 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 text-lg font-black tracking-tighter text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green">
                <span className="h-3.5 w-3.5 rotate-45 rounded-sm border-[3px] border-[#04221a]" />
              </span>
              Flori-Core
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              {SITE_TAGLINE}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-1 gap-y-3 text-sm text-slate-400 sm:grid-cols-2 sm:gap-x-12">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/[0.07] pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
            {CERTIFICATION_DISCLAIMER}
          </p>
          <p className="mt-4 text-xs text-slate-600">
            © {new Date().getFullYear()} Flori-Core. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
