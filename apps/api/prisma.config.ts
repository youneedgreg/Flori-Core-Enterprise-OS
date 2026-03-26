import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:placeholder@localhost:5432/floricore',
  },
  migrations: {
    seed: 'ts-node ./prisma/seed.ts',
  },
});
