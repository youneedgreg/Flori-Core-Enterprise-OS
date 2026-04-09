/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  // Our default universal chart of accounts
  private readonly DEFAULT_COA = [
    { code: '1000', name: 'Operating Cash', type: 'ASSET' as const },
    { code: '1100', name: 'Inventory Asset', type: 'ASSET' as const },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET' as const },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' as const },
    { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY' as const },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY' as const },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as const },
    { code: '4100', name: 'Shipping Revenue', type: 'REVENUE' as const },
    {
      code: '5000',
      name: 'Cost of Goods Sold (COGS)',
      type: 'EXPENSE' as const,
    },
    { code: '5100', name: 'Payroll Expense', type: 'EXPENSE' as const },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getAccounts(tenantId: string): Promise<any[]> {
    const accounts = await (this.prisma as any).account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });

    if (accounts.length === 0) {
      this.logger.log(
        `No accounts found for ${tenantId}. Seeding default Chart of Accounts.`,
      );
      await this.seedDefaultAccounts(tenantId);
      return this.getAccounts(tenantId);
    }

    return accounts;
  }

  async seedDefaultAccounts(tenantId: string) {
    for (const acc of this.DEFAULT_COA) {
      try {
        await (this.prisma as any).account.create({
          data: {
            tenantId,
            code: acc.code,
            name: acc.name,
            type: acc.type,
          },
        });
      } catch (e) {
        // Exists
      }
    }
  }

  async createAccount(
    tenantId: string,
    data: { code: string; name: string; type: string; currency?: string },
  ) {
    return await (this.prisma as any).account.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async getAccountByCode(tenantId: string, code: string) {
    return await (this.prisma as any).account.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
  }
}
