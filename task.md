# Flori-Core Enterprise OS — Master Task List

> Derived from `flori_core_plan.md`. Check off items as you complete them.

---

## Phase 0 — Foundation & Infrastructure _(Days 1–3)_

### 0.1 Monorepo Setup

- [x] Initialise monorepo with Turborepo + pnpm workspaces
- [x] Scaffold `apps/web` — Next.js 15 (App Router)
- [x] Scaffold `apps/api` — NestJS
- [x] Scaffold `packages/shared` — shared DTOs, Zod schemas, types
- [x] Confirm Turborepo pipelines (build, lint, test)

### 0.2 Database & ORM [x]

- [x] `docker-compose.yml` with PostgreSQL + TimescaleDB
- [x] Prisma schema skeleton with `tenant_id` on every model
- [x] Update Prisma schema (`Product` model)
- [x] Refactor and apply database migration pipeline (Prisma migrate + shadow DB)
- [x] AWS RDS config documented for production

### 0.3 Auth System

- [x] Tenant registration flow: create `Tenant` + first `User` (Gold Admin)
- [x] JWT access + refresh token rotation
- [x] `roles` table with `permissions[]` JSON array
- [x] NestJS guards: `@Roles()`, `@TenantScoped()` decorators
- [x] Middleware to inject `tenantId` on every authenticated request

### 0.4 Roles Defined

- [x] `gold_admin` — all modules, all tenant data
- [x] `field_supervisor` — Production module only
- [x] `qc_lead` — Pack house + inventory
- [x] `accountant` — Finance + payroll read
- [x] `hr_manager` — HR module + attendance
- [x] `driver` — Logistics + PoD module
- [x] `store_manager` — Stores + procurement
- [x] `sales_agent` — CRM + orders

### 0.5 Communications Engine (Foundational)

- [x] `MailModule` with Resend integration
- [x] `communications` table (included in schema)
- [x] In-app notification centre (Socket.io + `notifications` table)
- [x] Resend Inbound Parse webhook for received emails
- [x] WhatsApp notifications integration (Twilio API)

### 0.6 DevOps

- [x] `Dockerfile` per app
- [x] `docker-compose.yml` for local dev (all services)
- [x] GitHub Actions pipeline: lint → test → build → deploy on `main`
- [x] Vercel frontend preview deployments per PR
- [x] AWS ECS Fargate setup for NestJS API production
- [x] AWS S3 + CloudFront for static assets
- [x] Sentry DSN configured for both apps

### 0.7 Landing Page

- [x] Next.js marketing page (pricing, features, contact/demo form)
- [x] SEO optimised with Next.js Metadata API
- [x] Premium Interactive "Industrial Pillars" with detailed feature modals

---

## Phase 1 — Core Dashboard & Tenant Onboarding _(Days 4–5)_

### 1.1 Onboarding Wizard

- [x] Step 1: Farm profile (name, location, certifications)
- [x] Step 2: Greenhouse/zone setup (block names, area m², crop varieties)
- [x] Step 3: Invite team members (email invites → RBAC assignment)
- [x] Step 4: Connect IoT devices (optional MQTT device registration)

### 1.2 Auth & Initial Access

- [x] Implement Sign Up screen (UI)
- [x] Implement Login screen (UI)
- [x] Verify all landing page buttons and navigation links
- [x] Connect Sign Up/Login to Backend API
- [x] Implement session management (cookies)

### 1.25 Flori-Core Dashboard

- [x] Specialized system dashboard for `gregorytemwa1212@gmail.com`
- [x] View list of all system users and information across tenants

### 1.26 Fix Login & Dev Infrastructure

- [x] Restore official `nest start --watch` (Fix CLI commander bug)
- [x] Resolve 500 Internal Server Error in Login (Dependency Injection fix)
- [x] Verify onboarding flow persists correctly with fresh tokens

### 1.3 Gold Admin Master Dashboard

- [x] KPI cards: today's harvest, active orders, cold room status, payroll due
- [x] Live notification feed (Socket.io)
- [x] Quick-action shortcuts (new order, approve PO, view alerts)
- [x] Drill-down navigation to all modules

### 1.4 Audit Log Viewer

- [x] Timeline view of every system action across all modules
- [x] Filter by user, module, date range
- [x] Export to CSV / PDF

---

## Phase 2 — Module 1: Precision Production & IoT _(Days 6–9)_

### 2.1 Crop Lifecycle Management

