/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      deviceId?: string;
      zoneId?: string;
      type: string;
      severity: string;
      message: string;
    },
  ) {
    this.logger.warn(`Creating Alert for tenant ${tenantId}: ${data.message}`);
    return await (this.prisma as any).alert.create({
      data: {
        ...data,
        tenantId,
        status: 'OPEN',
      },
    });
  }

  async findAll(tenantId: string) {
    return await (this.prisma as any).alert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(tenantId: string, id: string) {
    return await (this.prisma as any).alert.update({
      where: { id, tenantId },
      data: { status: 'RESOLVED' },
    });
  }
}
