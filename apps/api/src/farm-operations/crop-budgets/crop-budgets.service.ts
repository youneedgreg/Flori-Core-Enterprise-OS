/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CropBudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      cropCycleId: string;
      laborWorkersReq?: number;
      estimatedLaborCost?: number;
      estimatedInputCost?: number;
      estimatedUtilitiesCost?: number;
      totalBudget?: number;
      notes?: string;
    },
  ) {
    return (this.prisma as any).cropBudget.create({
      data: { ...data, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).cropBudget.findMany({
      where: { tenantId },
      include: {
        cropCycle: {
          select: {
            id: true,
            startDate: true,
            variety: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCycle(tenantId: string, cropCycleId: string) {
    return (this.prisma as any).cropBudget.findFirst({
      where: { tenantId, cropCycleId },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).cropBudget.update({ where: { id }, data });
  }

  async upsert(tenantId: string, cropCycleId: string, data: any) {
    return (this.prisma as any).cropBudget.upsert({
      where: { cropCycleId },
      create: { ...data, tenantId, cropCycleId },
      update: { ...data },
    });
  }
}
