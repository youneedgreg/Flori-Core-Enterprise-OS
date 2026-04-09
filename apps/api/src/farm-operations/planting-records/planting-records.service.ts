/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlantingRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      cropCycleId: string;
      date: string | Date;
      supplier?: string;
      lotNumber?: string;
      spacing?: string;
      density?: number;
      totalPlants: number;
      notes?: string;
    },
  ) {
    return (this.prisma as any).plantingRecord.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).plantingRecord.findMany({
      where: { tenantId },
      include: {
        cropCycle: {
          select: {
            id: true,
            startDate: true,
            variety: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByCycle(tenantId: string, cropCycleId: string) {
    return (this.prisma as any).plantingRecord.findFirst({
      where: { tenantId, cropCycleId },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).plantingRecord.update({ where: { id }, data });
  }

  async upsert(tenantId: string, cropCycleId: string, data: any) {
    return (this.prisma as any).plantingRecord.upsert({
      where: { cropCycleId },
      create: { ...data, tenantId, cropCycleId, date: new Date(data.date) },
      update: { ...data, date: data.date ? new Date(data.date) : undefined },
    });
  }
}
