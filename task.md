# Flori-Core Enterprise OS — Master Task List

> Derived from `flori_core_plan.md`. Check off items as you complete them.

---

## Phase 0 — Foundation & Infrastructure *(Weeks 1–3)*

### 0.1 Monorepo Setup
- [x] Initialise monorepo with Turborepo + pnpm workspaces
- [x] Scaffold `apps/web` — Next.js 15 (App Router)
- [x] Scaffold `apps/api` — NestJS
- [x] Scaffold `packages/shared` — shared DTOs, Zod schemas, types
- [x] Confirm Turborepo pipelines (build, lint, test)

### 0.2 Database & ORM [x]
- [x] `docker-compose.yml` with PostgreSQL + TimescaleDB
- [x] Prisma schema skeleton with `tenant_id` on every model
- [x] Multi-tenant seed script
- [x] Database migration pipeline (Prisma migrate + shadow DB)
- [x] AWS RDS config documented for production

### 0.3 Auth System
- [ ] Tenant registration flow: create `Tenant` + first `User` (Gold Admin)
- [ ] JWT access + refresh token rotation
- [ ] `roles` table with `permissions[]` JSON array
- [ ] NestJS guards: `@Roles()`, `@TenantScoped()` decorators
- [ ] Middleware to inject `tenantId` on every authenticated request

### 0.4 Roles Defined
- [ ] `gold_admin` — all modules, all tenant data
- [ ] `field_supervisor` — Production module only
- [ ] `qc_lead` — Pack house + inventory
- [ ] `accountant` — Finance + payroll read
- [ ] `hr_manager` — HR module + attendance
- [ ] `driver` — Logistics + PoD module
- [ ] `store_manager` — Stores + procurement
- [ ] `sales_agent` — CRM + orders

### 0.5 Communications Engine (Foundational)
- [ ] `MailModule` with SendGrid / AWS SES integration
- [ ] `communications` table: `thread_id`, `entity_type`, `entity_id`, `direction`, `subject`, `body`, `attachments[]`
- [ ] In-app notification centre (Socket.io + `notifications` table)
- [ ] SendGrid Inbound Parse webhook for received emails

### 0.6 DevOps
- [ ] `Dockerfile` per app
- [ ] `docker-compose.yml` for local dev (all services)
- [ ] GitHub Actions pipeline: lint → test → build → deploy on `main`
- [ ] Vercel frontend preview deployments per PR
- [ ] AWS ECS Fargate setup for NestJS API production
- [ ] AWS S3 + CloudFront for static assets
- [ ] Sentry DSN configured for both apps

### 0.7 Landing Page
- [ ] Next.js marketing page (pricing, features, contact/demo form)
- [ ] SEO optimised with Next.js Metadata API

---

## Phase 1 — Core Dashboard & Tenant Onboarding *(Weeks 4–5)*

### 1.1 Onboarding Wizard
- [ ] Step 1: Farm profile (name, location, certifications)
- [ ] Step 2: Greenhouse/zone setup (block names, area m², crop varieties)
- [ ] Step 3: Invite team members (email invites → RBAC assignment)
- [ ] Step 4: Connect IoT devices (optional MQTT device registration)

### 1.2 Gold Admin Master Dashboard
- [ ] KPI cards: today's harvest, active orders, cold room status, payroll due
- [ ] Live notification feed (Socket.io)
- [ ] Quick-action shortcuts (new order, approve PO, view alerts)
- [ ] Drill-down navigation to all modules

### 1.3 Audit Log Viewer
- [ ] Timeline view of every system action across all modules
- [ ] Filter by user, module, date range
- [ ] Export to CSV / PDF

---

## Phase 2 — Module 1: Precision Production & IoT *(Weeks 6–9)*

### 2.1 Crop Lifecycle Management
- [ ] `varieties` table: name, target stem length, bloom time, market grade
- [ ] `crop_cycles` table: variety → greenhouse block → dates → actual harvest
- [ ] Gantt-style timeline view per block
- [ ] Harvest forecasting (projected stems/day by cycle stage)
- [ ] Spray/fertiliser schedule linked to each crop cycle

### 2.2 Greenhouse & Zone Management
- [ ] Interactive farm map (SVG or Mapbox) showing all blocks
- [ ] Per-block details: current variety, plant count, days-to-harvest, last watered
- [ ] Bulk zone reassignment tool

