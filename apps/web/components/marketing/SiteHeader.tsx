import Link from 'next/link';
import { NAV } from '@/lib/site';

/**
 * Marketing header.
 *
 * A server component: it holds no state, and keeping it off the client bundle
 * matters more here than anywhere else in the app — these pages exist to be
 * crawled and to load fast on a phone.
 */
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060d0a]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 text-lg font-black tracking-tighter text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green shadow-lg shadow-emerald-500/20">
            <span className="h-4 w-4 rotate-45 rounded-sm border-[3px] border-[#04221a]" />
          </span>
          Flori-Core
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm font-semibold text-slate-400">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active === item.href ? 'page' : undefined}
                  className={`transition-colors hover:text-white ${
                    active === item.href ? 'text-white' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-bold text-white transition-colors hover:text-brand-green sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/book-a-demo"
            className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
