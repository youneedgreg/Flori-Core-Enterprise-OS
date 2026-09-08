# Flori-Core — Deployment Runbook

Split deployment: **Vercel** hosts the Next.js web app, **Render** hosts the NestJS
API, **Neon** hosts Postgres.

## Why split

The API cannot run as serverless functions. Four things need a long-lived process:

| Feature | Location |
|---|---|
| 4 Socket.IO gateways | `telemetry`, `logistics/location`, 2x `notifications` |
| MQTT subscriber (persistent TCP) | `src/mqtt/mqtt.service.ts` |
| 3 in-process cron jobs | `chat/insights`, `compliance`, `procurement.scheduler` |
| Local disk writes | `packing/storage.service.ts` (S3 fallback) |

The web app is a pure frontend — no API routes, it only calls `NEXT_PUBLIC_API_URL`.

---

## Already done

- [x] `apps/web/vercel.json` — build command builds `@flori/shared` before the web app
- [x] `next.config.ts` — `output: "standalone"` now conditional (Docker keeps it, Vercel skips it)
- [x] `apps/api/src/config/cors.ts` — env-driven CORS, wired into `main.ts` + all 4 gateways
- [x] API binds `0.0.0.0` (required by Render)
- [x] TimescaleDB `time_bucket()` replaced with standard `date_bin()` — verified on Neon
- [x] Fixed SQL injection in `telemetry.service.ts` (query-string value went into `$queryRawUnsafe`)
- [x] Neon project `flori-core-db` provisioned, connected to Vercel project `flori-core-web`
- [x] All migrations + catch-up migration applied to Neon — 87 tables
- [x] System roles seeded (8 roles)
- [x] `render.yaml` blueprint committed
- [x] Catch-up migration committed (`20260908210000_catchup_schema_drift`, commit `215500d`)

Vercel project: `gregory-temwas-projects/flori-core-web`
GitHub repo: `youneedgreg/Flori-Core-Enterprise-OS`

---

## Phase A — before anything is public

- [ ] **Remove or guard `GET /flori-core-users`** (`apps/api/src/app.service.ts:12`)
      Unauthenticated. Returns every user in every tenant, with tenant and role joined.
      Nothing in the codebase calls it. It becomes internet-facing the moment Render
      assigns a URL.

---

## Phase B — Vercel (web app)

Settings: https://vercel.com/gregory-temwas-projects/flori-core-web/settings

- [ ] **Build & Deployment → Root Directory → `apps/web`**
      Currently `.`. Mandatory — otherwise `apps/web/vercel.json` is never found and the build fails.

- [ ] **Git → connect** `youneedgreg/Flori-Core-Enterprise-OS`, branch `main`

- [ ] **Environment Variables:**

      NEXT_PUBLIC_API_URL      https://flori-core-api.onrender.com   (confirm in Phase C)
      NEXT_PUBLIC_MAPBOX_TOKEN  <from root .env>

      Leave the Neon vars alone — added by the Marketplace integration, unused by the web app.

- [ ] **Deploy. Record the real domain:** `_______________________________`

---

## Phase C — Render (API)

Blueprint: https://dashboard.render.com/blueprints → New Blueprint Instance → pick the repo.
It reads `render.yaml` automatically.

### Fill these three

Get the database values with:

```bash
grep -E '^(DATABASE_URL|DATABASE_URL_UNPOOLED)=' apps/web/.env.local
```

| Field | Value |
|---|---|
| `DATABASE_URL` | the `DATABASE_URL` line — **pooled**, host contains `-pooler` |
| `DIRECT_DATABASE_URL` | the `DATABASE_URL_UNPOOLED` line — same host **without** `-pooler` |
| `CORS_ORIGINS` | the Vercel domain from Phase B, e.g. `https://flori-core-web.vercel.app` |

> **Do not click "Generate" next to `DATABASE_URL`.** It fills a random secret — correct
> for a JWT key, wrong here. You get a service that silently cannot reach the database.

> Do not swap the two database URLs. The pooled one cannot run migrations (PgBouncer
> transaction mode blocks DDL); the direct one should not take application traffic.

### Fill these four from the root `.env`

```bash
grep -E '^(ANTHROPIC_API_KEY|MISTRAL_API_KEY|RESEND_API_KEY|RESEND_FROM_EMAIL)=' .env
```

