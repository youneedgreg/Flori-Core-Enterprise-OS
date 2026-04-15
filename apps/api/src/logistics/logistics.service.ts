/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StorageService } from '../packing/storage.service';
import { FinancialsService } from '../financials/financials.service';

@Injectable()
export class LogisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly storage: StorageService,
    private readonly financials: FinancialsService,
  ) {}

  async findAll(tenantId: string) {
    return await this.prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: { name: true, country: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(
    tenantId: string,
    data: {
      type: 'STANDING_ORDER' | 'SPOT_ORDER' | 'EXPORT_CONTRACT';
      customerId: string;
      items: any;
      totalAmount: number;
      currency?: string;
      shipmentDate?: string;
    },
  ) {
    // Check if customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });
    if (!customer) throw new BadRequestException('Invalid customer reference');

    // ATP Check for Finished Goods (Packed Boxes)
    const atp = await this.inventoryService.getFinishedGoodsATP(tenantId);
    const itemArray = Array.isArray(data.items) ? data.items : [data.items];

    for (const item of itemArray) {
      if (
        item.varietyId &&
        item.grade &&
        item.bunchSize &&
        item.bunchesPerBox
      ) {
        const matchingATP = atp.find(
          (a) =>
            a.varietyId === item.varietyId &&
            a.grade === item.grade &&
            a.bunchSize === item.bunchSize &&
            a.bunchesPerBox === item.bunchesPerBox,
        );

        if (!matchingATP || matchingATP.atp < item.quantity) {
          throw new BadRequestException(
            `Insufficient ATP for ${matchingATP?.varietyName || 'selected variety'}. Available: ${matchingATP?.atp || 0}, Requested: ${item.quantity}`,
          );
        }
      }
    }

    return await this.prisma.order.create({
      data: {
        ...data,
        tenantId,
        status: 'DRAFT',
        shipmentDate: data.shipmentDate ? new Date(data.shipmentDate) : null,
      },
    });
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status:
      | 'DRAFT'
      | 'CONFIRMED'
      | 'IN_PICKING'
      | 'DISPATCHED'
      | 'DELIVERED'
      | 'INVOICED',
  ) {
    const order = await this.findOne(tenantId, id);
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    // Stock Automation: Reduce inventory when marked as DELIVERED
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      const items = (order.items as any) || [];
      const productItems = Array.isArray(items) ? items : [items];

      for (const item of productItems) {
        if (item.sku && item.quantity) {
          const product = await this.prisma.product.findFirst({
            where: { sku: item.sku, tenantId },
          });
          if (product) {
            await this.prisma.product.update({
              where: { id: product.id },
              data: { stock: { decrement: Number(item.quantity) } },
            });
          }
        }
      }
    }

    return updatedOrder;
  }

  // Customer sub-management
  async findAllCustomers(tenantId: string) {
    return await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCustomer(
    tenantId: string,
    data: { name: string; email?: string; country?: string; address?: string },
  ) {
    return await this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  // ── Fleet & Vehicles ────────────────────────────────────────────────────────

  async getVehicles(tenantId: string) {
    return await (this.prisma as any).vehicle.findMany({
      where: { tenantId },
    });
  }

  async createVehicle(tenantId: string, data: any) {
    return await (this.prisma as any).vehicle.create({
      data: { ...data, tenantId },
    });
  }

  // ── Routes & Stops ──────────────────────────────────────────────────────────

  async getRoutes(tenantId: string, driverId?: string) {
    const where: any = { tenantId };
    if (driverId) where.driverId = driverId;

    return await (this.prisma as any).deliveryRoute.findMany({
      where,
      include: {
        driver: { select: { email: true } },
        vehicle: true,
        deliveryStops: {
          include: {
            order: {
              include: { customer: true },
            },
          },
          orderBy: { sequenceIndex: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createRoute(
    tenantId: string,
    driverId: string,
    vehicleId: string,
    date: string,
    stopOrderIds: string[],
  ) {
    // 1. Create Route
    const route = await (this.prisma as any).deliveryRoute.create({
      data: {
        tenantId,
        driverId,
        vehicleId,
        date: new Date(date),
        status: 'PENDING',
        deliveryStops: {
          create: stopOrderIds.map((orderId, i) => ({
            tenantId,
            orderId,
            sequenceIndex: i,
            status: 'PENDING',
          })),
        },
      },
      include: { deliveryStops: true },
    });

    // 2. Set all associated orders to IN_TRANSIT / DISPATCHED
    for (const orderId of stopOrderIds) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'DISPATCHED' },
      });
    }

    return route;
  }

  // ── Route Detail & Status ────────────────────────────────────────────────────

  async getRouteById(tenantId: string, id: string) {
    const route = await (this.prisma as any).deliveryRoute.findFirst({
      where: { id, tenantId },
      include: {
        driver: { select: { id: true, email: true, firstName: true, lastName: true } },
        vehicle: true,
        deliveryStops: {
          include: {
            order: { include: { customer: { select: { name: true, address: true, phone: true } } } },
          },
          orderBy: { sequenceIndex: 'asc' },
        },
      },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async updateRouteStatus(tenantId: string, id: string, status: string) {
    const route = await (this.prisma as any).deliveryRoute.findFirst({
      where: { id, tenantId },
    });
    if (!route) throw new NotFoundException('Route not found');
    return (this.prisma as any).deliveryRoute.update({
      where: { id },
      data: { status },
    });
  }

  async updateStopStatus(tenantId: string, stopId: string, status: string) {
    const stop = await (this.prisma as any).deliveryStop.findFirst({
      where: { id: stopId, tenantId },
      include: { order: true },
    });
    if (!stop) throw new NotFoundException('Stop not found');

    const updatedStop = await (this.prisma as any).deliveryStop.update({
      where: { id: stopId },
      data: {
        status,
        ...(status === 'DELIVERED' && { actualArrival: new Date() }),
      },
    });

    if (status === 'DELIVERED') {
      await this.updateStatus(tenantId, stop.orderId, 'DELIVERED');
    }

    return updatedStop;
  }

  async getDrivers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async updateVehicle(tenantId: string, id: string, data: any) {
    const vehicle = await (this.prisma as any).vehicle.findFirst({ where: { id, tenantId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return (this.prisma as any).vehicle.update({ where: { id }, data });
  }

  // ── Proof of Delivery (PoD) ──────────────────────────────────────────────────

  async submitPoD(
    tenantId: string,
    stopId: string,
    signatureBuffer: Buffer,
    photoBuffer: Buffer | undefined,
    tempAtDelivery?: string,
  ) {
    const stop = await (this.prisma as any).deliveryStop.findUnique({
      where: { id: stopId },
      include: { order: true },
    });

    if (!stop || stop.tenantId !== tenantId) {
      throw new NotFoundException('Delivery stop not found');
    }

    // Upload files to S3 via StorageService
    const sigFilename = `pod/${tenantId}/${stopId}_sig_${Date.now()}.png`;
    const sigUrl = await this.storage.uploadFile(
      sigFilename,
      signatureBuffer,
      'image/png',
    );

    let photoUrl = null;
    if (photoBuffer) {
      const photoFilename = `pod/${tenantId}/${stopId}_pic_${Date.now()}.jpg`;
      photoUrl = await this.storage.uploadFile(
        photoFilename,
        photoBuffer,
        'image/jpeg',
      );
    }

    // Mark Stop as Delivered
    const updatedStop = await (this.prisma as any).deliveryStop.update({
      where: { id: stopId },
      data: {
        status: 'DELIVERED',
        actualArrival: new Date(),
        podSignatureUrl: sigUrl,
        podPhotoUrl: photoUrl,
        vehicleTempAtDelivery: tempAtDelivery
          ? parseFloat(tempAtDelivery)
          : null,
      },
    });

    // Mark Order as Delivered
    await this.updateStatus(tenantId, stop.orderId, 'DELIVERED');

    // Auto-Generate Invoice
    try {
      await this.financials.generateInvoice(
        tenantId,
        stop.orderId,
        stop.order.totalAmount,
        stop.order.currency,
      );
    } catch (e) {
      console.error(
        `Failed to auto-generate invoice for order ${stop.orderId}`,
        e,
      );
    }

    return updatedStop;
  }
}
