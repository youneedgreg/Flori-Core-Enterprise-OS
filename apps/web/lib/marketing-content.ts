/**
 * Marketing page copy.
 *
 * Ported from the standalone flori-core-website. Kept as data rather than
 * inlined into JSX so the same domain descriptions can serve both the condensed
 * home page and the full /platform page without being written twice — the
 * failure mode being copy that drifts apart and then contradicts itself.
 */

export type Module = { name: string; body: string; features?: string[] };
export type Domain = { id: string; title: string; blurb: string; modules: Module[] };

export const STAKES = [
  {
    when: "03:14",
    tone: "text-red-400",
    what: "Cold room 2 held 9.1 °C until morning shift.",
    why: "Nobody was in the building. The breach was found at 06:40 — six hours of a graded consignment already gone.",
  },
  {
    when: "D-4",
    tone: "text-amber-400",
    what: "Block 7 spray log rebuilt from memory before the audit.",
    why: "Three supervisors, one notebook, two WhatsApp threads. No record of who applied what, at what rate, on which date.",
  },
  {
    when: "Δ 1,350",
    tone: "text-amber-400",
    what: "Stems counted at intake never match stems invoiced.",
    why: "Grading, packing and sales each keep their own sheet, so the variance is discovered after the invoice has left.",
  },
];

export const FAILURE_MODES = [
  {
    title: "A certificate expires unnoticed",
    body: "Renewal dates live in one manager's inbox. The expiry is discovered by a buyer, or by an auditor, not by you.",
  },
  {
    title: "The cold chain breaks in transit",
    body: "Between pack house and JKIA there is no reading, no timestamp and no owner — only a rejected consignment and a claim you can't evidence.",
  },
  {
    title: "Casual payroll is computed on paper",
    body: "Hundreds of casual workers, attendance on a clipboard, deductions worked out by hand. Disputes cannot be settled from the record because there isn't one.",
  },
  {
    title: "Procurement reorders what is already in stores",
    body: "Chemicals sit on a shelf while a purchase order for the same drum is approved, because stores and procurement keep separate books.",
  },
];

/** Condensed module copy used on the home page. */
export const HOME_DOMAINS: Domain[] = [
  {
    id: "grow",
    title: "GROW",
    blurb: "Land, crop cycles and the daily work in the greenhouses.",
    modules: [
      { name: "Farm Zones", body: "Zone-by-zone management with crop variety, planted area, growth stage, irrigation schedule and historical yield — including an interactive map view." },
      { name: "Production", body: "Crop cycle management from planting to harvest, with a 12-week Gantt schedule, active batches, yield forecast and variety performance." },
      { name: "Farm Operations", body: "Soil management, irrigation, spray programs, IPM, maintenance, task scheduling, weather tracking and incident reports." },
    ],
  },
  {
    id: "measure",
    title: "MEASURE",
    blurb: "Sensor data and business data in one queryable place.",
    modules: [
      { name: "IoT Telemetry", body: "Field sensors stream soil moisture, air temperature, EC and pH over MQTT into a time-series database — so telemetry and business records can be queried together, not exported and matched by hand." },
      { name: "Automation Rules", body: "Thresholds that fire in real time — trigger irrigation when moisture drops below a set point, alert when a cold room exceeds its ceiling. Every rule run is logged." },
    ],
  },
  {
    id: "move",
    title: "MOVE",
    blurb: "Harvest floor to aircraft, with the cold chain accounted for.",
    modules: [
      { name: "Pack House", body: "QC grading (Grade A/B/waste), intake logging, packing station management, cold chain handover and labour productivity." },
      { name: "Cold Room", body: "Live sensor readings per room, trend charts, FIFO inventory, check-in/check-out and automatic breach alerts." },
      { name: "Inventory", body: "Available-to-Promise by variety, stem flow, packed box register and a wastage log with cause breakdown." },
      { name: "Logistics", body: "Shipment planning, route mapping from farm to JKIA, dispatch queue, fleet register and driver assignment." },
    ],
  },
  {
    id: "sell",
    title: "SELL & BUY",
    blurb: "Orders out, inputs in, both tied to stock on hand.",
    modules: [
      { name: "Sales", body: "CRM and order pipeline from enquiry through confirmed, packed, dispatched and invoiced, with buyer records for EU, UK and UAE markets." },
      { name: "Procurement", body: "Purchase requests — manual or auto-triggered by low stock — purchase orders, goods received notes, invoice matching, payments and vendor management." },
      { name: "Stores", body: "Agrochemicals, packaging and consumables with stock movements, low-stock alerts and reorder triggers feeding procurement." },
    ],
  },
  {
    id: "run",
    title: "RUN",
    blurb: "The back office: money, people and the audit trail.",
    modules: [
      { name: "Financials", body: "P&L, balance sheet, cash flow and budget vs actuals, multi-currency in KES, USD and EUR." },
      { name: "HR & Training", body: "Permanent and casual workforce, contracts, training records, handler certification tracking and performance appraisals." },
      { name: "Payroll", body: "Monthly runs for salaried and casual workers, payslips, NSSF/NHIF/PAYE deductions, bulk approval and payslip delivery by email and SMS." },
      { name: "Compliance", body: "Certificate registry with expiry alerts, spray logs, chemical usage auditing and a full audit trail." },
      { name: "Team & Access", body: "User accounts, roles and permissions per farm — who may see payroll, who may sign off a spray, who may only record a delivery." },
    ],
  },
];

