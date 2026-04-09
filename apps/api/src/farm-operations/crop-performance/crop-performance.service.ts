/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CropPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    data: {
      cropCycleId: string;
      date: string | Date;
      growthRate?: string;
      healthScore?: number;
      budFormation?: boolean;
      observations?: string;
      recordedById: string;
    },
  ) {
    return (this.prisma as any).cropPerformanceLog.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  findAll(tenantId: string, cropCycleId?: string) {
    return (this.prisma as any).cropPerformanceLog.findMany({
      where: { tenantId, ...(cropCycleId ? { cropCycleId } : {}) },
      include: {
        cropCycle: {
          select: {
            variety: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
        recordedBy: { select: { email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return (this.prisma as any).cropPerformanceLog.findFirst({
      where: { id, tenantId },
    });
  }

  update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).cropPerformanceLog.update({
      where: { id },
      data,
    });
  }

  remove(tenantId: string, id: string) {
    return (this.prisma as any).cropPerformanceLog.delete({ where: { id } });
  }
}
