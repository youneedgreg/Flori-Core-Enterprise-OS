# Flori-Core Enterprise OS — Comprehensive Development Plan

> A multi-tenant SaaS ERP for commercial flower farms. Built to be the **single operating system** every staff member depends on from clock-in to clock-out.

---

## Tech Stack (Final)

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | SSR, file-based routing, server actions, fast |
| **Styling** | Tailwind CSS + Shadcn/UI | Enterprise-grade UI components, accessible |
| **Backend** | NestJS (Node.js) | Modular, DI-driven, decorator-based, scales cleanly |
| **Database** | PostgreSQL + Prisma ORM | Relational integrity for finance/inventory, type-safe queries |
| **File Storage** | AWS S3 / Cloudflare R2 | Docs, export PDFs, QR codes, compliance certs |
| **Real-time** | Socket.io + MQTT (EMQX broker) | Live IoT dashboards + instant in-app notifications |
| **Email** | SendGrid / AWS SES | Transactional + contextual emails with audit trail |
| **Auth** | JWT + Refresh Tokens + RBAC Guards | Role-scoped access per module |
| **Background Jobs** | BullMQ + Redis | Payroll processing, auto-procurement, email queues |
| **Search** | Meilisearch | Fast full-text across orders, employees, inventory |
| **PDF Generation** | Puppeteer / @react-pdf/renderer | Export invoices, phytosanitary certs, customs docs |
| **Mobile** | Progressive Web App (PWA) | Field supervisors & drivers on mobile without a native app |
| **Map/GPS** | Mapbox GL / Leaflet | Delivery route planning & live driver tracking |
| **Barcode/QR** | ZXing / react-qr-code | Pack house scanning & traceability |
| **Biometrics** | Timestation API / custom device webhook | HR attendance feeds |
| **DevOps** | Docker + GitHub Actions CI/CD | Portable, automated pipeline |
| **Hosting** | AWS (ECS Fargate) + Vercel (frontend) | Scalable, global delivery |
| **Monitoring** | Sentry + Datadog | Error tracking + infrastructure metrics |
| **Analytics** | Apache Superset (self-hosted) | Custom BI dashboards for Gold Admin |

---

## Database Strategy

- **Multi-tenant**: Every table has a `tenant_id` (FK to `tenants`). Row-Level Security (RLS) enforced at the PostgreSQL level.
- **Audit log table**: Every mutation is soft-recorded with `actor_id`, `action`, `before_state`, `after_state`, `timestamp`.
- **Event sourcing on financials**: All financial transactions are append-only ledger entries.
- **Time-series for IoT**: Use **TimescaleDB** extension on Postgres for sensor data (temperature, humidity, soil moisture).

---

## Phase 0 — Foundation & Infrastructure *(Weeks 1–3)*

> Goal: Everything needed to start building features safely.

### 0.1 Monorepo Setup
- `apps/web` — Next.js 15 frontend
- `apps/api` — NestJS backend
- `packages/shared` — shared DTOs, Zod schemas, types
- Turborepo for orchestration, pnpm workspaces

### 0.2 Database & ORM
- PostgreSQL + TimescaleDB via Docker Compose (local) / AWS RDS (prod)
- Prisma schema with multi-tenant seed
- Database migration pipeline (Prisma migrate + shadow DB)

### 0.3 Auth System
- Registration flow: create `Tenant` + first `User` (Gold Admin)
- JWT with access + refresh token rotation
- RBAC system: `roles` table with `permissions[]` JSON array
- NestJS guards: `@Roles()`, `@TenantScoped()`, `@Module()` decorators
- Middleware to inject `tenantId` on every authenticated request

### 0.4 Roles Defined
| Role | Scope |
|---|---|
| `gold_admin` | Everything — all modules, all tenants data |
| `field_supervisor` | Production module only |
| `qc_lead` | Pack house + inventory |
| `accountant` | Finance + payroll read |
| `hr_manager` | HR module + attendance |
| `driver` | Logistics + PoD module |
| `store_manager` | Stores + procurement |
| `sales_agent` | CRM + orders |

### 0.5 Communications Engine (Foundational)
- Resend integration via NestJS `MailModule`
- Every email stored in `communications` table with: `thread_id`, `entity_type` (order/employee/vendor), `entity_id`, `direction` (in/out), `subject`, `body`, `attachments[]`
- In-app notification centre (Socket.io + `notifications` table)
- Email parsing webhook (Resend Inbound Parse) for received emails
- WhatsApp notifications integration (Twilio / Meta API)

