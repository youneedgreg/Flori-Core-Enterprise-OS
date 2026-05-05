/* eslint-disable @typescript-eslint/no-inferrable-types */
/**
 * Flori-Core Enterprise OS — Knowledge Base
 * Searchable registry of module docs, how-to guides, error resolution, and glossary.
 */

export interface KBArticle {
  id: string;
  category: 'module' | 'howto' | 'error' | 'glossary';
  title: string;
  keywords: string[];
  content: string;
}

// ─── Module Explainers ──────────────────────────────────────────────
const modules: KBArticle[] = [
  {
    id: 'mod-dashboard',
    category: 'module',
    title: 'Dashboard Overview',
    keywords: ['dashboard', 'home', 'overview', 'summary', 'main page'],
    content: `The **Dashboard** (/dashboard) is your command centre. It shows real-time KPIs: total stems harvested, cold-room temperatures, pending orders, active alerts, and revenue summaries. Widgets refresh automatically and link to their source modules.`,
  },
  {
    id: 'mod-zones',
    category: 'module',
    title: 'Farm Zones Module',
    keywords: [
      'zones',
      'farm zones',
      'greenhouse',
      'open field',
      'cold room',
      'zone management',
    ],
    content: `The **Farm Zones** module (/dashboard/zones) manages all physical areas on the farm: greenhouses, open fields, cold rooms, and pack houses. Each zone tracks area (sqm), crop varieties, IoT devices, temperature/humidity thresholds, and irrigation logs. You can archive zones and view zone-specific telemetry.`,
  },
  {
    id: 'mod-production',
    category: 'module',
    title: 'Production Module',
    keywords: [
      'production',
      'crop cycles',
      'harvest',
      'planting',
      'scouting',
      'yield',
    ],
    content: `The **Production** module (/dashboard/production) covers the full crop lifecycle: crop cycles, planting records, scouting reports, pre-harvest quality checks, and harvest records. It tracks variety performance, stems per sqm, bloom times, and links to spray log compliance data.`,
  },
  {
    id: 'mod-operations',
    category: 'module',
    title: 'Farm Operations Module',
    keywords: [
      'operations',
      'spray logs',
      'irrigation',
      'soil tests',
      'land prep',
      'farm operations',
    ],
    content: `The **Farm Operations** module (/dashboard/operations) manages day-to-day field work: spray logs (chemical applications with PHI tracking), irrigation logs, soil tests, and land preparation records. Spray logs enforce pre-harvest interval compliance and require applicator sign-off.`,
  },
  {
    id: 'mod-packhouse',
    category: 'module',
    title: 'Pack House Module',
    keywords: [
      'pack house',
      'packing',
      'flower batches',
      'QC',
      'quality control',
      'grading',
      'boxes',
    ],
    content: `The **Pack House** module (/dashboard/pack-house) handles post-harvest processing: flower batch intake, QC inspections (stem length, bloom stage, head diameter, defects), grade assignment (PREMIUM/A/B/C), box packing, and label generation. Batches flow from intake → QC → grading → packing → cold storage.`,
  },
  {
    id: 'mod-coldroom',
    category: 'module',
    title: 'Cold Room Module',
    keywords: [
      'cold room',
      'cold storage',
      'temperature',
      'cooling',
      'pre-cooling',
    ],
    content: `The **Cold Room** module (/dashboard/cold-room) monitors cold storage zones. It tracks batch check-in/check-out events, real-time temperature via IoT sensors, and alerts when thresholds are breached. To add a new cold room, create a new zone with type "COLD_ROOM" in the Farm Zones module.`,
  },
  {
    id: 'mod-team',
    category: 'module',
    title: 'Team Management Module',
    keywords: ['team', 'users', 'employees', 'staff', 'roles', 'permissions'],
    content: `The **Team** module (/dashboard/team) manages user accounts, role assignments, and access control. Roles define permission sets (JSON arrays) controlling which modules and actions each user can access. System roles (Admin, Manager, Operator, Viewer) are pre-defined; custom roles can be created per tenant.`,
  },
  {
    id: 'mod-hr',
    category: 'module',
    title: 'HR & Training Module',
    keywords: [
      'HR',
      'human resources',
      'training',
      'appraisal',
      'KPI',
      'compliance training',
      'performance',
    ],
    content: `The **HR & Training** module (/dashboard/hr/training) manages employee training records, compliance training tracking (chemical handling, first aid, fire safety), performance appraisals (360° reviews with self/peer/supervisor scoring), KPI scoring linked to farm productivity, and a departmental training calendar.`,
  },
  {
    id: 'mod-inventory',
    category: 'module',
    title: 'Inventory Module',
    keywords: [
      'inventory',
      'flower inventory',
      'stock',
      'stems',
      'varieties',
      'grades',
    ],
    content: `The **Inventory** module (/dashboard/inventory) tracks flower inventory by variety and grade. It shows current stock levels, movement history, and links to pack house batches. Stock is updated automatically when boxes are packed or orders are dispatched.`,
  },
  {
    id: 'mod-stores',
    category: 'module',
    title: 'Stores Module',
    keywords: [
      'stores',
      'store items',
      'consumables',
      'chemicals',
      'fertilizer',
      'packaging',
      'SKU',
    ],
    content: `The **Stores** module (/dashboard/stores) manages non-flower inventory: chemicals, fertilizers, packaging materials, tools, and consumables. It tracks SKUs, stock levels per zone, reorder points, min/max stock thresholds, and movement history (IN/OUT/TRANSFER/ADJUSTMENT).`,
  },
  {
    id: 'mod-procurement',
    category: 'module',
    title: 'Procurement Module',
    keywords: [
      'procurement',
      'purchase orders',
      'PO',
      'vendors',
      'suppliers',
      'GRN',
      'RFQ',
      'buying',
    ],
    content: `The **Procurement** module (/dashboard/procurement) manages the full purchasing cycle: purchase requests → RFQs → vendor quotes → purchase orders → goods received notes (GRNs). It tracks vendor performance, price history, and integrates with Stores for automatic stock updates on receipt.`,
  },
  {
    id: 'mod-sales',
    category: 'module',
    title: 'Sales & CRM Module',
    keywords: [
      'sales',
      'CRM',
      'orders',
      'customers',
      'leads',
      'invoices',
      'auction',
      'revenue',
    ],
    content: `The **Sales & CRM** module (/dashboard/sales) manages customer relationships, order processing (spot orders, standing orders, auction lots), lead tracking, invoicing, and revenue analytics. It supports Dutch flower auction integration with lot preparation, clock number assignment, and result import.`,
  },
  {
    id: 'mod-logistics',
    category: 'module',
    title: 'Logistics Module',
    keywords: [
      'logistics',
      'delivery',
      'routes',
      'vehicles',
      'shipping',
      'transport',
      'dispatch',
    ],
    content: `The **Logistics** module (/dashboard/logistics) manages delivery routes, vehicle fleet, delivery stops, and dispatch tracking. Routes can be optimised and assigned to vehicles. Each stop tracks delivery status, proof of delivery, and customer sign-off.`,
  },
  {
    id: 'mod-compliance',
    category: 'module',
    title: 'Compliance Module',
    keywords: [
      'compliance',
      'certifications',
      'audit',
      'export docs',
      'phytosanitary',
      'regulations',
    ],
    content: `The **Compliance** module (/dashboard/compliance) tracks farm certifications (GlobalGAP, MPS, Fairtrade), manages export documentation (phytosanitary certificates, customs invoices, export permits), and provides compliance dashboards for spray log PHI adherence and certification expiry alerts.`,
  },
  {
    id: 'mod-financials',
    category: 'module',
    title: 'Financials Module',
    keywords: [
      'financials',
      'finance',
      'accounting',
      'budget',
      'journal',
      'expenses',
      'revenue',
      'P&L',
    ],
    content: `The **Financials** module (/dashboard/financials) provides accounting features: chart of accounts, financial journals, budgets vs actuals, cost centre tracking, tax rates, exchange rates, and P&L reporting. It integrates with Sales (revenue) and Procurement (expenses) for automated journal entries.`,
  },
  {
    id: 'mod-payroll',
    category: 'module',
    title: 'Payroll Module',
    keywords: [
      'payroll',
      'salary',
      'wages',
      'PAYE',
      'NHIF',
      'NSSF',
      'payslip',
      'M-Pesa',
    ],
    content: `The **Payroll** module (/dashboard/payroll) processes employee compensation: fixed salaries, hourly wages linked to labour logs, Kenya statutory deductions (PAYE, NHIF, NSSF), payslip PDF generation, email distribution, and M-Pesa B2C bulk disbursement. Payroll runs can be previewed before execution.`,
  },
  {
    id: 'mod-settings',
    category: 'module',
    title: 'Settings Module',
    keywords: [
      'settings',
      'configuration',
      'preferences',
      'tenant',
      'farm profile',
    ],
    content: `The **Settings** module (/dashboard/settings) manages tenant configuration: farm profile (name, location, GPS coordinates, logo), default currency, unit preferences (metric/imperial), user management, role configuration, and system-wide notification preferences.`,
  },
  {
    id: 'mod-telemetry',
    category: 'module',
    title: 'Telemetry & IoT Module',
    keywords: [
      'telemetry',
      'IoT',
      'sensors',
      'temperature',
      'humidity',
      'moisture',
      'devices',
    ],
    content: `The **Telemetry** module (/dashboard/telemetry) displays real-time data from IoT sensors deployed across farm zones. It supports temperature, humidity, and soil moisture sensors with MQTT integration. Automation rules can trigger alerts or actions when sensor readings breach configured thresholds.`,
  },
  {
    id: 'mod-auditlogs',
    category: 'module',
    title: 'Audit Logs Module',
    keywords: [
      'audit logs',
      'audit trail',
      'activity log',
      'history',
      'changes',
      'who changed',
    ],
    content: `The **Audit Logs** module (/dashboard/audit-logs) provides a complete timeline of all system actions: who did what, when, and what changed. Each entry records the actor, action type, entity type, entity ID, and before/after state snapshots. Filterable by user, action, entity type, and date range.`,
  },
];

