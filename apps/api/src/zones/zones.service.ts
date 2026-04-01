/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return await this.prisma.zone.findMany({
      where: {
        tenantId,
        isArchived: false,
      },
      include: {
        _count: {
          select: { devices: true },
        },
        cropCycles: {
          where: {
            status: { not: 'COMPLETED' },
          },
          include: {
            variety: true,
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id, tenantId },
      include: {
        devices: true,
        cropCycles: {
          where: {
            status: { not: 'COMPLETED' },
          },
          include: {
            variety: true,
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async create(
    tenantId: string,
    data: {
      name: string;
      areaSqm?: number;
      cropVarieties?: string[];
      plantCount?: number;
      lastWatered?: Date;
    },
  ) {
    return await this.prisma.zone.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      areaSqm?: number;
      cropVarieties?: string[];
      plantCount?: number;
      lastWatered?: Date;
    },
  ) {
    // Ensure ownership before update
    await this.findOne(tenantId, id);
    return await this.prisma.zone.update({
      where: { id },
      data,
    });
  }

  async bulkUpdateCropVarieties(
    tenantId: string,
    zoneIds: string[],
    cropVarieties: string[],
  ) {
    return await this.prisma.zone.updateMany({
      where: {
        id: { in: zoneIds },
        tenantId,
      },
      data: {
        cropVarieties,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Soft delete (archive)
    await this.findOne(tenantId, id);
    return await this.prisma.zone.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async getZoneStats(tenantId: string) {
    const zones = await this.prisma.zone.findMany({
      where: {
        tenantId,
        isArchived: false,
      },
      select: { areaSqm: true, cropVarieties: true },
    });

    const totalArea = zones.reduce(
      (acc: number, z: any) => acc + (z.areaSqm || 0),
      0,
    );
    const allCrops = (zones as { cropVarieties: string[] | null }[]).flatMap(
      (z) => z.cropVarieties || [],
    );
    const uniqueCrops = new Set(allCrops).size;

    return {
      activeZones: zones.length,
      totalArea,
      uniqueCrops,
    };
  }
}
