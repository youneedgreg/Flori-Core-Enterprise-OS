/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PreHarvestService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    data: {
      cropCycleId: string;
      date: string | Date;
      budStage?: string;
      budSizeMm?: number;
      stemLengthCm?: number;
      stemStrength?: string;
      colorDev?: string;
      inspectorId: string;
    },
  ) {
    return (this.prisma as any).preHarvestQualityLog.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  findAll(tenantId: string, cropCycleId?: string) {
    return (this.prisma as any).preHarvestQualityLog.findMany({
      where: { tenantId, ...(cropCycleId ? { cropCycleId } : {}) },
      include: {
        cropCycle: {
          select: {
            variety: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
        inspector: { select: { email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return (this.prisma as any).preHarvestQualityLog.findFirst({
      where: { id, tenantId },
    });
  }

  update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).preHarvestQualityLog.update({
      where: { id },
      data,
    });
  }

  remove(tenantId: string, id: string) {
    return (this.prisma as any).preHarvestQualityLog.delete({ where: { id } });
  }
}
