// Shared entity types

export type TenantId = string;
export type UserId = string;

export type Role =
  | 'gold_admin'
  | 'field_supervisor'
  | 'qc_lead'
  | 'accountant'
  | 'hr_manager'
  | 'driver'
  | 'store_manager'
  | 'sales_agent';

export interface Tenant {
  id: TenantId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: UserId;
  tenantId: TenantId;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
