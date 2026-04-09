/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HarvestRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    data: {
      cropCycleId: string;
      date: string | Date;
      quantityStems: number;
      weightKg?: number;
      rejectedStems?: number;
      notes?: string;
      supervisorId: string;
    },
  ) {
    return (this.prisma as any).harvestRecord.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  findAll(tenantId: string, cropCycleId?: string) {
    return (this.prisma as any).harvestRecord.findMany({
      where: { tenantId, ...(cropCycleId ? { cropCycleId } : {}) },
      include: {
        cropCycle: {
          select: {
            variety: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
        supervisor: { select: { email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return (this.prisma as any).harvestRecord.findFirst({
      where: { id, tenantId },
    });
  }

  update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).harvestRecord.update({ where: { id }, data });
  }

  remove(tenantId: string, id: string) {
    return (this.prisma as any).harvestRecord.delete({ where: { id } });
  }

  async getSummary(tenantId: string) {
    const records = await this.findAll(tenantId);
    const totalStems = records.reduce(
      (s: number, r: any) => s + r.quantityStems,
      0,
    );
    const totalWeight = records.reduce(
      (s: number, r: any) => s + (r.weightKg ?? 0),
      0,
    );
    const totalRejected = records.reduce(
      (s: number, r: any) => s + (r.rejectedStems ?? 0),
      0,
    );
    return {
      count: records.length,
      totalStems,
      totalWeightKg: totalWeight,
      totalRejected,
    };
  }
}
