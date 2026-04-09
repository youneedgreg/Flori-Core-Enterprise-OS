/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LandPrepService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      zoneId: string;
      activityType: string;
      date: string | Date;
      details?: string;
      amendmentsUsed?: string;
      performedById?: string;
    },
  ) {
    return (this.prisma as any).landPrepLog.create({
      data: { ...data, tenantId, date: new Date(data.date) },
    });
  }

  async findAll(tenantId: string, zoneId?: string) {
    return (this.prisma as any).landPrepLog.findMany({
      where: { tenantId, ...(zoneId ? { zoneId } : {}) },
      include: {
        zone: { select: { name: true } },
        performedBy: { select: { email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return (this.prisma as any).landPrepLog.findFirst({
      where: { id, tenantId },
      include: {
        zone: { select: { name: true } },
        performedBy: { select: { email: true } },
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return (this.prisma as any).landPrepLog.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    return (this.prisma as any).landPrepLog.delete({ where: { id } });
  }
}