// ─── How-To Guides ──────────────────────────────────────────────────
const howtos: KBArticle[] = [
  {
    id: 'howto-add-cold-room',
    category: 'howto',
    title: 'How to Add a New Cold Room',
    keywords: [
      'add cold room',
      'create cold room',
      'new cold room',
      'cold storage setup',
    ],
    content: `**How to add a new Cold Room:**
1. Navigate to **Farm Zones** → [/dashboard/zones](/dashboard/zones)
2. Click the **"+ Add Zone"** button in the top-right
3. In the Create Zone modal, set **Type** to "COLD_ROOM"
4. Enter a name (e.g. "Cold Room 3"), area in sqm, and temperature thresholds
5. Click **Save** — the cold room will appear in both the Zones list and the Cold Room module
6. Optionally assign IoT temperature sensors from **Telemetry** → [/dashboard/telemetry](/dashboard/telemetry)`,
  },
  {
    id: 'howto-create-po',
    category: 'howto',
    title: 'How to Create a Purchase Order',
    keywords: [
      'create purchase order',
      'new PO',
      'buy items',
      'order supplies',
    ],
    content: `**How to create a Purchase Order:**
1. Go to **Procurement** → [/dashboard/procurement](/dashboard/procurement)
2. Click the **"Purchase Orders"** tab
3. Click **"+ New PO"** button
4. Select a **vendor** from the dropdown (or create one first)
5. Add line items: select store item, quantity, and unit price
6. Review the total and click **Submit**
7. The PO will be tracked through statuses: DRAFT → APPROVED → ORDERED → RECEIVED`,
  },
  {
    id: 'howto-run-payroll',
    category: 'howto',
    title: 'How to Run Payroll',
    keywords: [
      'run payroll',
      'process salaries',
      'pay employees',
      'payroll run',
    ],
    content: `**How to run payroll:**
1. Navigate to **Payroll** → [/dashboard/payroll](/dashboard/payroll)
2. Click **"New Payroll Run"** button
3. Select the **pay period** (e.g. "2026-05")
4. The system auto-calculates: base pay (from labour logs for hourly staff), statutory deductions (PAYE, NHIF, NSSF), and net pay
5. **Review** the preview table carefully
6. Click **"Execute Run"** to finalise
7. Payslip PDFs are generated and can be emailed or downloaded
8. For M-Pesa disbursement, click **"Disburse via M-Pesa"** on a completed run`,
  },
  {
    id: 'howto-add-spray-log',
    category: 'howto',
    title: 'How to Record a Spray Application',
    keywords: [
      'spray log',
      'chemical application',
      'pesticide',
      'record spray',
      'PHI',
    ],
    content: `**How to record a spray application:**
1. Go to **Farm Operations** → [/dashboard/operations](/dashboard/operations)
2. Click the **"Spray Logs"** tab
3. Click **"+ New Spray Log"**
4. Select the **zone**, **chemical name**, **EPA registration number**
5. Enter **quantity**, **unit** (L/kg), and **PHI days** (pre-harvest interval)
6. The system auto-calculates the **harvest allowed date**
7. Click **Save** — the spray log feeds into compliance tracking`,
  },
  {
    id: 'howto-create-order',
    category: 'howto',
    title: 'How to Create a Sales Order',
    keywords: ['create order', 'new order', 'customer order', 'sales order'],
    content: `**How to create a sales order:**
1. Navigate to **Sales & CRM** → [/dashboard/sales](/dashboard/sales)
2. Click the **"Orders"** tab
3. Click **"+ New Order"**
4. Select the **customer** and set order type (Spot, Standing, or Auction)
5. Add line items with variety, grade, quantity, and price
6. Set shipment date and any notes
7. Click **Create** — the order flows through: DRAFT → CONFIRMED → PACKED → DISPATCHED`,
  },
  {
    id: 'howto-add-employee',
    category: 'howto',
    title: 'How to Add a New Employee/User',
    keywords: [
      'add employee',
      'new user',
      'create account',
      'invite user',
      'team member',
    ],
    content: `**How to add a new team member:**
1. Go to **Team** → [/dashboard/team](/dashboard/team)
2. Click **"+ Add Member"**
3. Enter email, first name, last name, and phone
4. Select a **Role** (Admin, Manager, Operator, Viewer, or custom)
5. Set a temporary password (user will be prompted to change on first login)
6. Click **Create** — the user can now log in and access modules per their role permissions`,
  },
  {
    id: 'howto-grn',
    category: 'howto',
    title: 'How to Receive Goods (GRN)',
    keywords: [
      'GRN',
      'goods received',
      'receive delivery',
      'goods received note',
      'stock receipt',
    ],
    content: `**How to process a Goods Received Note (GRN):**
1. Go to **Procurement** → [/dashboard/procurement](/dashboard/procurement)
2. Find the **Purchase Order** with status "ORDERED"
3. Click **"Receive Goods"** on the PO
4. Enter quantities actually received for each line item
5. Note any discrepancies or damaged goods
6. Click **Submit GRN** — stock levels in Stores update automatically
7. The PO status changes to RECEIVED once all items are accounted for`,
  },
  {
    id: 'howto-training',
    category: 'howto',
    title: 'How to Schedule Training',
    keywords: [
      'schedule training',
      'add training',
      'training course',
      'compliance training',
    ],
    content: `**How to schedule a training session:**
1. Navigate to **HR & Training** → [/dashboard/hr/training](/dashboard/hr/training)
2. Click the **"Calendar"** tab
3. Click on a date or use **"+ Schedule Training"**
4. Select the **course**, **department**, and **instructor**
5. Set date, time, and venue
6. Assign employees to attend
7. After the session, record **scores** and upload **certificates** in the Training Records tab`,
  },
  {
    id: 'howto-export-docs',
    category: 'howto',
    title: 'How to Generate Export Documents',
    keywords: [
      'export documents',
      'phytosanitary',
      'customs invoice',
      'export permit',
    ],
    content: `**How to generate export documents:**
1. Go to **Compliance** → [/dashboard/compliance](/dashboard/compliance)
2. Click the **"Export Docs"** tab
3. Click **"+ Generate Document"**
4. Select document type: Phytosanitary Certificate, Customs Invoice, or Export Permit
5. For Phyto Certs and Customs Invoices, select the **order** — data is auto-populated from spray logs and order manifests
6. For Export Permits, upload the document manually
7. Generated PDFs are stored and linked to the order for traceability`,
  },
];

