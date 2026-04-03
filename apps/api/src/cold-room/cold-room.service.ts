/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ColdRoomEventType } from '@prisma/client';

@Injectable()
export class ColdRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    tenantId: string,
    userId: string,
    data: {
      batchId: string;
      zoneId: string;
      type: ColdRoomEventType;
      quantity: number;
    },
  ) {
    const batch = await (this.prisma as any).flowerBatch.findUnique({
      where: { id: data.batchId, tenantId },
    });

    if (!batch) throw new NotFoundException('Batch not found');

    // FIFO Warning Logic (only for CHECK_OUT)
    let fifoWarning = null;
    if (data.type === 'CHECK_OUT') {
      const olderBatches = await (this.prisma as any).flowerBatch.findMany({
        where: {
          tenantId,
          varietyId: batch.varietyId,
          status: 'IN_COLD_STORAGE',
          createdAt: { lt: batch.createdAt },
          id: { not: batch.id },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (olderBatches.length > 0) {
        fifoWarning = `FIFO Alert: ${olderBatches.length} older batch(es) of this variety are still in storage. First in: ${olderBatches[0].batchNumber}`;
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const event = await (tx as any).coldRoomEvent.create({
        data: {
          ...data,
          tenantId,
          userId,
        },
      });

      // Update Batch Status
      await (tx as any).flowerBatch.update({
        where: { id: data.batchId },
        data: {
          status: data.type === 'CHECK_IN' ? 'IN_COLD_STORAGE' : 'GRADED',
        },
      });

      return { event, fifoWarning };
    });
  }

  async getInventory(tenantId: string, zoneId?: string) {
    const where: any = { tenantId, status: 'IN_COLD_STORAGE' };
    if (zoneId) {
      where.coldRoomEvents = {
        some: { zoneId, type: 'CHECK_IN' },
      };
    }

    const batches = await (this.prisma as any).flowerBatch.findMany({
      where,
      include: {
        variety: true,
        cropCycle: {
          include: { zone: true },
        },
        coldRoomEvents: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: { zone: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // FIFO Order
    });

    return batches.map((b: any) => ({
      ...b,
      daysInStorage: Math.floor(
        (Date.now() -
          new Date(b.coldRoomEvents[0]?.timestamp || b.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      currentZone: b.coldRoomEvents[0]?.zone?.name || 'Unknown',
    }));
  }

  async getZoneTelemetry(tenantId: string, zoneId: string) {
    const bucketInterval = '5 minutes';
    return await this.prisma.$queryRawUnsafe(`
      SELECT 
        time_bucket('${bucketInterval}', timestamp) AS bucket,
        avg(CASE WHEN "sensorType" = 'TEMPERATURE' THEN value END) as temp,
        avg(CASE WHEN "sensorType" = 'HUMIDITY' THEN value END) as humidity
      FROM telemetry_readings
      WHERE "tenantId" = '${tenantId}'
        AND "deviceId" IN (SELECT id FROM iot_devices WHERE "zoneId" = '${zoneId}')
        AND timestamp > now() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket ASC;
    `);
  }

  async getColdRooms(tenantId: string) {
    return await (this.prisma as any).zone.findMany({
      where: { tenantId, type: 'COLD_ROOM' },
      include: {
        devices: {
          include: {
            readings: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }
}