- [x] `varieties` table: name, target stem length, bloom time, market grade
- [x] `crop_cycles` table: variety → greenhouse block → dates → actual harvest
- [x] Gantt-style timeline view per block
- [x] Harvest forecasting (projected stems/day by cycle stage)
- [x] Spray/fertiliser schedule linked to each crop cycle

### 2.2 Greenhouse & Zone Management

- [x] Interactive farm map (SVG or Mapbox) showing all blocks
- [x] Per-block details: current variety, plant count, days-to-harvest, last watered
- [x] Bulk zone reassignment tool

### 2.3 Smart Soil IoT Integration

- [x] MQTT broker (EMQX) topic structure: `farm/{tenant_id}/zone/{zone_id}/sensor`
- [x] Sensor types: soil moisture, temperature, EC level, pH
- [x] TimescaleDB storage (1-minute resolution)
- [x] Real-time dashboard (Socket.io push)
- [x] Relay control: irrigation valve & fertigation pump commands
- [x] Alert engine: threshold breach → push notification + email to supervisor
- [x] Rule builder UI: conditional auto-irrigation rules

### 2.4 Field Labour & Performance Tracking [COMPLETED]

- [x] Daily work-log: employee → zone → task type → hours
- [x] Mobile-first (PWA) logging interface for supervisors
- [x] Productivity metrics: stems cut per worker per day
- [x] Direct feed into payroll module (hours × rate)
- [x] GPS tagging of log entries (optional)

### 2.5 Spray & Chemical Compliance Log [COMPLETED]

- [x] Log: chemical name, EPA reg no., quantity, zone, applicator, date
- [x] PHI countdown per zone
- [x] Auto-block harvest if PHI not cleared
- [x] Export to GlobalG.A.P. audit format

---

## Phase 3 — Module 2: Pack House & Cold Chain _(Days 10–13)_

### 3.1 Flower Intake & QC Grading

- [x] QR/barcode scan on intake (links to crop cycle)
- [x] QC form: stem length, bloom stage, head diameter, defects checklist
- [x] Auto-grade assignment: A, B, C, Reject
- [x] Rejected batch workflow (reason logging + routing)
- [x] Real-time inventory update on grade confirmation

### 3.2 Cold Room Telemetry

- [x] Sensors: temperature ± 0.5°C, humidity (%) per cold room
- [x] TimescaleDB storage (5-minute resolution)
- [x] Live dashboard with alert bands
- [x] `cold_room_events` table: check-in, check-out, batch-id, quantity, user, timestamp
- [x] FIFO enforcement on pick lists
- [x] Alert on temperature breach → SMS + push to QC lead

### 3.3 Bunch & Box Packing

- [x] Packing station: scan batch → select bunch size → auto-calculate stems/box
- [x] QR code label generation (PDF via S3)
- [x] QR code encodes: batch ID, variety, grade, pack date, box count, destination
- [x] Unique `box_id` tracking throughout logistics chain

### 3.4 Inventory (Finished Goods)

- [x] Real-time Available-to-Promise (ATP) by variety/grade/box count
- [x] Sales module ATP check before confirming order
- [x] Wastage tracking: reasons + cost impact

---

## Phase 4 — Module 3: Stores, Procurement & Vendor Management _(Days 14–16)_

### 4.1 Inventory Intelligence

- [x] `items` catalogue: fertilisers, pesticides, seeds, packaging, PPE, spare parts
- [x] Stock levels per store/warehouse location
- [x] Minimum stock threshold per item (configurable)
- [x] Movement log: GRN, issue to zone, return, write-off

### 4.2 Auto-Procurement Engine

- [x] BullMQ scheduled job (hourly): scan items below threshold
- [x] Auto-generate `purchase_requests` with recommended quantity + last price
- [x] Gold Admin in-app + email notification for approval
- [x] On approval → create `purchase_orders`, email to vendor

### 4.3 Vendor Management Portal

- [x] Vendor profile: name, contact, payment terms, certifications, bank details
- [x] Historical PO log with pricing trend chart
- [x] Vendor performance score: on-time delivery %, quality complaints
- [x] Multi-quote support: RFQ to 3 vendors, compare in-app

### 4.4 Goods Receipt & Matching [DONE]