### 2.3 Smart Soil IoT Integration
- [ ] MQTT broker (EMQX) topic structure: `farm/{tenant_id}/zone/{zone_id}/sensor`
- [ ] Sensor types: soil moisture, temperature, EC level, pH
- [ ] TimescaleDB storage (1-minute resolution)
- [ ] Real-time dashboard (Socket.io push)
- [ ] Relay control: irrigation valve & fertigation pump commands
- [ ] Alert engine: threshold breach → push notification + email to supervisor
- [ ] Rule builder UI: conditional auto-irrigation rules

### 2.4 Field Labour & Performance Tracking
- [ ] Daily work-log: employee → zone → task type → hours
- [ ] Mobile-first (PWA) logging interface for supervisors
- [ ] Productivity metrics: stems cut per worker per day
- [ ] Direct feed into payroll module (hours × rate)
- [ ] GPS tagging of log entries (optional)

### 2.5 Spray & Chemical Compliance Log
- [ ] Log: chemical name, EPA reg no., quantity, zone, applicator, date
- [ ] PHI countdown per zone
- [ ] Auto-block harvest if PHI not cleared
- [ ] Export to GlobalG.A.P. audit format

---

## Phase 3 — Module 2: Pack House & Cold Chain *(Weeks 10–13)*

### 3.1 Flower Intake & QC Grading
- [ ] QR/barcode scan on intake (links to crop cycle)
- [ ] QC form: stem length, bloom stage, head diameter, defects checklist
- [ ] Auto-grade assignment: A, B, C, Reject
- [ ] Rejected batch workflow (reason logging + routing)
- [ ] Real-time inventory update on grade confirmation

### 3.2 Cold Room Telemetry
- [ ] Sensors: temperature ± 0.5°C, humidity (%) per cold room
- [ ] TimescaleDB storage (5-minute resolution)
- [ ] Live dashboard with alert bands
- [ ] `cold_room_events` table: check-in, check-out, batch-id, quantity, user, timestamp
- [ ] FIFO enforcement on pick lists
- [ ] Alert on temperature breach → SMS + push to QC lead

### 3.3 Bunch & Box Packing
- [ ] Packing station: scan batch → select bunch size → auto-calculate stems/box
- [ ] QR code label generation (PDF via S3)
- [ ] QR code encodes: batch ID, variety, grade, pack date, box count, destination
- [ ] Unique `box_id` tracking throughout logistics chain

### 3.4 Inventory (Finished Goods)
- [ ] Real-time Available-to-Promise (ATP) by variety/grade/box count
- [ ] Sales module ATP check before confirming order
- [ ] Wastage tracking: reasons + cost impact

---

## Phase 4 — Module 3: Stores, Procurement & Vendor Management *(Weeks 14–16)*

### 4.1 Inventory Intelligence
- [ ] `items` catalogue: fertilisers, pesticides, seeds, packaging, PPE, spare parts
- [ ] Stock levels per store/warehouse location
- [ ] Minimum stock threshold per item (configurable)
- [ ] Movement log: GRN, issue to zone, return, write-off

### 4.2 Auto-Procurement Engine
- [ ] BullMQ scheduled job (hourly): scan items below threshold
- [ ] Auto-generate `purchase_requests` with recommended quantity + last price
- [ ] Gold Admin in-app + email notification for approval
- [ ] On approval → create `purchase_orders`, email to vendor

### 4.3 Vendor Management Portal
- [ ] Vendor profile: name, contact, payment terms, certifications, bank details
- [ ] Historical PO log with pricing trend chart
- [ ] Vendor performance score: on-time delivery %, quality complaints
- [ ] Multi-quote support: RFQ to 3 vendors, compare in-app

### 4.4 Goods Receipt & Matching
- [ ] GRN: scan PO → receive items → quantity/price match vs PO
- [ ] Discrepancy flagging → auto-alert to accountant
- [ ] GRN triggers: inventory update + AP liability entry in financials

---

## Phase 5 — Module 4: Global Sales, Logistics & Compliance *(Weeks 17–21)*

### 5.1 CRM & Contact Management
- [ ] Customer profiles: retailers, exporters, auction houses, direct buyers
- [ ] Contact history: all emails/calls/notes linked to customer
- [ ] Customer segmentation: local retail, export, spot market
- [ ] Lead pipeline: Kanban board (Prospect → Negotiation → Contract → Active)

### 5.2 Order Management Engine
- [ ] Order creation: customer → varieties → grade → quantity → delivery date
- [ ] ATP check before confirming order
- [ ] Order types: standing order, spot order, export contract
- [ ] Order lifecycle: Draft → Confirmed → In Picking → Dispatched → Delivered → Invoiced
- [ ] Auto-generation of standing orders from contract template

