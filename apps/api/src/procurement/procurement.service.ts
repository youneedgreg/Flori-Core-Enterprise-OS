/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../communications/notification.service';
import {
  PurchaseRequestStatus,
  PurchaseOrderStatus,
  RfqStatus,
  RfqResponseStatus,
  PerformanceMetricType,
} from '@prisma/client';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateVendorDto {
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  taxPin?: string;
  bankDetails?: object;
  notes?: string;
  website?: string;
  certifications?: string[];
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  isActive?: boolean;
}

export interface ApprovePrDto {
  approvedQty?: number; // override suggested qty; omit to use suggestedQty
  vendorId?: string; // override vendor if not set on item
  expectedDelivery?: string; // ISO date string
  notes?: string;
}

export interface RejectPrDto {
  rejectionReason: string;
}

export interface CreateManualPrDto {
  itemId: string;
  vendorId?: string;
  suggestedQty: number;
  notes?: string;
}

export interface CreateRFQDto {
  items: Array<{ itemId: string; quantity: number; notes?: string }>;
  notes?: string;
  expiryDate?: string;
  vendorIds: string[]; // Vendors to send the RFQ to
}

export interface SubmitRFQResponseDto {
  unitPrice: number;
  deliveryDays?: number;
  validUntil?: string;
  notes?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Vendors ─────────────────────────────────────────────────────────────────