- [x] Database Schema: Add `GoodsReceivedNote`, `GrnItem`, `FinancialJournal`, `JournalEntry`
- [x] Backend: Create `FinancialsService` for ledger entries
- [x] Backend: Update `ProcurementService` with `receiveGoods` logic
- [x] Backend: Implement matching logic with 1% tolerance
- [x] Backend: Implement discrepancy alerts for accountant and gold admin
- [x] Backend: Trigger inventory and liability updates on GRN completion
- [x] Frontend: Install `html5-qrcode` and camera scanning logic
- [x] Frontend: Implement `GoodsReceiptModal` with scanner and form
- [x] Frontend: Integrate "Receive Goods" button into Procurement UI

---

## Phase 5 — Module 4: Global Sales, Logistics & Compliance [IN PROGRESS]

### 5.1 CRM & Contact Management [DONE]

- [x] Database Schema: Add `CustomerType`, `CustomerSegment`, `LeadStatus` enums
- [x] Database Schema: Expand `Customer` with specific fields (commission, credit limit)
- [x] Database Schema: Add `Lead` and `ContactLog` models
- [x] Backend: Create `SalesModule` with `SalesService` and `SalesController`
- [x] Backend: Implement Lead-to-Customer conversion logic
- [x] Backend: Integrate CRM timeline with `CommunicationsModule`
- [x] Frontend: Implement `SalesPage` with Tabs (Pipeline, Customers)
- [x] Frontend: Create `LeadsBoard` (Kanban) component
- [x] Frontend: Create `CustomerDetailModal` with interaction timeline

---

### 5.2 Order Management Engine [DONE]

- [x] Order creation: customer → varieties → grade → quantity → delivery date
- [x] ATP check before confirming order
- [x] Order types: standing order, spot order, export contract
- [x] Order lifecycle: Draft → Confirmed → In Picking → Dispatched → Delivered → Invoiced
- [x] Auto-generation of standing orders from contract template

### 5.3 Export Documentation Vault

- [x] Phytosanitary Certificate: auto-filled from order + spray log
- [x] Export Permit: regulatory API link or structured manual upload
- [x] Customs Invoice / Packing List from box manifest
- [x] Certificate of Origin template with auto-fill
- [x] Docs stored in S3, version-controlled, audit-accessible
- [x] Auto-email docs to freight forwarder/buyer with order context

### 5.4 Compliance & Certification Repository [DONE]

- [x] Upload + manage: GlobalG.A.P., Fairtrade, KFC Silver, MPS, Rainforest Alliance
- [x] Expiry tracker + 60/30-day renewal reminders
- [x] Per-audit report generator (spray logs, training records, worker safety → PDF)

### 5.5 Logistics & Proof of Delivery (PoD) [DONE]

- [x] Route planning: drag-and-drop stops on Mapbox
- [x] Driver PWA: today's deliveries, customer info, directions
- [x] Live GPS tracking: driver → dispatcher map
- [x] PoD: digital sign-on-glass (canvas signature) + photo upload
- [x] Cold chain PoD: driver logs vehicle temp at delivery
- [x] Delivery confirmation triggers invoice dispatch

### 5.6 Auction Integration _(Extra)_

- [ ] Dutch flower auction format (price-per-stem × lot)
- [ ] Lot preparation and clock number assignment
- [ ] Auction result import → auto-invoice generation

---

## Phase 6 — Module 5: Integrated Financials _(Days 22–26)_

### 6.1 Chart of Accounts & Ledger [DONE]

- [x] Double-entry bookkeeping engine in NestJS
- [x] Journal entries for every financial event (invoice, payment, GRN, payroll)
- [x] Fully configurable chart of accounts per tenant
- [x] Multi-currency support (KES, USD, EUR, GBP) with exchange rate feed

### 6.2 Accounts Receivable (AR) [DONE]

- [x] Auto-generate invoice on delivery confirmation
- [x] Invoice statuses: Draft → Sent → Partially Paid → Paid → Overdue
- [x] Automated payment reminders: Day 0, Day 7, Day 14, Day 30 (escalate)
- [x] Credit limit enforcement per customer
- [x] Aging report: 0–30, 31–60, 61–90, 90+ days

### 6.3 Accounts Payable (AP) [DONE]

- [x] Vendor invoice entry linked to GRN (3-way match: PO → GRN → Invoice)
- [x] Payment scheduling and approval workflow
- [x] Bank payment export (SWIFT MT101 / local bank format)

### 6.4 Payroll Engine [SKELETON DONE]