### 5.3 Export Documentation Vault
- [ ] Phytosanitary Certificate: auto-filled from order + spray log
- [ ] Export Permit: regulatory API link or structured manual upload
- [ ] Customs Invoice / Packing List from box manifest
- [ ] Certificate of Origin template with auto-fill
- [ ] Docs stored in S3, version-controlled, audit-accessible
- [ ] Auto-email docs to freight forwarder/buyer with order context

### 5.4 Compliance & Certification Repository
- [ ] Upload + manage: GlobalG.A.P., Fairtrade, KFC Silver, MPS, Rainforest Alliance
- [ ] Expiry tracker + 60/30-day renewal reminders
- [ ] Per-audit report generator (spray logs, training records, worker safety → PDF)

### 5.5 Logistics & Proof of Delivery (PoD)
- [ ] Route planning: drag-and-drop stops on Mapbox
- [ ] Driver PWA: today's deliveries, customer info, directions
- [ ] Live GPS tracking: driver → dispatcher map
- [ ] PoD: digital sign-on-glass (canvas signature) + photo upload
- [ ] Cold chain PoD: driver logs vehicle temp at delivery
- [ ] Delivery confirmation triggers invoice dispatch

### 5.6 Auction Integration *(Extra)*
- [ ] Dutch flower auction format (price-per-stem × lot)
- [ ] Lot preparation and clock number assignment
- [ ] Auction result import → auto-invoice generation

---

## Phase 6 — Module 5: Integrated Financials *(Weeks 22–26)*

### 6.1 Chart of Accounts & Ledger
- [ ] Double-entry bookkeeping engine in NestJS
- [ ] Journal entries for every financial event (invoice, payment, GRN, payroll)
- [ ] Fully configurable chart of accounts per tenant
- [ ] Multi-currency support (KES, USD, EUR, GBP) with exchange rate feed

### 6.2 Accounts Receivable (AR)
- [ ] Auto-generate invoice on delivery confirmation
- [ ] Invoice statuses: Draft → Sent → Partially Paid → Paid → Overdue
- [ ] Automated payment reminders: Day 0, Day 7, Day 14, Day 30 (escalate)
- [ ] Credit limit enforcement per customer
- [ ] Aging report: 0–30, 31–60, 61–90, 90+ days

### 6.3 Accounts Payable (AP)
- [ ] Vendor invoice entry linked to GRN (3-way match: PO → GRN → Invoice)
- [ ] Payment scheduling and approval workflow
- [ ] Bank payment export (SWIFT MT101 / local bank format)

### 6.4 Payroll Engine
- [ ] Pull hours from production labour logs + HR attendance
- [ ] Pay components: basic, overtime, allowances, deductions
- [ ] Statutory deductions (Kenya): NHIF, NSSF, PAYE tax bracket engine
- [ ] Payslip PDF generation + email to employee
- [ ] Payroll journal auto-posted to ledger
- [ ] M-Pesa bulk disbursement API integration

### 6.5 Budgeting & Cost Centres
- [ ] Budget creation by department/cost centre
- [ ] Monthly actual vs budget variance report
- [ ] Departmental P&L (Production, Pack House, Logistics, Admin)
- [ ] Profitability per variety / per order

### 6.6 Financial Reporting
- [ ] Live P&L statement, Balance Sheet, Cash Flow statement
- [ ] Tax reports: VAT return, WHT summary
- [ ] Export to Excel / PDF
- [ ] Apache Superset BI dashboard integration

---

## Phase 7 — Module 6: Human Resources & Talent *(Weeks 27–30)*

### 7.1 Employee Digital File
- [ ] Profile: name, national ID, KRA PIN, NSSF no., NHIF no., emergency contacts
- [ ] Employment history + contract storage (S3, PDF)
- [ ] Role & access assignment linked to RBAC
- [ ] Document expiry alerts: work permits, health certificates

### 7.2 Attendance & Leave Management
- [ ] Biometric integration (Timestation / ZKTeco webhook) OR mobile GPS clock-in
- [ ] Shift scheduling: calendar view, drag-to-assign
- [ ] Leave types: annual, sick, maternity/paternity, unpaid
- [ ] Leave balance tracker + approval workflow
- [ ] Late/absent alerts to supervisor
- [ ] Attendance auto-feeds payroll engine

### 7.3 Training & Appraisals
- [ ] Training records: course, provider, date, score, certificate upload
- [ ] Compliance training tracker: chemical handling, first aid, fire safety
- [ ] Performance appraisal: 360° review form (self, peer, supervisor)
- [ ] KPI scoring linked to farm productivity data
- [ ] Training calendar with department-wide scheduling