/** Expanded module copy with feature lists, used on the platform page. */
export const PLATFORM_DOMAINS: Domain[] = [
  {
    id: "grow",
    title: "GROW",
    blurb: "Land, crop cycles and the daily work in the greenhouses.",
    modules: [
      { name: "Farm Zones", body: "Zone-by-zone management of the whole estate, with an interactive map view.", features: ["Crop variety and planted area per zone", "Growth stage tracking", "Irrigation schedules", "Historical yield by zone"] },
      { name: "Production", body: "Crop cycle management from planting through to harvest.", features: ["12-week Gantt schedule", "Active batch register", "Yield forecast", "Variety performance"] },
      { name: "Farm Operations", body: "The daily operating record of the farm floor.", features: ["Soil management and irrigation", "Spray programs and IPM", "Maintenance and task scheduling", "Weather tracking and incident reports"] },
    ],
  },
  {
    id: "measure",
    title: "MEASURE",
    blurb: "Sensor data and business data in one queryable place.",
    modules: [
      { name: "IoT Telemetry", body: "Field sensors stream over MQTT into a time-series database alongside the business record.", features: ["Soil moisture and air temperature", "EC and pH", "MQTT ingest, time-series storage", "Telemetry queryable together with business data"] },
      { name: "Automation Rules", body: "Thresholds that fire in real time, with every run written to the log.", features: ["Trigger irrigation below a moisture set point", "Alert when a cold room exceeds its ceiling", "Every rule run logged and attributable"] },
    ],
  },
  {
    id: "move",
    title: "MOVE",
    blurb: "Harvest floor to aircraft, with the cold chain accounted for.",
    modules: [
      { name: "Pack House", body: "Intake to handover, with grading and labour on the same record.", features: ["QC grading — Grade A / B / waste", "Intake logging", "Packing station management", "Cold chain handover", "Labour productivity"] },
      { name: "Cold Room", body: "Live conditions per room, and what is in each one.", features: ["Live sensor readings per room", "Trend charts", "FIFO inventory", "Check-in / check-out", "Automatic breach alerts"] },
      { name: "Inventory", body: "What you can promise a buyer, and where the losses went.", features: ["Available-to-Promise by variety", "Stem flow", "Packed box register", "Wastage log with cause breakdown"] },
      { name: "Logistics", body: "The run from the farm gate to the airport, planned and assigned.", features: ["Shipment planning", "Route mapping, farm to JKIA", "Dispatch queue", "Fleet register and driver assignment"] },
    ],
  },
  {
    id: "sell",
    title: "SELL & BUY",
    blurb: "Orders out, inputs in, both tied to stock on hand.",
    modules: [
      { name: "Sales", body: "CRM and order pipeline for export buyers.", features: ["Enquiry → confirmed → packed → dispatched → invoiced", "Buyer records for EU, UK and UAE markets"] },
      { name: "Procurement", body: "Requests through to payment, matched against what arrived.", features: ["Purchase requests — manual or auto-triggered by low stock", "Purchase orders and goods received notes", "Invoice matching and payments", "Vendor management"] },
      { name: "Stores", body: "Agrochemicals, packaging and consumables under one stock record.", features: ["Stock movements", "Low-stock alerts", "Reorder triggers feeding procurement"] },
    ],
  },
  {
    id: "run",
    title: "RUN",
    blurb: "Money, people and the audit trail.",
    modules: [
      { name: "Financials", body: "Statements built from operational records, not re-keyed from them.", features: ["P&L, balance sheet, cash flow", "Budget vs actuals", "Multi-currency: KES, USD, EUR"] },
      { name: "HR & Training", body: "One workforce register for permanent and casual staff.", features: ["Contracts and worker records", "Training records", "Handler certification tracking", "Performance appraisals"] },
      { name: "Payroll", body: "Monthly runs for salaried and casual workers.", features: ["NSSF / NHIF / PAYE deductions", "Payslips per worker", "Bulk approval", "Payslip delivery by email and SMS"] },
      { name: "Compliance", body: "The evidence layer over everything above.", features: ["Certificate registry with expiry alerts", "Spray logs", "Chemical usage auditing", "Full audit trail"] },
      { name: "Team & Access", body: "Who may do what, per farm.", features: ["User accounts and invitations", "Role assignment", "Permission scopes per module", "Access history"] },
    ],
  },
];

