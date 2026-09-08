import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Prisma CLI work (migrate, db push, studio) must use a direct connection.
    // Neon's pooled endpoint runs PgBouncer in transaction mode, which cannot
    // execute the DDL that migrations need. Runtime queries still go through
    // the pooled DATABASE_URL via PrismaService.
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      'postgresql://postgres:placeholder@localhost:5432/floricore',
  },
  migrations: {
    seed: 'ts-node ./prisma/seed.ts',
  },
});
