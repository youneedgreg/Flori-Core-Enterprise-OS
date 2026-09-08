'use client';

import Link from 'next/link';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const FIELD =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-brand-green/40 focus:ring-2 focus:ring-brand-green/20';

/**
 * Demo enquiry form.
 *
 * Posts to the API, which emails the enquiry. The version this was ported from
 * flipped to a confirmation panel and sent nothing — a "Request received" that
 * received nothing is worse than no form, because the visitor stops waiting for
 * a reply that was never going to come.
 */
export function DemoForm({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch(`${API_URL}/marketing/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.message ??
            'We could not send your enquiry. Please email us directly.',
        );
      }

      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-3xl border border-white/[0.09] bg-white/[0.03] p-8">
        <h2 className="font-display text-2xl font-bold text-white">
          Request received.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
          Thank you — we&apos;ll be in touch to arrange the walkthrough and confirm
          which departments to cover.
          {variant === 'full' && (
            <>
              {' '}
              In the meantime, the{' '}
              <Link
                href="/compliance-security"
                className="font-bold text-brand-green hover:text-emerald-300"
              >
                compliance and security detail
              </Link>{' '}
              is the page procurement usually asks for.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/[0.09] bg-white/[0.03] p-7">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required />
        <Field label="Farm name" name="farm" required />

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
            Role
          </span>
          <select name="role" defaultValue="Farm Director" className={FIELD}>
            <option>Farm Director</option>
            <option>General Manager</option>
            <option>Finance Head</option>
            <option>Operations Manager</option>
            <option>Other</option>
          </select>
        </label>

        <Field label="Work email" name="email" type="email" required />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Hectares under production" name="hectares" />
        <Field
          label="Approximate headcount (permanent + casual)"
          name="headcount"
          wide
        />

        {variant === 'full' && (
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
              Anything you want the demo to cover (optional)
            </span>
            <textarea name="notes" rows={3} className={FIELD} />
          </label>
        )}

        {/* Honeypot — hidden from people, irresistible to bots. */}
        <div aria-hidden="true" className="hidden">
          <label>
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-400 sm:col-span-2"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="justify-self-start rounded-full bg-brand-green px-7 py-3 text-sm font-black text-[#04221a] shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-60 sm:col-span-2"
        >
          {status === 'sending' ? 'Sending…' : 'Request a demo'}
        </button>

        <p className="text-xs leading-relaxed text-slate-600 sm:col-span-2">
          {variant === 'full'
            ? 'Your details are used for this enquiry only.'
            : "We'll reply from a named person at Flori-Core to arrange a time. Your details are used for this enquiry only."}
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  wide,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>
      <input className={FIELD} name={name} type={type} required={required} />
    </label>
  );
}
