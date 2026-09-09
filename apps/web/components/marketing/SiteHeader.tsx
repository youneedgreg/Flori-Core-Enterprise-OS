import Link from 'next/link';
import { NAV } from '@/lib/site';

/**
 * Marketing header.
 *
 * Still a server component. The mobile menu is a <details> disclosure rather
 * than React state, which keeps it that way: it opens and closes with no
 * JavaScript, is keyboard-operable and announces its expanded state for free.
 * Below the large breakpoint there was previously no navigation at all — the
 * links were simply `hidden`, so a phone could reach nothing but the two CTAs.
 */
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060d0a]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-base font-black tracking-tighter text-white sm:text-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green shadow-lg shadow-emerald-500/20 sm:h-9 sm:w-9 sm:rounded-xl">
            <span className="h-3.5 w-3.5 rotate-45 rounded-sm border-[3px] border-[#04221a] sm:h-4 sm:w-4" />
          </span>
          Flori-Core
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm font-semibold text-slate-400 xl:gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active === item.href ? 'page' : undefined}
                  className={`whitespace-nowrap transition-colors hover:text-white ${
 active === item.href ? 'text-white' : ''
 }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* "Sign in" speaks to people who already have an account. This points
              at the seeded demo, where the sign-in page offers a role to click. */}
          <Link
            href="/login"
            className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-bold text-white transition-colors hover:text-brand-green md:inline-flex"
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green" />
            </span>
            Try the live demo
          </Link>

          <Link
            href="/book-a-demo"
            className="whitespace-nowrap rounded-full bg-brand-green px-4 py-2 text-[13px] font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Book a demo
          </Link>

          {/* Mobile menu */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Open menu"
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:border-brand-green/40 [&::-webkit-details-marker]:hidden"
            >
              <span className="sr-only">Menu</span>
              <span aria-hidden="true" className="flex w-4 flex-col gap-[3px]">
                <span className="h-[1.5px] w-full rounded bg-current" />
                <span className="h-[1.5px] w-full rounded bg-current" />
                <span className="h-[1.5px] w-full rounded bg-current" />
              </span>
            </summary>

            <div className="absolute right-0 top-[calc(100%+10px)] w-[min(78vw,17rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#04120d] shadow-2xl shadow-black/60">
              <ul className="p-2">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active === item.href ? 'page' : undefined}
                      className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5 hover:text-white ${
 active === item.href ? 'text-white' : 'text-slate-300'
 }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-white/10 pt-1">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-brand-green transition-colors hover:bg-white/5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
                    Try the live demo
                  </Link>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
