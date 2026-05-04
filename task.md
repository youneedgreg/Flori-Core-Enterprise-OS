# Flori-Core Enterprise OS — Master Task List

> Derived from `flori_core_plan.md`. Check off items as you complete them.

## coldroom)

## Phase 2 — Module 1: Precision Production & IoT [COMPLETED]

- [x] **Genetic Inventory**: Full CRUD for flower varieties with stem length, bloom time, and market grade targets.
- [x] **Lifecycle Control**: Gantt-style propagation timeline, automated yield forecasting, and status flow (Planned → Planted → Growing → Harvesting → Completed).
- [x] **PHI Compliance**: Integrated Pre-Harvest Interval safety engine blocking early harvests post-chemical application.
- [x] **Historical Data Entry**: Modals for back-dated logging of Harvest records, Crop Performance, and Pre-Harvest Quality checks.
- [x] **Field Intelligence**: Zone-specific logs for Irrigation, Soil Tests, and Scouting reports (Pests/Diseases).
- [x] **UI Polish**: Slide-in detail panels for Zones and Cycles with parallel data fetching and full navigation linking.

---

## Phase 5 — Module 4: Global Sales, Logistics & Compliance [IN PROGRESS]

### 5.3 Export Documentation Vault

- [x] Phytosanitary Certificate: auto-filled from order + spray log
- [x] Export Permit: regulatory API link or structured manual upload
- [x] Customs Invoice / Packing List from box manifest
- [x] Certificate of Origin template with auto-fill
- [x] Docs stored in S3, version-controlled, audit-accessible
- [x] Auto-email docs to freight forwarder/buyer with order context

### 5.6 Auction Integration _(Extra)_

- [x] Dutch flower auction format (price-per-stem × lot)
- [x] Lot preparation and clock number assignment
- [x] Auction result import → auto-invoice generation

---

## Phase 6 — Module 5: Integrated Financials

### 6.4 Payroll Engine [SKELETON DONE]

- [x] Pull hours from production labour logs + HR attendance (Skeleton integrated)
- [x] Implement Kenya Statutory Deductions (NHIF, NSSF, PAYE tax bracket engine)
- [x] Payslip PDF generation + email to employee
- [x] M-Pesa bulk disbursement API integration (Safaricom B2C)
- [x] Link actual production labour logs hourly rates to payslip computation

---

## Phase 6.5 — Tenant Customization & RBAC _(Day 26)_

### 6.5.1 Custom Role Definition

- [ ] Create/Edit custom roles with specific dashboard module visibility
- [ ] Assign custom roles during onboarding team invitation
- [ ] Manage members and roles in a dedicated "Members & Roles" settings tab
- [ ] Filter dashboard navigation based on role permissions (visibility control)

---

## Phase 7 — Module 6: Human Resources & Talent _(Weeks 27–30)_

### 7.3 Training & Appraisals

- [x] Training records: course, provider, date, score, certificate upload
- [x] Compliance training tracker: chemical handling, first aid, fire safety
- [x] Performance appraisal: 360° review form (self, peer, supervisor)
- [x] KPI scoring linked to farm productivity data
- [x] Training calendar with department-wide scheduling

---

## Phase 7.5 — AI Chatbot Assistant _(Weeks 30–32)_

### 7.5.1 Core Chat Infrastructure

- [ ] Persistent chat widget (bottom-right floating button) accessible from every dashboard page
- [ ] Chat UI: message bubbles, typing indicator, file/image attachment support
- [ ] Conversation history stored per user (resume past conversations)
- [ ] LLM integration backend (OpenAI / Anthropic API) with system context injection
- [ ] Rate limiting and token budget management per tenant

### 7.5.2 Paper-to-Digital Migration (OCR Import)

- [ ] Photo upload: snap pictures of paper records (invoices, delivery notes, spray logs, receipts)
- [ ] OCR extraction engine: parse handwritten/printed data from uploaded images
- [ ] Structured data preview: show extracted fields for user review before committing
- [ ] Auto-map extracted data to system entities (inventory items, employee records, financial entries)
- [ ] Bulk import from legacy spreadsheets (CSV/Excel) via chat — "Import this file into inventory"
- [ ] Historical spray log import from paper notebooks (chemical, date, zone, PHI)
- [ ] Scanned delivery note → auto-create GRN + update stock levels

### 7.5.3 System Q&A & Navigation Help

- [ ] Context-aware answers: "How do I add a new cold room?" → step-by-step with deep links
- [ ] Module explainer: "What does the Pack House module do?" → feature overview
- [ ] Error/issue help: "My payroll run failed" → diagnose from audit logs and suggest fixes
- [ ] Permission awareness: "Why can't I see the Financials tab?" → check user role and explain
- [ ] Searchable knowledge base integration (indexed from all module docs)

### 7.5.4 Natural Language Data Queries

- [ ] "How many stems did we harvest last week?" → query HarvestRecord and summarise
- [ ] "Show me top 5 employees by stems per hour this month" → KPI leaderboard
- [ ] "What's our current inventory of Red Naomi?" → real-time stock lookup
- [ ] "Which documents are expiring in the next 30 days?" → compliance alert summary
- [ ] "What was our total revenue last quarter?" → financial summary from GL
- [ ] Response formatting: tables, charts, and downloadable CSVs inline in chat

### 7.5.5 Quick Actions via Chat

- [ ] "Create a purchase request for 50 bags of NPK fertiliser" → pre-fill PR form
- [ ] "Schedule chemical handling training for the Production team next Monday" → create TrainingSchedule
- [ ] "Apply for 3 days annual leave starting Friday" → submit LeaveRequest
- [ ] "Log a pest scouting report for Zone A — aphids, moderate severity" → create ScoutingReport
- [ ] "Send a reminder to all drivers about tomorrow's dispatch" → trigger notification
- [ ] Action confirmation step: show summary card before executing any write operation

### 7.5.6 Onboarding & Guided Setup

- [ ] New user welcome flow: introduce available modules based on role
- [ ] Interactive setup wizard: "Let's get your farm set up" → guide through zones, varieties, employees
- [ ] Contextual tips: surface relevant suggestions based on current page ("Tip: you can bulk-assign shifts here")
- [ ] Video/screenshot walkthrough links per module

### 7.5.7 Proactive Alerts & Insights

- [ ] Daily digest: "Good morning — 3 documents expiring this week, 2 pending leave requests"
- [ ] Anomaly detection: "Rejection rate in Zone B spiked 3× today vs. average"
- [ ] Compliance reminders: "5 employees overdue for Fire Safety training"
- [ ] Financial nudges: "Payroll run for April hasn't been initiated yet"
- [ ] Weather-linked advice: "Rain forecast for Thursday — consider adjusting spray schedule"

### 7.5.8 Report Generation

- [ ] "Generate a monthly production report for March" → formatted PDF/summary
- [ ] "Export all training records as a spreadsheet" → CSV download link
- [ ] "Summarise this week's logistics performance" → delivery stats, on-time %, wastage
- [ ] Natural language → chart: "Plot harvest trends for Red Naomi over the last 6 months"

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
- [ ] Custom loader per page for all pages

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
- [ ] New user wizard and self help page with screenshots
- [ ] Gold Admin support ticket submission from within OS

### 9.8 Dashboard & UI Enhancements

- [ ] General notifications page with filtering and archive history
- [ ] Custom loader per page for all pages

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
