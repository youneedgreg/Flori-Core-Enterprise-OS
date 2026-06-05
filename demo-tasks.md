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

## PHASE 10 — Background & Communication Screens (NOT YET IN APP)

These screens demo what happens *behind the scenes* — the emails sent, WhatsApp messages fired, and automated triggers the client never opens but that make the system feel alive and enterprise-grade.

### 10A — Email Notification Previews
Show a simulated email client (inbox + open email) for each key system event:

- [ ] **Order Confirmation Email** — sent to buyer (e.g., Flamingo Horticulture UK) when a Sales order is confirmed. Fields: order #, variety, stems, delivery date, invoice attached as PDF preview
- [ ] **GRN Confirmation Email** — sent to supplier when a Good Receipt Note is signed off. Fields: PO #, items received, quantity, warehouse receipt stamp, receiver name
- [ ] **Invoice Email to Client** — sent with PDF attachment when invoice is generated in Sales. Shows Cenancle Kenya letterhead, itemised bill, bank details (KES + USD), payment due date
- [ ] **Cold Room Temperature Alert Email** — triggered automatically when Cold Room 2 hits WARNING threshold (3.4°C). Sent to James Kariuki + QC supervisor. Subject: "⚠ Cold Room 2 Alert — 3.4°C above threshold". Body shows sensor ID, current reading, threshold, time of breach, action checklist
- [ ] **Low Stock Alert Email** — fired when an Inventory item drops below reorder level. Shows item name, current qty, reorder point, suggested PO with one-click approve link
- [ ] **Payroll Payslip Email** — sent to each employee on payroll run approval. Shows employee name, gross pay, deductions (NHIF, NSSF, PAYE), net pay, pay period. Payslip PDF attached
- [ ] **Compliance Reminder Email** — sent 14 days before a certificate expires (e.g., GlobalG.A.P audit). Shows cert name, expiry date, responsible person, renewal checklist link
- [ ] **Spray Programme Sign-off Email** — sent to KEPHIS contact after spray log is submitted. Includes chemical name, batch, application date, re-entry interval, applicator name

### 10B — WhatsApp Message Previews
Show a WhatsApp Web-style chat UI per recipient/group for each key trigger:

- [ ] **Cold Room 2 Alert — WhatsApp to James Kariuki** — same trigger as email but instant. Message: "🌡 ALERT: Cold Room 2 is at 3.4°C (threshold: 2.5°C). Check immediately. — Flori-Core System". Shows read receipts + timestamp
- [ ] **Logistics Driver Alert** — sent to driver's WhatsApp when a shipment is dispatched. Message: "📦 New delivery assigned: Order #FC-2024-0892 | Naivasha → JKIA | Pickup: 03:00 AM | 48 boxes | Cold chain required. Tap to confirm."
- [ ] **Buyer Order Status Update** — WhatsApp to buyer (Flamingo Horticulture) when order is packed and ready. Message: "✅ Your order #FC-2024-0892 (Avalanche White, 2,400 stems) is packed and en route to JKIA. ETA: 06:30 AM. Track: [link]"
- [ ] **Casual Labour Shift Reminder** — WhatsApp broadcast to casual worker group at 5 PM day before. Message: "📋 SHIFT TOMORROW — Zone B harvest, report by 6:00 AM, Bring your ID. — Cenancle Farm Ops"
- [ ] **Procurement Approval Request** — WhatsApp to James Kariuki when a PR exceeds KES 50,000 auto-approval limit. Message: "💼 PR #PR-2024-0341 from Agri-Inputs Ltd (KES 87,500) needs your approval. Tap to review → [link]"
- [ ] **Payroll Run Ready — WhatsApp to Finance** — sent to Finance Manager when payroll is processed and ready for approval. Message: "💰 June 2024 payroll is ready for review. Total payout: KES 2,847,000. 148 employees. Approve in Flori-Core → [link]"

### 10C — SMS Notification Previews
Show a phone SMS thread UI for fallback/critical-path alerts:

- [ ] **Cold Room Critical SMS** — escalation SMS if WhatsApp not read within 5 min. Plain text to James Kariuki's number: "FLORICORE ALERT: Cold Room 2 breach at 3.4C. Login now: florico.re/coldroom"
- [ ] **Payslip SMS to Casual Worker** — sent to workers without email/WhatsApp. "CENANCLE PAYROLL: Your net pay for June 2024 is KES 14,200. Paid via M-Pesa to 07XXXXXXXX. Queries: HR 0712 345 678"
- [ ] **Delivery Confirmation SMS to Buyer** — fallback after order dispatched. "Cenancle Kenya: Your order 0892 has departed. ETA JKIA 06:30. Ref: FC-2024-0892"

### 10D — Automated Background Triggers Panel
Show a "System Automations" screen listing all rules that fire in the background — think of it as a cron job/workflow viewer:

- [ ] **Automation Rules Table** — list of all active automations: trigger condition, action taken, last fired, status (Active/Paused). Examples:
    - Cold Room temp > 3°C → Email + WhatsApp to Farm Director (last fired: today 02:14 AM)
    - Inventory item qty < reorder level → Email alert + draft PO created (last fired: yesterday)
    - Certificate expiry within 14 days → Email reminder to Compliance Officer (next fire: 8 days)
    - Payroll approved → Payslip emails + SMS batch dispatch (last fired: June 1)
    - Sales order confirmed → Invoice generated + email to buyer (fires: on event)
    - Daily 11 PM → Nightly audit snapshot saved to Audit Trail
- [ ] **Automation Run Log** — scrollable log of every automation that fired: timestamp, trigger, recipient(s), status (Sent ✅ / Failed ❌ / Queued ⏳)
- [ ] **Notification Preferences Panel** — per-user settings for which alerts go via Email / WhatsApp / SMS / In-App. Shows toggle matrix per notification type

### 10E — In-App Notification Centre
Show a slide-out notification drawer (bell icon) that aggregates everything:

- [ ] **Notification Bell Badge** — unread count badge on top nav bell icon
- [ ] **Notification Drawer** — slide-in panel from right: tabs for All / Alerts / Approvals / System
- [ ] **Sample Notifications in Drawer**:
    - 🌡 Cold Room 2 alert — 3.4°C — 2 min ago
    - 💼 PR #PR-2024-0341 pending your approval — 1 hr ago
    - ✅ Order #0892 dispatched to JKIA — 3 hrs ago
    - 📋 GlobalG.A.P certificate expires in 8 days — today
    - 💰 June payroll ready for approval — today
- [ ] **Mark all read** button + individual dismiss
- [ ] **Click-through** — clicking a notification navigates to the relevant module screen

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
