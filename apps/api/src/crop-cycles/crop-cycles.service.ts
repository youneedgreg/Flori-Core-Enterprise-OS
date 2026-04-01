/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CropCyclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.cropCycle.findMany({
      where: { tenantId },
      include: {
        variety: true,
        zone: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const cycle = await this.prisma.cropCycle.findFirst({
      where: { id, tenantId },
      include: {
        variety: true,
        zone: true,
        schedules: true,
      },
    });
    if (!cycle) throw new NotFoundException('Crop cycle not found');
    return cycle;
  }

  async create(tenantId: string, data: any) {
    const variety = await this.prisma.variety.findFirst({
      where: { id: data.varietyId, tenantId },
    });
    if (!variety) throw new NotFoundException('Variety not found');

    // Calculate projections
    const startDate = new Date(data.startDate as string);
    const projectedHarvestDate = variety.bloomTime
      ? new Date(startDate.getTime() + variety.bloomTime * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.cropCycle.create({
      data: {
        varietyId: data.varietyId,
        zoneId: data.zoneId,
        startDate,
        projectedHarvestDate,
        status: data.status || 'PLANNED',
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    return this.prisma.cropCycle.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.cropCycle.delete({
      where: { id },
    });
  }

  async getForecast(tenantId: string) {
    const cycles = await this.prisma.cropCycle.findMany({
      where: {
        tenantId,
        status: { in: ['PLANTED', 'GROWING'] },
        projectedHarvestDate: { not: null },
      },
      include: {
        variety: true,
        zone: true,
      },
    });

    return cycles.map((c) => {
      const area = c.zone?.areaSqm || 0;
      const targetPerSqm = c.variety?.targetStemCountPerSqm || 0;
      const projectedYield = area * targetPerSqm;

      return {
        cycleId: c.id,
        variety: c.variety.name,
        zone: c.zone?.name,
        projectedDate: c.projectedHarvestDate,
        projectedYield: projectedYield,
      };
    });
  }
}
