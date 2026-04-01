/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CropSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, cropCycleId?: string) {
    return this.prisma.cropSchedule.findMany({
      where: {
        tenantId,
        ...(cropCycleId ? { cropCycleId } : {}),
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const schedule = await this.prisma.cropSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!schedule) throw new NotFoundException('Schedule task not found');
    return schedule;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.cropSchedule.create({
      data: {
        ...data,
        tenantId,
        scheduledDate: new Date(data.scheduledDate as string),
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    const updateData = { ...data };
    if (data.scheduledDate) {
      updateData.scheduledDate = new Date(data.scheduledDate as string);
    }
    if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt as string);
    }

    return this.prisma.cropSchedule.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.cropSchedule.delete({
      where: { id },
    });
  }
}
