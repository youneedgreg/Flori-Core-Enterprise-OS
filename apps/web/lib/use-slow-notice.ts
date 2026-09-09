'use client';

import { useEffect, useState } from 'react';

/**
 * True once `active` has been running longer than `afterMs`.
 *
 * A spinner that sits still for twenty seconds reads as broken, and the honest
 * explanation — the server is starting — only helps if it appears while the
 * person is still waiting rather than after.
 */
export function useSlowNotice(active: boolean, afterMs = 3000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(timer);
  }, [active, afterMs]);

  return slow;
}
