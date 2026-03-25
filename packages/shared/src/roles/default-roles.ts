export const DEFAULT_ROLES = [
  { name: 'gold_admin', permissions: ['*'] },
  { name: 'field_supervisor', permissions: ['production:*'] },
  { name: 'qc_lead', permissions: ['packhouse:*', 'inventory:*'] },
  { name: 'accountant', permissions: ['finance:*', 'payroll:read'] },
  { name: 'hr_manager', permissions: ['hr:*', 'attendance:*'] },
  { name: 'driver', permissions: ['logistics:*', 'pod:*'] },
  { name: 'store_manager', permissions: ['stores:*', 'procurement:*'] },
  { name: 'sales_agent', permissions: ['crm:*', 'orders:*'] },
];
