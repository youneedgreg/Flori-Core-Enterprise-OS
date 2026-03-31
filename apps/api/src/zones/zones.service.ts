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
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id, tenantId },
      include: { devices: true },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async create(
    tenantId: string,
    data: { name: string; areaSqm?: number; cropVarieties?: string[] },
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
    data: { name?: string; areaSqm?: number; cropVarieties?: string[] },
  ) {
    // Ensure ownership before update
    await this.findOne(tenantId, id);
    return await this.prisma.zone.update({
      where: { id },
      data,
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
