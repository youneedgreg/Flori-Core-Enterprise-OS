/**
 * The demo roster.
 *
 * One list, read by the sign-in page's switcher. The password is here rather
 * than in the API's seed script because the two live on opposite sides of the
 * deployment; `apps/api/prisma/seed-demo.ts` sets it and this prints it. If you
 * change one, change the other — `DEMO_PASSWORD` must match the constant of the
 * same name in that file.
 *
 * Printing credentials on a sign-in page is only defensible because of what
 * this deployment is: seeded fixtures for a farm that does not exist. The whole
 * panel is therefore conditional on NEXT_PUBLIC_DEMO_MODE, so a real tenant's
 * sign-in page is the form and nothing else.
 */

/**
 * Supplied by the environment, never hardcoded.
 *
 * A literal here would be compiled into the login page's JavaScript chunk in
 * *every* build, including one with NEXT_PUBLIC_DEMO_MODE unset — the flag
 * removes the panel from the rendered page but does not remove the module from
 * the bundle. Reading it from the environment means a non-demo deployment
 * ships an empty string.
 *
 * Must match DEMO_PASSWORD in apps/api/prisma/seed-demo.ts.
 */
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';

export interface DemoAccount {
  readonly email: string;
  readonly label: string;
  /** What this person's job is — see the note below. */
  readonly shows: string;
}

/**
 * Ordered by how broad each role's remit is, widest first.
 *
 * `shows` describes what the account *is for*, not what the application stops
 * it doing. That distinction matters: the dashboard navigation is not filtered
 * by role and most API endpoints do not declare `@Roles`, so every account here
 * can currently reach most screens. Wording these as "X and nothing else" would
 * be a claim the code does not honour.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: 'admin@waridi.demo',
    label: 'Managing Director',
    shows: 'The full picture — financials, production, HR and procurement.',
  },
  {
    email: 'hr@waridi.demo',
    label: 'HR Manager',
    shows: 'Employees, attendance, leave, payroll runs and training.',
  },
  {
    email: 'accountant@waridi.demo',
    label: 'Financial Controller',
    shows: 'Ledger, receivables, payables, budgets and payroll.',
  },
  {
    email: 'supervisor@waridi.demo',
    label: 'Head of Production',
    shows: 'Crop cycles, zones, spray logs and field labour.',
  },
  {
    email: 'qc@waridi.demo',
    label: 'QC Lead',
    shows: 'Pack-house grading, QC logs and finished-goods inventory.',
  },
  {
    email: 'stores@waridi.demo',
    label: 'Stores Manager',
    shows: 'Stock levels, movements and the procurement chain.',
  },
  {
    email: 'sales@waridi.demo',
    label: 'Export Sales Lead',
    shows: 'Customers, leads, orders and invoicing.',
  },
  {
    email: 'driver@waridi.demo',
    label: 'Lead Driver',
    shows: 'Delivery routes and proof-of-delivery capture.',
  },
];

/**
 * Read at build time — NEXT_PUBLIC_* values are inlined into the bundle, so
 * this is a constant in the shipped page rather than a runtime check.
 *
 * Requires the password as well as the flag: a demo panel whose buttons all
 * fail because no password was configured is worse than no panel.
 */
export const isDemoMode = (): boolean =>
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && DEMO_PASSWORD.length > 0;