export type AuditRow = { field: string; value: string; kind: "added" | "removed" | "neutral" };
export type AuditEntry = { op: string; subject: string; meta: string; rows: AuditRow[] };

export const HOME_AUDIT: AuditEntry[] = [
  {
    op: "spray_log.update",
    subject: "Block 7 · Ridomil Gold",
    meta: "j.mwangi (Agronomist) · 12 Aug 2026 14:22 EAT · 41.90.64.12 · web",
    rows: [
      { field: "dose_rate", value: "− 2.0 L/ha", kind: "removed" },
      { field: "dose_rate", value: "+ 2.5 L/ha", kind: "added" },
      { field: "reentry_hours", value: "+ 24", kind: "added" },
    ],
  },
  {
    op: "certificate.renewed",
    subject: "Handler certification · 14 operators",
    meta: "a.chege (HR) · 09 Aug 2026 08:05 EAT · 41.90.64.31 · web",
    rows: [
      { field: "expires_on", value: "− 2026-09-30", kind: "removed" },
      { field: "expires_on", value: "+ 2027-09-30", kind: "added" },
    ],
  },
  {
    op: "automation.rule_fired",
    subject: "Cold room 2 · breach alert",
    meta: "system · 08 Aug 2026 03:14 EAT · rule #CR-02-TEMP · SMS + WhatsApp sent",
    rows: [
      { field: "reading", value: "9.1 °C (ceiling 4.0 °C)", kind: "neutral" },
      { field: "notified", value: "Pack House Supervisor, Farm Director", kind: "neutral" },
      { field: "acknowledged", value: "03:19 EAT · p.kimani", kind: "neutral" },
    ],
  },
];

export const COMPLIANCE_AUDIT: AuditEntry[] = [
  HOME_AUDIT[0],
  HOME_AUDIT[1],
  {
    op: "chemical_usage.reconciled",
    subject: "Stores ↔ field applications",
    meta: "m.otieno (Stores) · 05 Aug 2026 17:41 EAT · 41.90.64.09 · web",
    rows: [
      { field: "issued", value: "18.0 L", kind: "neutral" },
      { field: "applied", value: "17.5 L across 7 blocks", kind: "neutral" },
      { field: "returned_to_store", value: "0.5 L", kind: "neutral" },
    ],
  },
];

