import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL ?? '';
if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🚀 Creating Superset views...');

  try {
    // 1. P&L Summary View
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW vw_pnl_summary AS
      SELECT 
          t.name AS tenant_name,
          j."tenantId",
          j.date AS transaction_date,
          a.code AS account_code,
          a.name AS account_name,
          a.type AS account_type,
          je."baseDebit" AS debit,
          je."baseCredit" AS credit,
          CASE 
              WHEN a.type = 'REVENUE' THEN (je."baseCredit" - je."baseDebit")
              WHEN a.type = 'EXPENSE' THEN (je."baseDebit" - je."baseCredit")
              ELSE 0 
          END AS net_amount,
          j.description,
          j.reference
      FROM "journal_entries" je
      JOIN "financial_journals" j ON je."journalId" = j.id
      JOIN "accounts" a ON je."accountId" = a.id
      JOIN "tenants" t ON j."tenantId" = t.id
      WHERE a.type IN ('REVENUE', 'EXPENSE');
    `);
    console.log('✅ Created vw_pnl_summary');

    // 2. Balance Sheet View
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW vw_balance_sheet AS
      SELECT 
          t.name AS tenant_name,
          j."tenantId",
          a.code AS account_code,
          a.name AS account_name,
          a.type AS account_type,
          SUM(CASE 
              WHEN a.type = 'ASSET' THEN (je."baseDebit" - je."baseCredit")
              ELSE (je."baseCredit" - je."baseDebit")
          END) AS balance
      FROM "journal_entries" je
      JOIN "financial_journals" j ON je."journalId" = j.id
      JOIN "accounts" a ON je."accountId" = a.id
      JOIN "tenants" t ON j."tenantId" = t.id
      WHERE a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
      GROUP BY t.name, j."tenantId", a.code, a.name, a.type;
    `);
    console.log('✅ Created vw_balance_sheet');

    console.log('✨ All views created successfully.');
  } catch (error) {
    console.error('❌ Error creating views:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
