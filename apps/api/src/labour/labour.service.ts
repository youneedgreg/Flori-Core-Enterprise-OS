/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabourService {
  private readonly logger = new Logger(LabourService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      userId: string;
      zoneId: string;
      taskType: string;
      hours: number;
      stemsCut?: number;
      gpsLocation?: any;
    },
  ) {
    return await (this.prisma as any).labourLog.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: { userId?: string; zoneId?: string },
  ) {
    return await (this.prisma as any).labourLog.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        user: { select: { email: true } },
        zone: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getProductivityStats(tenantId: string) {
    // Stems cut per worker per day
    const logs = await (this.prisma as any).labourLog.findMany({
      where: {
        tenantId,
        stemsCut: { not: null },
      },
      include: {
        user: { select: { email: true } },
      },
    });

    const stats: Record<string, any> = {};

    logs.forEach((log: any) => {
      const date = log.timestamp.toISOString().split('T')[0];
      const key = `${log.user.email}_${date}`;
      if (!stats[key]) {
        stats[key] = {
          worker: log.user.email,
          date,
          stemsCut: 0,
        };
      }
      stats[key].stemsCut += log.stemsCut || 0;
    });

    return Object.values(stats);
  }

  async getHoursForPayroll(
    tenantId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const logs = await (this.prisma as any).labourLog.findMany({
      where: {
        tenantId,
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { hours: true },
    });

    return logs.reduce((acc: number, log: any) => acc + log.hours, 0);
  }
}
