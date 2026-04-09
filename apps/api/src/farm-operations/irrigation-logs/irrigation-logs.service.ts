/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IrrigationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      zoneId: string;
      date: string | Date;
      durationMinutes?: number;
      volumeLiters?: number;
      method: string;
      fertigationUsed?: boolean;
      fertilizerType?: string;
      npkLevels?: string;
      applicationRate?: number;
      performedById?: string;
    },
  ) {
    return (this.prisma as any).irrigationLog.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  async findAll(tenantId: string, zoneId?: string) {
    return (this.prisma as any).irrigationLog.findMany({
      where: { tenantId, ...(zoneId ? { zoneId } : {}) },
      include: {
        zone: { select: { name: true } },
        performedBy: { select: { email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return (this.prisma as any).irrigationLog.findFirst({
      where: { id, tenantId },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).irrigationLog.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    return (this.prisma as any).irrigationLog.delete({ where: { id } });
  }

  async getStats(tenantId: string, zoneId?: string) {
    const logs = await this.findAll(tenantId, zoneId);
    const total = logs.reduce(
      (sum: number, l: any) => sum + (l.volumeLiters ?? 0),
      0,
    );
    const fertigations = logs.filter((l: any) => l.fertigationUsed).length;
    return {
      count: logs.length,
      totalVolumeLiters: total,
      fertigationCount: fertigations,
    };
  }
}
