/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScoutingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      zoneId: string;
      cropCycleId?: string;
      date: string | Date;
      pestDiseaseName?: string;
      severity: string;
      observations: string;
      actionTaken?: string;
      inspectorId: string;
    },
  ) {
    return (this.prisma as any).scoutingReport.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  async findAll(tenantId: string, zoneId?: string, cropCycleId?: string) {
    return (this.prisma as any).scoutingReport.findMany({
      where: {
        tenantId,
        ...(zoneId ? { zoneId } : {}),
        ...(cropCycleId ? { cropCycleId } : {}),
      },
      include: {
        zone: { select: { name: true } },
        inspector: { select: { email: true } },
        cropCycle: {
          select: { variety: { select: { name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return (this.prisma as any).scoutingReport.findFirst({
      where: { id, tenantId },
      include: {
        zone: { select: { name: true } },
        inspector: { select: { email: true } },
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).scoutingReport.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    return (this.prisma as any).scoutingReport.delete({ where: { id } });
  }
}