// ─── Error Resolution Guides ────────────────────────────────────────
const errors: KBArticle[] = [
  {
    id: 'err-payroll-failed',
    category: 'error',
    title: 'Payroll Run Failed',
    keywords: [
      'payroll failed',
      'payroll error',
      'salary error',
      'payroll run failed',
    ],
    content: `**Payroll run failures** are usually caused by:
1. **Missing labour logs** — Hourly employees need labour log entries for the pay period. Check Operations → Labour Logs.
2. **Missing employee records** — Ensure all employees have active user accounts with valid roles.
3. **Invalid statutory rates** — PAYE/NHIF/NSSF brackets may need updating in Settings.
4. **Database timeout** — Large payroll runs (100+ employees) may timeout. Try splitting into departments.

**To diagnose:** Check the Audit Logs → [/dashboard/audit-logs](/dashboard/audit-logs) for entries with action "PAYROLL_RUN" and look at the error in the afterState field.`,
  },
  {
    id: 'err-grn-reconcile',
    category: 'error',
    title: 'GRN Reconciliation Issues',
    keywords: [
      'GRN error',
      'reconciliation failed',
      'stock mismatch',
      'goods received error',
    ],
    content: `**GRN reconciliation issues** commonly arise from:
1. **Quantity mismatch** — Received quantities don't match PO quantities. This is expected; just record actual quantities.
2. **Unknown SKU** — The store item doesn't exist yet. Create it in Stores → [/dashboard/stores](/dashboard/stores) first.
3. **Duplicate GRN** — A GRN was already created for this PO. Check existing GRNs in Procurement.
4. **Vendor not found** — The vendor record may have been archived. Check vendor list in Procurement.`,
  },
  {
    id: 'err-permission-denied',
    category: 'error',
    title: 'Permission Denied / Access Issues',
    keywords: [
      'permission denied',
      'access denied',
      'cannot access',
      'forbidden',
      'unauthorized',
      "can't see",
    ],
    content: `**Permission issues** are controlled by your user role. Each role has a permissions JSON array defining allowed modules and actions.

**Common fixes:**
1. Ask your **Admin** to check your role permissions in Team → [/dashboard/team](/dashboard/team)
2. Your role may lack the required permission string (e.g. "financials:read", "payroll:write")
3. If you recently changed roles, try **logging out and back in** to refresh your session token
4. Contact your tenant administrator to upgrade your role or create a custom role with the needed permissions`,
  },
  {
    id: 'err-login-failed',
    category: 'error',
    title: 'Login Failed',
    keywords: [
      'login failed',
      "can't login",
      'wrong password',
      'account locked',
      'login error',
    ],
    content: `**Login failures** can be caused by:
1. **Wrong credentials** — Double-check email and password. Passwords are case-sensitive.
2. **Account deactivated** — Your admin may have deactivated your account. Contact them.
3. **Token expired** — If you were logged in but got kicked out, your session expired. Simply log in again.
4. **Browser cache** — Try clearing cookies and cache, or use an incognito window.`,
  },
  {
    id: 'err-import-failed',
    category: 'error',
    title: 'Data Import Failed',
    keywords: [
      'import failed',
      'CSV error',
      'upload failed',
      'bulk import error',
    ],
    content: `**Import failures** are typically caused by:
1. **Wrong CSV format** — Ensure columns match expected headers (sku, name, category, quantity, unitCost)
2. **Duplicate SKUs** — Items with existing SKUs will be skipped. Check Stores for duplicates.
3. **File too large** — Max upload size is 5MB. Split large files into smaller batches.
4. **Invalid data types** — Quantities and prices must be numbers, not text with currency symbols.`,
  },
];

