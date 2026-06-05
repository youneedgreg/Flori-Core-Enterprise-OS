# Flori-Core Demo — Cenancle Kenya Build Plan

## Output
`floricore-cenancle-demo.html` — single self-contained file

---

## PHASE 1 — Foundation (CSS + Shell) ✅ DONE
- [x] HTML `<head>`, title, Google Fonts (Space Grotesk + Inter)
- [x] CSS design system (variables, reset, base)
- [x] Landing page styles + HTML (diamond logo, countdown timer, two CTAs)
- [x] Browser chrome wrapper (traffic lights, URL bar, LIVE badge)
- [x] Sidebar (logo, all 18 nav items grouped, user pill, sign out)
- [x] Top mode-toggle bar (Flori-Core brand + mode group + client badge)
- [x] Main content shell + routing skeleton (showLoading → renderMod → extension point)
- [x] Cursor element + CSS (SVG arrow, moveTo/moveToEl/ripple engine)
- [x] Progress bar shell (Mode 1: 18 dots, module name, counter, Resume button)
- [x] Guided tour shell (Mode 2: left panel + right browser frame + mini sidebar)

## PHASE 2 — Module Screens Batch A (1–5) ✅
1. Dashboard — KPIs, audit stream, telemetry pulse, module matrix
2. Farm Zones — 3 zone cards, map toggle, stats
3. Production — Gantt SVG, forecast bars, 5 tabs
4. Farm Operations — 8 tabs, soil test table, irrigation view
5. Pack House — intake table, QC donut chart, 5 tabs

## PHASE 3 — Module Screens Batch B (6–10) ✅
6. Cold Room — 2 sensor cards, FIFO table, check-in form
7. Team Access — 4 user cards, roles tab, invite button
8. HR & Training — training records, compliance bar, KPI bar chart
9. Logistics — Kenya SVG map, route cards, order queue
10. Inventory — ATP table, wastage log, packed boxes

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
