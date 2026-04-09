/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEPT_ACCOUNT_MAP: Record<string, string[]> = {
  PRODUCTION: ['1100', '5000'], // Inventory Asset, COGS
  PACK_HOUSE: ['5000', '5100'], // COGS, Payroll
  LOGISTICS: ['4100', '5100'], // Shipping Revenue, Payroll
  ADMIN: ['5100'], // Payroll & admin expenses
  SALES: ['4000', '1200'], // Sales Revenue, AR
};

@Injectable()
export class BudgetingService {
  private readonly logger = new Logger(BudgetingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Cost Centres ─────────────────────────────────────────────────────────────

  async getCostCentres(tenantId: string) {
    return (this.prisma as any).costCentre.findMany({
      where: { tenantId },
      include: {
        budgets: {
          select: {
            id: true,
            name: true,
            year: true,
            month: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCostCentre(
    tenantId: string,
    data: { name: string; type: string; description?: string },
  ) {
    return (this.prisma as any).costCentre.create({
      data: { tenantId, ...data },
    });
  }

  // ── Budgets CRUD ─────────────────────────────────────────────────────────────

  async getBudgets(tenantId: string, year?: number) {
    return (this.prisma as any).budget.findMany({
      where: { tenantId, ...(year ? { year } : {}) },
      include: {
        costCentre: true,
        lines: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'asc' }],
    });
  }

  async getBudget(tenantId: string, id: string) {
    const b = await (this.prisma as any).budget.findFirst({
      where: { id, tenantId },
      include: { costCentre: true, lines: true },
    });
    if (!b) throw new NotFoundException('Budget not found');
    return b;
  }

  async createBudget(
    tenantId: string,
    data: {
      costCentreId: string;
      name: string;
      year: number;
      month?: number;
      currency?: string;
      notes?: string;
      lines: Array<{
        accountCode: string;
        description: string;
        budgetedAmt: number;
      }>;
    },
  ) {
    const budget = await (this.prisma as any).budget.create({
      data: {
        tenantId,
        costCentreId: data.costCentreId,
        name: data.name,
        year: data.year,
        month: data.month ?? null,
        currency: data.currency ?? 'USD',
        notes: data.notes,
        lines: {
          create: data.lines.map((l) => ({
            accountCode: l.accountCode,
            description: l.description,
            budgetedAmt: l.budgetedAmt,
          })),
        },
      },
      include: { lines: true, costCentre: true },
    });
    this.logger.log(
      `Created budget "${data.name}" for ${data.year}${data.month ? `-${data.month}` : ''}`,
    );
    return budget;
  }

  async approveBudget(tenantId: string, id: string) {
    await this.getBudget(tenantId, id);
    return (this.prisma as any).budget.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  // ── Variance Report: Actual vs Budget ────────────────────────────────────────

  async getVarianceReport(tenantId: string, year: number, month?: number) {
    // 1. Get all budgets for this period
    const budgets = await (this.prisma as any).budget.findMany({
      where: { tenantId, year, ...(month !== undefined ? { month } : {}) },
      include: { lines: true, costCentre: true },
    });

    // 2. Get all journal entries for this period
    const startDate = new Date(year, (month ?? 1) - 1, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date(year + 1, 0, 0, 23, 59, 59);

    const journals = await (this.prisma as any).financialJournal.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      include: { entries: true },
    });

    // 3. Aggregate actuals by account code
    const actuals: Record<string, number> = {};
    for (const journal of journals) {
      for (const entry of journal.entries) {
        const code: string = entry.accountCode;
        const net = (entry.debit ?? 0) - (entry.credit ?? 0);
        actuals[code] = (actuals[code] ?? 0) + net;
      }
    }

    // 4. Build variance rows per budget line
    const rows = budgets.map((budget: any) => {
      const lines = budget.lines.map((line: any) => {
        const actual = actuals[line.accountCode] ?? 0;
        const variance = actual - line.budgetedAmt;
        const variancePct =
          line.budgetedAmt !== 0
            ? (variance / Math.abs(line.budgetedAmt)) * 100
            : 0;
        return {
          accountCode: line.accountCode,
          description: line.description,
          budgeted: line.budgetedAmt,
          actual,
          variance,
          variancePct: +variancePct.toFixed(1),
          status:
            Math.abs(variancePct) < 5
              ? 'ON_TRACK'
              : variance > 0
                ? 'OVER'
                : 'UNDER',
        };
      });

      const totalBudgeted = lines.reduce(
        (s: number, l: any) => s + l.budgeted,
        0,
      );
      const totalActual = lines.reduce((s: number, l: any) => s + l.actual, 0);

      return {
        budgetId: budget.id,
        budgetName: budget.name,
        costCentre: budget.costCentre?.name,
        costCentreType: budget.costCentre?.type,
        year,
        month: budget.month,
        totalBudgeted,
        totalActual,
        totalVariance: totalActual - totalBudgeted,
        lines,
      };
    });

    return {
      period: { year, month: month ?? null },
      budgetCount: budgets.length,
      rows,
      summary: {
        totalBudgeted: rows.reduce(
          (s: number, r: any) => s + r.totalBudgeted,
          0,
        ),
        totalActual: rows.reduce((s: number, r: any) => s + r.totalActual, 0),
        totalVariance: rows.reduce(
          (s: number, r: any) => s + r.totalVariance,
          0,
        ),
      },
    };
  }

  // ── Departmental P&L ─────────────────────────────────────────────────────────

  async getDepartmentalPL(tenantId: string, year: number, month?: number) {
    const startDate = new Date(year, (month ?? 1) - 1, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date(year + 1, 0, 0, 23, 59, 59);

    const journals = await (this.prisma as any).financialJournal.findMany({
      where: { tenantId, date: { gte: startDate, lte: endDate } },
      include: {
        entries: {
          include: { account: { select: { type: true, name: true } } },
        },
      },
    });

    // Aggregate by account type and code
    const byCode: Record<
      string,
      { type: string; name: string; debit: number; credit: number }
    > = {};
    for (const journal of journals) {
      for (const entry of journal.entries) {
        const code: string = entry.accountCode;
        if (!byCode[code]) {
          byCode[code] = {
            type: entry.account?.type ?? 'UNKNOWN',
            name: entry.account?.name ?? code,
            debit: 0,
            credit: 0,
          };
        }
        byCode[code].debit += entry.debit ?? 0;
        byCode[code].credit += entry.credit ?? 0;
      }
    }

    // Revenue = REVENUE accounts (net credit)
    // Expenses = EXPENSE accounts (net debit)
    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueItems: any[] = [];
    const expenseItems: any[] = [];

    for (const [code, acc] of Object.entries(byCode)) {
      const net = acc.credit - acc.debit;
      if (acc.type === 'REVENUE') {
        totalRevenue += net;
        revenueItems.push({ code, name: acc.name, amount: net });
      } else if (acc.type === 'EXPENSE') {
        const expense = acc.debit - acc.credit;
        totalExpenses += expense;
        expenseItems.push({ code, name: acc.name, amount: expense });
      }
    }

    // Map to departments using the account-to-dept map
    const deptPL: Record<string, { revenue: number; expenses: number }> = {
      PRODUCTION: { revenue: 0, expenses: 0 },
      PACK_HOUSE: { revenue: 0, expenses: 0 },
      LOGISTICS: { revenue: 0, expenses: 0 },
      ADMIN: { revenue: 0, expenses: 0 },
      SALES: { revenue: 0, expenses: 0 },
    };

    for (const [dept, codes] of Object.entries(DEPT_ACCOUNT_MAP)) {
      for (const code of codes) {
        const acc = byCode[code];
        if (!acc) continue;
        if (acc.type === 'REVENUE')
          deptPL[dept].revenue += acc.credit - acc.debit;
        if (acc.type === 'EXPENSE')
          deptPL[dept].expenses += acc.debit - acc.credit;
      }
    }

    return {
      period: { year, month: month ?? null },
      summary: {
        totalRevenue,
        totalExpenses,
        grossProfit: totalRevenue - totalExpenses,
        grossMarginPct:
          totalRevenue > 0
            ? +(((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(
                1,
              )
            : 0,
      },
      departments: Object.entries(deptPL).map(([dept, pl]) => ({
        department: dept,
        revenue: pl.revenue,
        expenses: pl.expenses,
        netProfit: pl.revenue - pl.expenses,
      })),
      revenueItems: revenueItems.sort((a, b) => b.amount - a.amount),
      expenseItems: expenseItems.sort((a, b) => b.amount - a.amount),
    };
  }

  // ── Profitability per Order ───────────────────────────────────────────────────

  async getOrderProfitability(tenantId: string, limit = 20) {
    const orders = await (this.prisma as any).order.findMany({
      where: { tenantId, status: { in: ['DELIVERED', 'COMPLETED'] } },
      include: {
        customer: { select: { name: true } },
        invoice: {
          select: { totalAmount: true, paidAmount: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return orders.map((order: any) => {
      const revenue = order.invoice?.totalAmount ?? order.totalAmount;
      // COGS approximation: 65% of revenue (until actual COGS tracking is wired)
      const estimatedCOGS = revenue * 0.65;
      const grossProfit = revenue - estimatedCOGS;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name,
        revenue,
        currency: order.invoice?.currency ?? order.currency,
        estimatedCOGS,
        grossProfit,
        grossMarginPct:
          revenue > 0 ? +((grossProfit / revenue) * 100).toFixed(1) : 0,
        paidAmount: order.invoice?.paidAmount ?? 0,
        status: order.status,
      };
    });
  }

  // ── Profitability per Variety ─────────────────────────────────────────────────

  async getVarietyProfitability(tenantId: string) {
    // Pull harvest records grouped by crop cycle variety
    const harvests = await (this.prisma as any).harvestRecord.findMany({
      where: { tenantId },
      include: {
        cropCycle: {
          include: {
            variety: { select: { id: true, name: true } },
            cropBudget: { select: { totalBudget: true } },
          },
        },
      },
    });

    const byVariety: Record<
      string,
      {
        name: string;
        totalStems: number;
        totalWeight: number;
        totalBudget: number;
        records: number;
      }
    > = {};

    for (const h of harvests) {
      const variety = h.cropCycle?.variety;
      if (!variety) continue;
      if (!byVariety[variety.id]) {
        byVariety[variety.id] = {
          name: variety.name,
          totalStems: 0,
          totalWeight: 0,
          totalBudget: 0,
          records: 0,
        };
      }
      byVariety[variety.id].totalStems += h.quantityStems ?? 0;
      byVariety[variety.id].totalWeight += h.weightKg ?? 0;
      byVariety[variety.id].totalBudget +=
        h.cropCycle?.cropBudget?.totalBudget ?? 0;
      byVariety[variety.id].records += 1;
    }

    return Object.values(byVariety)
      .map((v) => ({
        variety: v.name,
        totalStems: v.totalStems,
        totalWeightKg: v.totalWeight,
        totalCropBudget: v.totalBudget,
        costPerStem:
          v.totalStems > 0 ? +(v.totalBudget / v.totalStems).toFixed(4) : 0,
        records: v.records,
      }))
      .sort((a, b) => b.totalStems - a.totalStems);
  }
}