// ─── Glossary ───────────────────────────────────────────────────────
const glossary: KBArticle[] = [
  {
    id: 'gloss-phi',
    category: 'glossary',
    title: 'PHI (Pre-Harvest Interval)',
    keywords: ['PHI', 'pre-harvest interval', 'harvest wait'],
    content: `**PHI (Pre-Harvest Interval)** is the minimum number of days that must pass between a chemical spray application and when flowers can be harvested from that zone. It ensures chemical residue levels are safe. PHI is enforced automatically by the spray log system.`,
  },
  {
    id: 'gloss-grn',
    category: 'glossary',
    title: 'GRN (Goods Received Note)',
    keywords: ['GRN', 'goods received note'],
    content: `**GRN (Goods Received Note)** is a document confirming that goods ordered via a Purchase Order have been physically received. It records actual quantities received, any discrepancies, and triggers automatic stock level updates in the Stores module.`,
  },
  {
    id: 'gloss-qc',
    category: 'glossary',
    title: 'QC (Quality Control)',
    keywords: ['QC', 'quality control', 'inspection', 'grading'],
    content: `**QC (Quality Control)** is the inspection process in the Pack House where flower batches are evaluated on stem length, bloom stage, head diameter, and defects. Each batch receives a grade (PREMIUM, A, B, or C) which determines pricing and market destination.`,
  },
  {
    id: 'gloss-kpi',
    category: 'glossary',
    title: 'KPI (Key Performance Indicator)',
    keywords: ['KPI', 'key performance indicator', 'performance metric'],
    content: `**KPI (Key Performance Indicator)** is a measurable value used to evaluate employee or farm performance. In Flori-Core, KPIs include stems harvested per hour, wastage rate, order fulfilment rate, and cold room temperature compliance.`,
  },
  {
    id: 'gloss-crop-cycle',
    category: 'glossary',
    title: 'Crop Cycle',
    keywords: ['crop cycle', 'growing cycle', 'planting to harvest'],
    content: `**Crop Cycle** represents the full lifecycle of a crop from planting to harvest. It tracks variety, zone, planting date, projected harvest date, actual yield, and status (PLANNED → ACTIVE → HARVESTED → COMPLETED). Crop cycles link to scouting reports, spray logs, and harvest records.`,
  },
  {
    id: 'gloss-paye',
    category: 'glossary',
    title: 'PAYE (Pay As You Earn)',
    keywords: ['PAYE', 'pay as you earn', 'income tax', 'Kenya tax'],
    content: `**PAYE (Pay As You Earn)** is Kenya's income tax system where employers deduct tax from employee salaries based on graduated tax brackets. Flori-Core automatically calculates PAYE deductions during payroll runs using current KRA brackets.`,
  },
];

