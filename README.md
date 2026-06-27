# Flori-Core Enterprise OS

A production-grade, multi-tenant **Farm Operating System** purpose-built for high-altitude floriculture. Flori-Core connects physical field operations — zones, crop cycles, cold chain, pack house, IoT sensors — with global market logistics, finance, and compliance through a unified, secure digital platform.

At its core is a real-time **IoT telemetry pipeline**: field sensors stream temperature, moisture, EC, and pH readings that are ingested over MQTT (EMQX) and persisted in **TimescaleDB** — a time-series extension on PostgreSQL chosen specifically so high-frequency sensor data and conventional relational ERP data (crop cycles, inventory, finance) can live in the same database, queried together, instead of stitching together two separate stores. Automation rules evaluate this telemetry in real time to drive alerting (cold-room breaches, irrigation thresholds, etc.).

Designed for commercial flower farms that sell to international buyers (EU, UK, UAE), Flori-Core replaces disconnected spreadsheets and paper trails with a single system of record covering every department: from stem counting on the harvest floor to payroll disbursements and GlobalG.A.P. certificate tracking.

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
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion |
| Backend API | NestJS, TypeScript |
| Database | PostgreSQL + TimescaleDB (IoT telemetry) |
| ORM | Prisma Client |
| Caching & Sessions | Redis |
| Auth | JWT (access + refresh tokens, HTTP-only cookies) |
| IoT Messaging | EMQX (MQTT broker) |
| Package Manager | pnpm |

---

## Repository Structure

```
flori-core/
├── apps/
│   ├── web/                  # Next.js 14 frontend (App Router)
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

### Communications & Notifications
Automated notification engine. Triggers email, WhatsApp, and SMS for critical events (cold room alerts, payroll ready, compliance expiry, dispatch confirmations). In-app notification drawer with per-user preference toggles.

---

## Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure services

```bash
docker compose up -d db redis emqx
```

The EMQX MQTT dashboard is available at `http://localhost:18083`
- Username: `admin`
- Password: `admin123`

### 3. Set up the database

Push the Prisma schema to the running PostgreSQL instance:

```bash
pnpm --filter @flori/api exec prisma db push
```

Seed default roles and the initial Gold Admin account:

```bash
npx tsx apps/api/prisma/seed.ts
```

Default test credentials: `admin@floricore.io` / `admin123`

### 4. Start all services

```bash
pnpm run dev
```

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| API Server | http://localhost:3001 |

---

## Environment Variables

Create `.env` files in each app based on their respective `.env.example` files.

Key variables:

```env
# apps/api/.env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...
MQTT_BROKER_URL=mqtt://localhost:1883

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
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
