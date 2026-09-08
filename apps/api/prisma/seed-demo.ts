/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Demo seed — populates a single fully-featured tenant for demonstrations.
 *
 *   pnpm --filter @flori/api demo:seed
 *
 * WARNING: this TRUNCATES every table except `roles` and `_prisma_migrations`
 * before seeding, so it is repeatable. Never point it at a database holding
 * real customer data.
 *
 * Companion: `prisma/demo-refresh.ts` rolls all timestamps forward nightly so
 * the demo never looks stale.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLES } from '@flori/shared';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any) as any;

// Every demo user shares this password. Printed at the end of the run.
export const DEMO_PASSWORD = 'FloriCore!Demo2026';

const TENANT_SLUG = 'waridi';
const MONTHS_OF_HISTORY = 12;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const uid = () => randomUUID();
const DAY = 86_400_000;
const now = new Date();

/** Deterministic PRNG so re-runs produce the same demo. */
let seed = 1337;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const float = (min: number, max: number, dp = 2) =>
  Number((rnd() * (max - min) + min).toFixed(dp));
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const chance = (p: number) => rnd() < p;

function money(n: number) {
  return Number(n.toFixed(2));
}

async function insert(model: string, rows: any[]) {
  if (!rows.length) return rows;
  // chunked to stay well inside Postgres parameter limits
  for (let i = 0; i < rows.length; i += 500) {
    await prisma[model].createMany({ data: rows.slice(i, i + 500) });
  }
  console.log(`  ${model.padEnd(24)} ${rows.length}`);
  return rows;
}

