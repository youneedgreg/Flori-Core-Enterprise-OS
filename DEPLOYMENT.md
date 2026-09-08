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

- [x] Dockerfiles pin `pnpm@10.7.0` / `turbo@2.10.12` (see Troubleshooting)
- [x] Removed unauthenticated `GET /flori-core-users`
- [x] **Web deployed and live** — https://flori-core-web.vercel.app
- [x] **API deployed and live** — https://flori-core-api.onrender.com
- [x] End-to-end verified: health 200, CORS allows the Vercel domain, refuses others

Vercel project: `gregory-temwas-projects/flori-core-web`
GitHub repo: `youneedgreg/Flori-Core-Enterprise-OS`
Live web: https://flori-core-web.vercel.app
Live API: https://flori-core-api.onrender.com

---

## Phase A — before anything is public

- [x] **Removed `GET /flori-core-users`** — was unauthenticated and returned every user in
      every tenant. Deleted from `app.controller.ts` and `app.service.ts`.
      **Not yet deployed** — push to Render to close it on the live API.

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

- [x] `NEXT_PUBLIC_API_URL` baked into the production bundle as
      `https://flori-core-api.onrender.com` (verified by reading the deployed client chunks)
- [x] `CORS_ORIGINS` on Render matches the production alias `https://flori-core-web.vercel.app`
- [x] `curl https://flori-core-api.onrender.com/` -> 200 `Hello World!`
- [x] CORS echoes the Vercel domain; a foreign origin gets no allow header

### Still open

- [ ] **Deploy the `/flori-core-users` removal** — push so Render rebuilds.
- [ ] **Register an account through the UI.** The definitive end-to-end test: exercises
      Neon, the seeded roles, JWT issuance, and CORS in one flow.
- [x] **Preview deployments wired.** `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_MAPBOX_TOKEN`
      added to the **Preview** scope (all branches). Render already allows preview origins
      via `CORS_ALLOW_VERCEL_PREVIEWS=true`, so PR previews now reach the live API.

      > CLI note: `vercel env add <name> preview --value ... --yes` still blocks asking for a
      > git branch. Pass an empty string as the positional branch argument to mean
      > "all preview branches":
      >
      > ```bash
      > vercel env add NEXT_PUBLIC_API_URL preview "" --value '<url>' --yes
      > ```

## Demo data

One fully-populated tenant — **Waridi Flowers Ltd** (slug `waridi`), a Naivasha rose farm
with 12 months of history across every module.

### Seeding

```bash
set -a; . apps/web/.env.local; set +a
cd apps/api && pnpm demo:seed
```

> **This TRUNCATES every table except `roles` before seeding.** It is repeatable by design
> and must never be pointed at a database holding real data.

Roughly 80k rows: 8 login users, 68 employees, 14 zones, 8 rose varieties, 30 crop cycles,
~49k telemetry readings (hourly for the last 30 days, 6-hourly before that), ~230 orders
with invoices and payments, 260 batches with QC logs and packed boxes, full chart of
accounts with journals, 12 monthly payroll runs with payslips, procurement from purchase
request through PO, GRN, vendor invoice and payment, plus deliveries, training, appraisals
and audit logs.

### Login credentials

Every account uses the same password: **`FloriCore!Demo2026`**

| Email | Role | Position |
|---|---|---|
| `admin@waridi.demo` | gold_admin | Managing Director (full access) |
| `supervisor@waridi.demo` | field_supervisor | Head of Production |
| `qc@waridi.demo` | qc_lead | QC Lead |
| `accountant@waridi.demo` | accountant | Financial Controller |
| `hr@waridi.demo` | hr_manager | HR Manager |
| `driver@waridi.demo` | driver | Lead Driver |
| `stores@waridi.demo` | store_manager | Stores Manager |
| `sales@waridi.demo` | sales_agent | Export Sales Lead |

> A shared password on a public URL means anyone who finds the link can sign in as
> `gold_admin`. Fine for a demo; never reuse this pattern for a real tenant.

### Nightly refresh

A Vercel Cron job runs at **01:00 UTC** daily (`apps/web/vercel.json`):

`/api/cron/demo-refresh` → `POST {API}/demo/refresh`

It shifts every timestamp column in the schema forward by the number of whole days since
the data was last current, so relative spacing is preserved (an invoice raised three days
after dispatch still is) and the dashboards never look abandoned. The outbound call also
wakes the sleeping Render service and produces the database activity that stops Neon
archiving an idle branch.

Required environment variables:

| Variable | Where | Purpose |
|---|---|---|
| `DEMO_REFRESH_TOKEN` | **both** Render and Vercel | Shared secret; must match exactly. The `/demo/*` endpoints return 403 unless it is set, so they are inert in a normal deployment. |
| `CRON_SECRET` | Vercel | Vercel sends it as `Authorization: Bearer …`; the route rejects anything else. |

Trigger it by hand with:

```bash
curl -X POST -H "x-demo-token: $DEMO_REFRESH_TOKEN" https://flori-core-api.onrender.com/demo/refresh
```

Vercel's Hobby plan allows one cron invocation per day and may delay it by up to an hour —
fine for a nightly job.

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
