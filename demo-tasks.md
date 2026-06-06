# Flori-Core Demo — Cenancle Kenya Build Plan

## Output
`floricore-cenancle-demo.html` — single self-contained file

---

## PHASE 1 — Foundation (CSS + Shell) ✅ DONE + UI FIXED
- [x] HTML `<head>`, title, Google Fonts (Space Grotesk + Inter)
- [x] CSS design system (variables, reset, base)
- [x] Landing page styles + HTML (diamond+lightning bolt logo, countdown timer, two CTAs)
- [x] Browser chrome wrapper (traffic lights, URL bar, LIVE badge)
- [x] Sidebar — matches real app exactly:
      - Lightning bolt diamond logo (matches real Flori-Core icon)
      - 18 nav items with inline SVG line icons (no unicode symbols)
      - No section text labels — subtle 8px nav-sep dividers only
      - Sidebar width 240px (matches real app)
      - User avatar + name + role at BOTTOM before Sign Out (not top pill)
- [x] Top mode-toggle bar (Flori-Core brand + mode group + client badge)
- [x] Main content shell + routing skeleton (showLoading → renderMod → extension point)
- [x] Cursor element + CSS (SVG arrow, moveTo/moveToEl/ripple engine)
- [x] Progress bar shell (Mode 1: 18 dots, module name, counter, Resume button)
- [x] Guided tour shell (Mode 2: left panel + right browser frame + mini sidebar)

## PHASE 2 — Module Screens Batch A (1–5) ✅ DONE
1. Dashboard — 4 KPI cards, audit stream, live telemetry, 12-cell quick-access matrix
2. Farm Zones — 3 zone cards (A/B/C), SVG map view toggle, activity log, 4 KPI cards
3. Production — 4 KPI cards, 5 tabs (Gantt SVG 12-week, Batches, Forecast bars, Varieties, Labour)
4. Farm Operations — 4 KPI cards, 8 tabs (Soil, Irrigation, Spray, IPM, Maintenance, Tasks, Weather, Incidents)
5. Pack House — 4 KPI cards, 5 tabs (QC donut chart 84/13/3%, Intake, Packing, Cold Chain, Labour)

## PHASE 3 — Module Screens Batch B (6–10) ✅ DONE
6. Cold Room — 2 sensor cards (STABLE/WARNING), SVG 6h temp trend chart, FIFO table, check-in form
7. Team Access — 4 user cards (avatars, 2FA, last login), Grace flagged TEMP PW, role permission matrix, invite form
8. HR & Training — training records, compliance bar by category, 360° appraisal (Grace Njoroge), KPI bar chart, calendar table
9. Logistics — Kenya SVG map (Naivasha→JKIA, animated truck), route cards, 22-order queue, fleet register
10. Inventory — ATP table (3 varieties, committed/ATP), stem flow summary, packed boxes, wastage log + cause breakdown

## PHASE 4 — Module Screens Batch C (11–16) ✅
11. Stores — item catalogue, movement log, low stock alerts
12. Sales — kanban board, orders table, invoices
13. Procurement — PR list, PO table, GRN history
14. Financials — P&L table, balance sheet, KPI cards
15. Payroll — employee list, payroll runs, overview
16. Compliance — certs table, spray logs, audit trail

## PHASE 5 — Module Screens Batch D (17–19) ✅
17. IoT Telemetry — sensor cards, animated line chart (canvas), automation rules
18. Audit Trail — filter bar, diff-expandable table
19. AI Assistant — chat panel, streaming type demo, suggested prompts

## PHASE 6 — Animation Engine ✅
- Cursor engine (moveTo, moveToEl, ripple, click, hover)
- Typing animation (char-by-char, blinking caret)
- Loading state (spinner, 800ms delay)
- Tab switch animation (fade out/in)
- Sidebar nav hover + active transitions
- Click ripple effect

## PHASE 7 — Auto-Play (Mode 1) ✅
- Auto-play steps defined per module (hover, click, tab, type, wait)
- Sequencer engine (async/await, pauseable)
- "Take control" badge (appears at 3s, click-anywhere-to-pause)
- Progress bar (dots, module counter, Resume button)
- Module dot jump
- After module 4 → AI chat demo loop

## PHASE 8 — Guided Tour (Mode 2) ✅
- Left panel: module number, title, bullets, WHY THIS MATTERS
- Right panel: browser chrome with module screen
- Short cursor demo loop (4s) per module
- Prev/Next navigation
- All 19 module descriptions written for Cenancle Kenya

## PHASE 9 — Polish ✅
- Landing page 4s auto-transition
- Browser URL updates per module
- File size check (target < 600KB)
- Cross-check all Cenancle data is correct (no lorem ipsum)
- Verify all 19 modules have no empty states

---

## PHASE 10 — Background & Communication Screens ✅ DONE

These screens demo what happens *behind the scenes* — the emails sent, WhatsApp messages fired, and automated triggers the client never opens but that make the system feel alive and enterprise-grade.

### 10A — Email Notification Previews ✅
- [x] Order Confirmation Email (SO-7821 → Flamingo Horticulture UK)
- [x] Cold Room Temperature Alert Email (Cold Room 2 at 3.4°C → James Kariuki)
- [x] GRN Confirmation Email (PO-2026-0034 → KLP Agro Supplies)
- [x] Payroll Payslip Email (May 2026 → Grace Njoroge)
- [x] Compliance Reminder Email (GlobalG.A.P expiry → Farm Director)

### 10B — WhatsApp Message Previews ✅
- [x] Cold Room 2 Alert chat (James Kariuki)
- [x] Logistics Driver Alert chat (James Mutua)
- [x] Buyer Order Status Update (Flamingo Horticulture)
- [x] Casual Labour Shift Reminder (Harvest Team B group)
- [x] Payroll Run Ready (Finance Team)

### 10C — SMS Notification Previews ✅
- [x] Cold Room Critical SMS (James Kariuki)
- [x] Payslip SMS to Casual Worker (Mary K.)
- [x] Delivery Confirmation SMS (Flamingo Horticulture)

### 10D — Automated Background Triggers Panel ✅
- [x] Automation Rules Table (6 rules: cold room, inventory, cert expiry, payroll, sales, nightly cron)
- [x] Automation Run Log (last 10 fired events with timestamps, recipients, channels, status)
- [x] Notification Preferences Panel (toggle matrix: 7 alert types × 4 staff members)

### 10E — In-App Notification Centre ✅
- [x] Notification Bell Badge (red badge with unread count in topbar)
- [x] Notification Drawer (slide-in right panel, tabs: All / Alerts / Approvals / System)
- [x] 5 sample notifications (cold room, PR approval, payroll, dispatch, GlobalG.A.P)
- [x] Mark all read button + individual dismiss (×)
- [x] Click-through navigation to relevant module on click

---

## Data Quick Reference
- Farm: Cenancle Kenya, Naivasha
- User: James Kariuki, Farm Director
- Zones: A (Red Naomi 3.2ha), B (Avalanche White 2.8ha), C (Pink Floyd 1.5ha)
- Output: 48,000 stems/day
- Workforce: 312 (148 perm + 164 casual)
- Revenue MTD: KES 8,450,000
- Cold Room 1: 2.1°C STABLE | Cold Room 2: 3.4°C WARNING
- IoT: Moisture 38.2%, Temp 22.8°C, EC 1.6, pH 6.3
- AI Query: "projected output this week?" → 52,800 stems response
