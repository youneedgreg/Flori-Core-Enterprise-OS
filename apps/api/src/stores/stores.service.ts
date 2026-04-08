/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoreMovementType, StoreItemCategory } from '@prisma/client';

export interface CreateItemDto {
  name: string;
  sku: string;
  category?: StoreItemCategory;
  unit?: string;
  description?: string;
  minStockLevel?: number;
  reorderPoint?: number;
  unitCost?: number;
}

export interface RecordMovementDto {
  itemId: string;
  zoneId: string;
  type: StoreMovementType;
  quantity: number;
  reference?: string;
  toZoneId?: string;
  notes?: string;
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Farm currency ────────────────────────────────────────────────────────────

  async getFarmCurrency(tenantId: string): Promise<string> {
    const profile = await this.prisma.farmProfile.findUnique({
      where: { tenantId },
      select: { defaultCurrency: true },
    });
    return profile?.defaultCurrency ?? 'KES';
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  async getItems(tenantId: string) {
    const items = await this.prisma.storeItem.findMany({
      where: { tenantId },
      include: {
        stock: {
          include: { zone: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => {
      const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...item,
        totalStock,
        belowMin: totalStock < item.minStockLevel,
        belowReorder: totalStock < item.reorderPoint,
      };
    });
  }

  async createItem(tenantId: string, data: CreateItemDto) {
    const existing = await this.prisma.storeItem.findUnique({
      where: { tenantId_sku: { tenantId, sku: data.sku } },
    });
    if (existing)
      throw new BadRequestException(`SKU "${data.sku}" already exists`);
    return this.prisma.storeItem.create({ data: { tenantId, ...data } });
  }

  async updateItem(
    tenantId: string,
    itemId: string,
    data: Partial<CreateItemDto>,
  ) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.storeItem.update({ where: { id: itemId }, data });
  }

  // ── Stock ────────────────────────────────────────────────────────────────────

  async getStock(tenantId: string) {
    const stock = await this.prisma.storeStock.findMany({
      where: { tenantId },
      include: {
        item: true,
        zone: true,
      },
      orderBy: [{ zone: { name: 'asc' } }, { item: { name: 'asc' } }],
    });

    return stock.map((s) => ({
      ...s,
      belowMin: s.quantity < s.item.minStockLevel,
      belowReorder: s.quantity < s.item.reorderPoint,
    }));
  }

  async getLowStockAlerts(tenantId: string) {
    const items = await this.getItems(tenantId);
    return items.filter((i) => i.belowMin);
  }

  // ── Movements ────────────────────────────────────────────────────────────────

  getMovements(tenantId: string, itemId?: string) {
    return this.prisma.storeMovement.findMany({
      where: {
        tenantId,
        ...(itemId ? { itemId } : {}),
      },
      include: {
        item: true,
        zone: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async recordMovement(
    tenantId: string,
    data: RecordMovementDto,
    createdById?: string,
  ) {
    const { itemId, zoneId, type, quantity } = data;

    if (quantity <= 0)
      throw new BadRequestException('Quantity must be positive');

    const item = await this.prisma.storeItem.findFirst({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException('Store item not found');

    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, tenantId },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    return this.prisma.$transaction(async (tx) => {
      const stockRecord = await tx.storeStock.upsert({
        where: { tenantId_itemId_zoneId: { tenantId, itemId, zoneId } },
        create: { tenantId, itemId, zoneId, quantity: 0 },
        update: {},
      });

      const delta =
        type === StoreMovementType.GRN || type === StoreMovementType.RETURN
          ? quantity
          : -quantity;

      const newQty = stockRecord.quantity + delta;
      if (newQty < 0) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${stockRecord.quantity}, Requested: ${quantity}`,
        );
      }

      await tx.storeStock.update({
        where: { id: stockRecord.id },
        data: { quantity: newQty },
      });

      const movement = await tx.storeMovement.create({
        data: {
          tenantId,
          itemId,
          zoneId,
          type,
          quantity,
          reference: data.reference,
          toZoneId: data.toZoneId,
          notes: data.notes,
          createdById,
        },
        include: { item: true, zone: true },
      });

      return { movement, newStockLevel: newQty };
    });
  }
}