async function resetDatabase() {
  const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `select tablename from pg_tables where schemaname = 'public'`,
  );
  // `roles` cannot be preserved here: TRUNCATE ... CASCADE also clears every
  // table holding a foreign key into a truncated one, and roles.tenantId
  // references tenants. The roles are therefore re-created below.
  const keep = new Set(['_prisma_migrations']);
  const targets = tables
    .map((t) => `"${t.tablename}"`)
    .filter((t) => !keep.has(t.replace(/"/g, '')));

  console.log(`Truncating ${targets.length} tables...`);
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${targets.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

// ---------------------------------------------------------------------------
// reference data
// ---------------------------------------------------------------------------
const ROSE_VARIETIES = [
  { name: 'Red Naomi', len: 70, grade: 'Premium', cost: 0.14 },
  { name: 'Athena', len: 60, grade: 'Premium', cost: 0.12 },
  { name: 'Freedom', len: 60, grade: 'Standard', cost: 0.1 },
  { name: 'Explorer', len: 50, grade: 'Standard', cost: 0.09 },
  { name: 'Madam Red', len: 60, grade: 'Premium', cost: 0.13 },
  { name: 'Mondial', len: 70, grade: 'Premium', cost: 0.15 },
  { name: 'Suncity', len: 50, grade: 'Standard', cost: 0.08 },
  { name: 'Rhodos', len: 60, grade: 'Standard', cost: 0.11 },
];

const FIRST_NAMES = ['Wanjiku','Otieno','Kamau','Achieng','Mwangi','Njeri','Kipchoge','Amina','Barasa','Chebet','Mutiso','Nyambura','Odhiambo','Wafula','Zawadi','Kilonzo','Auma','Kariuki','Makena','Simiyu','Wairimu','Onyango','Cherono','Mumbi','Gitau','Adhiambo','Rotich','Naliaka','Kibet','Waithera'];
const LAST_NAMES = ['Kariuki','Ochieng','Mwende','Kiptoo','Wanjala','Muthoni','Omondi','Chelimo','Njoroge','Atieno','Kimani','Barasa','Wekesa','Nekesa','Maina','Owino','Langat','Nduta','Mutua','Akinyi'];

const fullName = () => ({ firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) });

// ---------------------------------------------------------------------------
async function main() {
  console.log('\nFlori-Core demo seed');
  console.log('====================\n');
  await resetDatabase();
  console.log('\nSeeding...\n');

  // ---- tenant --------------------------------------------------------------
  const tenantId = uid();
  await prisma.tenant.create({
    data: {
      id: tenantId,
      name: 'Waridi Flowers Ltd',
      slug: TENANT_SLUG,
      status: 'ACTIVE',
      unitPreference: 'METRIC',
      baseCurrency: 'KES',
      settings: { timezone: 'Africa/Nairobi', demo: true },
      aiTokenBudget: 1_000_000,
      aiTokensUsed: 184_320,
    },
  });
  console.log(`  tenant                   Waridi Flowers Ltd (${TENANT_SLUG})`);

  await prisma.farmProfile.create({
    data: {
      tenantId,
      name: 'Waridi Flowers Ltd',
      location: 'Naivasha, Nakuru County, Kenya',
      gpsCoordinates: '-0.7167,36.4333',
      certifications: ['GLOBAL_GAP', 'FAIRTRADE', 'KFC_SILVER', 'MPS'],
      contactEmail: 'operations@waridi.demo',
      contactPhone: '+254 700 100 200',
      defaultCurrency: 'KES',
    },
  });

  // ---- zones ---------------------------------------------------------------
  const zones: any[] = [];
  for (let i = 1; i <= 8; i++) {
    zones.push({
      id: uid(),
      tenantId,
      name: `Greenhouse GH-${String(i).padStart(2, '0')}`,
      type: 'GREENHOUSE',
      areaSqm: float(4000, 12000, 0),
      cropVarieties: [ROSE_VARIETIES[(i - 1) % ROSE_VARIETIES.length].name],
      plantCount: int(28000, 76000),
      minTemp: 14, maxTemp: 30, minHumidity: 55, maxHumidity: 85,
      lastWatered: daysAgo(rnd()),
    });
  }
  zones.push(
    { id: uid(), tenantId, name: 'Cold Room A', type: 'COLD_ROOM', areaSqm: 420, cropVarieties: [], minTemp: 2, maxTemp: 8, minHumidity: 80, maxHumidity: 95 },
    { id: uid(), tenantId, name: 'Cold Room B', type: 'COLD_ROOM', areaSqm: 380, cropVarieties: [], minTemp: 2, maxTemp: 8, minHumidity: 80, maxHumidity: 95 },
    { id: uid(), tenantId, name: 'Pack House', type: 'PACKING_AREA', areaSqm: 1600, cropVarieties: [] },
    { id: uid(), tenantId, name: 'Central Store', type: 'STORE', areaSqm: 900, cropVarieties: [] },
    { id: uid(), tenantId, name: 'Chemical Warehouse', type: 'WAREHOUSE', areaSqm: 350, cropVarieties: [] },
    { id: uid(), tenantId, name: 'Administration Block', type: 'OFFICE', areaSqm: 480, cropVarieties: [] },
  );
  await insert('zone', zones);
  const greenhouses = zones.filter((z) => z.type === 'GREENHOUSE');
  const coldRooms = zones.filter((z) => z.type === 'COLD_ROOM');
  const storeZone = zones.find((z) => z.type === 'STORE');

  // ---- varieties & products ------------------------------------------------
  const varieties = ROSE_VARIETIES.map((v) => ({
    id: uid(), tenantId, name: v.name,
    targetStemLength: v.len,
    targetStemCountPerSqm: float(120, 220, 0),
    bloomTime: int(70, 110),
    marketGrade: v.grade,
    defaultCostPerStem: v.cost,
  }));
  await insert('variety', varieties);

  const products = varieties.flatMap((v, i) =>
    [40, 50, 60, 70].map((len) => ({
      id: uid(), tenantId,
      name: `${v.name} ${len}cm`,
      sku: `WRD-${String(i + 1).padStart(2, '0')}-${len}`,
      stock: int(2000, 40000),
      unitPrice: money(0.28 + len * 0.006 + rnd() * 0.1),
      currency: 'EUR',
    })),
  );
  await insert('product', products);


  // ---- users ---------------------------------------------------------------
  // One password hash reused for every account (they all share DEMO_PASSWORD).
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ROLE_DESCRIPTIONS: Record<string, string> = {
    gold_admin: 'Full access to every module and tenant setting.',
    field_supervisor: 'Production, crop cycles, spraying and field labour.',
    qc_lead: 'Pack house grading, QC logs and finished-goods inventory.',
    accountant: 'Ledger, invoicing, budgets and payroll reporting.',
    hr_manager: 'Employees, attendance, leave, training and appraisals.',
    driver: 'Delivery routes and proof of delivery capture.',
    store_manager: 'Stores, stock movements and procurement.',
    sales_agent: 'CRM, leads and order management.',
  };
  const systemRoles = DEFAULT_ROLES.map((r) => ({
    id: uid(), name: r.name, permissions: r.permissions as any,
    description: ROLE_DESCRIPTIONS[r.name] ?? null,
    isSystem: true, tenantId: null,
  }));
  await insert('role', systemRoles);
  const roleByName: Record<string, any> = Object.fromEntries(
    systemRoles.map((r: any) => [r.name, r]),
  );

  const USER_SPECS = [
    { role: 'gold_admin',       email: 'admin@waridi.demo',      firstName: 'Grace',   lastName: 'Wanjiru',  title: 'Managing Director' },
    { role: 'field_supervisor', email: 'supervisor@waridi.demo', firstName: 'Peter',   lastName: 'Kimani',   title: 'Head of Production' },
    { role: 'qc_lead',          email: 'qc@waridi.demo',         firstName: 'Mary',    lastName: 'Atieno',   title: 'QC Lead' },
    { role: 'accountant',       email: 'accountant@waridi.demo', firstName: 'Samuel',  lastName: 'Mwangi',   title: 'Financial Controller' },
    { role: 'hr_manager',       email: 'hr@waridi.demo',         firstName: 'Esther',  lastName: 'Njoroge',  title: 'HR Manager' },
    { role: 'driver',           email: 'driver@waridi.demo',     firstName: 'Joseph',  lastName: 'Otieno',   title: 'Lead Driver' },
    { role: 'store_manager',    email: 'stores@waridi.demo',     firstName: 'Daniel',  lastName: 'Kiptoo',   title: 'Stores Manager' },
    { role: 'sales_agent',      email: 'sales@waridi.demo',      firstName: 'Lucy',    lastName: 'Chebet',   title: 'Export Sales Lead' },
  ];

  const users = USER_SPECS.map((u) => ({
    id: uid(), tenantId, email: u.email, passwordHash,
    roleId: roleByName[u.role].id,
    firstName: u.firstName, lastName: u.lastName,
    phone: `+2547${int(10, 99)}${int(100000, 999999)}`,
    isActive: true, mustChangePassword: false,
    lastLoginAt: daysAgo(rnd() * 3),
  }));
  await insert('user', users);
  const userByRole: Record<string, any> = Object.fromEntries(
    USER_SPECS.map((s, i) => [s.role, users[i]]),
  );
  const admin = userByRole.gold_admin;
  const supervisor = userByRole.field_supervisor;
  const qcLead = userByRole.qc_lead;
  const driverUser = userByRole.driver;
  const storeManager = userByRole.store_manager;
  const salesAgent = userByRole.sales_agent;

  // ---- employees -----------------------------------------------------------
  const DEPARTMENTS = ['Production', 'Pack House', 'Logistics', 'Administration', 'Sales', 'Quality'];
  const JOB_TITLES: Record<string, string[]> = {
    Production: ['Greenhouse Attendant', 'Irrigation Technician', 'Scout', 'Sprayer Operator', 'Team Leader'],
    'Pack House': ['Grader', 'Bunching Operator', 'Packer', 'Cold Room Attendant'],
    Logistics: ['Driver', 'Loader', 'Dispatch Clerk'],
    Administration: ['Accounts Assistant', 'HR Assistant', 'Receptionist', 'Storekeeper'],
    Sales: ['Sales Executive', 'Export Documentation Officer'],
    Quality: ['QC Inspector', 'Compliance Officer'],
  };

  const employees: any[] = [];
  // First 8 employees are linked to the login users.
  USER_SPECS.forEach((spec, i) => {
    employees.push({
      id: uid(), tenantId, userId: users[i].id,
      employeeNumber: `WRD-${String(i + 1).padStart(4, '0')}`,
      firstName: spec.firstName, lastName: spec.lastName,
      email: spec.email, phone: users[i].phone,
      nationalId: `${int(20000000, 39999999)}`,
      jobTitle: spec.title,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      employmentType: 'PERMANENT', status: 'ACTIVE',
      joinedAt: daysAgo(int(700, 2400)),
      basicSalary: money(int(90, 320) * 1000),
      bankName: pick(['Equity Bank', 'KCB', 'Co-operative Bank', 'NCBA']),
      accountNumber: `${int(1000000000, 9999999999)}`,
      nssfNumber: `NSSF${int(100000, 999999)}`,
      nhifNumber: `NHIF${int(100000, 999999)}`,
      taxPin: `A${int(100000000, 999999999)}X`,
      biometricId: `BIO-${String(i + 1).padStart(4, '0')}`,
    });
  });
  for (let i = 8; i < 68; i++) {
    const dept = pick(DEPARTMENTS);
    const n = fullName();
    const type = chance(0.55) ? 'PERMANENT' : chance(0.6) ? 'CONTRACT' : 'CASUAL';
    employees.push({
      id: uid(), tenantId,
      employeeNumber: `WRD-${String(i + 1).padStart(4, '0')}`,
      firstName: n.firstName, lastName: n.lastName,
      email: `${n.firstName.toLowerCase()}.${n.lastName.toLowerCase()}${i}@waridi.demo`,
      phone: `+2547${int(10, 99)}${int(100000, 999999)}`,
      nationalId: `${int(20000000, 39999999)}`,
      jobTitle: pick(JOB_TITLES[dept]), department: dept,
      employmentType: type,
      status: chance(0.93) ? 'ACTIVE' : pick(['ON_LEAVE', 'SUSPENDED', 'INACTIVE']),
      joinedAt: daysAgo(int(30, 2600)),
      basicSalary: money(type === 'CASUAL' ? int(18, 32) * 1000 : int(35, 180) * 1000),
      bankName: pick(['Equity Bank', 'KCB', 'Co-operative Bank', 'NCBA', 'Absa']),
      accountNumber: `${int(1000000000, 9999999999)}`,
      nssfNumber: `NSSF${int(100000, 999999)}`,
      nhifNumber: `NHIF${int(100000, 999999)}`,
      taxPin: `A${int(100000000, 999999999)}X`,
      biometricId: `BIO-${String(i + 1).padStart(4, '0')}`,
    });
  }
  await insert('employee', employees);
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  await insert('emergencyContact', employees.map((e) => {
    const n = fullName();
    return {
      id: uid(), employeeId: e.id,
      name: `${n.firstName} ${n.lastName}`,
      relationship: pick(['Spouse', 'Parent', 'Sibling', 'Child', 'Guardian']),
      phone: `+2547${int(10, 99)}${int(100000, 999999)}`,
    };
  }));

  await insert('employeeDocument', employees.flatMap((e) =>
    ['NATIONAL_ID_SCAN', 'NSSF_CARD', 'NHIF_CARD', 'KRA_PIN_CERT']
      .filter(() => chance(0.75))
      .map((t) => ({
        id: uid(), employeeId: e.id, type: t,
        fileUrl: `/uploads/hr/${e.employeeNumber}-${t.toLowerCase()}.pdf`,
        expiryDate: t === 'NATIONAL_ID_SCAN' ? null : daysAgo(-int(60, 900)),
      })),
  ));

  await insert('employmentHistory', employees.filter(() => chance(0.45)).map((e) => ({
    id: uid(), employeeId: e.id,
    companyName: pick(['Oserian Farms', 'Karen Roses', 'Finlays Horticulture', 'Nini Farm', 'Panda Flowers']),
    jobTitle: pick(['Greenhouse Attendant', 'Packer', 'Supervisor', 'Driver', 'Clerk']),
    startDate: daysAgo(int(2600, 4400)), endDate: daysAgo(int(700, 2500)),
  })));

  // ---- shifts & attendance -------------------------------------------------
  const shifts = [
    { id: uid(), tenantId, name: 'Morning', startTime: '06:00', endTime: '14:00' },
    { id: uid(), tenantId, name: 'Afternoon', startTime: '14:00', endTime: '22:00' },
    { id: uid(), tenantId, name: 'Night', startTime: '22:00', endTime: '06:00' },
  ];
  await insert('shift', shifts);

  const shiftAssignments: any[] = [];
  const attendance: any[] = [];
  for (let d = 0; d < 90; d++) {
    const date = daysAgo(d);
    if (date.getDay() === 0) continue; // no Sunday shift
    for (const e of activeEmployees) {
      if (!chance(0.9)) continue;
      const shift = pick(shifts);
      shiftAssignments.push({ id: uid(), tenantId, employeeId: e.id, shiftId: shift.id, date });
      const inAt = new Date(date); inAt.setHours(Number(shift.startTime.slice(0, 2)), int(0, 25));
      const outAt = new Date(inAt.getTime() + (8 * 3600_000) + int(-20, 45) * 60_000);
      attendance.push(
        { id: uid(), tenantId, employeeId: e.id, type: 'CHECK_IN', timestamp: inAt, source: pick(['BIOMETRIC', 'MOBILE', 'MANUAL']) },
        { id: uid(), tenantId, employeeId: e.id, type: 'CHECK_OUT', timestamp: outAt, source: pick(['BIOMETRIC', 'MOBILE']) },
      );
    }
  }
  await insert('shiftAssignment', shiftAssignments);
  await insert('attendanceLog', attendance);

  await insert('leaveRequest', activeEmployees.filter(() => chance(0.4)).map((e) => {
    const start = daysAgo(int(-40, 300));
    const days = int(1, 14);
    const status = pick(['PENDING', 'APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED']);
    return {
      id: uid(), tenantId, employeeId: e.id,
      type: pick(['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID']),
      startDate: start, endDate: new Date(start.getTime() + days * DAY),
      status, reason: pick(['Family commitment', 'Medical appointment', 'Annual rest', 'Personal matter']),
      approvedById: status === 'APPROVED' ? userByRole.hr_manager.id : null,
    };
  }));

  // ---- crop cycles ---------------------------------------------------------
  const cropCycles: any[] = [];
  for (let i = 0; i < 26; i++) {
    const start = daysAgo(int(10, MONTHS_OF_HISTORY * 30));
    const variety = pick(varieties);
    const bloom = 90;
    const projected = new Date(start.getTime() + bloom * DAY);
    const done = projected < now;
    cropCycles.push({
      id: uid(), tenantId, varietyId: variety.id, zoneId: pick(greenhouses).id,
      startDate: start,
      projectedHarvestDate: projected,
      actualHarvestDate: done ? new Date(projected.getTime() + int(-6, 9) * DAY) : null,
      actualHarvestYield: done ? int(45000, 240000) : null,
      status: done ? 'COMPLETED' : projected < new Date(now.getTime() + 20 * DAY) ? 'HARVESTING' : 'GROWING',
    });
  }
  cropCycles.push(
    ...Array.from({ length: 4 }, () => {
      const start = daysAgo(-int(5, 60));
      return {
        id: uid(), tenantId, varietyId: pick(varieties).id, zoneId: pick(greenhouses).id,
        startDate: start, projectedHarvestDate: new Date(start.getTime() + 90 * DAY),
        status: 'PLANNED',
      };
    }),
  );
  await insert('cropCycle', cropCycles);
  const activeCycles = cropCycles.filter((c) => c.status !== 'PLANNED');

  await insert('plantingRecord', cropCycles.filter((c) => c.status !== 'PLANNED').map((c) => ({
    id: uid(), tenantId, cropCycleId: c.id, date: c.startDate,
    supplier: pick(['Schreurs East Africa', 'De Ruiter', 'Dümmen Orange', 'Kordes Roses']),
    lotNumber: `LOT-${int(10000, 99999)}`,
    spacing: pick(['30x30cm', '35x35cm', '40x30cm']),
    density: float(6, 9, 1), totalPlants: int(22000, 68000),
    notes: 'Cuttings received in good condition; rooted in coco peat.',
  })));

  await insert('cropBudget', cropCycles.filter((c) => c.status !== 'PLANNED').map((c) => {
    const labor = money(int(180, 520) * 1000);
    const input = money(int(220, 640) * 1000);
    const util = money(int(60, 180) * 1000);
    return {
      id: uid(), tenantId, cropCycleId: c.id,
      laborWorkersReq: int(8, 26), estimatedLaborCost: labor,
      estimatedInputCost: input, estimatedUtilitiesCost: util,
      totalBudget: money(labor + input + util),
    };
  }));

  // harvest records — the backbone of production charts
  const harvests: any[] = [];
  for (const c of activeCycles) {
    if (!c.actualHarvestDate && c.status !== 'HARVESTING') continue;
    const startPick = c.actualHarvestDate ?? daysAgo(14);
    for (let h = 0; h < int(6, 22); h++) {
      const date = new Date(startPick.getTime() + h * 2 * DAY);
      if (date > now) break;
      const stems = int(1800, 14000);
      harvests.push({
        id: uid(), tenantId, cropCycleId: c.id, date,
        quantityStems: stems,
        weightKg: money(stems * 0.032),
        rejectedStems: Math.floor(stems * float(0.02, 0.09, 3)),
        supervisorId: supervisor.id,
        notes: chance(0.25) ? pick(['Good stem length across the block.', 'Slight botrytis pressure on outer rows.', 'Cool morning, excellent bud stage.']) : null,
      });
    }
  }
  await insert('harvestRecord', harvests);

  await insert('cropSchedule', activeCycles.flatMap((c) =>
    Array.from({ length: int(3, 7) }, () => {
      const d = new Date(c.startDate.getTime() + int(5, 100) * DAY);
      return {
        id: uid(), tenantId, cropCycleId: c.id,
        type: pick(['SPRAY', 'FERTILIZER', 'PRUNING', 'OTHER']),
        taskName: pick(['Preventive fungicide round', 'NPK fertigation', 'Bending and pruning', 'Leaf sampling', 'Bud thinning']),
        scheduledDate: d,
        completedAt: d < now && chance(0.85) ? new Date(d.getTime() + int(0, 2) * DAY) : null,
      };
    }),
  ));

  await insert('cropPerformanceLog', activeCycles.flatMap((c) =>
    Array.from({ length: int(2, 6) }, () => ({
      id: uid(), tenantId, cropCycleId: c.id,
      date: new Date(c.startDate.getTime() + int(10, 85) * DAY),
      growthRate: pick(['Slow', 'Normal', 'Vigorous']),
      healthScore: int(62, 98), budFormation: chance(0.7),
      observations: pick(['Uniform canopy development.', 'Minor chlorosis on lower leaves.', 'Strong bud set across the bed.']),
      recordedById: supervisor.id,
    })),
  ));

  await insert('preHarvestQualityLog', activeCycles.flatMap((c) =>
    Array.from({ length: int(1, 4) }, () => ({
      id: uid(), tenantId, cropCycleId: c.id,
      date: new Date(c.startDate.getTime() + int(70, 95) * DAY),
      budStage: pick(['Tight', 'Cracking', 'Open']),
      budSizeMm: float(28, 52, 1), stemLengthCm: float(45, 80, 1),
      stemStrength: pick(['Weak', 'Firm', 'Very firm']),
      colorDev: pick(['Pale', 'Developing', 'Full colour']),
      inspectorId: qcLead.id,
    })),
  ));

  // ---- field operations ----------------------------------------------------
  const CHEMICALS = [
    { name: 'Rovral WG', epa: 'EPA-264-482', phi: 3 },
    { name: 'Switch 62.5WG', epa: 'EPA-100-953', phi: 1 },
    { name: 'Abamectin 1.8EC', epa: 'EPA-100-898', phi: 7 },
    { name: 'Confidor 200SL', epa: 'EPA-264-757', phi: 5 },
    { name: 'Ortiva Top', epa: 'EPA-100-1310', phi: 2 },
  ];
  await insert('sprayLog', Array.from({ length: 220 }, () => {
    const chem = pick(CHEMICALS);
    const appliedAt = daysAgo(int(0, MONTHS_OF_HISTORY * 30));
    return {
      id: uid(), tenantId, zoneId: pick(greenhouses).id,
      chemicalName: chem.name, epaRegNo: chem.epa,
      quantity: float(0.4, 4.5), unit: pick(['L', 'kg']),
      phiDays: chem.phi, applicatorId: supervisor.id,
      appliedAt, harvestAllowedAt: new Date(appliedAt.getTime() + chem.phi * DAY),
      notes: chance(0.2) ? 'Applied at first light, wind under 5 km/h.' : null,
    };
  }));

  await insert('irrigationLog', Array.from({ length: 400 }, () => ({
    id: uid(), tenantId, zoneId: pick(greenhouses).id,
    date: daysAgo(int(0, MONTHS_OF_HISTORY * 30)),
    durationMinutes: int(20, 130), volumeLiters: float(1800, 14000, 0),
    method: pick(['DRIP', 'SPRINKLER', 'FERTIGATION']),
    fertigationUsed: chance(0.55),
    fertilizerType: pick(['NPK 17-17-17', 'Calcium Nitrate', 'MKP', 'Magnesium Sulphate']),
    npkLevels: pick(['17-17-17', '19-19-19', '12-11-18']),
    applicationRate: float(0.8, 3.4),
    performedById: supervisor.id,
  })));

  await insert('scoutingReport', Array.from({ length: 180 }, () => ({
    id: uid(), tenantId, zoneId: pick(greenhouses).id,
    cropCycleId: chance(0.7) ? pick(activeCycles).id : null,
    date: daysAgo(int(0, MONTHS_OF_HISTORY * 30)),
    pestDiseaseName: pick(['Downy mildew', 'Botrytis', 'Spider mite', 'Thrips', 'Powdery mildew', 'Aphids']),
    severity: pick(['LOW', 'LOW', 'MEDIUM', 'HIGH']),
    observations: pick(['Isolated hotspots on block edge.', 'Population rising on young flush.', 'Sticky traps show increased catch.', 'Leaf spotting on lower canopy.']),
    actionTaken: pick(['Scheduled targeted spray', 'Increased ventilation', 'Removed affected material', 'Monitoring']),
    inspectorId: supervisor.id,
  })));

  await insert('soilTest', Array.from({ length: 40 }, () => ({
    id: uid(), tenantId, zoneId: pick(greenhouses).id,
    testDate: daysAgo(int(0, MONTHS_OF_HISTORY * 30)),
    pHLevel: float(5.4, 7.2, 1), ecLevel: float(0.8, 2.6, 2),
    nitrogen: float(15, 65, 1), phosphorus: float(8, 40, 1), potassium: float(90, 320, 1),
    soilType: pick(['Volcanic loam', 'Sandy loam', 'Clay loam']),
    structure: pick(['Friable', 'Compacted', 'Well aggregated']),
  })));

  await insert('landPrepLog', Array.from({ length: 60 }, () => ({
    id: uid(), tenantId, zoneId: pick(greenhouses).id,
    activityType: pick(['Bed forming', 'Sterilisation', 'Compost incorporation', 'Drip line renewal', 'Ploughing']),
    date: daysAgo(int(30, MONTHS_OF_HISTORY * 30)),
    details: 'Completed to specification and signed off by the block supervisor.',
    amendmentsUsed: pick(['Farmyard manure', 'Gypsum', 'Lime', 'Coco peat']),
    performedById: supervisor.id,
  })));

  await insert('labourLog', Array.from({ length: 600 }, () => ({
    id: uid(), tenantId, userId: supervisor.id, zoneId: pick(greenhouses).id,
    taskType: pick(['HARVESTING', 'PRUNING', 'SPRAYING', 'WEEDING', 'BENDING', 'GRADING']),
    hours: float(3, 9, 1),
    stemsCut: int(400, 2600),
    timestamp: daysAgo(int(0, 180)),
  })));

  // ---- IoT devices & telemetry --------------------------------------------
  const devices: any[] = [];
  greenhouses.forEach((z, i) => {
    devices.push(
      { id: uid(), tenantId, zoneId: z.id, type: 'SOIL_MOISTURE', macAddress: `AA:BB:CC:00:${String(i).padStart(2, '0')}:01`, mqttTopic: `farm/${tenantId}/zone/${z.id}/sensor`, status: 'ACTIVE' },
      { id: uid(), tenantId, zoneId: z.id, type: 'TEMP_HUMIDITY', macAddress: `AA:BB:CC:00:${String(i).padStart(2, '0')}:02`, mqttTopic: `farm/${tenantId}/zone/${z.id}/sensor`, status: chance(0.9) ? 'ACTIVE' : 'OFFLINE' },
    );
  });
  coldRooms.forEach((z, i) => {
    devices.push({ id: uid(), tenantId, zoneId: z.id, type: 'COLD_ROOM_TEMP', macAddress: `AA:BB:CC:11:${String(i).padStart(2, '0')}:01`, mqttTopic: `farm/${tenantId}/zone/${z.id}/sensor`, status: 'ACTIVE' });
  });
  await insert('ioTDevice', devices);

  // Dense for the last 30 days (the dashboards query a 24h window), sparse before.
  const readings: any[] = [];
  const sensorProfile: Record<string, { type: string; unit: string; base: number; swing: number }[]> = {
    SOIL_MOISTURE: [{ type: 'MOISTURE', unit: '%', base: 42, swing: 14 }],
    TEMP_HUMIDITY: [
      { type: 'TEMPERATURE', unit: '°C', base: 22, swing: 7 },
      { type: 'HUMIDITY', unit: '%', base: 72, swing: 16 },
    ],
    COLD_ROOM_TEMP: [{ type: 'TEMPERATURE', unit: '°C', base: 4.5, swing: 1.8 }],
  };
  for (const d of devices) {
    if (d.status === 'OFFLINE') continue;
    for (const s of sensorProfile[d.type]) {
      for (let h = 0; h < 30 * 24; h++) {
        const ts = new Date(now.getTime() - h * 3600_000);
        const diurnal = Math.sin((ts.getHours() / 24) * Math.PI * 2);
        readings.push({
          id: uid(), tenantId, deviceId: d.id,
          value: money(s.base + diurnal * s.swing * 0.5 + (rnd() - 0.5) * s.swing * 0.35),
          unit: s.unit, sensorType: s.type, timestamp: ts,
        });
      }
      for (let h = 30 * 24; h < MONTHS_OF_HISTORY * 30 * 24; h += 6) {
        const ts = new Date(now.getTime() - h * 3600_000);
        const diurnal = Math.sin((ts.getHours() / 24) * Math.PI * 2);
        readings.push({
          id: uid(), tenantId, deviceId: d.id,
          value: money(s.base + diurnal * s.swing * 0.5 + (rnd() - 0.5) * s.swing * 0.35),
          unit: s.unit, sensorType: s.type, timestamp: ts,
        });
      }
    }
  }
  await insert('telemetryReading', readings);

  await insert('automationRule', [
    { id: uid(), tenantId, name: 'Cold room over-temperature', sensorType: 'TEMPERATURE', threshold: 8, operator: 'GT', action: 'ALERT_AND_SMS', isActive: true },
    { id: uid(), tenantId, name: 'Greenhouse heat stress', sensorType: 'TEMPERATURE', threshold: 32, operator: 'GT', action: 'ALERT', isActive: true },
    { id: uid(), tenantId, name: 'Low soil moisture', sensorType: 'MOISTURE', threshold: 28, operator: 'LT', action: 'TRIGGER_IRRIGATION', isActive: true },
    { id: uid(), tenantId, name: 'Humidity spike (botrytis risk)', sensorType: 'HUMIDITY', threshold: 88, operator: 'GT', action: 'ALERT', isActive: false },
  ]);

  await insert('alert', Array.from({ length: 70 }, () => {
    const dev = pick(devices);
    const sev = pick(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL']);
    return {
      id: uid(), tenantId, deviceId: dev.id, zoneId: dev.zoneId,
      type: pick(['THRESHOLD_BREACH', 'DEVICE_OFFLINE', 'PHI_VIOLATION']),
      severity: sev,
      message: pick([
        'Cold Room A temperature exceeded 8°C for 12 minutes.',
        'Soil moisture in GH-03 dropped below 28%.',
        'Humidity in GH-06 above 88% — botrytis risk.',
        'Sensor has not reported in 45 minutes.',
        'Harvest attempted inside pre-harvest interval.',
      ]),
      status: chance(0.55) ? 'RESOLVED' : chance(0.5) ? 'ACKNOWLEDGED' : 'OPEN',
      createdAt: daysAgo(int(0, 120)),
    };
  }));

  // ---- pack house: batches, QC, boxes --------------------------------------
  const batches: any[] = [];
  harvests.slice(0, 260).forEach((h, i) => {
    const cycle = cropCycles.find((c) => c.id === h.cropCycleId);
    batches.push({
      id: uid(), tenantId, cropCycleId: h.cropCycleId, varietyId: cycle.varietyId,
      batchNumber: `BATCH-${String(i + 1).padStart(5, '0')}`,
      quantityIntake: h.quantityStems,
      status: pick(['GRADED', 'GRADED', 'GRADED', 'IN_COLD_STORAGE', 'SHIPPED', 'QC_PENDING']),
      createdAt: h.date,
    });
  });
  await insert('flowerBatch', batches);

  const GRADES = ['A', 'A', 'A', 'B', 'B', 'C', 'REJECT'];
  await insert('qCLog', batches.filter((b) => b.status !== 'QC_PENDING').map((b) => ({
    id: uid(), tenantId, batchId: b.id, inspectorId: qcLead.id,
    stemLength: float(40, 80, 1), bloomStage: pick(['Tight bud', 'Cracking', 'Half open']),
    headDiameter: float(3.4, 6.8, 1),
    defects: { botrytis: chance(0.15), bentNeck: chance(0.1), thrips: chance(0.12), mechanical: chance(0.08) },
    assignedGrade: pick(GRADES),
    notes: chance(0.2) ? 'Batch graded within specification.' : null,
    createdAt: new Date(b.createdAt.getTime() + 3600_000 * int(2, 10)),
  })));

  const boxes: any[] = [];
  let boxCounter = 1;
  for (const b of batches) {
    if (b.status === 'QC_PENDING') continue;
    for (let k = 0; k < int(2, 9); k++) {
      const bunchSize = pick([10, 12, 20, 25]);
      const bunches = int(8, 25);
      boxes.push({
        id: uid(), tenantId, batchId: b.id, varietyId: b.varietyId,
        boxId: `WRD-BX-${String(boxCounter++).padStart(6, '0')}`,
        grade: pick(GRADES.filter((g) => g !== 'REJECT')),
        bunchSize, bunchesPerBox: bunches, totalStems: bunchSize * bunches,
        status: pick(['PACKED', 'IN_COLD_STORAGE', 'ALLOCATED', 'SHIPPED', 'DELIVERED']),
        packDate: new Date(b.createdAt.getTime() + 3600_000 * int(4, 14)),
        destination: pick(['Amsterdam FloraHolland', 'London New Covent Garden', 'Frankfurt', 'Dubai', 'Nairobi JKIA']),
        createdAt: b.createdAt,
      });
    }
  }
  await insert('packedBox', boxes);

  await insert('coldRoomEvent', batches.filter(() => chance(0.6)).flatMap((b) => {
    const inAt = new Date(b.createdAt.getTime() + 3600_000 * 6);
    const rows = [{ id: uid(), tenantId, zoneId: pick(coldRooms).id, batchId: b.id, type: 'CHECK_IN', quantity: b.quantityIntake, userId: qcLead.id, timestamp: inAt }];
    if (chance(0.7)) {
      rows.push({ id: uid(), tenantId, zoneId: rows[0].zoneId, batchId: b.id, type: 'CHECK_OUT', quantity: Math.floor(b.quantityIntake * 0.96), userId: qcLead.id, timestamp: new Date(inAt.getTime() + 3600_000 * int(12, 60)) });
    }
    return rows;
  }));

  // current sellable stock, one row per variety+grade
  const inventory: any[] = [];
  for (const v of varieties) {
    for (const g of ['A', 'B', 'C']) {
      inventory.push({ id: uid(), tenantId, varietyId: v.id, grade: g, quantity: int(2000, 60000) });
    }
  }
  await insert('flowerInventory', inventory);

  await insert('wastageLog', Array.from({ length: 140 }, () => {
    const v = pick(varieties);
    const qty = int(50, 2200);
    const cost = v.defaultCostPerStem;
    return {
      id: uid(), tenantId, varietyId: v.id, grade: pick(['A', 'B', 'C', 'REJECT']),
      quantity: qty,
      reason: pick(['TEMPERATURE_DAMAGE', 'DISEASE', 'PEST_DAMAGE', 'PHYSICAL_DAMAGE', 'EXPIRED', 'GRADING_REJECT']),
      costPerStem: cost, costImpact: money(qty * cost),
      recordedById: qcLead.id,
      notes: chance(0.3) ? 'Identified during cold room audit.' : null,
      createdAt: daysAgo(int(0, MONTHS_OF_HISTORY * 30)),
    };
  }));

  // ---- customers, leads, orders -------------------------------------------
  const CUSTOMERS = [
    ['FloraHolland Aalsmeer', 'Netherlands', 'AUCTION_HOUSE', 'EXPORT'],
    ['Dutch Flower Group', 'Netherlands', 'EXPORTER', 'EXPORT'],
    ['New Covent Garden Market', 'United Kingdom', 'RETAILER', 'EXPORT'],
    ['Blume 2000', 'Germany', 'RETAILER', 'EXPORT'],
    ['Marks & Spencer Floral', 'United Kingdom', 'RETAILER', 'EXPORT'],
    ['Emirates Flowers LLC', 'United Arab Emirates', 'DIRECT_BUYER', 'EXPORT'],
    ['Moscow Rose Trading', 'Russia', 'EXPORTER', 'EXPORT'],
    ['Nairobi Blooms Ltd', 'Kenya', 'RETAILER', 'LOCAL_RETAIL'],
    ['Karen Florists', 'Kenya', 'RETAILER', 'LOCAL_RETAIL'],
    ['Sakata Flowers Japan', 'Japan', 'DIRECT_BUYER', 'EXPORT'],
    ['Oslo Blomster AS', 'Norway', 'RETAILER', 'EXPORT'],
    ['Spot Market Buyers', 'Kenya', 'DIRECT_BUYER', 'SPOT_MARKET'],
  ];
  const customers = CUSTOMERS.map(([name, country, type, segment], i) => ({
    id: uid(), tenantId, name, country,
    type, segment,
    email: `orders@${String(name).toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.demo`,
    phone: `+${int(1, 99)} ${int(100, 999)} ${int(100000, 999999)}`,
    address: `${int(1, 200)} Trade Avenue`,
    contactPerson: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    creditLimit: money(int(20, 400) * 1000),
    paymentTerms: pick(['NET_30', 'NET_45', 'NET_60', 'PREPAID']),
    commissionRate: type === 'AUCTION_HOUSE' ? float(4, 9, 1) : null,
    notes: i === 0 ? 'Primary auction channel; clock sales settle weekly.' : null,
  }));
  await insert('customer', customers);

  await insert('lead', Array.from({ length: 24 }, () => {
    const n = pick(['Bloom Direct', 'Petal Express', 'Rose Republic', 'Fleur Nordic', 'Garden City Wholesale', 'Cape Florals']);
    return {
      id: uid(), tenantId,
      customerId: chance(0.4) ? pick(customers).id : null,
      name: `${n} ${int(1, 99)}`,
      email: `hello@${n.toLowerCase().replace(/ /g, '')}.demo`,
      phone: `+${int(1, 99)} ${int(100000, 999999)}`,
      status: pick(['PROSPECT', 'PROSPECT', 'NEGOTIATION', 'CONTRACT', 'ACTIVE', 'LOST']),
      value: money(int(5, 220) * 1000),
      assignedToId: salesAgent.id,
      notes: pick(['Requested sample box.', 'Awaiting price confirmation.', 'Introduced at IFTF Vijfhuizen.', 'Wants weekly standing order.']),
      createdAt: daysAgo(int(0, 300)),
    };
  }));

  await insert('contactLog', Array.from({ length: 160 }, () => ({
    id: uid(), tenantId, customerId: pick(customers).id, userId: salesAgent.id,
    type: pick(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP']),
    subject: pick(['Weekly volume confirmation', 'Price negotiation', 'Quality complaint follow-up', 'New variety introduction']),
    notes: pick(['Confirmed next week volumes.', 'Agreed 3% price uplift for premium grades.', 'Discussed bent-neck claim on last shipment.', 'Sent updated availability list.']),
    date: daysAgo(int(0, 300)),
  })));

  // orders across 12 months
  const orders: any[] = [];
  for (let d = MONTHS_OF_HISTORY * 30; d >= 0; d -= 1) {
    if (!chance(0.55)) continue;
    const customer = pick(customers);
    const lineCount = int(1, 4);
    const items = Array.from({ length: lineCount }, () => {
      const p = pick(products);
      const qty = int(20, 400);
      return { sku: p.sku, name: p.name, quantity: qty, unitPrice: p.unitPrice, lineTotal: money(qty * p.unitPrice) };
    });
    const total = money(items.reduce((s, i) => s + i.lineTotal, 0));
    const created = daysAgo(d);
    const status = d > 21 ? 'INVOICED' : d > 12 ? 'DELIVERED' : d > 6 ? 'DISPATCHED' : d > 3 ? 'IN_PICKING' : chance(0.6) ? 'CONFIRMED' : 'DRAFT';
    orders.push({
      id: uid(), tenantId, customerId: customer.id,
      type: customer.type === 'AUCTION_HOUSE' ? 'AUCTION_ORDER' : customer.segment === 'EXPORT' ? 'EXPORT_CONTRACT' : chance(0.3) ? 'STANDING_ORDER' : 'SPOT_ORDER',
      status, items, totalAmount: total, currency: 'EUR',
      orderNumber: `WRD-SO-${String(orders.length + 1).padStart(5, '0')}`,
      shipmentDate: new Date(created.getTime() + 2 * DAY),
      deliveryDate: new Date(created.getTime() + 4 * DAY),
      createdAt: created,
      notes: chance(0.15) ? 'Customer requested mixed-grade pallet.' : null,
    });
  }
  await insert('order', orders);

  // invoices for anything dispatched onward
  const invoiceable = orders.filter((o) => ['DISPATCHED', 'DELIVERED', 'INVOICED'].includes(o.status));
  const invoices = invoiceable.map((o, i) => {
    const vat = money(o.totalAmount * 0.16);
    const paid = o.status === 'INVOICED' ? (chance(0.75) ? o.totalAmount + vat : money((o.totalAmount + vat) * float(0.2, 0.8))) : 0;
    return {
      id: uid(), tenantId, orderId: o.id,
      invoiceNumber: `INV-${String(i + 1).padStart(5, '0')}`,
      status: paid >= o.totalAmount + vat ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'SENT',
      totalAmount: money(o.totalAmount + vat), currency: 'EUR',
      vatAmount: vat, whtAmount: 0, paidAmount: money(paid),
      issuedAt: new Date(o.createdAt.getTime() + 2 * DAY),
      dueDate: new Date(o.createdAt.getTime() + 32 * DAY),
      sentAt: new Date(o.createdAt.getTime() + 2 * DAY),
      remindersSent: paid > 0 ? 0 : int(0, 3),
      createdAt: new Date(o.createdAt.getTime() + 2 * DAY),
    };
  });
  await insert('invoice', invoices);

  await insert('invoicePayment', invoices.filter((i) => i.paidAmount > 0).map((i) => ({
    id: uid(), tenantId, invoiceId: i.id, amount: i.paidAmount, currency: 'EUR',
    method: pick(['BANK_TRANSFER', 'BANK_TRANSFER', 'MPESA', 'LETTER_OF_CREDIT']),
    reference: `PAY-${int(100000, 999999)}`,
    paidAt: new Date(i.issuedAt.getTime() + int(5, 40) * DAY),
  })));

  await insert('exportDocument', invoiceable.filter(() => chance(0.6)).flatMap((o) =>
    ['PHYTOSANITARY', 'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_INVOICE'].filter(() => chance(0.7)).map((t) => ({
      id: uid(), tenantId, orderId: o.id, type: t,
      documentNumber: `${t.slice(0, 4)}-${int(100000, 999999)}`,
      fileUrl: `/uploads/export/${o.orderNumber}-${t.toLowerCase()}.pdf`,
      status: 'GENERATED',
    })),
  ));

  await insert('auctionLot', Array.from({ length: 60 }, () => {
    const bunches = int(80, 600); const size = pick([10, 20]);
    const expected = float(0.22, 0.68, 2);
    const done = chance(0.7);
    return {
      id: uid(), tenantId, clockNumber: `CLK-${int(1000, 9999)}`,
      varietyId: pick(varieties).id, grade: pick(['A', 'A', 'B']),
      bunchSize: size, totalBunches: bunches, totalStems: bunches * size,
      expectedPrice: expected,
      actualPrice: done ? money(expected * float(0.75, 1.35)) : null,
      status: done ? pick(['AUCTIONED', 'AUCTIONED', 'UNSOLD']) : pick(['PREPARED', 'DISPATCHED']),
      auctionDate: daysAgo(int(0, 200)),
    };
  }));

  await insert('certification', [
    { id: uid(), tenantId, type: 'GLOBAL_GAP', issuedBy: 'SGS Kenya', certNumber: 'GGN-4049929304821', issueDate: daysAgo(300), expiryDate: daysAgo(-65), status: 'ACTIVE' },
    { id: uid(), tenantId, type: 'FAIRTRADE', issuedBy: 'FLOCERT', certNumber: 'FLO-ID-31882', issueDate: daysAgo(420), expiryDate: daysAgo(-210), status: 'ACTIVE' },
    { id: uid(), tenantId, type: 'KFC_SILVER', issuedBy: 'Kenya Flower Council', certNumber: 'KFC-SLV-2291', issueDate: daysAgo(200), expiryDate: daysAgo(-28), status: 'ACTIVE' },
    { id: uid(), tenantId, type: 'MPS', issuedBy: 'MPS-ECAS', certNumber: 'MPS-771204', issueDate: daysAgo(500), expiryDate: daysAgo(-14), status: 'ACTIVE', remindersSent: 2 },
    { id: uid(), tenantId, type: 'RAINFOREST_ALLIANCE', issuedBy: 'Rainforest Alliance', certNumber: 'RA-KE-88213', issueDate: daysAgo(700), expiryDate: daysAgo(30), status: 'EXPIRED' },
  ]);

  // ---- logistics -----------------------------------------------------------
  const vehicles = Array.from({ length: 7 }, (_, i) => ({
    id: uid(), tenantId,
    plateNumber: `KD${pick(['A','B','C','G','J'])} ${int(100, 999)}${pick(['A','B','C','X','Y'])}`,
    makeModel: pick(['Isuzu NQR Reefer', 'Mitsubishi Canter', 'Toyota Dyna', 'Scania P280']),
    type: i < 5 ? 'TRUCK' : 'VAN',
    capacity: float(1500, 9000, 0), refrigerated: i < 6,
    status: chance(0.85) ? 'ACTIVE' : 'MAINTENANCE',
  }));
  await insert('vehicle', vehicles);

  const routes: any[] = [];
  const stops: any[] = [];
  const deliverable = orders.filter((o) => ['DISPATCHED', 'DELIVERED', 'INVOICED'].includes(o.status));
  let cursor = 0;
  for (let d = 180; d >= 0; d -= 1) {
    if (cursor >= deliverable.length) break;
    if (!chance(0.7)) continue;
    const routeId = uid();
    const date = daysAgo(d);
    const routeOrders = deliverable.slice(cursor, cursor + int(1, 4));
    cursor += routeOrders.length;
    if (!routeOrders.length) break;
    const startM = int(40000, 190000);
    routes.push({
      id: routeId, tenantId, driverId: driverUser.id, vehicleId: pick(vehicles).id,
      date, status: d > 1 ? 'COMPLETED' : pick(['PENDING', 'IN_PROGRESS']),
      startMileage: startM, endMileage: d > 1 ? startM + int(40, 320) : null,
    });
    routeOrders.forEach((o, idx) => {
      const eta = new Date(date.getTime() + (8 + idx * 2) * 3600_000);
      stops.push({
        id: uid(), tenantId, routeId, orderId: o.id, sequenceIndex: idx,
        status: d > 1 ? 'DELIVERED' : 'PENDING',
        expectedArrival: eta,
        actualArrival: d > 1 ? new Date(eta.getTime() + int(-25, 70) * 60_000) : null,
        podSignatureUrl: d > 1 ? `/uploads/pod/${o.orderNumber}-sig.png` : null,
        podPhotoUrl: d > 1 && chance(0.5) ? `/uploads/pod/${o.orderNumber}-photo.jpg` : null,
        vehicleTempAtDelivery: d > 1 ? float(2.5, 8.5, 1) : null,
      });
    });
  }
  await insert('deliveryRoute', routes);
  await insert('deliveryStop', stops);

  // ---- stores & procurement ------------------------------------------------
  const STORE_ITEMS: [string, string, string][] = [
    ['NPK 17-17-17 (50kg)', 'FERTILISER', 'bags'],
    ['Calcium Nitrate (25kg)', 'FERTILISER', 'bags'],
    ['Mono Potassium Phosphate', 'FERTILISER', 'kg'],
    ['Magnesium Sulphate', 'FERTILISER', 'kg'],
    ['Rovral WG Fungicide', 'PESTICIDE', 'L'],
    ['Switch 62.5WG', 'PESTICIDE', 'kg'],
    ['Abamectin 1.8EC', 'PESTICIDE', 'L'],
    ['Confidor 200SL', 'PESTICIDE', 'L'],
    ['Ortiva Top', 'PESTICIDE', 'L'],
    ['Rose Cuttings - Red Naomi', 'SEED', 'units'],
    ['Rose Cuttings - Athena', 'SEED', 'units'],
    ['Export Carton 60cm', 'PACKAGING', 'units'],
    ['Export Carton 80cm', 'PACKAGING', 'units'],
    ['Sleeve Film (roll)', 'PACKAGING', 'rolls'],
    ['Rubber Bands (5kg)', 'PACKAGING', 'boxes'],
    ['Corner Protectors', 'PACKAGING', 'units'],
    ['Nitrile Gloves', 'PPE', 'boxes'],
    ['Spray Overalls', 'PPE', 'units'],
    ['Respirator Cartridges', 'PPE', 'units'],
    ['Safety Boots', 'PPE', 'pairs'],
    ['Drip Line 16mm (100m)', 'SPARE_PART', 'rolls'],
    ['Irrigation Filters', 'SPARE_PART', 'units'],
    ['Pump Seal Kit', 'SPARE_PART', 'units'],
    ['Greenhouse Polythene (8m)', 'SPARE_PART', 'rolls'],
    ['Secateurs', 'OTHER', 'units'],
  ];
  const storeItems = STORE_ITEMS.map(([name, category, unit], i) => ({
    id: uid(), tenantId, name, category, unit,
    sku: `ST-${String(i + 1).padStart(4, '0')}`,
    description: `${name} — standard issue stock item.`,
    minStockLevel: float(20, 120, 0), reorderPoint: float(40, 220, 0),
    maxStockLevel: float(400, 1400, 0),
    unitCost: money(int(180, 14000)),
    lastUnitPrice: money(int(180, 14000)),
  }));
  await insert('storeItem', storeItems);

  await insert('storeStock', storeItems.map((it) => ({
    id: uid(), tenantId, itemId: it.id, zoneId: storeZone.id,
    quantity: chance(0.22) ? float(0, it.reorderPoint, 0) : float(it.reorderPoint, it.maxStockLevel, 0),
  })));

  await insert('storeMovement', Array.from({ length: 700 }, () => {
    const it = pick(storeItems);
    const type = pick(['GRN', 'ISSUE', 'ISSUE', 'ISSUE', 'RETURN', 'WRITE_OFF']);
    return {
      id: uid(), tenantId, itemId: it.id, zoneId: storeZone.id, type,
      quantity: float(1, 90, 0),
      reference: `${type}-${int(10000, 99999)}`,
      notes: type === 'WRITE_OFF' ? pick(['Expired stock', 'Damaged in storage']) : null,
      createdById: storeManager.id,
      createdAt: daysAgo(int(0, MONTHS_OF_HISTORY * 30)),
    };
  }));

  const vendors = [
    'Amiran Kenya', 'Osho Chemicals', 'Elgon Kenya', 'Greenlife Crop Protection',
    'Syngenta East Africa', 'Bayer East Africa', 'Kenya Packaging Ltd',
    'Rift Valley Plastics', 'Naivasha Hardware', 'Hygrotech Seeds',
  ].map((name, i) => ({
    id: uid(), tenantId, name,
    contactPerson: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `sales@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.demo`,
    phone: `+2542${int(10, 99)}${int(100000, 999999)}`,
    address: `Industrial Area, Nairobi`,
    paymentTerms: pick(['NET_30', 'NET_45', 'PREPAID']),
    taxPin: `P${int(100000000, 999999999)}Z`,
    bankDetails: { bank: pick(['Equity Bank', 'KCB', 'Stanbic']), account: `${int(1000000000, 9999999999)}` },
    isActive: i < 9,
  }));
  await insert('vendor', vendors);

  const purchaseRequests = Array.from({ length: 45 }, () => {
    const it = pick(storeItems);
    const status = pick(['PENDING', 'APPROVED', 'APPROVED', 'CONVERTED', 'REJECTED']);
    const qty = float(50, 400, 0);
    return {
      id: uid(), tenantId, status, generatedBy: chance(0.6) ? 'AUTO_REORDER' : storeManager.id,
      itemId: it.id, vendorId: pick(vendors).id,
      currentStock: float(0, it.reorderPoint, 0), reorderPoint: it.reorderPoint,
      suggestedQty: qty, approvedQty: status === 'PENDING' ? null : qty,
      lastUnitPrice: it.unitCost, estimatedTotal: money(qty * it.unitCost),
      approvedById: ['APPROVED', 'CONVERTED'].includes(status) ? admin.id : null,
      approvedAt: ['APPROVED', 'CONVERTED'].includes(status) ? daysAgo(int(1, 120)) : null,
      rejectionReason: status === 'REJECTED' ? 'Sufficient stock already on order.' : null,
      createdAt: daysAgo(int(0, 200)),
    };
  });
  await insert('purchaseRequest', purchaseRequests);

  const purchaseOrders: any[] = [];
  const poItems: any[] = [];
  purchaseRequests.filter((p) => p.status === 'CONVERTED').forEach((pr, i) => {
    const poId = uid();
    const lines = Array.from({ length: int(1, 4) }, () => {
      const it = pick(storeItems);
      const qty = float(20, 260, 0);
      return { id: uid(), poId, itemId: it.id, quantity: qty, unitPrice: it.unitCost, totalPrice: money(qty * it.unitCost) };
    });
    poItems.push(...lines);
    purchaseOrders.push({
      id: poId, tenantId, poNumber: `PO-${String(i + 1).padStart(5, '0')}`,
      status: pick(['SENT', 'ACKNOWLEDGED', 'RECEIVED', 'RECEIVED', 'PARTIALLY_RECEIVED']),
      vendorId: pr.vendorId, purchaseRequestId: pr.id,
      expectedDelivery: daysAgo(-int(1, 20)),
      totalAmount: money(lines.reduce((s, l) => s + l.totalPrice, 0)),
      createdById: storeManager.id,
      vendorEmailSentAt: daysAgo(int(1, 100)),
      createdAt: pr.createdAt,
    });
  });
  await insert('purchaseOrder', purchaseOrders);
  await insert('purchaseOrderItem', poItems);

  const grns: any[] = [];
  const grnItems: any[] = [];
  purchaseOrders.filter((p) => ['RECEIVED', 'PARTIALLY_RECEIVED'].includes(p.status)).forEach((po, i) => {
    const grnId = uid();
    grns.push({
      id: grnId, tenantId, poId: po.id, grnNumber: `GRN-${String(i + 1).padStart(5, '0')}`,
      status: po.status === 'RECEIVED' ? 'RECONCILED' : 'DISCREPANCY',
      vendorId: po.vendorId, receivedById: storeManager.id,
      receivedDate: daysAgo(int(1, 90)),
      discrepancyNotes: po.status === 'PARTIALLY_RECEIVED' ? 'Short delivery of 12 units; vendor notified.' : null,
    });
    poItems.filter((l) => l.poId === po.id).forEach((l) => {
      const recv = po.status === 'RECEIVED' ? l.quantity : Number((l.quantity * 0.85).toFixed(0));
      grnItems.push({ id: uid(), grnId, itemId: l.itemId, poItemId: l.id, quantityReceived: recv, unitPriceReceived: l.unitPrice, totalPriceReceived: money(recv * l.unitPrice) });
    });
  });
  await insert('goodsReceivedNote', grns);
  await insert('grnItem', grnItems);

  const vendorInvoices = grns.map((g, i) => {
    const po = purchaseOrders.find((p) => p.id === g.poId);
    const paid = chance(0.6) ? po.totalAmount : chance(0.5) ? money(po.totalAmount * 0.5) : 0;
    return {
      id: uid(), tenantId, vendorId: g.vendorId, poId: g.poId, grnId: g.id,
      invoiceNumber: `VINV-${String(i + 1).padStart(5, '0')}`,
      status: paid >= po.totalAmount ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
      totalAmount: po.totalAmount, paidAmount: paid, currency: 'KES',
      invoiceDate: g.receivedDate,
      dueDate: new Date(g.receivedDate.getTime() + 30 * DAY),
    };
  });
  await insert('vendorInvoice', vendorInvoices);

  await insert('vendorPayment', vendorInvoices.filter((v) => v.paidAmount > 0).map((v) => ({
    id: uid(), tenantId, vendorInvoiceId: v.id, amount: v.paidAmount, currency: 'KES',
    method: pick(['BANK_TRANSFER', 'MPESA', 'CHEQUE']),
    reference: `VP-${int(100000, 999999)}`,
    paidAt: new Date(v.invoiceDate.getTime() + int(5, 35) * DAY),
  })));

  const rfqs = Array.from({ length: 14 }, () => ({
    id: uid(), tenantId,
    items: Array.from({ length: int(1, 3) }, () => {
      const it = pick(storeItems);
      return { itemId: it.id, name: it.name, quantity: int(50, 400) };
    }),
    notes: 'Please quote delivered Naivasha, inclusive of VAT.',
    status: pick(['DRAFT', 'SENT', 'SENT', 'CLOSED']),
    expiryDate: daysAgo(-int(3, 30)),
    createdAt: daysAgo(int(0, 150)),
  }));
  await insert('rfq', rfqs);

  await insert('rfqResponse', rfqs.filter((r) => r.status !== 'DRAFT').flatMap((r) =>
    vendors.slice(0, int(2, 5)).map((v) => {
      const unit = money(int(200, 9000));
      const qty = int(50, 300);
      return {
        id: uid(), rfqId: r.id, vendorId: v.id, tenantId,
        unitPrice: unit, totalAmount: money(unit * qty), currency: 'KES',
        deliveryDays: int(2, 21), validUntil: daysAgo(-int(5, 40)),
        status: pick(['PENDING', 'PENDING', 'ACCEPTED', 'REJECTED']),
      };
    }),
  ));

  await insert('vendorPerformanceLog', Array.from({ length: 90 }, () => ({
    id: uid(), tenantId, vendorId: pick(vendors).id,
    type: pick(['ON_TIME_DELIVERY', 'QUALITY_COMPLAINT', 'PRICE_CONSISTENCY', 'GENERAL']),
    score: float(2.5, 5, 1),
    notes: pick(['Delivered ahead of schedule.', 'Packaging damaged on arrival.', 'Held price for the full quarter.', 'Responsive account manager.']),
    recordedAt: daysAgo(int(0, 300)),
  })));

  // ---- financials ----------------------------------------------------------
  const CHART: [string, string, string][] = [
    ['1000', 'Cash at Bank', 'ASSET'], ['1010', 'Petty Cash', 'ASSET'],
    ['1100', 'Accounts Receivable', 'ASSET'], ['1200', 'Flower Inventory', 'ASSET'],
    ['1210', 'Store Inventory', 'ASSET'], ['1500', 'Greenhouses & Structures', 'ASSET'],
    ['1510', 'Vehicles', 'ASSET'], ['1520', 'Irrigation Equipment', 'ASSET'],
    ['2000', 'Accounts Payable', 'LIABILITY'], ['2100', 'VAT Payable', 'LIABILITY'],
    ['2110', 'PAYE Payable', 'LIABILITY'], ['2120', 'NSSF Payable', 'LIABILITY'],
    ['2130', 'NHIF Payable', 'LIABILITY'], ['2200', 'Bank Loan', 'LIABILITY'],
    ['3000', 'Share Capital', 'EQUITY'], ['3100', 'Retained Earnings', 'EQUITY'],
    ['4000', 'Export Sales', 'REVENUE'], ['4010', 'Local Sales', 'REVENUE'],
    ['4020', 'Auction Sales', 'REVENUE'], ['4900', 'Other Income', 'REVENUE'],
    ['5000', 'Cost of Goods Sold', 'EXPENSE'], ['5100', 'Fertiliser & Chemicals', 'EXPENSE'],
    ['5200', 'Packaging Materials', 'EXPENSE'], ['5300', 'Freight & Airfreight', 'EXPENSE'],
    ['6000', 'Salaries & Wages', 'EXPENSE'], ['6010', 'Casual Labour', 'EXPENSE'],
    ['6100', 'Electricity & Water', 'EXPENSE'], ['6200', 'Repairs & Maintenance', 'EXPENSE'],
    ['6300', 'Certification & Compliance', 'EXPENSE'], ['6400', 'Depreciation', 'EXPENSE'],
  ];
  await insert('account', CHART.map(([code, name, type]) => ({
    id: uid(), tenantId, code, name, type, currency: 'KES', isActive: true,
  })));

  const journals: any[] = [];
  const entries: any[] = [];
  for (let i = 0; i < 240; i++) {
    const jid = uid();
    const date = daysAgo(int(0, MONTHS_OF_HISTORY * 30));
    const amount = money(int(15, 900) * 1000);
    const scenario = pick([
      { desc: 'Export sales invoice posting', dr: '1100', cr: '4000' },
      { desc: 'Auction settlement received', dr: '1000', cr: '4020' },
      { desc: 'Customer receipt', dr: '1000', cr: '1100' },
      { desc: 'Chemical purchase', dr: '5100', cr: '2000' },
      { desc: 'Packaging purchase', dr: '5200', cr: '2000' },
      { desc: 'Airfreight charge', dr: '5300', cr: '2000' },
      { desc: 'Payroll posting', dr: '6000', cr: '1000' },
      { desc: 'Electricity bill', dr: '6100', cr: '2000' },
    ]);
    journals.push({ id: jid, tenantId, reference: `JV-${String(i + 1).padStart(5, '0')}`, description: scenario.desc, date, userId: userByRole.accountant.id });
    entries.push(
      { id: uid(), journalId: jid, accountCode: scenario.dr, debit: amount, credit: 0 },
      { id: uid(), journalId: jid, accountCode: scenario.cr, debit: 0, credit: amount },
    );
  }
  await insert('financialJournal', journals);
  await insert('journalEntry', entries);

  await insert('exchangeRate', [
    ['EUR', 'KES', 141.2], ['USD', 'KES', 129.4], ['GBP', 'KES', 164.8], ['KES', 'EUR', 0.00708],
  ].flatMap(([from, to, rate]) =>
    Array.from({ length: 12 }, (_, m) => ({
      id: uid(), tenantId, fromCurrency: from, toCurrency: to,
      rate: money(Number(rate) * float(0.96, 1.04, 4)),
      effectiveDate: daysAgo(m * 30),
    })),
  ));

  await insert('taxRate', [
    { id: uid(), tenantId, name: 'VAT Standard', rate: 16, type: 'VAT', isActive: true },
    { id: uid(), tenantId, name: 'VAT Zero Rated (Export)', rate: 0, type: 'VAT', isActive: true },
    { id: uid(), tenantId, name: 'Withholding Tax - Services', rate: 5, type: 'WHT', isActive: true },
    { id: uid(), tenantId, name: 'Withholding Tax - Rent', rate: 10, type: 'WHT', isActive: false },
  ]);

  const costCentres = ['Production', 'Pack House', 'Logistics', 'Administration', 'Sales'].map((n, i) => ({
    id: uid(), tenantId, name: n,
    type: ['PRODUCTION', 'PACK_HOUSE', 'LOGISTICS', 'ADMIN', 'SALES'][i],
    description: `${n} cost centre`, isActive: true,
  }));
  await insert('costCentre', costCentres);

  const budgets = costCentres.map((cc) => ({
    id: uid(), tenantId, costCentreId: cc.id,
    name: `${cc.name} Budget ${now.getFullYear()}`, year: now.getFullYear(),
    currency: 'KES', status: 'APPROVED',
  }));
  await insert('budget', budgets);

  await insert('budgetLine', budgets.flatMap((b) =>
    ['5100', '5200', '5300', '6000', '6100', '6200'].map((code) => ({
      id: uid(), budgetId: b.id, accountCode: code,
      description: CHART.find((c) => c[0] === code)![1],
      budgetedAmt: money(int(400, 6500) * 1000),
    })),
  ));

  // ---- payroll -------------------------------------------------------------
  const payrollRuns: any[] = [];
  const payslips: any[] = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const runId = uid();
    let gross = 0, net = 0, ded = 0;
    const slips = activeEmployees.map((e) => {
      const basic = e.basicSalary;
      const overtime = money(chance(0.4) ? int(1, 22) * 450 : 0);
      const allowances = money(int(0, 18) * 1000);
      const g = money(basic + overtime + allowances);
      const paye = money(g * 0.18); const nhif = money(1700); const nssf = money(1080);
      const other = money(chance(0.25) ? int(1, 9) * 500 : 0);
      const td = money(paye + nhif + nssf + other);
      gross += g; ded += td; net += g - td;
      return {
        id: uid(), tenantId, payrollRunId: runId, employeeId: e.id,
        basicSalary: basic, overtime, allowances, grossPay: g,
        paye, nhif, nssf, otherDeductions: other, totalDeductions: td,
        netPay: money(g - td),
        paymentMethod: pick(['BANK_TRANSFER', 'BANK_TRANSFER', 'MPESA']),
        paymentReference: `PS-${int(100000, 999999)}`,
        paidAt: m > 0 ? new Date(d.getFullYear(), d.getMonth(), 28) : null,
        pdfUrl: `/uploads/payslips/${period}-${e.employeeNumber}.pdf`,
      };
    });
    payslips.push(...slips);
    payrollRuns.push({
      id: runId, tenantId, runNumber: `RUN-${period}`, period,
      year: d.getFullYear(), month: d.getMonth() + 1,
      status: m > 0 ? 'DISBURSED' : 'DRAFT',
      totalGross: money(gross), totalNet: money(net), totalDeductions: money(ded),
      approvedById: m > 0 ? admin.id : null,
      approvedAt: m > 0 ? new Date(d.getFullYear(), d.getMonth(), 26) : null,
      disbursedAt: m > 0 ? new Date(d.getFullYear(), d.getMonth(), 28) : null,
      createdAt: new Date(d.getFullYear(), d.getMonth(), 24),
    });
  }
  await insert('payrollRun', payrollRuns);
  await insert('payslip', payslips);

  await insert('payrollRecord', users.flatMap((u) =>
    Array.from({ length: 6 }, (_, m) => {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      return {
        id: uid(), tenantId, userId: u.id,
        amount: money(int(60, 300) * 1000), currency: 'KES',
        status: m > 0 ? 'PAID' : 'PENDING',
        period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        paymentDate: m > 0 ? new Date(d.getFullYear(), d.getMonth(), 28) : null,
        type: 'FIXED',
      };
    }),
  ));

  // ---- training & performance ---------------------------------------------
  const courses = [
    ['Safe Chemical Handling', 'Compliance', true, 12],
    ['GLOBALG.A.P. Awareness', 'Compliance', true, 24],
    ['First Aid at Work', 'Health & Safety', true, 24],
    ['Fire Marshal Training', 'Health & Safety', false, 24],
    ['Rose Grading Standards', 'Technical', true, 12],
    ['Cold Chain Management', 'Technical', false, 18],
    ['Supervisory Skills', 'Leadership', false, null],
    ['Fairtrade Principles', 'Compliance', false, 36],
  ].map(([name, category, isMandatory, validityMonths]) => ({
    id: uid(), tenantId, name, category, isMandatory, validityMonths,
    description: `${name} — delivered by an accredited provider.`,
  }));
  await insert('trainingCourse', courses);

  await insert('trainingRecord', employees.flatMap((e) =>
    courses.filter(() => chance(0.4)).map((c) => {
      const completed = daysAgo(int(20, 800));
      return {
        id: uid(), tenantId, employeeId: e.id, courseId: c.id,
        provider: pick(['Kenya Flower Council', 'SGS Academy', 'In-house', 'Amiran Training']),
        completionDate: completed,
        score: float(55, 100, 0),
        certificateUrl: `/uploads/training/${e.employeeNumber}-${String(c.name).slice(0, 8).replace(/ /g, '')}.pdf`,
        expiryDate: c.validityMonths ? new Date(completed.getTime() + Number(c.validityMonths) * 30 * DAY) : null,
        status: 'COMPLETED',
      };
    }),
  ));

  await insert('trainingSchedule', courses.flatMap((c) =>
    Array.from({ length: int(1, 3) }, () => ({
      id: uid(), tenantId, courseId: c.id,
      scheduledDate: daysAgo(-int(2, 90)),
      department: pick(DEPARTMENTS), trainer: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      location: pick(['Training Room A', 'Pack House Mezzanine', 'Administration Block']),
      status: 'SCHEDULED',
    })),
  ));

  const appraisals = activeEmployees.filter(() => chance(0.6)).map((e) => {
    const self = float(2.5, 5, 1), peer = float(2.5, 5, 1), sup = float(2.5, 5, 1), kpi = float(2, 5, 1);
    return {
      id: uid(), tenantId, employeeId: e.id,
      period: `${now.getFullYear()}-H${now.getMonth() < 6 ? 1 : 2}`,
      status: pick(['DRAFT', 'IN_REVIEW', 'COMPLETED', 'COMPLETED']),
      selfScore: self, peerScore: peer, supervisorScore: sup, kpiScore: kpi,
      finalScore: money((self + peer + sup + kpi) / 4),
      comments: pick(['Consistently exceeds harvest targets.', 'Reliable, needs support on documentation.', 'Strong team player.', 'Improvement needed on punctuality.']),
    };
  });
  await insert('performanceAppraisal', appraisals);

  await insert('appraisalReview', appraisals.flatMap((a) =>
    ['SELF', 'PEER', 'SUPERVISOR'].map((t) => ({
      id: uid(), appraisalId: a.id, reviewerId: t === 'SUPERVISOR' ? supervisor.id : admin.id,
      type: t,
      scores: { quality: int(2, 5), productivity: int(2, 5), teamwork: int(2, 5), safety: int(3, 5) },
      comments: pick(['Meets expectations.', 'Above expectations this cycle.', 'Some areas to develop.']),
    })),
  ));

  await insert('employeeKPI', activeEmployees.flatMap((e) =>
    [
      { name: 'Stems harvested per shift', targetType: 'NUMBER', targetValue: 1800 },
      { name: 'Attendance rate', targetType: 'PERCENTAGE', targetValue: 95 },
      { name: 'Quality rejection rate', targetType: 'PERCENTAGE', targetValue: 4 },
    ].filter(() => chance(0.7)).map((k) => ({
      id: uid(), tenantId, employeeId: e.id, ...k,
      actualValue: money(k.targetValue * float(0.75, 1.2)),
      period: `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`,
    })),
  ));

  // ---- notifications, audit, comms, chat ----------------------------------
  await insert('notification', users.flatMap((u) =>
    Array.from({ length: int(3, 9) }, () => ({
      id: uid(), userId: u.id, tenantId,
      title: pick(['Cold room alert', 'New order received', 'PO awaiting approval', 'Certificate expiring', 'Payroll ready for review']),
      message: pick([
        'Cold Room A exceeded 8°C at 03:14.',
        'FloraHolland placed a new export order.',
        'PO-00042 is awaiting your approval.',
        'MPS certification expires in 14 days.',
        'Payroll run for this month is ready.',
      ]),
      isRead: chance(0.55),
      createdAt: daysAgo(int(0, 45)),
    })),
  ));

  await insert('auditLog', Array.from({ length: 500 }, () => ({
    id: uid(), tenantId, actorId: pick(users).id,
    action: pick(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'EXPORT']),
    entityType: pick(['Order', 'Invoice', 'PurchaseOrder', 'Employee', 'Zone', 'CropCycle', 'User']),
    entityId: uid(),
    timestamp: daysAgo(int(0, 200)),
  })));

  await insert('communication', Array.from({ length: 120 }, () => ({
    id: uid(), tenantId,
    direction: pick(['INBOUND', 'OUTBOUND']),
    channel: pick(['EMAIL', 'SMS', 'WHATSAPP']),
    subject: pick(['Order confirmation', 'Payment reminder', 'Delivery scheduled', 'Quality feedback']),
    body: pick([
      'Your order has been confirmed and is scheduled for dispatch.',
      'This is a reminder that invoice INV-00231 is now due.',
      'Delivery is scheduled for tomorrow between 08:00 and 11:00.',
      'Thank you for the feedback on last week’s consignment.',
    ]),
    entityType: 'Order',
    createdAt: daysAgo(int(0, 200)),
  })));

  const chatSessions = users.slice(0, 4).flatMap((u) =>
    Array.from({ length: 2 }, () => ({
      id: uid(), tenantId, userId: u.id,
      title: pick(['Harvest forecast question', 'Cold room troubleshooting', 'Invoice aging summary', 'Stock reorder advice']),
      createdAt: daysAgo(int(0, 40)),
    })),
  );
  await insert('chatSession', chatSessions);

  await insert('chatMessage', chatSessions.flatMap((s) => [
    { id: uid(), sessionId: s.id, role: 'user', content: 'What is our projected harvest for the next two weeks?', tokensUsed: 0, createdAt: s.createdAt },
    { id: uid(), sessionId: s.id, role: 'assistant', content: 'Based on the active crop cycles, projected harvest for the next 14 days is approximately 186,000 stems, with Red Naomi and Mondial accounting for 58% of the volume.', tokensUsed: int(180, 900), createdAt: new Date(s.createdAt.getTime() + 4000) },
  ]));

  // ---- coverage check ------------------------------------------------------
  // Prove every table actually received rows rather than assuming it.
  const allTables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `select tablename from pg_tables
      where schemaname = 'public' and tablename <> '_prisma_migrations'
      order by tablename`,
  );
  const unionSql = allTables
    .map((t) => `select '${t.tablename}' as t, count(*)::int as n from "${t.tablename}"`)
    .join(' union all ');
  const counts: { t: string; n: number }[] = await prisma.$queryRawUnsafe(unionSql);
  const empty = counts.filter((c) => c.n === 0).map((c) => c.t);
  const totalRows = counts.reduce((sum, c) => sum + c.n, 0);

  console.log(`\n  ${counts.length} tables, ${totalRows.toLocaleString()} rows total`);
  if (empty.length) {
    console.log(`\n  ⚠️  ${empty.length} table(s) still empty:`);
    for (const t of empty) console.log(`      - ${t}`);
  } else {
    console.log('  ✅ every table populated');
  }

  // ---- done ----------------------------------------------------------------
  console.log('\n' + '='.repeat(64));
  console.log('DEMO LOGIN CREDENTIALS');
  console.log('='.repeat(64));
  console.log(`Password for every account:  ${DEMO_PASSWORD}\n`);
  for (const spec of USER_SPECS) {
    console.log(`  ${spec.email.padEnd(30)} ${spec.role.padEnd(18)} ${spec.title}`);
  }
  console.log('='.repeat(64) + '\n');
}

main()
  .catch((e) => {
    console.error('Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
