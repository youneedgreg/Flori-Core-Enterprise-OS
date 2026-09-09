/**
 * Wakes the API ahead of the first real request.
 *
 * The API runs on a free Render instance, which sleeps after ~15 minutes idle
 * and then takes around twenty seconds to start the container and boot Nest.
 * That cost lands on whichever request comes first — and on the sign-in page
 * that is almost always someone clicking a demo role, so the one interaction
 * that should feel instant is the one guaranteed to be slow.
 *
 * Firing a cheap GET when the page mounts moves the wait into the time the
 * visitor spends reading the roster. It does not make the server faster; it
 * spends the delay where nobody is waiting on it.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Resolves when the API answered, with how long it took. */
export type WarmResult = { ok: boolean; ms: number };

let inFlight: Promise<WarmResult> | null = null;

export function warmApi(): Promise<WarmResult> {
  // One warm-up per page load; repeated mounts share the same request.
  if (inFlight) return inFlight;

  const started = Date.now();
  inFlight = fetch(`${API_URL}/`, { method: 'GET', cache: 'no-store' })
    .then((r) => ({ ok: r.ok, ms: Date.now() - started }))
    .catch(() => ({ ok: false, ms: Date.now() - started }));

  return inFlight;
}

/**
 * Whether the warm-up is still running. Used to decide whether a sign-in that
 * is taking a while is waiting on a cold server rather than on the network.
 */
export function isWarming(): boolean {
  return inFlight !== null;
}