export const RBAC = [
  { role: "Farm Director", scope: "Full read across departments, financial approval, audit trail access" },
  { role: "Agronomist", scope: "Zones, crop cycles, spray programs, IPM, incident reports" },
  { role: "Pack House Supervisor", scope: "Intake, grading, packing stations, cold room handover, shift labour" },
  { role: "Finance", scope: "Ledgers, payroll runs, invoice matching, payments, multi-currency" },
  { role: "Driver", scope: "Assigned dispatch only — manifest, route, handover confirmation" },
];

export const HOME_SECURITY = [
  { title: "Multi-tenant isolation", body: "Every record is scoped to a single farm tenant. No shared tables of farm data, no cross-farm queries." },
  { title: "Two-factor authentication", body: "Enforced per role, so finance and director accounts can be held to a higher bar than a driver's handset." },
  { title: "Immutable audit log", body: "Append-only. Every create, change and approval is attributable to a user, a time and a source." },
];

export const COMPLIANCE_SECURITY = [
  { title: "Multi-tenant isolation", body: "Every record is scoped to a single farm tenant. No shared tables of farm data and no cross-farm queries — your yields, buyers, costs and payroll stay inside your tenant." },
  { title: "Two-factor authentication", body: "Enforced per role, so director and finance accounts can be held to a higher bar than a handset used on the dispatch bay." },
  { title: "Immutable audit log", body: "Append-only across every module. Creates, changes, approvals and automated rule runs are all attributable to a user or a rule, a time and a source." },
];

export const COMPLIANCE_RECORDS = [
  { title: "Certificate registry", body: "Every certificate the farm holds, its holder, its documents and its renewal date in one register — with alerts raised ahead of expiry rather than discovered by a buyer." },
  { title: "Spray logs", body: "Product, rate, operator, block, date and re-entry interval recorded at application — not reconstructed from notebooks and WhatsApp threads the week before an inspection." },
  { title: "Chemical usage auditing", body: "Stores movements reconcile against what was actually applied in the field, so usage records and stock records tell the same story." },
];

export const HOME_COMPLIANCE_BULLETS = [
  { lead: "Certificate registry with expiry alerts.", body: "Every certificate, its holder, its renewal date and its documents in one register — alerts ahead of expiry, not after." },
  { lead: "Spray logs recorded at application.", body: "Product, rate, operator, block, date and re-entry interval, entered on the spot by the person doing the work." },
  { lead: "Chemical usage auditing.", body: "Stores movements reconcile against what was actually applied, so usage records and stock records agree." },
];

