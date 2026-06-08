# Flori-Core Cenancle Demo — Rebuild Plan

Rebuild `floricore-cenancle-demo.html` in the style of the RadioCare mockup:
light-mode, professional, tab navigation at top, per-screen captions, no autoplay,
no custom cursor, no animations. All 21 modules + Login screen.

---

## Design System

| Token | Value |
|---|---|
| Fonts | Sora (headings) + Plus Jakarta Sans (body) |
| Brand green | `#1a7a45` |
| Brand teal | `#0fb59a` |
| Brand deep | `#0d4a2a` |
| Sidebar bg | `#0d1f13` (dark green, like radiology dark sidebar) |
| Page bg | `linear-gradient(135deg, #eef6ef, #e8f3f0)` |
| Panel | `#ffffff` |
| Panel-2 | `#f4faf6` |
| Line | `#d4ead9` |

---

## Screens (22 total)

Login, Dashboard, Farm Zones, Production, Farm Operations, Pack House,
Cold Room, Team Access, HR & Training, Logistics, Inventory, Stores,
Sales, Procurement, Financials, Payroll, Compliance Vault, IoT Telemetry,
Audit Trail, AI Assistant, Communications, Automations

---

## Phase Plan

### Phase 1 — Foundation shell ✅ target
- [ ] HTML head, CSS design system (variables, reset, layout, components)
- [ ] Brand bar, lede section, sticky nav bar
- [ ] App shell (sidebar + main) with sidebar JS populated per screen
- [ ] Login screen (full standalone, no sidebar)
- [ ] Tab helper function

### Phase 2 — Core operations (4 screens)
- [ ] Dashboard — 4 KPIs, activity log, live telemetry, module matrix
- [ ] Farm Zones — 4 KPIs, 3 zone cards (A/B/C), activity log
- [ ] Production — 4 KPIs, Gantt SVG, forecast bars, batches table (tabs)
- [ ] Farm Operations — Soil/Irrigation/Spray/IPM/Tasks tabs

### Phase 3 — Post-harvest & people (3 screens)
- [ ] Pack House — QC grading donut, intake log, packing orders (tabs)
- [ ] Cold Room — 2 sensor cards, temp chart SVG, FIFO table
- [ ] Team Access — User cards grid, permissions matrix, invite form (tabs)

### Phase 4 — HR, logistics & stock (4 screens)
- [ ] HR & Training — Records, compliance bars, appraisal, KPI chart (tabs)
- [ ] Logistics — Kenya map SVG, dispatch queue, fleet table (tabs)
- [ ] Inventory — ATP table, packed boxes, wastage log (tabs)
- [ ] Stores — Catalogue, GRN movements, low-stock alerts (tabs)

### Phase 5 — Commercial & finance (4 screens)
- [ ] Sales — Pipeline kanban, orders table, invoices (tabs)
- [ ] Procurement — 3 PRs, PO register, vendor roster, GRN (tabs)
- [ ] Financials — P&L summary, revenue/expense breakdown, export
- [ ] Payroll — 312 staff summary, run history, deductions table

### Phase 6 — Compliance & intelligence (5 screens)
- [ ] Compliance Vault — Certs table, spray log, labour records, audit (tabs)
- [ ] IoT Telemetry — 4 sensor cards, trend chart SVG, automation rules
- [ ] Audit Trail — Filter bar, immutable log table with diff rows
- [ ] AI Assistant — Chat interface, suggested prompts, conversation history
- [ ] Communications — Message log (email/WhatsApp/SMS)
- [ ] Automations — Rules list, run log, notification matrix

---

## Rules
- Each phase is one Write call to the file (append or full rewrite depending on phase)
- No autoplay, no custom cursors, no `setInterval` sequencers
- All JS limited to: tab helper, screen navigation, sidebar populate
- Test in browser after each phase before moving on
