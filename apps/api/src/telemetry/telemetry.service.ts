/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { AutomationRulesService } from '../automation-rules/automation-rules.service';
import { TelemetryGateway } from './telemetry.gateway';

/**
 * Bucket widths come from a query string, so only accept a simple
 * "<n> <unit>" form. The value is still bound as a query parameter; this
 * check exists to reject nonsense with a 400 instead of a database error.
 */
const BUCKET_INTERVAL_PATTERN = /^\d{1,4} (second|minute|hour|day)s?$/;

function normalizeBucketInterval(bucketInterval: string): string {
  const interval = bucketInterval.trim().toLowerCase();

  if (!BUCKET_INTERVAL_PATTERN.test(interval)) {
    throw new BadRequestException(
      `Invalid bucket interval: "${bucketInterval}". ` +
        'Expected a value like "5 minutes" or "1 hour".',
    );
  }

  return interval;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    private readonly automationRulesService: AutomationRulesService,
    @Inject(forwardRef(() => TelemetryGateway))
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  async record(
    tenantId: string,
    deviceId: string,
    value: number,
    unit?: string,
    sensorType = 'MOISTURE',
  ) {
    const reading = await (this.prisma as any).telemetryReading.create({
      data: {
        tenantId,
        deviceId,
        value,
        unit,
        sensorType,
      },
    });

    // Evaluate rules
    const actions = await this.automationRulesService.evaluate(
      tenantId,
      deviceId,
      sensorType,
      value,
    );

    if (actions.length > 0) {
      for (const action of actions) {
        if (action === 'NOTIFY') {
          await this.alertsService.create(tenantId, {
            deviceId,
            type: 'THRESHOLD_BREACH',
            severity: value < 30 ? 'HIGH' : 'MEDIUM',
            message: `${sensorType} alert: value ${value}${unit || ''} triggered automation.`,
          });
        }
        // Add more action handlers (e.g. IRRIGATE_ON) here
      }
    }

    // Push real-time update
    if (this.telemetryGateway?.server) {
      this.telemetryGateway.server
        .to(`telemetry-tenant-${tenantId}`)
        .emit('telemetry-update', {
          deviceId,
          sensorType,
          value,
          unit,
          timestamp: reading.timestamp,
        });
    }

    return reading;
  }

  async findHistory(tenantId: string, deviceId: string, limit = 50) {
    return await (this.prisma as any).telemetryReading.findMany({
      where: { tenantId, deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findHistoryBucketed(
    tenantId: string,
    deviceId: string,
    sensorType: string,
    bucketInterval = '1 minute',
  ) {
    const interval = normalizeBucketInterval(bucketInterval);

    // `date_bin` is standard PostgreSQL (14+) and behaves like TimescaleDB's
    // `time_bucket` when given the epoch as its origin. Using it keeps this
    // query portable to any Postgres (Neon, RDS, local) with no extension.
    return await this.prisma.$queryRaw`
      SELECT
        date_bin(${interval}::interval, "timestamp", TIMESTAMP '1970-01-01') AS bucket,
        avg(value) AS avg_value,
        max(value) AS max_value,
        min(value) AS min_value
      FROM telemetry_readings
      WHERE "tenantId" = ${tenantId}
        AND "deviceId" = ${deviceId}
        AND "sensorType" = ${sensorType}
        AND "timestamp" > now() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT 100
    `;
  }

  async getLatestReadings(tenantId: string) {
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
