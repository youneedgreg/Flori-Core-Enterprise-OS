/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SprayLogsService {
  private readonly logger = new Logger(SprayLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      zoneId: string;
      chemicalName: string;
      epaRegNo: string;
      quantity: number;
      unit: string;
      phiDays: number;
      applicatorId: string;
      appliedAt?: Date | string;
      notes?: string;
    },
  ) {
    const appliedAt = data.appliedAt ? new Date(data.appliedAt) : new Date();
    const harvestAllowedAt = new Date(
      appliedAt.getTime() + data.phiDays * 24 * 60 * 60 * 1000,
    );

    return await (this.prisma as any).sprayLog.create({
      data: {
        ...data,
        appliedAt,
        harvestAllowedAt,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, filters?: { zoneId?: string }) {
    return await (this.prisma as any).sprayLog.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        zone: { select: { name: true } },
        applicator: { select: { email: true } },
        overriddenBy: { select: { email: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findActivePhiByZone(tenantId: string, zoneId: string) {
    const now = new Date();
    return await (this.prisma as any).sprayLog.findMany({
      where: {
        tenantId,
        zoneId,
        harvestAllowedAt: {
          gt: now,
        },
      },
      orderBy: { harvestAllowedAt: 'desc' },
    });
  }

  async exportToCsv(tenantId: string) {
    const logs = await this.findAll(tenantId);
    
    const headers = [
      'Date Applied',
      'Zone',
      'Chemical Name',
      'EPA Reg No',
      'Quantity',
      'Unit',
      'PHI (Days)',
      'Harvest Allowed At',
      'Applicator',
      'Notes',
      'Override Reason'
    ];

    const rows = logs.map((log: any) => [
      log.appliedAt.toISOString(),
      log.zone.name,
      log.chemicalName,
      log.epaRegNo,
      log.quantity,
      log.unit,
      log.phiDays,
      log.harvestAllowedAt.toISOString(),
      log.applicator.email,
      log.notes || '',
      log.overrideReason || ''
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}
