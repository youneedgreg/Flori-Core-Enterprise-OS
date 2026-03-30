/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return await (this.prisma as any).zone.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const zone = await (this.prisma as any).zone.findFirst({
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
    return await (this.prisma as any).zone.create({
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
    return await (this.prisma as any).zone.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    // Ensure ownership before deletion
    await this.findOne(tenantId, id);
    return await (this.prisma as any).zone.delete({
      where: { id },
    });
  }

  async getZoneStats(tenantId: string) {
    const zones = await (this.prisma as any).zone.findMany({
      where: { tenantId },
      select: { areaSqm: true, cropVarieties: true },
    });

    const totalArea = zones.reduce(
      (acc: number, z: any) => acc + (z.areaSqm || 0),
      0,
    );
    const uniqueCrops = new Set(
      zones.flatMap((z: any) => z.cropVarieties || []),
      .size;

    return {
      activeZones: zones.length,
      totalArea,
      uniqueCrops,
    };
  }
}