// ─── Combined Index ─────────────────────────────────────────────────
const ALL_ARTICLES: KBArticle[] = [
  ...modules,
  ...howtos,
  ...errors,
  ...glossary,
];

/**
 * Search the knowledge base using keyword matching.
 * Returns the top `limit` matching articles ranked by relevance score.
 */
export function searchKnowledgeBase(
  query: string,
  limit: number = 5,
): KBArticle[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  const scored = ALL_ARTICLES.map((article) => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    // Exact title match (highest weight)
    if (titleLower.includes(queryLower)) score += 50;

    // Keyword matches
    for (const kw of article.keywords) {
      const kwLower = kw.toLowerCase();
      if (queryLower.includes(kwLower)) score += 20;
      if (kwLower.includes(queryLower)) score += 15;
    }

    // Word-level matching
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 8;
      for (const kw of article.keywords) {
        if (kw.toLowerCase().includes(word)) score += 5;
      }
      if (contentLower.includes(word)) score += 2;
    }

    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

/**
 * Get all module explainer articles.
 */
export function getAllModules(): KBArticle[] {
  return modules;
}

/**
 * Get a module by ID or keyword.
 */
export function getModuleByKeyword(keyword: string): KBArticle | undefined {
  const kw = keyword.toLowerCase();
  return modules.find(
    (m) =>
      m.keywords.some((k) => k.toLowerCase().includes(kw)) ||
      m.title.toLowerCase().includes(kw),
  );
}
