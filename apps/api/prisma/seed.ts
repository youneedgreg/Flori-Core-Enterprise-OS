import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLES } from '@flori/shared';
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Farm',
      slug: 'default',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // 2. Create Default Roles
  const createdRoles = await Promise.all(
    DEFAULT_ROLES.map(async (r) => {
      let role = await prisma.role.findFirst({
        where: { name: r.name, tenantId: tenant.id },
      });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: r.name,
            isSystem: false,
            tenantId: tenant.id,
            permissions: r.permissions,
          },
        });
      } else {
        role = await prisma.role.update({
          where: { id: role.id },
          data: { permissions: r.permissions },
        });
      }
      return role;
    })
  );
  console.log(`✅ Default Roles created for tenant: ${tenant.name}`);

  const goldAdminRole = createdRoles.find((r) => r.name === 'gold_admin');
  if (!goldAdminRole) throw new Error('Missing gold_admin role');

  // 3. Create Gold Admin User
  const adminEmail = 'admin@floricore.io';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      roleId: goldAdminRole.id,
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Gold Admin created: ${admin.email} (${admin.id})`);

  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
