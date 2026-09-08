/**
 * Central CORS policy for the API.
 *
 * The web app is deployed separately (Vercel) from this API (container host),
 * so every browser call is cross-origin. Allowed origins are configured with
 * env vars rather than hardcoded, so the same image runs in every environment.
 *
 *   CORS_ORIGINS                 Comma-separated exact origins.
 *                                e.g. "https://app.floricore.com,https://flori-core.vercel.app"
 *   CORS_ALLOW_VERCEL_PREVIEWS   "true" to also allow https://*.vercel.app,
 *                                which covers Vercel preview deployments.
 */

const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

function configuredOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (!raw) {
    // No explicit config: assume local development.
    return DEV_ORIGINS;
  }

  return raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function allowVercelPreviews(): boolean {
  return process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true';
}

export function isOriginAllowed(origin: string): boolean {
  if (configuredOrigins().includes(origin.replace(/\/$/, ''))) {
    return true;
  }

  return allowVercelPreviews() && VERCEL_PREVIEW.test(origin);
}

type OriginCallback = (err: Error | null, allow?: boolean) => void;

/**
 * Shared `origin` handler accepted by both Nest's `enableCors` and the
 * socket.io CORS options on `@WebSocketGateway`.
 */
export function corsOriginHandler(
  origin: string | undefined,
  callback: OriginCallback,
): void {
  // Same-origin requests, curl, and container health checks send no Origin.
  if (!origin) {
    callback(null, true);
    return;
  }

  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
}

export const corsOptions = {
  origin: corsOriginHandler,
  credentials: true,
};
