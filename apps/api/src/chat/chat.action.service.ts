import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatActionService {
  constructor(private prisma: PrismaService) {}

  async executeAction(
    tenantId: string,
    userId: string,
    actionType: string,
    payload: any,
  ) {
    switch (actionType) {
      case 'CREATE_GRN':
        return this.createGrn(tenantId, userId, payload);
      case 'CREATE_SPRAY_LOG':
        return this.createSprayLog(tenantId, userId, payload);
      case 'IMPORT_INVENTORY':
        return this.importInventory(tenantId, userId, payload);
      default:
        throw new HttpException(`Unknown action type: ${actionType}`, HttpStatus.BAD_REQUEST);
    }
  }

  private async createGrn(tenantId: string, userId: string, payload: any) {
    // payload should have vendorName, items: { sku, quantity, unitPrice }[]
    const { vendorName, items } = payload;
    
    // Find or create vendor
    let vendor = await this.prisma.vendor.findFirst({
      where: { tenantId, name: { contains: vendorName, mode: 'insensitive' } }
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.create({
        data: { tenantId, name: vendorName, email: 'unknown@example.com' }
      });
    }

    // Auto create PO if not exists
    const poNumber = `PO-${Date.now()}`;
    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        poNumber,
        vendorId: vendor.id,
        status: 'RECEIVED',
        totalAmount: items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0),
        createdById: userId,
      }
    });

    // Create GRN
    const grnNumber = `GRN-${Date.now()}`;
    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        tenantId,
        poId: po.id,
        grnNumber,
        vendorId: vendor.id,
        receivedById: userId,
        status: 'RECONCILED',
      }
    });

    for (const item of items) {
      // Find item
      let storeItem = await this.prisma.storeItem.findUnique({
        where: { tenantId_sku: { tenantId, sku: item.sku } }
      });
      if (!storeItem) {
        storeItem = await this.prisma.storeItem.create({
          data: { tenantId, name: item.sku, sku: item.sku, category: 'OTHER' }
        });
      }

      await this.prisma.grnItem.create({
        data: {
          grnId: grn.id,
          itemId: storeItem.id,
          quantityReceived: item.quantity,
          unitPriceReceived: item.unitPrice,
          totalPriceReceived: item.quantity * item.unitPrice,
        }
      });
    }

    return { success: true, message: `Created GRN ${grnNumber} from delivery note.` };
  }

  private async createSprayLog(tenantId: string, userId: string, payload: any) {
    const { chemicalName, zoneId, phiDays, quantity, unit, date } = payload;
    
    await this.prisma.sprayLog.create({
      data: {
        tenantId,
        zoneId: zoneId || 'default-zone', // Needs proper resolution
        chemicalName,
        epaRegNo: 'UNKNOWN',
        quantity,
        unit: unit || 'L',
        phiDays: phiDays || 0,
        applicatorId: userId,
        appliedAt: new Date(date),
        harvestAllowedAt: new Date(new Date(date).getTime() + (phiDays || 0) * 24 * 60 * 60 * 1000),
      }
    });

    return { success: true, message: `Imported spray log for ${chemicalName}` };
  }

  private async importInventory(tenantId: string, userId: string, payload: any) {
    const { items } = payload; // { sku, name, category, quantity, unitCost }[]
    let imported = 0;
    
    for (const item of items) {
      if (!item.sku || !item.name) continue;
      
      let storeItem = await this.prisma.storeItem.findUnique({
        where: { tenantId_sku: { tenantId, sku: item.sku } }
      });

      if (!storeItem) {
        storeItem = await this.prisma.storeItem.create({
          data: {
            tenantId,
            sku: item.sku,
            name: item.name,
            category: item.category || 'OTHER',
            unitCost: item.unitCost || 0,
          }
        });
      }

      imported++;
    }

    return { success: true, message: `Imported ${imported} items into inventory.` };
  }
}