- [/] Pull hours from production labour logs + HR attendance (Skeleton integrated)
- [x] Pay components: basic, overtime, allowances, deductions (Data structures ready)
- [x] Payroll journal auto-posted to ledger (Wired to FinancialsService)
- [ ] Implement Kenya Statutory Deductions (NHIF, NSSF, PAYE tax bracket engine)
- [ ] Payslip PDF generation + email to employee
- [ ] M-Pesa bulk disbursement API integration (Safaricom B2C)
- [ ] Link actual production labour logs hourly rates to payslip computation

### 6.5 Budgeting & Cost Centres [DONE]

- [x] Budget creation by department/cost centre
- [x] Monthly actual vs budget variance report
- [x] Departmental P&L (Production, Pack House, Logistics, Admin)
- [x] Profitability per variety / per order

### 6.6 Financial Reporting

- [x] Live P&L statement, Balance Sheet, Cash Flow statement
- [x] Tax reports: VAT return, WHT summary
- [x] Export to Excel / PDF
- [x] Apache Superset BI dashboard integration

---

## Phase 6.5 — Tenant Customization & RBAC _(Week 26)_

### 6.5.1 Custom Role Definition

- [ ] Create/Edit custom roles with specific dashboard module visibility
- [ ] Assign custom roles during onboarding team invitation
- [ ] Manage members and roles in a dedicated "Members & Roles" settings tab
- [ ] Filter dashboard navigation based on role permissions (visibility control)

---

## Phase 7 — Module 6: Human Resources & Talent _(Weeks 27–30)_

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

### 7.4 Recruitment _(Extra)_

- [ ] Job posting tool (posts to landing site careers page)
- [ ] Application tracking: Applied → Shortlisted → Interview → Offer → Onboarded
- [ ] Onboarding checklist: equipment issued, accounts created, induction complete

---

## Phase 8 — Advanced Features & Intelligence _(Weeks 31–36)_

### 8.1 AI Yield Forecasting _(Extra)_

- [ ] Python/FastAPI ML microservice for yield prediction
- [ ] Train on historical cycle + weather data
- [ ] Predict stems/day per variety for next 30 days
- [ ] Feed into order ATP and procurement planning

### 8.2 Demand Sensing _(Extra)_

- [ ] Import historical order data → identify seasonal trends
- [ ] Alert engine for upcoming demand spikes (e.g. Valentine's Day)

### 8.3 Smart Pricing Engine _(Extra)_

- [ ] Track competitor auction prices (scraper / API)
- [ ] Suggest optimal price per stem by grade and destination

### 8.4 Waste Heat Map _(Extra)_

- [ ] Correlate wastage with: temperature deviations, workers, varieties, seasons
- [ ] Surface actionable insights in dashboard

### 8.5 Supplier Scorecard _(Extra)_

- [ ] Auto-calculate: OTD%, quality defect rate, price consistency
- [ ] Recommend preferred suppliers per item category

### 8.6 Multi-Farm (Gold Admin Network)

- [ ] Single Gold Admin overseeing multiple farm tenants
- [ ] Cross-farm consolidated P&L view
- [ ] KPI benchmarking between farms

---

## Phase 8.5 — Monetisation & Subscription Management _(Week 36.5)_

### 8.5.1 Billing Infrastructure

- [ ] Stripe integration for recurring tenant subscriptions
- [ ] Multi-tier pricing plans (Basic, Professional, Enterprise)
- [ ] Free trial logic (14-day auto-expiry without card)
- [ ] Super Admin "Manual Override" — Authorise usage/extend trials (Cash/Friend manual bypass)
- [ ] Automated invoice generation for subscriptions

---

## Phase 9 — Polish, Security & Launch Readiness _(Weeks 37–40)_

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

## Phase 10 — Module 7: Client Order & Payment Portal _(Weeks 41–44)_

### 10.1 Client Storefront

- [ ] Public/Private storefront for authenticated clients
- [ ] Browse available flowers by variety, grade, and real-time ATP
- [ ] Shopping cart & checkout flow

### 10.2 Integrated Payments

- [ ] Multi-channel payment gateway (Stripe, PayPal, M-Pesa Online)
- [ ] Direct bank transfer (manual upload of proof of payment)
- [ ] Instant receipt & invoice generation upon payment

### 10.3 Order Tracking & Delivery

- [ ] Live order status tracking (Confirmed → Packing → In Transit → Delivered)
- [ ] Map view for active deliveries (integrated with Logistics module)
- [ ] Delivery feedback & rating system

### 10.4 Client Dashboard & History

- [ ] Past orders & re-order functionality
- [ ] Ledger view (Total Spent, Outstanding Balance)
- [ ] Profile management & delivery address book

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
