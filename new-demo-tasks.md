# Flori-Core Cenancle Demo — Rebuild Plan v2

Source file: `floricore-cenancle-demo.html`

---

## Design System (Dark Theme — matches actual Next.js app)

| Token | Value |
|---|---|
| Fonts | Sora (headings) + Plus Jakarta Sans (body) |
| Page bg | `#0b1512` (near-black, slight green tint) |
| Sidebar bg | `#080e0b` (very dark) |
| Panel (cards) | `#141f18` |
| Panel-2 (headers) | `#0e1812` |
| Primary text | `#e2e8f0` (slate-200) |
| Secondary text | `#64748b` (slate-500) |
| Border/line | `rgba(255,255,255,0.07)` |
| Brand green | `#10b981` (emerald-500) |
| Brand light | `#34d399` (emerald-400) |
| Brand deep | `#059669` (emerald-600) |
| OK bg | `rgba(52,211,153,0.12)` |
| Warning | `#fbbf24` (amber-400) |
| Danger | `#f87171` (red-400) |
| Info | `#60a5fa` (blue-400) |
| Purple | `#a78bfa` (violet-400) |
| Shadow | `0 8px 28px rgba(0,0,0,.5)` |

---

## Screens (24 total)

Login, Onboarding*, Dashboard, Calendar*, Farm Zones, Production,
Farm Operations, Pack House, Cold Room, Team Access, HR & Training,
Logistics, Inventory, Stores, Sales, Procurement, Financials, Payroll,
Compliance Vault, IoT Telemetry, Audit Trail, AI Assistant,
Communications†, Automations†

*New screens added  
†Existing screens — labelled "Planned Q3 2026"

---

## Phase Plan

### Phase 1 — Dark theme CSS + foundation ✅
- [x] Replace all CSS tokens with dark theme values
- [x] Update body, wrap, nav, lede, topbar, cards, tables, forms, login
- [x] Add modal overlay CSS (7 modals)
- [x] Add floating chat widget CSS
- [x] Add calendar CSS (grid, event pills, week/list views)
- [x] Add onboarding wizard CSS (stepper)

### Phase 2 — Screen content updates ✅
- [x] Update SVG hardcoded fill colors (Gantt, donut, map, trend charts)
- [x] Fix inline `background:#fff` in Sales kanban cards
- [x] Fix hardcoded select `background:#fff` in Audit Trail
- [x] Fix WhatsApp tag hardcoded colors (#dcfce7)
- [x] Update forecast bars `rgba(26,122,69)` → emerald
- [x] Update AI Assistant chat bubbles

### Phase 3 — New features ✅
- [x] Add Onboarding screen (4-step wizard: Farm Profile → Zones → Team → IoT)
- [x] Add Calendar screen (monthly/weekly/list view, all June 2026 events)
- [x] Mark Communications & Automations with "Planned Q3 2026" badge
- [x] Add 7 interactive modal overlays
- [x] Add floating AI chat widget (bottom-right, persistent)
- [x] Update JS: add Calendar + Onboarding to SCREENS + NAV_ITEMS

### Phase 4 — Calendar day-to-day content ✅
- [x] Monthly grid for June 2026 (starts Monday June 1)
- [x] Mark June 6 as "today" (demo date)
- [x] All farm events mapped: harvest, spray, payroll, training, compliance, maintenance
- [x] List view: chronological day-by-day event list for June
- [x] Week view: June 2-8 with time slots
- [x] Event categories: Production, Spray/IPM, HR, Finance, Compliance, Maintenance

---

## Calendar Event Registry — June 2026

| Date | Event | Category | Notes |
|---|---|---|---|
| Daily | Zone A harvest 06:00–14:00 | Production | 21,500 stems/day |
| Daily | Morning farm walk 06:30 | Operations | All zones |
| Jun 1 | Month opens — KPI targets set | Finance | |
| Jun 3 | FloraHolland payment received KES 1.25M | Finance | |
| Jun 4 | Movento 100 SC spray — Zone A | Spray/IPM | Paul Kamau |
| Jun 5 | Switch 62.5 WG — Zone B & C | Spray/IPM | James Otieno |
| Jun 6 | Zone B moisture correction (irrigation) | Operations | Agnes Wanjiku |
| Jun 6 | Cold Room 2 — temp alert 3.4°C | Maintenance | URGENT |
| Jun 6 | PO-2026-0035/0036 dispatched | Procurement | KLP/Florex |
| Jun 8 | IPM weekly scouting — all zones | Spray/IPM | Scout team |
| Jun 10 | Food Safety & Hygiene Refresher | HR/Training | Pack house 8 staff |
| Jun 12 | Floramite SC spray — Zone A | Spray/IPM | Paul Kamau |
| Jun 14 | FC-2406-044 harvest complete (Red Naomi) | Production | Zone A |
| Jun 15 | Q2 payroll — casual workers | Finance | 180 staff |
| Jun 15 | NSSF / NHIF remittance due | Finance | |
| Jun 17 | Agri-Kenya invoice SINV-0287 due | Finance | KES 24,000 |
| Jun 18 | KLP Agro invoice SINV-0288 due | Finance | KES 28,000 |
| Jun 20 | Grace Njoroge cold chain training deadline | HR/Training | |
| Jun 20 | Fire Safety & Evacuation Drill | HR/Training | All 312 staff |
| Jun 25 | HELB deduction remittance | Finance | |
| Jun 28 | FC-2406-045 harvest estimate (Avalanche White) | Production | Zone B |
| Jun 30 | Q2 Appraisals — submission deadline | HR/Training | All managers |
| Jun 30 | GlobalG.A.P. Q2 internal review | Compliance | |
| Jul 15 | FC-2406-046 harvest estimate (Pink Floyd) | Production | Zone C |
| Aug 19 | KFC Certificate renewal deadline | Compliance | 74 days from Jun 6 |

---

## Rules
- Single HTML file, no external dependencies except Google Fonts
- All JS limited to: tab helper, screen nav, sidebar populate, modal control, chat widget toggle
- No autoplay, no custom cursors, no `setInterval` loops
- Modals close on overlay click or ESC key
- Calendar: show real dates for June 2026 (starts Monday June 1)
