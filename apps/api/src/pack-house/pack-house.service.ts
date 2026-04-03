/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QCGrade } from '@prisma/client';

@Injectable()
export class PackHouseService {
  constructor(private prisma: PrismaService) {}

  async createIntake(tenantId: string, data: { cropCycleId: string; quantity: number }) {
    const cropCycle = await this.prisma.cropCycle.findUnique({
      where: { id: data.cropCycleId },
      include: { variety: true },
    });

    if (!cropCycle || cropCycle.tenantId !== tenantId) {
      throw new NotFoundException('Crop cycle not found');
    }

    // Auto-generate batch number: FLR-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.flowerBatch.count({
      where: {
        batchNumber: { startsWith: `FLR-${dateStr}` },
      },
    });
    const batchNumber = `FLR-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;

    return await this.prisma.flowerBatch.create({
      data: {
        tenantId,
        cropCycleId: data.cropCycleId,
        varietyId: cropCycle.varietyId,
        batchNumber,
        quantityIntake: data.quantity,
        status: 'QC_PENDING',
      },
    });
  }

  async submitQC(tenantId: string, batchId: string, data: {
    stemLength: number;
    bloomStage: string;
    headDiameter: number;
    defects: string[];
    notes?: string;
  }) {
    const batch = await this.prisma.flowerBatch.findUnique({
      where: { id: batchId },
      include: { variety: true },
    });

    if (!batch || batch.tenantId !== tenantId) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.status === 'QC_COMPLETED' || batch.status === 'REJECTED' || batch.status === 'INVENTORY_ADDED') {
      throw new BadRequestException('Batch already processed');
    }

    const assignedGrade = this.calculateGrade(data.stemLength, batch.variety.targetStemLength || 0, data.defects);

    return await this.prisma.$transaction(async (tx) => {
      const qcLog = await tx.qCLog.create({
        data: {
          tenantId,
          batchId,
          stemLength: data.stemLength,
          bloomStage: data.bloomStage,
          headDiameter: data.headDiameter,
          defects: data.defects as any,
          assignedGrade,
          notes: data.notes,
        },
      });

      const newStatus = assignedGrade === 'REJECT' ? 'REJECTED' : 'QC_COMPLETED';

      await tx.flowerBatch.update({
        where: { id: batchId },
        data: { status: newStatus },
      });

      if (assignedGrade !== 'REJECT') {
        // Update flower inventory
        await tx.flowerInventory.upsert({
          where: {
            tenantId_varietyId_grade: {
              tenantId,
              varietyId: batch.varietyId,
              grade: assignedGrade,
            },
          },
          update: {
            quantity: { increment: batch.quantityIntake },
          },
          create: {
            tenantId,
            varietyId: batch.varietyId,
            grade: assignedGrade,
            quantity: batch.quantityIntake,
          },
        });

        await tx.flowerBatch.update({
          where: { id: batchId },
          data: { status: 'INVENTORY_ADDED' },
        });
      }

      return { qcLog, assignedGrade };
    });
  }

  private calculateGrade(length: number, target: number, defects: string[]): QCGrade {
    const hasCriticalDefect = defects.some(d => 
      ['Botrytis', 'Thrips Damage', 'Bent Neck', 'Mealybug', 'Powdery Mildew'].includes(d)
    );

    if (hasCriticalDefect) return 'REJECT';

    // Simple grading logic based on length
    // target is in cm, e.g. 60cm
    if (length >= target - 5 && defects.length === 0) return 'A';
    if (length >= target - 10 && defects.length <= 2) return 'B';
    return 'C';
  }

  async getInventory(tenantId: string) {
    return await this.prisma.flowerInventory.findMany({
      where: { tenantId },
      include: { variety: true },
    });
  }

  async getBatches(tenantId: string) {
    return await this.prisma.flowerBatch.findMany({
      where: { tenantId },
      include: { variety: true, cropCycle: { include: { zone: true } }, qcLogs: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatch(tenantId: string, id: string) {
    const batch = await this.prisma.flowerBatch.findFirst({
      where: { id, tenantId },
      include: { variety: true, cropCycle: { include: { zone: true } }, qcLogs: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }
}
