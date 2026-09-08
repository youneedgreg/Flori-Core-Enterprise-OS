import { NextResponse } from 'next/server';

/**
 * Nightly demo maintenance, triggered by Vercel Cron (see apps/web/vercel.json).
 *
 * Calls the API's demo refresh endpoint, which rolls every timestamp in the
 * demo dataset forward so the dashboards always look current. The outbound
 * HTTP call also wakes the Render free-tier service and generates the database
 * activity that stops Neon archiving an idle branch.
 *
 * Vercel Cron sends a GET with `Authorization: Bearer $CRON_SECRET` whenever
 * CRON_SECRET is configured on the project.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const demoToken = process.env.DEMO_REFRESH_TOKEN;

  if (!apiUrl || !demoToken) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL and DEMO_REFRESH_TOKEN must both be set.' },
      { status: 500 },
    );
  }

  const startedAt = Date.now();

  try {
    // Render's free tier sleeps; the first request can take ~60s to wake it.
    const response = await fetch(`${apiUrl}/demo/refresh`, {
      method: 'POST',
      headers: { 'x-demo-token': demoToken },
      signal: AbortSignal.timeout(280_000),
      cache: 'no-store',
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, status: response.status, body },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      tookMs: Date.now() - startedAt,
      ...body,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message, tookMs: Date.now() - startedAt },
      { status: 504 },
    );
  }
}