  getVendors(tenantId: string) {
    return this.prisma.vendor.findMany({
      where: { tenantId },
      include: {
        _count: { select: { purchaseOrders: true, storeItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createVendor(tenantId: string, data: CreateVendorDto) {
    return this.prisma.vendor.create({ data: { tenantId, ...data } });
  }

  async updateVendor(
    tenantId: string,
    vendorId: string,
    data: UpdateVendorDto,
  ) {
    const v = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!v) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({ where: { id: vendorId }, data });
  }

  async deleteVendor(tenantId: string, vendorId: string) {
    const v = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!v) throw new NotFoundException('Vendor not found');
    // Soft-delete: set isActive = false
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });
  }

  // ── Purchase Requests ────────────────────────────────────────────────────────

  getPurchaseRequests(tenantId: string, status?: PurchaseRequestStatus) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        item: true,
        vendor: true,
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createManualPurchaseRequest(
    tenantId: string,
    userId: string,
    data: CreateManualPrDto,
  ) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id: data.itemId, tenantId },
    });
    if (!item) throw new NotFoundException('Store item not found');

    const totalStock = await this.getTotalStock(tenantId, data.itemId);
    const unitPrice = item.lastUnitPrice ?? item.unitCost;

    return this.prisma.purchaseRequest.create({
      data: {
        tenantId,
        generatedBy: userId,
        itemId: data.itemId,
        vendorId: data.vendorId ?? item.preferredVendorId,
        currentStock: totalStock,
        reorderPoint: item.reorderPoint,
        suggestedQty: data.suggestedQty,
        lastUnitPrice: unitPrice,
        estimatedTotal: data.suggestedQty * unitPrice,
        notes: data.notes,
      },
      include: { item: true, vendor: true },
    });
  }

  async approvePurchaseRequest(
    tenantId: string,
    prId: string,
    userId: string,
    dto: ApprovePrDto,
    emailService: { sendEmail: (args: any) => Promise<any> },
  ) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: prId, tenantId },
      include: { item: true, vendor: true },
    });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException(`PR is already ${pr.status}`);
    }

    const effectiveVendorId = dto.vendorId ?? pr.vendorId;
    if (!effectiveVendorId) {
      throw new BadRequestException(
        'No vendor assigned. Please select a vendor before approving.',
      );
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: effectiveVendorId, tenantId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const approvedQty = dto.approvedQty ?? pr.suggestedQty;
    const unitPrice = pr.lastUnitPrice ?? 0;
    const totalAmount = approvedQty * unitPrice;

    // Generate PO number: PO-YYYY-NNNNN
    const poNumber = await this.generatePoNumber(tenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update PR status
      const updatedPr = await tx.purchaseRequest.update({
        where: { id: prId },
        data: {
          status: PurchaseRequestStatus.CONVERTED,
          approvedQty,
          approvedById: userId,
          approvedAt: new Date(),
          vendorId: effectiveVendorId,
        },
      });

      // Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          poNumber,
          vendorId: effectiveVendorId,
          purchaseRequestId: prId,
          totalAmount,
          notes: dto.notes,
          createdById: userId,
          expectedDelivery: dto.expectedDelivery
            ? new Date(dto.expectedDelivery)
            : undefined,
          items: {
            create: {
              itemId: pr.itemId,
              quantity: approvedQty,
              unitPrice,
              totalPrice: totalAmount,
            },
          },
        },
        include: { items: { include: { item: true } }, vendor: true },
      });

      return { pr: updatedPr, po };
    });

    // Send email to vendor
    try {
      await emailService.sendEmail({
        to: vendor.email,
        subject: `Purchase Order ${poNumber} from Flori Farm`,
        html: this.buildVendorPOEmail(result.po, vendor),
        tenantId,
        entityType: 'purchase_order',
        entityId: result.po.id,
      });

      // Mark email sent
      await this.prisma.purchaseOrder.update({
        where: { id: result.po.id },
        data: {
          status: PurchaseOrderStatus.SENT,
          vendorEmailSentAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to email vendor for PO ${poNumber}:`, err);
      // Non-fatal: PO is still created
    }

    return result;
  }

  async rejectPurchaseRequest(
    tenantId: string,
    prId: string,
    userId: string,
    dto: RejectPrDto,
  ) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: prId, tenantId },
    });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException(`PR is already ${pr.status}`);
    }

    return this.prisma.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: PurchaseRequestStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
        rejectedById: userId,
        rejectedAt: new Date(),
      },
    });
  }

  // ── Purchase Orders ──────────────────────────────────────────────────────────

  getPurchaseOrders(tenantId: string, status?: PurchaseOrderStatus) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        vendor: true,
        items: { include: { item: true } },
        purchaseRequest: { select: { id: true, generatedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePoStatus(
    tenantId: string,
    poId: string,
    status: PurchaseOrderStatus,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status },
    });
  }

  // ── RFQs ────────────────────────────────────────────────────────────────────

  async getRFQs(tenantId: string) {
    return this.prisma.rfq.findMany({
      where: { tenantId },
      include: {
        responses: { include: { vendor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRFQ(tenantId: string, dto: CreateRFQDto) {
    return this.prisma.$transaction(async (tx) => {
      const rfq = await tx.rfq.create({
        data: {
          tenantId,
          status: RfqStatus.SENT,
          items: dto.items,
          notes: dto.notes,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        },
      });

      // Initialize empty responses for each vendor
      await tx.rfqResponse.createMany({
        data: dto.vendorIds.map((vId) => ({
          tenantId,
          rfqId: rfq.id,
          vendorId: vId,
          unitPrice: 0,
          totalAmount: 0,
          status: RfqResponseStatus.PENDING,
        })),
      });

      return rfq;
    });
  }

  async submitRFQResponse(
    tenantId: string,
    rfqId: string,
    vendorId: string,
    dto: SubmitRFQResponseDto,
  ) {
    const response = await this.prisma.rfqResponse.findFirst({
      where: { rfqId, vendorId, tenantId },
      include: { rfq: true },
    });
    if (!response) throw new NotFoundException('RFQ target not found');

    // Calculate total amount based on RFQ items (simplified for first item for now)
    // In a real scenario, we'd sum all items.
    const items = response.rfq.items as any[];
    const firstQty = items[0]?.quantity ?? 1;

    return this.prisma.rfqResponse.update({
      where: { id: response.id },
      data: {
        unitPrice: dto.unitPrice,
        totalAmount: dto.unitPrice * firstQty,
        deliveryDays: dto.deliveryDays,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        status: RfqResponseStatus.PENDING, // Mark as submitted but waiting review
      },
    });
  }

  async acceptRFQResponse(
    tenantId: string,
    rfqId: string,
    responseId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const resp = await tx.rfqResponse.findFirst({
        where: { id: responseId, rfqId, tenantId },
        include: { vendor: true, rfq: true },
      });
      if (!resp) throw new NotFoundException('Response not found');

      // 1. Mark RFQ as CLOSED
      await tx.rfq.update({
        where: { id: rfqId },
        data: { status: RfqStatus.CLOSED },
      });

      // 2. Mark this response as ACCEPTED, others REJECTED
      await tx.rfqResponse.update({
        where: { id: responseId },
        data: { status: RfqResponseStatus.ACCEPTED },
      });
      await tx.rfqResponse.updateMany({
        where: { rfqId, id: { not: responseId } },
        data: { status: RfqResponseStatus.REJECTED },
      });

      // 3. Auto-generate Purchase Order
      const poNumber = await this.generatePoNumber(tenantId);
      const items = resp.rfq.items as any[];

      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          poNumber,
          vendorId: resp.vendorId,
          totalAmount: resp.totalAmount,
          notes: `Generated from RFQ decision. RFQ Notes: ${resp.rfq.notes ?? 'None'}`,
          createdById: userId,
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: resp.unitPrice, // Simplified: assuming same unit price for all items in RFQ for now
              totalPrice: item.quantity * resp.unitPrice,
            })),
          },
        },
      });

      return { po, response: resp };
    });
  }

  // ── Vendor Analytics ────────────────────────────────────────────────────────

  async getVendorPerformance(tenantId: string, vendorId: string) {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { vendorId, tenantId, status: PurchaseOrderStatus.RECEIVED },
      select: { expectedDelivery: true, updatedAt: true },
    });

    // OTD (On-Time Delivery) Score
    let onTime = 0;
    pos.forEach((po) => {
      if (po.expectedDelivery && po.updatedAt <= po.expectedDelivery) {
        onTime++;
      }
    });
    const otdScore = pos.length > 0 ? (onTime / pos.length) * 100 : 100;

    // Reliability Score based on performance logs
    const logs = await this.prisma.vendorPerformanceLog.findMany({
      where: { vendorId, tenantId },
      orderBy: { recordedAt: 'desc' },
    });

    const qualityComplaints = logs.filter(
      (l) => l.type === PerformanceMetricType.QUALITY_COMPLAINT,
    ).length;

    return {
      otdScore,
      totalOrders: pos.length,
      qualityComplaints,
      history: logs,
    };
  }

  async getVendorPricingTrend(
    tenantId: string,
    vendorId: string,
    itemId: string,
  ) {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: {
        itemId,
        po: { vendorId, tenantId, status: PurchaseOrderStatus.RECEIVED },
      },
      include: { po: { select: { createdAt: true } } },
      orderBy: { po: { createdAt: 'asc' } },
    });

    return items.map((i) => ({
      date: i.po.createdAt,
      price: i.unitPrice,
    }));
  }

  // ── Auto-Procurement Engine (called by scheduler) ────────────────────────────

  async runLowStockScan(): Promise<{ created: number; skipped: number }> {
    this.logger.log('Running low-stock procurement scan...');

    // Get all tenants that are active
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let created = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      const { c, s } = await this.scanTenantLowStock(tenant.id);
      created += c;
      skipped += s;
    }

    this.logger.log(`Scan complete. Created: ${created}, Skipped: ${skipped}`);
    return { created, skipped };
  }

  private async scanTenantLowStock(
    tenantId: string,
  ): Promise<{ c: number; s: number }> {
    // Get all items with their total stock
    const items = await this.prisma.storeItem.findMany({
      where: { tenantId },
      include: { stock: true },
    });

    let created = 0;
    let skipped = 0;

    for (const item of items) {
      const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);

      // Only trigger if below reorderPoint (not just minStockLevel)
      if (totalStock >= item.reorderPoint || item.reorderPoint <= 0) {
        continue;
      }

      // Skip if there's already a PENDING PR for this item
      const existingPr = await this.prisma.purchaseRequest.findFirst({
        where: {
          tenantId,
          itemId: item.id,
          status: PurchaseRequestStatus.PENDING,
        },
      });
      if (existingPr) {
        skipped++;
        continue;
      }

      // Calculate suggested quantity
      // If maxStockLevel is set, order up to max; otherwise target reorderPoint * 2
      const targetLevel =
        item.maxStockLevel > 0 ? item.maxStockLevel : item.reorderPoint * 2;
      const suggestedQty = Math.max(
        targetLevel - totalStock,
        item.reorderPoint,
      );
      const unitPrice = item.lastUnitPrice ?? item.unitCost;

      await this.prisma.purchaseRequest.create({
        data: {
          tenantId,
          generatedBy: 'AUTO',
          itemId: item.id,
          vendorId: item.preferredVendorId,
          currentStock: totalStock,
          reorderPoint: item.reorderPoint,
          suggestedQty,
          lastUnitPrice: unitPrice,
          estimatedTotal: suggestedQty * unitPrice,
          notes: `Auto-generated: stock (${totalStock} ${item.unit}) fell below reorder point (${item.reorderPoint} ${item.unit})`,
        },
      });

      created++;
      this.logger.log(
        `Created PR for item "${item.name}" (tenant ${tenantId}): stock=${totalStock}, reorder=${item.reorderPoint}, suggest=${suggestedQty}`,
      );
    }

    // Notify Gold Admins if new PRs were created
    if (created > 0) {
      await this.notifyGoldAdmins(tenantId, created);
    }

    return { c: created, s: skipped };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async getTotalStock(
    tenantId: string,
    itemId: string,
  ): Promise<number> {
    const stock = await this.prisma.storeStock.findMany({
      where: { tenantId, itemId },
    });
    return stock.reduce((sum, s) => sum + s.quantity, 0);
  }

  private async generatePoNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { tenantId },
    });
    const seq = String(count + 1).padStart(5, '0');
    return `PO-${year}-${seq}`;
  }

  private async notifyGoldAdmins(tenantId: string, count: number) {
    // Find Gold Admin users for this tenant
    const admins = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { name: 'gold_admin' },
      },
      select: { id: true },
    });

    for (const admin of admins) {
      try {
        await this.notificationService.createNotification({
          tenantId,
          userId: admin.id,
          title: 'Low Stock Alert — Action Required',
          message: `${count} new purchase request${count > 1 ? 's' : ''} generated automatically. Review and approve in the Procurement module.`,
        });
      } catch (err) {
        this.logger.warn(`Could not notify admin ${admin.id}:`, err);
      }
    }
  }

  private buildVendorPOEmail(
    po: {
      poNumber: string;
      totalAmount: number;
      expectedDelivery?: Date | null;
      notes?: string | null;
      items: Array<{
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        item: { name: string; sku: string; unit: string };
      }>;
    },
    vendor: { name: string; contactPerson?: string | null },
  ): string {
    const rows = po.items
      .map(
        (li) =>
          `<tr>
            <td style="padding:8px;border:1px solid #ddd;">${li.item.name}</td>
            <td style="padding:8px;border:1px solid #ddd;">${li.item.sku}</td>
            <td style="padding:8px;border:1px solid #ddd;">${li.quantity} ${li.item.unit}</td>
            <td style="padding:8px;border:1px solid #ddd;">KES ${li.unitPrice.toFixed(2)}</td>
            <td style="padding:8px;border:1px solid #ddd;">KES ${li.totalPrice.toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    const delivery = po.expectedDelivery
      ? new Date(po.expectedDelivery).toLocaleDateString('en-KE')
      : 'To be confirmed';

    return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:auto;">
  <div style="background:#1a1a2e;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Purchase Order — ${po.poNumber}</h1>
    <p style="color:#aaa;margin:4px 0 0;">Flori-Core Farm Management System</p>
  </div>
  <div style="padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
    <p>Dear ${vendor.contactPerson ?? vendor.name},</p>
    <p>Please find below our purchase order <strong>${po.poNumber}</strong>.
    Kindly acknowledge receipt and confirm your delivery timeline.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">SKU</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Unit Price</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Order Total</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;">KES ${po.totalAmount.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <p><strong>Expected Delivery:</strong> ${delivery}</p>
    ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#999;">
      This purchase order was issued by Flori Farm via the Flori-Core Enterprise OS.
      Please reply to this email to acknowledge or raise any queries.
    </p>
  </div>
</body>
</html>`;
  }
}