### 0.6 DevOps
- `Dockerfile` per app + `docker-compose.yml` for local dev
- GitHub Actions: lint → test → build → deploy on merge to `main`
- Vercel for frontend preview deployments per PR
- AWS ECS Fargate for NestJS API production
- AWS S3 + CloudFront for static assets
- Sentry DSN configured for both apps

### 0.7 Landing Page (Public-facing)
- Next.js marketing page for the SaaS product
- Pricing tiers, feature list, contact/demo request form
- SEO-optimised with metadata API

---

## Phase 1 — Core Dashboard & Tenant Onboarding *(Weeks 4–5)*

> Goal: Gold Admin can log in and configure their farm.

### 1.1 Onboarding Wizard
- Step 1: Farm profile (name, location, certifications)
- Step 2: Greenhouse/zone setup (block names, area m², crop varieties assigned)
- Step 3: Invite team members (email invites → RBAC assignment)
- Step 4: Connect IoT devices (optional, MQTT device registration)

### 1.2 Gold Admin Master Dashboard
- KPI cards: today's harvest, active orders, cold room status, payroll due
- Live notification feed (Socket.io)
- Quick-action shortcuts (new order, approve PO, view alerts)
- Drill-down to any module from one screen

### 1.3 Audit Log Viewer
- Timeline view of every system action across all modules
- Filter by user, module, date range
- Export to CSV/PDF

---

## Phase 2 — Module 1: Precision Production & IoT *(Weeks 6–9)*

> Goal: From planting to harvest, fully digitised.

### 2.1 Crop Lifecycle Management
- `varieties` table: name, target stem length, bloom time, market grade
- `crop_cycles` table: variety → greenhouse block → planting date → projected harvest → actual harvest
- Gantt-style timeline view per block
- Harvest forecasting: projected stems/day based on cycle stage
- Spray/fertilizer schedule linked to each crop cycle

### 2.2 Greenhouse & Zone Management
- Interactive farm map (SVG or Mapbox) showing all blocks
- Each block: current variety, plant count, days-to-harvest, last watered
- Bulk zone reassignment tool

### 2.3 Smart Soil IoT Integration
- MQTT broker (EMQX): devices publish to topic `farm/{tenant_id}/zone/{zone_id}/sensor`
- Sensor types: soil moisture, temperature, EC level, pH
- TimescaleDB stores all readings with 1-minute resolution
- Real-time dashboard (Socket.io push to frontend)
- Relay control: frontend sends command → NestJS → MQTT publish → device actuates
  - Irrigation valve open/close
  - Fertigation pump on/off with volume target
- Alert engine: threshold breach → push notification + email to supervisor
- Rule builder: "If soil moisture < 30% AND time > 06:00 → auto-irrigate for 20 min"

### 2.4 Field Labor & Performance Tracking
- Daily work-log: employee → zone → task type (planting/pruning/harvesting) → hours
- Mobile-first interface (PWA): supervisors log on the go
- Productivity metrics: stems cut per worker per day
- Direct feed into payroll module (hours × rate)
- GPS tagging of log entries (optional, via browser Geolocation API)

### 2.5 Spray & Chemical Compliance Log
- Every pesticide application: chemical name, EPA reg no., quantity, zone, applicator, date
- PHI (Pre-Harvest Interval) countdown per zone
- Auto-block harvest of zone if PHI not cleared
- Exports to GlobalG.A.P. audit format

---

## Phase 3 — Module 2: Pack House & Cold Chain *(Weeks 10–13)*

> Goal: Full traceability from field to cold room to box.

### 3.1 Flower Intake & QC Grading
- QR/barcode scan on intake (links to crop cycle)
- QC form: stem length (cm), bloom stage (1–5), head diameter, defects checklist
- Grade auto-assignment: A, B, C, Reject
- Rejected batch workflow: reason logging + disposal or downgrade routing
- Real-time inventory update on grade confirmation

### 3.2 Cold Room Telemetry
- Sensors: temperature (±0.5°C), humidity (%)
- TimescaleDB stores readings every 5 minutes
- Dashboard: live temp/humidity per cold room with alert bands
- Batch movement log: `cold_room_events` (check-in, check-out, batch-id, quantity, user, timestamp)
- FIFO enforcement: oldest checked-in batch surfaces first on pick lists
- Alert: if temperature exceeds band → SMS + push notification to QC lead

