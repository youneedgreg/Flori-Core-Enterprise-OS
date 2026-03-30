import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(tenantId: string, deviceId: string, value: number, unit?: string) {
    return await (this.prisma as any).telemetryReading.create({
      data: {
        tenantId,
        deviceId,
        value,
        unit,
      },
    });
  }

  async findHistory(tenantId: string, deviceId: string, limit = 50) {
    return await (this.prisma as any).telemetryReading.findMany({
      where: { tenantId, deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getLatestReadings(tenantId: string) {
    // For each device in the tenant, get the most recent reading
    const devices = await (this.prisma as any).ioTDevice.findMany({
      where: { tenantId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        zone: {
          select: { name: true },
        },
      },
    });

    return devices.map((d: any) => ({
      deviceId: d.id,
      deviceName: d.macAddress,
      type: d.type,
      zone: d.zone?.name || 'Unassigned',
      latestValue: d.readings[0]?.value ?? null,
      unit: d.readings[0]?.unit ?? (d.type === 'TEMPERATURE' ? '°C' : '%'),
      timestamp: d.readings[0]?.timestamp || null,
    }));
  }
}
