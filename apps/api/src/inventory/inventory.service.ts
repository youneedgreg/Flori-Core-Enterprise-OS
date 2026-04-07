/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QCGrade, BoxStatus, WastageReason } from '@prisma/client';

export interface BoxSpec {
  varietyId: string;
  grade: QCGrade;
  bunchSize: number;
  bunchesPerBox: number;
}

export interface ATPItem extends BoxSpec {
  varietyName: string;
  physicalStock: number; // Boxes in PACKED or IN_COLD_STORAGE
  committed: number; // Boxes in PENDING/PACKING orders (not yet allocated)
  allocated: number; // Boxes with status ALLOCATED
  atp: number; // Physical - Committed
}

export interface WastageDto {
  varietyId: string;
  grade: QCGrade;
  quantity: number; // stems
  reason: WastageReason;
  boxId?: string; // If wasting a specific packed box
  notes?: string;
  costPerStem?: number; // Override default if provided
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates real-time Available-to-Promise (ATP) for all variety/grade/spec combinations.
   */
  async getFinishedGoodsATP(tenantId: string): Promise<ATPItem[]> {
    // 1. Get all packed boxes in physical stock (not shipped/wasted)
    const packedBoxes = await this.prisma.packedBox.findMany({
      where: {
        tenantId,
        status: {
          in: [
            BoxStatus.PACKED,
            BoxStatus.IN_COLD_STORAGE,
            BoxStatus.ALLOCATED,
          ],
        },
      },
      include: { variety: true },
    });

    // Group physical stock and allocated by spec
    const specsMap = new Map<string, ATPItem>();

    packedBoxes.forEach((box) => {
      const key = `${box.varietyId}-${box.grade}-${box.bunchSize}-${box.bunchesPerBox}`;
      if (!specsMap.has(key)) {
        specsMap.set(key, {
          varietyId: box.varietyId,
          varietyName: box.variety.name,
          grade: box.grade,
          bunchSize: box.bunchSize,
          bunchesPerBox: box.bunchesPerBox,
          physicalStock: 0,
          committed: 0,
          allocated: 0,
          atp: 0,
        });
      }

      const item = specsMap.get(key)!;
      if (box.status === BoxStatus.ALLOCATED) {
        item.allocated++;
      } else {
        item.physicalStock++;
      }
    });

    // 2. Get committed quantities from pending orders
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PACKING'] },
      },
    });

    pendingOrders.forEach((order) => {
      const items = (order.items as any[]) || [];
      items.forEach((orderItem: any) => {
        // We assume order items have the same spec fields
        if (
          orderItem.varietyId &&
          orderItem.grade &&
          orderItem.bunchSize &&
          orderItem.bunchesPerBox &&
          orderItem.quantity
        ) {
          const key = `${orderItem.varietyId as string}-${orderItem.grade as string}-${orderItem.bunchSize as string}-${orderItem.bunchesPerBox as string}`;

          if (!specsMap.has(key)) {
            // Even if we have zero physical stock, we might have commitments
            // We'll need a variety name though. Let's skip if not in inventory for now
            // or handle it by fetching varieties if needed.
            // For simplicity, we only show ATP for what we have or is promised.
            return;
          }

          const item = specsMap.get(key)!;

          // "Committed" is the total quantity requested across all orders.
          // However, some might already be "Allocated" with specific box IDs.
          // In our smart logic: ATP = Physical - (Total Requested - Already Allocated Boxes).
          // We'll just track total requested here for "committed".
          item.committed += Number(orderItem.quantity);
        }
      });
    });

    // 3. Final calculation: ATP = PhysicalStock - (Committed - Allocated)
    // Because Committed includes what is already Allocated.
    // If I have 10 physical boxes and 10 requested, but 5 are already allocated,
    // I need 5 more from the physical stock. So ATP = 10 - (10 - 5) = 5.
    return Array.from(specsMap.values()).map((item) => ({
      ...item,
      atp: item.physicalStock - (item.committed - item.allocated),
    }));
  }

  /**
   * Records wastage and updates inventory/boxes accordingly.
   */
  async recordWastage(tenantId: string, data: WastageDto, userId?: string) {
    const {
      varietyId,
      grade,
      quantity,
      reason,
      boxId,
      notes,
      costPerStem: overrideCost,
    } = data;

    // 1. Get Variety to fetch default cost
    const variety = await this.prisma.variety.findFirst({
      where: { id: varietyId, tenantId },
    });
    if (!variety) throw new NotFoundException('Variety not found');

    const costPerStem = overrideCost ?? variety.defaultCostPerStem ?? 0;
    const costImpact = quantity * costPerStem;

    return await this.prisma.$transaction(async (tx) => {
      // 2. Create Wastage Log
      const log = await tx.wastageLog.create({
        data: {
          tenantId,
          varietyId,
          grade,
          quantity,
          reason,
          costPerStem,
          costImpact,
          notes,
          recordedById: userId,
        },
      });

      // 3. Adjust Inventory
      if (boxId) {
        // Wasting a specific packed box
        const box = await tx.packedBox.findFirst({
          where: { boxId, tenantId },
        });
        if (!box) throw new NotFoundException('Packed box not found');

        await tx.packedBox.update({
          where: { id: box.id },
          data: { status: BoxStatus.WASTED },
        });
      } else {
        // Wasting raw stems from inventory
        const inventory = await tx.flowerInventory.findUnique({
          where: { tenantId_varietyId_grade: { tenantId, varietyId, grade } },
        });

        if (inventory) {
          if (inventory.quantity < quantity) {
            throw new BadRequestException(
              'Insufficient inventory to record wastage',
            );
          }
          await tx.flowerInventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: quantity } },
          });
        }
      }

      return log;
    });
  }

  /**
   * Retrieves wastage logs for a tenant.
   */
  async getWastageLogs(tenantId: string) {
    return await this.prisma.wastageLog.findMany({
      where: { tenantId },
      include: { variety: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Allocates specific boxes to an order.
   */
  async allocateBoxesToOrder(
    tenantId: string,
    orderId: string,
    boxIds: string[],
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const boxId of boxIds) {
        const box = await tx.packedBox.findFirst({
          where: { boxId, tenantId },
        });
        if (!box) throw new NotFoundException(`Box ${boxId} not found`);
        if (
          box.status === BoxStatus.SHIPPED ||
          box.status === BoxStatus.DELIVERED
        ) {
          throw new BadRequestException(
            `Box ${boxId} already shipped/delivered`,
          );
        }

        const updated = await tx.packedBox.update({
          where: { id: box.id },
          data: {
            status: BoxStatus.ALLOCATED,
            orderId,
          },
        });
        results.push(updated);
      }
      return results;
    });
  }
}