### 3.3 Bunch & Box Packing
- Packing station interface: scan batch → select bunch size → auto-calculate stems per box
- System prints QR code label (AWS S3-hosted PDF via Zebra/Brother printer or web print)
- QR code encodes: batch ID, variety, grade, pack date, box count, destination
- Box tracking: each box has a unique `box_id` throughout logistics chain

### 3.4 Inventory (Finished Goods)
- Real-time "Available to Promise" (ATP) by variety/grade/box count
- Sales module reads ATP before confirming order
- Wastage tracking: reasons (over-age, breakage, QC fail) + cost impact

---

## Phase 4 — Module 3: Stores, Procurement & Vendor Management *(Weeks 14–16)*

> Goal: Never run out of inputs, never overspend.

### 4.1 Inventory Intelligence
- `items` catalogue: fertilisers, pesticides, seeds, packaging, PPE, spare parts
- Stock levels per store/warehouse location
- Minimum stock threshold per item (configurable)
- Movement log: GRN (Goods Received Note), issue to zone, return, write-off

### 4.2 Auto-Procurement Engine
- BullMQ scheduled job (hourly): scans all items below threshold
- Auto-generates `purchase_requests` with recommended quantity + last price
- Gold Admin receives in-app + email notification for approval
- On approval → `purchase_orders` created, emailed to vendor

### 4.3 Vendor Management Portal
- Vendor profile: name, contact, payment terms, certifications, bank details
- Historical PO log with pricing trends (chart)
- Vendor performance score: on-time delivery %, quality complaints
- Multi-quote support: send RFQ to 3 vendors, compare responses in-app

### 4.4 Goods Receipt & Matching
- GRN: scan PO → receive items → system matches quantity/price vs PO
- Discrepancy flagging: short delivery, price mismatch → auto-alert to accountant
- GRN triggers: inventory update + AP liability entry in financials

---

## Phase 5 — Module 4: Global Sales, Logistics & Compliance *(Weeks 17–21)*

> Goal: Win orders, ship perfectly, prove compliance.

### 5.1 CRM & Contact Management
- Customer profiles: retailers, exporters, auction houses, direct buyers
- Contact history: all emails/calls/notes linked to customer record
- Customer segmentation: local retail, export, spot market
- Lead pipeline: Kanban board view (Prospect → Negotiation → Contract → Active)

### 5.2 Order Management Engine
- Order creation: customer → varieties requested → grade → quantity → delivery date
- ATP check: system confirms availability from Pack House module
- Order types: standing order (weekly), spot order, export contract
- Order lifecycle: Draft → Confirmed → In Picking → Dispatched → Delivered → Invoiced
- Standing order auto-generation: system creates order weekly from contract template

### 5.3 Export Documentation Vault
- **Phytosanitary Certificate**: auto-filled from order + spray log (crop, exporter, importer, treatment)
- **Export Permit**: linked to regulatory body API (or manual upload with structured fields)
- **Customs Invoice / Packing List**: generated from box manifest
- **Certificate of Origin**: template with auto-fill
- All docs stored in S3, version-controlled, accessible to audit role
- Email attachment: system emails docs directly to freight forwarder/buyer with order context

### 5.4 Compliance & Certification Repository
- Upload + manage: GlobalG.A.P., Fairtrade, KFC Silver, MPS, Rainforest Alliance
- Expiry tracker + 60/30-day renewal reminders
- Per-audit report generator: pulls spray logs, training records, worker safety data into formatted PDF

### 5.5 Logistics & Proof of Delivery (PoD)
- Route planning: drag-and-drop delivery stops on Mapbox
- Driver mobile PWA: today's deliveries, customer info, turn-by-turn directions
- Live GPS tracking: driver shares location → dispatcher sees on live map
- PoD: digital sign-on-glass (canvas signature capture) + photo upload
- Cold chain PoD: driver logs vehicle temp at delivery
- Delivery confirmation triggers invoice dispatch

### 5.6 Auction Integration *(Extra)*
- Support for Dutch flower auction format (price-per-stem × lot)
- Lot preparation and clock number assignment
- Auction result import → auto-invoice generation

---

## Phase 6 — Module 5: Integrated Financials *(Weeks 22–26)*

> Goal: Real-time financial clarity, zero manual entry.

