/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SoilTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      zoneId?: string;
      testDate: string | Date;
      pHLevel?: number;
      ecLevel?: number;
      nitrogen?: number;
      phosphorus?: number;
      potassium?: number;
      soilType?: string;
      structure?: string;
      notes?: string;
    },
  ) {
    return (this.prisma as any).soilTest.create({
      data: {
        ...data,
        tenantId,
        testDate: new Date(data.testDate),
      },
    });
  }

  async findAll(tenantId: string, zoneId?: string) {
    return (this.prisma as any).soilTest.findMany({
      where: { tenantId, ...(zoneId ? { zoneId } : {}) },
      include: { zone: { select: { name: true } } },
      orderBy: { testDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return (this.prisma as any).soilTest.findFirst({
      where: { id, tenantId },
      include: { zone: { select: { name: true } } },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).soilTest.update({
      where: { id },
      data: { ...data, tenantId },
    });
  }

  async remove(tenantId: string, id: string) {
    return (this.prisma as any).soilTest.delete({ where: { id } });
  }
}
