'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth';
import { warmApi } from '@/lib/warm-api';
import { useSlowNotice } from '@/lib/use-slow-notice';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demo';

/**
 * One-click role switcher for the demo deployment.
 *
 * Every button is disabled while any one of them is in flight. That is
 * deliberate rather than lazy: a second click mid-request would issue a second
 * session, and the visible outcome would be whichever redirect resolved last —
 * which reads as the switcher picking a role at random. The account being
 * signed in as says so; the rest simply stop accepting clicks.
 */
export function DemoAccounts() {
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Start the server warming while the visitor reads the roster, so the click
  // that follows is not the request that pays for the cold start.
  useEffect(() => {
    void warmApi();
  }, []);

  const showColdNotice = useSlowNotice(pendingEmail !== null);

  const handleClick = async (email: string) => {
    setPendingEmail(email);
    try {
      const destination = await signIn(email, DEMO_PASSWORD);
      window.location.href = destination;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      toast.error(message);
      setPendingEmail(null);
    }
  };

  const busy = pendingEmail !== null;

  return (
    <div className="mt-10 pt-8 border-t border-white/10">
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-3">
        Demo Accounts
      </p>
      <p className="text-xs text-slate-500 leading-relaxed mb-6">
        Every seeded account uses the password{' '}
        <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px]">
          {DEMO_PASSWORD}
        </code>
        . Pick a role to sign in directly.
      </p>

      {showColdNotice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-300/90"
        >
          Waking the demo server. It sleeps after fifteen minutes idle, so the
          first sign-in can take up to a minute. Later ones are immediate.
        </p>
      )}

      <ul className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => {
          const isPending = pendingEmail === account.email;
          return (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => handleClick(account.email)}
                disabled={busy}
                aria-label={`Sign in as ${account.label}`}
                className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-brand-green/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed group/role"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white truncate">
                    {account.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">
                    {account.shows}
                  </span>
                </span>
                {isPending ? (
                  <span className="w-4 h-4 mt-0.5 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin shrink-0" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 mt-0.5 text-slate-600 group-hover/role:text-brand-green transition-colors shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
