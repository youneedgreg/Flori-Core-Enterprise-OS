/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatDataService {
  constructor(private prisma: PrismaService) {}

  async getHarvestStats(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get daily harvest aggregates
    const records = await this.prisma.harvestRecord.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
      include: {
        cropCycle: {
          include: { variety: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date and variety to provide structured time-series data
    const grouped = records.reduce(
      (acc, curr) => {
        const dateStr = curr.date.toISOString().split('T')[0];
        const varietyName = curr.cropCycle.variety.name;
        const key = `${dateStr}_${varietyName}`;

        if (!acc[key]) {
          acc[key] = {
            date: dateStr,
            variety: varietyName,
            quantityStems: 0,
            rejectedStems: 0,
          };
        }
        acc[key].quantityStems += curr.quantityStems;
        acc[key].rejectedStems += curr.rejectedStems || 0;
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped);
  }

  async getEmployeeKPIs(
    tenantId: string,
    limit: number = 5,
    metricType?: string,
  ) {
    // Top employees by KPI score
    const kpis = await this.prisma.employeeKPI.findMany({
      where: {
        tenantId,
        ...(metricType
          ? { name: { contains: metricType, mode: 'insensitive' } }
          : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
      orderBy: { actualValue: 'desc' },
      take: limit,
    });

    return kpis.map((k) => ({
      employeeName: `${k.employee.firstName} ${k.employee.lastName}`,
      metric: k.name,
      target: k.targetValue,
      actual: k.actualValue,
      period: k.period,
    }));
  }

  async getInventoryStock(tenantId: string, searchTerm?: string) {
    const storeQuery = {
      tenantId,
      ...(searchTerm
        ? {
            item: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' as any } },
                { sku: { contains: searchTerm, mode: 'insensitive' as any } },
              ],
            },
          }
        : {}),
    };

    const flowerQuery = {
      tenantId,
      ...(searchTerm
        ? {
            variety: {
              name: { contains: searchTerm, mode: 'insensitive' as any },
            },
          }
        : {}),
    };

    const [storeStock, flowerStock] = await Promise.all([
      this.prisma.storeStock.findMany({
        where: storeQuery,
        include: { item: true, zone: { select: { name: true } } },
        take: 50,
      }),
      this.prisma.flowerInventory.findMany({
        where: flowerQuery,
        include: { variety: true },
        take: 50,
      }),
    ]);

    return {
      storeInventory: storeStock.map((s) => ({
        item: s.item.name,
        sku: s.item.sku,
        quantity: s.quantity,
        unit: s.item.unit,
        zone: s.zone.name,
      })),
      flowerInventory: flowerStock.map((f) => ({
        variety: f.variety.name,
        grade: f.grade,
        quantity: f.quantity,
      })),
    };
  }

  async getExpiringDocuments(tenantId: string, daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const [employeeDocs, trainingRecords] = await Promise.all([
      this.prisma.employeeDocument.findMany({
        where: {
          employee: { tenantId },
          expiryDate: { lte: thresholdDate, gte: new Date() },
          status: 'ACTIVE',
        },
        include: { employee: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.trainingRecord.findMany({
        where: {
          tenantId,
          expiryDate: { lte: thresholdDate, gte: new Date() },
        },
        include: {
          employee: { select: { firstName: true, lastName: true } },
          course: { select: { name: true } },
        },
      }),
    ]);

    return {
      expiringEmployeeDocuments: employeeDocs.map((d) => ({
        employee: `${d.employee.firstName} ${d.employee.lastName}`,
        type: d.type,
        expiryDate: d.expiryDate,
      })),
      expiringTrainingCertificates: trainingRecords.map((r) => ({
        employee: `${r.employee.firstName} ${r.employee.lastName}`,
        course: r.course.name,
        expiryDate: r.expiryDate,
      })),
    };
  }

  async getFinancialSummary(
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Summing revenue from journal entries (AccountType.REVENUE)
    const revenueEntries = await this.prisma.journalEntry.aggregate({
      where: {
        journal: { tenantId, date: { gte: start, lte: end } },
        account: { type: 'REVENUE' },
      },
      _sum: { credit: true, debit: true }, // Revenue usually credit
    });

    // Summing expenses
    const expenseEntries = await this.prisma.journalEntry.aggregate({
      where: {
        journal: { tenantId, date: { gte: start, lte: end } },
        account: { type: 'EXPENSE' },
      },
      _sum: { credit: true, debit: true }, // Expenses usually debit
    });

    const totalRevenue =
      (revenueEntries._sum.credit || 0) - (revenueEntries._sum.debit || 0);
    const totalExpenses =
      (expenseEntries._sum.debit || 0) - (expenseEntries._sum.credit || 0);

    return {
      period: { start: startDate, end: endDate },
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }
}