export const KENYA_CARDS = [
  { title: "KES, USD and EUR", body: "Costs in shillings, sales in euros and dollars — held in one ledger without a parallel spreadsheet." },
  { title: "NSSF, NHIF and PAYE", body: "Statutory deductions applied in the payroll run, with payslips per worker and bulk approval." },
  { title: "Casual alongside permanent", body: "Daily-rate casual labour and salaried staff in the same workforce register, contracts and appraisals included." },
  { title: "Naivasha to JKIA", body: "Route mapping, dispatch queue and driver assignment for the run that decides whether the flight is met." },
  { title: "EU, UK and UAE buyers", body: "Buyer records, order pipeline and Available-to-Promise by variety across export markets." },
  { title: "WhatsApp and SMS alerts", body: "Supervisors are in the greenhouse, not at a desk. Breaches and approvals reach them where they already are." },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "What does Flori-Core Enterprise OS replace on a flower farm?", a: "It replaces the spreadsheets, notebooks and WhatsApp threads that each department keeps separately. Production, pack house, cold room, inventory, logistics, sales, procurement, stores, financials, HR, payroll and compliance all write to one database, so a graded stem, its cold room hours, its invoice and its spray history are the same record seen from different desks." },
  { q: "Is Flori-Core one system or a set of separate modules?", a: "Seventeen modules grouped into five domains — Grow, Measure, Move, Sell & Buy and Run — sharing a single database. They are not separate products that sync overnight; a change in the pack house is immediately the same record finance invoices and compliance audits." },
  { q: "Is our farm's data visible to other farms on the platform?", a: "No. Every record is scoped to a single farm tenant. There are no shared tables of farm data and no cross-farm queries, so yields, buyers, costs and payroll stay inside your own tenant. Flori-Core is sold to the farm and deployed per farm." },
  { q: "Does Flori-Core issue or guarantee certification?", a: "No. Flori-Core is software that helps farms maintain and evidence their own certifications. It does not issue, grant or guarantee any certification, and is not affiliated with, partnered with or endorsed by any certification body. Schemes such as GlobalG.A.P, Rainforest Alliance, MPS and KEPHIS requirements are referenced only as certifications a farm may track inside the system." },
  { q: "How does Flori-Core keep a farm audit-ready?", a: "Certificates, spray logs and chemical usage are captured at the point of work by the person doing it, rather than reconstructed the week before an inspection. The certificate registry raises alerts ahead of expiry, spray logs record product, rate, operator, block, date and re-entry interval at application, and stores movements reconcile against what was actually applied in the field." },
  { q: "Can we see who changed a record, and when?", a: "Yes. The audit trail is append-only across every module: nothing can be edited or deleted after the fact, and corrections are written as new entries. Each row expands to the field-level diff — the old value, the new value, the named user or the system rule that fired, the timestamp in EAT, and the source address and client." },
  { q: "Does it handle casual labour and Kenyan statutory deductions?", a: "Yes. Permanent and casual workers sit in one workforce register with contracts, training records, handler certification tracking and appraisals. Monthly payroll runs cover salaried and daily-rate casual workers, apply NSSF, NHIF and PAYE deductions, support bulk approval, and deliver payslips by email and SMS." },
  { q: "Which currencies does Flori-Core support?", a: "KES, USD and EUR are held in one ledger, so costs in shillings and sales in euros or dollars reconcile without a parallel spreadsheet. Financials cover P&L, balance sheet, cash flow and budget versus actuals." },
  { q: "What happens when a cold room goes out of range at night?", a: "Automation rules fire on thresholds in real time — for example alerting when a cold room exceeds its ceiling, or triggering irrigation below a soil moisture set point. Alerts reach supervisors by SMS and WhatsApp rather than waiting for someone to be at a desk, and every rule run is logged and attributable." },
  { q: "Can Flori-Core track shipments from the farm to the airport?", a: "Yes. Logistics covers shipment planning, route mapping from the farm to JKIA, the dispatch queue, the fleet register and driver assignment. Cold room check-in and check-out, FIFO inventory and cold chain handover from the pack house sit on the same record." },
  { q: "How is Flori-Core priced?", a: "Pricing is quoted against hectares under production, headcount and the modules you deploy. Ask on the demo call and we will put it in writing for your procurement committee." },
  { q: "What does a Flori-Core demo involve?", a: "A walkthrough against your own operation rather than a slide deck. Tell us the shape of the farm and we run the demo on the departments that matter to you — pack house and cold chain, payroll and casual labour, or the compliance registry. If you are reviewing with a committee, we send written answers on hosting, data isolation, roles and the audit trail ahead of the call." },
];

export const CONTACT_NOTES = [
  { title: "What happens next", body: "A named person at Flori-Core replies to arrange a time. No sales sequence, no automated drip." },
  { title: "Pricing", body: "Quoted against hectares, headcount and the modules you deploy. Ask on the call and we'll put it in writing for procurement." },
  { title: "Reviewing with a committee", body: "Say so in the enquiry and we'll send written answers on hosting, data isolation, roles and the audit trail ahead of the demo." },
];

export const LONG_DISCLAIMER =
  "Flori-Core is software that helps farms maintain and evidence their own certifications. It does not issue, grant or guarantee any certification, and is not affiliated with, partnered with or endorsed by any certification body. Schemes such as GlobalG.A.P, Rainforest Alliance, MPS and KEPHIS requirements are referenced only as certifications a farm may track inside the system.";

export const HOME_DISCLAIMER =
  "Flori-Core is software that helps farms maintain and evidence their own certifications. It does not issue, grant or guarantee any certification, and is not affiliated with or endorsed by any certification body.";
