# Flori-Core Enterprise OS

A production-grade, multi-tenant **Farm Operating System** purpose-built for high-altitude floriculture. Flori-Core connects physical field operations — zones, crop cycles, cold chain, pack house, IoT sensors — with global market logistics, finance, and compliance through a unified, secure digital platform.

At its core is a real-time **IoT telemetry pipeline**: field sensors publish temperature, moisture, EC, and pH readings over MQTT (EMQX), and the API writes each one to **PostgreSQL** — the same database that holds the ERP data (crop cycles, inventory, finance), so sensor history and operational records can be queried together instead of stitched across two stores. Time-series queries use standard Postgres (`date_bin()`), so the same schema runs on Neon in production and on a TimescaleDB image locally. Every reading is checked against the tenant's automation rules, which raise alerts (cold-room breaches, irrigation thresholds, etc.), and is pushed to open dashboards over Socket.IO.

Designed for commercial flower farms that sell to international buyers (EU, UK, UAE), Flori-Core replaces disconnected spreadsheets and paper trails with a single system of record covering every department: from stem counting on the harvest floor to payroll disbursements and GlobalG.A.P. certificate tracking.

> **Proprietary software — all rights reserved.** This repository is *not* open
> source and carries no permission to reuse it. You may read the code; you may
> not deploy it, build on it, or use it to make money. See [License](#license).

**Live demo:** [flori-core-web.vercel.app](https://flori-core-web.vercel.app) — click
**Check it out — live demo** on the home page, then pick a role under *Demo Accounts*
to sign in to a fully seeded farm. The API sleeps after fifteen minutes idle, so the
first sign-in can take up to a minute.

---

## Screenshots

Captured from the live demo, signed in as the seeded Managing Director.

| | |
|---|---|
| ![Home page](docs/screenshots/home.webp) | ![Sign-in page with one-click demo accounts](docs/screenshots/login.webp) |
| **Home page** — the "Check it out — live demo" button leads to sign-in | **Sign-in** — one-click demo accounts, one per role |
| ![Dashboard](docs/screenshots/dashboard.webp) | ![Farm Zones](docs/screenshots/zones.webp) |
| **Dashboard** — KPIs, quick actions, telemetry pulse, audit stream | **Farm Zones** — 14 zones, area and sensor counts per block |
| ![Production](docs/screenshots/production.webp) | ![Farm Operations](docs/screenshots/operations.webp) |
| **Production** — propagation timeline across greenhouses | **Farm Operations** — soil tests, pest alerts, field activity tabs |
| ![IoT Telemetry](docs/screenshots/telemetry.webp) | ![Cold Room](docs/screenshots/cold-room.webp) |
| **IoT Telemetry** — live sensor streams over Socket.IO | **Cold Room** — climate monitoring with a breach alert raised |
| ![Pack House](docs/screenshots/pack-house.webp) | ![Inventory](docs/screenshots/inventory.webp) |
| **Pack House** — intake batches awaiting QC grading | **Inventory** — available-to-promise by variety and grade |
| ![Logistics](docs/screenshots/logistics.webp) | ![Sales & CRM](docs/screenshots/sales.webp) |
| **Logistics** — route builder, map and active fleet | **Sales & CRM** — buyer pipeline from prospect to converted |
| ![Procurement](docs/screenshots/procurement.webp) | ![Financials](docs/screenshots/financials.webp) |
| **Procurement** — low-stock scan feeding purchase requests | **Financials** — accounts receivable and invoice aging |
| ![Compliance](docs/screenshots/compliance.webp) | ![HR & Training](docs/screenshots/hr-training.webp) |
| **Compliance** — certificate vault with expiry tracking | **HR & Training** — training records, scores and certificates |
| ![Team & Access](docs/screenshots/team.webp) | |
| **Team & Access** — members, roles and security status | |

---

## What the App Does

Flori-Core is an ERP (Enterprise Resource Planning) system tailored to flower farming. It manages:

- The full **crop lifecycle** from planting through harvest and packing
- **Farm zones** with sensor telemetry (temperature, moisture, EC, pH)
- **Cold room** FIFO inventory and temperature monitoring
- **Pack house** quality control, intake, and dispatch
- **Logistics** including route planning and fleet management
- **Sales CRM** with purchase orders, invoices, and buyer relationships
- **Procurement** with purchase requests, goods received notes, and vendor management
- **HR, Payroll, and Training** for both permanent and casual labour
- **Financials** including P&L, balance sheet, and budgeting
- **Compliance** covering spray logs, certifications (GlobalG.A.P, Rainforest Alliance), and audit trails
- **Stores / Inventory** for agrochemicals, packaging materials, and supplies
- **AI Assistant** for operational queries and forecasting
- **IoT Telemetry** with automation rules and real-time alerting
- **Notifications** via in-app, email, WhatsApp, and SMS

The system is multi-tenant — each farm is an isolated tenant with its own data, users, and role-based access control.

---

## Architecture Stack

This repository is a monorepo managed with **Turborepo** and **pnpm workspaces**.

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| Backend API | NestJS 11, TypeScript |
| Database | PostgreSQL — Neon in production, TimescaleDB image locally |
| ORM | Prisma 7 |
| Auth | JWT (access + refresh tokens in cookies set by the web client) |
| IoT Messaging | EMQX (MQTT broker) |
| Package Manager | pnpm |

### System diagram

```mermaid
flowchart TB
    Browser["Browser<br/>dashboard · driver view"]
    Sensors["Field sensors<br/>moisture · temp · EC · pH"]

    subgraph Vercel["Vercel"]
        Web["Next.js web app<br/>(apps/web)"]
        Cron["Vercel Cron<br/>nightly demo refresh"]
    end

    Broker["EMQX MQTT broker"]

    subgraph Render["Render — NestJS API (apps/api), Docker"]
        REST["REST controllers<br/>JWT auth · tenant scoping"]
        WS["Socket.IO gateways<br/>telemetry · location · notifications"]
        MQ["MQTT subscriber<br/>farm/+/zone/+/sensor"]
        Rules["Automation rules → alerts"]
        Jobs["Scheduled jobs<br/>insights · compliance · procurement"]
        Chat["AI assistant<br/>tool-use loop"]
    end

    DB[("PostgreSQL via Prisma<br/>Neon in prod · TimescaleDB locally")]

    subgraph AI["LLM providers"]
        Claude["Anthropic Claude"]
        Mistral["Mistral (fallback)"]
    end

    subgraph Services["Third-party services"]
        Resend["Resend — email"]
        Twilio["Twilio — WhatsApp"]
        S3["AWS S3 — labels, docs"]
        Sentry["Sentry — errors"]
    end

    Browser -->|HTTPS| Web
    Web -->|REST + JWT| REST
    Web <-->|WebSocket| WS
    Cron -->|POST /demo/refresh| REST

    Sensors -->|MQTT| Broker
    Broker --> MQ
    REST -. actuator commands .-> Broker
    MQ --> Rules
    MQ -->|live readings| WS

    REST --> DB
    MQ --> DB
    Jobs --> DB
    Chat --> DB

    Chat --> Claude
    Chat -. on failure .-> Mistral
    Render --> Services
```

The API runs as a long-lived container rather than serverless functions because it
holds Socket.IO connections, a persistent MQTT subscription and in-process cron jobs;
see [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the split. Every tenant's data is isolated
by `tenantId`, which the API reads from the JWT and the MQTT topic.

---

## Repository Structure

```
flori-core/
├── apps/
│   ├── web/                  # Next.js 16 frontend (App Router)
│   │   └── src/app/
│   │       ├── flori-core-dashboard/   # Main authenticated app shell
│   │       ├── login/
│   │       ├── signup/
│   │       └── onboarding/
│   └── api/                  # NestJS backend API
│       └── src/
│           ├── auth/
│           ├── zones/
│           ├── crop-cycles/
│           ├── production/
│           ├── pack-house/
│           ├── cold-room/
│           ├── logistics/
│           ├── sales/
│           ├── procurement/
│           ├── inventory/
│           ├── stores/
│           ├── financials/
│           ├── hr/
│           ├── payroll/
│           ├── labour/
│           ├── compliance/
│           ├── spray-logs/
│           ├── telemetry/
│           ├── farm-operations/
│           ├── team/
│           ├── notifications/
│           ├── audit-log/
│           ├── automation-rules/
│           ├── chat/
│           ├── varieties/
│           ├── tenants/
│           └── ...
├── packages/
│   └── shared/               # Shared Zod schemas, types, constants
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Modules

### Dashboard
Central operations overview. Live KPI cards (stems harvested today, open orders, cold room status, compliance alerts), audit event stream, IoT telemetry snapshot, and a quick-access matrix linking to all major modules.

### Farm Zones
Zone-by-zone management of growing areas. Each zone tracks crop variety, planted area (ha), growth stage, assigned labour, soil and irrigation schedules, and historical yield. Includes an SVG map view and 5-tab detail panel (Overview, Crops, Irrigation, Sensors, Activity).

### Production
Full crop cycle management from planting to harvest. Gantt schedule view (12-week), active batches, yield forecast, variety performance, and labour allocation. Supports multiple simultaneous crop cycles per zone.

### Farm Operations
Day-to-day agronomy activities across 8 tabs: Soil Management, Irrigation, Spray Programs, IPM (Integrated Pest Management), Maintenance, Task Scheduler, Weather Tracking, and Incident Reports.

### Pack House
Post-harvest processing. QC grading (Grade A/B/Waste breakdown), intake logging, packing station management, cold chain handover, and labour productivity tracking.

### Cold Room
Temperature-controlled storage management. Real-time sensor readings for each cold room, 6-hour trend charts, FIFO inventory table, check-in/check-out forms, and automatic alerts when temperature exceeds thresholds.

### Inventory
Stem inventory and stock management. Available-to-Promise (ATP) table by variety, stem flow summary, packed boxes register, and wastage log with cause breakdown. Links to logistics for dispatch.

### Stores
Internal stores catalogue for agrochemicals, packaging materials, spare parts, and consumables. Tracks stock movements (in/out), low-stock alerts, and reorder triggers that feed into procurement.

### Logistics
Shipment planning and fleet management. Kenya SVG route map (Naivasha → JKIA), route cards, order dispatch queue (22+ shipments), fleet vehicle register, and driver assignment. Integrates with sales orders for export documentation.

### Sales
Sales CRM and order management. Kanban pipeline (Enquiry → Confirmed → Packed → Dispatched → Invoiced), order table with buyer details and stem counts, invoice generation, and payment tracking. Supports export buyers in EU, UK, and UAE markets.

### Procurement
Full procurement workflow: Purchase Requests (manual + auto-triggered), Purchase Order generation, Goods Received Notes (GRN) with batch recording, Invoice matching, Payments, and Vendor management including reactivation workflows.

### Financials
Financial reporting and analysis. P&L statement, Balance Sheet, Cash Flow, and budget vs. actuals. KPI cards for revenue MTD, COGS, gross margin, and working capital. Supports multi-currency (KES / USD / EUR).

### HR & Training
Human resources for permanent and casual workforce. Employee profiles, contract management, training records, compliance certification tracking (e.g. pesticide handler certificates), 360° performance appraisals, and a KPI dashboard per employee.

### Payroll
Payroll processing for salaried and casual workers. Monthly payroll runs, payslip generation, NSSF/NHIF/PAYE deductions, bulk approval workflow, and payslip delivery via email and SMS.

### Compliance
Regulatory and certification management. Certificate registry (GlobalG.A.P, Rainforest Alliance, MPS, KEPHIS), expiry alerts, spray log records, chemical usage auditing, and full audit trail with diff-expandable entries.

### IoT Telemetry
Real-time sensor data ingestion via MQTT (EMQX). Animated live charts for soil moisture, air temperature, EC, and pH. Automation rule engine (e.g. "trigger irrigation if moisture < 35%") with run logs and configurable thresholds.

### Team & Access
User management and role-based access control (RBAC). User cards with 2FA status, last login, and permission matrix. Invite new users, assign roles (Farm Director, Agronomist, Pack House Supervisor, Finance, Driver, etc.), and force password resets.

### Audit Trail
Immutable log of all system actions. Filterable by user, module, action type, and date range. Each entry is diff-expandable to show exactly what changed — who did what, when, and from what IP.

### AI Assistant
Conversational AI layer for operational queries. Ask questions like "projected output this week?" or "which zone has the lowest yield this cycle?" and get structured responses grounded in live farm data.

Under the hood (`apps/api/src/chat/chat.service.ts`): Claude with tool use over seven read-only, tenant-scoped data tools (harvest, KPIs, stock, expiring documents, financials, training, logistics), falling back to Mistral through an OpenAI-compatible client if Claude is unavailable. Each tenant has an AI token budget checked before every request and charged for every provider call, including a failed attempt before fallback. The tool loop is capped at five rounds, every tool call in a turn is answered, and malformed model-written arguments come back to the model as tool errors rather than aborting the request.

### Communications & Notifications
Automated notification engine. Triggers email, WhatsApp, and SMS for critical events (cold room alerts, payroll ready, compliance expiry, dispatch confirmations). In-app notification drawer with per-user preference toggles.

---

## Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10 (the repo pins `pnpm@10.7.0`; `corepack enable` picks it up)
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Postgres and the MQTT broker

```bash
docker compose up -d db emqx
```

EMQX is only needed for live sensor ingest. Without it the API still runs, but logs
MQTT connection errors and the telemetry screens stay empty.

The EMQX dashboard is at `http://localhost:18083` (username `admin`, password
`admin123`).

### 3. Configure environment variables

The API reads `apps/api/.env`; the root `.env.example` lists every variable it uses.

```bash
cp .env.example apps/api/.env
```

Its defaults already match the Docker database, broker and local CORS origins. Leave
`DIRECT_DATABASE_URL` unset locally — it is only for Neon's unpooled connection, and
an empty value stops the Prisma CLI from connecting.

To show the one-click demo accounts on the sign-in page, create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_PASSWORD=<the password printed by demo:seed in step 4>
```

### 4. Set up the database

Apply the migrations, then seed the system roles:

```bash
pnpm --filter @flori/api exec prisma migrate deploy
```

```bash
pnpm --filter @flori/api exec prisma db seed
```

The role seed creates no users. Either sign up at `/signup` to create your own farm,
or load the demo farm — the same seeded Waridi tenant as the live demo, with eight
accounts that share one password:

```bash
pnpm --filter @flori/api demo:seed
```

> `demo:seed` **truncates every table except `roles`** before seeding. Never point it
> at a database holding real data.

It prints the shared password and the account list (`admin@waridi.demo` is the
Managing Director).

### 5. Start all services

```bash
pnpm run dev
```

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| API Server | http://localhost:3001 |

Open the web app and click **Check it out — live demo**, then pick a role.

---

## Environment Variables

API (`apps/api/.env`, template in the root `.env.example`):

```env
DATABASE_URL=postgresql://...          # pooled connection string on Neon
DIRECT_DATABASE_URL=                   # Neon only: unpooled string for the Prisma CLI
JWT_SECRET=...
JWT_REFRESH_SECRET=...
MQTT_BROKER_URL=mqtt://localhost:1883
CORS_ORIGINS=http://localhost:3000     # comma-separated; defaults to localhost
ANTHROPIC_API_KEY=...                  # AI assistant (Mistral is the fallback)
MISTRAL_API_KEY=...
```

Web (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=...           # logistics map
NEXT_PUBLIC_DEMO_MODE=true             # optional: demo-account panel on /login
NEXT_PUBLIC_DEMO_PASSWORD=...
```

---

## UI Design System

The app uses a consistent glassmorphic dark theme:
- **Background:** Deep dark base with `bg-white/5 backdrop-blur-3xl` glass cards
- **Border radius:** `rounded-[2.5rem]` for panels, `rounded-2xl` for cards
- **Primary accent:** Emerald green
- **Typography:** Inter (UI) + Space Grotesk (headings)
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Animations:** Framer Motion

---

## Production

For AWS deployment, TimescaleDB configuration, and production environment setup, see [`PRODUCTION.md`](./PRODUCTION.md) and the full design specification at [`flori_core_plan.md`](./flori_core_plan.md).

---

## License

**Proprietary — All Rights Reserved.**
Copyright © 2026 Gregory Temwa Odete.

Flori-Core Enterprise OS is **not open source**. The source is visible for
reference, review, and evaluation only. No licence — express or implied — is
granted to any person or organisation other than the copyright holder. The
absence of an open-source licence means all rights are reserved by default.

### You may not use this code to make money

Without prior written permission from the copyright holder, you may **not**:

- Use this code, in whole or in part, in any **commercial, revenue-generating,
  or for-profit** capacity — including selling it, licensing it, offering it as
  a service, running a business on it, or embedding it in any paid product;
- Copy, fork, modify, merge, publish, distribute, sublicense, or sell the
  software or any part of it;
- Create derivative works, or reuse the source, architecture, database schema,
  or design system as the basis for a competing or similar product;
- Deploy, host, or operate it — publicly or privately, for yourself or for a
  third party;
- Remove or obscure the copyright and licence notices.

### You may

Read and study the source for personal, non-commercial learning. That permission
stops at reading — it does not extend to reusing the code in any form.

### Commercial licensing

Commercial use requires a separate written licence agreement. Direct enquiries
to the copyright holder.

The full and controlling terms are in [`LICENSE`](./LICENSE). Where this summary
and `LICENSE` differ, `LICENSE` governs.
