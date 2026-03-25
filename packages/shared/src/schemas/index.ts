import { z } from 'zod';

// ── Auth Schemas ──────────────────────────────────────────────────
export const RegisterTenantSchema = z.object({
  farmName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});
export type RegisterTenantDto = z.infer<typeof RegisterTenantSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;

// ── User Schemas ──────────────────────────────────────────────────
export const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    'gold_admin',
    'field_supervisor',
    'qc_lead',
    'accountant',
    'hr_manager',
    'driver',
    'store_manager',
    'sales_agent',
  ]),
});
export type InviteUserDto = z.infer<typeof InviteUserSchema>;
