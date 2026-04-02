import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLES } from '@flori/shared';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Starting seed...');

  console.log('Pushing default roles...');
  for (const role of DEFAULT_ROLES) {
    const existing = await prisma.role.findFirst({
      where: {
        name: role.name,
        tenantId: null,
      },
    });

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          permissions: role.permissions as any,
          isSystem: true,
        },
      });
      console.log(`- Updated role: ${role.name}`);
    } else {
      await prisma.role.create({
        data: {
          name: role.name,
          permissions: role.permissions as any,
          isSystem: true,
          tenantId: null,
        },
      });
      console.log(`- Created role: ${role.name}`);
    }
  }

  console.log('🚀 Seed completed!');
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
