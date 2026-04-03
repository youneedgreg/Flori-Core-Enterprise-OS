/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SprayLogsService } from '../spray-logs/spray-logs.service';

@Injectable()
export class CropCyclesService {
  constructor(
    private prisma: PrismaService,
    private sprayLogsService: SprayLogsService,
  ) {}

  findAll(tenantId: string) {
    return (this.prisma as any).cropCycle.findMany({
      where: { tenantId },
      include: {
        variety: true,
        zone: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const cycle = await (this.prisma as any).cropCycle.findFirst({
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
    const variety = await (this.prisma as any).variety.findFirst({
      where: { id: data.varietyId, tenantId },
    });
    if (!variety) throw new NotFoundException('Variety not found');

    // Calculate projections
    const startDate = new Date(data.startDate as string);
    const projectedHarvestDate = variety.bloomTime
      ? new Date(
          startDate.getTime() +
            (variety.bloomTime as number) * 24 * 60 * 60 * 1000,
        )
      : null;

    return (this.prisma as any).cropCycle.create({
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
    const cycle = await this.findOne(tenantId, id);

    // If status is changing to HARVESTING or COMPLETED, check PHI
    if (
      data.status &&
      ['HARVESTING', 'COMPLETED'].includes(data.status) &&
      cycle.status !== data.status &&
      cycle.zoneId
    ) {
      const activePhis = await this.sprayLogsService.findActivePhiByZone(
        tenantId,
        cycle.zoneId,
      );

      if (activePhis.length > 0 && !data.overrideReason) {
        throw new BadRequestException({
          message: 'Harvest blocked by active PHI (Pre-Harvest Interval)',
          activePhis: activePhis.map((p: any) => ({
            chemical: p.chemicalName,
            allowedAt: p.harvestAllowedAt,
          })),
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { overrideReason: _overrideReason, ...updateData } = data;

    return (this.prisma as any).cropCycle.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return (this.prisma as any).cropCycle.delete({
      where: { id },
    });
  }

  async getForecast(tenantId: string) {
    const cycles = await (this.prisma as any).cropCycle.findMany({
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

    return cycles.map((c: any) => {
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
