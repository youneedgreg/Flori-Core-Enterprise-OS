'use client';

import { useId, useState } from 'react';
import type { AuditEntry } from '@/lib/marketing-content';

/**
 * The one genuinely interactive element on the marketing pages.
 *
 * Real buttons with aria-expanded rather than clickable divs, and the entry at
 * `defaultOpen` is rendered open on the server so its content is in the HTML
 * before hydration — which is what makes it worth anything to a crawler.
 */
export function AuditTrail({
  entries,
  defaultOpen = 0,
}: {
  entries: AuditEntry[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Audit trail
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          Immutable · append-only
        </span>
      </div>

      {entries.map((entry, i) => {
        const panelId = `${baseId}-panel-${i}`;
        const isOpen = open === i;
        return (
          <div key={entry.op + i} className="border-b border-white/[0.07] last:border-b-0">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="min-w-0">
                <span className="block text-sm text-slate-300">
                  <span className="font-bold text-white">{entry.op}</span>
                  {' · '}
                  {entry.subject}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                  {entry.meta}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                diff
              </span>
            </button>

            {isOpen && (
              <div id={panelId} className="border-t border-white/[0.07] bg-black/20 px-4 py-3 font-mono text-[11px] sm:px-5 sm:text-[12px]">
                {entry.rows.map((row, r) => (
                  <div
                    key={r}
                    className={`flex gap-3 py-1 ${
 row.kind === 'added' ? 'text-emerald-400' : 'text-red-400'
 }`}
                  >
                    <span className="w-24 shrink-0 text-slate-500 sm:w-36">{row.field}</span>
                    <span className="min-w-0 break-words">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="border-t border-white/[0.07] px-5 py-3 text-[11px] leading-relaxed text-slate-600">
        Illustrative records. Entries cannot be edited or deleted — corrections are appended.
      </div>
    </div>
  );
}