### 7.4 Recruitment *(Extra)*
- [ ] Job posting tool (posts to landing site careers page)
- [ ] Application tracking: Applied → Shortlisted → Interview → Offer → Onboarded
- [ ] Onboarding checklist: equipment issued, accounts created, induction complete

---

## Phase 8 — Advanced Features & Intelligence *(Weeks 31–36)*

### 8.1 AI Yield Forecasting *(Extra)*
- [ ] Python/FastAPI ML microservice for yield prediction
- [ ] Train on historical cycle + weather data
- [ ] Predict stems/day per variety for next 30 days
- [ ] Feed into order ATP and procurement planning

### 8.2 Demand Sensing *(Extra)*
- [ ] Import historical order data → identify seasonal trends
- [ ] Alert engine for upcoming demand spikes (e.g. Valentine's Day)

### 8.3 Smart Pricing Engine *(Extra)*
- [ ] Track competitor auction prices (scraper / API)
- [ ] Suggest optimal price per stem by grade and destination

### 8.4 Waste Heat Map *(Extra)*
- [ ] Correlate wastage with: temperature deviations, workers, varieties, seasons
- [ ] Surface actionable insights in dashboard

### 8.5 Supplier Scorecard *(Extra)*
- [ ] Auto-calculate: OTD%, quality defect rate, price consistency
- [ ] Recommend preferred suppliers per item category

### 8.6 Multi-Farm (Gold Admin Network)
- [ ] Single Gold Admin overseeing multiple farm tenants
- [ ] Cross-farm consolidated P&L view
- [ ] KPI benchmarking between farms

---

## Phase 9 — Polish, Security & Launch Readiness *(Weeks 37–40)*

### 9.1 Security Hardening
- [ ] OWASP Top 10 audit
- [ ] Rate limiting (Throttler guard) per endpoint
- [ ] Confirm SQL injection prevention (Prisma parameterised queries)
- [ ] Verify Row-Level Security at DB level
- [ ] Data encryption at rest (RDS) + in transit (TLS everywhere)
- [ ] Automated dependency scanning (Snyk / Dependabot)

### 9.2 Performance
- [ ] API response time < 200ms p95 (Datadog monitoring)
- [ ] Frontend Lighthouse score > 90 (Performance, Accessibility, SEO)
- [ ] Redis caching for stock levels, ATP, KPIs
- [ ] CDN for static assets and document downloads

### 9.3 Offline Support (PWA)
- [ ] Service worker caches: delivery manifest, QC forms, field log forms
- [ ] Offline edit sync with conflict resolution strategy

### 9.4 Localisation
- [ ] i18n support: English (primary), Swahili
- [ ] RTL-ready layout (for future Middle East expansion)
- [ ] Currency, date, number format localisation

### 9.5 Accessibility
- [ ] WCAG 2.1 AA compliance audit
- [ ] Full keyboard navigation across all interfaces
- [ ] Screen reader compatibility verified

### 9.6 Disaster Recovery
- [ ] RDS automated daily backups (30-day retention)
- [ ] S3 versioning on all documents
- [ ] Blue/green deployment strategy (zero-downtime releases)
- [ ] Runbook documentation for on-call team

### 9.7 Customer Support Portal
- [ ] In-app help widget (Intercom or self-hosted Chatwoot)
- [ ] Knowledge base per module
- [ ] Gold Admin support ticket submission from within OS

---

## Testing & Verification

### Automated Tests
- [ ] Unit tests (Jest): payroll calculation, RBAC guards, IoT rule engine, FIFO logic
- [ ] Integration tests (Jest + Supertest): auth flows, order lifecycle, payroll run
- [ ] E2E tests (Playwright):
  - [ ] Gold Admin login → dashboard KPIs visible
  - [ ] Full order lifecycle: crop cycle → harvest → QC → pack → dispatch → invoice → payment
  - [ ] Payroll run: attendance input → payslip PDF emailed
  - [ ] IoT alert: simulate threshold breach → verify notification

### Manual / Browser Verification
- [ ] Full end-to-end order workflow on staging
- [ ] Mobile PWA: field log submission on iPhone/Android
- [ ] Driver PoD: sign-on-glass capture and sync
- [ ] Export document: Phytosanitary PDF download + email
- [ ] Cold room alert: trigger threshold breach, verify SMS + push

### Performance Testing
- [ ] k6 load test: 500 concurrent users, all endpoints < 200ms p95
- [ ] Lighthouse CI: score > 90 on frontend

### Security Audit
- [ ] OWASP ZAP scan against staging environment
- [ ] Penetration test: attempt cross-tenant data access (must fail at DB RLS)
