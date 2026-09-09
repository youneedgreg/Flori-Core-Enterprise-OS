import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  findAll(
    tenantId: string,
    filters: {
      actorId?: string;
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = { tenantId };

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action)
      where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.startDate || filters.endDate) {
      const timestamp: Prisma.DateTimeFilter = {};
      if (filters.startDate) timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) timestamp.lte = new Date(filters.endDate);
      where.timestamp = timestamp;
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent 100 for the timeline view
    });
  }

  create(data: {
    tenantId: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    beforeState?: Prisma.InputJsonValue;
    afterState?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  }
}
