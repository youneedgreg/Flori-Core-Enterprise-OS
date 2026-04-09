/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a Profit & Loss statement for a date range.
   */
  async getPnL(tenantId: string, fromDt: Date, toDt: Date) {
    // We aggregate all entries for REVENUE and EXPENSE accounts within the range
    const entries = await (this.prisma as any).journalEntry.findMany({
      where: {
        journal: {
          tenantId,
          date: { gte: fromDt, lte: toDt },
        },
        account: {
          type: { in: ['REVENUE', 'EXPENSE'] },
        },
      },
      include: {
        account: true,
      },
    });

    const report: any = {
      revenue: { total: 0, accounts: {} },
      expense: { total: 0, accounts: {} },
      netIncome: 0,
    };

    for (const entry of entries) {
      const { type, name, code } = entry.account;
      const amount =
        type === 'REVENUE'
          ? entry.baseCredit - entry.baseDebit
          : entry.baseDebit - entry.baseCredit;

      const group = type.toLowerCase();
      if (!report[group].accounts[code]) {
        report[group].accounts[code] = { code, name, total: 0 };
      }
      report[group].accounts[code].total += amount;
      report[group].total += amount;
    }

    report.netIncome = report.revenue.total - report.expense.total;

    // Convert accounts map to array for frontend
    report.revenue.accounts = Object.values(report.revenue.accounts);
    report.expense.accounts = Object.values(report.expense.accounts);

    return report;
  }

  /**
   * Generates a Balance Sheet as of a specific date.
   */
  async getBalanceSheet(tenantId: string, asOf: Date) {
    // Balance sheet is cumulative from inception until the 'asOf' date
    const entries = await (this.prisma as any).journalEntry.findMany({
      where: {
        journal: {
          tenantId,
          date: { lte: asOf },
        },
        account: {
          type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
        },
      },
      include: {
        account: true,
      },
    });

    const report: any = {
      assets: { total: 0, accounts: {} },
      liabilities: { total: 0, accounts: {} },
      equity: { total: 0, accounts: {} },
    };

    for (const entry of entries) {
      const { type, name, code } = entry.account;
      let amount = 0;

      if (type === 'ASSET') {
        amount = entry.baseDebit - entry.baseCredit;
      } else {
        // Liability or Equity
        amount = entry.baseCredit - entry.baseDebit;
      }

      // Note: mapping ASSET -> assets, LIABILITY -> liabilities, EQUITY -> equity
      const key =
        type === 'ASSET'
          ? 'assets'
          : type === 'LIABILITY'
            ? 'liabilities'
            : 'equity';

      if (!report[key].accounts[code]) {
        report[key].accounts[code] = { code, name, total: 0 };
      }
      report[key].accounts[code].total += amount;
      report[key].total += amount;
    }

    // Convert to arrays
    report.assets.accounts = Object.values(report.assets.accounts);
    report.liabilities.accounts = Object.values(report.liabilities.accounts);
    report.equity.accounts = Object.values(report.equity.accounts);

    return report;
  }

  /**
   * Generates a Tax Report (VAT Summary)
   */
  async getTaxReport(tenantId: string, fromDt: Date, toDt: Date) {
    // 1. Output VAT (Sales)
    const salesInvoices = await (this.prisma as any).invoice.findMany({
      where: {
        tenantId,
        issuedAt: { gte: fromDt, lte: toDt },
        vatAmount: { gt: 0 },
      },
      include: { taxRate: true },
    });

    // 2. Input VAT (Purchases)
    const vendorInvoices = await (this.prisma as any).vendorInvoice.findMany({
      where: {
        tenantId,
        invoiceDate: { gte: fromDt, lte: toDt },
        vatAmount: { gt: 0 },
      },
      include: { taxRate: true },
    });

    const outputVat = salesInvoices.reduce(
      (sum: number, i: any) => sum + i.vatAmount,
      0,
    );
    const inputVat = vendorInvoices.reduce(
      (sum: number, i: any) => sum + i.vatAmount,
      0,
    );

    return {
      period: { from: fromDt, to: toDt },
      summary: {
        outputVat,
        inputVat,
        netTaxPayable: outputVat - inputVat,
      },
      salesDetails: salesInvoices.map((i: any) => ({
        id: i.id,
        number: i.invoiceNumber,
        date: i.issuedAt,
        base: i.totalAmount - i.vatAmount,
        vat: i.vatAmount,
        rate: i.taxRate?.name,
      })),
      purchaseDetails: vendorInvoices.map((i: any) => ({
        id: i.id,
        number: i.invoiceNumber,
        date: i.invoiceDate,
        base: i.totalAmount - i.vatAmount,
        vat: i.vatAmount,
        rate: i.taxRate?.name,
      })),
    };
  }
}