### 6.1 Chart of Accounts & Ledger
- Double-entry bookkeeping engine in NestJS
- Every financial event (invoice, payment, GRN, payroll) posts journal entries
- Chart of accounts: fully configurable per tenant
- Multi-currency support (KES, USD, EUR, GBP) with exchange rate feed

### 6.2 Accounts Receivable (AR)
- Invoice auto-generated on delivery confirmation (from Logistics module)
- Invoice statuses: Draft → Sent → Partially Paid → Paid → Overdue
- Automated payment reminders: Day 0 (send), Day 7, Day 14, Day 30 (escalate to Gold Admin)
- Credit limit enforcement per customer
- Aging report: 0–30, 31–60, 61–90, 90+ days

### 6.3 Accounts Payable (AP)
- Vendor invoice entry linked to GRN (3-way match: PO → GRN → Invoice)
- Payment scheduling and approval workflow
- Bank payment export (SWIFT MT101 / local bank format)

### 6.4 Payroll Engine
- Pulls hours from Production labor logs + HR attendance
- Pay components: basic, overtime, allowances, deductions
- Statutory deductions (Kenya): NHIF, NSSF, PAYE (tax bracket engine)
- Payslip generation (PDF) + email to employee
- Payroll journal auto-posted to ledger
- M-Pesa bulk disbursement API integration

### 6.5 Budgeting & Cost Centres
- Budget creation by department/cost centre
- Monthly actual vs budget variance report
- Departmental P&L (Production, Pack House, Logistics, Admin)
- Profitability per variety/per order

### 6.6 Financial Reporting
- Live P&L statement, Balance Sheet, Cash Flow statement
- Tax reports: VAT return, WHT summary
- Export to Excel / PDF
- Apache Superset dashboard for deep-dive BI

---

## Phase 7 — Module 6: Human Resources & Talent *(Weeks 27–30)*

> Goal: Every employee's digital twin lives here.

### 7.1 Employee Digital File
- Profile: name, national ID, KRA PIN, NSSF no., NHIF no., emergency contacts
- Employment history, contract storage (S3, PDF)
- Role & access assignment linked to RBAC system
- Document expiry alerts: work permits, health certificates

### 7.2 Attendance & Leave Management
- Biometric integration (Timestation or ZKTeco webhook) OR mobile clock-in (GPS-verified)
- Shift scheduling: calendar view, drag-to-assign
- Leave types: annual, sick, maternity/paternity, unpaid
- Leave balance tracker + approval workflow (employee → HR → approval)
- Late/absent alerts to supervisor
- All attendance data feeds payroll engine automatically

### 7.3 Training & Appraisals
- Training records: course name, provider, date, score, certificate upload
- Compliance training tracker: chemical handling, first aid, fire safety
- Performance appraisal: 360° review form (self, peer, supervisor)
- KPI scoring linked to farm productivity data
- Training calendar with department-wide scheduling

### 7.4 Recruitment *(Extra)*
- Job posting tool (posts to careers page on landing site)
- Application tracking: Applied → Shortlisted → Interview → Offer → Onboarded
- Onboarding checklist: equipment issued, accounts created, induction complete

---

## Phase 8 — Advanced Features & Intelligence *(Weeks 31–36)*

> Goal: Turn data into competitive advantage.

### 8.1 AI Yield Forecasting *(Extra)*
- ML model (Python microservice via FastAPI) trained on historical cycle + weather data
- Predicts stems/day per variety for next 30 days
- Feeds order ATP and procurement planning

### 8.2 Demand Sensing *(Extra)*
- Import historical order data → identify seasonal trends
- Alert: "Valentine's Day in 6 weeks — double rose production recommended"

### 8.3 Smart Pricing Engine *(Extra)*
- Track competitor auction prices (web scraper / API)
- Suggest optimal price per stem by grade and market destination

### 8.4 Waste Heat Map *(Extra)*
- Correlate wastage events with: temperature deviations, specific workers, varieties, seasons
- Surface insights: "Grade C rejection rate is 3× higher from Block 7 in rainy season"

### 8.5 Supplier Scorecard *(Extra)*
- Auto-calculate: OTD%, quality defect rate, price consistency
- Recommend preferred suppliers per item category

### 8.6 Multi-Farm (Gold Admin Network)
- Single Gold Admin can oversee multiple farm tenants
- Cross-farm consolidated P&L view
- Benchmark one farm's KPIs against another

---