### Leave these six blank

`AWS_REGION` · `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` · `AWS_S3_BUCKET_NAME` ·
`MQTT_BROKER_URL` · `SENTRY_DSN`

None exist in `.env` yet. What blank does:

- **AWS blank** — `storage.service.ts:31` warns and writes labels to local disk. Render's
  free tier has no persistent disk, so labels vanish on restart. Fine until you generate
  real packing labels.
- **MQTT blank** — falls back to `mqtt://localhost:1883`, fails, error is caught and logged
  (`mqtt.service.ts:54`). Log noise, no crash. IoT ingest stays dark.
- **Sentry blank** — SDK initializes and does nothing.

`JWT_SECRET` / `JWT_REFRESH_SECRET` do not appear on the form — `render.yaml` marks them
`generateValue: true`, so Render creates them. Do not add them manually, and never reuse
the development values.

- [ ] Deploy. **Record the real URL:** `_______________________________`

---

## Phase D — connect and verify

- [ ] If the Render URL differs from what you set in Phase B, update `NEXT_PUBLIC_API_URL`
      in Vercel **and redeploy**. `NEXT_PUBLIC_*` is compiled into the bundle at build time —
      changing the variable alone does nothing.

- [ ] If the Vercel domain differs from what you set in Phase C, fix `CORS_ORIGINS` on Render
      or every browser request is refused.

- [ ] Verify:

```bash
curl https://<render-url>/                             # -> Hello World!

curl -H "Origin: https://<vercel-domain>" -i https://<render-url>/ \
  | grep -i access-control-allow-origin                # -> your domain echoed back
```

- [ ] Register an account through the UI. That exercises Neon, the seeded roles, and CORS at once.

---

## Ongoing maintenance

**Migrations do not run on deploy.** The Dockerfile start command is
`node apps/api/dist/src/main` — no migrate step, and Render's free plan has no pre-deploy
hook. After every schema change, run manually:

```bash
set -a; . apps/web/.env.local; set +a
cd apps/api && npx prisma migrate deploy
```

**Stop using `prisma db push`.** The database had drifted 129 statements behind
`schema.prisma` — 26 tables (the whole HR/payroll/training/chat/auction stack), 10 enums,
and 4 column additions were missing, because schema edits never got migrations. That drift
made the app unrunnable against a freshly migrated database. Use `prisma migrate dev` for
every change. Check before deploying:

```bash
cd apps/api && npx prisma migrate diff \
  --from-config-datasource --to-schema ./prisma/schema.prisma --exit-code
```

---

## Troubleshooting

### `ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE` during the Render Docker build

```
Cannot verify the identity of the @pnpm/exe.linux-x64 native binary:
it is missing from pnpm-lock.yaml.
```

**Cause.** The Dockerfiles installed pnpm unpinned (`npm install -g pnpm`), so the build got
the latest major. `turbo prune` carries `packageManager: "pnpm@10.7.0"` into the pruned root
`package.json`, so that newer pnpm tried to self-install engine 10.7.0 and demanded an
`@pnpm/exe` integrity entry. This lockfile is v9.0 and has none.

**Fix (applied).** Both Dockerfiles now pin: `npm install -g pnpm@10.7.0 turbo@2.10.12`.
When the running pnpm already matches `packageManager`, it never self-installs.

**If you bump `packageManager` in `package.json`, bump the Dockerfiles to match** — they
must stay in lockstep or this returns.

---

## Known limitations of the current setup

- **Render free tier sleeps after ~15 min idle.** Socket.IO feeds drop and the three crons
  do not fire while asleep. Upgrade to the $7 tier for real use.
- **S3 required** for label storage to survive restarts.
- **MQTT has no broker.** `MQTT_BROKER_URL` pointed at a local EMQX container that will not
  exist in production. IoT ingest is dark until this is hosted.
- **Region:** Neon is in AWS `us-east-1`, so the API runs in Render's `virginia` region to
  keep DB round trips on the same coast. Keep them co-located if you move either.
- **`PRODUCTION.md` is now stale** — it describes AWS RDS + TimescaleDB, which this setup
  replaces.
- **`apps/web/.git` is a stale nested repo** (3 commits, last May 2026, no remote, strictly
  behind the monorepo). It silently shadows git commands run inside `apps/web`. Safe to delete.