## Phase 9 — Polish, Security & Launch Readiness *(Weeks 37–40)*

### 9.1 Security Hardening
- OWASP Top 10 audit
- Rate limiting (Throttler guard) per endpoint
- SQL injection prevention (Prisma parameterised queries — already covered)
- Row-Level Security verified at DB level
- Data encryption at rest (RDS encryption) + in transit (TLS everywhere)
- Regular automated dependency scanning (Snyk / Dependabot)

### 9.2 Performance
- API response time < 200ms p95 (monitored via Datadog)
- Frontend Lighthouse score > 90 (Performance, Accessibility, SEO)
- Redis caching for frequently read data (stock levels, ATP, KPIs)
- CDN for static assets and document downloads

### 9.3 Offline Support (PWA)
- Service worker caches: delivery manifest, QC forms, field log forms
- Offline edits sync when connection restores (conflict resolution strategy)

### 9.4 Localisation
- i18n support: English (primary), Swahili
- Right-to-left ready (futureproofing for Middle East expansion)
- Currency, date, number format localisation

### 9.5 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation across all interfaces
- Screen reader compatible (Shadcn/UI handles most of this)

### 9.6 Disaster Recovery
- RDS automated daily backups with 30-day retention
- S3 versioning on all documents
- Blue/green deployment strategy (zero downtime releases)
- Runbook documentation for on-call team

### 9.7 Customer Support Portal
- In-app help widget (Intercom or self-hosted Chatwoot)
- Knowledge base for each module
- Gold Admin can raise support tickets from within the OS

---

## Phased Timeline Summary

```
Phase 0  │ Foundation & Infrastructure        │ Weeks 1–3
Phase 1  │ Dashboard & Onboarding             │ Weeks 4–5
Phase 2  │ Production & IoT                   │ Weeks 6–9
Phase 3  │ Pack House & Cold Chain            │ Weeks 10–13
Phase 4  │ Stores & Procurement               │ Weeks 14–16
Phase 5  │ Sales, Logistics & Compliance      │ Weeks 17–21
Phase 6  │ Financials & Payroll               │ Weeks 22–26
Phase 7  │ HR & Talent                        │ Weeks 27–30
Phase 8  │ AI & Advanced Intelligence         │ Weeks 31–36
Phase 9  │ Security, Polish & Launch          │ Weeks 37–40
```

**Total estimated build: ~10 months** (solo full-stack) | **~5 months** (2-person team) | **~3 months** (4-person team)

---

## Key Cross-Cutting Concerns (apply from Day 1)

| Concern | Approach |
|---|---|
| Multi-tenancy | `tenant_id` on every table; NestJS middleware enforces scope |
| Audit trail | Every write operation → `audit_log` table entry |
| Context-aware comms | Emails/notifications always carry `entity_type` + `entity_id` |
| FIFO enforcement | Cold room + inventory movements respect insertion order |
| Mobile-first | PWA + responsive Tailwind layouts; no native app needed |
| Offline-first (field) | Service worker for QC forms, field logs, delivery manifests |
| Data exports | Every list/report → CSV + PDF export (Puppeteer or react-pdf) |
| Soft deletes | No hard deletes; `deleted_at` timestamp pattern everywhere |

---

## Verification Plan

### Automated Testing
- **Unit tests** (Jest): all NestJS services — payroll calculation, RBAC guards, IoT rule engine, FIFO logic
- **Integration tests** (Jest + Supertest): full API route coverage — auth flows, order lifecycle, payroll run
- **E2E tests** (Playwright): 
  - Gold Admin login → dashboard KPIs visible
  - Create crop cycle → harvest → QC scan → box packed → order dispatched → invoice generated → payment recorded
  - Payroll run: attendance input → payslip PDF emailed
  - IoT alert: simulate sensor threshold breach → verify notification

### Manual / Browser Verification
- Full end-to-end order workflow on staging environment
- Mobile PWA: field log submission on iPhone/Android
- Driver PoD: sign-on-glass capture and sync
- Export document generation: Phytosanitary PDF download + email
- Cold room alert: manually trigger threshold breach, verify SMS + push arrives

### Performance Testing
- k6 load test: 500 concurrent users, all API endpoints < 200ms p95
- Lighthouse CI: score > 90 on frontend

### Security Audit
- Run OWASP ZAP against staging environment
- Penetration test: attempt cross-tenant data access (must fail at DB RLS level)
